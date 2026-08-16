import { useRef } from "react";
import { useI18n } from "@/lib/i18n";
import {
  MAX_LISTING_PUBLICATIONS,
  PUBLICATION_KIND_LABELS,
  publicationsForOwner,
  type ListingPublication,
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
            <img src={a.imageUrl} alt="" className="aspect-[16/10] w-full object-cover object-center" />
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

export function RecentArticlesSection({
  lede,
  articles,
  ownerId,
}: {
  lede: string;
  articles?: RecentArticle[];
  ownerId?: string;
}) {
  const { tx } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const rows = (articles ?? publicationsToArticles(publicationsForOwner(ownerId))).slice(
    0,
    MAX_LISTING_PUBLICATIONS,
  );
  if (!rows.length) return null;

  const canPage = rows.length > 3;
  const scrollPage = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section className="min-w-0 scroll-mt-28">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("Recent articles")}
          </h2>
          <p className="mt-1 text-sm text-ink-tertiary">{lede}</p>
        </div>
        {canPage ? (
          <div className="mb-0.5 flex shrink-0 gap-2">
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
        ) : null}
      </div>
      <div
        ref={scroller}
        className="pp-scroll mt-4 flex gap-6 overflow-x-auto scroll-smooth pb-1"
      >
        {rows.map((a) => (
          <div
            key={a.slug}
            className="w-[min(18rem,85%)] shrink-0 snap-start md:w-[calc((100%-3rem)/3)]"
          >
            <ArticleCard a={a} tx={tx} />
          </div>
        ))}
      </div>
    </section>
  );
}
