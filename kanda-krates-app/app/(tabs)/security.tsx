import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage, LanguageCode } from "../../context/LanguageContext";

const { width } = Dimensions.get("window");

/* ================= LANGUAGE ================= */

const T: Record<LanguageCode, {
  title: string;
  subtitle: string;
  footerLine: string;
  categories: { title: string; icon: string; color: string; tips: string[] }[];
}> = {
  en: {
    title: "Cyber Security",
    subtitle: "Protect your farm data & accounts",
    footerLine: "Kanda Krates uses secure encryption to protect your data",
    categories: [
      {
        title: "Password Safety",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "Use a strong password with at least 6 characters",
          "Never share your password with anyone",
          "Change your password every 3 months",
          "Don't use your name or phone number as password",
          "Use different passwords for different apps",
        ],
      },
      {
        title: "Scam Protection",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "Never share OTP with anyone on the phone",
          "Kanda Krates will never ask for your password via SMS",
          "Don't click unknown links in messages",
          "Verify callers before sharing farm data",
          "Report suspicious messages to admin",
        ],
      },
      {
        title: "Data Protection",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "Your sensor data is encrypted and protected",
          "Only authorized admins can view your data",
          "Log out after using shared devices",
          "Don't screenshot sensitive farm data",
          "Check the 🔒 icon on dashboard for secure connection",
        ],
      },
      {
        title: "Device Security",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "Keep your phone locked with PIN or fingerprint",
          "Update your phone's software regularly",
          "Only install apps from official stores",
          "Don't connect to unknown WiFi networks",
          "Enable 'Find My Device' in case of theft",
        ],
      },
    ],
  },
  hi: {
    title: "साइबर सुरक्षा",
    subtitle: "अपने खेत के डेटा और अकाउंट की सुरक्षा करें",
    footerLine: "कांदा क्रेट्स आपके डेटा की सुरक्षा के लिए एन्क्रिप्शन का उपयोग करता है",
    categories: [
      {
        title: "पासवर्ड सुरक्षा",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "कम से कम 6 अक्षरों वाला मजबूत पासवर्ड बनाएं",
          "कभी भी किसी को अपना पासवर्ड न बताएं",
          "हर 3 महीने में पासवर्ड बदलें",
          "अपना नाम या फोन नंबर पासवर्ड के रूप में न रखें",
          "अलग-अलग ऐप के लिए अलग पासवर्ड रखें",
        ],
      },
      {
        title: "धोखाधड़ी से बचाव",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "कभी भी फोन पर किसी को OTP न बताएं",
          "कांदा क्रेट्स कभी SMS से पासवर्ड नहीं मांगता",
          "अनजान लिंक पर क्लिक न करें",
          "डेटा साझा करने से पहले कॉलर की पहचान करें",
          "संदिग्ध संदेशों की रिपोर्ट करें",
        ],
      },
      {
        title: "डेटा सुरक्षा",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "आपका सेंसर डेटा एन्क्रिप्टेड और सुरक्षित है",
          "केवल अधिकृत प्रशासक ही आपका डेटा देख सकते हैं",
          "साझा डिवाइस पर उपयोग के बाद लॉगआउट करें",
          "संवेदनशील डेटा का स्क्रीनशॉट न लें",
          "डैशबोर्ड पर 🔒 आइकन से सुरक्षित कनेक्शन जांचें",
        ],
      },
      {
        title: "डिवाइस सुरक्षा",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "अपने फोन को PIN या फिंगरप्रिंट से लॉक रखें",
          "फोन का सॉफ्टवेयर नियमित रूप से अपडेट करें",
          "केवल आधिकारिक स्टोर से ऐप इंस्टॉल करें",
          "अनजान WiFi नेटवर्क से न जुड़ें",
          "चोरी की स्थिति में 'Find My Device' चालू रखें",
        ],
      },
    ],
  },
  mr: {
    title: "सायबर सुरक्षा",
    subtitle: "तुमच्या शेतीच्या डेटा आणि अकाउंटचे रक्षण करा",
    footerLine: "कांदा क्रेट्स तुमचा डेटा सुरक्षित ठेवण्यासाठी एन्क्रिप्शन वापरते",
    categories: [
      {
        title: "पासवर्ड सुरक्षा",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "किमान 6 अक्षरांचा मजबूत पासवर्ड वापरा",
          "कधीही कोणालाही तुमचा पासवर्ड सांगू नका",
          "दर 3 महिन्यांनी पासवर्ड बदला",
          "तुमचे नाव किंवा फोन नंबर पासवर्ड म्हणून वापरू नका",
          "वेगवेगळ्या ॲपसाठी वेगवेगळे पासवर्ड वापरा",
        ],
      },
      {
        title: "फसवणुकीपासून संरक्षण",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "कधीही फोनवर कोणालाही OTP सांगू नका",
          "कांदा क्रेट्स कधीही SMS द्वारे पासवर्ड मागत नाही",
          "अनोळखी लिंकवर क्लिक करू नका",
          "डेटा शेअर करण्यापूर्वी कॉलरची ओळख पटवा",
          "संशयास्पद संदेशांची तक्रार करा",
        ],
      },
      {
        title: "डेटा संरक्षण",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "तुमचा सेंसर डेटा एन्क्रिप्टेड आणि सुरक्षित आहे",
          "फक्त अधिकृत प्रशासकच तुमचा डेटा पाहू शकतात",
          "शेअर डिव्हाइस वापरल्यानंतर लॉगआउट करा",
          "संवेदनशील डेटाचा स्क्रीनशॉट घेऊ नका",
          "डॅशबोर्डवर 🔒 चिन्हाने सुरक्षित कनेक्शन तपासा",
        ],
      },
      {
        title: "डिव्हाइस सुरक्षा",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "तुमचा फोन PIN किंवा फिंगरप्रिंटने लॉक ठेवा",
          "फोनचे सॉफ्टवेअर नियमितपणे अपडेट करा",
          "फक्त अधिकृत स्टोअरमधून ॲप इन्स्टॉल करा",
          "अनोळखी WiFi नेटवर्कशी कनेक्ट होऊ नका",
          "चोरीच्या बाबतीत 'Find My Device' चालू ठेवा",
        ],
      },
    ],
  },
  ta: {
    title: "சைபர் பாதுகாப்பு",
    subtitle: "உங்கள் பண்ணை தரவு மற்றும் கணக்குகளை பாதுகாக்கவும்",
    footerLine: "உங்கள் தரவைப் பாதுகாக்க கண்டா கிரேட்ஸ் குறியாக்கத்தைப் பயன்படுத்துகிறது",
    categories: [
      {
        title: "கடவுச்சொல் பாதுகாப்பு",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "குறைந்தது 6 எழுத்துக்கள் கொண்ட வலுவான கடவுச்சொல் பயன்படுத்தவும்",
          "உங்கள் கடவுச்சொல்லை யாருடனும் பகிர வேண்டாம்",
          "ஒவ்வொரு 3 மாதங்களுக்கும் கடவுச்சொல் மாற்றவும்",
          "உங்கள் பெயர் அல்லது தொலைபேசி எண்ணை கடவுச்சொல்லாக பயன்படுத்தாதீர்கள்",
          "வெவ்வேறு பயன்பாடுகளுக்கு வெவ்வேறு கடவுச்சொற்களைப் பயன்படுத்தவும்",
        ],
      },
      {
        title: "மோசடி பாதுகாப்பு",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "தொலைபேசியில் யாருக்கும் OTP சொல்ல வேண்டாம்",
          "கண்டா கிரேட்ஸ் SMS மூலம் கடவுச்சொல் கேட்காது",
          "அறியாத இணைப்புகளை கிளிக் செய்யாதீர்கள்",
          "தரவு பகிரும் முன் அழைப்பாளரை சரிபார்க்கவும்",
          "சந்தேகத்திற்குரிய செய்திகளை புகாரளிக்கவும்",
        ],
      },
      {
        title: "தரவு பாதுகாப்பு",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "உங்கள் சென்சார் தரவு மறைகுறியாக்கப்பட்டு பாதுகாக்கப்படுகிறது",
          "அங்கீகரிக்கப்பட்ட நிர்வாகிகள் மட்டுமே உங்கள் தரவைப் பார்க்க முடியும்",
          "பகிரப்பட்ட சாதனங்களைப் பயன்படுத்திய பிறகு வெளியேறவும்",
          "முக்கியமான தரவின் திரைப்பிடிப்பு எடுக்காதீர்கள்",
          "டாஷ்போர்டில் 🔒 ஐகானை சரிபார்க்கவும்",
        ],
      },
      {
        title: "சாதன பாதுகாப்பு",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "உங்கள் தொலைபேசியை PIN அல்லது கைரேகையுடன் பூட்டவும்",
          "தொலைபேசி மென்பொருளை தொடர்ந்து புதுப்பிக்கவும்",
          "அதிகாரப்பூர்வ கடைகளிலிருந்து மட்டும் பயன்பாடுகளை நிறுவவும்",
          "அறியாத WiFi நெட்வொர்க்குகளுடன் இணைய வேண்டாம்",
          "திருட்டு நிலையில் 'Find My Device' இயக்கவும்",
        ],
      },
    ],
  },
  te: {
    title: "సైబర్ భద్రత",
    subtitle: "మీ వ్యవసాయ మరియు ఖాతా సమాచారాన్ని రక్షించండి",
    footerLine: "మీ డేటాను రక్షించడానికి కందా క్రేట్స్ ఎన్‌క్రిప్షన్‌ను ఉపయోగిస్తుంది",
    categories: [
      {
        title: "పాస్‌వర్డ్ భద్రత",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "కనీసం 6 అక్షరాలు ఉండే బలమైన పాస్‌వర్డ్‌ని ఉపయోగించండి",
          "మీ పాస్‌వర్డ్‌ను ఎవరికైనా షేర్ చేయకండి",
          "ప్రతి 3 నెలలకు మీ పాస్‌వర్డ్‌ను మార్చుకోండి",
          "మీ పేరు లేదా ఫోన్ నెంబర్‌ను పాస్‌వర్డ్‌గా ఉంచకండి",
          "వివిధ యాప్‌ల కోసం వివిధ పాస్‌వర్డ్‌లను వాడండి",
        ],
      },
      {
        title: "మోసం నుండి రక్షణ",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "ఫోన్‌లో ఎవరికైనా OTP ఇవ్వకండి",
          "కందా క్రేట్స్ SMS ద్వారా పాస్‌వర్డ్ ఎప్పుడూ అడగదు",
          "మెసేజ్‌లలోని తెలియని లింక్‌లను క్లిక్ చేయకండి",
          "వ్యవసాయ డేటా షేర్ చేసే ముందు కాలర్‌ని నిర్ధారించండి",
          "అనుమానాస్పద మెసేజ్‌లను అడ్మిన్‌కు రిపోర్ట్ చేయండి",
        ],
      },
      {
        title: "డేటా రక్షణ",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "మీ సెన్సార్ డేటా ఎన్‌క్రిప్ట్ చేయబడింది మరియు సురక్షితం",
          "అధికారిక అడ్మిన్‌లు మాత్రమే మీ డేటాను చూడగలరు",
          "పబ్లిక్ ఫోన్లలో వాడిన తర్వాత లాగ్అవుట్ చేయండి",
          "సెన్సిటివ్ డేటాను స్క్రీన్‌షాట్ చేయకండి",
          "సురక్షిత కనెక్షన్ కోసం డాష్‌బోర్డ్‌లో 🔒 ఐకాన్‌ను చూడండి",
        ],
      },
      {
        title: "పరికరం భద్రత",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "మీ ఫోన్‌ని పిన్ లేదా వేలిముద్రతో లాక్ చేసి ఉంచండి",
          "ఫోన్ సాఫ్ట్‌వేర్‌ను క్రమం తప్పకుండా అప్‌డేట్ చేయండి",
          "అధికారిక స్టోర్లలో మాత్రమే యాప్‌లను ఇన్‌స్టాల్ చేయండి",
          "తెలియని WiFi నెట్‌వర్క్‌లకు కనెక్ట్ కావొద్దు",
          "దొంగతనం జరిగినట్లయితే 'Find My Device' ప్రారంభించండి",
        ],
      },
    ],
  },
  kn: {
    title: "ಸೈಬರ್ ಸುರಕ್ಷತೆ",
    subtitle: "ನಿಮ್ಮ ಕೃಷಿ ಮಾಹಿತಿ ಮತ್ತು ಖಾತೆಗಳನ್ನು ರಕ್ಷಿಸಿ",
    footerLine: "ಕಂದಾ ಕ್ರೇಟ್ಸ್ ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ರಕ್ಷಿಸಲು ಎನ್‌ಕ್ರಿಪ್ಶನ್ ಬಳಸುತ್ತದೆ",
    categories: [
      {
        title: "ಪಾಸ್‌ವರ್ಡ್ ಸುರಕ್ಷತೆ",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳನ್ನು ಒಳಗೊಂಡ ಬಲವಾದ ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ",
          "ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ಯಾರಿಗಾದರೂ ಹಂಚಬೇಡಿ",
          "ಪ್ರತಿ 3 ತಿಂಗಳಿಗೊಮ್ಮೆ ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ",
          "ಪಾಸ್‌ವರ್ಡ್‌ನಂತೆ ನಿಮ್ಮ ಹೆಸರು ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ಬಳಸಬೇಡಿ",
          "ವಿವಿಧ ಆ್ಯಪ್‌ಗಳಿಗಾಗಿ ವಿವಿಧ ಪಾಸ್‌ವರ್ಡ್‌ಗಳನ್ನು ಬಳಸಿ",
        ],
      },
      {
        title: "ವಂಚನೆಯಿಂದ ರಕ್ಷಣೆ",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "ಫೋನ್‌ನಲ್ಲಿ ಯಾರಿಗಾದರೂ OTP ಹಂಚಿಕೊಳ್ಳಬೇಡಿ",
          "ಕಂದಾ ಕ್ರೇಟ್ಸ್ SMS ಮೂಲಕ ಪಾಸ್‌ವರ್ಡ್ ಕೇಳುವುದಿಲ್ಲ",
          "ಮೆಸೇಜ್‌ಗಳಲ್ಲಿನ ಅಜ್ಞಾತ ಲಿಂಕ್‌ಗಳನ್ನು ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ",
          "ಮಾಹಿತಿ ಹಂಚಿಕೊಳ್ಳುವ ಮೊದಲು ಕಾಲರ್ ಸಂಪರ್ಕವನ್ನು ದೃಢಪಡಿಸಿ",
          "ಅನುಮಾನಾಸ್ಪದ ಮೆಸೇಜ್‌ಗಳನ್ನು ರಿಪೋರ್ಟ್ ಮಾಡಿ",
        ],
      },
      {
        title: "ಡೇಟಾ ರಕ್ಷಣೆ",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "ನಿಮ್ಮ ಸೆನ್ಸಾರ್ ಡೇಟಾ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿದೆ",
          "ಅಧಿಕೃತ ಅಡ್ಮಿನ್‌ಗಳು ಮಾತ್ರ ನಿಮ್ಮ ಡೇಟಾವನ್ನು ನೋಡಬಹುದು",
          "ಹಂಚಿದ ಫೋನ್‌ಗಳಲ್ಲಿ ಬಳಸಿದ ನಂತರ ಲಾಗೌಟ್ ಮಾಡಿ",
          "ಸೆನ್ಸಿಟಿವ್ ಡೇಟಾವನ್ನು ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಮಾಡಬೇಡಿ",
          "ಸುರಕ್ಷಿತ ಸಂಪರ್ಕಕ್ಕಾಗಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ 🔒 ಐಕಾನ್ ಪರಿಶೀಲಿಸಿ",
        ],
      },
      {
        title: "ಸಾಧನ ರಕ್ಷಣೆ",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "ನಿಮ್ಮ ಫೋನ್ ಅನ್ನು ಪಿನ್ ಅಥವಾ ಬೆರಳುಗುರುತಿನೊಂದಿಗೆ ಲಾಕ್ ಮಾಡಿಡಿ",
          "ನಿಮ್ಮ ಫೋನ್‌ನ ಸಾಫ್ಟ್‌ವೇರ್‌ ಅನ್ನು ನಿಯಮಿತವಾಗಿ ಅಪ್‌ಡೇಟ್‌ ಮಾಡಿ",
          "ಅಧಿಕೃತ ಸ್ಟೋರ್‌ಗಳಿಂದ ಮಾತ್ರ ಆ್ಯಪ್‌ಗಳನ್ನು ಇನ್‌ಸ್ಟಾಲ್‌ ಮಾಡಿ",
          "ಅಜ್ಞಾತ ವೈಫೈ ನೆಟ್‌ವರ್ಕ್‌ಗಳಿಗೆ ಸಂಪರ್ಕಿಸಬೇಡಿ",
          "ಕಳುವಾವಣೆಯ ಸಂದರ್ಭದಲ್ಲಿ 'Find My Device' ತಂತ್ರವನ್ನು ಬಳಸಿ",
        ],
      },
    ],
  },
  ml: {
    title: "സൈബർ സുരക്ഷ",
    subtitle: "നിങ്ങളുടെ ഫാം വിവരങ്ങളും അക്കൗണ്ടുകളും പരിരക്ഷിക്കുക",
    footerLine: "വിവരങ്ങൾ സുരക്ഷിതമാക്കാൻ കണ്ട ക്രേറ്റ്സ് എൻക്രിപ്ഷൻ ഉപയോഗിക്കുന്നു",
    categories: [
      {
        title: "പാസ്‌വേഡ് സുരക്ഷ",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "കുറഞ്ഞത് 6 അക്ഷരങ്ങളുള്ള പാസ്‌വേഡ് ഉപയോഗിക്കുക",
          "പാസ്‌വേഡ് ആരുമായി പങ്കിടരുത്",
          "ഓരോ 3 മാസത്തിലും പാസ്‌വേഡ് മാറ്റുക",
          "പാസ്‌വേഡായി നിങ്ങളുടെ പേരോ ഫോൺ നമ്പറോ നൽകരുത്",
          "മറ്റ് ആപ്പുകൾക്കായി വ്യത്യസ്ത പാസ്‌വേഡുകൾ ഉപയോഗിക്കുക",
        ],
      },
      {
        title: "തട്ടിപ്പിൽ നിന്നുള്ള സംരക്ഷണം",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "ഫോണിൽ ആരോടും OTP പങ്കിടരുത്",
          "കണ്ട ക്രേറ്റ്സ് ഒരിക്കലും SMS വഴി പാസ്‌വേഡ് ചോദിക്കില്ല",
          "സന്ദേശങ്ങളിലെ അപരിചിത ലിങ്കുകളിൽ ക്ലിക്കുചെയ്യരുത്",
          "വിവരങ്ങൾ നൽകുന്നതിനുമുമ്പ് വിളിക്കുന്നവരെ സ്ഥിരീകരിക്കുക",
          "സംശയാസ്പദമായ സന്ദേശങ്ങൾ അഡ്മിനിൽ റിപ്പോർട്ടുചെയ്യുക",
        ],
      },
      {
        title: "വിവര സംരക്ഷണം",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "നിങ്ങളുടെ സെൻസർ ഡാറ്റ എൻക്രിപ്റ്റ് ചെയ്തതും സുരക്ഷിതവുമാണ്",
          "അധികാരമുള്ള അഡ്മിനുകൾക്ക് മാത്രം വിവരങ്ങൾ കാണാം",
          "മറ്റുള്ളവരുടെ ഉപകരണങ്ങളിൽ നിന്നും ലോഗ് ഔട്ട് ചെയ്യുക",
          "രഹസ്യ സ്വഭാവ വിവരങ്ങളുടെ സ്ക്രീൻഷോട്ട് എടുക്കരുത്",
          "സുരക്ഷിത കണക്ഷനായി ഡാഷ്‌ബോർഡിൽ 🔒 ചിഹ്നം പരിശോധിക്കുക",
        ],
      },
      {
        title: "ഉപകരണ സുരക്ഷ",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "ഫോൺ ഒരു PIN അല്ലെങ്കിൽ വിരലടയാളം ഉപയോഗിച്ച് ലോക്കുചെയ്യുക",
          "ഫോണിന്റെ സോഫ്റ്റ്വെയർ അപ്ഡേറ്റ് ചെയ്യുക",
          "ഔദ്യോഗിക സ്റ്റോറുകളിൽ നിന്നുള്ള ആപ്പുകൾ മാത്രം ഇൻസ്റ്റാൾ ചെയ്യുക",
          "അജ്ഞാതമായ വൈഫൈ ഉപയോഗിക്കരുത്",
          "ഫോൺ നഷ്ടപ്പെട്ടാൽ ഉപയോഗപ്രദമാകാൻ 'Find My Device' ഉപയോഗിക്കുക",
        ],
      },
    ],
  },
  gu: {
    title: "સાયબર સુરક્ષા",
    subtitle: "તમારા ફાર્મ ડેટા અને એકાઉન્ટને સુરક્ષિત કરો",
    footerLine: "તમારા ડેટાને સુરક્ષિત કરવા માટે કાંદા ક્રેટ્સ એન્ક્રિપ્શનનો ઉપયોગ કરે છે",
    categories: [
      {
        title: "પાસવર્ડ સુરક્ષા",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "ઓછામાં ઓછા 6 અક્ષરોવાળા મજબૂત પાસવર્ડનો ઉપયોગ કરો",
          "તમારો પાસવર્ડ કોઈની સાથે ક્યારેય શેર કરશો નહીં",
          "દર 3 મહિને પાસવર્ડ બદલો",
          "તમારા નામ અથવા ફોન નંબરનો પાસવર્ડ તરીકે ઉપયોગ કરશો નહીં",
          "અલગ-અલગ એપ્સ માટે અલગ પાસવર્ડ વાપરો",
        ],
      },
      {
        title: "સ્કેમ પ્રોટેક્શન",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "ફોન પર ક્યારેય કોઈને OTP ન આપો",
          "કાંદા ક્રેટ્સ ક્યારેય SMS દ્વારા પાસવર્ડ માંગતું નથી",
          "સંદેશાઓમાં અજાણી લિંક પર ક્લિક કરશો નહીં",
          "ડેટા આપતા પહેલા કૉલરની ચકાસણી કરો",
          "શંકાસ્પદ સંદેશો રિપોર્ટ કરો",
        ],
      },
      {
        title: "ડેટા પ્રોટેક્શન",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "તમારો સેન્સર ડેટા એન્ક્રિપ્ટેડ અને સુરક્ષિત છે",
          "માત્ર અધિકૃત એડમિન તમારો ડેટા જોઈ શકે છે",
          "પોતે શેર કરેલ અન્ય ઉપકરણો પછી લૉગઆઉટ કરો",
          "સંવેદનશીલ ડેટાનો સ્ક્રીનશૉટ લેશો નહીં",
          "સુરક્ષિત કનેક્શન માટે ડેશબોર્ડ પર 🔒 આઇકન તપાસો",
        ],
      },
      {
        title: "ઉપકરણ સુરક્ષા",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "તમારો ફોન PIN અથવા ફિંગરપ્રિન્ટથી લોક રાખો",
          "તમારા ફોનનું સોફ્ટવેર નિયમિત અપડેટ કરો",
          "માત્ર અધિકૃત સ્ટોર્સમાંથી એપ્સ ઇન્સ્ટોલ કરો",
          "અજાણ્યા વાઇફાઇ સાથે કનેક્ટ થશો નહીં",
          "ચોરી થાય ત્યારે ઉપયોગી થવા માટે 'Find My Device' ચાલુ રાખો",
        ],
      },
    ],
  },
  pa: {
    title: "ਸਾਈਬਰ ਸੁਰੱਖਿਆ",
    subtitle: "ਆਪਣੇ ਖੇਤੀ ਡੇਟਾ ਅਤੇ ਖਾਤਿਆਂ ਦੀ ਸੁਰੱਖਿਆ ਕਰੋ",
    footerLine: "ਤੁਹਾਡੇ ਡੇਟਾ ਨੂੰ ਸੁਰੱਖਿਅਤ ਕਰਨ ਲਈ ਕਾਂਡਾ ਕਰੇਟਸ ਏਨਕ੍ਰਿਪਸ਼ਨ ਦੀ ਵਰਤੋਂ ਕਰਦਾ ਹੈ",
    categories: [
      {
        title: "ਪਾਸਵਰਡ ਸੁਰੱਖਿਆ",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "ਘੱਟੋ ਘੱਟ 6 ਅੱਖਰਾਂ ਵਾਲੇ ਮਜ਼ਬੂਤ ​​ਪਾਸਵਰਡ ਦੀ ਵਰਤੋਂ ਕਰੋ",
          "ਕਦੇ ਵੀ ਕਿਸੇ ਨਾਲ ਆਪਣਾ ਪਾਸਵਰਡ ਸਾਂਝਾ ਨਾ ਕਰੋ",
          "ਹਰ 3 ਮਹੀਨਿਆਂ ਬਾਅਦ ਪਾਸਵਰਡ ਬਦਲੋ",
          "ਆਪਣਾ ਨਾਮ ਜਾਂ ਫ਼ੋਨ ਨੰਬਰ ਪਾਸਵਰਡ ਵਜੋਂ ਨਾ ਵਰਤੋ",
          "ਵੱਖ-ਵੱਖ ਐਪਾਂ ਲਈ ਵੱਖਰੇ ਪਾਸਵਰਡ ਰੱਖੋ",
        ],
      },
      {
        title: "ਘੋਟਾਲੇ ਤੋਂ ਬਚਾਅ",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "ਕਿਸੇ ਨਾਲ ਵੀ ਫ਼ੋਨ 'ਤੇ OTP ਸਾਂਝਾ ਨਾ ਕਰੋ",
          "ਕਾਂਡਾ ਕਰੇਟਸ ਕਦੇ ਵੀ SMS ਰਾਹੀਂ ਪਾਸਵਰਡ ਨਹੀਂ ਮੰਗਦਾ",
          "ਸੰਦੇਸ਼ਾਂ ਵਿਚਲੇ ਅਣਜਾਣ ਲਿੰਕਾਂ 'ਤੇ ਕਲਿੱਕ ਨਾ ਕਰੋ",
          "ਡੇਟਾ ਦੇਣ ਤੋਂ ਪਹਿਲਾਂ ਕਾਲ ਕਰਨ ਵਾਲੇ ਦੀ ਪਛਾਣ ਕਰੋ",
          "ਸ਼ੱਕੀ ਸੁਨੇਹਿਆਂ ਦੀ ਰਿਪੋਰਟ ਕਰੋ",
        ],
      },
      {
        title: "ਡੇਟਾ ਸੁਰੱਖਿਆ",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "ਤੁਹਾਡਾ ਸੈਂਸਰ ਡੇਟਾ ਐਨਕ੍ਰਿਪਟਡ ਅਤੇ ਸੁਰੱਖਿਅਤ ਹੈ",
          "ਸਿਰਫ਼ ਅਧਿਕਾਰਤ ਐਡਮਿਨ ਹੀ ਤੁਹਾਡਾ ਡੇਟਾ ਦੇਖ ਸਕਦੇ ਹਨ",
          "ਦੂਜਿਆਂ ਦੀਆਂ ਡਿਵਾਈਸਾਂ ਦੀ ਵਰਤੋਂ ਤੋਂ ਬਾਅਦ ਲੌਗਆਉਟ ਕਰੋ",
          "ਸੰਵੇਦਨਸ਼ੀਲ ਡੇਟਾ ਦਾ ਸਕਰੀਨਸ਼ਾਟ ਨਾ ਲਓ",
          "ਸੁਰੱਖਿਅਤ ਕਨੈਕਸ਼ਨ ਲਈ ਡੈਸ਼ਬੋਰਡ 'ਤੇ 🔒 ਆਈਕਨ ਦੇਖੋ",
        ],
      },
      {
        title: "ਡਿਵਾਈਸ ਸੁਰੱਖਿਆ",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "ਆਪਣੇ ਫ਼ੋਨ ਨੂੰ ਪਿੰਨ ਜਾਂ ਫਿੰਗਰਪ੍ਰਿੰਟ ਨਾਲ ਲਾਕ ਰੱਖੋ",
          "ਫ਼ੋਨ ਦੇ ਸਾਫਟਵੇਅਰ ਨੂੰ ਲਗਾਤਾਰ ਅੱਪਡੇਟ ਕਰੋ",
          "ਸਿਰਫ਼ ਅਸਲ ਸਟੋਰਾਂ ਤੋਂ ਹੀ ਐਪਸ ਇੰਸਟਾਲ ਕਰੋ",
          "ਅਣਜਾਣ ਵਾਈਫਾਈ ਨੈੱਟਵਰਕ ਨਾਲ ਨਾ ਜੁੜੋ",
          "ਚੋਰੀ ਦੀ ਕਮੀ ਵਿੱਚ 'Find My Device' ਚਾਲੂ ਰੱਖੋ",
        ],
      },
    ],
  },
  bn: {
    title: "সাইবার নিরাপত্তা",
    subtitle: "আপনার ফার্মের ডাটা এবং অ্যাকাউন্ট নিরাপদ রাখুন",
    footerLine: "কান্দা ক্রেটস আপনার ডাটা সুরক্ষিত রাখতে এনক্রিপশন ব্যবহার করে",
    categories: [
      {
        title: "পাসওয়ার্ড নিরাপত্তা",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "কমপক্ষে 6 অক্ষরের একটি শক্তিশালী পাসওয়ার্ড ব্যবহার করুন",
          "আপনার পাসওয়ার্ড কখনই কারও সাথে শেয়ার করবেন না",
          "প্রতি 3 মাসে পাসওয়ার্ড পরিবর্তন করুন",
          "আপনার নাম বা ফোন নম্বর পাসওয়ার্ড হিসেবে রাখবেন না",
          "বিভিন্ন অ্যাপের জন্য আলাদা পাসওয়ার্ড ব্যবহার করুন",
        ],
      },
      {
        title: "প্রতারণা থেকে সুরক্ষা",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "কখনও ফোনে কাউকে OTP বলবেন না",
          "কান্দা ক্রেটস কখনও SMS এর মাধ্যমে পাসওয়ার্ড চাইবে না",
          "ম্যাসেজের অজানা লিঙ্কে ক্লিক করবেন না",
          "ডাটা শেয়ার করার আগে কলার যাচাই করুন",
          "সন্দেহজনক মেসেজের রিপোর্ট করুন",
        ],
      },
      {
        title: "ডাটা সুরক্ষা",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "আপনার সেন্সর ডাটা এনক্রিপ্ট করা এবং নিরাপদ",
          "শুধুমাত্র অনুমোদিত অ্যাডমিনরা আপনার ডাটা দেখতে পারবেন",
          "শেয়ার করা ডিভাইসে ব্যবহার শেষে লগআউট করুন",
          "গোপন তথ্যের স্ক্রিনশট নেবেন না",
          "নিরাপদ সংযোগ বুঝতে ড্যাশবোর্ডে 🔒 আইকন চেক করুন",
        ],
      },
      {
        title: "ডিভাইস নিরাপত্তা",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "আপনার ফোন পিন বা ফিঙ্গারপ্রিন্ট দিয়ে লক রাখুন",
          "ফোনের সফটওয়্যার নিয়মিত আপডেট করুন",
          "শুধু অফিশিয়াল স্টোর থেকে অ্যাপ ইন্সটল করুন",
          "অজানা ওয়াইফাই নেটওয়ার্কে যুক্ত হবেন না",
          "চুরির ক্ষেত্রে কাজে লাগতে 'Find My Device' চালু রাখুন",
        ],
      },
    ],
  },
  or: {
    title: "ସାଇବର୍ ସୁରକ୍ଷା",
    subtitle: "ଆପଣଙ୍କ ଫାର୍ମ ଡାଟା ଏବଂ ଆକାଉଣ୍ଟକୁ ସୁରକ୍ଷିତ ରଖନ୍ତୁ",
    footerLine: "ଆପଣଙ୍କ ଡାଟାକୁ ସୁରକ୍ଷିତ କରିବା ପାଇଁ କାନ୍ଦା କ୍ରେଟସ୍ ଏନକ୍ରିପ୍ସନ୍ ବ୍ୟବହାର କରେ",
    categories: [
      {
        title: "ପାସୱାର୍ଡ୍ ସୁରକ୍ଷା",
        icon: "lock-closed",
        color: "#6366F1",
        tips: [
          "କମସେ କମ୍ 6ଟି ଅକ୍ଷର ଥିବା ଏକ ମଜବୁତ୍ ପାସୱାର୍ଡ୍ ବ୍ୟବହାର କରନ୍ତୁ",
          "କେବେବି ଆପଣଙ୍କ ପାସୱାର୍ଡ୍ କାହା ସହିତ ସେୟାର୍ କରନ୍ତୁ ନାହିଁ",
          "ପ୍ରତି 3 ମାସରେ ପାସୱାର୍ଡ୍ ବଦଳାନ୍ତୁ",
          "ପାସୱାର୍ଡ୍ ଭିତରେ ଆପଣଙ୍କ ନାମ କିମ୍ବା ଫୋନ୍ ନମ୍ବର ରଖନ୍ତୁ ନାହିଁ",
          "ଅଲଗା ଅଲଗା ଆପ୍ ପାଇଁ ଅଲଗା ପାସୱାର୍ଡ୍ ବ୍ୟବହାର କରନ୍ତୁ",
        ],
      },
      {
        title: "ଠକାମିରୁ ସୁରକ୍ଷା",
        icon: "warning",
        color: "#F59E0B",
        tips: [
          "କାହାକୁ ଫୋନରେ OTP କୁହନ୍ତୁ ନାହିଁ",
          "କାନ୍ଦା କ୍ରେଟସ୍ କେବେବି SMS ମାଧ୍ୟମରେ ପାସୱାର୍ଡ୍ ମାଗେନାହିଁ",
          "ମେସେଜରେ ଥିବା ଅଜଣା ଲିଙ୍କରେ କ୍ଲିକ୍ କରନ୍ତୁ ନାହିଁ",
          "ତଥ୍ୟ ଦେବା ପୂର୍ବରୁ କଲର ଯାଞ୍ଚ କରନ୍ତୁ",
          "ସନ୍ଦେହଜନକ ମେସେଜ୍ ରିପୋର୍ଟ କରନ୍ତୁ",
        ],
      },
      {
        title: "ଡାଟା ସୁରକ୍ଷା",
        icon: "shield-checkmark",
        color: "#10B981",
        tips: [
          "ଆପଣଙ୍କ ସେନ୍ସର ଡାଟା ଏନକ୍ରିପ୍ଟ ହୋଇଛି ଏବଂ ସୁରକ୍ଷିତ",
          "କେବଳ ଅନୁମୋଦିତ ଆଡମିନ୍‌ମାନେ ଆପଣଙ୍କ ଡାଟା ଦେଖିପାରିବେ",
          "ଅନ୍ୟମାନଙ୍କ ଡିଭାଇସ୍ ବ୍ୟବହାର ପରେ ଲଗଆଉଟ୍ କରନ୍ତୁ",
          "ଗୋପନୀୟ ତଥ୍ୟର ସ୍କ୍ରିନସଟ୍ ନିଅନ୍ତୁ ନାହିଁ",
          "ସୁରକ୍ଷିତ କନେକ୍ସନ୍ ପାଇଁ ଡ୍ୟାସବୋର୍ଡରେ 🔒 ଆଇକନ୍ ଯାଞ୍ଚ କରନ୍ତୁ",
        ],
      },
      {
        title: "ଡିଭାଇସ୍ ସୁରକ୍ଷା",
        icon: "phone-portrait",
        color: "#EC4899",
        tips: [
          "ଆପଣଙ୍କ ଫୋନକୁ ପିନ୍ କିମ୍ବା ଫିଙ୍ଗରପ୍ରିଣ୍ଟ ସହିତ ଲକ୍ ରଖନ୍ତୁ",
          "ଫୋନର ସଫ୍ଟୱେର୍ ନିୟମିତ ଅପଡେଟ୍ କରନ୍ତୁ",
          "କେବଳ ଅଫିସିଆଲ୍ ଷ୍ଟୋରରୁ ଆପ୍ ଇନଷ୍ଟଲ୍ କରନ୍ତୁ",
          "ଅଜଣା ୱାଇଫାଇ ନେଟୱାର୍କ ସହିତ ସଂଯୋଗ କରନ୍ତୁ ନାହିଁ",
          "ଚୋରି ହେବା ସ୍ଥିତିରେ ସାହାଯ୍ୟ ପାଇଁ 'Find My Device' ଅନ୍ ରଖନ୍ତୁ",
        ],
      },
    ],
  },
};

/* ================= COMPONENT ================= */

export default function SecurityScreen() {
  const { language } = useLanguage();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const t = T[language];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={["#1E6F5C", "#2D917A"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark" size={36} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
      </LinearGradient>

      {/* Categories */}
      {t.categories.map((cat, idx) => (
        <View key={idx} style={styles.categoryCard}>
          {/* Category Header */}
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() =>
              setExpandedIdx(expandedIdx === idx ? null : idx)
            }
            activeOpacity={0.7}
          >
            <View style={[styles.catIconCircle, { backgroundColor: cat.color + "15" }]}>
              <Ionicons name={cat.icon as any} size={22} color={cat.color} />
            </View>
            <Text style={styles.categoryTitle}>{cat.title}</Text>
            <Ionicons
              name={expandedIdx === idx ? "chevron-up" : "chevron-down"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {/* Tips (expandable) */}
          {expandedIdx === idx && (
            <View style={styles.tipsContainer}>
              {cat.tips.map((tip, tipIdx) => (
                <View key={tipIdx} style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      {/* Footer Badge */}
      <View style={styles.footerBadge}>
        <Ionicons name="lock-closed" size={14} color="#16A34A" />
        <Text style={styles.footerText}>
          {t.footerLine}
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF9",
  },

  headerGradient: {
    padding: 30,
    paddingTop: 50,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16
  },

  headerIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
  },

  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },

  categoryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 1,
  },

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },

  catIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  tipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },

  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },

  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },

  footerBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 20,
    gap: 6,
    paddingHorizontal: 16
  },

  footerText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center"
  },
});
