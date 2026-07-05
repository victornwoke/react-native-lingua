const CLERK_API_BASE_URL = "https://api.clerk.com/v1";
export const STREAM_API_BASE_URL = "https://video.stream-io-api.com";
export const STREAM_CALL_TYPE = "default";
export const STREAM_MAX_ID_LENGTH = 64;
const CLERK_REQUEST_TIMEOUT_MS = 5_000;
const STREAM_REQUEST_TIMEOUT_MS = 8_000;

type ClerkSessionTokenPayload = {
  exp?: number;
  nbf?: number;
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

type JwtHeader = {
  alg?: string;
  typ?: string;
};

type StreamRequestOptions = {
  body?: Record<string, unknown>;
  errorMessage?: string;
  method: "GET" | "POST";
  path: string;
  serverToken: string;
};

type AgentControlRequestBody = {
  callId?: unknown;
  sessionId?: unknown;
};

type AgentControlRequestOptions = {
  actionSuffix: string;
  genericErrorMessage: string;
  logLabel: string;
  unauthenticatedMessage: string;
};

export class RouteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function getVerifiedClerkUserId(authorization: string) {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  const clerkJwtKey = process.env.CLERK_JWT_KEY;

  if (!clerkSecretKey || !clerkJwtKey) {
    throw new RouteError(
      "Add CLERK_SECRET_KEY and CLERK_JWT_KEY to your .env.",
      500,
    );
  }

  const token = authorization.replace(/^Bearer\s+/i, "");
  const { header, payload, signature, signingInput } = parseJwt(token);

  if (header.alg !== "RS256") {
    throw new RouteError("Invalid Clerk session.", 401);
  }

  if (!payload.sub || !payload.sid) {
    throw new RouteError("Invalid Clerk session.", 401);
  }

  await verifyJwtSignature({
    jwtKeyPem: clerkJwtKey,
    signature,
    signingInput,
  });

  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (payload.nbf && payload.nbf > nowInSeconds + 5) {
    throw new RouteError("Invalid Clerk session.", 401);
  }

  if (payload.exp && payload.exp <= nowInSeconds) {
    throw new RouteError("Your session expired. Please sign in again.", 401);
  }

  const session = await fetchClerkSession(payload.sid, clerkSecretKey);
  const sessionUserId = session.user_id ?? session.user?.id;

  if (!sessionUserId || sessionUserId !== payload.sub) {
    throw new RouteError("Invalid Clerk session.", 401);
  }

  if (!session.status || !isUsableClerkSessionStatus(session.status)) {
    throw new RouteError(getInactiveClerkSessionMessage(session.status), 401);
  }

  return payload.sub;
}

export async function assertStreamCallOwner(
  callId: string,
  verifiedClerkUserId: string,
) {
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiSecret) {
    throw new RouteError("Add STREAM_API_SECRET to your .env.", 500);
  }

  const serverToken = await createStreamToken({ server: true }, apiSecret);
  const response = await streamRequest({
    errorMessage: "Could not verify Stream call ownership.",
    method: "GET",
    path: `/api/v2/video/call/${STREAM_CALL_TYPE}/${encodeURIComponent(callId)}`,
    serverToken,
  });

  const callData = getCallData(response);
  const customData = getCustomData(callData);
  const createdById = getCreatedById(callData);
  const expectedStreamUserId = toStreamId(verifiedClerkUserId);

  if (customData?.clerkUserId === verifiedClerkUserId) {
    return;
  }

  if (customData?.streamUserId === expectedStreamUserId) {
    return;
  }

  if (createdById === expectedStreamUserId) {
    return;
  }

  throw new RouteError(
    "You can only manage AI teacher sessions for your own audio lesson.",
    403,
  );
}

export function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/g, "");
}

export function resolveVisionAgentServerUrl() {
  const visionAgentServerUrl =
    process.env.VISION_AGENT_SERVER_URL ??
    (process.env.NODE_ENV !== "production"
      ? "http://127.0.0.1:8080"
      : undefined);

  return visionAgentServerUrl
    ? normalizeBaseUrl(visionAgentServerUrl)
    : undefined;
}

export function getRequiredString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export async function handleAgentControlRequest(
  request: Request,
  {
    actionSuffix,
    genericErrorMessage,
    logLabel,
    unauthenticatedMessage,
  }: AgentControlRequestOptions,
) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        { message: unauthenticatedMessage },
        { status: 401 },
      );
    }

    const visionAgentServerUrl = resolveVisionAgentServerUrl();

    if (!visionAgentServerUrl) {
      return Response.json({ skipped: true });
    }

    const agentControlSecret = process.env.VISION_AGENT_SHARED_SECRET;

    if (!agentControlSecret) {
      throw new RouteError("Add VISION_AGENT_SHARED_SECRET to your .env.", 500);
    }

    const body = (await request.json()) as AgentControlRequestBody;
    const callId = getRequiredString(body.callId);
    const sessionId = getRequiredString(body.sessionId);

    console.info(
      `Vision Agent control requested: ${actionSuffix}`,
      callId,
      sessionId,
    );

    if (!callId || !sessionId) {
      return Response.json(
        { message: "callId and sessionId are required." },
        { status: 400 },
      );
    }

    const verifiedClerkUserId = await getVerifiedClerkUserId(authorization);
    await assertStreamCallOwner(callId, verifiedClerkUserId);

    const endpoint = `${visionAgentServerUrl}/calls/${encodeURIComponent(callId)}/sessions/${encodeURIComponent(sessionId)}/${actionSuffix}`;
    const visionResponse = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${agentControlSecret}`,
      },
      method: "POST",
      signal: AbortSignal.timeout(3_000),
    });

    if (visionResponse.status === 404) {
      return Response.json({ missingSession: true, success: false });
    }

    if (visionResponse.status === 409) {
      return Response.json({
        missingSession: false,
        shouldRestart: true,
        success: false,
      });
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
          : genericErrorMessage;

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

    console.info(logLabel, error instanceof Error ? error.message : error);

    return Response.json({ message: genericErrorMessage }, { status: 503 });
  }
}

function parseJwt(token: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new RouteError("Invalid Clerk session.", 401);
  }

  return {
    header: decodeBase64UrlJson<JwtHeader>(encodedHeader),
    payload: decodeBase64UrlJson<ClerkSessionTokenPayload>(encodedPayload),
    signature: decodeBase64UrlBytes(encodedSignature),
    signingInput: `${encodedHeader}.${encodedPayload}`,
  };
}

function decodeBase64UrlJson<T>(value: string) {
  try {
    return JSON.parse(decodeBase64UrlString(value)) as T;
  } catch {
    throw new RouteError("Invalid Clerk session.", 401);
  }
}

function decodeBase64UrlString(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);

  return new TextDecoder().decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  );
}

function decodeBase64UrlBytes(value: string) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);

    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );

    return bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    );
  } catch {
    throw new RouteError("Invalid Clerk session.", 401);
  }
}

async function verifyJwtSignature({
  jwtKeyPem,
  signature,
  signingInput,
}: {
  jwtKeyPem: string;
  signature: ArrayBuffer;
  signingInput: string;
}) {
  let isValid = false;

  try {
    const publicKey = await crypto.subtle.importKey(
      "spki",
      pemToUint8Array(jwtKeyPem),
      {
        hash: "SHA-256",
        name: "RSASSA-PKCS1-v1_5",
      },
      false,
      ["verify"],
    );

    isValid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signature,
      new TextEncoder().encode(signingInput),
    );
  } catch {
    throw new RouteError("CLERK_JWT_KEY is invalid in your .env.", 500);
  }

  if (!isValid) {
    throw new RouteError("Invalid Clerk session.", 401);
  }
}

function pemToUint8Array(value: string) {
  try {
    const normalized = value.replace(/\\n/g, "\n").trim();
    const base64 = normalized
      .replace(/-----BEGIN PUBLIC KEY-----/g, "")
      .replace(/-----END PUBLIC KEY-----/g, "")
      .replace(/\s+/g, "");
    const binary = atob(base64);

    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new RouteError("CLERK_JWT_KEY is invalid in your .env.", 500);
  }
}

async function fetchClerkSession(sessionId: string, clerkSecretKey: string) {
  let response: Response;

  try {
    response = await fetch(`${CLERK_API_BASE_URL}/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
      },
      signal: AbortSignal.timeout(CLERK_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new RouteError("Could not verify your Clerk session.", 503);
  }

  if (response.status === 401 || response.status === 404) {
    throw new RouteError("Invalid Clerk session.", 401);
  }

  if (!response.ok) {
    throw new RouteError("Could not verify your Clerk session.", 503);
  }

  return (await response.json()) as ClerkSessionResponse;
}

function isUsableClerkSessionStatus(status: string) {
  // Clerk can briefly return "pending" right after sign-in / token refresh.
  // We still require a valid signed token and matching user/session.
  return status === "active" || status === "pending";
}

function getInactiveClerkSessionMessage(status: string | undefined) {
  if (status === "expired") {
    return "Your session expired. Please sign in again.";
  }

  return "Your Clerk session is not active. Please sign in again.";
}

export async function streamRequest({
  body,
  errorMessage = "Could not complete the Stream request.",
  method,
  path,
  serverToken,
}: StreamRequestOptions) {
  const apiKey = process.env.STREAM_API_KEY;

  if (!apiKey) {
    throw new RouteError("Add STREAM_API_KEY to your .env.", 500);
  }

  let response: Response;

  try {
    response = await fetch(`${STREAM_API_BASE_URL}${path}?api_key=${apiKey}`, {
      method,
      headers: {
        Authorization: serverToken,
        "Content-Type": "application/json",
        "stream-auth-type": "jwt",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(STREAM_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new RouteError(errorMessage, 503);
  }

  if (!response.ok) {
    throw new RouteError(errorMessage, 503);
  }

  return response.json();
}

function getCallData(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  if ("call" in value && value.call && typeof value.call === "object") {
    return value.call as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function getCustomData(value: Record<string, unknown> | undefined) {
  if (!value) {
    return undefined;
  }

  if (value.custom && typeof value.custom === "object") {
    return value.custom as Record<string, string>;
  }

  if (value.data && typeof value.data === "object") {
    return getCustomData(value.data as Record<string, unknown>);
  }

  return undefined;
}

function getCreatedById(value: Record<string, unknown> | undefined) {
  if (!value) {
    return undefined;
  }

  if (typeof value.created_by_id === "string") {
    return value.created_by_id;
  }

  if (
    value.created_by &&
    typeof value.created_by === "object" &&
    "id" in value.created_by &&
    typeof value.created_by.id === "string"
  ) {
    return value.created_by.id;
  }

  if (value.data && typeof value.data === "object") {
    return getCreatedById(value.data as Record<string, unknown>);
  }

  return undefined;
}

export function toStreamId(value: string) {
  const sanitizedValue = value.replace(/[^A-Za-z0-9@_-]/g, "_");

  if (sanitizedValue.length <= STREAM_MAX_ID_LENGTH) {
    return sanitizedValue;
  }

  const hashSuffix = createStableHash(sanitizedValue);
  const prefixLength = STREAM_MAX_ID_LENGTH - hashSuffix.length - 1;

  return `${sanitizedValue.slice(0, prefixLength)}_${hashSuffix}`;
}

function createStableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

export async function createStreamToken(
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

export async function signHmacSha256(value: string, secret: string) {
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

export function base64UrlEncode(value: string | ArrayBuffer) {
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
