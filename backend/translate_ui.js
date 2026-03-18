import fs from "fs";
import path from "path";
import "dotenv/config";
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const STRINGS = [
  "Good morning", "Good afternoon", "Good evening", 
  "Here's your farm overview for today",
  "Total Batches", "Avg. OHI", "Need Action",
  "⚠️ Needs Attention Most", "days of safe storage remaining",
  "📦 All Batches", "OHI", "days",
  "💹 Onion Market Price", "Range",
  "ℹ️ OHI Health Tiers",
  "Emergency", "Action", "Alert", "Normal",
  "🤝 Sell Recommendation", "SELL NOW", "SELL SOON", "CONSIDER SELLING", "HOLD",
  "⚡ Quick Actions",
  "Sensor Data", "My Batches", "AI Advisor", "My Profile",
  "No batches found", "Ask your admin to assign a crate to your account.",
  "Harvested", "Mark as Harvested", "Close",
  "Profile Settings", "Contact Phone", "System Language", "Logout"
];

const TARGET_LANGS = [
  { code: "hi", name: "Hindi" },
  { code: "mr", name: "Marathi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "gu", name: "Gujarati" },
  { code: "pa", name: "Punjabi" },
  { code: "bn", name: "Bengali" },
  { code: "or", name: "Odia" }
];

async function translateArray() {
  console.log("Starting translation generation...");
  const dict = {};

  for (const lang of TARGET_LANGS) {
    console.log(`Translating to ${lang.name}...`);
    try {
      const prompt = `Translate the following English strings into natural, conversational ${lang.name} suitable for a simple agricultural app for onion farmers.
Provide the output STRICTLY as a valid JSON object mapping the English string exactly to the translated string. Do not include any markdown or extra text.

Strings to translate:
${JSON.stringify(STRINGS, null, 2)}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
      });

      const translated = JSON.parse(completion.choices[0].message.content);
      dict[lang.code] = translated;
      console.log(`✅ ${lang.name} done.`);
    } catch (e) {
      console.error(`❌ Error on ${lang.name}:`, e.message);
      dict[lang.code] = {};
    }
  }

  const outputPath = path.resolve(__dirname, "../kanda-krates-app/utils/translations.json");
  
  // ensure directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(dict, null, 2));

  console.log("Translation dictionary saved to", outputPath);
}

// polyfill __dirname
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

translateArray();
