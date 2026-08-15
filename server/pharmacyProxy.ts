/**
 * DDA pharmacy registry for Express + Vercel.
 * Uses bundled JSON; optional remote pharmacy_api via DDA_API_KEY.
 */

import path from "node:path";
import { config as loadEnv } from "dotenv";
import {
  distinctiveNameTokens,
  getLocalPharmacy,
  listLocalDistricts,
  localPharmacyRegistryAvailable,
  normalizeRegNo,
  pharmacyNameMatches,
  searchLocalPharmacies,
  type DdaPharmacy,
} from "./pharmacyRegistry.js";

loadEnv({ path: path.resolve(process.cwd(), "pharmacy_api/.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const DDA_BASE = (process.env.PHARMACY_API_URL || process.env.DDA_API_URL || "http://localhost:8000").replace(
  /\/$/,
  "",
);
const DDA_KEY = process.env.DDA_API_KEY || "";
const PREFER_REMOTE = Boolean(
  (process.env.PHARMACY_API_URL || process.env.DDA_API_URL) &&
    !/localhost|127\.0\.0\.1/i.test(process.env.PHARMACY_API_URL || process.env.DDA_API_URL || ""),
);

export type { DdaPharmacy };

export type DdaLookup = {
  found: true;
  registrationNo: string;
  nameHint: string;
  district: string;
  place: string;
  pranali: string;
};

function useLocal() {
  return !PREFER_REMOTE && localPharmacyRegistryAvailable();
}

function asPharmacy(body: unknown, fallback?: string): DdaPharmacy {
  const d = (body || {}) as Record<string, unknown>;
  return {
    registrationNo: String(d.registrationNo ?? d["Registration No"] ?? fallback ?? "").replace(/\D/g, ""),
    name: String(d.name ?? d["Pharmacy Name"] ?? "").trim(),
    place: String(d.place ?? d.Place ?? "").trim(),
    district: String(d.district ?? d.District ?? "").trim(),
    pranali: String(d.pranali ?? d.Pranali ?? "").trim(),
  };
}

function lookupBody(p: DdaPharmacy): DdaLookup {
  const tokens = distinctiveNameTokens(p.name);
  return {
    found: true,
    registrationNo: p.registrationNo,
    nameHint: tokens[0] ? `${tokens[0].charAt(0).toUpperCase()}•••` : "•••",
    district: p.district,
    place: p.place,
    pranali: p.pranali,
  };
}

async function ddaFetch(pathname: string): Promise<{ status: number; body: unknown }> {
  if (!DDA_KEY) {
    return { status: 500, body: { error: "DDA API key is not configured" } };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${DDA_BASE}${pathname}`, {
      headers: { "X-API-Key": DDA_KEY, Accept: "application/json" },
      signal: ctrl.signal,
    });
    const body = await res.json().catch(() => ({ error: "Invalid pharmacy API response" }));
    return { status: res.status, body };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      status: 503,
      body: {
        error: aborted ? "Pharmacy registry timed out. Try again." : "Pharmacy registry is unavailable.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function remoteOrMissing(pathname: string) {
  if (process.env.VERCEL && !PREFER_REMOTE) {
    return { status: 503, body: { error: "Pharmacy registry data is missing from this deployment." } };
  }
  return ddaFetch(pathname);
}

export async function lookupPharmacy(registrationNo: string) {
  const n = normalizeRegNo(registrationNo);
  if (!n) {
    return { status: 400, body: { error: "Enter a valid DDA registration number." } };
  }
  if (useLocal()) {
    const p = getLocalPharmacy(n);
    if (!p) {
      return { status: 404, body: { error: "No pharmacy registration found for that number.", registrationNo: n } };
    }
    return { status: 200, body: lookupBody(p) };
  }
  const result = await remoteOrMissing(`/api/pharmacies?registration_no=${encodeURIComponent(n)}&limit=1`);
  if (result.status !== 200) return result;
  const data = Array.isArray((result.body as { data?: unknown }).data)
    ? ((result.body as { data: unknown[] }).data)
    : [];
  if (!data.length) {
    return { status: 404, body: { error: "No pharmacy registration found for that number.", registrationNo: n } };
  }
  return { status: 200, body: lookupBody(asPharmacy(data[0], n)) };
}

export async function verifyPharmacy(registrationNo: string, nameToken: string) {
  const n = normalizeRegNo(registrationNo);
  const token = String(nameToken || "").trim();
  if (!n) {
    return { status: 400, body: { error: "Enter a valid DDA registration number." } };
  }
  if (token.length < 3) {
    return { status: 400, body: { error: "Enter a distinctive word from the registered pharmacy name." } };
  }
  let pharmacy: DdaPharmacy | null = null;
  if (useLocal()) {
    pharmacy = getLocalPharmacy(n);
    if (!pharmacy) {
      return { status: 404, body: { error: "No pharmacy registration found for that number.", registrationNo: n } };
    }
  } else {
    const result = await remoteOrMissing(`/api/pharmacies?registration_no=${encodeURIComponent(n)}&limit=1`);
    if (result.status !== 200) return result;
    const data = Array.isArray((result.body as { data?: unknown }).data)
      ? ((result.body as { data: unknown[] }).data)
      : [];
    if (!data.length) {
      return { status: 404, body: { error: "No pharmacy registration found for that number.", registrationNo: n } };
    }
    pharmacy = asPharmacy(data[0], n);
  }
  if (!pharmacyNameMatches(pharmacy.name, token)) {
    return { status: 403, body: { error: "That name does not match this pharmacy registration." } };
  }
  return { status: 200, body: pharmacy };
}

export async function searchPharmacies(query: {
  q?: string;
  name?: string;
  district?: string;
  place?: string;
  page?: string;
  limit?: string;
}) {
  if (useLocal()) {
    return { status: 200, body: searchLocalPharmacies(query) };
  }
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("search", query.q.trim());
  if (query.name?.trim()) params.set("pharmacy_name", query.name.trim());
  if (query.district?.trim()) params.set("district", query.district.trim());
  if (query.place?.trim()) params.set("place", query.place.trim());
  params.set("page", query.page || "1");
  params.set("limit", query.limit || "20");
  const result = await remoteOrMissing(`/api/pharmacies?${params.toString()}`);
  if (result.status !== 200 || !result.body || typeof result.body !== "object") return result;
  const body = result.body as { data?: unknown; total?: number; page?: number; limit?: number; pages?: number };
  const data = Array.isArray(body.data) ? body.data.map((row) => asPharmacy(row)) : [];
  const limit = Number(body.limit) || 20;
  const total = Number(body.total) || data.length;
  return {
    status: 200,
    body: {
      data,
      pagination: {
        page: Number(body.page) || 1,
        limit,
        total,
        totalPages: Number(body.pages) || Math.max(1, Math.ceil(total / limit)),
      },
    },
  };
}

export async function listPharmacyDistricts() {
  if (useLocal()) {
    return { status: 200, body: { data: listLocalDistricts() } };
  }
  const result = await remoteOrMissing("/api/districts");
  if (result.status !== 200) return result;
  const rows = Array.isArray(result.body) ? result.body : [];
  const data = rows
    .map((r) => String((r as { district?: string }).district ?? "").trim())
    .filter(Boolean);
  return { status: 200, body: { data } };
}
