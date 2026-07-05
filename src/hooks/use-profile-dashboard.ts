import { useMemo } from "react";

import { getSortedLessonsForLanguage } from "@/lib/lesson-selection";
import {
  getTodayDateKey,
  useLessonProgressStore,
} from "@/store/lesson-progress-store";

import { useHomeDashboard } from "./use-home-dashboard";

export function useProfileDashboard() {
  const completedLessonIdsByLanguageId = useLessonProgressStore(
    (state) => state.completedLessonIdsByLanguageId,
  );
  const dailyXpByDate = useLessonProgressStore((state) => state.dailyXpByDate);
  const lastCompletedDate = useLessonProgressStore(
    (state) => state.lastCompletedDate,
  );
  const homeDashboard = useHomeDashboard();

  return useMemo(() => {
    const selectedLanguage = homeDashboard.selectedLanguage;
    const lessons = getSortedLessonsForLanguage(selectedLanguage.id);
    const completedLessonIds =
      completedLessonIdsByLanguageId[selectedLanguage.id] ?? [];
    const completedLessons = lessons.filter((lesson) =>
      completedLessonIds.includes(lesson.id),
    );
    const totalXp = Object.values(dailyXpByDate).reduce(
      (sum, xp) => sum + xp,
      0,
    );
    const activeDays = Object.values(dailyXpByDate).filter((xp) => xp > 0).length;
    const wordsLearned = completedLessons.reduce(
      (sum, lesson) => sum + lesson.vocabulary.length,
      0,
    );
    const courseProgress =
      lessons.length > 0 ? completedLessons.length / lessons.length : 0;
    const dailyGoalProgress = Math.min(
      Math.max(homeDashboard.earnedXp / homeDashboard.dailyGoalXp, 0),
      1,
    );
    const isDailyGoalComplete =
      homeDashboard.earnedXp >= homeDashboard.dailyGoalXp;

    return {
      ...homeDashboard,
      activeDays,
      courseProgress,
      dailyGoalProgress,
      isDailyGoalComplete,
      lastCompletedDate,
      todayDateKey: getTodayDateKey(),
      totalXp,
      wordsLearned,
    };
  }, [
    completedLessonIdsByLanguageId,
    dailyXpByDate,
    homeDashboard,
    lastCompletedDate,
  ]);
}
