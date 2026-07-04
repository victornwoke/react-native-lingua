import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';

import { languages } from "../../data/languages";
import type { Language } from "../../types/learning";

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const host = (Constants.expoConfig?.extra?.posthogHost as string) || 'https://eu.i.posthog.com';
const isPostHogConfigured = !!apiKey && apiKey !== 'phc_your_project_token_here';

if (!isPostHogConfigured && __DEV__) {
  console.warn(
    'PostHog project token not configured. Set POSTHOG_PROJECT_TOKEN in your .env file.',
  );
}

export const posthog = new PostHog(apiKey || 'placeholder_key', {
  host,
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  maxBatchSize: 100,
  maxQueueSize: 1000,
  preloadFeatureFlags: true,
  sendFeatureFlagEvent: true,
  featureFlagsRequestTimeoutMs: 10000,
  requestTimeout: 10000,
  fetchRetryCount: 3,
  fetchRetryDelay: 3000,
});

type IdentifyPostHogUserOptions = {
  isSignUp?: boolean;
  selectedLanguageId?: Language["id"] | null;
};

export function getPostHogLanguageCode(languageId: Language["id"] | null | undefined) {
  return languages.find((language) => language.id === languageId)?.code ?? null;
}

export function identifyPostHogUser(
  userId: string,
  { isSignUp = false, selectedLanguageId }: IdentifyPostHogUserOptions = {},
) {
  const properties = {
    $set: {
      preferred_language: getPostHogLanguageCode(selectedLanguageId),
    },
    ...(isSignUp
      ? {
          $set_once: {
            signup_date: new Date().toISOString(),
          },
        }
      : {}),
  };

  posthog.identify(userId, properties);
}
