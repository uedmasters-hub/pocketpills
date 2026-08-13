import { pharmaciesInRegion, type AreaPharmacy } from "@/lib/pharmacies";
import { textMatchesQuery } from "@/lib/pageSearch";

/** Nearby demos for the care hub — Ontario + BC community pharmacies. */
export function nearbyPharmacies(): AreaPharmacy[] {
  return [...pharmaciesInRegion("ON"), ...pharmaciesInRegion("BC")].sort((a, b) =>
    a.distance.localeCompare(b.distance, undefined, { numeric: true }),
  );
}

export function searchPharmacies(query: string, list: AreaPharmacy[] = nearbyPharmacies()): AreaPharmacy[] {
  const needle = query.trim();
  if (!needle) return list;
  return list.filter((p) =>
    [p.name, p.city, p.address, p.province, p.hours].some((h) => textMatchesQuery(h, needle)),
  );
}
