import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlowLayout } from "@/components/layout/FlowLayout";
import { Card, Badge } from "@/components/ui";
import { useJourney } from "@/lib/journey";
import { treatments } from "@/lib/data";

function useTreatment() {
  const { treatmentSlug } = useJourney();
  return treatments.find((t) => t.slug === treatmentSlug) ?? null;
}

/* ── Review ─────────────────────────────────────────────── */
export function Review() {
  const nav = useNavigate();
  const { answers } = useJourney();
  const t = useTreatment();

  const rows = [
    ["Treatment", t?.name ?? "—"],
    ["Age", answers.age ?? "—"],
    ["Pregnant / breastfeeding", answers.pregnant ?? "—"],
    ["Symptoms", answers.symptomsSince ?? "—"],
    ["Current medications", answers.otherMeds || "None reported"],
    ["Allergies", answers.allergies || "None reported"],
  ];

  return (
    <FlowLayout
      step="review"
      title="Review before you submit"
      subtitle="Check everything looks right. You can go back and edit any answer."
      back="/care/questionnaire"
      onContinue={() => nav("/care/doctor")}
      continueLabel="Submit for review"
    >
      <Card className="divide-y divide-line p-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <span className="text-sm text-ink-tertiary">{k}</span>
            <span className="text-right text-sm font-semibold text-ink">{v}</span>
          </div>
        ))}
      </Card>
      <p className="mt-4 text-center text-xs text-ink-tertiary">
        By submitting you consent to a clinician reviewing your information under PIPEDA.
      </p>
    </FlowLayout>
  );
}

/* ── Doctor review (prescription decision) ──────────────── */
export function DoctorReview() {
  const nav = useNavigate();
  const t = useTreatment();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDone(true), 2200);
    return () => clearTimeout(id);
  }, []);

  return (
    <FlowLayout
      step="doctor"
      title={done ? "You've been prescribed" : "A clinician is reviewing your case"}
      back={done ? undefined : "/care/review"}
      onContinue={done ? () => nav("/care/medication") : undefined}
      continueLabel="Review medication"
      hideFooter={!done}
    >
      {!done ? (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-subtle text-2xl animate-fade-in">
            🩺
          </span>
          <div>
            <p className="font-semibold text-ink">Matching you with a licensed clinician…</p>
            <p className="mt-1 text-sm text-ink-tertiary">This usually takes a few seconds in the demo.</p>
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-primary animate-fade-in"
                style={{ animationDelay: `${i * 200}ms`, opacity: 0.4 + i * 0.2 }}
              />
            ))}
          </div>
        </Card>
      ) : (
        <div className="animate-fade-up space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-wellness-subtle text-xl">✓</span>
              <div>
                <p className="font-semibold text-ink">Dr. Amrita Shah, MD</p>
                <p className="text-sm text-ink-tertiary">Reviewed your {t?.name.toLowerCase()} assessment</p>
              </div>
              <Badge tone="success">Approved</Badge>
            </div>
            <p className="mt-4 rounded-xl bg-surface-1 p-4 text-sm text-ink-secondary">
              “Based on your answers, this treatment is appropriate. I've sent a prescription to the
              PocketPills pharmacy. Reach out any time through Messages if anything changes.”
            </p>
          </Card>
        </div>
      )}
    </FlowLayout>
  );
}
