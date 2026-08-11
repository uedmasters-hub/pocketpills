import { Link } from "react-router-dom";
import { useUser } from "@/lib/user";
import { useI18n } from "@/lib/i18n";

const CTA =
  "inline-flex h-12 items-center justify-center rounded-full bg-cta px-8 text-md font-medium text-white transition-colors duration-200 hover:bg-cta-hover active:bg-cta-pressed";

const FAQS: [string, string][] = [
  [
    "Why choose Pocketpills over traditional pharmacies?",
    "Traditional healthcare felt too complicated. We removed the barriers — online prescription management, licensed providers, and free delivery to your door.",
  ],
  [
    "What is the mission behind Pocketpills?",
    "Put Canadians at the heart of healthcare. User-friendly technology, compassionate care, and reliable medication services in one trusted place.",
  ],
  [
    "Who provides healthcare support at Pocketpills?",
    "Licensed Canadian doctors, pharmacists, and telehealth specialists — personalized care every step of the way.",
  ],
  [
    "Can I order from a Canadian pharmacy online?",
    "Yes. Pocketpills is a licensed Canadian pharmacy. You need a valid prescription from a licensed Canadian provider — or get one through our telehealth service.",
  ],
  [
    "Does Pocketpills offer telehealth across Canada?",
    "Yes. Consult licensed Canadian providers remotely for advice and prescriptions without visiting a clinic.",
  ],
  [
    "How quickly will I receive my medications?",
    "Typically within 1–3 business days after your prescription is confirmed — free, discreet delivery nationwide.",
  ],
  [
    "Can Pocketpills manage prescriptions for my whole family?",
    "Yes. Family members can have their own profiles, or you can manage their meds from your account — deliveries included.",
  ],
  [
    "How secure is my personal health information?",
    "Very. We follow Canadian privacy laws with encryption, secure storage, and strict access controls.",
  ],
];

export function AboutUs() {
  const { tx, lang } = useI18n();
  const { signedIn } = useUser();
  const primaryTo = signedIn ? "/dashboard" : "/get-started";

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Canadian pharmacy")}</p>
            <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl lg:text-5xl">
              {lang === "en" ? (
                <>
                  Taking care of yourself should feel{" "}
                  <span className="text-[color:var(--pp-violet)]">easy</span>.
                </>
              ) : (
                tx("Taking care of yourself should feel easy.")
              )}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-secondary">
              Familiar. Personal. For too long it’s been long waits and confusing processes. That’s why we built Pocketpills —
              to put Canadians back at the centre of care.
            </p>
            <div className="mt-6">
              <Link to={primaryTo} className={CTA}>
                {signedIn ? tx("Go to dashboard") : tx("Get started")}
              </Link>
            </div>
          </div>
          <div className="relative min-h-[14rem] bg-[color:var(--pp-primary-200)] sm:min-h-[18rem] lg:min-h-0">
            <img
              src="/img/nabp-care.png"
              alt="Licensed clinician providing care"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-line bg-white p-6 sm:p-8 md:p-10">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Our mission")}</p>
        <h2 className="mt-2 max-w-2xl font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl">
          {tx("Everything you need on one platform.")}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-ink-secondary">
          Getting treated should be as simple as ordering takeout — accessible everywhere, informed choices, and more time for what matters.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Accessible care", "Make healthcare available to everyone, everywhere."],
            ["Informed choices", "Clear options so you decide with confidence."],
            ["Back to life", "Help you and your loved ones move faster."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-2xl border border-line bg-[color:var(--pp-page)] p-5">
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(t)}</p>
              <p className="mt-1.5 text-sm text-ink-secondary">{tx(d)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {tx("Support that feels human.")}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-secondary">
            Behind every prescription and follow-up is a team that listens — real doctors, pharmacists, and care specialists.
            Technology handles the details so experts can focus on you.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {tx("Healthcare, reimagined.")}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-secondary">
            From prescriptions to provider visits, Pocketpills fits care into your life — simple, personalized, and ready when you need it.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white px-6 py-10 text-center sm:px-10">
        <h2 className="mx-auto max-w-xl font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl">
          {tx("Managing your health shouldn't disrupt your life. It should fit into it.")}
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to={primaryTo} className={CTA}>
            {signedIn ? tx("Go to dashboard") : tx("Join Pocketpills")}
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex h-12 items-center rounded-full border border-line bg-white px-6 text-sm font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]"
          >
            {tx("How it works")}
          </Link>
        </div>
      </section>

      <section aria-labelledby="about-faq-heading">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Frequently Asked")}</p>
        <h2 id="about-faq-heading" className="mt-2 font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Your questions, answered.")}
        </h2>
        <div className="mt-6 space-y-3">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-line bg-white px-5 py-4 open:border-[color:var(--pp-violet)]">
              <summary className="cursor-pointer list-none text-base font-medium text-[color:var(--pp-primary-900)] marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  {tx(q)}
                  <span className="shrink-0 text-ink-tertiary transition-transform group-open:rotate-45" aria-hidden>+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--pp-primary-800)]">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
