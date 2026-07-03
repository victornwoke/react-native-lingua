import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Language, Lesson } from "../../types/learning";

const LESSON_PROGRESS_STORAGE_KEY = "lesson-progress-storage";

type LessonProgressState = {
  activeLessonIdByLanguageId: Partial<Record<Language["id"], Lesson["id"]>>;
  setActiveLessonId: (
    languageId: Language["id"],
    lessonId: Lesson["id"],
  ) => void;
};

export const useLessonProgressStore = create<LessonProgressState>()(
  persist(
    (set) => ({
      activeLessonIdByLanguageId: {},
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
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
