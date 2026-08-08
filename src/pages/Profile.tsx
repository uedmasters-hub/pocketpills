import { useState } from "react";
import { useUser } from "@/lib/user";
import { profileChecklist, pendingRows, type ChecklistId } from "@/lib/profile";

/* ── icons ─────────────────────────────────────────────── */
function RowIcon({ id }: { id: ChecklistId }) {
  const c = {
    width: 22, height: 22, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.5,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "personal":  return <svg {...c}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-3.8 3.4-5.8 7.5-5.8s7.5 2 7.5 5.8" /></svg>;
    case "health":    return <svg {...c}><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" /></svg>;
    case "card":      return <svg {...c}><path d="M9.5 3.5h5v5h5v5h-5v5h-5v-5h-5v-5h5v-5Z" /></svg>;
    case "insurance": return <svg {...c}><path d="M12 3.5l7 2.5v5.5c0 4-3 7.2-7 9-4-1.8-7-5-7-9V6l7-2.5Z" /><path d="m9.2 11.8 2 2 3.6-3.6" /></svg>;
    case "shipping":  return <svg {...c}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5Z" /></svg>;
    default:          return <svg {...c}><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M3 10.5h18" /></svg>;
  }
}

function NeedsAttention() {
  return (
    <span className="text-[#B4541F]" aria-label="Needs attention">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="12" cy="12" r="9" /><path d="M12 8.2v.01M12 11v5" />
      </svg>
    </span>
  );
}

function Done() {
  return (
    <span className="text-wellness" aria-label="Complete">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" /><path d="m8.4 12.2 2.4 2.4 4.6-4.8" />
      </svg>
    </span>
  );
}

/* ── form primitives ───────────────────────────────────── */
const FIELD = "h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-[15px] text-ink outline-none focus:border-primary";
const LABEL = "mb-1.5 block text-[13px] font-medium text-ink-secondary";

function Text({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input className={FIELD} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/** Comma-free tag input for lists like allergies. */
function Tags({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setDraft("");
  };
  return (
    <div>
      <span className={LABEL}>{label}</span>
      <div className="flex gap-2">
        <input className={FIELD} value={draft} placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button onClick={add}
          className="shrink-0 rounded-xl border border-line px-4 text-[14px] font-medium text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-100)]">
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {items.map((it) => (
            <span key={it} className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-[13px] font-medium text-[color:var(--pp-primary-950)]">
              {it}
              <button onClick={() => onChange(items.filter((x) => x !== it))} aria-label={`Remove ${it}`}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];

/* ── page ──────────────────────────────────────────────── */
export function Profile() {
  const { user, update } = useUser();
  const rows = profileChecklist(user);
  const outstanding = pendingRows(user).length;

  const [open, setOpen] = useState<ChecklistId | null>(null);
  const [saved, setSaved] = useState<ChecklistId | null>(null);

  /* Draft state per section, seeded from the profile. */
  const [f, setF] = useState({
    firstName: user?.firstName ?? "", lastName: user?.lastName ?? "",
    dob: user?.dob ?? "", phone: user?.phone ?? "",
    allergies: user?.allergies ?? [], conditions: user?.conditions ?? [],
    province: user?.province ?? "ON", healthCard: user?.healthCard ?? "",
    hasInsurance: Boolean(user?.insurance),
    carrier: user?.insurance?.carrier ?? "", group: user?.insurance?.group ?? "", member: user?.insurance?.member ?? "",
    address: user?.address ?? "",
    card: "", exp: "", cvc: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const commit = (id: ChecklistId) => {
    if (id === "personal") update({ firstName: f.firstName, lastName: f.lastName, dob: f.dob, phone: f.phone });
    if (id === "health") update({ allergies: f.allergies, conditions: f.conditions });
    if (id === "card") update({ province: f.province, healthCard: f.healthCard });
    if (id === "insurance")
      update({ insurance: f.hasInsurance ? { carrier: f.carrier || "Sun Life", group: f.group, member: f.member } : null });
    if (id === "shipping") update({ address: f.address });
    if (id === "payment")
      update({ paymentOnFile: f.card.replace(/\s/g, "").length >= 12, cardLast4: f.card.replace(/\s/g, "").slice(-4) });

    setSaved(id);
    setOpen(null);
    setTimeout(() => setSaved(null), 2000);
  };

  const editor = (id: ChecklistId) => {
    switch (id) {
      case "personal":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="First name" value={f.firstName} onChange={(v) => set("firstName", v)} />
            <Text label="Last name" value={f.lastName} onChange={(v) => set("lastName", v)} />
            <Text label="Date of birth" value={f.dob} onChange={(v) => set("dob", v)} placeholder="YYYY-MM-DD" />
            <Text label="Phone" value={f.phone} onChange={(v) => set("phone", v)} placeholder="(416) 555-0100" />
          </div>
        );
      case "health":
        return (
          <div className="space-y-4">
            <Tags label="Allergies" items={f.allergies} onChange={(v) => set("allergies", v)} placeholder="e.g. penicillin" />
            <Tags label="Conditions (optional)" items={f.conditions} onChange={(v) => set("conditions", v)} placeholder="e.g. asthma" />
            <p className="text-[12px] text-ink-tertiary">
              Your pharmacist reviews this before dispensing. If you have none, add “None” so we know it's been checked.
            </p>
          </div>
        );
      case "card":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Province</span>
              <select className={FIELD} value={f.province} onChange={(e) => set("province", e.target.value)}>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <Text label="Health card number" value={f.healthCard} onChange={(v) => set("healthCard", v)} placeholder="Province + number" />
          </div>
        );
      case "insurance":
        return (
          <div className="space-y-4">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span>
                <span className="text-[15px] font-medium text-[color:var(--pp-primary-950)]">I have private insurance</span>
                <span className="mt-0.5 block text-[13px] text-ink-tertiary">We'll bill your plan directly so you pay less.</span>
              </span>
              <span onClick={() => set("hasInsurance", !f.hasInsurance)} role="switch" aria-checked={f.hasInsurance} tabIndex={0}
                className={"relative h-7 w-12 shrink-0 rounded-full transition-colors " + (f.hasInsurance ? "bg-[color:var(--pp-primary-950)]" : "bg-stone-300")}>
                <span className={"absolute top-1 h-5 w-5 rounded-full bg-white transition-all " + (f.hasInsurance ? "left-6" : "left-1")} />
              </span>
            </label>
            {f.hasInsurance && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Text label="Carrier" value={f.carrier} onChange={(v) => set("carrier", v)} placeholder="Sun Life" />
                <Text label="Group #" value={f.group} onChange={(v) => set("group", v)} />
                <Text label="Member ID" value={f.member} onChange={(v) => set("member", v)} />
              </div>
            )}
          </div>
        );
      case "shipping":
        return <Text label="Delivery address" value={f.address} onChange={(v) => set("address", v)} placeholder="Street, city, province, postal code" />;
      default:
        return (
          <div className="space-y-4">
            <Text label="Card number" value={f.card} onChange={(v) => set("card", v)} placeholder="4242 4242 4242 4242" />
            <div className="grid grid-cols-2 gap-4">
              <Text label="Expiry" value={f.exp} onChange={(v) => set("exp", v)} placeholder="12 / 27" />
              <Text label="CVC" value={f.cvc} onChange={(v) => set("cvc", v)} placeholder="123" />
            </div>
            <p className="text-[12px] text-ink-tertiary">Demo only — no card is stored or charged.</p>
          </div>
        );
    }
  };

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--pp-violet)]">Profile</p>
        <h1 className="mt-2 font-display text-[clamp(24px,2.8vw,32px)] font-extrabold tracking-tight text-[color:var(--pp-primary-950)]">
          Your profile
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-secondary">
          {outstanding > 0
            ? `${outstanding} section${outstanding === 1 ? "" : "s"} still need attention. Completing them lets us bill your plans and deliver without delay.`
            : "Everything's up to date. We'll let you know if anything needs a refresh."}
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl bg-surface-2">
        {rows.map((r, i) => {
          const isOpen = open === r.id;
          return (
            <div key={r.id} className={i < rows.length - 1 || isOpen ? "border-b border-line" : ""}>
              <button
                onClick={() => setOpen(isOpen ? null : r.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-[color:var(--pp-primary-100)]"
              >
                <span className="shrink-0 text-[color:var(--pp-primary-950)]"><RowIcon id={r.id} /></span>
                <span className="min-w-0 flex-1 text-[15px] text-[color:var(--pp-primary-950)]">{r.label}</span>

                {saved === r.id
                  ? <span className="text-[13px] font-medium text-wellness">Saved</span>
                  : r.done
                    ? <span className="flex items-center gap-2">
                        <span className="text-[15px] text-ink-tertiary">{r.value ?? "Added"}</span>
                        {r.required && <Done />}
                      </span>
                    : <NeedsAttention />}

                <span className={"shrink-0 text-ink-tertiary transition-transform " + (isOpen ? "rotate-90" : "")} aria-hidden>›</span>
              </button>

              {isOpen && (
                <div className="animate-fade-up bg-surface-1 px-6 pb-6 pt-1">
                  {editor(r.id)}
                  <div className="mt-5 flex items-center gap-3">
                    <button onClick={() => commit(r.id)}
                      className="rounded-full bg-[color:var(--pp-primary-950)] px-6 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90">
                      Save
                    </button>
                    <button onClick={() => setOpen(null)}
                      className="rounded-full px-4 py-2.5 text-[14px] font-medium text-ink-secondary hover:text-[color:var(--pp-primary-950)]">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[12px] text-ink-tertiary">
        Your information is encrypted and never shared without your permission.
      </p>
    </div>
  );
}
