import AsyncStorage from "@react-native-async-storage/async-storage";
import { waitFor } from "@testing-library/react-native";

import { useLanguageStore } from "./language-store";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const STORAGE_KEY = "language-selection-storage";

describe("useLanguageStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useLanguageStore.setState({ selectedLanguageId: null, hasHydrated: false });
  });

  it("starts with no selected language", () => {
    expect(useLanguageStore.getState().selectedLanguageId).toBeNull();
  });

  it("marks the store as hydrated once rehydration from storage completes", async () => {
    await waitFor(() => {
      expect(useLanguageStore.getState().hasHydrated).toBe(true);
    });
  });

  it("setSelectedLanguageId updates the selected language in state", () => {
    useLanguageStore.getState().setSelectedLanguageId("french");

    expect(useLanguageStore.getState().selectedLanguageId).toBe("french");
  });

  it("setSelectedLanguageId persists the selection to AsyncStorage", async () => {
    useLanguageStore.getState().setSelectedLanguageId("german");

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
    });

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.selectedLanguageId).toBe("german");
  });

  it("does not persist the hasHydrated flag (only selectedLanguageId is partialized)", async () => {
    useLanguageStore.getState().setSelectedLanguageId("japanese");

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
    });

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw as string);
    expect(parsed.state).not.toHaveProperty("hasHydrated");
  });

  it("setHasHydrated toggles the hydration flag independently of persistence", () => {
    useLanguageStore.getState().setHasHydrated(false);
    expect(useLanguageStore.getState().hasHydrated).toBe(false);

    useLanguageStore.getState().setHasHydrated(true);
    expect(useLanguageStore.getState().hasHydrated).toBe(true);
  });

  it("clearLanguageSelectionForTesting removes the persisted entry and resets state", async () => {
    useLanguageStore.getState().setSelectedLanguageId("spanish");

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
    });

    await useLanguageStore.getState().clearLanguageSelectionForTesting();

    expect(useLanguageStore.getState().selectedLanguageId).toBeNull();
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();
  });

  it("clearLanguageSelectionForTesting is safe to call when nothing was ever persisted", async () => {
    await expect(
      useLanguageStore.getState().clearLanguageSelectionForTesting(),
    ).resolves.toBeUndefined();

    expect(useLanguageStore.getState().selectedLanguageId).toBeNull();
  });
});