import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { Groq } from 'groq-sdk';
import { fileURLToPath } from 'url';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const NEW_STRINGS = [
  "OHI Score", "Days Left", "Confidence",
  "Conditions are optimal.",
  "Slight deterioration detected. Monitor closely over the next 24–48 hours.",
  "Significant spoilage risk. Consider selling within 24 hours.",
  "Critical — sell or discard immediately to prevent total loss."
];

const TARGET_LANGS = [
  { code: 'hi', name: 'Hindi' }, { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' }, { code: 'ml', name: 'Malayalam' },
  { code: 'gu', name: 'Gujarati' }, { code: 'pa', name: 'Punjabi' },
  { code: 'bn', name: 'Bengali' }, { code: 'or', name: 'Odia' }
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function translateModal() {
  const outputPath = path.resolve(__dirname, '../kanda-krates-app/utils/translations.json');
  let dict = {};
  if (fs.existsSync(outputPath)) dict = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

  for (const lang of TARGET_LANGS) {
    if (!dict[lang.code]) dict[lang.code] = {};
    const missing = NEW_STRINGS.filter(s => !dict[lang.code][s]);
    if (missing.length === 0) continue;

    console.log(`Translating modal strings to ${lang.name}...`);
    try {
      const prompt = `Translate these English strings into natural ${lang.name} for an onion farmer app.
Return STRICTLY a valid JSON object mapping English to translated strings. No markdown.
${JSON.stringify(missing)}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' }
      });

      const translated = JSON.parse(completion.choices[0].message.content);
      dict[lang.code] = { ...dict[lang.code], ...translated };
    } catch (e) {
      console.log('Error:', e.message);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(dict, null, 2));
  console.log('Modal translations added.');
}
translateModal();
