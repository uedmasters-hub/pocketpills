import {
  getSummaries,
  listVisibleReviews,
  parseKind,
  parseSort,
  platformList,
  platformModerate,
  reviewsDatabaseConfigured,
  upsertReview,
  userDeleteReview,
  userReportReview,
  type Reviewer,
  type SubjectKind,
} from "./reviewsStore.js";

export type ReviewsRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

function header(req: ReviewsRequest, name: string) {
  const raw = req.headers[name] ?? req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0] || "";
  return raw || "";
}

function qstr(query: ReviewsRequest["query"], key: string) {
  const v = query?.[key];
  return Array.isArray(v) ? v[0] : v;
}

function pathname(url?: string) {
  const raw = (url || "").split("?")[0] || "";
  const marker = "/api/reviews";
  const idx = raw.indexOf(marker);
  const rest = idx >= 0 ? raw.slice(idx + marker.length) : raw;
  return rest.replace(/\/+$/, "") || "/";
}

function reviewerFrom(req: ReviewsRequest, body?: Record<string, unknown>): Reviewer | null {
  const email = String(body?.email ?? header(req, "x-reviewer-email") ?? "").trim();
  if (!email.includes("@")) return null;
  const name = String(body?.name ?? header(req, "x-reviewer-name") ?? "").trim();
  return { email, name };
}

function platformKey(req: ReviewsRequest) {
  return header(req, "x-reviews-platform-key") || header(req, "x-platform-key");
}

export async function handleReviews(req: ReviewsRequest): Promise<{ status: number; body: unknown }> {
  if (!reviewsDatabaseConfigured()) {
    return { status: 503, body: { error: "Reviews database is not configured." } };
  }

  const method = (req.method || "GET").toUpperCase();
  const path = pathname(req.url);
  const query = req.query || {};
  const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};

  try {
    if (method === "GET" && (path === "/" || path === "/health")) {
      return { status: 200, body: { status: "ok", service: "rating-reviews" } };
    }

    if (method === "GET" && path === "/summary") {
      const kind = parseKind(String(qstr(query, "kind") || ""));
      if (!kind) return { status: 400, body: { error: "kind is required." } };
      const ids = String(qstr(query, "ids") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const data = await getSummaries(kind, ids);
      return { status: 200, body: { data } };
    }

    if (method === "GET" && path === "/platform") {
      return platformList({
        key: platformKey(req),
        kind: qstr(query, "kind"),
        subjectId: qstr(query, "id") || qstr(query, "subjectId"),
        status: qstr(query, "status"),
        page: Number(qstr(query, "page") || 1) || 1,
        limit: Number(qstr(query, "limit") || 20) || 20,
      });
    }

    const platformAction = /^\/platform\/([^/]+)\/(approve|hide|unhide|delete|restore)$/.exec(path);
    if (method === "POST" && platformAction) {
      return platformModerate({
        key: platformKey(req),
        id: platformAction[1],
        action: platformAction[2] as "approve" | "hide" | "unhide" | "delete" | "restore",
        reason: String(body.reason ?? ""),
      });
    }

    if (method === "GET" && path === "/list") {
      const kind = parseKind(String(qstr(query, "kind") || ""));
      const subjectId = String(qstr(query, "id") || "").trim();
      if (!kind || !subjectId) return { status: 400, body: { error: "kind and id are required." } };
      const result = await listVisibleReviews({
        kind,
        subjectId,
        page: Number(qstr(query, "page") || 1) || 1,
        limit: Number(qstr(query, "limit") || 10) || 10,
        sort: parseSort(qstr(query, "sort")),
        reviewer: reviewerFrom(req),
      });
      return { status: 200, body: result };
    }

    if (method === "POST" && (path === "/" || path === "/write")) {
      const kind = parseKind(String(body.kind || ""));
      const subjectId = String(body.subjectId || body.id || "").trim();
      const reviewer = reviewerFrom(req, body);
      if (!kind || !subjectId) return { status: 400, body: { error: "kind and subjectId are required." } };
      if (!reviewer) return { status: 401, body: { error: "Sign in as a patient to leave a review." } };
      return upsertReview({
        kind,
        subjectId,
        rating: Number(body.rating),
        title: String(body.title ?? ""),
        body: String(body.body ?? ""),
        reviewer,
      });
    }

    const del = /^\/([^/]+)$/.exec(path);
    if (method === "DELETE" && del) {
      const reviewer = reviewerFrom(req, body);
      if (!reviewer) return { status: 401, body: { error: "Sign in to remove your review." } };
      return userDeleteReview(del[1], reviewer);
    }

    if (method === "POST" && path === "/report") {
      const reviewer = reviewerFrom(req, body);
      if (!reviewer) return { status: 401, body: { error: "Sign in to report a review." } };
      const id = String(body.id || qstr(query, "id") || "").trim();
      if (!id) return { status: 400, body: { error: "Review id is required." } };
      return userReportReview(id, reviewer, String(body.reason ?? ""));
    }

    const report = /^\/([^/]+)\/report$/.exec(path);
    if (method === "POST" && report) {
      const reviewer = reviewerFrom(req, body);
      if (!reviewer) return { status: 401, body: { error: "Sign in to report a review." } };
      return userReportReview(report[1], reviewer, String(body.reason ?? ""));
    }

    return { status: 404, body: { error: "Not found" } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reviews service failed.";
    return { status: 500, body: { error: message } };
  }
}

export type { SubjectKind };
