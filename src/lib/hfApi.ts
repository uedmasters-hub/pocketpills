/** Browser client for the health facility registry proxy (`/api/facility/*`). */

export function normalizeHfCode(raw: string): string | null {
  const digits = String(raw).replace(/\D/g, "");
  if (!/^\d{8,12}$/.test(digits)) return null;
  return digits;
}

export type HfFacility = {
  hfCode: string;
  name: string;
  district: string;
  facilityLevel: string;
};

export type HfLookup = {
  found: true;
  hfCode: string;
  nameHint: string;
  district: string;
  facilityLevel: string;
};

export type HfDistrict = {
  district: string;
  count: number;
};

async function readJson(res: Response) {
  const body = await res.json().catch(() => ({}));
  return body as Record<string, unknown>;
}

export async function lookupHfFacility(hfCode: string): Promise<
  { ok: true; data: HfLookup } | { ok: false; error: string; status: number }
> {
  const n = normalizeHfCode(hfCode);
  if (!n) {
    return { ok: false, status: 400, error: "Enter a valid health facility code." };
  }
  try {
    const res = await fetch(`/api/facility/lookup?hf=${encodeURIComponent(n)}`);
    const body = await readJson(res);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: String(body.error || "Could not look up that facility."),
      };
    }
    return { ok: true, data: body as unknown as HfLookup };
  } catch {
    return { ok: false, status: 0, error: "Could not reach the facility registry. Try again in a moment." };
  }
}

export async function verifyHfFacilityName(
  hfCode: string,
  nameToken: string,
): Promise<{ ok: true; facility: HfFacility } | { ok: false; error: string; status: number }> {
  const n = normalizeHfCode(hfCode);
  if (!n) {
    return { ok: false, status: 400, error: "Enter a valid health facility code." };
  }
  try {
    const res = await fetch("/api/facility/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hfCode: n, nameToken: nameToken.trim() }),
    });
    const body = await readJson(res);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: String(body.error || "Could not verify that facility."),
      };
    }
    return { ok: true, facility: body as unknown as HfFacility };
  } catch {
    return { ok: false, status: 0, error: "Could not reach the facility registry. Try again in a moment." };
  }
}

export async function listHfFacilities(opts?: {
  q?: string;
  name?: string;
  district?: string;
  facilityLevel?: string;
  page?: number;
  limit?: number;
}): Promise<
  | { ok: true; data: HfFacility[]; total: number; page: number; limit: number; totalPages: number }
  | { ok: false; error: string }
> {
  const page = Math.max(1, opts?.page || 1);
  const limit = Math.min(100, Math.max(1, opts?.limit || 20));
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (opts?.q?.trim()) params.set("q", opts.q.trim());
  if (opts?.name?.trim()) params.set("name", opts.name.trim());
  if (opts?.district?.trim()) params.set("district", opts.district.trim());
  if (opts?.facilityLevel?.trim()) params.set("facilityLevel", opts.facilityLevel.trim());
  try {
    const res = await fetch(`/api/facility/list?${params.toString()}`);
    const body = await readJson(res);
    if (!res.ok) {
      return { ok: false, error: String(body.error || "Could not load the facility directory.") };
    }
    const data = Array.isArray(body.data) ? (body.data as HfFacility[]) : [];
    const pagination = (body.pagination || {}) as {
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    };
    const total = Number(pagination.total) || data.length;
    const totalPages = Number(pagination.totalPages) || Math.max(1, Math.ceil(total / limit));
    return {
      ok: true,
      data,
      total,
      page: Number(pagination.page) || page,
      limit: Number(pagination.limit) || limit,
      totalPages,
    };
  } catch {
    return { ok: false, error: "Could not reach the facility registry. Try again in a moment." };
  }
}

export async function listHfDistricts(): Promise<HfDistrict[]> {
  try {
    const res = await fetch("/api/facility/districts");
    const body = await readJson(res);
    const data = Array.isArray(body.data) ? body.data : [];
    return data
      .map((row) => {
        if (typeof row === "string") return { district: row, count: 0 };
        const district = String((row as { district?: string }).district ?? "").trim();
        if (!district) return null;
        return { district, count: Number((row as { count?: number }).count) || 0 };
      })
      .filter((d): d is HfDistrict => Boolean(d));
  } catch {
    return [];
  }
}

export async function searchHfFacilities(name: string, page = 1) {
  const q = name.trim();
  if (q.length < 2) return { ok: true as const, data: [] as HfFacility[], total: 0 };
  const res = await listHfFacilities({ name: q, page, limit: 8 });
  if (!res.ok) return res;
  return { ok: true as const, data: res.data, total: res.total };
}
