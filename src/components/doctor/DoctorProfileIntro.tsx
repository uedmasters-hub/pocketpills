import type { ReactNode } from "react";
import {
  DirectoryHeroCard,
  type DirectoryDetailBadge,
  type DirectoryDetailExtra,
  type DirectoryHeroEnable,
  type DirectoryHeroUsp,
} from "@/components/DirectoryDetailLayout";
import { useI18n } from "@/lib/i18n";

/** Canonical doctor-header USPs — Digital Prescription, Free Followup, then visit posture. */
export function doctorHeroUsps(
  tx: (s: string) => string,
  opts?: { consultant?: boolean },
): DirectoryHeroUsp[] {
  return [
    { label: tx("Digital Prescription") },
    { label: tx("Free Followup") },
    { label: tx(opts?.consultant ? "Consultant" : "Accepting visits") },
  ];
}

/**
 * Master doctor public intro: split hero + About in one card.
 * Used by every doctor profile (`/doctors/:nmc`, `/appointments/provider/:id`)
 * and the design-system preview.
 */
export function DoctorProfileIntro({
  eyebrow,
  name,
  subtitle,
  imageUrl,
  imageClassName,
  badges = [],
  leadingBadges,
  extraBadges,
  usps = [],
  verified = true,
  enable,
  about,
  extras = [],
  afterAbout,
}: {
  eyebrow: string;
  name: string;
  subtitle?: string;
  imageUrl: string;
  imageClassName?: string;
  badges?: DirectoryDetailBadge[];
  leadingBadges?: ReactNode;
  extraBadges?: ReactNode;
  usps?: DirectoryHeroUsp[];
  verified?: boolean;
  enable?: DirectoryHeroEnable;
  about: string;
  extras?: DirectoryDetailExtra[];
  afterAbout?: ReactNode;
}) {
  const { tx } = useI18n();
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-line bg-white">
      <DirectoryHeroCard
        eyebrow={eyebrow}
        name={name}
        subtitle={subtitle}
        imageUrl={imageUrl}
        imageClassName={imageClassName}
        badges={badges}
        leadingBadges={leadingBadges}
        extraBadges={extraBadges}
        usps={usps}
        verified={verified}
        embedded
        enable={enable}
      />
      <div className="border-t border-line px-5 py-4">
        <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">{tx("About")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{about}</p>
        {extras.length > 0 && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {extras.map((block) => (
              <div key={block.title} className="rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-4">
                <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{block.title}</p>
                <ul className="mt-2 space-y-1.5">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-[color:var(--pp-primary-950)]">
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
      </div>
    </section>
  );
}
