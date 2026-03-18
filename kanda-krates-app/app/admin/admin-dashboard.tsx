import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { secureRequest, API_ENDPOINTS } from "../../config/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";

type FarmerData = { username: string; phoneNumber: string; };
type CrateData = { _id: string; crateId: string; assignedFarmerUsername: string; hardwareMacAddress: string; };
type AlertItem = { crateId: string; batchId: string; ohi: number; tier: string; daysRemaining: number; temperature: number; humidity: number; confidence?: number; };
type FleetData = { totalCrates: number; totalBatches: number; avgOhi: number; tierCounts: Record<string, number>; cratesSummary: AlertItem[]; generatedAt: string; };

const TIER_COLOR: Record<string, string> = {
  Normal: "#16A34A", Alert: "#D97706", Action: "#EA580C", Emergency: "#DC2626"
};
const TIER_BG: Record<string, string> = {
  Normal: "#DCFCE7", Alert: "#FEF3C7", Action: "#FFEDD5", Emergency: "#FEE2E2"
};

export default function AdminDashboard() {
  const router = useRouter();
  const { logout, username } = useAuth();
  const [activeTab, setActiveTab] = useState<"home" | "crates" | "farmers" | "analytics">("home");

  const DEMO_FLEET: FleetData = {
    totalCrates: 4, totalBatches: 7, avgOhi: 69,
    tierCounts: { Normal: 3, Alert: 2, Action: 1, Emergency: 1 },
    generatedAt: new Date().toISOString(),
    cratesSummary: [
      { crateId: "crate1", batchId: "batch1", ohi: 88, tier: "Normal",    daysRemaining: 42, confidence: 0.96, temperature: 25.4, humidity: 63 },
      { crateId: "crate1", batchId: "batch2", ohi: 74, tier: "Alert",     daysRemaining: 18, confidence: 0.91, temperature: 28.1, humidity: 71 },
      { crateId: "crate2", batchId: "batch1", ohi: 52, tier: "Action",    daysRemaining: 7,  confidence: 0.88, temperature: 33.2, humidity: 79 },
      { crateId: "crate2", batchId: "batch2", ohi: 91, tier: "Normal",    daysRemaining: 55, confidence: 0.97, temperature: 24.8, humidity: 61 },
      { crateId: "crate3", batchId: "batch1", ohi: 29, tier: "Emergency", daysRemaining: 2,  confidence: 0.94, temperature: 39.5, humidity: 88 },
      { crateId: "crate3", batchId: "batch2", ohi: 67, tier: "Alert",     daysRemaining: 14, confidence: 0.89, temperature: 30.0, humidity: 74 },
      { crateId: "crate4", batchId: "batch1", ohi: 83, tier: "Normal",    daysRemaining: 37, confidence: 0.95, temperature: 26.3, humidity: 65 },
    ]
  };

  const [farmers, setFarmers] = useState<FarmerData[]>([]);
  const [crates, setCrates] = useState<CrateData[]>([]);
  const [fleet, setFleet] = useState<FleetData | null>(DEMO_FLEET);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Crate Registration Modal
  const [crateModal, setCrateModal] = useState(false);
  const [newCrateId, setNewCrateId] = useState("");
  const [newFarmerUser, setNewFarmerUser] = useState("");
  const [newMacAddress, setNewMacAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Farmer Edit Modal
  const [editFarmerModal, setEditFarmerModal] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<FarmerData | null>(null);
  const [editPhone, setEditPhone] = useState("");

  // Crate Reassign Modal
  const [reassignModal, setReassignModal] = useState(false);
  const [reassignCrate, setReassignCrate] = useState<CrateData | null>(null);
  const [reassignTarget, setReassignTarget] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [farmRes, crateRes] = await Promise.all([
        secureRequest(API_ENDPOINTS.farmers),
        secureRequest(API_ENDPOINTS.crates),
      ]);
      if (farmRes.ok) setFarmers(await farmRes.json());
      if (crateRes.ok) setCrates(await crateRes.json());

      // Fleet analytics fetched separately - slow ML calls won't block crates/farmers
      try {
        const fleetRes = await secureRequest(API_ENDPOINTS.fleetAnalytics);
        if (fleetRes.ok) setFleet(await fleetRes.json());
      } catch (fleetErr) {
        console.log("[Admin] Fleet analytics unavailable:", fleetErr);
      }
    } catch (err) {
      Alert.alert("Error", "Could not fetch data from the server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // --- Register Crate ---
  const registerCrate = async () => {
    if (!newCrateId || !newFarmerUser) {
      Alert.alert("Missing Fields", "Crate ID and Farmer Username are required.");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await secureRequest(API_ENDPOINTS.crates, {
        method: "POST",
        body: JSON.stringify({ crateId: newCrateId.trim(), assignedFarmerUsername: newFarmerUser.trim(), hardwareMacAddress: newMacAddress.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register crate");
      Alert.alert("Success", "Crate registered!");
      setCrateModal(false);
      setNewCrateId(""); setNewFarmerUser(""); setNewMacAddress("");
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete Crate ---
  const deleteCrate = (crateId: string) => {
    Alert.alert("Delete Crate", `Remove ${crateId.toUpperCase()}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const res = await secureRequest(API_ENDPOINTS.crate(crateId), { method: "DELETE" });
        if (res.ok) { Alert.alert("Deleted", `${crateId} removed.`); fetchData(); }
        else Alert.alert("Error", "Failed to delete crate.");
      }},
    ]);
  };

  // --- Reassign Crate ---
  const submitReassign = async () => {
    if (!reassignCrate || !reassignTarget.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await secureRequest(API_ENDPOINTS.crateReassign(reassignCrate.crateId), {
        method: "PUT",
        body: JSON.stringify({ assignedFarmerUsername: reassignTarget.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reassign");
      Alert.alert("Success", "Crate reassigned!");
      setReassignModal(false); setReassignTarget(""); setReassignCrate(null);
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Edit Farmer ---
  const submitEditFarmer = async () => {
    if (!editingFarmer) return;
    try {
      setIsSubmitting(true);
      const res = await secureRequest(API_ENDPOINTS.farmer(editingFarmer.username), {
        method: "PUT",
        body: JSON.stringify({ phoneNumber: editPhone.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update farmer");
      Alert.alert("Success", "Farmer updated!");
      setEditFarmerModal(false); setEditingFarmer(null);
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete Farmer ---
  const deleteFarmer = (username: string) => {
    Alert.alert("Remove Farmer", `Remove ${username}? Their crates will be unassigned.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        const res = await secureRequest(API_ENDPOINTS.farmer(username), { method: "DELETE" });
        if (res.ok) { Alert.alert("Removed", `${username} removed.`); fetchData(); }
        else Alert.alert("Error", "Failed to remove farmer.");
      }},
    ]);
  };

  const alerts = fleet?.cratesSummary.filter(c => c.tier !== "Normal") ?? [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1B2A47", "#243656"]} style={styles.header}>
        <View>
          <Text style={styles.greetText}>Welcome back,</Text>
          <Text style={styles.title}>{username ?? "Admin"}</Text>
        </View>
        <TouchableOpacity onPress={async () => { await logout(); router.replace("/login"); }} style={styles.logoutIconBtn}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </LinearGradient>

      {/* --- Stats Row --- */}
      {fleet && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
          <StatCard label="Total Crates" value={String(fleet.totalCrates)} icon="cube" color="#1E6F5C" />
          <StatCard label="Farmers" value={String(farmers.length)} icon="people" color="#2563EB" />
          <StatCard label="Avg OHI" value={`${fleet.avgOhi}/100`} icon="pulse" color={fleet.avgOhi > 70 ? "#16A34A" : fleet.avgOhi > 50 ? "#D97706" : "#DC2626"} />
          <StatCard label="Critical" value={String((fleet.tierCounts.Emergency || 0) + (fleet.tierCounts.Action || 0))} icon="warning" color="#DC2626" />
          <StatCard label="Normal" value={String(fleet.tierCounts.Normal || 0)} icon="checkmark-circle" color="#16A34A" />
        </ScrollView>
      )}

      {/* --- Global Alert Feed --- */}
      {alerts.length > 0 && (
        <View style={styles.alertFeedBox}>
          <View style={styles.alertFeedHeader}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.alertFeedTitle}>Active Alerts ({alerts.length})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {alerts.map((a, i) => (
              <View key={i} style={[styles.alertChip, { backgroundColor: TIER_BG[a.tier] }]}>
                <Text style={[styles.alertChipTier, { color: TIER_COLOR[a.tier] }]}>{a.tier}</Text>
                <Text style={styles.alertChipCrate}>{a.crateId.toUpperCase()}</Text>
                <Text style={styles.alertChipDetail}>OHI: {a.ohi} - {a.daysRemaining}d</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* --- Tabs --- */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0 }}>
        <View style={styles.tabs}>
          {(["home", "crates", "farmers", "analytics"] as const).map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === "home" ? "Home" : tab === "crates" ? "Crates" : tab === "farmers" ? "Farmers" : "Analytics"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* --- Tab Content --- */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1E6F5C" /></View>
      ) : activeTab === "home" ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F5C" />}>

          {/* Fleet Stats */}
          {fleet && (
            <View style={styles.homeStatsGrid}>
              <HomeStatTile label="Crates" value={String(fleet.totalCrates)} icon="cube" color="#1E6F5C" />
              <HomeStatTile label="Farmers" value={String(farmers.length)} icon="people" color="#2563EB" />
              <HomeStatTile label="Avg OHI" value={`${fleet.avgOhi}`} icon="pulse"
                color={fleet.avgOhi > 70 ? "#16A34A" : fleet.avgOhi > 50 ? "#D97706" : "#DC2626"} />
              <HomeStatTile label="Critical" value={String((fleet.tierCounts.Emergency || 0) + (fleet.tierCounts.Action || 0))} icon="warning" color="#DC2626" />
            </View>
          )}

          {/* Critical Alert List */}
          {alerts.length > 0 && (
            <View style={styles.homeSection}>
              <Text style={styles.homeSectionTitle}>Batches Needing Action</Text>
              {alerts.map((a, i) => (
                <View key={i} style={[styles.homeAlertRow, { borderLeftColor: TIER_COLOR[a.tier] }]}>
                  <View style={[styles.homeAlertDot, { backgroundColor: TIER_COLOR[a.tier] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.homeAlertCrate}>{a.crateId.toUpperCase()} / {a.batchId}</Text>
                    <Text style={styles.homeAlertMeta}>OHI {a.ohi} - {a.daysRemaining}d - {a.temperature}C</Text>
                  </View>
                  <View style={[styles.tierBadge, { backgroundColor: TIER_BG[a.tier] }]}>
                    <Text style={[styles.tierBadgeText, { color: TIER_COLOR[a.tier] }]}>{a.tier}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.homeSection}>
            <Text style={styles.homeSectionTitle}>Quick Navigation</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={styles.homeQA} onPress={() => setActiveTab("crates")}>
                <Ionicons name="cube" size={22} color="#1E6F5C" />
                <Text style={styles.homeQAText}>Manage Crates</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.homeQA} onPress={() => setActiveTab("farmers")}>
                <Ionicons name="people" size={22} color="#2563EB" />
                <Text style={styles.homeQAText}>Manage Farmers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.homeQA} onPress={() => setActiveTab("analytics")}>
                <Ionicons name="stats-chart" size={22} color="#7C3AED" />
                <Text style={styles.homeQAText}>Fleet Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : activeTab === "crates" ? (
        <>
          <TouchableOpacity style={styles.addCrateBtn} onPress={() => setCrateModal(true)}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.addCrateBtnText}>Register New Crate</Text>
          </TouchableOpacity>
          <FlatList
            data={crates}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F5C" />}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No crates registered.</Text></View>}
            renderItem={({ item }) => {
              const farmer = farmers.find(f => f.username === item.assignedFarmerUsername);
              const crateAlert = fleet?.cratesSummary.find(c => c.crateId === item.crateId);
              const tier = crateAlert?.tier ?? "Normal";
              return (
                <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/admin/crate/[id]", params: { id: item.crateId } })} activeOpacity={0.75}>
                  <View style={[styles.crateAvatar, { backgroundColor: TIER_BG[tier] }]}>
                    <Ionicons name="cube" size={20} color={TIER_COLOR[tier]} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.crateId.toUpperCase()}</Text>
                    <Text style={styles.cardSub}>Farmer: {item.assignedFarmerUsername || "Unassigned"}</Text>
                    {farmer && <Text style={styles.cardMeta}>📞 {farmer.phoneNumber}</Text>}
                    {crateAlert && <Text style={[styles.tierBadge, { color: TIER_COLOR[tier] }]}>{tier} - OHI {crateAlert.ohi} - {crateAlert.daysRemaining}d</Text>}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => { setReassignCrate(item); setReassignTarget(item.assignedFarmerUsername); setReassignModal(true); }} style={styles.actionBtn}>
                      <Ionicons name="swap-horizontal" size={16} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteCrate(item.crateId)} style={styles.actionBtnRed}>
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      ) : activeTab === "farmers" ? (
        <FlatList
          data={farmers}
          keyExtractor={item => item.username}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F5C" />}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No farmers registered.</Text></View>}
          renderItem={({ item }) => {
            const farmerCrates = crates.filter(c => c.assignedFarmerUsername === item.username);
            return (
              <View style={styles.card}>
                <View style={styles.farmerAvatar}>
                  <Ionicons name="person" size={20} color="#2563EB" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.username}</Text>
                  <Text style={styles.cardSub}> {item.phoneNumber}</Text>
                  <Text style={styles.cardMeta}> {farmerCrates.length} crate{farmerCrates.length !== 1 ? "s" : ""} assigned</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => { setEditingFarmer(item); setEditPhone(item.phoneNumber); setEditFarmerModal(true); }} style={styles.actionBtn}>
                    <Ionicons name="pencil" size={16} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteFarmer(item.username)} style={styles.actionBtnRed}>
                    <Ionicons name="person-remove-outline" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      ) : (
        // --- Analytics Tab ---
        <ScrollView contentContainerStyle={styles.analyticsContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F5C" />}>
          {fleet ? (
            <>
              <Text style={styles.sectionTitle}>Fleet Health Overview</Text>

              <View style={styles.ohiBox}>
                <Text style={[styles.ohiValue, { color: fleet.avgOhi > 70 ? "#16A34A" : fleet.avgOhi > 50 ? "#D97706" : "#DC2626" }]}>{fleet.avgOhi}</Text>
                <Text style={styles.ohiLabel}>Fleet Avg OHI / 100</Text>
              </View>

              <Text style={styles.sectionTitle}>Tier Breakdown</Text>
              {(["Normal", "Alert", "Action", "Emergency"] as const).map(tier => (
                <View key={tier} style={[styles.tierRow, { borderLeftColor: TIER_COLOR[tier] }]}>
                  <Text style={[styles.tierRowLabel, { color: TIER_COLOR[tier] }]}>{tier}</Text>
                  <View style={styles.tierBarBg}>
                    <View style={[styles.tierBarFill, { backgroundColor: TIER_COLOR[tier], width: `${Math.min(100, ((fleet.tierCounts[tier] || 0) / Math.max(1, fleet.totalBatches)) * 100)}%` as any }]} />
                  </View>
                  <Text style={styles.tierRowCount}>{fleet.tierCounts[tier] || 0} batch{(fleet.tierCounts[tier] || 0) !== 1 ? "es" : ""}</Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Per-Crate Health</Text>
              {fleet.cratesSummary.map((c, i) => (
                <View key={i} style={[styles.analyticsCard, { borderLeftColor: TIER_COLOR[c.tier] }]}>
                  <View>
                    <Text style={styles.analyticsCardTitle}>{c.crateId.toUpperCase()} / {c.batchId.toUpperCase()}</Text>
                    <Text style={styles.analyticsCardSub}>{c.tier} - OHI {c.ohi}/100 - {c.daysRemaining}d remaining</Text>
                    <Text style={styles.analyticsCardSub}>🌡️ {c.temperature}C - 💧 {c.humidity}% </Text>
                  </View>
                  <Text style={[styles.analyticsOhi, { color: TIER_COLOR[c.tier] }]}>{c.ohi}</Text>
                </View>
              ))}

              <Text style={styles.lastUpdated}>Last updated: {fleet.generatedAt ? new Date(fleet.generatedAt).toLocaleTimeString() : "-"}</Text>
            </>
          ) : <View style={styles.center}><Text style={styles.emptyText}>No fleet data available.</Text></View>}
        </ScrollView>
      )}

      {/* --- Register Crate Modal --- */}
      <Modal visible={crateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Register New Crate</Text>
            <Text style={styles.label}>Crate ID *</Text>
            <TextInput style={styles.input} placeholder="e.g. crate2" value={newCrateId} onChangeText={setNewCrateId} />
            <Text style={styles.label}>Assign to Farmer Username *</Text>
            <TextInput style={styles.input} placeholder="e.g. user1" value={newFarmerUser} onChangeText={setNewFarmerUser} />
            <Text style={styles.label}>MAC Address (Optional)</Text>
            <TextInput style={styles.input} placeholder="00:1B:44:11:3A:B7" value={newMacAddress} onChangeText={setNewMacAddress} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCrateModal(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={registerCrate} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitTxt}>Register</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Edit Farmer Modal --- */}
      <Modal visible={editFarmerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Farmer</Text>
            <Text style={styles.farmerNameTag}>{editingFarmer?.username}</Text>
            <Text style={styles.label}>New Phone Number</Text>
            <TextInput style={styles.input} placeholder="10-digit phone" value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditFarmerModal(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitEditFarmer} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitTxt}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Reassign Crate Modal --- */}
      <Modal visible={reassignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reassign Crate</Text>
            <Text style={styles.farmerNameTag}>{reassignCrate?.crateId.toUpperCase()}</Text>
            <Text style={styles.label}>New Farmer Username</Text>
            <TextInput style={styles.input} placeholder="e.g. user2" value={reassignTarget} onChangeText={setReassignTarget} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReassignModal(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitReassign} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitTxt}>Reassign</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function HomeStatTile({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <View style={[styles.homeStatTile, { borderColor: color + "40" }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.homeStatValue, { color }]}>{value}</Text>
      <Text style={styles.homeStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAF9" },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greetText: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "900", color: "#fff" },
  headerActions: { flexDirection: "row", gap: 10 },
  iconBtn: { padding: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20 },
  logoutIconBtn: { padding: 8, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 20 },

  statsRow: { maxHeight: 100, marginVertical: 10 },
  statCard: { backgroundColor: "#fff", borderRadius: 14, borderLeftWidth: 4, padding: 12, minWidth: 100, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  statValue: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 2, textAlign: "center" },

  alertFeedBox: { marginHorizontal: 20, marginBottom: 10, backgroundColor: "#fff", borderRadius: 14, padding: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  alertFeedHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  alertFeedTitle: { fontWeight: "700", fontSize: 13, color: "#DC2626" },
  alertChip: { borderRadius: 10, padding: 10, minWidth: 110 },
  alertChipTier: { fontWeight: "800", fontSize: 12 },
  alertChipCrate: { fontWeight: "700", fontSize: 14, marginTop: 2 },
  alertChipDetail: { fontSize: 11, color: "#374151", marginTop: 2 },

  tabs: { flexDirection: "row", marginHorizontal: 20, marginBottom: 12, backgroundColor: "#E5E7EB", borderRadius: 12, padding: 4, gap: 8 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#fff", elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  tabText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  tabTextActive: { color: "#1E6F5C", fontWeight: "700" },

  addCrateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1E6F5C", marginHorizontal: 20, marginBottom: 12, borderRadius: 12, paddingVertical: 12 },
  addCrateBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, marginHorizontal: 20, borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  crateAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 12 },
  farmerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  cardSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  cardMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tierBadgeText: { fontSize: 11, fontWeight: "700" },
  cardActions: { gap: 8 },
  actionBtn: { padding: 8, backgroundColor: "#EFF6FF", borderRadius: 10 },
  actionBtnRed: { padding: 8, backgroundColor: "#FEF2F2", borderRadius: 10 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#6B7280", fontSize: 15 },

  analyticsContainer: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 10, marginTop: 16 },
  ohiBox: { alignItems: "center", backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  ohiValue: { fontSize: 64, fontWeight: "900" },
  ohiLabel: { color: "#6B7280", fontWeight: "600", fontSize: 14, marginTop: 4 },
  tierRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderLeftWidth: 4, padding: 12, marginBottom: 8 },
  tierRowLabel: { fontWeight: "700", width: 80, fontSize: 13 },
  tierBarBg: { flex: 1, height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, marginHorizontal: 10, overflow: "hidden" },
  tierBarFill: { height: "100%", borderRadius: 4 },
  tierRowCount: { fontSize: 12, color: "#6B7280", width: 70, textAlign: "right" },
  analyticsCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderLeftWidth: 4, padding: 14, marginBottom: 10, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  analyticsCardTitle: { fontWeight: "700", fontSize: 14, color: "#111827" },
  analyticsCardSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  analyticsOhi: { fontSize: 28, fontWeight: "900" },
  lastUpdated: { textAlign: "center", color: "#9CA3AF", fontSize: 11, marginTop: 16 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1E6F5C", marginBottom: 16 },
  farmerNameTag: { backgroundColor: "#E2F1ED", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, color: "#1E6F5C", fontWeight: "700", fontSize: 13, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#F3F4F6", padding: 14, borderRadius: 12, fontSize: 15, color: "#111827" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 14, backgroundColor: "#F3F4F6", borderRadius: 12, alignItems: "center" },
  cancelTxt: { color: "#4B5563", fontWeight: "700", fontSize: 15 },
  submitBtn: { flex: 1, padding: 14, backgroundColor: "#1E6F5C", borderRadius: 12, alignItems: "center" },
  submitTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Home Tab styles
  homeStatsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  homeStatTile: { width: "47%", backgroundColor: "#fff", borderRadius: 16, padding: 14, alignItems: "center", gap: 4, borderWidth: 1.5, elevation: 1 },
  homeStatValue: { fontSize: 26, fontWeight: "900" },
  homeStatLabel: { fontSize: 11, color: "#9CA3AF" },
  homeSection: { backgroundColor: "#fff", borderRadius: 16, padding: 14, elevation: 1 },
  homeSectionTitle: { fontSize: 14, fontWeight: "800", color: "#111827", marginBottom: 10 },
  homeAlertRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", borderLeftWidth: 3, paddingLeft: 10 },
  homeAlertDot: { width: 8, height: 8, borderRadius: 4 },
  homeAlertCrate: { fontSize: 13, fontWeight: "800", color: "#111827" },
  homeAlertMeta: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  homeQA: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 14, padding: 14, alignItems: "center", gap: 6 },
  homeQAText: { fontSize: 11, fontWeight: "700", color: "#374151", textAlign: "center" },
});
