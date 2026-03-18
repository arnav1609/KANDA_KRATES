import fs from 'fs';

const file = 'c:/Users/Arnav Bhandari/kandakratesv2/kandakratesapp/kanda-krates-app/utils/translations.json';
const dict = JSON.parse(fs.readFileSync(file, 'utf-8'));

for (const lang of Object.keys(dict)) {
  dict[lang]["AI Sell Advisory"] = lang === 'mr' ? 'AI विक्री सल्ला' : 'एआई बिक्री सलाह';
  dict[lang]["days left"] = lang === 'mr' ? 'दिवस बाकी' : 'दिन शेष';
}

fs.writeFileSync(file, JSON.stringify(dict, null, 2));
console.log("Dashboard fragments injected successfully!");
