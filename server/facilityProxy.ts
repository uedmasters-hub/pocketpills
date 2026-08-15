/**
 * Health facility registry for Express + Vercel.
 * Uses bundled JSON; optional remote health-facility-api via HF_API_KEY.
 */

import path from "node:path";
import { config as loadEnv } from "dotenv";
import {
  distinctiveNameTokens,
  facilityNameMatches,
  getLocalFacility,
  listLocalFacilityDistrictCounts,
  localFacilityRegistryAvailable,
  normalizeHfCode,
  searchLocalFacilities,
  type HfFacility,
} from "./facilityRegistry.js";

loadEnv({ path: path.resolve(process.cwd(), "health-facility-api/.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const HF_BASE = (process.env.HF_API_URL || process.env.HEALTH_FACILITY_API_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);
const HF_KEY = process.env.HF_API_KEY || "";
const PREFER_REMOTE = Boolean(
  (process.env.HF_API_URL || process.env.HEALTH_FACILITY_API_URL) &&
    !/localhost|127\.0\.0\.1/i.test(process.env.HF_API_URL || process.env.HEALTH_FACILITY_API_URL || ""),
);

export type { HfFacility };

export type HfLookup = {
  found: true;
  hfCode: string;
  nameHint: string;
  district: string;
  facilityLevel: string;
};

function useLocal() {
  return !PREFER_REMOTE && localFacilityRegistryAvailable();
}

function asFacility(body: unknown, fallback?: string): HfFacility {
  const d = (body || {}) as Record<string, unknown>;
  return {
    hfCode: String(d.hfCode ?? fallback ?? "").replace(/\D/g, ""),
    name: String(d.name ?? d.hfName ?? "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    district: String(d.district ?? "").trim(),
    facilityLevel: String(d.facilityLevel ?? "").trim(),
  };
}

function lookupBody(p: HfFacility): HfLookup {
  const tokens = distinctiveNameTokens(p.name);
  return {
    found: true,
    hfCode: p.hfCode,
    nameHint: tokens[0] ? `${tokens[0].charAt(0).toUpperCase()}•••` : "•••",
    district: p.district,
    facilityLevel: p.facilityLevel,
  };
}

async function hfFetch(pathname: string): Promise<{ status: number; body: unknown }> {
  if (!HF_KEY) {
    return { status: 500, body: { error: "Health facility API key is not configured" } };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${HF_BASE}${pathname}`, {
      headers: { "X-API-Key": HF_KEY, Accept: "application/json" },
      signal: ctrl.signal,
    });
    const body = await res.json().catch(() => ({ error: "Invalid health facility API response" }));
    return { status: res.status, body };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      status: 503,
      body: {
        error: aborted ? "Health facility registry timed out. Try again." : "Health facility registry is unavailable.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function remoteOrMissing(pathname: string) {
  if (process.env.VERCEL && !PREFER_REMOTE) {
    return { status: 503, body: { error: "Health facility registry data is missing from this deployment." } };
  }
  return hfFetch(pathname);
}

export async function lookupFacility(hfCode: string) {
  const n = normalizeHfCode(hfCode);
  if (!n) {
    return { status: 400, body: { error: "Enter a valid health facility code." } };
  }
  if (useLocal()) {
    const p = getLocalFacility(n);
    if (!p) {
      return { status: 404, body: { error: "No health facility found for that code.", hfCode: n } };
    }
    return { status: 200, body: lookupBody(p) };
  }
  const result = await remoteOrMissing(`/api/v1/facilities/${encodeURIComponent(n)}`);
  if (result.status !== 200) return result;
  return { status: 200, body: lookupBody(asFacility(result.body, n)) };
}

export async function verifyFacility(hfCode: string, nameToken: string) {
  const n = normalizeHfCode(hfCode);
  const token = String(nameToken || "").trim();
  if (!n) {
    return { status: 400, body: { error: "Enter a valid health facility code." } };
  }
  if (token.length < 3) {
    return { status: 400, body: { error: "Enter a distinctive word from the registered facility name." } };
  }
  let facility: HfFacility | null = null;
  if (useLocal()) {
    facility = getLocalFacility(n);
    if (!facility) {
      return { status: 404, body: { error: "No health facility found for that code.", hfCode: n } };
    }
  } else {
    const result = await remoteOrMissing(`/api/v1/facilities/${encodeURIComponent(n)}`);
    if (result.status !== 200) return result;
    facility = asFacility(result.body, n);
  }
  if (!facilityNameMatches(facility.name, token)) {
    return { status: 403, body: { error: "That name does not match this health facility." } };
  }
  return { status: 200, body: facility };
}

export async function searchFacilities(query: {
  q?: string;
  name?: string;
  district?: string;
  facilityLevel?: string;
  page?: string;
  limit?: string;
}) {
  if (useLocal()) {
    return { status: 200, body: searchLocalFacilities(query) };
  }
  const params = new URLSearchParams();
  if (query.name?.trim() || query.q?.trim()) params.set("name", (query.name || query.q || "").trim());
  if (query.district?.trim()) params.set("district", query.district.trim());
  if (query.facilityLevel?.trim()) params.set("facilityLevel", query.facilityLevel.trim());
  params.set("page", query.page || "1");
  params.set("limit", query.limit || "20");
  const result = await remoteOrMissing(`/api/v1/facilities?${params.toString()}`);
  if (result.status !== 200 || !result.body || typeof result.body !== "object") return result;
  const body = result.body as {
    data?: unknown;
    pagination?: { total?: number; page?: number; limit?: number; totalPages?: number };
  };
  const data = Array.isArray(body.data) ? body.data.map((row) => asFacility(row)) : [];
  const pagination = body.pagination || {};
  const limit = Number(pagination.limit) || 20;
  const total = Number(pagination.total) || data.length;
  return {
    status: 200,
    body: {
      data,
      pagination: {
        page: Number(pagination.page) || 1,
        limit,
        total,
        totalPages: Number(pagination.totalPages) || Math.max(1, Math.ceil(total / limit)),
      },
    },
  };
}

export async function listFacilityDistricts() {
  if (useLocal()) {
    return { status: 200, body: { data: listLocalFacilityDistrictCounts() } };
  }
  const result = await remoteOrMissing("/api/v1/stats");
  if (result.status !== 200) return result;
  const rows = Array.isArray((result.body as { districts?: unknown }).districts)
    ? ((result.body as { districts: { district?: string; count?: number }[] }).districts)
    : [];
  const data = rows
    .map((r) => {
      const district = String(r.district ?? "").trim();
      if (!district) return null;
      return { district, count: Number(r.count) || 0 };
    })
    .filter((d): d is { district: string; count: number } => Boolean(d));
  return { status: 200, body: { data } };
}
