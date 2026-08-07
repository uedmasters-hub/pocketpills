import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EntryFlow } from "@/components/layout/EntryFlow";
import { Card, Field, Badge } from "@/components/ui";
import { Button } from "@/components/ui/Button";

type Method = "upload" | "enter" | "doctor";

export function FillPrescription() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<Method | null>(null);
  const [med, setMed] = useState({ name: "", strength: "", qty: "", prescriber: "" });
  const set = (k: keyof typeof med, v: string) => setMed((m) => ({ ...m, [k]: v }));

  const methods: { id: Method; icon: string; title: string; desc: string }[] = [
    { id: "upload", icon: "📷", title: "Upload a photo", desc: "Snap your prescription or label" },
    { id: "enter", icon: "⌨️", title: "Enter the details", desc: "Type in your medication info" },
    { id: "doctor", icon: "🏥", title: "My doctor will send it", desc: "We'll receive it by fax from your clinic" },
  ];

  if (step === 1)
    return (
      <EntryFlow eyebrow="Fill your prescription" title="How would you like to send it?" step={1} total={4}
        onNext={() => setStep(2)} nextDisabled={!method}>
        <div className="space-y-3">
          {methods.map((m) => (
            <Card key={m.id} interactive onClick={() => setMethod(m.id)}
              className={"flex items-center gap-4 p-4 " + (method === m.id ? "ring-2 ring-primary" : "")}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-subtle text-xl">{m.icon}</span>
              <div><p className="font-semibold text-ink">{m.title}</p><p className="text-sm text-ink-tertiary">{m.desc}</p></div>
              {method === m.id && <span className="ml-auto text-primary">✓</span>}
            </Card>
          ))}
        </div>
      </EntryFlow>
    );

  if (step === 2)
    return (
      <EntryFlow eyebrow="Fill your prescription" title={method === "upload" ? "Upload your prescription" : "Medication details"}
        subtitle={method === "doctor" ? "Enter what you know—we'll confirm the rest with your clinic." : undefined}
        step={2} total={4} onBack={() => setStep(1)} onNext={() => setStep(3)}
        nextDisabled={method !== "doctor" && !med.name}>
        {method === "upload" && (
          <Card className="mb-4 flex flex-col items-center gap-2 border-dashed p-8 text-center">
            <span className="text-3xl">📄</span>
            <p className="font-semibold text-ink">Drag & drop or tap to upload</p>
            <p className="text-sm text-ink-tertiary">JPG or PNG of your prescription or medication label</p>
            <Button variant="secondary" size="sm" className="mt-2">Choose file</Button>
          </Card>
        )}
        <div className="space-y-4">
          <Card className="p-5"><Field label="Medication name" placeholder="e.g. Ramipril" value={med.name} onChange={(e) => set("name", e.target.value)} /></Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5"><Field label="Strength" placeholder="e.g. 5mg" value={med.strength} onChange={(e) => set("strength", e.target.value)} /></Card>
            <Card className="p-5"><Field label="Quantity" placeholder="e.g. 90 tablets" value={med.qty} onChange={(e) => set("qty", e.target.value)} /></Card>
          </div>
          <Card className="p-5"><Field label="Prescriber name" placeholder="e.g. Dr. Smith" value={med.prescriber} onChange={(e) => set("prescriber", e.target.value)} /></Card>
        </div>
      </EntryFlow>
    );

  if (step === 3)
    return (
      <EntryFlow eyebrow="Fill your prescription" title="Delivery & coverage" step={3} total={4}
        onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="Submit prescription">
        <div className="space-y-4">
          <Card className="p-5">
            <p className="mb-3 font-semibold text-ink">Deliver to</p>
            <Field label="Address" defaultValue="221 King St W, Toronto, ON" />
          </Card>
          <Card className="flex items-center justify-between p-5">
            <div><p className="font-semibold text-ink">Insurance on file</p><p className="text-sm text-ink-tertiary">Sun Life · Group 4402</p></div>
            <Badge tone="success">Verified</Badge>
          </Card>
        </div>
      </EntryFlow>
    );

  return (
    <EntryFlow eyebrow="Fill your prescription" title="" step={4} total={4} hideNav>
      <div className="animate-fade-up text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-wellness-subtle text-3xl">✓</span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink">Prescription received</h1>
        <p className="mt-2 text-ink-secondary">A pharmacist will verify {med.name || "your medication"} and reach out if anything's needed. We'll text you when it ships.</p>
        <Card className="mt-6 p-5 text-left">
          <div className="flex items-center justify-between text-sm"><span className="text-ink-tertiary">Reference</span><span className="font-semibold text-ink tnum">#PP-RX-3391</span></div>
          <div className="mt-3 flex items-center justify-between text-sm"><span className="text-ink-tertiary">Status</span><Badge tone="primary">Pharmacist verifying</Badge></div>
        </Card>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="wellness" onClick={() => nav("/pharmacy")}>Track order</Button>
          <Button variant="secondary" onClick={() => nav("/app")}>Back to home</Button>
        </div>
      </div>
    </EntryFlow>
  );
}
