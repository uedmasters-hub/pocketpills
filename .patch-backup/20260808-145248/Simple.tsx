import { Link, useNavigate } from "react-router-dom";
import { Card, Badge, Field, SectionHead } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { orders, orderTotals, typeMeta, statusMeta, money, fmtDate } from "@/lib/orders";
import { useUser } from "@/lib/user";

/* ── Pharmacy (orders / refills / delivery) ─────────────── */
export function Pharmacy() {
  const nav = useNavigate();
  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const recent = orders.slice(0, 3);
  return (
    <div>
      <SectionHead eyebrow="Pharmacy" title="Orders & refills" sub="Track deliveries, manage refills, and view receipts & invoices." />

      {active.map((o) => {
        const t = orderTotals(o);
        const w = o.status === "verifying" ? "33%" : o.status === "processing" ? "55%" : "80%";
        return (
          <Card key={o.id} className="mb-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink">{o.id}</p>
                <p className="text-sm text-ink-tertiary">{fmtDate(o.date)} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {money(t.total)}</p>
              </div>
              <Badge tone={statusMeta[o.status].tone}>{statusMeta[o.status].label}</Badge>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-1">
              <div className="h-full rounded-full bg-primary" style={{ width: w }} />
            </div>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={() => nav(`/orders/${o.id}`)}>View order</Button>
            </div>
          </Card>
        );
      })}

      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold text-ink">Recent orders</p>
        <Link to="/orders" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
      </div>
      <div className="space-y-3">
        {recent.map((o) => {
          const t = orderTotals(o);
          return (
            <Link key={o.id} to={`/orders/${o.id}`} className="block">
              <Card interactive className="flex items-center gap-4 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-subtle">{typeMeta[o.type].icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{o.id}</p>
                  <p className="truncate text-sm text-ink-tertiary">{fmtDate(o.date)} · {o.items.map((i) => i.name).join(", ")}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-ink tnum">{money(t.total)}</span>
                <Badge tone={statusMeta[o.status].tone}>{statusMeta[o.status].label}</Badge>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-4 flex items-center gap-4 p-5">
        <span className="text-2xl">📦</span>
        <div className="flex-1">
          <p className="font-semibold text-ink">Transfer a prescription</p>
          <p className="text-sm text-ink-tertiary">Move from another pharmacy — we handle the paperwork.</p>
        </div>
        <Link to="/transfer"><Button variant="secondary" size="sm">Start</Button></Link>
      </Card>
    </div>
  );
}

/* ── Messages ───────────────────────────────────────────── */
export function Messages() {
  return (
    <div>
      <SectionHead eyebrow="Messages" title="Talk to your care team" />
      <div className="space-y-3">
        {[
          { who: "Dr. Amrita Shah", role: "Clinician", last: "Your prescription is approved and sent to pharmacy.", tone: "primary" as const, unread: true },
          { who: "PocketPills Pharmacy", role: "Pharmacist", last: "We're verifying your order #PP-RX-3391.", tone: "info" as const, unread: false },
          { who: "Care Support", role: "Support", last: "How was your recent delivery?", tone: "neutral" as const, unread: false },
        ].map((m) => (
          <Card key={m.who} interactive className="flex items-center gap-4 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-subtle font-semibold text-primary">{m.who[0]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ink">{m.who}</p>
                <Badge tone={m.tone}>{m.role}</Badge>
              </div>
              <p className="truncate text-sm text-ink-tertiary">{m.last}</p>
            </div>
            {m.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="unread" />}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Account (profile / insurance / notifications) ──────── */
export function Account() {
  const { user, displayName, logOut } = useUser();
  return (
    <div className="mx-auto w-full max-w-3xl">
      <SectionHead eyebrow="Account" title="Profile & settings" />
      <div className="space-y-4">
        <Card className="p-5">
          <p className="mb-3 font-semibold text-ink">Personal information</p>
          <div className="space-y-3">
            <Field label="Full name" key={displayName} defaultValue={[user?.firstName, user?.lastName].filter(Boolean).join(" ") || displayName} />
            <Field label="Email" type="email" key={user?.email} defaultValue={user?.email ?? ""} />
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-ink">Orders</p>
            <Link to="/orders" className="text-sm font-semibold text-primary hover:underline">Order history →</Link>
          </div>
          <p className="text-sm text-ink-tertiary">View past orders, receipts, and invoices.</p>
        </Card>
        <Card className="p-5">
          <p className="mb-3 font-semibold text-ink">Insurance</p>
          <div className="flex items-center justify-between rounded-xl bg-surface-1 p-4">
            <div><p className="font-semibold text-ink">{user?.insurance?.carrier || "No plan on file"}</p><p className="text-sm text-ink-tertiary">{user?.insurance ? `Group ${user.insurance.group || "—"} · verified` : "Add a plan to lower your costs"}</p></div>
            <Badge tone={user?.insurance ? "success" : "neutral"}>{user?.insurance ? "Active" : "None"}</Badge>
          </div>
        </Card>
        <Card className="p-5">
          <p className="mb-3 font-semibold text-ink">Notifications</p>
          {["Medication reminders", "Delivery updates", "Refill reminders"].map((n) => (
            <label key={n} className="flex items-center justify-between border-b border-line py-3 last:border-0">
              <span className="text-ink-secondary">{n}</span>
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-[color:var(--color-primary)]" />
            </label>
          ))}
        </Card>
        <Card className="flex items-center justify-between p-5">
          <div><p className="font-semibold text-ink">Sign out</p><p className="text-sm text-ink-tertiary">You'll need to sign in again to view your orders.</p></div>
          <Button variant="secondary" size="sm" onClick={logOut}>Sign out</Button>
        </Card>
      </div>
    </div>
  );
}
