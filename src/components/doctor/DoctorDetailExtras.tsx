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
import { ownerIdForListing } from "@/lib/businessProfile";
import {
  conditionHref,
  doctorConditions,
  doctorExperience,
  doctorFaqs,
  doctorPracticeCards,
  doctorServices,
  nmcNumberOf,
  providerProfileHref,
} from "@/lib/doctorProfileContent";

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
  return (
    <RecentArticlesSection
      ownerId={ownerId}
      lede="News, articles, and other verified publications from this doctor."
    />
  );
}

export function DoctorRelatedSection({ provider }: { provider: CareProvider }) {
  const { tx } = useI18n();
  const all = listProviders();
  const doctors = all
    .filter(
      (p) =>
        p.kind === "doctor" &&
        p.id !== provider.id &&
        p.specialties.some((s) => provider.specialties.includes(s)),
    )
    .slice(0, 3);
  const facilities = all
    .filter((p) => p.kind !== "doctor" && (p.city === provider.city || (provider.affiliatedFacilityIds ?? []).includes(p.id)))
    .slice(0, 3);

  if (!doctors.length && !facilities.length) return null;

  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Related doctors & healthcare facilities"
        lede="Similar clinicians and nearby facilities already listed on PocketPills."
      />
      {doctors.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <DoctorRelatedCard key={d.id} item={d} />
          ))}
        </div>
      ) : null}
      {facilities.length ? (
        <>
          <p className="mt-6 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
            {tx("Related hospitals & clinics")}
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f) => (
              <DoctorRelatedCard key={f.id} item={f} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

export function DoctorRelatedCard({
  item,
  rating,
}: {
  item: CareProvider;
  rating?: number | null;
}) {
  const { tx } = useI18n();
  const nmc = item.kind === "doctor" ? nmcNumberOf(item) : null;
  const degree = item.kind === "doctor" ? item.subtitle.split("·")[0]?.trim() : "";
  const meta =
    item.kind === "doctor"
      ? [degree, nmc ? `NMC #${nmc}` : null, item.city].filter(Boolean).join(" • ")
      : [tx(kindLabel(item.kind)), item.city].filter(Boolean).join(" • ");
  const showFee = item.kind === "doctor" && item.consultationFee > 0;
  const showRating = rating === undefined ? item.reviewCount > 0 : rating != null && rating > 0;
  const score = rating != null && rating > 0 ? rating : item.rating;

  return (
    <Link
      to={providerProfileHref(item)}
      className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3.5 transition-colors hover:bg-[color:var(--state-hover)]"
    >
      <img
        src={item.imageUrl}
        alt=""
        className="h-14 w-14 shrink-0 rounded-xl object-cover object-top"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate font-semibold text-[color:var(--pp-primary-950)]">{item.name}</span>
          {showRating ? (
            <span className="shrink-0 text-xs font-semibold text-[color:var(--pp-violet)] tnum">
              ★ {score.toFixed(1)}
            </span>
          ) : null}
        </span>
        {meta ? <span className="mt-0.5 block truncate text-xs text-ink-tertiary">{meta}</span> : null}
        {showFee ? (
          <span className="mt-1 block text-xs text-ink-tertiary tnum">{formatFee(item.consultationFee)}</span>
        ) : null}
        <span className="mt-2 inline-block text-xs font-medium text-[color:var(--pp-violet)]">
          {tx("View profile")} →
        </span>
      </span>
    </Link>
  );
}
