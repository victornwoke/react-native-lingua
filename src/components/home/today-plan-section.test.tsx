import { render, screen } from "@testing-library/react-native";
import React from "react";

import { TodayPlanSection, type TodayPlanItem } from "./today-plan-section";

jest.mock("expo-symbols", () => {
  const { View } = require("react-native");
  return {
    SymbolView: (props: Record<string, unknown>) => (
      <View testID="symbol-view" {...props} />
    ),
  };
});

const icon = { ios: "book.fill", android: "menu_book", web: "menu_book" };

const items: TodayPlanItem[] = [
  {
    id: "lesson",
    icon,
    iconColor: "#6545F6",
    isComplete: true,
    subtitle: "Say Hello",
    title: "Lesson",
  },
  {
    id: "conversation",
    icon,
    iconColor: "#6545F6",
    isComplete: false,
    subtitle: "Practice conversation",
    title: "AI Conversation",
  },
];

describe("TodayPlanSection", () => {
  it("renders the section title and view all link", () => {
    render(<TodayPlanSection items={items} />);

    expect(screen.getByText("Today's plan")).toBeTruthy();
    expect(screen.getByText("View all")).toBeTruthy();
  });

  it("renders a row for every item with its title and subtitle", () => {
    render(<TodayPlanSection items={items} />);

    expect(screen.getByText("Lesson")).toBeTruthy();
    expect(screen.getByText("Say Hello")).toBeTruthy();
    expect(screen.getByText("AI Conversation")).toBeTruthy();
    expect(screen.getByText("Practice conversation")).toBeTruthy();
  });

  it("renders a checkmark only for completed items", () => {
    render(<TodayPlanSection items={items} />);

    expect(screen.getAllByText("✓")).toHaveLength(1);
  });

  it("renders no checkmarks when no items are complete", () => {
    const incompleteItems: TodayPlanItem[] = items.map((item) => ({
      ...item,
      isComplete: false,
    }));

    render(<TodayPlanSection items={incompleteItems} />);

    expect(screen.queryByText("✓")).toBeNull();
  });

  it("renders without crashing when given an empty list", () => {
    render(<TodayPlanSection items={[]} />);

    expect(screen.getByText("Today's plan")).toBeTruthy();
    expect(screen.queryByText("✓")).toBeNull();
  });
});