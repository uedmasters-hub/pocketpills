import type { BusinessVendorType } from "@/lib/businessProfile";

export type ListingSectionKind =
  | "about"
  | "hours"
  | "services"
  | "facilities"
  | "doctors"
  | "specialised"
  | "gallery"
  | "faq"
  | "publications"
  | "awards"
  | "custom";

export type ListingFaq = { q: string; a: string };
export type ListingImageSize = "s" | "m" | "l" | "full";
export type ListingPhoto = { src: string; label: string; size?: ListingImageSize };
export type ListingStaffRow = {
  id: string;
  name: string;
  specialty: string;
  imageUrl?: string;
  listingId?: string;
  nmcNumber?: string;
  foreign?: boolean;
  council?: string;
  registrationNo?: string;
  country?: string;
  /** NMC qualification at registration — never overwritten by local edits. */
  registerDegree?: string;
  /** Extra copy for this facility page only. */
  blurb?: string;
};
export type ListingAwardRow = { title: string; org: string; year: string };
export type ListingFacilityGroup = { id: string; title: string; blurb: string; items: string[] };
export type ListingColumn = { id: string; title: string; blurb: string; imageUrl?: string; imageSize?: ListingImageSize };

export type ListingEmbedKind = "doctor" | "hospital" | "clinic" | "pharmacy" | "lab" | "drug";
export type ListingEmbed = { id: string; refId: string; ctaLabel?: string; ctaHref?: string };

/** Reusable blocks from the + picker — can be added more than once. */
export type ListingBlockLayout = "text" | "imageText" | "columns" | "gallery" | "accordion" | "map" | "embed";

export const ADDABLE_LAYOUTS: ListingBlockLayout[] = [
  "text",
  "imageText",
  "columns",
  "gallery",
  "accordion",
  "map",
];

export const LAYOUT_META: Record<ListingBlockLayout, { title: string; blurb: string }> = {
  text: { title: "Text", blurb: "A headline and a paragraph." },
  imageText: { title: "Image and text", blurb: "A photo beside your story." },
  columns: { title: "Columns", blurb: "Three cards for services or benefits." },
  gallery: { title: "Gallery", blurb: "A grid of campus or clinic photos." },
  accordion: { title: "Accordion", blurb: "Expandable questions and answers." },
  map: { title: "Map", blurb: "Show patients where to find you." },
  embed: { title: "From PocketPills", blurb: "Doctors, pharmacies, and medicines already on the platform." },
};

export const DIRECTORY_BLOCKS: { kind: ListingEmbedKind; title: string; blurb: string }[] = [
  { kind: "doctor", title: "Doctors", blurb: "Search the NMC register or add a foreign doctor." },
  { kind: "hospital", title: "Hospitals", blurb: "Link another hospital’s public listing." },
  { kind: "clinic", title: "Clinics", blurb: "Link a clinic listing." },
  { kind: "pharmacy", title: "Pharmacies", blurb: "Link a pharmacy listing." },
  { kind: "drug", title: "Medicines", blurb: "Link medicines from the directory." },
];

export const IMAGE_SIZES: ListingImageSize[] = ["s", "m", "l", "full"];
export const IMAGE_SIZE_META: Record<ListingImageSize, { label: string; hint: string; className: string }> = {
  s: { label: "Small", hint: "128px", className: "w-32 max-w-full" },
  m: { label: "Medium", hint: "256px", className: "w-56 max-w-full" },
  l: { label: "Large", hint: "384px", className: "w-80 max-w-full sm:w-96" },
  full: { label: "Full", hint: "100%", className: "w-full" },
};

export function nextImageSize(size?: ListingImageSize): ListingImageSize {
  const i = IMAGE_SIZES.indexOf(size || "full");
  return IMAGE_SIZES[(i + 1) % IMAGE_SIZES.length];
}

export type ListingSection = {
  id: string;
  kind: ListingSectionKind;
  title: string;
  enabled: boolean;
  customBody?: string;
  faqs?: ListingFaq[];
  photos?: ListingPhoto[];
  staff?: ListingStaffRow[];
  awards?: ListingAwardRow[];
  facilityGroups?: ListingFacilityGroup[];
  layout?: ListingBlockLayout;
  imageUrl?: string;
  imageSide?: "left" | "right";
  columns?: ListingColumn[];
  mapQuery?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageSize?: ListingImageSize;
  embedKind?: ListingEmbedKind;
  embeds?: ListingEmbed[];
};

export const LISTING_SECTION_LABELS: Record<ListingSectionKind, string> = {
  about: "About",
  hours: "Hours",
  services: "Services",
  facilities: "Facilities",
  doctors: "Doctors",
  specialised: "Specialised in",
  gallery: "Gallery",
  faq: "FAQ",
  publications: "News & articles",
  awards: "Awards",
  custom: "Custom section",
};

export const LISTING_KINDS_BY_VENDOR: Record<BusinessVendorType, ListingSectionKind[]> = {
  doctor: ["about", "specialised", "services", "hours", "gallery", "faq", "publications"],
  hospital: ["about", "facilities", "doctors", "specialised", "services", "gallery", "faq", "publications", "awards"],
  clinic: ["about", "doctors", "specialised", "services", "gallery", "faq", "publications"],
  lab: ["about", "services", "hours", "gallery", "faq"],
  pharmacy: ["about", "services", "hours", "gallery", "faq", "publications"],
  individual: ["about", "services", "hours", "faq"],
  ambulance: ["about", "services", "hours", "faq"],
};

export function newSectionId(kind: ListingSectionKind) {
  return `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function defaultPageSections(type: BusinessVendorType): ListingSection[] {
  return LISTING_KINDS_BY_VENDOR[type].map((kind) => ({
    id: kind,
    kind,
    title: LISTING_SECTION_LABELS[kind],
    enabled: true,
  }));
}

export function sanitizePageSections(raw: unknown, type: BusinessVendorType): ListingSection[] {
  const fallback = defaultPageSections(type);
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  const seen = new Set<string>();
  const parsed: ListingSection[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Partial<ListingSection>;
    const kind = (Object.keys(LISTING_SECTION_LABELS) as ListingSectionKind[]).includes(
      r.kind as ListingSectionKind,
    )
      ? (r.kind as ListingSectionKind)
      : "custom";
    const id = String(r.id || newSectionId(kind));
    if (seen.has(id)) continue;
    seen.add(id);
    parsed.push({
      id,
      kind,
      title: String(r.title || LISTING_SECTION_LABELS[kind]).trim() || LISTING_SECTION_LABELS[kind],
      enabled: r.enabled !== false,
      customBody: String(r.customBody ?? ""),
      faqs: Array.isArray(r.faqs)
        ? r.faqs.map((f) => ({ q: String(f?.q ?? ""), a: String(f?.a ?? "") }))
        : undefined,
      photos: Array.isArray(r.photos)
        ? r.photos.map((p) => ({
            src: String(p?.src ?? ""),
            label: String(p?.label ?? ""),
            size: IMAGE_SIZES.includes(p?.size as ListingImageSize) ? (p.size as ListingImageSize) : undefined,
          }))
        : undefined,
      staff: Array.isArray(r.staff)
        ? r.staff.map((s) => ({
            id: String(s?.id || newSectionId("doctors")),
            name: String(s?.name ?? ""),
            specialty: String(s?.specialty ?? ""),
            imageUrl:
              String(s?.imageUrl ?? "").trim() &&
              !String(s?.imageUrl ?? "").includes("Cardiologist.png")
                ? String(s?.imageUrl ?? "").trim()
                : undefined,
            listingId: String(s?.listingId ?? "").trim() || undefined,
            nmcNumber: String(s?.nmcNumber ?? "").replace(/\D/g, "") || undefined,
            foreign: Boolean(s?.foreign),
            council: String(s?.council ?? "").trim() || undefined,
            registrationNo: String(s?.registrationNo ?? "").trim() || undefined,
            country: String(s?.country ?? "").trim() || undefined,
            registerDegree: String(s?.registerDegree ?? "").trim() || undefined,
            blurb: String(s?.blurb ?? "").trim() || undefined,
          }))
        : undefined,
      awards: Array.isArray(r.awards)
        ? r.awards.map((a) => ({
            title: String(a?.title ?? ""),
            org: String(a?.org ?? ""),
            year: String(a?.year ?? ""),
          }))
        : undefined,
      facilityGroups: Array.isArray(r.facilityGroups)
        ? r.facilityGroups.map((g) => ({
            id: String(g?.id || newSectionId("facilities")),
            title: String(g?.title ?? ""),
            blurb: String(g?.blurb ?? ""),
            items: Array.isArray(g?.items) ? g.items.map((i) => String(i ?? "")) : [],
          }))
        : undefined,
      layout: ADDABLE_LAYOUTS.includes(r.layout as ListingBlockLayout)
        ? (r.layout as ListingBlockLayout)
        : kind === "custom"
          ? "text"
          : undefined,
      imageUrl: String(r.imageUrl ?? "").trim() || undefined,
      imageSide: r.imageSide === "right" ? "right" : "left",
      columns: Array.isArray(r.columns)
        ? r.columns.map((c) => ({
            id: String(c?.id || newSectionId("custom")),
            title: String(c?.title ?? ""),
            blurb: String(c?.blurb ?? ""),
            imageUrl: String(c?.imageUrl ?? "").trim() || undefined,
            imageSize: IMAGE_SIZES.includes(c?.imageSize as ListingImageSize)
              ? (c.imageSize as ListingImageSize)
              : undefined,
          }))
        : undefined,
      mapQuery: String(r.mapQuery ?? ""),
      ctaLabel: String(r.ctaLabel ?? ""),
      ctaHref: String(r.ctaHref ?? ""),
      imageSize: IMAGE_SIZES.includes(r.imageSize as ListingImageSize)
        ? (r.imageSize as ListingImageSize)
        : undefined,
      embedKind: DIRECTORY_BLOCKS.some((b) => b.kind === r.embedKind) ? (r.embedKind as ListingEmbedKind) : undefined,
      embeds: Array.isArray(r.embeds)
        ? r.embeds.map((e) => ({
            id: String(e?.id || newSectionId("custom")),
            refId: String(e?.refId ?? ""),
            ctaLabel: String(e?.ctaLabel ?? ""),
            ctaHref: String(e?.ctaHref ?? ""),
          }))
        : undefined,
    });
  }
  for (const missing of fallback) {
    if (!parsed.some((s) => s.kind === missing.kind && s.kind !== "custom")) {
      parsed.push(missing);
    }
  }
  return parsed;
}

export function listingSection(sections: ListingSection[] | undefined, kind: ListingSectionKind) {
  return sections?.find((s) => s.kind === kind);
}

export function listingSectionEnabled(
  sections: ListingSection[] | undefined,
  kind: ListingSectionKind,
): boolean {
  if (!sections?.length) return true;
  const hit = listingSection(sections, kind);
  return hit ? hit.enabled : true;
}

export function enabledSectionsInOrder(sections: ListingSection[] | undefined): ListingSection[] {
  return (sections ?? []).filter((s) => s.enabled);
}

export function unusedSectionKinds(
  type: BusinessVendorType,
  sections: ListingSection[],
): ListingSectionKind[] {
  const enabled = new Set(sections.filter((s) => s.enabled).map((s) => s.kind));
  return LISTING_KINDS_BY_VENDOR[type].filter((kind) => !enabled.has(kind));
}

export function emptySection(kind: ListingSectionKind, title?: string): ListingSection {
  return {
    id: newSectionId(kind),
    kind,
    title: title || LISTING_SECTION_LABELS[kind],
    enabled: true,
  };
}

export function emptyLayoutSection(layout: ListingBlockLayout): ListingSection {
  const title = LAYOUT_META[layout].title;
  const base: ListingSection = {
    id: newSectionId("custom"),
    kind: "custom",
    title,
    enabled: true,
    layout,
  };
  if (layout === "columns") {
    return {
      ...base,
      columns: [0, 1, 2].map((i) => ({
        id: `${base.id}-col-${i}`,
        title: "",
        blurb: "",
      })),
    };
  }
  if (layout === "gallery") return { ...base, photos: [] };
  if (layout === "accordion") return { ...base, faqs: [{ q: "", a: "" }] };
  if (layout === "imageText") return { ...base, imageSide: "left", imageUrl: "", customBody: "" };
  if (layout === "map") return { ...base, mapQuery: "", ctaLabel: "Get directions" };
  if (layout === "embed") return { ...base, embedKind: "doctor", embeds: [] };
  return { ...base, customBody: "" };
}

export function emptyEmbedSection(kind: ListingEmbedKind): ListingSection {
  const meta = DIRECTORY_BLOCKS.find((b) => b.kind === kind);
  return {
    id: newSectionId("custom"),
    kind: "custom",
    title: meta?.title || "From PocketPills",
    enabled: true,
    layout: "embed",
    embedKind: kind,
    embeds: [],
    staff: kind === "doctor" ? [] : undefined,
  };
}

export function sectionLayoutLabel(section: ListingSection) {
  if (section.kind === "custom" && section.layout === "embed") {
    return DIRECTORY_BLOCKS.find((b) => b.kind === section.embedKind)?.title || LAYOUT_META.embed.title;
  }
  if (section.kind === "custom") {
    return LAYOUT_META[section.layout ?? "text"].title;
  }
  return section.title || LISTING_SECTION_LABELS[section.kind];
}
