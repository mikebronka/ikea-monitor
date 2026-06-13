import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "../../src/api/client";
import type { PriceHistoryResponse, Product } from "../../src/types";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiFetch<Product>(`/api/v1/products/${id}`),
  });

  const { data: history } = useQuery({
    queryKey: ["priceHistory", id],
    queryFn: () => apiFetch<PriceHistoryResponse>(`/api/v1/prices/history/${id}`),
    enabled: !!id,
  });

  if (isLoading || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Ładowanie...</Text>
      </View>
    );
  }

  const pricePoints = history?.history ?? [];
  const currentPrice = pricePoints.length > 0 ? pricePoints[pricePoints.length - 1].price : null;
  const minPrice = pricePoints.length > 0 ? Math.min(...pricePoints.map((p) => p.price)) : null;
  const maxPrice = pricePoints.length > 0 ? Math.max(...pricePoints.map((p) => p.price)) : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {product.image_url && (
          <Image
            source={{ uri: product.image_url }}
            style={styles.heroImage}
            resizeMode="contain"
          />
        )}
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.articleNo}>{product.article_no}</Text>
        {product.quantity > 1 && (
          <Text style={styles.qtyLabel}>Potrzeba: {product.quantity} szt.</Text>
        )}
      </View>

      <View style={styles.priceCard}>
        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Cena ref.</Text>
            <Text style={styles.priceValue}>{product.ref_price.toFixed(0)} zł</Text>
          </View>
          {currentPrice !== null && (
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Aktualna</Text>
              <Text style={[styles.priceValue, styles.priceHighlight]}>
                {currentPrice.toFixed(0)} zł
              </Text>
            </View>
          )}
        </View>
        {product.latest_tags.length > 0 && (
          <View style={styles.tagRow}>
            {product.latest_tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag.replace(/_/g, " ")}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {pricePoints.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Historia cen</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Min</Text>
              <Text style={[styles.statValue, { color: "#27ae60" }]}>
                {minPrice?.toFixed(0)} zł
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Max</Text>
              <Text style={[styles.statValue, { color: "#c0392b" }]}>
                {maxPrice?.toFixed(0)} zł
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Pomiarów</Text>
              <Text style={styles.statValue}>{pricePoints.length}</Text>
            </View>
          </View>

          {pricePoints.map((point, i) => (
            <View key={point.date} style={styles.historyRow}>
              <Text style={styles.historyDate}>{point.date}</Text>
              <Text style={styles.historyPrice}>{point.price.toFixed(2)} zł</Text>
              {point.tags.length > 0 && (
                <View style={styles.miniTag}>
                  <Text style={styles.miniTagText}>{point.tags[0]}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={styles.ikeaButton}
        onPress={() => Linking.openURL(product.ikea_url)}
      >
        <Text style={styles.ikeaButtonText}>Otwórz w IKEA</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: { fontSize: 16, color: "#666" },
  header: { padding: 16, backgroundColor: "#fff", alignItems: "center" },
  heroImage: { width: 200, height: 200, marginBottom: 12 },
  qtyLabel: { fontSize: 13, color: "#0058a3", fontWeight: "600", marginTop: 4 },
  name: { fontSize: 20, fontWeight: "700", color: "#2c3e50" },
  articleNo: { fontSize: 13, color: "#999", marginTop: 4 },
  priceCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceRow: { flexDirection: "row", justifyContent: "space-around" },
  priceItem: { alignItems: "center" },
  priceLabel: { fontSize: 12, color: "#888" },
  priceValue: { fontSize: 28, fontWeight: "700", color: "#333", marginTop: 4 },
  priceHighlight: { color: "#0058a3" },
  tagRow: { flexDirection: "row", justifyContent: "center", marginTop: 12, gap: 6 },
  tag: { backgroundColor: "#d4edda", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12, color: "#155724", fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#2c3e50", marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 11, color: "#888" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#333", marginTop: 2 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyDate: { fontSize: 13, color: "#666", width: 100 },
  historyPrice: { fontSize: 14, fontWeight: "600", color: "#333", flex: 1 },
  miniTag: { backgroundColor: "#e8f5e9", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  miniTagText: { fontSize: 9, color: "#2e7d32" },
  ikeaButton: {
    backgroundColor: "#0058a3",
    margin: 16,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  ikeaButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
