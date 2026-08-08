import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/lib/user";
import { treatments } from "@/lib/data";

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

interface Promo { t: string; d: string; note?: string; img: string; to: string; brand?: boolean; }
const PROMOS: Promo[] = [
  { t: "Get Your Birth Control Online", d: "Start a free online assessment to get a prescription.", img: `${DASH_IMG}/img/minor-ailment-bc.svg`, to: "/treatment/birth-control", brand: true },
  { t: "Save 50% on your weight loss journey", d: "Brand-name Ozempic at a generic price", note: "Get it at $139!", img: `${DASH_IMG}/images/dashboard/weight-loss-doctor.png`, to: "/drug/ozempic" },
  { t: "Hair loss care made easy", d: "Doctor-approved hair loss treatments available now.", img: `${DASH_IMG}/images/dashboard/hair-loss-card.webp`, to: "/find-care" },
  { t: "ED treatment, simplified", d: "Easy consults, expert care, discreet delivery", img: `${DASH_IMG}/images/dashboard/ed-card.webp`, to: "/find-care" },
];

function PromoCard({ p, onClick }: { p: Promo; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="pp-snap flex min-h-[12.5rem] w-full shrink-0 justify-between overflow-hidden rounded-2xl bg-[color:var(--pp-primary-200)] p-0 text-left"
    >
      <div className="flex flex-1 flex-col justify-center px-6 py-7 sm:px-8">
        <p className={"font-display text-[19px] font-medium leading-snug " + (p.brand ? "text-[color:var(--pp-violet)]" : "text-[color:var(--pp-primary-950)]")}>
          {p.t}
        </p>
        <p className="pt-1.5 text-[13px] text-ink-secondary">{p.d}</p>
        <div className="flex items-center gap-2 pt-4">
          {p.note && <span className="text-[13px] font-medium text-[color:var(--pp-primary-900)]">{p.note}</span>}
          <FilledArrow />
        </div>
      </div>
      <div className="hidden w-[42%] shrink-0 sm:block">
        <img src={p.img} alt="" loading="lazy" onError={hideOnError} className="h-full w-full object-cover" />
      </div>
    </button>
  );
}

function RailHeader({ title, boxRef }: { title?: string; boxRef: React.RefObject<HTMLDivElement | null> }) {
  const scroll = (d: number) => boxRef.current?.scrollBy({ left: d * 300, behavior: "smooth" });
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      {title ? <h2 className="font-display text-xl font-bold text-[color:var(--pp-primary-950)]">{title}</h2> : <span />}
      <div className="flex gap-2">
        <ArrowBtn dir="l" onClick={() => scroll(-1)} />
        <ArrowBtn dir="r" onClick={() => scroll(1)} />
      </div>
    </div>
  );
}

/* ── dashboard ─────────────────────────────────────────── */
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
    <button onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl bg-surface-2 p-4 text-left transition-colors hover:bg-[color:var(--pp-primary-100)]">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: ACTION_ICON[id].bg }}>
        <ActionIcon id={id} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-[color:var(--pp-primary-950)]">{title}</span>
        <span className="block truncate text-[13px] text-ink-tertiary">{sub}</span>
      </span>
      <span className="shrink-0 text-ink-tertiary" aria-hidden>›</span>
    </button>
  );
}

/* ── get-the-app ───────────────────────────────────────── */
function AppCard() {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#E5E3FF] p-6 sm:p-8">
      <span className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-[40%] bg-[#C9C2FA]" aria-hidden />
      <div className="relative">
        <h2 className="font-display text-[clamp(22px,2.4vw,28px)] font-medium text-[color:var(--pp-primary-950)]">
          Stay updated, get the app
        </h2>
        <p className="mt-1 text-[14px] text-ink-secondary">Scan the QR code or get the download link</p>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-white p-4 sm:flex-row sm:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex rounded-full bg-surface-1 p-1">
              {(["phone", "email"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={
                    "flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-[14px] font-medium capitalize transition-colors " +
                    (mode === m ? "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-violet)]" : "text-ink-tertiary")
                  }>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5">
              <input
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-tertiary"
                placeholder={mode === "phone" ? "+1 953-800-0060" : "you@example.com"}
                aria-label={mode === "phone" ? "Phone number" : "Email address"}
              />
              <button className="shrink-0 text-[14px] font-medium text-[color:var(--pp-primary-950)] hover:underline">Send link</button>
            </div>
          </div>

          <div className="grid h-32 w-32 shrink-0 place-items-center self-center rounded-2xl bg-[color:var(--pp-primary-950)] p-3 sm:self-auto" aria-label="QR code">
            <svg viewBox="0 0 29 29" className="h-full w-full" shapeRendering="crispEdges" aria-hidden>
              {Array.from({ length: 29 }).map((_, y) =>
                Array.from({ length: 29 }).map((_, x) => {
                  const finder = (fx: number, fy: number) =>
                    x >= fx && x < fx + 7 && y >= fy && y < fy + 7 &&
                    !(x > fx && x < fx + 6 && y > fy && y < fy + 6 && !(x > fx + 1 && x < fx + 5 && y > fy + 1 && y < fy + 5));
                  const on = finder(0, 0) || finder(22, 0) || finder(0, 22) || ((x * 7 + y * 13 + x * y) % 5 < 2 && x > 8 && y > 8);
                  return on ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#fff" /> : null;
                }),
              )}
            </svg>
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
    <section className="relative overflow-hidden rounded-2xl bg-[color:var(--pp-primary-100)] p-6 sm:p-8">
      <div className="relative max-w-md">
        <h2 className="font-display text-[19px] font-bold text-[color:var(--pp-primary-950)]">
          Fax us your prescription for faster service
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
          Ask your clinic to send it our way.<br />We'll get it to you sooner.
        </p>
        <button onClick={copy} className="mt-4 inline-flex items-center gap-2 text-[17px] font-medium text-[color:var(--pp-violet)] hover:underline">
          1-855-950-7226
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
          {copied && <span className="text-[12px] text-wellness">Copied</span>}
        </button>
      </div>
      <span className="pointer-events-none absolute bottom-4 right-6 grid h-24 w-24 place-items-center rounded-2xl bg-[#DCD7FB]" aria-hidden>
        <span className="h-10 w-10 rounded-full bg-white" />
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

  const pending = [
    !user?.insurance && "Add your insurance",
    !user?.address && "Add a delivery address",
    !user?.dob && "Confirm your date of birth",
    !user?.phone && "Add a phone number",
    !user?.healthCard && "Upload your health card",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <button onClick={() => nav("/account")}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#B4541F] px-5 py-4 text-[15px] font-medium text-white transition-opacity hover:opacity-95">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.4h.01" />
          </svg>
          {pending.length} Profile pending action{pending.length === 1 ? "" : "s"}
          <span aria-hidden>›</span>
        </button>
      )}

      {/* promos — 1½ cards so the rail reads as scrollable */}
      <section>
        <RailHeader boxRef={promoRef} />
        <div ref={promoRef} className="pp-scroll flex gap-4 overflow-x-auto">
          {PROMOS.map((p) => <PromoCard key={p.t} p={p} onClick={() => nav(p.to)} />)}
        </div>
      </section>

      {/* treatments — label above the portrait */}
      <section>
        <RailHeader title="Start a new treatment" boxRef={treatRef} />
        <div ref={treatRef} className="pp-scroll flex gap-4 overflow-x-auto pb-1">
          {treatments.map((t) => (
            <button key={t.slug} onClick={() => nav(`/treatment/${t.slug}`)}
              className="pp-snap w-44 shrink-0 text-left">
              <p className="mb-2 min-h-[3rem] text-[17px] font-medium leading-snug text-[color:var(--pp-primary-950)]">{t.name}</p>
              <span className="grid h-44 w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-[color:var(--pp-primary-100)] to-[color:var(--pp-primary-200)] text-4xl" aria-hidden>
                {t.emoji}
              </span>
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
