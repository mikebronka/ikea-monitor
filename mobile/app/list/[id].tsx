import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

function RenameModal({
  visible,
  currentName,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(currentName);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>Zmien nazwe listy</Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            autoFocus
            selectTextOnFocus
          />
          <View style={styles.modalButtons}>
            <Pressable style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Anuluj</Text>
            </Pressable>
            <Pressable
              style={[styles.modalSaveBtn, !name.trim() && styles.modalSaveDisabled]}
              onPress={() => name.trim() && onSave(name.trim())}
              disabled={!name.trim()}
            >
              <Text style={styles.modalSaveText}>Zapisz</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [renameVisible, setRenameVisible] = useState(false);

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

  const renameMutation = useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/api/v1/lists/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list", id] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setRenameVisible(false);
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
      <Stack.Screen options={{ title: data.name }} />
      <RenameModal
        visible={renameVisible}
        currentName={data.name}
        onClose={() => setRenameVisible(false)}
        onSave={(name) => renameMutation.mutate(name)}
      />
      <View style={styles.header}>
        <Pressable onPress={() => setRenameVisible(true)} style={styles.titleRow}>
          <Text style={styles.title}>{data.name}</Text>
          <Text style={styles.editIcon}>✎</Text>
        </Pressable>
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editIcon: { fontSize: 18, color: "#888" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#2c3e50", marginBottom: 12 },
  modalInput: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  modalCancelText: { color: "#666", fontSize: 14 },
  modalSaveBtn: {
    backgroundColor: "#0058a3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveDisabled: { opacity: 0.5 },
  modalSaveText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
