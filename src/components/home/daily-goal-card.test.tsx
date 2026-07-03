import { render, screen } from "@testing-library/react-native";
import React from "react";
import type { ReactTestInstance } from "react-test-renderer";

import { DailyGoalCard } from "./daily-goal-card";

function getProgressBarWidth(root: ReactTestInstance): string | number {
  const [progressBar] = root.findAll(
    (node) =>
      typeof node.props.style === "object" &&
      node.props.style !== null &&
      "width" in node.props.style &&
      typeof node.props.style.width === "string" &&
      node.props.style.width.endsWith("%"),
  );

  return progressBar.props.style.width;
}

describe("DailyGoalCard", () => {
  it("renders the current and goal XP values", () => {
    render(<DailyGoalCard currentXp={10} goalXp={20} />);

    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByText("/ 20 XP")).toBeTruthy();
  });

  it("renders a progress bar proportional to current/goal XP", () => {
    const { UNSAFE_root } = render(
      <DailyGoalCard currentXp={10} goalXp={20} />,
    );

    expect(getProgressBarWidth(UNSAFE_root)).toBe("50%");
  });

  it("clamps the progress bar at 100% when currentXp exceeds goalXp", () => {
    const { UNSAFE_root } = render(
      <DailyGoalCard currentXp={999} goalXp={20} />,
    );

    expect(getProgressBarWidth(UNSAFE_root)).toBe("100%");
  });

  it("clamps the progress bar at 0% when currentXp is negative", () => {
    const { UNSAFE_root } = render(
      <DailyGoalCard currentXp={-10} goalXp={20} />,
    );

    expect(getProgressBarWidth(UNSAFE_root)).toBe("0%");
  });

  it("renders 0% width when currentXp is exactly zero", () => {
    const { UNSAFE_root } = render(<DailyGoalCard currentXp={0} goalXp={20} />);

    expect(getProgressBarWidth(UNSAFE_root)).toBe("0%");
    expect(screen.getByText("0")).toBeTruthy();
  });
});