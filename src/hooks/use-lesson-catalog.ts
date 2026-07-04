import { useMemo } from "react";
import type { ImageSourcePropType } from "react-native";

import { images } from "@/constants/images";
import {
  getActiveLessonForLanguage,
  getSelectedLearningLanguage,
  getSortedLessonsForLanguage,
  getSortedUnitsForLanguage,
} from "@/lib/lesson-selection";
import { useLanguageStore } from "@/store/language-store";
import { useLessonProgressStore } from "@/store/lesson-progress-store";

import type { Lesson } from "../../types/learning";

export type LessonStatus = "completed" | "current" | "upcoming";

export type LessonCatalogItem = {
  imageSource: ImageSourcePropType;
  lesson: Lesson;
  lessonNumber: number;
  status: LessonStatus;
};

export function useLessonCatalog() {
  const selectedLanguageId = useLanguageStore(
    (state) => state.selectedLanguageId,
  );
  const activeLessonIdByLanguageId = useLessonProgressStore(
    (state) => state.activeLessonIdByLanguageId,
  );

  return useMemo(() => {
    const selectedLanguage = getSelectedLearningLanguage(selectedLanguageId);
    const languageUnits = getSortedUnitsForLanguage(selectedLanguage.id);
    const languageLessons = getSortedLessonsForLanguage(selectedLanguage.id);
    const activeLesson = getActiveLessonForLanguage(
      selectedLanguage.id,
      activeLessonIdByLanguageId,
    );
    const activeLessonIndex = Math.max(
      languageLessons.findIndex((lesson) => lesson.id === activeLesson?.id),
      0,
    );
    const activeUnit = languageUnits.find(
      (unit) => unit.id === activeLesson?.unitId,
    );
    const items: LessonCatalogItem[] = languageLessons.map((lesson, index) => ({
      imageSource:
        images.lessonPlaceholderImages[lesson.id] ?? images.mascotWelcome,
      lesson,
      lessonNumber: index + 1,
      status:
        index < activeLessonIndex
          ? "completed"
          : index === activeLessonIndex
            ? "current"
            : "upcoming",
    }));

    return {
      activeLesson,
      activeLessonIndex,
      activeUnit,
      items,
      selectedLanguage,
      totalLessons: languageLessons.length,
      unitProgressLabel: `Unit ${activeUnit?.order ?? 1} · ${
        activeLessonIndex + 1
      } / ${languageLessons.length} lessons`,
    };
  }, [activeLessonIdByLanguageId, selectedLanguageId]);
}
