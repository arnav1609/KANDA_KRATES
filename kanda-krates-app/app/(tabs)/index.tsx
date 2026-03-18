import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { secureRequest, API_ENDPOINTS } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";

type BatchSummary = { crateId: string; batchId: string; ohi: number; tier: string; daysRemaining: number; };
type MarketPrice = { priceModal: number; priceMin: number; priceMax: number; unit: string; market: string; lastUpdated: string; } | null;

const TIER_COLOR: Record<string, string> = {
  Normal: "#16A34A", Alert: "#D97706", Action: "#EA580C", Emergency: "#DC2626"
};
const TIER_BG: Record<string, string> = {
  Normal: "#DCFCE7", Alert: "#FEF3C7", Action: "#FFEDD5", Emergency: "#FEE2E2"
};

function greeting(t: (s: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t("Good morning");
  if (h < 17) return t("Good afternoon");
  return t("Good evening");
}

export default function FarmerHome() {
  const { username } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [market, setMarket] = useState<MarketPrice>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sensorRes, marketRes] = await Promise.allSettled([
        secureRequest(API_ENDPOINTS.allSensors),
        secureRequest(API_ENDPOINTS.marketPrice),
      ]);

      // Sensor data
      if (sensorRes.status === "fulfilled" && sensorRes.value.ok) {
        const data = await sensorRes.value.json();
        const result: BatchSummary[] = [];
        for (const crateId of Object.keys(data)) {
          for (const batchId of Object.keys(data[crateId])) {
            const ml = data[crateId][batchId]?.ml_predictions || {};
            result.push({ crateId, batchId, ohi: ml.ohi ?? 50, tier: ml.tier ?? "Alert", daysRemaining: ml.daysRemaining ?? 10 });
          }
        }
        result.sort((a, b) => a.ohi - b.ohi);
        setBatches(result);
      }

      // Market price
      if (marketRes.status === "fulfilled" && marketRes.value.ok) {
        const mp = await marketRes.value.json();
        setMarket(mp);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const worstBatch = batches[0];
  const avgOhi = batches.length ? Math.round(batches.reduce((s, b) => s + b.ohi, 0) / batches.length) : 0;
  
  // Detailed matching counts
  const countE = batches.filter(b => b.tier === "Emergency").length;
  const countA = batches.filter(b => b.tier === "Action").length;
  const emergencyCount = countE + countA;

  // Sell recommendation logic (unchanged logic but updated names)
  const sellNow = batches.find(b => b.tier === "Emergency");
  const sellSoon = batches.find(b => b.tier === "Action" || b.tier === "Alert");
  const sellRec = sellNow || sellSoon || null;
  const sellUrgency = sellNow ? t("SELL NOW") : sellSoon?.tier === "Action" ? t("SELL SOON") : sellSoon ? t("CONSIDER SELLING") : null;
  const sellColor = sellNow ? "#DC2626" : sellSoon?.tier === "Action" ? "#EA580C" : "#D97706";
  const sellBg = sellNow ? "#FEE2E2" : sellSoon?.tier === "Action" ? "#FFEDD5" : "#FEF3C7";
  const estEarnings = sellRec && market ? (sellRec.ohi > 70 ? market.priceModal : market.priceMin) : null;

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const QuickAction = ({ icon, label, color, bg, onPress }: any) => (
    <TouchableOpacity style={[styles.qaCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={26} color={color} />
      <Text style={[styles.qaLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F5C" />}>

      {/* Header */}
      <LinearGradient colors={["#1E6F5C", "#2D917A"]} style={styles.header}>
        <View>
          <Text style={styles.greet}>{greeting(t)}, 👋</Text>
          <Text style={styles.name}>{username ?? "Farmer"}</Text>
          <Text style={styles.headerSub}>{t("Here's your farm overview for today")}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={{ fontSize: 36 }}>🧅</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color="#1E6F5C" style={{ marginTop: 40 }} size="large" />
      ) : (
        <>
          {/* Alert Banner */}
          {emergencyCount > 0 && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/leaderboard")} activeOpacity={0.85}>
              <View style={styles.alertBanner}>
                <Ionicons name="warning" size={18} color="#DC2626" />
                <Text style={styles.alertText}>{emergencyCount} {t("batches need immediate attention!")}</Text>
                <Ionicons name="chevron-forward" size={16} color="#DC2626" />
              </View>
            </TouchableOpacity>
          )}

          {/* Fleet Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{batches.length}</Text>
              <Text style={styles.statLabel}>{t("Total Batches")}</Text>
            </View>
            <View style={[styles.statCard, { borderColor: avgOhi > 75 ? "#16A34A" : avgOhi > 55 ? "#D97706" : "#DC2626" }]}>
              <Text style={[styles.statNum, { color: avgOhi > 75 ? "#16A34A" : avgOhi > 55 ? "#D97706" : "#DC2626" }]}>{avgOhi}</Text>
              <Text style={styles.statLabel}>{t("Avg. OHI")}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: emergencyCount > 0 ? "#DC2626" : "#16A34A" }]}>{emergencyCount}</Text>
              <Text style={styles.statLabel}>{t("Need Action")}</Text>
              {emergencyCount > 0 && (
                <Text style={{ fontSize: 9, color: "#6B7280", marginTop: 2 }}>{countE} {t("Emerg.")} + {countA} {t("Act.")}</Text>
              )}
            </View>
          </View>

          {/* Worst Batch Card */}
          {worstBatch && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("⚠️ Needs Attention Most")}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/leaderboard")} activeOpacity={0.85}>
                <LinearGradient colors={[TIER_COLOR[worstBatch.tier], TIER_COLOR[worstBatch.tier] + "CC"]} style={styles.worstCard}>
                  <View>
                    <Text style={styles.worstCrate}>{worstBatch.crateId} / {worstBatch.batchId}</Text>
                    <Text style={styles.worstTier}>{t(worstBatch.tier)}</Text>
                    <Text style={styles.worstDays}>{worstBatch.daysRemaining} {t("days of safe storage remaining")}</Text>
                  </View>
                  <View style={styles.worstOhi}>
                    <Text style={styles.worstOhiBig}>{worstBatch.ohi}</Text>
                    <Text style={styles.worstOhiLabel}>{t("OHI")}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* All Batches Mini List */}
          {batches.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("📦 All Batches")}</Text>
              {batches.map((b, i) => (
                <View key={`${b.crateId}/${b.batchId}`} style={styles.batchRow}>
                  <View style={[styles.batchDot, { backgroundColor: TIER_COLOR[b.tier] }]} />
                  <Text style={styles.batchRowId}>{b.crateId.replace(/crate/i, t("Crate"))}/{b.batchId.replace(/batch/i, t("Batch"))}</Text>
                  <View style={[styles.batchTierBadge, { backgroundColor: TIER_BG[b.tier] }]}>
                    <Text style={[styles.batchTierText, { color: TIER_COLOR[b.tier] }]}>{t(b.tier)}</Text>
                  </View>
                  <Text style={styles.batchOhi}>{t("OHI")} {b.ohi}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Market Price */}
          {market && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("💹 Onion Market Price")}</Text>
              <View style={styles.marketCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.marketPrice}>₹{market.priceModal?.toFixed(2)}/{market.unit}</Text>
                  <Text style={styles.marketTrend}>{t("Range")}: ₹{market.priceMin?.toFixed(2)} – ₹{market.priceMax?.toFixed(2)}</Text>
                  <Text style={[styles.marketTrend, { fontSize: 11, color: "#9CA3AF", marginTop: 2 }]}>{market.market}</Text>
                </View>
                <Ionicons name="trending-up" size={36} color="#16A34A" />
              </View>
            </View>
          )}

          {/* OHI Scale Legend */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("ℹ️ OHI Health Tiers")}</Text>
            <View style={styles.scaleRow}>
              {[
                { label: "0–35", tier: "Emergency", color: "#DC2626", bg: "#FEE2E2" },
                { label: "36–55", tier: "Action", color: "#EA580C", bg: "#FFEDD5" },
                { label: "56–75", tier: "Alert", color: "#D97706", bg: "#FEF3C7" },
                { label: "76–100", tier: "Normal", color: "#16A34A", bg: "#DCFCE7" },
              ].map((item) => (
                <View key={item.tier} style={[styles.scaleSegment, { backgroundColor: item.bg }]}>
                  <Text style={[styles.scaleTier, { color: item.color }]}>{t(item.tier)}</Text>
                  <Text style={styles.scaleRange}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sell Recommendation */}
          {batches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("🤝 Sell Recommendation")}</Text>
              {sellRec ? (
                <View style={[styles.sellCard, { backgroundColor: sellBg, borderLeftColor: sellColor }]}>
                  <View style={styles.sellTop}>
                    <View style={[styles.sellBadge, { backgroundColor: sellColor }]}>
                      <Text style={styles.sellBadgeText}>{sellUrgency}</Text>
                    </View>
                    <Text style={styles.sellBatchId}>{sellRec.crateId.toUpperCase().replace("CRATE", t("Crate").toUpperCase())} / {sellRec.batchId.toUpperCase().replace("BATCH", t("Batch").toUpperCase())}</Text>
                  </View>
                  <Text style={styles.sellReason}>
                    {t("OHI is")} <Text style={{ fontWeight: "900", color: sellColor }}>{sellRec.ohi}/100</Text> {t("— only")}{" "}
                    <Text style={{ fontWeight: "800" }}>{sellRec.daysRemaining} {t("days")}</Text>
                  </Text>
                  {estEarnings != null && (
                    <Text style={styles.sellEarnings}>
                    {t("At current market:")} ₹{estEarnings.toFixed(2)}/kg {t("— sell now to lock in this price.")}
                  </Text>
                  )}
                  {sellNow && (
                    <View style={styles.sellWarning}>
                      <Ionicons name="warning" size={14} color="#DC2626" />
                      <Text style={styles.sellWarningText}>{t("Further delay risks unsellable stock. Act today.")}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.sellCard, { backgroundColor: "#DCFCE7", borderLeftColor: "#16A34A" }]}>
                  <View style={styles.sellTop}>
                    <View style={[styles.sellBadge, { backgroundColor: "#16A34A" }]}>
                      <Text style={styles.sellBadgeText}>{t("HOLD")}</Text>
                    </View>
                    <Text style={styles.sellBatchId}>{t("All batches healthy")}</Text>
                  </View>
                  <Text style={styles.sellReason}>
                    {t("Your onions are safely stored. Monitor OHI daily.")}
                  </Text>
                  {market && (
                    <Text style={styles.sellEarnings}>
                      {t("Current market:")} ₹{market.priceModal?.toFixed(2)}/{market.unit}. {t("Wait for better prices for maximum returns.")}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("⚡ Quick Actions")}</Text>
            <View style={styles.qaGrid}>
              <QuickAction icon="leaf" label={t("Sensor Data")} color="#1E6F5C" bg="#E2F5EF" onPress={() => router.push("/(tabs)/dashboard")} />
              <QuickAction icon="cube" label={t("My Batches")} color="#7C3AED" bg="#EDE9FE" onPress={() => router.push("/(tabs)/leaderboard")} />
              <QuickAction icon="chatbubbles" label={t("AI Advisor")} color="#2563EB" bg="#DBEAFE" onPress={() => router.push("/(tabs)/chatbot")} />
              <QuickAction icon="person-circle" label={t("My Profile")} color="#D97706" bg="#FEF3C7" onPress={() => router.push("/(tabs)/profile")} />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAF9" },
  header: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greet: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  name: { fontSize: 26, fontWeight: "900", color: "#fff", marginTop: 2 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  headerIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },

  alertBanner: { margin: 16, backgroundColor: "#FEE2E2", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#FECACA" },
  alertText: { flex: 1, color: "#DC2626", fontWeight: "700", fontSize: 13 },

  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 2, borderColor: "#E5E7EB", elevation: 1 },
  statNum: { fontSize: 26, fontWeight: "900", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 3, textAlign: "center" },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 10 },

  worstCard: { borderRadius: 18, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  worstCrate: { fontSize: 16, fontWeight: "900", color: "#fff" },
  worstTier: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },
  worstDays: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  worstOhi: { alignItems: "center" },
  worstOhiBig: { fontSize: 36, fontWeight: "900", color: "#fff" },
  worstOhiLabel: { fontSize: 12, color: "rgba(255,255,255,0.75)" },

  batchRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1 },
  batchDot: { width: 10, height: 10, borderRadius: 5 },
  batchRowId: { flex: 1, fontSize: 13, fontWeight: "700", color: "#111827" },
  batchTierBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  batchTierText: { fontSize: 11, fontWeight: "700" },
  batchOhi: { fontSize: 12, color: "#6B7280", fontWeight: "600" },

  marketCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", elevation: 2 },
  marketPrice: { fontSize: 28, fontWeight: "900", color: "#111827" },
  marketTrend: { fontSize: 13, color: "#6B7280", marginTop: 4 },

  qaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  qaCard: { width: "47%", borderRadius: 16, padding: 18, alignItems: "center", gap: 8 },
  qaLabel: { fontSize: 13, fontWeight: "800" },

  sellCard: { borderRadius: 16, padding: 16, borderLeftWidth: 5, gap: 8, elevation: 1 },
  sellTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  sellBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  sellBadgeText: { color: "#fff", fontWeight: "900", fontSize: 11, letterSpacing: 0.5 },
  sellBatchId: { fontSize: 15, fontWeight: "800", color: "#111827" },
  sellReason: { fontSize: 13, color: "#374151", lineHeight: 20 },
  sellEarnings: { fontSize: 13, color: "#1E6F5C", fontWeight: "600", lineHeight: 20 },
  sellWarning: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  sellWarningText: { fontSize: 12, color: "#DC2626", fontWeight: "700", flex: 1 },

  scaleRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  scaleSegment: { flex: 1, borderRadius: 10, padding: 8, alignItems: "center", gap: 2 },
  scaleTier: { fontSize: 10, fontWeight: "800" },
  scaleRange: { fontSize: 9, color: "#6B7280", fontWeight: "600" },
});
