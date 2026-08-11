import {
  SITE_PASSWORD,
  createSession,
  ensureSchema,
  getValidSession,
} from "./db.js";

export type AccessRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  socketRemoteAddress?: string | null;
};

export type AccessResponse = {
  status: number;
  body: Record<string, unknown>;
};

function header(req: AccessRequest, name: string): string {
  const raw = req.headers[name] ?? req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0] || "";
  return typeof raw === "string" ? raw : "";
}

function clientMeta(req: AccessRequest) {
  const forwarded = header(req, "x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]?.trim()
    : req.socketRemoteAddress || null;
  const userAgent = header(req, "user-agent") || null;
  return { ip, userAgent };
}

export async function handleAccess(
  route: "password" | "magic-link" | "verify" | "session" | "health",
  req: AccessRequest,
): Promise<AccessResponse> {
  if (route === "health") {
    return { status: 200, body: { ok: true } };
  }

  if (route === "magic-link" || route === "verify") {
    return {
      status: 410,
      body: { error: "Magic link access is temporarily disabled. Use the site password instead." },
    };
  }

  try {
    await ensureSchema();
  } catch (err) {
    console.error("[access] schema error", err);
    return { status: 500, body: { error: "Database unavailable" } };
  }

  if (route === "password") {
    if ((req.method || "POST").toUpperCase() !== "POST") {
      return { status: 405, body: { error: "Method not allowed" } };
    }
    try {
      const body = (req.body || {}) as { password?: string };
      const password = String(body.password ?? "");
      if (password !== SITE_PASSWORD) {
        return { status: 401, body: { error: "Incorrect password" } };
      }
      const meta = clientMeta(req);
      const { sessionToken, expiresAt } = await createSession({
        method: "password",
        email: null,
        userId: null,
        ...meta,
      });
      return {
        status: 200,
        body: {
          sessionToken,
          expiresAt: expiresAt.toISOString(),
          method: "password",
        },
      };
    } catch (err) {
      console.error("[access] password", err);
      return { status: 500, body: { error: "Could not create session" } };
    }
  }

  // session
  if ((req.method || "GET").toUpperCase() !== "GET") {
    return { status: 405, body: { error: "Method not allowed" } };
  }
  try {
    const auth = header(req, "authorization");
    const q = req.query?.token;
    const token = auth.startsWith("Bearer ")
      ? auth.slice(7)
      : String((Array.isArray(q) ? q[0] : q) ?? "");
    if (!token) {
      return { status: 401, body: { valid: false } };
    }
    const session = await getValidSession(token);
    if (!session) {
      return { status: 401, body: { valid: false } };
    }
    return {
      status: 200,
      body: {
        valid: true,
        expiresAt: session.expires_at,
        method: session.method,
        email: session.email,
      },
    };
  } catch (err) {
    console.error("[access] session", err);
    return { status: 500, body: { valid: false, error: "Session check failed" } };
  }
}
