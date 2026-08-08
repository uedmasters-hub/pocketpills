import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, greeting } from "@/lib/user";
import { treatments, entryPoints } from "@/lib/data";
import { EntryIcon } from "@/pages/entry/EntryPoints";
import { orders, orderTotals, statusMeta, money, fmtDate } from "@/lib/orders";

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
export function Dashboard() {
  const nav = useNavigate();
  const { displayName, user } = useUser();
  const promoRef = useRef<HTMLDivElement>(null);
  const treatRef = useRef<HTMLDivElement>(null);

  /* Content derives from the profile — nothing is hardcoded. */
  const pending = [
    !user?.insurance && "Add your insurance",
    !user?.address && "Add a delivery address",
    !user?.dob && "Confirm your date of birth",
    !user?.phone && "Add a phone number",
  ].filter(Boolean) as string[];

  const activeOrder = orders.find((o) => o.status !== "delivered" && o.status !== "cancelled");

  const actions = [
    { id: "fill" as const, t: "Fill a prescription", d: "Send us a new prescription", to: "/fill" },
    { id: "transfer" as const, t: "Transfer prescriptions", d: "Switch to PocketPills", to: "/transfer" },
    { id: "treatment" as const, t: "See a doctor", d: "Get assessed online, free", to: "/find-care" },
    { id: "explore" as const, t: "Search drug prices", d: "Check coverage and cost", to: "/drug" },
  ];

  return (
    <div className="space-y-8">
      {/* who, first */}
      <header>
        <p className="text-[15px] text-ink-tertiary">{greeting()},</p>
        <h1 className="font-display text-[clamp(26px,3vw,32px)] font-extrabold tracking-tight text-[color:var(--pp-primary-950)]">
          {displayName}
        </h1>
      </header>

      {/* an alert, sized like an alert */}
      {pending.length > 0 && (
        <button onClick={() => nav("/account")}
          className="flex w-full items-center gap-3 rounded-2xl border border-[#E7C9B4] bg-[#FBF1E9] px-4 py-3 text-left transition-colors hover:border-[#D8AE92]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#B4541F] text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.4h.01" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-[#8A3F17]">
              {pending.length} profile action{pending.length === 1 ? "" : "s"} pending
            </span>
            <span className="block truncate text-[13px] text-[#A2643F]">{pending.slice(0, 2).join(" · ")}</span>
          </span>
          <span className="shrink-0 text-[#B4541F]" aria-hidden>›</span>
        </button>
      )}

      {/* the live thing, when there is one */}
      {activeOrder && (
        <section>
          <h2 className="mb-3 font-display text-[17px] font-bold text-[color:var(--pp-primary-950)]">Your order</h2>
          <button onClick={() => nav(`/orders/${activeOrder.id}`)}
            className="w-full rounded-2xl border border-line bg-surface-2 p-5 text-left transition-colors hover:border-strong">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[color:var(--pp-primary-950)]">{activeOrder.id}</p>
                <p className="text-[13px] text-ink-tertiary">
                  {fmtDate(activeOrder.date)} · {money(orderTotals(activeOrder).total)}
                </p>
              </div>
              <span className="rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-[12px] font-semibold text-[color:var(--pp-primary-950)]">
                {statusMeta[activeOrder.status].label}
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-1">
              <div className="h-full rounded-full bg-[color:var(--pp-primary-950)]"
                style={{ width: activeOrder.status === "verifying" ? "33%" : activeOrder.status === "processing" ? "55%" : "80%" }} />
            </div>
          </button>
        </section>
      )}

      {/* what would you like to do — paired, not a long single column */}
      <section>
        <h2 className="mb-3 font-display text-[17px] font-bold text-[color:var(--pp-primary-950)]">What would you like to do?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((a) => {
            const e = entryPoints.find((x) => x.id === a.id)!;
            return (
              <button key={a.t} onClick={() => nav(a.to)}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface-2 p-4 text-left transition-colors hover:border-strong">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: e.tile }}>
                  <EntryIcon id={e.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-[color:var(--pp-primary-950)]">{a.t}</span>
                  <span className="block truncate text-[13px] text-ink-tertiary">{a.d}</span>
                </span>
                <span className="shrink-0 text-ink-tertiary" aria-hidden>›</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* promotions come after the user's own business */}
      <section>
        <RailHeader title="For you" boxRef={promoRef} />
        <div ref={promoRef} className="pp-scroll flex gap-4 overflow-x-auto">
          {PROMOS.map((p) => <PromoCard key={p.t} p={p} onClick={() => nav(p.to)} />)}
        </div>
      </section>

      <section>
        <RailHeader title="Start a new treatment" boxRef={treatRef} />
        <div ref={treatRef} className="pp-scroll flex gap-3 overflow-x-auto pb-1">
          {treatments.map((t) => (
            <button key={t.slug} onClick={() => nav(`/treatment/${t.slug}`)}
              className="pp-snap flex w-44 shrink-0 flex-col gap-3 rounded-2xl border border-line bg-surface-2 p-4 text-left transition-colors hover:border-strong">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--pp-primary-100)] text-xl" aria-hidden>{t.emoji}</span>
              <span>
                <span className="block text-[15px] font-medium leading-snug text-[color:var(--pp-primary-950)]">{t.name}</span>
                <span className="mt-0.5 block text-[12px] text-ink-tertiary">{t.category}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
