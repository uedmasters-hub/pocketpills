/**
 * Dedicated Neon connection for the rating system.
 * Uses REVIEWS_DATABASE_URL when set so reviews can live on a separate database
 * from site access. Falls back to DATABASE_URL only for local/dev.
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;
let migrated = false;

export function reviewsDatabaseConfigured() {
  return Boolean(process.env.REVIEWS_DATABASE_URL || process.env.DATABASE_URL);
}

export function getReviewsSql() {
  if (sqlClient) return sqlClient;
  const url = process.env.REVIEWS_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("REVIEWS_DATABASE_URL (or DATABASE_URL) is not set");
  sqlClient = neon(url);
  return sqlClient;
}

export async function ensureReviewsSchema() {
  if (migrated) return;
  const sql = getReviewsSql();

  await sql`CREATE SCHEMA IF NOT EXISTS rating`;
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS rating.reviews (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject_kind     TEXT NOT NULL CHECK (subject_kind IN ('doctor', 'pharmacy', 'facility')),
      subject_id       TEXT NOT NULL,
      rating           SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      title            TEXT,
      body             TEXT NOT NULL,
      reviewer_key     TEXT NOT NULL,
      reviewer_name    TEXT NOT NULL,
      reviewer_email   TEXT NOT NULL,
      status           TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'visible', 'hidden', 'deleted')),
      hidden_reason    TEXT,
      moderated_at     TIMESTAMPTZ,
      moderated_by     TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS rating_reviews_one_active
      ON rating.reviews (subject_kind, subject_id, reviewer_key)
      WHERE status IN ('pending', 'visible', 'hidden')
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS rating_reviews_subject_visible_idx
      ON rating.reviews (subject_kind, subject_id, created_at DESC)
      WHERE status = 'visible'
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS rating_reviews_status_idx
      ON rating.reviews (status, created_at DESC)
  `;

  await sql`ALTER TABLE rating.reviews DROP CONSTRAINT IF EXISTS reviews_status_check`;
  await sql`ALTER TABLE rating.reviews DROP CONSTRAINT IF EXISTS rating_reviews_status_check`;
  await sql`ALTER TABLE rating.reviews ALTER COLUMN status SET DEFAULT 'pending'`;
  try {
    await sql`
      ALTER TABLE rating.reviews
        ADD CONSTRAINT rating_reviews_status_check
        CHECK (status IN ('pending', 'visible', 'hidden', 'deleted'))
    `;
  } catch {
    /* already present */
  }
  await sql`DROP INDEX IF EXISTS rating.rating_reviews_one_active`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS rating_reviews_one_active
      ON rating.reviews (subject_kind, subject_id, reviewer_key)
      WHERE status IN ('pending', 'visible', 'hidden')
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS rating_reviews_pending_idx
      ON rating.reviews (created_at DESC)
      WHERE status = 'pending'
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rating.moderation_events (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id   UUID NOT NULL REFERENCES rating.reviews(id) ON DELETE CASCADE,
      action      TEXT NOT NULL,
      actor       TEXT NOT NULL CHECK (actor IN ('user', 'platform')),
      actor_id    TEXT,
      reason      TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS rating_moderation_review_idx
      ON rating.moderation_events (review_id, created_at DESC)
  `;

  migrated = true;
}
