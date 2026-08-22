/**
 * Vendor business profile — one draft per account, publish overlays care hub catalogs.
 */

import type { CareProvider, FacilityService, ProviderKind, SpecialtyId, VisitType } from "@/lib/appointments";
import type { CareVisitType, CareWorker, CareWorkerKind } from "@/lib/careWorkers";
import type { LabCentre } from "@/lib/labs";
import {
  defaultSpecialisedForVendor,
  sanitizeSpecialisedIn,
  type SpecialisedGroup,
} from "@/lib/specialisedIn";
import {
  formatDateRange,
  formatDiscount,
  loadOfferings,
} from "@/lib/providerOffers";
import {
  defaultPageSections,
  sanitizePageSections,
  listingSection,
  type ListingSection,
} from "@/lib/listingPage";
import {
  apiListPublicListings,
  apiPublishListing,
  apiSaveListingDraft,
  apiUnpublishListing,
} from "@/lib/listingApi";
import { isoDatesInMonth, isPastDate, plusMinutes, timeToMinutes, weekdayLong } from "@/lib/timeSlots";

export type BusinessVendorType =
  | "doctor"
  | "hospital"
  | "clinic"
  | "lab"
  | "pharmacy"
  | "individual"
  | "ambulance";

/** @deprecated legacy drafts may still say "other" — normalized to individual on load */
export type LegacyBusinessVendorType = BusinessVendorType | "other";

export type BusinessOfferingKind = "service" | "bundle" | "offer";

export type BusinessService = {
  id: string;
  kind: BusinessOfferingKind;
  label: string;
  blurb: string;
  feeFrom: number;
  /** Bundle / offer: which regular services are included or discounted */
  includedIds: string[];
  promoCode: string;
  /** Offer window as YYYY-MM-DD */
  offerStart: string;
  offerEnd: string;
};

export const OFFERING_KIND_LABELS: Record<BusinessOfferingKind, string> = {
  service: "Service",
  bundle: "Bundle",
  offer: "Offer",
};

export function newBusinessOffering(
  kind: BusinessOfferingKind,
  label: string,
  feeFrom: number,
): BusinessService {
  return {
    id: newServiceId(),
    kind,
    label,
    blurb: "",
    feeFrom,
    includedIds: [],
    promoCode: "",
    offerStart: "",
    offerEnd: "",
  };
}

export function normalizeBusinessService(raw: Partial<BusinessService> & { id?: string }): BusinessService {
  const kind: BusinessOfferingKind =
    raw.kind === "bundle" || raw.kind === "offer" ? raw.kind : "service";
  return {
    id: raw.id || newServiceId(),
    kind,
    label: String(raw.label ?? "").trim(),
    blurb: String(raw.blurb ?? ""),
    feeFrom: Number(raw.feeFrom) || 0,
    includedIds: Array.isArray(raw.includedIds) ? raw.includedIds.map(String) : [],
    promoCode: String(raw.promoCode ?? "").trim(),
    offerStart: String(raw.offerStart ?? "").trim(),
    offerEnd: String(raw.offerEnd ?? "").trim(),
  };
}

export function formatOfferRange(start: string, end: string): string {
  if (!start && !end) return "";
  if (start && end) return `${start} – ${end}`;
  if (start) return `From ${start}`;
  return `Until ${end}`;
}

export function offeringsAsBusinessServices(orgId: string): BusinessService[] {
  const { bundles, deals, promos } = loadOfferings(orgId);
  const out: BusinessService[] = [];
  for (const b of bundles) {
    out.push({
      id: b.id,
      kind: "bundle",
      label: b.name,
      blurb: b.blurb,
      feeFrom: b.feeFrom,
      includedIds: b.serviceIds,
      promoCode: "",
      offerStart: "",
      offerEnd: "",
    });
  }
  for (const d of deals) {
    out.push({
      id: d.id,
      kind: "offer",
      label: d.title,
      blurb: formatDiscount(d.discountType, d.discountValue),
      feeFrom: 0,
      includedIds: d.targetIds,
      promoCode: "",
      offerStart: d.startDate,
      offerEnd: d.endDate,
    });
  }
  for (const p of promos) {
    out.push({
      id: p.id,
      kind: "offer",
      label: p.label || p.code,
      blurb: formatDiscount(p.discountType, p.discountValue),
      feeFrom: 0,
      includedIds: [...p.serviceIds, ...p.bundleIds],
      promoCode: p.code,
      offerStart: p.startDate,
      offerEnd: p.endDate,
    });
  }
  return out;
}

/** Listing services plus live bundles / deals / codes from Offers. */
export function servicesForHub(profile: BusinessProfile, orgId?: string): BusinessService[] {
  const base = profile.services.filter((s) => s.kind === "service");
  const owner = orgId || profile.ownerId;
  if (!owner) return profile.services;
  return [...base, ...offeringsAsBusinessServices(owner)];
}

export function offeringMeta(item: BusinessService, all: BusinessService[]): string {
  const parts: string[] = [];
  if (item.blurb && item.kind !== "service") parts.push(item.blurb);
  if (item.kind === "bundle" || item.kind === "offer") {
    const names = item.includedIds
      .map((id) => all.find((s) => s.id === id)?.label)
      .filter(Boolean);
    if (names.length) parts.push(names.join(", "));
  }
  if (item.promoCode) parts.push(item.promoCode);
  const range = item.offerStart || item.offerEnd
    ? formatDateRange(item.offerStart, item.offerEnd) || formatOfferRange(item.offerStart, item.offerEnd)
    : "";
  if (range) parts.push(range);
  return parts.join(" · ");
}

export type BusinessCapabilities = {
  virtual: boolean;
  clinic: boolean;
  home: boolean;
  imaging: boolean;
  bloodwork: boolean;
  packages: boolean;
};

export type BusinessHoursSlot = { start: string; end: string };

export type HoursShift = "morning" | "afternoon" | "evening";

export type BusinessDaySchedule = {
  day: string;
  open: boolean;
  start: string;
  end: string;
  /** User-defined available ranges (9:00 AM–11:00 AM enables every 30-minute slot in between). */
  windows: BusinessHoursSlot[];
  slots: BusinessHoursSlot[];
  /** Breaks that sit inside an available window (lunch, etc.). */
  unavailable: BusinessHoursSlot[];
};

export type SlotVisitKey = "clinic" | "virtual";

/** Selected 30-minute slot starts, keyed by ISO date. Missing dates inherit the weekly template. */
export type BusinessSlotAvailability = {
  clinic: Record<string, string[]>;
  virtual: Record<string, string[]>;
  /** In-person slots per affiliated facility / branch hub id → ISO date → starts */
  clinicByLocation?: Record<string, Record<string, string[]>>;
};

export type ListingPublicationKind = "article" | "news" | "publication";

export type ListingPublication = {
  id: string;
  kind: ListingPublicationKind;
  title: string;
  summary: string;
  date?: string;
  imageUrl?: string;
  minutes?: number;
};

export const PUBLICATION_KIND_LABELS: Record<ListingPublicationKind, string> = {
  article: "Article",
  news: "News",
  publication: "Publication",
};

/** Public profile carousel: 3 visible, 3 more on scroll. */
export const MAX_LISTING_PUBLICATIONS = 6;

export function newListingPublication(kind: ListingPublicationKind = "article"): ListingPublication {
  return {
    id: `pub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    title: "",
    summary: "",
  };
}

export function sanitizePublications(raw: unknown): ListingPublication[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row): ListingPublication | null => {
      if (!row || typeof row !== "object") return null;
      const r = row as Partial<ListingPublication>;
      const kind: ListingPublicationKind =
        r.kind === "news" || r.kind === "publication" ? r.kind : "article";
      const title = String(r.title ?? "").trim();
      if (!title) return null;
      const minutes = Number(r.minutes);
      return {
        id: String(r.id || `pub-${title}`),
        kind,
        title,
        summary: String(r.summary ?? "").trim(),
        date: String(r.date ?? "").trim() || undefined,
        imageUrl: String(r.imageUrl ?? "").trim() || undefined,
        minutes: minutes > 0 ? minutes : undefined,
      };
    })
    .filter((p): p is ListingPublication => Boolean(p))
    .slice(0, MAX_LISTING_PUBLICATIONS);
}

function demoPub(
  id: string,
  kind: ListingPublicationKind,
  title: string,
  summary: string,
  minutes: number,
  imageUrl: string,
): ListingPublication {
  return { id, kind, title, summary, minutes, imageUrl };
}

/** Sample publications for a few demo directory listings. Overridden when the owner saves publications (including an empty list). */
const DEMO_LISTING_PUBLICATIONS: Record<string, ListingPublication[]> = {
  "prov-nmc-6": [
    demoPub(
      "nmc-6-fever",
      "article",
      "Fever and infections: when to see a doctor",
      "How to tell a passing illness from symptoms that need a clinician.",
      4,
      "/img/General Physician.png",
    ),
    demoPub(
      "nmc-6-bp",
      "article",
      "Living with high blood pressure",
      "Everyday steps that support blood-pressure care between visits.",
      5,
      "/img/treatments/blood-pressure.png",
    ),
    demoPub(
      "nmc-6-diabetes",
      "article",
      "Diabetes follow-up: what to bring",
      "Readings, medicines, and questions that make a consult more useful.",
      3,
      "/img/treatments/diabetes.png",
    ),
    demoPub(
      "nmc-6-preventive",
      "article",
      "What a preventive health consult covers",
      "Screening, lifestyle, and when a follow-up is the right next step.",
      4,
      "/img/Cardiologist.png",
    ),
    demoPub(
      "nmc-6-online",
      "article",
      "How an online consult works",
      "Video visits, prescriptions when appropriate, and follow-up care.",
      3,
      "/img/Pediatrician.png",
    ),
    demoPub(
      "nmc-6-prepare",
      "publication",
      "How to prepare for your appointment",
      "ID, medicine list, and notes that help your clinician help you.",
      3,
      "/img/Dermatologist.png",
    ),
  ],
  "prov-nmc-5": [
    demoPub(
      "nmc-5-women",
      "article",
      "Making the most of a women’s health visit",
      "Cycle changes, contraception, and questions that help the consult.",
      4,
      "/img/General Physician.png",
    ),
    demoPub(
      "nmc-5-prepare",
      "publication",
      "How to prepare for your appointment",
      "ID, medicine list, and notes that help your clinician help you.",
      3,
      "/img/treatments/blood-pressure.png",
    ),
  ],
  "prov-dda-3711215063850": [
    demoPub(
      "dda-manab-store",
      "article",
      "How to store medicines at home",
      "Heat, moisture, and bathroom cabinets — simple habits that keep medicines effective.",
      4,
      "/img/treatments/uti.png",
    ),
    demoPub(
      "dda-manab-labels",
      "article",
      "Understanding prescription labels",
      "What the directions, warnings, and refill line actually mean.",
      3,
      "/img/General Physician.png",
    ),
    demoPub(
      "dda-manab-generic",
      "article",
      "Generic vs. brand medicines",
      "How generics relate to brand-name products, and what to ask your pharmacist.",
      4,
      "/img/treatments/blood-pressure.png",
    ),
    demoPub(
      "dda-manab-hours",
      "news",
      "Updated dispensing hours",
      "Weekday counter hours and how to send a prescription for review.",
      2,
      "/img/Cardiologist.png",
    ),
    demoPub(
      "dda-manab-safe",
      "article",
      "How to take medicines safely",
      "Timing, missed doses, and when to pause and ask for help.",
      4,
      "/img/Pediatrician.png",
    ),
    demoPub(
      "dda-manab-ask",
      "article",
      "When to ask a pharmacist for help",
      "Side effects, interactions, and questions that belong with a pharmacist.",
      3,
      "/img/Dermatologist.png",
    ),
  ],
  "prov-dda-3711213090457": [
    demoPub(
      "dda-kanchan-safe",
      "article",
      "How to take medicines safely",
      "Timing, missed doses, and when to pause and ask for help.",
      4,
      "/img/treatments/uti.png",
    ),
    demoPub(
      "dda-kanchan-ask",
      "article",
      "When to ask a pharmacist for help",
      "Side effects, interactions, and questions that belong with a pharmacist.",
      3,
      "/img/General Physician.png",
    ),
  ],
  "prov-hf-3060100072": [
    demoPub(
      "hf-peoples-opd",
      "news",
      "OPD schedule this month",
      "How to book an outpatient visit and what to bring to reception.",
      3,
      "/img/treatments/blood-pressure.png",
    ),
    demoPub(
      "hf-peoples-fever",
      "article",
      "Fever and infections: when to come in",
      "What to watch for at home and when an in-person visit is the safer choice.",
      4,
      "/img/General Physician.png",
    ),
    demoPub(
      "hf-peoples-bp",
      "article",
      "Living with high blood pressure",
      "Everyday steps that support blood-pressure care between hospital visits.",
      5,
      "/img/Cardiologist.png",
    ),
    demoPub(
      "hf-peoples-prepare",
      "publication",
      "Preparing for a hospital visit",
      "ID, reports, and questions that help your care team help you.",
      3,
      "/img/treatments/uti.png",
    ),
    demoPub(
      "hf-peoples-online",
      "article",
      "How an online consult works",
      "Video visits, prescriptions when appropriate, and follow-up care.",
      3,
      "/img/Pediatrician.png",
    ),
    demoPub(
      "hf-peoples-hours",
      "news",
      "Updated visiting hours",
      "When the outpatient desk is open and how to send reports ahead.",
      2,
      "/img/Dermatologist.png",
    ),
  ],
  "prov-hf-3060300122": [
    demoPub(
      "hf-shankar-news",
      "news",
      "Outpatient booking reminder",
      "Bring a photo ID and your current medicine list to the desk.",
      2,
      "/img/General Physician.png",
    ),
    demoPub(
      "hf-shankar-preventive",
      "article",
      "What a preventive health consult covers",
      "Screening, lifestyle, and when a follow-up is the right next step.",
      4,
      "/img/treatments/blood-pressure.png",
    ),
  ],
};

/** Published listing content. Saved publications (including an empty list) override demo samples. */
export function publicationsForOwner(ownerId?: string): ListingPublication[] {
  if (!ownerId) return [];
  const pub = getPublishedForOwner(ownerId);
  if (pub && Array.isArray(pub.publications)) {
    const pubsOn = listingSection(pub.pageSections, "publications");
    if (pubsOn && !pubsOn.enabled) return [];
    return sanitizePublications(pub.publications);
  }
  const stored = readJson<BusinessProfile>(draftKey(ownerId));
  if (stored && Array.isArray(stored.publications)) {
    return sanitizePublications(stored.publications);
  }
  return DEMO_LISTING_PUBLICATIONS[ownerId] ?? [];
}

export function ownerIdForListing(publishedId?: string, claimOwnerId?: string): string | undefined {
  if (claimOwnerId) return claimOwnerId;
  if (!publishedId) return undefined;
  const pub = getPublishedByHubId(publishedId);
  if (pub?.ownerId) return pub.ownerId;
  return publishedIndex()[publishedId];
}

export type BusinessProfile = {
  type: BusinessVendorType;
  name: string;
  subtitle: string;
  bio: string;
  about: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  /** College / business licence or registration number */
  licenseNumber: string;
  hours: string;
  /** Structured weekly hours; `hours` stays a short summary for hubs */
  schedule: BusinessDaySchedule[];
  /** Per-date tapped slots; weekly `schedule` is derived for summaries */
  slotAvailability: BusinessSlotAvailability;
  services: BusinessService[];
  capabilities: BusinessCapabilities;
  /** Doctor/hospital consult fee; individual fee from */
  feeFrom: number;
  /** Free-text specialty labels (mapped to general specialty on hub) */
  specialtyNote: string;
  /** Departments / procedures shown on the public profile accordion */
  specialisedIn: SpecialisedGroup[];
  rating: number;
  nextAvailable: string;
  emoji: string;
  imageUrl: string;
  publishedId?: string;
  /** Provider account that owns this listing — used to load Offers */
  ownerId?: string;
  status: "draft" | "published";
  updatedAt: string;
  /** News, articles, and other verified publications shown on the public profile */
  publications: ListingPublication[];
  /** Public landing sections — add, hide, edit, and publish */
  pageSections: ListingSection[];
  /** Doctor listings: published hospital/clinic hub ids this clinician practises at */
  affiliatedFacilityIds: string[];
};

export const BUSINESS_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const DEFAULT_SLOT: BusinessHoursSlot = { start: "9:00 AM", end: "5:00 PM" };
const OPEN_SLOT: BusinessHoursSlot = { start: "9:00 AM", end: "9:30 AM" };
export const EMPTY_UNAVAILABLE: BusinessHoursSlot = { start: "", end: "" };

const SHIFT_BAND: Record<HoursShift, { start: string; end: string }> = {
  morning: { start: "12:00 AM", end: "12:00 PM" },
  afternoon: { start: "12:00 PM", end: "5:00 PM" },
  evening: { start: "5:00 PM", end: "11:30 PM" },
};

const SHIFT_CUTS = ["12:00 PM", "5:00 PM"];

function laterTime(a: string, b: string) {
  return timeToMinutes(a) >= timeToMinutes(b) ? a : b;
}

function earlierTime(a: string, b: string) {
  return timeToMinutes(a) <= timeToMinutes(b) ? a : b;
}

function isDraftSlot(slot: Partial<BusinessHoursSlot>) {
  const start = String(slot.start || "");
  const end = String(slot.end || "");
  if (!start || !end) return true;
  return timeToMinutes(end) <= timeToMinutes(start);
}

function validRange(slot: Partial<BusinessHoursSlot>): BusinessHoursSlot | null {
  const start = String(slot.start || "");
  const end = String(slot.end || "");
  if (timeToMinutes(start) < 0 || timeToMinutes(end) <= timeToMinutes(start)) return null;
  return { start, end };
}

function coerceRanges(raw: unknown): BusinessHoursSlot[] {
  if (!Array.isArray(raw)) return [];
  const out: BusinessHoursSlot[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const range = validRange({ start: item, end: plusMinutes(item, 30) || "" });
      if (range) out.push(range);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const rec = item as BusinessHoursSlot;
    const range = validRange({ start: rec.start, end: rec.end });
    if (range) out.push(range);
  }
  return mergeRanges(out);
}

function coerceUnavailable(raw: unknown): { blocked: BusinessHoursSlot[]; drafts: BusinessHoursSlot[] } {
  if (!Array.isArray(raw)) return { blocked: [], drafts: [] };
  const blocked: BusinessHoursSlot[] = [];
  const drafts: BusinessHoursSlot[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const range = validRange({ start: item, end: plusMinutes(item, 30) || "" });
      if (range) blocked.push(range);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const rec = item as BusinessHoursSlot;
    if (isDraftSlot(rec)) {
      drafts.push({ start: String(rec.start || ""), end: String(rec.end || "") });
      continue;
    }
    const range = validRange(rec);
    if (range) blocked.push(range);
  }
  return { blocked: mergeRanges(blocked), drafts };
}

export function mergeRanges(ranges: BusinessHoursSlot[]): BusinessHoursSlot[] {
  const ordered = [...ranges]
    .map(validRange)
    .filter((r): r is BusinessHoursSlot => Boolean(r))
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const out: BusinessHoursSlot[] = [];
  for (const range of ordered) {
    const last = out[out.length - 1];
    if (last && timeToMinutes(range.start) <= timeToMinutes(last.end)) {
      last.end = laterTime(last.end, range.end);
      continue;
    }
    out.push({ ...range });
  }
  return out;
}

export function subtractRanges(available: BusinessHoursSlot[], blocked: BusinessHoursSlot[]): BusinessHoursSlot[] {
  let current = mergeRanges(available);
  for (const cut of mergeRanges(blocked)) {
    const next: BusinessHoursSlot[] = [];
    for (const range of current) {
      if (timeToMinutes(cut.end) <= timeToMinutes(range.start) || timeToMinutes(cut.start) >= timeToMinutes(range.end)) {
        next.push(range);
        continue;
      }
      const left = validRange({ start: range.start, end: cut.start });
      const right = validRange({ start: cut.end, end: range.end });
      if (left) next.push(left);
      if (right) next.push(right);
    }
    current = next;
  }
  return mergeRanges(current);
}

function clipToCoverage(ranges: BusinessHoursSlot[], coverage: BusinessHoursSlot[]): BusinessHoursSlot[] {
  const hits: BusinessHoursSlot[] = [];
  for (const range of ranges) {
    for (const cover of coverage) {
      const hit = validRange({
        start: laterTime(range.start, cover.start),
        end: earlierTime(range.end, cover.end),
      });
      if (hit) hits.push(hit);
    }
  }
  return mergeRanges(hits);
}

export function splitAtShiftBounds(ranges: BusinessHoursSlot[]): BusinessHoursSlot[] {
  const out: BusinessHoursSlot[] = [];
  for (const range of mergeRanges(ranges)) {
    let t = range.start;
    const endM = timeToMinutes(range.end);
    for (const cut of SHIFT_CUTS) {
      const cutM = timeToMinutes(cut);
      if (cutM > timeToMinutes(t) && cutM < endM) {
        const piece = validRange({ start: t, end: cut });
        if (piece) out.push(piece);
        t = cut;
      }
    }
    const rest = validRange({ start: t, end: range.end });
    if (rest) out.push(rest);
  }
  return out;
}

function applyDayHours(row: Partial<BusinessDaySchedule> & { day: string }): BusinessDaySchedule {
  const open = Boolean(row.open);
  let windows = coerceRanges(row.windows);
  if (!windows.length) {
    if (!Array.isArray(row.windows)) {
      if (row.start && row.end) {
        const overall = validRange({ start: row.start, end: row.end });
        if (overall) windows = [overall];
      } else if (row.slots?.length) {
        windows = coerceRanges(row.slots);
      }
    }
  }
  if (open && !windows.length && !Array.isArray(row.windows)) windows = [{ ...OPEN_SLOT }];
  windows = mergeRanges(windows);

  const { blocked, drafts } = coerceUnavailable(row.unavailable);
  const clipped = clipToCoverage(blocked, windows);
  const unavailable = [...clipped, ...drafts];
  const trueAvailable = subtractRanges(windows, clipped);
  const slots = open
    ? trueAvailable.flatMap((range) => expandHourRange(range.start, range.end))
    : [];
  const start = windows[0]?.start || "";
  const end = windows.length
    ? windows.reduce((latest, w) => laterTime(latest, w.end), windows[0].end)
    : "";
  return { day: row.day, open, start, end, windows, unavailable, slots };
}

export function normalizeDaySchedule(row: Partial<BusinessDaySchedule> & { day: string }): BusinessDaySchedule {
  return applyDayHours({
    day: row.day,
    open: Boolean(row.open),
    start: row.start || DEFAULT_SLOT.start,
    end: row.end || DEFAULT_SLOT.end,
    windows: row.windows,
    slots: row.slots,
    unavailable: row.unavailable,
  });
}

export function daySlots(row: BusinessDaySchedule): BusinessHoursSlot[] {
  return normalizeDaySchedule(row).slots;
}

export function formatDayHours(row: BusinessDaySchedule): string {
  const normalized = normalizeDaySchedule(row);
  if (!normalized.open) return "Closed";
  if (!normalized.slots.length) return normalized.windows.length ? "Unavailable" : "Closed";
  return contiguousRanges(normalized.slots)
    .map((s) => `${s.start}–${s.end}`)
    .join(" · ");
}

/** Merge back-to-back 30-minute windows into one start–end range. */
export function contiguousRanges(slots: BusinessHoursSlot[]): BusinessHoursSlot[] {
  const ordered = [...slots].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const ranges: BusinessHoursSlot[] = [];
  for (const slot of ordered) {
    const last = ranges[ranges.length - 1];
    if (last && timeToMinutes(last.end) === timeToMinutes(slot.start)) {
      last.end = slot.end;
      continue;
    }
    ranges.push({ start: slot.start, end: slot.end });
  }
  return ranges;
}

export function expandHourRange(start: string, end: string): BusinessHoursSlot[] {
  const startM = timeToMinutes(start);
  const endM = timeToMinutes(end);
  if (startM < 0 || endM < 0 || startM >= endM) return [{ start, end }];
  const out: BusinessHoursSlot[] = [];
  let t = start;
  while (timeToMinutes(t) < endM) {
    const n = plusMinutes(t, 30);
    if (!n || timeToMinutes(n) > endM) {
      out.push({ start: t, end });
      break;
    }
    out.push({ start: t, end: n });
    t = n;
  }
  return out.length ? out : [{ start, end }];
}

export function shiftOfStart(start: string): HoursShift {
  const m = timeToMinutes(start);
  if (m < 12 * 60) return "morning";
  if (m < 17 * 60) return "afternoon";
  return "evening";
}

export function coveredShifts(start: string, end: string): HoursShift[] {
  const all: HoursShift[] = ["morning", "afternoon", "evening"];
  return all.filter((shift) => {
    const band = SHIFT_BAND[shift];
    return timeToMinutes(start) < timeToMinutes(band.end) && timeToMinutes(end) > timeToMinutes(band.start);
  });
}

export function splitRangeByShift(start: string, end: string): { shift: HoursShift; start: string; end: string }[] {
  return splitAtShiftBounds([{ start, end }]).map((range) => ({
    shift: shiftOfStart(range.start),
    start: range.start,
    end: range.end,
  }));
}

export function availabilityShiftPieces(slots: BusinessHoursSlot[]) {
  return contiguousRanges(slots).flatMap((range) => splitRangeByShift(range.start, range.end));
}

export function displayAvailable(row: BusinessDaySchedule): BusinessHoursSlot[] {
  const normalized = normalizeDaySchedule(row);
  if (!normalized.open) return [];
  const blocked = dayUnavailable(normalized).filter((slot) => !isDraftSlot(slot));
  return splitAtShiftBounds(subtractRanges(dayWindows(normalized), blocked));
}

export function groupDisplaySegments(segments: BusinessHoursSlot[]) {
  const groups: { shift: HoursShift; items: { slot: BusinessHoursSlot; index: number }[] }[] = [];
  segments.forEach((slot, index) => {
    const shift = shiftOfStart(slot.start);
    const last = groups[groups.length - 1];
    if (last && last.shift === shift) {
      last.items.push({ slot, index });
      return;
    }
    groups.push({ shift, items: [{ slot, index }] });
  });
  return groups;
}

export function dayHasShift(row: BusinessDaySchedule, shift: HoursShift) {
  return displayAvailable(row).some((slot) => shiftOfStart(slot.start) === shift);
}

export function dayWindows(row: BusinessDaySchedule): BusinessHoursSlot[] {
  return normalizeDaySchedule(row).windows;
}

export function dayUnavailable(row: BusinessDaySchedule): BusinessHoursSlot[] {
  return normalizeDaySchedule(row).unavailable;
}

export function setDayBounds(row: BusinessDaySchedule, start: string, end: string): BusinessDaySchedule {
  const bound = validRange({ start, end }) || OPEN_SLOT;
  return applyDayHours({ ...row, open: true, windows: [bound], start: bound.start, end: bound.end });
}

export function setDayWindow(row: BusinessDaySchedule, start: string, end: string): BusinessDaySchedule {
  return setDayBounds(row, start, end);
}

export function setDisplayAvailableAt(
  row: BusinessDaySchedule,
  index: number,
  partial: Partial<BusinessHoursSlot>,
): BusinessDaySchedule {
  const segments = displayAvailable(row);
  const current = segments[index];
  if (!current) return row;
  const nextSeg = validRange({ ...current, ...partial });
  if (!nextSeg) return row;
  const rest = segments.filter((_, i) => i !== index);
  const windows = mergeRanges([...subtractRanges(dayWindows(row), [current]), nextSeg, ...rest]);
  const unavailable = dayUnavailable(row).map((slot) =>
    isDraftSlot(slot) ? slot : slot,
  );
  const blocked = subtractRanges(
    unavailable.filter((slot) => !isDraftSlot(slot)),
    [nextSeg],
  );
  const drafts = unavailable.filter(isDraftSlot);
  return applyDayHours({ ...row, open: true, windows, unavailable: [...blocked, ...drafts] });
}

export function removeDisplayAvailableAt(row: BusinessDaySchedule, index: number): BusinessDaySchedule {
  const segments = displayAvailable(row);
  const current = segments[index];
  if (!current) return row;
  const windows = subtractRanges(dayWindows(row), [current]);
  if (!windows.length) return applyDayHours({ ...row, open: false, windows: [], unavailable: [] });
  return applyDayHours({ ...row, open: true, windows });
}

export function addDayWindow(row: BusinessDaySchedule): BusinessDaySchedule {
  const windows = dayWindows(row);
  const last = windows[windows.length - 1];
  const start = last?.end || OPEN_SLOT.start;
  const end = plusMinutes(start, 30);
  if (!end) return row;
  return applyAddedRange(row, { start, end });
}

function applyAddedRange(row: BusinessDaySchedule, candidate: BusinessHoursSlot): BusinessDaySchedule {
  return applyDayHours({
    ...row,
    open: true,
    windows: mergeRanges([...dayWindows(row), candidate]),
    unavailable: [
      ...subtractRanges(
        dayUnavailable(row).filter((slot) => !isDraftSlot(slot)),
        [candidate],
      ),
      ...dayUnavailable(row).filter(isDraftSlot),
    ],
  });
}

export function nextShiftSlot(row: BusinessDaySchedule, shift: HoursShift): BusinessHoursSlot | null {
  const band = SHIFT_BAND[shift];
  const shown = displayAvailable(row);
  const items = shown.filter((slot) => shiftOfStart(slot.start) === shift);
  const last = items[items.length - 1];
  if (!last) return null;

  const tryAt = (start: string): BusinessHoursSlot | null => {
    const end = plusMinutes(start, 30);
    if (!end) return null;
    if (timeToMinutes(start) < timeToMinutes(band.start) || timeToMinutes(start) >= timeToMinutes(band.end)) return null;
    if (timeToMinutes(end) > timeToMinutes(band.end)) return null;
    const candidate = { start, end };
    if (shown.some((slot) => rangesOverlap(slot, candidate))) return null;
    return candidate;
  };

  const afterLast = tryAt(last.end);
  if (afterLast) return afterLast;

  let cursor: string | null = items[0].start;
  while (cursor && timeToMinutes(cursor) < timeToMinutes(band.end)) {
    const hit = tryAt(cursor);
    if (hit) return hit;
    cursor = plusMinutes(cursor, 30);
  }
  return null;
}

export function canAddShiftSlot(row: BusinessDaySchedule, shift: HoursShift) {
  return Boolean(nextShiftSlot(row, shift));
}

export function addNextShiftSlot(row: BusinessDaySchedule, shift: HoursShift): BusinessDaySchedule {
  const candidate = nextShiftSlot(row, shift);
  if (!candidate) return row;
  return applyAddedRange(row, candidate);
}

export function canAddUnavailable(row: BusinessDaySchedule) {
  const unavailable = dayUnavailable(row);
  if (!unavailable.length) return false;
  return !unavailable.some(isDraftSlot);
}

function rangesOverlap(a: BusinessHoursSlot, b: BusinessHoursSlot) {
  return timeToMinutes(a.start) < timeToMinutes(b.end) && timeToMinutes(a.end) > timeToMinutes(b.start);
}

const SHIFT_PREFERRED_START: Record<HoursShift, string> = {
  morning: "9:00 AM",
  afternoon: "12:00 PM",
  evening: "5:00 PM",
};

export function removeShiftFromDay(row: BusinessDaySchedule, shift: HoursShift): BusinessDaySchedule {
  const band = SHIFT_BAND[shift];
  const windows = subtractRanges(dayWindows(row), [{ start: band.start, end: band.end }]);
  return applyDayHours({ ...row, open: true, windows });
}

export function toggleDayShift(row: BusinessDaySchedule, shift: HoursShift): BusinessDaySchedule {
  if (dayHasShift(row, shift)) return removeShiftFromDay(row, shift);
  return addDayWindowForShift(row, shift);
}

export function addDayWindowForShift(row: BusinessDaySchedule, shift: HoursShift): BusinessDaySchedule {
  const windows = dayWindows(row);
  const shown = displayAvailable(row);
  const band = SHIFT_BAND[shift];
  let start: string | null = SHIFT_PREFERRED_START[shift];
  while (start && timeToMinutes(start) < timeToMinutes(band.end)) {
    const end = plusMinutes(start, 30);
    if (!end) break;
    const candidate = { start, end };
    const inBand =
      timeToMinutes(start) >= timeToMinutes(band.start) && timeToMinutes(start) < timeToMinutes(band.end);
    if (inBand && !shown.some((slot) => rangesOverlap(slot, candidate))) {
      return applyDayHours({
        ...row,
        open: true,
        windows: mergeRanges([...windows, candidate]),
        unavailable: [
          ...subtractRanges(
            dayUnavailable(row).filter((slot) => !isDraftSlot(slot)),
            [candidate],
          ),
          ...dayUnavailable(row).filter(isDraftSlot),
        ],
      });
    }
    start = plusMinutes(start, 30);
  }
  return row;
}

export function addDaySlot(row: BusinessDaySchedule): BusinessDaySchedule {
  return addDayWindow(row);
}

export function addDayUnavailable(row: BusinessDaySchedule, range?: Partial<BusinessHoursSlot>): BusinessDaySchedule {
  const next = range && !isDraftSlot(range) ? validRange(range) : { ...EMPTY_UNAVAILABLE };
  if (range && !next) return row;
  return applyDayHours({
    ...row,
    open: true,
    unavailable: [...dayUnavailable(row), next || EMPTY_UNAVAILABLE],
  });
}

export function setDayUnavailableAt(
  row: BusinessDaySchedule,
  index: number,
  partial: Partial<BusinessHoursSlot>,
): BusinessDaySchedule {
  const unavailable = [...dayUnavailable(row)];
  const current = unavailable[index];
  if (!current) return row;
  unavailable[index] = { ...current, ...partial };
  return applyDayHours({ ...row, open: true, unavailable });
}

export function removeDayUnavailable(row: BusinessDaySchedule, index: number): BusinessDaySchedule {
  return applyDayHours({
    ...row,
    unavailable: dayUnavailable(row).filter((_, i) => i !== index),
  });
}


export function setDayFromWindows(
  row: BusinessDaySchedule,
  windows: { start: string; end: string }[],
): BusinessDaySchedule {
  if (!windows.length) return applyDayHours({ ...row, open: false, windows: [], unavailable: [] });
  return applyDayHours({ ...row, open: true, windows });
}

export function toggleDayOpen(row: BusinessDaySchedule, open: boolean): BusinessDaySchedule {
  const fallback = OPEN_SLOT;
  return applyDayHours({
    ...row,
    open,
    start: row.start || fallback.start,
    end: row.end || fallback.end,
    windows: row.windows?.length ? row.windows : [{ start: row.start || fallback.start, end: row.end || fallback.end }],
  });
}


export function defaultBusinessSchedule(): BusinessDaySchedule[] {
  return BUSINESS_WEEKDAYS.map((day) =>
    normalizeDaySchedule({
      day,
      open: day !== "Saturday" && day !== "Sunday",
      start: "9:00 AM",
      end: "9:30 AM",
    }),
  );
}

export function emptySlotAvailability(): BusinessSlotAvailability {
  return { clinic: {}, virtual: {}, clinicByLocation: {} };
}

/** Branches a provider can schedule In person at — affiliated facilities for doctors, self for hospitals/clinics. */
export function availabilityBranchesForProfile(
  profile: Pick<
    BusinessProfile,
    "type" | "name" | "city" | "address" | "publishedId" | "affiliatedFacilityIds"
  >,
): { id: string; label: string }[] {
  if (profile.type === "doctor") {
    const ids = profile.affiliatedFacilityIds ?? [];
    const rows = ids
      .map((id) => {
        const f = getPublishedByHubId(id);
        if (!f) return null;
        const label =
          f.city && f.name && !f.name.toLowerCase().includes(f.city.toLowerCase())
            ? `${f.name} · ${f.city}`
            : f.name || f.city || id;
        return { id, label };
      })
      .filter((row): row is { id: string; label: string } => Boolean(row));
    if (rows.length) return rows;
  }
  const selfId = profile.publishedId || "primary";
  if (profile.address?.trim() && profile.city?.trim()) {
    return [{ id: selfId, label: `${profile.name || profile.city} · ${profile.city}` }];
  }
  if (profile.city?.trim()) return [{ id: selfId, label: profile.city.trim() }];
  if (profile.address?.trim()) return [{ id: selfId, label: profile.address.trim() }];
  if (profile.name?.trim()) return [{ id: selfId, label: profile.name.trim() }];
  return [];
}

export function slotStartsFromDay(row: BusinessDaySchedule): string[] {
  return daySlots(row)
    .map((slot) => slot.start)
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

export function dayFromSlotStarts(day: string, starts: string[]): BusinessDaySchedule {
  const pieces = [...new Set(starts)]
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
    .map((start) => {
      const end = plusMinutes(start, 30);
      return end ? { start, end } : null;
    })
    .filter((slot): slot is BusinessHoursSlot => Boolean(slot));
  const windows = contiguousRanges(pieces);
  if (!windows.length) return applyDayHours({ day, open: false, windows: [] });
  return applyDayHours({ day, open: true, windows, unavailable: [] });
}

export function normalizeSlotAvailability(
  raw: unknown,
  _schedule?: BusinessDaySchedule[],
): BusinessSlotAvailability {
  if (!raw || typeof raw !== "object") return emptySlotAvailability();
  const rec = raw as Partial<BusinessSlotAvailability>;
  const copy = (value: unknown): Record<string, string[]> => {
    if (!value || typeof value !== "object") return {};
    const out: Record<string, string[]> = {};
    for (const [iso, starts] of Object.entries(value as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Array.isArray(starts)) continue;
      out[iso] = starts.map(String).filter((t) => timeToMinutes(t) >= 0);
    }
    return out;
  };
  const byLoc: Record<string, Record<string, string[]>> = {};
  if (rec.clinicByLocation && typeof rec.clinicByLocation === "object") {
    for (const [locId, days] of Object.entries(rec.clinicByLocation)) {
      const mapped = copy(days);
      if (Object.keys(mapped).length) byLoc[locId] = mapped;
    }
  }
  return { clinic: copy(rec.clinic), virtual: copy(rec.virtual), clinicByLocation: byLoc };
}

function clinicMapForLocation(
  availability: BusinessSlotAvailability,
  locationId?: string,
): Record<string, string[]> {
  if (locationId && availability.clinicByLocation?.[locationId]) {
    return availability.clinicByLocation[locationId];
  }
  return availability.clinic ?? {};
}

export function slotsForAvailabilityDate(
  availability: BusinessSlotAvailability,
  schedule: BusinessDaySchedule[],
  iso: string,
  visit: SlotVisitKey,
  locationId?: string,
): string[] {
  const map =
    visit === "clinic" ? clinicMapForLocation(availability, locationId) : availability.virtual ?? {};
  if (Object.prototype.hasOwnProperty.call(map, iso)) return [...map[iso]];
  const day = weekdayLong(iso);
  const row = schedule.find((item) => item.day === day);
  return row ? slotStartsFromDay(row) : [];
}

/** Slots already claimed by the other visit type on this date (cannot double-book the clinician).
 * Only explicit per-date selections count — weekly template inheritance does not block the other visit. */
export function conflictingSlotsForVisit(
  availability: BusinessSlotAvailability,
  _schedule: BusinessDaySchedule[],
  iso: string,
  visit: SlotVisitKey,
  locationId?: string,
): string[] {
  if (visit === "clinic") {
    const map = availability.virtual ?? {};
    return Object.prototype.hasOwnProperty.call(map, iso) ? [...map[iso]] : [];
  }
  const map = clinicMapForLocation(availability, locationId);
  return Object.prototype.hasOwnProperty.call(map, iso) ? [...map[iso]] : [];
}

export function setSlotsForAvailabilityDate(
  availability: BusinessSlotAvailability,
  schedule: BusinessDaySchedule[],
  iso: string,
  visit: SlotVisitKey,
  starts: string[],
  locationId?: string,
): { availability: BusinessSlotAvailability; schedule: BusinessDaySchedule[] } {
  const unique = [...new Set(starts)].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  const nextAvailability: BusinessSlotAvailability = {
    clinic: { ...availability.clinic },
    virtual: { ...availability.virtual },
    clinicByLocation: { ...(availability.clinicByLocation ?? {}) },
  };
  if (visit === "virtual") {
    nextAvailability.virtual = { ...nextAvailability.virtual, [iso]: unique };
  } else if (locationId) {
    nextAvailability.clinicByLocation = {
      ...nextAvailability.clinicByLocation,
      [locationId]: {
        ...(nextAvailability.clinicByLocation?.[locationId] ?? {}),
        [iso]: unique,
      },
    };
    // Keep legacy clinic map in sync for the primary / only branch.
    nextAvailability.clinic = { ...nextAvailability.clinic, [iso]: unique };
  } else {
    nextAvailability.clinic = { ...nextAvailability.clinic, [iso]: unique };
  }
  const nextSchedule =
    visit === "clinic"
      ? schedule.map((row) => (row.day === weekdayLong(iso) ? dayFromSlotStarts(row.day, unique) : row))
      : schedule;
  return { availability: nextAvailability, schedule: nextSchedule };
}

function sameStarts(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const left = [...a].sort((x, y) => timeToMinutes(x) - timeToMinutes(y));
  const right = [...b].sort((x, y) => timeToMinutes(x) - timeToMinutes(y));
  return left.every((t, i) => t === right[i]);
}

/** Write the same slot starts onto every non-past day in the month of `iso`. */
export function setSlotsForAvailabilityMonth(
  availability: BusinessSlotAvailability,
  schedule: BusinessDaySchedule[],
  iso: string,
  visit: SlotVisitKey,
  starts: string[],
  locationId?: string,
): { availability: BusinessSlotAvailability; schedule: BusinessDaySchedule[] } {
  const unique = [...new Set(starts)].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  let nextAvail = availability;
  let nextSchedule = schedule;
  for (const day of isoDatesInMonth(iso)) {
    if (isPastDate(day)) continue;
    const other = conflictingSlotsForVisit(nextAvail, nextSchedule, day, visit, locationId);
    const filtered = unique.filter((t) => !other.includes(t));
    const written = setSlotsForAvailabilityDate(
      nextAvail,
      nextSchedule,
      day,
      visit,
      filtered,
      locationId,
    );
    nextAvail = written.availability;
    nextSchedule = written.schedule;
  }
  return { availability: nextAvail, schedule: nextSchedule };
}

export function monthAvailabilityIsSynced(
  availability: BusinessSlotAvailability,
  schedule: BusinessDaySchedule[],
  iso: string,
  visit: SlotVisitKey,
  starts: string[],
  locationId?: string,
): boolean {
  for (const day of isoDatesInMonth(iso)) {
    if (isPastDate(day)) continue;
    const other = conflictingSlotsForVisit(availability, schedule, day, visit, locationId);
    const expected = starts.filter((t) => !other.includes(t));
    const actual = slotsForAvailabilityDate(availability, schedule, day, visit, locationId);
    if (!sameStarts(expected, actual)) return false;
  }
  return true;
}

export function summarizeSchedule(schedule: BusinessDaySchedule[]): string {
  const open = schedule.map(normalizeDaySchedule).filter((d) => d.open && d.slots.length);
  if (open.length === 0) return "Closed";
  const weekdays = open.filter((d) =>
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(d.day),
  );
  const fingerprint = (d: BusinessDaySchedule) =>
    `${d.start}|${d.end}|${d.windows.map((w) => `${w.start}-${w.end}`).join(",")}|${d.unavailable.map((w) => `${w.start}-${w.end}`).join(",")}`;
  if (weekdays.length === 5 && weekdays.every((d) => fingerprint(d) === fingerprint(weekdays[0])) && open.length === 5) {
    const extra = weekdays[0].unavailable.length
      ? ` except ${weekdays[0].unavailable.map((w) => `${w.start}–${w.end}`).join(", ")}`
      : "";
    return `Mon–Fri ${weekdays[0].start}–${weekdays[0].end}${extra}`;
  }
  return open.map((d) => `${d.day.slice(0, 3)} ${formatDayHours(d)}`).join(" · ");
}

export const SERVICE_PRESETS: Record<BusinessVendorType, string[]> = {
  doctor: ["General consultation", "Follow-up", "Virtual visit", "Prescription renewal"],
  hospital: ["Emergency", "Inpatient care", "Surgery", "Diagnostics", "Specialist clinics"],
  clinic: [
    "General consultation",
    "Specialist consultation",
    "Lab tests",
    "Pharmacy",
    "Emergency",
    "Surgery",
  ],
  lab: ["Blood work", "Imaging", "Packages", "Home collection"],
  pharmacy: ["Prescription fills", "Compounding", "Delivery", "Immunizations"],
  individual: ["Home visit", "Companion care", "Therapy session"],
  ambulance: ["Emergency transport", "Non-emergency transfer", "Event standby"],
};

/** Legacy global draft (patient-era). Not used for new provider-scoped listings. */
const LEGACY_DRAFT_KEY = "pp.businessProfile.v1";
const PUB_KEY = "pp.businessPublished.v1";
const PUB_INDEX_KEY = "pp.businessPublishedIndex.v1";
const memoryPublished = new Map<string, BusinessProfile>();

function draftKey(providerId: string) {
  return `pp.businessProfile.${providerId}`;
}

function publishedKey(ownerId: string) {
  return `pp.businessPublished.${ownerId}`;
}

function publishedIndex(): Record<string, string> {
  return readJson<Record<string, string>>(PUB_INDEX_KEY) ?? {};
}

function writePublishedIndex(map: Record<string, string>) {
  writeJson(PUB_INDEX_KEY, map);
}

function rememberPublished(profile: BusinessProfile) {
  if (!profile.publishedId || profile.status !== "published") return;
  const next = normalizeDraft(profile);
  memoryPublished.set(profile.publishedId, next);
  if (profile.ownerId) {
    writeJson(publishedKey(profile.ownerId), next);
    const idx = publishedIndex();
    idx[profile.publishedId] = profile.ownerId;
    writePublishedIndex(idx);
  }
}

function forgetPublished(ownerId: string, publishedId?: string) {
  localStorage.removeItem(publishedKey(ownerId));
  if (publishedId) memoryPublished.delete(publishedId);
  const idx = publishedIndex();
  const next: Record<string, string> = {};
  for (const [id, owner] of Object.entries(idx)) {
    if (owner === ownerId || id === publishedId) continue;
    next[id] = owner;
  }
  writePublishedIndex(next);
}

export const VENDOR_TYPE_LABELS: Record<BusinessVendorType, string> = {
  doctor: "Doctor",
  hospital: "Hospital",
  clinic: "Clinic",
  lab: "Lab",
  pharmacy: "Pharmacy",
  individual: "Individual vendor",
  ambulance: "Ambulance",
};

export const SIGNUP_VENDOR_TYPES: BusinessVendorType[] = [
  "hospital",
  "clinic",
  "doctor",
  "lab",
  "pharmacy",
  "individual",
  "ambulance",
];

export function normalizeVendorType(type: string | undefined): BusinessVendorType {
  if (type === "other") return "individual";
  if (type && type in VENDOR_TYPE_LABELS) return type as BusinessVendorType;
  return "doctor";
}

export function emptyBusinessProfile(type: BusinessVendorType = "doctor"): BusinessProfile {
  const schedule = defaultBusinessSchedule();
  return {
    type,
    name: "",
    subtitle: "",
    bio: "",
    about: "",
    city: "Toronto",
    address: "",
    phone: "",
    email: "",
    website: "",
    licenseNumber: "",
    hours: summarizeSchedule(schedule),
    schedule,
    slotAvailability: emptySlotAvailability(),
    services: [],
    capabilities: defaultCapabilities(type),
    feeFrom: type === "lab" ? 0 : 79,
    specialtyNote: "",
    specialisedIn: defaultSpecialisedForVendor(type),
    rating: 4.8,
    nextAvailable: "Today",
    emoji: defaultEmoji(type),
    imageUrl: defaultImage(type),
    status: "draft",
    updatedAt: new Date().toISOString(),
    publications: [],
    pageSections: defaultPageSections(type),
    affiliatedFacilityIds: [],
  };
}

function defaultCapabilities(type: BusinessVendorType): BusinessCapabilities {
  return {
    virtual: type === "doctor" || type === "clinic" || type === "individual",
    clinic:
      type === "doctor" ||
      type === "hospital" ||
      type === "clinic" ||
      type === "individual" ||
      type === "pharmacy",
    home: type === "individual" || type === "ambulance",
    imaging: type === "lab" || type === "hospital",
    bloodwork: type === "lab",
    packages: type === "lab",
  };
}

function defaultEmoji(type: BusinessVendorType): string {
  switch (type) {
    case "doctor":
      return "🩺";
    case "hospital":
      return "🏥";
    case "clinic":
      return "🏨";
    case "lab":
      return "🧪";
    case "pharmacy":
      return "💊";
    case "individual":
      return "👤";
    case "ambulance":
      return "🚑";
  }
}

function defaultImage(type: BusinessVendorType): string {
  if (type === "hospital" || type === "clinic") return "/img/treatments/blood-pressure.png";
  if (type === "lab") return "/img/treatments/uti.png";
  if (type === "pharmacy") return "/img/treatments/uti.png";
  if (type === "ambulance") return "/img/treatments/blood-pressure.png";
  return "/img/Cardiologist.png";
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeDraft(stored: BusinessProfile): BusinessProfile {
  const type = normalizeVendorType(stored.type as string);
  const base = emptyBusinessProfile(type);
  const schedule =
    Array.isArray(stored.schedule) && stored.schedule.length > 0
      ? BUSINESS_WEEKDAYS.map((day) => {
          const row = stored.schedule.find((s) => s.day === day);
          return normalizeDaySchedule(
            row ?? {
              day,
              open: day !== "Saturday" && day !== "Sunday",
              start: "9:00 AM",
              end: "9:30 AM",
            },
          );
        })
      : base.schedule;
  return {
    ...base,
    ...stored,
    type,
    email: String(stored.email ?? "").trim(),
    website: String(stored.website ?? "").trim(),
    licenseNumber: String(stored.licenseNumber ?? "").trim(),
    schedule,
    slotAvailability: normalizeSlotAvailability(stored.slotAvailability, schedule),
    hours: String(stored.hours ?? "").trim() || summarizeSchedule(schedule),
    capabilities: { ...defaultCapabilities(type), ...stored.capabilities },
    services: Array.isArray(stored.services)
      ? stored.services.map((s) => normalizeBusinessService(s))
      : [],
    specialisedIn: (() => {
      const groups = sanitizeSpecialisedIn(stored.specialisedIn);
      return groups.length
        ? groups
        : defaultSpecialisedForVendor(type, {
            degree: stored.specialtyNote,
            subtitle: stored.subtitle,
            name: stored.name,
          });
    })(),
    publications: Array.isArray(stored.publications)
      ? stored.publications
          .map((row) => ({
            id: String(row?.id || `pub-${Math.random().toString(36).slice(2, 8)}`),
            kind:
              row?.kind === "news" || row?.kind === "publication" ? row.kind : ("article" as const),
            title: String(row?.title ?? ""),
            summary: String(row?.summary ?? ""),
            date: String(row?.date ?? "").trim() || undefined,
            imageUrl: String(row?.imageUrl ?? "").trim() || undefined,
            minutes: Number(row?.minutes) > 0 ? Number(row?.minutes) : undefined,
          }))
          .slice(0, MAX_LISTING_PUBLICATIONS)
      : [],
    pageSections: sanitizePageSections(stored.pageSections, type),
    affiliatedFacilityIds: Array.isArray(stored.affiliatedFacilityIds)
      ? stored.affiliatedFacilityIds.map(String).filter(Boolean)
      : [],
  };
}

/** @deprecated Prefer loadDraftForProvider — global key mixed identities across accounts. */
export function loadDraft(): BusinessProfile {
  const stored = readJson<BusinessProfile>(LEGACY_DRAFT_KEY);
  if (!stored || !stored.type) return emptyBusinessProfile();
  return normalizeDraft(stored);
}

/** Prefer practice / org name; fall back to person name when org is empty or placeholder. */
export function listingNameFromProvider(provider: {
  orgName: string;
  firstName?: string;
  lastName?: string;
}): string {
  const org = provider.orgName.trim();
  if (org && org.toLowerCase() !== "your practice") return org;
  return [provider.firstName, provider.lastName].filter(Boolean).join(" ").trim() || org;
}

export function loadDraftForProvider(provider: {
  id: string;
  orgName: string;
  vendorType: BusinessVendorType;
  phone?: string;
  firstName?: string;
  lastName?: string;
}): BusinessProfile {
  const seedName = listingNameFromProvider(provider);
  const stored = readJson<BusinessProfile>(draftKey(provider.id));
  const demoPubs = DEMO_LISTING_PUBLICATIONS[provider.id];
  if (stored?.type) {
    const next = normalizeDraft(stored);
    return {
      ...next,
      publications: Array.isArray(stored.publications) ? next.publications : (demoPubs ?? next.publications),
      name: next.name.trim() || seedName,
      phone: next.phone.trim() || provider.phone || "",
    };
  }
  // Fresh listing from this provider — ignore legacy patient drafts (e.g. other names).
  return {
    ...emptyBusinessProfile(provider.vendorType),
    publications: demoPubs ?? [],
    name: seedName,
    phone: provider.phone?.trim() || "",
  };
}

export function saveDraft(profile: BusinessProfile, providerId?: string): BusinessProfile {
  const next = {
    ...normalizeDraft(profile),
    updatedAt: new Date().toISOString(),
    status: profile.status === "published" ? ("published" as const) : ("draft" as const),
    ownerId: providerId || profile.ownerId,
  };
  if (providerId) writeJson(draftKey(providerId), next);
  else writeJson(LEGACY_DRAFT_KEY, next);
  if (providerId) void apiSaveListingDraft(providerId, next);
  return next;
}

export function getPublishedBusiness(): BusinessProfile | null {
  const stored = readJson<BusinessProfile>(PUB_KEY);
  if (stored?.status === "published" && stored.publishedId) {
    rememberPublished(stored);
    return normalizeDraft(stored);
  }
  return listPublishedBusinesses()[0] ?? null;
}

export function getPublishedForOwner(ownerId: string): BusinessProfile | null {
  const stored = readJson<BusinessProfile>(publishedKey(ownerId));
  if (stored?.status === "published" && stored.publishedId) return normalizeDraft(stored);
  const legacy = readJson<BusinessProfile>(PUB_KEY);
  if (legacy?.status === "published" && legacy.ownerId === ownerId && legacy.publishedId) {
    rememberPublished(legacy);
    return normalizeDraft(legacy);
  }
  return null;
}

export function getPublishedByHubId(id: string): BusinessProfile | null {
  const cached = memoryPublished.get(id);
  if (cached?.status === "published") return cached;
  const owner = publishedIndex()[id];
  if (owner) {
    const stored = readJson<BusinessProfile>(publishedKey(owner));
    if (stored?.status === "published" && stored.publishedId === id) {
      const next = normalizeDraft(stored);
      memoryPublished.set(id, next);
      return next;
    }
  }
  for (const ownerId of Object.values(publishedIndex())) {
    const stored = readJson<BusinessProfile>(publishedKey(ownerId));
    if (stored?.status === "published" && stored.publishedId === id) {
      const next = normalizeDraft(stored);
      memoryPublished.set(id, next);
      return next;
    }
  }
  const legacy = readJson<BusinessProfile>(PUB_KEY);
  if (legacy?.status === "published" && legacy.publishedId === id) {
    const next = normalizeDraft(legacy);
    rememberPublished(next);
    return next;
  }
  return null;
}

export function listPublishedBusinesses(): BusinessProfile[] {
  const seen = new Set<string>();
  const out: BusinessProfile[] = [];
  const add = (raw: BusinessProfile | null) => {
    if (!raw?.publishedId || raw.status !== "published" || seen.has(raw.publishedId)) return;
    const next = normalizeDraft(raw);
    seen.add(next.publishedId!);
    out.push(next);
    memoryPublished.set(next.publishedId!, next);
  };
  for (const row of memoryPublished.values()) add(row);
  for (const ownerId of Object.values(publishedIndex())) {
    add(readJson<BusinessProfile>(publishedKey(ownerId)));
  }
  add(readJson<BusinessProfile>(PUB_KEY));
  return out;
}

export async function hydratePublishedListings() {
  const rows = await apiListPublicListings();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const profile = normalizeDraft(row as BusinessProfile);
    if (profile.publishedId && profile.status === "published") rememberPublished(profile);
  }
}

export function ingestRemoteDraft(ownerId: string, raw: unknown): BusinessProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const next = normalizeDraft(raw as BusinessProfile);
  writeJson(draftKey(ownerId), next);
  return next;
}

export function cachePublishedListing(raw: unknown) {
  if (!raw || typeof raw !== "object") return;
  const next = normalizeDraft(raw as BusinessProfile);
  if (next.publishedId && next.status === "published") rememberPublished(next);
}

/** Listing accordion, or a type-aware fallback when the vendor has not edited it yet. */
export function specialisedInFromListing(
  ownerId: string | undefined,
  fallback: SpecialisedGroup[],
): SpecialisedGroup[] {
  if (!ownerId) return fallback;
  const pub = getPublishedForOwner(ownerId);
  const groups = sanitizeSpecialisedIn(pub?.specialisedIn ?? readJson<BusinessProfile>(draftKey(ownerId))?.specialisedIn);
  return groups.length ? groups : fallback;
}

export function hubPathForProfile(profile: BusinessProfile): string | null {
  if (!profile.publishedId) return null;
  const hf = /^hf-(\d+)$/.exec(profile.publishedId);
  if (hf) return `/facilities/${hf[1]}`;
  if (profile.type === "lab") return `/appointments/labs/${profile.publishedId}`;
  if (profile.type === "doctor" || profile.type === "hospital" || profile.type === "clinic") {
    return `/appointments/provider/${profile.publishedId}`;
  }
  if (profile.type === "pharmacy") {
    const dda = profile.licenseNumber.replace(/\D/g, "") || profile.publishedId.replace(/^prov-dda-/, "");
    return `/pharmacies/${dda}`;
  }
  // Pharmacy / ambulance / individual — assistants-style hub entry for MVP
  return `/appointments/assistants/${profile.publishedId}`;
}

export function publishBusinessProfile(draft: BusinessProfile, providerId?: string): BusinessProfile {
  const publishedId = draft.publishedId || `biz-${Date.now().toString(36)}`;
  const published: BusinessProfile = {
    ...normalizeDraft(draft),
    name: draft.name.trim() || "Untitled practice",
    publishedId,
    ownerId: providerId || draft.ownerId,
    status: "published",
    updatedAt: new Date().toISOString(),
  };
  writeJson(PUB_KEY, published);
  rememberPublished(published);
  saveDraft(published, providerId);
  if (providerId) void apiPublishListing(providerId, published, publishedId);
  return published;
}

export function unpublishBusinessProfile(providerId?: string): BusinessProfile {
  const scoped = providerId ? readJson<BusinessProfile>(draftKey(providerId)) : null;
  const base = scoped?.type ? normalizeDraft(scoped) : loadDraft();
  if (providerId) forgetPublished(providerId, base.publishedId);
  const current = readJson<BusinessProfile>(PUB_KEY);
  if (!providerId || current?.ownerId === providerId || current?.publishedId === base.publishedId) {
    localStorage.removeItem(PUB_KEY);
  }
  const next: BusinessProfile = {
    ...base,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
  saveDraft(next, providerId);
  if (providerId) void apiUnpublishListing(providerId);
  return next;
}

export function newServiceId() {
  return `svc-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

function visitTypesFrom(profile: BusinessProfile): VisitType[] {
  const out: VisitType[] = [];
  if (profile.capabilities.virtual) out.push("virtual");
  if (
    profile.capabilities.clinic ||
    profile.type === "hospital" ||
    profile.type === "clinic"
  ) {
    out.push("clinic");
  }
  if (out.length === 0) out.push("clinic");
  return out;
}

function careVisitTypesFrom(profile: BusinessProfile): CareVisitType[] {
  const out: CareVisitType[] = [];
  if (profile.capabilities.home) out.push("home");
  if (profile.capabilities.clinic) out.push("clinic");
  if (profile.capabilities.virtual) out.push("virtual");
  if (out.length === 0) out.push("clinic");
  return out;
}

function facilityServices(profile: BusinessProfile): FacilityService[] {
  const list = servicesForHub(profile);
  return list.slice(0, 16).map((s) => {
    const extra = offeringMeta(s, list);
    const kindTag = s.kind === "service" ? "" : OFFERING_KIND_LABELS[s.kind];
    return {
      id: s.id,
      kind: "consult" as const,
      label: s.label,
      blurb: [kindTag, s.kind === "service" ? s.blurb || s.label : extra].filter(Boolean).join(" · "),
      feeFrom: s.feeFrom,
    };
  });
}

/** Map published profile → CareProvider when type is doctor/hospital/clinic. */
export function businessAsCareProvider(profile: BusinessProfile): CareProvider | null {
  if (profile.type !== "doctor" && profile.type !== "hospital" && profile.type !== "clinic") {
    return null;
  }
  if (!profile.publishedId) return null;
  const kind: ProviderKind =
    profile.type === "hospital" ? "hospital" : profile.type === "clinic" ? "clinic" : "doctor";
  const specialties: SpecialtyId[] = ["general"];
  const defaultSubtitle =
    profile.type === "hospital" ? "Hospital" : profile.type === "clinic" ? "Clinic" : "Physician";
  return {
    id: profile.publishedId,
    kind,
    name: profile.name || "Untitled practice",
    subtitle: profile.subtitle || defaultSubtitle,
    imageUrl: profile.imageUrl || defaultImage(profile.type),
    specialties,
    languages: ["English"],
    rating: profile.rating || 4.8,
    reviewCount: 12,
    distanceKm: 1.1,
    consultationFee: profile.feeFrom,
    nextAvailable: profile.nextAvailable || "Today",
    visitTypes: visitTypesFrom(profile),
    city: profile.city || "Toronto",
    address: profile.address || undefined,
    bio: profile.bio || profile.subtitle || "Care provider on PocketPills.",
    about: profile.about || profile.bio || undefined,
    hours: profile.hours || undefined,
    phone: profile.phone || undefined,
    focusAreas: profile.specialtyNote ? [profile.specialtyNote] : undefined,
    specialisedIn: sanitizeSpecialisedIn(profile.specialisedIn),
    affiliatedFacilityIds: profile.affiliatedFacilityIds,
    awards: listingSection(profile.pageSections, "awards")?.awards,
    services:
      profile.type === "hospital" || profile.type === "clinic"
        ? facilityServices(profile)
        : undefined,
  };
}

/** Map published profile → LabCentre when type is lab. */
export function businessAsLabCentre(profile: BusinessProfile): LabCentre | null {
  if (profile.type !== "lab" || !profile.publishedId) return null;
  const testIds = profile.capabilities.bloodwork
    ? ["cmp", "cbc", "lipid", "thyroid", "a1c"]
    : ["cbc"];
  const imagingIds = profile.capabilities.imaging
    ? ["us-abdomen", "xray-chest", "ecg", "bone-density"]
    : [];
  const bundleIds = profile.capabilities.packages
    ? ["bundle-annual", "bundle-diabetes"]
    : [];
  return {
    id: profile.publishedId,
    name: profile.name || "Untitled lab",
    subtitle: profile.subtitle || "Collection centre",
    address: profile.address || "Address TBD",
    city: profile.city || "Toronto",
    distanceKm: 1.0,
    hours: profile.hours || "Mon–Fri 8am–5pm",
    phone: profile.phone || "(416) 555-0100",
    rating: profile.rating || 4.7,
    nextAvailable: profile.nextAvailable || "Today",
    lat: 43.6532,
    lng: -79.3832,
    bundleIds,
    testIds,
    imagingIds,
    emoji: profile.emoji || "🧪",
  };
}

/** Map published profile → CareWorker for individual / pharmacy / ambulance. */
export function businessAsCareWorker(profile: BusinessProfile): CareWorker | null {
  if (
    profile.type !== "individual" &&
    profile.type !== "pharmacy" &&
    profile.type !== "ambulance"
  ) {
    return null;
  }
  if (!profile.publishedId) return null;
  const kind: CareWorkerKind =
    profile.type === "ambulance" ? "home-care" : "medical-assistant";
  const defaultSubtitle =
    profile.type === "pharmacy"
      ? "Pharmacy"
      : profile.type === "ambulance"
        ? "Ambulance service"
        : "Independent provider";
  const list = servicesForHub(profile);
  const serviceLabels = list.length
    ? list.map((s) => {
        const extra = offeringMeta(s, list);
        return extra ? `${s.label} · ${extra}` : s.label;
      })
    : profile.type === "pharmacy"
      ? ["Prescription fill", "OTC consult"]
      : profile.type === "ambulance"
        ? ["Emergency transport", "Non-emergency transfer"]
        : ["General care support"];
  return {
    id: profile.publishedId,
    kind,
    name: profile.name || "Untitled provider",
    subtitle: profile.subtitle || defaultSubtitle,
    services: serviceLabels,
    languages: ["English"],
    rating: profile.rating || 4.8,
    feeFrom: profile.feeFrom,
    visitTypes: careVisitTypesFrom(profile),
    city: profile.city || "Toronto",
    distanceKm: 1.5,
    nextAvailable: profile.nextAvailable || "Today",
    bio: profile.bio || profile.subtitle || "Available through PocketPills care hub.",
    experienceYears: 5,
    emoji: profile.emoji || defaultEmoji(profile.type),
    imageUrl: profile.imageUrl || undefined,
  };
}

export function getPublishedCareProvider(): CareProvider | null {
  const pub = getPublishedBusiness();
  return pub ? businessAsCareProvider(pub) : null;
}

export function listPublishedCareProviders(): CareProvider[] {
  return listPublishedBusinesses()
    .map(businessAsCareProvider)
    .filter((p): p is CareProvider => Boolean(p));
}

export function getPublishedLabCentre(): LabCentre | null {
  const pub = getPublishedBusiness();
  return pub ? businessAsLabCentre(pub) : null;
}

export function listPublishedLabCentres(): LabCentre[] {
  return listPublishedBusinesses()
    .map(businessAsLabCentre)
    .filter((p): p is LabCentre => Boolean(p));
}

export function getPublishedCareWorker(): CareWorker | null {
  const pub = getPublishedBusiness();
  return pub ? businessAsCareWorker(pub) : null;
}

export function listPublishedCareWorkers(): CareWorker[] {
  return listPublishedBusinesses()
    .map(businessAsCareWorker)
    .filter((p): p is CareWorker => Boolean(p));
}

export function applyTypeDefaults(profile: BusinessProfile, type: BusinessVendorType): BusinessProfile {
  return {
    ...profile,
    type,
    capabilities: defaultCapabilities(type),
    emoji: profile.emoji || defaultEmoji(type),
    imageUrl: profile.imageUrl || defaultImage(type),
    feeFrom: type === "lab" ? profile.feeFrom : profile.feeFrom || 79,
  };
}
