import { useUser } from "@clerk/expo";
import { type Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ContinueLearningCard } from "@/components/home/continue-learning-card";
import { DailyGoalCard } from "@/components/home/daily-goal-card";
import { HomeHeader } from "@/components/home/home-header";
import { NextUpCard } from "@/components/home/next-up-card";
import {
  TodayPlanSection,
  type TodayPlanItem,
} from "@/components/home/today-plan-section";
import { useLanguageStore } from "@/store/language-store";

import { languages } from "../../data/languages";
import { lessons } from "../../data/lessons";
import { units } from "../../data/units";

const AI_TEACHER_ROUTE = "/ai-teacher" as Href;

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
  const { user } = useUser();
  const selectedLanguageId = useLanguageStore(
    (state) => state.selectedLanguageId,
  );
  const selectedLanguage =
    languages.find((language) => language.id === selectedLanguageId) ??
    languages[0];
  const languageUnits = units
    .filter((unit) => unit.languageId === selectedLanguage.id)
    .sort((firstUnit, secondUnit) => firstUnit.order - secondUnit.order);
  const languageLessons = lessons
    .filter((lesson) => lesson.languageId === selectedLanguage.id)
    .sort((firstLesson, secondLesson) => {
      const firstUnitOrder =
        languageUnits.find((unit) => unit.id === firstLesson.unitId)?.order ??
        0;
      const secondUnitOrder =
        languageUnits.find((unit) => unit.id === secondLesson.unitId)?.order ??
        0;

      return (
        firstUnitOrder - secondUnitOrder ||
        firstLesson.order - secondLesson.order
      );
    });
  const currentLesson = languageLessons[1] ?? languageLessons[0];
  const currentUnit = languageUnits.find(
    (unit) => unit.id === currentLesson?.unitId,
  );
  const dailyGoalXp = Math.max(selectedLanguage.dailyGoalMinutes * 2, 20);
  const earnedXp = Math.min(currentLesson?.xpReward ?? 0, dailyGoalXp);
  const unitLabel = `A1 · Unit ${currentUnit?.order ?? 1}`;
  const planItems: TodayPlanItem[] = [
    {
      id: "lesson",
      icon: { ios: "book.fill", android: "menu_book", web: "menu_book" },
      iconColor: "#6545F6",
      isComplete: true,
      subtitle: currentLesson?.title ?? "Start with the basics",
      title: "Lesson",
    },
    {
      id: "conversation",
      icon: { ios: "headphones", android: "headphones", web: "headphones" },
      iconColor: "#6545F6",
      isComplete: false,
      subtitle: currentLesson?.aiTeacherPrompt.teachingObjective
        ? "Talk about your day"
        : "Practice conversation",
      title: "AI Conversation",
    },
    {
      id: "new-words",
      icon: {
        ios: "message.fill",
        android: "mark_unread_chat_alt",
        web: "mark_unread_chat_alt",
      },
      iconColor: "#FF5B63",
      isComplete: false,
      subtitle: `${currentLesson?.vocabulary.length ?? 0} words`,
      title: "New words",
    },
  ];

  function handleContinueLearning() {
    router.push("/learn" as Href);
  }

  function handleStartVideoCall() {
    router.push(AI_TEACHER_ROUTE);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 98,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
});
