import { useAuth, useSession, useUser } from "@clerk/expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { Platform } from "react-native";

import { clerkAuthOptions } from "@/lib/clerk-auth";
import {
  createStreamAudioSession,
  endAgentActivity,
  startAgentActivity,
  startAgentSession,
  stopAgentSession,
  type AgentControlResult,
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

export type LiveCaption = {
  id: string;
  speakerName: string;
  speakerRole: "teacher" | "learner";
  startTime: string;
  text: string;
};

type UseStreamAudioCallResult = {
  agentStatus: AgentConnectionStatus;
  canEndCall: boolean;
  canToggleCamera: boolean;
  canToggleMic: boolean;
  captionStatus: "idle" | "starting" | "live" | "unavailable";
  displayName: string;
  errorMessage: string | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isStarting: boolean;
  liveCaptions: LiveCaption[];
  startCall: () => Promise<void>;
  status: StreamAudioCallStatus;
  statusLabel: string;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  toggleTalking: () => Promise<void>;
  endCall: () => Promise<void>;
};

type StreamCall = {
  camera: {
    disable: () => Promise<unknown>;
    enable: () => Promise<unknown>;
  };
  state: {
    captioning?: boolean;
    closedCaptions$: StreamObservable<StreamClosedCaption[]>;
  };
  microphone: {
    disable: () => Promise<unknown>;
    enable: () => Promise<unknown>;
  };
  endCall: () => Promise<unknown>;
  join: (data?: {
    create?: boolean;
    data?: Record<string, unknown>;
  }) => Promise<unknown>;
  leave: () => Promise<unknown>;
  on: (
    eventName: "custom",
    callback: (event: StreamCustomEvent) => void,
  ) => () => void;
  startClosedCaptions: (
    options?: StreamClosedCaptionsOptions,
  ) => Promise<unknown>;
  stopClosedCaptions: (options?: {
    stop_transcription?: boolean;
  }) => Promise<unknown>;
  updateClosedCaptionSettings: (config: {
    maxVisibleCaptions?: number;
    visibilityDurationMs?: number;
  }) => void;
};

type StreamVideoClientLike = {
  call: (callType: string, callId: string) => StreamCall;
  disconnectUser?: () => Promise<unknown>;
};

type StreamObservable<T> = {
  subscribe: (next: (value: T) => void) => StreamSubscription;
};

type StreamSubscription = {
  unsubscribe: () => void;
};

type StreamClosedCaption = {
  id: string;
  speaker_id: string;
  start_time: string;
  text: string;
  user?: {
    id: string;
    name?: string;
  };
};

type StreamCustomEvent = {
  created_at?: string;
  custom?: unknown;
};

type LiveSpeechCustomPayload = {
  completed?: boolean;
  kind?: string;
  messageId?: string;
  speakerName?: string;
  speakerRole?: "teacher" | "learner";
  text?: string;
};

type NormalizedLiveSpeechPayload = {
  messageId: string;
  speakerName?: string;
  speakerRole: "teacher" | "learner";
  text: string;
};

type StreamClosedCaptionsOptions = {
  enable_transcription?: boolean;
  language?: "auto";
  speech_segment_config?: {
    max_speech_caption_ms?: number;
    silence_duration_ms?: number;
  };
};

type StreamCallManagerLike = {
  speaker: {
    setForceSpeakerphoneOn: (force: boolean) => void;
    setMute: (mute: boolean) => void;
  };
  start: (
    config?:
      | {
          audioRole: "communicator";
          deviceEndpointType?: "speaker" | "earpiece";
        }
      | {
          audioRole: "listener";
          enableStereoAudioOutput?: boolean;
        },
  ) => void;
  stop: () => void;
};

const isExpoGo = Constants.appOwnership === "expo";
const isIosSimulator = Platform.OS === "ios" && !Device.isDevice;
const AGENT_USER_ID = "lingua-ai-teacher";
const LIVE_SPEECH_EVENT_KIND = "lingua.live_speech";
const MAX_LIVE_CAPTIONS = 8;
const MAX_LEARNER_TURN_MS = 12_000;
const MIC_ENABLE_TIMEOUT_MS = 3_000;
const MIC_DISABLE_TIMEOUT_MS = 1_500;

export function useStreamAudioCall(lesson: Lesson | undefined) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth(clerkAuthOptions);
  const { session } = useSession();
  const { user } = useUser();
  const selectedLanguage = useSelectedLanguage();
  const [isMicOn, setIsMicOn] = useState(false);
  const [isTalkControlBusy, setIsTalkControlBusy] = useState(false);
  const [status, setStatus] = useState<StreamAudioCallStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const [agentStatus, setAgentStatus] = useState<AgentConnectionStatus>("idle");
  const [captionStatus, setCaptionStatus] =
    useState<UseStreamAudioCallResult["captionStatus"]>("idle");
  const [liveCaptions, setLiveCaptions] = useState<LiveCaption[]>([]);
  const callRef = useRef<StreamCall | null>(null);
  const clientRef = useRef<StreamVideoClientLike | null>(null);
  const callManagerRef = useRef<StreamCallManagerLike | null>(null);
  const wantsToTalkRef = useRef(false);
  const agentSessionRef = useRef<AgentSession | null>(null);
  const agentTokenRef = useRef<string | null>(null);
  const captionsSubscriptionRef = useRef<StreamSubscription | null>(null);
  const liveSpeechSubscriptionRef = useRef<(() => void) | null>(null);
  const stopTalkingRef = useRef<() => Promise<void>>(async () => undefined);
  const talkTurnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentControlQueueRef = useRef<Promise<void>>(Promise.resolve());

  const language = useMemo(() => {
    const lessonLanguage = languages.find(
      (item) => item.id === lesson?.languageId,
    );

    return lessonLanguage ?? selectedLanguage ?? languages[0];
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
      setIsMicOn(false);
      setIsTalkControlBusy(false);
      setAgentStatus("idle");
      setCaptionStatus("idle");
      setLiveCaptions([]);
      agentControlQueueRef.current = Promise.resolve();
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
          callManager: StreamCallManagerLike;
        };

      callManagerRef.current = streamModule.callManager;
      const client = streamModule.StreamVideoClient.getOrCreateInstance({
        apiKey: audioSession.apiKey,
        tokenProvider: async () => audioSession.token,
        user: audioSession.user,
      });
      clientRef.current = client;
      const call = client.call(audioSession.callType, audioSession.callId);

      callRef.current = call;
      wantsToTalkRef.current = false;
      setStatus("connecting");

      // Prime audio routing first. iOS Simulator can drop the first output cycle
      // if routing is configured too late.
      startSpeakerAudio(streamModule.callManager, {
        playbackOnly: isIosSimulator,
      });

      await call.join({ create: true, data: audioSession.callData });

      await call.microphone.disable().catch(() => undefined);
      setCaptionStatus(call.state.captioning ? "live" : "starting");
      captionsSubscriptionRef.current = subscribeToLiveCaptions(
        call,
        audioSession.user.id,
        setLiveCaptions,
      );
      liveSpeechSubscriptionRef.current = subscribeToLiveSpeechEvents(
        call,
        setLiveCaptions,
      );
      void startLiveCaptions(call, setCaptionStatus);

      startSpeakerAudio(streamModule.callManager, {
        playbackOnly: isIosSimulator,
      });

      if (isIosSimulator) {
        setTimeout(() => {
          startSpeakerAudio(streamModule.callManager, { playbackOnly: true });
        }, 350);

        setTimeout(() => {
          startSpeakerAudio(streamModule.callManager, { playbackOnly: true });
        }, 1200);
      }

      if (isIosSimulator) {
        console.info(
          "Skipping Stream microphone auto-start on iOS Simulator to keep speaker playback stable.",
        );
      }

      setIsCameraOn(false);
      setIsMicOn(false);
      setIsTalkControlBusy(false);
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
      callManagerRef.current = null;
      wantsToTalkRef.current = false;
      clearTalkTurnTimeout(talkTurnTimeoutRef);
      agentControlQueueRef.current = Promise.resolve();
      captionsSubscriptionRef.current?.unsubscribe();
      captionsSubscriptionRef.current = null;
      liveSpeechSubscriptionRef.current?.();
      liveSpeechSubscriptionRef.current = null;
      setIsCameraOn(false);
      setIsMicOn(false);
      setIsTalkControlBusy(false);
      setCaptionStatus("unavailable");
      setLiveCaptions([]);
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
    if (isIosSimulator) {
      return;
    }

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
    }
  }, [isMicOn, status]);

  const startTalking = useCallback(async () => {
    if (isIosSimulator) {
      return;
    }

    const call = callRef.current;

    if (!call || status !== "joined") {
      return;
    }

    if (!agentSessionRef.current || !agentTokenRef.current) {
      setErrorMessage("The AI teacher is still connecting. Try again in a moment.");
      setAgentStatus((currentStatus) =>
        currentStatus === "failed" ? "failed" : "connecting",
      );
      return;
    }

    wantsToTalkRef.current = true;
    setIsTalkControlBusy(true);

    try {
      setErrorMessage(null);
      muteSpeakerOutput(callManagerRef.current, true);
      await queueAgentControl(agentControlQueueRef, () =>
        startAgentActivityIfActive({
          agentSessionRef,
          clerkSessionToken: agentTokenRef.current,
          setAgentStatus,
        }),
      );
      await withTimeout(
        call.microphone.enable(),
        MIC_ENABLE_TIMEOUT_MS,
        "Could not start the microphone in time.",
      );
      setIsMicOn(true);

      if (!wantsToTalkRef.current) {
        await withTimeout(
          call.microphone.disable(),
          MIC_DISABLE_TIMEOUT_MS,
          "Could not stop the microphone in time.",
        ).catch(() => undefined);
        await queueAgentControl(agentControlQueueRef, () =>
          endAgentActivityIfActive({
            agentSessionRef,
            clerkSessionToken: agentTokenRef.current,
            setAgentStatus,
          }),
        );
        muteSpeakerOutput(callManagerRef.current, false);
        setIsMicOn(false);
        setIsTalkControlBusy(false);
        return;
      }

      setIsMicOn(true);
      scheduleTalkTurnTimeout(talkTurnTimeoutRef, () => {
        void stopTalkingRef.current();
      });
    } catch (error) {
      clearTalkTurnTimeout(talkTurnTimeoutRef);
      wantsToTalkRef.current = false;
      await withTimeout(
        call.microphone.disable(),
        MIC_DISABLE_TIMEOUT_MS,
        "Could not stop the microphone in time.",
      ).catch(() => undefined);
      await queueAgentControl(agentControlQueueRef, () =>
        endAgentActivityIfActive({
          agentSessionRef,
          clerkSessionToken: agentTokenRef.current,
          setAgentStatus,
        }),
      );
      muteSpeakerOutput(callManagerRef.current, false);
      setIsMicOn(false);
      console.error("Failed to start Stream microphone.", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not start the microphone.",
      );
    } finally {
      setIsTalkControlBusy(false);
    }
  }, [status]);

  const stopTalking = useCallback(async () => {
    setIsTalkControlBusy(true);
    clearTalkTurnTimeout(talkTurnTimeoutRef);
    wantsToTalkRef.current = false;
    const call = callRef.current;

    if (!call) {
      await queueAgentControl(agentControlQueueRef, () =>
        endAgentActivityIfActive({
          agentSessionRef,
          clerkSessionToken: agentTokenRef.current,
          setAgentStatus,
        }),
      );
      muteSpeakerOutput(callManagerRef.current, false);
      setIsMicOn(false);
      setIsTalkControlBusy(false);
      return;
    }

    try {
      await withTimeout(
        call.microphone.disable(),
        MIC_DISABLE_TIMEOUT_MS,
        "Could not stop the microphone in time.",
      );
    } catch (error) {
      console.error("Failed to stop Stream microphone.", error);
    } finally {
      await queueAgentControl(agentControlQueueRef, () =>
        endAgentActivityIfActive({
          agentSessionRef,
          clerkSessionToken: agentTokenRef.current,
          setAgentStatus,
        }),
      );
      muteSpeakerOutput(callManagerRef.current, false);
      setIsMicOn(false);
      setIsTalkControlBusy(false);
    }
  }, []);

  useEffect(() => {
    stopTalkingRef.current = stopTalking;
  }, [stopTalking]);

  const toggleTalking = useCallback(async () => {
    if (isMicOn) {
      await stopTalking();
      return;
    }

    await startTalking();
  }, [isMicOn, startTalking, stopTalking]);

  const endCall = useCallback(async () => {
    const call = callRef.current;
    const agentSession = agentSessionRef.current;
    const agentToken = agentTokenRef.current;
    const captionsSubscription = captionsSubscriptionRef.current;
    const liveSpeechSubscription = liveSpeechSubscriptionRef.current;
    captionsSubscriptionRef.current = null;
    captionsSubscription?.unsubscribe();
    liveSpeechSubscriptionRef.current = null;
    liveSpeechSubscription?.();

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
      setIsTalkControlBusy(false);
      setStatus("ended");
      return;
    }

    try {
      setErrorMessage(null);
      await call
        .stopClosedCaptions({ stop_transcription: false })
        .catch(() => undefined);
      await call.leave();
    } catch (error) {
      console.error("Failed to leave Stream call.", error);
      await call.leave().catch(() => undefined);
    } finally {
      callRef.current = null;
      const client = clientRef.current;
      clientRef.current = null;
      callManagerRef.current = null;
      wantsToTalkRef.current = false;
      clearTalkTurnTimeout(talkTurnTimeoutRef);
      agentControlQueueRef.current = Promise.resolve();

      if (client?.disconnectUser) {
        await client.disconnectUser().catch(() => undefined);
      }

      await stopSpeakerAudio();

      setIsCameraOn(false);
      setIsMicOn(false);
      setIsTalkControlBusy(false);
      setCaptionStatus("idle");
      setLiveCaptions([]);
      setStatus("ended");
    }
  }, []);

  useEffect(() => {
    return () => {
      const activeCall = callRef.current;
      const activeClient = clientRef.current;
      const activeAgentSession = agentSessionRef.current;
      const activeAgentToken = agentTokenRef.current;
      const activeCaptionsSubscription = captionsSubscriptionRef.current;
      const activeLiveSpeechSubscription = liveSpeechSubscriptionRef.current;
      callRef.current = null;
      clientRef.current = null;
      callManagerRef.current = null;
      wantsToTalkRef.current = false;
      clearTalkTurnTimeout(talkTurnTimeoutRef);
      agentControlQueueRef.current = Promise.resolve();
      agentSessionRef.current = null;
      agentTokenRef.current = null;
      captionsSubscriptionRef.current = null;
      liveSpeechSubscriptionRef.current = null;
      activeCaptionsSubscription?.unsubscribe();
      activeLiveSpeechSubscription?.();

      if (activeAgentSession && activeAgentToken) {
        void stopAgentSession({
          callId: activeAgentSession.callId,
          sessionId: activeAgentSession.sessionId,
          clerkSessionToken: activeAgentToken,
        }).catch(() => undefined);
      }

      if (activeCall) {
        void activeCall
          .stopClosedCaptions({ stop_transcription: false })
          .catch(() => undefined);
        void activeCall.leave().catch(() => undefined);
      }

      if (activeClient?.disconnectUser) {
        void activeClient.disconnectUser().catch(() => undefined);
      }

      void stopSpeakerAudio();
    };
  }, []);

  const canUseCall = status === "joined";
  const canTalkToAgent =
    canUseCall && agentStatus === "connected";
  const statusLabel = isMicOn
    ? "Listening..."
    : getStatusLabel(status, errorMessage);

  return {
    agentStatus,
    canEndCall:
      status === "joined" ||
      status === "connecting" ||
      status === "loading" ||
      status === "error",
    canToggleCamera: false,
    canToggleMic: canTalkToAgent && !isIosSimulator && !isTalkControlBusy,
    captionStatus,
    displayName,
    errorMessage,
    isCameraOn,
    isMicOn,
    isStarting: status === "loading" || status === "connecting",
    liveCaptions,
    startCall,
    status,
    statusLabel,
    toggleCamera,
    toggleMicrophone,
    toggleTalking,
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

  if (errorMessage) {
    return errorMessage;
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

  await stopSpeakerAudio();
}

async function startLiveCaptions(
  call: StreamCall,
  setCaptionStatus: (status: UseStreamAudioCallResult["captionStatus"]) => void,
) {
  try {
    setCaptionStatus("starting");
    call.updateClosedCaptionSettings({
      maxVisibleCaptions: 4,
      visibilityDurationMs: 7_000,
    });
    await call.startClosedCaptions({
      language: "auto",
      speech_segment_config: {
        max_speech_caption_ms: 1_500,
        silence_duration_ms: 450,
      },
    });
    setCaptionStatus("live");
  } catch (error) {
    console.info(
      "Stream live captions were not started from the client; waiting for auto-on captions.",
      error instanceof Error ? error.message : error,
    );
    setCaptionStatus("live");
  }
}

function subscribeToLiveCaptions(
  call: StreamCall,
  learnerUserId: string,
  setLiveCaptions: (
    updater: (captions: LiveCaption[]) => LiveCaption[],
  ) => void,
) {
  return call.state.closedCaptions$.subscribe((captions) => {
    if (captions.length === 0) {
      return;
    }

    const normalizedCaptions = captions
      .filter((caption) => caption.text.trim().length > 0)
      .map((caption) => toLiveCaption(caption, learnerUserId));

    if (normalizedCaptions.length === 0) {
      return;
    }

    setLiveCaptions((currentCaptions) =>
      mergeLiveCaptions(currentCaptions, normalizedCaptions),
    );
  });
}

function subscribeToLiveSpeechEvents(
  call: StreamCall,
  setLiveCaptions: (
    updater: (captions: LiveCaption[]) => LiveCaption[],
  ) => void,
) {
  return call.on("custom", (event) => {
    const payload = getLiveSpeechPayload(event.custom ?? event);

    if (!payload) {
      return;
    }

    setLiveCaptions((currentCaptions) =>
      mergeLiveCaptions(currentCaptions, [
        {
          id: `agent-live-${payload.messageId}`,
          speakerName:
            payload.speakerName ??
            (payload.speakerRole === "learner" ? "You" : "AI Teacher"),
          speakerRole: payload.speakerRole,
          startTime: event.created_at ?? "",
          text: payload.text,
        },
      ]),
    );
  });
}

function getLiveSpeechPayload(
  value: unknown,
): NormalizedLiveSpeechPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as LiveSpeechCustomPayload;

  if (
    payload.kind !== LIVE_SPEECH_EVENT_KIND ||
    !payload.messageId ||
    !payload.speakerRole ||
    typeof payload.text !== "string"
  ) {
    return null;
  }

  const text = payload.text.trim();

  if (!text) {
    return null;
  }

  return {
    messageId: payload.messageId,
    speakerName: payload.speakerName,
    speakerRole: payload.speakerRole,
    text,
  };
}

function toLiveCaption(
  caption: StreamClosedCaption,
  learnerUserId: string,
): LiveCaption {
  const isLearner =
    caption.speaker_id === learnerUserId || caption.user?.id === learnerUserId;
  const speakerRole =
    isLearner && caption.speaker_id !== AGENT_USER_ID ? "learner" : "teacher";

  return {
    id: caption.id || `${caption.speaker_id}-${caption.start_time}`,
    speakerName:
      speakerRole === "learner"
        ? "You"
        : caption.user?.name?.trim() || "AI Teacher",
    speakerRole,
    startTime: caption.start_time,
    text: caption.text.trim(),
  };
}

function mergeLiveCaptions(
  currentCaptions: LiveCaption[],
  nextCaptions: LiveCaption[],
) {
  const captionMap = new Map<string, LiveCaption>();

  [...currentCaptions, ...nextCaptions].forEach((caption) => {
    captionMap.set(caption.id, caption);
  });

  return Array.from(captionMap.values()).slice(-MAX_LIVE_CAPTIONS);
}

function startSpeakerAudio(
  callManager: StreamCallManagerLike,
  options?: { playbackOnly?: boolean },
) {
  try {
    if (options?.playbackOnly) {
      callManager.start({
        audioRole: "listener",
        enableStereoAudioOutput: true,
      });
      callManager.speaker.setMute(false);
      callManager.speaker.setForceSpeakerphoneOn(true);
      return;
    }

    callManager.start({
      audioRole: "communicator",
      deviceEndpointType: "speaker",
    });
    callManager.speaker.setMute(false);
    callManager.speaker.setForceSpeakerphoneOn(true);
  } catch (error) {
    console.warn("Could not start Stream speaker audio.", error);
  }
}

function muteSpeakerOutput(
  callManager: StreamCallManagerLike | null,
  muted: boolean,
) {
  try {
    callManager?.speaker.setMute(muted);
  } catch (error) {
    console.warn("Could not update Stream speaker mute state.", error);
  }
}

async function queueAgentControl(
  queueRef: MutableRefObject<Promise<void>>,
  task: () => Promise<void>,
) {
  const queuedTask = queueRef.current
    .catch(() => undefined)
    .then(task)
    .catch(() => undefined);

  queueRef.current = queuedTask;
  await queuedTask;
}

function clearTalkTurnTimeout(
  timeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
) {
  if (!timeoutRef.current) {
    return;
  }

  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}

function scheduleTalkTurnTimeout(
  timeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onTimeout: () => void,
) {
  clearTalkTurnTimeout(timeoutRef);
  timeoutRef.current = setTimeout(onTimeout, MAX_LEARNER_TURN_MS);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function startAgentActivityIfActive({
  agentSessionRef,
  clerkSessionToken,
  setAgentStatus,
}: {
  agentSessionRef: MutableRefObject<AgentSession | null>;
  clerkSessionToken: string | null;
  setAgentStatus: (status: AgentConnectionStatus) => void;
}) {
  const agentSession = agentSessionRef.current;

  if (!agentSession || !clerkSessionToken) {
    return;
  }

  const result = await startAgentActivity({
    callId: agentSession.callId,
    sessionId: agentSession.sessionId,
    clerkSessionToken,
  });

  await restartAgentIfSessionMissing({
    agentSessionRef,
    clerkSessionToken,
    result,
    setAgentStatus,
  });
}

async function endAgentActivityIfActive({
  agentSessionRef,
  clerkSessionToken,
  setAgentStatus,
}: {
  agentSessionRef: MutableRefObject<AgentSession | null>;
  clerkSessionToken: string | null;
  setAgentStatus: (status: AgentConnectionStatus) => void;
}) {
  const agentSession = agentSessionRef.current;

  if (!agentSession || !clerkSessionToken) {
    return;
  }

  const result = await endAgentActivity({
    callId: agentSession.callId,
    sessionId: agentSession.sessionId,
    clerkSessionToken,
  });

  await restartAgentIfSessionMissing({
    agentSessionRef,
    clerkSessionToken,
    result,
    setAgentStatus,
  });
}

async function restartAgentIfSessionMissing({
  agentSessionRef,
  clerkSessionToken,
  result,
  setAgentStatus,
}: {
  agentSessionRef: MutableRefObject<AgentSession | null>;
  clerkSessionToken: string;
  result: AgentControlResult;
  setAgentStatus: (status: AgentConnectionStatus) => void;
}) {
  if (!result.missingSession && !result.shouldRestart) {
    return;
  }

  console.info("Restarting Vision Agent session after stale control response.");

  await restartCurrentAgentSession({
    agentSessionRef,
    clerkSessionToken,
    setAgentStatus,
  });
}

async function restartCurrentAgentSession({
  agentSessionRef,
  clerkSessionToken,
  setAgentStatus,
}: {
  agentSessionRef: MutableRefObject<AgentSession | null>;
  clerkSessionToken: string;
  setAgentStatus: (status: AgentConnectionStatus) => void;
}) {
  const agentSession = agentSessionRef.current;

  if (!agentSession) {
    return;
  }

  agentSessionRef.current = null;
  await stopAgentSession({
    callId: agentSession.callId,
    clerkSessionToken,
    sessionId: agentSession.sessionId,
  }).catch(() => undefined);

  await startAgentForCall(
    agentSession.callId,
    agentSession.callType,
    clerkSessionToken,
    agentSessionRef,
    setAgentStatus,
  );
}

async function stopSpeakerAudio() {
  try {
    const streamModule =
      (await import("@stream-io/video-react-native-sdk")) as {
        callManager: StreamCallManagerLike;
      };

    streamModule.callManager.speaker.setForceSpeakerphoneOn(false);
    streamModule.callManager.stop();
  } catch {
    // The native module may not be loaded during a failed setup path.
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
  agentSessionRef: MutableRefObject<AgentSession | null>,
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
      // Vision Agent server is optional, so keep the audio lesson usable if it is not running.
      setAgentStatus("idle");
      return;
    }

    agentSessionRef.current = agentSession;
    setAgentStatus("connected");
  } catch {
    setAgentStatus("failed");
  }
}
