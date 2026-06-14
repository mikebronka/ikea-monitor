import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "../../src/api/client";
import type { ProductListResponse } from "../../src/types";
import { translateTag } from "../../src/utils/tags";

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
  const totalRef = products.reduce((sum, p) => sum + p.ref_price * p.quantity, 0);
  const totalCurrent = products.reduce(
    (sum, p) => sum + (p.current_price ?? p.ref_price) * p.quantity,
    0
  );
  const changed = products.filter(
    (p) => p.current_price !== null && p.current_price !== p.ref_price
  );
  const savings = totalRef - totalCurrent;

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
            <Text style={styles.statValue}>{totalCurrent.toFixed(0)} zł</Text>
            <Text style={styles.statLabel}>Aktualna</Text>
          </View>
        </View>
        {savings !== 0 && (
          <View style={styles.savingsRow}>
            <Text style={[styles.savingsText, savings > 0 ? styles.savingsPositive : styles.savingsNegative]}>
              {savings > 0 ? "Oszczędzasz" : "Drożej o"} {Math.abs(savings).toFixed(0)} zł
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Zmienione ceny ({changed.length})</Text>
        {changed.length === 0 ? (
          <Text style={styles.emptyText}>Brak zmian cen</Text>
        ) : (
          changed.map((p) => {
            const diff = (p.current_price! - p.ref_price) * p.quantity;
            return (
              <View key={p.id} style={styles.promoItem}>
                <View style={styles.promoHeader}>
                  <Text style={styles.promoName} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.diffText, diff < 0 ? styles.savingsPositive : styles.savingsNegative]}>
                    {diff > 0 ? "+" : ""}{diff.toFixed(0)} zł
                  </Text>
                </View>
                <Text style={styles.priceDetail}>
                  {p.ref_price.toFixed(0)} → {p.current_price!.toFixed(0)} zł
                  {p.quantity > 1 ? ` × ${p.quantity} szt.` : ""}
                </Text>
                {p.latest_tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {p.latest_tags.map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{translateTag(tag)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
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
  savingsRow: { alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#eee" },
  savingsText: { fontSize: 16, fontWeight: "700" },
  savingsPositive: { color: "#27ae60" },
  savingsNegative: { color: "#c0392b" },
  emptyText: { color: "#999", fontStyle: "italic" },
  promoItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  promoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  promoName: { fontSize: 14, fontWeight: "500", color: "#333", flex: 1, marginRight: 8 },
  diffText: { fontSize: 14, fontWeight: "700" },
  priceDetail: { fontSize: 12, color: "#888", marginTop: 2 },
  tagRow: { flexDirection: "row", marginTop: 4, gap: 6 },
  tag: { backgroundColor: "#d4edda", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 11, color: "#155724", fontWeight: "600" },
});
