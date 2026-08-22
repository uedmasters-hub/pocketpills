/** Browser client for provider listings (`/api/listings/*`). */

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text };
  }
}

export async function apiSaveListingDraft(ownerId: string, draft: unknown): Promise<boolean> {
  try {
    const res = await fetch(`/api/listings/${encodeURIComponent(ownerId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorType: (draft as { type?: string })?.type,
        draft,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiLoadListing(ownerId: string): Promise<{
  draft: unknown;
  published: unknown;
  status: string;
  publishedId: string | null;
} | null> {
  try {
    const res = await fetch(`/api/listings/${encodeURIComponent(ownerId)}`);
    if (res.status === 404) return null;
    const json = await readJson(res);
    const data = json.data as Record<string, unknown> | undefined;
    if (!res.ok || !data) return null;
    return {
      draft: data.draft,
      published: data.published,
      status: String(data.status ?? "draft"),
      publishedId: data.publishedId ? String(data.publishedId) : null,
    };
  } catch {
    return null;
  }
}

export async function apiPublishListing(ownerId: string, draft: unknown, publishedId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/listings/${encodeURIComponent(ownerId)}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorType: (draft as { type?: string })?.type,
        publishedId,
        draft,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiUnpublishListing(ownerId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/listings/${encodeURIComponent(ownerId)}/unpublish`, {
      method: "POST",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiListPublicListings(): Promise<unknown[]> {
  try {
    const res = await fetch("/api/listings/public");
    const json = await readJson(res);
    return res.ok && Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}
