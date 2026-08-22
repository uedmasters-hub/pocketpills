/** Browser client for the foreign-doctor registry (`/api/foreign-doctors/*`). */

export type ForeignDoctorRecord = {
  id: string;
  listingId: string;
  name: string;
  specialty: string;
  council: string;
  registrationNo: string;
  country: string;
  imageUrl: string;
  createdBy?: string | null;
};

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text };
  }
}

function asRecord(raw: unknown): ForeignDoctorRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    listingId: String(r.listingId ?? `fd-${id}`),
    name: String(r.name ?? ""),
    specialty: String(r.specialty ?? ""),
    council: String(r.council ?? ""),
    registrationNo: String(r.registrationNo ?? ""),
    country: String(r.country ?? ""),
    imageUrl: String(r.imageUrl ?? ""),
    createdBy: r.createdBy ? String(r.createdBy) : null,
  };
}

export async function apiListForeignDoctors(q = ""): Promise<ForeignDoctorRecord[]> {
  try {
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    const res = await fetch(`/api/foreign-doctors${params}`);
    const json = await readJson(res);
    if (!res.ok || !Array.isArray(json.data)) return [];
    return json.data.map(asRecord).filter((r): r is ForeignDoctorRecord => Boolean(r));
  } catch {
    return [];
  }
}

export async function apiCreateForeignDoctor(input: {
  name: string;
  specialty?: string;
  council?: string;
  registrationNo?: string;
  country?: string;
  imageUrl?: string;
  createdBy?: string;
}): Promise<ForeignDoctorRecord | null> {
  try {
    const res = await fetch("/api/foreign-doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await readJson(res);
    if (!res.ok) return null;
    return asRecord(json.data);
  } catch {
    return null;
  }
}

export async function apiUpdateForeignDoctor(
  id: string,
  input: {
    name: string;
    specialty?: string;
    council?: string;
    registrationNo?: string;
    country?: string;
    imageUrl?: string;
  },
): Promise<ForeignDoctorRecord | null> {
  try {
    const res = await fetch(`/api/foreign-doctors/${encodeURIComponent(id.replace(/^fd-/, ""))}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await readJson(res);
    if (!res.ok) return null;
    return asRecord(json.data);
  } catch {
    return null;
  }
}

export function foreignDoctorIdFromListing(listingId?: string): string | null {
  if (!listingId?.startsWith("fd-")) return null;
  const id = listingId.slice(3).trim();
  return id || null;
}
