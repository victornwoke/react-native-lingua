import { useMemo } from "react";

import type { TodayPlanItem } from "@/components/home/today-plan-section";
import { useLanguageStore } from "@/store/language-store";

import { languages } from "../../data/languages";
import { lessons } from "../../data/lessons";
import { units } from "../../data/units";

export function useHomeDashboard() {
  const selectedLanguageId = useLanguageStore(
    (state) => state.selectedLanguageId,
  );

  return useMemo(() => {
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
          languageUnits.find((unit) => unit.id === secondLesson.unitId)
            ?.order ?? 0;

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

    return {
      dailyGoalXp,
      earnedXp,
      planItems,
      selectedLanguage,
      unitLabel,
    };
  }, [selectedLanguageId]);
}
