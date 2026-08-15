/** Browser client for the DDA pharmacy registry proxy (`/api/pharmacy/*`). */

export function normalizeRegNo(raw: string): string | null {
  const digits = String(raw).replace(/\D/g, "");
  if (!/^\d{8,16}$/.test(digits)) return null;
  return digits;
}

export type DdaPharmacy = {
  registrationNo: string;
  name: string;
  place: string;
  district: string;
  pranali: string;
};

export type DdaLookup = {
  found: true;
  registrationNo: string;
  nameHint: string;
  district: string;
  place: string;
  pranali: string;
};

async function readJson(res: Response) {
  const body = await res.json().catch(() => ({}));
  return body as Record<string, unknown>;
}

export async function lookupDdaPharmacy(registrationNo: string): Promise<
  { ok: true; data: DdaLookup } | { ok: false; error: string; status: number }
> {
  const n = normalizeRegNo(registrationNo);
  if (!n) {
    return { ok: false, status: 400, error: "Enter a valid DDA registration number." };
  }
  try {
    const res = await fetch(`/api/pharmacy/lookup/${encodeURIComponent(n)}`);
    const body = await readJson(res);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: String(body.error || "Could not look up that registration."),
      };
    }
    return { ok: true, data: body as unknown as DdaLookup };
  } catch {
    return { ok: false, status: 0, error: "Could not reach the pharmacy registry. Try again in a moment." };
  }
}

export async function verifyDdaPharmacyName(
  registrationNo: string,
  nameToken: string,
): Promise<{ ok: true; pharmacy: DdaPharmacy } | { ok: false; error: string; status: number }> {
  const n = normalizeRegNo(registrationNo);
  if (!n) {
    return { ok: false, status: 400, error: "Enter a valid DDA registration number." };
  }
  try {
    const res = await fetch("/api/pharmacy/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationNo: n, nameToken: nameToken.trim() }),
    });
    const body = await readJson(res);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: String(body.error || "Could not verify that registration."),
      };
    }
    return { ok: true, pharmacy: body as unknown as DdaPharmacy };
  } catch {
    return { ok: false, status: 0, error: "Could not reach the pharmacy registry. Try again in a moment." };
  }
}

export async function listDdaPharmacies(opts?: {
  q?: string;
  name?: string;
  district?: string;
  place?: string;
  page?: number;
  limit?: number;
}): Promise<
  | { ok: true; data: DdaPharmacy[]; total: number; page: number; limit: number; totalPages: number }
  | { ok: false; error: string }
> {
  const page = Math.max(1, opts?.page || 1);
  const limit = Math.min(100, Math.max(1, opts?.limit || 20));
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (opts?.q?.trim()) params.set("q", opts.q.trim());
  if (opts?.name?.trim()) params.set("name", opts.name.trim());
  if (opts?.district?.trim()) params.set("district", opts.district.trim());
  if (opts?.place?.trim()) params.set("place", opts.place.trim());
  try {
    const res = await fetch(`/api/pharmacy/list?${params.toString()}`);
    const body = await readJson(res);
    if (!res.ok) {
      return { ok: false, error: String(body.error || "Could not load the pharmacy directory.") };
    }
    const data = Array.isArray(body.data) ? (body.data as DdaPharmacy[]) : [];
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
    return { ok: false, error: "Could not reach the pharmacy registry. Try again in a moment." };
  }
}

export type DdaDistrict = {
  district: string;
  count: number;
};

function parseDistricts(body: Record<string, unknown>): DdaDistrict[] {
  const data = Array.isArray(body.data) ? body.data : [];
  const out: DdaDistrict[] = [];
  for (const row of data) {
    if (typeof row === "string") {
      if (row.trim()) out.push({ district: row.trim(), count: 0 });
      continue;
    }
    if (!row || typeof row !== "object") continue;
    const district = String((row as { district?: unknown }).district ?? "").trim();
    if (!district) continue;
    out.push({ district, count: Number((row as { count?: unknown }).count) || 0 });
  }
  return out;
}

export async function listDdaDistricts(): Promise<DdaDistrict[]> {
  try {
    const res = await fetch("/api/pharmacy/districts");
    const body = await readJson(res);
    return parseDistricts(body);
  } catch {
    return [];
  }
}

export async function searchDdaPharmacies(name: string, page = 1) {
  const q = name.trim();
  if (q.length < 2) return { ok: true as const, data: [] as DdaPharmacy[], total: 0 };
  const res = await listDdaPharmacies({ name: q, page, limit: 8 });
  if (!res.ok) return res;
  return { ok: true as const, data: res.data, total: res.total };
}
