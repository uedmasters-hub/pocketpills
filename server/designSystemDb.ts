/**
 * Design system store.
 * Uses DESIGN_SYSTEM_DATABASE_URL when set; falls back to DATABASE_URL.
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { DEFAULT_TOKENS, buildSeedPages, type SeedPage } from "./designSystemSeed.js";

let sqlClient: NeonQueryFunction<false, false> | null = null;
let migrated = false;

export function designSystemDatabaseConfigured() {
  return Boolean(process.env.DESIGN_SYSTEM_DATABASE_URL || process.env.DATABASE_URL);
}

function getSql() {
  if (sqlClient) return sqlClient;
  const url = process.env.DESIGN_SYSTEM_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DESIGN_SYSTEM_DATABASE_URL (or DATABASE_URL) is not set");
  sqlClient = neon(url);
  return sqlClient;
}

export type DesignVersionStatus = "draft" | "published" | "archived";

export type DesignVersionRow = {
  id: string;
  slug: string;
  label: string;
  status: DesignVersionStatus;
  isLive: boolean;
  summary: string;
  tokens: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  publishedBy: string | null;
};

export type DesignPageRow = {
  id: string;
  versionId: string;
  section: string;
  slug: string;
  title: string;
  sortOrder: number;
  lede: string;
  bodyMd: string;
  blocks: unknown[];
  updatedAt: string;
};

function asVersion(raw: Record<string, unknown>): DesignVersionRow {
  const tokens =
    raw.tokens && typeof raw.tokens === "object" && !Array.isArray(raw.tokens)
      ? (raw.tokens as Record<string, string>)
      : {};
  return {
    id: String(raw.id ?? ""),
    slug: String(raw.slug ?? ""),
    label: String(raw.label ?? ""),
    status: String(raw.status ?? "draft") as DesignVersionStatus,
    isLive: Boolean(raw.is_live),
    summary: String(raw.summary ?? ""),
    tokens,
    createdAt: String(raw.created_at ?? ""),
    updatedAt: String(raw.updated_at ?? ""),
    publishedAt: raw.published_at ? String(raw.published_at) : null,
    publishedBy: raw.published_by ? String(raw.published_by) : null,
  };
}

function asPage(raw: Record<string, unknown>): DesignPageRow {
  const blocks = Array.isArray(raw.blocks) ? raw.blocks : [];
  return {
    id: String(raw.id ?? ""),
    versionId: String(raw.version_id ?? ""),
    section: String(raw.section ?? ""),
    slug: String(raw.slug ?? ""),
    title: String(raw.title ?? ""),
    sortOrder: Number(raw.sort_order ?? 0),
    lede: String(raw.lede ?? ""),
    bodyMd: String(raw.body_md ?? ""),
    blocks,
    updatedAt: String(raw.updated_at ?? ""),
  };
}

export async function ensureDesignSystemSchema() {
  if (migrated) return;
  const sql = getSql();
  await sql`CREATE SCHEMA IF NOT EXISTS design_system`;
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`
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
    )
  `;
  await sql`
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
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS design_system_pages_version_idx
      ON design_system.pages (version_id, section, sort_order)
  `;
  migrated = true;
}

async function insertPages(versionId: string, pages: SeedPage[]) {
  const sql = getSql();
  for (const p of pages) {
    await sql`
      INSERT INTO design_system.pages (
        version_id, section, slug, title, sort_order, lede, body_md, blocks
      ) VALUES (
        ${versionId}::uuid,
        ${p.section},
        ${p.slug},
        ${p.title},
        ${p.sortOrder},
        ${p.lede},
        ${p.bodyMd},
        ${JSON.stringify([])}::jsonb
      )
      ON CONFLICT (version_id, section, slug) DO UPDATE SET
        title = EXCLUDED.title,
        sort_order = EXCLUDED.sort_order,
        lede = EXCLUDED.lede,
        body_md = EXCLUDED.body_md,
        updated_at = now()
    `;
  }
}

export async function listVersions(): Promise<DesignVersionRow[]> {
  await ensureDesignSystemSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM design_system.versions
    ORDER BY
      CASE WHEN is_live THEN 0 WHEN status = 'draft' THEN 1 ELSE 2 END,
      created_at ASC
  `;
  return (rows as Record<string, unknown>[]).map(asVersion);
}

export async function getVersionById(id: string): Promise<DesignVersionRow | null> {
  await ensureDesignSystemSchema();
  const sql = getSql();
  const rows = await sql`SELECT * FROM design_system.versions WHERE id = ${id}::uuid LIMIT 1`;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? asVersion(row) : null;
}

export async function getLiveVersion(): Promise<DesignVersionRow | null> {
  await ensureDesignSystemSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM design_system.versions WHERE is_live = true LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? asVersion(row) : null;
}

export async function listPages(versionId: string): Promise<DesignPageRow[]> {
  await ensureDesignSystemSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM design_system.pages
    WHERE version_id = ${versionId}::uuid
    ORDER BY sort_order ASC, title ASC
  `;
  return (rows as Record<string, unknown>[]).map(asPage);
}

export async function getPage(
  versionId: string,
  section: string,
  slug: string,
): Promise<DesignPageRow | null> {
  await ensureDesignSystemSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM design_system.pages
    WHERE version_id = ${versionId}::uuid
      AND section = ${section}
      AND slug = ${slug}
    LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? asPage(row) : null;
}

export async function createVersion(input: {
  slug: string;
  label: string;
  summary?: string;
  tokens?: Record<string, string>;
  copyFromId?: string;
}): Promise<DesignVersionRow> {
  await ensureDesignSystemSchema();
  const sql = getSql();
  const tokens = input.tokens ?? DEFAULT_TOKENS;
  const rows = await sql`
    INSERT INTO design_system.versions (slug, label, status, summary, tokens)
    VALUES (
      ${input.slug},
      ${input.label},
      'draft',
      ${input.summary || ""},
      ${JSON.stringify(tokens)}::jsonb
    )
    RETURNING *
  `;
  const version = asVersion((rows as Record<string, unknown>[])[0]);

  if (input.copyFromId) {
    const source = await listPages(input.copyFromId);
    await insertPages(
      version.id,
      source.map((p, i) => ({
        section: p.section,
        slug: p.slug,
        title: p.title,
        sortOrder: p.sortOrder || i,
        lede: p.lede,
        bodyMd: p.bodyMd,
      })),
    );
  } else {
    await insertPages(version.id, buildSeedPages());
  }
  return version;
}

export async function updateVersionTokens(
  id: string,
  tokens: Record<string, string>,
): Promise<DesignVersionRow | null> {
  await ensureDesignSystemSchema();
  const sql = getSql();
  const rows = await sql`
    UPDATE design_system.versions
    SET tokens = ${JSON.stringify(tokens)}::jsonb, updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? asVersion(row) : null;
}

export async function publishVersion(id: string, publishedBy: string): Promise<DesignVersionRow | null> {
  await ensureDesignSystemSchema();
  const sql = getSql();
  await sql`UPDATE design_system.versions SET is_live = false WHERE is_live = true`;
  const rows = await sql`
    UPDATE design_system.versions
    SET
      is_live = true,
      status = 'published',
      published_at = now(),
      published_by = ${publishedBy},
      updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? asVersion(row) : null;
}

export async function seedIfEmpty(): Promise<{ created: boolean; version: DesignVersionRow | null }> {
  await ensureDesignSystemSchema();
  const existing = await listVersions();
  if (existing.length) return { created: false, version: existing.find((v) => v.isLive) || existing[0] };

  const v1 = await createVersion({
    slug: "v1",
    label: "Version 1",
    summary: "Initial PocketPills design system aligned to production tokens.",
    tokens: DEFAULT_TOKENS,
  });
  await publishVersion(v1.id, "system-seed");

  await createVersion({
    slug: "draft",
    label: "Draft",
    summary: "Working draft — iterate here before promoting.",
    tokens: DEFAULT_TOKENS,
    copyFromId: v1.id,
  });

  const live = await getLiveVersion();
  return { created: true, version: live };
}
