-- Isolated rating database (REVIEWS_DATABASE_URL).
-- Tables live in schema `rating` so they stay separate from site-access tables
-- even if this connection temporarily shares a Neon project.

CREATE SCHEMA IF NOT EXISTS rating;

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
);

CREATE UNIQUE INDEX IF NOT EXISTS rating_reviews_one_active
  ON rating.reviews (subject_kind, subject_id, reviewer_key)
  WHERE status IN ('pending', 'visible', 'hidden');

CREATE INDEX IF NOT EXISTS rating_reviews_subject_visible_idx
  ON rating.reviews (subject_kind, subject_id, created_at DESC)
  WHERE status = 'visible';

CREATE INDEX IF NOT EXISTS rating_reviews_status_idx
  ON rating.reviews (status, created_at DESC);

CREATE INDEX IF NOT EXISTS rating_reviews_pending_idx
  ON rating.reviews (created_at DESC)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS rating.moderation_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES rating.reviews(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  actor       TEXT NOT NULL CHECK (actor IN ('user', 'platform')),
  actor_id    TEXT,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rating_moderation_review_idx
  ON rating.moderation_events (review_id, created_at DESC);
