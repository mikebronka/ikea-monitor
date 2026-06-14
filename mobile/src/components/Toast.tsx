import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
}

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(
    (message: string, type: ToastType = "success") => {
      if (timeout.current) clearTimeout(timeout.current);
      setToast({ message, type });
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timeout.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
          setToast(null)
        );
      }, 2500);
    },
    [opacity]
  );

  const insets = useSafeAreaInsets();

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            { bottom: insets.bottom + 70, opacity },
            toast.type === "error" && styles.error,
            toast.type === "info" && styles.info,
          ]}
          pointerEvents="none"
        >
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "#2c3e50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    zIndex: 9999,
  },
  error: { backgroundColor: "#c0392b" },
  info: { backgroundColor: "#0058a3" },
  text: { color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" },
});
