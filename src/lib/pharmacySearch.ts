import { pharmaciesInRegion, type AreaPharmacy } from "@/lib/pharmacies";
import { textMatchesQuery } from "@/lib/pageSearch";
import {
  displayPharmacyName,
  ensureDemoPublishedPharmacies,
  getPharmacyClaim,
  listPublishedPharmacyClaims,
  placeLine,
  type PharmacyClaim,
} from "@/lib/pharmacyDirectory";

export function areaPharmacyFromClaim(claim: PharmacyClaim): AreaPharmacy {
  const name = displayPharmacyName(claim.name);
  const place = claim.place.trim();
  const district = claim.district.trim();
  return {
    id: `dda-${claim.registrationNo}`,
    name,
    address: placeLine(claim),
    city: district || place || "Nepal",
    province: "NP",
    phone: claim.phone || "",
    hours: "",
    lat: 0,
    lng: 0,
    distance: "",
    sameDayHub: Boolean(claim.published),
  };
}

/** Published DDA listings for the care hub — same pharmacies as the directory. */
export function nearbyPharmacies(): AreaPharmacy[] {
  ensureDemoPublishedPharmacies();
  return listPublishedPharmacyClaims()
    .map(areaPharmacyFromClaim)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getHubPharmacy(id: string): AreaPharmacy | null {
  ensureDemoPublishedPharmacies();
  const n = id.replace(/^dda-/, "");
  const claim = getPharmacyClaim(n);
  if (claim?.published) return areaPharmacyFromClaim(claim);
  for (const code of ["ON", "BC"]) {
    const hit = pharmaciesInRegion(code).find((p) => p.id === id);
    if (hit) return hit;
  }
  return null;
}

export function searchPharmacies(query: string, list: AreaPharmacy[] = nearbyPharmacies()): AreaPharmacy[] {
  const needle = query.trim();
  if (!needle) return list;
  return list.filter((p) =>
    [p.name, p.city, p.address, p.province, p.hours].some((h) => textMatchesQuery(h, needle)),
  );
}
