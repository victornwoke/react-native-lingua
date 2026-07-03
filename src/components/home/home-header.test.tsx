import { render, screen } from "@testing-library/react-native";
import React from "react";

import { HomeHeader } from "./home-header";
import type { Language } from "../../../types/learning";

jest.mock("expo-symbols", () => {
  const { View } = require("react-native");
  return {
    SymbolView: (props: Record<string, unknown>) => (
      <View testID="symbol-view" {...props} />
    ),
  };
});

const spanish: Language = {
  id: "spanish",
  code: "es",
  name: "Spanish",
  nativeName: "Español",
  flag: "https://flagcdn.com/w320/es.png",
  color: "#FF9500",
  description: "Learn Spanish",
  dailyGoalMinutes: 10,
};

describe("HomeHeader", () => {
  it("renders the greeting combined with the user's name", () => {
    render(
      <HomeHeader
        greeting="Hola"
        language={spanish}
        userName="Ana"
        streakCount={5}
      />,
    );

    expect(screen.getByText(/Hola, Ana!/)).toBeTruthy();
  });

  it("renders the streak count", () => {
    render(
      <HomeHeader
        greeting="Hello"
        language={spanish}
        userName="Ana"
        streakCount={12}
      />,
    );

    expect(screen.getByText("12")).toBeTruthy();
  });

  it("renders a streak count of zero without crashing", () => {
    render(
      <HomeHeader
        greeting="Hello"
        language={spanish}
        userName="Ana"
        streakCount={0}
      />,
    );

    expect(screen.getByText("0")).toBeTruthy();
  });

  it("renders the language flag image using the provided flag uri", () => {
    const { UNSAFE_root } = render(
      <HomeHeader
        greeting="Hello"
        language={spanish}
        userName="Ana"
        streakCount={0}
      />,
    );

    const [flagImage] = UNSAFE_root.findAll(
      (node) =>
        typeof node.props.source === "object" &&
        node.props.source !== null &&
        node.props.source.uri === spanish.flag,
    );

    expect(flagImage).toBeTruthy();
  });
});