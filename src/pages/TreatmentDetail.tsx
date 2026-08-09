import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { treatments } from "@/lib/data";
import { useJourney } from "@/lib/journey";

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
  const { slug } = useParams();
  const nav = useNavigate();
  const { setTreatment } = useJourney();
  const t = treatments.find((x) => x.slug === slug);

  if (!t) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">Treatment not found</p>
        <Link
          to="/find-care"
          className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
        >
          Back to Find Care
        </Link>
      </div>
    );
  }

  const start = () => {
    setTreatment(t.slug);
    nav("/care/eligibility");
  };

  const similar = treatments.filter((x) => x.category === t.category && x.slug !== t.slug).slice(0, 3);

  return (
    <div>
      <Link
        to="/find-care"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← Find Care
      </Link>

      {/* Mobile: title → CTA → rest. Desktop: content | sticky start box */}
      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-10 lg:gap-y-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-[color:var(--pp-primary-200)] lg:col-start-1 lg:row-start-1">
          <div className="relative aspect-[16/9] w-full sm:aspect-[2.2/1]">
            {t.img ? (
              <img
                src={t.img}
                alt=""
                onError={hideOnError}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            ) : (
              <span className="grid h-full place-items-center text-6xl" aria-hidden>
                {t.emoji}
              </span>
            )}
          </div>
        </div>

        <header className="min-w-0 lg:col-start-1 lg:row-start-2">
          <p className="pp-caps text-[color:var(--pp-violet)]">{t.category}</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {t.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">{t.blurb}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {t.eligible && (
              <span className="rounded-full bg-wellness-subtle px-3 py-1 text-xs font-semibold text-wellness">
                Available online
              </span>
            )}
            <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
              ~10 min assessment
            </span>
            <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
              Free delivery
            </span>
          </div>
        </header>

        <aside className="space-y-3 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">Start care</p>
            <p className="mt-0.5 text-2xs text-ink-tertiary">Online assessment · clinician reviewed</p>

            <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
              <span>
                <span className="block text-2xs text-ink-tertiary">
                  {t.from === 0 ? "Coverage" : "From"}
                </span>
                <span className="font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                  {t.from === 0 ? "Covered" : `$${t.from}`}
                </span>
                {t.from > 0 && <span className="ml-1 text-sm text-ink-tertiary">/mo</span>}
              </span>
              {t.eligible && (
                <span className="rounded-full bg-wellness-subtle px-2.5 py-1 text-2xs font-semibold text-wellness">
                  Online
                </span>
              )}
            </div>

            {t.from === 0 && (
              <p className="mt-2 text-2xs text-ink-tertiary">
                Covered by most provincial and private plans.
              </p>
            )}

            <div className="mt-5 space-y-2">
              <Button fullWidth onClick={start}>
                Start assessment
              </Button>
              <Button fullWidth variant="secondary" onClick={() => nav("/questions")}>
                Have questions?
              </Button>
            </div>
          </div>

          <p className="px-1 text-center text-2xs leading-relaxed text-ink-tertiary">
            You’ll know if treatment is appropriate before anything is prescribed.
          </p>
        </aside>

        <section className="min-w-0 lg:col-start-1 lg:row-start-3">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            What to expect
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
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-secondary">{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="min-w-0 lg:col-start-1 lg:row-start-4">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            Included with care
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
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {similar.length > 0 && (
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            More in {t.category}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {similar.map((s) => (
              <Link
                key={s.slug}
                to={`/treatment/${s.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:bg-[color:var(--state-hover)]"
              >
                <div className="relative aspect-[5/3] bg-[color:var(--pp-primary-200)]">
                  {s.img ? (
                    <img
                      src={s.img}
                      alt=""
                      loading="lazy"
                      onError={hideOnError}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-3xl" aria-hidden>
                      {s.emoji}
                    </span>
                  )}
                </div>
                <span className="p-4">
                  <span className="block font-semibold text-[color:var(--pp-primary-950)]">{s.name}</span>
                  <span className="mt-1 block text-sm text-ink-tertiary">
                    {s.from === 0 ? "Covered by most plans" : `From $${s.from}/mo`}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
