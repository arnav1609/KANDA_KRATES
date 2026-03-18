import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { secureRequest, API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import {
  verifySensorData,
  freezeSensorData,
  type IntegrityResult,
} from "../../utils/dataIntegrity";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, LanguageCode } from "../../context/LanguageContext";

/* ================= LANGUAGE ================= */

const I18N: Record<LanguageCode, any> = {
  en: {
    acknowledge: "Acknowledge",
    tiers: {
      Normal: "Normal",
      Alert: "Alert",
      Action: "Action",
      Emergency: "Emergency",
    },
    ohiLabel: "Onion Health Index",
    modalItem: "Check ventilation and inspect onions.",
    tamperWarning: "⚠️ Data integrity issue detected!",
    tamperDetails: "Sensor data may have been tampered with. Please verify physically.",
    logout: "Logout",
    secureLabel: "🔒 Secure Data Feed",
    chartTitle: "24-Hour Environment Trends",
    aiTitle: "AI Health Analysis",
    sensors: {
      temp: "Temperature", humidity: "Humidity", co2: "CO₂",
      nh3: "NH₃", voc: "VOC", stock: "Stock",
    },
    notes: {
      stable: "Stable", optimal: "Optimal", safeRange: "Safe range",
      corrective: "Take corrective action", immediate: "Immediate action required",
      inventory: "Inventory",
    },
  },
  hi: {
    acknowledge: "स्वीकार करें",
    tiers: {
      Normal: "सामान्य",
      Alert: "चेतावनी",
      Action: "कार्यवाही",
      Emergency: "आपातकालीन",
    },
    ohiLabel: "प्याज स्वास्थ्य सूचकांक",
    modalItem: "हवा की जांच करें और प्याज का निरीक्षण करें।",
    tamperWarning: "⚠️ डेटा अखंडता समस्या!",
    tamperDetails: "सेंसर डेटा के साथ छेड़छाड़ हो सकती है। कृपया भौतिक रूप से सत्यापित करें।",
    logout: "लॉगआउट",
    secureLabel: "🔒 सुरक्षित डेटा फीड",
    chartTitle: "२४-घंटे पर्यावरण रुझान",
    aiTitle: "AI स्वास्थ्य विश्लेषण",
    sensors: {
      temp: "तापमान", humidity: "आर्द्रता", co2: "CO₂",
      nh3: "NH₃", voc: "VOC", stock: "भंडार",
    },
    notes: {
      stable: "स्थिर", optimal: "इष्टतम", safeRange: "सुरक्षित सीमा",
      corrective: "सुधारात्मक कार्रवाई करें", immediate: "तत्काल कार्रवाई आवश्यक",
      inventory: "सूची",
    },
  },
  mr: {
    acknowledge: "मान्य करा",
    tiers: {
      Normal: "सामान्य",
      Alert: "सावधान",
      Action: "कृती",
      Emergency: "आपत्कालीन",
    },
    ohiLabel: "कांद्याचे आरोग्य निर्देशांक",
    modalItem: "हवा तपासा आणि कांद्याची तपासणी करा.",
    tamperWarning: "⚠️ डेटा अखंडता समस्या!",
    tamperDetails: "सेंसर डेटाशी छेडछाड झाली असू शकते. कृपया प्रत्यक्ष तपासा.",
    logout: "लॉगआउट",
    secureLabel: "🔒 सुरक्षित डेटा फीड",
    chartTitle: "२४-तास पर्यावरणीय ट्रेंड",
    aiTitle: "AI आरोग्य विश्लेषण",
    sensors: {
      temp: "तापमान", humidity: "आर्द्रता", co2: "CO₂",
      nh3: "NH₃", voc: "VOC", stock: "साठा",
    },
    notes: {
      stable: "स्थिर", optimal: "इष्टतम", safeRange: "सुरक्षित श्रेणी",
      corrective: "सुधारात्मक कृती करा", immediate: "तत्काळ कृती आवश्यक",
      inventory: "यादी",
    },
  },
  ta: {
    acknowledge: "ஒப்புக்கொள்",
    tiers: {
      Normal: "சாதாரண",
      Alert: "எச்சரிக்கை",
      Action: "நடவடிக்கை",
      Emergency: "அவசர நிலை",
    },
    ohiLabel: "வெங்காய ஆரோக்கிய குறியீடு",
    modalItem: "காற்றோட்டத்தை சரிபார்த்து வெங்காயங்களை பரிசோதிக்கவும்.",
    tamperWarning: "⚠️ தரவு ஒருமைப்பாடு சிக்கல்!",
    tamperDetails: "சென்சார் தரவு மாற்றப்பட்டிருக்கலாம். உடல்ரீதியாக சரிபார்க்கவும்.",
    logout: "வெளியேறு",
    secureLabel: "🔒 பாதுகாப்பான தரவு ஊட்டம்",
    chartTitle: "24 மணி நேர சுற்றுச்சூழல் போக்குகள்",
    aiTitle: "AI சுகாதார பகுப்பாய்வு",
    sensors: {
      temp: "வெப்பநிலை", humidity: "ஈரப்பதம்", co2: "CO₂",
      nh3: "NH₃", voc: "VOC", stock: "இருப்பு",
    },
    notes: {
      stable: "நிலையானது", optimal: "உகந்தது", safeRange: "பாதுகாப்பான வரம்பு",
      corrective: "சரிசெய்யும் நடவடிக்கை எடுக்கவும்", immediate: "உடனடி நடவடிக்கை தேவை",
      inventory: "கையிருப்பு",
    },
  },
  te: {
    acknowledge: "అంగీకరించు",
    tiers: { Normal: "సాధారణ", Alert: "హెచ్చరిక", Action: "చర్య", Emergency: "అత్యవసరం" },
    ohiLabel: "ఉల్లి ఆరోగ్యసూచి",
    modalItem: "గాలిని తనిఖీ చేసి ఉల్లిపాయలను తనిఖీ చేయండి.",
    tamperWarning: "⚠️ డేటా సమగ్రత సమస్య!",
    tamperDetails: "సెన్సార్ డేటా మార్చబడి ఉండవచ్చు. భౌతికంగా ధృవీకరించండి.",
    logout: "లాగ్అవుట్",
    secureLabel: "🔒 సురక్షిత డేటా ఫీడ్",
    chartTitle: "24-గంటల పర్యావరణ ధోరణులు",
    aiTitle: "AI ఆరోగ్య విశ్లేషణ",
    sensors: { temp: "ఉష్ణోగ్రత", humidity: "తేమ", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "స్టాక్" },
    notes: { stable: "స్థిరంగా", optimal: "అనుకూలంగా", safeRange: "సురక్షిత పరిధి", corrective: "దిద్దుబాటు చర్య తీసుకోండి", immediate: "తక్షణ చర్య అవసరం", inventory: "జాబితా" },
  },
  kn: {
    acknowledge: "ಒಪ್ಪಿಕೊಳ್ಳಿ",
    tiers: { Normal: "ಸಾಮಾನ್ಯ", Alert: "ಎಚ್ಚರಿಕೆ", Action: "ಕ್ರಮ", Emergency: "ತುರ್ತು" },
    ohiLabel: "ಈರುಳ್ಳಿ ಆರೋಗ್ಯ ಸೂಚ್ಯಂಕ",
    modalItem: "ಗಾಳಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಈರುಳ್ಳಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    tamperWarning: "⚠️ ಡೇಟಾ ಸಮಗ್ರತೆ ಸಮಸ್ಯೆ!",
    tamperDetails: "ಸೆನ್ಸಾರ್ ಡೇಟಾ ಬದಲಾಗಿರಬಹುದು. ಭೌತಿಕವಾಗಿ ಪರಿಶೀಲಿಸಿ.",
    logout: "ಲಾಗ್ಔಟ್",
    secureLabel: "🔒 ಸುರಕ್ಷಿತ ಡೇಟಾ ಫೀಡ್",
    chartTitle: "24-ಗಂಟೆ ಪರಿಸರ ಪ್ರವೃತ್ತಿಗಳು",
    aiTitle: "AI ಆರೋಗ್ಯ ವಿಶ್ಲೇಷಣೆ",
    sensors: { temp: "ತಾಪಮಾನ", humidity: "ತೇವಾಂಶ", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "ಸ್ಟಾಕ್" },
    notes: { stable: "ಸ್ಥಿರ", optimal: "ಸೂಕ್ತ", safeRange: "ಸುರಕ್ಷಿತ ವ್ಯಾಪ್ತಿ", corrective: "ಸರಿಪಡಿಸುವ ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳಿ", immediate: "ತಕ್ಷಣ ಕ್ರಮ ಅಗತ್ಯ", inventory: "ದಾಸ್ತಾನು" },
  },
  ml: {
    acknowledge: "അംഗീകരിക്കുക",
    tiers: { Normal: "സാധാരണ", Alert: "മുന്നറിയിപ്പ്", Action: "നടപടി", Emergency: "അടിയന്തരം" },
    ohiLabel: "ഉള്ളി ആരോഗ്യ സൂചിക",
    modalItem: "വായുസഞ്ചാരം പരിശോധിച്ച് ഉള്ളി പരിശോധിക്കുക.",
    tamperWarning: "⚠️ ഡാറ്റ സമഗ്രത പ്രശ്നം!",
    tamperDetails: "സെൻസർ ഡാറ്റ സംശയാസ്പദമാണ്. നേരിട്ട് പരിശോധിക്കുക.",
    logout: "ലോഗ്ഔട്ട്",
    secureLabel: "🔒 സുരക്ഷിത ഡാറ്റ ഫീഡ്",
    chartTitle: "24-മണിക്കൂർ പരിസ്ഥിതി പ്രവണതകൾ",
    aiTitle: "AI ആരോഗ്യ വിശകലനം",
    sensors: { temp: "താപനില", humidity: "ആർദ്രത", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "സ്റ്റോക്ക്" },
    notes: { stable: "സ്ഥിരം", optimal: "അനുയോജ്യം", safeRange: "സുരക്ഷിത പരിധി", corrective: "തിരുത്തൽ നടപടി കൈക്കൊള്ളുക", immediate: "ഉടനടി നടപടി ആവശ്യമാണ്", inventory: "ഇൻവെന്ററി" },
  },
  gu: {
    acknowledge: "સ્વીકારો",
    tiers: { Normal: "સામાન્ય", Alert: "ચેતવણી", Action: "કાર્યવાહી", Emergency: "કટોકટી" },
    ohiLabel: "ડુંગળી સ્વાસ્થ્ય સૂચકાંક",
    modalItem: "હવાની ચકાસણી કરો અને ડુંગળીનું નિરીક્ષણ કરો.",
    tamperWarning: "⚠️ ડેટા અખંડિતતા સમસ્યા!",
    tamperDetails: "સેન્સર ડેટામાં છેડછાડ થઈ શકે છે. ભૌતિક રીતે ચકાસણી કરો.",
    logout: "લૉગઆઉટ",
    secureLabel: "🔒 સુરક્ષિત ડેટા ફીડ",
    chartTitle: "24-કલાકના પર્યાવરણ વલણો",
    aiTitle: "AI સ્વાસ્થ્ય વિશ્લેષણ",
    sensors: { temp: "તાપમાન", humidity: "ભેજ", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "સ્ટોક" },
    notes: { stable: "સ્થિર", optimal: "શ્રેષ્ઠ", safeRange: "સુરક્ષિત શ્રેણી", corrective: "સુધારાત્મક પગલાં લો", immediate: "તાત્કાલિક પગલાં જરૂરી", inventory: "ઇન્વેન્ટરી" },
  },
  pa: {
    acknowledge: "ਸਵੀਕਾਰ ਕਰੋ",
    tiers: { Normal: "ਆਮ", Alert: "ਚੇਤਾਵਨੀ", Action: "ਕਾਰਵਾਈ", Emergency: "ਐਮਰਜੈਂਸੀ" },
    ohiLabel: "ਪਿਆਜ਼ ਸਿਹਤ ਸੂਚਕ",
    modalItem: "ਹਵਾ ਦੀ ਜਾਂਚ ਕਰੋ ਅਤੇ ਪਿਆਜ਼ ਦੀ ਪੜਤਾਲ ਕਰੋ।",
    tamperWarning: "⚠️ ਡੇਟਾ ਅਖੰਡਤਾ ਸਮੱਸਿਆ!",
    tamperDetails: "ਸੈਂਸਰ ਡੇਟਾ ਨਾਲ ਛੇੜਛਾੜ ਹੋ ਸਕਦੀ ਹੈ. ਸਰੀਰਕ ਤੌਰ 'ਤੇ ਤਸਦੀਕ ਕਰੋ.",
    logout: "ਲੌਗਆਉਟ",
    secureLabel: "🔒 ਸੁਰੱਖਿਅਤ ਡੇਟਾ ਫੀਡ",
    chartTitle: "24-ਘੰਟੇ ਵਾਤਾਵਰਣ ਰੁਝਾਨ",
    aiTitle: "AI ਸਿਹਤ ਵਿਸ਼ਲੇਸ਼ਣ",
    sensors: { temp: "ਤਾਪਮਾਨ", humidity: "ਨਮੀ", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "ਭੰਡਾਰ" },
    notes: { stable: "ਸਥਿਰ", optimal: "ਸਰਵੋਤਮ", safeRange: "ਸੁਰੱਖਿਅਤ ਸੀਮਾ", corrective: "ਸੁਧਾਰਾਤਮਕ ਕਾਰਵਾਈ ਕਰੋ", immediate: "ਤੁਰੰਤ ਕਾਰਵਾਈ ਜ਼ਰੂਰੀ", inventory: "ਸੂਚੀ" },
  },
  bn: {
    acknowledge: "স্বীকার করুন",
    tiers: { Normal: "সাধারণ", Alert: "সতর্কতা", Action: "পদক্ষেপ", Emergency: "জরুরী" },
    ohiLabel: "পেঁয়াজ স্বাস্থ্য সূচক",
    modalItem: "বাতাস চলাচল পরীক্ষা করুন এবং পেঁয়াজ পরিদর্শন করুন।",
    tamperWarning: "⚠️ ডেটা সত্যতা সমস্যা!",
    tamperDetails: "সেন্সর ডেটা টেম্পার করা হতে পারে। শারীরিকভাবে যাচাই করুন।",
    logout: "লগআউট",
    secureLabel: "🔒 সুরক্ষিত ডেটা ফিড",
    chartTitle: "২৪-ঘণ্টার পরিবেশ প্রবণতা",
    aiTitle: "AI স্বাস্থ্য বিশ্লেষণ",
    sensors: { temp: "তাপমাত্রা", humidity: "আর্দ্রতা", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "মজুদ" },
    notes: { stable: "স্থিতিশীল", optimal: "সর্বোত্তম", safeRange: "নিরাপদ পরিধি", corrective: "সংশোধনমূলক ব্যবস্থা নিন", immediate: "তাৎক্ষণিক ব্যবস্থা প্রয়োজন", inventory: "তালিকা" },
  },
  or: {
    acknowledge: "ଗ୍ରହଣ କରନ୍ତୁ",
    tiers: { Normal: "ସାଧାରଣ", Alert: "ସତର୍କତା", Action: "କାର୍ଯ୍ୟାନୁଷ୍ଠାନ", Emergency: "ଜରୁରୀକାଳୀନ" },
    ohiLabel: "କାନ୍ଦା ସ୍ୱାସ୍ଥ୍ୟ ସୂଚକାଙ୍କ",
    modalItem: "ବାୟୁ ଚଳାଚଳ ଯାଞ୍ଚ କରନ୍ତୁ ଏବଂ ପିଆଜ ନିରୀକ୍ଷଣ କରନ୍ତୁ।",
    tamperWarning: "⚠️ ଡେଟା ଅଖଣ୍ଡତା ସମସ୍ୟା!",
    tamperDetails: "ସେନ୍ସର ଡେଟା ସହିତ ଛେଡ଼ଛାଡ ହୋଇଥାଇପାରେ। ଭୌତିକ ଭାବରେ ଯାଞ୍ଚ କରନ୍ତୁ।",
    logout: "ଲଗଆଉଟ୍",
    secureLabel: "🔒 ସୁରକ୍ଷିତ ଡେଟା ଫିଡ୍",
    chartTitle: "24-ଘଣ୍ଟା ପରିବେଶ ଧାରା",
    aiTitle: "AI ସ୍ୱାସ୍ଥ୍ୟ ବିଶ୍ଳେଷଣ",
    sensors: { temp: "ତାପମାତ୍ରା", humidity: "ଆର୍ଦ୍ରତା", co2: "CO₂", nh3: "NH₃", voc: "VOC", stock: "ଭଣ୍ଡାର" },
    notes: { stable: "ସ୍ଥିର", optimal: "ଆଦର୍ଶ", safeRange: "ସୁରକ୍ଷିତ ସୀମା", corrective: "ସଂଶୋଧନ ପଦକ୍ଷେପ ନିଅ", immediate: "ତୁରନ୍ତ ପଦକ୍ଷେପ ଆବଶ୍ୟକ", inventory: "ଭଣ୍ଡାର ଗଣନା" },
  }
};

type Sensor = {
  value: number;
  unit: string;
};

type SensorsState = {
  temp: Sensor;
  humidity: Sensor;
  co2: Sensor;
  nh3: Sensor;
  voc: Sensor;
  stock: Sensor;
  ml_predictions?: {
    ohi: number;
    tier: "Normal" | "Alert" | "Action" | "Emergency";
    daysRemaining: number;
    confidence: number;
  };
};

type TierResult = {
  label: "Normal" | "Alert" | "Action" | "Emergency";
  bg: string;
  text: string;
  note: string;
};

/* ================= GAS ANALYSIS ================= */

function evaluateGas(value: number, type: "co2" | "nh3" | "voc", t: any): TierResult {
  if (
    (type === "co2" && value > 10000) ||
    (type === "nh3" && value > 10) ||
    (type === "voc" && value > 5)
  ) {
    return {
      label: "Emergency",
      bg: "#FEE2E2",
      text: "#B91C1C",
      note: t.notes.immediate,
    };
  }

  if (
    (type === "co2" && value > 5000) ||
    (type === "nh3" && value > 2) ||
    (type === "voc" && value > 2)
  ) {
    return {
      label: "Action",
      bg: "#FFEDD5",
      text: "#C2410C",
      note: t.notes.corrective,
    };
  }

  if (
    (type === "co2" && value > 2000) ||
    (type === "nh3" && value > 0.5) ||
    (type === "voc" && value > 0.5)
  ) {
    return {
      label: "Alert",
      bg: "#FEF3C7",
      text: "#B45309",
      note: "Monitor closely",
    };
  }

  return {
    label: "Normal",
    bg: "#DCFCE7",
    text: "#166534",
    note: t.notes.safeRange,
  };
}

/* ================= DASHBOARD ================= */

export default function Dashboard() {
  const { language } = useLanguage();
  const t = I18N[language];
  const { logout } = useAuth();

  const [sensors, setSensors] = useState<SensorsState>({
    temp: { value: 0, unit: "°C" },
    humidity: { value: 0, unit: "%" },
    co2: { value: 0, unit: "ppm" },
    nh3: { value: 0, unit: "ppm" },
    voc: { value: 0, unit: "ppm" },
    stock: { value: 0, unit: "kg" },
  });

  const [integrity, setIntegrity] = useState<IntegrityResult>({
    valid: true,
    issues: [],
  });

  const [marketPrice, setMarketPrice] = useState<any>(null);
  const [advisory, setAdvisory] = useState<any>(null);

  /* ================= FETCH SENSOR DATA (SECURED) ================= */

  useEffect(() => {
    async function fetchSensors() {
      try {
        const res = await secureRequest(
          API_ENDPOINTS.sensors("crate1", "batch1")
        );
        const data = await res.json();

        // ── Integrity check ──
        const integrityResult = verifySensorData(data, data.dataHash);
        setIntegrity(integrityResult);

        if (!integrityResult.valid) {
          console.warn("[Security] Sensor data integrity issues:", integrityResult.issues);
        }

        // ── Freeze data to prevent tampering ──
        const frozenData = freezeSensorData(data);

        setSensors({
          temp: { value: frozenData.temperature || 0, unit: "°C" },
          humidity: { value: frozenData.humidity || 0, unit: "%" },
          co2: { value: frozenData.mq135 || 0, unit: "ppm" },
          nh3: { value: frozenData.mq137 || 0, unit: "ppm" },
          voc: { value: frozenData.mq136 || 0, unit: "ppm" },
          stock: { value: 2367, unit: "kg" },
          ml_predictions: frozenData.ml_predictions || {
            ohi: 50, tier: "Alert", daysRemaining: 0, confidence: 0
          }
        });
      } catch (err) {
        console.log("[Security] Sensor fetch error:", err);
      }

      // Fetch Live Market Data
      try {
        const marketRes = await secureRequest(API_ENDPOINTS.marketPrice);
        const mData = await marketRes.json();
        setMarketPrice(mData);
      } catch (err) {
        console.log("Market fetch error:", err);
      }

      // Fetch Sell/Hold Advisory for crate1
      try {
        const advisoryRes = await secureRequest(API_ENDPOINTS.advisory("crate1"));
        const aData = await advisoryRes.json();
        setAdvisory(aData);
      } catch (err) {
        console.log("Advisory fetch error:", err);
      }
    }

    fetchSensors();
    const interval = setInterval(fetchSensors, 2000);
    return () => clearInterval(interval);
  }, []);

  /* ================= OHI ================= */

  // Use the objective ML-predicted OHI instead of the hardcoded linear one
  const ohi = sensors.ml_predictions?.ohi ?? 50;
  const days = sensors.ml_predictions?.daysRemaining ?? 0;

  return (
    <ScrollView style={styles.container}>
      {/* Security Status Bar */}
      <View style={styles.securityBar}>
        <View style={styles.securityLeft}>
          <Ionicons
            name={integrity.valid ? "shield-checkmark" : "warning"}
            size={16}
            color={integrity.valid ? "#16A34A" : "#EF4444"}
          />
          <Text
            style={[
              styles.securityText,
              !integrity.valid && { color: "#EF4444" },
            ]}
          >
            {integrity.valid ? t.secureLabel : t.tamperWarning}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>
      </View>

      {/* Tamper Warning Banner */}
      {!integrity.valid && (
        <View style={styles.tamperBanner}>
          <Ionicons name="alert-circle" size={20} color="#B91C1C" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.tamperTitle}>{t.tamperWarning}</Text>
            <Text style={styles.tamperText}>{t.tamperDetails}</Text>
            {integrity.issues.map((issue, idx) => (
              <Text key={idx} style={styles.tamperIssue}>
                • {issue}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Market Price Card */}
      {marketPrice && (
        <View style={styles.marketCard}>
          <View style={styles.marketHeader}>
            <Ionicons name="trending-up" size={20} color="#047857" />
            <Text style={styles.marketTitle}>Live APMC Rate ({marketPrice.market})</Text>
          </View>
          <View style={styles.marketRates}>
            <View style={styles.rateBox}>
              <Text style={styles.rateLabel}>Avg Model</Text>
              <Text style={styles.rateValuePrimary}>₹{marketPrice.priceModal}</Text>
            </View>
            <View style={styles.rateDivider} />
            <View style={styles.rateMinMax}>
              <Text style={styles.rateSub}>Min: ₹{marketPrice.priceMin}</Text>
              <Text style={styles.rateSub}>Max: ₹{marketPrice.priceMax}</Text>
            </View>
          </View>
          <Text style={styles.rateUnit}>Per {marketPrice.unit}</Text>
        </View>
      )}

      {/* ── Sell / Hold Advisory Engine ── */}
      {advisory?.recommendations?.length > 0 && (
        <View style={styles.advisorySection}>
          <View style={styles.advisoryHeader}>
            <Ionicons name="analytics" size={20} color="#7C3AED" />
            <Text style={styles.advisoryTitle}>AI Sell Advisory</Text>
          </View>
          {advisory.recommendations.map((rec: any) => (
            <View
              key={rec.batchId}
              style={[styles.advisoryCard, { borderLeftColor: rec.color }]}
            >
              <View style={styles.advisoryRow}>
                <Text style={[styles.advisoryAction, { color: rec.color }]}>
                  {rec.urgency}
                </Text>
                <View style={[styles.advisoryBadge, { backgroundColor: rec.color + "22" }]}>
                  <Text style={[styles.advisoryBadgeText, { color: rec.color }]}>
                    {rec.batchId.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.advisoryReason}>{rec.reason}</Text>
              <View style={styles.advisoryMeta}>
                <Text style={styles.advisoryMetaItem}>📊 OHI: {rec.ohi}/100</Text>
                <Text style={styles.advisoryMetaItem}>⏳ {rec.daysRemaining}d left</Text>
                <Text style={styles.advisoryMetaItem}>₹{rec.marketPriceModal}/kg</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <OhiGauge value={ohi} t={t} />

      <HistoryChart crateId="crate1" language={language} t={t} />

      <View style={styles.grid}>
        <SensorCard
          title={t.sensors.temp}
          sensor={sensors.temp}
          tier={{
            label: "Normal",
            bg: "#EEF2FF",
            text: "#3730A3",
            note: t.notes.stable,
          }}
          t={t}
        />
        <SensorCard
          title={t.sensors.humidity}
          sensor={sensors.humidity}
          tier={{
            label: "Normal",
            bg: "#ECFEFF",
            text: "#155E75",
            note: t.notes.optimal,
          }}
          t={t}
        />
        <SensorCard
          title={t.sensors.co2}
          sensor={sensors.co2}
          tier={evaluateGas(sensors.co2.value, "co2", t)}
          t={t}
        />
        <SensorCard
          title={t.sensors.nh3}
          sensor={sensors.nh3}
          tier={evaluateGas(sensors.nh3.value, "nh3", t)}
          t={t}
        />
        <SensorCard
          title={t.sensors.voc}
          sensor={sensors.voc}
          tier={evaluateGas(sensors.voc.value, "voc", t)}
          t={t}
        />
        <SensorCard
          title={t.sensors.stock}
          sensor={sensors.stock}
          tier={{
            label: "Normal",
            bg: "#F8FAFC",
            text: "#111827",
            note: t.notes.inventory,
          }}
          t={t}
        />
      </View>
    </ScrollView>
  );
}

/* ================= SENSOR CARD ================= */

function SensorCard({ title, sensor, tier, t }: any) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: tier.bg }]}
        onPress={() => tier.label !== "Normal" && setOpen(true)}
      >
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.cardValue, { color: tier.text }]}>
          {sensor.value} {sensor.unit}
        </Text>
        <View style={styles.pill}>
          <Text style={[styles.pillText, { color: tier.text }]}>
            {t.tiers[tier.label]}
          </Text>
        </View>
        <Text style={styles.note}>{tier.note}</Text>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { borderTopColor: tier.text }]}>
            <Text style={[styles.modalTitle, { color: tier.text }]}>
              {t.tiers[tier.label]}
            </Text>
            <Text style={styles.modalItem}>{t.modalItem}</Text>
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>{t.acknowledge}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ================= OHI GAUGE ================= */

function OhiGauge({ value, t }: { value: number; t: any }) {
  const color =
    value > 85
      ? "#16A34A"
      : value > 70
      ? "#F59E0B"
      : value > 55
      ? "#F97316"
      : "#DC2626";

  return (
    <View style={styles.ohiBox}>
      <Text style={[styles.ohiValue, { color }]}>{value}</Text>
      <Text style={styles.ohiLabel}>{t.ohiLabel}</Text>
    </View>
  );
}

/* ================= HISTORY CHART & AI SUMMARY ================= */

import { LineChart } from "react-native-chart-kit";
import { Dimensions, ActivityIndicator } from "react-native";
const { width } = Dimensions.get("window");

function HistoryChart({ crateId, language, t }: { crateId: string, language: string, t: any }) {
  const [chartData, setChartData] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string>("Loading AI Health Analysis...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        // Load history data points
        const histRes = await secureRequest(API_ENDPOINTS.history(crateId));
        const history = await histRes.json();
        
        if (history && history.length > 0) {
          // Format labels (HH:MM) and data for chart
          const labels = history.map((h: any) => {
             const d = new Date(h.timestamp);
             return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
          });
          const temps = history.map((h: any) => h.temperature);
          const hums = history.map((h: any) => h.humidity);
          
          setChartData({
            labels: labels.slice(-6), // Show only last 6 points to fit screen
            datasets: [
              { data: temps.slice(-6), color: () => '#EF4444', strokeWidth: 2 }, // Red Temp
              { data: hums.slice(-6), color: () => '#3B82F6', strokeWidth: 2 }   // Blue Hum
            ],
            legend: ["Temp °C", "Humidity %"]
          });
        }

        // Load AI Summary sentence
        const aiRes = await secureRequest(API_ENDPOINTS.historyHealth(crateId, language));
        const aiData = await aiRes.json();
        setAiSummary(aiData.summary);
      } catch (err) {
        console.log("Chart fetch error:", err);
        setAiSummary("AI Analysis temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
    // Refresh history chart and AI summary every 5 minutes
    const interval = setInterval(fetchHistory, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [crateId, language]);

  if (loading && !chartData) {
    return (
      <View style={[styles.aiSummaryBox, { alignItems: 'center', justifyContent: 'center' }]}>
         <ActivityIndicator size="small" color="#1E6F5C" />
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{t.chartTitle}</Text>
      
      {chartData ? (
        <LineChart
          data={chartData}
          width={width - 40} // pad-20 each side
          height={220}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" }
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      ) : (
        <Text style={styles.chartEmpty}>Not enough historical data collected yet.</Text>
      )}

      {/* AI Health Explainer Box */}
      <View style={styles.aiSummaryBox}>
        <View style={styles.aiSummaryHeader}>
          <Ionicons name="sparkles" size={16} color="#8B5CF6" />
          <Text style={styles.aiSummaryTitle}>{t.aiTitle}</Text>
        </View>
        <Text style={styles.aiSummaryText}>{aiSummary}</Text>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F7FAF9",
    padding: 16,
  },

  securityBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },

  securityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  securityText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "600",
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
  },

  logoutText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },

  tamperBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  tamperTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B91C1C",
  },

  tamperText: {
    fontSize: 12,
    color: "#991B1B",
    marginTop: 2,
  },

  tamperIssue: {
    fontSize: 11,
    color: "#B91C1C",
    marginTop: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
  },

  cardTitle: {
    color: "#6B7280",
    fontSize: 13,
  },

  cardValue: {
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 6,
  },

  pill: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  note: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 6,
  },

  ohiBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
  },

  ohiValue: {
    fontSize: 40,
    fontWeight: "800",
  },

  ohiLabel: {
    color: "#6B7280",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 6,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  modalItem: {
    marginTop: 10,
    fontSize: 14,
  },

  modalButton: {
    marginTop: 20,
    backgroundColor: "#1E6F5C",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  chartContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center'
  },
  
  chartTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E6F5C",
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 5
  },

  chartEmpty: {
    padding: 20,
    color: "#9CA3AF",
    fontStyle: 'italic'
  },

  aiSummaryBox: {
    backgroundColor: "#F3F0FF", // Very light purple
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#EDE9FE"
  },

  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },

  aiSummaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6D28D9" // Purple
  },

  aiSummaryText: {
    fontSize: 14,
    color: "#4B5563",
    paddingHorizontal: 15,
    paddingBottom: 15,
    fontStyle: 'italic',
    lineHeight: 20
  },

  /* Market Price Card Styles */
  marketCard: {
    backgroundColor: "#DCFCE7",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  marketHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#047857",
  },
  marketRates: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  rateBox: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
    fontWeight: "600",
  },
  rateValuePrimary: {
    fontSize: 24,
    fontWeight: "800",
    color: "#166534",
  },
  rateDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  rateMinMax: {
    flex: 1,
    gap: 4,
  },
  rateSub: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  rateUnit: {
    fontSize: 11,
    color: "#047857",
    textAlign: "right",
    fontWeight: "600",
  },

  /* ── Advisory Engine Styles ── */
  advisorySection: {
    marginBottom: 20,
  },
  advisoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  advisoryTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#7C3AED",
  },
  advisoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderLeftWidth: 5,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  advisoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  advisoryAction: {
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
    flexWrap: "wrap",
  },
  advisoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  advisoryBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  advisoryReason: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
    marginBottom: 10,
  },
  advisoryMeta: {
    flexDirection: "row",
    gap: 12,
  },
  advisoryMetaItem: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
});