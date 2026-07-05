import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Language, Lesson } from "../../types/learning";
import { getPersistStorage } from "./persist-storage";

const LESSON_PROGRESS_STORAGE_KEY = "lesson-progress-storage";

type LessonProgressState = {
  activeLessonIdByLanguageId: Partial<Record<Language["id"], Lesson["id"]>>;
  completedLessonIdsByLanguageId: Partial<
    Record<Language["id"], Lesson["id"][]>
  >;
  dailyXpByDate: Record<string, number>;
  lastCompletedDate: string | null;
  streakCount: number;
  completeLesson: (
    languageId: Language["id"],
    lessonId: Lesson["id"],
    xpReward: number,
  ) => void;
  setActiveLessonId: (
    languageId: Language["id"],
    lessonId: Lesson["id"],
  ) => void;
};

export function getTodayDateKey() {
  return getLocalDateKey(new Date());
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPreviousDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);

  return getLocalDateKey(date);
}

export const useLessonProgressStore = create<LessonProgressState>()(
  persist(
    (set) => ({
      activeLessonIdByLanguageId: {},
      completedLessonIdsByLanguageId: {},
      dailyXpByDate: {},
      lastCompletedDate: null,
      streakCount: 0,
      completeLesson: (languageId, lessonId, xpReward) => {
        const todayKey = getTodayDateKey();

        set((state) => {
          const completedLessonIds =
            state.completedLessonIdsByLanguageId[languageId] ?? [];
          const nextCompletedLessonIds = completedLessonIds.includes(lessonId)
            ? completedLessonIds
            : [...completedLessonIds, lessonId];
          const currentDailyXp = state.dailyXpByDate[todayKey] ?? 0;
          const lastCompletedDate = state.lastCompletedDate;
          const streakCount =
            lastCompletedDate === todayKey
              ? state.streakCount
              : lastCompletedDate === getPreviousDateKey(todayKey)
                ? state.streakCount + 1
                : 1;

          return {
            completedLessonIdsByLanguageId: {
              ...state.completedLessonIdsByLanguageId,
              [languageId]: nextCompletedLessonIds,
            },
            dailyXpByDate: {
              ...state.dailyXpByDate,
              [todayKey]: currentDailyXp + xpReward,
            },
            lastCompletedDate: todayKey,
            streakCount,
          };
        });
      },
      setActiveLessonId: (languageId, lessonId) => {
        set((state) => ({
          activeLessonIdByLanguageId: {
            ...state.activeLessonIdByLanguageId,
            [languageId]: lessonId,
          },
        }));
      },
    }),
    {
      name: LESSON_PROGRESS_STORAGE_KEY,
      storage: createJSONStorage(() => getPersistStorage()),
    },
  ),
);
