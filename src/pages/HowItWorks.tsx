import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/lib/user";
import { SECTION_GAP } from "@/components/layout/Grid";
import { useI18n } from "@/lib/i18n";

const CDN = "https://static.pocketpills.com/acq-web/redesign/home";
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

const CTA =
  "inline-flex h-12 items-center justify-center rounded-full bg-cta px-8 text-md font-medium text-white transition-colors duration-200 hover:bg-cta-hover active:bg-cta-pressed";
const CTA_SECONDARY =
  "inline-flex h-12 items-center justify-center rounded-full border border-line bg-white px-6 text-sm font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]";

type Step = {
  n: number;
  title: string;
  lead: string;
  body: string;
  listTitle: string;
  items: string[];
  /** Optional second column (e.g. pharmacists). */
  secondary?: { listTitle: string; items: string[] };
  img: string;
  imgAlt: string;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Become a member",
    lead: "Getting started is easy.",
    body: "Set up your profile in minutes — we’ll guide you through the rest. Managing meds for family? Handle everyone from one account.",
    listTitle: "What you can do",
    items: [
      "Set up your own prescription management",
      "Add family members and manage their medications",
      "Access doctors and pharmacists for expert care",
    ],
    img: "/img/how/card1-welcome.webp",
    imgAlt: "Welcome to Pocketpills",
  },
  {
    n: 2,
    title: "Tell us how we can help",
    lead: "Remove the uncertainty. Get the care you need.",
    body: "Whether you need a prescription, a refill, or answers about your health, we’ll connect you to the right expert.",
    listTitle: "We can help with",
    items: [
      "New prescriptions, refills, or renewals",
      "Minor ailment assessments and treatments",
      "Virtual doctor consultations for diagnosis and advice",
    ],
    img: "/img/how/card2-experts.jpg",
    imgAlt: "Match with Pocketpills clinicians",
  },
  {
    n: 3,
    title: "Connect with a licensed provider",
    lead: "Licensed experts, just a message away.",
    body: "No long waits, no unnecessary appointments — expert care on your schedule.",
    listTitle: "Doctors can",
    items: [
      "Diagnose conditions and prescribe medication",
      "Renew existing prescriptions",
      "Order lab tests or refer you to a specialist",
    ],
    secondary: {
      listTitle: "Pharmacists can",
      items: [
        "Assess minor conditions and prescribe treatment",
        "Answer questions about your medications",
        "Ensure you get the right prescription and dosage",
      ],
    },
    img: "/img/how/card2-call.jpg",
    imgAlt: "Talk to a Pocketpills care provider",
  },
  {
    n: 4,
    title: "Get your prescription delivered",
    lead: "Skip the pharmacy trip.",
    body: "If treatment is prescribed, we’ll fill it and ship it to your door — no extra cost, no extra steps.",
    listTitle: "Delivery includes",
    items: [
      "Free delivery in 1–3 business days",
      "Real-time tracking and updates",
      "Discreet, secure packaging",
    ],
    img: "/img/how/card3-manage.webp",
    imgAlt: "Manage and track Pocketpills deliveries",
  },
];

const FAQS: [string, string][] = [
  [
    "What is Pocketpills?",
    "Pocketpills is a full-service online healthcare platform that brings doctor visits, prescription renewals, and pharmacy deliveries together. Consult licensed Canadian providers, manage meds for yourself or family, and get prescriptions delivered — without a clinic or pharmacy trip.",
  ],
  [
    "What’s new at Pocketpills?",
    "We’ve expanded beyond online pharmacy. You can now see a doctor, renew prescriptions, and get meds delivered in one place — fewer appointments, less back-and-forth, more support.",
  ],
  [
    "Who can use Pocketpills?",
    "Anyone in Canada with a valid address and provincial or private coverage. Whether you’re caring for yourself or family, need a consult or a refill — it’s built to be flexible.",
  ],
  [
    "How do I get an online prescription?",
    "Start a treatment or message care. A licensed provider can diagnose, prescribe, or renew. If medication is prescribed, we fill and ship it free — often within 1–3 business days.",
  ],
  [
    "How do I transfer a prescription?",
    "Sign in, point us to your current pharmacy, and verify your details. We’ll handle the rest. You can also upload a photo or ask your clinic to fax us at 1-855-950-7226.",
  ],
  [
    "Can I refill prescriptions online?",
    "Yes. Refill from your account. We’ll remind you when it’s time, and you can confirm or adjust delivery.",
  ],
  [
    "Does Pocketpills deliver across Canada?",
    "Yes — every province and territory, including remote communities. Standard shipping is always free, discreet, and trackable. Same-day is available in select cities.",
  ],
  [
    "Can my doctor send prescriptions to Pocketpills?",
    "Yes. Your doctor can fax prescriptions to 1-855-950-7226. We’ll notify you when it’s received and start processing right away.",
  ],
  [
    "Can I manage prescriptions for someone else?",
    "Yes. Use multi-profile to manage meds for a child, partner, or family member — track shipments, adjust schedules, and more.",
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

function StepCard({ step, flip }: { step: Step; flip?: boolean }) {
  const { tx } = useI18n();
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white lg:grid lg:grid-cols-2 lg:items-stretch">
      <div
        className={
          "relative min-h-[14rem] bg-[color:var(--pp-primary-200)] sm:min-h-[18rem] " +
          (flip ? "lg:order-2" : "")
        }
      >
        <img
          src={step.img}
          alt={step.imgAlt}
          loading="lazy"
          onError={hideOnError}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>

      <div className={"flex flex-col justify-center p-6 sm:p-8 md:p-10 " + (flip ? "lg:order-1" : "")}>
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--pp-primary-950)] text-sm font-semibold text-white">
            {step.n}
          </span>
          <p className="pp-caps text-[color:var(--pp-violet)]">Step {step.n}</p>
        </div>
        <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl">
          {tx(step.title)}
        </h2>
        <p className="mt-2 text-base font-medium text-[color:var(--pp-primary-800)]">{tx(step.lead)}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary sm:text-base">{tx(step.body)}</p>

        <div className={"mt-6 grid gap-6 " + (step.secondary ? "sm:grid-cols-2" : "")}>
          <BulletList title={step.listTitle} items={step.items} />
          {step.secondary && (
            <BulletList title={step.secondary.listTitle} items={step.secondary.items} />
          )}
        </div>
      </div>
    </article>
  );
}

function Faq() {
  const { tx } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section aria-labelledby="how-faq-heading" className="grid gap-8 lg:grid-cols-[minmax(220px,280px)_1fr] lg:gap-12">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Frequently Asked")}</p>
        <h2 id="how-faq-heading" className="mt-3 font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl">
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
                "rounded-2xl bg-white px-5 py-4 transition-[border-color] duration-200 sm:px-6 sm:py-5 " +
                (isOpen ? "border border-[color:var(--pp-violet)]" : "border border-line")
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
                <span className="text-base font-medium leading-snug text-[color:var(--pp-primary-900)]">
                  {tx(q)}
                </span>
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
                  <p className="mt-3 pr-6 text-sm leading-relaxed text-[color:var(--pp-primary-800)]">
                    {a}
                  </p>
                )}
              </div>
            </div>
          );
        })}
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
          {/* Hero */}
          <header className="overflow-hidden rounded-2xl border border-line bg-white">
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
                  From membership to delivery — doctor visits, renewals, and pharmacy care in four simple steps.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link to={primaryTo} className={CTA}>
                    {primaryLabel}
                  </Link>
                  <Link to="/find-care" className={CTA_SECONDARY}>
                    {tx("Explore treatments")}
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[16rem] bg-[color:var(--primary-500)] sm:min-h-[20rem] lg:min-h-0">
                <video
                  muted
                  playsInline
                  autoPlay
                  loop
                  poster={`${CDN}/posterStep1.webp`}
                  className="absolute inset-0 h-full w-full object-cover"
                  aria-label="Become a Pocketpills member"
                >
                  <source src={`${CDN}/videos/step1.webm`} type="video/webm" />
                </video>
              </div>
            </div>
          </header>

          {/* Steps overview strip */}
          <nav aria-label="Steps overview" className="overflow-hidden rounded-2xl border border-line bg-white px-4 py-4 sm:px-6">
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {STEPS.map((s) => (
                <li key={s.n} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                    {s.n}
                  </span>
                  <span className="text-sm font-medium leading-snug text-[color:var(--pp-primary-950)]">
                    {tx(s.title)}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          {/* Detailed steps */}
          <div className="space-y-6 md:space-y-8">
            {STEPS.map((step, i) => (
              <StepCard key={step.n} step={step} flip={i % 2 === 1} />
            ))}
          </div>

          {/* Trust strip */}
          <aside className="rounded-2xl border border-line bg-white px-6 py-5 sm:px-8 sm:py-6">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Why it works")}</p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ["Licensed care", "Canadian doctors and pharmacists, online."],
                ["Free delivery", "Every province and territory — always."],
                ["One account", "You and your family, managed together."],
              ].map(([t, d]) => (
                <li key={t}>
                  <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(t)}</p>
                  <p className="mt-1 text-sm text-ink-secondary">{tx(d)}</p>
                </li>
              ))}
            </ul>
          </aside>

          <Faq />

          {/* Closing CTA */}
          <section className="rounded-2xl border border-line bg-white px-6 py-10 text-center sm:px-10 sm:py-12">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Ready when you are")}</p>
            <h2 className="mx-auto mt-3 max-w-lg font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl">
              {tx("Stay in control of your health.")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base text-ink-secondary">
              Join Pocketpills for doctor-led care, refills, and free prescription delivery.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to={primaryTo} className={CTA}>
                {primaryLabel}
              </Link>
              <Link to="/transfer" className={CTA_SECONDARY}>
                {tx("Transfer a prescription")}
              </Link>
            </div>
          </section>
    </div>
  );
}
