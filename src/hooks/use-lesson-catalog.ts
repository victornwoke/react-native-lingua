import { useMemo } from "react";
import type { ImageSourcePropType } from "react-native";

import { images } from "@/constants/images";
import { useLanguageStore } from "@/store/language-store";
import { useLessonProgressStore } from "@/store/lesson-progress-store";

import { languages } from "../../data/languages";
import { lessons } from "../../data/lessons";
import { units } from "../../data/units";
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
    const savedActiveLessonId =
      activeLessonIdByLanguageId[selectedLanguage.id];
    const activeLesson =
      languageLessons.find((lesson) => lesson.id === savedActiveLessonId) ??
      languageLessons[2] ??
      languageLessons[0];
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
