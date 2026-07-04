import { languages } from "../../../data/languages";
import { lessons } from "../../../data/lessons";
import { RouteError, getVerifiedClerkUserId } from "./_server";

const STREAM_API_BASE_URL = "https://video.stream-io-api.com";
const STREAM_AUDIO_CALL_ID_PREFIX = "audio";
const STREAM_MAX_ID_LENGTH = 64;
const STREAM_CALL_TYPE = "default";
const TOKEN_VALIDITY_SECONDS = 60 * 60;

type AudioCallRequestBody = {
  clerkUserId?: unknown;
  languageId?: unknown;
  lessonId?: unknown;
  userImageUrl?: unknown;
  userName?: unknown;
};

type StreamRequestOptions = {
  body: Record<string, unknown>;
  method: "POST";
  path: string;
  serverToken: string;
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
    const callData = {
      created_by_id: streamUserId,
      members: [{ user_id: streamUserId, role: "admin" }],
      custom: {
        audioInstructions: lesson.aiTeacherPrompt.audioInstructions,
        clerkUserId: verifiedClerkUserId,
        conversationStarter: lesson.aiTeacherPrompt.conversationStarter,
        correctionStyle: lesson.aiTeacherPrompt.correctionStyle,
        goals: lesson.goals.map((g) => g.description).join("; "),
        languageCode: language.code,
        languageId: language.id,
        languageName: language.name,
        lessonDescription: lesson.description,
        lessonId: lesson.id,
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
      },
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
      video: false,
    };

    await streamRequest({
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

    if (error instanceof StreamApiError) {
      return Response.json(
        {
          message: error.message,
        },
        { status: 502 },
      );
    }

    return Response.json(
      {
        message: "Could not start the Stream audio lesson.",
      },
      { status: 500 },
    );
  }
}

class StreamApiError extends Error {}

function getRequiredString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function toStreamId(value: string) {
  const sanitizedValue = value.replace(/[^A-Za-z0-9@_-]/g, "_");

  if (sanitizedValue.length <= STREAM_MAX_ID_LENGTH) {
    return sanitizedValue;
  }

  const hashSuffix = createStableHash(sanitizedValue);
  const prefixLength = STREAM_MAX_ID_LENGTH - hashSuffix.length - 1;

  return `${sanitizedValue.slice(0, prefixLength)}_${hashSuffix}`;
}

function createStreamAudioCallId() {
  const timestampId = Date.now().toString(36);
  const randomId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const callId = [STREAM_AUDIO_CALL_ID_PREFIX, timestampId, randomId].join("-");

  return callId.slice(0, STREAM_MAX_ID_LENGTH);
}

function createStableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

async function streamRequest({
  body,
  method,
  path,
  serverToken,
}: StreamRequestOptions) {
  const apiKey = process.env.STREAM_API_KEY;
  const url = `${STREAM_API_BASE_URL}${path}?api_key=${apiKey}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: serverToken,
      "Content-Type": "application/json",
      "stream-auth-type": "jwt",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await readStreamError(response);
    const message = getStreamErrorMessage(errorBody);

    throw new StreamApiError(
      message
        ? `Stream request failed with ${response.status}: ${message}`
        : `Stream request failed with ${response.status}.`,
    );
  }

  return response.json();
}

async function readStreamError(response: Response) {
  const contentType = response.headers.get("Content-Type");

  if (contentType?.includes("application/json")) {
    return response.json().catch(() => undefined);
  }

  return response.text().catch(() => undefined);
}

function getStreamErrorMessage(errorBody: unknown) {
  if (typeof errorBody === "string") {
    return errorBody.trim() || undefined;
  }

  if (!errorBody || typeof errorBody !== "object") {
    return undefined;
  }

  const message = "message" in errorBody ? errorBody.message : undefined;

  if (typeof message === "string" && message.trim().length > 0) {
    return message.trim();
  }

  return JSON.stringify(errorBody);
}

async function createStreamToken(
  payload: Record<string, unknown>,
  secret: string,
) {
  const issuedAt = Math.floor((Date.now() - 1000) / 1000);
  const normalizedPayload = {
    iat: issuedAt,
    ...payload,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const tokenPayload = base64UrlEncode(JSON.stringify(normalizedPayload));
  const signatureInput = `${header}.${tokenPayload}`;
  const signature = await signHmacSha256(signatureInput, secret);

  return `${signatureInput}.${base64UrlEncode(signature)}`;
}

async function signHmacSha256(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );

  return crypto.subtle.sign("HMAC", key, encoder.encode(value));
}

function base64UrlEncode(value: string | ArrayBuffer) {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : new Uint8Array(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
