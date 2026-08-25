import { useState } from "react";
import { Link } from "react-router-dom";
import { EDGE, SECTION_GAP } from "@/components/layout/Grid";
import {
  HOW_IT_WORKS_HERO_POSTER,
  HOW_IT_WORKS_HERO_VIDEO,
  HOW_IT_WORKS_STEPS,
  HOW_IT_WORKS_WHY,
  type HowItWorksStep,
} from "@/lib/howItWorks";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

const PANEL = `rounded-2xl ${EDGE} bg-white`;
const PANEL_PAD = "px-6 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10 lg:px-12 lg:py-12";

const CTA =
  "inline-flex h-12 items-center justify-center rounded-full bg-cta px-8 text-md font-medium text-white transition-colors duration-200 hover:bg-cta-hover active:bg-cta-pressed";
const CTA_SECONDARY =
  "inline-flex h-12 items-center justify-center rounded-full border border-line bg-white px-6 text-sm font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]";

const FAQS: [string, string][] = [
  [
    "What is Pocketpills?",
    "A digital healthcare platform for Nepal. Book licensed consultants, find hospitals, clinics, and pharmacies, and manage medicines — from where you live, unless care cannot wait.",
  ],
  [
    "Who can use Pocketpills?",
    "Anyone in Nepal looking for care for themselves or family. Coverage grows with local partners. If a service is not in your district yet, we say so.",
  ],
  [
    "How do I see a consultant without travelling?",
    "Create an account, find a doctor, and book. You see who you are meeting before you confirm. Meet online when it is safe — travel only if the provider says you must.",
  ],
  [
    "What if I need a hospital or ambulance?",
    "Search facilities or request ambulance and home care. Pocketpills is not a replacement for emergency wards. When you must go in, we help you find the right place.",
  ],
  [
    "How do I fill or transfer a prescription?",
    "Find a pharmacy, then fill or transfer. Delivery is available where partners can reach you. If delivery is not in your area yet, you can still collect locally.",
  ],
  [
    "When should I still travel?",
    "Emergencies, trauma, surgery, labour, imaging, and anything that cannot wait. A screen cannot replace a theatre or a ward. Until then, stay where you are.",
  ],
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0 text-[color:var(--pp-violet)]">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M7.5 12.5 10.5 15.5 16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  const { tx } = useI18n();
  return (
    <div>
      <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(title)}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-snug text-ink-secondary">
            <CheckIcon />
            <span>{tx(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepRow({ step, flip }: { step: HowItWorksStep; flip?: boolean }) {
  const { tx } = useI18n();
  return (
    <article
      id={`step-${step.n}`}
      className="scroll-mt-28 grid items-center gap-6 lg:grid-cols-2 lg:gap-10 xl:gap-14"
    >
      <div
        className={
          `relative min-h-[14rem] overflow-hidden rounded-2xl ${EDGE} bg-[color:var(--pp-primary-200)] sm:min-h-[18rem] lg:min-h-[22rem] ` +
          (flip ? "lg:order-2" : "")
        }
      >
        <img
          src={step.img}
          alt={tx(step.imgAlt)}
          loading="lazy"
          onError={hideOnError}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>

      <div className={flip ? "lg:order-1" : ""}>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--pp-primary-950)] text-sm font-semibold leading-none tracking-normal text-white tnum">
            {step.n}
          </span>
          <p className="pp-caps text-[color:var(--pp-violet)]">
            {tx("Step")} {step.n}
          </p>
        </div>
        <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl">
          {tx(step.title)}
        </h2>
        <p className="mt-2 text-base font-medium text-[color:var(--pp-primary-800)]">{tx(step.lead)}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary sm:text-base">{tx(step.body)}</p>

        <div className={"mt-6 grid gap-6 " + (step.secondary ? "sm:grid-cols-2" : "")}>
          <BulletList title={step.listTitle} items={step.items} />
          {step.secondary && <BulletList title={step.secondary.listTitle} items={step.secondary.items} />}
        </div>
      </div>
    </article>
  );
}

function Faq() {
  const { tx } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section aria-labelledby="how-faq-heading" className={`${PANEL} ${PANEL_PAD}`}>
      <div className="grid gap-8 lg:grid-cols-[minmax(220px,280px)_1fr] lg:gap-12">
        <div>
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Frequently asked")}</p>
          <h2
            id="how-faq-heading"
            className="mt-3 font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl"
          >
            {tx("Your questions, answered.")}
          </h2>
        </div>

        <div className="flex min-w-0 flex-col gap-3" role="list">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            const panelId = `how-faq-panel-${i}`;
            const btnId = `how-faq-btn-${i}`;
            return (
              <div
                key={q}
                role="listitem"
                className={
                  "rounded-2xl px-5 py-4 transition-[border-color] duration-200 sm:px-6 sm:py-5 " +
                  (isOpen ? "border border-[color:var(--pp-violet)]" : EDGE)
                }
              >
                <button
                  id={btnId}
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="text-base font-medium leading-snug text-[color:var(--pp-primary-900)]">{tx(q)}</span>
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[color:var(--pp-primary-900)]" aria-hidden>
                    {isOpen ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 12h14" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                    )}
                  </span>
                </button>
                <div id={panelId} role="region" aria-labelledby={btnId} hidden={!isOpen}>
                  {isOpen && (
                    <p className="mt-3 pr-6 text-sm leading-relaxed text-[color:var(--pp-primary-800)]">{tx(a)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const { tx, lang } = useI18n();
  const { signedIn } = useUser();
  const primaryTo = signedIn ? "/dashboard" : "/get-started";
  const primaryLabel = signedIn ? tx("Go to dashboard") : tx("Get started");

  return (
    <div className={`flex flex-col ${SECTION_GAP}`}>
      <header className={`overflow-hidden ${PANEL}`}>
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx("How it works")}</p>
            <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl lg:text-5xl">
              {lang === "en" ? (
                <>
                  Do it <span className="text-[color:var(--pp-violet)]">all</span> without leaving home.
                </>
              ) : (
                tx("Do it all without leaving home.")
              )}
            </h1>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-ink-secondary">
              {tx(
                "Consult, find nearby care, and manage medicines in four steps. You travel only when a screen is not enough.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to={primaryTo} className={CTA}>
                {primaryLabel}
              </Link>
              <Link to="/appointments" className={CTA_SECONDARY}>
                {tx("Book an appointment")}
              </Link>
            </div>
          </div>

          <div className="relative min-h-[16rem] bg-[color:var(--primary-500)] sm:min-h-[20rem] lg:min-h-0">
            <video
              muted
              playsInline
              autoPlay
              loop
              poster={HOW_IT_WORKS_HERO_POSTER}
              className="absolute inset-0 h-full w-full object-cover"
              aria-label={tx("Create a Pocketpills account")}
            >
              <source src={HOW_IT_WORKS_HERO_VIDEO} type="video/webm" />
            </video>
          </div>
        </div>
      </header>

      <div className={`${PANEL} ${PANEL_PAD}`}>
        <nav aria-label={tx("Steps overview")}>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {HOW_IT_WORKS_STEPS.map((s) => (
              <li key={s.n}>
                <a
                  href={`#step-${s.n}`}
                  className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pp-violet)]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--pp-primary-200)] text-[0.75rem] font-semibold leading-none tracking-normal text-[color:var(--pp-primary-950)] tnum">
                    {s.n}
                  </span>
                  <span className="text-sm font-medium leading-snug text-ink-secondary">{tx(s.title)}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 flex flex-col gap-10 md:mt-10 md:gap-14">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <StepRow key={step.n} step={step} flip={i % 2 === 1} />
          ))}
        </div>

        <aside className="mt-10 border-t border-line pt-8 md:mt-14 md:pt-10">
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Why it works")}</p>
          <ul className="mt-5 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {HOW_IT_WORKS_WHY.map((item) => (
              <li key={item.title} className="flex items-start gap-4">
                <img
                  src={item.imageUrl}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  onError={hideOnError}
                  className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16"
                />
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium leading-snug text-[color:var(--pp-primary-950)]">{tx(item.title)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{tx(item.detail)}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <Faq />

      <section className={`${PANEL} px-6 py-10 text-center sm:px-10 sm:py-12`}>
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Ready when you are")}</p>
        <h2 className="mx-auto mt-3 max-w-lg font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl">
          {tx("Start from where you are.")}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-ink-secondary">
          {tx("Book a consultant, find a facility, or start with a pharmacy. One account, for you and your family.")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to={primaryTo} className={CTA}>
            {primaryLabel}
          </Link>
          <Link to="/doctors" className={CTA_SECONDARY}>
            {tx("Find a doctor")}
          </Link>
        </div>
      </section>
    </div>
  );
}
