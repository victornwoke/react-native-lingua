import { getApiUrl } from "@/lib/api";

import type { Language, Lesson } from "../../types/learning";
import type { StreamAudioCallData } from "../../types/stream";

export type StreamAudioSession = {
  apiKey: string;
  callData: StreamAudioCallData;
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
  callType: string;
  sessionId: string;
  sessionStartedAt?: string;
};

export type AgentControlResult = {
  message?: string;
  missingSession: boolean;
  shouldRestart: boolean;
  success: boolean;
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

type AgentSessionControlParams = {
  callId: string;
  sessionId: string;
  clerkSessionToken: string;
};

type AgentControlRequestOptions = AgentSessionControlParams & {
  fallbackResult: AgentControlResult;
  path: string;
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
      error?.message ?? "Could not start the audio lesson.",
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
  if (!response.ok || !payload || payload?.skipped) {
    return null;
  }

  return {
    ...payload,
    callType,
  } as AgentSession;
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
}: AgentSessionControlParams): Promise<AgentControlResult> {
  return requestAgentControl({
    callId,
    clerkSessionToken,
    fallbackResult: {
      message: "Could not reach the AI teacher control route.",
      missingSession: false,
      shouldRestart: false,
      success: false,
    },
    path: "/api/stream/agent/interrupt",
    sessionId,
  });
}

export async function startAgentActivity({
  callId,
  sessionId,
  clerkSessionToken,
}: AgentSessionControlParams): Promise<AgentControlResult> {
  return requestAgentControl({
    callId,
    clerkSessionToken,
    fallbackResult: {
      message: "Could not reach the AI teacher control route.",
      missingSession: false,
      shouldRestart: false,
      success: false,
    },
    path: "/api/stream/agent/activity-start",
    sessionId,
  });
}

export async function endAgentActivity({
  callId,
  sessionId,
  clerkSessionToken,
}: AgentSessionControlParams): Promise<AgentControlResult> {
  // Non-fatal failure here only affects one activity window; the next press can
  // still start a fresh one.
  return requestAgentControl({
    callId,
    clerkSessionToken,
    fallbackResult: {
      message: "Could not reach the AI teacher control route.",
      missingSession: false,
      shouldRestart: false,
      success: false,
    },
    path: "/api/stream/agent/activity-end",
    sessionId,
  });
}

async function requestAgentControl({
  callId,
  sessionId,
  clerkSessionToken,
  fallbackResult,
  path,
}: AgentControlRequestOptions): Promise<AgentControlResult> {
  try {
    const response = await fetch(getApiUrl(path), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ callId, sessionId }),
    });

    const result = await readAgentControlResult(response);

    if (!result.success) {
      console.warn("AI teacher control request failed.", path, result.message);
    }

    return result;
  } catch (error) {
    console.warn("AI teacher control request failed.", path, error);
    return fallbackResult;
  }
}

async function readAgentControlResult(
  response: Response,
): Promise<AgentControlResult> {
  const payload = (await response.json().catch(() => undefined)) as
    | (Partial<AgentControlResult> & { message?: string })
    | undefined;

  return {
    message: typeof payload?.message === "string" ? payload.message : undefined,
    missingSession: Boolean(payload?.missingSession),
    shouldRestart: Boolean(payload?.shouldRestart),
    success: response.ok && payload?.success !== false,
  };
}
