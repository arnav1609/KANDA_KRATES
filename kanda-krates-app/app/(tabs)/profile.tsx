import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, RefreshControl, Modal, FlatList
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from "../../context/LanguageContext";
import { secureRequest, API_ENDPOINTS } from "../../config/api";
import { useRouter } from "expo-router";

type CrateInfo = { crateId: string; tier: string; ohi: number; daysRemaining: number; };

export default function ProfileScreen() {
  const { username, userRole, logout } = useAuth();
  const router = useRouter();

  const [crates, setCrates] = useState<CrateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [langModalVisible, setLangModalVisible] = useState(false);

  // Password change
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      // Fetch all sensors to get OHI per crate assigned to this user
      const [crateRes, sensorRes] = await Promise.all([
        secureRequest(API_ENDPOINTS.crates),
        secureRequest(API_ENDPOINTS.allSensors),
      ]);
      const allCrates = crateRes.ok ? await crateRes.json() : [];
      const sensors = sensorRes.ok ? await sensorRes.json() : {};

      const myCrates = allCrates.filter((c: any) => c.assignedFarmerUsername === username);
      const enriched: CrateInfo[] = myCrates.map((c: any) => {
        const batchKeys = Object.keys(sensors[c.crateId] || {});
        if (batchKeys.length === 0) return { crateId: c.crateId, tier: "—", ohi: 0, daysRemaining: 0 };
        const lastBatch = sensors[c.crateId][batchKeys[batchKeys.length - 1]];
        const ml = lastBatch?.ml_predictions || {};
        return { crateId: c.crateId, tier: ml.tier ?? "—", ohi: ml.ohi ?? 0, daysRemaining: ml.daysRemaining ?? 0 };
      });
      setCrates(enriched);
    } catch (e) { console.log("Profile fetch error:", e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [username]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSavePw = async () => {
    if (!currentPw || !newPw) return Alert.alert("Missing fields", "Fill in both fields.");
    if (newPw.length < 6) return Alert.alert("Too short", "Password must be at least 6 characters.");
    setSavingPw(true);
    try {
      const res = await secureRequest(`/api/farmer/${username}/password`, {
        method: "PUT",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      Alert.alert("✅ Password Updated", "Your password has been changed successfully.");
      setShowPwForm(false); setCurrentPw(""); setNewPw("");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally { setSavingPw(false); }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } }
    ]);
  };

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  const TIER_COLOR: Record<string, string> = {
    Normal: "#16A34A", Alert: "#D97706", Action: "#EA580C", Emergency: "#DC2626", "—": "#9CA3AF"
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F5C" />}
    >
      {/* Header */}
      <LinearGradient colors={["#1E6F5C", "#2D917A"]} style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{(username?.[0] ?? "?").toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{username}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name={userRole === "admin" ? "shield-checkmark" : "leaf"} size={12} color="#fff" />
          <Text style={styles.roleText}>{userRole === "admin" ? "Administrator" : "Farmer"}</Text>
        </View>
      </LinearGradient>

      {/* My Crates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗄️ My Assigned Crates</Text>
        {loading ? (
          <ActivityIndicator color="#1E6F5C" style={{ marginTop: 16 }} />
        ) : crates.length === 0 ? (
          <Text style={styles.emptyText}>No crates assigned yet. Contact your admin.</Text>
        ) : (
          crates.map((c) => (
            <View key={c.crateId} style={styles.crateCard}>
              <View style={[styles.crateIcon, { backgroundColor: `${TIER_COLOR[c.tier]}20` }]}>
                <Ionicons name="cube" size={20} color={TIER_COLOR[c.tier]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.crateId}>{c.crateId.toUpperCase().replace("CRATE", t("Crate").toUpperCase())}</Text>
                <Text style={styles.crateMeta}>{t("OHI")} {c.ohi} · {c.daysRemaining} {t("days")}</Text>
              </View>
              <View style={[styles.tierDot, { backgroundColor: TIER_COLOR[c.tier] }]}>
                <Text style={styles.tierDotText}>{c.tier}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ {t("Profile Settings")}</Text>

        <TouchableOpacity style={styles.settingRow} onPress={() => setLangModalVisible(true)}>
          <Ionicons name="language-outline" size={20} color="#1E6F5C" />
          <Text style={styles.settingLabel}>{t("System Language")}</Text>
          <Text style={{ color: "#1E6F5C", fontWeight: "600", marginRight: 8 }}>{LANGUAGE_LABELS[language]}</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow} onPress={() => setShowPwForm(!showPwForm)}>
          <Ionicons name="lock-closed-outline" size={20} color="#1E6F5C" />
          <Text style={styles.settingLabel}>Change Password</Text>
          <Ionicons name={showPwForm ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {showPwForm && (
          <View style={styles.pwForm}>
            <TextInput
              style={styles.pwInput}
              placeholder="Current password"
              value={currentPw}
              onChangeText={setCurrentPw}
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.pwInput}
              placeholder="New password (min 6 chars)"
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={styles.savePwBtn}
              onPress={handleSavePw}
              disabled={savingPw}
            >
              {savingPw ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.savePwText}>Save Password</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={[styles.settingRow, { marginTop: 8 }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={[styles.settingLabel, { color: "#DC2626" }]}>{t("Logout")}</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Ionicons name="leaf" size={14} color="#1E6F5C" />
        <Text style={styles.appInfoText}>Kanda Krates v2.0 · Smart Onion Storage</Text>
      </View>

      {/* Language Picker Modal */}
      <Modal visible={langModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("System Language")}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAF9" },
  header: { paddingTop: 56, paddingBottom: 28, alignItems: "center", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarLetter: { fontSize: 32, fontWeight: "900", color: "#fff" },
  name: { fontSize: 22, fontWeight: "900", color: "#fff" },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
  roleText: { fontSize: 12, color: "#fff", fontWeight: "700" },

  section: { margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 14 },
  emptyText: { color: "#9CA3AF", fontSize: 13, textAlign: "center", paddingVertical: 12 },

  crateCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  crateIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  crateId: { fontSize: 14, fontWeight: "800", color: "#111827" },
  crateMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  tierDot: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tierDotText: { fontSize: 11, color: "#fff", fontWeight: "700" },

  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827" },

  pwForm: { paddingTop: 12, gap: 10 },
  pwInput: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: "#E5E7EB", fontSize: 14, color: "#111827" },
  savePwBtn: { backgroundColor: "#1E6F5C", borderRadius: 12, padding: 14, alignItems: "center" },
  savePwText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  appInfo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 },
  appInfoText: { fontSize: 12, color: "#9CA3AF" },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 24, width: "100%", maxHeight: "80%", padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1A3C34" },
  langOptionBtn: { flex: 1, margin: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", backgroundColor: "#FAFAFA" },
  langOptionBtnActive: { borderColor: "#1E6F5C", backgroundColor: "#E1F2EE" },
  langOptionText: { fontSize: 15, fontWeight: "600", color: "#4B5563" },
  langOptionTextActive: { color: "#1E6F5C" }
});
