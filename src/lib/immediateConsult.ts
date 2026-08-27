/** Draft-only: doctors who registered for immediate Rx consults. Backup coverage is handled server-side. */

export type ConsultantKind = "backup" | "doctor";
export type ConsultRequestStatus = "pending" | "in_consult" | "issued" | "declined";

export interface ImmediateConsultant {
  id: string;
  kind: ConsultantKind;
  name: string;
  subtitle: string;
  imageUrl: string;
  languages: string[];
  fee: number;
  available: boolean;
  waitLabel: string;
  city: string;
}

export interface ConsultMedLine {
  slug: string;
  name: string;
  dose: string;
  qty: number;
}

export interface ConsultRequest {
  id: string;
  consultantId: string;
  consultantName: string;
  drugSlug: string;
  drugName: string;
  dose: string;
  qty: number;
  items?: ConsultMedLine[];
  patientName: string;
  fee: number;
  status: ConsultRequestStatus;
  rxNote?: string;
  reportId?: string;
  createdAt: string;
  issuedAt?: string;
}

export interface ImmediateOptIn {
  providerId: string;
  enabled: boolean;
  fee: number;
  name: string;
  subtitle: string;
  imageUrl: string;
  city: string;
}

const OPTIN_KEY = "pp.draft.immediateConsult.optIn";
const REQUESTS_KEY = "pp.draft.immediateConsult.requests";
const EVENT = "pp-immediate-consult";

const SEEDED_DOCTORS: ImmediateConsultant[] = [
  {
    id: "seed-basnet",
    kind: "doctor",
    name: "Dr. S. Basnet",
    subtitle: "MBBS, MD · General practice",
    imageUrl: "/img/doctors/doctor-w2.png",
    languages: ["Nepali", "English"],
    fee: 79,
    available: true,
    waitLabel: "Available now",
    city: "Lalitpur",
  },
  {
    id: "seed-shrestha",
    kind: "doctor",
    name: "Dr. A. Shrestha",
    subtitle: "MBBS · Family medicine",
    imageUrl: "/img/doctors/doctor-m1.png",
    languages: ["Nepali", "English"],
    fee: 69,
    available: true,
    waitLabel: "Available now",
    city: "Pokhara",
  },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeImmediateConsult(cb: () => void) {
  const on = () => cb();
  window.addEventListener(EVENT, on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener(EVENT, on);
    window.removeEventListener("storage", on);
  };
}

function listOptIns(): ImmediateOptIn[] {
  return readJson<ImmediateOptIn[]>(OPTIN_KEY, []);
}

export function getImmediateOptIn(providerId: string): ImmediateOptIn | undefined {
  return listOptIns().find((o) => o.providerId === providerId);
}

export function saveImmediateOptIn(next: ImmediateOptIn) {
  const all = listOptIns().filter((o) => o.providerId !== next.providerId);
  all.push(next);
  writeJson(OPTIN_KEY, all);
}

export function optInConsultantId(providerId: string) {
  return `optin:${providerId}`;
}

function fromOptIn(o: ImmediateOptIn): ImmediateConsultant {
  return {
    id: optInConsultantId(o.providerId),
    kind: "doctor",
    name: o.name,
    subtitle: o.subtitle,
    imageUrl: o.imageUrl,
    languages: ["Nepali", "English"],
    fee: o.fee,
    available: true,
    waitLabel: "Available now",
    city: o.city || "Nepal",
  };
}

export function listImmediateConsultants(): ImmediateConsultant[] {
  const opted = listOptIns().filter((o) => o.enabled).map(fromOptIn);
  return [...SEEDED_DOCTORS, ...opted]
    .filter((c) => c.kind === "doctor")
    .sort((a, b) => a.fee - b.fee || a.name.localeCompare(b.name));
}

export function getImmediateConsultant(id: string): ImmediateConsultant | undefined {
  return listImmediateConsultants().find((c) => c.id === id);
}

export function listConsultRequests(): ConsultRequest[] {
  return readJson<ConsultRequest[]>(REQUESTS_KEY, []);
}

export function getConsultRequest(id: string): ConsultRequest | undefined {
  return listConsultRequests().find((r) => r.id === id);
}

export function listConsultRequestsForConsultant(consultantId: string): ConsultRequest[] {
  return listConsultRequests().filter((r) => r.consultantId === consultantId);
}

export function createConsultRequest(input: {
  consultant: ImmediateConsultant;
  drugSlug: string;
  drugName: string;
  dose: string;
  qty: number;
  patientName: string;
  items?: ConsultMedLine[];
  reportId?: string;
}): ConsultRequest {
  const n = Math.floor(1000 + Math.random() * 9000);
  const req: ConsultRequest = {
    id: `RXC-${n}`,
    consultantId: input.consultant.id,
    consultantName: input.consultant.name,
    drugSlug: input.drugSlug,
    drugName: input.drugName,
    dose: input.dose,
    qty: input.qty,
    items: input.items,
    patientName: input.patientName,
    fee: input.consultant.fee,
    status: "in_consult",
    createdAt: new Date().toISOString(),
    reportId: input.reportId,
  };
  writeJson(REQUESTS_KEY, [req, ...listConsultRequests()]);
  return req;
}

export function issueConsultPrescription(id: string, rxNote?: string): ConsultRequest | undefined {
  const all = listConsultRequests();
  const i = all.findIndex((r) => r.id === id);
  if (i < 0) return undefined;
  all[i] = {
    ...all[i],
    status: "issued",
    rxNote: rxNote || all[i].rxNote,
    issuedAt: new Date().toISOString(),
  };
  writeJson(REQUESTS_KEY, all);
  return all[i];
}

export function declineConsultRequest(id: string): ConsultRequest | undefined {
  const all = listConsultRequests();
  const i = all.findIndex((r) => r.id === id);
  if (i < 0) return undefined;
  all[i] = { ...all[i], status: "declined" };
  writeJson(REQUESTS_KEY, all);
  return all[i];
}

/** Seeded doctors auto-issue after a short review. Opted-in doctors wait for the provider. */
export function autoIssueDelayMs(consultant: ImmediateConsultant): number | null {
  if (consultant.id.startsWith("seed-")) return 5000;
  return null;
}
