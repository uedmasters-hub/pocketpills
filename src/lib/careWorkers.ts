/** Medical assistants, nurses, home care — localStorage bookings. */

import { fieldsMatchQuery, sortBySearchRank } from "@/lib/searchMatch";
import { getPublishedCareWorker } from "@/lib/businessProfile";

export type CareWorkerKind = "medical-assistant" | "nurse" | "home-care";
export type CareVisitType = "home" | "clinic" | "virtual";

export interface CareWorker {
  id: string;
  kind: CareWorkerKind;
  name: string;
  subtitle: string;
  services: string[];
  languages: string[];
  rating: number;
  feeFrom: number;
  visitTypes: CareVisitType[];
  city: string;
  distanceKm: number;
  nextAvailable: string;
  bio: string;
  experienceYears: number;
  emoji: string;
  imageUrl?: string;
}

export type CareWorkerBookingStatus = "upcoming" | "completed" | "cancelled";

export interface CareWorkerBooking {
  id: string;
  confirmationNo: string;
  workerId: string;
  workerName: string;
  kind: CareWorkerKind;
  visitType: CareVisitType;
  service: string;
  date: string;
  time: string;
  fee: number;
  status: CareWorkerBookingStatus;
  createdAt: string;
}

export const CARE_WORKERS: CareWorker[] = [
  {
    id: "ma-priya",
    kind: "medical-assistant",
    name: "Priya Nair",
    subtitle: "Certified medical assistant",
    services: ["Vitals & intake", "Injection support", "Clinic prep"],
    languages: ["English", "Hindi"],
    rating: 4.9,
    feeFrom: 49,
    visitTypes: ["clinic", "home"],
    city: "Toronto",
    distanceKm: 1.2,
    nextAvailable: "Today",
    bio: "Clinic and home visits for vitals, prep, and simple procedures under clinician direction.",
    experienceYears: 6,
    emoji: "🩺",
  },
  {
    id: "nurse-jordan",
    kind: "nurse",
    name: "Jordan Lee, RN",
    subtitle: "Registered nurse",
    services: ["Wound care", "Injections", "Post-op check"],
    languages: ["English", "Cantonese"],
    rating: 4.8,
    feeFrom: 79,
    visitTypes: ["home", "clinic", "virtual"],
    city: "Toronto",
    distanceKm: 2.4,
    nextAvailable: "Tomorrow",
    bio: "Home and clinic nursing for wound care, injections, and recovery check-ins.",
    experienceYears: 11,
    emoji: "💉",
  },
  {
    id: "hc-amira",
    kind: "home-care",
    name: "Amira Hassan",
    subtitle: "Home care aide",
    services: ["ADL support", "Medication reminders", "Companionship"],
    languages: ["English", "Arabic"],
    rating: 4.7,
    feeFrom: 39,
    visitTypes: ["home"],
    city: "Mississauga",
    distanceKm: 12.5,
    nextAvailable: "Today",
    bio: "In-home support for daily living, reminders, and light mobility help.",
    experienceYears: 8,
    emoji: "🏠",
  },
  {
    id: "ma-chris",
    kind: "medical-assistant",
    name: "Chris Okonkwo",
    subtitle: "Medical assistant",
    services: ["ECG support", "Specimen collection", "Patient education"],
    languages: ["English"],
    rating: 4.6,
    feeFrom: 55,
    visitTypes: ["clinic", "virtual"],
    city: "Toronto",
    distanceKm: 3.1,
    nextAvailable: "In 2 days",
    bio: "Supports diagnostics and patient education in partner clinics.",
    experienceYears: 4,
    emoji: "📋",
  },
  {
    id: "nurse-sofia",
    kind: "nurse",
    name: "Sofia Martins, RPN",
    subtitle: "Practical nurse",
    services: ["Chronic care visits", "BP checks", "Virtual triage"],
    languages: ["English", "Portuguese"],
    rating: 4.9,
    feeFrom: 69,
    visitTypes: ["home", "virtual"],
    city: "Toronto",
    distanceKm: 4.0,
    nextAvailable: "Tomorrow",
    bio: "Follow-up nursing for chronic conditions with optional virtual triage.",
    experienceYears: 9,
    emoji: "❤️",
  },
  {
    id: "hc-mark",
    kind: "home-care",
    name: "Mark Chen",
    subtitle: "Personal support worker",
    services: ["Mobility help", "Meal prep support", "Respite"],
    languages: ["English", "Mandarin"],
    rating: 4.5,
    feeFrom: 42,
    visitTypes: ["home"],
    city: "Scarborough",
    distanceKm: 14.2,
    nextAvailable: "Today",
    bio: "Reliable home visits focused on mobility, meals, and caregiver respite.",
    experienceYears: 7,
    emoji: "🤝",
  },
  {
    id: "nurse-ava",
    kind: "nurse",
    name: "Ava Thompson, NP",
    subtitle: "Nurse practitioner (collaborative)",
    services: ["Minor ailments", "Prescription renewals", "Virtual consult"],
    languages: ["English", "French"],
    rating: 4.8,
    feeFrom: 89,
    visitTypes: ["virtual", "clinic"],
    city: "Toronto",
    distanceKm: 2.8,
    nextAvailable: "Today",
    bio: "Collaborative NP visits for minor ailments and renewals where eligible.",
    experienceYears: 12,
    emoji: "👩‍⚕️",
  },
];

export function careWorkerKindLabel(kind: CareWorkerKind): string {
  switch (kind) {
    case "medical-assistant":
      return "Medical assistant";
    case "nurse":
      return "Nurse";
    case "home-care":
      return "Home care";
  }
}

export function getCareWorker(id: string): CareWorker | undefined {
  const published = getPublishedCareWorker();
  if (published && published.id === id) return published;
  return CARE_WORKERS.find((w) => w.id === id);
}

export function listCareWorkers(): CareWorker[] {
  const published = getPublishedCareWorker();
  if (!published) return CARE_WORKERS;
  return [published, ...CARE_WORKERS.filter((w) => w.id !== published.id)];
}

export function searchCareWorkers(query: string, list: CareWorker[] = listCareWorkers()): CareWorker[] {
  const needle = query.trim();
  if (!needle) return list;
  return sortBySearchRank(
    list.filter((w) =>
      fieldsMatchQuery(
        [
          w.name,
          w.subtitle,
          w.bio,
          w.city,
          careWorkerKindLabel(w.kind),
          ...w.services,
          ...w.languages,
        ],
        needle,
      ),
    ),
    needle,
    (w) => [w.name, w.subtitle, w.bio, w.city, careWorkerKindLabel(w.kind), ...w.services, ...w.languages],
  );
}

const CW_BOOKINGS_KEY = "pp.careWorkerBookings.v1";

function readBookings(): CareWorkerBooking[] {
  try {
    const raw = localStorage.getItem(CW_BOOKINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CareWorkerBooking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBookings(list: CareWorkerBooking[]) {
  localStorage.setItem(CW_BOOKINGS_KEY, JSON.stringify(list));
}

export function getCareWorkerBookings(): CareWorkerBooking[] {
  return readBookings().sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

export function createCareWorkerBooking(input: {
  workerId: string;
  visitType: CareVisitType;
  service: string;
  date: string;
  time: string;
}): CareWorkerBooking | null {
  const worker = getCareWorker(input.workerId);
  if (!worker || !worker.visitTypes.includes(input.visitType)) return null;
  const booking: CareWorkerBooking = {
    id: `cw-${Date.now()}`,
    confirmationNo: `PP-CARE-${String(Date.now()).slice(-4)}`,
    workerId: worker.id,
    workerName: worker.name,
    kind: worker.kind,
    visitType: input.visitType,
    service: input.service,
    date: input.date,
    time: input.time,
    fee: worker.feeFrom,
    status: "upcoming",
    createdAt: new Date().toISOString(),
  };
  writeBookings([booking, ...readBookings()]);
  return booking;
}

export function updateCareWorkerBookingStatus(id: string, status: CareWorkerBookingStatus) {
  writeBookings(readBookings().map((b) => (b.id === id ? { ...b, status } : b)));
}

export function careWorkerBookingIsPast(b: CareWorkerBooking): boolean {
  const t = Date.parse(`${b.date}T${normalizeTime(b.time)}`);
  return Number.isFinite(t) ? t < Date.now() : false;
}

function normalizeTime(time: string): string {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return "12:00:00";
  let h = Number(m[1]);
  const min = m[2];
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}:00`;
}

export function careAvailabilityDays(count = 5): { date: string; label: string }[] {
  const out: { date: string; label: string }[] = [];
  const start = new Date();
  for (let i = 0; out.length < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const label =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
    out.push({ date, label });
  }
  return out;
}

export const CARE_TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "5:00 PM", "6:30 PM"];
