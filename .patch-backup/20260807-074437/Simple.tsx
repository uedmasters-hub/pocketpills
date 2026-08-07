import { Card, Badge, Field, SectionHead } from "@/components/ui";
import { Button } from "@/components/ui/Button";

/* ── Pharmacy (orders / refills / delivery) ─────────────── */
export function Pharmacy() {
  return (
    <div>
      <SectionHead eyebrow="Pharmacy" title="Orders & refills" sub="Track deliveries, manage refills, and transfer prescriptions." />

      <div className="mb-4 flex gap-2">
        {["Active", "Refills", "History"].map((t, i) => (
          <button
            key={t}
            className={
              "rounded-full px-4 py-2 text-sm font-semibold " +
              (i === 0 ? "bg-primary text-[color:var(--color-primary-fg)]" : "border border-line bg-surface-2 text-ink-secondary")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">Order #PP-48210</p>
              <p className="text-sm text-ink-tertiary">Placed today · 1 item</p>
            </div>
            <Badge tone="primary">Pharmacist verifying</Badge>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-1">
            <div className="h-full w-1/3 rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-sm text-ink-tertiary">Estimated delivery: Friday</p>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <span className="text-2xl">📦</span>
          <div className="flex-1">
            <p className="font-semibold text-ink">Transfer a prescription</p>
            <p className="text-sm text-ink-tertiary">Move from another pharmacy — we handle the paperwork.</p>
          </div>
          <Button variant="secondary" size="sm">Start</Button>
        </Card>
      </div>
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
          { who: "PocketPills Pharmacy", role: "Pharmacist", last: "We're verifying your order #PP-48210.", tone: "info" as const, unread: false },
          { who: "Care Support", role: "Support", last: "How was your recent delivery?", tone: "neutral" as const, unread: false },
        ].map((m) => (
          <Card key={m.who} interactive className="flex items-center gap-4 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-subtle font-semibold text-primary">
              {m.who[0]}
            </span>
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
  return (
    <div className="mx-auto max-w-2xl">
      <SectionHead eyebrow="Account" title="Profile & settings" />
      <div className="space-y-4">
        <Card className="p-5">
          <p className="mb-3 font-semibold text-ink">Personal information</p>
          <div className="space-y-3">
            <Field label="Full name" defaultValue="Alex Chen" />
            <Field label="Email" type="email" defaultValue="alex@example.com" />
          </div>
        </Card>
        <Card className="p-5">
          <p className="mb-3 font-semibold text-ink">Insurance</p>
          <div className="flex items-center justify-between rounded-xl bg-surface-1 p-4">
            <div>
              <p className="font-semibold text-ink">Sun Life</p>
              <p className="text-sm text-ink-tertiary">Group 4402 · verified</p>
            </div>
            <Badge tone="success">Active</Badge>
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
      </div>
    </div>
  );
}
