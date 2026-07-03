import { useAuth } from "@clerk/expo";
import { type Href, Redirect } from "expo-router";

import { useLanguageStore } from "@/store/language-store";

import { languages } from "../data/languages";

const ONBOARDING_ROUTE = "/onboarding" as Href;
const LANGUAGE_SELECTION_ROUTE = "/language-selection" as Href;
const HOME_ROUTE = "/home" as Href;

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { selectedLanguageId, hasHydrated } = useLanguageStore();
  const selectedLanguage = languages.find(
    (language) => language.id === selectedLanguageId,
  );

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
