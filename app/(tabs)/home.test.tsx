import { useUser } from "@clerk/expo";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { useLanguageStore } from "@/store/language-store";

import HomeScreen from "./home";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@clerk/expo", () => ({
  useUser: jest.fn(),
}));

jest.mock("@/store/language-store", () => ({
  useLanguageStore: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock"),
);

jest.mock("expo-symbols", () => {
  const { View } = require("react-native");
  return {
    SymbolView: () => <View testID="symbol-view" />,
  };
});

const mockUseUser = useUser as unknown as jest.Mock;
const mockUseLanguageStore = useLanguageStore as unknown as jest.Mock;

function setSelectedLanguageId(languageId: string | null) {
  mockUseLanguageStore.mockImplementation(
    (selector: (state: { selectedLanguageId: string | null }) => unknown) =>
      selector({ selectedLanguageId: languageId }),
  );
}

describe("HomeScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("greets the user by their first name for the selected language", () => {
    mockUseUser.mockReturnValue({ user: { firstName: "Mia" } });
    setSelectedLanguageId("spanish");

    render(<HomeScreen />);

    expect(screen.getByText(/Hola, Mia!/)).toBeTruthy();
  });

  it("falls back to the username when firstName is unavailable", () => {
    mockUseUser.mockReturnValue({
      user: { firstName: null, username: "mia123" },
    });
    setSelectedLanguageId("spanish");

    render(<HomeScreen />);

    expect(screen.getByText(/Hola, mia123!/)).toBeTruthy();
  });

  it("falls back to the email prefix when firstName and username are unavailable", () => {
    mockUseUser.mockReturnValue({
      user: {
        firstName: null,
        username: null,
        primaryEmailAddress: { emailAddress: "learner@example.com" },
      },
    });
    setSelectedLanguageId("spanish");

    render(<HomeScreen />);

    expect(screen.getByText(/Hola, learner!/)).toBeTruthy();
  });

  it('falls back to "Learner" when there is no signed-in user', () => {
    mockUseUser.mockReturnValue({ user: null });
    setSelectedLanguageId("spanish");

    render(<HomeScreen />);

    expect(screen.getByText(/Hola, Learner!/)).toBeTruthy();
  });

  it("falls back to the first language in the list when the stored id is unknown", () => {
    mockUseUser.mockReturnValue({ user: { firstName: "Mia" } });
    setSelectedLanguageId("atlantean");

    render(<HomeScreen />);

    // languages[0] is Spanish, whose greeting is "Hola".
    expect(screen.getByText(/Hola, Mia!/)).toBeTruthy();
  });

  it("shows the most recently ordered lesson for a language with multiple lessons", () => {
    mockUseUser.mockReturnValue({ user: { firstName: "Mia" } });
    setSelectedLanguageId("spanish");

    render(<HomeScreen />);

    // Spanish has two lessons; the second one (unit 2) should be selected.
    expect(screen.getByText("Spanish")).toBeTruthy();
    expect(screen.getByText("A1 · Unit 2")).toBeTruthy();
    expect(screen.getByText("Order a Drink")).toBeTruthy();
    expect(screen.getByText("3 words")).toBeTruthy();
  });

  it("falls back to the only lesson available when a language has just one lesson", () => {
    mockUseUser.mockReturnValue({ user: { firstName: "Mia" } });
    setSelectedLanguageId("french");

    render(<HomeScreen />);

    expect(screen.getByText("French")).toBeTruthy();
    expect(screen.getByText("A1 · Unit 1")).toBeTruthy();
    expect(screen.getByText("Bonjour")).toBeTruthy();
  });

  it("renders the daily goal capped at the daily goal xp value", () => {
    mockUseUser.mockReturnValue({ user: { firstName: "Mia" } });
    setSelectedLanguageId("spanish");

    render(<HomeScreen />);

    // dailyGoalXp = max(10 * 2, 20) = 20; earnedXp = min(15, 20) = 15.
    expect(screen.getByText("15")).toBeTruthy();
    expect(screen.getByText("/ 20 XP")).toBeTruthy();
  });

  it("navigates to /learn when Continue is pressed", () => {
    mockUseUser.mockReturnValue({ user: { firstName: "Mia" } });
    setSelectedLanguageId("spanish");

    render(<HomeScreen />);
    fireEvent.press(screen.getByText("Continue"));

    expect(mockPush).toHaveBeenCalledWith("/learn");
  });

  it("navigates to /ai-teacher when the next-up card is pressed", () => {
    mockUseUser.mockReturnValue({ user: { firstName: "Mia" } });
    setSelectedLanguageId("spanish");

    render(<HomeScreen />);
    fireEvent.press(screen.getByText("AI Video Call"));

    expect(mockPush).toHaveBeenCalledWith("/ai-teacher");
  });
});