import { useState } from "react";
import { Link } from "react-router-dom";
import { SECTION_GAP } from "@/components/layout/Grid";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";

const CTA =
  "inline-flex h-12 items-center justify-center rounded-full bg-cta px-8 text-md font-medium text-white transition-colors duration-200 hover:bg-cta-hover active:bg-cta-pressed";
const CTA_SECONDARY =
  "inline-flex h-12 items-center justify-center rounded-full border border-line bg-white px-6 text-sm font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]";

const STAND_FOR = [
  ["Stay home when it’s safe", "Consult, follow up, and refill without a trip to the city."],
  ["Reach the right specialist", "Not whoever is nearest — the consultant your case needs."],
  ["Travel only when you must", "Emergencies and in-person procedures still happen in person."],
] as const;

const FOR_WHOM = [
  ["Far from a specialist", "Hill, mountain, and remote districts where a consult can mean days of travel."],
  ["Cannot leave easily", "Farm, shop, caregiving, or work that cannot pause for a hospital queue."],
  ["Should not travel unless they must", "Follow-ups, second opinions, and many prescriptions — from where you already are."],
] as const;

const WHAT_WE_DO = [
  ["Consult from where you are", "Book licensed doctors and specialists online. You see who you are meeting before you confirm.", "/doctors", "Find a doctor"],
  ["Find care on the ground", "Hospitals, clinics, pharmacies, home care, and ambulance — when you need someone nearby.", "/facilities", "Find a hospital"],
  ["Medicines without the wasted trip", "Fill, transfer, and get medications delivered so a refill is not another journey.", "/pharmacies", "Find a pharmacy"],
] as const;

const REMOTE_ENOUGH = [
  "New consults and second opinions",
  "Follow-ups and prescription renewals",
  "Pharmacy fills, transfers, and delivery",
];

const GO_IN = [
  "Emergencies, trauma, and anything that cannot wait",
  "Surgery, labour, imaging, and procedures",
  "Care that needs a ward, a lab, or a theatre",
];

const NEXT = [
  ["More of Nepal", "Partner hospitals, clinics, and pharmacies outside the valley — district by district."],
  ["More specialties online", "So the consultant you need is available remotely, not only in a few cities."],
  ["Stronger urgent coverage", "Home care, oxygen, ambulance, and local teams when the screen is not enough."],
  ["Built for how people actually connect", "Nepali and English, and an experience that still works when the signal is thin."],
] as const;

const FAQS: [string, string][] = [
  [
    "Are you replacing my local doctor or hospital?",
    "No. Pocketpills connects you to licensed consultants and facilities. Your local provider stays part of your care — we make it easier to reach the right person sooner.",
  ],
  [
    "Do I never need to travel?",
    "You travel when it is an emergency, or when treatment must happen in person. For advice, follow-up, and many prescriptions, you should not have to leave home.",
  ],
  [
    "Who provides the care?",
    "Licensed doctors, pharmacists, and facilities in Nepal. You see who you are booking before you confirm — no anonymous consults.",
  ],
  [
    "Where do you operate?",
    "Nepal, growing with local partners. If a service is not in your district yet, we say so. Coverage expands as the care is ready — not before.",
  ],
];

function Faq() {
  const { tx } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section aria-labelledby="about-draft-faq-heading" className="grid gap-8 lg:grid-cols-[minmax(220px,280px)_1fr] lg:gap-12">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Frequently asked")}</p>
        <h2
          id="about-draft-faq-heading"
          className="mt-3 font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl"
        >
          {tx("Your questions, answered.")}
        </h2>
      </div>

      <div className="flex min-w-0 flex-col gap-3" role="list">
        {FAQS.map(([q, a], i) => {
          const isOpen = open === i;
          const panelId = `about-draft-faq-panel-${i}`;
          const btnId = `about-draft-faq-btn-${i}`;
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
    </section>
  );
}

export function AboutUsDraft() {
  const { tx, lang } = useI18n();
  const { signedIn } = useUser();
  const primaryTo = signedIn ? "/dashboard" : "/get-started";
  const primaryLabel = signedIn ? tx("Go to dashboard") : tx("Get started");

  return (
    <div className={`flex flex-col ${SECTION_GAP}`}>
      <header className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx("About us")}</p>
            <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl lg:text-5xl">
              {lang === "en" ? (
                <>
                  Specialist care, without leaving{" "}
                  <span className="text-[color:var(--pp-violet)]">home</span>.
                </>
              ) : (
                tx("Specialist care, without leaving home.")
              )}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-secondary">
              {tx(
                "Pocketpills is building digital healthcare for Nepal — so people in the hills, remote districts, and busy towns can reach licensed consultants, pharmacies, and urgent services from where they live. You travel only when care cannot wait.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to={primaryTo} className={CTA}>
                {primaryLabel}
              </Link>
              <Link to="/how-it-works" className={CTA_SECONDARY}>
                {tx("How it works")}
              </Link>
            </div>
          </div>
          <div className="relative min-h-[14rem] bg-[color:var(--pp-primary-200)] sm:min-h-[18rem] lg:min-h-0">
            <img
              src="/img/how/card2-call.png"
              alt={tx("Talking with a licensed care provider")}
              className="absolute inset-0 h-full w-full object-cover object-top"
              loading="lazy"
            />
          </div>
        </div>
      </header>

      <nav aria-label={tx("What we stand for")} className="overflow-hidden rounded-2xl border border-line bg-white px-4 py-4 sm:px-6 sm:py-5">
        <ol className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {STAND_FOR.map(([title, detail], i) => (
            <li key={title} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                {i + 1}
              </span>
              <span>
                <span className="block text-sm font-medium leading-snug text-[color:var(--pp-primary-950)]">{tx(title)}</span>
                <span className="mt-1 block text-sm leading-snug text-ink-secondary">{tx(detail)}</span>
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <section aria-labelledby="about-draft-why-heading" className="rounded-2xl border border-line bg-white p-6 sm:p-8 md:p-10 lg:p-12">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Why we exist")}</p>
        <h2
          id="about-draft-why-heading"
          className="mt-3 max-w-2xl font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl"
        >
          {tx("Too much of Nepal still has to travel for a conversation.")}
        </h2>
        <div className="mt-4 max-w-2xl space-y-4 text-base leading-relaxed text-ink-secondary">
          <p>
            {tx(
              "Specialists and tertiary hospitals are concentrated in a few cities. For families in difficult terrain, a consult can mean lost wages, long roads, and care that arrives later than it should.",
            )}
          </p>
          <p>
            {tx(
              "We are here to close that distance. Digital care is not a replacement for a hospital. It is a way to reach a top consultant earlier, keep treatment going, and reserve travel for emergencies and procedures that truly need it.",
            )}
          </p>
        </div>
      </section>

      <section aria-labelledby="about-draft-who-heading" className="rounded-2xl border border-line bg-white p-6 sm:p-8 md:p-10">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Who it’s for")}</p>
        <h2
          id="about-draft-who-heading"
          className="mt-2 font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl"
        >
          {tx("If getting to care is the hard part, this is for you.")}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {FOR_WHOM.map(([title, detail]) => (
            <li key={title} className="rounded-2xl border border-line bg-[color:var(--pp-page)] p-5">
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(title)}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{tx(detail)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-draft-what-heading" className="rounded-2xl border border-line bg-white p-6 sm:p-8 md:p-10">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("What we do")}</p>
        <h2
          id="about-draft-what-heading"
          className="mt-2 font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl"
        >
          {tx("One place for consultants, facilities, and medicines.")}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-ink-secondary">
          {tx("Consultants, nearby facilities, and medicines — without a separate journey for each.")}
        </p>
        <ul className="mt-8 grid gap-4 lg:grid-cols-3">
          {WHAT_WE_DO.map(([title, detail, to, linkLabel]) => (
            <li key={title} className="flex flex-col rounded-2xl border border-line bg-[color:var(--pp-page)] p-5">
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(title)}</p>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-secondary">{tx(detail)}</p>
              <Link
                to={to}
                className="mt-4 text-sm font-medium text-[color:var(--pp-violet)] transition-colors hover:text-[color:var(--pp-primary-950)]"
              >
                {tx(linkLabel)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-draft-honest-heading" className="rounded-2xl border border-line bg-white p-6 sm:p-8 md:p-10">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("In person, when it matters")}</p>
        <h2
          id="about-draft-honest-heading"
          className="mt-2 max-w-2xl font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl"
        >
          {tx("Stay home unless you shouldn’t.")}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
          {tx(
            "A screen cannot set a bone or deliver a baby. When you need to go, we help you find the right facility and get there. Until then, stay where you are.",
          )}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-[color:var(--pp-page)] p-5">
            <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("Remote is enough")}</p>
            <ul className="mt-3 space-y-2">
              {REMOTE_ENOUGH.map((item) => (
                <li key={item} className="text-sm leading-snug text-ink-secondary">
                  {tx(item)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-[color:var(--pp-page)] p-5">
            <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("Go in")}</p>
            <ul className="mt-3 space-y-2">
              {GO_IN.map((item) => (
                <li key={item} className="text-sm leading-snug text-ink-secondary">
                  {tx(item)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-draft-next-heading" className="rounded-2xl border border-line bg-white p-6 sm:p-8 md:p-10">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("What’s next")}</p>
        <h2
          id="about-draft-next-heading"
          className="mt-2 max-w-2xl font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl"
        >
          {tx("Nepal first. Then further — when the care is ready.")}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
          {tx(
            "We expand with local partners, not with a map we cannot serve. Coverage grows as hospitals, clinics, pharmacies, and consultants come onto the platform.",
          )}
        </p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {NEXT.map(([title, detail], i) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                {i + 1}
              </span>
              <span>
                <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(title)}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-secondary">{tx(detail)}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Faq />

      <section className="rounded-2xl border border-line bg-white px-6 py-10 text-center sm:px-10 sm:py-12">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Ready when you are")}</p>
        <h2 className="mx-auto mt-3 max-w-lg font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl">
          {tx("Get care without leaving your place — unless you must.")}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-ink-secondary">
          {tx("Book a consultant, find a facility, or start with a pharmacy. One account, for you and your family.")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to={primaryTo} className={CTA}>
            {primaryLabel}
          </Link>
          <Link to="/appointments" className={CTA_SECONDARY}>
            {tx("Book an appointment")}
          </Link>
        </div>
      </section>
    </div>
  );
}
