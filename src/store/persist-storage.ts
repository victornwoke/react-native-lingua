import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { StateStorage } from "zustand/middleware";

const noopStorage: StateStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

export function getPersistStorage(): StateStorage {
  if (Platform.OS === "web" && typeof window === "undefined") {
    return noopStorage;
  }

  return AsyncStorage as unknown as StateStorage;
}
