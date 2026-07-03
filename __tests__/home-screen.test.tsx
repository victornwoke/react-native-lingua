import React from "react";
import { act, cleanup, render } from "@testing-library/react-native";

import HomeScreen from "../app/(tabs)/home";

const mockCapture = jest.fn();
const mockPush = jest.fn();
const mockUseHomeDashboard = jest.fn();
const mockUseUser = jest.fn();

jest.mock("@clerk/expo", () => ({
  useUser: () => mockUseUser(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("posthog-react-native", () => ({
  usePostHog: () => ({ capture: mockCapture }),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: View,
  };
});

jest.mock("@/hooks/use-home-dashboard", () => ({
  useHomeDashboard: () => mockUseHomeDashboard(),
}));

let mockContinueLearningOnPress: (() => void) | undefined;
let mockNextUpOnPress: (() => void) | undefined;

jest.mock("@/components/home/continue-learning-card", () => ({
  ContinueLearningCard: (props: { onPress: () => void }) => {
    mockContinueLearningOnPress = props.onPress;
    return null;
  },
}));

jest.mock("@/components/home/daily-goal-card", () => ({
  DailyGoalCard: () => null,
}));

jest.mock("@/components/home/home-header", () => ({
  HomeHeader: () => null,
}));

jest.mock("@/components/home/next-up-card", () => ({
  NextUpCard: (props: { onPress: () => void }) => {
    mockNextUpOnPress = props.onPress;
    return null;
  },
}));

jest.mock("@/components/home/today-plan-section", () => ({
  TodayPlanSection: () => null,
}));

type DashboardOverrides = Partial<{
  dailyGoalXp: number;
  earnedXp: number;
  planItems: unknown[];
  selectedLanguage: { id: string; name: string };
  unitLabel: string;
}>;

function buildDashboard(overrides: DashboardOverrides = {}) {
  return {
    dailyGoalXp: 20,
    earnedXp: 10,
    planItems: [],
    selectedLanguage: { id: "spanish", name: "Spanish" },
    unitLabel: "A1 · Unit 1",
    ...overrides,
  };
}

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContinueLearningOnPress = undefined;
    mockNextUpOnPress = undefined;
    mockUseUser.mockReturnValue({ user: null });
    mockUseHomeDashboard.mockReturnValue(buildDashboard());
  });

  afterEach(() => {
    cleanup();
  });

  it("captures home_dashboard_viewed with the current dashboard values on mount", () => {
    mockUseHomeDashboard.mockReturnValue(
      buildDashboard({ dailyGoalXp: 30, earnedXp: 15 }),
    );

    render(<HomeScreen />);

    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockCapture).toHaveBeenCalledWith("home_dashboard_viewed", {
      language_id: "spanish",
      language_name: "Spanish",
      earned_xp: 15,
      daily_goal_xp: 30,
    });
  });

  it("re-fires home_dashboard_viewed when earnedXp changes after mount", () => {
    mockUseHomeDashboard.mockReturnValue(buildDashboard({ earnedXp: 10 }));
    const { rerender } = render(<HomeScreen />);

    expect(mockCapture).toHaveBeenCalledTimes(1);

    mockUseHomeDashboard.mockReturnValue(buildDashboard({ earnedXp: 25 }));
    act(() => {
      rerender(<HomeScreen />);
    });

    expect(mockCapture).toHaveBeenCalledTimes(2);
    expect(mockCapture).toHaveBeenLastCalledWith("home_dashboard_viewed", {
      language_id: "spanish",
      language_name: "Spanish",
      earned_xp: 25,
      daily_goal_xp: 20,
    });
  });

  it("re-fires home_dashboard_viewed when dailyGoalXp changes after mount", () => {
    mockUseHomeDashboard.mockReturnValue(buildDashboard({ dailyGoalXp: 20 }));
    const { rerender } = render(<HomeScreen />);

    expect(mockCapture).toHaveBeenCalledTimes(1);

    mockUseHomeDashboard.mockReturnValue(buildDashboard({ dailyGoalXp: 40 }));
    act(() => {
      rerender(<HomeScreen />);
    });

    expect(mockCapture).toHaveBeenCalledTimes(2);
    expect(mockCapture).toHaveBeenLastCalledWith(
      "home_dashboard_viewed",
      expect.objectContaining({ daily_goal_xp: 40 }),
    );
  });

  it("re-fires home_dashboard_viewed when the selected language changes after mount", () => {
    const { rerender } = render(<HomeScreen />);

    expect(mockCapture).toHaveBeenCalledTimes(1);

    mockUseHomeDashboard.mockReturnValue(
      buildDashboard({ selectedLanguage: { id: "french", name: "French" } }),
    );
    act(() => {
      rerender(<HomeScreen />);
    });

    expect(mockCapture).toHaveBeenCalledTimes(2);
    expect(mockCapture).toHaveBeenLastCalledWith(
      "home_dashboard_viewed",
      expect.objectContaining({
        language_id: "french",
        language_name: "French",
      }),
    );
  });

  it("does not re-fire home_dashboard_viewed when unrelated dashboard fields change", () => {
    const { rerender } = render(<HomeScreen />);

    expect(mockCapture).toHaveBeenCalledTimes(1);

    mockUseHomeDashboard.mockReturnValue(
      buildDashboard({ unitLabel: "A1 · Unit 2", planItems: [{ id: "x" }] }),
    );
    act(() => {
      rerender(<HomeScreen />);
    });

    expect(mockCapture).toHaveBeenCalledTimes(1);
  });

  it("captures continue_learning_tapped and navigates to /learn when continue learning is pressed", () => {
    render(<HomeScreen />);

    act(() => {
      mockContinueLearningOnPress?.();
    });

    expect(mockCapture).toHaveBeenCalledWith("continue_learning_tapped", {
      language_id: "spanish",
      language_name: "Spanish",
    });
    expect(mockPush).toHaveBeenCalledWith("/learn");
  });

  it("captures ai_teacher_started and navigates to the AI teacher route when starting a video call", () => {
    render(<HomeScreen />);

    act(() => {
      mockNextUpOnPress?.();
    });

    expect(mockCapture).toHaveBeenCalledWith("ai_teacher_started", {
      language_id: "spanish",
      language_name: "Spanish",
    });
    expect(mockPush).toHaveBeenCalledWith("/ai-teacher");
  });
});