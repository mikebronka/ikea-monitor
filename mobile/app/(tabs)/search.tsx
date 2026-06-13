import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "../../src/api/client";
import type { SearchResponse, SearchResult } from "../../src/types";

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchResultCard({ item }: { item: SearchResult }) {
  return (
    <View style={styles.resultCard}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>📷</Text>
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.resultType}>{item.type_name}</Text>
        <Text style={styles.resultArticle}>{item.article_no}</Text>
        {item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag.replace(/_/g, " ")}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.priceBlock}>
        {item.price !== null ? (
          <Text style={styles.price}>{item.price.toFixed(0)} zł</Text>
        ) : (
          <Text style={styles.noPrice}>—</Text>
        )}
        <Pressable style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Dodaj</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 300);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => apiFetch<SearchResponse>(`/api/v1/search/?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.length >= 2,
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj w IKEA... np. HAVSTORP 60x80"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          placeholderTextColor="#999"
          autoFocus
        />
        {isFetching && <ActivityIndicator size="small" color="#0058a3" style={styles.searchSpinner} />}
      </View>

      <FlatList
        data={data?.results ?? []}
        keyExtractor={(item, i) => `${item.article_no}-${i}`}
        renderItem={({ item }) => <SearchResultCard item={item} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          debouncedQuery.length >= 2 && !isLoading ? (
            <Text style={styles.emptyText}>Brak wyników dla "{debouncedQuery}"</Text>
          ) : debouncedQuery.length < 2 ? (
            <Text style={styles.emptyText}>Wpisz nazwę produktu IKEA</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  searchRow: { flexDirection: "row", padding: 12, gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchSpinner: { position: "absolute", right: 24, top: 22 },
  list: { padding: 12 },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  image: { width: 70, height: 70, borderRadius: 6, marginRight: 12 },
  imagePlaceholder: { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 24 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: "600", color: "#333" },
  resultType: { fontSize: 12, color: "#666", marginTop: 2 },
  resultArticle: { fontSize: 11, color: "#999", marginTop: 2 },
  tagRow: { flexDirection: "row", marginTop: 4, gap: 4 },
  tag: { backgroundColor: "#d4edda", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  tagText: { fontSize: 10, color: "#155724", fontWeight: "600" },
  priceBlock: { alignItems: "flex-end", justifyContent: "space-between" },
  price: { fontSize: 16, fontWeight: "700", color: "#0058a3" },
  noPrice: { fontSize: 16, color: "#ccc" },
  addButton: {
    backgroundColor: "#0058a3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 15 },
});
