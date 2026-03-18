import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import { useLanguage, SUPPORTED_LANGUAGES, LANGUAGE_LABELS, LanguageCode } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

// Google Client IDs — configure in Google Cloud Console for each platform
const GOOGLE_WEB_CLIENT_ID =
  "619303753666-bqf6p437o31njjit6b65v036f42t98md.apps.googleusercontent.com";
// iOS: Create an "iOS" OAuth client ID in Google Cloud Console, then paste it here
const GOOGLE_IOS_CLIENT_ID = "656747164760-s3ncaco65qpr74a8sa0a9nr9obdsig8r.apps.googleusercontent.com";
const GOOGLE_ANDRIOD_CLIENT_ID = "656747164760-pvt6d5fksilb2mgbcs00fe3gf7vfqns2.apps.googleusercontent.com";

// 11 LANGUAGES
const TEXT: Record<LanguageCode, {
  title: string;
  subtitle: string;
  farmer: string;
  admin: string;
  google: string;
  footer: string;
  selectLang: string;
}> = {
  en: {
    title: "Welcome to Kanda Krates",
    subtitle: "Monitor, Protect, and Profit with Smart Farming AI",
    farmer: "Farmer Login",
    admin: "Admin Login",
    google: "Sign in with Google",
    footer: "Empowering Farmers Everywhere",
    selectLang: "Select Language"
  },
  hi: {
    title: "कांदा क्रेट्स में आपका स्वागत है",
    subtitle: "स्मार्ट खेती एआई के साथ निगरानी करें, सुरक्षा करें और लाभ कमाएं",
    farmer: "किसान लॉगिन",
    admin: "प्रशासक लॉगिन",
    google: "गूगल के साथ साइन इन करें",
    footer: "हर जगह किसानों को सशक्त बनाना",
    selectLang: "भाषा चुनें"
  },
  mr: {
    title: "कांदा क्रेट्समध्ये आपले स्वागत आहे",
    subtitle: "स्मार्ट शेती एआयसह निरीक्षण करा, संरक्षण करा आणि नफा कमवा",
    farmer: "शेतकरी लॉगिन",
    admin: "प्रशासक लॉगिन",
    google: "गूगलसह साइन इन करा",
    footer: "शेतकऱ्यांना सर्वत्र सशक्त बनवणे",
    selectLang: "भाषा निवडा"
  },
  ta: {
    title: "கண்டா கிரேட்ஸுக்கு வரவேற்கிறோம்",
    subtitle: "ஸ்மார்ட் விவசாய AI உடன் கண்காணிக்கவும், பாதுகாக்கவும், லாபம் பெறவும்",
    farmer: "விவசாயி உள்நுழைவு",
    admin: "நிர்வாகி உள்நுழைவு",
    google: "கூகிளுடன் உள்நுழைக",
    footer: "எங்கும் விவசாயிகளை அதிகாரமளித்தல்",
    selectLang: "மொழியைத் தேர்ந்தெடுக்கவும்"
  },
  te: {
    title: "కందా క్రేట్స్ కు స్వాగతం",
    subtitle: "స్మార్ట్ వ్యవసాయ AI తో పర్యవేక్షణ చేయండి, రక్షించండి మరియు లాభాలు పొందండి",
    farmer: "రైతు లాగిన్",
    admin: "అడ్మిన్ లాగిన్",
    google: "గూగుల్ తో సైన్ ఇన్ చేయండి",
    footer: "అన్నిచోట్లా రైతులను శక్తివంతం చేయడం",
    selectLang: "భాషను ఎంచుకోండి"
  },
  kn: {
    title: "ಕಂದಾ ಕ್ರೇಟ್ಸ್‌ಗೆ ಸುಸ್ವಾಗತ",
    subtitle: "ಸ್ಮಾರ್ಟ್ ಕೃಷಿ AI ಜೊತೆಗೆ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ, ರಕ್ಷಿಸಿ ಮತ್ತು ಲಾಭಗಳಿಸಿ",
    farmer: "ರೈತ ಲಾಗಿನ್",
    admin: "ನಿರ್ವಾಹಕ ಲಾಗಿನ್",
    google: "ಗೂಗಲ್‌ನೊಂದಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    footer: "ಎಲ್ಲೆಡೆ ರೈತರನ್ನು ಸಬಲೀಕರಣಗೊಳಿಸುವುದು",
    selectLang: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ"
  },
  ml: {
    title: "കണ്ട ക്രേറ്റ്സിലേക്ക് സ്വാഗതം",
    subtitle: "സ്മാർട്ട് കൃഷി AI വഴി നിരീക്ഷിക്കുക, സംരക്ഷിക്കുക, ലാഭം നേടുക",
    farmer: "കർഷക ലോഗിൻ",
    admin: "അഡ്മിൻ ലോഗിൻ",
    google: "ഗൂഗിൾ ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക",
    footer: "എല്ലായിടത്തുമുള്ള കർഷകരെ ശാക്തീകരിക്കുന്നു",
    selectLang: "ഭാഷ തിരഞ്ഞെടുക്കുക"
  },
  gu: {
    title: "કાંદા ક્રેટ્સમાં આપનું સ્વાગત છે",
    subtitle: "સ્માર્ટ ખેતી AI સાથે દેખરેખ રાખો, રક્ષણ કરો અને નફો કમાઓ",
    farmer: "ખેડૂત લૉગિન",
    admin: "એડમિન લૉગિન",
    google: "ગૂગલ સાથે સાઇન ઇન કરો",
    footer: "બધે ખેડૂતોને સશક્તિકરણ",
    selectLang: "ભાષા પસંદ કરો"
  },
  pa: {
    title: "ਕਾਂਡਾ ਕਰੇਟਸ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",
    subtitle: "ਸਮਾਰਟ ਖੇਤੀ AI ਨਾਲ ਨਿਗਰਾਨੀ ਕਰੋ, ਸੁਰੱਖਿਅਤ ਕਰੋ ਅਤੇ ਮੁਨਾਫਾ ਕਮਾਓ",
    farmer: "ਕਿਸਾਨ ਲੌਗਇਨ",
    admin: "ਐਡਮਿਨ ਲੌਗਇਨ",
    google: "ਗੂਗਲ ਨਾਲ ਸਾਈਨ ਇਨ ਕਰੋ",
    footer: "ਹਰ ਜਗ੍ਹਾ ਕਿਸਾਨਾਂ ਦਾ ਸਸ਼ਕਤੀਕਰਨ",
    selectLang: "ਭਾਸ਼ਾ ਚੁਣੋ"
  },
  bn: {
    title: "কান্দা ক্রেটসে স্বাগতম",
    subtitle: "স্মার্ট কৃষি AI এর মাধ্যমে নজরদারি করুন, সুরক্ষিত রাখুন এবং লাভ করুন",
    farmer: "কৃষক লগইন",
    admin: "অ্যাডমিন লগইন",
    google: "গুগল দিয়ে সাইন ইন করুন",
    footer: "সর্বত্র কৃষকদের ক্ষমতায়ন",
    selectLang: "ভাষা নির্বাচন করুন"
  },
  or: {
    title: "କାନ୍ଦା କ୍ରେଟସ୍ କୁ ସ୍ୱାଗତ",
    subtitle: "ସ୍ମାର୍ଟ କୃଷି AI ସହିତ ତଦାରଖ କରନ୍ତୁ, ସୁରକ୍ଷା ଦିଅନ୍ତୁ ଏବଂ ଲାଭ କମାନ୍ତୁ",
    farmer: "କୃଷକ ଲଗଇନ୍",
    admin: "ଆଡମିନ୍ ଲଗଇନ୍",
    google: "ଗୁଗୁଲ୍ ସହିତ ସାଇନ୍ ଇନ୍ କରନ୍ତୁ",
    footer: "ସବୁଠାରେ କୃଷକମାନଙ୍କୁ ସଶକ୍ତିକରଣ କରୁଛି",
    selectLang: "ଭାଷା ବାଛନ୍ତୁ"
  }
};

export default function Login() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { loginWithGoogle } = useAuth();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const t = TEXT[language];

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  // Hide Google SSO on iOS until an iOS OAuth client ID is configured
  const showGoogleButton = Platform.OS !== "ios" || !!GOOGLE_IOS_CLIENT_ID;

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        loginWithGoogle(authentication.accessToken).then(({ success }) => {
          if (success) {
            router.replace("/(tabs)");
          }
        });
      }
    }
  }, [response]);

  const handleFarmerLogin = () => {
    router.push("/login/credentials?type=farmer");
  };

  const handleAdminLogin = () => {
    router.push("/login/credentials?type=admin");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Global Language Button & Security Badge Row */}
        <View style={styles.topRow}>
          <View style={styles.securityBanner}>
            <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
            <Text style={styles.securityBannerText}>Secure Connection</Text>
          </View>

          <TouchableOpacity
            style={styles.globalLangBtn}
            onPress={() => setLangModalVisible(true)}
          >
            <Ionicons name="language" size={18} color="#1E6F5C" />
            <Text style={styles.globalLangText}>{LANGUAGE_LABELS[language]}</Text>
            <Ionicons name="chevron-down" size={16} color="#1E6F5C" />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* Farmer Login */}
        <TouchableOpacity style={styles.farmerButton} onPress={handleFarmerLogin}>
          <LinearGradient colors={["#2A9D8F", "#1E6F5C"]} style={styles.buttonGradient}>
            <Ionicons name="leaf-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t.farmer}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Admin Login */}
        <TouchableOpacity style={styles.adminButton} onPress={handleAdminLogin}>
          <LinearGradient colors={["#264653", "#1B3A4B"]} style={styles.buttonGradient}>
            <Ionicons name="shield-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t.admin}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Google Login — only shown when a valid client ID is available for current platform */}
        {showGoogleButton && (
          <TouchableOpacity
            style={styles.googleButton}
            disabled={!request}
            onPress={() => promptAsync()}
          >
            <Text style={styles.googleText}>{t.google}</Text>
          </TouchableOpacity>
        )}

        {/* Footer */}
        <Text style={styles.footer}>{t.footer}</Text>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF9",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  securityBannerText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "600",
  },
  globalLangBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E1F2EE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4
  },
  globalLangText: {
    color: "#1E6F5C",
    fontWeight: "700",
    fontSize: 12,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#1E6F5C",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 20,
  },
  farmerButton: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  adminButton: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  googleButton: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 16,
  },
  buttonGradient: {
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  googleText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  footer: {
    textAlign: "center",
    marginTop: 40,
    color: "#9CA3AF",
    fontSize: 12,
  },

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