import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { DetailSection } from "@/components/DetailSection";
import { useUser } from "@/lib/user";
import { treatments, type Treatment } from "@/lib/data";
import { appointmentIsPast, getAppointments } from "@/lib/appointments";
import { mergeActiveOrders, statusMeta, typeMeta } from "@/lib/orders";
import { careEventHref } from "@/lib/careJourney";
import { monthDayShort } from "@/lib/timeSlots";
import { useI18n } from "@/lib/i18n";
import { PhoneField } from "@/components/PhoneField";

/* ── shared bits ───────────────────────────────────────── */
/** Borderless chevron — matches AvailabilityBoard / site rail controls. */
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
        "grid h-8 w-8 place-items-center transition-colors " +
        (disabled
          ? "cursor-default text-[color:var(--neutral-300)]"
          : "text-[color:var(--pp-primary-950)] hover:text-[color:var(--pp-violet)]")
      }
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        {dir === "l" ? (
          <path d="M12.5 5 7.5 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M7.5 5 12.5 10l-5 5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

/** Shared card chrome for framed tiles (offers, quick actions, empty slots). */
const CARD_FRAME = "rounded-2xl border border-line";

/** Filled circle arrow used inside promo cards. */
function FilledArrow() {
  return (
    <svg width="21" height="20" viewBox="0 0 21 20" fill="none" aria-hidden>
      <circle cx="10.5" cy="10" r="10" fill="var(--pp-primary-950)" />
      <path d="M7.0134 9.47545H12.748L10.2427 6.9028C10.0424 6.6972 10.0424 6.3598 10.2427 6.1542C10.4429 5.9486 10.7663 5.9486 10.9665 6.1542L14.3498 9.62834C14.5501 9.83394 14.5501 10.1661 14.3498 10.3717L10.9665 13.8458C10.7663 14.0514 10.4429 14.0514 10.2427 13.8458C10.0424 13.6402 10.0424 13.3081 10.2427 13.1025L12.748 10.5298H7.0134C6.73103 10.5298 6.5 10.2926 6.5 10.0026C6.5 9.71269 6.73103 9.47545 7.0134 9.47545Z" fill="white" />
    </svg>
  );
}

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; };

/** Offers art — replace files in `public/img/offers/`. */
const OFFER_IMG_VER = "20260822c";
const offerImg = (file: string) => `/img/offers/${file}?v=${OFFER_IMG_VER}`;

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
    img: offerImg("birth-control.png"),
    to: "/appointments/treatments/birth-control",
    brand: true,
  },
  {
    badge: "Save 50%",
    t: "Save 50% on your weight loss journey",
    d: "Brand-name Ozempic at a generic price, with pharmacist support.",
    offer: "Get it at $139!",
    persuasion: "Limited-time price · Free standard delivery",
    img: offerImg("weight-loss.png"),
    to: "/drug/ozempic",
  },
  {
    badge: "First month $39",
    t: "Hair loss care that actually works",
    d: "Clinically proven treatments prescribed online by Canadian doctors.",
    offer: "Start from $39/mo",
    persuasion: "Discreet packaging · Results in 3–6 months",
    img: offerImg("hair-loss.png"),
    to: "/appointments",
  },
  {
    badge: "Private & discreet",
    t: "ED treatment, simplified",
    d: "Easy consults, expert care, and same-day delivery in select cities.",
    offer: "Consult from $0",
    persuasion: "Plain packaging · Ships to your door",
    img: offerImg("ed.png"),
    to: "/appointments",
  },
];

const TREAT_CARD =
  "relative flex aspect-square flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white text-left transition-transform";
const TREAT_CARD_RAIL =
  /* ~4 cards + peek of the next so the rail doesn’t look like only four exist */
  TREAT_CARD + " w-[calc((100%-1rem)/2.15)] shrink-0 sm:w-[calc((100%-3.25rem)/4.25)]";
const TREAT_CARD_GRID = TREAT_CARD + " w-full";
/** Soft white → pale lavender fill (card chrome, not an image fade). */
const TREAT_CARD_BG = {
  backgroundImage: "linear-gradient(180deg,#FFFFFF 0%,#FAF9FE 48%,#EDE8F7 100%)",
} as const;
const TREAT_GRID = "grid grid-cols-2 gap-4 sm:grid-cols-4";
/** Collapsed rail: 7 treatments + View more. */
const TREAT_COLLAPSED = 7;

/** Section shell: title + optional rail controls, then body — used by every dashboard block. */
function DashSection({
  title,
  showArrows = false,
  extra,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  flush,
  children,
}: {
  title: string;
  showArrows?: boolean;
  extra?: ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <DetailSection
      title={title}
      flush={flush}
      meta={
        showArrows || extra ? (
          <div className="flex items-center gap-3">
            {extra}
            {showArrows ? (
              <div className="flex gap-1">
                <ArrowBtn dir="l" onClick={() => onPrev?.()} disabled={prevDisabled} />
                <ArrowBtn dir="r" onClick={() => onNext?.()} disabled={nextDisabled} />
              </div>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {children}
    </DetailSection>
  );
}

/** Open rail header (title + chevrons) — matches treatment comps outside a boxed section. */
function RailHeader({
  title,
  showArrows = true,
  extra,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: {
  title: string;
  showArrows?: boolean;
  extra?: ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">{title}</h2>
      <div className="flex items-center gap-3">
        {extra}
        {showArrows ? (
          <div className="flex gap-1">
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
  const [imgFailed, setImgFailed] = useState(false);
  const src = treatment.img;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={className}
      style={TREAT_CARD_BG}
    >
      <p className="relative z-10 max-w-[58%] px-5 pt-5 text-left font-display text-[1.35rem] font-medium leading-tight text-[color:var(--pp-primary-950)]">
        {tx(treatment.name)}
      </p>
      {src && !imgFailed ? (
        <span
          className="pointer-events-none absolute -bottom-[6%] -right-[4%] z-0 block h-[58%] w-[72%]"
          aria-hidden
        >
          <img
            src={src}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full select-none object-contain object-right-bottom"
          />
        </span>
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
      className={
        "pp-snap group flex h-[270px] w-[88%] flex-none items-stretch overflow-hidden " +
        CARD_FRAME +
        " bg-white text-left transition-colors hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)] sm:w-[70%]"
      }
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
      </div>
    </button>
  );
}

/* ── Quick actions — cyan bento cards ───────────────────── */
type ActionId = "appointment" | "transfer" | "order" | "renew" | "treatments" | "prices" | "family";

type QuickAction = {
  id: ActionId;
  title: string;
  to: string;
  image: string;
};

/**
 * Quick-action card art — replace files in `public/img/quick-actions/`.
 * Cache-bust so browser picks up replacements without a hard refresh.
 */
const QA_IMG_VER = "20260822c";
const qaImg = (file: string) => `/img/quick-actions/${file}?v=${QA_IMG_VER}`;

const QUICK_ACTION_IMG: Record<ActionId, string> = {
  appointment: qaImg("appointment.png"),
  transfer: qaImg("transfer.png"),
  order: qaImg("order.png"),
  treatments: qaImg("treatments.png"),
  prices: qaImg("prices.png"),
  family: qaImg("family.png"),
  renew: qaImg("renew.png"),
};

function QuickActionCard({
  title,
  image,
  onClick,
}: {
  title: string;
  image: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative flex min-h-[8.25rem] flex-col overflow-hidden " +
        CARD_FRAME +
        " bg-[color:var(--secondary-500)] p-4 text-left transition-colors hover:brightness-[0.98]"
      }
    >
      <span className="relative z-10 max-w-[65%] pr-1 line-clamp-2 whitespace-pre-line font-display text-lg font-medium leading-snug text-[color:var(--pp-primary-950)]">
        {title}
      </span>
      {/* Fixed square slot so every specialty PNG renders at the same visual size. */}
      <span
        className="pointer-events-none absolute -bottom-2 -right-2 z-0 block h-[6.75rem] w-[6.75rem]"
        aria-hidden
      >
        <img
          src={image}
          alt=""
          loading="lazy"
          className="h-full w-full select-none object-contain object-right-bottom"
        />
      </span>
    </button>
  );
}

function QuickActions({
  actions,
  onOpen,
}: {
  actions: QuickAction[];
  onOpen: (to: string) => void;
}) {
  const { tx } = useI18n();

  return (
    <DashSection title={tx("Quick actions")}>
      {/* 2 → 3 through 1440px → 4 above */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 min-[1441px]:grid-cols-4">
        {actions.map((a) => (
          <QuickActionCard
            key={a.id}
            title={tx(a.title)}
            image={a.image}
            onClick={() => onOpen(a.to)}
          />
        ))}
        <div
          className={
            "flex min-h-[8.25rem] items-center justify-center " +
            CARD_FRAME +
            " bg-white p-4"
          }
          aria-disabled="true"
        >
          <span className="font-display text-lg font-medium leading-snug text-[color:var(--neutral-300)]">
            {tx("coming …")}
          </span>
        </div>
      </div>
    </DashSection>
  );
}

/* ── get-the-app ───────────────────────────────────────── */
function AppCard() {
  const { tx } = useI18n();
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [sent, setSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const appUrl = "https://pocketpills.com/app";

  return (
    <section className={"relative overflow-hidden " + CARD_FRAME + " bg-[#E5E3FF] p-6 sm:p-8"}>
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

        <div className={"mt-5 flex flex-col gap-4 " + CARD_FRAME + " bg-white p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5"}>
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

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
              {mode === "phone" ? (
                <PhoneField
                  label={tx("Phone number")}
                  hideLabel
                  value={phone}
                  onChange={(v) => {
                    setPhone(v);
                    setSent(false);
                  }}
                  className="min-w-0 flex-1"
                />
              ) : (
                <div className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-line px-3.5 focus-within:border-primary">
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-tertiary"
                    placeholder="you@example.com"
                    aria-label={tx("Email address")}
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSent(false);
                    }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => setSent(true)}
                className="h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-70 sm:px-2"
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

/* ── page ──────────────────────────────────────────────── */
export function Dashboard() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { displayName } = useUser();
  const promoRef = useRef<HTMLDivElement>(null);
  const treatRef = useRef<HTMLDivElement>(null);
  const [showAllTreatments, setShowAllTreatments] = useState(false);
  const [treatAtStart, setTreatAtStart] = useState(true);
  const [treatAtEnd, setTreatAtEnd] = useState(false);

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
      <header>
        <p className="font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Hi")}, {displayName}
        </p>
        <p className="mt-1 text-sm text-ink-tertiary">{tx("Your visits, fills, and care in one place.")}</p>
      </header>

      {nextVisit || nextOrder ? (
        <DashSection title={tx("Up next")} flush>
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
        </DashSection>
      ) : null}

      {/* treatments — open rail to match design comps (no boxed section around cards) */}
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
              <p className="relative z-10 px-5 pt-5 font-display text-[1.35rem] font-medium leading-tight text-[color:var(--pp-primary-950)]">
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

      <QuickActions
        actions={[
          {
            id: "appointment",
            title: "Book a\ndoctor visit",
            to: "/appointments",
            image: QUICK_ACTION_IMG.appointment,
          },
          {
            id: "transfer",
            title: "Transfer my\nprescriptions",
            to: "/transfer",
            image: QUICK_ACTION_IMG.transfer,
          },
          { id: "order", title: "Start a\nnew order", to: "/pharmacy", image: QUICK_ACTION_IMG.order },
          {
            id: "treatments",
            title: "Explore\ntreatments",
            to: "/appointments",
            image: QUICK_ACTION_IMG.treatments,
          },
          { id: "prices", title: "See drug\nprices", to: "/drug", image: QUICK_ACTION_IMG.prices },
          {
            id: "family",
            title: "Add family\nmember",
            to: "/account/family",
            image: QUICK_ACTION_IMG.family,
          },
          {
            id: "renew",
            title: "Renew my\nprescription",
            to: "/fill",
            image: QUICK_ACTION_IMG.renew,
          },
        ]}
        onOpen={(to) => nav(to)}
      />

      {/* Offers sit directly above the get-the-app / QR block */}
      <DashSection
        title={tx("Offers for you")}
        showArrows
        onPrev={() => promoRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
        onNext={() => promoRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
        extra={
          <button
            type="button"
            onClick={() => nav("/offers")}
            className="text-sm font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-70"
          >
            {tx("See all")}
          </button>
        }
      >
        <div ref={promoRef} className="pp-scroll flex gap-4 overflow-x-auto">
          {PROMOS.map((p) => <PromoCard key={p.t} p={p} onClick={() => nav(p.to)} />)}
        </div>
      </DashSection>

      <AppCard />
    </div>
  );
}
