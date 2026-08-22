import { DetailSection } from "@/components/DetailSection";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ListingBlockView, listingBlockHasContent } from "@/components/ListingBlockView";
import { listingFaqsFor, listingForHub, listingGalleryFor } from "@/lib/listingOverlay";
import { listingSectionEnabled, type ListingSection } from "@/lib/listingPage";

export function ListingCustomSections({
  sections,
  fallbackQuery,
}: {
  sections?: ListingSection[];
  fallbackQuery?: string;
}) {
  const customs = (sections ?? []).filter(
    (s) => s.kind === "custom" && s.enabled && listingBlockHasContent(s),
  );
  if (!customs.length) return null;
  return (
    <>
      {customs.map((s) => (
        <ListingBlockView key={s.id} section={s} fallbackQuery={fallbackQuery} />
      ))}
    </>
  );
}

/** FAQ, gallery, and custom blocks for lab / assistant / any hub id. */
export function ListingLandingExtras({ hubId }: { hubId: string }) {
  const listing = listingForHub(hubId);
  if (!listing?.pageSections?.length) return null;
  const faqs = listingFaqsFor(hubId, []);
  const gallery = listingGalleryFor(hubId, []);
  const showFaq = listingSectionEnabled(listing.pageSections, "faq") && faqs.length > 0;
  const showGallery = listingSectionEnabled(listing.pageSections, "gallery") && gallery.length > 0;
  return (
    <>
      {showGallery ? (
        <DetailSection title="Gallery">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((g) => (
              <figure key={g.src + g.label} className="overflow-hidden rounded-xl border border-line">
                <img src={g.src} alt={g.label} className="aspect-[4/3] w-full object-cover" />
                {g.label ? <figcaption className="px-3 py-2 text-2xs text-ink-tertiary">{g.label}</figcaption> : null}
              </figure>
            ))}
          </div>
        </DetailSection>
      ) : null}
      {showFaq ? <FaqAccordion items={faqs} /> : null}
      <ListingCustomSections sections={listing.pageSections} />
    </>
  );
}
