import Constants from "expo-constants";
import { Platform } from "react-native";

function getDevApiUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:8000`;
  }
  return Platform.select({
    android: "http://10.0.2.2:8000",
    default: "http://localhost:8000",
  })!;
}

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || getDevApiUrl();

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
