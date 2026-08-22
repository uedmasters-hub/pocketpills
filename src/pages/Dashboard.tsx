import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { DetailMeta, DetailSection } from "@/components/DetailSection";
import { useUser } from "@/lib/user";
import { treatments, type Treatment } from "@/lib/data";
import { pendingRows } from "@/lib/profile";
import { appointmentIsPast, getAppointments } from "@/lib/appointments";
import { mergeActiveOrders, statusMeta, typeMeta } from "@/lib/orders";
import { careEventHref } from "@/lib/careJourney";
import { monthDayShort } from "@/lib/timeSlots";
import { useI18n } from "@/lib/i18n";

/* ── shared bits ───────────────────────────────────────── */
function ArrowBtn({
  dir,
  onClick,
  disabled = false,
}: {
  dir: "l" | "r";
  onClick: () => void;
  disabled?: boolean;
}) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "l" ? tx("Previous") : tx("Next")}
      className={
        "rounded-full bg-[color:var(--pp-primary-100)] p-1 text-[color:var(--pp-primary-950)] transition-colors " +
        (disabled ? "cursor-default opacity-40" : "hover:bg-[color:var(--pp-primary-200)]")
      }
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ transform: dir === "l" ? "rotate(180deg)" : undefined }} aria-hidden>
        <path d="M9.58902 6.22528C9.29923 6.52124 9.30422 6.99609 9.60018 7.28588L14.4529 12.0375L9.60018 16.7891C9.30422 17.0789 9.29922 17.5538 9.58902 17.8497C9.87881 18.1457 10.3537 18.1507 10.6496 17.8609L16.0496 12.5734C16.1937 12.4323 16.2749 12.2391 16.2749 12.0375C16.2749 11.8359 16.1937 11.6427 16.0496 11.5016L10.6496 6.21412C10.3537 5.92432 9.87881 5.92932 9.58902 6.22528Z" fill="currentColor" />
      </svg>
    </button>
  );
}

/** Filled circle arrow used inside promo cards. */
function FilledArrow() {
  return (
    <svg width="21" height="20" viewBox="0 0 21 20" fill="none" aria-hidden>
      <circle cx="10.5" cy="10" r="10" fill="var(--pp-primary-950)" />
      <path d="M7.0134 9.47545H12.748L10.2427 6.9028C10.0424 6.6972 10.0424 6.3598 10.2427 6.1542C10.4429 5.9486 10.7663 5.9486 10.9665 6.1542L14.3498 9.62834C14.5501 9.83394 14.5501 10.1661 14.3498 10.3717L10.9665 13.8458C10.7663 14.0514 10.4429 14.0514 10.2427 13.8458C10.0424 13.6402 10.0424 13.3081 10.2427 13.1025L12.748 10.5298H7.0134C6.73103 10.5298 6.5 10.2926 6.5 10.0026C6.5 9.71269 6.73103 9.47545 7.0134 9.47545Z" fill="white" />
    </svg>
  );
}

const DASH_IMG = "https://static.pocketpills.com/webapp";
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; };

interface Promo {
  badge: string;
  t: string;
  d: string;
  /** Price / savings hook shown next to the CTA arrow. */
  offer?: string;
  /** Short trust line under the CTA (e.g. Free delivery · Cancel anytime). */
  persuasion: string;
  img: string;
  to: string;
  /** Violet treatment tone (birth control etc.). */
  brand?: boolean;
}

const PROMOS: Promo[] = [
  {
    badge: "Free assessment",
    t: "Get Your Birth Control Online",
    d: "Start a free online assessment to get a prescription — no clinic visit.",
    offer: "Covered by most plans",
    persuasion: "Doctor-led · Ships free · Pause anytime",
    img: `${DASH_IMG}/img/minor-ailment-bc.svg`,
    to: "/appointments/treatments/birth-control",
    brand: true,
  },
  {
    badge: "Save 50%",
    t: "Save 50% on your weight loss journey",
    d: "Brand-name Ozempic at a generic price, with pharmacist support.",
    offer: "Get it at $139!",
    persuasion: "Limited-time price · Free standard delivery",
    img: `${DASH_IMG}/images/dashboard/weight-loss-doctor.png`,
    to: "/drug/ozempic",
  },
  {
    badge: "First month $39",
    t: "Hair loss care that actually works",
    d: "Clinically proven treatments prescribed online by Canadian doctors.",
    offer: "Start from $39/mo",
    persuasion: "Discreet packaging · Results in 3–6 months",
    img: `${DASH_IMG}/images/dashboard/hair-loss-card.webp`,
    to: "/appointments",
  },
  {
    badge: "Private & discreet",
    t: "ED treatment, simplified",
    d: "Easy consults, expert care, and same-day delivery in select cities.",
    offer: "Consult from $0",
    persuasion: "Plain packaging · Ships to your door",
    img: `${DASH_IMG}/images/dashboard/ed-card.webp`,
    to: "/appointments",
  },
];

const TREAT_CARD =
  "relative flex aspect-[4/5] flex-col overflow-hidden rounded-2xl text-left transition-transform";
const TREAT_CARD_RAIL =
  TREAT_CARD + " w-[calc((100%-1rem)/2)] shrink-0 sm:w-[calc((100%-3rem)/4)]";
const TREAT_CARD_GRID = TREAT_CARD + " w-full";
const TREAT_CARD_BG = {
  backgroundImage: "linear-gradient(180deg,#FFFFFF 0%,#FAF9FE 42%,#E7E2F7 100%)",
} as const;
const TREAT_GRID = "grid grid-cols-2 gap-4 sm:grid-cols-4";
/** Collapsed rail: 7 treatments + View more. */
const TREAT_COLLAPSED = 7;

function RailHeader({
  title,
  showArrows = true,
  extra,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: {
  title?: string;
  showArrows?: boolean;
  extra?: ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      {title ? <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">{title}</h2> : <span />}
      <div className="flex items-center gap-3">
        {extra}
        {showArrows ? (
          <div className="flex gap-2">
            <ArrowBtn dir="l" onClick={() => onPrev?.()} disabled={prevDisabled} />
            <ArrowBtn dir="r" onClick={() => onNext?.()} disabled={nextDisabled} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TreatmentDashCard({
  treatment,
  onOpen,
  className = TREAT_CARD_RAIL,
}: {
  treatment: Treatment;
  onOpen: () => void;
  className?: string;
}) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className={className}
      style={TREAT_CARD_BG}
    >
      <p className="relative z-10 px-5 pt-5 font-display text-xl font-normal leading-tight text-[color:var(--pp-primary-950)]">
        {tx(treatment.name)}
      </p>
      {treatment.img ? (
        <img
          src={treatment.img}
          alt=""
          loading="lazy"
          onError={hideOnError}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[66%] w-full object-contain object-bottom"
        />
      ) : (
        <span className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-5xl" aria-hidden>
          {treatment.emoji}
        </span>
      )}
    </button>
  );
}

function PromoCard({ p, onClick }: { p: Promo; onClick: () => void }) {
  const { tx } = useI18n();
  const ink = p.brand ? "text-[color:var(--pp-violet)]" : "text-[color:var(--pp-primary-950)]";
  const sub = p.brand ? "text-[color:var(--pp-violet)]/80" : "text-ink-secondary";

  return (
    <button
      type="button"
      onClick={onClick}
      className="pp-snap group flex h-[270px] w-[88%] flex-none items-stretch overflow-hidden rounded-2xl border border-line bg-white text-left transition-colors hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)] sm:w-[70%]"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-5 pl-5 pr-4 sm:pl-7 sm:pr-5">
        <span
          className={
            "inline-flex w-max items-center rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wide " +
            (p.brand
              ? "bg-[color:var(--pp-primary-200)] text-[color:var(--pp-violet)]"
              : "bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]")
          }
        >
          {tx(p.badge)}
        </span>

        <p className={"font-display text-xl font-medium leading-snug " + ink}>{tx(p.t)}</p>
        <p className={"text-sm leading-snug " + sub}>{tx(p.d)}</p>

        <span className="mt-2 flex flex-wrap items-center gap-2">
          {p.offer && (
            <span className={"text-base font-medium " + ink}>{tx(p.offer)}</span>
          )}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            <FilledArrow />
          </span>
        </span>

        <p className="mt-1 text-2xs text-ink-tertiary">{tx(p.persuasion)}</p>
      </div>

      {/* Full-bleed portrait anchored to the far right edge */}
      <div className="relative hidden w-[40%] shrink-0 self-stretch sm:block">
        <img
          src={p.img}
          alt=""
          loading="lazy"
          onError={hideOnError}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent"
          aria-hidden
        />
      </div>
    </button>
  );
}

/* ── action rows ───────────────────────────────────────── */
type ActionId = "appointment" | "transfer" | "order" | "renew" | "treatments" | "prices" | "family";

const ACTION_ICON: Record<ActionId, { bg: string; fg: string }> = {
  appointment: { bg: "#4E2A84", fg: "#fff" },
  transfer:   { bg: "#7040D9", fg: "#fff" },
  order:      { bg: "#8C60FF", fg: "#fff" },
  renew:      { bg: "#4E2A84", fg: "#fff" },
  treatments: { bg: "#12655A", fg: "#fff" },
  prices:     { bg: "#E5E3FF", fg: "#4E2A84" },
  family:     { bg: "#E5E3FF", fg: "#4E2A84" },
};

function ActionIcon({ id }: { id: ActionId }) {
  const { fg } = ACTION_ICON[id];
  const c = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: fg, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "appointment":
      return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /><circle cx="12" cy="15.5" r="1.3" fill={fg} stroke="none" /></svg>;
    case "transfer":
      return <svg {...c}><path d="M13.5 3.5H7.2A2.2 2.2 0 0 0 5 5.7v12.6a2.2 2.2 0 0 0 2.2 2.2h6.3" /><path d="M5 8h8.5M14.5 12h6M17.8 9l3 3-3 3" /></svg>;
    case "order":
      return <svg {...c}><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8M8 12h8" /></svg>;
    case "renew":
      return <svg {...c}><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M9 8h2.6a2 2 0 0 1 0 4H9V8v8" /><path d="m11.8 12 3.2 4" /></svg>;
    case "treatments":
      return <svg {...c}><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8.5 7V5.6A1.6 1.6 0 0 1 10.1 4h3.8a1.6 1.6 0 0 1 1.6 1.6V7" /><path d="M12 11.2v4.6M9.7 13.5h4.6" /></svg>;
    case "prices":
      return <svg {...c}><circle cx="11" cy="11" r="7.5" /><path d="m20 20-4-4" /><path d="M11 7.5v7M12.8 9.2h-2.4a1.4 1.4 0 0 0 0 2.8h1.2a1.4 1.4 0 0 1 0 2.8H9.2" /></svg>;
    default:
      return <svg {...c}><circle cx="9" cy="8" r="3.4" /><path d="M3 19c0-3.1 2.7-5 6-5s6 1.9 6 5" /><circle cx="17.5" cy="10" r="2.4" /><path d="M16 14.4c2.6 0 4.5 1.5 4.5 4" /></svg>;
  }
}

function ActionRow({
  id,
  title,
  sub,
  onClick,
  flush,
}: {
  id: ActionId;
  title: string;
  sub: string;
  onClick: () => void;
  flush?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        flush
          ? "flex w-full items-start gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
          : "flex w-full items-start gap-4 rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:bg-[color:var(--state-hover)]"
      }
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: ACTION_ICON[id].bg }}>
        <ActionIcon id={id} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-[color:var(--pp-primary-950)]">{title}</span>
        <span className="mt-0.5 block text-sm leading-snug whitespace-normal break-words text-ink-tertiary">{sub}</span>
      </span>
      <span className="shrink-0 text-lg text-ink-tertiary" aria-hidden>
        ›
      </span>
    </button>
  );
}

/* ── get-the-app ───────────────────────────────────────── */
function AppCard() {
  const { tx } = useI18n();
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [sent, setSent] = useState(false);
  const appUrl = "https://pocketpills.com/app";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-[#E5E3FF] p-6 sm:p-8">
      {/* Soft organic accent — matches production shell */}
      <span
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-[45%] bg-[#C9C2FA]/80"
        aria-hidden
      />

      <div className="relative">
        <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Stay updated, get the app")}
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">
          {tx("Scan the QR code or get the download link")}
        </p>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
            <div
              className="flex gap-1"
              role="group"
              aria-label={tx("Link delivery method")}
            >
              {([
                {
                  id: "phone" as const,
                  label: "Phone",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="M7 3.5h3.2l1.2 3.2-2 1.4a12 12 0 0 0 5.5 5.5l1.4-2 3.2 1.2V16a2 2 0 0 1-2 2A13.5 13.5 0 0 1 5 6.5a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  id: "email" as const,
                  label: "Email",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                      <path d="m5 8 7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ]).map((tab) => {
                const on = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setMode(tab.id);
                      setSent(false);
                    }}
                    className={
                      "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors " +
                      (on
                        ? "bg-[color:var(--pp-primary-200)] text-[color:var(--pp-violet)]"
                        : "text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
                    }
                  >
                    {tab.icon}
                    {tx(tab.label)}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 focus-within:border-[color:var(--primary-600)]">
              <input
                className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-tertiary"
                placeholder={mode === "phone" ? "+1 953-800-0060" : "you@example.com"}
                aria-label={mode === "phone" ? tx("Phone number") : tx("Email address")}
                inputMode={mode === "phone" ? "tel" : "email"}
              />
              <button
                type="button"
                onClick={() => setSent(true)}
                className="shrink-0 text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-70"
              >
                {sent ? tx("Sent") : tx("Send link")}
              </button>
            </div>
            <p className="sr-only" aria-live="polite">
              {sent ? tx("Download link sent") : ""}
            </p>
          </div>

          {/* Real QR — dark tile on the extreme right of the white card */}
          <div
            className="mx-auto grid h-[7.25rem] w-[7.25rem] shrink-0 place-items-center rounded-2xl bg-[color:var(--pp-primary-950)] p-3 sm:mx-0 sm:self-center"
            aria-label="QR code to download the PocketPills app"
          >
            <QRCodeSVG
              value={appUrl}
              size={92}
              level="M"
              marginSize={0}
              bgColor="#4E2A84"
              fgColor="#FFFFFF"
              title={tx("Download the PocketPills app")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── fax ───────────────────────────────────────────────── */
function FaxCard() {
  const { tx } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText("1-855-950-7226").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-[color:var(--pp-primary-200)] p-6 sm:p-8">
      <div className="relative z-10 max-w-md pr-24 sm:pr-28">
        <h2 className="font-display text-lg font-medium leading-snug text-[color:var(--pp-primary-950)]">
          {tx("Fax us your prescription for faster service")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          {tx("Ask your clinic to send it our way.")}
          <br />
          {tx("We'll get it to you sooner.")}
        </p>
        <button
          type="button"
          onClick={copy}
          className="mt-5 inline-flex items-center gap-2.5 text-md font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-80"
          aria-label={copied ? "Fax number copied" : "Copy fax number 1-855-950-7226"}
        >
          <span className="leading-none">1-855-950-7226</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="shrink-0" aria-hidden>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
          {copied && <span className="text-xs font-medium text-wellness" aria-hidden>{tx("Copied")}</span>}
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? "Fax number copied to clipboard" : ""}
        </span>
      </div>

      {/* Decorative mark — extreme right */}
      <span
        className="pointer-events-none absolute bottom-5 right-5 grid h-[5.5rem] w-[5.5rem] place-items-center rounded-2xl bg-[#D8D3F5] sm:bottom-6 sm:right-6 sm:h-24 sm:w-24"
        aria-hidden
      >
        <span className="relative grid h-11 w-11 place-items-center rounded-full bg-white sm:h-12 sm:w-12">
          <span className="h-0 w-0 border-y-[7px] border-l-[12px] border-y-transparent border-l-[color:var(--pp-primary-300)]" />
        </span>
      </span>
    </section>
  );
}

/* ── page ──────────────────────────────────────────────── */
export function Dashboard() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { user, displayName } = useUser();
  const promoRef = useRef<HTMLDivElement>(null);
  const treatRef = useRef<HTMLDivElement>(null);
  const [showAllTreatments, setShowAllTreatments] = useState(false);
  const [treatAtStart, setTreatAtStart] = useState(true);
  const [treatAtEnd, setTreatAtEnd] = useState(false);

  const pending = pendingRows(user);
  const nextVisit = useMemo(() => {
    return getAppointments()
      .filter((a) => !appointmentIsPast(a) && a.status !== "cancelled")
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
  }, []);
  const nextOrder = useMemo(() => mergeActiveOrders()[0], []);
  const canCollapseTreatments = treatments.length > TREAT_COLLAPSED + 1;
  const treatCollapsed = canCollapseTreatments && !showAllTreatments;
  const treatExpanded = canCollapseTreatments && showAllTreatments;
  const visibleTreatments = treatCollapsed ? treatments.slice(0, TREAT_COLLAPSED) : treatments;

  const syncTreatRail = () => {
    const el = treatRef.current;
    if (!el) return;
    setTreatAtStart(el.scrollLeft <= 4);
    setTreatAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => {
    if (!treatCollapsed) return;
    const el = treatRef.current;
    if (!el) return;
    syncTreatRail();
    const ro = new ResizeObserver(syncTreatRail);
    ro.observe(el);
    return () => ro.disconnect();
  }, [treatCollapsed]);

  const scrollTreat = (dir: -1 | 1) => {
    const el = treatRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  const collapseTreatments = () => {
    setShowAllTreatments(false);
    requestAnimationFrame(() => {
      treatRef.current?.scrollTo({ left: 0 });
      syncTreatRail();
    });
  };

  return (
    <div className="space-y-10">
      {pending.length > 0 && (
        <button
          type="button"
          onClick={() => nav("/profile")}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#B4541F] px-5 py-4 text-base font-medium text-white transition-opacity hover:opacity-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.4h.01" />
          </svg>
          {pending.length}{" "}
          {pending.length === 1 ? tx("Profile pending action") : tx("Profile pending actions")}
          <span aria-hidden>›</span>
        </button>
      )}

      <header>
        <p className="font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Hi")}, {displayName}
        </p>
        <p className="mt-1 text-sm text-ink-tertiary">{tx("Your visits, fills, and care in one place.")}</p>
      </header>

      {nextVisit || nextOrder ? (
        <DetailSection title={tx("Up next")} meta={<DetailMeta>{tx("Open to continue")}</DetailMeta>} flush>
          <ul className="divide-y divide-line">
            {nextVisit ? (
              <li>
                <button
                  type="button"
                  onClick={() => nav(careEventHref("visit", nextVisit.id))}
                  className="flex w-full items-start justify-between gap-4 px-5 py-3.5 text-left hover:bg-[color:var(--state-hover)]"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[color:var(--pp-primary-950)]">
                      {tx(nextVisit.specialtyLabel)} · {nextVisit.clinicianName}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink-tertiary">
                      {monthDayShort(nextVisit.date)} · {nextVisit.time} · {tx(nextVisit.visitType === "virtual" ? "Virtual" : "In clinic")}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg text-ink-tertiary" aria-hidden>
                    ›
                  </span>
                </button>
              </li>
            ) : null}
            {nextOrder ? (
              <li>
                <button
                  type="button"
                  onClick={() => nav(`/orders/${nextOrder.id}`)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-3.5 text-left hover:bg-[color:var(--state-hover)]"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[color:var(--pp-primary-950)]">
                      {tx(typeMeta[nextOrder.type].label)}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink-tertiary">
                      {tx(statusMeta[nextOrder.status].label)} · {nextOrder.id}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg text-ink-tertiary" aria-hidden>
                    ›
                  </span>
                </button>
              </li>
            ) : null}
          </ul>
        </DetailSection>
      ) : null}

      {/* treatments */}
      <section>
        <RailHeader
          title={tx("Start a new treatment")}
          showArrows={treatCollapsed}
          onPrev={() => scrollTreat(-1)}
          onNext={() => scrollTreat(1)}
          prevDisabled={treatAtStart}
          nextDisabled={treatAtEnd}
          extra={
            treatExpanded ? (
              <button
                type="button"
                onClick={collapseTreatments}
                className="text-sm font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-70"
              >
                {tx("Show less")}
              </button>
            ) : null
          }
        />
        <div
          ref={treatCollapsed ? treatRef : undefined}
          onScroll={treatCollapsed ? syncTreatRail : undefined}
          className={treatExpanded ? TREAT_GRID : "pp-scroll flex gap-4 overflow-x-auto pb-1 [scroll-snap-type:none]"}
        >
          {visibleTreatments.map((t) => (
            <TreatmentDashCard
              key={t.slug}
              treatment={t}
              className={treatExpanded ? TREAT_CARD_GRID : TREAT_CARD_RAIL}
              onOpen={() => nav(`/appointments/treatments/${t.slug}`)}
            />
          ))}
          {treatCollapsed ? (
            <button
              type="button"
              onClick={() => setShowAllTreatments(true)}
              className={TREAT_CARD_RAIL}
              style={TREAT_CARD_BG}
              aria-label={tx("View more treatments")}
            >
              <p className="relative z-10 px-5 pt-5 font-display text-xl font-normal leading-tight text-[color:var(--pp-primary-950)]">
                {tx("View more")}
              </p>
              <p className="relative z-10 px-5 pt-1 text-sm text-ink-tertiary">
                +{treatments.length - TREAT_COLLAPSED}
              </p>
              <span
                className="pointer-events-none absolute inset-x-0 bottom-8 grid place-items-center"
                aria-hidden
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </button>
          ) : null}
        </div>
      </section>

      <DetailSection title={tx("Quick actions")} flush>
        <div className="divide-y divide-line">
          <ActionRow
            flush
            id="appointment"
            title={tx("Book a doctor appointment")}
            sub={tx("Virtual or in-clinic with a licensed clinician")}
            onClick={() => nav("/appointments")}
          />
          <ActionRow flush id="transfer" title={tx("Transfer my prescriptions")} sub={tx("Switch to PocketPills")} onClick={() => nav("/transfer")} />
          <ActionRow flush id="order" title={tx("Start a new order")} sub={tx("Refill an active prescription")} onClick={() => nav("/pharmacy")} />
          <ActionRow flush id="renew" title={tx("Renew my prescription")} sub={tx("Renew an expired prescription")} onClick={() => nav("/fill")} />
          <ActionRow flush id="treatments" title={tx("Explore treatments")} sub={tx("Get care from healthcare practitioners")} onClick={() => nav("/appointments")} />
          <ActionRow flush id="prices" title={tx("See drug prices")} sub={tx("Look up pricing details")} onClick={() => nav("/drug")} />
          <ActionRow flush id="family" title={tx("Add family member")} sub={tx("Manage your loved ones' meds")} onClick={() => nav("/account/family")} />
        </div>
      </DetailSection>

      {/* Offers sit directly above the get-the-app / QR block */}
      <section aria-label="Promotions">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">{tx("Offers for you")}</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => nav("/offers")}
              className="text-sm font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-70"
            >
              {tx("See all")}
            </button>
            <div className="flex gap-2">
              <ArrowBtn dir="l" onClick={() => promoRef.current?.scrollBy({ left: -320, behavior: "smooth" })} />
              <ArrowBtn dir="r" onClick={() => promoRef.current?.scrollBy({ left: 320, behavior: "smooth" })} />
            </div>
          </div>
        </div>
        <div ref={promoRef} className="pp-scroll flex gap-4 overflow-x-auto">
          {PROMOS.map((p) => <PromoCard key={p.t} p={p} onClick={() => nav(p.to)} />)}
        </div>
      </section>

      <AppCard />

      <FaxCard />
    </div>
  );
}
