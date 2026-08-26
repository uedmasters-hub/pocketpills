import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { RatingChipSkeleton, SkeletonImage } from "@/components/ui";
import { RatingChip } from "@/components/reviews/RatingChip";
import { PageSearchField } from "@/components/PageSearchField";
import { mapSearchHits } from "@/components/AlsoFoundHeading";
import { HighlightedText } from "@/components/HighlightedText";
import { DetailSection } from "@/components/DetailSection";
import { drugs, type Treatment } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { StickyChrome } from "@/components/layout/StickyChrome";
import { useShellColumn } from "@/lib/columnHover";
import {
  appointmentIsPast,
  filterProviders,
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
import { careEventHref } from "@/lib/careJourney";
import { awaitingStatusLabel, visitPhase } from "@/lib/appointmentGuide";
import { saveSelectedPharmacy, type AreaPharmacy } from "@/lib/pharmacies";
import { searchPharmacies } from "@/lib/pharmacySearch";
import { subscribePharmacyDirectory } from "@/lib/pharmacyDirectory";
import { useReviewSummaries } from "@/lib/useReviewSummaries";
import type { ReviewSummary } from "@/lib/reviewsApi";
import { searchSpecialties } from "@/lib/specialtySearch";
import { searchTreatments } from "@/lib/treatmentSearch";
import { nmcNumberOf } from "@/lib/doctorProfileContent";
import { hfCodeFromId, shortHfCode } from "@/lib/facilityDirectory";
import { pharmacyHours } from "@/lib/pharmacyDirectory";

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

const DIRECTORY_CARD =
  "group relative block w-full overflow-hidden rounded-[1.5rem] border border-[#E6E1EF] bg-white text-left " +
  "h-[12.75rem] transition-[transform,box-shadow,border-color] duration-200 " +
  "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]";

const PHOTO_MASK = {
  WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 18%)",
  maskImage: "linear-gradient(to right, transparent 0%, #000 18%)",
} as const;

const PHARMACY_PHOTO = "/img/treatments/uti.png";
const LAB_PHOTOS = [
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=640&h=400&fit=crop",
];
const ASSISTANT_PHOTOS: Record<string, string> = {
  "ma-priya": "/img/doctors/doctor-w1.png",
  "nurse-jordan": "/img/doctors/doctor-m2.png",
  "hc-amira": "/img/doctors/doctor-w2.png",
  "ma-chris": "/img/doctors/doctor-m1.png",
  "nurse-sofia": "/img/doctors/doctor-w3.png",
  "hc-mark": "/img/doctors/doctor-m3.png",
  "nurse-ava": "/img/doctors/doctor-w1.png",
};
const ASSISTANT_FALLBACK = [
  "/img/doctors/doctor-w1.png",
  "/img/doctors/doctor-w2.png",
  "/img/doctors/doctor-w3.png",
  "/img/doctors/doctor-m1.png",
  "/img/doctors/doctor-m2.png",
  "/img/doctors/doctor-m3.png",
];
const SERVICE_PHOTOS: Record<string, string> = {
  "svc-ambulance":
    "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=640&h=400&fit=crop",
  "svc-non-emerg-transport":
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=640&h=400&fit=crop",
  "svc-urgent-care":
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=640&h=400&fit=crop",
  "svc-after-hours":
    "https://images.unsplash.com/photo-1576091160550-b11a3d8d0a3e?w=640&h=400&fit=crop",
  "svc-home-oxygen":
    "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=640&h=400&fit=crop",
  "svc-mental-crisis":
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=640&h=400&fit=crop",
  "svc-pharmacy-delivery":
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=640&h=400&fit=crop",
};

function pickPhoto(id: string, photos: string[]) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return photos[n % photos.length];
}

function labPhoto(id: string) {
  return pickPhoto(id, LAB_PHOTOS);
}

function assistantPhoto(id: string) {
  return ASSISTANT_PHOTOS[id] || pickPhoto(id, ASSISTANT_FALLBACK);
}

function ratingSummary(id: string, average: number, count: number): ReviewSummary {
  return { subjectId: id, average, count, histogram: [0, 0, 0, 0, 0] };
}

function DirectoryListingCard({
  photo,
  photoObjectClass = "object-cover object-[50%_40%]",
  status,
  statusTone = "wellness",
  summary,
  ratingPending = false,
  title,
  highlightQuery = "",
  meta,
  detail,
  detailStrong = false,
  cta,
  tag,
  onClick,
}: {
  photo?: string;
  photoObjectClass?: string;
  status: string;
  statusTone?: "wellness" | "muted";
  summary?: ReviewSummary | null;
  ratingPending?: boolean;
  title: string;
  highlightQuery?: string;
  meta: string;
  detail?: string;
  detailStrong?: boolean;
  cta: string;
  tag?: string;
  onClick: () => void;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    setPhotoFailed(false);
  }, [photo]);
  const showPhoto = Boolean(photo) && !photoFailed;

  return (
    <button type="button" onClick={onClick} className={DIRECTORY_CARD}>
      {showPhoto ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[40%]" aria-hidden>
          <SkeletonImage
            src={photo}
            alt=""
            loading="lazy"
            className="h-full w-full"
            imgClassName={photoObjectClass}
            style={PHOTO_MASK}
            onError={() => setPhotoFailed(true)}
          />
          <span className="absolute inset-y-0 left-0 w-[22%] bg-gradient-to-r from-white to-transparent" />
        </div>
      ) : null}

      <div
        className={
          "relative z-10 flex h-full min-w-0 flex-col justify-between px-5 py-5 " +
          (showPhoto ? "w-[66%] pr-2" : "w-full")
        }
      >
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2.5">
            <p className={"pp-caps " + (statusTone === "wellness" ? "text-wellness" : "text-ink-tertiary")}>
              {status}
            </p>
            {summary ? <RatingChip summary={summary} /> : ratingPending ? <RatingChipSkeleton /> : null}
          </div>
          <h3 className="mt-2 block w-full min-w-0 overflow-hidden truncate font-display text-lg font-medium leading-snug tracking-tight text-[color:var(--pp-primary-950)]">
            <HighlightedText text={title} query={highlightQuery} />
          </h3>
          <p className="mt-0.5 block w-full truncate text-sm leading-snug text-ink-tertiary">{meta}</p>
          {detail ? (
            <p
              className={
                detailStrong
                  ? "mt-1.5 font-display text-xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum"
                  : "mt-1.5 text-sm font-medium leading-snug text-[color:var(--pp-primary-950)]"
              }
            >
              {detail}
            </p>
          ) : null}
        </div>
        <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{cta} →</p>
      </div>

      {tag ? (
        <span className="absolute right-3 top-3 z-10 grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-2xs font-semibold text-[color:var(--pp-primary-950)] shadow-sm tnum">
          {tag}
        </span>
      ) : null}
    </button>
  );
}

export function Appointments() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<KindFilter>("all");
  const [q, setQ] = useState(() => params.get("q")?.trim() ?? "");
  const [tick, setTick] = useState(0);
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const [showAllTreatments, setShowAllTreatments] = useState(false);
  const [showAllPharmacies, setShowAllPharmacies] = useState(false);
  const [showAllLabs, setShowAllLabs] = useState(false);
  const [showAllAssistants, setShowAllAssistants] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

  useEffect(() => {
    const fromUrl = params.get("q")?.trim() ?? "";
    setQ((prev) => (fromUrl && fromUrl !== prev ? fromUrl : prev));
  }, [params]);

  // Re-read bookings when returning to the hub (e.g. after lab book).
  useEffect(() => {
    setTick((t) => t + 1);
    const onVis = () => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    const unsub = subscribePharmacyDirectory(() => setTick((t) => t + 1));
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      unsub();
    };
  }, []);

  const specialtyParam = params.get("specialty");
  const specialtyId = isSpecialtyId(specialtyParam) ? specialtyParam : null;
  const specialty = specialtyId ? specialtyById(specialtyId) : undefined;

  useEffect(() => {
    const drugSlug = params.get("drug");
    if (!drugSlug) return;
    const d = drugs.find((x) => x.slug === drugSlug);
    if (d) setQ(d.name);
  }, [params]);

  const allAppts = useMemo(() => getAppointments(), [tick]);
  const upcomingAppts = allAppts.filter(
    (a) =>
      (a.status === "upcoming" || a.status === "pending" || a.status === "unavailable") && !appointmentIsPast(a),
  );
  const pastAppts = allAppts.filter((a) => !upcomingAppts.some((u) => u.id === a.id));
  const upcomingLabs = useMemo(
    () => getLabBookings().filter((b) => b.status === "pending" || (b.status === "upcoming" && !labBookingIsPast(b))),
    [tick],
  );
  const pastLabs = useMemo(
    () => getLabBookings().filter((b) => !upcomingLabs.some((u) => u.id === b.id)),
    [tick, upcomingLabs],
  );
  const upcomingCare = useMemo(
    () =>
      getCareWorkerBookings().filter((b) => b.status === "pending" || (b.status === "upcoming" && !careWorkerBookingIsPast(b))),
    [tick],
  );
  const pastCare = useMemo(
    () => getCareWorkerBookings().filter((b) => !upcomingCare.some((u) => u.id === b.id)),
    [tick, upcomingCare],
  );
  const openRequests = useMemo(
    () => getServiceRequests().filter((r) => r.status === "open"),
    [tick],
  );
  const pastRequests = useMemo(
    () => getServiceRequests().filter((r) => r.status !== "open"),
    [tick],
  );

  const railCount = upcomingAppts.length + upcomingLabs.length + upcomingCare.length + openRequests.length;
  const hasUpcoming = railCount > 0;
  const hasRail = hasUpcoming || pastAppts.length > 0 || pastLabs.length > 0 || pastCare.length > 0 || pastRequests.length > 0;
  const { slots: listSlots, visible: listVisible } = listCollapse(2);
  const { slots: tileSlots, visible: tileVisible } = listCollapse(3);
  const tileGridClass = "grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4";
  const listGridClass = "grid grid-cols-1 gap-4 sm:grid-cols-2";

  const providers = useMemo(
    () =>
      specialtyId
        ? filterProviders({ kind, query: q, specialtyId, sortByDistance: true })
        : [],
    [kind, q, specialtyId],
  );

  const filteredSpecialties = useMemo(() => searchSpecialties(q), [q]);
  const filteredTreatments = useMemo(() => searchTreatments(q), [q]);
  const filteredPharmacies = useMemo(() => searchPharmacies(q), [q, tick]);
  const pharmacyReviewIds = useMemo(
    () => filteredPharmacies.map((p) => p.id.replace(/^dda-/, "")),
    [filteredPharmacies],
  );
  const { map: pharmacyRatings, ready: pharmacyRatingsReady } = useReviewSummaries("pharmacy", pharmacyReviewIds);
  const filteredLabs = useMemo(() => searchLabs(q), [q]);
  const filteredAssistants = useMemo(() => searchCareWorkers(q), [q]);
  const filteredServices = useMemo(() => searchHealthServices(q), [q]);

  const isSearching = q.trim().length > 0;

  const specialtiesCollapse = useCollapsedList(
    filteredSpecialties,
    showAllSpecialties,
    isSearching,
    tileSlots,
    tileVisible,
  );
  const treatmentsCollapse = useCollapsedList(
    filteredTreatments,
    showAllTreatments,
    isSearching,
    tileSlots,
    tileVisible,
  );
  const pharmaciesCollapse = useCollapsedList(
    filteredPharmacies,
    showAllPharmacies,
    isSearching,
    listSlots,
    listVisible,
  );
  const labsCollapse = useCollapsedList(
    filteredLabs,
    showAllLabs,
    isSearching,
    listSlots,
    listVisible,
  );
  const assistantsCollapse = useCollapsedList(
    filteredAssistants,
    showAllAssistants,
    isSearching,
    listSlots,
    listVisible,
  );
  const servicesCollapse = useCollapsedList(
    filteredServices,
    showAllServices,
    isSearching,
    listSlots,
    listVisible,
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

  const appointmentsAside =
    hasRail ? (
      <YourAppointments
        upcomingAppts={upcomingAppts}
        pastAppts={pastAppts}
        upcomingLabs={upcomingLabs}
        pastLabs={pastLabs}
        upcomingCare={upcomingCare}
        pastCare={pastCare}
        openRequests={openRequests}
        pastRequests={pastRequests}
        onRefresh={refresh}
        onMessage={() => nav("/messages")}
        layout="aside"
      />
    ) : null;

  const withRail = "flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-8";
  const mainCol = useShellColumn("main");

  return (
    <div>
      {!specialty ? (
        <div className={hasRail ? withRail : undefined}>
          <div className={"min-w-0 flex-1 " + mainCol.className} onMouseEnter={mainCol.onMouseEnter}>
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
                  collapsedVisible={tileVisible}
                  onShowAll={() => setShowAllSpecialties(true)}
                  onShowLess={() => setShowAllSpecialties(false)}
                  gridClass={tileGridClass}
                >
                  {mapSearchHits(
                    specialtiesCollapse.visible,
                    q,
                    (s) => [s.label, s.blurb, s.id],
                    (s) => (
                      <SpecialtyCard
                        key={s.id}
                        specialty={s}
                        highlightQuery={q}
                        onConsult={() => selectSpecialty(s.id)}
                      />
                    ),
                  )}
                  {specialtiesCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredSpecialties.length - tileVisible}
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
                  collapsedVisible={tileVisible}
                  onShowAll={() => setShowAllTreatments(true)}
                  onShowLess={() => setShowAllTreatments(false)}
                  gridClass={tileGridClass}
                >
                  {mapSearchHits(
                    treatmentsCollapse.visible,
                    q,
                    (t) => [t.name, t.blurb, t.category, t.slug],
                    (t) => (
                      <TreatmentCard
                        key={t.slug}
                        treatment={t}
                        highlightQuery={q}
                        onOpen={() => nav(`/appointments/treatments/${t.slug}`)}
                      />
                    ),
                  )}
                  {treatmentsCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredTreatments.length - tileVisible}
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
                  collapsedVisible={listVisible}
                  onShowAll={() => setShowAllPharmacies(true)}
                  onShowLess={() => setShowAllPharmacies(false)}
                  gridClass={listGridClass}
                  headerExtra={
                    <button
                      type="button"
                      onClick={() => nav("/pharmacies/regions")}
                      className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
                    >
                      {tx("Browse regions")}
                    </button>
                  }
                >
                  {mapSearchHits(
                    pharmaciesCollapse.visible,
                    q,
                    (p) => [p.name, p.city, p.address, p.province],
                    (p) => (
                      <PharmacyCard
                        key={p.id}
                        pharmacy={p}
                        highlightQuery={q}
                        summary={pharmacyRatings[p.id.replace(/^dda-/, "")]}
                        ratingPending={!pharmacyRatingsReady}
                        onOpen={() => openPharmacy(p)}
                      />
                    ),
                  )}
                  {pharmaciesCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredPharmacies.length - listVisible}
                      label={tx("View all")}
                      ariaLabel={tx("View all pharmacies")}
                      compact
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
                  collapsedVisible={listVisible}
                  onShowAll={() => setShowAllLabs(true)}
                  onShowLess={() => setShowAllLabs(false)}
                  gridClass={listGridClass}
                  headerExtra={
                    <button
                      type="button"
                      onClick={() => nav("/facilities")}
                      className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
                    >
                      {tx("Find a hospital")}
                    </button>
                  }
                >
                  {mapSearchHits(
                    labsCollapse.visible,
                    q,
                    (l) => [l.name, l.subtitle, l.city, l.address],
                    (l) => (
                      <LabCard
                        key={l.id}
                        lab={l}
                        highlightQuery={q}
                        onOpen={() => nav(`/appointments/labs/${l.id}`)}
                      />
                    ),
                  )}
                  {labsCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredLabs.length - listVisible}
                      label={tx("View all")}
                      ariaLabel={tx("View all labs")}
                      compact
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
                  collapsedVisible={listVisible}
                  onShowAll={() => setShowAllAssistants(true)}
                  onShowLess={() => setShowAllAssistants(false)}
                  gridClass={listGridClass}
                >
                  {mapSearchHits(
                    assistantsCollapse.visible,
                    q,
                    (w) => [w.name, w.subtitle, w.bio, w.city],
                    (w) => (
                      <CareWorkerCard
                        key={w.id}
                        worker={w}
                        highlightQuery={q}
                        onOpen={() => nav(`/appointments/assistants/${w.id}`)}
                      />
                    ),
                  )}
                  {assistantsCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredAssistants.length - listVisible}
                      label={tx("View all")}
                      ariaLabel={tx("View all medical assistants")}
                      compact
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
                  collapsedVisible={listVisible}
                  onShowAll={() => setShowAllServices(true)}
                  onShowLess={() => setShowAllServices(false)}
                  gridClass={listGridClass}
                >
                  {mapSearchHits(
                    servicesCollapse.visible,
                    q,
                    (s) => [s.name, s.blurb, s.city],
                    (s) => (
                      <ServiceCard
                        key={s.id}
                        service={s}
                        highlightQuery={q}
                        onOpen={() => nav(`/appointments/services/${s.id}`)}
                      />
                    ),
                  )}
                  {servicesCollapse.canCollapse && (
                    <ViewAllCard
                      remaining={filteredServices.length - listVisible}
                      label={tx("View all")}
                      ariaLabel={tx("View all services")}
                      compact
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
        <div className={hasRail ? withRail : undefined}>
          <div className={"min-w-0 flex-1 " + mainCol.className} onMouseEnter={mainCol.onMouseEnter}>
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
              <div className={listGridClass}>
                {mapSearchHits(
                  providers,
                  q,
                  (p) => [p.name, p.subtitle, p.city, p.bio, p.address || ""],
                  (p) => (
                    <ProviderCard
                      key={p.id}
                      p={p}
                      specialty={specialty}
                      highlightQuery={q}
                      onSelect={() => openDetail(p)}
                    />
                  ),
                )}
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
  const showingLess = showAll && !isSearching;
  const countLabel = showingLess
    ? null
    : canCollapse
      ? tx("{n} more").replace("{n}", String(total - collapsedVisible))
      : isSearching
        ? tx("{n} matches").replace("{n}", String(total))
        : null;
  const meta =
    headerExtra || showingLess || countLabel ? (
      <div className="flex flex-wrap items-center justify-end gap-3">
        {headerExtra}
        {showingLess ? (
          <button
            type="button"
            onClick={onShowLess}
            className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
          >
            {tx("Show less")}
          </button>
        ) : countLabel ? (
          <p className="text-sm text-ink-tertiary">{countLabel}</p>
        ) : null}
      </div>
    ) : undefined;
  return (
    <DetailSection title={title} meta={meta}>
      <div className={gridClass}>{children}</div>
    </DetailSection>
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
  highlightQuery = "",
}: {
  specialty: Specialty;
  onConsult: () => void;
  highlightQuery?: string;
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
        <HighlightedText text={tx(specialty.label)} query={highlightQuery} />
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
  compact = false,
}: {
  remaining: number;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={
          DIRECTORY_CARD +
          " flex flex-col items-center justify-center border-dashed border-[#D4CDE3] bg-[#FBFAFE] text-center " +
          "hover:border-[#D9D2E8]"
        }
        aria-label={ariaLabel}
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
        <p className="mt-4 text-base font-semibold text-[color:var(--pp-primary-950)]">{label}</p>
        <p className="mt-1 text-sm text-[#8B849C]">+{remaining}</p>
      </button>
    );
  }
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
  highlightQuery = "",
}: {
  treatment: Treatment;
  onOpen: () => void;
  highlightQuery?: string;
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
          <HighlightedText text={tx(treatment.name)} query={highlightQuery} />
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
  highlightQuery = "",
}: {
  p: CareProvider;
  specialty: Specialty;
  onSelect: () => void;
  highlightQuery?: string;
}) {
  const { tx } = useI18n();
  const kind = tx(kindLabel(p.kind));
  const availableSoon =
    p.nextAvailable === "Today" || p.nextAvailable === "Tomorrow" || p.nextAvailable === "In 2 days";
  const status = p.nextAvailable === "Today" ? tx("Available") : tx(p.nextAvailable);
  const feeAmount = p.consultationFee > 0 ? p.consultationFee : specialty.feeFrom;
  const feeCovered = feeAmount <= 0;
  const isDoctor = p.kind === "doctor";
  const nmc = nmcNumberOf(p);
  const hf = hfCodeFromId(p.id);
  const place = p.city;
  const meta = isDoctor ? `${p.subtitle || kind} • ${place}` : `${kind} • ${place}`;
  const detail = isDoctor
    ? feeCovered
      ? tx("Covered / OHIP")
      : formatFee(feeAmount)
    : p.hours || (feeCovered ? tx("Covered / OHIP") : formatFee(feeAmount));

  return (
    <DirectoryListingCard
      photo={p.imageUrl}
      photoObjectClass={isDoctor ? "object-cover object-[22%_12%]" : "object-cover object-[50%_40%]"}
      status={status}
      statusTone={availableSoon ? "wellness" : "muted"}
      summary={p.reviewCount > 0 ? ratingSummary(p.id, p.rating, p.reviewCount) : null}
      title={p.name}
      highlightQuery={highlightQuery}
      meta={meta}
      detail={detail}
      detailStrong={isDoctor && !feeCovered}
      cta={tx("View profile")}
      tag={nmc ? `#${nmc}` : hf ? `#${shortHfCode(hf)}` : undefined}
      onClick={onSelect}
    />
  );
}

function ServiceCard({
  service,
  onOpen,
  highlightQuery = "",
}: {
  service: HealthService;
  onOpen: () => void;
  highlightQuery?: string;
}) {
  const { tx } = useI18n();
  const kind = tx(healthServiceCategoryLabel(service.category));
  const detail =
    service.etaMinutes != null
      ? `~${service.etaMinutes} ${tx("min")}`
      : service.feeFrom != null && service.feeFrom > 0
        ? formatFee(service.feeFrom)
        : undefined;
  return (
    <DirectoryListingCard
      photo={SERVICE_PHOTOS[service.id] || pickPhoto(service.id, LAB_PHOTOS)}
      photoObjectClass="object-cover object-[50%_40%]"
      status={service.available24h ? tx("Available 24/7") : tx("Available")}
      title={tx(service.name)}
      highlightQuery={highlightQuery}
      meta={`${kind} • ${service.city}`}
      detail={detail}
      cta={tx("View profile")}
      onClick={onOpen}
    />
  );
}

function PharmacyCard({
  pharmacy,
  summary,
  ratingPending = false,
  highlightQuery = "",
  onOpen,
}: {
  pharmacy: AreaPharmacy;
  summary?: ReviewSummary;
  ratingPending?: boolean;
  highlightQuery?: string;
  onOpen: () => void;
}) {
  const { tx } = useI18n();
  const nepal = pharmacy.province === "NP";
  const place = nepal
    ? pharmacy.city || pharmacy.address
    : [pharmacy.city, pharmacy.distance].filter(Boolean).join(" • ");
  return (
    <DirectoryListingCard
      photo={PHARMACY_PHOTO}
      status={tx("Available")}
      summary={summary}
      ratingPending={ratingPending}
      title={pharmacy.name}
      highlightQuery={highlightQuery}
      meta={place ? `${tx("Pharmacy")} • ${place}` : tx("Pharmacy")}
      detail={pharmacy.hours || pharmacyHours()}
      cta={tx("Transfer prescription")}
      onClick={onOpen}
    />
  );
}

function LabCard({
  lab,
  onOpen,
  highlightQuery = "",
}: {
  lab: LabCentre;
  onOpen: () => void;
  highlightQuery?: string;
}) {
  const { tx } = useI18n();
  const availableSoon =
    lab.nextAvailable === "Today" || lab.nextAvailable === "Tomorrow" || lab.nextAvailable === "In 2 days";
  return (
    <DirectoryListingCard
      photo={labPhoto(lab.id)}
      photoObjectClass="object-cover object-[50%_40%]"
      status={lab.nextAvailable === "Today" ? tx("Available") : tx(lab.nextAvailable)}
      statusTone={availableSoon ? "wellness" : "muted"}
      summary={ratingSummary(lab.id, lab.rating, 1)}
      title={lab.name}
      highlightQuery={highlightQuery}
      meta={`${tx("Lab")} • ${lab.city}`}
      detail={lab.hours}
      cta={tx("View profile")}
      onClick={onOpen}
    />
  );
}

function CareWorkerCard({
  worker,
  onOpen,
  highlightQuery = "",
}: {
  worker: CareWorker;
  onOpen: () => void;
  highlightQuery?: string;
}) {
  const { tx } = useI18n();
  const availableSoon =
    worker.nextAvailable === "Today" ||
    worker.nextAvailable === "Tomorrow" ||
    worker.nextAvailable === "In 2 days";
  return (
    <DirectoryListingCard
      photo={worker.imageUrl || assistantPhoto(worker.id)}
      photoObjectClass="object-cover object-[22%_12%]"
      status={worker.nextAvailable === "Today" ? tx("Available") : tx(worker.nextAvailable)}
      statusTone={availableSoon ? "wellness" : "muted"}
      summary={ratingSummary(worker.id, worker.rating, 1)}
      title={worker.name}
      highlightQuery={highlightQuery}
      meta={`${tx(careWorkerKindLabel(worker.kind))} • ${worker.city}`}
      detail={formatFee(worker.feeFrom)}
      detailStrong
      cta={tx("View profile")}
      onClick={onOpen}
    />
  );
}

/* ── Your appointments ────────────────────────────────────── */

function YourAppointments({
  upcomingAppts,
  pastAppts,
  upcomingLabs,
  pastLabs,
  upcomingCare,
  pastCare,
  openRequests,
  pastRequests,
  onRefresh,
  onMessage,
  layout = "stack",
}: {
  upcomingAppts: Appointment[];
  pastAppts: Appointment[];
  upcomingLabs: LabBooking[];
  pastLabs: LabBooking[];
  upcomingCare: CareWorkerBooking[];
  pastCare: CareWorkerBooking[];
  openRequests: ServiceRequest[];
  pastRequests: ServiceRequest[];
  onRefresh: () => void;
  onMessage: () => void;
  layout?: "stack" | "aside";
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const railCol = useShellColumn("rail");
  const total =
    upcomingAppts.length + upcomingLabs.length + upcomingCare.length + openRequests.length;
  const pastRows = [
    ...pastAppts.map((a) => ({
      id: a.id,
      title: a.providerName || a.clinicianName,
      meta: [
        a.clinicianName && a.clinicianName !== a.providerName ? a.clinicianName : null,
        `${a.date} · ${a.time}`,
      ]
        .filter(Boolean)
        .join(" · "),
      status: visitPhase(a) === "missed" ? "not_attempted" : a.status,
      href: careEventHref("visit", a.id),
    })),
    ...pastLabs.map((b) => ({
      id: b.id,
      title: b.labName,
      meta: `${b.date} · ${b.time}`,
      status: b.status,
      href: careEventHref("lab", b.id),
    })),
    ...pastCare.map((b) => ({
      id: b.id,
      title: b.workerName,
      meta: `${b.date} · ${b.time}`,
      status: b.status,
      href: careEventHref("care", b.id),
    })),
    ...pastRequests.map((r) => ({
      id: r.id,
      title: r.serviceName,
      meta: r.confirmationNo,
      status: r.status,
      href: careEventHref("service", r.id),
    })),
  ].slice(0, 6);
  if (total === 0 && pastRows.length === 0) return null;

  const panel = (
    <>
      {total > 0 ? (
        <>
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
                badge={b.status === "pending" ? tx("Awaiting lab") : tx("Lab")}
                title={b.labName}
                subtitle={b.itemNames}
                meta={`${b.date} · ${b.time}`}
                fee={b.fee}
                confirmationNo={b.confirmationNo}
                awaiting={b.status === "pending"}
                onOpen={() => nav(careEventHref("lab", b.id))}
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
                badge={b.status === "pending" ? tx("Awaiting confirmation") : tx(careWorkerKindLabel(b.kind))}
                title={b.workerName}
                subtitle={b.service}
                meta={`${b.date} · ${b.time}`}
                fee={b.fee}
                confirmationNo={b.confirmationNo}
                awaiting={b.status === "pending"}
                onOpen={() => nav(careEventHref("care", b.id))}
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
                onOpen={() => nav(careEventHref("service", r.id))}
                onCancel={() => {
                  updateServiceRequestStatus(r.id, "cancelled");
                  onRefresh();
                }}
                onMessage={onMessage}
              />
            ))}
          </div>
        </>
      ) : null}

      {pastRows.length ? (
        <div className={total > 0 ? "mt-8" : undefined}>
          <div className="mb-4">
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx(total > 0 ? "Past visits" : "Your visits")}
            </h2>
          </div>
          <ul className="overflow-hidden rounded-2xl border border-line bg-white">
            {pastRows.map((row) => {
              const cancelled = row.status === "cancelled";
              const statusLabel =
                row.status === "cancelled"
                  ? tx("Cancelled")
                  : row.status === "completed"
                    ? tx("Completed")
                    : row.status === "not_attempted"
                      ? tx("Not attempted")
                      : tx("Past");
              return (
                <li key={row.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => nav(row.href)}
                    className={
                      "w-full px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)] " +
                      (cancelled ? "text-ink-tertiary line-through" : "")
                    }
                  >
                    <span
                      className={
                        "block truncate text-sm font-semibold " +
                        (cancelled ? "" : "text-[color:var(--pp-primary-950)]")
                      }
                    >
                      {row.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-tertiary">
                      {row.meta}
                      {!cancelled ? (
                        <>
                          <span className="mx-1.5 text-ink-tertiary/50">·</span>
                          {statusLabel}
                        </>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </>
  );

  return (
    <aside
      className={
        layout === "aside"
          ? "w-full shrink-0 lg:w-72 xl:w-80"
          : "mt-12 border-t border-line pt-8"
      }
      aria-label={tx("Your appointments")}
      onMouseEnter={layout === "aside" ? railCol.onMouseEnter : undefined}
    >
      {layout === "aside" ? <StickyChrome className={railCol.className}>{panel}</StickyChrome> : panel}
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
  onOpen,
  onCancel,
  onMessage,
  cancelLabel,
  awaiting,
}: {
  badge: string;
  title: string;
  subtitle: string;
  meta: string;
  fee?: number;
  confirmationNo: string;
  onOpen: () => void;
  onCancel: () => void;
  onMessage: () => void;
  cancelLabel?: string;
  awaiting?: boolean;
}) {
  const { tx } = useI18n();
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <span
            className={
              "inline-flex items-center rounded-full px-2.5 py-1 text-2xs font-semibold " +
              (awaiting ? "bg-info-subtle text-info" : "bg-wellness-subtle text-wellness")
            }
          >
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
      </button>
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
  const nav = useNavigate();
  const name = a.providerName || a.clinicianName;
  const kind = a.providerKind ? tx(kindLabel(a.providerKind)) : tx("Doctor");
  const provider = getProvider(a.providerId);
  const isVirtual = a.visitType === "virtual";
  const visitTo = `/appointments/visit/${a.id}`;

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white">
      <button type="button" onClick={() => nav(visitTo)} className="w-full text-left">
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-semibold " +
              (a.status === "pending"
                ? "bg-info-subtle text-info"
                : a.status === "unavailable"
                  ? "bg-warning-subtle text-warning"
                  : "bg-wellness-subtle text-wellness")
            }
          >
            {isVirtual ? (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                <path d="M2.5 4.25A1.75 1.75 0 0 1 4.25 2.5h5.5A1.75 1.75 0 0 1 11.5 4.25v7.5a1.75 1.75 0 0 1-1.75 1.75h-5.5A1.75 1.75 0 0 1 2.5 11.75v-7.5Zm10.03.72 1.72-1.146a.75.75 0 0 1 1.2.6v6.152a.75.75 0 0 1-1.2.6l-1.72-1.147V4.97Z" />
              </svg>
            ) : null}
            {a.status === "pending"
              ? tx(awaitingStatusLabel(a.providerKind))
              : a.status === "unavailable"
                ? tx("Needs a new slot")
                : tx("Upcoming")}
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
            <p className="mt-0.5 truncate text-sm text-ink-tertiary">
              {a.clinicianName && a.clinicianName !== a.providerName
                ? `${a.clinicianName} · ${tx(a.specialtyLabel)}`
                : tx(a.specialtyLabel)}
            </p>
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
      </button>

      <div className="flex flex-col items-stretch gap-3 px-5 py-4">
        <Button size="sm" fullWidth onClick={() => nav(visitTo)}>
          {tx("View visit")}
        </Button>
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
