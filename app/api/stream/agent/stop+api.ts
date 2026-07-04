type StopAgentRequestBody = {
  callId?: unknown;
  sessionId?: unknown;
};

type ClerkSessionTokenPayload = {
  exp?: number;
  sid?: string;
  sub?: string;
};

type ClerkSessionResponse = {
  status?: string;
  user?: {
    id?: string;
  };
  user_id?: string;
};

class RouteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        { message: "Sign in before ending an AI teacher session." },
        { status: 401 },
      );
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const visionAgentServerUrl = process.env.VISION_AGENT_SERVER_URL;

    if (!clerkSecretKey) {
      return Response.json(
        { message: "Add CLERK_SECRET_KEY to your .env." },
        { status: 500 },
      );
    }

    if (!visionAgentServerUrl) {
      return Response.json({ skipped: true });
    }

    await getVerifiedClerkUserId(authorization, clerkSecretKey);

    const body = (await request.json()) as StopAgentRequestBody;
    const callId = getRequiredString(body.callId);
    const sessionId = getRequiredString(body.sessionId);

    if (!callId || !sessionId) {
      return Response.json(
        { message: "callId and sessionId are required." },
        { status: 400 },
      );
    }

    const endpoint = `${normalizeBaseUrl(visionAgentServerUrl)}/calls/${encodeURIComponent(callId)}/sessions/${encodeURIComponent(sessionId)}`;
    const visionResponse = await fetch(endpoint, {
      method: "DELETE",
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

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/g, "");
}

async function getVerifiedClerkUserId(
  authorization: string,
  clerkSecretKey: string,
) {
  const token = authorization.replace(/^Bearer\s+/i, "");
  const payload = decodeJwtPayload<ClerkSessionTokenPayload>(token);

  if (!payload.sub) {
    throw new RouteError("Invalid Clerk session.", 401);
  }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new RouteError("Your session expired. Please sign in again.", 401);
  }

  if (!payload.sid) {
    return payload.sub;
  }

  try {
    const response = await fetch(
      `https://api.clerk.com/v1/sessions/${payload.sid}`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      },
    );

    if (response.ok) {
      const session = (await response.json()) as ClerkSessionResponse;
      const sessionUserId = session.user_id ?? session.user?.id;

      if (sessionUserId && sessionUserId !== payload.sub) {
        throw new RouteError("Invalid Clerk session.", 401);
      }

      if (session.status && !isUsableClerkSessionStatus(session.status)) {
        throw new RouteError(
          getInactiveClerkSessionMessage(session.status),
          401,
        );
      }
    }
  } catch (error) {
    if (error instanceof RouteError) {
      throw error;
    }

    console.warn(
      "Clerk session verification fallback triggered for Vision Agent route.",
      error,
    );
  }

  return payload.sub;
}

function isUsableClerkSessionStatus(status: string) {
  return status === "active" || status === "pending";
}

function getInactiveClerkSessionMessage(status: string) {
  if (status === "expired") {
    return "Your session expired. Please sign in again.";
  }

  return "Your Clerk session is not active. Please sign in again.";
}

function decodeJwtPayload<T>(token: string) {
  const [, encodedPayload] = token.split(".");

  if (!encodedPayload) {
    throw new RouteError("Invalid Clerk session.", 401);
  }

  try {
    const normalizedPayload = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "=",
    );

    return JSON.parse(atob(paddedPayload)) as T;
  } catch {
    throw new RouteError("Invalid Clerk session.", 401);
  }
}
