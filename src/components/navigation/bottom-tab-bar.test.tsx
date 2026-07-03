import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { BottomTabBar } from "./bottom-tab-bar";

jest.mock("expo-symbols", () => {
  const { View } = require("react-native");
  return {
    SymbolView: () => <View testID="symbol-view" />,
  };
});

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: { View },
    Easing: { linear: "linear" },
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: (factory: () => Record<string, unknown>) => factory(),
    withTiming: (value: number) => value,
  };
});

jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock"),
);

type RouteOptionsMap = Record<string, Record<string, unknown>>;

function createRoute(name: string) {
  return { key: `${name}-key`, name, params: undefined as undefined };
}

function createProps(
  overrides: {
    routeNames?: string[];
    focusedIndex?: number;
    options?: RouteOptionsMap;
  } = {},
) {
  const routeNames = overrides.routeNames ?? [
    "home",
    "learn",
    "ai-teacher",
    "chat",
    "profile",
  ];
  const routes = routeNames.map(createRoute);
  const descriptors = Object.fromEntries(
    routes.map((route) => [
      route.key,
      { options: overrides.options?.[route.name] ?? {} },
    ]),
  );
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigate = jest.fn();

  return {
    state: { index: overrides.focusedIndex ?? 0, routes },
    descriptors,
    navigation: { emit, navigate },
  };
}

describe("BottomTabBar", () => {
  it("renders a label for every known, unfocused route", () => {
    const props = createProps({ focusedIndex: 0 });
    render(<BottomTabBar {...(props as never)} />);

    expect(screen.getByText("Learn")).toBeTruthy();
    expect(screen.getByText("AI Teacher")).toBeTruthy();
    expect(screen.getByText("Chat")).toBeTruthy();
    expect(screen.getByText("Profile")).toBeTruthy();
  });

  it("hides the text label for the currently focused tab", () => {
    const props = createProps({ focusedIndex: 0 });
    render(<BottomTabBar {...(props as never)} />);

    expect(screen.queryByText("Home")).toBeNull();
  });

  it("filters out routes that are not part of the known tab configuration", () => {
    const props = createProps({ routeNames: ["home", "unknown-route"] });
    render(<BottomTabBar {...(props as never)} />);

    expect(screen.queryByText("unknown-route")).toBeNull();
  });

  it("navigates to a tab when it is pressed and not already focused", () => {
    const props = createProps({ focusedIndex: 0 });
    render(<BottomTabBar {...(props as never)} />);

    fireEvent.press(screen.getByText("Learn"));

    expect(props.navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tabPress", target: "learn-key" }),
    );
    expect(props.navigation.navigate).toHaveBeenCalledWith("learn", undefined);
  });

  it("does not call navigate when the tabPress event is default-prevented", () => {
    const props = createProps({ focusedIndex: 0 });
    props.navigation.emit = jest.fn(() => ({ defaultPrevented: true }));
    render(<BottomTabBar {...(props as never)} />);

    fireEvent.press(screen.getByText("Learn"));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });

  it("still navigates correctly when a non-first tab is the focused one", () => {
    const props = createProps({ focusedIndex: 1 });
    render(<BottomTabBar {...(props as never)} />);

    // "learn" (index 1) is focused, so its label is hidden;
    // pressing another, unfocused tab should still navigate as expected.
    fireEvent.press(screen.getByText("Home"));

    expect(props.navigation.navigate).toHaveBeenCalledWith("home", undefined);
  });

  it("emits a tabLongPress event when a tab is long pressed", () => {
    const props = createProps({ focusedIndex: 0 });
    render(<BottomTabBar {...(props as never)} />);

    fireEvent(screen.getByText("Learn"), "longPress");

    expect(props.navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tabLongPress", target: "learn-key" }),
    );
  });

  it("uses a custom tabBarLabel option when provided instead of the default label", () => {
    const props = createProps({
      focusedIndex: 0,
      options: { learn: { tabBarLabel: "Lessons" } },
    });
    render(<BottomTabBar {...(props as never)} />);

    expect(screen.getByText("Lessons")).toBeTruthy();
    expect(screen.queryByText("Learn")).toBeNull();
  });

  it("falls back to the title option for accessibility label when no explicit accessibility label is set", () => {
    const props = createProps({
      focusedIndex: 0,
      options: { learn: { title: "Learning" } },
    });
    render(<BottomTabBar {...(props as never)} />);

    expect(screen.getByLabelText("Learning")).toBeTruthy();
  });
});