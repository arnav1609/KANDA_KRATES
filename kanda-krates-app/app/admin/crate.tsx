import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const BATCHES = [
  { id: "batch1" },
  { id: "batch2" },
  { id: "batch3" }
];

export default function CrateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const crateId = params?.id ?? "Unknown";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crate: {crateId}</Text>
      <Text style={styles.subtitle}>Batches</Text>

      <FlatList
        data={BATCHES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.batch}
            onPress={() =>
              router.push({
                pathname: "/farmer/dashboard",
                params: { id: item.id }
              })
            }
          >
            <Text style={styles.batchText}>{item.id.toUpperCase()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F7FAF9" },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10
  },

  subtitle: {
    color: "#6B7280",
    marginBottom: 20
  },

  batch: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },

  batchText: {
    fontWeight: "700",
    fontSize: 16
  }
});