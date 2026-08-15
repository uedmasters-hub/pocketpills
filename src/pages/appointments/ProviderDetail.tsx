import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { DetailPageSkeleton, RatingChipSkeleton, useEnterSkeleton } from "@/components/ui";
import { DirectoryDetailLayout, DirectoryHeroCard, DIRECTORY_SIDEBAR_CARD } from "@/components/DirectoryDetailLayout";
import { RatingChip, ReviewCountChip } from "@/components/reviews/RatingChip";
import { ReviewsPanel } from "@/components/reviews/ReviewsPanel";
import { SpecialisedInSection } from "@/components/SpecialisedIn";
import {
  DoctorArticlesSection,
  DoctorConditionsSection,
  DoctorExperienceSection,
  DoctorFaqSection,
  DoctorPracticeSection,
  DoctorRelatedSection,
} from "@/components/doctor/DoctorDetailExtras";
import {
  ClinicAboutFacts,
  ClinicDoctorsSection,
  ClinicProfileAfterReviews,
  ClinicProfileMid,
  ClinicRelatedSection,
  ClinicTreatmentsSection,
} from "@/components/clinic/ClinicDetailExtras";
import {
  HospitalAboutFacts,
  HospitalDoctorsSection,
  HospitalProfileAfterReviews,
  HospitalProfileMid,
  HospitalRelatedSection,
} from "@/components/hospital/HospitalDetailExtras";
import { DirectorySidebarMap } from "@/components/MapEmbed";
import { CLINIC_REVIEW_TOPICS, clinicFromProvider, clinicMapsQuery } from "@/lib/clinicProfileContent";
import { DOCTOR_REVIEW_TOPICS } from "@/lib/doctorProfileContent";
import { HOSPITAL_REVIEW_TOPICS, hospitalFromProvider, hospitalMapsQuery } from "@/lib/hospitalProfileContent";
import { useI18n } from "@/lib/i18n";
import {
  defaultDoctorSpecialised,
  defaultFacilitySpecialised,
  sanitizeSpecialisedIn,
} from "@/lib/specialisedIn";
import type { ReviewSummary } from "@/lib/reviewsApi";
import {
  formatDistance,
  formatFee,
  getAffiliatedFacilities,
  getFacilityStaff,
  getProvider,
  isSpecialtyId,
  kindLabel,
  serviceKindLabel,
  slotsByVisitType,
  specialtyById,
  upcomingDays,
  type CareProvider,
  type FacilityService,
  type SpecialtyId,
  type VisitType,
} from "@/lib/appointments";

export function ProviderDetail() {
  const { id } = useParams();
  const provider = id ? getProvider(id) : undefined;

  if (!provider) {
    return (
      <NotFound />
    );
  }

  if (provider.kind === "doctor") return <DoctorDetailPage provider={provider} />;
  return <FacilityDetailPage provider={provider} />;
}

function NotFound() {
  const { tx } = useI18n();
  return (
    <div className="rounded-2xl border border-line bg-white p-12 text-center">
      <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Provider not found")}</p>
      <Link
        to="/appointments"
        className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
      >
        {tx("Back to appointments")}
      </Link>
    </div>
  );
}

function useSpecialtyFromQuery(): SpecialtyId | null {
  const [params] = useSearchParams();
  const raw = params.get("specialty") ?? params.get("reason");
  return isSpecialtyId(raw) ? raw : null;
}

function backToList(specialtyId: SpecialtyId | null) {
  return specialtyId
    ? `/appointments?specialty=${encodeURIComponent(specialtyId)}`
    : "/appointments";
}

function bookHref(opts: {
  providerId: string;
  specialtyId?: SpecialtyId | null;
  serviceId?: string;
  facilityId?: string;
  date?: string;
  time?: string;
  visitType?: string;
}) {
  const qs = new URLSearchParams({ provider: opts.providerId });
  if (opts.specialtyId) qs.set("reason", opts.specialtyId);
  if (opts.serviceId) qs.set("service", opts.serviceId);
  if (opts.facilityId) qs.set("facility", opts.facilityId);
  if (opts.date) qs.set("date", opts.date);
  if (opts.time) qs.set("time", opts.time);
  if (opts.visitType) qs.set("visit", opts.visitType);
  return `/appointments/book?${qs.toString()}`;
}

/* ═══════════════════════════════════════════════════════════
   Doctor — micro consultant site + sticky booking column
   ═══════════════════════════════════════════════════════════ */

function AvailabilitySlots({
  title,
  sub,
  slots,
  selected,
  active,
  onSelect,
}: {
  title: string;
  sub: string;
  slots: string[];
  selected: string;
  active: boolean;
  onSelect: (t: string) => void;
}) {
  return (
    <div
      className={
        "rounded-2xl border p-4 " +
        (active ? "border-[color:var(--pp-primary-950)] bg-white" : "border-line bg-white/80")
      }
    >
      <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{title}</p>
      <p className="mt-0.5 line-clamp-1 text-xs text-ink-tertiary">{sub}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {slots.map((t) => {
          const on = selected === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelect(t)}
              className={
                "rounded-full border px-3 py-1.5 text-sm font-medium tnum transition-colors " +
                (on
                  ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-950)] text-white"
                  : "border-line bg-white text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]")
              }
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DoctorDetailPage({ provider }: { provider: CareProvider }) {
  return <DoctorProfilePage provider={provider} />;
}

export function DoctorProfilePage({
  provider,
  backTo,
  backLabel,
  sidebar,
  hideAvailability,
  canWrite = true,
  owned = false,
}: {
  provider: CareProvider;
  backTo?: string;
  backLabel?: string;
  sidebar?: ReactNode;
  hideAvailability?: boolean;
  canWrite?: boolean;
  owned?: boolean;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const entering = useEnterSkeleton(provider.id);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const reviewSubjectId = provider.id.replace(/^nmc-/, "");
  const specialtyId = useSpecialtyFromQuery();
  const specialty = specialtyId ? specialtyById(specialtyId) : undefined;
  const [params] = useSearchParams();
  const facilityId = params.get("facility") || undefined;
  const facilities = getAffiliatedFacilities(provider.id);

  const fee =
    provider.consultationFee > 0
      ? provider.consultationFee
      : specialty?.feeFrom ?? 79;

  const days = useMemo(() => upcomingDays(7), []);
  const [date, setDate] = useState(days[0]?.date ?? "");
  const defaultVisit: VisitType =
    provider.visitTypes.includes("virtual") ? "virtual" : provider.visitTypes[0] ?? "clinic";
  const [visitType, setVisitType] = useState<VisitType>(defaultVisit);
  const [time, setTime] = useState("");

  const virtualSlots = useMemo(
    () =>
      provider.visitTypes.includes("virtual")
        ? slotsByVisitType(provider.id, date, "virtual")
        : { morning: [], afternoon: [] },
    [provider.id, provider.visitTypes, date],
  );
  const clinicSlots = useMemo(
    () =>
      provider.visitTypes.includes("clinic")
        ? slotsByVisitType(provider.id, date, "clinic")
        : { morning: [], afternoon: [] },
    [provider.id, provider.visitTypes, date],
  );

  const activeSlots = visitType === "virtual" ? virtualSlots : clinicSlots;
  const activeList = [...activeSlots.morning, ...activeSlots.afternoon];

  const next =
    provider.nextAvailable === "Today" ||
    provider.nextAvailable === "Tomorrow" ||
    provider.nextAvailable === "In 2 days"
      ? tx(provider.nextAvailable)
      : provider.nextAvailable;

  const dayLabel = (d: { label: string }) =>
    d.label === "Today" || d.label === "Tomorrow" ? tx(d.label) : d.label;

  const selectDay = (d: string) => {
    setDate(d);
    setTime("");
  };

  const selectVisit = (v: VisitType) => {
    setVisitType(v);
    setTime("");
  };

  const startBook = () => {
    if (!date || !time) return;
    nav(
      bookHref({
        providerId: provider.id,
        specialtyId: specialtyId ?? provider.specialties[0],
        facilityId,
        date,
        time,
        visitType,
      }),
    );
  };

  const backHref = backTo
    ? backTo
    : facilityId
      ? `/appointments/provider/${facilityId}${specialtyId ? `?specialty=${specialtyId}` : ""}`
      : backToList(specialtyId);
  const backText = backLabel
    ? backLabel
    : facilityId
      ? tx("Back to facility")
      : specialty
        ? tx(specialty.label)
        : tx("Book an appointment");

  const badges = [
    { label: tx("NMC registry"), strong: true },
    !hideAvailability ? { label: `${tx("Next")}: ${next}` } : null,
  ].filter(Boolean) as { label: string; strong?: boolean }[];

  const extras = [
    provider.focusAreas?.length
      ? { title: tx("Focus areas"), items: provider.focusAreas.map((a) => tx(a)), check: true }
      : null,
    provider.education?.length
      ? { title: tx("Education"), items: provider.education.map((e) => tx(e)) }
      : null,
  ].filter(Boolean) as { title: string; items: string[]; check?: boolean }[];

  const specialisedIn = (() => {
    const stored = sanitizeSpecialisedIn(provider.specialisedIn);
    return stored.length
      ? stored
      : defaultDoctorSpecialised({
          degree: provider.subtitle,
          subtitle: provider.subtitle,
          specialties: provider.specialties,
        });
  })();

  const details = [
    provider.id.startsWith("nmc-")
      ? { k: tx("NMC number"), v: `#${provider.id.replace(/^nmc-/, "")}` }
      : null,
    provider.address ? { k: tx("Location"), v: provider.address } : null,
    provider.hours ? { k: tx("Hours"), v: provider.hours } : null,
    provider.phone ? { k: tx("Phone"), v: provider.phone } : null,
    { k: tx("Languages"), v: provider.languages.map((l) => tx(l)).join(", ") },
    {
      k: tx("Specialisations"),
      v: provider.specialties.map((s) => tx(specialtyById(s)?.label || s)).join(", "),
    },
  ].filter(Boolean) as { k: string; v: string }[];

  const bookingSidebar = sidebar ?? (
    <>
      <div className={DIRECTORY_SIDEBAR_CARD}>
        <p className="text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">{tx("Book visit")}</p>
        <p className="mt-2 text-sm leading-snug text-ink-tertiary">
          {time
            ? `${dayLabel(days.find((d) => d.date === date) ?? { label: date })} · ${time} · ${tx(visitType === "virtual" ? "Virtual" : "In-clinic")}`
            : tx("Select a date and time below")}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
          <span>
            <span className="block text-2xs text-ink-tertiary">{tx("Consultation")}</span>
            <span className="font-display text-2xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
              {formatFee(fee)}
            </span>
          </span>
          <span className="inline-flex h-7 items-center rounded-full bg-wellness-subtle px-3 text-xs font-semibold leading-none text-wellness">
            {next}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <Button fullWidth size="sm" onClick={startBook} disabled={!date || !time}>
            {tx("Book appointment")}
          </Button>
          <Button fullWidth size="sm" variant="secondary" onClick={() => nav("/messages")}>
            {tx("Message care team")}
          </Button>
        </div>
      </div>
      <p className="px-1 text-center text-2xs leading-relaxed text-ink-tertiary">
        {tx("Demo booking — no real visit is scheduled with a clinic.")}
      </p>
    </>
  );

  if (entering) return <DetailPageSkeleton label={tx("Loading profile")} />;

  return (
    <DirectoryDetailLayout
      backTo={backHref}
      backLabel={backText}
      eyebrow={tx("Doctor")}
      name={provider.name}
      subtitle={tx(provider.subtitle)}
      bio={tx(provider.bio)}
      about={tx(provider.about || provider.bio)}
      imageUrl={provider.imageUrl}
      leadingBadges={
        reviewSummary == null ? (
          <RatingChipSkeleton variant="badge" />
        ) : reviewSummary.count ? (
          <RatingChip summary={reviewSummary} variant="badge" />
        ) : null
      }
      badges={badges}
      extras={extras}
      details={details}
      sidebar={
        <>
          {bookingSidebar}
          <DirectorySidebarMap
            query={[provider.name, provider.address, provider.city].filter(Boolean).join(", ")}
          />
        </>
      }
      reviews={
        canWrite || owned ? (
          <ReviewsPanel
            kind="doctor"
            subjectId={reviewSubjectId}
            listingName={provider.name}
            canWrite={canWrite}
            owned={owned}
            onSummary={setReviewSummary}
            topics={[...DOCTOR_REVIEW_TOPICS]}
          />
        ) : undefined
      }
      afterReviews={<DoctorRelatedSection provider={provider} />}
    >
        <SpecialisedInSection groups={specialisedIn} variant="doctor" />
        <DoctorConditionsSection provider={provider} specialisedIn={specialisedIn} />
        {!hideAvailability && (
        <section id="availability" className="min-w-0 scroll-mt-28">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("Availability")}
          </h2>
          <p className="mt-1 text-sm text-ink-tertiary">
            {tx("Choose a day, visit type, and time — then continue to patient details.")}
          </p>

          <div className="pp-scroll mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={tx("Choose a day")}>
            {days.map((d) => {
              const on = d.date === date;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => selectDay(d.date)}
                  className={
                    "shrink-0 rounded-2xl border px-3 py-2 text-center transition-colors " +
                    (on
                      ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)]"
                      : "border-line bg-white hover:bg-[color:var(--state-hover)]")
                  }
                >
                  <span className="block text-2xs text-ink-tertiary">{d.weekday}</span>
                  <span className="mt-0.5 block text-sm font-semibold text-[color:var(--pp-primary-950)]">
                    {dayLabel(d)}
                  </span>
                </button>
              );
            })}
          </div>

          {provider.visitTypes.length > 1 && (
            <div className="mt-4 flex gap-2" role="group" aria-label={tx("Visit type")}>
              {provider.visitTypes.includes("virtual") && (
                <button
                  type="button"
                  onClick={() => selectVisit("virtual")}
                  className={
                    "flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors " +
                    (visitType === "virtual"
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
                  }
                >
                  {tx("Virtual")}
                </button>
              )}
              {provider.visitTypes.includes("clinic") && (
                <button
                  type="button"
                  onClick={() => selectVisit("clinic")}
                  className={
                    "flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors " +
                    (visitType === "clinic"
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
                  }
                >
                  {tx("In-clinic")}
                </button>
              )}
            </div>
          )}

          {/* Show both visit-type grids when both available */}
          {provider.visitTypes.includes("virtual") && provider.visitTypes.includes("clinic") ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <AvailabilitySlots
                title={tx("Virtual visit")}
                sub={tx("Secure video from home")}
                slots={[...virtualSlots.morning, ...virtualSlots.afternoon]}
                selected={visitType === "virtual" ? time : ""}
                active={visitType === "virtual"}
                onSelect={(t) => {
                  setVisitType("virtual");
                  setTime(t);
                }}
              />
              <AvailabilitySlots
                title={tx("In-clinic visit")}
                sub={provider.address || tx("See a clinician in person")}
                slots={[...clinicSlots.morning, ...clinicSlots.afternoon]}
                selected={visitType === "clinic" ? time : ""}
                active={visitType === "clinic"}
                onSelect={(t) => {
                  setVisitType("clinic");
                  setTime(t);
                }}
              />
            </div>
          ) : (
            <div className="mt-5">
              <AvailabilitySlots
                title={tx(visitType === "virtual" ? "Virtual visit" : "In-clinic visit")}
                sub={
                  visitType === "virtual"
                    ? tx("Secure video from home")
                    : provider.address || tx("See a clinician in person")
                }
                slots={activeList}
                selected={time}
                active
                onSelect={setTime}
              />
            </div>
          )}
        </section>
        )}
        <DoctorExperienceSection provider={provider} />
        {provider.awards?.length ? (
          <section className="min-w-0 scroll-mt-28">
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Awards & achievements")}
            </h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              {tx("Verified recognitions listed on this profile.")}
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
              {provider.awards.map((a, i) => (
                <div
                  key={a.title + a.year}
                  className={"px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}
                >
                  <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(a.title)}</p>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    {a.org}
                    <span className="text-ink-tertiary"> · {a.year}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <DoctorPracticeSection
          provider={provider}
          facilities={facilities}
          specialtyId={specialtyId}
        />
        <DoctorFaqSection provider={provider} specialisedIn={specialisedIn} />
        <DoctorArticlesSection provider={provider} />
    </DirectoryDetailLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   Clinic / Hospital — micro site; booking column after service
   ═══════════════════════════════════════════════════════════ */

function FacilityDetailPage({ provider }: { provider: CareProvider }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const specialtyId = useSpecialtyFromQuery();
  const specialty = specialtyId ? specialtyById(specialtyId) : undefined;
  const staff = getFacilityStaff(provider.id);
  const services = provider.services ?? [];
  const specialisedIn = (() => {
    const stored = sanitizeSpecialisedIn(provider.specialisedIn);
    return stored.length
      ? stored
      : defaultFacilitySpecialised({
          name: provider.name,
          subtitle: provider.subtitle,
          specialties: provider.specialties,
          breadth: provider.kind === "clinic" ? "clinic" : "hospital",
        });
  })();
  const hospital = hospitalFromProvider(provider, staff, specialisedIn);
  const clinic = clinicFromProvider(provider, staff, specialisedIn);
  const isClinic = provider.kind === "clinic";
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const selected = services.find((s) => s.id === selectedServiceId) ?? null;

  const selectService = (s: FacilityService) => {
    setSelectedServiceId((cur) => (cur === s.id ? null : s.id));
  };

  const bookFacilityService = () => {
    if (!selected) return;
    if (selected.kind === "consult") {
      /* Scroll to consultants — booking happens after doctor pick */
      document.getElementById(isClinic ? "clinic-doctors" : "hospital-doctors")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const day = upcomingDays(1)[0]?.date ?? "";
    const slots = slotsByVisitType(provider.id, day, "clinic");
    const first = [...slots.morning, ...slots.afternoon][0] ?? "10:00 AM";
    nav(
      bookHref({
        providerId: provider.id,
        specialtyId: specialtyId ?? provider.specialties[0],
        serviceId: selected.id,
        date: day,
        time: first,
        visitType: "clinic",
      }),
    );
  };

  return (
    <div>
      <Link
        to={backToList(specialtyId)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {specialty ? tx(specialty.label) : tx("Book an appointment")}
      </Link>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <DirectoryHeroCard
            eyebrow={tx(kindLabel(provider.kind))}
            name={provider.name}
            subtitle={tx(provider.subtitle)}
            bio={tx(provider.bio)}
            imageUrl={provider.imageUrl}
            leadingBadges={
              <ReviewCountChip average={provider.rating} count={provider.reviewCount} />
            }
            badges={[
              provider.distanceKm > 0
                ? { label: `${formatDistance(provider.distanceKm)} ${tx("away")}` }
                : null,
              provider.hours ? { label: tx(provider.hours) } : null,
            ].filter(Boolean) as { label: string }[]}
          />
        </div>

        <aside className="space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-28 lg:self-start">
          {selected ? (
            <div className={DIRECTORY_SIDEBAR_CARD}>
              <p className="text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">{tx("Book service")}</p>
              <p className="mt-2 text-sm leading-snug text-ink-tertiary">{tx(selected.label)}</p>

              <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
                <span>
                  <span className="block text-2xs text-ink-tertiary">
                    {selected.feeFrom === 0 ? tx("Coverage") : tx("From")}
                  </span>
                  <span className="font-display text-2xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                    {formatFee(selected.feeFrom)}
                  </span>
                </span>
                <span className="inline-flex h-7 items-center rounded-full bg-[color:var(--pp-primary-100)] px-3 text-xs font-semibold leading-none text-[color:var(--pp-primary-950)]">
                  {tx(serviceKindLabel(selected.kind))}
                </span>
              </div>

              <p className="mt-3 text-sm leading-snug text-ink-secondary">{tx(selected.blurb)}</p>

              <div className="mt-4 space-y-2">
                {selected.kind === "consult" ? (
                  <>
                    <Button fullWidth size="sm" onClick={bookFacilityService}>
                      {tx("Choose a consultant")}
                    </Button>
                    <p className="text-center text-2xs text-ink-tertiary">
                      {tx("Pick a doctor below to open their booking page.")}
                    </p>
                  </>
                ) : (
                  <Button fullWidth size="sm" onClick={bookFacilityService}>
                    {tx("Book appointment")}
                  </Button>
                )}
                <Button fullWidth size="sm" variant="ghost" onClick={() => setSelectedServiceId(null)}>
                  {tx("Change service")}
                </Button>
              </div>
            </div>
          ) : null}
          <DirectorySidebarMap
            query={isClinic ? clinicMapsQuery(clinic) : hospitalMapsQuery(hospital)}
          />
        </aside>

        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-2">
        <section>
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("About")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
            {tx(provider.about || provider.bio)}
          </p>
          {isClinic ? <ClinicAboutFacts clinic={clinic} /> : <HospitalAboutFacts hospital={hospital} />}
          {(provider.address || provider.phone) && (
            <dl className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
              {provider.address && (
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <dt className="text-sm text-ink-tertiary">{tx("Location")}</dt>
                  <dd className="max-w-[60%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">
                    {provider.address}
                  </dd>
                </div>
              )}
              {provider.phone && (
                <div className="flex justify-between gap-4 border-t border-line px-5 py-3.5">
                  <dt className="text-sm text-ink-tertiary">{tx("Phone")}</dt>
                  <dd className="text-sm font-medium text-[color:var(--pp-primary-950)]">{provider.phone}</dd>
                </div>
              )}
              {provider.hours && (
                <div className="flex justify-between gap-4 border-t border-line px-5 py-3.5">
                  <dt className="text-sm text-ink-tertiary">{tx("Hours")}</dt>
                  <dd className="max-w-[60%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">
                    {tx(provider.hours)}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </section>

          <SpecialisedInSection groups={specialisedIn} variant="facility" staff={staff} />

          <section className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                {tx("Services")}
              </h2>
              {!selected && (
                <p className="text-sm text-ink-tertiary">{tx("Select a service to book")}</p>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((s) => {
                const on = selected?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectService(s)}
                    aria-pressed={on}
                    className={
                      "rounded-2xl border p-4 text-left transition-colors " +
                      (on
                        ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)]"
                        : "border-line bg-white hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                          {tx(serviceKindLabel(s.kind))}
                        </span>
                        <span className="mt-1 block font-semibold text-[color:var(--pp-primary-950)]">
                          {tx(s.label)}
                        </span>
                        <span className="mt-1 block text-sm text-ink-secondary">{tx(s.blurb)}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-[color:var(--pp-primary-950)] tnum">
                        {formatFee(s.feeFrom)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {isClinic ? <ClinicTreatmentsSection clinic={clinic} /> : null}

          {staff.length ? (
            isClinic ? (
              <ClinicDoctorsSection clinic={clinic} />
            ) : (
              <HospitalDoctorsSection hospital={hospital} />
            )
          ) : (
            <section
              id={isClinic ? "clinic-doctors" : "hospital-doctors"}
              className="min-w-0 scroll-mt-28"
            >
              <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                {tx(isClinic ? "Doctors & practitioners" : "Doctors & specialists")}
              </h2>
              <p className="mt-1 text-sm text-ink-tertiary">
                {tx("Doctors and clinicians practicing at this {kind}.")
                  .replace("{kind}", tx(kindLabel(provider.kind)).toLowerCase())}
              </p>
              <p className="mt-4 rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-ink-tertiary">
                {tx("No consultants listed yet.")}
              </p>
            </section>
          )}

          {isClinic ? (
            <ClinicProfileMid clinic={clinic} includeDoctors={false} />
          ) : (
            <HospitalProfileMid hospital={hospital} includeDoctors={false} />
          )}

          <ReviewsPanel
            kind="facility"
            subjectId={provider.id.startsWith("hf-") ? provider.id.replace(/^hf-/, "") : provider.id}
            listingName={provider.name}
            topics={[...(isClinic ? CLINIC_REVIEW_TOPICS : HOSPITAL_REVIEW_TOPICS)]}
          />

          {isClinic ? (
            <>
              <ClinicProfileAfterReviews clinic={clinic} />
              <ClinicRelatedSection clinic={clinic} />
            </>
          ) : (
            <>
              <HospitalProfileAfterReviews hospital={hospital} />
              <HospitalRelatedSection hospital={hospital} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
