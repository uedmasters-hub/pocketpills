import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  kindLabel,
  listProviders,
  type CareProvider,
} from "@/lib/appointments";
import { DoctorRelatedCard } from "@/components/doctor/DoctorDetailExtras";
import { listPublishedNmcProviders } from "@/lib/doctorDirectory";
import { nmcNumberOf, providerProfileHref } from "@/lib/doctorProfileContent";
import {
  displayFacilityLevel,
  displayFacilityName,
  listPublishedFacilityClaims,
  vendorFromFacilityLevel,
  type FacilityClaim,
} from "@/lib/facilityDirectory";
import { useReviewSummaries } from "@/lib/useReviewSummaries";
import type { ReviewKind, ReviewSummary } from "@/lib/reviewsApi";

const H2 = "font-display text-xl font-medium text-[color:var(--pp-primary-950)]";

const HOSPITAL_PHOTOS = [
  "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=640&h=400&fit=crop",
];
const CLINIC_PHOTOS = [
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=640&h=400&fit=crop",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=640&h=400&fit=crop",
];

type TabId = "hospital" | "clinic" | "doctor";

type RelatedCardItem = {
  id: string;
  href: string;
  name: string;
  meta: string;
  place: string;
  imageUrl: string;
  reviewKind: ReviewKind;
  subjectId: string;
};

const TABS: { id: TabId; label: string }[] = [
  { id: "hospital", label: "Hospitals" },
  { id: "clinic", label: "Clinics" },
  { id: "doctor", label: "Doctors" },
];

function placeKey(value?: string) {
  return (value || "").toLowerCase().split(",")[0]?.trim() || "";
}

function samePlace(a?: string, b?: string) {
  const x = placeKey(a);
  const y = placeKey(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

function pickNearby<T>(items: T[], city: string | undefined, locationOf: (item: T) => string, limit = 3) {
  const pool = city ? items.filter((item) => samePlace(city, locationOf(item))) : items;
  return pool.slice(0, limit);
}

function photoFor(kind: "hospital" | "clinic", seed: string) {
  const pool = kind === "hospital" ? HOSPITAL_PHOTOS : CLINIC_PHOTOS;
  let n = 0;
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i) * (i + 1);
  return pool[n % pool.length];
}

function isExcluded(id: string, excludeId?: string, excludeHfCode?: string) {
  if (excludeId && (id === excludeId || id === `hf-${excludeId}`)) return true;
  if (excludeHfCode && (id === excludeHfCode || id === `hf-${excludeHfCode}`)) return true;
  return false;
}

function fromClaim(claim: FacilityClaim, kind: "hospital" | "clinic"): RelatedCardItem {
  const level = displayFacilityLevel(claim.facilityLevel) || (kind === "hospital" ? "Hospital" : "Clinic");
  return {
    id: `hf-${claim.hfCode}`,
    href: `/facilities/${claim.hfCode}`,
    name: displayFacilityName(claim.name),
    meta: [level, claim.district].filter(Boolean).join(" • "),
    place: claim.district,
    imageUrl: photoFor(kind, claim.hfCode),
    reviewKind: "facility",
    subjectId: claim.hfCode,
  };
}

function fromProvider(provider: CareProvider): RelatedCardItem {
  const hf = provider.id.startsWith("hf-") ? provider.id.replace(/^hf-/, "") : "";
  return {
    id: provider.id,
    href: providerProfileHref(provider),
    name: provider.name,
    meta: [kindLabel(provider.kind), provider.city].filter(Boolean).join(" • "),
    place: provider.city,
    imageUrl: provider.imageUrl,
    reviewKind: "facility",
    subjectId: hf || provider.id,
  };
}

function collectFacilities(
  kind: "hospital" | "clinic",
  city: string | undefined,
  excludeId?: string,
  excludeHfCode?: string,
): RelatedCardItem[] {
  const claims = listPublishedFacilityClaims()
    .filter((c) => vendorFromFacilityLevel(c.facilityLevel) === kind)
    .filter((c) => !isExcluded(c.hfCode, excludeId, excludeHfCode))
    .map((c) => fromClaim(c, kind));
  const hub = listProviders()
    .filter((p) => p.kind === kind)
    .filter((p) => !isExcluded(p.id, excludeId, excludeHfCode))
    .map(fromProvider);
  const seen = new Set<string>();
  const merged: RelatedCardItem[] = [];
  for (const row of [...claims, ...hub]) {
    if (seen.has(row.id) || seen.has(row.href)) continue;
    seen.add(row.id);
    seen.add(row.href);
    merged.push(row);
  }
  return pickNearby(merged, city, (row) => row.place);
}

function collectDoctors(city: string | undefined, excludeId?: string): CareProvider[] {
  const rows = listPublishedNmcProviders().filter((d) => !isExcluded(d.id, excludeId));
  return pickNearby(rows, city, (d) => d.city);
}

function RatingBadge({ summary }: { summary?: ReviewSummary }) {
  if (!summary || summary.count < 1) return null;
  return (
    <span
      className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[color:var(--pp-primary-950)] shadow-[0_1px_4px_rgba(24,7,48,0.08)] tnum"
      aria-label={`${summary.average.toFixed(1)} out of 5`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <path d="M12 3.6 14.6 9l6 .9-4.3 4.2 1 5.9L12 17.3 6.7 20l1-5.9L3.4 9.9 9.4 9 12 3.6Z" fill="var(--pp-violet)" />
      </svg>
      {summary.average.toFixed(1)}
    </span>
  );
}

function OptionCard({
  item,
  summary,
}: {
  item: RelatedCardItem;
  summary?: ReviewSummary;
}) {
  const { tx } = useI18n();
  return (
    <Link
      to={item.href}
      className="relative flex h-[11.25rem] w-full overflow-hidden rounded-2xl border border-line bg-white"
    >
      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between px-5 py-5 pr-6">
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold leading-snug text-[color:var(--pp-primary-950)]">{item.name}</p>
          {item.meta ? <p className="mt-1 truncate text-sm text-ink-tertiary">{item.meta}</p> : null}
        </div>
        <span className="mt-auto pt-3 text-sm font-medium text-[color:var(--pp-violet)]">
          {tx("View profile")} →
        </span>
      </div>
      <div className="relative w-[44%] min-w-[7.5rem] shrink-0 self-stretch">
        <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white via-white/80 to-transparent" />
        <RatingBadge summary={summary} />
      </div>
    </Link>
  );
}

export function RelatedHealthcareOptions({
  city,
  excludeId,
  excludeHfCode,
}: {
  city?: string;
  excludeId?: string;
  excludeHfCode?: string;
}) {
  const { tx } = useI18n();
  const hospitals = useMemo(
    () => collectFacilities("hospital", city, excludeId, excludeHfCode),
    [city, excludeId, excludeHfCode],
  );
  const clinics = useMemo(
    () => collectFacilities("clinic", city, excludeId, excludeHfCode),
    [city, excludeId, excludeHfCode],
  );
  const doctors = useMemo(() => collectDoctors(city, excludeId), [city, excludeId]);

  const facilityByTab: Record<"hospital" | "clinic", RelatedCardItem[]> = {
    hospital: hospitals,
    clinic: clinics,
  };
  const available = TABS.filter((tab) => (tab.id === "doctor" ? doctors.length : facilityByTab[tab.id].length));
  const [tab, setTab] = useState<TabId>(available[0]?.id ?? "hospital");
  const active: TabId =
    tab === "doctor"
      ? doctors.length
        ? "doctor"
        : available[0]?.id ?? "hospital"
      : facilityByTab[tab]?.length
        ? tab
        : available[0]?.id ?? "hospital";

  const facilityIds = useMemo(
    () => [...hospitals, ...clinics].map((row) => row.subjectId),
    [hospitals, clinics],
  );
  const doctorIds = useMemo(
    () => doctors.map((d) => nmcNumberOf(d) || d.id.replace(/^nmc-/, "")),
    [doctors],
  );
  const facilityRatings = useReviewSummaries("facility", facilityIds);
  const doctorRatings = useReviewSummaries("doctor", doctorIds);

  if (!available.length) return null;

  return (
    <section className="min-w-0 scroll-mt-28">
      <h2 className={H2}>{tx("Related healthcare options")}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-1" role="tablist" aria-label={tx("Related healthcare options")}>
        {available.map((item) => {
          const on = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(item.id)}
              className={
                "rounded-full px-4 py-2 text-sm transition-colors " +
                (on
                  ? "bg-white font-medium text-[color:var(--pp-primary-950)] shadow-[0_1px_2px_rgba(24,7,48,0.06)]"
                  : "text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
              }
            >
              {tx(item.label)}
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active === "doctor"
          ? doctors.map((d) => {
              const id = nmcNumberOf(d) || d.id.replace(/^nmc-/, "");
              const summary = doctorRatings.map[id];
              return (
                <DoctorRelatedCard
                  key={d.id}
                  item={d}
                  summary={summary}
                />
              );
            })
          : facilityByTab[active].map((item) => (
              <OptionCard key={item.id} item={item} summary={facilityRatings.map[item.subjectId]} />
            ))}
      </div>
    </section>
  );
}
