import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import { secureRequest, API_ENDPOINTS, sanitizeInput } from "../../config/api";
import { useLanguage, LanguageCode } from "../../context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";

/* ================= LANGUAGES ================= */

const LANGUAGES: Record<LanguageCode, {
  name: string;
  ui: {
    header: string;
    sub: string;
    placeholder: string;
    send: string;
    botPrefix: string;
    youPrefix: string;
  };
}> = {
  en: {
    name: "English",
    ui: {
      header: "Agri Expert AI",
      sub: "Ask me about onions and farming",
      placeholder: "Type your question...",
      send: "Send",
      botPrefix: "Expert",
      youPrefix: "You",
    },
  },
  hi: {
    name: "हिन्दी",
    ui: {
      header: "कृषि विशेषज्ञ AI",
      sub: "मुझसे प्याज और खेती के बारे में पूछें",
      placeholder: "अपना प्रश्न टाइप करें...",
      send: "भेजें",
      botPrefix: "विशेषज्ञ",
      youPrefix: "आप",
    },
  },
  mr: {
    name: "मराठी",
    ui: {
      header: "कृषी तज्ज्ञ AI",
      sub: "मला कांदा आणि शेतीबद्दल विचारा",
      placeholder: "तुमचा प्रश्न टाइप करा...",
      send: "पाठवा",
      botPrefix: "तज्ज्ञ",
      youPrefix: "तुम्ही",
    },
  },
  ta: {
    name: "தமிழ்",
    ui: {
      header: "வேளாண் நிபுணர் AI",
      sub: "வெங்காயம் மற்றும் விவசாயம் பற்றி கேளுங்கள்",
      placeholder: "உங்கள் கேள்வியை தட்டச்சு செய்க...",
      send: "அனுப்பு",
      botPrefix: "நிபுணர்",
      youPrefix: "நீங்கள்",
    },
  },
  te: {
    name: "తెలుగు",
    ui: {
      header: "వ్యవసాయ నిపుణుడు AI",
      sub: "ఉల్లిపాయలు మరియు వ్యవసాయం గురించి నన్ను అడగండి",
      placeholder: "మీ ప్రశ్నను టైప్ చేయండి...",
      send: "పంపండి",
      botPrefix: "నిపుణుడు",
      youPrefix: "మీరు",
    },
  },
  kn: {
    name: "ಕನ್ನಡ",
    ui: {
      header: "ಕೃಷಿ ತಜ್ಞ AI",
      sub: "ಈರುಳ್ಳಿ ಮತ್ತು ಕೃಷಿಯ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಿ",
      placeholder: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...",
      send: "ಕಳುಹಿಸಿ",
      botPrefix: "ತಜ್ಞ",
      youPrefix: "ನೀವು",
    },
  },
  ml: {
    name: "മലയാളം",
    ui: {
      header: "കാർഷിക വിദഗ്ദ്ധൻ AI",
      sub: "ഉള്ളിയെയും കൃഷിയെയും കുറിച്ച് എന്നോട് ചോദിക്കുക",
      placeholder: "നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക...",
      send: "അയയ്ക്കുക",
      botPrefix: "വിദഗ്ദ്ധൻ",
      youPrefix: "നിങ്ങൾ",
    },
  },
  gu: {
    name: "ગુજરાતી",
    ui: {
      header: "કૃષિ નિષ્ણાત AI",
      sub: "મને ડુંગળી અને ખેતી વિશે પૂછો",
      placeholder: "તમારો પ્રશ્ન ટાઇપ કરો...",
      send: "મોકલો",
      botPrefix: "નિષ્ણાત",
      youPrefix: "તમે",
    },
  },
  pa: {
    name: "ਪੰਜਾਬੀ",
    ui: {
      header: "ਖੇਤੀਬਾੜੀ ਮਾਹਰ AI",
      sub: "ਮੈਨੂੰ ਪਿਆਜ਼ ਅਤੇ ਖੇਤੀ ਬਾਰੇ ਪੁੱਛੋ",
      placeholder: "ਆਪਣਾ ਸਵਾਲ ਟਾਈਪ ਕਰੋ...",
      send: "ਭੇਜੋ",
      botPrefix: "ਮਾਹਰ",
      youPrefix: "ਤੁਸੀਂ",
    },
  },
  bn: {
    name: "বাংলা",
    ui: {
      header: "কৃষি বিশেষজ্ঞ AI",
      sub: "আমাকে পেঁয়াজ এবং কৃষিকাজ সম্পর্কে জিজ্ঞাসা করুন",
      placeholder: "আপনার প্রশ্ন টাইপ করুন...",
      send: "পাঠান",
      botPrefix: "বিশেষজ্ঞ",
      youPrefix: "আপনি",
    },
  },
  or: {
    name: "ଓଡ଼ିଆ",
    ui: {
      header: "କୃଷି ବିଶେଷଜ୍ଞ AI",
      sub: "ମୋତେ ପିଆଜ ଏବଂ ଚାଷ ବିଷୟରେ ପଚାରନ୍ତୁ",
      placeholder: "ଆପଣଙ୍କର ପ୍ରଶ୍ନ ଟାଇପ୍ କରନ୍ତୁ...",
      send: "ପଠାନ୍ତୁ",
      botPrefix: "ବିଶେଷଜ୍ଞ",
      youPrefix: "ଆପଣ",
    },
  },
};

type Message = { id: string; role: "user" | "assistant"; text: string };

export default function ChatbotScreen() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const l = LANGUAGES[language];
  const ui = l.ui;

  const speak = (text: string) => {
    Speech.speak(text, { language });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Sanitize user input before sending
    const q = sanitizeInput(input);
    setInput("");
    setLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: "user", text: q }
    ];
    setMessages(newMessages);

    try {
      const res = await secureRequest(API_ENDPOINTS.chat, {
        method: "POST",
        body: JSON.stringify({ question: q, language })
      });

      const data = await res.json();
      const ans = data.answer || "⚠️ No response";

      setMessages([...newMessages, { id: (Date.now() + 1).toString(), role: "assistant", text: ans }]);
      speak(ans);
    } catch (err) {
      console.log("Chat error:", err);
      // Optional: add a generic fallback error message to the UI
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>{ui.header}</Text>
          <Text style={styles.headerSub}>{ui.sub}</Text>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.chatArea}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            return (
              <View style={[styles.msgWrapper, isUser ? styles.msgRight : styles.msgLeft]}>
                {!isUser && (
                  <View style={styles.botAvatar}>
                    <Text style={{ fontSize: 16 }}>🌱</Text>
                  </View>
                )}
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                  <Text style={[styles.msgText, isUser ? styles.textUser : styles.textBot]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Input Area */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.inputBox}
            placeholder={ui.placeholder}
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
          />

          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && { opacity: 0.6 }]}
            onPress={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF9",
  },
  headerBox: {
    backgroundColor: "#1E6F5C",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  headerSub: {
    color: "#A7F3D0",
    fontSize: 14,
    marginTop: 4,
  },
  chatArea: {
    flex: 1,
  },
  msgWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
    width: "100%",
  },
  msgRight: {
    justifyContent: "flex-end",
  },
  msgLeft: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: "#1E6F5C",
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: "#fff",
  },
  textBot: {
    color: "#1F2937",
  },
  inputSection: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    alignItems: "center",
  },
  inputBox: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1E6F5C",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});
