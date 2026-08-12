import { createHmac, timingSafeEqual } from "node:crypto";
import { SESSION_TTL_MS, SITE_PASSWORD } from "./db.js";

/**
 * Stateless preview-gate sessions.
 *
 * The gate only needs to answer "did this browser enter the right password, and
 * was that recently?". That's a signed statement, not a database row — so the
 * token carries its own expiry and an HMAC over it. No Postgres, no cleanup, and
 * the gate keeps working when the database is asleep or absent.
 *
 * Not suitable for real user accounts: there's no revocation, and anyone holding
 * a valid token is admitted until it expires. Fine for a preview wall.
 */

const VERSION = "v1";

/**
 * Signing key. Prefers an explicit secret; falls back to the site password so
 * the gate works with zero configuration. Set SITE_ACCESS_SECRET in production
 * if you want tokens to survive a password change (or be invalidated by one).
 */
function signingKey(): string {
  return process.env.SITE_ACCESS_SECRET || `pp.gate.${SITE_PASSWORD}`;
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

/** Constant-time compare — a plain `===` leaks timing information. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export interface StatelessSession {
  sessionToken: string;
  expiresAt: Date;
}

/** Issue a token of the form `v1.<expiry-ms>.<hmac>`. */
export function issueSession(method: "password" | "magic_link" = "password"): StatelessSession {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const payload = `${VERSION}.${method}.${expiresAt.getTime()}`;
  const sessionToken = `${payload}.${sign(payload)}`;
  return { sessionToken, expiresAt };
}

/** Verify signature and expiry. Returns null when either fails. */
export function verifySession(token: string | null | undefined): { method: string; expiresAt: Date } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [version, method, expiryRaw, signature] = parts;
  if (version !== VERSION) return null;

  const payload = `${version}.${method}.${expiryRaw}`;
  if (!safeEqual(signature, sign(payload))) return null;

  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return null;

  return { method, expiresAt: new Date(expiry) };
}

/** True when a database is configured — used to decide whether to log visits. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

