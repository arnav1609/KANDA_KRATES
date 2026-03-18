import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  ScrollView
} from "react-native";
import { useLanguage, LanguageCode } from "../../context/LanguageContext";
import { API_BASE_URL } from "../../config/api";

/* ================= I18N ================= */

const I18N: Record<LanguageCode, any> = {
  en: { batches: "Batches", help: "Help", close: "Close", support: "Support", detailedDash: "Detailed Batch Dashboard", storageAnalysis: "Storage Analysis", recommendedActions: "Recommended Actions", improveStorage: "Improve Storage Next Time", stable: "Storage conditions are stable for onion preservation.", sellNow: "SELL NOW", sellIn24h: "Sell in 24h", monitor: "Monitor", safe: "Safe", temp: "Temperature", humidity: "Humidity", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "Stock" },
  hi: { batches: "बैच", help: "सहायता", close: "बंद करें", support: "समर्थन", detailedDash: "विस्तृत बैच डैशबोर्ड", storageAnalysis: "भंडारण विश्लेषण", recommendedActions: "अनुशंसित क्रियाएं", improveStorage: "अगली बार भंडारण सुधारें", stable: "भंडारण की स्थिति स्थिर है।", sellNow: "अभी बेचें", sellIn24h: "24 घंटे में बेचें", monitor: "निगरानी करें", safe: "सुरक्षित", temp: "तापमान", humidity: "आर्द्रता", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "भंडार" },
  mr: { batches: "बॅचेस", help: "मदत", close: "बंद करा", support: "समर्थन", detailedDash: "तपशीलवार बॅच डॅशबोर्ड", storageAnalysis: "साठवण विश्लेषण", recommendedActions: "शिफारस केलेल्या क्रिया", improveStorage: "पुढील वेळी साठवण सुधारा", stable: "साठवण स्थिती स्थिर आहे.", sellNow: "आत्ता विका", sellIn24h: "24 तासात विका", monitor: "निरीक्षण करा", safe: "सुरक्षित", temp: "तापमान", humidity: "आर्द्रता", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "साठा" },
  ta: { batches: "தொகுதிகள்", help: "உதவி", close: "மூடு", support: "ஆதரவு", detailedDash: "விரிவான தொகுதி டாஷ்போர்டு", storageAnalysis: "சேமிப்பு பகுப்பாய்வு", recommendedActions: "பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்", improveStorage: "அடுத்த முறை சேமிப்பை மேம்படுத்தவும்", stable: "சேமிப்பு நிலை நிலையானது.", sellNow: "இப்போது விற்க", sellIn24h: "24 மணியில் விற்க", monitor: "கண்காணிக்கவும்", safe: "பாதுகாப்பானது", temp: "வெப்பநிலை", humidity: "ஈரப்பதம்", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "இருப்பு" },
  te: { batches: "బ్యాచ్‌లు", help: "సహాయం", close: "మూసివేయి", support: "మద్దతు", detailedDash: "వివరణాత్మక బ్యాచ్ డాష్‌బోర్డ్", storageAnalysis: "నిల్వ విశ్లేషణ", recommendedActions: "సిఫార్సు చర్యలు", improveStorage: "తదుపరిసారి నిల్వను మెరుగుపరచండి", stable: "నిల్వ పరిస్థితులు స్థిరంగా ఉన్నాయి.", sellNow: "ఇప్పుడే అమ్మండి", sellIn24h: "24 గంటల్లో అమ్మండి", monitor: "పర్యవేక్షించండి", safe: "సురక్షితం", temp: "ఉష్ణోగ్రత", humidity: "తేమ", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "స్టాక్" },
  kn: { batches: "ಬ್ಯಾಚ್‌ಗಳು", help: "ಸಹಾಯ", close: "ಮುಚ್ಚು", support: "ಬೆಂಬಲ", detailedDash: "ವಿವರವಾದ ಬ್ಯಾಚ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", storageAnalysis: "ಶೇಖರಣೆ ವಿಶ್ಲೇಷಣೆ", recommendedActions: "ಶಿಫಾರಸು ಕ್ರಮಗಳು", improveStorage: "ಮುಂದಿನ ಬಾರಿ ಶೇಖರಣೆ ಸುಧಾರಿಸಿ", stable: "ಶೇಖರಣಾ ಪರಿಸ್ಥಿತಿಗಳು ಸ್ಥಿರವಾಗಿವೆ.", sellNow: "ಈಗ ಮಾರಿ", sellIn24h: "24 ಗಂಟೆಯಲ್ಲಿ ಮಾರಿ", monitor: "ಮೇಲ್ವಿಚಾರಿಸಿ", safe: "ಸುರಕ್ಷಿತ", temp: "ತಾಪಮಾನ", humidity: "ತೇವಾಂಶ", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "ಸ್ಟಾಕ್" },
  ml: { batches: "ബാച്ചുകൾ", help: "സഹായം", close: "അടയ്ക്കുക", support: "പിന്തുണ", detailedDash: "വിശദ ബാച്ച് ഡാഷ്‌ബോർഡ്", storageAnalysis: "സംഭരണ വിശകലനം", recommendedActions: "ശുപാർശ ചെയ്ത നടപടികൾ", improveStorage: "അടുത്ത തവണ സംഭരണം മെച്ചപ്പെടുത്തുക", stable: "സംഭരണ സ്ഥിതി സ്ഥിരമാണ്.", sellNow: "ഇപ്പോൾ വിൽക്കുക", sellIn24h: "24 മണിക്കൂറിൽ വിൽക്കുക", monitor: "നിരീക്ഷിക്കുക", safe: "സുരക്ഷിതം", temp: "താപനില", humidity: "ആർദ്രത", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "സ്റ്റോക്ക്" },
  gu: { batches: "બૅચ", help: "સહાય", close: "બંધ કરો", support: "સમર્થન", detailedDash: "વિગતવાર બૅચ ડૅશબૉર્ડ", storageAnalysis: "સ્ટોરેજ વિશ્લેષણ", recommendedActions: "ભલામણ કરેલ ક્રિયાઓ", improveStorage: "આગળ સ્ટોરેજ સુધારો", stable: "સ્ટોરેજ સ્થિર છે.", sellNow: "હવે વેચો", sellIn24h: "24 કલાકમાં વેચો", monitor: "નિરીક્ષણ કરો", safe: "સુરક્ષિત", temp: "તાપમાન", humidity: "ભેજ", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "સ્ટૉક" },
  pa: { batches: "ਬੈਚ", help: "ਮਦਦ", close: "ਬੰਦ ਕਰੋ", support: "ਸਹਾਇਤਾ", detailedDash: "ਵਿਸਤ੍ਰਿਤ ਬੈਚ ਡੈਸ਼ਬੋਰਡ", storageAnalysis: "ਭੰਡਾਰ ਵਿਸ਼ਲੇਸ਼ਣ", recommendedActions: "ਸਿਫ਼ਾਰਸ਼ੀ ਕਾਰਵਾਈਆਂ", improveStorage: "ਅਗਲੀ ਵਾਰ ਭੰਡਾਰ ਸੁਧਾਰੋ", stable: "ਭੰਡਾਰ ਸਥਿਰ ਹੈ।", sellNow: "ਹੁਣੇ ਵੇਚੋ", sellIn24h: "24 ਘੰਟਿਆਂ ਵਿੱਚ ਵੇਚੋ", monitor: "ਨਿਗਰਾਨੀ ਕਰੋ", safe: "ਸੁਰੱਖਿਅਤ", temp: "ਤਾਪਮਾਨ", humidity: "ਨਮੀ", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "ਭੰਡਾਰ" },
  bn: { batches: "ব্যাচ", help: "সাহায্য", close: "বন্ধ করুন", support: "সহায়তা", detailedDash: "বিস্তারিত ব্যাচ ড্যাশবোর্ড", storageAnalysis: "সংরক্ষণ বিশ্লেষণ", recommendedActions: "প্রস্তাবিত পদক্ষেপ", improveStorage: "পরের বার সংরক্ষণ উন্নত করুন", stable: "সংরক্ষণ পরিস্থিতি স্থিতিশীল।", sellNow: "এখনই বিক্রয় করুন", sellIn24h: "২৪ ঘণ্টায় বিক্রয়", monitor: "পর্যবেক্ষণ করুন", safe: "নিরাপদ", temp: "তাপমাত্রা", humidity: "আর্দ্রতা", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "মজুদ" },
  or: { batches: "ବ୍ୟାଚ", help: "ସାହାଯ୍ୟ", close: "ବନ୍ଦ କରନ୍ତୁ", support: "ସମର୍ଥନ", detailedDash: "ବିସ୍ତୃତ ବ୍ୟାଚ ଡ୍ୟାଶବୋର୍ଡ", storageAnalysis: "ଭଣ୍ଡାର ବିଶ୍ଳେଷଣ", recommendedActions: "ସୁପାରିଶ ପଦକ୍ଷେପ", improveStorage: "ପରବର୍ତ୍ତୀ ଥର ଭଣ୍ଡାର ଉନ୍ନତ କରନ୍ତୁ", stable: "ଭଣ୍ଡାର ଅବସ୍ଥା ସ୍ଥିର।", sellNow: "ବର୍ତ୍ତମାନ ବିକ୍ରୟ", sellIn24h: "୨୪ ଘଣ୍ଟାରେ ବିକ୍ରୟ", monitor: "ପ୍ରତ୍ୟବେକ୍ଷଣ", safe: "ସୁରକ୍ଷିତ", temp: "ତାପମାତ୍ରା", humidity: "ଆର୍ଦ୍ରତା", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "ଭଣ୍ଡାର" },
};

/* ================= TYPES ================= */

type SensorSet = {
  temp: number;
  humidity: number;
  co2: number;
  nh3: number;
  voc: number;
};

type Batch = {
  id: string;
  weightKg: number;
  sensors: SensorSet;
};

/* ================= INITIAL BATCHES ================= */

const INITIAL_BATCHES: Batch[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `Batch ${String.fromCharCode(65 + i)}`,
  weightKg: Math.floor(400 + Math.random() * 550),
  sensors: {
    temp: 24 + Math.random() * 3,
    humidity: 60 + Math.random() * 10,
    co2: 400 + Math.random() * 3000,
    nh3: Math.random(),
    voc: Math.random()
  }
}));

/* ================= OHI LOGIC ================= */

function statusColor(status: string) {
  if (status === "Emergency") return "#DC2626";
  if (status === "Action") return "#F97316";
  if (status === "Alert") return "#F59E0B";
  return "#16A34A";
}

function statusText(status: string, t: any) {
  if (status === "Emergency") return t.sellNow;
  if (status === "Action") return t.sellIn24h;
  if (status === "Alert") return t.monitor;
  return t.safe;
}

/* ================= MAIN ================= */

export default function Leaderboard() {
  const { language } = useLanguage();
  const t = I18N[language];

  const [batches, setBatches] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    async function fetchAllBatches() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/sensors/crate1`);
        const data = await res.json();
        const batchArray = Object.keys(data).map(key => ({
          id: key,
          weightKg: 450,
          sensors: data[key],
          ml: data[key].ml_predictions || { ohi: 50, tier: "Alert", daysRemaining: 0 }
        }));
        
        // Add some mock batches for ui volume
        const initialWithReal = [...INITIAL_BATCHES.slice(1)].map(b => ({
          ...b,
          ml: { ohi: Math.floor(Math.random() * 40 + 50), tier: "Alert", daysRemaining: 15 }
        }));
        
        if (batchArray.length > 0) {
          setBatches([batchArray[0], ...initialWithReal]);
        } else {
          setBatches(initialWithReal);
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    fetchAllBatches();
    const i = setInterval(fetchAllBatches, 5000);
    return () => clearInterval(i);
  }, []);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.batches}</Text>
        <Pressable style={styles.helpBtn} onPress={() => setShowHelp(true)}>
          <Text style={styles.helpText}>{t.help}</Text>
        </Pressable>
      </View>

      <FlatList
        data={batches}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const ohi = item.ml.ohi;
          const status = item.ml.tier;
          const safeDays = item.ml.daysRemaining;
          return (
            <Pressable onPress={() => setSelected(item)}>
              <View style={[styles.card, { backgroundColor: statusColor(status) }]}>
                <Text style={styles.batch}>{item.id}</Text>
                <Text style={styles.meta}>{item.weightKg} kg • OHI {ohi} • {safeDays} Days left</Text>
                <Text style={styles.statusText}>{statusText(status, t)}</Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.popup}>
            {selected && (() => {
              const ohi = selected.ml.ohi;
              const status = selected.ml.tier;
              const safeDays = selected.ml.daysRemaining;
              
              // Normalize the sensor payload names slightly since live data uses mq135 vs co2
              const displayTemp = selected.sensors.temperature ?? selected.sensors.temp;
              const displayCo2 = selected.sensors.mq135 ? selected.sensors.mq135 * 10 : selected.sensors.co2;
              const displayNh3 = selected.sensors.mq137 ?? selected.sensors.nh3;
              const displayVoc = selected.sensors.mq136 ?? selected.sensors.voc;

              return (
                <>
                  <Text style={styles.popupTitle}>{selected.id}</Text>
                  <Text style={styles.popupSub}>{t.detailedDash}</Text>

                  <View style={styles.grid}>
                    <Sensor label={t.temp} value={`${displayTemp} °C`} />
                    <Sensor label={t.humidity} value={`${selected.sensors.humidity} %`} />
                    <Sensor label={t.co2} value={`${Math.round(displayCo2)} ppm`} />
                    <Sensor label={t.nh3} value={`${displayNh3} ppm`} />
                    <Sensor label={t.voc} value={`${displayVoc} ppm`} />
                    <Sensor label={t.stock} value={`${selected.weightKg} kg`} />
                  </View>

                  <View style={styles.analysisBox}>
                    <Text style={styles.analysisTitle}>{t.storageAnalysis}</Text>
                    <Text style={styles.analysisText}>
                      ML predictions estimate {safeDays} days of safe storage remaining for this batch. 
                      {status === "Normal" ? " " + t.stable : ` OHI: ${ohi} — ${statusText(status, t)}`}
                    </Text>
                    <Text style={styles.analysisTitle}>{t.recommendedActions}</Text>
                    <Text style={styles.analysisText}>• {statusText(status, t)}</Text>
                  </View>

                  <Pressable style={styles.close} onPress={() => setSelected(null)}>
                    <Text style={{ color: "#FFF", fontWeight: "800" }}>{t.close}</Text>
                  </Pressable>
                </>
              );
            })()}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showHelp} transparent animationType="fade">
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>{t.support}</Text>
            <Text style={styles.helpNumber}>📞 +91 98765 43210</Text>
            <Pressable style={styles.helpClose} onPress={() => setShowHelp(false)}>
              <Text style={{ color: "#FFF", fontWeight: "800" }}>{t.close}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ================= SENSOR CARD ================= */

function Sensor({ label, value }: { label: string; value: string }) {

  return (
    <View style={styles.sensor}>
      <Text style={styles.sensorLabel}>{label}</Text>
      <Text style={styles.sensorValue}>{value}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({

  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800"
  },

  helpBtn: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20
  },

  helpText: {
    color: "#FFF",
    fontWeight: "800"
  },

  card: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    elevation: 3
  },

  batch: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFF"
  },

  meta: {
    marginTop: 6,
    color: "#FFF"
  },

  statusText: {
    marginTop: 8,
    fontWeight: "900",
    color: "#FFF"
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end"
  },

  popup: {
    backgroundColor: "#F7FAF9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "90%"
  },

  popupTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center"
  },

  popupSub: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 16
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  sensor: {
    width: "48%",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12
  },

  sensorLabel: {
    fontSize: 12,
    color: "#6B7280"
  },

  sensorValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6
  },

  analysisBox: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    marginTop: 10
  },

  analysisTitle: {
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 6
  },

  analysisText: {
    fontSize: 13,
    marginBottom: 4,
    color: "#374151"
  },

  close: {
    marginTop: 16,
    backgroundColor: "#1E6F5C",
    padding: 14,
    borderRadius: 14,
    alignItems: "center"
  },

  helpOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center"
  },

  helpBox: {
    backgroundColor: "#FFF",
    width: "80%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center"
  },

  helpTitle: {
    fontSize: 18,
    fontWeight: "800"
  },

  helpNumber: {
    fontSize: 20,
    fontWeight: "900",
    marginVertical: 12,
    color: "#16A34A"
  },

  helpClose: {
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12
  }

});