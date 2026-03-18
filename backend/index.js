import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import mqtt from "mqtt";
import chatRoute from "./routes/chat.js";
import Farmer from "./models/Farmer.js";
import Admin from "./models/Admin.js";
import Crate from "./models/Crate.js";
import { updateSensorState } from "./data/systemState.js";
import { runAgenticMonitor } from "./agent.js";
import SensorHistory from "./models/SensorHistory.js";
import { Groq } from "groq-sdk";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

/* ---------------- MONGODB SETUP ---------------- */

mongoose.connect("mongodb://127.0.0.1:27017/kandakrates");

mongoose.connection.on("connected", () => {
  console.log("🗄️  MongoDB Connected to kandakrates");
});

mongoose.connection.on("error", (err) => {
  console.log("❌ MongoDB error:", err);
});

/* ---------------- CHAT ROUTE ---------------- */

app.use("/api/chat", chatRoute);

/* ---------------- MQTT SETUP ---------------- */

const MQTT_BROKER = "mqtt://broker.hivemq.com";
const client = mqtt.connect(MQTT_BROKER);

/* Store sensor data per batch — pre-seeded with demo data for presentations */

let sensorStore = {
  "crate1": { // 🟢 Normal: OHI 90+, Tier: Normal
    "batch1": { temperature: 22.4, humidity: 62.1, mq135: 105, mq137: 0.1, mq136: 0.2, timestamp: Date.now() },
    "batch2": { temperature: 23.8, humidity: 64.5, mq135: 140, mq137: 0.2, mq136: 0.3, timestamp: Date.now() }
  },
  "crate2": { // 🟠 Action: OHI 45, Tier: Action
    "batch1": { temperature: 34.2, humidity: 82.5, mq135: 580, mq137: 3.2, mq136: 2.8, timestamp: Date.now() }
  },
  "crate3": { // 🔴 Emergency: OHI 25, Tier: Emergency
    "batch1": { temperature: 41.5, humidity: 92.8, mq135: 1100, mq137: 12.5, mq136: 8.5, timestamp: Date.now() }
  },
  "crate4": { // 🟡 Alert: OHI 65, Tier: Alert
    "batch1": { temperature: 29.3, humidity: 74.5, mq135: 380, mq137: 1.5, mq136: 1.2, timestamp: Date.now() }
  }
};

client.on("connect", () => {
  console.log("📡 Connected to MQTT broker");
  /* Subscribe to all crate topics */
  client.subscribe("kanda/#");
});

client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    /* topic example:
       kanda/crate1/B1
    */
    const parts = topic.split("/");
    const crate = parts[1];
    const batch = (parts[2] || "").trim().toLowerCase();

    // Skip actuator feedback topics (e.g. kanda/crate1/fan) — not sensor data
    const isActuator = batch.toLowerCase().includes("fan") || batch.toLowerCase().includes("actuator");
    if (isActuator || !data.temperature || !data.humidity) {
      return;
    }

    if (!sensorStore[crate]) sensorStore[crate] = {};

    sensorStore[crate][batch] = {
      temperature: data.temperature,
      humidity: data.humidity,
      mq135: data.mq135,
      mq137: data.mq137,
      mq136: data.mq136,
      timestamp: Date.now()
    };

    console.log("📊 Sensor update:", crate, batch);

  } catch (err) {
    console.log("MQTT parse error:", err);
  }
});

/* -------- API FOR APP -------- */

/* MongoDB Registration / Auth Logic ported from server.js */

// POST endpoint to register or update a farmer entry
app.post("/api/farmer", async (req, res) => {
  const { username, phoneNumber, sensorData } = req.body;

  if (!username || !phoneNumber || !sensorData) {
    return res.status(400).json({ error: "Username, phone number, and sensor data are required." });
  }

  try {
    // Check if the farmer already exists
    let farmer = await Farmer.findOne({ username });

    if (farmer) {
      // Update existing farmer's phone number and sensor data
      farmer.phoneNumber = phoneNumber;
      farmer.sensorData = sensorData;
      await farmer.save();
      return res.status(200).json({ message: "Farmer data updated successfully." });
    }

    // Create a new farmer entry
    farmer = new Farmer({ username, phoneNumber, sensorData });
    await farmer.save();
    res.status(201).json({ message: "Farmer data saved successfully." });
  } catch (error) {
    console.error("Error saving farmer data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// GET endpoint to retrieve all farmers
app.get("/api/farmers", async (req, res) => {
  try {
    const farmers = await Farmer.find();
    res.status(200).json(farmers);
  } catch (error) {
    console.error("Error retrieving farmers data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/* -------------------------------------------------------------------------- */
/*                        MARKET DATA API                                     */
/* -------------------------------------------------------------------------- */

// Global cache to avoid spamming external sites
let cachedMarketData = null;
let lastMarketFetch = 0;

app.get("/api/market/price/onion", async (req, res) => {
  const now = Date.now();
  // Cache for 1 hour (3600000 ms)
  if (cachedMarketData && now - lastMarketFetch < 3600000) {
    return res.json(cachedMarketData);
  }

  try {
    // Attempt to scrape a public Mandy Price website for Lasalgaon Onion prices
    // In production, you would hit an official API (e.g. e-NAM, Agmarknet JSON)
    // For this demo, we provide a robust mock that fluctuates slightly to simulate live active markets.
    
    // Simulate current market ranges for Red Onion at Lasalgaon APMC
    // Base model: ~2500 per quintal -> ~25 per kg
    const baseModal = (2400 + Math.floor(Math.random() * 200 - 100)) / 100; 
    
    cachedMarketData = {
      commodity: "Onion",
      variety: "Red",
      market: "Lasalgaon APMC, Maharashtra",
      priceMin: baseModal - 4,
      priceMax: baseModal + 6,
      priceModal: baseModal,
      unit: "kg",
      lastUpdated: new Date().toISOString()
    };
    
    lastMarketFetch = now;
    return res.json(cachedMarketData);

  } catch (error) {
    console.error("Market Data Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

/* -------------------------------------------------------------------------- */
/*                        SELL / HOLD ADVISORY ENGINE                         */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/advisory/:crateId
 * Cross-references the ML model's shelf life prediction with today's APMC market
 * price to tell the farmer which batch(es) to sell now vs. hold.
 *
 * Decision Rules:
 *  SELL_URGENT  → daysRemaining <= 5  (spoilage imminent — sell regardless of price)
 *  SELL_NOW     → daysRemaining <= 10 AND priceModal >= 2000  (sweet spot)
 *  MONITOR      → daysRemaining <= 14 AND priceModal < 2000   (wait for better price)
 *  HOLD         → daysRemaining > 14  (plenty of time — wait for market to improve)
 */
app.get("/api/advisory/:crateId/:lang", async (req, res) => {
  const { crateId, lang } = req.params;

  try {
    // Step 1: Get all batches for this crate from the in-memory sensor store
    const crateBatches = sensorStore[crateId];
    if (!crateBatches || Object.keys(crateBatches).length === 0) {
      return res.status(404).json({ error: "Crate not found or has no batch data yet." });
    }

    // Step 2: Get current market price (use cache if warm)
    const now = Date.now();
    if (!cachedMarketData || now - lastMarketFetch >= 3600000) {
      // Base model: ~2500 per quintal -> ~25 per kg
      const baseModal = (2400 + Math.floor(Math.random() * 200 - 100)) / 100;
      cachedMarketData = {
        priceMin: baseModal - 4,
        priceMax: baseModal + 6,
        priceModal: baseModal,
        unit: "kg",
        market: "Lasalgaon APMC, Maharashtra",
        lastUpdated: new Date().toISOString()
      };
      lastMarketFetch = now;
    }
    const currentPrice = cachedMarketData.priceModal;

    // Step 3: Get ML predictions for each batch
    const batchRecommendations = [];

    for (const [rawBatchId, batchData] of Object.entries(crateBatches)) {
      const batchId = rawBatchId.trim().toLowerCase();
      // Skip non-batch keys like 'fan' or 'actuator'
      if (batchId === "fan" || batchId === "actuator") continue;

      let mlResult = { ohi: 50, tier: "Alert", daysRemaining: 7, confidence: 0.5 };
      
      try {
        const mlResponse = await axios.post("http://127.0.0.1:5001/predict", {
          temperature: batchData.temperature,
          humidity: batchData.humidity,
          co2: batchData.mq135 * 10,
          nh3: batchData.mq137,
          voc: batchData.mq136 || 0.1
        });
        mlResult = mlResponse.data;
      } catch (mlErr) {
        console.warn(`ML service unavailable for ${crateId}/${batchId}. Using defaults.`);
      }

      const days = mlResult.daysRemaining ?? 7;
      const ohi  = mlResult.ohi ?? 50;
      const tier = mlResult.tier ?? "Alert";

      // Decision logic — OHI score takes priority as the ground truth health indicator
      let action, urgency, reason, color;

      if (tier === "Emergency" || days <= 3 || ohi < 40) {
        // Critical: batch is either at emergency tier, near expiry, or OHI dangerously low
        action  = "SELL_URGENT";
        urgency = "🚨 Sell Immediately";
        reason  = ohi < 40
          ? `OHI is critically low at ${ohi}/100. Batch health is deteriorating rapidly — sell at any available price now.`
          : `Only ${days} days of safe storage remain and tier is ${tier}. Sell immediately.`;
        color   = "#DC2626";

      } else if (days <= 7 || ohi < 60) {
        // Poor health: OHI below 60 signals significant quality decline
        action  = "SELL_NOW";
        urgency = "🔴 Sell Now";
        reason  = ohi < 60
          ? `OHI is ${ohi}/100 — batch quality is declining. Sell now at ₹${currentPrice}/kg before further losses.`
          : `Only ${days} days of storage left. Market is at ₹${currentPrice}/kg — sell before quality drops.`;
        color   = "#EA580C";

      } else if (ohi < 75) {
        // Moderate health: watch it closely, market conditions may tip the decision
        action  = "MONITOR";
        urgency = "⚠️ Monitor Closely";
        reason  = `OHI is ${ohi}/100 — health is moderate. Monitor daily. Sell if OHI drops below 60 or market exceeds ₹${(currentPrice + 2).toFixed(2)}/kg.`;
        color   = "#D97706";

      } else if (days <= 14 && currentPrice >= 22) {
        // Healthy batch + strong market = good time to sell
        action  = "SELL_NOW";
        urgency = "✅ Good Time To Sell";
        reason  = `OHI is ${ohi}/100 and market is strong at ₹${currentPrice}/kg with ${days} days left. Capitalise now.`;
        color   = "#16A34A";

      } else if (days <= 14 && currentPrice < 22) {
        // Healthy batch but weak market — wait a little
        action  = "MONITOR";
        urgency = "⚠️ Monitor — Hold Short Term";
        reason  = `Prices are low (₹${currentPrice}/kg) but OHI is good at ${ohi}/100 with ${days} days left. Wait 3–5 days for a better price.`;
        color   = "#D97706";

      } else {
        // Healthy + plenty of time + market not exceptional — hold
        action  = "HOLD";
        urgency = "🟢 Hold";
        reason  = `OHI is strong at ${ohi}/100 with ${days} days safe storage. Wait for market to exceed ₹25.00/kg for best returns.`;
        color   = "#2563EB";
      }

      batchRecommendations.push({
        batchId,
        crateId,
        ohi,
        tier,
        daysRemaining: days,
        confidence: mlResult.confidence ?? 0.5,
        marketPriceModal: currentPrice,
        action,
        urgency,
        reason,
        color
      });
    }

    // Sort by urgency: SELL_URGENT → SELL_NOW → MONITOR → HOLD
    const order = { SELL_URGENT: 0, SELL_NOW: 1, MONITOR: 2, HOLD: 3 };
    batchRecommendations.sort((a, b) => (order[a.action] ?? 99) - (order[b.action] ?? 99));

    let finalRecommendations = batchRecommendations;
    
    // Auto-translate using Groq if language is not English
    if (lang && lang !== "en") {
      const langMap = {
        hi: "Hindi", mr: "Marathi", ta: "Tamil", te: "Telugu", kn: "Kannada",
        ml: "Malayalam", gu: "Gujarati", pa: "Punjabi", bn: "Bengali", or: "Odia"
      };
      const targetLang = langMap[lang] || "Hindi";
      
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const prompt = `Translate only the 'urgency' and 'reason' fields of this JSON array into ${targetLang} for an agricultural app. DO NOT translate any other fields or keys. Return only the valid JSON array.\n${JSON.stringify(batchRecommendations)}`;
        
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.1-8b-instant",
          response_format: { type: "json_object" }
        });
        
        const translatedContent = completion.choices[0].message.content;
        // The model might wrap it in an object like {"recommendations": [...]}, so extract the array if needed
        const parsed = JSON.parse(translatedContent);
        if (Array.isArray(parsed)) finalRecommendations = parsed;
        else if (parsed.recommendations) finalRecommendations = parsed.recommendations;
        else if (Object.values(parsed)[0]) finalRecommendations = Object.values(parsed)[0];
        
        // Restore original non-text fields just in case LLM messed them up
        finalRecommendations = finalRecommendations.map((tr, i) => ({
          ...batchRecommendations[i],
          urgency: tr.urgency || batchRecommendations[i].urgency,
          reason: tr.reason || batchRecommendations[i].reason
        }));
      } catch (translateErr) {
        console.warn("Translation failed for advisory:", translateErr.message);
      }
    }

    return res.json({
      crateId,
      marketPrice: cachedMarketData,
      recommendations: finalRecommendations,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Advisory Engine Error:", error.message);
    res.status(500).json({ error: "Failed to generate advisory" });
  }
});

/* -------------------------------------------------------------------------- */
/*                        LIVE MQTT SENSOR DATA                               */
/* -------------------------------------------------------------------------- */

/* ML Microservice Helper */
async function attachMLPredictions(sensorData) {
  if (!sensorData || Object.keys(sensorData).length === 0) return sensorData;
  
  try {
    const mlResponse = await axios.post("http://127.0.0.1:5001/predict", {
      temperature: sensorData.temperature,
      humidity: sensorData.humidity,
      co2: sensorData.mq135 * 10, // Rough proxy for CO2 based on MQ135 baseline
      nh3: sensorData.mq137,
      voc: sensorData.mq136 || 0.1
    });

    const mlData = mlResponse.data;
    
    return {
      ...sensorData,
      ml_predictions: {
        ohi: mlData.ohi,
        tier: mlData.tier,
        daysRemaining: mlData.daysRemaining,
        confidence: mlData.confidence
      }
    };
  } catch (err) {
    console.error("ML Service Error:", err.message);
    // Fallback if ML service is down
    return {
      ...sensorData,
      ml_predictions: {
        ohi: 50,
        tier: "Action", // Updated from Alert to Action for OHI 50
        daysRemaining: 15,
        confidence: 0
      }
    };
  }
}

/* Live MQTT Sensor Read Endpoints */

/* All crates */
app.get("/api/sensors", async (req, res) => {
  const result = {};
  for (const crate of Object.keys(sensorStore)) {
    result[crate] = {};
    for (const batch of Object.keys(sensorStore[crate])) {
      if (batch === "fan" || batch === "actuator") continue;
      result[crate][batch] = await attachMLPredictions(sensorStore[crate][batch]);
    }
  }
  res.json(result);
});

/* Single crate */
app.get("/api/sensors/:crate", async (req, res) => {
  const crate = req.params.crate;
  const store = sensorStore[crate] || {};
  const result = {};
  
  for (const batch of Object.keys(store)) {
    if (batch === "fan" || batch === "actuator") continue;
    result[batch] = await attachMLPredictions(store[batch]);
  }
  
  res.json(result);
});

/* Single batch */
app.get("/api/sensors/:crate/:batch", async (req, res) => {
  const { crate, batch } = req.params;
  const data = sensorStore?.[crate]?.[batch] || {};
  
  const enhancedData = await attachMLPredictions(data);
  res.json(enhancedData);
});


/* ================= AUTH: FARMER ================= */

// Register a new Farmer
app.post("/api/farmer/register", async (req, res) => {
  try {
    const { username, phoneNumber, password } = req.body;
    if (!username || !phoneNumber || !password)
      return res.status(400).json({ error: "Username, phone, and password are required." });

    const existing = await Farmer.findOne({ username });
    if (existing) return res.status(409).json({ error: "Username already taken." });

    await Farmer.create({ username, phoneNumber, password });
    res.status(201).json({ message: "Farmer registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed." });
  }
});

// Login as Farmer
app.post("/api/farmer", async (req, res) => {
  try {
    const { username, phoneNumber, password, role } = req.body;

    if (role === "admin") {
      // Admin login path
      const admin = await Admin.findOne({ username, password });
      if (!admin) return res.status(401).json({ error: "Invalid admin credentials." });
      return res.json({ token: `admin_${admin._id}`, role: "admin", username: admin.username });
    }

    // Farmer login path
    const farmer = await Farmer.findOne({ username, password });
    if (!farmer) return res.status(401).json({ error: "Invalid credentials." });
    res.json({ token: `farmer_${farmer._id}`, role: "farmer", username: farmer.username });
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});

/* ================= AUTH: ADMIN ================= */

// Register a new Admin
app.post("/api/admin/register", async (req, res) => {
  try {
    const { username, phoneNumber, password } = req.body;
    if (!username || !phoneNumber || !password)
      return res.status(400).json({ error: "All fields are required." });

    const existing = await Admin.findOne({ username });
    if (existing) return res.status(409).json({ error: "Admin username already taken." });

    await Admin.create({ username, phoneNumber, password });
    res.status(201).json({ message: "Admin registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Admin registration failed." });
  }
});

/* -------- SERVER START & AGENTIC AI LOOP -------- */

const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Kanda Krates API running on http://127.0.0.1:${PORT}`);
  console.log("🤖 Groq key loaded:", !!process.env.GROQ_API_KEY);
  console.log(`🤖 Agentic Monitor running every 60 seconds...`);

  // 1. Start the background Agentic AI Monitor loop (runs every 1 minute)
  // We use a small timeout to allow the ML service (port 5001) to boot up first
  setTimeout(() => {
    setInterval(() => {
      runAgenticMonitor(sensorStore, client, Farmer)
        .catch(console.error);
    }, 60 * 1000);
  }, 10000);

  // 2. Start the Historical Snapshot loop (runs every hour to record data for charts)
  // For demo purposes, we will take a snapshot every 15 minutes instead
  setInterval(async () => {
    try {
      const crates = Object.keys(sensorStore);
      for (const crate of crates) {
        const batches = Object.keys(sensorStore[crate]).filter(b => b !== "fan" && b !== "actuator");
        if (batches.length > 0) {
          const latestBatch = batches[batches.length - 1];
          const data = sensorStore[crate][latestBatch];

          // Save snapshot to MongoDB
          await SensorHistory.create({
            crateId: crate,
            temperature: data.temperature,
            humidity: data.humidity,
            mq135: data.mq135,
            mq137: data.mq137
          });
          console.log(`📈 Saved historical snapshot for ${crate}`);
        }
      }
    } catch (e) {
      console.error("Error saving historical snapshot:", e);
    }
  }, 15 * 60 * 1000);
});

/* GET Historical Data for Charts (Last 24 Hours) */
app.get("/api/history/:crate", async (req, res) => {
  try {
    const { crate } = req.params;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Fetch last 24h of data sorted chronologically
    const history = await SensorHistory.find({ 
      crateId: crate,
      timestamp: { $gte: twentyFourHoursAgo }
    }).sort({ timestamp: 1 });

    res.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* GET AI Health Summary (Converts Chart Data into Simple Sentence) */
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const LANGUAGE_MAP = {
  en: "English", hi: "Hindi", mr: "Marathi", ta: "Tamil", te: "Telugu",
  kn: "Kannada", ml: "Malayalam", gu: "Gujarati", pa: "Punjabi", bn: "Bengali", or: "Odia"
};

app.get("/api/history/health/:crate/:lang", async (req, res) => {
  try {
    const { crate, lang } = req.params;
    const langName = LANGUAGE_MAP[lang] || "English";
    
    // 1. Fetch the last 24 hours of data to give the LLM context
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const history = await SensorHistory.find({ 
      crateId: crate,
      timestamp: { $gte: twentyFourHoursAgo }
    }).sort({ timestamp: 1 });

    if (history.length === 0) {
      return res.json({ summary: "Not enough historical data yet. Please wait a few hours." });
    }

    // Prepare a miniaturized version of the data for the prompt
    let startData = history[0];
    let endData = history[history.length - 1];

    const prompt = `
    You are an AI agricultural assistant.
    Look at the 24-hour sensor trends for this onion crate and provide a simple, 1-2 sentence explanation of the health.
    Do NOT mention Ammonia, Methane, or use complex numbers. Just explain the VIBE.
    
    Data 24 Hours Ago: Temp ${startData.temperature}°C, Humidity ${startData.humidity}%
    Current Data Now: Temp ${endData.temperature}°C, Humidity ${endData.humidity}%
    
    CRITICAL INSTRUCTIONS:
    1. Write your response strictly and exclusively in ${langName}.
    2. DO NOT include any markdown, bold text, or asterisks.
    3. DO NOT include the original English text if a translation is requested.
    4. ONLY output the final 1-2 sentences. Nothing else.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant"
    });

    res.json({ summary: completion.choices[0]?.message?.content || "AI Analysis Failed." });

  } catch (error) {
    console.error("Error generating AI Health Summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ================= CRATE MANAGEMENT ================= */
// Get all registered crates
app.get("/api/crates", async (req, res) => {
  try {
    const crates = await Crate.find({});
    res.json(crates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch crates" });
  }
});

// Register a new crate to a Farmer
app.post("/api/crates", async (req, res) => {
  try {
    const { crateId, assignedFarmerUsername, hardwareMacAddress } = req.body;

    // Check if farmer exists
    const farmer = await Farmer.findOne({ username: assignedFarmerUsername });
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });

    // Check if crate already exists
    const existingCrate = await Crate.findOne({ crateId });
    if (existingCrate) return res.status(400).json({ error: "Crate ID already exists" });

    const newCrate = await Crate.create({ crateId, assignedFarmerUsername, hardwareMacAddress });
    res.status(201).json(newCrate);
  } catch (error) {
    res.status(500).json({ error: "Failed to create crate" });
  }
});

// Delete a crate by crateId
app.delete("/api/crates/:crateId", async (req, res) => {
  try {
    const { crateId } = req.params;
    const deleted = await Crate.findOneAndDelete({ crateId });
    if (!deleted) return res.status(404).json({ error: "Crate not found" });
    res.json({ message: `Crate ${crateId} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete crate" });
  }
});

// Reassign a crate to a different farmer
app.put("/api/crates/:crateId/reassign", async (req, res) => {
  try {
    const { crateId } = req.params;
    const { assignedFarmerUsername } = req.body;

    const farmer = await Farmer.findOne({ username: assignedFarmerUsername });
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });

    const crate = await Crate.findOneAndUpdate(
      { crateId },
      { assignedFarmerUsername },
      { new: true }
    );
    if (!crate) return res.status(404).json({ error: "Crate not found" });
    res.json(crate);
  } catch (error) {
    res.status(500).json({ error: "Failed to reassign crate" });
  }
});

/* ================= FARMER MANAGEMENT (ADMIN) ================= */

// Update a farmer's phone number or password
app.put("/api/farmers/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { phoneNumber } = req.body;

    const farmer = await Farmer.findOneAndUpdate(
      { username },
      { phoneNumber },
      { new: true }
    );
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });
    res.json({ message: "Farmer updated", farmer });
  } catch (error) {
    res.status(500).json({ error: "Failed to update farmer" });
  }
});

// Delete a farmer account
app.delete("/api/farmers/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const deleted = await Farmer.findOneAndDelete({ username });
    if (!deleted) return res.status(404).json({ error: "Farmer not found" });
    // Optionally unassign their crates
    await Crate.updateMany({ assignedFarmerUsername: username }, { assignedFarmerUsername: "" });
    res.json({ message: `Farmer ${username} deleted. Crates unassigned.` });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete farmer" });
  }
});

/* ================= FLEET ANALYTICS ================= */

// Get aggregated fleet health snapshot (admin analytics)
app.get("/api/analytics/fleet", async (req, res) => {
  try {
    const crates = Object.keys(sensorStore);
    let fleetResults = [];

    for (const crateId of crates) {
      const batches = Object.keys(sensorStore[crateId]).filter(b => b !== "fan" && b !== "actuator");
      for (const batchId of batches) {
        const data = sensorStore[crateId][batchId];
        try {
          const mlRes = await axios.post("http://127.0.0.1:5001/predict", {
            temperature: data.temperature,
            humidity: data.humidity,
            co2: data.mq135 * 10,
            nh3: data.mq137,
            voc: data.mq136 || 0.1
          }, { timeout: 2000 }); // Fast timeout — fall through to heuristic if ML offline
          fleetResults.push({ crateId, batchId, ...mlRes.data, temperature: data.temperature, humidity: data.humidity });
        } catch {
          // ML service offline — compute heuristic OHI from raw sensor readings
          const tempScore  = Math.max(0, 100 - Math.max(0, data.temperature - 25) * 4);
          const humScore   = Math.max(0, 100 - Math.max(0, data.humidity - 65) * 3);
          const gasScore   = Math.max(0, 100 - (data.mq137 * 8) - (data.mq135 * 0.05));
          const ohi        = Math.round(Math.min(100, Math.max(0, (tempScore + humScore + gasScore) / 3)));
          
          // Updated boundaries: Normal (76+), Alert (56-75), Action (36-55), Emergency (<36)
          let tier = "Normal";
          if (ohi < 36) tier = "Emergency";
          else if (ohi < 56) tier = "Action";
          else if (ohi < 76) tier = "Alert";

          const daysRemaining = Math.round(ohi / 2.5);
          fleetResults.push({ crateId, batchId, ohi, tier, daysRemaining, confidence: 0.7, temperature: data.temperature, humidity: data.humidity });
        }
      }
    }

    // ── Demo data fallback (for presentations when no live hardware is connected) ──
    if (fleetResults.length === 0) {
      fleetResults = [
        { crateId: "crate1", batchId: "batch1", ohi: 88, tier: "Normal",    daysRemaining: 42, confidence: 0.96, temperature: 25.4, humidity: 63 },
        { crateId: "crate1", batchId: "batch2", ohi: 74, tier: "Alert",     daysRemaining: 18, confidence: 0.91, temperature: 28.1, humidity: 71 },
        { crateId: "crate2", batchId: "batch1", ohi: 52, tier: "Action",    daysRemaining: 7,  confidence: 0.88, temperature: 33.2, humidity: 79 },
        { crateId: "crate2", batchId: "batch2", ohi: 91, tier: "Normal",    daysRemaining: 55, confidence: 0.97, temperature: 24.8, humidity: 61 },
        { crateId: "crate3", batchId: "batch1", ohi: 29, tier: "Emergency", daysRemaining: 2,  confidence: 0.94, temperature: 39.5, humidity: 88 },
        { crateId: "crate3", batchId: "batch2", ohi: 67, tier: "Alert",     daysRemaining: 14, confidence: 0.89, temperature: 30.0, humidity: 74 },
        { crateId: "crate4", batchId: "batch1", ohi: 83, tier: "Normal",    daysRemaining: 37, confidence: 0.95, temperature: 26.3, humidity: 65 },
      ];
    }

    const avgOhi = Math.round(fleetResults.reduce((sum, r) => sum + r.ohi, 0) / fleetResults.length);
    const tierCounts = { Normal: 0, Alert: 0, Action: 0, Emergency: 0 };
    for (const r of fleetResults) tierCounts[r.tier] = (tierCounts[r.tier] || 0) + 1;

    res.json({
      totalCrates: Math.max(crates.length, [...new Set(fleetResults.map(r => r.crateId))].length),
      totalBatches: fleetResults.length,
      avgOhi,
      tierCounts,
      cratesSummary: fleetResults,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate fleet analytics" });
  }
});

// End of Express App