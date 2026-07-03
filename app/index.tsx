import { useAuth } from "@clerk/expo";
import { type Href, Redirect } from "expo-router";

import { useLanguageStore, useSelectedLanguage } from "@/store/language-store";

const ONBOARDING_ROUTE = "/onboarding" as Href;
const LANGUAGE_SELECTION_ROUTE = "/language-selection" as Href;
const HOME_ROUTE = "/home" as Href;

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const hasHydrated = useLanguageStore((state) => state.hasHydrated);
  const selectedLanguage = useSelectedLanguage();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href={ONBOARDING_ROUTE} />;
  }

  if (!hasHydrated) {
    return null;
  }

  if (!selectedLanguage) {
    return <Redirect href={LANGUAGE_SELECTION_ROUTE} />;
  }

  return <Redirect href={HOME_ROUTE} />;
}
