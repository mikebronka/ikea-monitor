import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { apiFetch } from "../../src/api/client";

export default function SettingsScreen() {
  const { data } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<{ status: string }>("/api/v1/health"),
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status API</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Backend:</Text>
          <Text style={[styles.value, data?.status === "ok" ? styles.ok : styles.err]}>
            {data?.status ?? "Łączenie..."}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>O aplikacji</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Wersja:</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Stack:</Text>
          <Text style={styles.value}>Expo + FastAPI</Text>
        </View>
      </View>

      <Text style={styles.footer}>IKEA Price Monitor{"\n"}Projekt Deszczowa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#2c3e50", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  label: { color: "#666" },
  value: { fontWeight: "600", color: "#333" },
  ok: { color: "#27ae60" },
  err: { color: "#c0392b" },
  footer: { textAlign: "center", color: "#bbb", marginTop: 40, lineHeight: 20 },
});
