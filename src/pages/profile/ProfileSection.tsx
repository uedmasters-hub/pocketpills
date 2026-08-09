import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useUser, newInsuranceId, primaryInsurance, fmtInsuranceList, fmtInsurancePlan, type InsurancePlan } from "@/lib/user";
import { profileChecklist, isChecklistId, type ChecklistId } from "@/lib/profile";
import { useReviewDraft, type ReviewChange } from "@/lib/rightRail";
import { Switch } from "@/components/ui";

const FIELD = "h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-base text-ink outline-none focus:border-primary";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";
const CARD = "rounded-2xl border border-line bg-surface-2 p-6";

function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input className={FIELD} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Tags({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => { const v = draft.trim(); if (v && !items.includes(v)) onChange([...items, v]); setDraft(""); };
  const inputId = `tags-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={inputId} className={LABEL}>{label}</label>
      <div className="flex gap-2">
        <input
          id={inputId}
          className={FIELD}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} className="shrink-0 rounded-xl border border-line px-4 text-sm font-medium text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]">Add</button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-2" aria-label={label}>
          {items.map((it) => (
            <li key={it} className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-sm font-medium text-[color:var(--pp-primary-950)]">
              {it}
              <button type="button" onClick={() => onChange(items.filter((x) => x !== it))} aria-label={`Remove ${it}`}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Summary of what's on file, in the reference's read-first style. */
function SummaryLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="mt-3 flex items-center gap-3 text-base text-ink-secondary">
      <span className="shrink-0 text-[color:var(--pp-violet)]">{icon}</span>
      {children}
    </p>
  );
}
const Ico = {
  phone: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 4h3l2 5-2 1.5a11 11 0 0 0 5.5 5.5L15 14l5 2v3a1.5 1.5 0 0 1-1.7 1.5A16 16 0 0 1 3.5 5.7A1.5 1.5 0 0 1 5 4Z" /></svg>,
  mail: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>,
  pin: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>,
  card: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M3 10.5h18" /></svg>,
  shield: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3.5 19 6v5.5c0 4-3 7.2-7 9-4-1.8-7-5-7-9V6l7-2.5Z" /></svg>,
  heart: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" /></svg>,
};

/** Yes/No question card — the split-button pattern from the reference. */
function QuestionCard({ q, sub, value, onAnswer }: { q: string; sub: string; value: boolean | null | undefined; onAnswer: (v: boolean) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-2">
      <div className="relative p-6">
        <p className="relative z-10 max-w-[60%] font-display text-lg font-medium text-[color:var(--pp-primary-950)]">{q}</p>
        <p className="relative z-10 mt-1 max-w-[60%] text-sm text-ink-tertiary">{sub}</p>
        <span className="pointer-events-none absolute inset-y-0 right-0 w-[42%]"
          style={{ backgroundImage: "linear-gradient(120deg,#F3F1FB 0%,#DED8F5 60%,#CFC7EF 100%)" }} aria-hidden />
      </div>
      <div className="grid grid-cols-2 border-t border-line" role="group" aria-label={q}>
        {([["No", false], ["Yes", true]] as const).map(([label, v]) => {
          const active = value === v;
          return (
            <button
              key={String(label)}
              type="button"
              aria-pressed={active}
              onClick={() => onAnswer(v)}
              className={
                "py-4 text-base font-medium transition-colors " +
                (active ? "bg-[color:var(--pp-primary-950)] text-white" : "bg-surface-1 text-ink-secondary hover:bg-[color:var(--state-hover)]") +
                (label === "No" ? " border-r border-line" : "")
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];

const META: Record<ChecklistId, { title: string; blurb: string }> = {
  personal:  { title: "Personal details", blurb: "So your prescriptions carry the right name and we can reach you." },
  health:    { title: "Health information", blurb: "Your pharmacist reviews this before dispensing." },
  card:      { title: "Provincial Health Card", blurb: "So we can direct-bill your provincial plan." },
  insurance: { title: "Insurance", blurb: "We'll bill your plan directly so you pay less." },
  shipping:  { title: "Shipping address", blurb: "Free delivery, anywhere in Canada." },
  payment:   { title: "Payment details", blurb: "Only charged for what your plan doesn't cover." },
};

function SectionSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="pp-skeleton h-4 w-16" />
      <div className="mt-5 flex items-center gap-3">
        <div className="pp-skeleton h-9 w-64" />
        <div className="pp-skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="pp-skeleton mt-3 h-4 w-80" />
      <div className="mt-6 max-w-3xl space-y-4">
        <div className="pp-skeleton h-32 w-full rounded-2xl" />
        <div className="pp-skeleton h-56 w-full rounded-2xl" />
      </div>
      <span className="sr-only">Loading section…</span>
    </div>
  );
}

export function ProfileSection() {
  const { section } = useParams();
  const nav = useNavigate();
  const { user, update } = useUser();

  /* All hooks run before any conditional return — an invalid :section must not
     change the hook count between renders. */
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const primary = primaryInsurance(user);
  const [f, setF] = useState({
    firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", dob: user?.dob ?? "",
    phone: user?.phone ?? "", email: user?.email ?? "", gender: user?.gender ?? "",
    allergies: user?.allergies ?? [], conditions: user?.conditions ?? [],
    province: user?.province ?? "ON", healthCard: user?.healthCard ?? "",
    hasInsurance: Boolean(primary), carrier: primary?.carrier ?? "",
    group: primary?.group ?? "", member: primary?.member ?? "",
    address: user?.address ?? "", card: "", exp: "", cvc: "",
  });

  /* Data is local, so this is a transition — it stops the route change from
     snapping in mid-paint rather than masking a real fetch. */
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), 220);
    return () => clearTimeout(t);
  }, [section]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const valid = isChecklistId(section);
  const id = (valid ? section : "personal") as ChecklistId;
  const row = profileChecklist(user).find((r) => r.id === id)!;

  const save = () => {
    if (id === "personal") update({ firstName: f.firstName, lastName: f.lastName, dob: f.dob, phone: f.phone, email: f.email, gender: f.gender });
    if (id === "health") update({ allergies: f.allergies, conditions: f.conditions });
    if (id === "card") update({ province: f.province, healthCard: f.healthCard });
    if (id === "insurance") {
      if (!f.hasInsurance) update({ insurances: [] });
      else {
        const rest = (user?.insurances ?? []).slice(1);
        const nextPrimary: InsurancePlan = {
          id: primary?.id ?? newInsuranceId(),
          carrier: f.carrier || "Sun Life",
          group: f.group,
          member: f.member,
        };
        update({ insurances: [nextPrimary, ...rest] });
      }
    }
    if (id === "shipping") update({ address: f.address });
    if (id === "payment") update({ paymentOnFile: f.card.replace(/\s/g, "").length >= 12, cardLast4: f.card.replace(/\s/g, "").slice(-4) });
    setSaved(true);
    setTimeout(() => { setSaved(false); nav("/profile"); }, 900);
  };

  const changes = useMemo(() => {
    const rows: ReviewChange[] = [];
    if (id === "personal") {
      if (f.firstName !== (user?.firstName ?? "")) rows.push({ label: "First name", from: user?.firstName || "—", to: f.firstName || "—" });
      if (f.lastName !== (user?.lastName ?? "")) rows.push({ label: "Last name", from: user?.lastName || "—", to: f.lastName || "—" });
      if (f.dob !== (user?.dob ?? "")) rows.push({ label: "Date of birth", from: user?.dob || "—", to: f.dob || "—" });
      if (f.phone !== (user?.phone ?? "")) rows.push({ label: "Phone", from: user?.phone || "—", to: f.phone || "—" });
      if (f.email !== (user?.email ?? "")) rows.push({ label: "Email", from: user?.email || "—", to: f.email || "—" });
      if (f.gender !== (user?.gender ?? "")) rows.push({ label: "Gender", from: user?.gender || "—", to: f.gender || "—" });
    }
    if (id === "health") {
      const a0 = (user?.allergies ?? []).join(", ") || "None";
      const a1 = f.allergies.join(", ") || "None";
      if (a0 !== a1) rows.push({ label: "Allergies", from: a0, to: a1 });
      const c0 = (user?.conditions ?? []).join(", ") || "None";
      const c1 = f.conditions.join(", ") || "None";
      if (c0 !== c1) rows.push({ label: "Conditions", from: c0, to: c1 });
    }
    if (id === "card") {
      if (f.province !== (user?.province ?? "ON")) rows.push({ label: "Province", from: user?.province || "—", to: f.province });
      if (f.healthCard !== (user?.healthCard ?? "")) rows.push({ label: "Health card", from: user?.healthCard || "—", to: f.healthCard || "—" });
    }
    if (id === "insurance") {
      const prev = fmtInsuranceList(user?.insurances ?? []);
      const next = f.hasInsurance
        ? fmtInsuranceList([
            { id: "draft", carrier: f.carrier || "Sun Life", group: f.group, member: f.member },
            ...(user?.insurances ?? []).slice(1),
          ])
        : "None";
      if (prev !== next) rows.push({ label: "Insurance", from: prev, to: next });
    }
    if (id === "shipping" && f.address !== (user?.address ?? "")) {
      rows.push({ label: "Address", from: user?.address || "—", to: f.address || "—" });
    }
    if (id === "payment" && f.card.replace(/\s/g, "").length >= 4) {
      const next = `····${f.card.replace(/\s/g, "").slice(-4)}`;
      const prev = user?.cardLast4 ? `····${user.cardLast4}` : "None";
      if (next !== prev) rows.push({ label: "Card", from: prev, to: next });
    }
    return rows;
  }, [id, f, user]);

  const resetForm = () => {
    setF({
      firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", dob: user?.dob ?? "",
      phone: user?.phone ?? "", email: user?.email ?? "", gender: user?.gender ?? "",
      allergies: user?.allergies ?? [], conditions: user?.conditions ?? [],
      province: user?.province ?? "ON", healthCard: user?.healthCard ?? "",
      hasInsurance: Boolean(primaryInsurance(user)), carrier: primaryInsurance(user)?.carrier ?? "",
      group: primaryInsurance(user)?.group ?? "", member: primaryInsurance(user)?.member ?? "",
      address: user?.address ?? "", card: "", exp: "", cvc: "",
    });
  };

  useReviewDraft({
    active: ready && changes.length > 0,
    title: META[id].title,
    changes,
    ctaLabel: saved ? "Saved" : "Save changes",
    onConfirm: save,
    onDiscard: resetForm,
  });

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  if (!valid) return <Navigate to="/profile" replace />;
  if (!ready) return <SectionSkeleton />;

  return (
    <div className="animate-fade-up">
      <Link to="/profile" className="inline-flex items-center gap-1.5 text-base font-medium text-[color:var(--pp-primary-950)] hover:opacity-70">
        <span aria-hidden>‹</span> Back
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {META[id].title}
        </h1>
        <span className={
          "rounded-full px-3 py-1 text-xs font-semibold " +
          (row.required ? "bg-[#FBF1E9] text-[#B4541F]" : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
        }>
          {row.required ? "Required" : "Optional"}
        </span>
      </div>
      <p className="mt-2 text-base text-ink-secondary">{META[id].blurb}</p>

      {/* what's on file */}
      {row.done && (
        <div className={`${CARD} mt-6`}>
          {id === "personal" && (<>
            <p className="text-lg font-semibold text-[color:var(--pp-primary-950)]">{fullName || "—"}</p>
            <p className="mt-1 text-base text-ink-secondary">
              {[user?.gender, user?.dob && `DOB ${user.dob}`].filter(Boolean).join(" / ") || "—"}
            </p>
            {user?.phone && <SummaryLine icon={Ico.phone}>{user.phone}</SummaryLine>}
            {user?.email && <SummaryLine icon={Ico.mail}>{user.email}</SummaryLine>}
          </>)}
          {id === "health" && (<>
            <p className="text-base font-semibold text-[color:var(--pp-primary-950)]">On file</p>
            <SummaryLine icon={Ico.heart}>Allergies: {user?.allergies?.join(", ") || "None"}</SummaryLine>
            {user?.conditions?.length ? <SummaryLine icon={Ico.heart}>Conditions: {user.conditions.join(", ")}</SummaryLine> : null}
          </>)}
          {id === "card" && <SummaryLine icon={Ico.card}>{user?.province} · {user?.healthCard}</SummaryLine>}
          {id === "insurance" && (
            <SummaryLine icon={Ico.shield}>
              {(user?.insurances?.length ?? 0) > 0
                ? user!.insurances.map((p, i) => `${i === 0 ? "Primary" : `Plan ${i + 1}`}: ${fmtInsurancePlan(p)}`).join(" · ")
                : "No plan on file"}
            </SummaryLine>
          )}
          {id === "shipping" && <SummaryLine icon={Ico.pin}>{user?.address}</SummaryLine>}
          {id === "payment" && <SummaryLine icon={Ico.card}>{user?.cardLast4 ? `Visa ····${user.cardLast4}` : "On file"}</SummaryLine>}
        </div>
      )}

      {/* editor */}
      <div className={`${CARD} mt-4 space-y-4`}>
        <p className="text-base font-semibold text-[color:var(--pp-primary-950)]">
          {row.done ? "Update your details" : "Add your details"}
        </p>

        {id === "personal" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="First name" value={f.firstName} onChange={(v) => set("firstName", v)} />
            <Text label="Last name" value={f.lastName} onChange={(v) => set("lastName", v)} />
            <Text label="Date of birth" value={f.dob} onChange={(v) => set("dob", v)} placeholder="YYYY-MM-DD" />
            <label className="block">
              <span className={LABEL}>Sex assigned at birth</span>
              <select className={FIELD} value={f.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Prefer not to say</option>
                <option>Female</option><option>Male</option><option>Intersex</option>
              </select>
            </label>
            <Text label="Phone" value={f.phone} onChange={(v) => set("phone", v)} placeholder="+1 953-800-0060" />
            <Text label="Email" value={f.email} onChange={(v) => set("email", v)} />
          </div>
        )}
        {id === "health" && (<>
          <Tags label="Allergies" items={f.allergies} onChange={(v) => set("allergies", v)} placeholder="e.g. penicillin" />
          <Tags label="Conditions (optional)" items={f.conditions} onChange={(v) => set("conditions", v)} placeholder="e.g. asthma" />
          <p className="text-xs text-ink-tertiary">If you have none, add “None” so we know it's been checked.</p>
        </>)}
        {id === "card" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Province</span>
              <select className={FIELD} value={f.province} onChange={(e) => set("province", e.target.value)}>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <Text label="Health card number" value={f.healthCard} onChange={(v) => set("healthCard", v)} />
          </div>
        )}
        {id === "insurance" && (<>
          <Switch
            checked={f.hasInsurance}
            onChange={(v) => set("hasInsurance", v)}
            label="I have private insurance"
          />
          {f.hasInsurance && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Text label="Primary carrier" value={f.carrier} onChange={(v) => set("carrier", v)} placeholder="Sun Life" />
              <Text label="Group #" value={f.group} onChange={(v) => set("group", v)} />
              <Text label="Member ID" value={f.member} onChange={(v) => set("member", v)} />
            </div>
          )}
          <p className="text-xs text-ink-tertiary">
            Edits your primary plan. Manage multiple plans in Edit profile.
          </p>
        </>)}
        {id === "shipping" && <Text label="Delivery address" value={f.address} onChange={(v) => set("address", v)} placeholder="Street, city, province, postal code" />}
        {id === "payment" && (<>
          <Text label="Card number" value={f.card} onChange={(v) => set("card", v)} placeholder="4242 4242 4242 4242" />
          <div className="grid grid-cols-2 gap-4">
            <Text label="Expiry" value={f.exp} onChange={(v) => set("exp", v)} placeholder="12 / 27" />
            <Text label="CVC" value={f.cvc} onChange={(v) => set("cvc", v)} />
          </div>
          <p className="text-xs text-ink-tertiary">Demo only — no card is stored or charged.</p>
        </>)}

        {changes.length === 0 && (
          <div className="flex items-center gap-3 pt-1">
            <Link to="/profile" className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-secondary hover:text-[color:var(--pp-primary-950)]">
              Back to profile
            </Link>
          </div>
        )}
        {changes.length > 0 && (
          <p className="pt-1 text-sm text-ink-tertiary">
            Review your updates in the panel, then save.
          </p>
        )}
      </div>

      {/* contextual question, per the reference */}
      {id === "personal" && (
        <div className="mt-4">
          <QuestionCard
            q="Do you have a family doctor?"
            sub="Get faster medication renewals"
            value={user?.familyDoctor}
            onAnswer={(v) => update({ familyDoctor: v })}
          />
        </div>
      )}
    </div>
  );
}

