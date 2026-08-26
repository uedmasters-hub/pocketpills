import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { DetailSection } from "@/components/DetailSection";
import { ENABLE_FIELD, EnableLine } from "@/components/listingEnable";
import { SkeletonImage } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useShellColumn } from "@/lib/columnHover";
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

export type DirectoryHeroUsp = {
  label: string;
};

const CHIP =
  "inline-flex h-7 shrink-0 items-center rounded-full border border-line bg-white px-3 text-xs font-medium leading-none text-[color:var(--pp-primary-950)] box-border";

export const DIRECTORY_CHIP = CHIP;

export const DIRECTORY_SIDEBAR_CARD =
  "rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,7,48,0.06)]";

function UspIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-ink-tertiary">
      <path
        d="M8 3.75h5.2L18 8.4v11.85A1.5 1.5 0 0 1 16.5 21.75h-9A1.5 1.5 0 0 1 6 20.25V5.25A1.5 1.5 0 0 1 7.5 3.75H8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13 3.75V8.4h4.8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m9.2 14.2 1.7 1.7 3.9-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function displaySubtitle(value: string) {
  return value.replace(/\s*·\s*/g, " • ");
}

export type DirectoryHeroEnable = {
  name: string;
  subtitle?: string;
  imageUrl: string;
  onChange: (partial: { name?: string; subtitle?: string; imageUrl?: string }) => void;
};

/** Compact split hero shared by doctor, pharmacy, and hospital public pages. */
export function DirectoryHeroCard({
  eyebrow,
  name,
  subtitle,
  imageUrl,
  imageClassName = "object-cover object-[center_28%]",
  badges = [],
  leadingBadges,
  usps = [],
  verified = true,
  enable,
}: {
  eyebrow: string;
  name: string;
  subtitle?: string;
  imageUrl: string;
  imageClassName?: string;
  badges?: DirectoryDetailBadge[];
  leadingBadges?: ReactNode;
  usps?: DirectoryHeroUsp[];
  verified?: boolean;
  enable?: DirectoryHeroEnable;
}) {
  const { tx } = useI18n();
  const shownUsps = usps.filter((u) => u.label.trim()).slice(0, 3);
  const displayName = enable?.name ?? name;
  const displaySub = enable ? enable.subtitle : subtitle;
  const displayImage = enable?.imageUrl ?? imageUrl;
  return (
    <header className="min-w-0 overflow-hidden rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)] sm:h-[16.5rem]">
      <div className="flex h-full flex-col sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-5 sm:px-6">
          <div className="min-w-0 text-left">
            <p className="pp-caps inline-flex items-center gap-1.5 text-[color:var(--pp-violet)]">
              {eyebrow}
              {verified ? (
                <span className="inline-flex" title="Verified">
                  <img src={verifiedBadge} alt="" className="h-3.5 w-3.5 shrink-0" />
                  <span className="sr-only">Verified</span>
                </span>
              ) : null}
            </p>
            {enable ? (
              <EnableLine
                value={displayName}
                onChange={(v) => enable.onChange({ name: v })}
                placeholder={tx("Your name")}
                className="mt-1.5 font-display text-[1.375rem] font-medium leading-[1.15] tracking-tight text-[color:var(--pp-primary-950)] sm:text-[1.5rem]"
              />
            ) : (
              <h1
                title={displayName}
                className="mt-1.5 line-clamp-2 font-display text-[1.375rem] font-medium leading-[1.15] tracking-tight text-[color:var(--pp-primary-950)] sm:text-[1.5rem]"
              >
                {displayName}
              </h1>
            )}
            {enable ? (
              <EnableLine
                value={displaySub || ""}
                onChange={(v) => enable.onChange({ subtitle: v })}
                placeholder={tx("One-line intro")}
                className="mt-1.5 truncate text-sm text-ink-secondary"
              />
            ) : displaySub ? (
              <p className="mt-1.5 truncate text-sm text-ink-secondary">{displaySubtitle(displaySub)}</p>
            ) : null}
            {shownUsps.length ? (
              <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-left">
                {shownUsps.map((u) => (
                  <li key={u.label} className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary">
                    <UspIcon />
                    {u.label}
                  </li>
                ))}
              </ul>
            ) : null}
            {(leadingBadges || badges.length > 0) && (
              <div className="mt-4 flex flex-nowrap items-center gap-4 overflow-x-auto">
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
        </div>
        <div className="relative h-52 w-full shrink-0 overflow-hidden sm:h-auto sm:w-[32%]">
          <SkeletonImage
            src={displayImage}
            alt={displayName}
            className="absolute inset-0 h-full w-full"
            imgClassName={"h-full w-full " + imageClassName}
          />
          {enable ? (
            <div className="absolute inset-x-3 bottom-3">
              <input
                className={ENABLE_FIELD + " bg-white/95"}
                value={displayImage}
                onChange={(e) => enable.onChange({ imageUrl: e.target.value })}
                placeholder={tx("Header image URL")}
                aria-label={tx("Header image URL")}
              />
            </div>
          ) : null}
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
  usps = [],
  extras = [],
  details = [],
  sidebar,
  children,
  reviews,
  afterHero,
  afterAbout,
  afterDetails,
  afterReviews,
  afterPage,
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
  usps?: DirectoryHeroUsp[];
  extras?: DirectoryDetailExtra[];
  details?: DirectoryDetailRow[];
  sidebar: ReactNode;
  children?: ReactNode;
  reviews?: ReactNode;
  afterHero?: ReactNode;
  afterAbout?: ReactNode;
  afterDetails?: ReactNode;
  afterReviews?: ReactNode;
  afterPage?: ReactNode;
}) {
  const { tx } = useI18n();
  const aboutCopy = about || bio;
  const mainCol = useShellColumn("main");
  const railCol = useShellColumn("rail");

  return (
    <div>
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
        aria-label={backLabel}
      >
        ← {backLabel}
      </Link>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-4 lg:gap-6">
        <div
          className={"min-w-0 space-y-5 lg:col-span-3 lg:col-start-1 lg:row-start-1 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <DirectoryHeroCard
            eyebrow={eyebrow}
            name={name}
            subtitle={subtitle}
            imageUrl={imageUrl}
            imageClassName={imageClassName}
            badges={badges}
            leadingBadges={leadingBadges}
            usps={usps}
          />
          {afterHero}
        </div>

        <aside
          className={
            "space-y-3 lg:col-span-1 lg:col-start-4 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-28 lg:self-start " +
            railCol.className
          }
          onMouseEnter={railCol.onMouseEnter}
        >
          {sidebar}
        </aside>

        <div
          className={"min-w-0 space-y-10 lg:col-span-3 lg:col-start-1 lg:row-start-2 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <DetailSection title={tx("About")}>
            <p className="text-sm leading-relaxed text-ink-secondary">{aboutCopy}</p>
            {extras.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {extras.map((block) => (
                  <div key={block.title} className="rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-4">
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
          </DetailSection>

          {children ? <div className="space-y-10">{children}</div> : null}

          {details.length > 0 && (
            <div className="space-y-4">
              <DetailSection title={tx("Details")} flush>
                <dl>
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
              </DetailSection>
              {afterDetails}
            </div>
          )}
          {!details.length && afterDetails ? <div>{afterDetails}</div> : null}

          {reviews}

          {afterReviews ? <div className="space-y-10">{afterReviews}</div> : null}
        </div>
      </div>

      {afterPage ? <div className="mt-10 space-y-10">{afterPage}</div> : null}
    </div>
  );
}
