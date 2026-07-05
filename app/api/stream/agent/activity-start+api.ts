import {
  RouteError,
  assertStreamCallOwner,
  getRequiredString,
  getVerifiedClerkUserId,
  resolveVisionAgentServerUrl,
} from "../_server";

type StartAgentActivityRequestBody = {
  callId?: unknown;
  sessionId?: unknown;
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        { message: "Sign in before updating an AI teacher session." },
        { status: 401 },
      );
    }

    const visionAgentServerUrl = resolveVisionAgentServerUrl();

    if (!visionAgentServerUrl) {
      return Response.json({ skipped: true });
    }

    const body = (await request.json()) as StartAgentActivityRequestBody;
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

    const endpoint = `${visionAgentServerUrl}/calls/${encodeURIComponent(callId)}/sessions/${encodeURIComponent(sessionId)}/activity-start`;
    const visionResponse = await fetch(endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(3_000),
    });

    if (visionResponse.status === 404) {
      return Response.json({ missingSession: true, success: false });
    }

    if (!visionResponse.ok) {
      const payload = (await visionResponse.json().catch(() => undefined)) as
        | {
            detail?: string;
          }
        | undefined;
      const detail =
        typeof payload?.detail === "string" && payload.detail.trim().length > 0
          ? payload.detail.trim()
          : "Could not update the AI teacher session.";

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

    return Response.json({ missingSession: false, success: true });
  } catch (error) {
    if (error instanceof RouteError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.info(
      "Failed to start Vision Agent user activity.",
      error instanceof Error ? error.message : error,
    );

    return Response.json(
      { message: "Could not update the AI teacher session." },
      { status: 503 },
    );
  }
}
