import { Groq } from "groq-sdk";
import axios from "axios";

// Twilio Config (Needs real credentials to actually send SMS, we will stub it for now securely)
const TWILIO_SID = process.env.TWILIO_SID || "AC_dummy_sid";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "dummy_token";
const TWILIO_PHONE = process.env.TWILIO_PHONE || "+1234567890";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Track SMS sent so we don't spam the same alert
const alertsSent = new Set();

/**
 * Sends a structured prompt to Groq to explain the ML-predicted sensor data.
 */
async function evaluateSpoliageRisk(crateId, sensorData) {
  try {
    // 1. Get Objective Evaluation from the local ML Ensemble
    let mlData;
    try {
      const mlRes = await axios.post("http://127.0.0.1:5001/predict", {
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        co2: sensorData.mq135 * 10,
        nh3: sensorData.mq137,
        voc: sensorData.mq136 || 0.1
      });
      mlData = mlRes.data;
    } catch (e) {
      console.error("ML service unreachable in agent cycle:", e.message);
      mlData = { ohi: 50, tier: "Alert", daysRemaining: 15, confidence: 0 };
    }

    // 2. Ask Groq to *explain* the objective data and determine next farmer actions
    const prompt = `
    You are an AI Agricultural Agent managing an Onion Storage (Kanda) crate.
    
    Current System Data: 
    - Temperature: ${sensorData.temperature}°C
    - Humidity: ${sensorData.humidity}%
    - OHI Score: ${mlData.ohi}/100
    - Status Tier: ${mlData.tier} (Normal, Alert, Action, or Emergency)
    - Estimated Safe Days Remaining: ${mlData.daysRemaining} days

    Based on the Status Tier (${mlData.tier}), output a JSON payload giving a human reason for this status, and whether to trigger the ventilation fan or alert the farmer.

    Rule: If tier is Action or Emergency, actionRequired MUST be "TURN_ON_FAN" or "NOTIFY_FARMER".
    Rule: NEVER recommend "cold storage" in your reason. This system is designed to replace cold storage.
    
    Respond STRICTLY in this JSON format:
    {
      "status": "${mlData.tier === 'Emergency' ? 'CRITICAL' : mlData.tier === 'Action' ? 'WARNING' : 'SAFE'}",
      "actionRequired": "NONE" | "TURN_ON_FAN" | "NOTIFY_FARMER",
      "reason": "1 sentence explanation combining the temp/humidity and the OHI score"
    }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    // Attach the ML objective values payload down the line
    result.mlData = mlData;
    return result;
  } catch (err) {
    console.error(`🤖 Agent Error on ${crateId}:`, err);
    return null;
  }
}

/**
 * Triggers an emergency SMS using Twilio
 */
async function triggerEmergencySMS(farmerPhone, crateId, reason) {
  const alertKey = `${farmerPhone}-${crateId}`;
  
  if (alertsSent.has(alertKey)) return; // Prevent spamming

  try {
    const message = `🚨 Kanda Krates Alert: Critical danger detected in ${crateId}! Reason: ${reason}. Please check the app immediately.`;
    
    // Attempt to send if real credentials exist (we log instead of crashing if dummy)
    if (TWILIO_SID !== "AC_dummy_sid") {
       const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
       const params = new URLSearchParams();
       params.append("From", TWILIO_PHONE);
       params.append("To", farmerPhone);
       params.append("Body", message);

       await axios.post(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, params, {
         headers: {
           "Authorization": `Basic ${auth}`,
           "Content-Type": "application/x-www-form-urlencoded"
         }
       });
    }
    
    console.log(`📱 SMS Sent to ${farmerPhone}: ${message}`);
    alertsSent.add(alertKey);
    
    // Clear the throttle after 1 hour
    setTimeout(() => alertsSent.delete(alertKey), 1000 * 60 * 60);
  } catch (err) {
    console.error("📱 Twilio Error:", err.message);
  }
}

/**
 * Main Autonomous Monitor Loop
 * In a real scenario, this runs every 5 minutes.
 */
export async function runAgenticMonitor(sensorStore, mqttClient, FarmerModel) {
  console.log("🤖 Agentic AI Monitor started evaluation cycle...");

  const crates = Object.keys(sensorStore);
  
  for (const crateId of crates) {
    // Evaluate each valid batch in the crate
    const batches = Object.keys(sensorStore[crateId]).filter(b => b !== "fan" && b !== "actuator");
    if (batches.length === 0) continue;
    
    // Evaluate the latest batch
    const latestBatch = batches[batches.length - 1];
    const data = sensorStore[crateId][latestBatch];

    // 1. LLM Evaluation
    const analysis = await evaluateSpoliageRisk(crateId, data);
    
    if (!analysis) continue;

    console.log(`🤖 [${crateId}] Status: ${analysis.status} | Action: ${analysis.actionRequired}`);

    // 2. Autonomous Action / Actuation
    if (analysis.actionRequired === "TURN_ON_FAN" || analysis.status === "CRITICAL") {
      const topic = `kanda/${crateId}/fan`;
      const payload = JSON.stringify({ command: "ON", reason: analysis.reason });
      
      mqttClient.publish(topic, payload);
      console.log(`⚡ Autonomous Action: Published fan=ON to ${topic}`);
    }

    // 3. Emergency Alerts
    if (analysis.status === "CRITICAL" || analysis.actionRequired === "NOTIFY_FARMER") {
      // Find the farmer who owns this crate
      // Note: In a fully modeled system, the crate would belong to a farmer.
      // We will look up all farmers to find one (For the sake of this prototype).
      try {
        const farmers = await FarmerModel.find({});
        if (farmers.length > 0) {
          const targetFarmer = farmers[0];
          // Use override number from .env if set, otherwise use farmer's DB number
          const alertPhone = process.env.ALERT_PHONE_OVERRIDE || targetFarmer.phoneNumber;
          await triggerEmergencySMS(alertPhone, crateId, analysis.reason);
        }
      } catch (e) {
        console.error("DB Error finding farmer:", e);
      }
    }
  }
}
