import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { languages } from "../../data/languages";
import type { Language } from "../../types/learning";
import { getPersistStorage } from "./persist-storage";

const LANGUAGE_STORAGE_KEY = "language-selection-storage";

type LanguageState = {
  selectedLanguageId: Language["id"] | null;
  hasHydrated: boolean;
  setSelectedLanguageId: (languageId: Language["id"]) => void;
  clearLanguageSelectionForTesting: () => Promise<void>;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguageId: null,
      hasHydrated: false,
      setSelectedLanguageId: (languageId) => {
        set({ selectedLanguageId: languageId });
      },
      clearLanguageSelectionForTesting: async () => {
        await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
        set({ selectedLanguageId: null });
      },
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
    }),
    {
      name: LANGUAGE_STORAGE_KEY,
      storage: createJSONStorage(() => getPersistStorage()),
      partialize: (state) => ({
        selectedLanguageId: state.selectedLanguageId,
      }),
      onRehydrateStorage: (state) => (rehydratedState, error) => {
        if (error) {
          console.error("Failed to hydrate language selection store.", error);
        }

        (rehydratedState ?? state)?.setHasHydrated(true);
      },
    },
  ),
);

export function useSelectedLanguage() {
  const selectedLanguageId = useLanguageStore(
    (state) => state.selectedLanguageId,
  );

  return languages.find((language) => language.id === selectedLanguageId);
}
