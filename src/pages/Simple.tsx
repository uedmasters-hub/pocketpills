import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DateOfBirthField } from "@/components/DateOfBirthField";
import { PhoneField } from "@/components/PhoneField";
import { useUser, newInsuranceId, fmtInsuranceList, fmtInsurancePlan, type InsurancePlan } from "@/lib/user";
import { useI18n } from "@/lib/i18n";
import { useReviewDraft, type ReviewChange } from "@/lib/rightRail";

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
            <DateOfBirthField label={tx("Date of birth")} value={dob} onChange={setDob} />
            <PhoneField label={tx("Phone")} value={phone} onChange={setPhone} />
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
              [tx("Notifications"), tx("Order, refill, and care updates"), "/notifications"],
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
