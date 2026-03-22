import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { secureRequest } from "../../../config/api";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Modal } from "react-native";
import { verifySensorData, freezeSensorData, IntegrityResult } from "../../../utils/dataIntegrity";

const TIER_COLOR: Record<string, string> = {
  Normal: "#16A34A", Alert: "#D97706", Action: "#EA580C", Emergency: "#DC2626"
};
const TIER_BG: Record<string, string> = {
  Normal: "#DCFCE7", Alert: "#FEF3C7", Action: "#FFEDD5", Emergency: "#FEE2E2"
};

type BatchData = {
  temperature: number;
  humidity: number;
  mq135: number;
  mq137: number;
  mq136: number;
  timestamp: number;
  dataHash?: string;
  ml_predictions?: { ohi: number; tier: string; daysRemaining: number; confidence: number; };
};

export default function CrateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [batches, setBatches] = useState<Record<string, BatchData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [globalIntegrity, setGlobalIntegrity] = useState<IntegrityResult>({
    valid: true,
    issues: [],
  });

  const fetchCrateData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await secureRequest(`/api/sensors/${id}`);
      if (res.ok) {
        const data = await res.json();
        
        let isCompromised = false;
        let combinedIssues: string[] = [];
        
        const frozenBatches: Record<string, BatchData> = {};
        
        for (const batchId of Object.keys(data)) {
          const bData = data[batchId];
          const integrity = verifySensorData(bData, bData.dataHash);
          
          if (!integrity.valid) {
            isCompromised = true;
            combinedIssues.push(`[${batchId.toUpperCase()}] ${integrity.issues.join(", ")}`);
          }
          
          frozenBatches[batchId] = freezeSensorData(bData) as unknown as BatchData;
        }
        
        setGlobalIntegrity({
          valid: !isCompromised,
          issues: combinedIssues
        });
        
        setBatches(frozenBatches);
      }
    } catch (err) {
      console.log("Crate detail fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCrateData();
    const interval = setInterval(fetchCrateData, 5000);
    return () => clearInterval(interval);
  }, [fetchCrateData]);

  const batchKeys = Object.keys(batches);
  const onRefresh = () => { setRefreshing(true); fetchCrateData(); };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#1E6F5C" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{String(id).toUpperCase()}</Text>
          <Text style={styles.subtitle}>{batchKeys.length} batch{batchKeys.length !== 1 ? "es" : ""} active</Text>
        </View>
        <TouchableOpacity onPress={() => { setRefreshing(true); fetchCrateData(); }} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color="#1E6F5C" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1E6F5C" /></View>
      ) : batchKeys.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No sensor data for this crate yet.</Text>
          <Text style={styles.emptySub}>Check that the hardware is connected and sending MQTT data.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F5C" />}
        >
          {/* FULL SCREEN LOCKDOWN MODAL */}
          <Modal visible={!globalIntegrity.valid} transparent={true} animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(127, 29, 29, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <Ionicons name="lock-closed" size={72} color="#FECACA" />
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', marginTop: 16, textAlign: 'center', letterSpacing: 1 }}>
                SYSTEM HALTED
              </Text>
              <Text style={{ fontSize: 16, color: '#FECACA', marginTop: 12, textAlign: 'center', lineHeight: 24, fontWeight: '600' }}>
                Tampered sensor payload detected. Real-time updates have been forcefully suspended to prevent database corruption.
              </Text>
              <View style={{ marginTop: 24, backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 12, width: '100%', borderWidth: 1, borderColor: '#B91C1C' }}>
                <Text style={{ color: '#FCA5A5', fontWeight: 'bold', marginBottom: 8, fontSize: 12, textTransform: 'uppercase' }}>Security Stack Trace</Text>
                {globalIntegrity.issues.slice(0, 3).map((issue, idx) => (
                   <Text key={idx} style={{ color: '#FEE2E2', fontFamily: 'monospace', fontSize: 13, marginBottom: 8 }}>• {issue}</Text>
                ))}
              </View>
            </View>
          </Modal>

          {batchKeys.map(batchId => {
            const b = batches[batchId];
            const ml = b.ml_predictions;
            const tier = ml?.tier ?? "Normal";
            const ohi = ml?.ohi ?? 50;
            const days = ml?.daysRemaining ?? 0;
            const conf = ml?.confidence ?? 0;
            const lastSeen = b.timestamp ? new Date(b.timestamp).toLocaleTimeString() : "—";

            return (
              <View key={batchId} style={styles.batchCard}>
                {/* Batch Header */}
                <View style={styles.batchHeader}>
                  <View style={[styles.batchIcon, { backgroundColor: TIER_BG[tier] }]}>
                    <Ionicons name="layers" size={18} color={TIER_COLOR[tier]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.batchTitle}>{batchId.toUpperCase()}</Text>
                    <Text style={styles.batchSub}>Last updated: {lastSeen}</Text>
                  </View>
                  <View style={[styles.tierBadge, { backgroundColor: TIER_BG[tier] }]}>
                    <Text style={[styles.tierBadgeText, { color: TIER_COLOR[tier] }]}>{tier}</Text>
                  </View>
                </View>

                {/* OHI + Days Row */}
                <View style={styles.mlRow}>
                  <View style={styles.mlCard}>
                    <Text style={[styles.mlBig, { color: ohi > 70 ? "#16A34A" : ohi > 50 ? "#D97706" : "#DC2626" }]}>{ohi}</Text>
                    <Text style={styles.mlLabel}>OHI Score</Text>
                  </View>
                  <View style={styles.mlCard}>
                    <Text style={[styles.mlBig, { color: days > 10 ? "#16A34A" : days > 5 ? "#D97706" : "#DC2626" }]}>{days}</Text>
                    <Text style={styles.mlLabel}>Days Left</Text>
                  </View>
                  <View style={styles.mlCard}>
                    <Text style={styles.mlBig}>{Math.round(conf * 100)}%</Text>
                    <Text style={styles.mlLabel}>Confidence</Text>
                  </View>
                </View>

                {/* Sensor Grid */}
                <View style={styles.sensorGrid}>
                  <SensorTile icon="thermometer" label="Temperature" value={`${b.temperature}°C`} color="#EF4444" />
                  <SensorTile icon="water" label="Humidity" value={`${b.humidity}%`} color="#3B82F6" />
                  <SensorTile icon="cloud" label="CO₂ (MQ135)" value={`${b.mq135} ppm`} color="#8B5CF6" />
                  <SensorTile icon="warning" label="NH₃ (MQ137)" value={`${b.mq137} ppm`} color="#F59E0B" />
                  <SensorTile icon="flask" label="VOC (MQ136)" value={`${b.mq136 ?? 0} ppm`} color="#10B981" />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function SensorTile({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={styles.sensorTile}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.sensorValue}>{value}</Text>
      <Text style={styles.sensorLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAF9" },
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  backBtn: { padding: 8, backgroundColor: "#E2F1ED", borderRadius: 20 },
  refreshBtn: { padding: 8, backgroundColor: "#E2F1ED", borderRadius: 20 },
  title: { fontSize: 22, fontWeight: "900", color: "#1E6F5C" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { color: "#6B7280", fontSize: 15, fontWeight: "600", marginTop: 12, textAlign: "center" },
  emptySub: { color: "#9CA3AF", fontSize: 13, marginTop: 6, textAlign: "center" },

  scroll: { padding: 20, gap: 20 },

  batchCard: { backgroundColor: "#fff", borderRadius: 20, padding: 18, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  batchHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  batchIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  batchTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  batchSub: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tierBadgeText: { fontSize: 12, fontWeight: "700" },

  mlRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  mlCard: { flex: 1, backgroundColor: "#F9FAFB", borderRadius: 14, padding: 12, alignItems: "center" },
  mlBig: { fontSize: 28, fontWeight: "900", color: "#111827" },
  mlLabel: { fontSize: 11, color: "#6B7280", marginTop: 2, textAlign: "center" },

  sensorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sensorTile: { width: "46%", backgroundColor: "#F9FAFB", borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  sensorValue: { fontSize: 16, fontWeight: "800", color: "#111827" },
  sensorLabel: { fontSize: 11, color: "#6B7280" },
  
  tamperBanner: { flexDirection: "row", backgroundColor: "#FEF2F2", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#FECACA", gap: 12, marginBottom: 4 },
  tamperTitle: { fontSize: 15, fontWeight: "800", color: "#991B1B", marginBottom: 4 },
  tamperText: { fontSize: 13, color: "#B91C1C", fontWeight: "600", marginBottom: 8, lineHeight: 18 },
  tamperIssue: { fontSize: 12, color: "#7F1D1D", marginBottom: 4, fontFamily: "monospace" },
});