import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { DetailPageSkeleton, RatingChipSkeleton, useEnterSkeleton } from "@/components/ui";
import { DirectoryDetailLayout, DirectoryHeroCard, DIRECTORY_SIDEBAR_CARD } from "@/components/DirectoryDetailLayout";
import { RatingChip, ReviewCountChip } from "@/components/reviews/RatingChip";
import { ReviewsPanel } from "@/components/reviews/ReviewsPanel";
import { SpecialisedInSection } from "@/components/SpecialisedIn";
import {
  DoctorArticlesSection,
  DoctorFaqSection,
  DoctorHighlightsSection,
  DoctorPracticeSection,
  DoctorRelatedSection,
  DoctorSpecialisationsGrid,
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
import { addCalendarDays, isPastDate, isSlotInPast, monthLong, todayIso } from "@/lib/timeSlots";
import {
  defaultDoctorSpecialised,
  defaultFacilitySpecialised,
  sanitizeSpecialisedIn,
} from "@/lib/specialisedIn";
import type { ReviewSummary } from "@/lib/reviewsApi";
import {
  firstOpenSlot,
  formatDistance,
  formatFee,
  getAffiliatedFacilities,
  getFacilityStaff,
  getProvider,
  hasOpenSlot,
  isSpecialtyId,
  kindLabel,
  serviceKindLabel,
  slotsByVisitType,
  specialtyById,
  upcomingDays,
  SLOT_BANDS,
  type CareProvider,
  type DaySlots,
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

function monthTitle(iso: string) {
  return monthLong(iso).toUpperCase();
}

function DoctorAvailabilityBoard({
  provider,
  facilities,
  date,
  days,
  weekOffset,
  visitType,
  time,
  clinicId,
  onSelectDay,
  onSelectVisit,
  onSelectTime,
  onShiftWeek,
  onSelectClinic,
}: {
  provider: CareProvider;
  facilities: CareProvider[];
  date: string;
  days: { date: string; label: string; weekday: string }[];
  weekOffset: number;
  visitType: VisitType;
  time: string;
  clinicId: string;
  onSelectDay: (date: string) => void;
  onSelectVisit: (v: VisitType) => void;
  onSelectTime: (t: string) => void;
  onShiftWeek: (delta: number) => void;
  onSelectClinic: (id: string) => void;
}) {
  const { tx } = useI18n();
  const slots: DaySlots = useMemo(
    () => slotsByVisitType(provider.id, date, visitType),
    [provider.id, date, visitType],
  );
  const available = new Set([...slots.morning, ...slots.afternoon, ...slots.evening]);
  const clinicOptions =
    facilities.length > 0
      ? facilities.map((f) => ({
          id: f.id,
          label: f.city || f.name,
        }))
      : provider.city
        ? [{ id: "", label: provider.city }]
        : [];
  const showClinic = visitType === "clinic" && clinicOptions.length > 0;
  const dayLabel = (d: { label: string }) =>
    d.label === "Today" || d.label === "Tomorrow" ? tx(d.label) : d.label;

  return (
    <section id="availability" className="min-w-0 scroll-mt-28">
      <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Availability")}
      </h2>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        {provider.visitTypes.length ? (
          <div
            className="inline-flex rounded-full bg-[color:var(--pp-primary-200)] p-1"
            role="group"
            aria-label={tx("Visit type")}
          >
            {provider.visitTypes.includes("clinic") ? (
              <button
                type="button"
                onClick={() => onSelectVisit("clinic")}
                className={
                  "rounded-full px-5 py-2 text-sm font-medium transition-colors " +
                  (visitType === "clinic"
                    ? "bg-white text-[color:var(--pp-primary-950)] shadow-[0_1px_4px_rgba(24,7,48,0.08)] ring-1 ring-[color:var(--pp-primary-950)]"
                    : "text-ink-tertiary")
                }
              >
                {tx("In person")}
              </button>
            ) : null}
            {provider.visitTypes.includes("virtual") ? (
              <button
                type="button"
                onClick={() => onSelectVisit("virtual")}
                className={
                  "rounded-full px-5 py-2 text-sm font-medium transition-colors " +
                  (visitType === "virtual"
                    ? "bg-white text-[color:var(--pp-primary-950)] shadow-[0_1px_4px_rgba(24,7,48,0.08)] ring-1 ring-[color:var(--pp-primary-950)]"
                    : "text-ink-tertiary")
                }
              >
                {tx("Virtual")}
              </button>
            ) : null}
          </div>
        ) : (
          <span />
        )}

        {showClinic ? (
          clinicOptions.length > 1 ? (
            <label className="relative inline-flex min-w-[10rem] items-center">
              <span className="sr-only">{tx("Clinic address")}</span>
              <select
                value={clinicId}
                onChange={(e) => onSelectClinic(e.target.value)}
                className="h-10 appearance-none rounded-full border border-line bg-white py-2 pl-4 pr-9 text-sm font-medium text-[color:var(--pp-primary-950)] outline-none"
              >
                {clinicOptions.map((opt) => (
                  <option key={opt.id || opt.label} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-ink-tertiary">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </label>
          ) : (
            <span className="inline-flex h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-[color:var(--pp-primary-950)]">
              {clinicOptions[0]?.label || tx("Clinic address")}
            </span>
          )
        ) : null}
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)] p-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onShiftWeek(-7)}
            disabled={weekOffset <= 0}
            className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--pp-primary-950)] disabled:opacity-30"
            aria-label={tx("Previous week")}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M12.5 5 7.5 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="text-sm font-semibold tracking-[0.14em] text-[color:var(--pp-primary-950)]">
            {monthTitle(date || days[0]?.date || "")}
          </p>
          <button
            type="button"
            onClick={() => onShiftWeek(7)}
            className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--pp-primary-950)]"
            aria-label={tx("Next week")}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M7.5 5 12.5 10l-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div
          className="mt-4 grid grid-cols-7 gap-3"
          role="group"
          aria-label={tx("Choose a day")}
        >
          {days.map((d) => {
                const past = isPastDate(d.date);
                const on = d.date === date;
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={past}
                    onClick={() => {
                      if (!past) onSelectDay(d.date);
                    }}
                    className={
                      "min-w-0 rounded-2xl border bg-white px-1 py-3 text-center " +
                      (past
                        ? "cursor-default border-line text-[color:var(--text-disabled)]"
                        : on
                          ? "border-[color:var(--pp-primary-950)]"
                          : "border-transparent")
                    }
                  >
                    <span className={"block truncate text-2xs " + (past ? "text-[color:var(--text-disabled)]" : "text-ink-tertiary")}>
                      {d.weekday}
                    </span>
                    <span
                      className={
                        "mt-1 block truncate text-sm font-semibold " +
                        (past ? "text-[color:var(--text-disabled)]" : "text-[color:var(--pp-primary-950)]")
                      }
                    >
                      {dayLabel(d)}
                    </span>
                  </button>
                );
          })}
        </div>

        <div className="mt-5 space-y-4">
          {(
            [
              ["Morning", SLOT_BANDS.morning],
              ["Afternoon", SLOT_BANDS.afternoon],
              ["Evening", SLOT_BANDS.evening],
            ] as const
          ).map(([label, band]) => (
            <div key={label}>
              <p className="text-2xs font-medium text-ink-tertiary">{tx(label)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {band.map((t) => {
                  const open = available.has(t) && !isSlotInPast(date, t);
                  const on = time === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!open}
                      onClick={() => open && onSelectTime(t)}
                      className={
                        "rounded-full border bg-white px-3.5 py-2 text-sm tnum " +
                        (on
                          ? "border-[color:var(--pp-primary-950)] font-medium text-[color:var(--pp-primary-950)]"
                          : open
                            ? "border-line text-[color:var(--pp-primary-950)]"
                            : "cursor-default border-line text-[color:var(--text-disabled)]")
                      }
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function weekOffsetFor(iso: string): number {
  const today = todayIso();
  for (let w = 0; w < 8; w++) {
    for (let d = 0; d < 7; d++) {
      if (addCalendarDays(today, w * 7 + d) === iso) return w;
    }
  }
  return 0;
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

  const defaultVisit: VisitType = provider.visitTypes.includes("clinic")
    ? "clinic"
    : provider.visitTypes[0] ?? "clinic";
  const firstOpen = firstOpenSlot(provider.id, todayIso(), defaultVisit);
  const [weekOffset, setWeekOffset] = useState(() => (firstOpen ? weekOffsetFor(firstOpen.date) : 0));
  const days = useMemo(() => upcomingDays(7, weekOffset), [weekOffset]);
  const [date, setDate] = useState(() => firstOpen?.date ?? todayIso());
  const [visitType, setVisitType] = useState<VisitType>(defaultVisit);
  const [time, setTime] = useState("");
  const [clinicId, setClinicId] = useState(facilityId || facilities[0]?.id || "");
  const [holdEmpty, setHoldEmpty] = useState(false);
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setClock((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (isPastDate(date)) {
      setHoldEmpty(false);
      const next = firstOpenSlot(provider.id, todayIso(), visitType);
      setDate(next?.date ?? todayIso());
      setWeekOffset(next ? weekOffsetFor(next.date) : 0);
      setTime("");
      return;
    }
    if (time && isSlotInPast(date, time)) setTime("");
  }, [date, time, provider.id, visitType]);

  useEffect(() => {
    if (holdEmpty) return;
    if (hasOpenSlot(provider.id, date, visitType)) return;
    const next = firstOpenSlot(provider.id, date, visitType);
    if (!next || next.date === date) return;
    setDate(next.date);
    setWeekOffset(weekOffsetFor(next.date));
    setTime("");
  }, [clock, date, visitType, provider.id, holdEmpty]);

  const next =
    provider.nextAvailable === "Today" ||
    provider.nextAvailable === "Tomorrow" ||
    provider.nextAvailable === "In 2 days"
      ? tx(provider.nextAvailable)
      : provider.nextAvailable;

  const dayLabel = (d: { label: string }) =>
    d.label === "Today" || d.label === "Tomorrow" ? tx(d.label) : d.label;

  const selectDay = (d: string) => {
    if (isPastDate(d)) return;
    setDate(d);
    setTime("");
    setHoldEmpty(!hasOpenSlot(provider.id, d, visitType));
  };

  const selectVisit = (v: VisitType) => {
    setVisitType(v);
    setTime("");
    setHoldEmpty(false);
  };

  const shiftWeek = (delta: number) => {
    const nextOffset = Math.max(0, weekOffset + delta);
    setWeekOffset(nextOffset);
    setHoldEmpty(false);
    const nextDays = upcomingDays(7, nextOffset);
    const start = nextDays[0]?.date ?? todayIso();
    const next = firstOpenSlot(provider.id, start, visitType);
    setDate(next?.date ?? start);
    if (next) setWeekOffset(weekOffsetFor(next.date));
    setTime("");
  };

  const startBook = () => {
    if (!date || !time) return;
    if (isPastDate(date) || isSlotInPast(date, time)) return;
    nav(
      bookHref({
        providerId: provider.id,
        specialtyId: specialtyId ?? provider.specialties[0],
        facilityId: clinicId || facilityId,
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

  const bookingSidebar = sidebar ?? (
    <>
      <div className={DIRECTORY_SIDEBAR_CARD}>
        <p className="text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">{tx("Book visit")}</p>
        <p className="mt-2 text-sm leading-snug text-ink-tertiary">
          {time
            ? `${dayLabel(days.find((d) => d.date === date) ?? { label: date })} · ${time} · ${tx(visitType === "virtual" ? "Virtual" : "In person")}`
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
          <button
            type="button"
            onClick={() => nav("/messages")}
            className="w-full py-2 text-center text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-70"
          >
            {tx("Message care team")}
          </button>
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
      usps={[
        { label: tx("NMC verified") },
        { label: tx("Digital Prescription") },
        { label: tx("Free Followup") },
      ]}
      leadingBadges={
        reviewSummary == null ? (
          <RatingChipSkeleton variant="badge" />
        ) : reviewSummary.count ? (
          <RatingChip summary={reviewSummary} variant="badge" />
        ) : null
      }
      badges={badges}
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
      afterPage={<DoctorRelatedSection provider={provider} />}
    >
        <DoctorHighlightsSection provider={provider} facilities={facilities} />
        {!hideAvailability && (
          <DoctorAvailabilityBoard
            provider={provider}
            facilities={facilities}
            date={date}
            days={days}
            weekOffset={weekOffset}
            visitType={visitType}
            time={time}
            clinicId={clinicId}
            onSelectDay={selectDay}
            onSelectVisit={selectVisit}
            onSelectTime={setTime}
            onShiftWeek={shiftWeek}
            onSelectClinic={setClinicId}
          />
        )}
        <DoctorSpecialisationsGrid provider={provider} specialisedIn={specialisedIn} />
        {facilities.length ? (
          <DoctorPracticeSection
            provider={provider}
            facilities={facilities}
            specialtyId={specialtyId}
          />
        ) : null}
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
        <DoctorArticlesSection provider={provider} />
        <DoctorFaqSection provider={provider} specialisedIn={specialisedIn} />
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
    const next = firstOpenSlot(provider.id, todayIso(), "clinic");
    if (!next) return;
    nav(
      bookHref({
        providerId: provider.id,
        specialtyId: specialtyId ?? provider.specialties[0],
        serviceId: selected.id,
        date: next.date,
        time: next.time,
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
            imageUrl={provider.imageUrl}
            usps={
              provider.kind === "doctor"
                ? [
                    { label: tx("NMC verified") },
                    { label: tx("Digital Prescription") },
                    { label: tx("Free Followup") },
                  ]
                : [
                    { label: tx("Verified Doctors") },
                    { label: tx("Digital Prescription") },
                    { label: tx("Free Followup") },
                  ]
            }
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
