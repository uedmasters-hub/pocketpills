/**
 * Bundled DDA pharmacy registry for Express + Vercel.
 * Reads pharmacy_api/api/pharmacies.json so production does not need the Python API.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fieldsMatchQuery, sortBySearchRank, textMatchesQuery } from "./searchMatch.js";

export type DdaPharmacy = {
  registrationNo: string;
  name: string;
  place: string;
  district: string;
  pranali: string;
};

type RawRow = {
  "Registration No"?: string;
  "Pharmacy Name"?: string;
  Place?: string | null;
  District?: string | null;
  Pranali?: string | null;
};

type Loaded = {
  pharmacies: DdaPharmacy[];
  byReg: Map<string, DdaPharmacy>;
  districts: string[];
};

let loaded: Loaded | null = null;
let loadError = "";

function jsonCandidates(): string[] {
  const roots = [process.cwd(), process.env.LAMBDA_TASK_ROOT, process.env.VERCEL_DIR].filter(
    (v): v is string => Boolean(v),
  );
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = "pharmacy_api/api/pharmacies.json";
  const out: string[] = [];
  for (const root of roots) out.push(path.join(root, file));
  out.push(
    path.join(here, "../pharmacy_api/api/pharmacies.json"),
    path.join(here, "../../pharmacy_api/api/pharmacies.json"),
    path.join(here, "../../../pharmacy_api/api/pharmacies.json"),
  );
  return out;
}

export function findPharmacyJsonPath(): string | null {
  for (const file of jsonCandidates()) {
    try {
      if (fs.existsSync(file)) return file;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function normalizeRegNo(raw: string): string | null {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!/^\d{8,16}$/.test(digits)) return null;
  return digits;
}

/** Drop "HUMAN" from DDA pranali. Allopathy itself is left for the UI to hide. */
export function normalizePranali(raw: string): string {
  let s = String(raw || "").trim();
  s = s.replace(/\bHUMAN\b/gi, "");
  s = s.replace(/\s*[-–—]\s*/g, " - ");
  s = s.replace(/\s+/g, " ").replace(/^[\s\-–—]+|[\s\-–—]+$/g, "").trim();
  return s;
}

export function isVeterinaryPranali(raw: string) {
  return /\bveterinar/i.test(String(raw || ""));
}

function asPharmacy(row: RawRow): DdaPharmacy | null {
  const registrationNo = normalizeRegNo(String(row["Registration No"] ?? ""));
  const name = String(row["Pharmacy Name"] ?? "").trim();
  if (!registrationNo || !name) return null;
  if (isVeterinaryPranali(String(row.Pranali ?? ""))) return null;
  return {
    registrationNo,
    name,
    place: String(row.Place ?? "").trim(),
    district: String(row.District ?? "").trim(),
    pranali: normalizePranali(String(row.Pranali ?? "")),
  };
}

function loadRegistry(): Loaded {
  if (loaded) return loaded;
  const file = findPharmacyJsonPath();
  if (!file) {
    loadError = "Pharmacy registry JSON is not bundled on this server.";
    throw new Error(loadError);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as RawRow[];
  if (!Array.isArray(raw)) {
    loadError = "Pharmacy registry JSON is invalid.";
    throw new Error(loadError);
  }
  const pharmacies: DdaPharmacy[] = [];
  const byReg = new Map<string, DdaPharmacy>();
  const districtSet = new Set<string>();
  for (const row of raw) {
    const p = asPharmacy(row);
    if (!p || byReg.has(p.registrationNo)) continue;
    byReg.set(p.registrationNo, p);
    pharmacies.push(p);
    if (p.district) districtSet.add(p.district);
  }
  loaded = {
    pharmacies,
    byReg,
    districts: [...districtSet].sort((a, b) => a.localeCompare(b)),
  };
  return loaded;
}

function includesInsensitive(hay: string, needle: string) {
  return textMatchesQuery(hay, needle);
}

export function localPharmacyRegistryAvailable() {
  try {
    loadRegistry();
    return true;
  } catch {
    return false;
  }
}

export function getLocalPharmacy(registrationNo: string): DdaPharmacy | null {
  const n = normalizeRegNo(registrationNo);
  if (!n) return null;
  return loadRegistry().byReg.get(n) ?? null;
}

export function listLocalDistricts(): string[] {
  return listLocalDistrictCounts().map((d) => d.district);
}

export function listLocalDistrictCounts(): { district: string; count: number }[] {
  const { pharmacies } = loadRegistry();
  const counts = new Map<string, number>();
  for (const p of pharmacies) {
    if (!p.district) continue;
    counts.set(p.district, (counts.get(p.district) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count || a.district.localeCompare(b.district));
}

export function searchLocalPharmacies(query: {
  q?: string;
  name?: string;
  district?: string;
  place?: string;
  registrationNo?: string;
  page?: string;
  limit?: string;
}): {
  data: DdaPharmacy[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
} {
  const { pharmacies } = loadRegistry();
  const q = query.q?.trim();
  const name = query.name?.trim();
  const district = query.district?.trim();
  const place = query.place?.trim();
  const registrationNo = query.registrationNo?.trim();
  let page = Math.max(1, parseInt(query.page || "1", 10) || 1);
  let limit = parseInt(query.limit || "20", 10) || 20;
  limit = Math.min(Math.max(limit, 1), 100);

  const matched = pharmacies.filter((p) => {
    if (registrationNo && p.registrationNo !== normalizeRegNo(registrationNo)) return false;
    if (district && !includesInsensitive(p.district, district)) return false;
    if (place && !includesInsensitive(p.place, place)) return false;
    if (name && !includesInsensitive(p.name, name)) return false;
    if (
      q &&
      !fieldsMatchQuery([p.name, p.place, p.district, p.pranali, p.registrationNo], q) &&
      !p.registrationNo.includes(q.replace(/\D/g, "") || q)
    ) {
      return false;
    }
    return true;
  });
  const rows = q
    ? sortBySearchRank(matched, q, (p) => [p.name, p.place, p.district, p.pranali, p.registrationNo])
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

const GENERIC_NAME = new Set([
  "pharmacy",
  "medical",
  "hall",
  "pasal",
  "pvt",
  "ltd",
  "limited",
  "center",
  "centre",
  "unit",
  "and",
  "the",
  "store",
  "stores",
  "aushadhi",
  "pharma",
  "suppliers",
  "distributers",
  "distributors",
  "life",
  "sciences",
  "diagnostic",
  "clinic",
  "hospital",
  "private",
  "p",
  "co",
  "company",
]);

export function distinctiveNameTokens(name: string): string[] {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !GENERIC_NAME.has(t));
}

export function pharmacyNameMatches(name: string, input: string): boolean {
  const got = input.trim().toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  if (got.length < 3) return false;
  const tokens = distinctiveNameTokens(name);
  if (tokens.some((t) => t === got || t.startsWith(got) || got.startsWith(t))) return true;
  return name.toLowerCase().includes(got);
}

export function localPharmacyRegistryError() {
  return loadError;
}
