import { useRef } from "react";
import { DetailSection } from "@/components/DetailSection";
import { ENABLE_FIELD, ENABLE_SELECT, EnableAddButton, EnableLine } from "@/components/listingEnable";
import { useI18n } from "@/lib/i18n";
import {
  MAX_LISTING_PUBLICATIONS,
  PUBLICATION_KIND_LABELS,
  newListingPublication,
  publicationsForOwner,
  type ListingPublication,
  type ListingPublicationKind,
} from "@/lib/businessProfile";

export function publicationsToArticles(items: ListingPublication[]) {
  return items.map((p) => ({
    slug: p.id,
    title: p.title,
    blurb: p.summary,
    minutes: p.minutes,
    tag: PUBLICATION_KIND_LABELS[p.kind],
    imageUrl: p.imageUrl,
  }));
}

export type RecentArticle = {
  slug: string;
  title: string;
  blurb: string;
  minutes?: number;
  tag?: string;
  imageUrl?: string;
};

function ArticleCard({ a, tx }: { a: RecentArticle; tx: (s: string) => string }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-3">
      <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
        {tx(a.tag || "Article")}
      </p>
      {a.imageUrl || a.minutes ? (
        <div className="relative mt-2 overflow-hidden rounded-xl bg-[color:var(--pp-primary-200)]">
          {a.imageUrl ? (
            <img src={a.imageUrl} alt={tx(a.title)} className="aspect-[16/10] w-full object-cover object-center" />
          ) : (
            <div className="aspect-[16/10] w-full" />
          )}
          {a.minutes ? (
            <span className="absolute bottom-2 right-2 rounded-full bg-white px-2 py-0.5 text-2xs font-medium text-[color:var(--pp-primary-950)] shadow-sm">
              {a.minutes} {tx("min read")}
            </span>
          ) : null}
        </div>
      ) : null}
      <h3 className="mt-2.5 line-clamp-2 font-semibold leading-snug text-[color:var(--pp-primary-950)]">
        {tx(a.title)}
      </h3>
      {a.blurb ? (
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-secondary">{tx(a.blurb)}</p>
      ) : null}
    </article>
  );
}

function EnableArticleCard({
  item,
  onChange,
  onRemove,
  tx,
}: {
  item: ListingPublication;
  onChange: (partial: Partial<ListingPublication>) => void;
  onRemove: () => void;
  tx: (s: string) => string;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-3">
      <div className="flex items-center gap-2">
        <select
          className={ENABLE_SELECT + " min-w-0 flex-1"}
          value={item.kind}
          onChange={(e) => onChange({ kind: e.target.value as ListingPublicationKind })}
          aria-label={tx("Type")}
        >
          {(Object.keys(PUBLICATION_KIND_LABELS) as ListingPublicationKind[]).map((k) => (
            <option key={k} value={k}>
              {tx(PUBLICATION_KIND_LABELS[k])}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="shrink-0 text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
          onClick={onRemove}
        >
          {tx("Remove")}
        </button>
      </div>
      <div className="relative mt-2 overflow-hidden rounded-xl bg-[color:var(--pp-primary-200)]">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="aspect-[16/10] w-full object-cover object-center" />
        ) : (
          <div className="aspect-[16/10] w-full" />
        )}
        {item.minutes ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-white px-2 py-0.5 text-2xs font-medium text-[color:var(--pp-primary-950)]">
            {item.minutes} {tx("min read")}
          </span>
        ) : null}
      </div>
      <input
        className={ENABLE_FIELD + " mt-2"}
        value={item.imageUrl || ""}
        onChange={(e) => onChange({ imageUrl: e.target.value })}
        placeholder={tx("Image URL (optional)")}
      />
      <EnableLine
        value={item.title}
        onChange={(title) => onChange({ title })}
        placeholder={tx("Title")}
        className="mt-2.5 font-semibold leading-snug text-[color:var(--pp-primary-950)]"
      />
      <EnableLine
        multiline
        rows={2}
        value={item.summary}
        onChange={(summary) => onChange({ summary })}
        placeholder={tx("Short summary (optional)")}
        className="mt-1 text-sm leading-snug text-ink-secondary"
      />
      <input
        className={ENABLE_FIELD + " mt-2"}
        inputMode="numeric"
        value={item.minutes || ""}
        onChange={(e) => onChange({ minutes: Number(e.target.value) || undefined })}
        placeholder={tx("Min")}
        aria-label={tx("Minutes to read")}
      />
    </article>
  );
}

export function RecentArticlesSection({
  lede,
  articles,
  ownerId,
  publications,
  onChange,
  title,
  onTitleChange,
}: {
  lede: string;
  articles?: RecentArticle[];
  ownerId?: string;
  publications?: ListingPublication[];
  onChange?: (next: ListingPublication[]) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
}) {
  const { tx } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const enable = Boolean(onChange);
  const pubs = publications ?? (ownerId ? publicationsForOwner(ownerId) : []);
  const rows = enable
    ? pubs
    : (articles ?? publicationsToArticles(pubs.filter((p) => p.title.trim()))).slice(0, MAX_LISTING_PUBLICATIONS);

  if (!rows.length && !enable) return null;

  const canPage = rows.length > 3;
  const scrollPage = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <DetailSection
      title={title || tx("Recent articles")}
      onTitleChange={onTitleChange}
      lede={tx(lede)}
      meta={
        enable ? (
          <p className="shrink-0 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary tnum">
            {pubs.length} {tx("of")} {MAX_LISTING_PUBLICATIONS}
          </p>
        ) : canPage ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => scrollPage(-1)}
              className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]"
              aria-label={tx("Previous articles")}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M12.5 5 7.5 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollPage(1)}
              className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]"
              aria-label={tx("Next articles")}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M7.5 5 12.5 10l-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : undefined
      }
    >
      <div
        ref={scroller}
        className="pp-scroll -mx-1 flex gap-6 overflow-x-auto scroll-smooth px-1 pb-1"
      >
        {enable
          ? pubs.map((item) => (
              <div
                key={item.id}
                className="w-[min(18rem,85%)] shrink-0 snap-start md:w-[calc((100%-3rem)/3)]"
              >
                <EnableArticleCard
                  item={item}
                  tx={tx}
                  onChange={(partial) =>
                    onChange?.(pubs.map((p) => (p.id === item.id ? { ...p, ...partial } : p)))
                  }
                  onRemove={() => onChange?.(pubs.filter((p) => p.id !== item.id))}
                />
              </div>
            ))
          : (rows as RecentArticle[]).map((a) => (
              <div
                key={a.slug}
                className="w-[min(18rem,85%)] shrink-0 snap-start md:w-[calc((100%-3rem)/3)]"
              >
                <ArticleCard a={a} tx={tx} />
              </div>
            ))}
      </div>
      {enable && pubs.length < MAX_LISTING_PUBLICATIONS ? (
        <EnableAddButton
          className="mt-3"
          onClick={() => onChange?.([...pubs, newListingPublication()])}
        >
          + {tx("Add publication")}
        </EnableAddButton>
      ) : enable ? (
        <p className="mt-3 text-sm text-ink-tertiary">
          {tx("Remove an older publication to keep this slot clean, then add a new one.")}
        </p>
      ) : null}
    </DetailSection>
  );
}
