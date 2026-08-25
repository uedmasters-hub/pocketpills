import { SPECIALTIES, type Specialty, type SpecialtyId } from "@/lib/appointments";

/** Consumer-facing labels for the specialties called out in the landing reference. */
export const LANDING_SPECIALTY_LABEL: Partial<Record<SpecialtyId, string>> = {
  cardiologist: "Heart Health",
  endocrinologist: "Diabetes Care",
  psychiatrist: "Mental Health",
  pulmonologist: "Respiratory",
  dermatologist: "Skin & Derm",
  gynecologist: "Women's Health",
};

/** Lead with the unique reference categories, then the rest of the booking catalog. */
export const FEATURED_LANDING_SPECIALTIES: SpecialtyId[] = [
  "cardiologist",
  "endocrinologist",
  "psychiatrist",
  "pulmonologist",
  "dermatologist",
  "gynecologist",
];

export function landingSpecialtyLabel(s: Specialty) {
  return LANDING_SPECIALTY_LABEL[s.id] ?? s.label;
}

export function bookingSpecialtyHref(id?: SpecialtyId) {
  return id ? `/appointments?specialty=${encodeURIComponent(id)}` : "/appointments";
}

export function orderedLandingSpecialties(limit = SPECIALTIES.length): Specialty[] {
  const byId = new Map(SPECIALTIES.map((s) => [s.id, s]));
  const seen = new Set<SpecialtyId>();
  const out: Specialty[] = [];
  for (const id of FEATURED_LANDING_SPECIALTIES) {
    const s = byId.get(id);
    if (!s) continue;
    seen.add(id);
    out.push(s);
  }
  for (const s of SPECIALTIES) {
    if (seen.has(s.id)) continue;
    out.push(s);
  }
  return out.slice(0, limit);
}
