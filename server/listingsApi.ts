import {
  ensureListingsSchema,
  getListingByOwner,
  getPublishedListing,
  listPublishedListings,
  listingsDatabaseConfigured,
  publishListing,
  unpublishListing,
  upsertListingDraft,
} from "./listingsDb.js";

export type ListingsRequest = {
  method?: string;
  url?: string;
  body?: unknown;
};

function pathname(url?: string) {
  const raw = (url || "").split("?")[0] || "";
  const marker = "/api/listings";
  const idx = raw.indexOf(marker);
  const rest = idx >= 0 ? raw.slice(idx + marker.length) : raw;
  return rest.replace(/\/+$/, "") || "/";
}

function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

export async function handleListings(req: ListingsRequest): Promise<{ status: number; body: unknown }> {
  if (!listingsDatabaseConfigured()) {
    return { status: 503, body: { error: "Listings database is not configured." } };
  }

  const method = (req.method || "GET").toUpperCase();
  const path = pathname(req.url);
  const body = asRecord(req.body);

  try {
    await ensureListingsSchema();

    if (method === "GET" && (path === "/" || path === "/health")) {
      return { status: 200, body: { status: "ok", service: "provider-listings" } };
    }

    if (method === "GET" && path === "/public") {
      const rows = await listPublishedListings();
      return {
        status: 200,
        body: { data: rows.map((r) => r.published).filter(Boolean) },
      };
    }

    const publicMatch = /^\/public\/([^/]+)$/.exec(path);
    if (method === "GET" && publicMatch) {
      const row = await getPublishedListing(decodeURIComponent(publicMatch[1]));
      if (!row?.published) return { status: 404, body: { error: "Listing is not published." } };
      return { status: 200, body: { data: row.published } };
    }

    const ownerMatch = /^\/([^/]+)$/.exec(path);
    if (method === "GET" && ownerMatch && ownerMatch[1] !== "public") {
      const row = await getListingByOwner(decodeURIComponent(ownerMatch[1]));
      if (!row) return { status: 404, body: { error: "No listing yet." } };
      return {
        status: 200,
        body: {
          data: {
            draft: row.draft,
            published: row.published,
            status: row.status,
            publishedId: row.published_id,
          },
        },
      };
    }

    if (method === "PUT" && ownerMatch && ownerMatch[1] !== "public") {
      const ownerId = decodeURIComponent(ownerMatch[1]);
      const draft = body.draft ?? body;
      const vendorType = String(body.vendorType ?? (draft as { type?: string }).type ?? "doctor");
      await upsertListingDraft(ownerId, vendorType, draft);
      return { status: 200, body: { ok: true } };
    }

    const publishMatch = /^\/([^/]+)\/publish$/.exec(path);
    if (method === "POST" && publishMatch) {
      const ownerId = decodeURIComponent(publishMatch[1]);
      const payload = body.draft ?? body;
      const publishedId = String(body.publishedId ?? (payload as { publishedId?: string }).publishedId ?? "");
      const vendorType = String(body.vendorType ?? (payload as { type?: string }).type ?? "doctor");
      if (!publishedId) return { status: 400, body: { error: "publishedId is required." } };
      await publishListing(ownerId, vendorType, publishedId, payload);
      return { status: 200, body: { ok: true, publishedId } };
    }

    const unpublishMatch = /^\/([^/]+)\/unpublish$/.exec(path);
    if (method === "POST" && unpublishMatch) {
      await unpublishListing(decodeURIComponent(unpublishMatch[1]));
      return { status: 200, body: { ok: true } };
    }

    return { status: 404, body: { error: "Not found." } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Listings request failed.";
    return { status: 500, body: { error: message } };
  }
}
