import { useState } from "react";
import { Link } from "react-router-dom";
import { DoctorPhoto } from "@/components/DoctorPhoto";
import { DetailSection } from "@/components/DetailSection";
import { ListingSizedImage } from "@/components/ListingSizedImage";
import { mapsDirectionsUrl } from "@/lib/hospitalProfileContent";
import { resolveEmbed } from "@/lib/listingEmbeds";
import { staffRowsAsProviders } from "@/lib/listingOverlay";
import { useI18n } from "@/lib/i18n";
import type { ListingSection } from "@/lib/listingPage";

function BlockCta({ label, href }: { label?: string; href?: string }) {
  if (!label?.trim() || !href?.trim()) return null;
  const to = href.trim();
  const cls = "mt-4 inline-flex text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70";
  if (to.startsWith("/")) {
    return (
      <Link to={to} className={cls}>
        {label} →
      </Link>
    );
  }
  return (
    <a href={to} className={cls} target={to.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {label} →
    </a>
  );
}

export function listingBlockHasContent(section: ListingSection) {
  const layout = section.layout ?? "text";
  if (layout === "gallery") return Boolean(section.photos?.some((p) => p.src.trim()));
  if (layout === "accordion") return Boolean(section.faqs?.some((f) => f.q.trim()));
  if (layout === "columns") return Boolean(section.columns?.some((c) => c.title.trim() || c.blurb.trim()));
  if (layout === "map") return Boolean(section.mapQuery?.trim() || section.title.trim());
  if (layout === "embed") {
    return Boolean(
      section.embeds?.some((e) => e.refId.trim()) ||
        (section.embedKind === "doctor" && section.staff?.some((s) => s.name.trim() || s.nmcNumber || s.foreign)),
    );
  }
  if (layout === "imageText") {
    return Boolean(section.customBody?.trim() || section.imageUrl?.trim() || section.title.trim());
  }
  return Boolean(section.title.trim() || section.customBody?.trim() || section.ctaHref?.trim());
}

export function ListingBlockView({
  section,
  fallbackQuery = "",
}: {
  section: ListingSection;
  fallbackQuery?: string;
}) {
  const { tx } = useI18n();
  const layout = section.layout ?? "text";
  const title = section.title.trim() || tx("More");

  if (layout === "imageText") {
    const imgLeft = section.imageSide !== "right";
    return (
      <DetailSection title={title}>
        <div className={"flex flex-wrap items-start gap-5 " + (imgLeft ? "" : "flex-row-reverse")}>
          {section.imageUrl ? (
            <ListingSizedImage src={section.imageUrl} size={section.imageSize || "l"} />
          ) : (
            <div className="aspect-[4/3] w-full max-w-sm rounded-xl bg-[color:var(--pp-primary-200)]" />
          )}
          <div className="min-w-0 flex-1">
            {section.customBody ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{section.customBody}</p>
            ) : null}
            <BlockCta label={section.ctaLabel} href={section.ctaHref} />
          </div>
        </div>
      </DetailSection>
    );
  }

  if (layout === "columns") {
    const cols = (section.columns ?? []).filter((c) => c.title.trim() || c.blurb.trim() || c.imageUrl);
    return (
      <DetailSection title={title}>
        <div className="grid gap-4 sm:grid-cols-3">
          {cols.map((c) => (
            <article key={c.id} className="rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-4">
              {c.imageUrl ? (
                <ListingSizedImage src={c.imageUrl} size={c.imageSize || "full"} className="mb-3" />
              ) : null}
              {c.title ? <p className="font-semibold text-[color:var(--pp-primary-950)]">{c.title}</p> : null}
              {c.blurb ? <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{c.blurb}</p> : null}
            </article>
          ))}
        </div>
      </DetailSection>
    );
  }

  if (layout === "gallery") {
    const photos = (section.photos ?? []).filter((p) => p.src.trim());
    return (
      <DetailSection title={title}>
        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <figure key={i} className="overflow-hidden rounded-xl border border-line bg-[color:var(--pp-primary-100)]">
              <ListingSizedImage src={p.src} alt={p.label} size={p.size || "m"} />
              {p.label ? <figcaption className="px-2 py-1.5 text-2xs text-ink-tertiary">{p.label}</figcaption> : null}
            </figure>
          ))}
        </div>
      </DetailSection>
    );
  }

  if (layout === "accordion") {
    const faqs = (section.faqs ?? []).filter((f) => f.q.trim());
    return (
      <DetailSection title={title} flush>
        <BlockAccordion items={faqs} />
      </DetailSection>
    );
  }

  if (layout === "map") {
    const query = section.mapQuery?.trim() || fallbackQuery.trim();
    return (
      <DetailSection title={title}>
        {section.customBody ? (
          <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{section.customBody}</p>
        ) : null}
        {query ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-line bg-[color:var(--pp-primary-100)]">
            <iframe
              title={title}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&hl=en&t=m&output=embed`}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <p className="text-sm text-ink-tertiary">{tx("Add an address to show the map.")}</p>
        )}
        {query ? (
          <a
            href={section.ctaHref?.trim() || mapsDirectionsUrl(query)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
          >
            {tx(section.ctaLabel?.trim() || "Get directions")} →
          </a>
        ) : null}
      </DetailSection>
    );
  }

  if (layout === "embed") {
    const kind = section.embedKind || "doctor";
    const staff = kind === "doctor" ? staffRowsAsProviders(section.staff) : [];
    const cards = (section.embeds ?? [])
      .map((e) => resolveEmbed(e, kind))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    return (
      <DetailSection title={title}>
        {staff.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {staff.map((d) => (
              <div
                key={d.id}
                className="flex flex-col items-center rounded-2xl border border-line bg-white px-3 py-4 text-center"
              >
                <DoctorPhoto src={d.imageUrl} className="h-16 w-16" />
                <p className="mt-3 line-clamp-2 text-sm font-semibold text-[color:var(--pp-primary-950)]">{d.name}</p>
                {d.subtitle ? <p className="mt-1 line-clamp-2 text-xs text-ink-tertiary">{d.subtitle}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
        {cards.length ? (
          <div className={"grid gap-3 sm:grid-cols-2 lg:grid-cols-3 " + (staff.length ? "mt-4" : "")}>
            {cards.map((c) => (
              <Link
                key={c.refId}
                to={c.href}
                className="flex items-center gap-3 rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-3 hover:bg-[color:var(--state-hover)]"
              >
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-full bg-[color:var(--pp-primary-200)]" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">{c.name}</span>
                  <span className="block truncate text-xs text-ink-tertiary">{c.subtitle}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : null}
        <BlockCta label={section.ctaLabel} href={section.ctaHref} />
      </DetailSection>
    );
  }

  return (
    <DetailSection title={title}>
      {section.customBody ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{section.customBody}</p>
      ) : null}
      <BlockCta label={section.ctaLabel} href={section.ctaHref} />
    </DetailSection>
  );
}

function BlockAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!items.length) return null;
  return (
    <div>
      {items.map((item, i) => {
        const on = open === i;
        return (
          <div key={i} className={i > 0 ? "border-t border-line" : ""}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
              aria-expanded={on}
              onClick={() => setOpen(on ? null : i)}
            >
              <span className="text-sm font-medium text-[color:var(--pp-primary-950)]">{item.q}</span>
              <span className="text-ink-tertiary" aria-hidden>
                {on ? "−" : "+"}
              </span>
            </button>
            {on && item.a ? (
              <p className="px-5 pb-3.5 text-sm leading-relaxed text-ink-secondary">{item.a}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
