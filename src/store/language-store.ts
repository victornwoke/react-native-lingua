import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Language } from "../../types/learning";

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
        await AsyncStorage.clear();
        set({ selectedLanguageId: null });
      },
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
    }),
    {
      name: "language-selection-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedLanguageId: state.selectedLanguageId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
