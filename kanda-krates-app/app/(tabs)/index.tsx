import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Modal,
  FlatList
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useLanguage, SUPPORTED_LANGUAGES, LANGUAGE_LABELS, LanguageCode } from "../../context/LanguageContext";

const { width, height } = Dimensions.get("window");

/* ================= TRANSLATIONS ================= */

const T: Record<LanguageCode, any> = {
  en: {
    badge: "🌱 Smart Farming AI",
    title: "Kanda Krates",
    tagline: "Monitor. Protect. Profit.",
    howHelp: "How we help you",
    features: ["Live Tracking", "Anti-Spoil", "SMS Alerts", "Expert Help"],
    button: "Get Started Now",
    selectLang: "Select Language"
  },
  hi: {
    badge: "🌱 स्मार्ट खेती AI",
    title: "कांदा क्रेट्स",
    tagline: "निगरानी. सुरक्षा. लाभ.",
    howHelp: "हम कैसे मदद करते हैं",
    features: ["लाइव निगरानी", "नास रोकथाम", "SMS अलर्ट", "विशेषज्ञ मदद"],
    button: "शुरू करें",
    selectLang: "भाषा चुनें"
  },
  mr: {
    badge: "🌱 स्मार्ट शेती AI",
    title: "कांदा क्रेट्स",
    tagline: "निगराणी. संरक्षण. नफा.",
    howHelp: "आम्ही कशी मदत करतो",
    features: ["थेट निरीक्षण", "नासाडी प्रतिबंध", "SMS सूचना", "तज्ज्ञ मदत"],
    button: "सुरू करा",
    selectLang: "भाषा निवडा"
  },
  ta: {
    badge: "🌱 ஸ்மார்ட் விவசாய AI",
    title: "கண்டா கிரேட்ஸ்",
    tagline: "கண்காணிப்பு. பாதுகாப்பு. லாபம்.",
    howHelp: "நாங்கள் எப்படி உதவுகிறோம்",
    features: ["நேரடி கண்காணிப்பு", "அழுகல் தடுப்பு", "SMS அறிவிப்பு", "நிபுணர் உதவி"],
    button: "தொடங்குங்கள்",
    selectLang: "மொழியைத் தேர்ந்தெடுக்கவும்"
  },
  te: {
    badge: "🌱 స్మార్ట్ వ్యవసాయ AI",
    title: "కందా క్రేట్స్",
    tagline: "పర్యవేక్షణ. రక్షణ. లాభం.",
    howHelp: "మేము ఎలా సహాయం చేస్తాము",
    features: ["ప్రత్యక్ష ట్రాకింగ్", "పాడవకుండా నివారణ", "SMS హెచ్చరికలు", "నిపుణుల సహాయం"],
    button: "ప్రారంభించండి",
    selectLang: "భాషను ఎంచుకోండి"
  },
  kn: {
    badge: "🌱 ಸ್ಮಾರ್ಟ್ ಕೃಷಿ AI",
    title: "ಕಂದಾ ಕ್ರೇಟ್ಸ್",
    tagline: "ಮೇಲ್ವಿಚಾರಣೆ. ರಕ್ಷಣೆ. ಲಾಭ.",
    howHelp: "ನಾವು ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇವೆ",
    features: ["ನೇರ ಟ್ರ್ಯಾಕಿಂಗ್", "ಹಾಳಾಗದಂತೆ ತಡೆಗಟ್ಟುವಿಕೆ", "SMS ಎಚ್ಚರಿಕೆಗಳು", "ತಜ್ಞರ ಸಹಾಯ"],
    button: "ಪ್ರಾರಂಭಿಸಿ",
    selectLang: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ"
  },
  ml: {
    badge: "🌱 സ്മാർട്ട് കൃഷി AI",
    title: "കണ്ട ക്രേറ്റ്സ്",
    tagline: "നിരീക്ഷണം. സംരക്ഷണം. ലാഭം.",
    howHelp: "ഞങ്ങൾ എങ്ങനെ സഹായിക്കുന്നു",
    features: ["തത്സമയ ട്രാക്കിംഗ്", "കേടാകുന്നത് തടയൽ", "SMS മുന്നറിയിപ്പുകൾ", "വിദഗ്ദ്ധ സഹായം"],
    button: "തുടങ്ങുക",
    selectLang: "ഭാഷ തിരഞ്ഞെടുക്കുക"
  },
  gu: {
    badge: "🌱 સ્માર્ટ ખેતી AI",
    title: "કાંદા ક્રેટ્સ",
    tagline: "દેખરેખ. રક્ષણ. નફો.",
    howHelp: "અમે કેવી રીતે મદદ કરીએ છીએ",
    features: ["લાઇવ ટ્રેકિંગ", "બગાડ અટકાવ", "SMS ચેતવણીઓ", "નિષ્ણાતની મદદ"],
    button: "શરૂ કરો",
    selectLang: "ભાષા પસંદ કરો"
  },
  pa: {
    badge: "🌱 ਸਮਾਰਟ ਖੇਤੀ AI",
    title: "ਕਾਂਡਾ ਕਰੇਟਸ",
    tagline: "ਨਿਗਰਾਨੀ. ਸੁਰੱਖਿਆ. ਮੁਨਾਫ਼ਾ.",
    howHelp: "ਅਸੀਂ ਕਿਵੇਂ ਮਦਦ ਕਰਦੇ ਹਾਂ",
    features: ["ਲਾਈਵ ਟਰੈਕਿੰਗ", "ਖਰਾਬ ਹੋਣ ਤੋਂ ਬਚਾਅ", "SMS ਅਲਰਟ", "ਮਾਹਰ ਦੀ ਮਦਦ"],
    button: "ਸ਼ੁਰੂ ਕਰੋ",
    selectLang: "ਭਾਸ਼ਾ ਚੁਣੋ"
  },
  bn: {
    badge: "🌱 স্মার্ট কৃষি AI",
    title: "কান্দা ক্রেটস",
    tagline: "নজরদারি. সুরক্ষা. লাভ.",
    howHelp: "আমরা কীভাবে সাহায্য করি",
    features: ["সরাসরি ট্র্যাকিং", "পচন রোধ", "SMS সতর্কতা", "বিশেষজ্ঞের সাহায্য"],
    button: "শুরু করুন",
    selectLang: "ভাষা নির্বাচন করুন"
  },
  or: {
    badge: "🌱 ସ୍ମାର୍ଟ କୃଷି AI",
    title: "କାନ୍ଦା କ୍ରେଟସ୍",
    tagline: "ତଦାରଖ. ସୁରକ୍ଷା. ଲାଭ.",
    howHelp: "ଆମେ କିପରି ସାହାଯ୍ୟ କରୁ",
    features: ["ଲାଇଭ୍ ଟ୍ରାକିଂ", "ନଷ୍ଟ ନିବାରଣ", "SMS ସତର୍କତା", "ବିଶେଷଜ୍ଞ ସାହାଯ୍ୟ"],
    button: "ଆରମ୍ଭ କରନ୍ତୁ",
    selectLang: "ଭାଷା ବାଛନ୍ତୁ"
  }
};

/* ================= COMPONENT ================= */

export default function Landing() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [langModalVisible, setLangModalVisible] = useState(false);
  
  const t = T[language];

  const Feature = ({ icon, textIndex }: { icon: any; textIndex: number }) => (
    <View style={styles.featureItem}>
      <LinearGradient
        colors={["#FFFFFF", "#F0F9F6"]}
        style={styles.featureGradient}
      >
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={24} color="#1E6F5C" />
        </View>
        <Text style={styles.featureText}>{t.features[textIndex]}</Text>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView>
          <View style={styles.content}>
            {/* Context Language Button */}
            <TouchableOpacity 
              style={styles.globalLangBtn}
              onPress={() => setLangModalVisible(true)}
            >
              <Ionicons name="language" size={18} color="#1E6F5C" />
              <Text style={styles.globalLangText}>{LANGUAGE_LABELS[language]}</Text>
              <Ionicons name="chevron-down" size={16} color="#1E6F5C" />
            </TouchableOpacity>

            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t.badge}</Text>
              </View>

              <Text style={styles.title}>
                {t.title.split(" ")[0]}{" "}
                <Text style={{ color: "#2A9D8F" }}>
                  {t.title.split(" ")[1]}
                </Text>
              </Text>

              <Text style={styles.subTitleText}>{t.tagline}</Text>
            </View>

            {/* ILLUSTRATION */}
            <View style={styles.illustrationContainer}>
              <LinearGradient
                colors={["rgba(30, 111, 92, 0.12)", "rgba(30, 111, 92, 0.05)"]}
                style={styles.illustrationCircle}
              >
                <Text style={{ fontSize: 80 }}>🧅</Text>
              </LinearGradient>
            </View>

            {/* FEATURES */}
            <View style={styles.gridContainer}>
              <Text style={styles.sectionLabel}>{t.howHelp}</Text>

              <View style={styles.grid}>
                <Feature icon="stats-chart-outline" textIndex={0} />
                <Feature icon="shield-checkmark-outline" textIndex={1} />
                <Feature icon="notifications-outline" textIndex={2} />
                <Feature icon="chatbubbles-outline" textIndex={3} />
              </View>
            </View>

            {/* CTA */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.mainButton}
                onPress={() => router.push("/login")}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#1E6F5C", "#2D917A"]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>{t.button}</Text>
                  <Ionicons name="arrow-forward" size={22} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal visible={langModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectLang}</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langOptionBtn,
                    language === item && styles.langOptionBtnActive
                  ]}
                  onPress={() => {
                    setLanguage(item);
                    setLangModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.langOptionText,
                    language === item && styles.langOptionTextActive
                  ]}>
                    {LANGUAGE_LABELS[item]}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  bgCircle: {
    position: "absolute",
    top: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: "#E2F1ED"
  },
  globalLangBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#E1F2EE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 40,
    gap: 4
  },
  globalLangText: {
    color: "#1E6F5C",
    fontWeight: "700",
    fontSize: 12,
  },
  content: { paddingHorizontal: 24 },
  header: { marginTop: 10, alignItems: "center" },
  badge: {
    backgroundColor: "#E1F2EE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12
  },
  badgeText: { color: "#1E6F5C", fontSize: 12, fontWeight: "700" },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#1A3C34"
  },
  subTitleText: { fontSize: 18, color: "#4B5563", fontWeight: "500" },
  illustrationContainer: {
    alignItems: "center",
    marginVertical: 24
  },
  illustrationCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center"
  },
  gridContainer: { marginTop: 10 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 15,
    textAlign: "center"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  featureItem: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden"
  },
  featureGradient: { padding: 20, alignItems: "center" },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  featureText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A3C34",
    textAlign: "center"
  },
  footer: { marginTop: 20, marginBottom: 30 },
  mainButton: { borderRadius: 20, overflow: "hidden" },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 12
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxHeight: "80%",
    padding: 24
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A3C34"
  },
  langOptionBtn: {
    flex: 1,
    margin: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#FAFAFA"
  },
  langOptionBtnActive: {
    borderColor: "#1E6F5C",
    backgroundColor: "#E1F2EE"
  },
  langOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563"
  },
  langOptionTextActive: {
    color: "#1E6F5C"
  }
});
