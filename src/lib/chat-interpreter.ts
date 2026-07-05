import { getApiUrl } from "@/lib/api";

export type ChatInterpretation = {
  meaning: string;
  note: string;
  text: string;
};

type InterpretChatMessageParams = {
  clerkSessionToken: string;
  languageId: string;
  text: string;
};

type InterpretChatMessageResponse = {
  interpretation?: Partial<ChatInterpretation>;
  message?: string;
};

export async function interpretChatMessage({
  clerkSessionToken,
  languageId,
  text,
}: InterpretChatMessageParams): Promise<ChatInterpretation> {
  const response = await fetch(getApiUrl("/api/chat/interpret"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkSessionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      languageId,
      text,
    }),
  });

  const payload = (await response.json().catch(() => undefined)) as
    | InterpretChatMessageResponse
    | undefined;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Could not interpret this message.");
  }

  const interpretation = payload?.interpretation;

  if (
    !interpretation ||
    typeof interpretation.text !== "string" ||
    typeof interpretation.meaning !== "string" ||
    typeof interpretation.note !== "string"
  ) {
    throw new Error("The interpreter returned an invalid response.");
  }

  return {
    meaning: interpretation.meaning,
    note: interpretation.note,
    text: interpretation.text,
  };
}
