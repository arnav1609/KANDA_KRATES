import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, LanguageCode } from "../../context/LanguageContext";
import {
  sanitizeInput,
  validateUsername,
  validatePhone,
  validatePassword,
  secureRequest,
  API_ENDPOINTS,
} from "../../config/api";

const TRANSLATIONS: Record<LanguageCode, any> = {
  en: {
    adminLogin: "Admin Login",
    farmerLogin: "Farmer Login",
    adminSignUp: "Admin Sign Up",
    farmerSignUp: "Farmer Sign Up",
    subtitle: "Enter your credentials securely",
    subtitleSignUp: "Create your account to get started",
    username: "Username",
    usernamePh: "Enter username",
    phone: "Phone Number",
    phonePh: "10-digit phone number",
    password: "Password",
    passwordPh: "Min 6 characters",
    secureLogin: "Secure Login",
    signUpBtn: "Create Account",
    securityText: "Your data is encrypted and stored securely",
    loginFailed: "Login Failed",
    signUpFailed: "Sign Up Failed",
    serverError: "Could not connect to server",
    alreadyHave: "Already have an account?",
    noAccount: "Don't have an account?",
    loginLink: "Login",
    signUpLink: "Sign Up",
  },
  hi: {
    adminLogin: "प्रशासक लॉगिन",
    farmerLogin: "किसान लॉगिन",
    subtitle: "सुरक्षित रूप से अपना विवरण दर्ज करें",
    username: "उपयोगकर्ता नाम",
    usernamePh: "उपयोगकर्ता नाम दर्ज करें",
    phone: "फ़ोन नंबर",
    phonePh: "10-अंकीय फ़ोन नंबर",
    password: "पासवर्ड",
    passwordPh: "न्यूनतम 6 अक्षर",
    secureLogin: "सुरक्षित लॉगिन",
    securityText: "आपका डेटा एन्क्रिप्टेड और सुरक्षित है",
    loginFailed: "लॉगिन विफल",
    serverError: "सर्वर से कनेक्ट नहीं हो सका",
  },
  mr: {
    adminLogin: "प्रशासक लॉगिन",
    farmerLogin: "शेतकरी लॉगिन",
    subtitle: "तुमचा तपशील सुरक्षितपणे प्रविष्ट करा",
    username: "वापरकर्तानाव",
    usernamePh: "वापरकर्तानाव प्रविष्ट करा",
    phone: "फोन नंबर",
    phonePh: "10-अंकी फोन नंबर",
    password: "पासवर्ड",
    passwordPh: "किमान 6 अक्षरे",
    secureLogin: "सुरक्षित लॉगिन",
    securityText: "तुमचा डेटा एनक्रिप्टेड आणि सुरक्षित आहे",
    loginFailed: "लॉगिन अयशस्वी",
    serverError: "सर्व्हरशी कनेक्ट होऊ शकले नाही",
  },
  ta: {
    adminLogin: "நிர்வாகி உள்நுழைவு",
    farmerLogin: "விவசாயி உள்நுழைவு",
    subtitle: "உங்கள் நற்சான்றிதழ்களை பாதுகாப்பாக உள்ளிடவும்",
    username: "பயனர்பெயர்",
    usernamePh: "பயனர்பெயரை உள்ளிடவும்",
    phone: "தொலைபேசி எண்",
    phonePh: "10-இலக்க தொலைபேசி எண்",
    password: "கடவுச்சொல்",
    passwordPh: "குறைந்தது 6 எழுத்துக்கள்",
    secureLogin: "பாதுகாப்பான உள்நுழைவு",
    securityText: "உங்கள் தரவு குறியாக்கம் செய்யப்பட்டு பாதுகாப்பாக சேமிக்கப்பட்டுள்ளது",
    loginFailed: "உள்நுழைவு தோல்வியடைந்தது",
    serverError: "சேவையகத்துடன் இணைக்க முடியவில்லை",
  },
  te: {
    adminLogin: "అడ్మిన్ లాగిన్",
    farmerLogin: "రైతు లాగిన్",
    subtitle: "మీ ఆధారాలను సురక్షితంగా నమోదు చేయండి",
    username: "వినియోగదారు పేరు",
    usernamePh: "వినియోగదారు పేరును నమోదు చేయండి",
    phone: "ఫోన్ నంబర్",
    phonePh: "10-అంకెల ఫోన్ నంబర్",
    password: "పాస్వర్డ్",
    passwordPh: "కనీసం 6 అక్షరాలు",
    secureLogin: "సురక్షిత లాగిన్",
    securityText: "మీ డేటా గుప్తీకరించబడింది మరియు సురక్షితం",
    loginFailed: "లాగిన్ విఫలమైంది",
    serverError: "సర్వర్‌కు కనెక్ట్ చేయలేకపోయాము",
  },
  kn: {
    adminLogin: "ನಿರ್ವಾಹಕ ಲಾಗಿನ್",
    farmerLogin: "ರೈತ ಲಾಗಿನ್",
    subtitle: "ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ನಮೂದಿಸಿ",
    username: "ಬಳಕೆದಾರ ಹೆಸರು",
    usernamePh: "ಬಳಕೆದಾರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
    phone: "ಫೋನ್ ಸಂಖ್ಯೆ",
    phonePh: "10-ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆ",
    password: "ಪಾಸ್ವರ್ಡ್",
    passwordPh: "ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು",
    secureLogin: "ಸುರಕ್ಷಿತ ಲಾಗಿನ್",
    securityText: "ನಿಮ್ಮ ಡೇಟಾವನ್ನು ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿದೆ",
    loginFailed: "ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ",
    serverError: "ಸರ್ವರ್‌ಗೆ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ",
  },
  ml: {
    adminLogin: "അഡ്മിൻ ലോഗിൻ",
    farmerLogin: "കർഷക ലോഗിൻ",
    subtitle: "നിങ്ങളുടെ വിവരങ്ങൾ സുരക്ഷിതമായി നൽകുക",
    username: "ഉപയോക്തൃനാമം",
    usernamePh: "ഉപയോക്തൃനാമം നൽകുക",
    phone: "ഫോൺ നമ്പർ",
    phonePh: "10-അക്ക ഫോൺ നമ്പർ",
    password: "പാസ്വേഡ്",
    passwordPh: "കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ",
    secureLogin: "സുരക്ഷിത ലോഗിൻ",
    securityText: "നിങ്ങളുടെ ഡാറ്റ എൻക്രിപ്റ്റ് ചെയ്‌ത് സുരക്ഷിതമായി സംഭരിച്ചിരിക്കുന്നു",
    loginFailed: "ലോഗിൻ പരാജയപ്പെട്ടു",
    serverError: "സെർവറിലേക്ക് കണക്‌റ്റ് ചെയ്യാനായില്ല",
  },
  gu: {
    adminLogin: "એડમિન લૉગિન",
    farmerLogin: "ખેડૂત લૉગિન",
    subtitle: "તમારી વિગતો સુરક્ષિત રીતે દાખલ કરો",
    username: "વપરાશકર્તા નામ",
    usernamePh: "વપરાશકર્તા નામ દાખલ કરો",
    phone: "ફોન નંબર",
    phonePh: "10-અંકનો ફોન નંબર",
    password: "પાસવર્ડ",
    passwordPh: "ઓછામાં ઓછા 6 અક્ષરો",
    secureLogin: "સુરક્ષિત લૉગિન",
    securityText: "તમારો ડેટા એન્ક્રિપ્ટેડ અને સુરક્ષિત રીતે સંગ્રહિત છે",
    loginFailed: "લૉગિન નિષ્ફળ ગયું",
    serverError: "સર્વરથી કનેક્ટ થઈ શક્યું નથી",
  },
  pa: {
    adminLogin: "ਐਡਮਿਨ ਲੌਗਇਨ",
    farmerLogin: "ਕਿਸਾਨ ਲੌਗਇਨ",
    subtitle: "ਆਪਣੇ ਵੇਰਵੇ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਦਰਜ ਕਰੋ",
    username: "ਵਰਤੋਂਕਾਰ ਨਾਮ",
    usernamePh: "ਵਰਤੋਂਕਾਰ ਨਾਮ ਦਰਜ ਕਰੋ",
    phone: "ਫ਼ੋਨ ਨੰਬਰ",
    phonePh: "10-ਅੰਕ ਦਾ ਫ਼ੋਨ ਨੰਬਰ",
    password: "ਪਾਸਵਰਡ",
    passwordPh: "ਘੱਟੋ ਘੱਟ 6 ਅੱਖਰ",
    secureLogin: "ਸੁਰੱਖਿਅਤ ਲੌਗਇਨ",
    securityText: "ਤੁਹਾਡਾ ਡੇਟਾ ਐਨਕ੍ਰਿਪਟਡ ਅਤੇ ਸੁਰੱਖਿਅਤ ਹੈ",
    loginFailed: "ਲੌਗਇਨ ਅਸਫਲ ਹੋਇਆ",
    serverError: "ਸਰਵਰ ਨਾਲ ਕਨੈਕਟ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਿਆ",
  },
  bn: {
    adminLogin: "অ্যাডমিন লগইন",
    farmerLogin: "কৃষক লগইন",
    subtitle: "নিরাপদে আপনার তথ্য লিখুন",
    username: "ব্যবহারকারীর নাম",
    usernamePh: "ব্যবহারকারীর নাম লিখুন",
    phone: "ফোন নম্বর",
    phonePh: "১০-সংখ্যার ফোন নম্বর",
    password: "পাসওয়ার্ড",
    passwordPh: "কমপক্ষে ৬ অক্ষর",
    secureLogin: "নিরাপদ লগইন",
    securityText: "আপনার ডেটা এনক্রিপ্ট করা এবং নিরাপদে সংরক্ষিত",
    loginFailed: "লগইন ব্যর্থ হয়েছে",
    serverError: "সার্ভারের সাথে সংযোগ করা যায়নি",
  },
  or: {
    adminLogin: "ଆଡମିନ୍ ଲଗଇନ୍",
    farmerLogin: "କୃଷକ ଲଗଇନ୍",
    subtitle: "ନିରାପଦରେ ଆପଣଙ୍କ ବିବରଣୀ ପ୍ରବେଶ କରନ୍ତୁ",
    username: "ଉପଯୋଗକର୍ତ୍ତା ନାମ",
    usernamePh: "ଉପଯୋଗକର୍ତ୍ତା ନାମ ଦିଅନ୍ତୁ",
    phone: "ଫୋନ୍ ନମ୍ବର",
    phonePh: "10-ଅଙ୍କ ବିଶିଷ୍ଟ ଫୋନ୍ ନମ୍ବର",
    password: "ପାସୱାର୍ଡ୍",
    passwordPh: "ସର୍ବନିମ୍ନ 6 ଅକ୍ଷର",
    secureLogin: "ନିରାପଦ ଲଗଇନ୍",
    securityText: "ଆପଣଙ୍କ ଡାଟା ଗୁପ୍ତ ଏବଂ ସୁରକ୍ଷିତ ଅଟେ",
    loginFailed: "ଲଗଇନ୍ ବିଫଳ ହୋଇଛି",
    serverError: "ସର୍ଭର ସହିତ ସଂଯୋଗ ହୋଇପାରିଲା ନାହିଁ",
  },
};

export default function Credentials() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { login } = useAuth();
  const { language } = useLanguage();

  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isAdmin = type === "admin";
  const accentColor = isAdmin ? "#6B4EAB" : "#1E6F5C";
  const accentBg   = isAdmin ? "#EBE5F6" : "#E2F1ED";

  const [errors, setErrors] = useState<{ username?: string; phone?: string; password?: string; }>({});

  const validate = (): boolean => {
    const usernameErr = validateUsername(sanitizeInput(username));
    const phoneErr    = validatePhone(sanitizeInput(phoneNumber));
    const passwordErr = validatePassword(password);
    setErrors({ username: usernameErr || undefined, phone: phoneErr || undefined, password: passwordErr || undefined });
    return !usernameErr && !phoneErr && !passwordErr;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const endpoint = isAdmin ? API_ENDPOINTS.adminRegister : API_ENDPOINTS.farmerRegister;
      const res = await secureRequest(endpoint, {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          username: sanitizeInput(username),
          phoneNumber: sanitizeInput(phoneNumber),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      Alert.alert("Account Created! 🎉", "You can now log in with your credentials.", [
        { text: "Login Now", onPress: () => { setIsSignUp(false); setPassword(""); } }
      ]);
    } catch (err: any) {
      Alert.alert(t.signUpFailed || "Sign Up Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await login(sanitizeInput(username), sanitizeInput(phoneNumber), password, isAdmin ? "admin" : "farmer");
    setLoading(false);
    if (result.success) {
      router.replace(isAdmin ? "/admin/admin-dashboard" : "/(tabs)");
    } else {
      Alert.alert(t.loginFailed, result.error || t.serverError);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: accentBg }]}>
          <Ionicons name={isAdmin ? "shield-checkmark" : "leaf"} size={32} color={accentColor} />
        </View>
        <Text style={[styles.title, { color: accentColor }]}>
          {isSignUp
            ? (isAdmin ? (t.adminSignUp || "Admin Sign Up") : (t.farmerSignUp || "Farmer Sign Up"))
            : (isAdmin ? t.adminLogin : t.farmerLogin)}
        </Text>
        <Text style={styles.subtitle}>{isSignUp ? (t.subtitleSignUp || t.subtitle) : t.subtitle}</Text>
      </View>

      {/* Username */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t.username}</Text>
        <View style={[styles.inputRow, errors.username ? styles.inputError : null]}>
          <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder={t.usernamePh} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
        </View>
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
      </View>

      {/* Phone */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t.phone}</Text>
        <View style={[styles.inputRow, errors.phone ? styles.inputError : null]}>
          <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder={t.phonePh} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" maxLength={10} />
        </View>
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* Password */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t.password}</Text>
        <View style={[styles.inputRow, errors.password ? styles.inputError : null]}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder={t.passwordPh} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      {/* Primary Button */}
      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: accentColor }]}
        onPress={isSignUp ? handleSignUp : handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.buttonInner}>
            <Ionicons name={isSignUp ? "person-add-outline" : "log-in-outline"} size={20} color="#fff" />
            <Text style={styles.loginButtonText}>{isSignUp ? (t.signUpBtn || "Create Account") : t.secureLogin}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Toggle Sign Up ↔ Login */}
      <TouchableOpacity style={styles.toggleRow} onPress={() => { setIsSignUp(!isSignUp); setErrors({}); }}>
        <Text style={styles.toggleText}>
          {isSignUp ? (t.alreadyHave || "Already have an account?") : (t.noAccount || "Don't have an account?")}
        </Text>
        <Text style={[styles.toggleLink, { color: accentColor }]}>
          {" "}{isSignUp ? (t.loginLink || "Login") : (t.signUpLink || "Sign Up")}
        </Text>
      </TouchableOpacity>

      {/* Security badge */}
      <View style={styles.securityBadge}>
        <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
        <Text style={styles.securityText}>{t.securityText}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#F7FAF9",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E6F5C",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: "#111827",
  },
  eyeBtn: {
    padding: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: "#1E6F5C",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: "#6B7280",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  toggleText: {
    fontSize: 14,
    color: "#6B7280",
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});