import { useNavigate } from "react-router-dom";
import { FlowLayout } from "@/components/layout/FlowLayout";
import { Card, Field } from "@/components/ui";
import { useJourney } from "@/lib/journey";

/* ── Eligibility ────────────────────────────────────────── */
export function Eligibility() {
  const nav = useNavigate();
  const { answers, setAnswer } = useJourney();
  const ready = Boolean(answers.age && answers.pregnant);

  return (
    <FlowLayout
      step="eligibility"
      title="Let's check you're eligible"
      subtitle="A couple of quick questions so we can care for you safely online."
      back="/find-care"
      onContinue={() => nav("/care/questionnaire")}
      continueDisabled={!ready}
    >
      <div className="space-y-4">
        <Card className="p-5">
          <Field
            label="How old are you?"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 34"
            value={answers.age ?? ""}
            onChange={(e) => setAnswer("age", e.target.value)}
            hint="Online care is available for adults 18 and over."
          />
        </Card>

        <Card className="p-5">
          <p className="mb-2.5 text-sm font-medium text-ink-secondary">
            Are you currently pregnant or breastfeeding?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {["No", "Yes"].map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswer("pregnant", opt)}
                className={
                  "h-11 rounded-xl border text-sm font-semibold transition-colors " +
                  (answers.pregnant === opt
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-line bg-surface-2 text-ink-secondary hover:border-strong")
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </Card>

        {answers.age && Number(answers.age) < 18 && (
          <Card className="border-warning/40 bg-warning-subtle p-4">
            <p className="text-sm font-medium text-warning">
              Online treatment is limited to adults. We can still help — message our care team for guidance.
            </p>
          </Card>
        )}
      </div>
    </FlowLayout>
  );
}

/* ── Questionnaire ──────────────────────────────────────── */
export function Questionnaire() {
  const nav = useNavigate();
  const { answers, setAnswer } = useJourney();
  const ready = Boolean(answers.symptomsSince);

  return (
    <FlowLayout
      step="questionnaire"
      title="Tell us a bit more"
      subtitle="This goes straight to the clinician reviewing your case. There are no wrong answers."
      back="/care/eligibility"
      onContinue={() => nav("/care/review")}
      continueDisabled={!ready}
    >
      <div className="space-y-4">
        <Card className="p-5">
          <p className="mb-2.5 text-sm font-medium text-ink-secondary">
            How long have you had symptoms?
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {["Under a week", "1–4 weeks", "Over a month"].map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswer("symptomsSince", opt)}
                className={
                  "h-11 rounded-xl border px-2 text-sm font-semibold transition-colors " +
                  (answers.symptomsSince === opt
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-line bg-surface-2 text-ink-secondary hover:border-strong")
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <Field
            label="Any medications you currently take?"
            placeholder="e.g. none, or list them"
            value={answers.otherMeds ?? ""}
            onChange={(e) => setAnswer("otherMeds", e.target.value)}
          />
        </Card>

        <Card className="p-5">
          <Field
            label="Any allergies?"
            placeholder="e.g. penicillin, none"
            value={answers.allergies ?? ""}
            onChange={(e) => setAnswer("allergies", e.target.value)}
          />
        </Card>
      </div>
    </FlowLayout>
  );
}
