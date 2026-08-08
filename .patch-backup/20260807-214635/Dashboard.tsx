import { useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, greeting } from "@/lib/user";
import { treatments, entryPoints } from "@/lib/data";
import { EntryIcon } from "@/pages/entry/EntryPoints";
import { orders, orderTotals, statusMeta, money, fmtDate } from "@/lib/orders";

/* ── shared bits ───────────────────────────────────────── */
function ArrowBtn({ dir, onClick }: { dir: "l" | "r"; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={dir === "l" ? "Previous" : "Next"}
      className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--pp-primary-200)]">
      {dir === "l" ? "‹" : "›"}
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

function ActionRow({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface-2 p-4 text-left transition-colors hover:border-strong">
      {icon}
      <span className="flex-1 text-[15px] font-medium text-[color:var(--pp-primary-950)]">{label}</span>
      <span className="text-ink-tertiary" aria-hidden>›</span>
    </button>
  );
}

/* ── dashboard ─────────────────────────────────────────── */
export function Dashboard() {
  const nav = useNavigate();
  const { displayName, user } = useUser();
  const promoRef = useRef<HTMLDivElement>(null);
  const treatRef = useRef<HTMLDivElement>(null);

  /* Content adapts to the profile: incomplete fields become actionable prompts. */
  const pending = [
    !user?.insurance && "Add your insurance",
    !user?.address && "Add a delivery address",
    !user?.dob && "Confirm your date of birth",
    !user?.phone && "Add a phone number",
    !user?.allergies?.length && "Review your allergies",
  ].filter(Boolean) as string[];

  const activeOrder = orders.find((o) => o.status !== "delivered" && o.status !== "cancelled");

  const promos = [
    { t: "Get Your Birth Control Online", d: "Start a free online assessment to get a prescription.", to: "/treatment/birth-control", bg: "var(--pp-primary-200)" },
    { t: "Refills on autopilot", d: "Turn on auto-refill and never chase a prescription again.", to: "/pharmacy", bg: "var(--pp-primary-100)" },
  ];

  return (
    <div className="space-y-10">
      {/* Pending actions */}
      {pending.length > 0 && (
        <button onClick={() => nav("/account")}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#B4541F] px-5 py-4 text-[15px] font-medium text-white transition-opacity hover:opacity-95">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          {pending.length} Profile pending action{pending.length === 1 ? "" : "s"}
          <span aria-hidden>›</span>
        </button>
      )}

      <div>
        <p className="text-ink-tertiary">{greeting()},</p>
        <h1 className="font-display text-3xl font-extrabold text-[color:var(--pp-primary-950)]">{displayName}</h1>
      </div>

      {/* Promo carousel */}
      <section>
        <RailHeader boxRef={promoRef} />
        <div ref={promoRef} className="pp-scroll flex gap-4 overflow-x-auto">
          {promos.map((p) => (
            <div key={p.t} className="pp-snap flex min-h-[16rem] w-full shrink-0 overflow-hidden rounded-2xl" style={{ backgroundColor: p.bg }}>
              <div className="flex flex-1 flex-col justify-center gap-3 p-8">
                <h3 className="font-display text-[26px] font-medium leading-tight text-[color:var(--pp-primary-950)]">{p.t}</h3>
                <p className="text-[14px] text-[color:var(--pp-violet)]">{p.d}</p>
                <button onClick={() => nav(p.to)} aria-label={p.t}
                  className="mt-3 grid h-9 w-9 place-items-center rounded-full bg-[color:var(--pp-primary-950)] text-white">→</button>
              </div>
              <div className="hidden w-2/5 shrink-0 bg-[color:var(--pp-primary-300)] sm:block" aria-hidden />
            </div>
          ))}
        </div>
      </section>

      {/* Start a new treatment */}
      <section>
        <RailHeader title="Start a new treatment" boxRef={treatRef} />
        <div ref={treatRef} className="pp-scroll flex gap-4 overflow-x-auto">
          {treatments.map((t) => (
            <button key={t.slug} onClick={() => nav(`/treatment/${t.slug}`)}
              className="pp-snap flex h-52 w-40 shrink-0 flex-col overflow-hidden rounded-2xl bg-surface-2 text-left transition-transform hover:-translate-y-0.5">
              <span className="p-4 text-[15px] font-medium leading-snug text-[color:var(--pp-primary-950)]">{t.name}</span>
              <span className="mt-auto grid h-24 w-full place-items-center bg-[color:var(--pp-primary-100)] text-3xl" aria-hidden>{t.emoji}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Active order — only when there is one */}
      {activeOrder && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold text-[color:var(--pp-primary-950)]">Your order</h2>
          <button onClick={() => nav(`/orders/${activeOrder.id}`)}
            className="w-full rounded-2xl border border-line bg-surface-2 p-5 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[color:var(--pp-primary-950)]">{activeOrder.id}</p>
                <p className="text-sm text-ink-tertiary">{fmtDate(activeOrder.date)} · {money(orderTotals(activeOrder).total)}</p>
              </div>
              <span className="rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-xs font-semibold text-[color:var(--pp-primary-950)]">
                {statusMeta[activeOrder.status].label}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-1">
              <div className="h-full rounded-full bg-[color:var(--pp-primary-950)]"
                style={{ width: activeOrder.status === "verifying" ? "33%" : activeOrder.status === "processing" ? "55%" : "80%" }} />
            </div>
          </button>
        </section>
      )}

      {/* Quick actions */}
      <section className="space-y-3">
        {entryPoints.slice(1).map((e) => (
          <ActionRow
            key={e.id}
            onClick={() => nav(e.to)}
            label={e.title}
            icon={
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: e.tile }}>
                <EntryIcon id={e.id} />
              </span>
            }
          />
        ))}
      </section>
    </div>
  );
}
