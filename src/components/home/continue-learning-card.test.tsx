import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { ContinueLearningCard } from "./continue-learning-card";

describe("ContinueLearningCard", () => {
  it("renders the language name and unit label", () => {
    render(
      <ContinueLearningCard
        languageName="Spanish"
        unitLabel="A1 · Unit 1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Continue learning")).toBeTruthy();
    expect(screen.getByText("Spanish")).toBeTruthy();
    expect(screen.getByText("A1 · Unit 1")).toBeTruthy();
  });

  it("calls onPress when the Continue button is pressed", () => {
    const onPress = jest.fn();
    render(
      <ContinueLearningCard
        languageName="French"
        unitLabel="A1 · Unit 2"
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByText("Continue"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("updates displayed text when props change across renders", () => {
    const { rerender } = render(
      <ContinueLearningCard
        languageName="German"
        unitLabel="A1 · Unit 1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("German")).toBeTruthy();

    rerender(
      <ContinueLearningCard
        languageName="Japanese"
        unitLabel="A1 · Unit 3"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Japanese")).toBeTruthy();
    expect(screen.getByText("A1 · Unit 3")).toBeTruthy();
    expect(screen.queryByText("German")).toBeNull();
  });
});