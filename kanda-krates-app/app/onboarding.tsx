import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  SafeAreaView, StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "cube" as const,
    color: "#1E6F5C",
    grad: ["#1E6F5C", "#2D917A"] as [string, string],
    title: "Smart Onion Storage",
    body: "Kanda Krates connects to IoT sensors inside your storage crates to monitor your onions 24/7 — temperature, humidity, and gas levels in real time.",
    emoji: "🧅",
  },
  {
    icon: "pulse" as const,
    color: "#6B4EAB",
    grad: ["#6B4EAB", "#8B69CC"] as [string, string],
    title: "OHI — Onion Health Index",
    body: "Our AI predicts your batch health as a score from 0–100. High OHI means fresh stock. Low OHI means it's time to sell. Never guess again.",
    emoji: "🤖",
  },
  {
    icon: "trending-up" as const,
    color: "#D97706",
    grad: ["#D97706", "#F59E0B"] as [string, string],
    title: "Act Before You Lose",
    body: "Get emergency alerts when a batch is at risk. Sell or move to cold storage at the right moment — protect your income with data-driven decisions.",
    emoji: "💰",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const finish = async () => {
    try { await SecureStore.setItemAsync("onboarded", "true"); } catch {}
    router.replace("/login");
  };

  const next = () => {
    if (current < SLIDES.length - 1) setCurrent(current + 1);
    else finish();
  };

  const slide = SLIDES[current];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={slide.grad} style={styles.topHalf}>
        <SafeAreaView />
        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={finish}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Illustration */}
        <View style={styles.illustrationBox}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name={slide.icon} size={56} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === current ? slide.color : "#E5E7EB", width: i === current ? 24 : 8 }]}
            />
          ))}
        </View>

        <Text style={[styles.title, { color: slide.color }]}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: slide.color }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {current < SLIDES.length - 1 ? "Next" : "Get Started"}
          </Text>
          <Ionicons
            name={current < SLIDES.length - 1 ? "arrow-forward" : "checkmark-circle"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  topHalf: { height: "55%", paddingHorizontal: 24, justifyContent: "space-between", paddingBottom: 40 },

  skipBtn: { alignSelf: "flex-end", marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20 },
  skipText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  illustrationBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  emoji: { fontSize: 52 },
  iconCircle: { width: 110, height: 110, borderRadius: 55, justifyContent: "center", alignItems: "center" },

  bottomCard: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -24, padding: 28, justifyContent: "space-between" },

  dots: { flexDirection: "row", gap: 6, alignSelf: "center" },
  dot: { height: 8, borderRadius: 4, backgroundColor: "#E5E7EB" },

  title: { fontSize: 27, fontWeight: "900", marginTop: 4 },
  body: { fontSize: 15, color: "#6B7280", lineHeight: 24, flex: 1, marginTop: 10 },

  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 16, marginTop: 8 },
  nextBtnText: { color: "#fff", fontWeight: "900", fontSize: 17 },
});
