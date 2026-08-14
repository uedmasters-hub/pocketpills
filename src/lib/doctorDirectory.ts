/**
 * Claimed NMC doctor directory (demo localStorage) + OTP.
 * Published claims appear as CareProvider cards on the site.
 */

import type { CareProvider, SpecialtyId } from "@/lib/appointments";
import { normalizeNmcNumber, type NmcDoctor } from "@/lib/nmcApi";
import {
  emptyBusinessProfile,
  publishBusinessProfile,
  saveDraft,
} from "@/lib/businessProfile";

const DIR_KEY = "pp.doctors.directory.v1";
const IDENT_KEY = "pp.doctors.identities.v1";
const DIR_EVENT = "pp:doctors-directory";
const OTP_KEY = "pp.doctors.otp.v1";
const VERIFY_KEY = "pp.doctors.verify.v1";

export type DoctorClaim = {
  nmcNumber: string;
  name: string;
  address: string;
  gender: string;
  degree: string;
  city: string;
  providerId: string;
  email: string;
  phone: string;
  published: boolean;
  claimedAt: string;
  publishedAt?: string;
};

type OtpRecord = {
  nmcNumber: string;
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
};

type VerifyRecord = {
  nmcNumber: string;
  doctor: NmcDoctor;
  at: number;
};

const VERIFY_MS = 30 * 60 * 1000;
const OTP_MS = 5 * 60 * 1000;
const RESEND_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const LAST_KEY = "pp.doctors.lasttry.v1";
const MAX_LAST_ATTEMPTS = 5;
const LAST_LOCK_MS = 10 * 60 * 1000;

export function sameNmc(a?: string | number | null, b?: string | number | null) {
  const x = normalizeNmcNumber(String(a ?? ""));
  const y = normalizeNmcNumber(String(b ?? ""));
  return Boolean(x && y && x === y);
}

export function doctorProviderId(nmcNumber: string) {
  const nmc = normalizeNmcNumber(nmcNumber) || String(nmcNumber).replace(/\D/g, "");
  return `prov-nmc-${nmc}`;
}

export function nmcProfileId(nmcNumber: string) {
  const nmc = normalizeNmcNumber(nmcNumber) || String(nmcNumber).trim();
  return `nmc-${nmc}`;
}

export function nmcNumberFromId(id: string): string | null {
  const m = /^nmc-(\d+)$/.exec(id);
  return m ? m[1] : null;
}

function readDir(): Record<string, DoctorClaim> {
  try {
    const raw = localStorage.getItem(DIR_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DoctorClaim>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDir(map: Record<string, DoctorClaim>) {
  localStorage.setItem(DIR_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(DIR_EVENT));
}

export function subscribeDoctorDirectory(onChange: () => void) {
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

export function getDoctorClaim(nmcNumber: string): DoctorClaim | null {
  const nmc = normalizeNmcNumber(nmcNumber) || String(nmcNumber).trim();
  return readDir()[nmc] ?? null;
}

export function listPublishedDoctorClaims(): DoctorClaim[] {
  return Object.values(readDir())
    .filter((c) => c.published)
    .sort((a, b) => a.name.localeCompare(b.name));
}

const DEMO_SEED_KEY = "pp.doctors.demo-seed";
const DEMO_SEED = "nmc-active-v1";
const STALE_DEMO_NMCS = ["1", "19", "23", "27", "28", "35"];

const DEMO_PUBLISHED: Array<Omit<DoctorClaim, "claimedAt" | "publishedAt" | "email" | "phone">> = [
  {
    nmcNumber: "6",
    name: "Dr. Sudhakar Anil Thapaliya",
    address: "Biratnagar , Morang,",
    gender: "Male",
    degree: "MBBS",
    city: "Biratnagar",
    providerId: "prov-nmc-6",
    published: true,
  },
  {
    nmcNumber: "5",
    name: "Dr. Premu Shah",
    address: "Tangal , Kathmandu,",
    gender: "Female",
    degree: "MBBS",
    city: "Kathmandu",
    providerId: "prov-nmc-5",
    published: true,
  },
  {
    nmcNumber: "10",
    name: "Dr. Keshab Raj Bhattarai",
    address: "Baneshwor , Kathmandu,",
    gender: "Male",
    degree: "MBBS",
    city: "Kathmandu",
    providerId: "prov-nmc-10",
    published: true,
  },
  {
    nmcNumber: "19",
    name: "Dr. Hira Devi Dangol",
    address: "Kamalachhi , Kathmandu,",
    gender: "Female",
    degree: "MBBS",
    city: "Kathmandu",
    providerId: "prov-nmc-19",
    published: true,
  },
  {
    nmcNumber: "22",
    name: "Dr. Mahodadhi Shrestha",
    address: "Newbaneswor , Kathmandu,",
    gender: "Male",
    degree: "MBBS",
    city: "Kathmandu",
    providerId: "prov-nmc-22",
    published: true,
  },
  {
    nmcNumber: "38",
    name: "Dr. Geeta Joshi",
    address: "Kathmandu,",
    gender: "Male",
    degree: "MD",
    city: "Kathmandu",
    providerId: "prov-nmc-38",
    published: true,
  },
];

/** Demo listings so the directory can show Available cards before anyone claims. */
export function ensureDemoPublishedDoctors() {
  const dir = readDir();
  let seeded = "";
  try {
    seeded = localStorage.getItem(DEMO_SEED_KEY) || "";
  } catch {
    /* ignore */
  }
  if (seeded === DEMO_SEED) return;

  const replaceable = new Set([...STALE_DEMO_NMCS, ...DEMO_PUBLISHED.map((r) => r.nmcNumber)]);
  for (const nmc of replaceable) {
    const row = dir[nmc];
    if (!row) continue;
    if (row.providerId.startsWith("prov-nmc-") && !row.email && !row.phone) delete dir[nmc];
  }
  const now = new Date().toISOString();
  for (const row of DEMO_PUBLISHED) {
    if (dir[row.nmcNumber]) continue;
    dir[row.nmcNumber] = {
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

export function cityFromNmcAddress(address: string) {
  const parts = String(address || "")
    .split(",")
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p && p.toLowerCase() !== "nepal");
  return parts[parts.length - 1] || parts[0] || "Nepal";
}

export function splitNmcName(name: string): { firstName: string; lastName: string } {
  const cleaned = String(name)
    .replace(/^dr\.?\s+/i, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

/** Public directory: keep given names, hide family name until the profile is claimed. */
export function maskNmcLastName(name: string): string {
  const raw = String(name || "").replace(/\s+/g, " ").trim();
  if (!raw) return "•••";
  const prefix = /^dr\.?\s+/i.test(raw) ? "Dr. " : "";
  const { firstName, lastName } = splitNmcName(raw);
  if (!firstName) return `${prefix}•••`.trim();
  if (!lastName || firstName === lastName) return `${prefix}${firstName.charAt(0)}•••`.replace(/\s+/g, " ").trim();
  return `${prefix}${firstName} •••`.replace(/\s+/g, " ").trim();
}

function specialtyFromDegree(degree: string): SpecialtyId {
  const d = degree.toLowerCase();
  if (d.includes("cardio")) return "cardiologist";
  if (d.includes("derma")) return "dermatologist";
  if (d.includes("gyn") || d.includes("obs")) return "gynecologist";
  if (d.includes("paed") || d.includes("pediatr")) return "pediatrician";
  if (d.includes("neuro")) return "neurologist";
  if (d.includes("ortho")) return "orthopedist";
  if (d.includes("ophthal") || d.includes("eye")) return "ophthalmologist";
  if (d.includes("ent") || d.includes("oto")) return "ent";
  if (d.includes("gastro")) return "gastroenterologist";
  if (d.includes("endocrin")) return "endocrinologist";
  if (d.includes("pulmon") || d.includes("chest")) return "pulmonologist";
  if (d.includes("uro")) return "urologist";
  if (d.includes("psych")) return "psychiatrist";
  if (d.includes("dent")) return "dentist";
  return "general";
}

function imageForGender(gender: string, nmcNumber: string) {
  const female = /female|woman/i.test(gender);
  const n = Number(nmcNumber) || 0;
  const women = [
    "/img/doctors/doctor-w1.png",
    "/img/doctors/doctor-w2.png",
    "/img/doctors/doctor-w3.png",
  ];
  const men = [
    "/img/doctors/doctor-m1.png",
    "/img/doctors/doctor-m2.png",
    "/img/doctors/doctor-m3.png",
  ];
  const pool = female ? women : men;
  return pool[n % pool.length];
}

export function nmcDoctorToCareProvider(
  doctor: NmcDoctor,
  extras?: { published?: boolean; phone?: string },
): CareProvider {
  const nmc = String(doctor.nmcNumber).trim();
  const city = cityFromNmcAddress(doctor.address);
  const specialty = specialtyFromDegree(doctor.degree);
  const degree = doctor.degree.trim() || "MBBS";
  return {
    id: nmcProfileId(nmc),
    kind: "doctor",
    name: doctor.name.trim(),
    subtitle: `${degree} · NMC #${nmc}`,
    imageUrl: imageForGender(doctor.gender, doctor.nmcNumber),
    specialties: [specialty],
    languages: ["Nepali", "English"],
    rating: extras?.published ? 4.8 : 0,
    reviewCount: extras?.published ? 12 : 0,
    distanceKm: 0,
    consultationFee: 79,
    nextAvailable: extras?.published ? "Today" : "Unclaimed",
    visitTypes: ["virtual", "clinic"],
    city,
    address: doctor.address.trim(),
    bio: `${doctor.name.trim()} is an NMC-registered physician (${degree}) practising in ${city}.`,
    about: extras?.published
      ? `${doctor.name.trim()} claimed this NMC profile and is accepting visits through PocketPills.`
      : `${doctor.name.trim()}’s NMC record is pre-filled from the Nepal Medical Council registry. Claim it to publish this card and start seeing patients.`,
    hours: "By appointment",
    phone: extras?.phone,
    focusAreas: [degree, "General consultation", "Follow-up"],
    education: [`Nepal Medical Council #${nmc}`, degree],
  };
}

export function claimToCareProvider(claim: DoctorClaim): CareProvider {
  return nmcDoctorToCareProvider(
    {
      nmcNumber: claim.nmcNumber,
      name: claim.name,
      address: claim.address,
      gender: claim.gender,
      degree: claim.degree,
    },
    { published: claim.published, phone: claim.phone },
  );
}

export function listPublishedNmcProviders(): CareProvider[] {
  return listPublishedDoctorClaims().map(claimToCareProvider);
}

export function getNmcProvider(id: string): CareProvider | undefined {
  const nmc = nmcNumberFromId(id);
  if (!nmc) return undefined;
  const claim = getDoctorClaim(nmc);
  if (claim?.published) return claimToCareProvider(claim);
  return undefined;
}

export function rememberVerifiedNmc(doctor: NmcDoctor) {
  const nmc = normalizeNmcNumber(doctor.nmcNumber) || String(doctor.nmcNumber).trim();
  const map = readVerify();
  map[nmc] = { nmcNumber: nmc, doctor: { ...doctor, nmcNumber: nmc }, at: Date.now() };
  sessionStorage.setItem(VERIFY_KEY, JSON.stringify(map));
}

export function getVerifiedNmc(nmcNumber: string): NmcDoctor | null {
  const nmc = normalizeNmcNumber(nmcNumber) || String(nmcNumber).trim();
  const rec = readVerify()[nmc];
  if (!rec) return null;
  if (Date.now() - rec.at > VERIFY_MS) return null;
  return rec.doctor;
}

function readVerify(): Record<string, VerifyRecord> {
  try {
    const raw = sessionStorage.getItem(VERIFY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, VerifyRecord>;
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

export function sendClaimOtp(
  nmcNumber: string,
  phoneRaw: string,
): { ok: true; code: string; phone: string } | { ok: false; error: string } {
  const phone = normalizeNepalMobile(phoneRaw);
  if (!phone) {
    return { ok: false, error: "Enter a valid Nepal mobile number (10 digits starting with 9)." };
  }
  const prev = readOtp();
  if (prev && prev.nmcNumber === nmcNumber && prev.phone === phone && Date.now() - prev.sentAt < RESEND_MS) {
    const wait = Math.ceil((RESEND_MS - (Date.now() - prev.sentAt)) / 1000);
    return { ok: false, error: `Wait ${wait}s before requesting another code.` };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  writeOtp({
    nmcNumber,
    phone,
    code,
    expiresAt: Date.now() + OTP_MS,
    attempts: 0,
    sentAt: Date.now(),
  });
  return { ok: true, code, phone };
}

export function verifyClaimOtp(
  nmcNumber: string,
  phoneRaw: string,
  code: string,
): { ok: true; phone: string } | { ok: false; error: string } {
  const phone = normalizeNepalMobile(phoneRaw);
  if (!phone) return { ok: false, error: "Enter a valid Nepal mobile number." };
  const rec = readOtp();
  if (!rec || rec.nmcNumber !== nmcNumber || rec.phone !== phone) {
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

export function claimDoctorProfile(input: {
  doctor: NmcDoctor;
  providerId: string;
  email: string;
  phone: string;
}): DoctorClaim | { error: string } {
  const nmc = normalizeNmcNumber(input.doctor.nmcNumber) || String(input.doctor.nmcNumber).trim();
  if (!nmc) return { error: "Invalid NMC number." };
  const existing = getDoctorClaim(nmc);
  if (existing && existing.providerId !== input.providerId) {
    return { error: "This NMC profile is already claimed." };
  }
  const now = new Date().toISOString();
  const snapshot: NmcDoctor = {
    nmcNumber: nmc,
    name: String(input.doctor.name || "").trim(),
    address: String(input.doctor.address || "").trim(),
    gender: String(input.doctor.gender || "").trim(),
    degree: String(input.doctor.degree || "").trim(),
  };
  const claim: DoctorClaim = {
    nmcNumber: nmc,
    name: snapshot.name,
    address: snapshot.address,
    gender: snapshot.gender,
    degree: snapshot.degree,
    city: cityFromNmcAddress(snapshot.address),
    providerId: input.providerId,
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    published: true,
    claimedAt: existing?.claimedAt ?? now,
    publishedAt: now,
  };
  const map = readDir();
  map[nmc] = claim;
  writeDir(map);
  saveDoctorIdentity(nmc, {
    id: input.providerId,
    email: claim.email,
    phone: claim.phone,
    name: claim.name,
  });

  const { firstName, lastName } = splitNmcName(claim.name);
  const draft = emptyBusinessProfile("doctor");
  const seeded = saveDraft(
    {
      ...draft,
      name: claim.name,
      subtitle: `${claim.degree} · NMC #${nmc}`,
      bio: nmcDoctorToCareProvider(snapshot, { published: true }).bio,
      about: nmcDoctorToCareProvider(snapshot, { published: true }).about || "",
      city: claim.city,
      address: claim.address,
      phone: formatNepalMobile(claim.phone),
      email: claim.email,
      licenseNumber: nmc,
      specialtyNote: claim.degree,
      imageUrl: nmcDoctorToCareProvider(snapshot).imageUrl,
      publishedId: nmcProfileId(nmc),
      ownerId: input.providerId,
    },
    input.providerId,
  );
  publishBusinessProfile(seeded, input.providerId);
  void firstName;
  void lastName;
  return claim;
}

export type DoctorIdentity = {
  id: string;
  email: string;
  phone: string;
  name: string;
};

function readIdent(): Record<string, DoctorIdentity> {
  try {
    const raw = localStorage.getItem(IDENT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DoctorIdentity>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveDoctorIdentity(nmcNumber: string, ident: DoctorIdentity) {
  const nmc = normalizeNmcNumber(nmcNumber) || String(nmcNumber).trim();
  const map = readIdent();
  map[nmc] = ident;
  localStorage.setItem(IDENT_KEY, JSON.stringify(map));
}

export function getDoctorIdentity(nmcNumber: string): DoctorIdentity | null {
  const nmc = normalizeNmcNumber(nmcNumber) || String(nmcNumber).trim();
  return readIdent()[nmc] ?? null;
}

export function setDoctorPublished(nmcNumber: string, published: boolean) {
  const map = readDir();
  const nmc = normalizeNmcNumber(nmcNumber) || String(nmcNumber).trim();
  const cur = map[nmc];
  if (!cur) return null;
  cur.published = published;
  cur.publishedAt = published ? new Date().toISOString() : undefined;
  map[nmc] = cur;
  writeDir(map);
  return cur;
}

export function claimOwnedBy(providerId: string): DoctorClaim | null {
  return Object.values(readDir()).find((c) => c.providerId === providerId) ?? null;
}

type LastTry = { nmcNumber: string; attempts: number; lockedUntil: number };

function readLastTries(): Record<string, LastTry> {
  try {
    const raw = sessionStorage.getItem(LAST_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LastTry>;
  } catch {
    return {};
  }
}

export function lastNameLockStatus(nmcNumber: string): { locked: boolean; waitSec: number; attemptsLeft: number } {
  const rec = readLastTries()[String(nmcNumber).trim()];
  if (!rec) return { locked: false, waitSec: 0, attemptsLeft: MAX_LAST_ATTEMPTS };
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
    return { locked: true, waitSec: Math.ceil((rec.lockedUntil - Date.now()) / 1000), attemptsLeft: 0 };
  }
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) {
    return { locked: false, waitSec: 0, attemptsLeft: MAX_LAST_ATTEMPTS };
  }
  const left = Math.max(0, MAX_LAST_ATTEMPTS - rec.attempts);
  return { locked: false, waitSec: 0, attemptsLeft: left };
}

export function recordLastNameFailure(nmcNumber: string) {
  const map = readLastTries();
  const key = String(nmcNumber).trim();
  const prev = map[key];
  if (prev?.lockedUntil && Date.now() < prev.lockedUntil) {
    return lastNameLockStatus(key);
  }
  const base = prev?.lockedUntil && Date.now() >= prev.lockedUntil ? 0 : prev?.attempts ?? 0;
  const attempts = base + 1;
  map[key] = {
    nmcNumber: key,
    attempts,
    lockedUntil: attempts >= MAX_LAST_ATTEMPTS ? Date.now() + LAST_LOCK_MS : 0,
  };
  sessionStorage.setItem(LAST_KEY, JSON.stringify(map));
  return lastNameLockStatus(key);
}

export function clearLastNameFailures(nmcNumber: string) {
  const map = readLastTries();
  delete map[String(nmcNumber).trim()];
  sessionStorage.setItem(LAST_KEY, JSON.stringify(map));
}

export function getClaimOtpMeta(nmcNumber: string, phoneRaw: string) {
  const phone = normalizeNepalMobile(phoneRaw);
  const rec = readOtp();
  if (!phone || !rec || rec.nmcNumber !== nmcNumber || rec.phone !== phone) return null;
  if (Date.now() > rec.expiresAt) return null;
  return {
    demoCode: rec.code,
    attemptsLeft: Math.max(0, MAX_OTP_ATTEMPTS - rec.attempts),
    expiresInSec: Math.max(0, Math.ceil((rec.expiresAt - Date.now()) / 1000)),
    resendInSec: Math.max(0, Math.ceil((RESEND_MS - (Date.now() - rec.sentAt)) / 1000)),
  };
}
