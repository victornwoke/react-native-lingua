import "../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack, useGlobalSearchParams, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PostHogProvider } from "posthog-react-native";

import { colors, useAppFonts } from "@/theme";
import { clerkAuthOptions } from "@/lib/clerk-auth";
import { identifyPostHogUser, posthog } from "@/lib/posthog";
import { useLanguageStore } from "@/store/language-store";

void SplashScreen.preventAutoHideAsync();

function getPublishableKey() {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file.");
  }

  return key;
}

const publishableKey = getPublishableKey();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (fontError) {
    throw fontError;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <PostHogProvider
          client={posthog}
          autocapture={{
            captureScreens: false,
            captureTouches: true,
            propsToCapture: ["testID"],
            maxElementsCaptured: 20,
          }}
        >
          <PostHogUserIdentifier />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.neutral.background },
              headerShown: false,
            }}
          />
        </PostHogProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

function PostHogUserIdentifier() {
  const { isLoaded, isSignedIn, userId } = useAuth(clerkAuthOptions);
  const selectedLanguageId = useLanguageStore(
    (state) => state.selectedLanguageId,
  );
  const hasHydrated = useLanguageStore((state) => state.hasHydrated);
  const previousIdentifyKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !hasHydrated) {
      return;
    }

    if (!isSignedIn || !userId) {
      previousIdentifyKey.current = null;
      return;
    }

    const identifyKey = `${userId}:${selectedLanguageId ?? "none"}`;

    if (previousIdentifyKey.current === identifyKey) {
      return;
    }

    identifyPostHogUser(userId, { selectedLanguageId });
    previousIdentifyKey.current = identifyKey;
  }, [hasHydrated, isLoaded, isSignedIn, selectedLanguageId, userId]);

  return null;
}
