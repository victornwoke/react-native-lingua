import { useUser } from "@clerk/expo";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

import { ContinueLearningCard } from "@/components/home/continue-learning-card";
import { DailyGoalCard } from "@/components/home/daily-goal-card";
import { HomeHeader } from "@/components/home/home-header";
import { NextUpCard } from "@/components/home/next-up-card";
import { TodayPlanSection } from "@/components/home/today-plan-section";
import { useHomeActions } from "@/hooks/use-home-actions";
import {
  useHomeDashboard,
  useStartVoiceCall,
} from "@/hooks/use-home-dashboard";
import { useLearningNavigation } from "@/hooks/use-learning-navigation";

const greetingsByLanguageId: Record<string, string> = {
  french: "Bonjour",
  german: "Hallo",
  japanese: "Konnichiwa",
  spanish: "Hola",
};

function getDisplayName(user: ReturnType<typeof useUser>["user"]) {
  if (!user) {
    return "Learner";
  }

  return (
    user.firstName ??
    user.username ??
    user.primaryEmailAddress?.emailAddress.split("@")[0] ??
    "Learner"
  );
}

export default function HomeScreen() {
  const posthog = usePostHog();
  const { user } = useUser();
  const { height, width } = useWindowDimensions();
  const {
    completedLessonCount,
    currentLesson,
    dailyGoalXp,
    dailyGoalMessage,
    earnedXp,
    planItems,
    progressLabel,
    selectedLanguage,
    streakCount,
    unitLabel,
  } = useHomeDashboard();
  const horizontalPadding = width < 380 ? 18 : 24;
  const topPadding = height < 720 ? 8 : 16;
  const handleStartVoiceCall = useStartVoiceCall({
    currentLesson,
    selectedLanguage,
  });
  const { handleChangeLanguage, handleContinueLearning } =
    useLearningNavigation({
      changeLanguageEventName: "change_language_tapped",
      continueLearningEventName: "continue_learning_tapped",
      currentLesson,
      selectedLanguage,
    });
  const { handleOpenProfile, handlePlanItemPress, handleViewPlan } =
    useHomeActions({
      currentLesson,
      selectedLanguage,
    });

  useEffect(() => {
    posthog.capture("home_dashboard_viewed", {
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
      earned_xp: earnedXp,
      daily_goal_xp: dailyGoalXp,
      streak_count: streakCount,
    });
  }, [
    dailyGoalXp,
    earnedXp,
    posthog,
    selectedLanguage.id,
    selectedLanguage.name,
    streakCount,
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: 110,
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <HomeHeader
            greeting={greetingsByLanguageId[selectedLanguage.id] ?? "Hello"}
            language={selectedLanguage}
            onLanguagePress={handleChangeLanguage}
            onProfilePress={handleOpenProfile}
            streakCount={streakCount}
            userName={getDisplayName(user)}
          />

          <DailyGoalCard
            currentXp={earnedXp}
            goalXp={dailyGoalXp}
            statusText={dailyGoalMessage}
          />

          <ContinueLearningCard
            actionLabel={completedLessonCount === 0 ? "Start" : "Continue"}
            languageName={selectedLanguage.name}
            lessonTitle={currentLesson?.title ?? "Choose your next lesson"}
            progressLabel={progressLabel}
            unitLabel={unitLabel}
            onPress={handleContinueLearning}
          />

          <TodayPlanSection
            items={planItems}
            onItemPress={handlePlanItemPress}
            onViewAllPress={handleViewPlan}
          />

          <NextUpCard
            subtitle={currentLesson?.title ?? `Practice ${selectedLanguage.name}`}
            onPress={handleStartVoiceCall}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
