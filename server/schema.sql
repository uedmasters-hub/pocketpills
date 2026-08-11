-- Site access gate: users, magic links, sessions (Neon Postgres)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS access_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS access_magic_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES access_users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS access_magic_links_user_id_idx ON access_magic_links(user_id);
CREATE INDEX IF NOT EXISTS access_magic_links_expires_at_idx ON access_magic_links(expires_at);

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
);

CREATE INDEX IF NOT EXISTS access_sessions_token_hash_idx ON access_sessions(token_hash);
CREATE INDEX IF NOT EXISTS access_sessions_expires_at_idx ON access_sessions(expires_at);
CREATE INDEX IF NOT EXISTS access_sessions_user_id_idx ON access_sessions(user_id);
