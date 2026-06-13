import { Platform } from "react-native";

const DEV_API_URL = Platform.select({
  android: "http://10.0.2.2:8000",
  default: "http://localhost:8000",
});

const API_BASE = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
