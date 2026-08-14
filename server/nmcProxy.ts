/**
 * NMC registry for Express + Vercel. Uses the bundled CSV; optional HTTP fallback.
 */

import path from "node:path";
import { config as loadEnv } from "dotenv";
import {
  getLocalDoctor,
  localRegistryAvailable,
  searchLocalDoctors,
  type NmcDoctor,
} from "./nmcRegistry.js";

loadEnv({ path: path.resolve(process.cwd(), "nmc-api/.env") });

const NMC_BASE = (process.env.NMC_API_URL || "http://localhost:3000").replace(/\/$/, "");
const NMC_KEY = process.env.NMC_API_KEY || "";
const PREFER_REMOTE = Boolean(process.env.NMC_API_URL && !/localhost|127\.0\.0\.1/i.test(process.env.NMC_API_URL));

export type { NmcDoctor };

export type NmcLookup = {
  found: true;
  nmcNumber: string;
  cityHint: string;
  degree: string;
};

function asDoctor(body: unknown, fallback?: string): NmcDoctor {
  const d = (body || {}) as Partial<NmcDoctor>;
  return {
    nmcNumber: String(d.nmcNumber ?? fallback ?? "").trim(),
    name: String(d.name ?? "").trim(),
    address: String(d.address ?? "").trim(),
    gender: String(d.gender ?? "").trim(),
    degree: String(d.degree ?? "").trim(),
  };
}

function cityHintFromAddress(address: string) {
  const parts = String(address || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || parts[0] || "";
}

export function familyNamesFromNmcName(name: string): string[] {
  const parens = [...String(name).matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim().toLowerCase());
  const cleaned = String(name)
    .replace(/^dr\.?\s+/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[.,]/g, " ");
  const parts = cleaned.split(/\s+/).filter(Boolean).map((p) => p.toLowerCase());
  const last = parts[parts.length - 1] || "";
  const extras = parens.flatMap((p) => p.split(/\s+/).filter(Boolean));
  return [...new Set([last, ...extras].filter(Boolean))];
}

export function lastNameMatches(nmcName: string, input: string): boolean {
  const got = input
    .trim()
    .toLowerCase()
    .replace(/^dr\.?\s+/i, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!got) return false;
  const names = familyNamesFromNmcName(nmcName);
  if (names.some((n) => n === got)) return true;
  const gotLast = got.split(" ").pop() || "";
  return names.some((n) => n === gotLast);
}

async function nmcFetch(pathname: string): Promise<{ status: number; body: unknown }> {
  if (!NMC_KEY) {
    return { status: 500, body: { error: "NMC API key is not configured" } };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${NMC_BASE}${pathname}`, {
      headers: { "X-API-Key": NMC_KEY, Accept: "application/json" },
      signal: ctrl.signal,
    });
    const body = await res.json().catch(() => ({ error: "Invalid NMC response" }));
    return { status: res.status, body };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      status: 503,
      body: {
        error: aborted
          ? "NMC registry timed out. Try again."
          : "NMC registry is unavailable. Start nmc-api and retry.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeNmcNumber(raw: string): string | null {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  const n = digits.replace(/^0+/, "");
  if (!n || n === "0" || !/^\d{1,8}$/.test(n)) return null;
  return n;
}

function useLocalRegistry() {
  return !PREFER_REMOTE && localRegistryAvailable();
}

async function remoteDoctor(pathname: string) {
  if (process.env.VERCEL && !PREFER_REMOTE) {
    return {
      status: 503,
      body: { error: "Doctor registry data is missing from this deployment." },
    };
  }
  return nmcFetch(pathname);
}

function lookupBody(doctor: NmcDoctor, nmc: string): NmcLookup {
  return {
    found: true,
    nmcNumber: doctor.nmcNumber || nmc,
    cityHint: cityHintFromAddress(doctor.address),
    degree: doctor.degree || "—",
  };
}

export async function lookupDoctor(nmcNumber: string) {
  const nmc = normalizeNmcNumber(nmcNumber);
  if (!nmc) {
    return { status: 400, body: { error: "Enter a valid NMC registration number." } };
  }
  if (useLocalRegistry()) {
    const doctor = getLocalDoctor(nmc);
    if (!doctor) {
      return { status: 404, body: { error: "No NMC registration found for that number.", nmcNumber: nmc } };
    }
    return { status: 200, body: lookupBody(doctor, nmc) };
  }
  const result = await remoteDoctor(`/api/v1/doctors/${encodeURIComponent(nmc)}`);
  if (result.status === 404) {
    return { status: 404, body: { error: "No NMC registration found for that number.", nmcNumber: nmc } };
  }
  if (result.status !== 200) return result;
  return { status: 200, body: lookupBody(asDoctor(result.body, nmc), nmc) };
}

export async function verifyDoctor(nmcNumber: string, lastName: string) {
  const nmc = normalizeNmcNumber(nmcNumber);
  const last = String(lastName || "").trim();
  if (!nmc) {
    return { status: 400, body: { error: "Enter a valid NMC registration number." } };
  }
  if (last.length < 2) {
    return { status: 400, body: { error: "Enter the last name on your NMC registration." } };
  }
  let doctor: NmcDoctor | null = null;
  if (useLocalRegistry()) {
    doctor = getLocalDoctor(nmc);
    if (!doctor) {
      return { status: 404, body: { error: "No NMC registration found for that number.", nmcNumber: nmc } };
    }
  } else {
    const result = await remoteDoctor(`/api/v1/doctors/${encodeURIComponent(nmc)}`);
    if (result.status === 404) {
      return { status: 404, body: { error: "No NMC registration found for that number.", nmcNumber: nmc } };
    }
    if (result.status !== 200) return result;
    doctor = asDoctor(result.body, nmc);
  }
  if (!lastNameMatches(doctor.name, last)) {
    return { status: 403, body: { error: "Last name does not match this NMC registration." } };
  }
  return { status: 200, body: doctor };
}

export async function searchDoctors(query: {
  name?: string;
  address?: string;
  q?: string;
  page?: string;
  limit?: string;
}) {
  if (useLocalRegistry()) {
    return { status: 200, body: searchLocalDoctors(query) };
  }
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.name?.trim()) params.set("name", query.name.trim());
  if (query.address?.trim()) params.set("address", query.address.trim());
  params.set("page", query.page || "1");
  params.set("limit", query.limit || "24");
  const result = await remoteDoctor(`/api/v1/doctors?${params.toString()}`);
  if (result.status !== 200 || !result.body || typeof result.body !== "object") return result;
  const body = result.body as { data?: unknown; pagination?: unknown };
  const data = Array.isArray(body.data) ? body.data.map((row) => asDoctor(row)) : [];
  return { status: result.status, body: { ...body, data } };
}
