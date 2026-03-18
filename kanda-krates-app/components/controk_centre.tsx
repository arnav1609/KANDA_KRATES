import React, { useState } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";

export default function ControlCenter() {
  const [fanOn, setFanOn] = useState(true);
  const [uvOn, setUvOn] = useState(false);
  const [mistOn, setMistOn] = useState(true);
  const [scrubberOn, setScrubberOn] = useState(true);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Control Centre</Text>
        <View style={styles.emergencyBadge}>
          <Text style={styles.emergencyText}>Emergency</Text>
        </View>
      </View>

      {/* Controls Grid */}
      <View style={styles.grid}>
        {/* Ventilation */}
        <ControlCard
          title="Ventilation Fans"
          subtitle="Air Circulation System"
          value="Speed: 65%"
          enabled={fanOn}
          onToggle={setFanOn}
        />

        {/* UV Sanitizer */}
        <ControlCard
          title="UV Sanitizer"
          subtitle="Disinfection System"
          value="Auto"
          enabled={uvOn}
          onToggle={setUvOn}
        />

        {/* Herbal Mist */}
        <ControlCard
          title="Herbal Mist Spray"
          subtitle="Natural Preservation"
          value="Every 30 min"
          enabled={mistOn}
          onToggle={setMistOn}
        />

        {/* Air Scrubber */}
        <ControlCard
          title="Air Scrubber"
          subtitle="Air Purification"
          value="Efficiency: 85%"
          enabled={scrubberOn}
          onToggle={setScrubberOn}
        />
      </View>

      {/* System Status */}
      <View style={styles.statusBox}>
        <StatusItem label="Fan Speed" value="65%" />
        <StatusItem label="UV Intensity" value="0%" />
        <StatusItem label="Mist Frequency" value="30 min" />
        <StatusItem label="Scrubber" value="85%" />
      </View>
    </View>
  );
}

/* ================= SMALL COMPONENTS ================= */

function ControlCard({
  title,
  subtitle,
  value,
  enabled,
  onToggle
}: {
  title: string;
  subtitle: string;
  value: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
      <Switch value={enabled} onValueChange={onToggle} />
    </View>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusItem}>
      <Text style={styles.statusValue}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginVertical: 16,
    elevation: 3
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  title: {
    fontSize: 18,
    fontWeight: "800"
  },
  emergencyBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  emergencyText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 12
  },

  grid: {
    gap: 12
  },

  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center"
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 14
  },
  cardSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2
  },
  cardValue: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600"
  },

  statusBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 18,
    padding: 12
  },
  statusItem: {
    alignItems: "center"
  },
  statusValue: {
    fontWeight: "800",
    fontSize: 14
  },
  statusLabel: {
    fontSize: 11,
    color: "#6B7280"
  }
});
