import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  formatFee,
  kindLabel,
  listProviders,
  type CareProvider,
  type SpecialtyId,
} from "@/lib/appointments";
import type { SpecialisedGroup } from "@/lib/specialisedIn";
import { FaqAccordion } from "@/components/FaqAccordion";
import { RecentArticlesSection } from "@/components/RecentArticles";
import { getDoctorClaim } from "@/lib/doctorDirectory";
import { ownerIdForListing, publicationsForOwner } from "@/lib/businessProfile";
import {
  conditionHref,
  doctorConditions,
  doctorExperience,
  doctorFaqs,
  doctorHighlightFacts,
  doctorPracticeCards,
  doctorServices,
  doctorSpecialisationTiles,
  nmcNumberOf,
  providerProfileHref,
  type DoctorHighlightFact,
} from "@/lib/doctorProfileContent";
import { useReviewSummaries } from "@/lib/useReviewSummaries";
import type { ReviewSummary } from "@/lib/reviewsApi";

const CARD = "rounded-2xl border border-line bg-white p-4";
const H2 = "font-display text-xl font-medium text-[color:var(--pp-primary-950)]";
const LEDE = "mt-1 text-sm text-ink-tertiary";
const TAG =
  "inline-flex items-center rounded-full border border-line bg-white px-3 py-1.5 text-sm text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]";

function SectionHead({ title, lede }: { title: string; lede?: string }) {
  const { tx } = useI18n();
  return (
    <>
      <h2 className={H2}>{tx(title)}</h2>
      {lede ? <p className={LEDE}>{tx(lede)}</p> : null}
    </>
  );
}

export function DoctorConditionsSection({
  provider,
  specialisedIn,
}: {
  provider: CareProvider;
  specialisedIn: SpecialisedGroup[];
}) {
  const { tx } = useI18n();
  const conditions = doctorConditions(provider);
  const services = doctorServices(provider, specialisedIn);
  if (!conditions.length && !services.length) return null;

  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Conditions & treatments"
        lede="What this specialty typically covers on PocketPills, plus consult types listed on the profile."
      />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {conditions.length ? (
          <div className={CARD}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {tx("Common conditions")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {conditions.map((c) => (
                <Link key={c} to={conditionHref(c)} className={TAG}>
                  {tx(c)}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {services.length ? (
          <div className={CARD}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {tx("Services / treatments")}
            </p>
            <ul className="mt-3 space-y-1.5">
              {services.map((s) => (
                <li key={s} className="flex gap-2 text-sm text-[color:var(--pp-primary-950)]">
                  <span className="text-wellness" aria-hidden>
                    ✓
                  </span>
                  {tx(s)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function DoctorExperienceSection({ provider }: { provider: CareProvider }) {
  const { tx } = useI18n();
  const data = doctorExperience(provider);
  if (!data) return null;

  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Experience & education"
        lede="Professional history taken from this listing and registry record."
      />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {data.jobs.length ? (
          <div className={CARD + " sm:col-span-2"}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {tx("Work experience")}
            </p>
            <ol className="mt-3 space-y-3">
              {data.jobs.map((job) => (
                <li key={job.org + job.role} className="relative border-l border-line pl-4">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[color:var(--pp-violet)]" aria-hidden />
                  <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(job.role)}</p>
                  <p className="mt-0.5 text-sm text-ink-secondary">{job.org}</p>
                  <p className="mt-0.5 text-2xs text-ink-tertiary">{tx(job.years)}</p>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {data.education.length ? (
          <div className={CARD}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Education")}</p>
            <ul className="mt-3 space-y-1.5">
              {data.education.map((line) => (
                <li key={line} className="text-sm text-[color:var(--pp-primary-950)]">
                  {tx(line)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {data.certifications.length ? (
          <div className={CARD}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {tx("Certifications / professional training")}
            </p>
            <ul className="mt-3 space-y-1.5">
              {data.certifications.map((line) => (
                <li key={line} className="text-sm text-[color:var(--pp-primary-950)]">
                  {tx(line)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function DoctorPracticeSection({
  provider,
  facilities,
  specialtyId,
}: {
  provider: CareProvider;
  facilities: CareProvider[];
  specialtyId?: SpecialtyId | null;
}) {
  const { tx } = useI18n();
  const cards = doctorPracticeCards(provider, facilities);
  if (!cards.length) return null;

  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Practice locations"
        lede="Where this doctor currently sees patients, as listed on PocketPills."
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {cards.map((loc) => {
          const qs = specialtyId ? `?specialty=${encodeURIComponent(specialtyId)}` : "";
          const href = loc.href.includes("?") ? loc.href : loc.href + qs;
          return (
            <div key={loc.id} className={CARD + " flex flex-col"}>
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx(loc.kind)}</p>
              <p className="mt-1 font-semibold text-[color:var(--pp-primary-950)]">{loc.name}</p>
              <p className="mt-1 text-sm text-ink-secondary">{loc.location}</p>
              <p className="mt-2 text-sm text-[color:var(--pp-primary-950)]">{tx(loc.visit)}</p>
              {loc.hours ? <p className="mt-0.5 text-2xs text-ink-tertiary">{tx(loc.hours)}</p> : null}
              {loc.href ? (
                <Link
                  to={href}
                  className="mt-3 text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
                >
                  {tx("View facility")} →
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function DoctorFaqSection({
  provider,
  specialisedIn,
}: {
  provider: CareProvider;
  specialisedIn: SpecialisedGroup[];
}) {
  const items = doctorFaqs(provider, doctorConditions(provider), specialisedIn);
  return <FaqAccordion items={items} />;
}

export function DoctorArticlesSection({ provider }: { provider: CareProvider }) {
  const nmc = nmcNumberOf(provider);
  const ownerId = ownerIdForListing(provider.id, nmc ? getDoctorClaim(nmc)?.providerId : undefined);
  const owned = ownerId ? publicationsForOwner(ownerId) : [];
  if (!owned.length) return null;
  return (
    <RecentArticlesSection
      ownerId={ownerId}
      lede="News, articles, and other verified publications from this doctor."
    />
  );
}

function HighlightIcon({ kind }: { kind: DoctorHighlightFact["key"] }) {
  const common = "h-5 w-5 shrink-0 text-ink-tertiary";
  if (kind === "college") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
        <path d="M3 10.5 12 5l9 5.5-9 5.5-9-5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7 12.8v4.2c0 .4 2.2 2 5 2s5-1.6 5-2v-4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "experience") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
        <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="16.2" cy="16.2" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === "hospital") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
        <path d="M4 20V8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5V20" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 20v-6h6v6M12 7V4M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 10v4M10 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "since") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 3.5V7M16 3.5V7M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="m10 14.5 1.4 1.4 3.2-3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
      <path d="M8 3.75h5.2L18 8.4v11.85A1.5 1.5 0 0 1 16.5 21.75h-9A1.5 1.5 0 0 1 6 20.25V5.25A1.5 1.5 0 0 1 7.5 3.75H8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13 3.75V8.4h4.8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function DoctorHighlightsSection({
  provider,
  facilities,
}: {
  provider: CareProvider;
  facilities: CareProvider[];
}) {
  const { tx } = useI18n();
  const facts = doctorHighlightFacts(provider, facilities);
  if (!facts.length) return null;

  return (
    <section className="min-w-0 scroll-mt-28">
      <h2 className={H2}>{tx("Specialised in")}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {facts.map((fact) => (
          <div
            key={fact.key}
            className="inline-flex min-h-[3.25rem] items-center gap-2.5 rounded-2xl bg-[color:var(--pp-primary-200)] px-4 py-3"
          >
            <HighlightIcon kind={fact.key} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[color:var(--pp-primary-950)]">
              {tx(fact.label)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DoctorSpecialisationsGrid({
  provider,
  specialisedIn,
}: {
  provider: CareProvider;
  specialisedIn: SpecialisedGroup[];
}) {
  const { tx } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const tiles = doctorSpecialisationTiles(provider, specialisedIn);
  if (!tiles.length) return null;

  const visibleCap = 7;
  const extra = Math.max(0, tiles.length - visibleCap);
  const shown = expanded || extra === 0 ? tiles : tiles.slice(0, visibleCap);

  return (
    <section className="min-w-0 scroll-mt-28">
      <div className="flex items-center justify-between gap-4">
        <h2 className={H2}>{tx("Specialisations")}</h2>
        {extra > 0 && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
          >
            {extra} {tx("more")}
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {shown.map((tile) => (
          <div
            key={tile.id}
            className="flex flex-col items-center justify-center rounded-2xl bg-white px-3 py-6 text-center"
          >
            <img src={tile.imageUrl} alt="" className="h-16 w-16 object-contain" />
            <p className="mt-3 text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(tile.label)}</p>
          </div>
        ))}
        {extra > 0 && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex flex-col items-center justify-center rounded-2xl bg-white px-3 py-6 text-center"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-2xl font-medium leading-none text-[color:var(--pp-primary-950)]">
              +
            </span>
            <p className="mt-3 text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("View all")}</p>
            <p className="mt-0.5 text-2xs text-ink-tertiary">+{extra}</p>
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function DoctorRelatedSection({ provider }: { provider: CareProvider }) {
  const { tx } = useI18n();
  const specialtyKey = provider.specialties.join(",");
  const affiliateKey = (provider.affiliatedFacilityIds ?? []).join(",");
  const doctors = useMemo(() => {
    return listProviders()
      .filter(
        (p) =>
          p.kind === "doctor" &&
          p.id !== provider.id &&
          p.specialties.some((s) => provider.specialties.includes(s)),
      )
      .slice(0, 4);
  }, [provider.id, specialtyKey]);
  const facilities = useMemo(() => {
    return listProviders()
      .filter(
        (p) =>
          p.kind !== "doctor" &&
          (p.city === provider.city || (provider.affiliatedFacilityIds ?? []).includes(p.id)),
      )
      .slice(0, 4);
  }, [provider.city, affiliateKey]);
  const doctorIds = useMemo(
    () => doctors.map((d) => nmcNumberOf(d) || d.id.replace(/^nmc-/, "")),
    [doctors],
  );
  const { map: ratings } = useReviewSummaries("doctor", doctorIds);

  if (!doctors.length && !facilities.length) return null;

  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Related doctors & healthcare facilities"
        lede="Similar clinicians and nearby facilities already listed on PocketPills."
      />
      {doctors.length ? (
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((d) => {
            const id = nmcNumberOf(d) || d.id.replace(/^nmc-/, "");
            const summary = ratings[id];
            return (
              <DoctorRelatedCard
                key={d.id}
                item={d}
                summary={summary}
              />
            );
          })}
        </div>
      ) : null}
      {facilities.length ? (
        <>
          <p className="mt-6 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
            {tx("Related hospitals & clinics")}
          </p>
          <div className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map((f) => (
              <DoctorRelatedCard key={f.id} item={f} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

const STAR_PATH = "M12 3.6 14.6 9l6 .9-4.3 4.2 1 5.9L12 17.3 6.7 20l1-5.9L3.4 9.9 9.4 9 12 3.6Z";

export function DoctorRelatedCard({
  item,
  summary,
}: {
  item: CareProvider;
  summary?: ReviewSummary | null;
}) {
  const { tx } = useI18n();
  const nmc = item.kind === "doctor" ? nmcNumberOf(item) : null;
  const degree = item.kind === "doctor" ? item.subtitle.split("·")[0]?.trim() : "";
  const meta =
    item.kind === "doctor"
      ? [degree, nmc ? `NMC #${nmc}` : null, item.city].filter(Boolean).join(" • ")
      : [tx(kindLabel(item.kind)), item.city].filter(Boolean).join(" • ");
  const showFee = item.kind === "doctor" && item.consultationFee > 0;
  const showRating = Boolean(summary && summary.count > 0);

  return (
    <Link
      to={providerProfileHref(item)}
      className="relative flex h-[11.25rem] w-full overflow-hidden rounded-2xl border border-line bg-white"
    >
      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between px-5 py-5 pr-6">
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold leading-snug text-[color:var(--pp-primary-950)]">{item.name}</p>
          {meta ? <p className="mt-1 truncate text-sm text-ink-tertiary">{meta}</p> : null}
          {showFee ? (
            <p className="mt-1 text-sm text-ink-tertiary tnum">{formatFee(item.consultationFee)}</p>
          ) : null}
        </div>
        <span className="mt-auto pt-3 text-sm font-medium text-[color:var(--pp-violet)]">
          {tx("View profile")} →
        </span>
      </div>
      <div className="relative w-[44%] min-w-[7.5rem] shrink-0 self-stretch overflow-hidden">
        <img
          src={item.imageUrl}
          alt=""
          className={
            item.kind === "doctor"
              ? "absolute inset-0 h-full w-full object-cover object-[72%_22%]"
              : "absolute inset-0 h-full w-full object-cover object-center"
          }
        />
        <div
          className={
            item.kind === "doctor"
              ? "pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent"
              : "pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white via-white/80 to-transparent"
          }
        />
        {showRating && summary ? (
          <span
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[color:var(--pp-primary-950)] shadow-[0_1px_4px_rgba(24,7,48,0.08)] tnum"
            aria-label={`${summary.average.toFixed(1)} out of 5`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="shrink-0">
              <path d={STAR_PATH} fill="var(--pp-violet)" />
            </svg>
            {summary.average.toFixed(1)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
