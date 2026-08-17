import { pharmaciesInRegion, type AreaPharmacy } from "@/lib/pharmacies";
import { fieldsMatchQuery, sortBySearchRank } from "@/lib/searchMatch";
import {
  displayPharmacyName,
  ensureDemoPublishedPharmacies,
  getPharmacyClaim,
  listPublishedPharmacyClaims,
  placeLine,
  type PharmacyClaim,
} from "@/lib/pharmacyDirectory";
import { inventoryStatus, peekStoredInventory } from "@/lib/pharmacyOps";

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
  return sortBySearchRank(
    list.filter((p) => fieldsMatchQuery([p.name, p.city, p.address, p.province, p.hours], needle)),
    needle,
    (p) => [p.name, p.city, p.address, p.province, p.hours],
  );
}

export type MedStock = "available" | "limited";

function skuMatchesDrug(skuName: string, drug: { name: string; generic?: string }) {
  const hay = skuName.toLowerCase();
  return [drug.name, drug.generic].filter(Boolean).some((n) => {
    const needle = n!.toLowerCase();
    return hay === needle || hay.includes(needle);
  });
}

/** Published pharmacies that can take this fill. Inventory filters when a pharmacy has stock on file. */
export function pharmaciesForMedication(drug: { name: string; generic?: string }): {
  pharmacies: AreaPharmacy[];
  stockById: Record<string, MedStock>;
  recommendedId: string;
} {
  const all = nearbyPharmacies();
  const stockById: Record<string, MedStock> = {};
  const pharmacies = all.filter((p) => {
    const claim = getPharmacyClaim(p.id.replace(/^dda-/, ""));
    const inv = claim ? peekStoredInventory(claim.providerId) : null;
    if (!inv) return true;
    const hits = inv.filter((sku) => {
      if (inventoryStatus(sku) === "expired") return false;
      return skuMatchesDrug(sku.name, drug);
    });
    if (!hits.length) return false;
    if (hits.some((s) => inventoryStatus(s) === "ok")) {
      stockById[p.id] = "available";
      return true;
    }
    if (hits.some((s) => inventoryStatus(s) === "low")) {
      stockById[p.id] = "limited";
      return true;
    }
    return false;
  });
  const named = pharmacies.filter((p) => /pharmacy/i.test(p.name));
  const pool = named.length ? named : pharmacies;
  const recommendedId = [...pool].sort((a, b) => a.name.localeCompare(b.name))[0]?.id ?? "";
  pharmacies.sort((a, b) => {
    if (a.id === recommendedId) return -1;
    if (b.id === recommendedId) return 1;
    return a.name.localeCompare(b.name);
  });
  return { pharmacies, stockById, recommendedId };
}
