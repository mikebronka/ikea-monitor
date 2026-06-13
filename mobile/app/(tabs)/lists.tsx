import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "../../src/api/client";
import type { ShoppingList } from "../../src/types";

function ListCard({ list, onPress }: { list: ShoppingList; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{list.name}</Text>
        {list.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>
            {list.description}
          </Text>
        ) : null}
        <Text style={styles.cardMeta}>
          {list.product_count} {list.product_count === 1 ? "produkt" : "produktow"}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

export default function ListsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["lists"],
    queryFn: () => apiFetch<ShoppingList[]>("/api/v1/lists/"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/v1/lists/", {
        method: "POST",
        body: JSON.stringify({ name: newName, description: newDesc || null }),
      }),
    onSuccess: () => {
      setNewName("");
      setNewDesc("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });

  return (
    <View style={styles.container}>
      {showForm ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nazwa listy, np. Kuchnia ul. Deszczowa"
            value={newName}
            onChangeText={setNewName}
            placeholderTextColor="#999"
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="Opis (opcjonalnie)"
            value={newDesc}
            onChangeText={setNewDesc}
            placeholderTextColor="#999"
          />
          <View style={styles.formButtons}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setShowForm(false);
                setNewName("");
                setNewDesc("");
              }}
            >
              <Text style={styles.cancelText}>Anuluj</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, !newName.trim() && styles.saveDisabled]}
              onPress={() => newName.trim() && createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
            >
              <Text style={styles.saveText}>Utworz</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.addBar} onPress={() => setShowForm(true)}>
          <Text style={styles.addBarText}>+ Nowa lista</Text>
        </Pressable>
      )}

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ListCard list={item} onPress={() => router.push(`/list/${item.id}`)} />
        )}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isLoading ? "Ladowanie..." : "Brak list. Utworz pierwsza!"}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  addBar: {
    backgroundColor: "#0058a3",
    margin: 12,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  addBarText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  form: { margin: 12, backgroundColor: "#fff", borderRadius: 10, padding: 14 },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  formButtons: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: "#666", fontSize: 14 },
  saveButton: {
    backgroundColor: "#0058a3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  list: { padding: 12, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "600", color: "#333" },
  cardDesc: { fontSize: 13, color: "#666", marginTop: 2 },
  cardMeta: { fontSize: 12, color: "#999", marginTop: 4 },
  arrow: { fontSize: 24, color: "#ccc", marginLeft: 8 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 15 },
});
