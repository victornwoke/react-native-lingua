import { languages } from "../../../data/languages";

import {
  RouteError,
  getRequiredString,
  getVerifiedClerkUserId,
} from "@/lib/stream-server";

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_REQUEST_TIMEOUT_MS = 10_000;

type InterpretRequestBody = {
  languageId?: unknown;
  text?: unknown;
};

type GeminiGenerateContentResponse = {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
};

type ChatInterpretation = {
  meaning: string;
  note: string;
  text: string;
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        { message: "Sign in before using AI chat." },
        { status: 401 },
      );
    }

    await getVerifiedClerkUserId(authorization);

    let body: InterpretRequestBody;
    try {
      body = (await request.json()) as InterpretRequestBody;
    } catch {
      return Response.json(
        { message: "Invalid JSON in request body." },
        { status: 400 },
      );
    }
    const languageId = getRequiredString(body.languageId);
    const text = getRequiredString(body.text);

    if (!languageId || !text) {
      return Response.json(
        { message: "languageId and text are required." },
        { status: 400 },
      );
    }

    const language = languages.find((item) => item.id === languageId);

    if (!language) {
      return Response.json(
        { message: "Choose a supported language before chatting." },
        { status: 400 },
      );
    }

    const interpretation = await interpretWithGemini({
      languageName: language.name,
      languageNativeName: language.nativeName,
      text,
    });

    return Response.json({ interpretation });
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.error("Failed to interpret chat message.", error);

    return Response.json(
      {
        message: "Could not interpret this message. Please try again.",
      },
      { status: 500 },
    );
  }
}

async function interpretWithGemini({
  languageName,
  languageNativeName,
  text,
}: {
  languageName: string;
  languageNativeName: string;
  text: string;
}): Promise<ChatInterpretation> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new RouteError("Add GOOGLE_API_KEY to your .env.", 500);
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "You are an AI language tutor for beginner learners.",
                  `Target language: ${languageName} (${languageNativeName}).`,
                  `Learner English input: ${text}`,
                  "Return a natural beginner-friendly interpretation in the target language.",
                  "Keep the meaning faithful to the learner's English.",
                  "Use everyday phrasing, not a literal word-for-word translation when that would sound unnatural.",
                ].join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              text: {
                type: "STRING",
                description: "The natural phrase in the target language.",
              },
              meaning: {
                type: "STRING",
                description: "The English meaning of the target-language phrase.",
              },
              note: {
                type: "STRING",
                description: "A short beginner-friendly usage note.",
              },
            },
            required: ["text", "meaning", "note"],
          },
          temperature: 0.2,
        },
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(GEMINI_REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => undefined)) as
      | { error?: { message?: string } }
      | undefined;
    throw new Error(
      errorPayload?.error?.message ?? "Gemini interpretation request failed.",
    );
  }

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty interpretation.");
  }

  return parseInterpretation(rawText);
}

function parseInterpretation(rawText: string): ChatInterpretation {
  const parsed = JSON.parse(rawText) as Partial<ChatInterpretation>;

  if (
    typeof parsed.text !== "string" ||
    typeof parsed.meaning !== "string" ||
    typeof parsed.note !== "string"
  ) {
    throw new Error("Gemini returned an invalid interpretation.");
  }

  return {
    meaning: parsed.meaning.trim(),
    note: parsed.note.trim(),
    text: parsed.text.trim(),
  };
}
