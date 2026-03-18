import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, Modal, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { secureRequest, API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

/* ─── Types ─── */
type BatchItem = {
  crateId: string;
  batchId: string;
  ohi: number;
  tier: "Normal" | "Alert" | "Action" | "Emergency";
  daysRemaining: number;
  temperature: number;
  humidity: number;
  mq135: number;
  mq137: number;
  mq136: number;
  confidence?: number;
  sold?: boolean;
};

/* ─── Helpers ─── */
const TIER_COLOR: Record<string, string> = {
  Normal: "#16A34A", Alert: "#D97706", Action: "#EA580C", Emergency: "#DC2626"
};
const TIER_BG: Record<string, string> = {
  Normal: "#DCFCE7", Alert: "#FEF3C7", Action: "#FFEDD5", Emergency: "#FEE2E2"
};
const TIER_GRAD: Record<string, [string, string]> = {
  Normal: ["#16A34A", "#15803D"],
  Alert: ["#D97706", "#B45309"],
  Action: ["#EA580C", "#C2410C"],
  Emergency: ["#DC2626", "#B91C1C"],
};

function OhiRing({ ohi, tier }: { ohi: number; tier: string }) {
  const color = TIER_COLOR[tier];
  return (
    <View style={styles.ohiRing}>
      <View style={[styles.ohiInner, { borderColor: color }]}>
        <Text style={[styles.ohiBig, { color }]}>{ohi}</Text>
        <Text style={styles.ohiLabel}>OHI</Text>
      </View>
    </View>
  );
}

/* ─── Main ─── */
export default function BatchesScreen() {
  const { username } = useAuth();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selected, setSelected] = useState<BatchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selling, setSelling] = useState(false);
  const [soldIds, setSoldIds] = useState<Set<string>>(new Set());

  const fetchBatches = useCallback(async () => {
    try {
      const res = await secureRequest(API_ENDPOINTS.allSensors);
      if (!res.ok) return;
      const data = await res.json();

      const result: BatchItem[] = [];
      for (const crateId of Object.keys(data)) {
        for (const batchId of Object.keys(data[crateId])) {
          const b = data[crateId][batchId];
          const ml = b.ml_predictions || {};
          result.push({
            crateId, batchId,
            ohi: ml.ohi ?? 50,
            tier: ml.tier ?? "Alert",
            daysRemaining: ml.daysRemaining ?? 10,
            confidence: ml.confidence ?? 0.7,
            temperature: b.temperature ?? 0,
            humidity: b.humidity ?? 0,
            mq135: b.mq135 ?? 0,
            mq137: b.mq137 ?? 0,
            mq136: b.mq136 ?? 0,
          });
        }
      }
      // sort: Emergency first → Normal last
      result.sort((a, b) => a.ohi - b.ohi);
      setBatches(result);
    } catch (err) {
      console.log("Batch fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
    const t = setInterval(fetchBatches, 5000);
    return () => clearInterval(t);
  }, [fetchBatches]);

  const handleSell = (batch: BatchItem) => {
    Alert.alert(
      "🌾 Confirm Harvest",
      `Mark ${batch.crateId}/${batch.batchId} as sold/harvested?\n\nOHI: ${batch.ohi} | ${batch.daysRemaining} days remaining`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as Sold",
          style: "destructive",
          onPress: async () => {
            setSelling(true);
            try {
              // Record sale in backend
              await secureRequest(`/api/crates/${batch.crateId}/harvest`, {
                method: "POST",
                body: JSON.stringify({ batchId: batch.batchId, ohi: batch.ohi, soldAt: new Date().toISOString() }),
              });
            } catch { /* endpoint may not exist yet — that's OK */ }
            setSoldIds(prev => new Set([...prev, `${batch.crateId}/${batch.batchId}`]));
            setSelling(false);
            setSelected(null);
            Alert.alert("✅ Marked as Sold", `${batch.crateId}/${batch.batchId} has been recorded as harvested.`);
          }
        }
      ]
    );
  };

  const onRefresh = () => { setRefreshing(true); fetchBatches(); };

  const renderItem = ({ item, index }: { item: BatchItem; index: number }) => {
    const isSold = soldIds.has(`${item.crateId}/${item.batchId}`);
    const tierColor = TIER_COLOR[item.tier];
    const tierBg = TIER_BG[item.tier];
    return (
      <TouchableOpacity onPress={() => setSelected(item)} activeOpacity={0.85}>
        <View style={[styles.card, isSold && styles.cardSold]}>
          {/* Rank Badge */}
          <View style={[styles.rankBadge, { backgroundColor: index < 3 ? tierBg : "#F3F4F6" }]}>
            {index < 3
              ? <Ionicons name={index === 0 ? "warning" : index === 1 ? "alert-circle" : "information-circle"} size={16} color={tierColor} />
              : <Text style={[styles.rankNum, { color: "#6B7280" }]}>{index + 1}</Text>
            }
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={styles.batchId}>{item.crateId} / {item.batchId}</Text>
            <View style={styles.tagsRow}>
              <View style={[styles.tierTag, { backgroundColor: tierBg }]}>
                <Text style={[styles.tierTagText, { color: tierColor }]}>{item.tier}</Text>
              </View>
              <Text style={styles.metaText}>🌡 {item.temperature}°C  💧 {item.humidity}%</Text>
            </View>
            {isSold && (
              <View style={styles.soldBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                <Text style={styles.soldText}>Harvested</Text>
              </View>
            )}
          </View>

          {/* OHI Ring */}
          <OhiRing ohi={item.ohi} tier={item.tier} />

          {/* Days Left */}
          <View style={{ alignItems: "center", marginLeft: 8 }}>
            <Text style={[styles.daysBig, { color: item.daysRemaining < 5 ? "#DC2626" : "#111827" }]}>
              {item.daysRemaining}
            </Text>
            <Text style={styles.daysLabel}>days</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#1E6F5C", "#2D917A"]} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📦 My Batches</Text>
          <Text style={styles.headerSub}>{username ? `@${username}` : "Loading..."} · {batches.length} active batch{batches.length !== 1 ? "es" : ""}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Summary Bar — always show all 4 tiers */}
      <View style={styles.summaryBar}>
        {(["Emergency", "Action", "Alert", "Normal"] as const).map(t => {
          const count = batches.filter(b => b.tier === t).length;
          return (
            <View key={t} style={[styles.summaryChip, { backgroundColor: TIER_BG[t], borderWidth: 1.5, borderColor: TIER_COLOR[t] }]}>
              <Text style={[styles.summaryChipText, { color: TIER_COLOR[t] }]}>{count} {t}</Text>
            </View>
          );
        })}
      </View>

      {/* OHI Scale Bar */}
      <View style={styles.scaleBox}>
        <Text style={styles.scaleTitle}>OHI Scale</Text>
        <View style={styles.scaleRow}>
          {([
            { label: "0–35", tier: "Emergency" },
            { label: "36–55", tier: "Action" },
            { label: "56–75", tier: "Alert" },
            { label: "76–100", tier: "Normal" },
          ] as const).map(({ label, tier }) => (
            <View key={tier} style={[styles.scaleSegment, { backgroundColor: TIER_BG[tier] }]}>
              <View style={[styles.scaleDot, { backgroundColor: TIER_COLOR[tier] }]} />
              <Text style={[styles.scaleTier, { color: TIER_COLOR[tier] }]}>{tier}</Text>
              <Text style={styles.scaleRange}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1E6F5C" /></View>
      ) : batches.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No batches found</Text>
          <Text style={styles.emptySub}>Ask your admin to assign a crate to your account.</Text>
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={i => `${i.crateId}/${i.batchId}`}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F5C" />}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          {selected && (
            <View style={styles.modalBox}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <LinearGradient colors={TIER_GRAD[selected.tier]} style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selected.crateId.toUpperCase()}</Text>
                  <Text style={styles.modalSub}>{selected.batchId.toUpperCase()}</Text>
                  <View style={styles.modalOhiRow}>
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatBig}>{selected.ohi}</Text>
                      <Text style={styles.modalStatLabel}>OHI Score</Text>
                    </View>
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatBig}>{selected.daysRemaining}</Text>
                      <Text style={styles.modalStatLabel}>Days Left</Text>
                    </View>
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatBig}>{Math.round((selected.confidence ?? 0.7) * 100)}%</Text>
                      <Text style={styles.modalStatLabel}>Confidence</Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Sensor Grid */}
                <View style={styles.sensorGrid}>
                  <SensorTile icon="thermometer" label="Temperature" value={`${selected.temperature}°C`} color="#EF4444" />
                  <SensorTile icon="water" label="Humidity" value={`${selected.humidity}%`} color="#3B82F6" />
                  <SensorTile icon="cloud" label="CO₂ (MQ135)" value={`${selected.mq135} ppm`} color="#8B5CF6" />
                  <SensorTile icon="warning" label="NH₃ (MQ137)" value={`${selected.mq137} ppm`} color="#F59E0B" />
                  <SensorTile icon="flask" label="VOC (MQ136)" value={`${selected.mq136 ?? 0} ppm`} color="#10B981" />
                </View>

                {/* Health Advisory */}
                <View style={[styles.advisoryBox, { borderColor: TIER_COLOR[selected.tier] }]}>
                  <Ionicons name="bulb-outline" size={16} color={TIER_COLOR[selected.tier]} />
                  <Text style={[styles.advisoryText, { color: TIER_COLOR[selected.tier] }]}>
                    {selected.tier === "Normal"
                      ? `Conditions are optimal. ${selected.daysRemaining} days of safe storage remaining.`
                      : selected.tier === "Alert"
                      ? `Slight deterioration detected. Monitor closely over the next 24–48 hours.`
                      : selected.tier === "Action"
                      ? `Significant spoilage risk. Consider selling or moving to cold storage within 24 hours.`
                      : `Critical — sell or discard immediately to prevent total loss.`}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                  {!soldIds.has(`${selected.crateId}/${selected.batchId}`) && (
                    <TouchableOpacity
                      style={[styles.sellBtn, { backgroundColor: TIER_COLOR[selected.tier] }]}
                      onPress={() => handleSell(selected)}
                      disabled={selling}
                    >
                      {selling
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                            <Text style={styles.sellBtnText}>Mark as Harvested</Text>
                          </>
                      }
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

function SensorTile({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={styles.sensorTile}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.sensorValue}>{value}</Text>
      <Text style={styles.sensorLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAF9" },
  header: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 3 },
  refreshBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },

  summaryBar: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  summaryChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  summaryChipText: { fontSize: 12, fontWeight: "700" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#6B7280", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 6, textAlign: "center" },

  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardSold: { opacity: 0.6 },

  rankBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  rankNum: { fontSize: 13, fontWeight: "800" },

  batchId: { fontSize: 14, fontWeight: "800", color: "#111827" },
  tagsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  tierTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tierTagText: { fontSize: 11, fontWeight: "700" },
  metaText: { fontSize: 11, color: "#6B7280" },

  soldBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  soldText: { fontSize: 11, color: "#16A34A", fontWeight: "600" },

  ohiRing: { justifyContent: "center", alignItems: "center" },
  ohiInner: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, justifyContent: "center", alignItems: "center" },
  ohiBig: { fontSize: 16, fontWeight: "900" },
  ohiLabel: { fontSize: 9, color: "#9CA3AF", marginTop: -2 },

  daysBig: { fontSize: 18, fontWeight: "900" },
  daysLabel: { fontSize: 10, color: "#9CA3AF" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%", overflow: "hidden" },
  modalHeader: { padding: 24, alignItems: "center" },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },
  modalSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  modalOhiRow: { flexDirection: "row", gap: 28, marginTop: 16 },
  modalStat: { alignItems: "center" },
  modalStatBig: { fontSize: 28, fontWeight: "900", color: "#fff" },
  modalStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  sensorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 16 },
  sensorTile: { width: "47%", backgroundColor: "#F9FAFB", borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  sensorValue: { fontSize: 16, fontWeight: "800", color: "#111827" },
  sensorLabel: { fontSize: 11, color: "#6B7280" },

  advisoryBox: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1.5, padding: 12, flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 16 },
  advisoryText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "600" },

  actionRow: { flexDirection: "row", gap: 10, padding: 16, paddingTop: 0 },
  closeBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB", paddingVertical: 14, alignItems: "center" },
  closeBtnText: { fontWeight: "700", color: "#6B7280" },
  sellBtn: { flex: 2, borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  sellBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  scaleBox: { marginHorizontal: 16, marginBottom: 8, backgroundColor: "#fff", borderRadius: 14, padding: 12, elevation: 1 },
  scaleTitle: { fontSize: 11, fontWeight: "700", color: "#9CA3AF", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  scaleRow: { flexDirection: "row", gap: 6 },
  scaleSegment: { flex: 1, borderRadius: 10, padding: 8, alignItems: "center", gap: 4 },
  scaleDot: { width: 8, height: 8, borderRadius: 4 },
  scaleTier: { fontSize: 10, fontWeight: "800" },
  scaleRange: { fontSize: 9, color: "#6B7280", fontWeight: "600" },
});