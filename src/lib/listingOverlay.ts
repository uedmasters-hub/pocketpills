import type { CareProvider } from "@/lib/appointments";
import {
  businessAsCareProvider,
  getPublishedByHubId,
  getPublishedForOwner,
  listPublishedBusinesses,
} from "@/lib/businessProfile";
import {
  listingSection,
  listingSectionEnabled,
  type ListingSection,
  type ListingStaffRow,
} from "@/lib/listingPage";

export function listingForHub(id: string, ownerId?: string) {
  return getPublishedByHubId(id) || (ownerId ? getPublishedForOwner(ownerId) : null);
}

export function listingSectionsFor(id: string, ownerId?: string): ListingSection[] | undefined {
  return listingForHub(id, ownerId)?.pageSections;
}

export function listingShows(id: string, kind: Parameters<typeof listingSectionEnabled>[1], ownerId?: string) {
  return listingSectionEnabled(listingSectionsFor(id, ownerId), kind);
}

export function staffRowsAsProviders(rows: ListingStaffRow[] | undefined, city = ""): CareProvider[] {
  if (!rows?.length) return [];
  return rows
    .filter((s) => s.name.trim() || s.nmcNumber || s.foreign || s.listingId)
    .map((s) => {
      const nmc =
        s.nmcNumber ||
        (s.listingId?.startsWith("nmc-") ? s.listingId.replace(/^nmc-/, "").replace(/\D/g, "") : "");
      const fromRegister = Boolean(nmc || s.foreign);
      const live =
        !fromRegister && s.listingId && !s.listingId.startsWith("nmc-") && !s.listingId.startsWith("fd-")
          ? getPublishedByHubId(s.listingId)
          : null;
      const education = s.specialty.trim() || s.registerDegree || live?.subtitle || "";
      const subtitle =
        education ||
        (s.foreign ? [s.council, s.country].filter(Boolean).join(" · ") : "") ||
        "";
      return {
        id: nmc ? `nmc-${nmc}` : s.listingId || s.id,
        kind: "doctor" as const,
        name: fromRegister ? s.name.trim() || (nmc ? `NMC #${nmc}` : "Doctor") : live?.name || s.name.trim() || "Doctor",
        subtitle,
        imageUrl: s.imageUrl || (!fromRegister ? live?.imageUrl : undefined) || "",
        specialties: [],
        languages: ["English"],
        rating: 0,
        reviewCount: 0,
        distanceKm: 0,
        consultationFee: 0,
        nextAvailable: "Today",
        visitTypes: ["clinic" as const],
        city: s.country || city,
        bio: s.blurb || subtitle,
        education: education ? [education] : s.registerDegree ? [s.registerDegree] : undefined,
        about: s.blurb || undefined,
      };
    });
}

export function affiliatedDoctorsForFacility(facilityId: string): CareProvider[] {
  return listPublishedBusinesses()
    .filter(
      (p) =>
        p.type === "doctor" &&
        p.status === "published" &&
        (p.affiliatedFacilityIds ?? []).includes(facilityId),
    )
    .map(businessAsCareProvider)
    .filter((p): p is CareProvider => Boolean(p));
}

export function listingDoctorsForFacility(facilityId: string, city = ""): CareProvider[] {
  const listing = getPublishedByHubId(facilityId);
  const section = listingSection(listing?.pageSections, "doctors");
  const seen = new Set<string>();
  const out: CareProvider[] = [];
  for (const row of [...staffRowsAsProviders(section?.staff, city), ...affiliatedDoctorsForFacility(facilityId)]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

export function mergeUniqueProviders(...lists: CareProvider[][]): CareProvider[] {
  const seen = new Set<string>();
  const out: CareProvider[] = [];
  for (const list of lists) {
    for (const row of list) {
      if (!row?.id || seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
    }
  }
  return out;
}

export function listingFaqsFor(id: string, fallback: { q: string; a: string }[], ownerId?: string) {
  const section = listingSection(listingSectionsFor(id, ownerId), "faq");
  if (section && !section.enabled) return [];
  if (section?.faqs?.length) return section.faqs.filter((f) => f.q.trim());
  return fallback;
}

export function listingGalleryFor(
  id: string,
  fallback: { src: string; label: string }[] | undefined,
  ownerId?: string,
) {
  const section = listingSection(listingSectionsFor(id, ownerId), "gallery");
  if (section && !section.enabled) return [];
  if (section?.photos?.length) return section.photos.filter((p) => p.src.trim());
  return fallback ?? [];
}

export function listingAwardsFor(
  id: string,
  fallback: { title: string; org: string; year: string }[] | undefined,
  ownerId?: string,
) {
  const section = listingSection(listingSectionsFor(id, ownerId), "awards");
  if (section && !section.enabled) return [];
  if (section?.awards?.length) return section.awards.filter((a) => a.title.trim());
  return fallback ?? [];
}
