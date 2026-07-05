import {
  RouteError,
  assertStreamCallOwner,
  getRequiredString,
  getVerifiedClerkUserId,
  resolveVisionAgentServerUrl,
} from "@/lib/stream-server";

type StartAgentRequestBody = {
  callId?: unknown;
  callType?: unknown;
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        { message: "Sign in before starting an AI teacher session." },
        { status: 401 },
      );
    }

    const visionAgentServerUrl = resolveVisionAgentServerUrl();

    // Vision Agent server is optional. Skip gracefully when not configured.
    if (!visionAgentServerUrl) {
      return Response.json({ skipped: true });
    }

    const body = (await request.json()) as StartAgentRequestBody;
    const callId = getRequiredString(body.callId);
    const callType = getOptionalString(body.callType) ?? "default";

    if (!callId) {
      return Response.json({ message: "callId is required." }, { status: 400 });
    }

    const verifiedClerkUserId = await getVerifiedClerkUserId(authorization);
    await assertStreamCallOwner(callId, verifiedClerkUserId);

    const endpoint = `${visionAgentServerUrl}/calls/${encodeURIComponent(callId)}/sessions`;
    const visionResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ call_type: callType }),
      signal: AbortSignal.timeout(8_000),
    });

    const payload = (await visionResponse.json().catch(() => undefined)) as
      | {
          call_id?: string;
          session_id?: string;
          session_started_at?: string;
          detail?: string;
        }
      | undefined;

    if (!visionResponse.ok) {
      const detail =
        typeof payload?.detail === "string" && payload.detail.trim().length > 0
          ? payload.detail.trim()
          : "Could not connect the AI teacher.";

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

    if (!payload?.session_id || !payload?.call_id) {
      return Response.json(
        {
          message: "Vision Agent server returned an invalid session response.",
        },
        { status: 502 },
      );
    }

    return Response.json({
      callId: payload.call_id,
      sessionId: payload.session_id,
      sessionStartedAt: payload.session_started_at,
    });
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.info(
      "Vision Agent server not reachable — AI teacher will be skipped.",
      error instanceof Error ? error.message : error,
    );

    return Response.json(
      { message: "Could not reach the AI teacher server." },
      { status: 503 },
    );
  }
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}
