import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { useToast } from "../../src/components/Toast";
import type { SearchResponse, SearchResult } from "../../src/types";
import { translateTag } from "../../src/utils/tags";

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchResultCard({
  item,
  onAdd,
  isAdding,
  added,
}: {
  item: SearchResult;
  onAdd: () => void;
  isAdding: boolean;
  added: boolean;
}) {
  return (
    <View style={styles.resultCard}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>?</Text>
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
                <Text style={styles.tagText}>{translateTag(tag)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.priceBlock}>
        {item.price !== null ? (
          <>
            <Text style={styles.price}>{item.price.toFixed(0)} zl</Text>
            {item.previous_price !== null && item.previous_price !== item.price && (
              <Text style={styles.previousPrice}>{item.previous_price.toFixed(0)} zl</Text>
            )}
            {item.lowest_30d_price !== null && (
              <Text style={styles.lowest30d}>30d: {item.lowest_30d_price.toFixed(0)} zl</Text>
            )}
          </>
        ) : (
          <Text style={styles.noPrice}>--</Text>
        )}
        <Pressable
          style={[styles.addButton, added && styles.addedButton]}
          onPress={onAdd}
          disabled={isAdding || added}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>{added ? "Dodano" : "+ Dodaj"}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [addedArticles, setAddedArticles] = useState<Set<string>>(new Set());
  const debouncedQuery = useDebounce(query.trim(), 200);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () =>
      apiFetch<SearchResponse>(`/api/v1/search/?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.length >= 3,
  });

  const addMutation = useMutation({
    mutationFn: (item: SearchResult) =>
      apiFetch("/api/v1/products/", {
        method: "POST",
        body: JSON.stringify({
          article_no: item.article_no,
          name: `${item.name} ${item.type_name}`.trim(),
          image_url: item.image_url,
          ref_price: item.previous_price ?? item.price ?? 0,
          current_price: item.price,
          previous_price: item.previous_price,
          lowest_30d_price: item.lowest_30d_price,
          tags: item.tags,
          category: "other",
        }),
      }),
    onSuccess: (_, item) => {
      setAddedArticles((prev) => new Set(prev).add(item.article_no));
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast(`Dodano ${item.name}`);
    },
    onError: () => {
      toast("Nie udalo sie dodac produktu", "error");
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Wpisz nazwe serii, np. HAVSTORP, METOD, BODBYN"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          placeholderTextColor="#999"
          autoFocus
        />
        {isFetching && (
          <ActivityIndicator size="small" color="#0058a3" style={styles.searchSpinner} />
        )}
      </View>

      <FlatList
        data={data?.results ?? []}
        keyExtractor={(item, i) => `${item.article_no}-${i}`}
        renderItem={({ item }) => (
          <SearchResultCard
            item={item}
            onAdd={() => addMutation.mutate(item)}
            isAdding={addMutation.isPending && addMutation.variables?.article_no === item.article_no}
            added={addedArticles.has(item.article_no)}
          />
        )}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          debouncedQuery.length >= 3 && !isLoading ? (
            <Text style={styles.emptyText}>
              Brak wynikow dla "{debouncedQuery}"
              {"\n"}Sprobuj pelna nazwe serii, np. HAVSTORP
            </Text>
          ) : debouncedQuery.length < 3 ? (
            <Text style={styles.emptyText}>Wpisz nazwe serii IKEA (min. 3 znaki)</Text>
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
  placeholderText: { fontSize: 20, color: "#ccc" },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: "600", color: "#333" },
  resultType: { fontSize: 12, color: "#666", marginTop: 2 },
  resultArticle: { fontSize: 11, color: "#999", marginTop: 2 },
  tagRow: { flexDirection: "row", marginTop: 4, gap: 4 },
  tag: { backgroundColor: "#d4edda", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  tagText: { fontSize: 10, color: "#155724", fontWeight: "600" },
  priceBlock: { alignItems: "flex-end", justifyContent: "space-between" },
  price: { fontSize: 16, fontWeight: "700", color: "#0058a3" },
  previousPrice: { fontSize: 12, color: "#999", textDecorationLine: "line-through", marginTop: 1 },
  lowest30d: { fontSize: 10, color: "#888", marginTop: 1 },
  noPrice: { fontSize: 16, color: "#ccc" },
  addButton: {
    backgroundColor: "#0058a3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  addedButton: { backgroundColor: "#27ae60" },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 15 },
});
