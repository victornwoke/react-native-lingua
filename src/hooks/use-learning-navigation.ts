import { type Href, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useCallback } from "react";

import type { Language, Lesson } from "../../types/learning";

const CHANGE_LANGUAGE_ROUTE = "/language-selection" as Href;
const LEARN_ROUTE = "/learn" as Href;

type UseLearningNavigationOptions = {
  changeLanguageEventName: string;
  continueLearningEventName: string;
  currentLesson: Lesson | undefined;
  selectedLanguage: Language;
};

export function useLearningNavigation({
  changeLanguageEventName,
  continueLearningEventName,
  currentLesson,
  selectedLanguage,
}: UseLearningNavigationOptions) {
  const router = useRouter();
  const posthog = usePostHog();

  const handleChangeLanguage = useCallback(() => {
    posthog.capture(changeLanguageEventName, {
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
    });
    router.push(CHANGE_LANGUAGE_ROUTE);
  }, [
    changeLanguageEventName,
    posthog,
    router,
    selectedLanguage.id,
    selectedLanguage.name,
  ]);

  const handleContinueLearning = useCallback(() => {
    posthog.capture(continueLearningEventName, {
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
      lesson_id: currentLesson?.id ?? null,
      lesson_title: currentLesson?.title ?? null,
    });

    router.push(
      currentLesson ? (`/lesson/${currentLesson.id}` as Href) : LEARN_ROUTE,
    );
  }, [
    continueLearningEventName,
    currentLesson,
    posthog,
    router,
    selectedLanguage.id,
    selectedLanguage.name,
  ]);

  return {
    handleChangeLanguage,
    handleContinueLearning,
  };
}
