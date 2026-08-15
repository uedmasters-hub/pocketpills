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

export type BusinessDaySchedule = {
  day: string;
  open: boolean;
  start: string;
  end: string;
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
    .filter((p): p is ListingPublication => Boolean(p));
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
  const pub = getPublishedBusiness();
  if (pub?.ownerId === ownerId && Array.isArray(pub.publications)) {
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
  const pub = getPublishedBusiness();
  if (pub?.publishedId === publishedId) return pub.ownerId;
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

export function defaultBusinessSchedule(): BusinessDaySchedule[] {
  return BUSINESS_WEEKDAYS.map((day) => ({
    day,
    open: day !== "Saturday" && day !== "Sunday",
    start: "9:00 AM",
    end: "5:00 PM",
  }));
}

export function summarizeSchedule(schedule: BusinessDaySchedule[]): string {
  const open = schedule.filter((d) => d.open);
  if (open.length === 0) return "Closed";
  const weekdays = open.filter((d) =>
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(d.day),
  );
  if (
    weekdays.length === 5 &&
    weekdays.every((d) => d.start === weekdays[0].start && d.end === weekdays[0].end) &&
    open.length === 5
  ) {
    return `Mon–Fri ${weekdays[0].start}–${weekdays[0].end}`;
  }
  return open
    .map((d) => `${d.day.slice(0, 3)} ${d.start}–${d.end}`)
    .join(" · ");
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

function draftKey(providerId: string) {
  return `pp.businessProfile.${providerId}`;
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
          return (
            row ?? {
              day,
              open: day !== "Saturday" && day !== "Sunday",
              start: "9:00 AM",
              end: "5:00 PM",
            }
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
      ? stored.publications.map((row) => ({
          id: String(row?.id || `pub-${Math.random().toString(36).slice(2, 8)}`),
          kind:
            row?.kind === "news" || row?.kind === "publication" ? row.kind : ("article" as const),
          title: String(row?.title ?? ""),
          summary: String(row?.summary ?? ""),
          date: String(row?.date ?? "").trim() || undefined,
          imageUrl: String(row?.imageUrl ?? "").trim() || undefined,
          minutes: Number(row?.minutes) > 0 ? Number(row?.minutes) : undefined,
        }))
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
    ...profile,
    updatedAt: new Date().toISOString(),
    status: profile.status === "published" ? ("published" as const) : ("draft" as const),
  };
  if (providerId) writeJson(draftKey(providerId), next);
  else writeJson(LEGACY_DRAFT_KEY, next);
  return next;
}

export function getPublishedBusiness(): BusinessProfile | null {
  const stored = readJson<BusinessProfile>(PUB_KEY);
  if (!stored || stored.status !== "published" || !stored.publishedId) return null;
  return stored;
}

/** Listing accordion, or a type-aware fallback when the vendor has not edited it yet. */
export function specialisedInFromListing(
  ownerId: string | undefined,
  fallback: SpecialisedGroup[],
): SpecialisedGroup[] {
  if (!ownerId) return fallback;
  const stored = readJson<BusinessProfile>(draftKey(ownerId));
  const groups = sanitizeSpecialisedIn(stored?.specialisedIn);
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
  // Pharmacy / ambulance / individual — assistants-style hub entry for MVP
  return `/appointments/assistants/${profile.publishedId}`;
}

export function publishBusinessProfile(draft: BusinessProfile, providerId?: string): BusinessProfile {
  const publishedId = draft.publishedId || `biz-${Date.now().toString(36)}`;
  const published: BusinessProfile = {
    ...draft,
    name: draft.name.trim() || "Untitled practice",
    publishedId,
    ownerId: providerId || draft.ownerId,
    status: "published",
    updatedAt: new Date().toISOString(),
  };
  writeJson(PUB_KEY, published);
  saveDraft(published, providerId);
  return published;
}

export function unpublishBusinessProfile(providerId?: string): BusinessProfile {
  const scoped = providerId ? readJson<BusinessProfile>(draftKey(providerId)) : null;
  const base = scoped?.type ? normalizeDraft(scoped) : loadDraft();
  localStorage.removeItem(PUB_KEY);
  const next: BusinessProfile = {
    ...base,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
  saveDraft(next, providerId);
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
    profile.type === "hospital" || profile.type === "clinic" ? "hospital" : "doctor";
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

export function getPublishedLabCentre(): LabCentre | null {
  const pub = getPublishedBusiness();
  return pub ? businessAsLabCentre(pub) : null;
}

export function getPublishedCareWorker(): CareWorker | null {
  const pub = getPublishedBusiness();
  return pub ? businessAsCareWorker(pub) : null;
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
