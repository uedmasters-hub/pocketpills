/** Browser client for the NMC registry proxy (`/api/nmc/*`). */

export function normalizeNmcNumber(raw: string): string | null {
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  const n = digits.replace(/^0+/, "");
  if (!n || n === "0" || !/^\d{1,8}$/.test(n)) return null;
  return n;
}

export type NmcDoctor = {
  nmcNumber: string;
  name: string;
  address: string;
  gender: string;
  degree: string;
};

export type NmcLookup = {
  found: true;
  nmcNumber: string;
  cityHint: string;
  degree: string;
};

export type NmcSearchRow = NmcDoctor;

async function readJson(res: Response) {
  const body = await res.json().catch(() => ({}));
  return body as Record<string, unknown>;
}

export async function lookupNmc(nmcNumber: string): Promise<
  { ok: true; data: NmcLookup } | { ok: false; error: string; status: number }
> {
  const nmc = normalizeNmcNumber(nmcNumber);
  if (!nmc) {
    return { ok: false, status: 400, error: "Enter a valid NMC registration number." };
  }
  try {
    const res = await fetch(`/api/nmc/lookup/${encodeURIComponent(nmc)}`);
    const body = await readJson(res);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: String(body.error || "Could not look up that NMC number."),
      };
    }
    return { ok: true, data: body as unknown as NmcLookup };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Could not reach the NMC registry. Try again in a moment.",
    };
  }
}

export async function verifyNmcLastName(
  nmcNumber: string,
  lastName: string,
): Promise<{ ok: true; doctor: NmcDoctor } | { ok: false; error: string; status: number }> {
  const nmc = normalizeNmcNumber(nmcNumber);
  if (!nmc) {
    return { ok: false, status: 400, error: "Enter a valid NMC registration number." };
  }
  try {
    const res = await fetch("/api/nmc/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nmcNumber: nmc, lastName: lastName.trim() }),
    });
    const body = await readJson(res);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: String(body.error || "Could not verify that registration."),
      };
    }
    return { ok: true, doctor: body as unknown as NmcDoctor };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Could not reach the NMC registry. Try again in a moment.",
    };
  }
}

export async function listNmcDoctors(opts?: {
  q?: string;
  name?: string;
  address?: string;
  page?: number;
  limit?: number;
}): Promise<
  | { ok: true; data: NmcSearchRow[]; total: number; page: number; limit: number; totalPages: number }
  | { ok: false; error: string }
> {
  const page = Math.max(1, opts?.page || 1);
  const limit = Math.min(100, Math.max(1, opts?.limit || 24));
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const q = opts?.q?.trim();
  const name = opts?.name?.trim();
  const address = opts?.address?.trim();
  if (q) params.set("q", q);
  if (name) params.set("name", name);
  if (address) params.set("address", address);
  try {
    const res = await fetch(`/api/nmc/doctors?${params.toString()}`);
    const body = await readJson(res);
    if (!res.ok) {
      return { ok: false, error: String(body.error || "Could not load the doctor directory.") };
    }
    const data = Array.isArray(body.data) ? (body.data as NmcSearchRow[]) : [];
    const pagination = (body.pagination || {}) as { total?: number; page?: number; limit?: number; totalPages?: number };
    const total = Number(pagination.total) || data.length;
    const totalPages = Number(pagination.totalPages) || Math.max(1, Math.ceil(total / limit));
    return { ok: true, data, total, page: Number(pagination.page) || page, limit: Number(pagination.limit) || limit, totalPages };
  } catch {
    return { ok: false, error: "Could not reach the NMC registry. Try again in a moment." };
  }
}

export async function searchNmcDoctors(name: string, page = 1): Promise<
  { ok: true; data: NmcSearchRow[]; total: number } | { ok: false; error: string }
> {
  const q = name.trim();
  if (q.length < 2) return { ok: true, data: [], total: 0 };
  const res = await listNmcDoctors({ name: q, page, limit: 8 });
  if (!res.ok) return res;
  return { ok: true, data: res.data, total: res.total };
}
