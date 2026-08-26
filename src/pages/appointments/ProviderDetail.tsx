import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AvailabilityBoard, AvailabilityLocationSelect } from "@/components/appointments/AvailabilityBoard";
import { useAvailabilityPicker } from "@/components/appointments/useAvailabilityPicker";
import { DetailSection } from "@/components/DetailSection";
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
  HospitalProfileAfterReviews,
  HospitalProfileMid,
  HospitalRelatedSection,
} from "@/components/hospital/HospitalDetailExtras";
import { DirectorySidebarMap } from "@/components/MapEmbed";
import { CLINIC_REVIEW_TOPICS, clinicFromProvider, clinicMapsQuery } from "@/lib/clinicProfileContent";
import { DOCTOR_REVIEW_TOPICS } from "@/lib/doctorProfileContent";
import { HOSPITAL_REVIEW_TOPICS, hospitalFromProvider, hospitalMapsQuery } from "@/lib/hospitalProfileContent";
import { resolveAvailabilityBranch } from "@/lib/availabilityLocations";
import { FACILITY_HERO_USPS, facilityRegistrySubtitle } from "@/lib/facilityDirectory";
import { useI18n } from "@/lib/i18n";
import { useShellColumn } from "@/lib/columnHover";
import { isPastDate, isSlotInPast } from "@/lib/timeSlots";
import {
  defaultDoctorSpecialised,
  defaultFacilitySpecialised,
  sanitizeSpecialisedIn,
} from "@/lib/specialisedIn";
import { ListingCustomSections } from "@/components/ListingCustomSections";
import { listingForHub, listingShows } from "@/lib/listingOverlay";
import type { ReviewSummary } from "@/lib/reviewsApi";
import {
  facilityCatalogue,
  facilityServiceHref,
  facilityServicesHref,
  formatFee,
  getAffiliatedFacilities,
  getFacilityStaff,
  getHostFacility,
  getProvider,
  isSpecialtyId,
  kindLabel,
  serviceKindLabel,
  specialtyById,
  type CareProvider,
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
  const host = getHostFacility(facilityId);
  const inFacilityFlow = Boolean(host);
  const facilities = getAffiliatedFacilities(provider.id);

  const fee =
    provider.consultationFee > 0
      ? provider.consultationFee
      : specialty?.feeFrom ?? 79;

  const defaultVisit: VisitType = provider.visitTypes.includes("clinic")
    ? "clinic"
    : provider.visitTypes[0] ?? "clinic";
  const [visitType, setVisitType] = useState<VisitType>(defaultVisit);
  const avail = useAvailabilityPicker(provider.id, visitType);
  const { date, time, days, weekOffset, slots, selectDay, selectTime, shiftWeek } = avail;
  const [clinicId, setClinicId] = useState(host?.id || facilityId || facilities[0]?.id || "");

  const next =
    provider.nextAvailable === "Today" ||
    provider.nextAvailable === "Tomorrow" ||
    provider.nextAvailable === "In 2 days"
      ? tx(provider.nextAvailable)
      : provider.nextAvailable;

  const dayLabel = (d: { label: string }) =>
    d.label === "Today" || d.label === "Tomorrow" ? tx(d.label) : d.label;

  const visitOptions = (
    [
      provider.visitTypes.includes("clinic") ? { id: "clinic" as const, label: tx("In person") } : null,
      provider.visitTypes.includes("virtual") ? { id: "virtual" as const, label: tx("Virtual") } : null,
    ] as const
  ).filter((x): x is { id: VisitType; label: string } => !!x);

  const clinicOptions =
    inFacilityFlow && host
      ? [
          {
            id: host.id,
            label: resolveAvailabilityBranch(host.id)?.label || host.name || host.city || tx("Clinic"),
          },
        ]
      : facilities.length > 0
        ? facilities.map((f) => ({
            id: f.id,
            label: resolveAvailabilityBranch(f.id)?.label || f.name || f.city || f.id,
          }))
        : provider.city
          ? [{ id: "", label: provider.city }]
          : [];
  const showClinic = visitType === "clinic" && clinicOptions.length > 0;

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
    : host
      ? facilityServicesHref(host.id)
      : backToList(specialtyId);
  const backText = backLabel
    ? backLabel
    : host
      ? tx("Back")
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
      eyebrow={host ? host.name : tx("Doctor")}
      name={provider.name}
      subtitle={tx(provider.subtitle)}
      bio={tx(provider.bio)}
      about={tx(provider.about || provider.bio)}
      imageUrl={provider.imageUrl}
      usps={
        host
          ? [
              { label: tx("Consultant") },
              { label: tx("Digital Prescription") },
              { label: tx("Free Followup") },
            ]
          : [
              { label: tx("NMC verified") },
              { label: tx("Digital Prescription") },
              { label: tx("Free Followup") },
            ]
      }
      leadingBadges={
        inFacilityFlow ? (
          provider.reviewCount ? (
            <ReviewCountChip average={provider.rating} count={provider.reviewCount} />
          ) : null
        ) : reviewSummary == null ? (
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
            query={
              host
                ? [host.name, host.address, host.city].filter(Boolean).join(", ")
                : [provider.name, provider.address, provider.city].filter(Boolean).join(", ")
            }
          />
        </>
      }
      reviews={
        inFacilityFlow ? undefined : canWrite || owned ? (
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
      afterPage={inFacilityFlow ? null : <DoctorRelatedSection provider={provider} />}
    >
        <DoctorHighlightsSection provider={provider} facilities={facilities} />
        {!hideAvailability && (
          <AvailabilityBoard
            visitOptions={visitOptions}
            visitType={visitType}
            onSelectVisit={(id) => setVisitType(id as VisitType)}
            location={
              showClinic ? (
                <AvailabilityLocationSelect
                  options={clinicOptions}
                  value={clinicId}
                  onChange={setClinicId}
                />
              ) : null
            }
            date={date}
            days={days}
            weekOffset={weekOffset}
            time={time}
            slots={slots}
            onSelectDay={selectDay}
            onSelectTime={selectTime}
            onShiftWeek={shiftWeek}
          />
        )}
        {listingShows(provider.id, "specialised") ? (
          <DoctorSpecialisationsGrid provider={provider} specialisedIn={specialisedIn} />
        ) : null}
        {facilities.length && !inFacilityFlow ? (
          <DoctorPracticeSection
            provider={provider}
            facilities={facilities}
            specialtyId={specialtyId}
          />
        ) : null}
        {provider.awards?.length && !inFacilityFlow && listingShows(provider.id, "awards") ? (
          <DetailSection
            title={tx("Awards & achievements")}
            lede={tx("Verified recognitions listed on this profile.")}
            flush
          >
            <div>
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
          </DetailSection>
        ) : null}
        {inFacilityFlow ? null : <DoctorArticlesSection provider={provider} />}
        <DoctorFaqSection provider={provider} specialisedIn={specialisedIn} />
        <ListingCustomSections
          sections={listingForHub(provider.id)?.pageSections}
          fallbackQuery={[provider.address, provider.city, provider.name].filter(Boolean).join(", ")}
        />
    </DirectoryDetailLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   Clinic / Hospital — micro site; booking column after service
   ═══════════════════════════════════════════════════════════ */

function FacilityDetailPage({ provider }: { provider: CareProvider }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const mainCol = useShellColumn("main");
  const railCol = useShellColumn("rail");
  const specialtyId = useSpecialtyFromQuery();
  const specialty = specialtyId ? specialtyById(specialtyId) : undefined;
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const staff = getFacilityStaff(provider.id);
  const services = facilityCatalogue(provider);
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
  const hfCode = (isClinic ? clinic.registrationNo : hospital.registrationNo)?.trim();
  const fromFee = services.length
    ? Math.min(...services.map((s) => s.feeFrom))
    : provider.consultationFee || 0;
  const next =
    provider.nextAvailable === "Today" ||
    provider.nextAvailable === "Tomorrow" ||
    provider.nextAvailable === "In 2 days"
      ? tx(provider.nextAvailable)
      : provider.nextAvailable;
  const kindLabelText = tx(kindLabel(provider.kind));

  return (
    <div>
      <Link
        to={backToList(specialtyId)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {specialty ? tx(specialty.label) : tx("Book an appointment")}
      </Link>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div
          className={"min-w-0 lg:col-start-1 lg:row-start-1 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <DirectoryHeroCard
            eyebrow={kindLabelText}
            name={provider.name}
            subtitle={facilityRegistrySubtitle(provider.subtitle, kindLabelText, hfCode)}
            imageUrl={provider.imageUrl}
            usps={FACILITY_HERO_USPS.map((label) => ({ label: tx(label) }))}
            leadingBadges={
              reviewSummary == null ? (
                <RatingChipSkeleton variant="badge" />
              ) : reviewSummary.count ? (
                <RatingChip summary={reviewSummary} variant="badge" />
              ) : null
            }
            badges={[
              hfCode ? { label: tx("Health facility registry"), strong: true } : null,
              next ? { label: `${tx("Next")}: ${next}` } : null,
            ].filter(Boolean) as { label: string }[]}
          />
        </div>

        <aside
          className={
            "space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-28 lg:self-start " +
            railCol.className
          }
          onMouseEnter={railCol.onMouseEnter}
        >
          <div className={DIRECTORY_SIDEBAR_CARD}>
            {provider.hours ? (
              <>
                <p className="text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">
                  {tx("Working hours")}
                </p>
                <p className="mt-2 text-sm leading-snug text-ink-secondary">{tx(provider.hours)}</p>
              </>
            ) : (
              <p className="text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">
                {tx("Book visit")}
              </p>
            )}
            <p className="mt-3 text-sm leading-snug text-ink-tertiary">
              {tx("Choose a service — consultants, diagnostic services, pharmacy, rehab, and more.")}
            </p>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
              <span>
                <span className="block text-2xs text-ink-tertiary">{tx("From")}</span>
                <span className="font-display text-2xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                  {formatFee(fromFee)}
                </span>
              </span>
              {next ? (
                <span className="inline-flex h-7 items-center rounded-full bg-wellness-subtle px-3 text-xs font-semibold leading-none text-wellness">
                  {next}
                </span>
              ) : null}
            </div>
            <div className="mt-4 space-y-2">
              {provider.phone ? (
                <Button
                  fullWidth
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    window.location.href = `tel:${provider.phone}`;
                  }}
                >
                  {tx("Call")}
                </Button>
              ) : null}
              <Button fullWidth size="sm" onClick={() => nav(facilityServicesHref(provider.id))}>
                {tx("Book appointment")}
              </Button>
            </div>
          </div>
          <DirectorySidebarMap
            query={isClinic ? clinicMapsQuery(clinic) : hospitalMapsQuery(hospital)}
          />
        </aside>

        <div
          className={"min-w-0 space-y-10 lg:col-start-1 lg:row-start-2 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
        <DetailSection title={tx("About")}>
          <p className="text-sm leading-relaxed text-ink-secondary">
            {tx(provider.about || provider.bio)}
          </p>
          {isClinic ? <ClinicAboutFacts clinic={clinic} /> : <HospitalAboutFacts hospital={hospital} />}
          {(hfCode || provider.address || provider.phone || provider.hours) && (
            <dl className="mt-4 overflow-hidden rounded-xl border border-line bg-[color:var(--pp-primary-100)]">
              {hfCode ? (
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <dt className="text-sm text-ink-tertiary">{tx("Facility code")}</dt>
                  <dd className="text-sm font-medium text-[color:var(--pp-primary-950)] tnum">#{hfCode}</dd>
                </div>
              ) : null}
              {provider.subtitle ? (
                <div className={"flex justify-between gap-4 px-5 py-3.5" + (hfCode ? " border-t border-line" : "")}>
                  <dt className="text-sm text-ink-tertiary">{tx("Type")}</dt>
                  <dd className="max-w-[60%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">
                    {tx(provider.subtitle)}
                  </dd>
                </div>
              ) : null}
              {provider.address && (
                <div className="flex justify-between gap-4 border-t border-line px-5 py-3.5">
                  <dt className="text-sm text-ink-tertiary">{tx("Location")}</dt>
                  <dd className="max-w-[60%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">
                    {provider.address}
                  </dd>
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
              {provider.phone && (
                <div className="flex justify-between gap-4 border-t border-line px-5 py-3.5">
                  <dt className="text-sm text-ink-tertiary">{tx("Phone")}</dt>
                  <dd className="text-sm font-medium text-[color:var(--pp-primary-950)]">{provider.phone}</dd>
                </div>
              )}
            </dl>
          )}
        </DetailSection>

          {isClinic ? (
            <>
              <SpecialisedInSection groups={specialisedIn} variant="facility" staff={staff} />
              <DetailSection
                title={tx("Services")}
                meta={
                  <button
                    type="button"
                    onClick={() => nav(facilityServicesHref(provider.id))}
                    className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
                  >
                    {tx("Book a service")}
                  </button>
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <Link
                      key={s.id}
                      to={facilityServiceHref(provider.id, s.id)}
                      className="rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-4 text-left transition-colors hover:bg-[color:var(--state-hover)]"
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
                    </Link>
                  ))}
                </div>
              </DetailSection>
              <ClinicTreatmentsSection clinic={clinic} />
              {clinic.hasListing ? null : staff.length ? (
                <ClinicDoctorsSection clinic={clinic} listedOnly />
              ) : (
                <DetailSection
                  id="clinic-doctors"
                  title={tx("Our doctors")}
                  lede={tx("Doctors and clinicians practicing at this {kind}.").replace(
                    "{kind}",
                    tx(kindLabel(provider.kind)).toLowerCase(),
                  )}
                >
                  <p className="rounded-xl border border-dashed border-line bg-[color:var(--pp-primary-100)] px-5 py-8 text-center text-sm text-ink-tertiary">
                    {tx("No consultants listed yet.")}
                  </p>
                </DetailSection>
              )}
              <ClinicProfileMid clinic={clinic} includeDoctors={!!clinic.hasListing} />
            </>
          ) : (
            <HospitalProfileMid hospital={hospital} />
          )}

          <ReviewsPanel
            kind="facility"
            subjectId={provider.id.startsWith("hf-") ? provider.id.replace(/^hf-/, "") : provider.id}
            listingName={provider.name}
            onSummary={setReviewSummary}
            topics={[...(isClinic ? CLINIC_REVIEW_TOPICS : HOSPITAL_REVIEW_TOPICS)]}
          />

          {isClinic ? (
            <ClinicProfileAfterReviews clinic={clinic} />
          ) : (
            <HospitalProfileAfterReviews hospital={hospital} />
          )}
        </div>
      </div>

      <div className="mt-10">
        {isClinic ? (
          <ClinicRelatedSection clinic={clinic} />
        ) : (
          <HospitalRelatedSection hospital={hospital} />
        )}
      </div>
    </div>
  );
}
