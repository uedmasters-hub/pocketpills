import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { orders, orderTotals, statusMeta, money, fmtDate } from "@/lib/orders";
import { useUser } from "@/lib/user";

/* ── shared page furniture ─────────────────────────────── */
function PageHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <header className="mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--pp-violet)]">{eyebrow}</p>
      <h1 className="mt-2 font-display text-[clamp(24px,2.8vw,32px)] font-extrabold tracking-tight text-[color:var(--pp-primary-950)]">{title}</h1>
      {sub && <p className="mt-2 max-w-xl text-[15px] text-ink-secondary">{sub}</p>}
    </header>
  );
}

const CARD = "rounded-2xl border border-line bg-surface-2";
const PILL = "rounded-full px-3 py-1 text-[12px] font-semibold";

function StatusPill({ status }: { status: keyof typeof statusMeta }) {
  const tone: Record<string, string> = {
    primary: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]",
    info: "bg-info-subtle text-info",
    wellness: "bg-wellness-subtle text-wellness",
    danger: "bg-danger-subtle text-danger",
    neutral: "bg-surface-1 text-ink-secondary",
  };
  return <span className={`${PILL} ${tone[statusMeta[status].tone]}`}>{statusMeta[status].label}</span>;
}

/* ── Pharmacy ──────────────────────────────────────────── */
export function Pharmacy() {
  const nav = useNavigate();
  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const recent = orders.filter((o) => o.status === "delivered").slice(0, 3);

  return (
    <div>
      <PageHead eyebrow="Pharmacy" title="Orders & refills" sub="Track deliveries, manage refills, and view receipts." />

      {active.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 font-display text-[17px] font-bold text-[color:var(--pp-primary-950)]">In progress</h2>
          <div className="space-y-3">
            {active.map((o) => {
              const t = orderTotals(o);
              const pct = o.status === "verifying" ? 33 : o.status === "processing" ? 55 : 80;
              return (
                <button key={o.id} onClick={() => nav(`/orders/${o.id}`)} className={`${CARD} w-full p-5 text-left transition-colors hover:bg-[color:var(--pp-primary-100)]`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[color:var(--pp-primary-950)]">{o.id}</p>
                      <p className="text-[13px] text-ink-tertiary">{fmtDate(o.date)} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {money(t.total)}</p>
                    </div>
                    <StatusPill status={o.status} />
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-1">
                    <div className="h-full rounded-full bg-[color:var(--pp-primary-950)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[17px] font-bold text-[color:var(--pp-primary-950)]">Recent orders</h2>
          <Link to="/orders" className="text-[13px] font-semibold text-[color:var(--pp-violet)] hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {recent.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className={`${CARD} flex items-center gap-4 p-4 transition-colors hover:bg-[color:var(--pp-primary-100)]`}>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[color:var(--pp-primary-950)]">{o.id}</span>
                <span className="block truncate text-[13px] text-ink-tertiary">{fmtDate(o.date)} · {o.items.map((i) => i.name).join(", ")}</span>
              </span>
              <span className="shrink-0 text-[14px] font-semibold text-[color:var(--pp-primary-950)] tnum">{money(orderTotals(o).total)}</span>
              <span className="shrink-0 text-ink-tertiary" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>

      <div className={`${CARD} flex flex-wrap items-center gap-4 p-5`}>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[color:var(--pp-primary-950)]">Transfer a prescription</p>
          <p className="text-[13px] text-ink-tertiary">Move from another pharmacy — we handle the paperwork.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => nav("/transfer")}>Start</Button>
      </div>
    </div>
  );
}

/* ── Messages ──────────────────────────────────────────── */
export function Messages() {
  const threads = [
    { who: "Dr. Amrita Shah", role: "Clinician", last: "Your prescription is approved and sent to pharmacy.", when: "2h", unread: true },
    { who: "PocketPills Pharmacy", role: "Pharmacist", last: "We're verifying your order #PP-RX-3391.", when: "1d", unread: false },
    { who: "Care Support", role: "Support", last: "How was your recent delivery?", when: "3d", unread: false },
  ];
  return (
    <div>
      <PageHead eyebrow="Messages" title="Your care team" sub="Message a pharmacist or clinician any day of the week." />
      <div className="space-y-2">
        {threads.map((m) => (
          <button key={m.who} className={`${CARD} flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[color:var(--pp-primary-100)]`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-[13px] font-semibold text-[color:var(--pp-primary-950)]">
              {m.who.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-semibold text-[color:var(--pp-primary-950)]">{m.who}</span>
                <span className="shrink-0 text-[11px] text-ink-tertiary">{m.role}</span>
              </span>
              <span className="block truncate text-[13px] text-ink-tertiary">{m.last}</span>
            </span>
            <span className="shrink-0 text-[12px] text-ink-tertiary">{m.when}</span>
            {m.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--pp-violet)]" aria-label="unread" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Account ───────────────────────────────────────────── */
export function Account() {
  const { user, displayName, logOut } = useUser();
  const nav = useNavigate();

  const field = "h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-[15px] text-ink focus:border-primary";
  const label = "mb-1.5 block text-[13px] font-medium text-ink-secondary";

  return (
    <div>
      <PageHead eyebrow="Account" title="Profile & settings" />

      <div className="space-y-4">
        <section className={`${CARD} p-6`}>
          <h2 className="mb-4 font-display text-[17px] font-bold text-[color:var(--pp-primary-950)]">Personal information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Full name</span>
              <input className={field} defaultValue={[user?.firstName, user?.lastName].filter(Boolean).join(" ") || displayName} />
            </label>
            <label className="block">
              <span className={label}>Email</span>
              <input className={field} type="email" defaultValue={user?.email ?? ""} />
            </label>
            <label className="block">
              <span className={label}>Phone</span>
              <input className={field} defaultValue={user?.phone ?? ""} placeholder="(416) 555-0100" />
            </label>
            <label className="block">
              <span className={label}>Date of birth</span>
              <input className={field} defaultValue={user?.dob ?? ""} placeholder="YYYY-MM-DD" />
            </label>
          </div>
        </section>

        <section className={`${CARD} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[17px] font-bold text-[color:var(--pp-primary-950)]">Insurance</h2>
            <span className={`${PILL} ${user?.insurance ? "bg-wellness-subtle text-wellness" : "bg-surface-1 text-ink-secondary"}`}>
              {user?.insurance ? "Active" : "None"}
            </span>
          </div>
          <div className="rounded-xl bg-surface-1 p-4">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">{user?.insurance?.carrier || "No plan on file"}</p>
            <p className="text-[13px] text-ink-tertiary">
              {user?.insurance ? `Group ${user.insurance.group || "—"} · verified` : "Add a plan to lower your costs"}
            </p>
          </div>
        </section>

        <section className={`${CARD} p-6`}>
          <h2 className="mb-1 font-display text-[17px] font-bold text-[color:var(--pp-primary-950)]">Notifications</h2>
          <p className="mb-2 text-[13px] text-ink-tertiary">Choose what we send you.</p>
          {["Medication reminders", "Delivery updates", "Refill reminders"].map((n) => (
            <label key={n} className="flex items-center justify-between border-b border-line py-3 last:border-0">
              <span className="text-[15px] text-ink-secondary">{n}</span>
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-[color:var(--pp-primary-950)]" />
            </label>
          ))}
        </section>

        <section className={`${CARD} flex flex-wrap items-center gap-4 p-5`}>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">Orders & receipts</p>
            <p className="text-[13px] text-ink-tertiary">View past orders, receipts, and invoices.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => nav("/orders")}>View</Button>
        </section>

        <section className={`${CARD} flex flex-wrap items-center gap-4 p-5`}>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">Sign out</p>
            <p className="text-[13px] text-ink-tertiary">You'll need to sign in again to view your orders.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { logOut(); nav("/"); }}>Sign out</Button>
        </section>
      </div>
    </div>
  );
}
