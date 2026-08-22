import { getProvider } from "@/lib/appointments";
import {
  getPublishedByHubId,
  type BusinessProfile,
} from "@/lib/businessProfile";
import {
  displayFacilityName,
  getFacilityClaim,
  hfCodeFromId,
  hfProfileId,
  getVerifiedFacility,
} from "@/lib/facilityDirectory";
import { normalizeHfCode } from "@/lib/hfApi";

function branchLabel(name: string, place?: string) {
  const n = displayFacilityName(name) || name.trim();
  const p = (place || "").trim();
  if (n && p && !n.toLowerCase().includes(p.toLowerCase())) return `${n} • ${p}`;
  return n || p;
}

/** Resolve one hub / HF id to a branch chip using published listing, then facility registry API cache. */
export function resolveAvailabilityBranch(id: string): { id: string; label: string } | null {
  const pub = getPublishedByHubId(id);
  if (pub?.name?.trim()) {
    return { id, label: branchLabel(pub.name, pub.city || pub.address) };
  }

  const provider = getProvider(id);
  if (provider && provider.kind !== "doctor") {
    return {
      id: provider.id,
      label: branchLabel(provider.name, provider.city || provider.address),
    };
  }

  const code = hfCodeFromId(id) || normalizeHfCode(id);
  if (!code) return null;
  const claim = getFacilityClaim(code);
  const verified = getVerifiedFacility(code);
  const name = claim?.name || verified?.name;
  if (!name) return null;
  const place = claim?.district || verified?.district || "";
  return { id: hfProfileId(code), label: branchLabel(name, place) };
}

/**
 * In-person branch list for the hours calendar.
 * Doctors: affiliated facilities (published listings + HF registry).
 * Hospitals/clinics: own HF registry record via licence / published id.
 */
export function availabilityBranchesForListing(
  profile: Pick<
    BusinessProfile,
    "type" | "name" | "city" | "address" | "licenseNumber" | "publishedId" | "affiliatedFacilityIds"
  >,
): { id: string; label: string }[] {
  if (profile.type === "doctor") {
    const rows = (profile.affiliatedFacilityIds ?? [])
      .map((id) => resolveAvailabilityBranch(id))
      .filter((row): row is { id: string; label: string } => Boolean(row));
    if (rows.length) return rows;
  }

  if (profile.type === "hospital" || profile.type === "clinic") {
    const code =
      normalizeHfCode(profile.licenseNumber) ||
      hfCodeFromId(profile.publishedId || "") ||
      null;
    if (code) {
      const claim = getFacilityClaim(code);
      const verified = getVerifiedFacility(code);
      const name = claim?.name || verified?.name || profile.name;
      const place = claim?.district || verified?.district || profile.city || profile.address;
      if (name?.trim() || place?.trim()) {
        return [{ id: hfProfileId(code), label: branchLabel(name || place, place) }];
      }
    }
    // Fall back to published care hub row for this facility
    if (profile.publishedId) {
      const resolved = resolveAvailabilityBranch(profile.publishedId);
      if (resolved) return [resolved];
    }
  }

  if (profile.city?.trim() && profile.name?.trim()) {
    return [
      {
        id: profile.publishedId || "primary",
        label: branchLabel(profile.name, profile.city),
      },
    ];
  }
  if (profile.city?.trim()) {
    return [{ id: profile.publishedId || "primary", label: profile.city.trim() }];
  }
  return [];
}
