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
import { useI18n } from "@/lib/i18n";
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
  const { tx } = useI18n();
  return <span className={`${PILL} ${tone[statusMeta[status].tone]}`}>{tx(statusMeta[status].label)}</span>;
}

/* ── Pharmacy ──────────────────────────────────────────── */
export function Pharmacy() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const all = getOrders();
  const transfers = all.filter((o) => o.type === "transfer" && o.status !== "delivered" && o.status !== "cancelled");
  const active = all.filter((o) => o.type !== "transfer" && o.status !== "delivered" && o.status !== "cancelled");
  const recent = all.filter((o) => o.status === "delivered").slice(0, 3);

  return (
    <div>
      <PageHead
        eyebrow={tx("Pharmacy")}
        title={tx("Orders & refills")}
        sub={tx("Track deliveries, transfers, manage refills, and view receipts.")}
      />

      {transfers.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="font-display text-md font-medium text-[color:var(--pp-primary-950)]">{tx("Transfers to track")}</h2>
            <p className="text-xs text-ink-tertiary">{tx("Tap a card for full detail")}</p>
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
                        {tx("From")} {o.fromPharmacy ?? tx("your pharmacy")} · {fmtDate(o.date)}
                      </p>
                    </div>
                    <span className={`${PILL} bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]`}>
                      {tx(transferStatusLabel(o.status))}
                    </span>
                  </div>

                  <ol className="mt-4 flex gap-1.5" aria-label={tx("Transfer progress")}>
                    {TRANSFER_TRACK_STEPS.map((label, i) => (
                      <li key={label} className="min-w-0 flex-1" title={tx(label)}>
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
                    <span>{tx(TRANSFER_TRACK_STEPS[step])}</span>
                    <span className="tnum">{Math.round(pct)}%</span>
                  </div>

                  <div className="mt-4 rounded-xl bg-[color:var(--pp-primary-200)] px-3.5 py-3">
                    <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">{tx("Next cue")}</p>
                    <p className="mt-1 text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(nextHint.title)}</p>
                    <p className="mt-0.5 text-sm text-ink-secondary">{tx(nextHint.detail)}</p>
                  </div>

                  <p className="mt-3 text-sm font-medium text-[color:var(--pp-violet)]">{tx("View transfer details →")}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 font-display text-md font-medium text-[color:var(--pp-primary-950)]">{tx("In progress")}</h2>
          <div className="space-y-3">
            {active.map((o) => {
              const t = orderTotals(o);
              const pct = o.status === "verifying" ? 33 : o.status === "processing" ? 55 : 80;
              return (
                <button type="button" key={o.id} onClick={() => nav(`/orders/${o.id}`)} className={`${CARD} w-full p-5 text-left transition-colors hover:bg-[color:var(--state-hover)]`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[color:var(--pp-primary-950)]">{o.id}</p>
                      <p className="text-sm text-ink-tertiary">{fmtDate(o.date)} · {o.items.length} {o.items.length === 1 ? tx("item") : tx("items")} · {money(t.total)}</p>
                    </div>
                    <StatusPill status={o.status} />
                  </div>
                  <div
                    className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-1"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Order ${o.id} progress`}
                  >
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
          <h2 className="font-display text-md font-medium text-[color:var(--pp-primary-950)]">{tx("Recent orders")}</h2>
          <Link to="/orders" className="text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">{tx("View all")}</Link>
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
          <span className="block font-semibold text-[color:var(--pp-primary-950)]">{tx("Transfer my prescriptions")}</span>
          <span className="block text-sm text-ink-tertiary">{tx("Switch to PocketPills")}</span>
        </span>
        <span className="shrink-0 text-ink-tertiary" aria-hidden>›</span>
      </button>
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
  const { t, tx } = useI18n();
  const nav = useNavigate();

  const baselineName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || displayName;
  const [name, setName] = useState(baselineName);
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [dob, setDob] = useState(user?.dob ?? "");

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
      rows.push({ label: tx("Full name"), from: baselineName || "—", to: name.trim() || "—" });
    }
    if (email.trim() !== (user?.email ?? "").trim()) {
      rows.push({ label: tx("Email"), from: user?.email || "—", to: email.trim() || "—" });
    }
    if (phone.trim() !== (user?.phone ?? "").trim()) {
      rows.push({ label: tx("Phone"), from: user?.phone || "—", to: phone.trim() || "—" });
    }
    if (dob.trim() !== (user?.dob ?? "").trim()) {
      rows.push({ label: tx("Date of birth"), from: user?.dob || "—", to: dob.trim() || "—" });
    }
    if (!plansEqual(baselinePlans, plans)) {
      const from = fmtInsuranceList(baselinePlans);
      const to = fmtInsuranceList(plans);
      rows.push({
        label: tx("Insurance"),
        from: from === "None" ? tx("None") : from,
        to: to === "None" ? tx("None") : to,
      });
    }
    return rows;
  }, [name, email, phone, dob, baselineName, user?.email, user?.phone, user?.dob, baselinePlans, plans, tx]);

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
    title: tx("Edit profile"),
    changes,
    ctaLabel: tx("Save changes"),
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
      <PageHead
        eyebrow={tx("Account")}
        title={tx("Edit profile")}
        sub={tx("Update your personal details, insurance, and account shortcuts.")}
      />

      <div className="space-y-4">
        <section className={`${CARD} p-6`}>
          <h2 className="mb-4 font-display text-md font-medium text-[color:var(--pp-primary-950)]">{tx("Personal information")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>{tx("Full name")}</span>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelCls}>{tx("Email")}</span>
              <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelCls}>{tx("Phone")}</span>
              <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(416) 555-0100" />
            </label>
            <label className="block">
              <span className={labelCls}>{tx("Date of birth")}</span>
              <input className={field} value={dob} onChange={(e) => setDob(e.target.value)} placeholder="YYYY-MM-DD" />
            </label>
          </div>
        </section>

        <section className={`${CARD} p-6`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-md font-medium text-[color:var(--pp-primary-950)]">{tx("Insurance")}</h2>
              <p className="mt-0.5 text-sm text-ink-tertiary">
                {tx("Primary plan is billed first; additional plans cover what’s left.")}
              </p>
            </div>
            <span
              className={`${PILL} ${
                plans.length > 0 ? "bg-wellness-subtle text-wellness" : "bg-surface-1 text-ink-secondary"
              }`}
            >
              {plans.length === 0
                ? tx("None")
                : plans.length === 1
                  ? tx("1 plan")
                  : `${plans.length} ${tx("plans")}`}
            </span>
          </div>

          {plans.length === 0 && !editing && (
            <div className="rounded-xl border border-line bg-surface-1 p-4">
              <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("No plan on file")}</p>
              <p className="mt-1 text-sm text-ink-tertiary">{tx("Add a plan to lower your costs at checkout.")}</p>
              <Button type="button" className="mt-4" size="sm" onClick={openAdd}>
                {tx("Add insurance")}
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
                          {i === 0 ? tx("Primary") : `${tx("Plan")} ${i + 1}`}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-tertiary">{fmtInsurancePlan(p).replace(`${p.carrier} · `, "") || tx("Direct bill")}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(p)}>
                      {tx("Edit")}
                    </Button>
                    {i > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => makePrimary(p.id)}>
                        {tx("Make primary")}
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={() => removePlan(p.id)}>
                      {tx("Remove")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {editing && (
            <div className={`space-y-4 ${plans.length > 0 || editingId === "new" ? "mt-4 border-t border-line pt-4" : ""}`}>
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
                {editingId === "new" ? tx("Add a plan") : tx("Edit plan")}
              </p>
              <label className="block">
                <span className={labelCls}>{tx("Carrier")}</span>
                <select
                  className={field}
                  value={carrierSelect}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, carrier: v === "Other" ? "" : v }));
                  }}
                >
                  <option value="" disabled>
                    {tx("Select carrier")}
                  </option>
                  {INSURANCE_CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c === "Other" ? tx("Other") : c}
                    </option>
                  ))}
                </select>
              </label>
              {carrierSelect === "Other" && (
                <label className="block">
                  <span className={labelCls}>{tx("Carrier name")}</span>
                  <input
                    className={field}
                    value={form.carrier}
                    onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))}
                    placeholder={tx("Your insurance provider")}
                  />
                </label>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>{tx("Group number")}</span>
                  <input
                    className={field}
                    value={form.group}
                    onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
                    placeholder={tx("e.g. 4402")}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>{tx("Member ID")}</span>
                  <input
                    className={field}
                    value={form.member}
                    onChange={(e) => setForm((f) => ({ ...f, member: e.target.value }))}
                    placeholder={tx("On your card")}
                  />
                </label>
              </div>
              <p className="text-xs text-ink-tertiary">
                {tx("Nothing is charged until you approve an order. We bill primary first, then secondary plans.")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={applyForm} disabled={!form.carrier.trim()}>
                  {editingId === "new" ? tx("Add to list") : tx("Update plan")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                  {tx("Cancel")}
                </Button>
              </div>
            </div>
          )}

          {!editing && plans.length > 0 && (
            <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={openAdd}>
              {tx("Add another plan")}
            </Button>
          )}
        </section>

        <section className={`${CARD} overflow-hidden`}>
          <h2 className="border-b border-line px-6 py-4 font-display text-md font-medium text-[color:var(--pp-primary-950)]">
            {tx("Account settings")}
          </h2>
          {(
            [
              [tx("Notification settings"), tx("Reminders, delivery, and care messages"), "/account/notifications"],
              [t("menu.language"), t("account.languageDesc"), "/account/language"],
              [t("menu.family"), tx("People you manage medications for"), "/account/family"],
              [t("menu.benefits"), tx("What’s included with your account"), "/account/benefits"],
              [t("menu.switch"), tx("Use another profile on this device"), "/account/switch"],
            ] as const
          ).map(([title, sub, to], i, arr) => (
            <Link
              key={to}
              to={to}
              className={
                "flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[color:var(--state-hover)] " +
                (i < arr.length - 1 ? "border-b border-line" : "")
              }
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-[color:var(--pp-primary-950)]">{title}</span>
                <span className="block text-sm text-ink-tertiary">{sub}</span>
              </span>
              <span className="text-ink-tertiary" aria-hidden>›</span>
            </Link>
          ))}
        </section>

        <section className={`${CARD} flex flex-wrap items-center gap-4 p-5`}>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Orders & receipts")}</p>
            <p className="text-sm text-ink-tertiary">{tx("View past orders, receipts, and invoices.")}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => nav("/orders")}>{tx("View")}</Button>
        </section>

        <section className={`${CARD} flex flex-wrap items-center gap-4 p-5`}>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Log out")}</p>
            <p className="text-sm text-ink-tertiary">{tx("You'll need to sign in again to view your orders.")}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { logOut(); nav("/"); }}>{tx("Log out")}</Button>
        </section>
      </div>
    </div>
  );
}
