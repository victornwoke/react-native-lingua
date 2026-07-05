import { languages } from "../../../data/languages";
import { lessons } from "../../../data/lessons";
import type { LessonActivity } from "../../../types/learning";
import type {
  CallCustomData,
  StreamAudioCallData,
} from "../../../types/stream";
import {
  STREAM_CALL_TYPE,
  STREAM_MAX_ID_LENGTH,
  RouteError,
  createStreamToken,
  getRequiredString,
  getVerifiedClerkUserId,
  streamRequest,
  toStreamId,
} from "@/lib/stream-server";

const STREAM_AUDIO_CALL_ID_PREFIX = "audio";
const TOKEN_VALIDITY_SECONDS = 60 * 60;

type AudioCallRequestBody = {
  clerkUserId?: unknown;
  languageId?: unknown;
  lessonId?: unknown;
  userImageUrl?: unknown;
  userName?: unknown;
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        { message: "Sign in before starting an audio lesson." },
        { status: 401 },
      );
    }

    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;
    if (!apiKey || !apiSecret) {
      return Response.json(
        {
          message: "Add STREAM_API_KEY and STREAM_API_SECRET to your .env.",
        },
        { status: 500 },
      );
    }

    const verifiedClerkUserId = await getVerifiedClerkUserId(authorization);
    const body = (await request.json()) as AudioCallRequestBody;
    const lessonId = getRequiredString(body.lessonId);
    const languageId = getRequiredString(body.languageId);
    const requestedClerkUserId = getOptionalString(body.clerkUserId);

    if (!lessonId || !languageId) {
      return Response.json(
        { message: "lessonId and languageId are required." },
        { status: 400 },
      );
    }

    if (requestedClerkUserId && requestedClerkUserId !== verifiedClerkUserId) {
      return Response.json(
        { message: "You can only start lessons for your own account." },
        { status: 403 },
      );
    }

    const lesson = lessons.find((item) => item.id === lessonId);
    const language = languages.find((item) => item.id === languageId);

    if (!lesson || !language || lesson.languageId !== language.id) {
      return Response.json(
        { message: "The selected lesson does not match this language." },
        { status: 400 },
      );
    }

    const streamUserId = toStreamId(verifiedClerkUserId);
    const userName =
      getOptionalString(body.userName) ?? `${language.name} learner`;
    const userImageUrl = getOptionalString(body.userImageUrl);
    const serverToken = await createStreamToken({ server: true }, apiSecret);

    await streamRequest({
      errorMessage: "Could not prepare your Stream audio profile.",
      method: "POST",
      path: "/api/v2/users",
      serverToken,
      body: {
        users: {
          [streamUserId]: {
            id: streamUserId,
            image: userImageUrl,
            name: userName,
            role: "user",
            custom: {
              clerkUserId: verifiedClerkUserId,
              selectedLanguageId: language.id,
            },
          },
        },
      },
    });

    const callId = createStreamAudioCallId();
    const customData: CallCustomData = {
      audioInstructions: lesson.aiTeacherPrompt.audioInstructions,
      activities: lesson.activities.map(formatLessonActivity).join("; "),
      clerkUserId: verifiedClerkUserId,
      conversationStarter: lesson.aiTeacherPrompt.conversationStarter,
      correctionStyle: lesson.aiTeacherPrompt.correctionStyle,
      estimatedMinutes: `${lesson.estimatedMinutes} minutes`,
      goals: lesson.goals.map((g) => g.description).join("; "),
      languageCode: language.code,
      languageId: language.id,
      languageName: language.name,
      languageNativeName: language.nativeName,
      lessonDescription: lesson.description,
      lessonId: lesson.id,
      lessonLevel: lesson.level,
      lessonTitle: lesson.title,
      phrases: lesson.phrases
        .map((p) => `${p.text} (${p.translation})`)
        .join("; "),
      streamUserId,
      teacherPersona: lesson.aiTeacherPrompt.persona,
      teachingObjective: lesson.aiTeacherPrompt.teachingObjective,
      vocabulary: lesson.vocabulary
        .map((v) => `${v.term}: ${v.translation}`)
        .join("; "),
    };
    const callData: StreamAudioCallData = {
      created_by_id: streamUserId,
      members: [{ user_id: streamUserId, role: "admin" }],
      custom: customData,
      settings_override: {
        audio: {
          default_device: "speaker",
          mic_default_on: false,
          speaker_default_on: true,
        },
        transcription: {
          closed_caption_mode: "auto-on",
          language: "auto",
          mode: "auto-on",
          speech_segment_config: {
            max_speech_caption_ms: 1_500,
            silence_duration_ms: 450,
          },
        },
        video: {
          camera_default_on: false,
          enabled: false,
          target_resolution: { height: 240, width: 240 },
        },
      },
    };

    await streamRequest({
      errorMessage: "Could not create the Stream audio lesson call.",
      method: "POST",
      path: `/api/v2/video/call/${STREAM_CALL_TYPE}/${callId}`,
      serverToken,
      body: {
        data: callData,
      },
    });

    const userToken = await createStreamToken(
      {
        exp: Math.floor(Date.now() / 1000) + TOKEN_VALIDITY_SECONDS,
        user_id: streamUserId,
      },
      apiSecret,
    );

    return Response.json({
      apiKey,
      callData,
      callId,
      callType: STREAM_CALL_TYPE,
      languageName: language.name,
      lessonTitle: lesson.title,
      token: userToken,
      user: {
        id: streamUserId,
        image: userImageUrl,
        name: userName,
      },
    });
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.error("Failed to create Stream audio call.", error);

    return Response.json(
      {
        message: "Could not start the Stream audio lesson.",
      },
      { status: 500 },
    );
  }
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function formatLessonActivity(activity: LessonActivity, index: number) {
  const label = `Practice ${index + 1}`;

  if (activity.type === "multiple-choice") {
    return `${label}: ${activity.prompt} Answer: ${activity.correctOption}`;
  }

  if (activity.type === "translation" || activity.type === "phrase-builder") {
    return `${label}: ${activity.prompt} Answer: ${activity.answer}`;
  }

  if (activity.type === "speaking-practice") {
    return `${label}: ${activity.prompt} Expected response: ${activity.expectedResponse}`;
  }

  return `${label}: ${activity.prompt}`;
}

function createStreamAudioCallId() {
  const timestampId = Date.now().toString(36);
  const randomId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const callId = [STREAM_AUDIO_CALL_ID_PREFIX, timestampId, randomId].join("-");

  return callId.slice(0, STREAM_MAX_ID_LENGTH);
}
