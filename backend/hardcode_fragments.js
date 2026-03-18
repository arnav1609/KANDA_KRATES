import fs from 'fs';

const file = 'c:/Users/Arnav Bhandari/kandakratesv2/kandakratesapp/kanda-krates-app/utils/translations.json';
const dict = JSON.parse(fs.readFileSync(file, 'utf-8'));

for (const lang of Object.keys(dict)) {
  dict[lang]["OHI is"] = lang === 'mr' ? 'OHI आहे' : 'OHI है';
  dict[lang]["— only"] = lang === 'mr' ? '— फक्त' : '— केवल';
  dict[lang]["At current market:"] = lang === 'mr' ? 'सध्याच्या बाजारात:' : 'वर्तमान बाजार में:';
  dict[lang]["— sell now to lock in this price."] = lang === 'mr' ? '— ही किंमत निश्चित करण्यासाठी आताच विका.' : '— इस कीमत को लॉक करने के लिए अभी बेचें।';
  dict[lang]["batches need immediate attention!"] = lang === 'mr' ? 'बॅचेसकडे त्वरित लक्ष देणे आवश्यक आहे!' : 'बैचेस पर तुरंत ध्यान देने की आवश्यकता है!';
  dict[lang]["active batches"] = lang === 'mr' ? 'सक्रिय बॅचेस' : 'सक्रिय बैचेस';
}

fs.writeFileSync(file, JSON.stringify(dict, null, 2));
console.log("Hardcoded fragments injected successfully!");
