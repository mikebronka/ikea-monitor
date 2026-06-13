import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "../../src/api/client";
import type { Product, ProductListResponse } from "../../src/types";

const CATEGORIES = [
  { key: "", label: "Wszystkie" },
  { key: "metod", label: "METOD" },
  { key: "fronts", label: "Fronty" },
  { key: "accessories", label: "Akcesoria" },
  { key: "panels", label: "Panele" },
  { key: "countertop", label: "Blaty" },
  { key: "agd", label: "AGD" },
];

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const hasTags = product.latest_tags.length > 0;

  return (
    <Pressable style={styles.productCard} onPress={onPress}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.articleNo}>{product.article_no}</Text>
        {hasTags && (
          <View style={styles.tagRow}>
            {product.latest_tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag.replace(/_/g, " ")}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.priceBlock}>
        <Text style={styles.refPrice}>{product.ref_price.toFixed(0)} zł</Text>
        <Text style={styles.category}>{product.category}</Text>
      </View>
    </Pressable>
  );
}

export default function ProductsScreen() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["products", category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const qs = params.toString();
      return apiFetch<ProductListResponse>(`/api/v1/products/${qs ? `?${qs}` : ""}`);
    },
  });

  const products = (data?.items ?? []).filter((p) =>
    search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Szukaj w produktach..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#999"
      />

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.key}
              style={[styles.chip, category === cat.key && styles.chipActive]}
              onPress={() => setCategory(cat.key)}
            >
              <Text style={[styles.chipText, category === cat.key && styles.chipTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/product/${item.id}`)}
          />
        )}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isLoading ? "Ładowanie..." : "Brak produktów"}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  searchInput: {
    backgroundColor: "#fff",
    margin: 12,
    marginBottom: 0,
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterBar: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e8e8e8",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#0058a3" },
  chipText: { fontSize: 13, color: "#555" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  list: { padding: 12 },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 14, fontWeight: "600", color: "#333" },
  articleNo: { fontSize: 11, color: "#999", marginTop: 2 },
  tagRow: { flexDirection: "row", marginTop: 6, gap: 4 },
  tag: { backgroundColor: "#d4edda", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  tagText: { fontSize: 10, color: "#155724", fontWeight: "600" },
  priceBlock: { alignItems: "flex-end" },
  refPrice: { fontSize: 16, fontWeight: "700", color: "#0058a3" },
  category: { fontSize: 11, color: "#aaa", marginTop: 2 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40 },
});
