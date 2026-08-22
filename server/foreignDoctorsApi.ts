import {
  ensureForeignDoctorsSchema,
  foreignDoctorsDatabaseConfigured,
  getForeignDoctor,
  insertForeignDoctor,
  listForeignDoctors,
  updateForeignDoctor,
  type ForeignDoctorRow,
} from "./foreignDoctorsDb.js";

export type ForeignDoctorsRequest = {
  method?: string;
  url?: string;
  body?: unknown;
};

function pathname(url?: string) {
  const raw = (url || "").split("?")[0] || "";
  const marker = "/api/foreign-doctors";
  const idx = raw.indexOf(marker);
  const rest = idx >= 0 ? raw.slice(idx + marker.length) : raw;
  return rest.replace(/\/+$/, "") || "/";
}

function queryOf(url?: string) {
  const q = (url || "").split("?")[1] || "";
  return new URLSearchParams(q);
}

function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

function toClient(row: ForeignDoctorRow) {
  return {
    id: row.id,
    listingId: `fd-${row.id}`,
    name: row.name,
    specialty: row.specialty,
    council: row.council,
    registrationNo: row.registration_no,
    country: row.country,
    imageUrl: row.image_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fieldsFrom(body: Record<string, unknown>) {
  return {
    name: String(body.name ?? ""),
    specialty: String(body.specialty ?? ""),
    council: String(body.council ?? ""),
    registrationNo: String(body.registrationNo ?? body.registration_no ?? ""),
    country: String(body.country ?? ""),
    imageUrl: String(body.imageUrl ?? body.image_url ?? ""),
    createdBy: String(body.createdBy ?? body.created_by ?? ""),
  };
}

export async function handleForeignDoctors(req: ForeignDoctorsRequest): Promise<{ status: number; body: unknown }> {
  if (!foreignDoctorsDatabaseConfigured()) {
    return { status: 503, body: { error: "Foreign doctor database is not configured." } };
  }

  const method = (req.method || "GET").toUpperCase();
  const path = pathname(req.url);
  const body = asRecord(req.body);

  try {
    await ensureForeignDoctorsSchema();

    if (method === "GET" && (path === "/" || path === "/health")) {
      if (path === "/health") return { status: 200, body: { status: "ok", service: "foreign-doctors" } };
      const q = queryOf(req.url).get("q") || "";
      const rows = await listForeignDoctors(q);
      return { status: 200, body: { data: rows.map(toClient) } };
    }

    if (method === "POST" && path === "/") {
      const fields = fieldsFrom(body);
      if (!fields.name.trim()) return { status: 400, body: { error: "Name is required." } };
      const row = await insertForeignDoctor(fields);
      return { status: 201, body: { data: toClient(row) } };
    }

    const idMatch = /^\/([^/]+)$/.exec(path);
    if (idMatch && idMatch[1] !== "health") {
      const id = decodeURIComponent(idMatch[1]).replace(/^fd-/, "");
      if (method === "GET") {
        const row = await getForeignDoctor(id);
        if (!row) return { status: 404, body: { error: "Foreign doctor not found." } };
        return { status: 200, body: { data: toClient(row) } };
      }
      if (method === "PUT" || method === "PATCH") {
        const fields = fieldsFrom(body);
        if (!fields.name.trim()) return { status: 400, body: { error: "Name is required." } };
        const row = await updateForeignDoctor(id, fields);
        if (!row) return { status: 404, body: { error: "Foreign doctor not found." } };
        return { status: 200, body: { data: toClient(row) } };
      }
    }

    return { status: 404, body: { error: "Not found." } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Foreign doctor request failed.";
    return { status: 500, body: { error: message } };
  }
}
