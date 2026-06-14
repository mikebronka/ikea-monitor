import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { apiFetch } from "../../src/api/client";
import { useToast } from "../../src/components/Toast";
import type { Product, ProductListResponse, ShoppingList } from "../../src/types";
import { translateTag } from "../../src/utils/tags";

const CATEGORIES = [
  { key: "", label: "Wszystkie" },
  { key: "metod", label: "METOD" },
  { key: "fronts", label: "Fronty" },
  { key: "accessories", label: "Akcesoria" },
  { key: "panels", label: "Panele" },
  { key: "countertop", label: "Blaty" },
  { key: "agd", label: "AGD" },
  { key: "other", label: "Inne" },
];

const CATEGORY_LABELS: Record<string, string> = {
  metod: "METOD",
  fronts: "Fronty",
  accessories: "Akcesoria",
  panels: "Panele",
  countertop: "Blaty",
  agd: "AGD",
  other: "Inne",
};

function QuantityControl({
  product,
  onUpdate,
}: {
  product: Product;
  onUpdate: (qty: number) => void;
}) {
  return (
    <View style={styles.qtyRow}>
      <Pressable
        style={styles.qtyBtn}
        onPress={() => product.quantity > 1 && onUpdate(product.quantity - 1)}
      >
        <Text style={styles.qtyBtnText}>-</Text>
      </Pressable>
      <Text style={styles.qtyValue}>{product.quantity}</Text>
      <Pressable style={styles.qtyBtn} onPress={() => onUpdate(product.quantity + 1)}>
        <Text style={styles.qtyBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

function ProductCard({
  product,
  onPress,
  onLongPress,
  onUpdateQty,
  onAddToList,
  selectMode,
  selected,
}: {
  product: Product;
  onPress: () => void;
  onLongPress: () => void;
  onUpdateQty: (qty: number) => void;
  onAddToList: () => void;
  selectMode: boolean;
  selected: boolean;
}) {
  const hasTags = product.latest_tags.length > 0;
  const unitPrice = product.current_price ?? product.ref_price;
  const totalPrice = unitPrice * product.quantity;
  const hasDiscount = product.current_price !== null && product.current_price < product.ref_price;

  return (
    <Pressable
      style={[styles.productCard, selected && styles.productCardSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {selectMode && (
        <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>?</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.articleNo}>
          {product.article_no} · {CATEGORY_LABELS[product.category] ?? product.category}
        </Text>
        {hasTags && (
          <View style={styles.tagRow}>
            {product.latest_tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{translateTag(tag)}</Text>
              </View>
            ))}
          </View>
        )}
        {!selectMode && (
          <View style={styles.bottomRow}>
            <QuantityControl product={product} onUpdate={onUpdateQty} />
            <Pressable style={styles.addToListBtn} onPress={onAddToList}>
              <Text style={styles.addToListText}>+ Do listy</Text>
            </Pressable>
          </View>
        )}
      </View>
      <View style={styles.priceEdge}>
        <Text style={[styles.totalPrice, hasDiscount && styles.discountPrice]}>
          {totalPrice.toFixed(0)} zl
        </Text>
        {hasDiscount && (
          <Text style={styles.refPriceCrossed}>
            {(product.ref_price * product.quantity).toFixed(0)} zl
          </Text>
        )}
        <Text style={styles.unitPriceSmall}>{unitPrice.toFixed(0)} zl/szt.</Text>
      </View>
    </Pressable>
  );
}

function ListPickerModal({
  visible,
  products,
  onClose,
  onDone,
}: {
  visible: boolean;
  products: Product[];
  onClose: (done?: boolean) => void;
  onDone: (listName: string, count: number) => void;
}) {
  const queryClient = useQueryClient();
  const [newListName, setNewListName] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: lists } = useQuery({
    queryKey: ["lists"],
    queryFn: () => apiFetch<ShoppingList[]>("/api/v1/lists/"),
    enabled: visible,
  });

  const addToList = async (listId: number) => {
    setAdding(true);
    for (const product of products) {
      await apiFetch(`/api/v1/lists/${listId}/products`, {
        method: "POST",
        body: JSON.stringify({
          article_no: product.article_no,
          name: product.name,
          image_url: product.image_url,
          ref_price: product.ref_price,
          category: product.category,
        }),
      });
    }
    queryClient.invalidateQueries({ queryKey: ["lists"] });
    setAdding(false);
    const listItem = (lists ?? []).find((l) => l.id === listId);
    onDone(listItem?.name ?? "listy", products.length);
    onClose(true);
  };

  const createAndAdd = async () => {
    setAdding(true);
    const name = newListName;
    const list = await apiFetch<ShoppingList>("/api/v1/lists/", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    for (const product of products) {
      await apiFetch(`/api/v1/lists/${list.id}/products`, {
        method: "POST",
        body: JSON.stringify({
          article_no: product.article_no,
          name: product.name,
          image_url: product.image_url,
          ref_price: product.ref_price,
          category: product.category,
        }),
      });
    }
    setNewListName("");
    queryClient.invalidateQueries({ queryKey: ["lists"] });
    setAdding(false);
    onDone(name, products.length);
    onClose(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onClose()}>
      <Pressable style={styles.modalOverlay} onPress={() => onClose()}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>Dodaj do listy</Text>
          <Text style={styles.modalSubtitle}>
            {products.length === 1
              ? products[0].name
              : `${products.length} produktow zaznaczonych`}
          </Text>

          <ScrollView style={styles.modalList}>
            {(lists ?? []).map((list) => (
              <Pressable
                key={list.id}
                style={styles.modalListItem}
                onPress={() => addToList(list.id)}
                disabled={adding}
              >
                <Text style={styles.modalListName}>{list.name}</Text>
                <Text style={styles.modalListCount}>{list.product_count} prod.</Text>
              </Pressable>
            ))}
            {(lists ?? []).length === 0 && (
              <Text style={styles.modalEmpty}>Brak list — utworz pierwsza ponizej</Text>
            )}
          </ScrollView>

          <View style={styles.modalNewList}>
            <TextInput
              style={styles.modalInput}
              placeholder="Lub utworz nowa liste..."
              value={newListName}
              onChangeText={setNewListName}
              placeholderTextColor="#999"
            />
            {newListName.trim().length > 0 && (
              <Pressable
                style={styles.modalCreateBtn}
                onPress={createAndAdd}
                disabled={adding}
              >
                <Text style={styles.modalCreateText}>Utworz i dodaj</Text>
              </Pressable>
            )}
          </View>

          <Pressable style={styles.modalCancelBtn} onPress={() => onClose()}>
            <Text style={styles.modalCancelText}>Anuluj</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function ProductsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [listPickerProducts, setListPickerProducts] = useState<Product[]>([]);

  const toast = useToast();
  const selectMode = selectedIds.size > 0;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["products", category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const qs = params.toString();
      return apiFetch<ProductListResponse>(`/api/v1/products/${qs ? `?${qs}` : ""}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      apiFetch(`/api/v1/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Produkt usuniety");
    },
    onError: () => toast("Blad usuwania", "error"),
  });

  const handleDelete = (product: Product) => {
    Alert.alert("Usunac produkt?", product.name, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usun",
        style: "destructive",
        onPress: () => deleteMutation.mutate(product.id),
      },
    ]);
  };

  const products = (data?.items ?? []).filter((p) =>
    search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(products.map((p) => p.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handlePress = (product: Product) => {
    if (selectMode) {
      toggleSelect(product.id);
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  const handleLongPress = (product: Product) => {
    if (!selectMode) {
      setSelectedIds(new Set([product.id]));
    }
  };

  const openListPickerForSelected = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    setListPickerProducts(selected);
  };

  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalCost = products.reduce(
    (sum, p) => sum + (p.current_price ?? p.ref_price) * p.quantity,
    0
  );

  return (
    <View style={styles.container}>
      {selectMode ? (
        <View style={styles.selectBar}>
          <Pressable onPress={clearSelection} style={styles.selectBarBtn}>
            <Text style={styles.selectBarBtnText}>Anuluj</Text>
          </Pressable>
          <Text style={styles.selectBarText}>{selectedIds.size} zaznaczonych</Text>
          <Pressable onPress={selectAll} style={styles.selectBarBtn}>
            <Text style={styles.selectBarBtnText}>Wszystkie</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {products.length} produktow | {totalItems} szt. | {totalCost.toFixed(0)} zl ref.
          </Text>
        </View>
      )}

      {selectMode && (
        <Pressable style={styles.bulkAddBtn} onPress={openListPickerForSelected}>
          <Text style={styles.bulkAddText}>Dodaj {selectedIds.size} do listy</Text>
        </Pressable>
      )}

      {!selectMode && (
        <>
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
        </>
      )}

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.deleteBtnText}>Usun</Text>
              </Pressable>
            )}
            overshootRight={false}
          >
            <ProductCard
              product={item}
              onPress={() => handlePress(item)}
              onLongPress={() => handleLongPress(item)}
              onUpdateQty={(qty) => updateMutation.mutate({ id: item.id, quantity: qty })}
              onAddToList={() => setListPickerProducts([item])}
              selectMode={selectMode}
              selected={selectedIds.has(item.id)}
            />
          </Swipeable>
        )}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isLoading ? "Ladowanie..." : "Brak produktow"}
          </Text>
        }
      />

      <ListPickerModal
        visible={listPickerProducts.length > 0}
        products={listPickerProducts}
        onClose={(done) => {
          setListPickerProducts([]);
          if (done) clearSelection();
        }}
        onDone={(name, count) =>
          toast(`Dodano ${count} prod. do "${name}"`)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  summaryBar: {
    backgroundColor: "#0058a3",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  summaryText: { color: "#fff", fontSize: 13, fontWeight: "500", textAlign: "center" },
  selectBar: {
    backgroundColor: "#2c3e50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectBarText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  selectBarBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  selectBarBtnText: { color: "#74b9ff", fontSize: 13, fontWeight: "600" },
  bulkAddBtn: {
    backgroundColor: "#0058a3",
    margin: 12,
    marginBottom: 0,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  bulkAddText: { color: "#fff", fontSize: 14, fontWeight: "600" },
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
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  productCardSelected: {
    backgroundColor: "#e8f4fd",
    borderWidth: 2,
    borderColor: "#0058a3",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 10,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#0058a3", borderColor: "#0058a3" },
  checkmark: { color: "#fff", fontSize: 14, fontWeight: "700" },
  image: { width: 60, height: 60, borderRadius: 6, marginRight: 12 },
  imagePlaceholder: { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 16, color: "#ccc" },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 14, fontWeight: "600", color: "#333" },
  articleNo: { fontSize: 11, color: "#999", marginTop: 2 },
  tagRow: { flexDirection: "row", marginTop: 4, gap: 4 },
  tag: { backgroundColor: "#d4edda", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  tagText: { fontSize: 10, color: "#155724", fontWeight: "600" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e8e8e8",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 16, fontWeight: "700", color: "#555", lineHeight: 18 },
  qtyValue: { fontSize: 14, fontWeight: "700", color: "#333", minWidth: 28, textAlign: "center" },
  addToListBtn: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addToListText: { fontSize: 11, fontWeight: "600", color: "#0058a3" },
  priceEdge: { alignItems: "flex-end", justifyContent: "center", minWidth: 70 },
  totalPrice: { fontSize: 16, fontWeight: "700", color: "#0058a3" },
  discountPrice: { color: "#27ae60" },
  refPriceCrossed: { fontSize: 12, color: "#999", textDecorationLine: "line-through" },
  unitPriceSmall: { fontSize: 11, color: "#999", marginTop: 1 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40 },
  deleteBtn: {
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 10,
    borderRadius: 10,
    marginLeft: 4,
  },
  deleteBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

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
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#2c3e50", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: "#888", marginBottom: 16 },
  modalList: { maxHeight: 200 },
  modalListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalListName: { fontSize: 15, fontWeight: "500", color: "#333" },
  modalListCount: { fontSize: 12, color: "#999" },
  modalEmpty: { textAlign: "center", color: "#999", paddingVertical: 16, fontSize: 13 },
  modalNewList: { marginTop: 16 },
  modalInput: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalCreateBtn: {
    backgroundColor: "#0058a3",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  modalCreateText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  modalCancelBtn: { marginTop: 12, alignItems: "center", paddingVertical: 8 },
  modalCancelText: { color: "#666", fontSize: 14 },
});
