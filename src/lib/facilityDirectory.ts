/**
 * Claimed health-facility directory (demo localStorage) + OTP.
 */

import { normalizeHfCode, type HfFacility } from "@/lib/hfApi";
import { emptyBusinessProfile, saveDraft, type BusinessVendorType } from "@/lib/businessProfile";
import { defaultFacilitySpecialised } from "@/lib/specialisedIn";

const DIR_KEY = "pp.facilities.directory.v1";
const DIR_EVENT = "pp:facilities-directory";
const OTP_KEY = "pp.facilities.otp.v1";
const VERIFY_KEY = "pp.facilities.verify.v1";
const LAST_KEY = "pp.facilities.lasttry.v1";

export type FacilityClaim = {
  hfCode: string;
  name: string;
  district: string;
  facilityLevel: string;
  providerId: string;
  email: string;
  phone: string;
  published: boolean;
  claimedAt: string;
  publishedAt?: string;
};

type OtpRecord = {
  hfCode: string;
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
};

const VERIFY_MS = 30 * 60 * 1000;
const OTP_MS = 5 * 60 * 1000;
const RESEND_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MAX_LAST_ATTEMPTS = 5;
const LAST_LOCK_MS = 10 * 60 * 1000;

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
]);

export function facilityProviderId(hfCode: string) {
  const n = normalizeHfCode(hfCode) || String(hfCode).replace(/\D/g, "");
  return `prov-hf-${n}`;
}

export function hfProfileId(hfCode: string) {
  const n = normalizeHfCode(hfCode) || String(hfCode).trim();
  return `hf-${n}`;
}

export function hfCodeFromId(id: string): string | null {
  const m = /^hf-(\d+)$/.exec(id);
  return m ? m[1] : null;
}

export function sameHf(a?: string | number | null, b?: string | number | null) {
  const x = normalizeHfCode(String(a ?? ""));
  const y = normalizeHfCode(String(b ?? ""));
  return Boolean(x && y && x === y);
}

export function vendorFromFacilityLevel(level: string): BusinessVendorType {
  const s = String(level || "").toLowerCase();
  if (/lab|diagnostic|radio.?imaging|x-ray/.test(s)) return "lab";
  if (/hospital|nursing home|academy|teaching|institute/.test(s)) return "hospital";
  return "clinic";
}

function readDir(): Record<string, FacilityClaim> {
  try {
    const raw = localStorage.getItem(DIR_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, FacilityClaim>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDir(map: Record<string, FacilityClaim>) {
  localStorage.setItem(DIR_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(DIR_EVENT));
}

export function subscribeFacilityDirectory(onChange: () => void) {
  const bump = () => onChange();
  window.addEventListener(DIR_EVENT, bump);
  window.addEventListener("storage", bump);
  window.addEventListener("focus", bump);
  return () => {
    window.removeEventListener(DIR_EVENT, bump);
    window.removeEventListener("storage", bump);
    window.removeEventListener("focus", bump);
  };
}

export function getFacilityClaim(hfCode: string): FacilityClaim | null {
  const n = normalizeHfCode(hfCode) || String(hfCode).trim();
  return readDir()[n] ?? null;
}

export function listPublishedFacilityClaims(): FacilityClaim[] {
  return Object.values(readDir())
    .filter((c) => c.published)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function distinctiveNameTokens(name: string): string[] {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !GENERIC_NAME.has(t));
}

export function maskFacilityName(name: string): string {
  const raw = displayFacilityName(name);
  if (!raw) return "•••";
  const tokens = distinctiveNameTokens(raw);
  const first = tokens[0] || raw.split(" ")[0] || "•••";
  const display = first.charAt(0).toUpperCase() + first.slice(1);
  return `${display} •••`;
}

export function displayFacilityName(name: string) {
  const raw = String(name || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\bPvt\b/g, "Pvt")
    .replace(/\bLtd\b/g, "Ltd");
}

export function displayFacilityLevel(raw: string): string {
  let s = String(raw || "").replace(/\?+/g, "").replace(/\s+/g, " ").trim();
  if (!s || s === "--") return "";
  s = s.replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();
  return s;
}

export function shortHfCode(hfCode: string) {
  const n = normalizeHfCode(hfCode) || String(hfCode).replace(/\D/g, "");
  if (n.length <= 6) return n;
  return n.slice(-6);
}

export function facilityHours() {
  return "9:00 AM – 7:00 PM";
}

const DEMO_SEED_KEY = "pp.facilities.demo-seed";
const DEMO_SEED = "hf-v1";

const DEMO_PUBLISHED: Array<Omit<FacilityClaim, "claimedAt" | "publishedAt" | "email" | "phone">> = [
  {
    hfCode: "3060100072",
    name: "PEOPLES LIFE CARE HOSPITAL",
    district: "Kathmandu",
    facilityLevel: "General Hospital",
    providerId: "prov-hf-3060100072",
    published: true,
  },
  {
    hfCode: "3060100092",
    name: "SUSMA KOIRALA MEMORIAL HOSPITAL",
    district: "Kathmandu",
    facilityLevel: "General Hospital",
    providerId: "prov-hf-3060100092",
    published: true,
  },
  {
    hfCode: "3060300122",
    name: "SHANKARAPUR HOSPITAL",
    district: "Kathmandu",
    facilityLevel: "General Hospital",
    providerId: "prov-hf-3060300122",
    published: true,
  },
  {
    hfCode: "3060300062",
    name: "FRIENDS OF SHANTA BHAWAN NEPAL",
    district: "Kathmandu",
    facilityLevel: "Health Clinic",
    providerId: "prov-hf-3060300062",
    published: true,
  },
];

export function ensureDemoPublishedFacilities() {
  const dir = readDir();
  let seeded = "";
  try {
    seeded = localStorage.getItem(DEMO_SEED_KEY) || "";
  } catch {
    /* ignore */
  }
  if (seeded === DEMO_SEED) return;
  const now = new Date().toISOString();
  for (const row of DEMO_PUBLISHED) {
    if (dir[row.hfCode]?.email) continue;
    dir[row.hfCode] = {
      ...row,
      email: "",
      phone: "",
      claimedAt: now,
      publishedAt: now,
    };
  }
  writeDir(dir);
  try {
    localStorage.setItem(DEMO_SEED_KEY, DEMO_SEED);
  } catch {
    /* ignore */
  }
}

export function rememberVerifiedFacility(facility: HfFacility) {
  const n = normalizeHfCode(facility.hfCode) || facility.hfCode;
  const map = readVerify();
  map[n] = { hfCode: n, facility: { ...facility, hfCode: n }, at: Date.now() };
  sessionStorage.setItem(VERIFY_KEY, JSON.stringify(map));
}

export function getVerifiedFacility(hfCode: string): HfFacility | null {
  const n = normalizeHfCode(hfCode) || String(hfCode).trim();
  const rec = readVerify()[n];
  if (!rec) return null;
  if (Date.now() - rec.at > VERIFY_MS) return null;
  return rec.facility;
}

function readVerify(): Record<string, { hfCode: string; facility: HfFacility; at: number }> {
  try {
    const raw = sessionStorage.getItem(VERIFY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, { hfCode: string; facility: HfFacility; at: number }>;
  } catch {
    return {};
  }
}

export function normalizeNepalMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let n = digits;
  if (n.startsWith("977") && n.length === 13) n = n.slice(3);
  if (n.startsWith("0") && n.length === 11) n = n.slice(1);
  if (/^9\d{9}$/.test(n)) return n;
  return null;
}

export function formatNepalMobile(n: string) {
  return `+977 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

function readOtp(): OtpRecord | null {
  try {
    const raw = sessionStorage.getItem(OTP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OtpRecord;
  } catch {
    return null;
  }
}

function writeOtp(rec: OtpRecord | null) {
  if (!rec) sessionStorage.removeItem(OTP_KEY);
  else sessionStorage.setItem(OTP_KEY, JSON.stringify(rec));
}

export function sendFacilityClaimOtp(
  hfCode: string,
  phoneRaw: string,
): { ok: true; code: string; phone: string } | { ok: false; error: string } {
  const phone = normalizeNepalMobile(phoneRaw);
  if (!phone) {
    return { ok: false, error: "Enter a valid Nepal mobile number (10 digits starting with 9)." };
  }
  const prev = readOtp();
  if (prev && prev.hfCode === hfCode && prev.phone === phone && Date.now() - prev.sentAt < RESEND_MS) {
    const wait = Math.ceil((RESEND_MS - (Date.now() - prev.sentAt)) / 1000);
    return { ok: false, error: `Wait ${wait}s before requesting another code.` };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  writeOtp({
    hfCode,
    phone,
    code,
    expiresAt: Date.now() + OTP_MS,
    attempts: 0,
    sentAt: Date.now(),
  });
  return { ok: true, code, phone };
}

export function verifyFacilityClaimOtp(
  hfCode: string,
  phoneRaw: string,
  code: string,
): { ok: true; phone: string } | { ok: false; error: string } {
  const phone = normalizeNepalMobile(phoneRaw);
  if (!phone) return { ok: false, error: "Enter a valid Nepal mobile number." };
  const rec = readOtp();
  if (!rec || rec.hfCode !== hfCode || rec.phone !== phone) {
    return { ok: false, error: "Request a verification code first." };
  }
  if (Date.now() > rec.expiresAt) {
    writeOtp(null);
    return { ok: false, error: "That code expired. Request a new one." };
  }
  if (rec.attempts >= MAX_OTP_ATTEMPTS) {
    writeOtp(null);
    return { ok: false, error: "Too many attempts. Request a new code." };
  }
  const typed = code.replace(/\D/g, "");
  if (typed !== rec.code) {
    rec.attempts += 1;
    writeOtp(rec);
    const left = MAX_OTP_ATTEMPTS - rec.attempts;
    return { ok: false, error: left ? `Incorrect code. ${left} tries left.` : "Too many attempts. Request a new code." };
  }
  writeOtp(null);
  return { ok: true, phone };
}

type LastTry = { n: number; at: number };
function readLast(): Record<string, LastTry> {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LastTry>;
  } catch {
    return {};
  }
}
function writeLast(map: Record<string, LastTry>) {
  localStorage.setItem(LAST_KEY, JSON.stringify(map));
}

export function lastNameLockStatus(hfCode: string) {
  const rec = readLast()[hfCode];
  if (!rec) return { locked: false, waitSec: 0, attemptsLeft: MAX_LAST_ATTEMPTS };
  if (rec.n >= MAX_LAST_ATTEMPTS && Date.now() - rec.at < LAST_LOCK_MS) {
    return { locked: true, waitSec: Math.ceil((LAST_LOCK_MS - (Date.now() - rec.at)) / 1000), attemptsLeft: 0 };
  }
  if (Date.now() - rec.at >= LAST_LOCK_MS) return { locked: false, waitSec: 0, attemptsLeft: MAX_LAST_ATTEMPTS };
  return { locked: false, waitSec: 0, attemptsLeft: Math.max(0, MAX_LAST_ATTEMPTS - rec.n) };
}

export function recordNameFailure(hfCode: string) {
  const map = readLast();
  const prev = map[hfCode];
  const n = !prev || Date.now() - prev.at >= LAST_LOCK_MS ? 1 : prev.n + 1;
  map[hfCode] = { n, at: Date.now() };
  writeLast(map);
  return lastNameLockStatus(hfCode);
}

export function clearNameFailures(hfCode: string) {
  const map = readLast();
  delete map[hfCode];
  writeLast(map);
}

export function getClaimOtpMeta(hfCode: string, phoneRaw: string) {
  const phone = normalizeNepalMobile(phoneRaw);
  const rec = readOtp();
  if (!phone || !rec || rec.hfCode !== hfCode || rec.phone !== phone) return null;
  if (Date.now() > rec.expiresAt) return null;
  return {
    phone: rec.phone,
    demoCode: rec.code,
    attemptsLeft: Math.max(0, MAX_OTP_ATTEMPTS - rec.attempts),
    expiresInSec: Math.max(0, Math.ceil((rec.expiresAt - Date.now()) / 1000)),
    resendInSec: Math.max(0, Math.ceil((RESEND_MS - (Date.now() - rec.sentAt)) / 1000)),
  };
}

export function claimFacilityProfile(input: {
  facility: HfFacility;
  providerId: string;
  email: string;
  phone: string;
}): FacilityClaim | { error: string } {
  const n = normalizeHfCode(input.facility.hfCode) || String(input.facility.hfCode).trim();
  if (!n) return { error: "Invalid health facility code." };
  const existing = getFacilityClaim(n);
  if (existing && existing.providerId !== input.providerId) {
    return { error: "This facility profile is already claimed." };
  }
  const now = new Date().toISOString();
  const claim: FacilityClaim = {
    hfCode: n,
    name: displayFacilityName(input.facility.name) || String(input.facility.name || "").trim(),
    district: String(input.facility.district || "").trim(),
    facilityLevel: String(input.facility.facilityLevel || "").trim(),
    providerId: input.providerId,
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    published: true,
    claimedAt: existing?.claimedAt ?? now,
    publishedAt: now,
  };
  const map = readDir();
  map[n] = claim;
  writeDir(map);

  const vendor = vendorFromFacilityLevel(claim.facilityLevel);
  const draft = emptyBusinessProfile(vendor);
  const level = displayFacilityLevel(claim.facilityLevel) || "Health facility";
  saveDraft(
    {
      ...draft,
      name: claim.name,
      subtitle: `${level} · HF #${n}`,
      bio: `${claim.name} is a registered health facility in ${claim.district || "Nepal"}.`,
      about: `${claim.name} claimed this health-facility profile and can receive patients through PocketPills.`,
      city: claim.district,
      address: claim.district || "Nepal",
      phone: formatNepalMobile(claim.phone),
      email: claim.email,
      licenseNumber: n,
      specialisedIn:
        vendor === "hospital" || vendor === "clinic"
          ? defaultFacilitySpecialised({
              name: claim.name,
              facilityLevel: claim.facilityLevel,
              breadth: vendor === "clinic" ? "clinic" : "hospital",
            })
          : [],
      publishedId: hfProfileId(n),
      ownerId: input.providerId,
      status: "published",
    },
    input.providerId,
  );

  return claim;
}

export function setFacilityPublished(hfCode: string, published: boolean) {
  const map = readDir();
  const n = normalizeHfCode(hfCode) || String(hfCode).trim();
  const cur = map[n];
  if (!cur) return null;
  cur.published = published;
  cur.publishedAt = published ? new Date().toISOString() : undefined;
  map[n] = cur;
  writeDir(map);
  return cur;
}
