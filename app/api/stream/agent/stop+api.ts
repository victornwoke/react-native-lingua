import {
    RouteError,
    assertStreamCallOwner,
    getVerifiedClerkUserId,
    normalizeBaseUrl,
} from "../_server";

type StopAgentRequestBody = {
  callId?: unknown;
  sessionId?: unknown;
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        { message: "Sign in before ending an AI teacher session." },
        { status: 401 },
      );
    }

    const visionAgentServerUrl =
      process.env.VISION_AGENT_SERVER_URL ??
      (process.env.NODE_ENV !== "production"
        ? "http://127.0.0.1:8080"
        : undefined);

    if (!visionAgentServerUrl) {
      return Response.json({ skipped: true });
    }

    const body = (await request.json()) as StopAgentRequestBody;
    const callId = getRequiredString(body.callId);
    const sessionId = getRequiredString(body.sessionId);

    if (!callId || !sessionId) {
      return Response.json(
        { message: "callId and sessionId are required." },
        { status: 400 },
      );
    }

    const verifiedClerkUserId = await getVerifiedClerkUserId(authorization);
    await assertStreamCallOwner(callId, verifiedClerkUserId);

    const endpoint = `${normalizeBaseUrl(visionAgentServerUrl)}/calls/${encodeURIComponent(callId)}/sessions/${encodeURIComponent(sessionId)}`;
    const visionResponse = await fetch(endpoint, {
      method: "DELETE",
      signal: AbortSignal.timeout(8_000),
    });

    if (!visionResponse.ok && visionResponse.status !== 404) {
      const payload = (await visionResponse.json().catch(() => undefined)) as
        | {
            detail?: string;
          }
        | undefined;
      const detail =
        typeof payload?.detail === "string" && payload.detail.trim().length > 0
          ? payload.detail.trim()
          : "Could not stop the AI teacher session.";

      return Response.json(
        {
          message: detail,
        },
        {
          status:
            visionResponse.status >= 400 && visionResponse.status < 600
              ? visionResponse.status
              : 502,
        },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.error("Failed to stop Vision Agent session.", error);

    return Response.json(
      { message: "Could not stop the AI teacher session." },
      { status: 500 },
    );
  }
}

function getRequiredString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}
