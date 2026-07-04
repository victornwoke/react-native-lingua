import { useAuth, useSession, useUser } from "@clerk/expo";
import Constants from "expo-constants";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { clerkAuthOptions } from "@/lib/clerk-auth";
import {
    createStreamAudioSession,
    startAgentSession,
    stopAgentSession,
    type AgentSession,
    type StreamAudioSession,
} from "@/lib/stream-audio";
import { useSelectedLanguage } from "@/store/language-store";
import { languages } from "../../data/languages";
import type { Lesson } from "../../types/learning";

export type StreamAudioCallStatus =
  | "idle"
  | "loading"
  | "connecting"
  | "joined"
  | "ended"
  | "error";

export type AgentConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "failed";

type UseStreamAudioCallResult = {
  agentStatus: AgentConnectionStatus;
  canEndCall: boolean;
  canToggleCamera: boolean;
  canToggleMic: boolean;
  displayName: string;
  errorMessage: string | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isStarting: boolean;
  startCall: () => Promise<void>;
  status: StreamAudioCallStatus;
  statusLabel: string;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  endCall: () => Promise<void>;
};

type StreamCall = {
  camera: {
    disable: () => Promise<unknown>;
    enable: () => Promise<unknown>;
  };
  microphone: {
    disable: () => Promise<unknown>;
    enable: () => Promise<unknown>;
  };
  endCall: () => Promise<unknown>;
  join: () => Promise<unknown>;
  leave: () => Promise<unknown>;
};

type StreamVideoClientLike = {
  call: (callType: string, callId: string) => StreamCall;
  disconnectUser?: () => Promise<unknown>;
};

const isExpoGo = Constants.appOwnership === "expo";

export function useStreamAudioCall(lesson: Lesson | undefined) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth(clerkAuthOptions);
  const { session } = useSession();
  const { user } = useUser();
  const selectedLanguage = useSelectedLanguage();
  const [status, setStatus] = useState<StreamAudioCallStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [agentStatus, setAgentStatus] = useState<AgentConnectionStatus>("idle");
  const callRef = useRef<StreamCall | null>(null);
  const clientRef = useRef<StreamVideoClientLike | null>(null);
  const agentSessionRef = useRef<AgentSession | null>(null);
  const agentTokenRef = useRef<string | null>(null);

  const language = useMemo(() => {
    return (
      selectedLanguage ??
      languages.find((item) => item.id === lesson?.languageId) ??
      languages[0]
    );
  }, [lesson?.languageId, selectedLanguage]);

  const displayName =
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    `${language.name} learner`;

  const startCall = useCallback(async () => {
    if (
      status === "loading" ||
      status === "connecting" ||
      status === "joined"
    ) {
      return;
    }

    if (isExpoGo) {
      setErrorMessage(
        "Stream audio lessons require a development build. Expo Go does not include this native module.",
      );
      setStatus("error");
      return;
    }

    if (!lesson || !isLoaded || !isSignedIn || !userId) {
      setErrorMessage("Sign in before starting this audio lesson.");
      setStatus("error");
      return;
    }

    if (session?.status && !isUsableClerkSessionStatus(session.status)) {
      setErrorMessage(getClerkSessionStatusMessage(session.status));
      setStatus("error");
      return;
    }

    try {
      setErrorMessage(null);
      setIsCameraOn(false);
      setIsMicOn(true);
      setAgentStatus("idle");
      setStatus("loading");

      const clerkSessionToken = await getToken({ skipCache: true });

      if (!clerkSessionToken) {
        throw new Error("Your session expired. Please sign in again.");
      }

      agentTokenRef.current = clerkSessionToken;

      let audioSession: StreamAudioSession;

      try {
        audioSession = await createStreamAudioSession({
          clerkSessionToken,
          clerkUserId: userId,
          language,
          lesson,
          userImageUrl: user?.imageUrl,
          userName: displayName,
        });
      } catch (error) {
        if (!isInactiveClerkSessionError(error)) {
          throw error;
        }

        const refreshedSessionToken = await getToken({ skipCache: true });

        if (!refreshedSessionToken) {
          throw error;
        }

        agentTokenRef.current = refreshedSessionToken;
        audioSession = await createStreamAudioSession({
          clerkSessionToken: refreshedSessionToken,
          clerkUserId: userId,
          language,
          lesson,
          userImageUrl: user?.imageUrl,
          userName: displayName,
        });
      }

      const streamModule =
        (await import("@stream-io/video-react-native-sdk")) as {
          StreamVideoClient: {
            getOrCreateInstance: (params: {
              apiKey: string;
              tokenProvider: () => Promise<string>;
              user: StreamAudioSession["user"];
            }) => StreamVideoClientLike;
          };
        };

      const client = streamModule.StreamVideoClient.getOrCreateInstance({
        apiKey: audioSession.apiKey,
        tokenProvider: async () => audioSession.token,
        user: audioSession.user,
      });
      clientRef.current = client;
      const call = client.call(audioSession.callType, audioSession.callId);

      callRef.current = call;
      setStatus("connecting");

      await call.join();
      let microphoneStarted = false;

      try {
        await call.microphone.enable();
        microphoneStarted = true;
      } catch (error) {
        console.warn("Stream microphone did not start.", error);
      }

      setIsCameraOn(false);
      setIsMicOn(microphoneStarted);
      setStatus("joined");

      // Start agent asynchronously — do not block the call join
      void startAgentForCall(
        audioSession.callId,
        audioSession.callType,
        agentTokenRef.current,
        agentSessionRef,
        setAgentStatus,
      );
    } catch (error) {
      console.warn("Failed to join Stream audio call.", error);
      await cleanupStreamCall(callRef.current, clientRef.current);
      callRef.current = null;
      clientRef.current = null;
      setIsCameraOn(false);
      setIsMicOn(false);
      setErrorMessage(getStreamAudioErrorMessage(error));
      setStatus("error");
    }
  }, [
    displayName,
    getToken,
    isLoaded,
    isSignedIn,
    language,
    lesson,
    session?.status,
    status,
    user,
    userId,
  ]);

  const toggleCamera = useCallback(async () => {
    setErrorMessage(null);
    setIsCameraOn(false);
  }, []);

  const toggleMicrophone = useCallback(async () => {
    const call = callRef.current;

    if (!call || status !== "joined") {
      return;
    }

    try {
      setErrorMessage(null);

      if (isMicOn) {
        await call.microphone.disable();
        setIsMicOn(false);
        return;
      }

      await call.microphone.enable();
      setIsMicOn(true);
    } catch (error) {
      console.error("Failed to toggle Stream microphone.", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not update the microphone.",
      );
      setStatus("error");
    }
  }, [isMicOn, status]);

  const endCall = useCallback(async () => {
    const call = callRef.current;
    const agentSession = agentSessionRef.current;
    const agentToken = agentTokenRef.current;

    // Stop agent session first
    if (agentSession && agentToken) {
      agentSessionRef.current = null;
      agentTokenRef.current = null;
      setAgentStatus("idle");
      await stopAgentSession({
        callId: agentSession.callId,
        sessionId: agentSession.sessionId,
        clerkSessionToken: agentToken,
      }).catch(() => undefined);
    }

    if (!call) {
      setStatus("ended");
      return;
    }

    try {
      setErrorMessage(null);
      await call.endCall();
    } catch (error) {
      console.error("Failed to end Stream call, leaving instead.", error);
      await call.leave().catch(() => undefined);
    } finally {
      callRef.current = null;
      const client = clientRef.current;
      clientRef.current = null;

      if (client?.disconnectUser) {
        await client.disconnectUser().catch(() => undefined);
      }

      setIsCameraOn(false);
      setIsMicOn(false);
      setStatus("ended");
    }
  }, []);

  useEffect(() => {
    return () => {
      const activeCall = callRef.current;
      const activeClient = clientRef.current;
      const activeAgentSession = agentSessionRef.current;
      const activeAgentToken = agentTokenRef.current;
      callRef.current = null;
      clientRef.current = null;
      agentSessionRef.current = null;
      agentTokenRef.current = null;

      if (activeAgentSession && activeAgentToken) {
        void stopAgentSession({
          callId: activeAgentSession.callId,
          sessionId: activeAgentSession.sessionId,
          clerkSessionToken: activeAgentToken,
        }).catch(() => undefined);
      }

      if (activeCall) {
        void activeCall.leave().catch(() => undefined);
      }

      if (activeClient?.disconnectUser) {
        void activeClient.disconnectUser().catch(() => undefined);
      }
    };
  }, []);

  const canUseCall = status === "joined";
  const statusLabel = getStatusLabel(status, errorMessage);

  return {
    agentStatus,
    canEndCall:
      status === "joined" ||
      status === "connecting" ||
      status === "loading" ||
      status === "error",
    canToggleCamera: false,
    canToggleMic: canUseCall,
    displayName,
    errorMessage,
    isCameraOn,
    isMicOn,
    isStarting: status === "loading" || status === "connecting",
    startCall,
    status,
    statusLabel,
    toggleCamera,
    toggleMicrophone,
    endCall,
  } satisfies UseStreamAudioCallResult;
}

function getStatusLabel(
  status: StreamAudioCallStatus,
  errorMessage: string | null,
) {
  if (status === "error") {
    return errorMessage ?? "Connection failed";
  }

  if (status === "loading") {
    return "Connecting...";
  }

  if (status === "connecting") {
    return "Connecting...";
  }

  if (status === "joined") {
    return "Online";
  }

  if (status === "ended") {
    return "Ended";
  }

  return "Ready to start";
}

async function cleanupStreamCall(
  call: StreamCall | null,
  client: StreamVideoClientLike | null,
) {
  if (call) {
    await call.leave().catch(() => undefined);
  }

  if (client?.disconnectUser) {
    await client.disconnectUser().catch(() => undefined);
  }
}

function isInactiveClerkSessionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /session is not active/i.test(error.message);
}

function isUsableClerkSessionStatus(status: string) {
  return status === "active" || status === "pending";
}

function getClerkSessionStatusMessage(status: string) {
  if (status === "expired") {
    return "Your session expired. Please sign in again.";
  }

  return "Sign in again before starting this audio lesson.";
}

function getStreamAudioErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Could not join the audio lesson.";
  }

  return error.message;
}

async function startAgentForCall(
  callId: string,
  callType: string,
  clerkSessionToken: string,
  agentSessionRef: React.MutableRefObject<AgentSession | null>,
  setAgentStatus: (status: AgentConnectionStatus) => void,
) {
  setAgentStatus("connecting");

  try {
    const agentSession = await startAgentSession({
      callId,
      callType,
      clerkSessionToken,
    });

    if (!agentSession) {
      // Server not configured or unreachable — degrade silently.
      setAgentStatus("idle");
      return;
    }

    agentSessionRef.current = agentSession;
    setAgentStatus("connected");
  } catch {
    setAgentStatus("failed");
  }
}
