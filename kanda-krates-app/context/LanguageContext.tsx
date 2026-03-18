import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 11 Supported Languages
export const SUPPORTED_LANGUAGES = ["en", "hi", "mr", "ta", "te", "kn", "ml", "gu", "pa", "bn", "or"] as const;
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: "English",
  hi: "हिन्दी",      // Hindi
  mr: "मराठी",      // Marathi
  ta: "தமிழ்",       // Tamil
  te: "తెలుగు",       // Telugu
  kn: "ಕನ್ನಡ",       // Kannada
  ml: "മലയാളം",     // Malayalam
  gu: "ગુજરાતી",     // Gujarati
  pa: "ਪੰਜਾਬੀ",      // Punjabi
  bn: "বাংলা",       // Bengali
  or: "ଓଡ଼ିଆ"        // Odia
};

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  // Load saved language
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("selectedLanguage");
        if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage as LanguageCode)) {
          setLanguageState(savedLanguage as LanguageCode);
        }
      } catch (error) {
        console.log("AsyncStorage load error:", error);
      }
    };

    loadLanguage();
  }, []);

  // Update language
  const setLanguage = async (lang: LanguageCode) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem("selectedLanguage", lang);
    } catch (error) {
      console.log("AsyncStorage save error:", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};