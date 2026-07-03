import { useAuth } from "@clerk/expo";
import { render, screen } from "@testing-library/react-native";
import React from "react";

import { useLanguageStore } from "@/store/language-store";

import Index from "./index";

jest.mock("@clerk/expo", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/store/language-store", () => ({
  useLanguageStore: jest.fn(),
}));

jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  return {
    Redirect: ({ href }: { href: string }) => (
      <Text testID="redirect">{href}</Text>
    ),
  };
});

const mockUseAuth = useAuth as unknown as jest.Mock;
const mockUseLanguageStore = useLanguageStore as unknown as jest.Mock;

describe("Index", () => {
  it("renders nothing while auth is still loading", () => {
    mockUseAuth.mockReturnValue({ isLoaded: false, isSignedIn: false });
    mockUseLanguageStore.mockReturnValue({
      selectedLanguageId: null,
      hasHydrated: true,
    });

    const { toJSON } = render(<Index />);

    expect(toJSON()).toBeNull();
  });

  it("redirects to onboarding when the user is not signed in", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    mockUseLanguageStore.mockReturnValue({
      selectedLanguageId: null,
      hasHydrated: true,
    });

    render(<Index />);

    expect(screen.getByTestId("redirect")).toHaveTextContent("/onboarding");
  });

  it("renders nothing while signed in but the language store has not hydrated", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    mockUseLanguageStore.mockReturnValue({
      selectedLanguageId: null,
      hasHydrated: false,
    });

    const { toJSON } = render(<Index />);

    expect(toJSON()).toBeNull();
  });

  it("redirects to language selection when no language has been selected", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    mockUseLanguageStore.mockReturnValue({
      selectedLanguageId: null,
      hasHydrated: true,
    });

    render(<Index />);

    expect(screen.getByTestId("redirect")).toHaveTextContent(
      "/language-selection",
    );
  });

  it("redirects to language selection when the stored language id is unknown", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    mockUseLanguageStore.mockReturnValue({
      selectedLanguageId: "atlantean",
      hasHydrated: true,
    });

    render(<Index />);

    expect(screen.getByTestId("redirect")).toHaveTextContent(
      "/language-selection",
    );
  });

  it("redirects to home when signed in, hydrated, and a valid language is selected", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    mockUseLanguageStore.mockReturnValue({
      selectedLanguageId: "spanish",
      hasHydrated: true,
    });

    render(<Index />);

    expect(screen.getByTestId("redirect")).toHaveTextContent("/home");
  });
});