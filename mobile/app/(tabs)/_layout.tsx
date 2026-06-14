import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.icon, focused && styles.iconFocused]}>
        {symbol === "grid" && (
          <>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, focused && styles.cellFocused]} />
              <View style={[styles.gridCell, focused && styles.cellFocused]} />
            </View>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, focused && styles.cellFocused]} />
              <View style={[styles.gridCell, focused && styles.cellFocused]} />
            </View>
          </>
        )}
        {symbol === "list" && (
          <>
            <View style={[styles.listLine, focused && styles.lineFocused]} />
            <View style={[styles.listLine, styles.lineShort, focused && styles.lineFocused]} />
            <View style={[styles.listLine, focused && styles.lineFocused]} />
          </>
        )}
        {symbol === "search" && (
          <>
            <View style={[styles.searchCircle, focused && styles.searchCircleFocused]} />
            <View style={[styles.searchHandle, focused && styles.lineFocused]} />
          </>
        )}
        {symbol === "folder" && (
          <>
            <View style={[styles.folderBody, focused && styles.cellFocused]} />
            <View style={[styles.folderTab, focused && styles.cellFocused]} />
          </>
        )}
        {symbol === "gear" && (
          <>
            <View style={[styles.gearOuter, focused && styles.searchCircleFocused]} />
            <View style={[styles.gearInner, focused && styles.gearInnerFocused]} />
          </>
        )}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#fbdb00",
        tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
        tabBarStyle: { borderTopColor: "#004f93", paddingTop: 4, marginBottom: 15, backgroundColor: "#0058a3" },
        headerStyle: { backgroundColor: "#0058a3" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ focused }) => <TabIcon symbol="grid" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: "Produkty",
            tabBarIcon: ({ focused }) => <TabIcon symbol="list" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="lists"
          options={{
            title: "Listy",
            tabBarIcon: ({ focused }) => <TabIcon symbol="folder" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Szukaj",
            tabBarIcon: ({ focused }) => <TabIcon symbol="search" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Ustawienia",
            tabBarIcon: ({ focused }) => <TabIcon symbol="gear" focused={focused} />,
          }}
        />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center", width: 28, height: 28 },
  icon: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  iconFocused: {},
  gridRow: { flexDirection: "row", gap: 3 },
  gridCell: { width: 7, height: 7, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.7)", marginBottom: 3 },
  cellFocused: { backgroundColor: "#fbdb00" },
  listLine: { width: 18, height: 2.5, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 1, marginBottom: 3 },
  lineShort: { width: 12 },
  lineFocused: { backgroundColor: "#fbdb00" },
  searchCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    position: "absolute",
    top: 0,
    left: 1,
  },
  searchCircleFocused: { borderColor: "#fbdb00" },
  searchHandle: {
    width: 2.5,
    height: 7,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 1,
    position: "absolute",
    bottom: 0,
    right: 2,
    transform: [{ rotate: "-45deg" }],
  },
  gearOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  gearInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
    position: "absolute",
  },
  gearInnerFocused: { backgroundColor: "#fbdb00" },
  folderBody: {
    width: 18,
    height: 12,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.7)",
    position: "absolute",
    bottom: 1,
  },
  folderTab: {
    width: 8,
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: "rgba(255,255,255,0.7)",
    position: "absolute",
    top: 2,
    left: 1,
  },
});
