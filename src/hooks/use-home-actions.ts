import { type Href, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useCallback } from "react";

import type { TodayPlanItem } from "@/components/home/today-plan-section";
import type { Language, Lesson } from "../../types/learning";

type UseHomeActionsOptions = {
  currentLesson: Lesson | undefined;
  selectedLanguage: Language;
};

export function useHomeActions({
  currentLesson,
  selectedLanguage,
}: UseHomeActionsOptions) {
  const router = useRouter();
  const posthog = usePostHog();

  const handleOpenProfile = useCallback(() => {
    router.push("/profile" as Href);
  }, [router]);

  const handleViewPlan = useCallback(() => {
    posthog.capture("today_plan_view_all_tapped", {
      language_id: selectedLanguage.id,
      language_name: selectedLanguage.name,
    });
    router.push("/learn" as Href);
  }, [posthog, router, selectedLanguage.id, selectedLanguage.name]);

  const handlePlanItemPress = useCallback(
    (item: TodayPlanItem) => {
      posthog.capture("today_plan_item_tapped", {
        item_id: item.id,
        language_id: selectedLanguage.id,
        language_name: selectedLanguage.name,
      });

      if (item.id === "conversation") {
        router.push("/chat" as Href);
        return;
      }

      if (item.id === "new-words" || !currentLesson) {
        router.push("/learn" as Href);
        return;
      }

      router.push(`/lesson/${currentLesson.id}` as Href);
    },
    [
      currentLesson,
      posthog,
      router,
      selectedLanguage.id,
      selectedLanguage.name,
    ],
  );

  return {
    handleOpenProfile,
    handlePlanItemPress,
    handleViewPlan,
  };
}
