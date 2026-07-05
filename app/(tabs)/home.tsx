import { useUser } from "@clerk/expo";
import { type Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

import { ContinueLearningCard } from "@/components/home/continue-learning-card";
import { DailyGoalCard } from "@/components/home/daily-goal-card";
import { HomeHeader } from "@/components/home/home-header";
import { NextUpCard } from "@/components/home/next-up-card";
import {
  TodayPlanSection,
  type TodayPlanItem,
} from "@/components/home/today-plan-section";
import {
  useHomeDashboard,
  useStartVideoCall,
} from "@/hooks/use-home-dashboard";

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
  const router = useRouter();
  const posthog = usePostHog();
  const { user } = useUser();
  const { height, width } = useWindowDimensions();
  const {
    currentLesson,
    dailyGoalXp,
    earnedXp,
    planItems,
    selectedLanguage,
    streakCount,
    unitLabel,
  } = useHomeDashboard();
  const horizontalPadding = width < 380 ? 18 : 24;
  const topPadding = height < 720 ? 8 : 16;
  const handleStartVideoCall = useStartVideoCall({
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

  function handleContinueLearning() {
    posthog.capture("continue_learning_tapped", {
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
    });
    router.push("/learn" as Href);
  }

  function handleChangeLanguage() {
    posthog.capture("change_language_tapped", {
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
    });
    router.push("/language-selection" as Href);
  }

  function handleOpenProfile() {
    router.push("/profile" as Href);
  }

  function handleViewPlan() {
    posthog.capture("today_plan_view_all_tapped", {
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
    });
    router.push("/learn" as Href);
  }

  function handlePlanItemPress(item: TodayPlanItem) {
    posthog.capture("today_plan_item_tapped", {
      item_id: item.id,
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
    });

    if (item.id === "conversation") {
      router.push("/chat" as Href);
      return;
    }

    if (item.id === "new-words" || !currentLesson) {
      router.push("/learn" as Href);
      return;
    }

    router.push(`/lesson/${currentLesson.id}` as Href);
  }

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
            onNotificationPress={handleOpenProfile}
            streakCount={streakCount}
            userName={getDisplayName(user)}
          />

          <DailyGoalCard currentXp={earnedXp} goalXp={dailyGoalXp} />

          <ContinueLearningCard
            languageName={selectedLanguage.name}
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
            onPress={handleStartVideoCall}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
