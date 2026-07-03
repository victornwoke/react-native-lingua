import { useAuth } from "@clerk/expo";
import { render, screen } from "@testing-library/react-native";
import React from "react";

import { useLanguageStore } from "@/store/language-store";

import TabLayout from "./_layout";

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

jest.mock("expo-router/js-tabs", () => {
  const { View } = require("react-native");
  function Tabs({ children }: { children?: React.ReactNode }) {
    return <View testID="tabs-root">{children}</View>;
  }
  Tabs.Screen = function Screen() {
    return null;
  };
  return { Tabs };
});

jest.mock("@/components/navigation/bottom-tab-bar", () => ({
  BottomTabBar: () => null,
}));

const mockUseAuth = useAuth as unknown as jest.Mock;
const mockUseLanguageStore = useLanguageStore as unknown as jest.Mock;

describe("TabLayout", () => {
  it("renders nothing while auth state is still loading", () => {
    mockUseAuth.mockReturnValue({ isLoaded: false, isSignedIn: false });
    mockUseLanguageStore.mockReturnValue({
      hasHydrated: true,
      selectedLanguageId: null,
    });

    const { toJSON } = render(<TabLayout />);

    expect(toJSON()).toBeNull();
  });

  it("renders nothing while the language store has not hydrated yet", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    mockUseLanguageStore.mockReturnValue({
      hasHydrated: false,
      selectedLanguageId: "spanish",
    });

    const { toJSON } = render(<TabLayout />);

    expect(toJSON()).toBeNull();
  });

  it("redirects to onboarding when the user is not signed in", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    mockUseLanguageStore.mockReturnValue({
      hasHydrated: true,
      selectedLanguageId: null,
    });

    render(<TabLayout />);

    expect(screen.getByTestId("redirect")).toHaveTextContent("/onboarding");
  });

  it("redirects to language selection when no language has been selected", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    mockUseLanguageStore.mockReturnValue({
      hasHydrated: true,
      selectedLanguageId: null,
    });

    render(<TabLayout />);

    expect(screen.getByTestId("redirect")).toHaveTextContent(
      "/language-selection",
    );
  });

  it("redirects to language selection when the stored language id is unknown", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    mockUseLanguageStore.mockReturnValue({
      hasHydrated: true,
      selectedLanguageId: "atlantean",
    });

    render(<TabLayout />);

    expect(screen.getByTestId("redirect")).toHaveTextContent(
      "/language-selection",
    );
  });

  it("renders the tab navigator when signed in with a valid selected language", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    mockUseLanguageStore.mockReturnValue({
      hasHydrated: true,
      selectedLanguageId: "spanish",
    });

    render(<TabLayout />);

    expect(screen.getByTestId("tabs-root")).toBeTruthy();
    expect(screen.queryByTestId("redirect")).toBeNull();
  });
});