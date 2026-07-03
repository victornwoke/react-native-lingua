import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { NextUpCard } from "./next-up-card";

jest.mock("expo-symbols", () => {
  const { View } = require("react-native");
  return {
    SymbolView: (props: Record<string, unknown>) => (
      <View testID="symbol-view" {...props} />
    ),
  };
});

describe("NextUpCard", () => {
  it("renders the next up copy", () => {
    render(<NextUpCard onPress={jest.fn()} />);

    expect(screen.getByText("Next up")).toBeTruthy();
    expect(screen.getByText("AI Video Call")).toBeTruthy();
    expect(screen.getByText("Practice speaking")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<NextUpCard onPress={onPress} />);

    fireEvent.press(screen.getByText("AI Video Call"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});