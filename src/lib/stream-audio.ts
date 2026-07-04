import { getApiUrl } from "@/lib/api";

import type { Language, Lesson } from "../../types/learning";

export type StreamAudioSession = {
  apiKey: string;
  callId: string;
  callType: string;
  languageName: string;
  lessonTitle: string;
  token: string;
  user: {
    id: string;
    image?: string;
    name: string;
  };
};

type CreateStreamAudioSessionParams = {
  clerkSessionToken: string;
  clerkUserId: string;
  language: Language;
  lesson: Lesson;
  userImageUrl?: string;
  userName: string;
};

export async function createStreamAudioSession({
  clerkSessionToken,
  clerkUserId,
  language,
  lesson,
  userImageUrl,
  userName,
}: CreateStreamAudioSessionParams) {
  const response = await fetch(getApiUrl("/api/stream/audio-call"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkSessionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clerkUserId,
      languageId: language.id,
      lessonId: lesson.id,
      userImageUrl,
      userName,
    }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => undefined)) as
      | { message?: string }
      | undefined;

    throw new Error(
      getAudioSessionErrorMessage(error?.message) ??
        "Could not start the audio lesson.",
    );
  }

  return (await response.json()) as StreamAudioSession;
}

function getAudioSessionErrorMessage(message: string | undefined) {
  if (!message) {
    return undefined;
  }

  return message;
}
