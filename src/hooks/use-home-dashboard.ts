import { type Href, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useCallback, useMemo } from "react";

import type { TodayPlanItem } from "@/components/home/today-plan-section";
import {
  getActiveLessonForLanguage,
  getSelectedLearningLanguage,
  getSortedLessonsForLanguage,
  getSortedUnitsForLanguage,
} from "@/lib/lesson-selection";
import { useLanguageStore } from "@/store/language-store";
import {
  getTodayDateKey,
  useLessonProgressStore,
} from "@/store/lesson-progress-store";
import type { Language, Lesson } from "../../types/learning";

export function useHomeDashboard() {
  const selectedLanguageId = useLanguageStore(
    (state) => state.selectedLanguageId,
  );
  const activeLessonIdByLanguageId = useLessonProgressStore(
    (state) => state.activeLessonIdByLanguageId,
  );
  const completedLessonIdsByLanguageId = useLessonProgressStore(
    (state) => state.completedLessonIdsByLanguageId,
  );
  const todayXp = useLessonProgressStore(
    (state) => state.dailyXpByDate[getTodayDateKey()] ?? 0,
  );
  const streakCount = useLessonProgressStore((state) => state.streakCount);

  return useMemo(() => {
    const selectedLanguage = getSelectedLearningLanguage(selectedLanguageId);
    const languageUnits = getSortedUnitsForLanguage(selectedLanguage.id);
    const languageLessons = getSortedLessonsForLanguage(selectedLanguage.id);
    const currentLesson = getActiveLessonForLanguage(
      selectedLanguage.id,
      activeLessonIdByLanguageId,
    );
    const currentUnit = languageUnits.find(
      (unit) => unit.id === currentLesson?.unitId,
    );
    const dailyGoalXp = Math.max(selectedLanguage.dailyGoalMinutes * 2, 20);
    const earnedXp = Math.min(todayXp, dailyGoalXp);
    const unitLabel = `A1 · Unit ${currentUnit?.order ?? 1}`;
    const completedLessonIds =
      completedLessonIdsByLanguageId[selectedLanguage.id] ?? [];
    const completedLessonCount = completedLessonIds.length;
    const planLessonComplete = earnedXp > 0;
    const planConversationComplete = earnedXp >= Math.ceil(dailyGoalXp * 0.7);
    const planNewWordsComplete = earnedXp >= dailyGoalXp;
    const planItems: TodayPlanItem[] = [
      {
        id: "lesson",
        icon: { ios: "book.fill", android: "menu_book", web: "menu_book" },
        iconColor: "#6545F6",
        isComplete: planLessonComplete,
        subtitle: currentLesson?.title ?? "Start with the basics",
        title: "Lesson",
      },
      {
        id: "conversation",
        icon: { ios: "headphones", android: "headphones", web: "headphones" },
        iconColor: "#6545F6",
        isComplete: planConversationComplete,
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
        isComplete: planNewWordsComplete,
        subtitle: `${currentLesson?.vocabulary.length ?? 0} words`,
        title: "New words",
      },
    ];

    return {
      currentLesson,
      completedLessonCount,
      dailyGoalXp,
      earnedXp,
      lessonCount: languageLessons.length,
      planItems,
      selectedLanguage,
      streakCount,
      unitLabel,
    };
  }, [
    activeLessonIdByLanguageId,
    completedLessonIdsByLanguageId,
    selectedLanguageId,
    streakCount,
    todayXp,
  ]);
}

type UseStartVideoCallOptions = {
  currentLesson: Lesson | undefined;
  selectedLanguage: Language;
};

export function useStartVideoCall({
  currentLesson,
  selectedLanguage,
}: UseStartVideoCallOptions) {
  const router = useRouter();
  const posthog = usePostHog();
  const setActiveLessonId = useLessonProgressStore(
    (state) => state.setActiveLessonId,
  );

  return useCallback(() => {
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
  }, [
    currentLesson,
    posthog,
    router,
    selectedLanguage.id,
    selectedLanguage.name,
    setActiveLessonId,
  ]);
}
