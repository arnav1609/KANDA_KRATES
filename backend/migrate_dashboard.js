import fs from 'fs';
import path from 'path';

const file = path.resolve('c:/Users/Arnav Bhandari/kandakratesv2/kandakratesapp/kanda-krates-app/app/(tabs)/dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Remove I18N block
content = content.replace(/\/\* ================= LANGUAGE ================= \*\/[\s\S]*?(?=type Sensor)/, '');

// Swap useLanguage setup
content = content.replace(/const { language } = useLanguage\(\);\s*const t = I18N\[language\];/g, 'const { language, t } = useLanguage();');

// Replacements
content = content.replace(/t\.secureLabel/g, 't("🔒 Secure Data Feed")');
content = content.replace(/t\.logout/g, 't("Logout")');
content = content.replace(/t\.tamperWarning/g, 't("⚠️ Data integrity issue detected!")');
content = content.replace(/t\.tamperDetails/g, 't("Sensor data may have been tampered with. Please verify physically.")');
content = content.replace(/t\.chartTitle/g, 't("24-Hour Environment Trends")');
content = content.replace(/t\.aiTitle/g, 't("AI Health Analysis")');

content = content.replace(/t\.sensors\.temp/g, 't("Temperature")');
content = content.replace(/t\.sensors\.humidity/g, 't("Humidity")');
content = content.replace(/t\.sensors\.co2/g, 't("CO₂")');
content = content.replace(/t\.sensors\.nh3/g, 't("NH₃")');
content = content.replace(/t\.sensors\.voc/g, 't("VOC")');
content = content.replace(/t\.sensors\.stock/g, 't("Stock")');

content = content.replace(/t\.notes\.stable/g, 't("Stable")');
content = content.replace(/t\.notes\.optimal/g, 't("Optimal")');
content = content.replace(/t\.notes\.safeRange/g, 't("Safe range")');
content = content.replace(/t\.notes\.corrective/g, 't("Take corrective action")');
content = content.replace(/t\.notes\.immediate/g, 't("Immediate action required")');
content = content.replace(/t\.notes\.inventory/g, 't("Inventory")');

content = content.replace(/t\.ohiLabel/g, 't("Onion Health Index")');
content = content.replace(/t\.modalItem/g, 't("Check ventilation and inspect onions.")');
content = content.replace(/t\.acknowledge/g, 't("Acknowledge")');
content = content.replace(/t\.tiers\[tier\.label\]/g, 't(tier.label)');

// Add translations for missing strings in dashboard
content = content.replace(/Live APMC Rate/, '{t("Live APMC Rate")}');
content = content.replace(/Avg Model/, '{t("Avg Model")}');
content = content.replace(/Min:/, '{t("Min:")}');
content = content.replace(/Max:/, '{t("Max:")}');
content = content.replace(/'Per '/, 't("Per ") + ');
content = content.replace(/Per \{marketPrice.unit\}/, '{t("Per")} {marketPrice.unit}');
content = content.replace(/Not enough historical data collected yet\./, '{t("Not enough historical data collected yet.")}');
content = content.replace(/AI Analysis temporarily unavailable\./, 't("AI Analysis temporarily unavailable.")');

fs.writeFileSync(file, content);
console.log("Dashboard migration complete.");
