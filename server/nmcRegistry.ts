/**
 * Bundled NMC registry for local Express and Vercel serverless.
 * Reads the CSV checked into the repo so production does not need nmc-api.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type NmcDoctor = {
  nmcNumber: string;
  name: string;
  address: string;
  gender: string;
  degree: string;
};

type Loaded = {
  doctors: NmcDoctor[];
  byNmc: Map<string, NmcDoctor>;
};

let loaded: Loaded | null = null;
let loadError = "";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function csvCandidates(): string[] {
  const roots = [process.cwd(), process.env.LAMBDA_TASK_ROOT, process.env.VERCEL_DIR].filter(
    (v): v is string => Boolean(v),
  );
  const here = path.dirname(fileURLToPath(import.meta.url));
  const files = [
    "nmc-api/data/nmc-database-final.csv",
    "nmc-api/nmc-database-final.csv",
  ];
  const out: string[] = [];
  for (const root of roots) {
    for (const file of files) out.push(path.join(root, file));
  }
  out.push(
    path.join(here, "../nmc-api/data/nmc-database-final.csv"),
    path.join(here, "../../nmc-api/data/nmc-database-final.csv"),
    path.join(here, "../../../nmc-api/data/nmc-database-final.csv"),
  );
  return out;
}

export function findNmcCsvPath(): string | null {
  for (const file of csvCandidates()) {
    try {
      if (fs.existsSync(file)) return file;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function loadRegistry(): Loaded {
  if (loaded) return loaded;
  const file = findNmcCsvPath();
  if (!file) {
    loadError = "NMC registry CSV is not bundled on this server.";
    throw new Error(loadError);
  }
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || "");
  const index: Record<string, number> = {};
  headers.forEach((header, i) => {
    index[header.trim()] = i;
  });
  const nmcIdx = index["NMC Number"];
  const nameIdx = index["NMC Name"];
  const addressIdx = index["NMC Address"];
  const genderIdx = index["NMC Gender"];
  const degreeIdx = index["NMC Degree"];
  if (
    nmcIdx === undefined ||
    nameIdx === undefined ||
    addressIdx === undefined ||
    genderIdx === undefined ||
    degreeIdx === undefined
  ) {
    loadError = "NMC registry CSV is missing required columns.";
    throw new Error(loadError);
  }
  const doctors: NmcDoctor[] = [];
  const byNmc = new Map<string, NmcDoctor>();
  for (const line of lines) {
    const values = parseCsvLine(line);
    const nmcNumber = String(values[nmcIdx] ?? "")
      .replace(/\D/g, "")
      .replace(/^0+/, "");
    if (!nmcNumber) continue;
    const doctor: NmcDoctor = {
      nmcNumber,
      name: String(values[nameIdx] ?? "").trim(),
      address: String(values[addressIdx] ?? "").trim(),
      gender: String(values[genderIdx] ?? "").trim(),
      degree: String(values[degreeIdx] ?? "").trim(),
    };
    if (byNmc.has(nmcNumber)) continue;
    byNmc.set(nmcNumber, doctor);
    doctors.push(doctor);
  }
  doctors.sort((a, b) => Number(a.nmcNumber) - Number(b.nmcNumber));
  loaded = { doctors, byNmc };
  return loaded;
}

function includesInsensitive(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

export function localRegistryAvailable() {
  try {
    loadRegistry();
    return true;
  } catch {
    return false;
  }
}

export function getLocalDoctor(nmcNumber: string): NmcDoctor | null {
  return loadRegistry().byNmc.get(nmcNumber) ?? null;
}

export function searchLocalDoctors(query: {
  name?: string;
  address?: string;
  q?: string;
  page?: string;
  limit?: string;
}): { data: NmcDoctor[]; pagination: { page: number; limit: number; total: number; totalPages: number } } {
  const { doctors } = loadRegistry();
  const q = query.q?.trim();
  const name = query.name?.trim();
  const address = query.address?.trim();
  let page = Math.max(1, parseInt(query.page || "1", 10) || 1);
  let limit = parseInt(query.limit || "20", 10) || 20;
  limit = Math.min(Math.max(limit, 1), 100);

  const rows = doctors.filter((d) => {
    if (q && !(includesInsensitive(d.name, q) || includesInsensitive(d.address, q) || includesInsensitive(d.degree, q) || d.nmcNumber.includes(q))) {
      return false;
    }
    if (name && !includesInsensitive(d.name, name)) return false;
    if (address && !includesInsensitive(d.address, address)) return false;
    return true;
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  page = Math.min(page, totalPages);
  const start = (page - 1) * limit;
  return {
    data: rows.slice(start, start + limit),
    pagination: { page, limit, total, totalPages },
  };
}

export function localRegistryError() {
  return loadError;
}
