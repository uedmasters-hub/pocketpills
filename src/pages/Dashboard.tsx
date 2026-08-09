import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useUser } from "@/lib/user";
import { treatments } from "@/lib/data";
import { pendingRows } from "@/lib/profile";

/* ── shared bits ───────────────────────────────────────── */
function ArrowBtn({ dir, onClick }: { dir: "l" | "r"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "l" ? "Previous" : "Next"}
      className="rounded-full bg-[color:var(--pp-primary-100)] p-1 text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--pp-primary-200)]"
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
    to: "/treatment/birth-control",
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
    to: "/find-care",
  },
  {
    badge: "Private & discreet",
    t: "ED treatment, simplified",
    d: "Easy consults, expert care, and same-day delivery in select cities.",
    offer: "Consult from $0",
    persuasion: "Plain packaging · Ships to your door",
    img: `${DASH_IMG}/images/dashboard/ed-card.webp`,
    to: "/find-care",
  },
];

function RailHeader({ title, boxRef }: { title?: string; boxRef: React.RefObject<HTMLDivElement | null> }) {
  const scroll = (d: number) => boxRef.current?.scrollBy({ left: d * 320, behavior: "smooth" });
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      {title ? <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">{title}</h2> : <span />}
      <div className="flex gap-2">
        <ArrowBtn dir="l" onClick={() => scroll(-1)} />
        <ArrowBtn dir="r" onClick={() => scroll(1)} />
      </div>
    </div>
  );
}

function PromoCard({ p, onClick }: { p: Promo; onClick: () => void }) {
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
          {p.badge}
        </span>

        <p className={"font-display text-xl font-medium leading-snug " + ink}>{p.t}</p>
        <p className={"text-sm leading-snug " + sub}>{p.d}</p>

        <span className="mt-2 flex flex-wrap items-center gap-2">
          {p.offer && (
            <span className={"text-base font-medium " + ink}>{p.offer}</span>
          )}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            <FilledArrow />
          </span>
        </span>

        <p className="mt-1 text-2xs text-ink-tertiary">{p.persuasion}</p>
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
type ActionId = "transfer" | "order" | "renew" | "treatments" | "prices" | "family";

const ACTION_ICON: Record<ActionId, { bg: string; fg: string }> = {
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

function ActionRow({ id, title, sub, onClick }: { id: ActionId; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:bg-[color:var(--state-hover)]"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: ACTION_ICON[id].bg }}>
        <ActionIcon id={id} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-[color:var(--pp-primary-950)]">{title}</span>
        <span className="block truncate text-sm text-ink-tertiary">{sub}</span>
      </span>
      <span className="shrink-0 text-lg text-ink-tertiary" aria-hidden>›</span>
    </button>
  );
}

/* ── get-the-app ───────────────────────────────────────── */
function AppCard() {
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
          Stay updated, get the app
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Scan the QR code or get the download link
        </p>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
            <div
              className="flex gap-1"
              role="group"
              aria-label="Link delivery method"
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
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 focus-within:border-[color:var(--primary-600)]">
              <input
                className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-tertiary"
                placeholder={mode === "phone" ? "+1 953-800-0060" : "you@example.com"}
                aria-label={mode === "phone" ? "Phone number" : "Email address"}
                inputMode={mode === "phone" ? "tel" : "email"}
              />
              <button
                type="button"
                onClick={() => setSent(true)}
                className="shrink-0 text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-70"
              >
                {sent ? "Sent" : "Send link"}
              </button>
            </div>
            <p className="sr-only" aria-live="polite">
              {sent ? "Download link sent" : ""}
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
              title="Download the PocketPills app"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── fax ───────────────────────────────────────────────── */
function FaxCard() {
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
          Fax us your prescription for faster service
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          Ask your clinic to send it our way.
          <br />
          We'll get it to you sooner.
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
          {copied && <span className="text-xs font-medium text-wellness" aria-hidden>Copied</span>}
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
  const nav = useNavigate();
  const { user } = useUser();
  const promoRef = useRef<HTMLDivElement>(null);
  const treatRef = useRef<HTMLDivElement>(null);

  const pending = pendingRows(user);

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <button
          type="button"
          onClick={() => nav("/profile")}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#B4541F] px-5 py-4 text-base font-medium text-white transition-opacity hover:opacity-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.4h.01" />
          </svg>
          {pending.length} Profile pending action{pending.length === 1 ? "" : "s"}
          <span aria-hidden>›</span>
        </button>
      )}

      {/* Promotional banners — offers, savings, persuasion */}
      <section aria-label="Promotions">
        <RailHeader title="Offers for you" boxRef={promoRef} />
        <div ref={promoRef} className="pp-scroll flex gap-4 overflow-x-auto">
          {PROMOS.map((p) => <PromoCard key={p.t} p={p} onClick={() => nav(p.to)} />)}
        </div>
      </section>

      {/* treatments */}
      <section>
        <RailHeader title="Start a new treatment" boxRef={treatRef} />
        <div ref={treatRef} className="pp-scroll flex gap-4 overflow-x-auto pb-1">
          {treatments.map((t) => (
            <button
              key={t.slug}
              onClick={() => nav(`/treatment/${t.slug}`)}
              /* flex-col: a bare <button> centres its content, which pushed the
                 label into the middle of the card over the portrait. */
              className="pp-snap relative flex aspect-[4/5] w-[13.5rem] shrink-0 flex-col overflow-hidden rounded-2xl text-left transition-transform"
              style={{ backgroundImage: "linear-gradient(180deg,#FFFFFF 0%,#FAF9FE 42%,#E7E2F7 100%)" }}
            >
              <p className="relative z-10 px-5 pt-5 font-display text-xl font-normal leading-tight text-[color:var(--pp-primary-950)]">
                {t.name}
              </p>

              {/* portrait: centred, contained, sitting on the card's lower edge */}
              {t.img ? (
                <img
                  src={t.img}
                  alt=""
                  loading="lazy"
                  onError={hideOnError}
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[66%] w-full object-contain object-bottom"
                />
              ) : (
                <span className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-5xl" aria-hidden>{t.emoji}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* actions */}
      <section className="space-y-2">
        <ActionRow id="transfer" title="Transfer my prescriptions" sub="Switch to PocketPills" onClick={() => nav("/transfer")} />
        <ActionRow id="order" title="Start a new order" sub="Refill an active prescription" onClick={() => nav("/pharmacy")} />
        <ActionRow id="renew" title="Renew my prescription" sub="Renew an expired prescription" onClick={() => nav("/fill")} />
        <ActionRow id="treatments" title="Explore treatments" sub="Get care from healthcare practitioners" onClick={() => nav("/find-care")} />
        <ActionRow id="prices" title="See drug prices" sub="Look up pricing details" onClick={() => nav("/drug")} />
      </section>

      <AppCard />

      <ActionRow id="family" title="Add family member" sub="Manage your loved ones' meds" onClick={() => nav("/account")} />

      <FaxCard />
    </div>
  );
}
