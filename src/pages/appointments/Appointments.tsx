import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PageSearchField } from "@/components/PageSearchField";
import { type Treatment } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import {
  appointmentIsPast,
  filterProviders,
  formatDistance,
  formatFee,
  getAppointments,
  getProvider,
  isSpecialtyId,
  kindLabel,
  specialtyById,
  updateAppointmentStatus,
  type Appointment,
  type CareProvider,
  type ProviderKind,
  type Specialty,
  type SpecialtyId,
} from "@/lib/appointments";
import {
  careWorkerBookingIsPast,
  careWorkerKindLabel,
  getCareWorkerBookings,
  searchCareWorkers,
  updateCareWorkerBookingStatus,
  type CareWorker,
  type CareWorkerBooking,
} from "@/lib/careWorkers";
import {
  getLabBookings,
  labBookingIsPast,
  searchLabs,
  updateLabBookingStatus,
  type LabBooking,
  type LabCentre,
} from "@/lib/labs";
import { cancelOrder } from "@/lib/orders";
import {
  getServiceRequests,
  healthServiceCategoryLabel,
  searchHealthServices,
  updateServiceRequestStatus,
  type HealthService,
  type ServiceRequest,
} from "@/lib/healthServices";
import { saveSelectedPharmacy, type AreaPharmacy } from "@/lib/pharmacies";
import { searchPharmacies } from "@/lib/pharmacySearch";
import { searchSpecialties } from "@/lib/specialtySearch";
import { searchTreatments } from "@/lib/treatmentSearch";

type KindFilter = "all" | ProviderKind;

/** Collapsed list: two rows; last cell is “View all”. */
function listCollapse(cols: number) {
  const slots = cols * 2;
  return { cols, slots, visible: slots - 1 };
}

function useCollapsedList<T>(
  items: T[],
  showAll: boolean,
  isSearching: boolean,
  collapsedSlots: number,
  collapsedVisible: number,
) {
  const canCollapse = !isSearching && !showAll && items.length > collapsedSlots;
  const visible = canCollapse ? items.slice(0, collapsedVisible) : items;
  return { canCollapse, visible };
}

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

export function Appointments() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<KindFilter>("all");
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const [showAllTreatments, setShowAllTreatments] = useState(false);
  const [showAllPharmacies, setShowAllPharmacies] = useState(false);
  const [showAllLabs, setShowAllLabs] = useState(false);
  const [showAllAssistants, setShowAllAssistants] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

  // Re-read bookings when returning to the hub (e.g. after lab book).
  useEffect(() => {
    setTick((t) => t + 1);
    const onVis = () => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const specialtyParam = params.get("specialty");
  const specialtyId = isSpecialtyId(specialtyParam) ? specialtyParam : null;
  const specialty = specialtyId ? specialtyById(specialtyId) : undefined;

  const allAppts = useMemo(() => getAppointments(), [tick]);
  const upcomingAppts = allAppts.filter((a) => a.status === "upcoming" && !appointmentIsPast(a));
  const upcomingLabs = useMemo(
    () => getLabBookings().filter((b) => b.status === "upcoming" && !labBookingIsPast(b)),
    [tick],
  );
  const upcomingCare = useMemo(
    () =>
      getCareWorkerBookings().filter((b) => b.status === "upcoming" && !careWorkerBookingIsPast(b)),
    [tick],
  );
  const openRequests = useMemo(
    () => getServiceRequests().filter((r) => r.status === "open"),
    [tick],
  );

  const railCount = upcomingAppts.length + upcomingLabs.length + upcomingCare.length + openRequests.length;
  const hasUpcoming = railCount > 0;
  const { slots: collapsedSlots, visible: collapsedVisible } = listCollapse(hasUpcoming ? 3 : 4);
  const listGridClass = hasUpcoming
    ? "grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4"
    : "grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4";

  const providers = useMemo(
    () =>
      specialtyId
        ? filterProviders({ kind, query: q, specialtyId, sortByDistance: true })
        : [],
    [kind, q, specialtyId],
  );

  const filteredSpecialties = useMemo(() => searchSpecialties(q), [q]);
  const filteredTreatments = useMemo(() => searchTreatments(q), [q]);
  const filteredPharmacies = useMemo(() => searchPharmacies(q), [q]);
  const filteredLabs = useMemo(() => searchLabs(q), [q]);
  const filteredAssistants = useMemo(() => searchCareWorkers(q), [q]);
  const filteredServices = useMemo(() => searchHealthServices(q), [q]);

  const isSearching = q.trim().length > 0;

  const specialtiesCollapse = useCollapsedList(
    filteredSpecialties,
    showAllSpecialties,
    isSearching,
    collapsedSlots,
    collapsedVisible,
  );
  const treatmentsCollapse = useCollapsedList(
    filteredTreatments,
    showAllTreatments,
    isSearching,
    collapsedSlots,
    collapsedVisible,
  );
  const pharmaciesCollapse = useCollapsedList(
    filteredPharmacies,
    showAllPharmacies,
    isSearching,
    collapsedSlots,
    collapsedVisible,
  );
  const labsCollapse = useCollapsedList(
    filteredLabs,
    showAllLabs,
    isSearching,
    collapsedSlots,
    collapsedVisible,
  );
  const assistantsCollapse = useCollapsedList(
    filteredAssistants,
    showAllAssistants,
    isSearching,
    collapsedSlots,
    collapsedVisible,
  );
  const servicesCollapse = useCollapsedList(
    filteredServices,
    showAllServices,
    isSearching,
    collapsedSlots,
    collapsedVisible,
  );

  const noSearchResults =
    isSearching &&
    filteredSpecialties.length === 0 &&
    filteredTreatments.length === 0 &&
    filteredPharmacies.length === 0 &&
    filteredLabs.length === 0 &&
    filteredAssistants.length === 0 &&
    filteredServices.length === 0;

  const refresh = () => setTick((n) => n + 1);

  const selectSpecialty = (id: SpecialtyId) => {
    setKind("all");
    setQ("");
    setParams({ specialty: id });
  };

  const clearSpecialty = () => {
    setQ("");
    setKind("all");
    setShowAllSpecialties(false);
    setShowAllTreatments(false);
    setShowAllPharmacies(false);
    setShowAllLabs(false);
    setShowAllAssistants(false);
    setShowAllServices(false);
    setParams({});
  };

  const openDetail = (p: CareProvider) => {
    const qs = specialtyId ? `?specialty=${encodeURIComponent(specialtyId)}` : "";
    nav(`/appointments/provider/${p.id}${qs}`);
  };

  const onSearchChange = (value: string) => {
    setQ(value);
    setShowAllSpecialties(false);
    setShowAllTreatments(false);
    setShowAllPharmacies(false);
    setShowAllLabs(false);
    setShowAllAssistants(false);
    setShowAllServices(false);
  };

  const openPharmacy = (p: AreaPharmacy) => {
    saveSelectedPharmacy(p);
    nav(`/transfer?pharmacy=${encodeURIComponent(p.id)}`);
  };

  const appointmentsAside = hasUpcoming ? (
    <YourAppointments
      upcomingAppts={upcomingAppts}
      upcomingLabs={upcomingLabs}
      upcomingCare={upcomingCare}
      openRequests={openRequests}
      onRefresh={refresh}
      onMessage={() => nav("/messages")}
      layout="aside"
    />
  ) : null;

  const withRail = "flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8";

  return (
    <div>
      {!specialty ? (
        <div className={hasUpcoming ? withRail : undefined}>
          <div className="min-w-0 flex-1">
            <header className="mb-6">
              <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Care")}</p>
              <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
                {tx("Book an appointment")}
              </h1>
              <p className="mt-2 max-w-2xl text-base text-ink-secondary">
                {tx(
                  "Find doctors, treatments, pharmacies, labs, home care, and urgent services nearby.",
                )}
              </p>
            </header>

            <PageSearchField
              scope="appointments"
              value={q}
              onChange={onSearchChange}
              className="mb-5"
            />

            {noSearchResults ? (
              <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center">
                <p className="font-semibold text-[color:var(--pp-primary-950)]">
                  {tx("No matches")}
                </p>
                <p className="mt-1 text-sm text-ink-tertiary">
                  {tx("Try another symptom, specialty, pharmacy, lab, or service name.")}
                </p>
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="mt-4 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
                >
                  {tx("Clear search")}
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                <HubSection
                  title={tx("Specialisations")}
                  show={ !isSearching || filteredSpecialties.length > 0}
                  showAll={showAllSpecialties}
                  isSearching={isSearching}
                  canCollapse={specialtiesCollapse.canCollapse}
                  total={filteredSpecialties.length}
                  collapsedVisible={collapsedVisible}
                  onShowAll={() => setShowAllSpecialties(true)}
                  onShowLess={() => setShowAllSpecialties(false)}
                  gridClass={listGridClass}
                >
                  {specialtiesCollapse.visible.map((s) => (
                    <SpecialtyCard
                      key={s.id}
                      specialty={s}
                      onConsult={() => selectSpecialty(s.id)}
                    />
                  ))}
                  {specialtiesCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredSpecialties.length - collapsedVisible}
                      label={tx("View all")}
                      ariaLabel={tx("View all specialisations")}
                      onClick={() => setShowAllSpecialties(true)}
                    />
                  )}
                </HubSection>

                <HubSection
                  title={tx("Treatments")}
                  show={!isSearching || filteredTreatments.length > 0}
                  showAll={showAllTreatments}
                  isSearching={isSearching}
                  canCollapse={treatmentsCollapse.canCollapse}
                  total={filteredTreatments.length}
                  collapsedVisible={collapsedVisible}
                  onShowAll={() => setShowAllTreatments(true)}
                  onShowLess={() => setShowAllTreatments(false)}
                  gridClass={listGridClass}
                >
                  {treatmentsCollapse.visible.map((t) => (
                    <TreatmentCard
                      key={t.slug}
                      treatment={t}
                      onOpen={() => nav(`/appointments/treatments/${t.slug}`)}
                    />
                  ))}
                  {treatmentsCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredTreatments.length - collapsedVisible}
                      label={tx("View all")}
                      ariaLabel={tx("View all treatments")}
                      onClick={() => setShowAllTreatments(true)}
                    />
                  )}
                </HubSection>

                <HubSection
                  title={tx("Pharmacies")}
                  show={!isSearching || filteredPharmacies.length > 0}
                  showAll={showAllPharmacies}
                  isSearching={isSearching}
                  canCollapse={pharmaciesCollapse.canCollapse}
                  total={filteredPharmacies.length}
                  collapsedVisible={collapsedVisible}
                  onShowAll={() => setShowAllPharmacies(true)}
                  onShowLess={() => setShowAllPharmacies(false)}
                  gridClass={listGridClass}
                  headerExtra={
                    <button
                      type="button"
                      onClick={() => nav("/pharmacies/on")}
                      className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
                    >
                      {tx("Browse regions")}
                    </button>
                  }
                >
                  {pharmaciesCollapse.visible.map((p) => (
                    <PharmacyCard key={p.id} pharmacy={p} onOpen={() => openPharmacy(p)} />
                  ))}
                  {pharmaciesCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredPharmacies.length - collapsedVisible}
                      label={tx("View all")}
                      ariaLabel={tx("View all pharmacies")}
                      onClick={() => setShowAllPharmacies(true)}
                    />
                  )}
                </HubSection>

                <HubSection
                  title={tx("Labs")}
                  show={!isSearching || filteredLabs.length > 0}
                  showAll={showAllLabs}
                  isSearching={isSearching}
                  canCollapse={labsCollapse.canCollapse}
                  total={filteredLabs.length}
                  collapsedVisible={collapsedVisible}
                  onShowAll={() => setShowAllLabs(true)}
                  onShowLess={() => setShowAllLabs(false)}
                  gridClass={listGridClass}
                >
                  {labsCollapse.visible.map((l) => (
                    <LabCard
                      key={l.id}
                      lab={l}
                      onOpen={() => nav(`/appointments/labs/${l.id}`)}
                    />
                  ))}
                  {labsCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredLabs.length - collapsedVisible}
                      label={tx("View all")}
                      ariaLabel={tx("View all labs")}
                      onClick={() => setShowAllLabs(true)}
                    />
                  )}
                </HubSection>

                <HubSection
                  title={tx("Medical assistants")}
                  show={!isSearching || filteredAssistants.length > 0}
                  showAll={showAllAssistants}
                  isSearching={isSearching}
                  canCollapse={assistantsCollapse.canCollapse}
                  total={filteredAssistants.length}
                  collapsedVisible={collapsedVisible}
                  onShowAll={() => setShowAllAssistants(true)}
                  onShowLess={() => setShowAllAssistants(false)}
                  gridClass={listGridClass}
                >
                  {assistantsCollapse.visible.map((w) => (
                    <CareWorkerCard
                      key={w.id}
                      worker={w}
                      onOpen={() => nav(`/appointments/assistants/${w.id}`)}
                    />
                  ))}
                  {assistantsCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredAssistants.length - collapsedVisible}
                      label={tx("View all")}
                      ariaLabel={tx("View all medical assistants")}
                      onClick={() => setShowAllAssistants(true)}
                    />
                  )}
                </HubSection>

                <HubSection
                  title={tx("Other services")}
                  show={!isSearching || filteredServices.length > 0}
                  showAll={showAllServices}
                  isSearching={isSearching}
                  canCollapse={servicesCollapse.canCollapse}
                  total={filteredServices.length}
                  collapsedVisible={collapsedVisible}
                  onShowAll={() => setShowAllServices(true)}
                  onShowLess={() => setShowAllServices(false)}
                  gridClass={listGridClass}
                >
                  {servicesCollapse.visible.map((s) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      onOpen={() => nav(`/appointments/services/${s.id}`)}
                    />
                  ))}
                  {servicesCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredServices.length - collapsedVisible}
                      label={tx("View all")}
                      ariaLabel={tx("View all services")}
                      onClick={() => setShowAllServices(true)}
                    />
                  )}
                </HubSection>
              </div>
            )}
          </div>

          {appointmentsAside}
        </div>
      ) : (
        <div className={hasUpcoming ? withRail : undefined}>
          <div className="min-w-0 flex-1">
            <header className="mb-6">
              <button
                type="button"
                onClick={clearSpecialty}
                className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
              >
                ‹ {tx("Back")}
              </button>
              <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
                {tx(specialty.label)}
              </h1>
            </header>

            <PageSearchField
              scope="appointments-providers"
              value={q}
              onChange={onSearchChange}
              className="mb-4"
            />

            <div
              className="pp-scroll -mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1"
              role="group"
              aria-label={tx("Filter by type")}
            >
              {(
                [
                  { id: "all" as const, label: tx("All") },
                  { id: "doctor" as const, label: tx("Doctors") },
                  { id: "clinic" as const, label: tx("Clinics") },
                  { id: "hospital" as const, label: tx("Hospitals") },
                ] as const
              ).map((t) => {
                const on = kind === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setKind(t.id)}
                    className={
                      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                      (on
                        ? "bg-[color:var(--pp-primary-950)] text-white"
                        : "text-[color:var(--pp-violet)] hover:bg-[color:var(--pp-primary-100)]")
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <p className="mb-4 text-sm text-ink-tertiary">
              {tx("Sorted by nearest first")}
              {" · "}
              <span className="tnum">
                {providers.length}{" "}
                {providers.length === 1 ? tx("provider") : tx("providers")}
              </span>
            </p>

            {providers.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white px-6 py-14 text-center">
                <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("No matches")}</p>
                <p className="mt-1 text-sm text-ink-tertiary">
                  {tx("Try another filter or clear your search.")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setKind("all");
                  }}
                  className="mt-4 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
                >
                  {tx("Clear filters")}
                </button>
              </div>
            ) : (
              <div
                className={
                  hasUpcoming
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                }
              >
                {providers.map((p) => (
                  <ProviderCard
                    key={p.id}
                    p={p}
                    specialty={specialty}
                    onSelect={() => openDetail(p)}
                  />
                ))}
              </div>
            )}
          </div>

          {appointmentsAside}
        </div>
      )}
    </div>
  );
}

/* ── Hub section shell ───────────────────────────────────── */

function HubSection({
  title,
  show,
  showAll,
  isSearching,
  canCollapse,
  total,
  collapsedVisible,
  onShowLess,
  gridClass,
  headerExtra,
  children,
}: {
  title: string;
  show: boolean;
  showAll: boolean;
  isSearching: boolean;
  canCollapse: boolean;
  total: number;
  collapsedVisible: number;
  onShowAll: () => void;
  onShowLess: () => void;
  gridClass: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { tx } = useI18n();
  if (!show) return null;
  return (
    <section aria-label={title}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">{title}</h2>
        <div className="flex items-center gap-3">
          {headerExtra}
          {showAll && !isSearching ? (
            <button
              type="button"
              onClick={onShowLess}
              className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
            >
              {tx("Show less")}
            </button>
          ) : (
            <p className="text-sm text-ink-tertiary">
              {canCollapse
                ? tx("{n} more").replace("{n}", String(total - collapsedVisible))
                : isSearching
                  ? tx("{n} matches").replace("{n}", String(total))
                  : null}
            </p>
          )}
        </div>
      </div>
      <div className={gridClass}>{children}</div>
    </section>
  );
}

/* ── Specialty grid (illustration cards) ─────────────────── */

const specialtyCardShell =
  "flex w-full flex-col items-center rounded-[1.75rem] border border-[#E6E1EF] bg-white p-5 text-center sm:rounded-[2rem] sm:p-6 " +
  "transition-[transform,box-shadow,border-color] duration-200 " +
  "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)] " +
  "active:translate-y-0 active:shadow-none";

function SpecialtyCard({
  specialty,
  onConsult,
}: {
  specialty: Specialty;
  onConsult: () => void;
}) {
  const { tx } = useI18n();
  return (
    <button type="button" onClick={onConsult} className={"group " + specialtyCardShell}>
      <div
        className="grid h-[5.75rem] w-[5.75rem] place-items-center sm:h-[6.75rem] sm:w-[6.75rem] md:h-[7.25rem] md:w-[7.25rem]"
        aria-hidden
      >
        <img
          src={specialty.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </div>
      <p className="mt-5 text-base font-semibold leading-snug tracking-tight text-[color:var(--pp-primary-950)] sm:text-lg">
        {tx(specialty.label)}
      </p>
      <p className="mt-2 text-sm text-[#8B849C] tnum sm:text-[15px]">
        {formatFee(specialty.feeFrom)}
      </p>
    </button>
  );
}

function ViewAllCard({
  remaining,
  label,
  ariaLabel,
  onClick,
}: {
  remaining: number;
  label: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={specialtyCardShell + " justify-center border-dashed border-[#D4CDE3] bg-[#FBFAFE]"}
      aria-label={ariaLabel}
    >
      <div
        className="grid h-[5.75rem] w-[5.75rem] place-items-center sm:h-[6.75rem] sm:w-[6.75rem] md:h-[7.25rem] md:w-[7.25rem]"
        aria-hidden
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] sm:h-16 sm:w-16">
          <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
      </div>
      <p className="mt-5 text-base font-semibold leading-snug tracking-tight text-[color:var(--pp-primary-950)] sm:text-lg">
        {label}
      </p>
      <p className="mt-2 text-sm text-[#8B849C] sm:text-[15px]">
        +{remaining}
      </p>
    </button>
  );
}

function TreatmentCard({
  treatment,
  onOpen,
}: {
  treatment: Treatment;
  onOpen: () => void;
}) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        "group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white text-left " +
        "transition-[transform,box-shadow,border-color] duration-200 " +
        "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)] " +
        "active:translate-y-0 active:shadow-none"
      }
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-[color:var(--pp-primary-200)]">
        {treatment.img ? (
          <img
            src={treatment.img}
            alt=""
            loading="lazy"
            onError={hideOnError}
            className="absolute inset-0 h-full w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full place-items-center text-5xl" aria-hidden>
            {treatment.emoji}
          </span>
        )}
        {treatment.eligible && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-2xs font-semibold text-wellness shadow-sm backdrop-blur-sm">
            {tx("Available online")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx(treatment.category)}</p>
        <h3 className="mt-1.5 font-display text-xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx(treatment.name)}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-secondary">
          {tx(treatment.blurb)}
        </p>
        <p className="mt-4 text-sm text-ink-tertiary">
          {treatment.from === 0 ? (
            <span className="font-semibold text-[color:var(--pp-primary-950)]">
              {tx("Covered by most plans")}
            </span>
          ) : (
            <>
              {tx("From")}{" "}
              <span className="font-semibold text-[color:var(--pp-primary-950)] tnum">
                ${treatment.from}
              </span>
              <span className="text-ink-tertiary">{tx("/mo")}</span>
            </>
          )}
        </p>
      </div>
    </button>
  );
}

/* ── Provider cards ────────────────────────────────────────── */

function ProviderCard({
  p,
  specialty,
  onSelect,
}: {
  p: CareProvider;
  specialty: Specialty;
  onSelect: () => void;
}) {
  const { tx } = useI18n();
  const kind = tx(kindLabel(p.kind));
  const availableSoon =
    p.nextAvailable === "Today" || p.nextAvailable === "Tomorrow" || p.nextAvailable === "In 2 days";
  const badge =
    p.nextAvailable === "Today"
      ? tx("Available")
      : availableSoon
        ? tx(p.nextAvailable)
        : p.nextAvailable;
  const feeAmount = p.consultationFee > 0 ? p.consultationFee : specialty.feeFrom;
  const feeCovered = feeAmount <= 0;
  const place = p.address?.split(",")[0]?.trim() || p.city;
  const meta = `${place} · ${formatDistance(p.distanceKm)}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white text-left " +
        "transition-[transform,box-shadow,border-color] duration-200 " +
        "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)] " +
        "active:translate-y-0 active:shadow-none"
      }
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-[color:var(--pp-primary-200)]">
        <img
          src={p.imageUrl}
          alt=""
          loading="lazy"
          className={
            "absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] " +
            (p.kind === "doctor" ? "object-top" : "object-center")
          }
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-2xs font-semibold text-wellness shadow-sm backdrop-blur-sm">
          {badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="pp-caps text-[color:var(--pp-violet)]">{kind}</p>
          <p className="shrink-0 text-sm font-semibold text-[color:var(--pp-violet)] tnum">
            ★ {p.rating.toFixed(1)}
          </p>
        </div>

        <h3 className="mt-2 font-display text-xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {p.name}
        </h3>
        <p className="mt-1 text-sm text-ink-tertiary">{meta}</p>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-secondary">
          {tx(p.bio)}
        </p>

        <p className="mt-4 text-sm text-ink-tertiary">
          {feeCovered ? (
            <span className="font-semibold text-[color:var(--pp-primary-950)]">
              {tx("Covered / OHIP")}
            </span>
          ) : (
            <>
              {tx("From")}{" "}
              <span className="font-semibold text-[color:var(--pp-primary-950)] tnum">
                {formatFee(feeAmount)}
                <span className="font-normal text-ink-tertiary">*</span>
              </span>
            </>
          )}
        </p>
      </div>
    </button>
  );
}

function ServiceCard({ service, onOpen }: { service: HealthService; onOpen: () => void }) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        "group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white p-5 text-left " +
        "transition-[transform,box-shadow,border-color] duration-200 " +
        "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]"
      }
    >
      <span className="text-4xl" aria-hidden>
        {service.emoji}
      </span>
      <p className="mt-4 pp-caps text-[color:var(--pp-violet)]">
        {tx(healthServiceCategoryLabel(service.category))}
      </p>
      <h3 className="mt-1.5 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx(service.name)}
      </h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-ink-secondary">{tx(service.blurb)}</p>
      <p className="mt-4 text-sm text-ink-tertiary">
        {service.etaMinutes != null
          ? `~${service.etaMinutes} ${tx("min")}`
          : service.available24h
            ? tx("Available 24/7")
            : service.city}
        {service.feeFrom != null && service.feeFrom > 0
          ? ` · ${tx("From")} ${formatFee(service.feeFrom)}`
          : ""}
      </p>
    </button>
  );
}

function PharmacyCard({ pharmacy, onOpen }: { pharmacy: AreaPharmacy; onOpen: () => void }) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        "group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white p-5 text-left " +
        "transition-[transform,box-shadow,border-color] duration-200 " +
        "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]"
      }
    >
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Pharmacy")}</p>
      <h3 className="mt-2 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {pharmacy.name}
      </h3>
      <p className="mt-1 text-sm text-ink-tertiary">
        {pharmacy.city} · {pharmacy.distance}
      </p>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-secondary">{pharmacy.address}</p>
      <p className="mt-4 text-sm font-medium text-[color:var(--pp-violet)]">
        {tx("Transfer prescription →")}
      </p>
    </button>
  );
}

function LabCard({ lab, onOpen }: { lab: LabCentre; onOpen: () => void }) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        "group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white p-5 text-left " +
        "transition-[transform,box-shadow,border-color] duration-200 " +
        "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]"
      }
    >
      <span className="text-4xl" aria-hidden>
        {lab.emoji}
      </span>
      <p className="mt-4 pp-caps text-[color:var(--pp-violet)]">{tx("Lab")}</p>
      <h3 className="mt-1.5 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {lab.name}
      </h3>
      <p className="mt-1 text-sm text-ink-tertiary">
        {lab.city} · {formatDistance(lab.distanceKm)}
      </p>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-secondary">{tx(lab.subtitle)}</p>
      <p className="mt-4 text-sm text-ink-tertiary">
        ★ {lab.rating.toFixed(1)} · {tx(lab.nextAvailable)}
      </p>
    </button>
  );
}

function CareWorkerCard({ worker, onOpen }: { worker: CareWorker; onOpen: () => void }) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        "group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white p-5 text-left " +
        "transition-[transform,box-shadow,border-color] duration-200 " +
        "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]"
      }
    >
      <span className="text-4xl" aria-hidden>
        {worker.emoji}
      </span>
      <p className="mt-4 pp-caps text-[color:var(--pp-violet)]">
        {tx(careWorkerKindLabel(worker.kind))}
      </p>
      <h3 className="mt-1.5 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {worker.name}
      </h3>
      <p className="mt-1 text-sm text-ink-tertiary">
        {worker.city} · {formatDistance(worker.distanceKm)}
      </p>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-secondary">{tx(worker.bio)}</p>
      <p className="mt-4 text-sm text-ink-tertiary">
        {tx("From")}{" "}
        <span className="font-semibold text-[color:var(--pp-primary-950)] tnum">
          {formatFee(worker.feeFrom)}
        </span>
      </p>
    </button>
  );
}

/* ── Your appointments ────────────────────────────────────── */

function YourAppointments({
  upcomingAppts,
  upcomingLabs,
  upcomingCare,
  openRequests,
  onRefresh,
  onMessage,
  layout = "stack",
}: {
  upcomingAppts: Appointment[];
  upcomingLabs: LabBooking[];
  upcomingCare: CareWorkerBooking[];
  openRequests: ServiceRequest[];
  onRefresh: () => void;
  onMessage: () => void;
  layout?: "stack" | "aside";
}) {
  const { tx } = useI18n();
  const total =
    upcomingAppts.length + upcomingLabs.length + upcomingCare.length + openRequests.length;
  if (total === 0) return null;

  return (
    <aside
      className={
        layout === "aside"
          ? "w-full shrink-0 lg:sticky lg:top-28 lg:w-72 xl:w-80"
          : "mt-12 border-t border-line pt-8"
      }
      aria-label={tx("Your appointments")}
    >
      <div className="mb-5">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Your appointments")}
        </h2>
        <p className="mt-1 text-sm text-ink-tertiary">
          {tx("{n} upcoming").replace("{n}", String(total))}
        </p>
      </div>

      <div className="space-y-3">
        {upcomingAppts.map((a) => (
          <ApptCard
            key={a.id}
            a={a}
            onCancel={() => {
              updateAppointmentStatus(a.id, "cancelled");
              onRefresh();
            }}
            onMessage={onMessage}
          />
        ))}
        {upcomingLabs.map((b) => (
          <RailItemCard
            key={b.id}
            badge={tx("Lab")}
            title={b.labName}
            subtitle={b.itemNames}
            meta={`${b.date} · ${b.time}`}
            fee={b.fee}
            confirmationNo={b.confirmationNo}
            onCancel={() => {
              updateLabBookingStatus(b.id, "cancelled");
              if (b.orderId) cancelOrder(b.orderId);
              onRefresh();
            }}
            onMessage={onMessage}
          />
        ))}
        {upcomingCare.map((b) => (
          <RailItemCard
            key={b.id}
            badge={tx(careWorkerKindLabel(b.kind))}
            title={b.workerName}
            subtitle={b.service}
            meta={`${b.date} · ${b.time}`}
            fee={b.fee}
            confirmationNo={b.confirmationNo}
            onCancel={() => {
              updateCareWorkerBookingStatus(b.id, "cancelled");
              onRefresh();
            }}
            onMessage={onMessage}
          />
        ))}
        {openRequests.map((r) => (
          <RailItemCard
            key={r.id}
            badge={tx(healthServiceCategoryLabel(r.category))}
            title={r.serviceName}
            subtitle={r.address}
            meta={
              r.etaMinutes != null
                ? tx("ETA ~{n} min").replace("{n}", String(r.etaMinutes))
                : tx("Request open")
            }
            confirmationNo={r.confirmationNo}
            cancelLabel={tx("Cancel request")}
            onCancel={() => {
              updateServiceRequestStatus(r.id, "cancelled");
              onRefresh();
            }}
            onMessage={onMessage}
          />
        ))}
      </div>
    </aside>
  );
}

function RailItemCard({
  badge,
  title,
  subtitle,
  meta,
  fee,
  confirmationNo,
  onCancel,
  onMessage,
  cancelLabel,
}: {
  badge: string;
  title: string;
  subtitle: string;
  meta: string;
  fee?: number;
  confirmationNo: string;
  onCancel: () => void;
  onMessage: () => void;
  cancelLabel?: string;
}) {
  const { tx } = useI18n();
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <span className="inline-flex items-center rounded-full bg-wellness-subtle px-2.5 py-1 text-2xs font-semibold text-wellness">
          {badge}
        </span>
        <p className="truncate font-mono text-2xs text-ink-tertiary">{confirmationNo}</p>
      </div>
      <div className="px-5 py-4">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{title}</p>
        <p className="mt-0.5 text-sm text-ink-tertiary">{subtitle}</p>
      </div>
      <div className="flex items-center justify-between gap-3 border-y border-line px-5 py-3.5">
        <p className="min-w-0 truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">
          {meta}
        </p>
        {fee != null && fee > 0 ? (
          <p className="shrink-0 text-sm font-semibold text-[color:var(--pp-primary-950)] tnum">
            {formatFee(fee)}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-stretch gap-3 px-5 py-4">
        <Button size="sm" variant="ghost" fullWidth onClick={onMessage}>
          {tx("Message care team")}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-center text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-70"
        >
          {cancelLabel || tx("Cancel appointment")}
        </button>
      </div>
    </article>
  );
}

function ApptCard({
  a,
  onCancel,
  onMessage,
}: {
  a: Appointment;
  onCancel: () => void;
  onMessage: () => void;
}) {
  const { tx } = useI18n();
  const name = a.providerName || a.clinicianName;
  const kind = a.providerKind ? tx(kindLabel(a.providerKind)) : tx("Doctor");
  const provider = getProvider(a.providerId);
  const isVirtual = a.visitType === "virtual";

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-wellness-subtle px-2.5 py-1 text-2xs font-semibold text-wellness">
          {isVirtual ? (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
              <path d="M2.5 4.25A1.75 1.75 0 0 1 4.25 2.5h5.5A1.75 1.75 0 0 1 11.5 4.25v7.5a1.75 1.75 0 0 1-1.75 1.75h-5.5A1.75 1.75 0 0 1 2.5 11.75v-7.5Zm10.03.72 1.72-1.146a.75.75 0 0 1 1.2.6v6.152a.75.75 0 0 1-1.2.6l-1.72-1.147V4.97Z" />
            </svg>
          ) : null}
          {tx("Upcoming")}
        </span>
        <p className="truncate font-mono text-2xs text-ink-tertiary">{a.confirmationNo}</p>
      </div>

      <div className="flex gap-3 px-5 py-4">
        {provider ? (
          <img
            src={provider.imageUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-2xl object-cover object-top"
          />
        ) : (
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[color:var(--pp-primary-100)] text-sm font-semibold text-[color:var(--pp-primary-950)]"
            aria-hidden
          >
            {name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 self-center">
          <p className="pp-caps text-[color:var(--pp-violet)]/70">{kind}</p>
          <p className="mt-0.5 truncate font-semibold text-[color:var(--pp-primary-950)]">{name}</p>
          <p className="mt-0.5 truncate text-sm text-ink-tertiary">{tx(a.specialtyLabel)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-y border-line px-5 py-3.5">
        <p className="min-w-0 truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">
          {a.date} · {a.time}
        </p>
        {a.fee != null && a.fee > 0 ? (
          <p className="shrink-0 text-sm font-semibold text-[color:var(--pp-primary-950)] tnum">
            {formatFee(a.fee)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-stretch gap-3 px-5 py-4">
        <Button size="sm" variant="ghost" fullWidth onClick={onMessage}>
          {tx("Message care team")}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-center text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-70"
        >
          {tx("Cancel appointment")}
        </button>
      </div>
    </article>
  );
}
