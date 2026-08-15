/** Browser client for the isolated rating API (`/api/reviews/*`). */

export type ReviewKind = "doctor" | "pharmacy" | "facility";
export type ReviewSort = "recent" | "high" | "low";

export type ReviewSummary = {
  subjectId: string;
  average: number;
  count: number;
  histogram: [number, number, number, number, number];
};

export type ReviewItem = {
  id: string;
  subjectKind: ReviewKind;
  subjectId: string;
  rating: number;
  title: string;
  body: string;
  reviewerName: string;
  createdAt: string;
  updatedAt: string;
  mine: boolean;
  status?: "pending" | "visible";
};

export type ReviewerIdentity = {
  email: string;
  name: string;
};

function reviewerHeaders(who?: ReviewerIdentity | null): Record<string, string> {
  if (!who?.email) return {};
  return {
    "X-Reviewer-Email": who.email,
    "X-Reviewer-Name": who.name || "",
  };
}

async function readJson(res: Response) {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export async function fetchReviewSummaries(kind: ReviewKind, ids: string[]) {
  const clean = [...new Set(ids.filter(Boolean))].slice(0, 80);
  if (!clean.length) return {} as Record<string, ReviewSummary>;
  try {
    const res = await fetch(`/api/reviews/summary?kind=${encodeURIComponent(kind)}&ids=${encodeURIComponent(clean.join(","))}`);
    const body = await readJson(res);
    if (!res.ok) return {};
    const data = Array.isArray(body.data) ? (body.data as ReviewSummary[]) : [];
    const map: Record<string, ReviewSummary> = {};
    for (const row of data) map[row.subjectId] = row;
    return map;
  } catch {
    return {};
  }
}

export async function fetchReviews(opts: {
  kind: ReviewKind;
  id: string;
  page?: number;
  sort?: ReviewSort;
  who?: ReviewerIdentity | null;
}) {
  const params = new URLSearchParams({
    kind: opts.kind,
    id: opts.id,
    page: String(opts.page || 1),
    sort: opts.sort || "recent",
  });
  const res = await fetch(`/api/reviews/list?${params.toString()}`, {
    headers: reviewerHeaders(opts.who),
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(String(body.error || "Could not load reviews."));
  return {
    summary: (body.summary || { subjectId: opts.id, average: 0, count: 0, histogram: [0, 0, 0, 0, 0] }) as ReviewSummary,
    mine: (body.mine as ReviewItem | null) || null,
    data: Array.isArray(body.data) ? (body.data as ReviewItem[]) : [],
    pagination: (body.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }) as {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
  };
}

export async function writeReview(input: {
  kind: ReviewKind;
  subjectId: string;
  rating: number;
  title: string;
  body: string;
  who: ReviewerIdentity;
}) {
  const res = await fetch("/api/reviews/write", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...reviewerHeaders(input.who) },
    body: JSON.stringify({
      kind: input.kind,
      subjectId: input.subjectId,
      rating: input.rating,
      title: input.title,
      body: input.body,
      email: input.who.email,
      name: input.who.name,
    }),
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(String(body.error || "Could not save your review."));
  return body as unknown as ReviewItem;
}

export async function deleteOwnReview(id: string, who: ReviewerIdentity) {
  const res = await fetch(`/api/reviews/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...reviewerHeaders(who) },
    body: JSON.stringify({ email: who.email, name: who.name }),
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(String(body.error || "Could not remove your review."));
}

export async function reportReview(id: string, who: ReviewerIdentity, reason = "") {
  const res = await fetch("/api/reviews/report", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...reviewerHeaders(who) },
    body: JSON.stringify({ id, email: who.email, name: who.name, reason }),
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(String(body.error || "Could not report that review."));
}

/** Future platform console — listings cannot call these. */
export const platformReviewsApi = {
  listPath: "/api/reviews/platform",
  approvePath: (id: string) => `/api/reviews/platform/${id}/approve`,
  hidePath: (id: string) => `/api/reviews/platform/${id}/hide`,
  unhidePath: (id: string) => `/api/reviews/platform/${id}/unhide`,
  deletePath: (id: string) => `/api/reviews/platform/${id}/delete`,
  restorePath: (id: string) => `/api/reviews/platform/${id}/restore`,
  header: "X-Reviews-Platform-Key",
};
