import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EntryFlow } from "@/components/layout/EntryFlow";
import { Card, Field, Badge, Switch } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { drugs } from "@/lib/data";
import { ActiveOfferBanner } from "@/components/offers/ActiveOfferBanner";
import { CheckoutOffers, useOfferQuote } from "@/components/offers/CheckoutOffers";
import { ChoosePaymentOption, usePaymentFields } from "@/components/checkout/ChoosePaymentOption";
import type { CheckoutContext } from "@/lib/offers";
import { useI18n } from "@/lib/i18n";
import {
  fileToUpload,
  isReadableImage,
  revokeUploads,
  samplePrescriptionFile,
  scanPrescriptions,
  type ExtractedMed,
  type RxUpload,
} from "@/lib/rxOcr";

const DISPENSING_FEE = 11.99;
const STEPS = ["method", "capture", "meds", "patient", "packaging", "insurance", "delivery", "review"] as const;
type Step = (typeof STEPS)[number] | "done";
type Method = "upload" | "fax" | "mail" | "transfer";

interface Med {
  id: string; slug?: string; name: string; strength: string; qty: number;
  directions: string; asNeeded: boolean; price: number; coverage: number; dosages: string[];
  source?: "ocr" | "manual";
  confidence?: "high" | "low";
}
interface State {
  method: Method | null;
  files: RxUpload[];
  clinic: string; prescriber: string; ocrText: string;
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

function medFromExtracted(m: ExtractedMed): Med {
  return {
    id: crypto.randomUUID(),
    slug: m.slug,
    name: m.name,
    strength: m.strength,
    qty: m.qty,
    directions: m.directions,
    asNeeded: m.asNeeded,
    price: m.price,
    coverage: m.coverage,
    dosages: m.dosages,
    source: "ocr",
    confidence: m.confidence,
  };
}

const initial: State = {
  method: null, files: [], clinic: "", prescriber: "", ocrText: "",
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
    <div className="space-y-3" role="radiogroup">
      {options.map((o) => (
        <Card
          key={o.id}
          interactive
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={"flex items-center gap-4 p-4 " + (value === o.id ? "ring-2 ring-primary" : "")}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-subtle text-xl" aria-hidden>{o.icon}</span>
          <div className="min-w-0"><p className="font-semibold text-ink">{o.title}</p><p className="text-sm text-ink-tertiary">{o.desc}</p></div>
          {value === o.id && <span className="ml-auto text-primary" aria-hidden>✓</span>}
        </Card>
      ))}
    </div>
  );
}

const NONE_ALLERGY = "No known allergies";

const ALLERGY_OPTIONS = [
  "Penicillin",
  "Sulfa drugs",
  "Aspirin / NSAIDs",
  "Codeine / opioids",
  "Latex",
  "Iodine",
  "Eggs",
  "Peanuts",
  "Tree nuts",
  "Shellfish",
  "Dairy",
  "Gluten",
] as const;

function AllergyPicker({
  items,
  onChange,
}: {
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const { tx } = useI18n();
  const [custom, setCustom] = useState("");
  const selected = new Set(items.map((x) => x.toLowerCase()));
  const noneOn = selected.has(NONE_ALLERGY.toLowerCase());
  const extras = items.filter(
    (it) =>
      it !== NONE_ALLERGY &&
      !ALLERGY_OPTIONS.some((o) => o.toLowerCase() === it.toLowerCase()),
  );

  const toggle = (label: string) => {
    if (label === NONE_ALLERGY) {
      onChange(noneOn ? [] : [NONE_ALLERGY]);
      return;
    }
    const key = label.toLowerCase();
    const withoutNone = items.filter((x) => x.toLowerCase() !== NONE_ALLERGY.toLowerCase());
    onChange(
      selected.has(key) ? withoutNone.filter((x) => x.toLowerCase() !== key) : [...withoutNone, label],
    );
  };

  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    if (v.toLowerCase() === NONE_ALLERGY.toLowerCase()) {
      onChange([NONE_ALLERGY]);
    } else if (!selected.has(v.toLowerCase())) {
      onChange([...items.filter((x) => x.toLowerCase() !== NONE_ALLERGY.toLowerCase()), v]);
    }
    setCustom("");
  };

  const chip = (on: boolean) =>
    "inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium transition-colors " +
    (on
      ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
      : "border-line bg-white text-ink-secondary hover:border-[color:var(--pp-violet)] hover:text-[color:var(--pp-primary-950)]");

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={tx("Allergies")}>
        <button type="button" aria-pressed={noneOn} onClick={() => toggle(NONE_ALLERGY)} className={chip(noneOn)}>
          {tx(NONE_ALLERGY)}
        </button>
        {ALLERGY_OPTIONS.map((label) => {
          const on = selected.has(label.toLowerCase());
          return (
            <button key={label} type="button" aria-pressed={on} onClick={() => toggle(label)} className={chip(on)}>
              {tx(label)}
            </button>
          );
        })}
      </div>
      {extras.length ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={tx("Other allergies")}>
          {extras.map((it) => (
            <li
              key={it}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)] px-3.5 text-sm font-medium text-[color:var(--pp-primary-950)]"
            >
              {it}
              <button type="button" onClick={() => toggle(it)} aria-label={tx("Remove {name}").replace("{name}", it)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{tx("Other allergy")}</span>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder={tx("Other (optional)")}
            className="h-11 w-full rounded-full border border-line bg-white px-4 text-ink placeholder:text-ink-tertiary focus:border-primary"
          />
        </label>
        <Button variant="secondary" size="sm" onClick={addCustom} disabled={!custom.trim()}>
          {tx("Add")}
        </Button>
      </div>
    </div>
  );
}

function Chips({ items, onAdd, onRemove, placeholder, label }: { items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder: string; label: string }) {
  const { tx } = useI18n();
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { onAdd(v.trim()); setV(""); } };
  const inputId = `chips-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{label}</span>
          <input
            id={inputId}
            value={v}
            onChange={(e) => setV(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder={placeholder}
            className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-ink placeholder:text-ink-tertiary focus:border-primary"
          />
        </label>
        <Button variant="secondary" size="sm" onClick={add}>{tx("Add")}</Button>
      </div>
      {items.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={label}>
          {items.map((it, i) => (
            <li key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-sm font-medium text-primary">
              {it}
              <button type="button" onClick={() => onRemove(i)} aria-label={tx("Remove {name}").replace("{name}", it)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MedPicker({ onAdd }: { onAdd: (m: Med) => void }) {
  const { tx } = useI18n();
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
      <label className="block">
        <span className="sr-only">{tx("Search medications")}</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tx("Search a medication (e.g. Ramipril)…")}
          aria-autocomplete="list"
          aria-controls={q.trim() ? "med-picker-results" : undefined}
          className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-ink placeholder:text-ink-tertiary focus:border-primary"
        />
      </label>
      {q.trim() && (
        <div id="med-picker-results" role="listbox" aria-label={tx("Medication matches")} className="mt-2 overflow-hidden rounded-xl border border-line">
          {matches.map((d) => (
            <button key={d.slug} type="button" role="option" onClick={() => addFromDrug(d.slug)} className="flex w-full items-center gap-3 border-b border-line bg-surface-2 p-3 text-left last:border-0 hover:bg-[color:var(--state-hover)]">
              <span aria-hidden>💊</span><span className="flex-1"><span className="block font-semibold text-ink">{d.name}</span>{d.generic && <span className="block text-xs text-ink-tertiary">{d.generic}</span>}</span><span className="text-primary">{tx("+ Add")}</span>
            </button>
          ))}
          <button type="button" onClick={addManual} className="flex w-full items-center gap-2 bg-surface-1 transition-colors hover:bg-[color:var(--state-hover)] p-3 text-left text-sm font-semibold text-primary">
            {tx("＋ Add “{name}” manually").replace("{name}", q.trim())}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Flow ───────────────────────────────────────────────── */
export function FillPrescription() {
  const nav = useNavigate();
  const { tx } = useI18n();
  const [step, setStep] = useState<Step>("method");
  const [s, setS] = useState<State>(initial);
  const set = (p: Partial<State>) => setS((prev) => ({ ...prev, ...p }));
  const pay = usePaymentFields();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct] = useState(0);
  const [scanLabel, setScanLabel] = useState("Reading your prescription");
  const [scanNote, setScanNote] = useState<"found" | "partial" | "empty" | "failed" | null>(null);
  const scannedKey = useRef("");
  const filesRef = useRef(s.files);
  filesRef.current = s.files;

  useEffect(() => {
    return () => revokeUploads(filesRef.current);
  }, []);

  const idx = STEPS.indexOf(step as (typeof STEPS)[number]);
  const total = STEPS.length;
  const goNext = () => setStep(idx < total - 1 ? STEPS[idx + 1] : "done");
  const goBack = () => (idx <= 0 ? nav("/app") : setStep(STEPS[idx - 1]));

  const addUploads = (list: FileList | File[]) => {
    const next = Array.from(list)
      .filter((f) => isReadableImage(f) || f.type === "application/pdf")
      .map(fileToUpload);
    if (!next.length) return;
    scannedKey.current = "";
    setS((prev) => ({ ...prev, files: [...prev.files, ...next] }));
  };

  const removeUpload = (id: string) => {
    scannedKey.current = "";
    setS((prev) => {
      const gone = prev.files.find((f) => f.id === id);
      if (gone) revokeUploads([gone]);
      return { ...prev, files: prev.files.filter((f) => f.id !== id) };
    });
  };

  const addSample = async () => {
    const file = await samplePrescriptionFile();
    addUploads([file]);
  };

  const continueFromCapture = async () => {
    if (s.method !== "upload") {
      goNext();
      return;
    }
    const key = s.files.map((f) => f.id).join(",");
    if (!s.files.some((f) => isReadableImage(f.file))) {
      setScanNote("empty");
      set({ ocrText: "" });
      goNext();
      return;
    }
    if (key && key === scannedKey.current) {
      goNext();
      return;
    }
    setScanning(true);
    setScanPct(4);
    setScanLabel(tx("Reading your prescription"));
    try {
      const result = await scanPrescriptions(s.files, (label, pct) => {
        setScanLabel(label);
        setScanPct(pct);
      });
      scannedKey.current = key;
      setS((prev) => {
        const manual = prev.meds.filter((m) => m.source !== "ocr");
        const seen = new Set(manual.map((m) => (m.slug || m.name).toLowerCase()));
        const ocr = result.meds.map(medFromExtracted).filter((m) => {
          const k = (m.slug || m.name).toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        return {
          ...prev,
          meds: [...ocr, ...manual],
          ocrText: result.text,
          prescriber: prev.prescriber || result.prescriber,
          clinic: prev.clinic || result.clinic,
        };
      });
      setScanNote(
        result.catalogHits > 0 ? "found" : result.meds.length ? "partial" : "empty",
      );
      setStep("meds");
    } catch {
      setScanNote("failed");
      set({ ocrText: "" });
      setStep("meds");
    } finally {
      setScanning(false);
    }
  };

  const addMed = (m: Med) => set({ meds: [...s.meds, { ...m, source: m.source ?? "manual" }] });
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
  const offerCtx = useMemo<CheckoutContext>(
    () => ({
      kind: "fill",
      amount: total$,
      orderTotal: withFee,
      dispensingFee: s.meds.length ? DISPENSING_FEE : 0,
      sameDay: s.speed === "sameday",
      medSlugs: s.meds.map((m) => m.slug).filter((x): x is string => Boolean(x)),
      medNames: s.meds.map((m) => m.name),
    }),
    [total$, withFee, s.meds, s.speed],
  );
  const offerQuote = useOfferQuote(offerCtx);

  const eyebrow = tx("Fill your prescription");
  const common = { step: idx + 1, total, onBack: goBack, eyebrow };

  /* 1. Method */
  if (step === "method")
    return (
      <EntryFlow {...common} title={tx("How would you like to fill it?")}
        subtitle={tx("Choose whichever is easiest—you can always change this later.")} onNext={goNext} nextDisabled={!s.method}>
        <RadioCards<Method> value={s.method} onChange={(v) => set({ method: v })}
          options={[
            { id: "upload", icon: "📷", title: tx("Upload a photo"), desc: tx("Snap your prescription or medication label") },
            { id: "fax", icon: "🏥", title: tx("My clinic will fax it"), desc: tx("We'll receive it at 1-855-950-7226") },
            { id: "mail", icon: "📮", title: tx("Mail it in"), desc: tx("We'll send you a free prepaid mailing kit") },
            { id: "transfer", icon: "📦", title: tx("Transfer from a pharmacy"), desc: tx("We'll contact your current pharmacy") },
          ]} />
      </EntryFlow>
    );

  /* 2. Capture (method-specific) */
  if (step === "capture" && scanning) {
    return (
      <EntryFlow
        {...common}
        title={tx("Reading your prescription")}
        subtitle={tx("We’re picking out medication names, strengths, and directions. A pharmacist will still confirm before we fill.")}
        hideNav
      >
        <Card className="p-6">
          <p className="text-sm font-medium text-ink">{tx(scanLabel)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[color:var(--pp-primary-100)]">
            <div
              className="h-full rounded-full bg-[color:var(--pp-violet)] transition-[width] duration-300"
              style={{ width: `${Math.max(6, scanPct)}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-ink-tertiary tnum">{scanPct}%</p>
        </Card>
      </EntryFlow>
    );
  }

  if (step === "capture") {
    const m = s.method;
    const captureTitle =
      m === "upload" ? tx("Upload your prescription") :
      m === "fax" ? tx("Clinic details") :
      m === "mail" ? tx("Where should we send the kit?") :
      tx("Your current pharmacy");
    return (
      <EntryFlow {...common}
        title={captureTitle}
        subtitle={m === "upload" ? tx("We’ll scan the photo and list the medications for you to check.") : undefined}
        onNext={continueFromCapture}
        nextDisabled={
          m === "upload" ? s.files.length === 0 :
          m === "fax" ? !s.clinic :
          m === "mail" ? !s.mailAddress :
          !s.transferPharmacy
        }>
        {m === "upload" && (
          <div className="space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addUploads(e.target.files);
                e.target.value = "";
              }}
            />
            <Card
              className={
                "flex cursor-pointer flex-col items-center gap-2 border-dashed p-8 text-center " +
                (dragOver ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)]" : "")
              }
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files.length) addUploads(e.dataTransfer.files);
              }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                fileRef.current?.click();
              }}
            >
              <span className="text-3xl" aria-hidden>📄</span>
              <p className="font-semibold text-ink">{tx("Drag & drop or tap to upload")}</p>
              <p className="text-sm text-ink-tertiary">{tx("Clear photos of the front (and back) of your prescription")}</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => fileRef.current?.click()}>
                {tx("Add a photo")}
              </Button>
              <button
                type="button"
                onClick={() => void addSample()}
                className="mt-1 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
              >
                {tx("Use a sample prescription")}
              </button>
            </Card>
            {s.files.map((f) => (
              <Card key={f.id} className="flex items-center gap-3 p-3">
                {f.previewUrl && isReadableImage(f.file) ? (
                  <img src={f.previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-subtle">🖼️</span>
                )}
                <span className="flex-1 truncate text-sm font-medium text-ink">{f.name}</span>
                <Badge tone="wellness">{tx("Uploaded")}</Badge>
                <button type="button" onClick={() => removeUpload(f.id)} className="text-ink-tertiary hover:text-danger" aria-label={tx("Remove")}>✕</button>
              </Card>
            ))}
          </div>
        )}
        {m === "fax" && (
          <div className="space-y-4">
            <Card className="border-info/30 bg-info-subtle p-4"><p className="text-sm text-ink-secondary">{tx("Ask your clinic to fax your prescription to")} <span className="font-semibold text-ink">1-855-950-7226</span>. {tx("Add their details so we can match it to your account.")}</p></Card>
            <Card className="p-5"><Field label={tx("Clinic name")} placeholder={tx("e.g. Downtown Family Health")} value={s.clinic} onChange={(e) => set({ clinic: e.target.value })} /></Card>
            <Card className="p-5"><Field label={tx("Prescriber name")} placeholder={tx("e.g. Dr. Smith")} value={s.prescriber} onChange={(e) => set({ prescriber: e.target.value })} /></Card>
          </div>
        )}
        {m === "mail" && (
          <div className="space-y-4">
            <Card className="border-info/30 bg-info-subtle p-4"><p className="text-sm text-ink-secondary">{tx("We'll mail you a prepaid, pre-addressed kit. Pop your prescription in and drop it in any mailbox—postage is on us.")}</p></Card>
            <Card className="p-5"><Field label={tx("Mailing address")} placeholder={tx("Street, city, province, postal code")} value={s.mailAddress} onChange={(e) => set({ mailAddress: e.target.value })} /></Card>
          </div>
        )}
        {m === "transfer" && (
          <div className="space-y-4">
            <Card className="p-5"><Field label={tx("Current pharmacy")} placeholder={tx("e.g. Shoppers Drug Mart, Queen St")} value={s.transferPharmacy} onChange={(e) => set({ transferPharmacy: e.target.value })} /></Card>
            <Card className="p-5"><Field label={tx("Pharmacy phone")} placeholder="(416) 555-0100" value={s.transferPhone} onChange={(e) => set({ transferPhone: e.target.value })} /></Card>
            <p className="text-sm text-ink-tertiary">{tx("We'll contact them and move your prescriptions—no need to call yourself.")}</p>
          </div>
        )}
      </EntryFlow>
    );
  }

  /* 3. Medications */
  if (step === "meds")
    return (
      <EntryFlow {...common} title={tx("What are we filling?")}
        subtitle={
          scanNote === "found"
            ? tx("We read these from your prescription. Check each one — a pharmacist will confirm before we fill.")
            : scanNote === "partial"
              ? tx("We found wording that looks like a medication, but it isn’t on our list yet. Check the name, or search below.")
            : scanNote === "failed"
              ? tx("We couldn’t read that photo. Try a clearer JPEG or PNG, or search and add medications below.")
              : scanNote === "empty" && s.ocrText.trim()
                ? tx("Printed prescriptions scan best. Faded or cursive handwriting often doesn’t. Search below, or go back and try a brighter, flatter photo.")
                : scanNote === "empty"
                ? tx("No medication names matched yet. Search below, or go back and upload a clearer photo.")
                : tx("Add each medication. Not sure of the exact details? A pharmacist will confirm from your prescription.")
        }
        onNext={goNext} nextDisabled={s.meds.length === 0}>
        <div className="space-y-4">
          {scanNote === "found" || scanNote === "partial" ? (
            <Card className="border-[color:var(--pp-violet)]/30 bg-[color:var(--pp-primary-100)] p-4">
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
                {tx("Found {n} from your prescription")
                  .replace("{n}", String(s.meds.filter((m) => m.source === "ocr").length))}
              </p>
              <p className="mt-1 text-sm text-ink-secondary">
                {scanNote === "partial"
                  ? tx("These names still need a check. Edit anything that looks off, and add anything we missed.")
                  : tx("Remove anything that doesn’t belong, and add anything we missed.")}
              </p>
            </Card>
          ) : null}
          {s.ocrText.trim() ? (
            <details className="rounded-2xl border border-line bg-surface-2 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                {tx("Text we read from the photo")}
              </summary>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-5 text-ink-secondary">
                {s.ocrText.trim()}
              </pre>
            </details>
          ) : null}
          <Card className="p-4"><MedPicker onAdd={addMed} /></Card>
          {s.meds.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {m.source === "ocr" && (m.confidence === "low" || !m.slug) ? (
                    <input
                      value={m.name}
                      onChange={(e) => updMed(m.id, { name: e.target.value })}
                      className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 font-semibold text-ink focus:border-primary"
                      aria-label={tx("Medication name")}
                    />
                  ) : (
                    <p className="font-semibold text-ink">💊 {m.name}</p>
                  )}
                  {m.source === "ocr" ? (
                    <p className="mt-0.5 text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
                      {m.confidence === "low" ? tx("Needs a check") : tx("From prescription")}
                    </p>
                  ) : null}
                </div>
                <button type="button" onClick={() => rmMed(m.id)} className="text-ink-tertiary hover:text-danger" aria-label={tx("Remove")}>✕</button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-ink-secondary">{tx("Strength")}</span>
                  {m.dosages.length ? (
                    <select value={m.strength} onChange={(e) => updMed(m.id, { strength: e.target.value })} className="h-10 w-full rounded-lg border border-line bg-surface-2 px-2 text-ink focus:border-primary">
                      {m.dosages.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  ) : (
                    <input value={m.strength} onChange={(e) => updMed(m.id, { strength: e.target.value })} placeholder={tx("e.g. 5mg")} className="h-10 w-full rounded-lg border border-line bg-surface-2 px-2 text-ink focus:border-primary" />
                  )}
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-ink-secondary">{tx("Quantity")}</span>
                  <select value={m.qty} onChange={(e) => updMed(m.id, { qty: Number(e.target.value) })} className="h-10 w-full rounded-lg border border-line bg-surface-2 px-2 text-ink focus:border-primary">
                    {[...new Set([30, 60, 90, m.qty])].sort((a, b) => a - b).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-ink-secondary">{tx("Directions")}</span>
                  <input value={m.directions} onChange={(e) => updMed(m.id, { directions: e.target.value })} placeholder={tx("e.g. 1 daily")} className="h-10 w-full rounded-lg border border-line bg-surface-2 px-2 text-ink focus:border-primary" />
                </label>
              </div>
              <div className="mt-3"><Switch checked={m.asNeeded} onChange={(v) => updMed(m.id, { asNeeded: v })} label={tx("Take as needed")} desc={tx("As-needed meds ship in a regular bottle, not a dose pack.")} /></div>
            </Card>
          ))}
        </div>
      </EntryFlow>
    );

  /* 4. Patient */
  if (step === "patient")
    return (
      <EntryFlow {...common} title={tx("Who is this for?")} onNext={goNext}
        nextDisabled={s.who === "other" && (!s.otherName || !s.otherDob)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(["self", "other"] as const).map((w) => (
              <button key={w} onClick={() => set({ who: w })}
                className={"h-12 rounded-xl border text-sm font-semibold transition-colors " + (s.who === w ? "border-primary bg-primary-subtle text-primary" : "border-line bg-surface-2 text-ink-secondary hover:bg-[color:var(--state-hover)]")}>
                {w === "self" ? tx("Myself") : tx("A family member")}
              </button>
            ))}
          </div>
          {s.who === "other" && (
            <Card className="space-y-3 p-5">
              <Field label={tx("Full name")} placeholder={tx("e.g. Jordan Chen")} value={s.otherName} onChange={(e) => set({ otherName: e.target.value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tx("Date of birth")} placeholder="YYYY-MM-DD" value={s.otherDob} onChange={(e) => set({ otherDob: e.target.value })} />
                <Field label={tx("Relationship")} placeholder={tx("e.g. Parent, child")} value={s.otherRel} onChange={(e) => set({ otherRel: e.target.value })} />
              </div>
            </Card>
          )}
          <Card className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm"><span className="mb-1.5 block font-medium text-ink-secondary">{tx("Province")}</span>
                <select value={s.province} onChange={(e) => set({ province: e.target.value })} className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-ink focus:border-primary">
                  {["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <Field label={tx("Health card number")} placeholder={tx("Optional")} value={s.healthNumber} onChange={(e) => set({ healthNumber: e.target.value })} />
            </div>
          </Card>
          <Card className="p-5">
            <p className="mb-3 text-sm font-medium text-ink-secondary">{tx("Allergies")}</p>
            <AllergyPicker items={s.allergies} onChange={(allergies) => set({ allergies })} />
          </Card>
          <Card className="p-5"><p className="mb-2 text-sm font-medium text-ink-secondary">{tx("Other medications you take")}</p><Chips label={tx("Other medications")} items={s.currentMeds} placeholder={tx("e.g. vitamin D")} onAdd={(v) => set({ currentMeds: [...s.currentMeds, v] })} onRemove={(i) => set({ currentMeds: s.currentMeds.filter((_, idx) => idx !== i) })} /></Card>
          <Card className="p-5">
            <p className="mb-2.5 text-sm font-medium text-ink-secondary">{tx("Pregnant or breastfeeding?")}</p>
            <div className="grid grid-cols-3 gap-2">
              {(["No", "Yes", "N/A"] as const).map((o) => (
                <button key={o} onClick={() => set({ pregnant: o })} className={"h-10 rounded-xl border text-sm font-semibold " + (s.pregnant === o ? "border-primary bg-primary-subtle text-primary" : "border-line bg-surface-2 text-ink-secondary hover:bg-[color:var(--state-hover)]")}>{tx(o)}</button>
              ))}
            </div>
          </Card>
        </div>
      </EntryFlow>
    );

  /* 5. Packaging */
  if (step === "packaging")
    return (
      <EntryFlow {...common} title={tx("How should we pack it?")} onNext={goNext}>
        <div className="space-y-4" role="radiogroup" aria-label={tx("Packaging")}>
          {([
            { id: "pocketpacks" as const, icon: "🗓️", title: tx("PocketPacks (recommended)"), desc: tx("Pouches sorted by date & time—ideal when taking multiple meds.") },
            { id: "vials" as const, icon: "💊", title: tx("Traditional vials"), desc: tx("Standard prescription bottles.") },
          ]).map((o) => (
            <Card
              key={o.id}
              interactive
              role="radio"
              aria-checked={s.packaging === o.id}
              onClick={() => set({ packaging: o.id })}
              className={"flex items-center gap-4 p-4 " + (s.packaging === o.id ? "ring-2 ring-primary" : "")}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-subtle text-xl" aria-hidden>{o.icon}</span>
              <div><p className="font-semibold text-ink">{o.title}</p><p className="text-sm text-ink-tertiary">{o.desc}</p></div>
              {s.packaging === o.id && <span className="ml-auto text-primary" aria-hidden>✓</span>}
            </Card>
          ))}
          <Card className="space-y-4 p-5">
            <Switch checked={s.autoRefill} onChange={(v) => set({ autoRefill: v })} label={tx("Auto-refill")} desc={tx("We'll prepare refills and remind you before you run out.")} />
            <div className="border-t border-line" />
            <Switch checked={s.genericOk} onChange={(v) => set({ genericOk: v })} label={tx("Allow generic substitution")} desc={tx("Save more with equivalent generics when available.")} />
          </Card>
        </div>
      </EntryFlow>
    );

  /* 6. Insurance */
  if (step === "insurance")
    return (
      <EntryFlow {...common} title={tx("Insurance & coverage")} onNext={goNext}>
        <div className="space-y-4">
          <Card className="p-5"><Switch checked={s.useProvincial} onChange={(v) => set({ useProvincial: v, payOOP: false })} label={tx("Provincial plan ({province})").replace("{province}", s.province)} desc={tx("Apply your provincial drug benefit where eligible.")} /></Card>
          <Card className="p-5">
            <Switch checked={s.hasPrivate} onChange={(v) => set({ hasPrivate: v, payOOP: false })} label={tx("Private / group insurance")} desc={tx("Bill your workplace or private plan directly.")} />
            {s.hasPrivate && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Field label={tx("Carrier")} value={s.carrier} onChange={(e) => set({ carrier: e.target.value })} />
                <Field label={tx("Group #")} value={s.group} onChange={(e) => set({ group: e.target.value })} />
                <Field label={tx("Member ID")} placeholder={tx("Optional")} value={s.member} onChange={(e) => set({ member: e.target.value })} />
              </div>
            )}
          </Card>
          <Card className="p-5"><Switch checked={s.payOOP} onChange={(v) => set({ payOOP: v, useProvincial: !v && s.useProvincial, hasPrivate: !v && s.hasPrivate })} label={tx("Pay out of pocket")} desc={tx("Skip insurance for this order.")} /></Card>
          <Card className="p-5">
            <p className="mb-2 font-semibold text-ink">{tx("Estimated coverage")}</p>
            <Row k={tx("Medications")} v={`$${subtotal.toFixed(2)}`} />
            <Row k={tx("Dispensing fee")} v={`$${(s.meds.length ? DISPENSING_FEE : 0).toFixed(2)}`} />
            <Row
              k={hasInsurance ? tx("Insurance (~{pct}%)").replace("{pct}", String(Math.round(rate * 100))) : tx("Insurance")}
              v={hasInsurance ? `−$${covered.toFixed(2)}` : "—"}
              tone={hasInsurance ? "wellness" : undefined}
            />
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2"><span className="font-semibold text-ink">{tx("Estimated total")}</span><span className="font-display text-lg font-medium text-ink tnum">${total$.toFixed(2)}</span></div>
          </Card>
        </div>
      </EntryFlow>
    );

  /* 7. Delivery */
  if (step === "delivery")
    return (
      <EntryFlow {...common} title={tx("Delivery")} onNext={goNext} nextDisabled={!s.address}>
        <div className="space-y-4">
          <Card className="p-5"><Field label={tx("Delivery address")} value={s.address} onChange={(e) => set({ address: e.target.value })} /></Card>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={tx("Delivery speed")}>
            {([
              { id: "standard" as const, t: tx("Standard"), d: tx("Free · 1–3 business days") },
              { id: "sameday" as const, t: tx("Same-day"), d: tx("Select locations · free") },
            ]).map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={s.speed === o.id}
                onClick={() => set({ speed: o.id })}
                className={"rounded-2xl border p-4 text-left " + (s.speed === o.id ? "border-primary bg-primary-subtle" : "border-line bg-surface-2 hover:bg-[color:var(--state-hover)]")}
              >
                <p className="font-semibold text-ink">{o.t}</p><p className="text-sm text-ink-tertiary">{o.d}</p>
              </button>
            ))}
          </div>
          <Card className="p-5"><Switch checked={s.leaveAtDoor} onChange={(v) => set({ leaveAtDoor: v })} label={tx("Leave at my door")} desc={tx("Discreet packaging, with photo confirmation.")} /></Card>
          <Card className="p-5"><Field label={tx("Delivery notes (optional)")} placeholder={tx("Buzzer code, instructions…")} value={s.notes} onChange={(e) => set({ notes: e.target.value })} /></Card>
        </div>
      </EntryFlow>
    );

  /* 8. Review */
  if (step === "review") {
    const methodLabel = {
      upload: tx("Photo upload"),
      fax: tx("Clinic fax"),
      mail: tx("Mail-in kit"),
      transfer: tx("Pharmacy transfer"),
    }[s.method ?? "upload"];
    const forValue = s.who === "self"
      ? tx("Myself")
      : `${s.otherName || tx("Family member")}${s.otherRel ? ` (${s.otherRel})` : ""}`;
    const insuranceValue = s.payOOP
      ? tx("Pay out of pocket")
      : [s.useProvincial && tx("Provincial ({province})").replace("{province}", s.province), s.hasPrivate && s.carrier].filter(Boolean).join(" + ") || tx("None");
    const rows: [string, string, Step][] = [
      [tx("Method"), methodLabel, "method"],
      [tx("Medications"), s.meds.map((m) => `${m.name} ${m.strength}`).join(", ") || "—", "meds"],
      [tx("For"), forValue, "patient"],
      [tx("Allergies"), s.allergies.join(", ") || tx("None"), "patient"],
      [tx("Packaging"), s.packaging === "pocketpacks" ? tx("PocketPacks") : tx("Vials"), "packaging"],
      [tx("Auto-refill"), s.autoRefill ? tx("On") : tx("Off"), "packaging"],
      [tx("Insurance"), insuranceValue, "insurance"],
      [tx("Delivery"), `${s.speed === "standard" ? tx("Standard") : tx("Same-day")} · ${s.address}`, "delivery"],
    ];
    return (
      <EntryFlow
        {...common}
        title={tx("Review your order")}
        onNext={goNext}
        nextLabel={tx("Pay & confirm")}
        nextDisabled={!pay.ready(offerQuote.due)}
      >
        <Card className="divide-y divide-line p-0">
          {rows.map(([k, v, to]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0"><p className="text-xs text-ink-tertiary">{k}</p><p className="truncate text-sm font-semibold text-ink">{v}</p></div>
              <button onClick={() => setStep(to)} className="shrink-0 text-sm font-semibold text-primary hover:underline">{tx("Edit")}</button>
            </div>
          ))}
        </Card>
        <Card className="mt-4 p-5">
          <Row k={tx("Medications")} v={`$${subtotal.toFixed(2)}`} />
          <Row k={tx("Dispensing fee")} v={`$${(s.meds.length ? DISPENSING_FEE : 0).toFixed(2)}`} />
          <Row k={tx("Delivery")} v={tx("FREE")} tone="wellness" />
          {hasInsurance && <Row k={tx("Insurance (~{pct}%)").replace("{pct}", String(Math.round(rate * 100)))} v={`−$${covered.toFixed(2)}`} tone="wellness" />}
          {offerQuote.credit > 0 && (
            <Row k={tx("Offer")} v={`−$${offerQuote.credit.toFixed(2)}`} tone="wellness" />
          )}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2"><span className="font-semibold text-ink">{tx("You pay")}</span><span className="font-display text-xl font-medium text-ink tnum">${(offerQuote.credit > 0 ? offerQuote.due : total$).toFixed(2)}</span></div>
        </Card>
        <div className="mt-4">
          <ActiveOfferBanner />
        </div>
        <div className="mt-6">
          <ChoosePaymentOption pay={pay} due={offerQuote.due} />
        </div>
        <div className="mt-4">
          <CheckoutOffers context={offerCtx} />
        </div>
      </EntryFlow>
    );
  }

  /* Confirmation */
  return <Confirmation state={s} total={offerQuote.due} onHome={() => nav("/app")} onTrack={() => nav("/pharmacy")} />;
}

function Confirmation({ state, total, onHome, onTrack }: { state: State; total: number; onHome: () => void; onTrack: () => void }) {
  const { tx } = useI18n();
  const [verifying, setVerifying] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVerifying(false), 2000); return () => clearTimeout(t); }, []);

  const countPart = state.meds.length === 1
    ? tx("{n} medication").replace("{n}", String(state.meds.length))
    : tx("{n} medications").replace("{n}", String(state.meds.length));
  const packPart = state.packaging === "pocketpacks" ? tx("PocketPacks") : tx("vials");
  const payPart = total > 0
    ? tx("{amount} charged").replace("{amount}", `$${total.toFixed(2)}`)
    : tx("covered by your plan");
  const summary = `${countPart} · ${packPart} · ${payPart}.`;

  const timeline: [string, string, string][] = [
    [tx("Order placed"), tx("Just now"), "done"],
    [tx("Pharmacist verifying"), tx("Within 1 hour"), "active"],
    [tx("Filled & packed"), tx("Tomorrow"), "todo"],
    [tx("Delivered"), state.speed === "sameday" ? tx("Today (select areas)") : tx("1–3 days"), "todo"],
  ];

  return (
    <EntryFlow eyebrow={tx("Fill your prescription")} title="" step={9} total={9} hideNav>
      {verifying ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-subtle text-2xl">🧑‍⚕️</span>
          <p className="font-semibold text-ink">{tx("A pharmacist is reviewing your prescription…")}</p>
          <p className="text-sm text-ink-tertiary">{tx("Every order is verified before it's filled.")}</p>
        </Card>
      ) : (
        <div className="animate-fade-up text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-wellness-subtle text-3xl">🎉</span>
          <h1 className="mt-5 text-3xl font-medium text-ink">{tx("Order placed")}</h1>
          <p className="mt-2 text-ink-secondary">{summary}</p>
          <Card className="mt-6 p-5 text-left">
            <div className="flex items-center justify-between text-sm"><span className="text-ink-tertiary">{tx("Order")}</span><span className="font-semibold text-ink tnum">#PP-RX-3391</span></div>
            <ol className="mt-4 space-y-0">
              {timeline.map(([label, meta, st], i, arr) => (
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
              <Badge tone="accent">{tx("Auto-refill on")}</Badge>
              <p className="mt-2 text-sm text-ink-secondary">{tx("We'll prepare your next refill and remind you before you run out—no action needed.")}</p>
            </div>
          )}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="wellness" onClick={onTrack}>{tx("Track order")}</Button>
            <Button variant="secondary" onClick={onHome}>{tx("Back to home")}</Button>
          </div>
        </div>
      )}
    </EntryFlow>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "wellness" }) {
  return <div className="flex items-center justify-between text-sm"><span className="text-ink-secondary">{k}</span><span className={tone === "wellness" ? "font-medium text-wellness tnum" : "text-ink tnum"}>{v}</span></div>;
}
