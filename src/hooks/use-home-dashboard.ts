import { useMemo } from "react";

import type { TodayPlanItem } from "@/components/home/today-plan-section";
import {
  getActiveLessonForLanguage,
  getSelectedLearningLanguage,
  getSortedUnitsForLanguage,
} from "@/lib/lesson-selection";
import { useLanguageStore } from "@/store/language-store";
import { useLessonProgressStore } from "@/store/lesson-progress-store";

export function useHomeDashboard() {
  const selectedLanguageId = useLanguageStore(
    (state) => state.selectedLanguageId,
  );
  const activeLessonIdByLanguageId = useLessonProgressStore(
    (state) => state.activeLessonIdByLanguageId,
  );

  return useMemo(() => {
    const selectedLanguage = getSelectedLearningLanguage(selectedLanguageId);
    const languageUnits = getSortedUnitsForLanguage(selectedLanguage.id);
    const currentLesson = getActiveLessonForLanguage(
      selectedLanguage.id,
      activeLessonIdByLanguageId,
    );
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

    return {
      currentLesson,
      dailyGoalXp,
      earnedXp,
      planItems,
      selectedLanguage,
      unitLabel,
    };
  }, [activeLessonIdByLanguageId, selectedLanguageId]);
}
