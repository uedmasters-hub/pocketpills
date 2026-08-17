/**
 * Bundled Nepal health-facility registry for Express + Vercel.
 * Reads health-facility-api/data/health-facilities.json.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fieldsMatchQuery, sortBySearchRank, textMatchesQuery } from "./searchMatch.js";

export type HfFacility = {
  hfCode: string;
  name: string;
  district: string;
  facilityLevel: string;
};

type RawRow = {
  hfCode?: string;
  hfName?: string;
  district?: string | null;
  facilityLevel?: string | null;
};

type Loaded = {
  facilities: HfFacility[];
  byCode: Map<string, HfFacility>;
};

let loaded: Loaded | null = null;
let loadError = "";

function jsonCandidates(): string[] {
  const roots = [process.cwd(), process.env.LAMBDA_TASK_ROOT, process.env.VERCEL_DIR].filter(
    (v): v is string => Boolean(v),
  );
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = "health-facility-api/data/health-facilities.json";
  const out: string[] = [];
  for (const root of roots) out.push(path.join(root, file));
  out.push(
    path.join(here, "../health-facility-api/data/health-facilities.json"),
    path.join(here, "../../health-facility-api/data/health-facilities.json"),
    path.join(here, "../../../health-facility-api/data/health-facilities.json"),
  );
  return out;
}

export function findFacilityJsonPath(): string | null {
  for (const file of jsonCandidates()) {
    try {
      if (fs.existsSync(file)) return file;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function normalizeHfCode(raw: string): string | null {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!/^\d{8,12}$/.test(digits)) return null;
  return digits;
}

export function cleanHfName(name: string) {
  return String(name || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const GENERIC_NAME = new Set([
  "hospital",
  "clinic",
  "centre",
  "center",
  "health",
  "post",
  "pvt",
  "ltd",
  "limited",
  "nepal",
  "community",
  "medical",
  "care",
  "unit",
  "service",
  "basic",
  "general",
  "dental",
  "eye",
  "teaching",
  "college",
  "memorial",
  "and",
  "the",
  "private",
  "polyclinic",
  "diagnostic",
  "laboratory",
  "urban",
  "rural",
  "primary",
  "district",
  "ayurveda",
]);

export function distinctiveNameTokens(name: string): string[] {
  return cleanHfName(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !GENERIC_NAME.has(t));
}

export function facilityNameMatches(name: string, input: string): boolean {
  const got = input.trim().toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  if (got.length < 3) return false;
  const tokens = distinctiveNameTokens(name);
  if (tokens.some((t) => t === got || t.startsWith(got) || got.startsWith(t))) return true;
  return cleanHfName(name).toLowerCase().includes(got);
}

function asFacility(row: RawRow): HfFacility | null {
  const hfCode = normalizeHfCode(String(row.hfCode ?? ""));
  const name = cleanHfName(String(row.hfName ?? ""));
  if (!hfCode || !name) return null;
  return {
    hfCode,
    name,
    district: String(row.district ?? "").trim(),
    facilityLevel: String(row.facilityLevel ?? "").trim(),
  };
}

function loadRegistry(): Loaded {
  if (loaded) return loaded;
  const file = findFacilityJsonPath();
  if (!file) {
    loadError = "Health facility registry JSON is not bundled on this server.";
    throw new Error(loadError);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as RawRow[];
  if (!Array.isArray(raw)) {
    loadError = "Health facility registry JSON is invalid.";
    throw new Error(loadError);
  }
  const facilities: HfFacility[] = [];
  const byCode = new Map<string, HfFacility>();
  for (const row of raw) {
    const p = asFacility(row);
    if (!p || byCode.has(p.hfCode)) continue;
    byCode.set(p.hfCode, p);
    facilities.push(p);
  }
  loaded = { facilities, byCode };
  return loaded;
}

function includesInsensitive(hay: string, needle: string) {
  return textMatchesQuery(hay, needle);
}

export function localFacilityRegistryAvailable() {
  try {
    loadRegistry();
    return true;
  } catch {
    return false;
  }
}

export function getLocalFacility(hfCode: string): HfFacility | null {
  const n = normalizeHfCode(hfCode);
  if (!n) return null;
  return loadRegistry().byCode.get(n) ?? null;
}

export function listLocalFacilityDistrictCounts(): { district: string; count: number }[] {
  const { facilities } = loadRegistry();
  const counts = new Map<string, number>();
  for (const p of facilities) {
    if (!p.district) continue;
    counts.set(p.district, (counts.get(p.district) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count || a.district.localeCompare(b.district));
}

export function searchLocalFacilities(query: {
  q?: string;
  name?: string;
  district?: string;
  facilityLevel?: string;
  page?: string;
  limit?: string;
}): {
  data: HfFacility[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
} {
  const { facilities } = loadRegistry();
  const q = query.q?.trim();
  const name = query.name?.trim();
  const district = query.district?.trim();
  const facilityLevel = query.facilityLevel?.trim();
  let page = Math.max(1, parseInt(query.page || "1", 10) || 1);
  let limit = parseInt(query.limit || "20", 10) || 20;
  limit = Math.min(Math.max(limit, 1), 100);

  const matched = facilities.filter((p) => {
    if (district && !includesInsensitive(p.district, district)) return false;
    if (facilityLevel && !includesInsensitive(p.facilityLevel, facilityLevel)) return false;
    if (name && !includesInsensitive(p.name, name)) return false;
    if (
      q &&
      !fieldsMatchQuery([p.name, p.district, p.facilityLevel, p.hfCode], q) &&
      !p.hfCode.includes(q.replace(/\D/g, "") || q)
    ) {
      return false;
    }
    return true;
  });
  const rows = q
    ? sortBySearchRank(matched, q, (p) => [p.name, p.district, p.facilityLevel, p.hfCode])
    : matched;

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  page = Math.min(page, totalPages);
  const start = (page - 1) * limit;
  return {
    data: rows.slice(start, start + limit),
    pagination: { page, limit, total, totalPages },
  };
}

export function localFacilityRegistryError() {
  return loadError;
}
