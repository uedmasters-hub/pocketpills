import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SkeletonImage } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import verifiedBadge from "../../icons/verified badge.svg";

export type DirectoryDetailBadge = {
  label: string;
  strong?: boolean;
};

export type DirectoryDetailRow = {
  k: string;
  v: string;
};

export type DirectoryDetailExtra = {
  title: string;
  items: string[];
  check?: boolean;
};

const CHIP =
  "inline-flex h-7 shrink-0 items-center rounded-full border border-line bg-white px-3 text-xs font-medium leading-none text-[color:var(--pp-primary-950)] box-border";

export const DIRECTORY_CHIP = CHIP;

export const DIRECTORY_SIDEBAR_CARD =
  "rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,7,48,0.06)]";

/** Compact split hero shared by doctor, pharmacy, and hospital public pages. */
export function DirectoryHeroCard({
  eyebrow,
  name,
  subtitle,
  bio,
  imageUrl,
  imageClassName = "object-cover object-[center_28%]",
  badges = [],
  leadingBadges,
  verified = true,
}: {
  eyebrow: string;
  name: string;
  subtitle?: string;
  bio?: string;
  imageUrl: string;
  imageClassName?: string;
  badges?: DirectoryDetailBadge[];
  leadingBadges?: ReactNode;
  verified?: boolean;
}) {
  return (
    <header className="min-w-0 overflow-hidden rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)] sm:h-[16.5rem]">
      <div className="flex h-full flex-col sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-4 sm:px-6 sm:py-5">
          <p className="pp-caps inline-flex items-center gap-1.5 text-[color:var(--pp-violet)]">
            {eyebrow}
            {verified ? (
              <span className="inline-flex" title="Verified">
                <img src={verifiedBadge} alt="" className="h-3.5 w-3.5 shrink-0" />
                <span className="sr-only">Verified</span>
              </span>
            ) : null}
          </p>
          <h1
            title={name}
            className="mt-1.5 line-clamp-2 font-display text-[1.375rem] font-medium leading-[1.15] tracking-tight text-[color:var(--pp-primary-950)] sm:text-[1.5rem]"
          >
            {name}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 truncate text-sm text-ink-secondary">{subtitle}</p>
          ) : null}
          {bio ? (
            <p className="mt-1.5 line-clamp-2 max-w-md text-sm leading-snug text-ink-secondary">{bio}</p>
          ) : null}
          {(leadingBadges || badges.length > 0) && (
            <div className="mt-3 flex flex-nowrap items-center gap-2 overflow-x-auto">
              {leadingBadges}
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={CHIP + (b.strong ? " font-semibold" : "")}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="relative h-52 w-full shrink-0 overflow-hidden sm:h-auto sm:w-[32%]">
          <SkeletonImage
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full"
            imgClassName={"h-full w-full " + imageClassName}
          />
          <span
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-[color:var(--pp-primary-200)] to-transparent sm:block"
            aria-hidden
          />
        </div>
      </div>
    </header>
  );
}

/**
 * Shared public-profile chrome for doctors, pharmacies, and facilities:
 * split hero (copy left, photo right), about, optional body, details, sticky sidebar.
 */
export function DirectoryDetailLayout({
  backTo,
  backLabel,
  eyebrow,
  name,
  subtitle,
  bio,
  about,
  imageUrl,
  imageClassName = "object-cover object-[center_28%]",
  badges = [],
  leadingBadges,
  extras = [],
  details = [],
  sidebar,
  children,
  reviews,
  afterHero,
  afterAbout,
  afterDetails,
  afterReviews,
}: {
  backTo: string;
  backLabel: string;
  eyebrow: string;
  name: string;
  subtitle: string;
  bio: string;
  about?: string;
  imageUrl: string;
  imageClassName?: string;
  badges?: DirectoryDetailBadge[];
  leadingBadges?: ReactNode;
  extras?: DirectoryDetailExtra[];
  details?: DirectoryDetailRow[];
  sidebar: ReactNode;
  children?: ReactNode;
  reviews?: ReactNode;
  afterHero?: ReactNode;
  afterAbout?: ReactNode;
  afterDetails?: ReactNode;
  afterReviews?: ReactNode;
}) {
  const { tx } = useI18n();
  const aboutCopy = about || bio;

  return (
    <div>
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {backLabel}
      </Link>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
          <DirectoryHeroCard
            eyebrow={eyebrow}
            name={name}
            subtitle={subtitle}
            bio={bio}
            imageUrl={imageUrl}
            imageClassName={imageClassName}
            badges={badges}
            leadingBadges={leadingBadges}
          />
          {afterHero}
        </div>

        <aside className="space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-28 lg:self-start">
          {sidebar}
        </aside>

        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-2">
          <section>
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("About")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{aboutCopy}</p>
            {extras.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {extras.map((block) => (
                  <div key={block.title} className="rounded-2xl border border-line bg-white p-4">
                    <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                      {block.title}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {block.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-sm text-[color:var(--pp-primary-950)]"
                        >
                          {block.check ? (
                            <span className="text-wellness" aria-hidden>
                              ✓
                            </span>
                          ) : null}
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {afterAbout}
          </section>

          {children ? <div className="space-y-10">{children}</div> : null}

          {details.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                {tx("Details")}
              </h2>
              <dl className="overflow-hidden rounded-2xl border border-line bg-white">
                {details.map((row, i) => (
                  <div
                    key={row.k}
                    className={"flex justify-between gap-4 px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}
                  >
                    <dt className="text-sm text-ink-tertiary">{row.k}</dt>
                    <dd className="max-w-[60%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">
                      {row.v}
                    </dd>
                  </div>
                ))}
              </dl>
              {afterDetails}
            </section>
          )}
          {!details.length && afterDetails ? <div>{afterDetails}</div> : null}

          {reviews}

          {afterReviews ? <div className="space-y-10">{afterReviews}</div> : null}
        </div>
      </div>
    </div>
  );
}
