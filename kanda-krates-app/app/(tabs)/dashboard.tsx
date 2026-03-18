import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { secureRequest, API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import {
  verifySensorData,
  freezeSensorData,
  type IntegrityResult,
} from "../../utils/dataIntegrity";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, LanguageCode } from "../../context/LanguageContext";

type Sensor = {
  value: number;
  unit: string;
};

type SensorsState = {
  temp: Sensor;
  humidity: Sensor;
  co2: Sensor;
  nh3: Sensor;
  voc: Sensor;
  stock: Sensor;
  ml_predictions?: {
    ohi: number;
    tier: "Normal" | "Alert" | "Action" | "Emergency";
    daysRemaining: number;
    confidence: number;
  };
};

type TierResult = {
  label: "Normal" | "Alert" | "Action" | "Emergency";
  bg: string;
  text: string;
  note: string;
};

/* ================= GAS ANALYSIS ================= */

function evaluateGas(value: number, type: "co2" | "nh3" | "voc", t: any): TierResult {
  if (
    (type === "co2" && value > 10000) ||
    (type === "nh3" && value > 10) ||
    (type === "voc" && value > 5)
  ) {
    return {
      label: "Emergency",
      bg: "#FEE2E2",
      text: "#B91C1C",
      note: t("Immediate action required"),
    };
  }

  if (
    (type === "co2" && value > 5000) ||
    (type === "nh3" && value > 2) ||
    (type === "voc" && value > 2)
  ) {
    return {
      label: "Action",
      bg: "#FFEDD5",
      text: "#C2410C",
      note: t("Take corrective action"),
    };
  }

  if (
    (type === "co2" && value > 2000) ||
    (type === "nh3" && value > 0.5) ||
    (type === "voc" && value > 0.5)
  ) {
    return {
      label: "Alert",
      bg: "#FEF3C7",
      text: "#B45309",
      note: "Monitor closely",
    };
  }

  return {
    label: "Normal",
    bg: "#DCFCE7",
    text: "#166534",
    note: t("Safe range"),
  };
}

/* ================= DASHBOARD ================= */

export default function Dashboard() {
  const { language, t } = useLanguage();
  const { logout } = useAuth();

  const [sensors, setSensors] = useState<SensorsState>({
    temp: { value: 0, unit: "°C" },
    humidity: { value: 0, unit: "%" },
    co2: { value: 0, unit: "ppm" },
    nh3: { value: 0, unit: "ppm" },
    voc: { value: 0, unit: "ppm" },
    stock: { value: 0, unit: "kg" },
  });

  const [integrity, setIntegrity] = useState<IntegrityResult>({
    valid: true,
    issues: [],
  });

  const [marketPrice, setMarketPrice] = useState<any>(null);
  const [advisory, setAdvisory] = useState<any>(null);

  /* ================= FETCH SENSOR DATA (SECURED) ================= */

  useEffect(() => {
    async function fetchSensors() {
      try {
        const res = await secureRequest(
          API_ENDPOINTS.sensors("crate1", "batch1")
        );
        const data = await res.json();

        // ── Integrity check ──
        const integrityResult = verifySensorData(data, data.dataHash);
        setIntegrity(integrityResult);

        if (!integrityResult.valid) {
          console.warn("[Security] Sensor data integrity issues:", integrityResult.issues);
        }

        // ── Freeze data to prevent tampering ──
        const frozenData = freezeSensorData(data);

        setSensors({
          temp: { value: frozenData.temperature || 0, unit: "°C" },
          humidity: { value: frozenData.humidity || 0, unit: "%" },
          co2: { value: frozenData.mq135 || 0, unit: "ppm" },
          nh3: { value: frozenData.mq137 || 0, unit: "ppm" },
          voc: { value: frozenData.mq136 || 0, unit: "ppm" },
          stock: { value: 2367, unit: "kg" },
          ml_predictions: frozenData.ml_predictions || {
            ohi: 50, tier: "Alert", daysRemaining: 0, confidence: 0
          }
        });
      } catch (err) {
        console.log("[Security] Sensor fetch error:", err);
      }

      // Fetch Live Market Data
      try {
        const marketRes = await secureRequest(API_ENDPOINTS.marketPrice);
        const mData = await marketRes.json();
        setMarketPrice(mData);
      } catch (err) {
        console.log("Market fetch error:", err);
      }

      // Fetch Sell/Hold Advisory for crate1
      try {
        const advisoryRes = await secureRequest(API_ENDPOINTS.advisory("crate1", language));
        const aData = await advisoryRes.json();
        setAdvisory(aData);
      } catch (err) {
        console.log("Advisory fetch error:", err);
      }
    }

    fetchSensors();
    const interval = setInterval(fetchSensors, 2000);
    return () => clearInterval(interval);
  }, []);

  /* ================= OHI ================= */

  // Use the objective ML-predicted OHI instead of the hardcoded linear one
  const ohi = sensors.ml_predictions?.ohi ?? 50;
  const days = sensors.ml_predictions?.daysRemaining ?? 0;

  return (
    <ScrollView style={styles.container}>
      {/* Security Status Bar */}
      <View style={styles.securityBar}>
        <View style={styles.securityLeft}>
          <Ionicons
            name={integrity.valid ? "shield-checkmark" : "warning"}
            size={16}
            color={integrity.valid ? "#16A34A" : "#EF4444"}
          />
          <Text
            style={[
              styles.securityText,
              !integrity.valid && { color: "#EF4444" },
            ]}
          >
            {integrity.valid ? t("🔒 Secure Data Feed") : t("⚠️ Data integrity issue detected!")}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          <Text style={styles.logoutText}>{t("Logout")}</Text>
        </TouchableOpacity>
      </View>

      {/* Tamper Warning Banner */}
      {!integrity.valid && (
        <View style={styles.tamperBanner}>
          <Ionicons name="alert-circle" size={20} color="#B91C1C" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.tamperTitle}>{t("⚠️ Data integrity issue detected!")}</Text>
            <Text style={styles.tamperText}>{t("Sensor data may have been tampered with. Please verify physically.")}</Text>
            {integrity.issues.map((issue, idx) => (
              <Text key={idx} style={styles.tamperIssue}>
                • {issue}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Market Price Card */}
      {marketPrice && (
        <View style={styles.marketCard}>
          <View style={styles.marketHeader}>
            <Ionicons name="trending-up" size={20} color="#047857" />
            <Text style={styles.marketTitle}>{t("Live APMC Rate")} ({marketPrice.market})</Text>
          </View>
          <View style={styles.marketRates}>
            <View style={styles.rateBox}>
              <Text style={styles.rateLabel}>{t("Avg Model")}</Text>
              <Text style={styles.rateValuePrimary}>₹{marketPrice.priceModal}</Text>
            </View>
            <View style={styles.rateDivider} />
            <View style={styles.rateMinMax}>
              <Text style={styles.rateSub}>{t("Min:")} ₹{marketPrice.priceMin}</Text>
              <Text style={styles.rateSub}>{t("Max:")} ₹{marketPrice.priceMax}</Text>
            </View>
          </View>
          <Text style={styles.rateUnit}>{t("Per")} {marketPrice.unit}</Text>
        </View>
      )}

      {/* ── Sell / Hold Advisory Engine ── */}
      {advisory?.recommendations?.length > 0 && (
        <View style={styles.advisorySection}>
          <View style={styles.advisoryHeader}>
            <Ionicons name="analytics" size={20} color="#7C3AED" />
            <Text style={styles.advisoryTitle}>{t("AI Sell Advisory")}</Text>
          </View>
          {advisory.recommendations.map((rec: any) => (
            <View
              key={rec.batchId}
              style={[styles.advisoryCard, { borderLeftColor: rec.color }]}
            >
              <View style={styles.advisoryRow}>
                <Text style={[styles.advisoryAction, { color: rec.color }]}>
                  {rec.urgency}
                </Text>
                <View style={[styles.advisoryBadge, { backgroundColor: rec.color + "22" }]}>
                  <Text style={[styles.advisoryBadgeText, { color: rec.color }]}>
                    {rec.batchId.toUpperCase().replace("BATCH", t("Batch").toUpperCase())}
                  </Text>
                </View>
              </View>
              <Text style={styles.advisoryReason}>{rec.reason}</Text>
              <View style={styles.advisoryMeta}>
                <Text style={styles.advisoryMetaItem}>📊 OHI: {rec.ohi}/100</Text>
                <Text style={styles.advisoryMetaItem}>⏳ {rec.daysRemaining} {t("days left")}</Text>
                <Text style={styles.advisoryMetaItem}>₹{rec.marketPriceModal}/kg</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <OhiGauge value={ohi} t={t} />

      <HistoryChart crateId="crate1" language={language} t={t} />

      <View style={styles.grid}>
        <SensorCard
          title={t("Temperature")}
          sensor={sensors.temp}
          tier={{
            label: "Normal",
            bg: "#EEF2FF",
            text: "#3730A3",
            note: t("Stable"),
          }}
          t={t}
        />
        <SensorCard
          title={t("Humidity")}
          sensor={sensors.humidity}
          tier={{
            label: "Normal",
            bg: "#ECFEFF",
            text: "#155E75",
            note: t("Optimal"),
          }}
          t={t}
        />
        <SensorCard
          title={t("CO₂")}
          sensor={sensors.co2}
          tier={evaluateGas(sensors.co2.value, "co2", t)}
          t={t}
        />
        <SensorCard
          title={t("NH₃")}
          sensor={sensors.nh3}
          tier={evaluateGas(sensors.nh3.value, "nh3", t)}
          t={t}
        />
        <SensorCard
          title={t("VOC")}
          sensor={sensors.voc}
          tier={evaluateGas(sensors.voc.value, "voc", t)}
          t={t}
        />
        <SensorCard
          title={t("Stock")}
          sensor={sensors.stock}
          tier={{
            label: "Normal",
            bg: "#F8FAFC",
            text: "#111827",
            note: t("Inventory"),
          }}
          t={t}
        />
      </View>
    </ScrollView>
  );
}

/* ================= SENSOR CARD ================= */

function SensorCard({ title, sensor, tier, t }: any) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: tier.bg }]}
        onPress={() => tier.label !== "Normal" && setOpen(true)}
      >
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.cardValue, { color: tier.text }]}>
          {sensor.value} {sensor.unit}
        </Text>
        <View style={styles.pill}>
          <Text style={[styles.pillText, { color: tier.text }]}>
            {t(tier.label)}
          </Text>
        </View>
        <Text style={styles.note}>{tier.note}</Text>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { borderTopColor: tier.text }]}>
            <Text style={[styles.modalTitle, { color: tier.text }]}>
              {t(tier.label)}
            </Text>
            <Text style={styles.modalItem}>{t("Check ventilation and inspect onions.")}</Text>
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>{t("Acknowledge")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ================= OHI GAUGE ================= */

function OhiGauge({ value, t }: { value: number; t: any }) {
  const color =
    value > 85
      ? "#16A34A"
      : value > 70
      ? "#F59E0B"
      : value > 55
      ? "#F97316"
      : "#DC2626";

  return (
    <View style={styles.ohiBox}>
      <Text style={[styles.ohiValue, { color }]}>{value}</Text>
      <Text style={styles.ohiLabel}>{t("Onion Health Index")}</Text>
    </View>
  );
}

/* ================= HISTORY CHART & AI SUMMARY ================= */

import { LineChart } from "react-native-chart-kit";
import { Dimensions, ActivityIndicator } from "react-native";
const { width } = Dimensions.get("window");

function HistoryChart({ crateId, language, t }: { crateId: string, language: string, t: any }) {
  const [chartData, setChartData] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string>("Loading AI Health Analysis...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        // Load history data points
        const histRes = await secureRequest(API_ENDPOINTS.history(crateId));
        const history = await histRes.json();
        
        if (history && history.length > 0) {
          // Format labels (HH:MM) and data for chart
          const labels = history.map((h: any) => {
             const d = new Date(h.timestamp);
             return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
          });
          const temps = history.map((h: any) => h.temperature);
          const hums = history.map((h: any) => h.humidity);
          
          setChartData({
            labels: labels.slice(-6), // Show only last 6 points to fit screen
            datasets: [
              { data: temps.slice(-6), color: () => '#EF4444', strokeWidth: 2 }, // Red Temp
              { data: hums.slice(-6), color: () => '#3B82F6', strokeWidth: 2 }   // Blue Hum
            ],
            legend: [`${t("Temperature")} °C`, `${t("Humidity")} %`]
          });
        }

        // Load AI Summary sentence
        const aiRes = await secureRequest(API_ENDPOINTS.historyHealth(crateId, language));
        const aiData = await aiRes.json();
        setAiSummary(aiData.summary);
      } catch (err) {
        console.log("Chart fetch error:", err);
        setAiSummary(t("AI Analysis temporarily unavailable."));
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
    // Refresh history chart and AI summary every 5 minutes
    const interval = setInterval(fetchHistory, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [crateId, language]);

  if (loading && !chartData) {
    return (
      <View style={[styles.aiSummaryBox, { alignItems: 'center', justifyContent: 'center' }]}>
         <ActivityIndicator size="small" color="#1E6F5C" />
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{t("24-Hour Environment Trends")}</Text>
      
      {chartData ? (
        <LineChart
          data={chartData}
          width={width - 40} // pad-20 each side
          height={220}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" }
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      ) : (
        <Text style={styles.chartEmpty}>{t("Not enough historical data collected yet.")}</Text>
      )}

      {/* AI Health Explainer Box */}
      <View style={styles.aiSummaryBox}>
        <View style={styles.aiSummaryHeader}>
          <Ionicons name="sparkles" size={16} color="#8B5CF6" />
          <Text style={styles.aiSummaryTitle}>{t("AI Health Analysis")}</Text>
        </View>
        <Text style={styles.aiSummaryText}>{aiSummary}</Text>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F7FAF9",
    padding: 16,
  },

  securityBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },

  securityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  securityText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "600",
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
  },

  logoutText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },

  tamperBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  tamperTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B91C1C",
  },

  tamperText: {
    fontSize: 12,
    color: "#991B1B",
    marginTop: 2,
  },

  tamperIssue: {
    fontSize: 11,
    color: "#B91C1C",
    marginTop: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
  },

  cardTitle: {
    color: "#6B7280",
    fontSize: 13,
  },

  cardValue: {
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 6,
  },

  pill: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  note: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 6,
  },

  ohiBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
  },

  ohiValue: {
    fontSize: 40,
    fontWeight: "800",
  },

  ohiLabel: {
    color: "#6B7280",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 6,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  modalItem: {
    marginTop: 10,
    fontSize: 14,
  },

  modalButton: {
    marginTop: 20,
    backgroundColor: "#1E6F5C",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  chartContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center'
  },
  
  chartTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E6F5C",
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 5
  },

  chartEmpty: {
    padding: 20,
    color: "#9CA3AF",
    fontStyle: 'italic'
  },

  aiSummaryBox: {
    backgroundColor: "#F3F0FF", // Very light purple
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#EDE9FE"
  },

  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },

  aiSummaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6D28D9" // Purple
  },

  aiSummaryText: {
    fontSize: 14,
    color: "#4B5563",
    paddingHorizontal: 15,
    paddingBottom: 15,
    fontStyle: 'italic',
    lineHeight: 20
  },

  /* Market Price Card Styles */
  marketCard: {
    backgroundColor: "#DCFCE7",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  marketHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#047857",
  },
  marketRates: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  rateBox: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
    fontWeight: "600",
  },
  rateValuePrimary: {
    fontSize: 24,
    fontWeight: "800",
    color: "#166534",
  },
  rateDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  rateMinMax: {
    flex: 1,
    gap: 4,
  },
  rateSub: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  rateUnit: {
    fontSize: 11,
    color: "#047857",
    textAlign: "right",
    fontWeight: "600",
  },

  /* ── Advisory Engine Styles ── */
  advisorySection: {
    marginBottom: 20,
  },
  advisoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  advisoryTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#7C3AED",
  },
  advisoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderLeftWidth: 5,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  advisoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  advisoryAction: {
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
    flexWrap: "wrap",
  },
  advisoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  advisoryBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  advisoryReason: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
    marginBottom: 10,
  },
  advisoryMeta: {
    flexDirection: "row",
    gap: 12,
  },
  advisoryMetaItem: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
});