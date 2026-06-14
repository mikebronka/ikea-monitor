import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { ToastProvider } from "../src/components/Toast";

SystemUI.setBackgroundColorAsync("#000000");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootContent() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0058a3" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="product/[id]"
            options={{ title: "Produkt", headerBackTitle: "Wstecz" }}
          />
          <Stack.Screen
            name="list/[id]"
            options={{ title: "Lista", headerBackTitle: "Wstecz" }}
          />
        </Stack>
        </ToastProvider>
      </QueryClientProvider>
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: insets.bottom,
          backgroundColor: "#000",
        }}
        pointerEvents="none"
      />
    </View>
  );
}
