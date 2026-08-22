import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DetailMeta, DetailSection } from "@/components/DetailSection";
import { DoctorRelatedCard } from "@/components/doctor/DoctorDetailExtras";
import { useI18n } from "@/lib/i18n";
import {
  facilityCatalogue,
  facilityServiceHref,
  formatFee,
  kindLabel,
  listFacilityConsultants,
  serviceKindLabel,
  specialtyById,
  consultantAtFacilityHref,
  type CareProvider,
  type FacilityService,
} from "@/lib/appointments";
import { LAB_BUNDLES, LAB_TESTS } from "@/lib/labs";
import { fieldsMatchQuery, sortBySearchRank } from "@/lib/searchMatch";
import { defaultFacilitySpecialised, sanitizeSpecialisedIn } from "@/lib/specialisedIn";
import { SPECIALTY_SEARCH_TERMS } from "@/lib/specialtySearch";
import { useReviewSummaries } from "@/lib/useReviewSummaries";

/** 3×2 grid: five items plus a View all cell when more remain. */
const GRID_PAGE = 5;
const GRID_CLASS = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

const SERVICE_SEARCH_TERMS: Record<string, string[]> = {
  consult: ["consultant", "doctor", "physician", "clinic", "outpatient", "डाक्टर", "परामर्श"],
  lab: ["lab", "labs", "blood", "test", "requisition", "cbc", "laboratory", "diagnostic", "diagnostics", "imaging", "scan", "प्रयोगशाला", "रगत", "निदान"],
  rehab: ["rehab", "rehabilitation", "physio", "physiotherapy", "occupational", "speech", "recovery", "पुनर्स्थापना", "फिजियो"],
  emergency: ["emergency", "urgent", "er", "911", "crisis", "आकस्मिक", "आपतकालीन"],
  inward: ["bed", "admission", "inpatient", "ward", "stay", "बेड", "भर्ना"],
  surgery: ["surgery", "operation", "pre-op", "day surgery", "शल्यक्रिया"],
  ambulance: ["ambulance", "transport", "transfer", "paramedic", "एम्बुलेन्स"],
  imaging: ["imaging", "xray", "x-ray", "mri", "ct", "ultrasound", "scan", "एक्स-रे"],
  diagnostics: ["diagnostics", "diagnostic", "assessment", "निदान"],
  pharmacy: ["pharmacy", "pharmacist", "medicine", "medication", "prescription", "pickup", "refill", "फार्मेसी", "औषधि"],
  executive: [
    "medical executive",
    "executive",
    "corporate",
    "health check",
    "checkup",
    "package",
    "कार्यकारी",
    "मेडिकल एक्जिक्युटिभ",
  ],
};

function consultantMatches(doctor: CareProvider, query: string): boolean {
  const specLabels = doctor.specialties.map((id) => specialtyById(id)?.label || id);
  const aliases = doctor.specialties.flatMap((id) => SPECIALTY_SEARCH_TERMS[id] || []);
  return fieldsMatchQuery(
    [
      doctor.name,
      doctor.subtitle,
      doctor.city,
      doctor.bio,
      doctor.address,
      kindLabel(doctor.kind),
      ...doctor.languages,
      ...specLabels,
      ...aliases,
    ],
    query,
  );
}

function filterConsultants(doctors: CareProvider[], query: string): CareProvider[] {
  const needle = query.trim();
  if (!needle) return doctors;
  const hits = doctors.filter((d) => consultantMatches(d, needle));
  if (hits.length) {
    return sortBySearchRank(hits, needle, (d) => [d.name, d.subtitle, d.city, d.bio]);
  }
  if (fieldsMatchQuery(["consultant", "doctor", "physician", "परामर्श", "डाक्टर"], needle)) {
    return doctors;
  }
  return [];
}

function offerMatches(offer: ServiceOffer, query: string): boolean {
  const aliases = offer.kindId ? SERVICE_SEARCH_TERMS[offer.kindId] || [] : [];
  return fieldsMatchQuery([offer.kind, offer.title, offer.blurb, offer.kindId, ...aliases], query);
}

type ServiceOffer = {
  id: string;
  kind: string;
  kindId?: string;
  title: string;
  blurb: string;
  feeFrom: number;
  href: string;
};

function feeLabel(feeFrom: number, tx: (s: string) => string) {
  return feeFrom === 0 ? tx("Covered / from $0") : formatFee(feeFrom);
}

function catalogueOffer(facilityId: string, service: FacilityService): ServiceOffer {
  return {
    id: service.id,
    kind: serviceKindLabel(service.kind),
    kindId: service.kind,
    title: service.label,
    blurb: service.blurb,
    feeFrom: service.feeFrom,
    href: facilityServiceHref(facilityId, service.id),
  };
}

function consultantHref(doctorId: string, facilityId: string) {
  return consultantAtFacilityHref(doctorId, facilityId);
}

export function FacilityServiceOfferCard({ offer }: { offer: ServiceOffer }) {
  const { tx } = useI18n();
  return (
    <Link
      to={offer.href}
      className="flex h-full flex-col rounded-3xl border border-line bg-white p-5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
    >
      <span className="block text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
        {tx(offer.kind)}
      </span>
      <span className="mt-1 block font-semibold text-[color:var(--pp-primary-950)]">{tx(offer.title)}</span>
      <span className="mt-1 block flex-1 text-sm leading-relaxed text-ink-secondary">{tx(offer.blurb)}</span>
      <span className="mt-4 block text-sm font-semibold tnum text-[color:var(--pp-primary-950)]">
        {feeLabel(offer.feeFrom, tx)}
      </span>
    </Link>
  );
}

function ShowMoreCard({
  remaining,
  onClick,
  label,
}: {
  remaining: number;
  onClick: () => void;
  label?: string;
}) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? tx("View all")}
      className="flex h-full min-h-[11.25rem] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[color:var(--pp-primary-300)] bg-white px-3 py-6 text-center transition-colors hover:bg-[color:var(--state-hover)]"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-2xl font-medium leading-none text-[color:var(--pp-primary-950)]">
        +
      </span>
      <p className="mt-3 text-sm font-semibold text-[color:var(--pp-primary-950)]">{label ?? tx("View all")}</p>
      <p className="mt-0.5 text-sm text-ink-tertiary">+{remaining}</p>
    </button>
  );
}

export function ConsultantRosterGrid({
  facility,
  doctors,
  visible,
  onShowMore,
}: {
  facility: CareProvider;
  doctors: CareProvider[];
  visible: number;
  onShowMore: () => void;
}) {
  const { tx } = useI18n();
  const shown = doctors.slice(0, visible);
  const remaining = Math.max(0, doctors.length - shown.length);
  const ids = useMemo(() => doctors.map((d) => d.id), [doctors]);
  const { map: ratings } = useReviewSummaries("doctor", ids);

  if (!doctors.length) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-[color:var(--pp-primary-100)] px-5 py-8 text-center text-sm text-ink-tertiary">
        {tx("No consultants listed yet.")}
      </p>
    );
  }

  return (
    <div className={GRID_CLASS}>
      {shown.map((d) => (
        <DoctorRelatedCard
          key={d.id}
          item={d}
          summary={ratings[d.id] ?? null}
          to={consultantHref(d.id, facility.id)}
        />
      ))}
      {remaining > 0 ? <ShowMoreCard remaining={remaining} onClick={onShowMore} /> : null}
    </div>
  );
}

export function ConsultantServiceSection({
  provider,
  query = "",
}: {
  provider: CareProvider;
  query?: string;
}) {
  const { tx } = useI18n();
  const roster = useMemo(
    () => filterConsultants(listFacilityConsultants(provider.id), query),
    [provider.id, query],
  );
  const [visible, setVisible] = useState(GRID_PAGE);
  useEffect(() => {
    setVisible(GRID_PAGE);
  }, [query]);
  const remaining = Math.max(0, roster.length - Math.min(visible, roster.length));
  const consult = facilityCatalogue(provider).find((s) => s.kind === "consult");
  const showMore = () => setVisible(roster.length);

  if (!roster.length) {
    if (query.trim()) return null;
    return (
      <DetailSection
        id="hospital-doctors"
        title={tx("Consultant")}
        lede={consult ? tx(consult.blurb) : tx("Outpatient appointments with hospital-affiliated clinicians.")}
      >
        <p className="rounded-xl border border-dashed border-line bg-[color:var(--pp-primary-100)] px-5 py-8 text-center text-sm text-ink-tertiary">
          {tx("No consultants listed yet.")}
        </p>
      </DetailSection>
    );
  }

  return (
    <DetailSection
      id="hospital-doctors"
      title={tx("Consultant")}
      lede={consult ? tx(consult.blurb) : tx("Outpatient appointments with hospital-affiliated clinicians.")}
      meta={
        remaining > 0 ? (
          <button
            type="button"
            onClick={showMore}
            className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
          >
            {tx("{n} more").replace("{n}", String(remaining))}
          </button>
        ) : roster.length > GRID_PAGE ? (
          <DetailMeta>{tx("All shown")}</DetailMeta>
        ) : undefined
      }
    >
      <ConsultantRosterGrid
        facility={provider}
        doctors={roster}
        visible={visible}
        onShowMore={showMore}
      />
    </DetailSection>
  );
}

function testOffer(
  facilityId: string,
  serviceId: string,
  test: (typeof LAB_TESTS)[number],
): ServiceOffer {
  return {
    id: `${serviceId}-${test.id}`,
    kind: test.category,
    kindId: serviceId,
    title: test.name,
    blurb: test.description,
    feeFrom: test.covered || test.feeFrom === 0 ? 0 : test.feeFrom,
    href: facilityServiceHref(facilityId, serviceId),
  };
}

function diagnosticOffers(facilityId: string): ServiceOffer[] {
  return LAB_TESTS.map((t) => testOffer(facilityId, "lab", t));
}

function pharmacyOffers(facilityId: string): ServiceOffer[] {
  const href = facilityServiceHref(facilityId, "pharmacy");
  return [
    {
      id: "rx-dispensing",
      kind: "Pharmacy",
      kindId: "pharmacy",
      title: "Hospital pharmacy",
      blurb: "Pick up discharge and outpatient prescriptions on campus.",
      feeFrom: 0,
      href,
    },
    {
      id: "rx-counselling",
      kind: "Medication",
      kindId: "pharmacy",
      title: "Medication counselling",
      blurb: "Review doses, interactions, and how to take new prescriptions.",
      feeFrom: 0,
      href,
    },
    {
      id: "rx-refill",
      kind: "Medication",
      kindId: "pharmacy",
      title: "Refills & delivery",
      blurb: "Arrange a refill or have hospital-dispensed medication delivered.",
      feeFrom: 0,
      href,
    },
  ];
}

function rehabOffers(facilityId: string): ServiceOffer[] {
  const href = facilityServiceHref(facilityId, "rehab");
  return [
    {
      id: "rehab-physio",
      kind: "Rehabilitation",
      kindId: "rehab",
      title: "Physiotherapy",
      blurb: "Injury recovery, mobility, and post-surgical rehab.",
      feeFrom: 0,
      href,
    },
    {
      id: "rehab-ot",
      kind: "Rehabilitation",
      kindId: "rehab",
      title: "Occupational therapy",
      blurb: "Regain daily activities after illness, injury, or surgery.",
      feeFrom: 0,
      href,
    },
    {
      id: "rehab-speech",
      kind: "Rehabilitation",
      kindId: "rehab",
      title: "Speech therapy",
      blurb: "Speech, language, and swallowing support.",
      feeFrom: 0,
      href,
    },
  ];
}

function specializedOffers(provider: CareProvider): ServiceOffer[] {
  const surgery = facilityCatalogue(provider).find((s) => s.kind === "surgery");
  const cards: ServiceOffer[] = surgery ? [catalogueOffer(provider.id, surgery)] : [];
  const seen = new Set(cards.map((c) => c.title.toLowerCase()));
  const stored = sanitizeSpecialisedIn(provider.specialisedIn);
  const groups = stored.length
    ? stored
    : defaultFacilitySpecialised({
        name: provider.name,
        subtitle: provider.subtitle,
        specialties: provider.specialties,
        breadth: provider.kind === "clinic" ? "clinic" : "hospital",
      });
  for (const g of groups) {
    const name = g.specialty.trim();
    if (!name || /physician/i.test(name)) continue;
    if (seen.has(name.toLowerCase())) continue;
    if (surgery && /surg/i.test(name)) continue;
    seen.add(name.toLowerCase());
    cards.push({
      id: `spec-${name}`,
      kind: "Specialized",
      kindId: "surgery",
      title: name,
      blurb: g.procedures[0]
        ? `${g.procedures[0]} and related specialist care.`
        : `Specialist care in ${name}.`,
      feeFrom: 0,
      href: facilityServiceHref(provider.id, "consult"),
    });
  }
  return cards;
}

function packageOffers(provider: CareProvider): ServiceOffer[] {
  const exec = facilityCatalogue(provider).find((s) => s.kind === "executive");
  const labHref = facilityServiceHref(provider.id, "lab");
  const bundles: ServiceOffer[] = LAB_BUNDLES.map((b) => ({
    id: b.id,
    kind: "Package",
    kindId: "executive",
    title: b.name,
    blurb: b.description,
    feeFrom: b.covered || b.fee === 0 ? 0 : b.fee,
    href: labHref,
  }));
  return exec ? [catalogueOffer(provider.id, exec), ...bundles] : bundles;
}

function leftoverOffers(provider: CareProvider): ServiceOffer[] {
  return facilityCatalogue(provider)
    .filter((s) => s.kind === "ambulance")
    .map((s) => catalogueOffer(provider.id, s));
}

function filterSectionOffers(offers: ServiceOffer[], query: string, sectionTerms: string[]): ServiceOffer[] {
  const needle = query.trim();
  if (!needle) return offers;
  if (fieldsMatchQuery(sectionTerms, needle)) return offers;
  return sortBySearchRank(
    offers.filter((o) => offerMatches(o, needle)),
    needle,
    (o) => [o.title, o.kind, o.blurb],
  );
}

function PagedOfferSection({
  title,
  lede,
  offers,
  query,
  sectionTerms,
}: {
  title: string;
  lede: string;
  offers: ServiceOffer[];
  query: string;
  sectionTerms: string[];
}) {
  const filtered = useMemo(
    () => filterSectionOffers(offers, query, sectionTerms),
    [offers, query, sectionTerms],
  );
  const [visible, setVisible] = useState(GRID_PAGE);
  useEffect(() => {
    setVisible(GRID_PAGE);
  }, [query]);
  const remaining = Math.max(0, filtered.length - Math.min(visible, filtered.length));
  const showAll = () => setVisible(filtered.length);

  if (!filtered.length) return null;

  return (
    <OfferGridSection
      title={title}
      lede={lede}
      offers={filtered}
      visible={visible}
      remaining={remaining}
      onShowAll={showAll}
    />
  );
}

function OfferGridSection({
  title,
  lede,
  offers,
  visible,
  remaining,
  onShowAll,
}: {
  title: string;
  lede: string;
  offers: ServiceOffer[];
  visible: number;
  remaining: number;
  onShowAll: () => void;
}) {
  const { tx } = useI18n();
  const shown = offers.slice(0, visible);
  return (
    <DetailSection
      title={title}
      lede={lede}
      meta={
        remaining > 0 ? (
          <button
            type="button"
            onClick={onShowAll}
            className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
          >
            {tx("{n} more").replace("{n}", String(remaining))}
          </button>
        ) : offers.length > GRID_PAGE ? (
          <DetailMeta>{tx("All shown")}</DetailMeta>
        ) : undefined
      }
    >
      <div className={GRID_CLASS}>
        {shown.map((offer) => (
          <FacilityServiceOfferCard key={offer.id} offer={offer} />
        ))}
        {remaining > 0 ? <ShowMoreCard remaining={remaining} onClick={onShowAll} /> : null}
      </div>
    </DetailSection>
  );
}

/** Hospital booking detail: consultant, diagnostics, pharmacy, rehab, specialized care, packages. */
export function FacilityBookingServiceSections({
  provider,
  query = "",
  onClearQuery,
}: {
  provider: CareProvider;
  query?: string;
  onClearQuery?: () => void;
}) {
  const { tx } = useI18n();
  const needle = query.trim();
  const consultHits = useMemo(
    () => filterConsultants(listFacilityConsultants(provider.id), needle),
    [provider.id, needle],
  );
  const diagnostics = useMemo(() => diagnosticOffers(provider.id), [provider.id]);
  const pharmacy = useMemo(() => pharmacyOffers(provider.id), [provider.id]);
  const rehab = useMemo(() => rehabOffers(provider.id), [provider.id]);
  const specialized = useMemo(() => specializedOffers(provider), [provider]);
  const packages = useMemo(() => packageOffers(provider), [provider]);
  const leftover = useMemo(() => leftoverOffers(provider), [provider]);

  const hasHits =
    consultHits.length > 0 ||
    filterSectionOffers(diagnostics, needle, ["diagnostic", "diagnostics", "lab", "imaging"]).length > 0 ||
    filterSectionOffers(pharmacy, needle, ["pharmacy", "medication"]).length > 0 ||
    filterSectionOffers(rehab, needle, ["rehab", "rehabilitation", "physio"]).length > 0 ||
    filterSectionOffers(specialized, needle, ["specialized", "surgery"]).length > 0 ||
    filterSectionOffers(packages, needle, ["package", "packages", "executive"]).length > 0 ||
    filterSectionOffers(leftover, needle, ["other facilities", "ambulance"]).length > 0;

  if (needle && !hasHits) {
    return (
      <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("No matches")}</p>
        <p className="mt-1 text-sm text-ink-tertiary">
          {tx("Try another symptom, specialty, pharmacy, lab, or service name.")}
        </p>
        {onClearQuery ? (
          <button
            type="button"
            onClick={onClearQuery}
            className="mt-4 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
          >
            {tx("Clear search")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConsultantServiceSection provider={provider} query={needle} />
      <PagedOfferSection
        title={tx("Diagnostic Services")}
        lede={tx("Laboratory, imaging, and diagnostic testing with requisition.")}
        offers={diagnostics}
        query={needle}
        sectionTerms={["diagnostic", "diagnostics", "lab", "imaging", "scan"]}
      />
      <PagedOfferSection
        title={tx("Pharmacy & Medication")}
        lede={tx("Hospital pharmacy, counselling, and discharge prescriptions.")}
        offers={pharmacy}
        query={needle}
        sectionTerms={["pharmacy", "medication", "medicine", "prescription"]}
      />
      <PagedOfferSection
        title={tx("Rehabilitation")}
        lede={tx("Physiotherapy and recovery programmes after illness or surgery.")}
        offers={rehab}
        query={needle}
        sectionTerms={["rehab", "rehabilitation", "physio", "physiotherapy"]}
      />
      <PagedOfferSection
        title={tx("Specialized Care")}
        lede={tx("Surgery and specialist programmes at this hospital.")}
        offers={specialized}
        query={needle}
        sectionTerms={["specialized", "specialised", "surgery", "specialist"]}
      />
      <PagedOfferSection
        title={tx("Health Packages")}
        lede={tx("Executive medicals and bundled screening packages.")}
        offers={packages}
        query={needle}
        sectionTerms={["package", "packages", "executive", "wellness"]}
      />
      <PagedOfferSection
        title={tx("Other facilities")}
        lede={tx("Ambulance and other hospital services.")}
        offers={leftover}
        query={needle}
        sectionTerms={["other facilities", "ambulance"]}
      />
    </div>
  );
}
