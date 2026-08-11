import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { treatments } from "@/lib/data";
import { useJourney } from "@/lib/journey";
import { useI18n } from "@/lib/i18n";

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

export function TreatmentDetail() {
  const { tx } = useI18n();
  const { slug } = useParams();
  const nav = useNavigate();
  const { setTreatment } = useJourney();
  const treatment = treatments.find((x) => x.slug === slug);

  if (!treatment) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Treatment not found")}</p>
        <Link
          to="/find-care"
          className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
        >
          {tx("Back to Find Care")}
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
    <div>
      <Link
        to="/find-care"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {tx("Find Care")}
      </Link>

      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-10 lg:gap-y-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Hero: copy + cutout portrait — not a stretched face crop */}
        <header className="min-w-0 overflow-hidden rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)] lg:col-start-1 lg:row-start-1">
          <div className="flex flex-col sm:min-h-[17rem] sm:flex-row sm:items-stretch">
            <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
              <p className="pp-caps text-[color:var(--pp-violet)]">{tx(treatment.category)}</p>
              <h1 className="mt-2 font-display text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-tight text-[color:var(--pp-primary-950)]">
                {tx(treatment.name)}
              </h1>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink-secondary">{tx(treatment.blurb)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
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

            <div className="relative mx-auto h-48 w-full max-w-[14rem] shrink-0 sm:mx-0 sm:h-auto sm:w-[42%] sm:max-w-none lg:w-[38%]">
              {treatment.img ? (
                <>
                  <img
                    src={treatment.img}
                    alt=""
                    onError={hideOnError}
                    className="absolute inset-0 h-full w-full object-contain object-bottom"
                  />
                  <span
                    className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-gradient-to-r from-[color:var(--pp-primary-200)] to-transparent sm:block"
                    aria-hidden
                  />
                </>
              ) : (
                <span className="grid h-full place-items-center text-6xl" aria-hidden>
                  {treatment.emoji}
                </span>
              )}
            </div>
          </div>
        </header>

        <aside className="space-y-3 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Start care")}</p>
            <p className="mt-0.5 text-2xs text-ink-tertiary">{tx("Online assessment · clinician reviewed")}</p>

            <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
              <span>
                <span className="block text-2xs text-ink-tertiary">
                  {treatment.from === 0 ? tx("Coverage") : tx("From")}
                </span>
                <span className="font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                  {treatment.from === 0 ? tx("Covered") : `$${treatment.from}`}
                </span>
                {treatment.from > 0 && <span className="ml-1 text-sm text-ink-tertiary">{tx("/mo")}</span>}
              </span>
              {treatment.eligible && (
                <span className="rounded-full bg-wellness-subtle px-2.5 py-1 text-2xs font-semibold text-wellness">
                  {tx("Online")}
                </span>
              )}
            </div>

            {treatment.from === 0 && (
              <p className="mt-2 text-2xs text-ink-tertiary">
                {tx("Covered by most provincial and private plans.")}
              </p>
            )}

            <div className="mt-5 space-y-2">
              <Button fullWidth onClick={start}>
                {tx("Start assessment")}
              </Button>
              <Button fullWidth variant="secondary" onClick={() => nav("/questions")}>
                {tx("Have questions?")}
              </Button>
            </div>
          </div>

          <p className="px-1 text-center text-2xs leading-relaxed text-ink-tertiary">
            {tx("You’ll know if treatment is appropriate before anything is prescribed.")}
          </p>
        </aside>

        <section className="min-w-0 lg:col-start-1 lg:row-start-2">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("What to expect")}
          </h2>
          <ol className="mt-4 space-y-0 overflow-hidden rounded-2xl border border-line bg-white">
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
        </section>

        <section className="min-w-0 lg:col-start-1 lg:row-start-3">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("Included with care")}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-[color:var(--pp-primary-950)]"
              >
                <span className="mt-0.5 text-wellness" aria-hidden>
                  ✓
                </span>
                {tx(item)}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {similar.length > 0 && (
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("More in")} {tx(treatment.category)}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {similar.map((s) => (
              <Link
                key={s.slug}
                to={`/treatment/${s.slug}`}
                className="group flex overflow-hidden rounded-2xl border border-line bg-[color:var(--pp-primary-200)] transition-opacity hover:opacity-95"
              >
                <span className="flex min-w-0 flex-1 flex-col justify-center p-4">
                  <span className="font-semibold text-[color:var(--pp-primary-950)]">{tx(s.name)}</span>
                  <span className="mt-1 text-sm text-ink-secondary">
                    {s.from === 0 ? (
                      tx("Covered by most plans")
                    ) : (
                      <>
                        {tx("From")} ${s.from}
                        {tx("/mo")}
                      </>
                    )}
                  </span>
                </span>
                <span className="relative hidden w-[38%] shrink-0 self-stretch sm:block">
                  {s.img ? (
                    <img
                      src={s.img}
                      alt=""
                      loading="lazy"
                      onError={hideOnError}
                      className="absolute inset-0 h-full w-full object-contain object-bottom"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-3xl" aria-hidden>
                      {s.emoji}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
