import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { secureRequest, API_ENDPOINTS } from "../../config/api";
import { Ionicons } from "@expo/vector-icons";

type FarmerData = {
  username: string;
  phoneNumber: string;
};

type CrateData = {
  _id: string;
  crateId: string;
  assignedFarmerUsername: string;
  hardwareMacAddress: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [farmers, setFarmers] = useState<FarmerData[]>([]);
  const [crates, setCrates] = useState<CrateData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newCrateId, setNewCrateId] = useState("");
  const [newFarmerUser, setNewFarmerUser] = useState("");
  const [newMacAddress, setNewMacAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch both Farmers and Crates in parallel
      const [farmRes, crateRes] = await Promise.all([
        secureRequest(API_ENDPOINTS.farmers),
        secureRequest(API_ENDPOINTS.crates)
      ]);
      
      if (!farmRes.ok || !crateRes.ok) throw new Error("Failed to fetch data");
      
      const farmData = await farmRes.json();
      const crateData = await crateRes.json();
      
      setFarmers(farmData);
      setCrates(crateData);
    } catch (err: any) {
      console.log("Admin Dashboard Error:", err);
      Alert.alert("Error", "Could not fetch data from the server.");
    } finally {
      setLoading(false);
    }
  };

  const registerCrate = async () => {
    if (!newCrateId || !newFarmerUser) {
      Alert.alert("Missing Fields", "Crate ID and assigned Farmer Username are required.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const res = await secureRequest(API_ENDPOINTS.crates, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crateId: newCrateId.trim(),
          assignedFarmerUsername: newFarmerUser.trim(),
          hardwareMacAddress: newMacAddress.trim()
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register crate");
      
      Alert.alert("Success", "Crate registered successfully!");
      setModalVisible(false);
      
      // Reset form
      setNewCrateId("");
      setNewFarmerUser("");
      setNewMacAddress("");
      
      // Refresh list
      fetchData();
    } catch (err: any) {
      Alert.alert("Registration Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={20} color="#1E6F5C" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>Active Storage Crates ({crates.length})</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E6F5C" />
        </View>
      ) : crates.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No storage crates registered.</Text>
          <Text style={styles.emptySub}>Click the + button to add one.</Text>
        </View>
      ) : (
        <FlatList
          data={crates}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const farmerObj = farmers.find(f => f.username === item.assignedFarmerUsername);
            return (
              <TouchableOpacity
                style={styles.crate}
                onPress={() =>
                  router.push({
                    pathname: "/admin/crate",
                    params: { id: item.assignedFarmerUsername } // Passing username to reuse existing farmer viewer
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.crateAvatar}>
                  <Ionicons name="cube" size={20} color="#1E6F5C" />
                </View>
                <View style={styles.crateInfo}>
                  <Text style={styles.crateTitle}>{item.crateId.toUpperCase()}</Text>
                  <Text style={styles.crateFarmer}>Assigned: {item.assignedFarmerUsername}</Text>
                  {farmerObj && <Text style={styles.cratePhone}>Phone: {farmerObj.phoneNumber}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Add Crate Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Register New Crate</Text>
            
            <Text style={styles.label}>Crate Identifier*</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. crate1" 
              value={newCrateId}
              onChangeText={setNewCrateId}
            />
            
            <Text style={styles.label}>Assign to Farmer Username*</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. user1" 
              value={newFarmerUser}
              onChangeText={setNewFarmerUser}
            />

            <Text style={styles.label}>Hardware MAC Address (Optional)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="00:1B:44:11:3A:B7" 
              value={newMacAddress}
              onChangeText={setNewMacAddress}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={registerCrate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitTxt}>Register</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAF9" },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 10
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1E6F5C",
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: "#E2F1ED",
    borderRadius: 20,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    fontWeight: "500"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16
  },
  crate: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 18,
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  crateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2F1ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14
  },
  crateInfo: {
    flex: 1
  },
  crateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827"
  },
  crateFarmer: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4
  },
  cratePhone: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2
  },
  addBtn: {
    backgroundColor: "#1E6F5C",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  emptySub: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E6F5C",
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12
  },
  input: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: "#111827"
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center"
  },
  cancelTxt: {
    color: "#4B5563",
    fontWeight: "700",
    fontSize: 16
  },
  submitBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: "#1E6F5C",
    borderRadius: 12,
    alignItems: "center"
  },
  submitTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16
  }
});