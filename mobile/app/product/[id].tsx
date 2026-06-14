import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../../src/api/client";
import type { PriceHistoryResponse, Product } from "../../src/types";
import { translateTag } from "../../src/utils/tags";

const SCREEN_WIDTH = Dimensions.get("window").width;

function ImageGallery({ productId, fallbackUrl }: { productId: string; fallbackUrl: string | null }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data } = useQuery({
    queryKey: ["productImages", productId],
    queryFn: () => apiFetch<{ images: string[] }>(`/api/v1/products/${productId}/images`),
    staleTime: 1000 * 60 * 30,
  });

  const images = data?.images?.length ? data.images : fallbackUrl ? [fallbackUrl] : [];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  if (images.length === 0) return null;

  return (
    <View style={galleryStyles.container}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={galleryStyles.slide}>
            <Image source={{ uri: item }} style={galleryStyles.image} resizeMode="contain" />
          </View>
        )}
      />
      {images.length > 1 && (
        <>
          <View style={galleryStyles.arrows}>
            <Text style={galleryStyles.arrow}>{activeIndex > 0 ? "‹" : " "}</Text>
            <Text style={galleryStyles.arrow}>{activeIndex < images.length - 1 ? "›" : " "}</Text>
          </View>
          <View style={galleryStyles.dots}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[galleryStyles.dot, i === activeIndex && galleryStyles.dotActive]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const galleryStyles = StyleSheet.create({
  container: { backgroundColor: "#fff", position: "relative" },
  slide: { width: SCREEN_WIDTH, height: 250, justifyContent: "center", alignItems: "center" },
  image: { width: SCREEN_WIDTH - 40, height: 230 },
  arrows: {
    position: "absolute",
    top: 0,
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    pointerEvents: "none",
  },
  arrow: { fontSize: 32, color: "rgba(0,0,0,0.2)", fontWeight: "300" },
  dots: { flexDirection: "row", justifyContent: "center", paddingBottom: 12, gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#ccc" },
  dotActive: { backgroundColor: "#0058a3", width: 9, height: 9, borderRadius: 5 },
});

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 15) + 15 }}
    >
      <Stack.Screen options={{ title: product.name }} />

      <ImageGallery productId={id} fallbackUrl={product.image_url} />

      <View style={styles.header}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.articleNo}>{product.article_no}</Text>
        {product.quantity > 1 && (
          <Text style={styles.qtyLabel}>Potrzeba: {product.quantity} szt.</Text>
        )}
      </View>

      <View style={styles.priceCard}>
        <View style={styles.priceRow}>
          {currentPrice !== null && (
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Aktualna</Text>
              <Text style={[styles.priceValue, styles.priceHighlight]}>
                {currentPrice.toFixed(0)} zł
              </Text>
            </View>
          )}
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Standardowa</Text>
            <Text style={styles.priceValue}>{product.ref_price.toFixed(0)} zł</Text>
          </View>
        </View>
        {(product.previous_price || product.lowest_30d_price) && (
          <View style={styles.priceRow2}>
            {product.previous_price !== null && (
              <View style={styles.priceItem2}>
                <Text style={styles.priceLabel2}>Poprzednia</Text>
                <Text style={styles.priceValue2}>{product.previous_price.toFixed(0)} zł</Text>
              </View>
            )}
            {product.lowest_30d_price !== null && (
              <View style={styles.priceItem2}>
                <Text style={styles.priceLabel2}>Najniższa 30d</Text>
                <Text style={styles.priceValue2}>{product.lowest_30d_price.toFixed(0)} zł</Text>
              </View>
            )}
          </View>
        )}
        {product.latest_tags.length > 0 && (
          <View style={styles.tagRow}>
            {product.latest_tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{translateTag(tag)}</Text>
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
              <Text style={styles.statLabel}>Odczytów ceny</Text>
              <Text style={styles.statValue}>{pricePoints.length}</Text>
            </View>
          </View>

          <View style={styles.historyHeader}>
            <Text style={[styles.historyDate, styles.historyHeaderText]}>Data</Text>
            <Text style={[styles.historyCol, styles.historyHeaderText]}>Cena</Text>
            <Text style={[styles.historyCol, styles.historyHeaderText]}>Poprz.</Text>
            <Text style={[styles.historyCol, styles.historyHeaderText]}>30d</Text>
          </View>
          {pricePoints.map((point) => (
            <View key={point.date} style={styles.historyRow}>
              <Text style={styles.historyDate}>{point.date.slice(5)}</Text>
              <Text style={[styles.historyCol, styles.historyPrice]}>{point.price.toFixed(0)}</Text>
              <Text style={styles.historyCol}>
                {point.previous_price ? point.previous_price.toFixed(0) : "—"}
              </Text>
              <Text style={styles.historyCol}>
                {point.lowest_30d_price ? point.lowest_30d_price.toFixed(0) : "—"}
              </Text>
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
  priceRow2: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  priceItem: { alignItems: "center" },
  priceItem2: { alignItems: "center" },
  priceLabel: { fontSize: 12, color: "#888" },
  priceLabel2: { fontSize: 11, color: "#aaa" },
  priceValue: { fontSize: 28, fontWeight: "700", color: "#333", marginTop: 4 },
  priceValue2: { fontSize: 18, fontWeight: "600", color: "#666", marginTop: 2 },
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
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
  },
  historyHeaderText: { fontWeight: "700", color: "#555", fontSize: 11 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyDate: { fontSize: 12, color: "#666", width: 55 },
  historyCol: { fontSize: 13, color: "#888", flex: 1, textAlign: "center" },
  historyPrice: { fontWeight: "600", color: "#333" },
  ikeaButton: {
    backgroundColor: "#0058a3",
    margin: 16,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  ikeaButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
