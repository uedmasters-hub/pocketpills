import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
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
}: {
  provider: CareProvider;
  backTo?: string;
  backLabel?: string;
  sidebar?: ReactNode;
  hideAvailability?: boolean;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
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

  return (
    <div>
      <Link
        to={
          backTo
            ? backTo
            : facilityId
              ? `/appointments/provider/${facilityId}${specialtyId ? `?specialty=${specialtyId}` : ""}`
              : backToList(specialtyId)
        }
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ←{" "}
        {backLabel
          ? backLabel
          : facilityId
            ? tx("Back to facility")
            : specialty
              ? tx(specialty.label)
              : tx("Book an appointment")}
      </Link>

      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-10 lg:gap-y-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Hero */}
        <header className="min-w-0 overflow-hidden rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)] lg:col-start-1 lg:row-start-1">
          <div className="flex flex-col sm:min-h-[22rem] sm:flex-row sm:items-stretch">
            <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
              <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Doctor")}</p>
              <h1 className="mt-2 font-display text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-tight text-[color:var(--pp-primary-950)]">
                {provider.name}
              </h1>
              <p className="mt-2 text-base text-ink-secondary">{tx(provider.subtitle)}</p>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink-secondary">
                {tx(provider.bio)}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {provider.reviewCount > 0 ? (
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[color:var(--pp-primary-950)] shadow-sm">
                    ★ {provider.rating.toFixed(1)} · {provider.reviewCount} {tx("reviews")}
                  </span>
                ) : (
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[color:var(--pp-primary-950)] shadow-sm">
                    {tx("NMC registry")}
                  </span>
                )}
                {provider.distanceKm > 0 && (
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                    {formatDistance(provider.distanceKm)} {tx("away")}
                  </span>
                )}
                {provider.experienceYears != null && (
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                    {tx("{n}+ years").replace("{n}", String(provider.experienceYears))}
                  </span>
                )}
                {!hideAvailability && (
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                    {tx("Next")}: {next}
                  </span>
                )}
              </div>
            </div>
            <div className="relative mx-auto h-72 w-full max-w-[16rem] shrink-0 overflow-hidden sm:mx-0 sm:h-auto sm:w-[40%] sm:max-w-none lg:w-[38%]">
              <img
                src={provider.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
              />
              <span
                className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-[color:var(--pp-primary-200)] to-transparent sm:block"
                aria-hidden
              />
            </div>
          </div>
        </header>

        {/* Sticky booking column */}
        <aside className="space-y-3 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:sticky lg:top-28 lg:self-start">
          {sidebar ?? (
            <>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Book visit")}</p>
            <p className="mt-0.5 text-2xs text-ink-tertiary">
              {time
                ? `${dayLabel(days.find((d) => d.date === date) ?? { label: date })} · ${time} · ${tx(visitType === "virtual" ? "Virtual" : "In-clinic")}`
                : tx("Select a date and time below")}
            </p>

            <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
              <span>
                <span className="block text-2xs text-ink-tertiary">{tx("Consultation")}</span>
                <span className="font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                  {formatFee(fee)}
                </span>
              </span>
              <span className="rounded-full bg-wellness-subtle px-2.5 py-1 text-2xs font-semibold text-wellness">
                {next}
              </span>
            </div>

            <div className="mt-5 space-y-2">
              <Button fullWidth onClick={startBook} disabled={!date || !time}>
                {tx("Book appointment")}
              </Button>
              <Button fullWidth variant="secondary" onClick={() => nav("/messages")}>
                {tx("Message care team")}
              </Button>
            </div>
          </div>
          <p className="px-1 text-center text-2xs leading-relaxed text-ink-tertiary">
            {tx("Demo booking — no real visit is scheduled with a clinic.")}
          </p>
            </>
          )}
        </aside>

        {/* About */}
        <section className="min-w-0 lg:col-start-1 lg:row-start-2">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("About")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
            {tx(provider.about || provider.bio)}
          </p>
          {(provider.focusAreas?.length || provider.education?.length) && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {provider.focusAreas && provider.focusAreas.length > 0 && (
                <div className="rounded-2xl border border-line bg-white p-4">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                    {tx("Focus areas")}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {provider.focusAreas.map((a) => (
                      <li key={a} className="flex gap-2 text-sm text-[color:var(--pp-primary-950)]">
                        <span className="text-wellness" aria-hidden>✓</span>
                        {tx(a)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {provider.education && provider.education.length > 0 && (
                <div className="rounded-2xl border border-line bg-white p-4">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                    {tx("Education")}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {provider.education.map((e) => (
                      <li key={e} className="text-sm text-[color:var(--pp-primary-950)]">
                        {tx(e)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Availability — selectable virtual + in-clinic */}
        {!hideAvailability && (
        <section id="availability" className="min-w-0 scroll-mt-28 lg:col-start-1 lg:row-start-3">
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

        {/* Location / languages / affiliations */}
        <section className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-4">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("Details")}
          </h2>
          <dl className="overflow-hidden rounded-2xl border border-line bg-white">
            {[
              provider.id.startsWith("nmc-") && {
                k: tx("NMC number"),
                v: `#${provider.id.replace(/^nmc-/, "")}`,
              },
              provider.address && { k: tx("Location"), v: provider.address },
              provider.hours && { k: tx("Hours"), v: provider.hours },
              provider.phone && { k: tx("Phone"), v: provider.phone },
              { k: tx("Languages"), v: provider.languages.map((l) => tx(l)).join(", ") },
              {
                k: tx("Specialisations"),
                v: provider.specialties.map((s) => tx(specialtyById(s)?.label || s)).join(", "),
              },
            ]
              .filter(Boolean)
              .map((row, i) => {
                const r = row as { k: string; v: string };
                return (
                  <div
                    key={r.k}
                    className={"flex justify-between gap-4 px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}
                  >
                    <dt className="text-sm text-ink-tertiary">{r.k}</dt>
                    <dd className="max-w-[60%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">
                      {r.v}
                    </dd>
                  </div>
                );
              })}
          </dl>

          {facilities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[color:var(--pp-primary-950)]">
                {tx("Practices at")}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {facilities.map((f) => (
                  <Link
                    key={f.id}
                    to={`/appointments/provider/${f.id}${specialtyId ? `?specialty=${specialtyId}` : ""}`}
                    className="flex gap-3 overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:bg-[color:var(--state-hover)]"
                  >
                    <img src={f.imageUrl} alt="" className="h-20 w-24 shrink-0 object-cover" />
                    <span className="flex min-w-0 flex-col justify-center py-2 pr-3">
                      <span className="truncate font-semibold text-[color:var(--pp-primary-950)]">{f.name}</span>
                      <span className="mt-0.5 text-xs text-ink-tertiary">{tx(kindLabel(f.kind))}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
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
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const selected = services.find((s) => s.id === selectedServiceId) ?? null;

  const selectService = (s: FacilityService) => {
    setSelectedServiceId((cur) => (cur === s.id ? null : s.id));
  };

  const bookFacilityService = () => {
    if (!selected) return;
    if (selected.kind === "consult") {
      /* Scroll to consultants — booking happens after doctor pick */
      document.getElementById("consultants")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const openDoctor = (d: CareProvider) => {
    const qs = new URLSearchParams();
    if (specialtyId) qs.set("specialty", specialtyId);
    qs.set("facility", provider.id);
    if (selected) qs.set("service", selected.id);
    nav(`/appointments/provider/${d.id}?${qs.toString()}`);
  };

  return (
    <div>
      <Link
        to={backToList(specialtyId)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {specialty ? tx(specialty.label) : tx("Book an appointment")}
      </Link>

      <div
        className={
          "mt-5 grid items-start gap-8 lg:gap-x-10 lg:gap-y-8 " +
          (selected
            ? "lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]"
            : "lg:grid-cols-1")
        }
      >
        {/* Hero */}
        <header className="min-w-0 overflow-hidden rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)] lg:col-start-1 lg:row-start-1">
          <div className="flex flex-col sm:min-h-[16rem] sm:flex-row sm:items-stretch">
            <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
              <p className="pp-caps text-[color:var(--pp-violet)]">{tx(kindLabel(provider.kind))}</p>
              <h1 className="mt-2 font-display text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-tight text-[color:var(--pp-primary-950)]">
                {provider.name}
              </h1>
              <p className="mt-2 text-base text-ink-secondary">{tx(provider.subtitle)}</p>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-secondary">
                {tx(provider.bio)}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[color:var(--pp-primary-950)] shadow-sm">
                  ★ {provider.rating.toFixed(1)} · {provider.reviewCount} {tx("reviews")}
                </span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                  {formatDistance(provider.distanceKm)} {tx("away")}
                </span>
                {provider.hours && (
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                    {tx(provider.hours)}
                  </span>
                )}
              </div>
            </div>
            <div className="relative mx-auto h-48 w-full max-w-md shrink-0 overflow-hidden sm:mx-0 sm:h-auto sm:w-[44%] sm:max-w-none lg:w-[40%]">
              <img src={provider.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span
                className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-gradient-to-r from-[color:var(--pp-primary-200)] to-transparent sm:block"
                aria-hidden
              />
            </div>
          </div>
        </header>

        {/* Booking column — only after a service is selected */}
        {selected && (
          <aside className="space-y-3 lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Book service")}</p>
              <p className="mt-0.5 text-2xs text-ink-tertiary">{tx(selected.label)}</p>

              <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
                <span>
                  <span className="block text-2xs text-ink-tertiary">
                    {selected.feeFrom === 0 ? tx("Coverage") : tx("From")}
                  </span>
                  <span className="font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                    {formatFee(selected.feeFrom)}
                  </span>
                </span>
                <span className="rounded-full bg-[color:var(--pp-primary-100)] px-2.5 py-1 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                  {tx(serviceKindLabel(selected.kind))}
                </span>
              </div>

              <p className="mt-3 text-sm text-ink-secondary">{tx(selected.blurb)}</p>

              <div className="mt-5 space-y-2">
                {selected.kind === "consult" ? (
                  <>
                    <Button fullWidth onClick={bookFacilityService}>
                      {tx("Choose a consultant")}
                    </Button>
                    <p className="text-center text-2xs text-ink-tertiary">
                      {tx("Pick a doctor below to open their booking page.")}
                    </p>
                  </>
                ) : (
                  <Button fullWidth onClick={bookFacilityService}>
                    {tx("Book appointment")}
                  </Button>
                )}
                <Button fullWidth variant="ghost" onClick={() => setSelectedServiceId(null)}>
                  {tx("Change service")}
                </Button>
              </div>
            </div>
          </aside>
        )}

        {/* About */}
        <section className="min-w-0 lg:col-start-1 lg:row-start-2">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("About")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
            {tx(provider.about || provider.bio)}
          </p>
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

        {/* Services */}
        <section className="min-w-0 lg:col-start-1 lg:row-start-3">
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

        {/* Consultants */}
        <section id="consultants" className="min-w-0 scroll-mt-28 lg:col-start-1 lg:row-start-4">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("Consultants")}
          </h2>
          <p className="mt-1 text-sm text-ink-tertiary">
            {tx("Doctors and clinicians practicing at this {kind}.")
              .replace("{kind}", tx(kindLabel(provider.kind)).toLowerCase())}
          </p>
          {staff.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-ink-tertiary">
              {tx("No consultants listed yet.")}
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {staff.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => openDoctor(d)}
                  className="flex gap-3 overflow-hidden rounded-2xl border border-line bg-white p-3 text-left transition-colors hover:bg-[color:var(--state-hover)]"
                >
                  <img
                    src={d.imageUrl}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-xl object-cover object-top"
                  />
                  <span className="min-w-0 flex-1 py-0.5">
                    <span className="block font-semibold text-[color:var(--pp-primary-950)]">{d.name}</span>
                    <span className="mt-0.5 block text-xs text-ink-tertiary">{tx(d.subtitle)}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-tertiary">
                      <span className="font-semibold text-[color:var(--pp-violet)]">★ {d.rating.toFixed(1)}</span>
                      <span>·</span>
                      <span className="tnum">{formatFee(d.consultationFee)}</span>
                      <span>·</span>
                      <span>
                        {d.nextAvailable === "Today" ||
                        d.nextAvailable === "Tomorrow" ||
                        d.nextAvailable === "In 2 days"
                          ? tx(d.nextAvailable)
                          : d.nextAvailable}
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Facilities / amenities */}
        {provider.amenities && provider.amenities.length > 0 && (
          <section className="min-w-0 lg:col-start-1 lg:row-start-5">
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Facilities")}
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {provider.amenities.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-[color:var(--pp-primary-950)]"
                >
                  <span className="mt-0.5 text-wellness" aria-hidden>
                    ✓
                  </span>
                  {tx(item)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
