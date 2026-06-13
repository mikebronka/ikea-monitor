import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { apiFetch } from "../../src/api/client";
import type { ListDetailResponse, ListItem } from "../../src/types";

function ListItemCard({
  item,
  listId,
  onRemove,
}: {
  item: ListItem;
  listId: string;
  onRemove: () => void;
}) {
  const router = useRouter();
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/product/${item.product_id}`)}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>?</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.articleNo}>{item.article_no}</Text>
        {item.quantity > 1 && <Text style={styles.qty}>x{item.quantity}</Text>}
      </View>
      <View style={styles.priceBlock}>
        {item.current_price !== null ? (
          <Text style={styles.currentPrice}>{item.current_price.toFixed(0)} zl</Text>
        ) : (
          <Text style={styles.refPrice}>{item.ref_price.toFixed(0)} zl</Text>
        )}
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <Text style={styles.removeText}>Usun</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["list", id],
    queryFn: () => apiFetch<ListDetailResponse>(`/api/v1/lists/${id}`),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) =>
      apiFetch(`/api/v1/lists/${id}/products/${productId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list", id] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Ladowanie...</Text>
      </View>
    );
  }

  const totalRef = data.items.reduce((s, i) => s + i.ref_price * i.quantity, 0);
  const totalCurrent = data.items
    .filter((i) => i.current_price !== null)
    .reduce((s, i) => s + (i.current_price ?? 0) * i.quantity, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.name}</Text>
        {data.description ? <Text style={styles.desc}>{data.description}</Text> : null}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Ref.</Text>
            <Text style={styles.summaryValue}>{totalRef.toFixed(0)} zl</Text>
          </View>
          {totalCurrent > 0 && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Aktualna</Text>
              <Text style={[styles.summaryValue, styles.highlight]}>
                {totalCurrent.toFixed(0)} zl
              </Text>
            </View>
          )}
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Produktow</Text>
            <Text style={styles.summaryValue}>{data.items.length}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={data.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ListItemCard
            item={item}
            listId={id}
            onRemove={() => removeMutation.mutate(item.product_id)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Lista jest pusta. Dodaj produkty z wyszukiwarki.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: { fontSize: 16, color: "#666" },
  header: { backgroundColor: "#fff", padding: 16, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#2c3e50" },
  desc: { fontSize: 14, color: "#666", marginTop: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 16 },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 11, color: "#888" },
  summaryValue: { fontSize: 20, fontWeight: "700", color: "#333", marginTop: 2 },
  highlight: { color: "#0058a3" },
  list: { padding: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  image: { width: 50, height: 50, borderRadius: 6, marginRight: 12 },
  imagePlaceholder: { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 16, color: "#ccc" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "600", color: "#333" },
  articleNo: { fontSize: 11, color: "#999", marginTop: 2 },
  qty: { fontSize: 12, color: "#0058a3", fontWeight: "600", marginTop: 2 },
  priceBlock: { alignItems: "flex-end" },
  currentPrice: { fontSize: 16, fontWeight: "700", color: "#0058a3" },
  refPrice: { fontSize: 16, fontWeight: "700", color: "#999" },
  removeButton: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4 },
  removeText: { fontSize: 11, color: "#c0392b" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 15 },
});
