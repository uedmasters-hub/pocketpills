import { createHash } from "node:crypto";
import { ensureReviewsSchema, getReviewsSql, reviewsDatabaseConfigured } from "./reviewsDb.js";

export type SubjectKind = "doctor" | "pharmacy" | "facility";
export type ReviewStatus = "pending" | "visible" | "hidden" | "deleted";
export type ReviewSort = "recent" | "high" | "low";

export type ReviewPublic = {
  id: string;
  subjectKind: SubjectKind;
  subjectId: string;
  rating: number;
  title: string;
  body: string;
  reviewerName: string;
  createdAt: string;
  updatedAt: string;
  mine: boolean;
  status: "pending" | "visible";
};

export type ReviewSummary = {
  subjectId: string;
  average: number;
  count: number;
  histogram: [number, number, number, number, number];
};

export type Reviewer = {
  email: string;
  name: string;
};

const TITLE_MAX = 80;
const BODY_MIN = 20;
const BODY_MAX = 2000;

export function reviewerKeyFromEmail(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export function displayReviewerName(name: string, email: string) {
  const n = name.replace(/\s+/g, " ").trim();
  if (n.length >= 2) {
    const parts = n.split(" ");
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
  }
  const local = email.split("@")[0] || "Member";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function emptySummary(subjectId: string): ReviewSummary {
  return { subjectId, average: 0, count: 0, histogram: [0, 0, 0, 0, 0] };
}

function asPublic(
  row: {
    id: string;
    subject_kind: string;
    subject_id: string;
    rating: number;
    title: string | null;
    body: string;
    reviewer_name: string;
    created_at: string;
    updated_at: string;
    reviewer_key?: string;
    status?: string;
  },
  mineKey?: string,
): ReviewPublic {
  const status = row.status === "pending" ? "pending" : "visible";
  return {
    id: row.id,
    subjectKind: row.subject_kind as SubjectKind,
    subjectId: row.subject_id,
    rating: Number(row.rating),
    title: String(row.title || "").trim(),
    body: row.body,
    reviewerName: row.reviewer_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mine: Boolean(mineKey && row.reviewer_key === mineKey),
    status,
  };
}

export function parseKind(raw: string): SubjectKind | null {
  if (raw === "doctor" || raw === "pharmacy" || raw === "facility") return raw;
  return null;
}

export function parseSort(raw: string | undefined): ReviewSort {
  if (raw === "high" || raw === "low") return raw;
  return "recent";
}

function clampRating(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

export async function getSummaries(kind: SubjectKind, ids: string[]): Promise<ReviewSummary[]> {
  await ensureReviewsSchema();
  const sql = getReviewsSql();
  const clean = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))].slice(0, 80);
  if (!clean.length) return [];
  const rows = await sql`
    SELECT
      subject_id,
      COUNT(*)::int AS count,
      COALESCE(AVG(rating), 0)::float AS average,
      COUNT(*) FILTER (WHERE rating = 1)::int AS r1,
      COUNT(*) FILTER (WHERE rating = 2)::int AS r2,
      COUNT(*) FILTER (WHERE rating = 3)::int AS r3,
      COUNT(*) FILTER (WHERE rating = 4)::int AS r4,
      COUNT(*) FILTER (WHERE rating = 5)::int AS r5
    FROM rating.reviews
    WHERE subject_kind = ${kind}
      AND subject_id = ANY(${clean})
      AND status = 'visible'
    GROUP BY subject_id
  `;
  const byId = new Map<string, ReviewSummary>();
  for (const row of rows as Record<string, unknown>[]) {
    const subjectId = String(row.subject_id);
    byId.set(subjectId, {
      subjectId,
      average: Math.round(Number(row.average) * 10) / 10,
      count: Number(row.count) || 0,
      histogram: [
        Number(row.r1) || 0,
        Number(row.r2) || 0,
        Number(row.r3) || 0,
        Number(row.r4) || 0,
        Number(row.r5) || 0,
      ],
    });
  }
  return clean.map((id) => byId.get(id) ?? emptySummary(id));
}

export async function listVisibleReviews(opts: {
  kind: SubjectKind;
  subjectId: string;
  page?: number;
  limit?: number;
  sort?: ReviewSort;
  reviewer?: Reviewer | null;
}) {
  await ensureReviewsSchema();
  const sql = getReviewsSql();
  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(30, Math.max(1, opts.limit || 10));
  const offset = (page - 1) * limit;
  const mineKey = opts.reviewer ? reviewerKeyFromEmail(opts.reviewer.email) : "";
  const summaries = await getSummaries(opts.kind, [opts.subjectId]);
  const summary = summaries[0] ?? emptySummary(opts.subjectId);

  const rows =
    opts.sort === "high"
      ? await sql`
          SELECT id, subject_kind, subject_id, rating, title, body, reviewer_name, reviewer_key, created_at, updated_at, status
          FROM rating.reviews
          WHERE subject_kind = ${opts.kind} AND subject_id = ${opts.subjectId} AND status = 'visible'
          ORDER BY rating DESC, created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : opts.sort === "low"
        ? await sql`
            SELECT id, subject_kind, subject_id, rating, title, body, reviewer_name, reviewer_key, created_at, updated_at, status
            FROM rating.reviews
            WHERE subject_kind = ${opts.kind} AND subject_id = ${opts.subjectId} AND status = 'visible'
            ORDER BY rating ASC, created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : await sql`
            SELECT id, subject_kind, subject_id, rating, title, body, reviewer_name, reviewer_key, created_at, updated_at, status
            FROM rating.reviews
            WHERE subject_kind = ${opts.kind} AND subject_id = ${opts.subjectId} AND status = 'visible'
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `;

  let mine: ReviewPublic | null = null;
  if (mineKey) {
    const own = await sql`
      SELECT id, subject_kind, subject_id, rating, title, body, reviewer_name, reviewer_key, created_at, updated_at, status
      FROM rating.reviews
      WHERE subject_kind = ${opts.kind}
        AND subject_id = ${opts.subjectId}
        AND reviewer_key = ${mineKey}
        AND status IN ('visible', 'pending')
      LIMIT 1
    `;
    if (own[0]) mine = asPublic(own[0] as never, mineKey);
  }

  const publicRows = (rows as never[]).map((row) => asPublic(row, mineKey));
  const data =
    mine && mine.status === "pending" && page === 1
      ? [mine, ...publicRows.filter((row) => row.id !== mine.id)]
      : publicRows;

  return {
    summary,
    mine,
    data,
    pagination: {
      page,
      limit,
      total: summary.count,
      totalPages: Math.max(1, Math.ceil(summary.count / limit) || 1),
    },
  };
}

export async function upsertReview(input: {
  kind: SubjectKind;
  subjectId: string;
  rating: number;
  title?: string;
  body: string;
  reviewer: Reviewer;
}) {
  const rating = clampRating(input.rating);
  if (!rating) return { status: 400 as const, body: { error: "Choose a rating from 1 to 5 stars." } };
  const body = String(input.body || "").replace(/\s+/g, " ").trim();
  if (body.length < BODY_MIN) {
    return {
      status: 400 as const,
      body: { error: `Write at least ${BODY_MIN} characters so other patients can understand your experience.` },
    };
  }
  if (body.length > BODY_MAX) {
    return { status: 400 as const, body: { error: `Keep your review under ${BODY_MAX} characters.` } };
  }
  const title = String(input.title || "").replace(/\s+/g, " ").trim().slice(0, TITLE_MAX);
  const email = input.reviewer.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 400 as const, body: { error: "Sign in with a valid email to leave a review." } };
  }
  const key = reviewerKeyFromEmail(email);
  const name = displayReviewerName(input.reviewer.name, email);
  const subjectId = String(input.subjectId || "").trim();
  if (!subjectId) return { status: 400 as const, body: { error: "Missing listing." } };

  await ensureReviewsSchema();
  const sql = getReviewsSql();

  const existing = await sql`
    SELECT id, status FROM rating.reviews
    WHERE subject_kind = ${input.kind}
      AND subject_id = ${subjectId}
      AND reviewer_key = ${key}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const cur = existing[0] as { id: string; status: ReviewStatus } | undefined;

  if (cur && cur.status === "hidden") {
    return {
      status: 403 as const,
      body: { error: "This review is under platform review and cannot be edited." },
    };
  }

  if (cur && (cur.status === "visible" || cur.status === "pending")) {
    const rows = await sql`
      UPDATE rating.reviews
      SET rating = ${rating},
          title = ${title || null},
          body = ${body},
          reviewer_name = ${name},
          status = 'pending',
          updated_at = now()
      WHERE id = ${cur.id}
      RETURNING id, subject_kind, subject_id, rating, title, body, reviewer_name, reviewer_key, created_at, updated_at, status
    `;
    await sql`
      INSERT INTO rating.moderation_events (review_id, action, actor, actor_id)
      VALUES (${cur.id}, ${cur.status === "visible" ? "user_edit_resubmit" : "user_edit"}, 'user', ${key})
    `;
    return { status: 200 as const, body: asPublic(rows[0] as never, key) };
  }

  const rows = await sql`
    INSERT INTO rating.reviews (
      subject_kind, subject_id, rating, title, body, reviewer_key, reviewer_name, reviewer_email, status
    )
    VALUES (
      ${input.kind}, ${subjectId}, ${rating}, ${title || null}, ${body}, ${key}, ${name}, ${email}, 'pending'
    )
    RETURNING id, subject_kind, subject_id, rating, title, body, reviewer_name, reviewer_key, created_at, updated_at, status
  `;
  const created = rows[0] as { id: string };
  await sql`
    INSERT INTO rating.moderation_events (review_id, action, actor, actor_id)
    VALUES (${created.id}, 'user_create', 'user', ${key})
  `;
  return { status: 201 as const, body: asPublic(rows[0] as never, key) };
}

export async function userDeleteReview(id: string, reviewer: Reviewer) {
  await ensureReviewsSchema();
  const sql = getReviewsSql();
  const key = reviewerKeyFromEmail(reviewer.email);
  const rows = await sql`
    UPDATE rating.reviews
    SET status = 'deleted', updated_at = now(), moderated_at = now(), moderated_by = 'user'
    WHERE id = ${id}
      AND reviewer_key = ${key}
      AND status IN ('pending', 'visible', 'hidden')
    RETURNING id
  `;
  if (!rows[0]) return { status: 404 as const, body: { error: "Review not found." } };
  await sql`
    INSERT INTO rating.moderation_events (review_id, action, actor, actor_id)
    VALUES (${id}, 'user_delete', 'user', ${key})
  `;
  return { status: 200 as const, body: { ok: true } };
}

export async function userReportReview(id: string, reviewer: Reviewer, reason: string) {
  await ensureReviewsSchema();
  const sql = getReviewsSql();
  const key = reviewerKeyFromEmail(reviewer.email);
  const found = await sql`
    SELECT id FROM rating.reviews WHERE id = ${id} AND status = 'visible' LIMIT 1
  `;
  if (!found[0]) return { status: 404 as const, body: { error: "Review not found." } };
  await sql`
    INSERT INTO rating.moderation_events (review_id, action, actor, actor_id, reason)
    VALUES (${id}, 'user_report', 'user', ${key}, ${reason.trim().slice(0, 400) || null})
  `;
  return { status: 200 as const, body: { ok: true } };
}

function platformKeyOk(header: string) {
  const expected = process.env.REVIEWS_PLATFORM_KEY || "";
  return Boolean(expected) && header === expected;
}

export async function platformList(opts: {
  key: string;
  kind?: string;
  subjectId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  if (!platformKeyOk(opts.key)) return { status: 401 as const, body: { error: "Platform key required." } };
  await ensureReviewsSchema();
  const sql = getReviewsSql();
  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(50, Math.max(1, opts.limit || 20));
  const offset = (page - 1) * limit;
  const kind = opts.kind ? parseKind(opts.kind) : null;
  const status =
    opts.status === "pending" ||
    opts.status === "hidden" ||
    opts.status === "deleted" ||
    opts.status === "visible"
      ? opts.status
      : null;
  const subjectId = opts.subjectId?.trim() || null;

  const rows = await sql`
    SELECT id, subject_kind, subject_id, rating, title, body, reviewer_name, reviewer_email, status,
           hidden_reason, moderated_at, moderated_by, created_at, updated_at
    FROM rating.reviews
    WHERE (${kind}::text IS NULL OR subject_kind = ${kind})
      AND (${subjectId}::text IS NULL OR subject_id = ${subjectId})
      AND (${status}::text IS NULL OR status = ${status})
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countRows = await sql`
    SELECT COUNT(*)::int AS total
    FROM rating.reviews
    WHERE (${kind}::text IS NULL OR subject_kind = ${kind})
      AND (${subjectId}::text IS NULL OR subject_id = ${subjectId})
      AND (${status}::text IS NULL OR status = ${status})
  `;
  const total = Number((countRows[0] as { total: number })?.total) || 0;
  return {
    status: 200 as const,
    body: {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit) || 1) },
    },
  };
}

export async function platformModerate(opts: {
  key: string;
  id: string;
  action: "approve" | "hide" | "unhide" | "delete" | "restore";
  reason?: string;
}) {
  if (!platformKeyOk(opts.key)) return { status: 401 as const, body: { error: "Platform key required." } };
  await ensureReviewsSchema();
  const sql = getReviewsSql();
  const reason = String(opts.reason || "").trim().slice(0, 400) || null;
  let next: ReviewStatus | null = null;
  if (opts.action === "approve" || opts.action === "unhide") next = "visible";
  if (opts.action === "hide") next = "hidden";
  if (opts.action === "delete") next = "deleted";
  if (opts.action === "restore") next = "pending";
  if (!next) return { status: 400 as const, body: { error: "Unknown moderation action." } };

  const rows = await sql`
    UPDATE rating.reviews
    SET status = ${next},
        hidden_reason = ${opts.action === "hide" ? reason : null},
        moderated_at = now(),
        moderated_by = 'platform',
        updated_at = now()
    WHERE id = ${opts.id}
    RETURNING id, status
  `;
  if (!rows[0]) return { status: 404 as const, body: { error: "Review not found." } };
  await sql`
    INSERT INTO rating.moderation_events (review_id, action, actor, actor_id, reason)
    VALUES (${opts.id}, ${`platform_${opts.action}`}, 'platform', 'platform', ${reason})
  `;
  return { status: 200 as const, body: rows[0] };
}

export { reviewsDatabaseConfigured };
