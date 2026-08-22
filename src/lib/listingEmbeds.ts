import { drugs } from "@/lib/data";
import {
  getPublishedByHubId,
  hubPathForProfile,
  listPublishedBusinesses,
  type BusinessProfile,
  type BusinessVendorType,
} from "@/lib/businessProfile";
import type { ListingEmbed, ListingEmbedKind } from "@/lib/listingPage";

const VENDOR_FOR_EMBED: Partial<Record<ListingEmbedKind, BusinessVendorType[]>> = {
  doctor: ["doctor"],
  hospital: ["hospital"],
  clinic: ["clinic"],
  pharmacy: ["pharmacy"],
  lab: ["lab"],
};

export type EmbedCard = {
  refId: string;
  kind: ListingEmbedKind;
  name: string;
  subtitle: string;
  href: string;
  imageUrl?: string;
};

export function publishedOptionsForEmbed(
  kind: ListingEmbedKind,
  excludePublishedId?: string,
): EmbedCard[] {
  if (kind === "drug") {
    return drugs.slice(0, 80).map((d) => ({
      refId: d.slug,
      kind: "drug",
      name: d.name,
      subtitle: d.generic || d.cls,
      href: `/drug/${d.slug}`,
    }));
  }
  const types = VENDOR_FOR_EMBED[kind] ?? [];
  return listPublishedBusinesses()
    .filter((p) => types.includes(p.type) && p.publishedId && p.publishedId !== excludePublishedId)
    .map((p) => listingToCard(p, kind))
    .filter((c): c is EmbedCard => Boolean(c));
}

export function resolveEmbed(embed: ListingEmbed, kind: ListingEmbedKind): EmbedCard | null {
  if (kind === "drug") {
    const d = drugs.find((row) => row.slug === embed.refId);
    if (!d) return null;
    return {
      refId: d.slug,
      kind: "drug",
      name: d.name,
      subtitle: d.generic || d.cls,
      href: embed.ctaHref?.trim() || `/drug/${d.slug}`,
    };
  }
  const listing = getPublishedByHubId(embed.refId);
  if (listing) return listingToCard(listing, kind, embed.ctaHref);
  if (kind === "doctor") {
    const nmc = embed.refId.replace(/^nmc-/, "").replace(/\D/g, "");
    if (!nmc) return null;
    return {
      refId: embed.refId,
      kind: "doctor",
      name: embed.ctaLabel?.trim() || `NMC #${nmc}`,
      subtitle: `NMC #${nmc}`,
      href: embed.ctaHref?.trim() || `/doctors/${nmc}`,
    };
  }
  return null;
}

function listingToCard(
  profile: BusinessProfile,
  kind: ListingEmbedKind,
  hrefOverride?: string,
): EmbedCard | null {
  if (!profile.publishedId) return null;
  const href = hrefOverride?.trim() || hubPathForProfile(profile) || "#";
  return {
    refId: profile.publishedId,
    kind,
    name: profile.name,
    subtitle: profile.subtitle || profile.city || profile.type,
    href,
    imageUrl: profile.imageUrl || undefined,
  };
}
