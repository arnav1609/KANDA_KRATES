import fs from "fs";
import path from "path";
import "dotenv/config";
import { Groq } from "groq-sdk";
import { fileURLToPath } from 'url';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const NEW_STRINGS = [
  "batches need immediate attention!", "Normal", "Alert", "Action", "Emergency",
  "Avg Model", "Min:", "Max:", "Per", "Not enough historical data collected yet.",
  "AI Analysis temporarily unavailable.", "Acknowledge", "Check ventilation and inspect onions.",
  "⚠️ Data integrity issue detected!", "Sensor data may have been tampered with. Please verify physically.",
  "Logout", "🔒 Secure Data Feed", "24-Hour Environment Trends", "AI Health Analysis",
  "Temperature", "Humidity", "CO₂", "NH₃", "VOC", "Stock",
  "Stable", "Optimal", "Safe range", "Take corrective action", "Immediate action required", "Inventory",
  "Live APMC Rate", "Monitor closely", "Avg. OHI", "Total Batches", "Need Action"
];

const TARGET_LANGS = [
  { code: "hi", name: "Hindi" }, { code: "mr", name: "Marathi" },
  { code: "ta", name: "Tamil" }, { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" }, { code: "ml", name: "Malayalam" },
  { code: "gu", name: "Gujarati" }, { code: "pa", name: "Punjabi" },
  { code: "bn", name: "Bengali" }, { code: "or", name: "Odia" }
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function translateMissing() {
  const outputPath = path.resolve(__dirname, "../kanda-krates-app/utils/translations.json");
  let dict = {};
  if (fs.existsSync(outputPath)) dict = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

  for (const lang of TARGET_LANGS) {
    if (!dict[lang.code]) dict[lang.code] = {};
    const missing = NEW_STRINGS.filter(s => !dict[lang.code][s]);
    if (missing.length === 0) continue;

    console.log(`Translating ${missing.length} missing strings to ${lang.name}...`);
    try {
      const prompt = `Translate the following English strings into natural, conversational ${lang.name} suitable for a simple agricultural app for onion farmers.
Provide the output STRICTLY as a valid JSON object mapping the English string exactly to the translated string. Do not include any markdown or extra text.

Strings to translate:
${JSON.stringify(missing, null, 2)}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
      });

      const translated = JSON.parse(completion.choices[0].message.content);
      dict[lang.code] = { ...dict[lang.code], ...translated };
      console.log(`✅ ${lang.name} done.`);
    } catch (e) { console.error(`❌ Error on ${lang.name}:`, e.message); }
  }
  fs.writeFileSync(outputPath, JSON.stringify(dict, null, 2));
  console.log("Translation dictionary completely updated.");
}

translateMissing();
