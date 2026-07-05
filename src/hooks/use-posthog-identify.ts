import { useAuth } from "@clerk/expo";
import { useEffect, useRef } from "react";

import { clerkAuthOptions } from "@/lib/clerk-auth";
import { identifyPostHogUser } from "@/lib/posthog";
import { useLanguageStore } from "@/store/language-store";

export function usePostHogIdentify() {
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
}
