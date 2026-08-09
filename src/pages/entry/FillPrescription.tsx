import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EntryFlow } from "@/components/layout/EntryFlow";
import { Card, Field, Badge } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { drugs } from "@/lib/data";

const DISPENSING_FEE = 11.99;
const STEPS = ["method", "capture", "meds", "patient", "packaging", "insurance", "delivery", "review", "payment"] as const;
type Step = (typeof STEPS)[number] | "done";
type Method = "upload" | "fax" | "mail" | "transfer";

interface Med {
  id: string; slug?: string; name: string; strength: string; qty: number;
  directions: string; asNeeded: boolean; price: number; coverage: number; dosages: string[];
}
interface State {
  method: Method | null;
  files: string[];
  clinic: string; prescriber: string;
  mailAddress: string; transferPharmacy: string; transferPhone: string;
  meds: Med[];
  who: "self" | "other"; otherName: string; otherDob: string; otherRel: string;
  province: string; healthNumber: string;
  allergies: string[]; currentMeds: string[]; pregnant: string;
  packaging: "pocketpacks" | "vials"; autoRefill: boolean; genericOk: boolean;
  useProvincial: boolean; hasPrivate: boolean; carrier: string; group: string; member: string; payOOP: boolean;
  address: string; speed: "standard" | "sameday"; leaveAtDoor: boolean; notes: string;
  card: string; exp: string; cvc: string;
}

const initial: State = {
  method: null, files: [], clinic: "", prescriber: "",
  mailAddress: "", transferPharmacy: "", transferPhone: "",
  meds: [], who: "self", otherName: "", otherDob: "", otherRel: "",
  province: "ON", healthNumber: "", allergies: [], currentMeds: [], pregnant: "",
  packaging: "pocketpacks", autoRefill: true, genericOk: true,
  useProvincial: true, hasPrivate: true, carrier: "Sun Life", group: "4402", member: "", payOOP: false,
  address: "221 King St W, Toronto, ON", speed: "standard", leaveAtDoor: true, notes: "",
  card: "", exp: "", cvc: "",
};

/* ── small helpers ──────────────────────────────────────── */
function RadioCards<T extends string>({ options, value, onChange }: {
  options: { id: T; icon: string; title: string; desc: string }[]; value: T | null; onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-3">
      {options.map((o) => (
        <Card key={o.id} interactive onClick={() => onChange(o.id)}
          className={"flex items-center gap-4 p-4 " + (value === o.id ? "ring-2 ring-primary" : "")}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-subtle text-xl">{o.icon}</span>
          <div className="min-w-0"><p className="font-semibold text-ink">{o.title}</p><p className="text-sm text-ink-tertiary">{o.desc}</p></div>
          {value === o.id && <span className="ml-auto text-primary">✓</span>}
        </Card>
      ))}
    </div>
  );
}

function Switch({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span><span className="font-semibold text-ink">{label}</span>{desc && <span className="mt-0.5 block text-sm text-ink-tertiary">{desc}</span>}</span>
      <span onClick={() => onChange(!checked)} role="switch" aria-checked={checked} tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onChange(!checked)}
        className={"relative h-7 w-12 shrink-0 rounded-full transition-colors " + (checked ? "bg-primary" : "bg-stone-300 dark:bg-stone-600")}>
        <span className={"absolute top-1 h-5 w-5 rounded-full bg-white transition-all " + (checked ? "left-6" : "left-1")} />
      </span>
    </label>
  );
}

function Chips({ items, onAdd, onRemove, placeholder }: { items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder: string }) {
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { onAdd(v.trim()); setV(""); } };
  return (
    <div>
      <div className="flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder} className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-ink placeholder:text-ink-tertiary focus:border-primary" />
        <Button variant="secondary" size="sm" onClick={add}>Add</Button>
      </div>
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-sm font-medium text-primary">
              {it}<button onClick={() => onRemove(i)} aria-label={`Remove ${it}`}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MedPicker({ onAdd }: { onAdd: (m: Med) => void }) {
  const [q, setQ] = useState("");
  const matches = q.trim()
    ? drugs.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()) || (d.generic ?? "").toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];
  const addFromDrug = (slug: string) => {
    const d = drugs.find((x) => x.slug === slug)!;
    onAdd({ id: crypto.randomUUID(), slug: d.slug, name: d.name, strength: d.dosages[0], qty: 30, directions: "", asNeeded: false, price: d.price, coverage: d.coverage, dosages: d.dosages });
    setQ("");
  };
  const addManual = () => { onAdd({ id: crypto.randomUUID(), name: q.trim(), strength: "", qty: 30, directions: "", asNeeded: false, price: 0, coverage: 0, dosages: [] }); setQ(""); };
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a medication (e.g. Ramipril)…"
        className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-ink placeholder:text-ink-tertiary focus:border-primary" />
      {q.trim() && (
        <div className="mt-2 overflow-hidden rounded-xl border border-line">
          {matches.map((d) => (
            <button key={d.slug} onClick={() => addFromDrug(d.slug)} className="flex w-full items-center gap-3 border-b border-line bg-surface-2 p-3 text-left last:border-0 hover:bg-[color:var(--state-hover)]">
              <span>💊</span><span className="flex-1"><span className="block font-semibold text-ink">{d.name}</span>{d.generic && <span className="block text-xs text-ink-tertiary">{d.generic}</span>}</span><span className="text-primary">+ Add</span>
            </button>
          ))}
          <button onClick={addManual} className="flex w-full items-center gap-2 bg-surface-1 transition-colors hover:bg-[color:var(--state-hover)] p-3 text-left text-sm font-semibold text-primary">＋ Add “{q.trim()}” manually</button>
        </div>
      )}
    </div>
  );
}

/* ── Flow ───────────────────────────────────────────────── */
export function FillPrescription() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("method");
  const [s, setS] = useState<State>(initial);
  const set = (p: Partial<State>) => setS((prev) => ({ ...prev, ...p }));

  const idx = STEPS.indexOf(step as (typeof STEPS)[number]);
  const total = STEPS.length;
  const goNext = () => setStep(idx < total - 1 ? STEPS[idx + 1] : "done");
  const goBack = () => (idx <= 0 ? nav("/app") : setStep(STEPS[idx - 1]));

  const addMed = (m: Med) => set({ meds: [...s.meds, m] });
  const updMed = (id: string, p: Partial<Med>) => set({ meds: s.meds.map((m) => (m.id === id ? { ...m, ...p } : m)) });
  const rmMed = (id: string) => set({ meds: s.meds.filter((m) => m.id !== id) });

  const subtotal = useMemo(() => s.meds.reduce((sum, m) => sum + m.price * (m.qty / 30), 0), [s.meds]);
  const withFee = subtotal + (s.meds.length ? DISPENSING_FEE : 0);
  const hasInsurance = !s.payOOP && (s.useProvincial || s.hasPrivate);
  const rate = useMemo(() => {
    if (!hasInsurance || !s.meds.length) return 0;
    const avg = s.meds.reduce((a, m) => a + (m.coverage || 55), 0) / s.meds.length / 100;
    return Math.min(0.9, avg + (s.useProvincial && s.hasPrivate ? 0.1 : 0));
  }, [s.meds, hasInsurance, s.useProvincial, s.hasPrivate]);
  const covered = Math.round(withFee * rate * 100) / 100;
  const total$ = Math.max(0, Math.round((withFee - covered) * 100) / 100);

  const common = { step: idx + 1, total, onBack: goBack };

  /* 1. Method */
  if (step === "method")
    return (
      <EntryFlow {...common} eyebrow="Fill your prescription" title="How would you like to fill it?"
        subtitle="Choose whichever is easiest—you can always change this later." onNext={goNext} nextDisabled={!s.method}>
        <RadioCards<Method> value={s.method} onChange={(v) => set({ method: v })}
          options={[
            { id: "upload", icon: "📷", title: "Upload a photo", desc: "Snap your prescription or medication label" },
            { id: "fax", icon: "🏥", title: "My clinic will fax it", desc: "We'll receive it at 1-855-950-7226" },
            { id: "mail", icon: "📮", title: "Mail it in", desc: "We'll send you a free prepaid mailing kit" },
            { id: "transfer", icon: "📦", title: "Transfer from a pharmacy", desc: "We'll contact your current pharmacy" },
          ]} />
      </EntryFlow>
    );

  /* 2. Capture (method-specific) */
  if (step === "capture") {
    const m = s.method;
    return (
      <EntryFlow {...common} eyebrow="Fill your prescription"
        title={m === "upload" ? "Upload your prescription" : m === "fax" ? "Clinic details" : m === "mail" ? "Where should we send the kit?" : "Your current pharmacy"}
        onNext={goNext}
        nextDisabled={
          m === "upload" ? s.files.length === 0 :
          m === "fax" ? !s.clinic :
          m === "mail" ? !s.mailAddress :
          !s.transferPharmacy
        }>
        {m === "upload" && (
          <div className="space-y-4">
            <Card className="flex flex-col items-center gap-2 border-dashed p-8 text-center">
              <span className="text-3xl">📄</span>
              <p className="font-semibold text-ink">Drag & drop or tap to upload</p>
              <p className="text-sm text-ink-tertiary">Clear photos of the front (and back) of your prescription</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => set({ files: [...s.files, `prescription-${s.files.length + 1}.jpg`] })}>Add a photo</Button>
            </Card>
            {s.files.map((f, i) => (
              <Card key={f} className="flex items-center gap-3 p-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-subtle">🖼️</span>
                <span className="flex-1 text-sm font-medium text-ink">{f}</span>
                <Badge tone="wellness">Uploaded</Badge>
                <button onClick={() => set({ files: s.files.filter((_, idx) => idx !== i) })} className="text-ink-tertiary hover:text-danger" aria-label="Remove">✕</button>
              </Card>
            ))}
          </div>
        )}
        {m === "fax" && (
          <div className="space-y-4">
            <Card className="border-info/30 bg-info-subtle p-4"><p className="text-sm text-ink-secondary">Ask your clinic to fax your prescription to <span className="font-semibold text-ink">1-855-950-7226</span>. Add their details so we can match it to your account.</p></Card>
            <Card className="p-5"><Field label="Clinic name" placeholder="e.g. Downtown Family Health" value={s.clinic} onChange={(e) => set({ clinic: e.target.value })} /></Card>
            <Card className="p-5"><Field label="Prescriber name" placeholder="e.g. Dr. Smith" value={s.prescriber} onChange={(e) => set({ prescriber: e.target.value })} /></Card>
          </div>
        )}
        {m === "mail" && (
          <div className="space-y-4">
            <Card className="border-info/30 bg-info-subtle p-4"><p className="text-sm text-ink-secondary">We'll mail you a prepaid, pre-addressed kit. Pop your prescription in and drop it in any mailbox—postage is on us.</p></Card>
            <Card className="p-5"><Field label="Mailing address" placeholder="Street, city, province, postal code" value={s.mailAddress} onChange={(e) => set({ mailAddress: e.target.value })} /></Card>
          </div>
        )}
        {m === "transfer" && (
          <div className="space-y-4">
            <Card className="p-5"><Field label="Current pharmacy" placeholder="e.g. Shoppers Drug Mart, Queen St" value={s.transferPharmacy} onChange={(e) => set({ transferPharmacy: e.target.value })} /></Card>
            <Card className="p-5"><Field label="Pharmacy phone" placeholder="(416) 555-0100" value={s.transferPhone} onChange={(e) => set({ transferPhone: e.target.value })} /></Card>
            <p className="text-sm text-ink-tertiary">We'll contact them and move your prescriptions—no need to call yourself.</p>
          </div>
        )}
      </EntryFlow>
    );
  }

  /* 3. Medications */
  if (step === "meds")
    return (
      <EntryFlow {...common} eyebrow="Fill your prescription" title="What are we filling?"
        subtitle="Add each medication. Not sure of the exact details? A pharmacist will confirm from your prescription."
        onNext={goNext} nextDisabled={s.meds.length === 0}>
        <div className="space-y-4">
          <Card className="p-4"><MedPicker onAdd={addMed} /></Card>
          {s.meds.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">💊 {m.name}</p>
                <button onClick={() => rmMed(m.id)} className="text-ink-tertiary hover:text-danger" aria-label="Remove">✕</button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-ink-secondary">Strength</span>
                  {m.dosages.length ? (
                    <select value={m.strength} onChange={(e) => updMed(m.id, { strength: e.target.value })} className="h-10 w-full rounded-lg border border-line bg-surface-2 px-2 text-ink focus:border-primary">
                      {m.dosages.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  ) : (
                    <input value={m.strength} onChange={(e) => updMed(m.id, { strength: e.target.value })} placeholder="e.g. 5mg" className="h-10 w-full rounded-lg border border-line bg-surface-2 px-2 text-ink focus:border-primary" />
                  )}
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-ink-secondary">Quantity</span>
                  <select value={m.qty} onChange={(e) => updMed(m.id, { qty: Number(e.target.value) })} className="h-10 w-full rounded-lg border border-line bg-surface-2 px-2 text-ink focus:border-primary">
                    {[30, 60, 90].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-ink-secondary">Directions</span>
                  <input value={m.directions} onChange={(e) => updMed(m.id, { directions: e.target.value })} placeholder="e.g. 1 daily" className="h-10 w-full rounded-lg border border-line bg-surface-2 px-2 text-ink focus:border-primary" />
                </label>
              </div>
              <div className="mt-3"><Switch checked={m.asNeeded} onChange={(v) => updMed(m.id, { asNeeded: v })} label="Take as needed" desc="As-needed meds ship in a regular bottle, not a dose pack." /></div>
            </Card>
          ))}
        </div>
      </EntryFlow>
    );

  /* 4. Patient */
  if (step === "patient")
    return (
      <EntryFlow {...common} eyebrow="Fill your prescription" title="Who is this for?" onNext={goNext}
        nextDisabled={s.who === "other" && (!s.otherName || !s.otherDob)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(["self", "other"] as const).map((w) => (
              <button key={w} onClick={() => set({ who: w })}
                className={"h-12 rounded-xl border text-sm font-semibold transition-colors " + (s.who === w ? "border-primary bg-primary-subtle text-primary" : "border-line bg-surface-2 text-ink-secondary hover:bg-[color:var(--state-hover)]")}>
                {w === "self" ? "Myself" : "A family member"}
              </button>
            ))}
          </div>
          {s.who === "other" && (
            <Card className="space-y-3 p-5">
              <Field label="Full name" placeholder="e.g. Jordan Chen" value={s.otherName} onChange={(e) => set({ otherName: e.target.value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Date of birth" placeholder="YYYY-MM-DD" value={s.otherDob} onChange={(e) => set({ otherDob: e.target.value })} />
                <Field label="Relationship" placeholder="e.g. Parent, child" value={s.otherRel} onChange={(e) => set({ otherRel: e.target.value })} />
              </div>
            </Card>
          )}
          <Card className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm"><span className="mb-1.5 block font-medium text-ink-secondary">Province</span>
                <select value={s.province} onChange={(e) => set({ province: e.target.value })} className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-ink focus:border-primary">
                  {["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <Field label="Health card number" placeholder="Optional" value={s.healthNumber} onChange={(e) => set({ healthNumber: e.target.value })} />
            </div>
          </Card>
          <Card className="p-5"><p className="mb-2 text-sm font-medium text-ink-secondary">Allergies</p><Chips items={s.allergies} placeholder="e.g. penicillin" onAdd={(v) => set({ allergies: [...s.allergies, v] })} onRemove={(i) => set({ allergies: s.allergies.filter((_, idx) => idx !== i) })} /></Card>
          <Card className="p-5"><p className="mb-2 text-sm font-medium text-ink-secondary">Other medications you take</p><Chips items={s.currentMeds} placeholder="e.g. vitamin D" onAdd={(v) => set({ currentMeds: [...s.currentMeds, v] })} onRemove={(i) => set({ currentMeds: s.currentMeds.filter((_, idx) => idx !== i) })} /></Card>
          <Card className="p-5">
            <p className="mb-2.5 text-sm font-medium text-ink-secondary">Pregnant or breastfeeding?</p>
            <div className="grid grid-cols-3 gap-2">
              {["No", "Yes", "N/A"].map((o) => (
                <button key={o} onClick={() => set({ pregnant: o })} className={"h-10 rounded-xl border text-sm font-semibold " + (s.pregnant === o ? "border-primary bg-primary-subtle text-primary" : "border-line bg-surface-2 text-ink-secondary hover:bg-[color:var(--state-hover)]")}>{o}</button>
              ))}
            </div>
          </Card>
        </div>
      </EntryFlow>
    );

  /* 5. Packaging */
  if (step === "packaging")
    return (
      <EntryFlow {...common} eyebrow="Fill your prescription" title="How should we pack it?" onNext={goNext}>
        <div className="space-y-4">
          {([
            { id: "pocketpacks", icon: "🗓️", title: "PocketPacks (recommended)", desc: "Pouches sorted by date & time—ideal when taking multiple meds." },
            { id: "vials", icon: "💊", title: "Traditional vials", desc: "Standard prescription bottles." },
          ] as const).map((o) => (
            <Card key={o.id} interactive onClick={() => set({ packaging: o.id })} className={"flex items-center gap-4 p-4 " + (s.packaging === o.id ? "ring-2 ring-primary" : "")}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-subtle text-xl">{o.icon}</span>
              <div><p className="font-semibold text-ink">{o.title}</p><p className="text-sm text-ink-tertiary">{o.desc}</p></div>
              {s.packaging === o.id && <span className="ml-auto text-primary">✓</span>}
            </Card>
          ))}
          <Card className="space-y-4 p-5">
            <Switch checked={s.autoRefill} onChange={(v) => set({ autoRefill: v })} label="Auto-refill" desc="We'll prepare refills and remind you before you run out." />
            <div className="border-t border-line" />
            <Switch checked={s.genericOk} onChange={(v) => set({ genericOk: v })} label="Allow generic substitution" desc="Save more with equivalent generics when available." />
          </Card>
        </div>
      </EntryFlow>
    );

  /* 6. Insurance */
  if (step === "insurance")
    return (
      <EntryFlow {...common} eyebrow="Fill your prescription" title="Insurance & coverage" onNext={goNext}>
        <div className="space-y-4">
          <Card className="p-5"><Switch checked={s.useProvincial} onChange={(v) => set({ useProvincial: v, payOOP: false })} label={`Provincial plan (${s.province})`} desc="Apply your provincial drug benefit where eligible." /></Card>
          <Card className="p-5">
            <Switch checked={s.hasPrivate} onChange={(v) => set({ hasPrivate: v, payOOP: false })} label="Private / group insurance" desc="Bill your workplace or private plan directly." />
            {s.hasPrivate && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Field label="Carrier" value={s.carrier} onChange={(e) => set({ carrier: e.target.value })} />
                <Field label="Group #" value={s.group} onChange={(e) => set({ group: e.target.value })} />
                <Field label="Member ID" placeholder="Optional" value={s.member} onChange={(e) => set({ member: e.target.value })} />
              </div>
            )}
          </Card>
          <Card className="p-5"><Switch checked={s.payOOP} onChange={(v) => set({ payOOP: v, useProvincial: !v && s.useProvincial, hasPrivate: !v && s.hasPrivate })} label="Pay out of pocket" desc="Skip insurance for this order." /></Card>
          <Card className="p-5">
            <p className="mb-2 font-semibold text-ink">Estimated coverage</p>
            <Row k="Medications" v={`$${subtotal.toFixed(2)}`} />
            <Row k="Dispensing fee" v={`$${(s.meds.length ? DISPENSING_FEE : 0).toFixed(2)}`} />
            <Row k={hasInsurance ? `Insurance (~${Math.round(rate * 100)}%)` : "Insurance"} v={hasInsurance ? `−$${covered.toFixed(2)}` : "—"} tone={hasInsurance ? "wellness" : undefined} />
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2"><span className="font-semibold text-ink">Estimated total</span><span className="font-display text-lg font-medium text-ink tnum">${total$.toFixed(2)}</span></div>
          </Card>
        </div>
      </EntryFlow>
    );

  /* 7. Delivery */
  if (step === "delivery")
    return (
      <EntryFlow {...common} eyebrow="Fill your prescription" title="Delivery" onNext={goNext} nextDisabled={!s.address}>
        <div className="space-y-4">
          <Card className="p-5"><Field label="Delivery address" value={s.address} onChange={(e) => set({ address: e.target.value })} /></Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { id: "standard", t: "Standard", d: "Free · 1–3 business days" },
              { id: "sameday", t: "Same-day", d: "Select locations · free" },
            ] as const).map((o) => (
              <button key={o.id} onClick={() => set({ speed: o.id })} className={"rounded-2xl border p-4 text-left " + (s.speed === o.id ? "border-primary bg-primary-subtle" : "border-line bg-surface-2 hover:bg-[color:var(--state-hover)]")}>
                <p className="font-semibold text-ink">{o.t}</p><p className="text-sm text-ink-tertiary">{o.d}</p>
              </button>
            ))}
          </div>
          <Card className="p-5"><Switch checked={s.leaveAtDoor} onChange={(v) => set({ leaveAtDoor: v })} label="Leave at my door" desc="Discreet packaging, with photo confirmation." /></Card>
          <Card className="p-5"><Field label="Delivery notes (optional)" placeholder="Buzzer code, instructions…" value={s.notes} onChange={(e) => set({ notes: e.target.value })} /></Card>
        </div>
      </EntryFlow>
    );

  /* 8. Review */
  if (step === "review") {
    const methodLabel = { upload: "Photo upload", fax: "Clinic fax", mail: "Mail-in kit", transfer: "Pharmacy transfer" }[s.method ?? "upload"];
    const rows: [string, string, Step][] = [
      ["Method", methodLabel, "method"],
      ["Medications", s.meds.map((m) => `${m.name} ${m.strength}`).join(", ") || "—", "meds"],
      ["For", s.who === "self" ? "Myself" : `${s.otherName || "Family member"}${s.otherRel ? ` (${s.otherRel})` : ""}`, "patient"],
      ["Allergies", s.allergies.join(", ") || "None", "patient"],
      ["Packaging", s.packaging === "pocketpacks" ? "PocketPacks" : "Vials", "packaging"],
      ["Auto-refill", s.autoRefill ? "On" : "Off", "packaging"],
      ["Insurance", s.payOOP ? "Pay out of pocket" : [s.useProvincial && `Provincial (${s.province})`, s.hasPrivate && s.carrier].filter(Boolean).join(" + ") || "None", "insurance"],
      ["Delivery", `${s.speed === "standard" ? "Standard" : "Same-day"} · ${s.address}`, "delivery"],
    ];
    return (
      <EntryFlow {...common} eyebrow="Fill your prescription" title="Review your order" onNext={goNext} nextLabel="Continue to payment">
        <Card className="divide-y divide-line p-0">
          {rows.map(([k, v, to]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0"><p className="text-xs text-ink-tertiary">{k}</p><p className="truncate text-sm font-semibold text-ink">{v}</p></div>
              <button onClick={() => setStep(to)} className="shrink-0 text-sm font-semibold text-primary hover:underline">Edit</button>
            </div>
          ))}
        </Card>
        <Card className="mt-4 p-5">
          <Row k="Medications" v={`$${subtotal.toFixed(2)}`} />
          <Row k="Dispensing fee" v={`$${(s.meds.length ? DISPENSING_FEE : 0).toFixed(2)}`} />
          <Row k="Delivery" v="FREE" tone="wellness" />
          {hasInsurance && <Row k={`Insurance (~${Math.round(rate * 100)}%)`} v={`−$${covered.toFixed(2)}`} tone="wellness" />}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2"><span className="font-semibold text-ink">Due today</span><span className="font-display text-xl font-medium text-ink tnum">${total$.toFixed(2)}</span></div>
        </Card>
      </EntryFlow>
    );
  }

  /* 9. Payment */
  if (step === "payment")
    return (
      <EntryFlow {...common} eyebrow="Fill your prescription" title="Payment" onNext={goNext} nextLabel={total$ > 0 ? `Place order · $${total$.toFixed(2)}` : "Place order"}>
        {total$ <= 0 ? (
          <Card className="p-6 text-center">
            <span className="text-3xl">✅</span>
            <p className="mt-2 font-semibold text-ink">Nothing due today</p>
            <p className="mt-1 text-sm text-ink-tertiary">Your plan covers this order. We'll bill your insurance directly.</p>
          </Card>
        ) : (
          <Card className="p-5">
            <Field label="Card number" placeholder="4242 4242 4242 4242" value={s.card} onChange={(e) => set({ card: e.target.value })} inputMode="numeric" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Expiry" placeholder="12 / 27" value={s.exp} onChange={(e) => set({ exp: e.target.value })} />
              <Field label="CVC" placeholder="123" value={s.cvc} onChange={(e) => set({ cvc: e.target.value })} inputMode="numeric" />
            </div>
            <p className="mt-3 text-xs text-ink-tertiary">🔒 Demo checkout — no real payment is processed.</p>
          </Card>
        )}
      </EntryFlow>
    );

  /* Confirmation */
  return <Confirmation state={s} total={total$} onHome={() => nav("/app")} onTrack={() => nav("/pharmacy")} />;
}

function Confirmation({ state, total, onHome, onTrack }: { state: State; total: number; onHome: () => void; onTrack: () => void }) {
  const [verifying, setVerifying] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVerifying(false), 2000); return () => clearTimeout(t); }, []);
  return (
    <EntryFlow eyebrow="Fill your prescription" title="" step={9} total={9} hideNav>
      {verifying ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-subtle text-2xl">🧑‍⚕️</span>
          <p className="font-semibold text-ink">A pharmacist is reviewing your prescription…</p>
          <p className="text-sm text-ink-tertiary">Every order is verified before it's filled.</p>
        </Card>
      ) : (
        <div className="animate-fade-up text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-wellness-subtle text-3xl">🎉</span>
          <h1 className="mt-5 text-3xl font-medium text-ink">Order placed</h1>
          <p className="mt-2 text-ink-secondary">
            {state.meds.length} medication{state.meds.length === 1 ? "" : "s"} · {state.packaging === "pocketpacks" ? "PocketPacks" : "vials"}
            {total > 0 ? ` · $${total.toFixed(2)} charged` : " · covered by your plan"}.
          </p>
          <Card className="mt-6 p-5 text-left">
            <div className="flex items-center justify-between text-sm"><span className="text-ink-tertiary">Order</span><span className="font-semibold text-ink tnum">#PP-RX-3391</span></div>
            <ol className="mt-4 space-y-0">
              {[["Order placed", "Just now", "done"], ["Pharmacist verifying", "Within 1 hour", "active"], ["Filled & packed", "Tomorrow", "todo"], ["Delivered", state.speed === "sameday" ? "Today (select areas)" : "1–3 days", "todo"]].map(([label, meta, st], i, arr) => (
                <li key={label} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <span className={"grid h-6 w-6 place-items-center rounded-full text-2xs font-bold " + (st === "done" ? "bg-wellness text-white" : st === "active" ? "bg-primary text-[color:var(--color-primary-fg)]" : "border-2 border-line bg-surface-2 text-ink-tertiary")}>{st === "done" ? "✓" : i + 1}</span>
                    {i < arr.length - 1 && <span className="my-1 w-0.5 flex-1 bg-line" style={{ minHeight: 22 }} />}
                  </div>
                  <div className="pb-4"><p className={"font-semibold " + (st === "todo" ? "text-ink-tertiary" : "text-ink")}>{label}</p><p className="text-sm text-ink-tertiary">{meta}</p></div>
                </li>
              ))}
            </ol>
          </Card>
          {state.autoRefill && (
            <div className="mt-4 rounded-2xl border border-line bg-surface-1 p-4 text-left">
              <Badge tone="accent">Auto-refill on</Badge>
              <p className="mt-2 text-sm text-ink-secondary">We'll prepare your next refill and remind you before you run out—no action needed.</p>
            </div>
          )}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="wellness" onClick={onTrack}>Track order</Button>
            <Button variant="secondary" onClick={onHome}>Back to home</Button>
          </div>
        </div>
      )}
    </EntryFlow>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "wellness" }) {
  return <div className="flex items-center justify-between text-sm"><span className="text-ink-secondary">{k}</span><span className={tone === "wellness" ? "font-medium text-wellness tnum" : "text-ink tnum"}>{v}</span></div>;
}

