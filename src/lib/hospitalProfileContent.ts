/**
 * Derived hospital-detail copy. Only surfaces registry / listing facts —
 * no invented beds, accreditations, emergency services, or galleries.
 */

import type { CareProvider } from "@/lib/appointments";
import { treatments } from "@/lib/data";
import { getFacilityClaim, hfCodeFromId } from "@/lib/facilityDirectory";
import { formatVerifiedOn, nmcNumberOf, providerProfileHref } from "@/lib/doctorProfileContent";
import type { ListingSurface } from "@/lib/listingSurface";
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

export type HospitalView = {
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

export const HOSPITAL_REVIEW_TOPICS = [
  "Doctors",
  "Staff",
  "Cleanliness",
  "Facilities",
  "Waiting time",
  "Overall experience",
] as const;

export function hospitalFromProvider(
  provider: CareProvider,
  staff: CareProvider[],
  specialisedIn?: SpecialisedGroup[],
): HospitalView {
  const hf = hfCodeFromId(provider.id) ?? (provider.id.startsWith("hf-") ? provider.id.replace(/^hf-/, "") : undefined);
  const claim = hf ? getFacilityClaim(hf) : null;
  const listing = listingForHub(provider.id);
  const listingStaff = listingDoctorsForFacility(provider.id, provider.city);
  return {
    id: provider.id,
    name: listing?.name || provider.name,
    kindLabel: provider.kind === "clinic" ? "Clinic" : "Hospital",
    facilityLevel: provider.subtitle,
    registrationNo: hf,
    address: listing?.address || provider.address,
    city: listing?.city || provider.city,
    phone: listing?.phone || provider.phone,
    hours: listing?.hours || provider.hours,
    about: listing?.about || provider.about || provider.bio,
    live: true,
    lastVerified: claim?.publishedAt || claim?.claimedAt,
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

export function hospitalFromHf(input: {
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
}): HospitalView {
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

export function hospitalVerification(h: HospitalView): {
  checks: { label: string }[];
  registration?: { label: string; value: string };
  lastVerified?: string;
} | null {
  const checks: { label: string }[] = [];
  if (h.registrationNo) checks.push({ label: "Health facility registration verified" });
  if (h.live) {
    checks.push({ label: "Hospital identity verified" });
    if (h.address) checks.push({ label: "Address verified" });
    if (h.facilityLevel) checks.push({ label: "Facility type verified" });
  } else if (h.registrationNo) {
    if (h.facilityLevel) checks.push({ label: "Facility type verified" });
    if (h.address) checks.push({ label: "Address on registry" });
  }
  if (!checks.length) return null;
  return {
    checks,
    registration: h.registrationNo
      ? { label: "Facility registration", value: `#${h.registrationNo}` }
      : undefined,
    lastVerified: h.lastVerified ? formatVerifiedOn(h.lastVerified) : undefined,
  };
}

export function hospitalAboutFacts(h: HospitalView): { k: string; v: string }[] {
  const facts: { k: string; v: string }[] = [];
  if (h.facilityLevel) facts.push({ k: "Facility type", v: h.facilityLevel });
  if (h.city || h.address) facts.push({ k: "Location", v: h.address || h.city || "" });
  const depts = h.specialisedIn.map((g) => g.specialty);
  if (depts.length) facts.push({ k: "Key areas of care", v: depts.slice(0, 6).join(" · ") });
  const svc = h.bookable.map((s) => s.label);
  if (svc.length) facts.push({ k: "Patient services", v: svc.join(" · ") });
  facts.push({ k: "Focus", v: `${h.kindLabel} care listed on PocketPills` });
  return facts;
}

export function doctorsInDepartment(staff: CareProvider[], specialty: string): CareProvider[] {
  const key = specialty.toLowerCase();
  return staff.filter((d) => {
    if (d.specialisedIn?.some((g) => g.specialty.toLowerCase() === key)) return true;
    const blob = `${d.subtitle} ${d.specialties.join(" ")} ${(d.focusAreas ?? []).join(" ")}`.toLowerCase();
    if (key.includes("physician") || key === "general") {
      return d.specialties.includes("general") || /family|physician|general|mbbs|md/.test(blob);
    }
    return blob.includes(key.split(" ")[0] || key);
  });
}

export function procedureHref(name: string): string {
  const hit = treatments.find((t) => t.name.toLowerCase() === name.toLowerCase());
  return hit ? `/appointments/treatments/${hit.slug}` : "/appointments";
}

export function hospitalTreatments(h: HospitalView): { name: string; department: string; href: string }[] {
  return h.specialisedIn.flatMap((g) =>
    g.procedures.map((name) => ({
      name,
      department: g.specialty,
      href: procedureHref(name),
    })),
  );
}

function haystack(h: HospitalView): string {
  return [
    h.about,
    h.hours,
    ...h.amenities,
    ...h.bookable.map((s) => `${s.label} ${s.blurb || ""} ${s.kind}`),
  ]
    .join(" ")
    .toLowerCase();
}

const MEDICAL_RE =
  /emergenc|diagnos|lab|surgery|icu|intensive|pharmac|ambulance|imaging|blood|x-ray|ultrasound|consult/;
const PATIENT_RE =
  /park|wheelchair|accessib|wait|cafeteria|food court|insurance|wifi|washroom|entrance|lounge|interpreter|ttc|transit/;

export function splitAmenities(h: HospitalView): { medical: string[]; patient: string[] } {
  const medical: string[] = [];
  const patient: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string, bucket: "medical" | "patient") => {
    const v = raw.trim();
    if (!v || seen.has(v.toLowerCase())) return;
    seen.add(v.toLowerCase());
    (bucket === "medical" ? medical : patient).push(v);
  };
  for (const s of h.bookable) {
    if (MEDICAL_RE.test(`${s.kind} ${s.label}`.toLowerCase())) add(s.label, "medical");
  }
  for (const a of h.amenities) {
    const t = a.toLowerCase();
    if (MEDICAL_RE.test(t)) add(a, "medical");
    else if (PATIENT_RE.test(t)) add(a, "patient");
    else add(a, "patient");
  }
  return { medical, patient };
}

export function hospitalEmergency(h: HospitalView): {
  hours?: string;
  phone?: string;
  notes: string[];
} | null {
  const hay = haystack(h);
  if (!/emergenc|urgent.?care|after-hours|walk-in desk|24\s*\/\s*7|24-hour/.test(hay)) return null;
  const notes: string[] = [];
  if (/24\s*\/\s*7|24-hour/.test(hay)) notes.push("Listed as 24/7 on this profile.");
  if (/ambulance/.test(hay)) notes.push("Ambulance is listed among this facility’s services.");
  if (/walk-in/.test(hay)) notes.push("Walk-in / urgent desk is listed.");
  if (/after-hours/.test(hay)) notes.push("After-hours care is listed.");
  if (/entrance/.test(hay)) notes.push("An emergency or main entrance is listed on this profile.");
  return {
    hours: h.hours,
    phone: h.phone,
    notes,
  };
}

export function hospitalFaqs(h: HospitalView): { q: string; a: string }[] {
  const depts = h.specialisedIn.map((g) => g.specialty);
  const { medical, patient } = splitAmenities(h);
  const emergency = hospitalEmergency(h);
  const parking = patient.some((a) => /park/i.test(a));
  const diagnostics = medical.some((a) => /diagnos|lab|imaging/i.test(a)) ||
    h.bookable.some((s) => /lab|diagnos|imaging/i.test(`${s.kind} ${s.label}`));

  return [
    {
      q: "What departments are available?",
      a: depts.length
        ? `${h.name} lists ${depts.join(", ")}.`
        : "Departments are not listed on this profile yet.",
    },
    {
      q: "Is emergency care available?",
      a: emergency
        ? `Emergency / urgent care is listed${emergency.hours ? ` · ${emergency.hours}` : ""}${emergency.phone ? ` · ${emergency.phone}` : ""}.`
        : "Emergency care is not listed on this profile.",
    },
    {
      q: "Does the hospital accept insurance?",
      a: patient.some((a) => /insurance/i.test(a))
        ? "An insurance desk is listed among patient facilities."
        : "Insurance acceptance is not listed on this profile. Ask at check-in or when you book.",
    },
    {
      q: "What documents should I bring?",
      a: "Bring photo ID, any referral or requisition, your medicine list, and insurance details if you use a plan.",
    },
    {
      q: "How do I book an appointment?",
      a: "Use Book an appointment on this page, or choose a listed doctor to open their booking times.",
    },
    {
      q: "What are the visiting hours?",
      a: h.hours ? h.hours : "Visiting hours are not listed on this profile.",
    },
    {
      q: "Is parking available?",
      a: parking ? "Parking is listed among patient facilities." : "Parking is not listed on this profile.",
    },
    {
      q: "Where should I check in?",
      a: "Start at the main reception or outpatient registration listed for this facility, then follow signs to your department.",
    },
    {
      q: "Are diagnostic services available?",
      a: diagnostics
        ? "Diagnostics / laboratory / imaging are listed on this profile."
        : "Diagnostic services are not listed on this profile.",
    },
  ];
}

export function hospitalMapsQuery(h: HospitalView): string {
  return [h.name, h.address, h.city].filter(Boolean).join(", ");
}

export function mapsDirectionsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsEmbedUrl(query: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export function doctorCardHref(
  doctor: CareProvider,
  facilityId: string,
  surface: ListingSurface = "public",
): string {
  const base = providerProfileHref(doctor, surface);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}facility=${encodeURIComponent(facilityId)}`;
}

export { nmcNumberOf };
