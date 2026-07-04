import { languages } from "../../data/languages";
import { lessons } from "../../data/lessons";
import { units } from "../../data/units";
import type { Language, Lesson } from "../../types/learning";

type ActiveLessonMap = Partial<Record<Language["id"], Lesson["id"]>>;

export function getSelectedLearningLanguage(languageId: string | null) {
  return languages.find((language) => language.id === languageId) ?? languages[0];
}

export function getSortedUnitsForLanguage(languageId: Language["id"]) {
  return units
    .filter((unit) => unit.languageId === languageId)
    .sort((firstUnit, secondUnit) => firstUnit.order - secondUnit.order);
}

export function getSortedLessonsForLanguage(languageId: Language["id"]) {
  const languageUnits = getSortedUnitsForLanguage(languageId);

  return lessons
    .filter((lesson) => lesson.languageId === languageId)
    .sort((firstLesson, secondLesson) => {
      const firstUnitOrder =
        languageUnits.find((unit) => unit.id === firstLesson.unitId)?.order ?? 0;
      const secondUnitOrder =
        languageUnits.find((unit) => unit.id === secondLesson.unitId)?.order ??
        0;

      return firstUnitOrder - secondUnitOrder || firstLesson.order - secondLesson.order;
    });
}

export function getActiveLessonForLanguage(
  languageId: Language["id"],
  activeLessonIdByLanguageId: ActiveLessonMap,
) {
  const languageLessons = getSortedLessonsForLanguage(languageId);
  const savedActiveLessonId = activeLessonIdByLanguageId[languageId];

  return (
    languageLessons.find((lesson) => lesson.id === savedActiveLessonId) ??
    languageLessons[0]
  );
}
