import fs from "fs";
import path from "path";
import "dotenv/config";
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const NEW_STRINGS = [
  "Home", "Sensors", "AI Chat", "Security", "Batches", "Profile",
  "OHI is", "— only", "At current market:", "— sell now to lock in this price.",
  "All batches healthy", "Your onions are safely stored. Monitor OHI daily.",
  "Crate", "Batch", "crates", "batches"
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

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function translateMissing() {
  const outputPath = path.resolve(__dirname, "../kanda-krates-app/utils/translations.json");
  let dict = {};
  if (fs.existsSync(outputPath)) {
    dict = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  }

  console.log("Starting missing translations...");

  for (const lang of TARGET_LANGS) {
    // Only attempt if language object doesn't exist or is empty (wait, we want to augment existing ones too)
    if (!dict[lang.code]) dict[lang.code] = {};
    
    // Find which strings are missing
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
      // Merge
      dict[lang.code] = { ...dict[lang.code], ...translated };
      console.log(`✅ ${lang.name} done.`);
    } catch (e) {
      console.error(`❌ Error on ${lang.name}:`, e.message);
      // We don't fail, we just leave it English later.
    }
  }

  // Save back
  fs.writeFileSync(outputPath, JSON.stringify(dict, null, 2));
  console.log("Translation dictionary updated at", outputPath);
}

translateMissing();
