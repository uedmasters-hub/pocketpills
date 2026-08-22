-- PocketPills Design System (optional dedicated DB via DESIGN_SYSTEM_DATABASE_URL)
CREATE SCHEMA IF NOT EXISTS design_system;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS design_system.versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  is_live BOOLEAN NOT NULL DEFAULT false,
  summary TEXT NOT NULL DEFAULT '',
  tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  published_by TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS design_system_one_live
  ON design_system.versions ((is_live))
  WHERE is_live = true;

CREATE TABLE IF NOT EXISTS design_system.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES design_system.versions(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  lede TEXT NOT NULL DEFAULT '',
  body_md TEXT NOT NULL DEFAULT '',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (version_id, section, slug)
);

CREATE INDEX IF NOT EXISTS design_system_pages_version_idx
  ON design_system.pages (version_id, section, sort_order);
