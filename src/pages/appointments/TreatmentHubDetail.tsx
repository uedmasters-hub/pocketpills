import { Link, useNavigate, useParams } from "react-router-dom";
import { treatments } from "@/lib/data";
import { useJourney } from "@/lib/journey";
import { useI18n } from "@/lib/i18n";
import { ServiceCtaCard, ServicePageShell } from "@/pages/appointments/ServicePageShell";
import { DetailSection } from "@/components/DetailSection";

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

const STEPS = [
  {
    title: "Confirm eligibility",
    detail: "A few questions to check online care is right for you.",
  },
  {
    title: "Medical questionnaire",
    detail: "Share your history so a clinician can review safely.",
  },
  {
    title: "Clinician review",
    detail: "A licensed Canadian provider reviews your case — usually within 48 hours.",
  },
  {
    title: "Fill & free delivery",
    detail: "If prescribed, we dispense and ship discreetly to your door.",
  },
] as const;

const INCLUDED = [
  "Licensed Canadian clinician",
  "~10 minute assessment",
  "Free delivery across Canada",
  "Pharmacist support anytime",
] as const;

/** Treatment detail inside the Book appointment hub — starts the /care/* journey. */
export function TreatmentHubDetail() {
  const { tx } = useI18n();
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const { setTreatment } = useJourney();
  const treatment = treatments.find((x) => x.slug === slug);

  if (!treatment) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Treatment not found")}</p>
        <Link
          to="/appointments"
          className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
        >
          ‹ {tx("Back")}
        </Link>
      </div>
    );
  }

  const start = () => {
    setTreatment(treatment.slug);
    nav("/care/eligibility");
  };

  const similar = treatments
    .filter((x) => x.category === treatment.category && x.slug !== treatment.slug)
    .slice(0, 3);

  return (
    <ServicePageShell
      aside={
        <ServiceCtaCard
          title={tx("Start care")}
          priceHint={treatment.from === 0 ? tx("Coverage") : tx("From")}
          price={
            treatment.from === 0 ? (
              tx("Covered")
            ) : (
              <>
                ${treatment.from}
                <span className="ml-1 text-sm font-normal text-ink-tertiary">{tx("/mo")}</span>
              </>
            )
          }
          body={
            treatment.from === 0
              ? tx("Covered by most provincial and private plans.")
              : tx("Online assessment · clinician reviewed")
          }
          cta={tx("Start assessment")}
          onCta={start}
          secondary={tx("Have questions?")}
          onSecondary={() => nav("/questions")}
          footer={tx("You’ll know if treatment is appropriate before anything is prescribed.")}
        />
      }
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)]">
        <div className="flex flex-col sm:min-h-[14rem] sm:flex-row sm:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-7 sm:px-8">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx(treatment.category)}</p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
              {tx(treatment.name)}
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-ink-secondary">
              {tx(treatment.blurb)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {treatment.eligible && (
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-wellness shadow-sm">
                  {tx("Available online")}
                </span>
              )}
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                {tx("~10 min assessment")}
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                {tx("Free delivery")}
              </span>
            </div>
          </div>
          <div className="relative mx-auto h-40 w-full max-w-[12rem] shrink-0 sm:mx-0 sm:h-auto sm:w-[38%]">
            {treatment.img ? (
              <img
                src={treatment.img}
                alt={tx(treatment.name)}
                onError={hideOnError}
                className="absolute inset-0 h-full w-full object-contain object-bottom"
              />
            ) : (
              <span className="grid h-full place-items-center text-6xl" aria-hidden>
                {treatment.emoji}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-10">
      <DetailSection title={tx("What to expect")} flush>
        <ol>
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className={"flex gap-4 px-5 py-4 " + (i > 0 ? "border-t border-line" : "")}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-2xs font-bold text-[color:var(--pp-primary-950)] tnum">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[color:var(--pp-primary-950)]">
                  {tx(step.title)}
                </span>
                <span className="mt-0.5 block text-sm text-ink-secondary">{tx(step.detail)}</span>
              </span>
            </li>
          ))}
        </ol>
      </DetailSection>

      <DetailSection title={tx("Included with care")}>
        <ul className="space-y-3">
          {INCLUDED.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 rounded-xl border border-line bg-[color:var(--pp-primary-100)] px-4 py-3.5 text-sm text-[color:var(--pp-primary-950)]"
            >
              <span className="mt-0.5 text-wellness" aria-hidden>
                ✓
              </span>
              {tx(item)}
            </li>
          ))}
        </ul>
      </DetailSection>

      {similar.length > 0 && (
        <DetailSection title={`${tx("More in")} ${tx(treatment.category)}`}>
          <div className="space-y-3">
            {similar.map((s) => (
              <Link
                key={s.slug}
                to={`/appointments/treatments/${s.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-[color:var(--pp-primary-100)] px-4 py-3.5 transition-colors hover:bg-[color:var(--state-hover)]"
              >
                <span>
                  <span className="block font-semibold text-[color:var(--pp-primary-950)]">
                    {tx(s.name)}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-tertiary">
                    {s.from === 0 ? tx("Covered by most plans") : `${tx("From")} $${s.from}${tx("/mo")}`}
                  </span>
                </span>
                <span className="text-sm font-medium text-[color:var(--pp-violet)]" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </DetailSection>
      )}
      </div>
    </ServicePageShell>
  );
}
