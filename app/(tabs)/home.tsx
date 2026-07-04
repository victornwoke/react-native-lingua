import { useUser } from "@clerk/expo";
import { type Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

import { ContinueLearningCard } from "@/components/home/continue-learning-card";
import { DailyGoalCard } from "@/components/home/daily-goal-card";
import { HomeHeader } from "@/components/home/home-header";
import { NextUpCard } from "@/components/home/next-up-card";
import { TodayPlanSection } from "@/components/home/today-plan-section";
import { useHomeDashboard } from "@/hooks/use-home-dashboard";
import { useLessonProgressStore } from "@/store/lesson-progress-store";

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
  const setActiveLessonId = useLessonProgressStore(
    (state) => state.setActiveLessonId,
  );
  const {
    currentLesson,
    dailyGoalXp,
    earnedXp,
    planItems,
    selectedLanguage,
    unitLabel,
  } = useHomeDashboard();

  useEffect(() => {
    posthog.capture("home_dashboard_viewed", {
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
      earned_xp: earnedXp,
      daily_goal_xp: dailyGoalXp,
    });
  }, [dailyGoalXp, earnedXp, posthog, selectedLanguage.id, selectedLanguage.name]);

  function handleContinueLearning() {
    posthog.capture("continue_learning_tapped", {
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
    });
    router.push("/learn" as Href);
  }

  function handleStartVideoCall() {
    if (!currentLesson) {
      router.push("/learn" as Href);
      return;
    }

    setActiveLessonId(selectedLanguage.id, currentLesson.id);
    posthog.capture("ai_teacher_started", {
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
      lesson_id: currentLesson.id,
      lesson_title: currentLesson.title,
    });
    router.push(`/lesson/${currentLesson.id}` as Href);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-[98px] pt-4">
          <HomeHeader
            greeting={greetingsByLanguageId[selectedLanguage.id] ?? "Hello"}
            language={selectedLanguage}
            streakCount={12}
            userName={getDisplayName(user)}
          />

          <DailyGoalCard currentXp={earnedXp} goalXp={dailyGoalXp} />

          <ContinueLearningCard
            languageName={selectedLanguage.name}
            unitLabel={unitLabel}
            onPress={handleContinueLearning}
          />

          <TodayPlanSection items={planItems} />

          <NextUpCard onPress={handleStartVideoCall} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
