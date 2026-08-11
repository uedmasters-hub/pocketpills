import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  SPECIALTIES,
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

type KindFilter = "all" | ProviderKind;

export function Appointments() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<KindFilter>("all");
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);

  const specialtyParam = params.get("specialty");
  const specialtyId = isSpecialtyId(specialtyParam) ? specialtyParam : null;
  const specialty = specialtyId ? specialtyById(specialtyId) : undefined;

  const providers = useMemo(
    () =>
      specialtyId
        ? filterProviders({ kind, query: q, specialtyId, sortByDistance: true })
        : [],
    [kind, q, specialtyId],
  );

  const allAppts = useMemo(() => getAppointments(), [tick]);
  const upcoming = allAppts.filter((a) => a.status === "upcoming" && !appointmentIsPast(a));

  const refresh = () => setTick((n) => n + 1);

  const selectSpecialty = (id: SpecialtyId) => {
    setKind("all");
    setQ("");
    setParams({ specialty: id });
  };

  const clearSpecialty = () => setParams({});

  const openDetail = (p: CareProvider) => {
    const qs = specialtyId ? `?specialty=${encodeURIComponent(specialtyId)}` : "";
    nav(`/appointments/provider/${p.id}${qs}`);
  };

  return (
    <div>
      <header className="mb-6">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Care")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          {tx("Book an appointment")}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-ink-secondary">
          {specialty
            ? tx("Nearest doctors, clinics, and hospitals for {specialty}.")
                .replace("{specialty}", tx(specialty.label))
            : tx("Choose a specialisation to see nearby doctors, clinics, and hospitals.")}
        </p>
      </header>

      {!specialty ? (
        <>
          <section aria-label={tx("Specialisations")}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                {tx("Specialisations")}
              </h2>
              <p className="text-sm text-ink-tertiary">{tx("Swipe to see more")}</p>
            </div>
            <div className="pp-scroll -mx-1 flex gap-0 overflow-x-auto px-1 pb-2">
              {SPECIALTIES.map((s, i) => (
                <SpecialtyCard
                  key={s.id}
                  specialty={s}
                  showDivider={i < SPECIALTIES.length - 1}
                  onConsult={() => selectSpecialty(s.id)}
                />
              ))}
            </div>
          </section>

          <YourAppointments
            upcoming={upcoming}
            onRefresh={refresh}
            onMessage={() => nav("/messages")}
            emptyHint={tx("Pick a specialisation above to book a visit.")}
          />
        </>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={clearSpecialty}
              className="text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-70"
            >
              ‹ {tx("All specialisations")}
            </button>
            <span className="text-ink-tertiary">·</span>
            <span className="rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-sm font-semibold text-[color:var(--pp-primary-950)]">
              {tx(specialty.label)}
            </span>
            <span className="text-sm text-ink-tertiary">
              {tx("From {fee}").replace("{fee}", formatFee(specialty.feeFrom))}
            </span>
          </div>

          <div className="mb-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tx("Search by name or city…")}
              aria-label={tx("Search providers")}
              className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink placeholder:text-ink-tertiary focus:border-primary"
            />
          </div>

          <div
            className="pp-scroll -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1"
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
                      : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {providers.map((p) => (
                <ProviderCard key={p.id} p={p} specialty={specialty} onSelect={() => openDetail(p)} />
              ))}
            </div>
          )}

          <YourAppointments
            upcoming={upcoming}
            onRefresh={refresh}
            onMessage={() => nav("/messages")}
            emptyHint={tx("Book from a card above to see your visits here.")}
          />
        </>
      )}
    </div>
  );
}

/* ── Specialty carousel (reference-style) ─────────────────── */

function SpecialtyCard({
  specialty,
  showDivider,
  onConsult,
}: {
  specialty: Specialty;
  showDivider: boolean;
  onConsult: () => void;
}) {
  const { tx } = useI18n();
  return (
    <div
      className={
        "relative flex w-[9.5rem] shrink-0 flex-col items-center px-3 py-2 sm:w-[10.5rem] " +
        (showDivider ? "border-r border-line/70" : "")
      }
    >
      <div
        className="grid h-[5.5rem] w-[5.5rem] place-items-center rounded-full sm:h-24 sm:w-24"
        style={{ backgroundColor: specialty.accent }}
        aria-hidden
      >
        <SpecialtyIcon id={specialty.id} />
      </div>
      <p className="mt-3 min-h-[2.5rem] text-center text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">
        {tx(specialty.label)}
      </p>
      <p className="mt-1 text-sm text-ink-tertiary tnum">{formatFee(specialty.feeFrom)}</p>
      <button
        type="button"
        onClick={onConsult}
        className="mt-2 inline-flex items-center gap-0.5 text-sm font-semibold text-[color:var(--pp-violet)] transition-opacity hover:opacity-70"
      >
        {tx("Consult now")}
        <span aria-hidden>›</span>
      </button>
    </div>
  );
}

function SpecialtyIcon({ id }: { id: SpecialtyId }) {
  const common = "h-12 w-12 text-[color:var(--pp-primary-950)]/80";
  switch (id) {
    case "gynae":
      return (
        <svg viewBox="0 0 48 48" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="24" cy="14" r="6" />
          <path d="M16 40c2-8 6-12 8-12s6 4 8 12" />
          <path d="M20 28h8M24 28v6" />
          <ellipse cx="24" cy="36" rx="7" ry="3" opacity=".35" />
        </svg>
      );
    case "sexual":
      return (
        <svg viewBox="0 0 48 48" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="18" cy="22" r="7" />
          <circle cx="30" cy="22" r="7" />
          <path d="M18 29v8M14 33h8" />
          <path d="M30 15V9M27 12h6" />
        </svg>
      );
    case "general":
      return (
        <svg viewBox="0 0 48 48" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M18 14h12v6a6 6 0 0 1-12 0v-6Z" />
          <path d="M16 18H10a4 4 0 0 0 0 8h6M32 18h6a4 4 0 0 1 0 8h-6" />
          <circle cx="24" cy="34" r="4" />
        </svg>
      );
    case "skin":
      return (
        <svg viewBox="0 0 48 48" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M28 10c6 4 10 10 10 18 0 8-6 14-14 14S10 36 10 28c0-6 3-11 8-14" />
          <circle cx="22" cy="24" r="1.5" fill="currentColor" />
          <circle cx="28" cy="28" r="1.5" fill="currentColor" />
          <circle cx="20" cy="30" r="1.2" fill="currentColor" />
        </svg>
      );
    case "mental":
      return (
        <svg viewBox="0 0 48 48" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M14 30c0-8 5-14 10-14s10 6 10 14c0 4-2 7-5 9H19c-3-2-5-5-5-9Z" />
          <path d="M30 16c2-1 5-1 7 1 1 2 1 4-1 6l-4 3" />
          <path d="M33 20h4M35 18v4" />
        </svg>
      );
    case "digestive":
      return (
        <svg viewBox="0 0 48 48" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M22 8v10c-6 2-10 7-10 14 0 6 5 10 12 10s12-4 12-10c0-7-4-12-10-14V8" />
          <path d="M22 22c2 3 4 4 6 4" opacity=".5" />
        </svg>
      );
    case "chronic":
      return (
        <svg viewBox="0 0 48 48" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M8 28h8l4-10 6 16 4-8h10" />
          <circle cx="24" cy="12" r="3" />
        </svg>
      );
    case "urgent":
      return (
        <svg viewBox="0 0 48 48" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M24 8v32M16 16h16M16 32h16" />
          <circle cx="24" cy="24" r="14" />
        </svg>
      );
    default:
      return null;
  }
}

/* ── Provider cards (treatment-card aesthetic) ─────────────── */

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
  const next =
    p.nextAvailable === "Today" || p.nextAvailable === "Tomorrow" || p.nextAvailable === "In 2 days"
      ? tx(p.nextAvailable)
      : p.nextAvailable;
  const feeAmount = p.consultationFee > 0 ? p.consultationFee : specialty.feeFrom;
  const feeCovered = feeAmount <= 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "group flex flex-col overflow-hidden rounded-2xl border border-line bg-white text-left " +
        "transition-colors hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)]"
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
          {next}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-2xs font-semibold text-[color:var(--pp-primary-950)] shadow-sm backdrop-blur-sm">
          {formatDistance(p.distanceKm)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="pp-caps text-[color:var(--pp-violet)]">{kind}</p>
        <h3 className="mt-1.5 font-display text-xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {p.name}
        </h3>
        <p className="mt-1 text-sm text-ink-tertiary">{tx(p.subtitle)}</p>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-secondary">
          {tx(p.bio)}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
          <p className="text-sm text-ink-secondary">
            {feeCovered ? (
              tx("Covered / OHIP")
            ) : (
              <>
                {tx("From")}{" "}
                <span className="font-semibold text-[color:var(--pp-primary-950)] tnum">
                  {formatFee(feeAmount)}
                </span>
              </>
            )}
          </p>
          <p className="shrink-0 text-sm font-medium text-[color:var(--pp-primary-950)]">
            ★ {p.rating.toFixed(1)}
          </p>
        </div>
      </div>
    </button>
  );
}

/* ── Your appointments ────────────────────────────────────── */

function YourAppointments({
  upcoming,
  onRefresh,
  onMessage,
  emptyHint,
}: {
  upcoming: Appointment[];
  onRefresh: () => void;
  onMessage: () => void;
  emptyHint: string;
}) {
  const { tx } = useI18n();
  return (
    <section className="mt-12 border-t border-line pt-8">
      <div className="mb-4">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Your appointments")}
        </h2>
        <p className="mt-1 text-sm text-ink-tertiary">
          {upcoming.length === 0
            ? tx("No upcoming visits yet.")
            : tx("{n} upcoming").replace("{n}", String(upcoming.length))}
        </p>
      </div>

      {upcoming.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-ink-tertiary">
          {emptyHint}
        </p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((a) => (
            <ApptCard
              key={a.id}
              a={a}
              onCancel={() => {
                updateAppointmentStatus(a.id, "cancelled");
                onRefresh();
              }}
              onComplete={() => {
                updateAppointmentStatus(a.id, "completed");
                onRefresh();
              }}
              onMessage={onMessage}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ApptCard({
  a,
  onCancel,
  onComplete,
  onMessage,
}: {
  a: Appointment;
  onCancel: () => void;
  onComplete: () => void;
  onMessage: () => void;
}) {
  const { tx } = useI18n();
  const name = a.providerName || a.clinicianName;
  const kind = a.providerKind ? tx(kindLabel(a.providerKind)) : tx("Doctor");
  const provider = getProvider(a.providerId);

  return (
    <article className="flex gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      {provider && (
        <img
          src={provider.imageUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover object-top"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{kind}</p>
            <p className="mt-0.5 font-semibold text-[color:var(--pp-primary-950)]">{name}</p>
            <p className="mt-0.5 text-sm text-ink-tertiary">
              {tx(a.specialtyLabel)} ·{" "}
              {tx(a.visitType === "virtual" ? "Virtual visit" : "In-clinic visit")}
            </p>
            <p className="mt-2 text-sm font-medium text-[color:var(--pp-primary-950)]">
              {a.date} · {a.time}
              {a.fee != null && a.fee > 0 ? ` · ${formatFee(a.fee)}` : ""}
            </p>
            <p className="mt-1 font-mono text-2xs text-ink-tertiary">{a.confirmationNo}</p>
          </div>
          <span className="rounded-full bg-wellness-subtle px-2.5 py-1 text-2xs font-semibold text-wellness">
            {tx("Upcoming")}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={onMessage}>
            {tx("Message care team")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onComplete}>
            {tx("Mark completed")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            {tx("Cancel appointment")}
          </Button>
        </div>
      </div>
    </article>
  );
}
