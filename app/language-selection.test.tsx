import { useAuth } from "@clerk/expo";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { useLanguageStore } from "@/store/language-store";

import LanguageSelectionScreen from "./language-selection";

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockSetStoredLanguageId = jest.fn();

jest.mock("@clerk/expo", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/store/language-store", () => ({
  useLanguageStore: jest.fn(),
}));

jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  return {
    useRouter: () => ({ replace: mockReplace, back: mockBack }),
    Redirect: ({ href }: { href: string }) => (
      <Text testID="redirect">{href}</Text>
    ),
  };
});

jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock"),
);

jest.mock("@/components/language/language-card", () => {
  const { Pressable, Text } = require("react-native");
  return {
    LanguageCard: ({
      language,
      isSelected,
      onPress,
    }: {
      language: { id: string; name: string };
      isSelected: boolean;
      onPress: () => void;
    }) => (
      <Pressable onPress={onPress} testID={`language-card-${language.id}`}>
        <Text>{`${language.name}-${isSelected}`}</Text>
      </Pressable>
    ),
  };
});

jest.mock("@/components/screen-header", () => ({
  ScreenHeader: () => null,
}));

jest.mock("@/components/search-bar", () => ({
  SearchBar: () => null,
}));

const mockUseAuth = useAuth as unknown as jest.Mock;
const mockUseLanguageStore = useLanguageStore as unknown as jest.Mock;

function mockStore(overrides: {
  selectedLanguageId?: string | null;
  hasHydrated?: boolean;
}) {
  mockUseLanguageStore.mockReturnValue({
    selectedLanguageId: overrides.selectedLanguageId ?? null,
    setSelectedLanguageId: mockSetStoredLanguageId,
    hasHydrated: overrides.hasHydrated ?? true,
  });
}

describe("LanguageSelectionScreen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockBack.mockClear();
    mockSetStoredLanguageId.mockClear();
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
  });

  it("renders nothing while the language store has not hydrated yet", () => {
    mockStore({ hasHydrated: false });

    const { toJSON } = render(<LanguageSelectionScreen />);

    expect(toJSON()).toBeNull();
  });

  it("pre-selects the stored language when it is a valid, known language", () => {
    mockStore({ selectedLanguageId: "french", hasHydrated: true });

    render(<LanguageSelectionScreen />);

    expect(screen.getByText("French-true")).toBeTruthy();
    expect(screen.getByText("Spanish-false")).toBeTruthy();
  });

  it("falls back to the first language when the stored language id is unknown", () => {
    mockStore({ selectedLanguageId: "atlantean", hasHydrated: true });

    render(<LanguageSelectionScreen />);

    expect(screen.getByText("Spanish-true")).toBeTruthy();
  });

  it("falls back to the first language when no language has been stored yet", () => {
    mockStore({ selectedLanguageId: null, hasHydrated: true });

    render(<LanguageSelectionScreen />);

    expect(screen.getByText("Spanish-true")).toBeTruthy();
  });

  it("persists the selection and navigates to /home when Continue is pressed", () => {
    mockStore({ selectedLanguageId: "german", hasHydrated: true });

    render(<LanguageSelectionScreen />);
    fireEvent.press(screen.getByText("Continue"));

    expect(mockSetStoredLanguageId).toHaveBeenCalledWith("german");
    expect(mockReplace).toHaveBeenCalledWith("/home");
  });

  it("updates the selection and persists the newly tapped language on Continue", () => {
    mockStore({ selectedLanguageId: "german", hasHydrated: true });

    render(<LanguageSelectionScreen />);
    fireEvent.press(screen.getByTestId("language-card-japanese"));
    fireEvent.press(screen.getByText("Continue"));

    expect(mockSetStoredLanguageId).toHaveBeenCalledWith("japanese");
    expect(mockReplace).toHaveBeenCalledWith("/home");
  });
});