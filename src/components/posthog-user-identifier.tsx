import { usePostHogIdentify } from "@/hooks/use-posthog-identify";

export function PostHogUserIdentifier() {
  usePostHogIdentify();
  return null;
}
