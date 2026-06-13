import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "../../src/api/client";
import type { ProductListResponse } from "../../src/types";

export default function DashboardScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<ProductListResponse>("/api/v1/products/"),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Ładowanie...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Błąd: {error.message}</Text>
      </View>
    );
  }

  const products = data?.items ?? [];
  const totalRef = products.reduce((sum, p) => sum + p.ref_price, 0);
  const withTags = products.filter((p) => p.latest_tags.length > 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Podsumowanie</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Produktów</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalRef.toFixed(0)} zł</Text>
            <Text style={styles.statLabel}>Budżet ref.</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{withTags.length}</Text>
            <Text style={styles.statLabel}>W promocji</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Produkty w promocji</Text>
        {withTags.length === 0 ? (
          <Text style={styles.emptyText}>Brak aktywnych promocji</Text>
        ) : (
          withTags.map((p) => (
            <View key={p.id} style={styles.promoItem}>
              <Text style={styles.promoName}>{p.name}</Text>
              <View style={styles.tagRow}>
                {p.latest_tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.replace(/_/g, " ")}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: { fontSize: 16, color: "#666" },
  error: { fontSize: 16, color: "#c0392b" },
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
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#2c3e50", marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700", color: "#0058a3" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  emptyText: { color: "#999", fontStyle: "italic" },
  promoItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  promoName: { fontSize: 14, fontWeight: "500", color: "#333" },
  tagRow: { flexDirection: "row", marginTop: 4, gap: 6 },
  tag: { backgroundColor: "#d4edda", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 11, color: "#155724", fontWeight: "600" },
});
