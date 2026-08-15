/**
 * Claimed DDA pharmacy directory (demo localStorage) + OTP.
 */

import { normalizeRegNo, type DdaPharmacy } from "@/lib/ddaApi";
import { emptyBusinessProfile, saveDraft } from "@/lib/businessProfile";

const DIR_KEY = "pp.pharmacies.directory.v1";
const DIR_EVENT = "pp:pharmacies-directory";
const OTP_KEY = "pp.pharmacies.otp.v1";
const VERIFY_KEY = "pp.pharmacies.verify.v1";
const LAST_KEY = "pp.pharmacies.lasttry.v1";

export type PharmacyClaim = {
  registrationNo: string;
  name: string;
  place: string;
  district: string;
  pranali: string;
  providerId: string;
  email: string;
  phone: string;
  published: boolean;
  claimedAt: string;
  publishedAt?: string;
};

type OtpRecord = {
  registrationNo: string;
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
  "private",
]);

export function pharmacyProviderId(registrationNo: string) {
  const n = normalizeRegNo(registrationNo) || String(registrationNo).replace(/\D/g, "");
  return `prov-dda-${n}`;
}

export function ddaProfileId(registrationNo: string) {
  const n = normalizeRegNo(registrationNo) || String(registrationNo).trim();
  return `dda-${n}`;
}

export function ddaNumberFromId(id: string): string | null {
  const m = /^dda-(\d+)$/.exec(id);
  return m ? m[1] : null;
}

export function sameDda(a?: string | number | null, b?: string | number | null) {
  const x = normalizeRegNo(String(a ?? ""));
  const y = normalizeRegNo(String(b ?? ""));
  return Boolean(x && y && x === y);
}

function readDir(): Record<string, PharmacyClaim> {
  try {
    const raw = localStorage.getItem(DIR_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PharmacyClaim>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDir(map: Record<string, PharmacyClaim>) {
  localStorage.setItem(DIR_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(DIR_EVENT));
}

export function subscribePharmacyDirectory(onChange: () => void) {
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

export function getPharmacyClaim(registrationNo: string): PharmacyClaim | null {
  const n = normalizeRegNo(registrationNo) || String(registrationNo).trim();
  return readDir()[n] ?? null;
}

export function listPublishedPharmacyClaims(): PharmacyClaim[] {
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

export function maskPharmacyName(name: string): string {
  const raw = String(name || "").replace(/\s+/g, " ").trim();
  if (!raw) return "•••";
  const tokens = distinctiveNameTokens(raw);
  const first = tokens[0] || raw.split(" ")[0] || "•••";
  const display = first.charAt(0).toUpperCase() + first.slice(1);
  return `${display} •••`;
}

export function placeLine(pharmacy: Pick<DdaPharmacy, "place" | "district">) {
  const place = pharmacy.place.trim();
  const district = pharmacy.district.trim();
  if (place && district && place.toLowerCase() !== district.toLowerCase()) return `${place}, ${district}`;
  return place || district || "Nepal";
}

const DEMO_SEED_KEY = "pp.pharmacies.demo-seed";
const DEMO_SEED = "dda-v1";

const DEMO_PUBLISHED: Array<Omit<PharmacyClaim, "claimedAt" | "publishedAt" | "email" | "phone">> = [
  {
    registrationNo: "3711213090457",
    name: "KANCHAN MEDICAL AND DIAGNOSTIC CENTER P LTD PHARMACY UNIT",
    place: "Kathmandu",
    district: "Kathmandu",
    pranali: "ALLOPATHY - HUMAN",
    providerId: "prov-dda-3711213090457",
    published: true,
  },
  {
    registrationNo: "3711215063850",
    name: "MANABIYATA PHARMACY",
    place: "Tokha",
    district: "Kathmandu",
    pranali: "ALLOPATHY - HUMAN",
    providerId: "prov-dda-3711215063850",
    published: true,
  },
  {
    registrationNo: "3720229050938",
    name: "SURYAAMSHA PHARMACY",
    place: "Budhanilkantha",
    district: "Kathmandu",
    pranali: "ALLOPATHY - HUMAN",
    providerId: "prov-dda-3720229050938",
    published: true,
  },
  {
    registrationNo: "3720229061524",
    name: "SUMANTH MEDICAL SUPPLIERS",
    place: "Kathmandu",
    district: "Kathmandu",
    pranali: "ALLOPATHY - HUMAN",
    providerId: "prov-dda-3720229061524",
    published: true,
  },
];

export function ensureDemoPublishedPharmacies() {
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
    if (dir[row.registrationNo]?.email) continue;
    dir[row.registrationNo] = {
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

export function rememberVerifiedPharmacy(pharmacy: DdaPharmacy) {
  const n = normalizeRegNo(pharmacy.registrationNo) || pharmacy.registrationNo;
  const map = readVerify();
  map[n] = { registrationNo: n, pharmacy: { ...pharmacy, registrationNo: n }, at: Date.now() };
  sessionStorage.setItem(VERIFY_KEY, JSON.stringify(map));
}

export function getVerifiedPharmacy(registrationNo: string): DdaPharmacy | null {
  const n = normalizeRegNo(registrationNo) || String(registrationNo).trim();
  const rec = readVerify()[n];
  if (!rec) return null;
  if (Date.now() - rec.at > VERIFY_MS) return null;
  return rec.pharmacy;
}

function readVerify(): Record<string, { registrationNo: string; pharmacy: DdaPharmacy; at: number }> {
  try {
    const raw = sessionStorage.getItem(VERIFY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, { registrationNo: string; pharmacy: DdaPharmacy; at: number }>;
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

export function sendPharmacyClaimOtp(
  registrationNo: string,
  phoneRaw: string,
): { ok: true; code: string; phone: string } | { ok: false; error: string } {
  const phone = normalizeNepalMobile(phoneRaw);
  if (!phone) {
    return { ok: false, error: "Enter a valid Nepal mobile number (10 digits starting with 9)." };
  }
  const prev = readOtp();
  if (prev && prev.registrationNo === registrationNo && prev.phone === phone && Date.now() - prev.sentAt < RESEND_MS) {
    const wait = Math.ceil((RESEND_MS - (Date.now() - prev.sentAt)) / 1000);
    return { ok: false, error: `Wait ${wait}s before requesting another code.` };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  writeOtp({
    registrationNo,
    phone,
    code,
    expiresAt: Date.now() + OTP_MS,
    attempts: 0,
    sentAt: Date.now(),
  });
  return { ok: true, code, phone };
}

export function verifyPharmacyClaimOtp(
  registrationNo: string,
  phoneRaw: string,
  code: string,
): { ok: true; phone: string } | { ok: false; error: string } {
  const phone = normalizeNepalMobile(phoneRaw);
  if (!phone) return { ok: false, error: "Enter a valid Nepal mobile number." };
  const rec = readOtp();
  if (!rec || rec.registrationNo !== registrationNo || rec.phone !== phone) {
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

export function lastNameLockStatus(registrationNo: string) {
  const rec = readLast()[registrationNo];
  if (!rec) return { locked: false, waitSec: 0, attemptsLeft: MAX_LAST_ATTEMPTS };
  if (rec.n >= MAX_LAST_ATTEMPTS && Date.now() - rec.at < LAST_LOCK_MS) {
    return { locked: true, waitSec: Math.ceil((LAST_LOCK_MS - (Date.now() - rec.at)) / 1000), attemptsLeft: 0 };
  }
  if (Date.now() - rec.at >= LAST_LOCK_MS) return { locked: false, waitSec: 0, attemptsLeft: MAX_LAST_ATTEMPTS };
  return { locked: false, waitSec: 0, attemptsLeft: Math.max(0, MAX_LAST_ATTEMPTS - rec.n) };
}

export function recordNameFailure(registrationNo: string) {
  const map = readLast();
  const prev = map[registrationNo];
  const n = !prev || Date.now() - prev.at >= LAST_LOCK_MS ? 1 : prev.n + 1;
  map[registrationNo] = { n, at: Date.now() };
  writeLast(map);
  return lastNameLockStatus(registrationNo);
}

export function clearNameFailures(registrationNo: string) {
  const map = readLast();
  delete map[registrationNo];
  writeLast(map);
}

export function getClaimOtpMeta(registrationNo: string, phoneRaw: string) {
  const phone = normalizeNepalMobile(phoneRaw);
  const rec = readOtp();
  if (!phone || !rec || rec.registrationNo !== registrationNo || rec.phone !== phone) return null;
  if (Date.now() > rec.expiresAt) return null;
  return {
    phone: rec.phone,
    demoCode: rec.code,
    attemptsLeft: Math.max(0, MAX_OTP_ATTEMPTS - rec.attempts),
    expiresInSec: Math.max(0, Math.ceil((rec.expiresAt - Date.now()) / 1000)),
    resendInSec: Math.max(0, Math.ceil((RESEND_MS - (Date.now() - rec.sentAt)) / 1000)),
  };
}

export function displayPharmacyName(name: string) {
  const raw = String(name || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\bPvt\b/g, "Pvt")
    .replace(/\bLtd\b/g, "Ltd");
}

export function shortRegNo(registrationNo: string) {
  const n = normalizeRegNo(registrationNo) || String(registrationNo).replace(/\D/g, "");
  if (n.length <= 6) return n;
  return n.slice(-6);
}

export function pharmacyHours() {
  return "Open today · 9:00 AM – 7:00 PM";
}

export function claimPharmacyProfile(input: {
  pharmacy: DdaPharmacy;
  providerId: string;
  email: string;
  phone: string;
}): PharmacyClaim | { error: string } {
  const n = normalizeRegNo(input.pharmacy.registrationNo) || String(input.pharmacy.registrationNo).trim();
  if (!n) return { error: "Invalid registration number." };
  const existing = getPharmacyClaim(n);
  if (existing && existing.providerId !== input.providerId) {
    return { error: "This pharmacy profile is already claimed." };
  }
  const now = new Date().toISOString();
  const claim: PharmacyClaim = {
    registrationNo: n,
    name: String(input.pharmacy.name || "").trim(),
    place: String(input.pharmacy.place || "").trim(),
    district: String(input.pharmacy.district || "").trim(),
    pranali: String(input.pharmacy.pranali || "").trim(),
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

  const draft = emptyBusinessProfile("pharmacy");
  saveDraft(
    {
      ...draft,
      name: claim.name,
      subtitle: `${claim.pranali || "Pharmacy"} · DDA #${n}`,
      bio: `${claim.name} is a DDA-registered pharmacy in ${placeLine(claim)}.`,
      about: `${claim.name} claimed this DDA profile and can receive transfers through PocketPills.`,
      city: claim.district || claim.place,
      address: placeLine(claim),
      phone: formatNepalMobile(claim.phone),
      email: claim.email,
      licenseNumber: n,
      publishedId: ddaProfileId(n),
      ownerId: input.providerId,
      status: "published",
    },
    input.providerId,
  );

  return claim;
}
