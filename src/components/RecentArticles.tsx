import { useI18n } from "@/lib/i18n";
import {
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
  const rows = articles ?? publicationsToArticles(publicationsForOwner(ownerId));
  if (!rows.length) return null;

  return (
    <section className="min-w-0 scroll-mt-28">
      <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Recent articles")}
      </h2>
      <p className="mt-1 text-sm text-ink-tertiary">{lede}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.slice(0, 4).map((a) => (
          <article key={a.slug} className="flex flex-col rounded-2xl border border-line bg-white p-3">
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
        ))}
      </div>
    </section>
  );
}
