import { getApiUrl } from "@/lib/api";

import type { Language, Lesson } from "../../types/learning";

export type StreamAudioSession = {
  apiKey: string;
  callData: Record<string, unknown>;
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

export type AgentSession = {
  callId: string;
  sessionId: string;
  sessionStartedAt?: string;
};

type CreateStreamAudioSessionParams = {
  clerkSessionToken: string;
  clerkUserId: string;
  language: Language;
  lesson: Lesson;
  userImageUrl?: string;
  userName: string;
};

type StartAgentSessionParams = {
  callId: string;
  callType: string;
  clerkSessionToken: string;
};

type StopAgentSessionParams = {
  callId: string;
  sessionId: string;
  clerkSessionToken: string;
};

type InterruptAgentSessionParams = {
  callId: string;
  sessionId: string;
  clerkSessionToken: string;
};

type EndAgentActivityParams = {
  callId: string;
  sessionId: string;
  clerkSessionToken: string;
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

export async function startAgentSession({
  callId,
  callType,
  clerkSessionToken,
}: StartAgentSessionParams): Promise<AgentSession | null> {
  let response: Response;

  try {
    response = await fetch(getApiUrl("/api/stream/agent/start"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ callId, callType }),
    });
  } catch {
    // Network-level failure (Expo server unreachable, etc.) — skip silently.
    return null;
  }

  const payload = (await response.json().catch(() => undefined)) as
    | (AgentSession & { skipped?: boolean; message?: string })
    | undefined;

  // Server not configured or unreachable — skip silently.
  if (!response.ok || payload?.skipped) {
    return null;
  }

  return payload as AgentSession;
}

export async function stopAgentSession({
  callId,
  sessionId,
  clerkSessionToken,
}: StopAgentSessionParams): Promise<void> {
  try {
    await fetch(getApiUrl("/api/stream/agent/stop"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ callId, sessionId }),
    });
  } catch {
    // Non-fatal — agent may have already ended or server is down.
  }
}

export async function interruptAgentSession({
  callId,
  sessionId,
  clerkSessionToken,
}: InterruptAgentSessionParams): Promise<void> {
  try {
    await fetch(getApiUrl("/api/stream/agent/interrupt"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ callId, sessionId }),
    });
  } catch {
    // Non-fatal — local push-to-talk still mutes playback and enables the mic.
  }
}

export async function endAgentActivity({
  callId,
  sessionId,
  clerkSessionToken,
}: EndAgentActivityParams): Promise<void> {
  try {
    await fetch(getApiUrl("/api/stream/agent/activity-end"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ callId, sessionId }),
    });
  } catch {
    // Non-fatal — the next press can still start a fresh activity window.
  }
}

function getAudioSessionErrorMessage(message: string | undefined) {
  if (!message) {
    return undefined;
  }

  return message;
}
