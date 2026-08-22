/**
 * Derived clinic-detail copy. Only surfaces registry / listing facts —
 * no invented hours, practitioners, awards, or statistics.
 */

import type { CareProvider, SpecialtyId, VisitType } from "@/lib/appointments";
import { specialtyById } from "@/lib/appointments";
import { getFacilityClaim, hfCodeFromId } from "@/lib/facilityDirectory";
import { formatVerifiedOn, nmcNumberOf } from "@/lib/doctorProfileContent";
import { procedureHref } from "@/lib/hospitalProfileContent";
import type { SpecialisedGroup } from "@/lib/specialisedIn";
import type { ListingSection } from "@/lib/listingPage";
import {
  listingAwardsFor,
  listingDoctorsForFacility,
  listingFaqsFor,
  listingForHub,
  listingGalleryFor,
  listingSectionsFor,
  mergeUniqueProviders,
} from "@/lib/listingOverlay";

export type ClinicView = {
  id: string;
  name: string;
  kindLabel: string;
  facilityLevel?: string;
  registrationNo?: string;
  address?: string;
  city?: string;
  phone?: string;
  hours?: string;
  about?: string;
  live?: boolean;
  lastVerified?: string;
  nextAvailable?: string;
  visitTypes: VisitType[];
  specialties: SpecialtyId[];
  specialisedIn: SpecialisedGroup[];
  staff: CareProvider[];
  amenities: string[];
  bookable: { id: string; kind: string; label: string; blurb?: string }[];
  awards?: { title: string; org: string; year: string }[];
  gallery?: { src: string; label: string }[];
  updates?: { title: string; summary: string; date: string }[];
  faqs?: { q: string; a: string }[];
  pageSections?: ListingSection[];
  hasListing?: boolean;
};

export const CLINIC_REVIEW_TOPICS = [
  "Staff",
  "Doctor experience",
  "Waiting time",
  "Cleanliness",
  "Service",
  "Overall experience",
] as const;

const SPECIALTY_CARE: Partial<Record<SpecialtyId, string>> = {
  general: "General Medicine",
  gynecologist: "Women’s Health",
  pediatrician: "Pediatrics",
  dermatologist: "Skin Conditions",
  endocrinologist: "Chronic Care",
  gastroenterologist: "Digestive Health",
  nutritionist: "Nutrition",
  ent: "Ear, Nose & Throat",
  orthopedist: "Bones & Joints",
  physiotherapist: "Physiotherapy",
  sexologist: "Sexual Health",
  urologist: "Urology",
  psychiatrist: "Mental Health",
  neurologist: "Neurology",
  cardiologist: "Heart Health",
  pulmonologist: "Respiratory Care",
  ophthalmologist: "Eye Care",
  dentist: "Dental",
  immunologist: "Allergy & Immunity",
};

const DEPT_CARE: Record<string, string> = {
  physician: "General Medicine",
  "general surgery": "Surgery",
  ophthalmology: "Eye Care",
  urology: "Urology",
  orthopedics: "Bones & Joints",
  dental: "Dental",
  "cosmetic surgery": "Skin Conditions",
  proctology: "Digestive Health",
};

export function clinicFromProvider(
  provider: CareProvider,
  staff: CareProvider[],
  specialisedIn?: SpecialisedGroup[],
): ClinicView {
  const hf = hfCodeFromId(provider.id) ?? (provider.id.startsWith("hf-") ? provider.id.replace(/^hf-/, "") : undefined);
  const claim = hf ? getFacilityClaim(hf) : null;
  const listing = listingForHub(provider.id);
  const listingStaff = listingDoctorsForFacility(provider.id, provider.city);
  return {
    id: provider.id,
    name: listing?.name || provider.name,
    kindLabel: "Clinic",
    facilityLevel: provider.subtitle,
    registrationNo: hf,
    address: listing?.address || provider.address,
    city: listing?.city || provider.city,
    phone: listing?.phone || provider.phone,
    hours: listing?.hours || provider.hours,
    about: listing?.about || provider.about || provider.bio,
    live: true,
    lastVerified: claim?.publishedAt || claim?.claimedAt,
    nextAvailable: provider.nextAvailable,
    visitTypes: provider.visitTypes ?? [],
    specialties: provider.specialties ?? [],
    specialisedIn: specialisedIn ?? listing?.specialisedIn ?? provider.specialisedIn ?? [],
    staff: mergeUniqueProviders(listingStaff, staff),
    amenities: provider.amenities ?? [],
    bookable: (provider.services ?? []).map((s) => ({
      id: s.id,
      kind: s.kind,
      label: s.label,
      blurb: s.blurb,
    })),
    awards: listingAwardsFor(provider.id, provider.awards),
    gallery: listingGalleryFor(provider.id, undefined),
    faqs: listingFaqsFor(provider.id, []),
    pageSections: listingSectionsFor(provider.id),
    hasListing: Boolean(listing),
  };
}

export function clinicFromHf(input: {
  name: string;
  hfCode: string;
  district: string;
  facilityLevel: string;
  phone?: string;
  hours?: string;
  about?: string;
  live: boolean;
  specialisedIn: SpecialisedGroup[];
  kindLabel: string;
}): ClinicView {
  const claim = getFacilityClaim(input.hfCode);
  const hubId = `hf-${input.hfCode}`;
  const listing = listingForHub(hubId, claim?.providerId);
  const listingStaff = listingDoctorsForFacility(hubId, input.district);
  return {
    id: hubId,
    name: listing?.name || input.name,
    kindLabel: input.kindLabel,
    facilityLevel: input.facilityLevel,
    registrationNo: input.hfCode,
    address: listing?.address || input.district,
    city: listing?.city || input.district,
    phone: listing?.phone || input.phone,
    hours: listing?.hours || (input.live ? input.hours : undefined),
    about: listing?.about || input.about,
    live: input.live,
    lastVerified: claim?.publishedAt || claim?.claimedAt,
    visitTypes: [],
    specialties: [],
    specialisedIn: listing?.specialisedIn?.length ? listing.specialisedIn : input.specialisedIn,
    staff: listingStaff,
    amenities: [],
    bookable: [],
    awards: listingAwardsFor(hubId, undefined, claim?.providerId),
    gallery: listingGalleryFor(hubId, undefined, claim?.providerId),
    faqs: listingFaqsFor(hubId, [], claim?.providerId),
    pageSections: listingSectionsFor(hubId, claim?.providerId),
    hasListing: Boolean(listing),
  };
}

export function clinicVerification(c: ClinicView): {
  checks: { label: string }[];
  registration?: { label: string; value: string };
  lastVerified?: string;
} | null {
  const checks: { label: string }[] = [];
  if (c.registrationNo) checks.push({ label: "Health facility registration verified" });
  if (c.live) {
    checks.push({ label: "Clinic identity verified" });
    if (c.address) checks.push({ label: "Address verified" });
    if (c.bookable.length || c.specialisedIn.length || c.amenities.length) {
      checks.push({ label: "Services verified" });
    }
  } else if (c.registrationNo) {
    if (c.address) checks.push({ label: "Address on registry" });
  }
  if (c.staff.some((d) => nmcNumberOf(d))) {
    checks.push({ label: "Practitioner license verified" });
  }
  if (!checks.length) return null;
  return {
    checks,
    registration: c.registrationNo
      ? { label: "Facility registration", value: `#${c.registrationNo}` }
      : undefined,
    lastVerified: c.lastVerified ? formatVerifiedOn(c.lastVerified) : undefined,
  };
}

export function clinicAboutFacts(c: ClinicView): { k: string; v: string }[] {
  const facts: { k: string; v: string }[] = [];
  facts.push({ k: "Clinic type", v: c.facilityLevel || c.kindLabel });
  const areas = clinicCareAreas(c);
  if (areas.length) facts.push({ k: "Areas of care", v: areas.slice(0, 5).join(" · ") });
  const focus = [
    c.visitTypes.includes("clinic") ? "In-clinic visits" : null,
    c.visitTypes.includes("virtual") ? "Virtual follow-up" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  if (focus) facts.push({ k: "Patient focus", v: focus });
  else if (c.kindLabel) facts.push({ k: "Patient focus", v: "Outpatient clinic care listed on PocketPills" });
  const expect = c.bookable.length
    ? `Booked ${c.bookable.map((s) => s.label).slice(0, 3).join(", ")}`
    : c.live
      ? "Claimed listing — book through PocketPills"
      : "Registry record — claim to publish booking";
  facts.push({ k: "What to expect", v: expect });
  return facts;
}

export function clinicCareAreas(c: ClinicView): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (label: string) => {
    const v = label.trim();
    if (!v || seen.has(v.toLowerCase())) return;
    seen.add(v.toLowerCase());
    out.push(v);
  };
  for (const id of c.specialties) {
    add(SPECIALTY_CARE[id] || specialtyById(id)?.label || "");
  }
  for (const g of c.specialisedIn) {
    add(DEPT_CARE[g.specialty.toLowerCase()] || g.specialty);
  }
  for (const s of c.bookable) {
    const k = s.kind.toLowerCase();
    if (k === "lab" || k === "diagnostics" || k === "imaging") add("Diagnostics");
    if (k === "pharmacy") add("Pharmacy");
    if (k === "consult") add("General Medicine");
  }
  return out;
}

export function clinicTreatments(c: ClinicView): { name: string; department: string; href: string }[] {
  const serviceNames = new Set(c.bookable.map((s) => s.label.toLowerCase()));
  return c.specialisedIn.flatMap((g) =>
    g.procedures
      .filter((name) => !serviceNames.has(name.toLowerCase()))
      .map((name) => ({
        name,
        department: g.specialty,
        href: procedureHref(name),
      })),
  );
}

export function clinicFacilities(c: ClinicView): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || seen.has(v.toLowerCase())) return;
    seen.add(v.toLowerCase());
    out.push(v);
  };
  for (const a of c.amenities) add(a);
  for (const s of c.bookable) {
    const k = `${s.kind} ${s.label}`.toLowerCase();
    if (/lab|blood/.test(k)) add("Laboratory");
    if (/diagnos|imaging|x-ray|ultrasound/.test(k)) add("Diagnostic facilities");
    if (/pharmac/.test(k)) add("Pharmacy");
  }
  return out;
}

function haystack(c: ClinicView): string {
  return [c.about, c.hours, c.facilityLevel, ...c.amenities, ...c.bookable.map((s) => `${s.label} ${s.blurb || ""}`)]
    .join(" ")
    .toLowerCase();
}

export function clinicWalkIn(c: ClinicView): boolean {
  return /walk-in|walk in/.test(haystack(c));
}

export function clinicHoursRows(c: ClinicView): { k: string; v: string }[] {
  const rows: { k: string; v: string }[] = [];
  if (c.hours) {
    rows.push({ k: "Clinic hours", v: c.hours });
  }
  if (c.nextAvailable) {
    rows.push({ k: "Appointment availability", v: c.nextAvailable });
  }
  if (clinicWalkIn(c)) {
    rows.push({ k: "Walk-ins", v: "Walk-in visits are listed on this profile." });
  }
  if (/holiday|stat holiday|closed/.test(haystack(c))) {
    rows.push({ k: "Holiday / closure", v: c.hours || "See listed hours." });
  }
  return rows;
}

export function clinicFaqs(c: ClinicView): { q: string; a: string }[] {
  const services = c.bookable.map((s) => s.label);
  const areas = clinicCareAreas(c);
  const facilities = clinicFacilities(c);
  const parking = facilities.some((a) => /park/i.test(a));
  const diagnostics =
    facilities.some((a) => /diagnos|lab|imaging/i.test(a)) ||
    c.bookable.some((s) => /lab|diagnos|imaging/i.test(`${s.kind} ${s.label}`));
  const insurance = facilities.some((a) => /insurance/i.test(a));

  return [
    {
      q: "What services does the clinic provide?",
      a: services.length
        ? `${c.name} lists ${services.join(", ")}.`
        : areas.length
          ? `Listed areas of care: ${areas.join(", ")}.`
          : "Services are not listed on this profile yet.",
    },
    {
      q: "Which doctors practice here?",
      a: c.staff.length
        ? c.staff.map((d) => d.name).join(", ")
        : "Practitioners are not listed on this profile yet.",
    },
    {
      q: "Do I need an appointment?",
      a: clinicWalkIn(c)
        ? "Walk-ins are listed. Booked visits are still available through PocketPills."
        : "Book an appointment on this page. Walk-in availability is not listed.",
    },
    {
      q: "Are walk-ins accepted?",
      a: clinicWalkIn(c) ? "Yes — a walk-in desk is listed on this profile." : "Walk-ins are not listed on this profile.",
    },
    {
      q: "What documents should I bring?",
      a: "Bring photo ID, any referral or requisition, your medicine list, and insurance details if you use a plan.",
    },
    {
      q: "Does the clinic accept insurance?",
      a: insurance
        ? "An insurance desk is listed among clinic facilities."
        : "Insurance acceptance is not listed on this profile. Ask at check-in or when you book.",
    },
    {
      q: "Are diagnostic services available?",
      a: diagnostics
        ? "Diagnostics / laboratory / imaging are listed on this profile."
        : "Diagnostic services are not listed on this profile.",
    },
    {
      q: "What are the clinic hours?",
      a: c.hours ? c.hours : "Hours are not listed on this profile.",
    },
    {
      q: "Is parking available?",
      a: parking ? "Parking is listed among clinic facilities." : "Parking is not listed on this profile.",
    },
    {
      q: "How do I book a follow-up appointment?",
      a: "Use Book appointment on this page, or open a listed practitioner’s profile to pick a follow-up time.",
    },
  ];
}

export function clinicMapsQuery(c: ClinicView): string {
  return [c.name, c.address, c.city].filter(Boolean).join(", ");
}
