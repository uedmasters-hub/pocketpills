import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EntryFlow } from "@/components/layout/EntryFlow";
import { Card, Field, Badge } from "@/components/ui";
import { Button } from "@/components/ui/Button";

export function TransferPrescription() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [pharmacy, setPharmacy] = useState({ name: "", location: "" });
  const [meds, setMeds] = useState<string[]>([""]);

  const setP = (k: keyof typeof pharmacy, v: string) => setPharmacy((p) => ({ ...p, [k]: v }));
  const setMed = (i: number, v: string) => setMeds((m) => m.map((x, idx) => (idx === i ? v : x)));
  const addMed = () => setMeds((m) => [...m, ""]);
  const removeMed = (i: number) => setMeds((m) => (m.length > 1 ? m.filter((_, idx) => idx !== i) : m));
  const filledMeds = meds.filter((m) => m.trim());

  if (step === 1)
    return (
      <EntryFlow eyebrow="Transfer a prescription" title="Where are your prescriptions now?"
        subtitle="Tell us your current pharmacy—we'll take care of the transfer for you." step={1} total={4}
        onNext={() => setStep(2)} nextDisabled={!pharmacy.name}>
        <div className="space-y-4">
          <Card className="p-5"><Field label="Current pharmacy" placeholder="e.g. Shoppers Drug Mart" value={pharmacy.name} onChange={(e) => setP("name", e.target.value)} /></Card>
          <Card className="p-5"><Field label="Location or phone" placeholder="e.g. Queen St, Toronto · (416) 555-0100" value={pharmacy.location} onChange={(e) => setP("location", e.target.value)} hint="Helps us reach the right store." /></Card>
        </div>
      </EntryFlow>
    );

  if (step === 2)
    return (
      <EntryFlow eyebrow="Transfer a prescription" title="Which medications?"
        subtitle="Add each medication you'd like to move. Not sure of exact names? A pharmacist will confirm." step={2} total={4}
        onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={filledMeds.length === 0}>
        <div className="space-y-3">
          {meds.map((m, i) => (
            <Card key={i} className="flex items-center gap-3 p-4">
              <span className="text-xl">💊</span>
              <input className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-ink placeholder:text-ink-tertiary focus:border-primary"
                placeholder={`Medication ${i + 1} (e.g. Metformin 500mg)`} value={m} onChange={(e) => setMed(i, e.target.value)} aria-label={`Medication ${i + 1}`} />
              <button onClick={() => removeMed(i)} className="shrink-0 text-ink-tertiary hover:text-danger" aria-label="Remove">✕</button>
            </Card>
          ))}
          <Button variant="secondary" size="sm" onClick={addMed}>+ Add another medication</Button>
        </div>
      </EntryFlow>
    );

  if (step === 3)
    return (
      <EntryFlow eyebrow="Transfer a prescription" title="Your details" step={3} total={4}
        onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="Request transfer">
        <div className="space-y-4">
          <Card className="p-5"><Field label="Full name" defaultValue="Alex Chen" /></Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5"><Field label="Date of birth" placeholder="YYYY-MM-DD" /></Card>
            <Card className="p-5"><Field label="Health card (optional)" placeholder="Province + number" /></Card>
          </div>
          <Card className="border-info/30 bg-info-subtle p-4">
            <p className="text-sm text-ink-secondary">By requesting a transfer you authorize PocketPills to contact <span className="font-semibold text-ink">{pharmacy.name || "your pharmacy"}</span> to move {filledMeds.length || "your"} medication(s).</p>
          </Card>
        </div>
      </EntryFlow>
    );

  return (
    <EntryFlow eyebrow="Transfer a prescription" title="" step={4} total={4} hideNav>
      <div className="animate-fade-up text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-wellness-subtle text-3xl">📦</span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink">Transfer requested</h1>
        <p className="mt-2 text-ink-secondary">We'll contact {pharmacy.name || "your pharmacy"} and move your prescriptions. Most transfers complete within 1–2 business days.</p>
        <Card className="mt-6 p-5 text-left">
          <p className="mb-3 font-semibold text-ink">What happens next</p>
          {[["We reach out to your pharmacy", "Today"], ["Prescriptions are moved to PocketPills", "1–2 days"], ["We fill and deliver—free", "After transfer"]].map(([t, meta], i) => (
            <div key={t} className="flex items-center gap-3 py-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-subtle text-xs font-bold text-primary tnum">{i + 1}</span>
              <span className="flex-1 text-sm text-ink-secondary">{t}</span>
              <Badge tone="neutral">{meta}</Badge>
            </div>
          ))}
        </Card>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="wellness" onClick={() => nav("/pharmacy")}>Go to Pharmacy</Button>
          <Button variant="secondary" onClick={() => nav("/app")}>Back to home</Button>
        </div>
      </div>
    </EntryFlow>
  );
}
