import { createHash, randomBytes } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const MAGIC_LINK_TTL_MS = 30 * 60 * 1000; // link valid 30 minutes
export const SITE_PASSWORD = process.env.SITE_ACCESS_PASSWORD || "diptim";

let migrated = false;
let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getSql() {
  if (sqlClient) return sqlClient;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  sqlClient = neon(url);
  return sqlClient;
}

export async function ensureSchema() {
  if (migrated) return;
  const sql = getSql();

  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS access_users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT NOT NULL UNIQUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_login_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS access_magic_links (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES access_users(id) ON DELETE CASCADE,
      token_hash    TEXT NOT NULL UNIQUE,
      expires_at    TIMESTAMPTZ NOT NULL,
      used_at       TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS access_magic_links_user_id_idx ON access_magic_links(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS access_magic_links_expires_at_idx ON access_magic_links(expires_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS access_sessions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID REFERENCES access_users(id) ON DELETE SET NULL,
      token_hash    TEXT NOT NULL UNIQUE,
      method        TEXT NOT NULL CHECK (method IN ('password', 'magic_link')),
      email         TEXT,
      expires_at    TIMESTAMPTZ NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      revoked_at    TIMESTAMPTZ,
      user_agent    TEXT,
      ip            TEXT
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS access_sessions_token_hash_idx ON access_sessions(token_hash)`;
  await sql`CREATE INDEX IF NOT EXISTS access_sessions_expires_at_idx ON access_sessions(expires_at)`;
  await sql`CREATE INDEX IF NOT EXISTS access_sessions_user_id_idx ON access_sessions(user_id)`;

  migrated = true;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type SessionRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  method: string;
  expires_at: string;
};

export async function createSession(opts: {
  userId?: string | null;
  email?: string | null;
  method: "password" | "magic_link";
  userAgent?: string | null;
  ip?: string | null;
}): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sql = getSql();
  const sessionToken = newToken();
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await sql`
    INSERT INTO access_sessions (user_id, token_hash, method, email, expires_at, user_agent, ip)
    VALUES (
      ${opts.userId ?? null},
      ${tokenHash},
      ${opts.method},
      ${opts.email ?? null},
      ${expiresAt.toISOString()},
      ${opts.userAgent ?? null},
      ${opts.ip ?? null}
    )
  `;

  if (opts.userId) {
    await sql`
      UPDATE access_users
      SET last_login_at = now()
      WHERE id = ${opts.userId}
    `;
  }

  return { sessionToken, expiresAt };
}

export async function getValidSession(sessionToken: string): Promise<SessionRow | null> {
  const sql = getSql();
  const tokenHash = hashToken(sessionToken);
  const rows = await sql`
    SELECT id, user_id, email, method, expires_at
    FROM access_sessions
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
      AND expires_at > now()
    LIMIT 1
  `;
  return (rows[0] as SessionRow | undefined) ?? null;
}

export async function upsertUserByEmail(email: string): Promise<{ id: string; email: string }> {
  const sql = getSql();
  const normalized = normalizeEmail(email);
  const rows = await sql`
    INSERT INTO access_users (email)
    VALUES (${normalized})
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id, email
  `;
  return rows[0] as { id: string; email: string };
}

export async function createMagicLink(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const sql = getSql();
  const token = newToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);

  await sql`
    INSERT INTO access_magic_links (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
  `;

  return { token, expiresAt };
}

export async function consumeMagicLink(token: string): Promise<{ userId: string; email: string } | null> {
  const sql = getSql();
  const tokenHash = hashToken(token);

  const rows = await sql`
    SELECT ml.id, ml.user_id, u.email
    FROM access_magic_links ml
    JOIN access_users u ON u.id = ml.user_id
    WHERE ml.token_hash = ${tokenHash}
      AND ml.used_at IS NULL
      AND ml.expires_at > now()
    LIMIT 1
  `;

  const row = rows[0] as { id: string; user_id: string; email: string } | undefined;
  if (!row) return null;

  await sql`
    UPDATE access_magic_links
    SET used_at = now()
    WHERE id = ${row.id}
  `;

  return { userId: row.user_id, email: row.email };
}
