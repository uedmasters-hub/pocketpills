import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui";
import { treatments } from "@/lib/data";
import { useJourney } from "@/lib/journey";

export function TreatmentDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { setTreatment } = useJourney();
  const t = treatments.find((x) => x.slug === slug);

  if (!t) {
    return (
      <Card className="p-10 text-center">
        <p className="text-lg font-semibold text-ink">Treatment not found</p>
        <Link to="/find-care" className="mt-2 inline-block font-semibold text-primary hover:underline">
          Back to Find Care
        </Link>
      </Card>
    );
  }

  const start = () => {
    setTreatment(t.slug);
    nav("/care/eligibility");
  };

  return (
    <div>
      <Link to="/find-care" className="text-sm font-semibold text-ink-tertiary hover:text-ink">
        ← Find Care
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-subtle text-4xl">{t.emoji}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t.category}</p>
          <h1 className="text-3xl font-extrabold text-ink">{t.name}</h1>
          <div className="mt-2 flex gap-2">
            <Badge tone="wellness">Available online</Badge>
            <Badge tone="neutral">~10 min assessment</Badge>
          </div>
        </div>
      </div>

      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-secondary">{t.blurb}</p>

      <Card className="mt-8 max-w-3xl p-6">
        <h2 className="font-display text-lg font-bold text-ink">What to expect</h2>
        <ol className="mt-4 space-y-3">
          {[
            "Confirm you're eligible for online care",
            "Answer a short medical questionnaire",
            "A licensed clinician reviews your case",
            "We fill and deliver your prescription free",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-subtle text-xs font-bold text-primary tnum">
                {i + 1}
              </span>
              <span className="text-ink-secondary">{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="sticky bottom-4 mt-4 flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-line bg-surface-2 p-4 md:static">
        <div>
          <p className="text-sm text-ink-tertiary">Assessment</p>
          <p className="font-display text-xl font-extrabold text-ink">
            {t.from === 0 ? "Free" : <>From <span className="tnum">${t.from}</span>/mo</>}
          </p>
        </div>
        <Button size="lg" onClick={start}>Start assessment</Button>
      </div>
    </div>
  );
}
