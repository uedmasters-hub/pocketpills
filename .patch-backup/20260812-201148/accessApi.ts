import {
  SITE_PASSWORD,
  ensureSchema,
} from "./db.js";
import { issueSession, verifySession } from "./statelessSession.js";

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

  /* The gate no longer requires Postgres. If a database is configured we still
     initialise it (so visits can be recorded), but a failure here must not lock
     anyone out — sessions are signed tokens, not rows. */
  if (process.env.DATABASE_URL) {
    try {
      await ensureSchema();
    } catch (err) {
      console.warn("[access] database unavailable, continuing stateless", err);
    }
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
      const { sessionToken, expiresAt } = issueSession("password");
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
    const session = verifySession(token);
    if (!session) {
      return { status: 401, body: { valid: false } };
    }
    return {
      status: 200,
      body: {
        valid: true,
        expiresAt: session.expiresAt.toISOString(),
        method: session.method,
        email: null,
      },
    };
  } catch (err) {
    console.error("[access] session", err);
    return { status: 500, body: { valid: false, error: "Session check failed" } };
  }
}

