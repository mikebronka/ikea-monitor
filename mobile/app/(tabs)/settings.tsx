import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { API_BASE, apiFetch } from "../../src/api/client";
import type { ScraperStatus } from "../../src/types";

export default function SettingsScreen() {
  const queryClient = useQueryClient();

  const {
    data: health,
    error: healthError,
    isLoading: healthLoading,
  } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<{ status: string }>("/api/v1/health"),
  });

  const { data: scraper } = useQuery({
    queryKey: ["scraperStatus"],
    queryFn: () => apiFetch<ScraperStatus>("/api/v1/scraper/status"),
    refetchInterval: 5000,
  });

  const triggerMutation = useMutation({
    mutationFn: () => apiFetch("/api/v1/scraper/trigger", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scraperStatus"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status API</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Backend:</Text>
          <Text
            style={[
              styles.value,
              health?.status === "ok" ? styles.ok : styles.err,
            ]}
          >
            {healthLoading
              ? "Łączenie..."
              : health?.status === "ok"
                ? "ok"
                : healthError?.message ?? "Błąd"}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scraper</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, scraper?.is_running ? styles.running : styles.ok]}>
            {scraper?.is_running ? "Dziala..." : "Gotowy"}
          </Text>
        </View>
        {scraper?.last_run && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Ostatni run:</Text>
              <Text style={styles.value}>
                {new Date(scraper.last_run.finished_at).toLocaleString("pl")}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Sprawdzono:</Text>
              <Text style={styles.value}>{scraper.last_run.checked} produktow</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Zmiany cen:</Text>
              <Text style={styles.value}>{scraper.last_run.price_changes}</Text>
            </View>
          </>
        )}
        <Pressable
          style={[styles.triggerButton, scraper?.is_running && styles.triggerDisabled]}
          onPress={() => triggerMutation.mutate()}
          disabled={scraper?.is_running || triggerMutation.isPending}
        >
          {triggerMutation.isPending || scraper?.is_running ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.triggerText}>Uruchom scraper</Text>
          )}
        </Pressable>
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
        <View style={styles.row}>
          <Text style={styles.label}>API URL:</Text>
          <Text style={[styles.value, styles.apiUrl]}>{API_BASE}</Text>
        </View>
      </View>

      <Text style={styles.footer}>IKEA Price Monitor</Text>
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
  running: { color: "#e67e22" },
  triggerButton: {
    backgroundColor: "#0058a3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  triggerDisabled: { opacity: 0.5 },
  triggerText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  apiUrl: { fontSize: 11 },
  footer: { textAlign: "center", color: "#bbb", marginTop: 40 },
});
