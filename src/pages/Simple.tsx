import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getOrders,
  orderTotals,
  statusMeta,
  money,
  fmtDate,
  transferStatusLabel,
  transferStepIndex,
  TRANSFER_TRACK_STEPS,
  TRANSFER_HINTS,
} from "@/lib/orders";
import { useUser, newInsuranceId, fmtInsuranceList, fmtInsurancePlan, type InsurancePlan } from "@/lib/user";
import { useReviewDraft, type ReviewChange } from "@/lib/rightRail";

/* ── shared page furniture ─────────────────────────────── */
function PageHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <header className="mb-8">
      <p className="pp-caps text-[color:var(--pp-violet)]">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">{title}</h1>
      {sub && <p className="mt-2 max-w-xl text-base text-ink-secondary">{sub}</p>}
    </header>
  );
}

const CARD = "rounded-2xl border border-line bg-white";
const PILL = "rounded-full px-3 py-1 text-xs font-semibold";

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
  const all = getOrders();
  const transfers = all.filter((o) => o.type === "transfer" && o.status !== "delivered" && o.status !== "cancelled");
  const active = all.filter((o) => o.type !== "transfer" && o.status !== "delivered" && o.status !== "cancelled");
  const recent = all.filter((o) => o.status === "delivered").slice(0, 3);

  return (
    <div>
      <PageHead eyebrow="Pharmacy" title="Orders & refills" sub="Track deliveries, transfers, manage refills, and view receipts." />

      {transfers.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="font-display text-md font-medium text-[color:var(--pp-primary-950)]">Transfers to track</h2>
            <p className="text-xs text-ink-tertiary">Tap a card for full detail</p>
          </div>
          <div className="space-y-3">
            {transfers.map((o) => {
              const step = transferStepIndex(o.status);
              const pct = ((step + 1) / TRANSFER_TRACK_STEPS.length) * 100;
              const nextHint = TRANSFER_HINTS[Math.min(step, TRANSFER_HINTS.length - 1)];
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => nav(`/orders/${o.id}`)}
                  className={`${CARD} w-full p-5 text-left transition-colors hover:bg-[color:var(--state-hover)]`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[color:var(--pp-primary-950)]">{o.id}</p>
                      <p className="mt-0.5 text-sm text-ink-tertiary">
                        From {o.fromPharmacy ?? "your pharmacy"} · {fmtDate(o.date)}
                      </p>
                    </div>
                    <span className={`${PILL} bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]`}>
                      {transferStatusLabel(o.status)}
                    </span>
                  </div>

                  <ol className="mt-4 flex gap-1.5" aria-label="Transfer progress">
                    {TRANSFER_TRACK_STEPS.map((label, i) => (
                      <li key={label} className="min-w-0 flex-1" title={label}>
                        <span
                          className={
                            "block h-1.5 rounded-full " +
                            (i <= step ? "bg-[color:var(--pp-primary-950)]" : "bg-[color:var(--pp-primary-300)]")
                          }
                        />
                      </li>
                    ))}
                  </ol>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-tertiary">
                    <span>{TRANSFER_TRACK_STEPS[step]}</span>
                    <span className="tnum">{Math.round(pct)}%</span>
                  </div>

                  <div className="mt-4 rounded-xl bg-[color:var(--pp-primary-200)] px-3.5 py-3">
                    <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">Next cue</p>
                    <p className="mt-1 text-sm font-medium text-[color:var(--pp-primary-950)]">{nextHint.title}</p>
                    <p className="mt-0.5 text-sm text-ink-secondary">{nextHint.detail}</p>
                  </div>

                  <p className="mt-3 text-sm font-medium text-[color:var(--pp-violet)]">View transfer details →</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 font-display text-md font-medium text-[color:var(--pp-primary-950)]">In progress</h2>
          <div className="space-y-3">
            {active.map((o) => {
              const t = orderTotals(o);
              const pct = o.status === "verifying" ? 33 : o.status === "processing" ? 55 : 80;
              return (
                <button key={o.id} onClick={() => nav(`/orders/${o.id}`)} className={`${CARD} w-full p-5 text-left transition-colors hover:bg-[color:var(--state-hover)]`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[color:var(--pp-primary-950)]">{o.id}</p>
                      <p className="text-sm text-ink-tertiary">{fmtDate(o.date)} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {money(t.total)}</p>
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
          <h2 className="font-display text-md font-medium text-[color:var(--pp-primary-950)]">Recent orders</h2>
          <Link to="/orders" className="text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {recent.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className={`${CARD} flex items-center gap-4 p-4 transition-colors hover:bg-[color:var(--state-hover)]`}>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[color:var(--pp-primary-950)]">{o.id}</span>
                <span className="block truncate text-sm text-ink-tertiary">{fmtDate(o.date)} · {o.items.map((i) => i.name).join(", ")}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-[color:var(--pp-primary-950)] tnum">{money(orderTotals(o).total)}</span>
              <span className="shrink-0 text-ink-tertiary" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => nav("/transfer")}
        className={`${CARD} flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[color:var(--state-hover)]`}
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#7040D9] text-white" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M13.5 3.5H7.2A2.2 2.2 0 0 0 5 5.7v12.6a2.2 2.2 0 0 0 2.2 2.2h6.3" />
            <path d="M14.5 12h6M17.8 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[color:var(--pp-primary-950)]">Transfer my prescriptions</span>
          <span className="block text-sm text-ink-tertiary">Switch to PocketPills</span>
        </span>
        <span className="shrink-0 text-ink-tertiary" aria-hidden>›</span>
      </button>
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
          <button key={m.who} className={`${CARD} flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[color:var(--state-hover)]`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-sm font-semibold text-[color:var(--pp-primary-950)]">
              {m.who.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-semibold text-[color:var(--pp-primary-950)]">{m.who}</span>
                <span className="shrink-0 text-2xs text-ink-tertiary">{m.role}</span>
              </span>
              <span className="block truncate text-sm text-ink-tertiary">{m.last}</span>
            </span>
            <span className="shrink-0 text-xs text-ink-tertiary">{m.when}</span>
            {m.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--pp-violet)]" aria-label="unread" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Account ───────────────────────────────────────────── */
const INSURANCE_CARRIERS = [
  "Sun Life",
  "Manulife",
  "Canada Life",
  "Green Shield",
  "Blue Cross",
  "Desjardins",
  "SSQ",
  "Other",
] as const;

type InsDraft = InsurancePlan;

function plansEqual(a: InsDraft[], b: InsDraft[]) {
  return fmtInsuranceList(a) === fmtInsuranceList(b);
}

export function Account() {
  const { user, displayName, update, logOut } = useUser();
  const nav = useNavigate();

  const baselineName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || displayName;
  const [name, setName] = useState(baselineName);
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [dob, setDob] = useState(user?.dob ?? "");
  const [reminders, setReminders] = useState({
    meds: true,
    delivery: true,
    refill: true,
  });

  const baselinePlans = user?.insurances ?? [];
  const [plans, setPlans] = useState<InsDraft[]>(baselinePlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ carrier: "Sun Life", group: "", member: "" });

  const editing = editingId !== null;
  const knownCarriers = INSURANCE_CARRIERS.filter((c) => c !== "Other");
  const carrierSelect = knownCarriers.includes(form.carrier as (typeof knownCarriers)[number])
    ? form.carrier
    : editing || form.carrier
      ? "Other"
      : "";

  const changes = useMemo(() => {
    const rows: ReviewChange[] = [];
    if (name.trim() !== baselineName.trim()) {
      rows.push({ label: "Full name", from: baselineName || "—", to: name.trim() || "—" });
    }
    if (email.trim() !== (user?.email ?? "").trim()) {
      rows.push({ label: "Email", from: user?.email || "—", to: email.trim() || "—" });
    }
    if (phone.trim() !== (user?.phone ?? "").trim()) {
      rows.push({ label: "Phone", from: user?.phone || "—", to: phone.trim() || "—" });
    }
    if (dob.trim() !== (user?.dob ?? "").trim()) {
      rows.push({ label: "Date of birth", from: user?.dob || "—", to: dob.trim() || "—" });
    }
    if (!plansEqual(baselinePlans, plans)) {
      rows.push({
        label: "Insurance",
        from: fmtInsuranceList(baselinePlans),
        to: fmtInsuranceList(plans),
      });
    }
    return rows;
  }, [name, email, phone, dob, baselineName, user?.email, user?.phone, user?.dob, baselinePlans, plans]);

  const resetForm = () => {
    setName([user?.firstName, user?.lastName].filter(Boolean).join(" ") || displayName);
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setDob(user?.dob ?? "");
    setPlans(user?.insurances ?? []);
    setEditingId(null);
    setForm({ carrier: "Sun Life", group: "", member: "" });
  };

  useReviewDraft({
    active: changes.length > 0,
    title: "Profile & settings",
    changes,
    ctaLabel: "Save changes",
    onConfirm: () => {
      const parts = name.trim().split(/\s+/);
      update({
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" "),
        email: email.trim(),
        phone: phone.trim(),
        dob: dob.trim(),
        insurances: plans,
      });
      setEditingId(null);
    },
    onDiscard: resetForm,
  });

  const openAdd = () => {
    setEditingId("new");
    setForm({ carrier: "Sun Life", group: "", member: "" });
  };

  const openEdit = (p: InsDraft) => {
    setEditingId(p.id);
    setForm({ carrier: p.carrier, group: p.group, member: p.member });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ carrier: "Sun Life", group: "", member: "" });
  };

  const applyForm = () => {
    const carrier = form.carrier.trim();
    if (!carrier) return;
    const nextPlan: InsDraft = {
      id: editingId === "new" ? newInsuranceId() : editingId!,
      carrier,
      group: form.group.trim(),
      member: form.member.trim(),
    };
    setPlans((list) => {
      if (editingId === "new") return [...list, nextPlan];
      return list.map((p) => (p.id === editingId ? nextPlan : p));
    });
    cancelEdit();
  };

  const removePlan = (id: string) => {
    setPlans((list) => list.filter((p) => p.id !== id));
    if (editingId === id) cancelEdit();
  };

  const makePrimary = (id: string) => {
    setPlans((list) => {
      const i = list.findIndex((p) => p.id === id);
      if (i <= 0) return list;
      const copy = [...list];
      const [item] = copy.splice(i, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const field = "h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-base text-ink focus:border-primary";
  const labelCls = "mb-1.5 block text-sm font-medium text-ink-secondary";

  return (
    <div>
      <PageHead eyebrow="Account" title="Profile & settings" />

      <div className="space-y-4">
        <section className={`${CARD} p-6`}>
          <h2 className="mb-4 font-display text-md font-medium text-[color:var(--pp-primary-950)]">Personal information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Full name</span>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelCls}>Email</span>
              <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelCls}>Phone</span>
              <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(416) 555-0100" />
            </label>
            <label className="block">
              <span className={labelCls}>Date of birth</span>
              <input className={field} value={dob} onChange={(e) => setDob(e.target.value)} placeholder="YYYY-MM-DD" />
            </label>
          </div>
        </section>

        <section className={`${CARD} p-6`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-md font-medium text-[color:var(--pp-primary-950)]">Insurance</h2>
              <p className="mt-0.5 text-sm text-ink-tertiary">
                Primary plan is billed first; additional plans cover what’s left.
              </p>
            </div>
            <span
              className={`${PILL} ${
                plans.length > 0 ? "bg-wellness-subtle text-wellness" : "bg-surface-1 text-ink-secondary"
              }`}
            >
              {plans.length === 0 ? "None" : plans.length === 1 ? "1 plan" : `${plans.length} plans`}
            </span>
          </div>

          {plans.length === 0 && !editing && (
            <div className="rounded-xl border border-line bg-surface-1 p-4">
              <p className="font-semibold text-[color:var(--pp-primary-950)]">No plan on file</p>
              <p className="mt-1 text-sm text-ink-tertiary">Add a plan to lower your costs at checkout.</p>
              <Button type="button" className="mt-4" size="sm" onClick={openAdd}>
                Add insurance
              </Button>
            </div>
          )}

          {plans.length > 0 && (
            <div className="space-y-3">
              {plans.map((p, i) => (
                <div key={p.id} className="rounded-xl border border-line bg-surface-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[color:var(--pp-primary-950)]">{p.carrier}</p>
                        <span className={`${PILL} bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]`}>
                          {i === 0 ? "Primary" : `Plan ${i + 1}`}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-tertiary">{fmtInsurancePlan(p).replace(`${p.carrier} · `, "") || "Direct bill"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    {i > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => makePrimary(p.id)}>
                        Make primary
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={() => removePlan(p.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {editing && (
            <div className={`space-y-4 ${plans.length > 0 || editingId === "new" ? "mt-4 border-t border-line pt-4" : ""}`}>
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
                {editingId === "new" ? "Add a plan" : "Edit plan"}
              </p>
              <label className="block">
                <span className={labelCls}>Carrier</span>
                <select
                  className={field}
                  value={carrierSelect}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, carrier: v === "Other" ? "" : v }));
                  }}
                >
                  <option value="" disabled>
                    Select carrier
                  </option>
                  {INSURANCE_CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              {carrierSelect === "Other" && (
                <label className="block">
                  <span className={labelCls}>Carrier name</span>
                  <input
                    className={field}
                    value={form.carrier}
                    onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))}
                    placeholder="Your insurance provider"
                  />
                </label>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>Group number</span>
                  <input
                    className={field}
                    value={form.group}
                    onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
                    placeholder="e.g. 4402"
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Member ID</span>
                  <input
                    className={field}
                    value={form.member}
                    onChange={(e) => setForm((f) => ({ ...f, member: e.target.value }))}
                    placeholder="On your card"
                  />
                </label>
              </div>
              <p className="text-xs text-ink-tertiary">
                Nothing is charged until you approve an order. We bill primary first, then secondary plans.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={applyForm} disabled={!form.carrier.trim()}>
                  {editingId === "new" ? "Add to list" : "Update plan"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!editing && plans.length > 0 && (
            <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={openAdd}>
              Add another plan
            </Button>
          )}
        </section>

        <section className={`${CARD} p-6`}>
          <h2 className="mb-1 font-display text-md font-medium text-[color:var(--pp-primary-950)]">Notifications</h2>
          <p className="mb-2 text-sm text-ink-tertiary">Choose what we send you.</p>
          {([
            ["Medication reminders", "meds"] as const,
            ["Delivery updates", "delivery"] as const,
            ["Refill reminders", "refill"] as const,
          ]).map(([n, key]) => (
            <label key={n} className="flex items-center justify-between border-b border-line py-3 last:border-0">
              <span className="text-base text-ink-secondary">{n}</span>
              <input
                type="checkbox"
                checked={reminders[key]}
                onChange={(e) => setReminders((r) => ({ ...r, [key]: e.target.checked }))}
                className="h-5 w-5 accent-[color:var(--pp-primary-950)]"
              />
            </label>
          ))}
        </section>

        <section className={`${CARD} flex flex-wrap items-center gap-4 p-5`}>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">Orders & receipts</p>
            <p className="text-sm text-ink-tertiary">View past orders, receipts, and invoices.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => nav("/orders")}>View</Button>
        </section>

        <section className={`${CARD} flex flex-wrap items-center gap-4 p-5`}>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">Sign out</p>
            <p className="text-sm text-ink-tertiary">You'll need to sign in again to view your orders.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { logOut(); nav("/"); }}>Sign out</Button>
        </section>
      </div>
    </div>
  );
}
