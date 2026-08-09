import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Topic = {
  id: string;
  label: string;
  items: [string, string][];
};

const TOPICS: Topic[] = [
  {
    id: "top",
    label: "Top FAQs",
    items: [
      [
        "What is Pocketpills?",
        "A full-service online healthcare platform that brings doctor visits, prescription renewals, and pharmacy deliveries together. Consult licensed Canadian providers, manage meds for yourself or family, and get prescriptions delivered — all online.",
      ],
      [
        "What’s new at Pocketpills?",
        "Complete care from seeing a doctor to getting prescriptions delivered — fewer appointments, less back-and-forth, more support in one place.",
      ],
      [
        "Who can use Pocketpills?",
        "Anyone in Canada with a valid address and provincial or private coverage — for yourself or your family.",
      ],
      [
        "Is Pocketpills covered by insurance?",
        "In most cases yes. We accept major private plans, and many telehealth services are covered provincially. Fees are shown clearly before you confirm.",
      ],
      [
        "What if I have questions about my prescription?",
        "Pharmacists are available by phone, email, or in-app chat Mon–Fri 9 AM–9 PM ET and Sat 9 AM–7 PM ET.",
      ],
    ],
  },
  {
    id: "orders",
    label: "Orders & delivery",
    items: [
      [
        "Is delivery free?",
        "Yes. Standard shipping is always free to every province and territory. Same-day is available in select cities.",
      ],
      [
        "How long does delivery take?",
        "Usually 1–3 business days after your prescription is confirmed, with real-time tracking and discreet packaging.",
      ],
      [
        "Can I track my order?",
        "Yes. You’ll get updates in your account and by text as your order moves from processing to delivery.",
      ],
    ],
  },
  {
    id: "rx",
    label: "Prescriptions & refills",
    items: [
      [
        "How do I transfer a prescription?",
        "Sign in, point us to your current pharmacy, and verify your details — we’ll handle the rest. Or upload a photo / ask your clinic to fax 1-855-950-7226.",
      ],
      [
        "Can I refill online?",
        "Yes. Refill from your account. We’ll remind you when it’s time so you can confirm or adjust delivery.",
      ],
      [
        "Can my doctor send prescriptions directly?",
        "Yes. Have them fax 1-855-950-7226. We’ll notify you when it’s received.",
      ],
    ],
  },
  {
    id: "telehealth",
    label: "Telehealth",
    items: [
      [
        "How do I get an online prescription?",
        "Start a treatment or message care. A licensed provider can diagnose, prescribe, or renew — then we fill and ship if needed.",
      ],
      [
        "Does Pocketpills replace my family doctor?",
        "No. We’re here between visits for renewals, everyday concerns, and ongoing conditions.",
      ],
      [
        "What conditions can you help with?",
        "Everyday concerns like UTIs and acne, ongoing conditions like blood pressure and diabetes, birth control, weight loss, and more.",
      ],
    ],
  },
  {
    id: "account",
    label: "Account & family",
    items: [
      [
        "Can I manage prescriptions for someone else?",
        "Yes. Use multi-profile for a child, partner, or family member — track shipments and adjust schedules from one account.",
      ],
      [
        "How do I create an account?",
        "Join Pocketpills in a few minutes with your phone or email. We’ll guide you through profile, coverage, and delivery.",
      ],
    ],
  },
  {
    id: "privacy",
    label: "Privacy & security",
    items: [
      [
        "How is my health information protected?",
        "We follow Canadian privacy laws with encryption, secure storage, access control, and consent-based sharing.",
      ],
      [
        "Is Pocketpills a legitimate pharmacy?",
        "Yes — licensed Canadian pharmacy, NABP accredited, SOC 2 Type 2 certified, and PIPEDA compliant.",
      ],
    ],
  },
];

export function Questions() {
  const [topic, setTopic] = useState(TOPICS[0].id);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const active = TOPICS.find((t) => t.id === topic) ?? TOPICS[0];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return active.items;
    return TOPICS.flatMap((t) => t.items).filter(
      ([question, answer]) =>
        question.toLowerCase().includes(needle) || answer.toLowerCase().includes(needle),
    );
  }, [active, q]);

  const searching = q.trim().length > 0;

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="rounded-2xl border border-line bg-white p-6 sm:p-8 md:p-10">
        <p className="pp-caps text-[color:var(--pp-violet)]">Help centre</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          Got a question?
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          Search FAQs about delivery, prescriptions, telehealth, and your account.
        </p>
        <label className="mt-6 block max-w-xl">
          <span className="sr-only">Search FAQs</span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(null);
            }}
            placeholder="Search questions…"
            className="h-12 w-full rounded-2xl border border-line bg-[color:var(--pp-page)] px-4 text-base text-ink outline-none placeholder:text-ink-tertiary focus:border-primary"
          />
        </label>
      </header>

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        {!searching && (
          <nav aria-label="FAQ topics" className="lg:sticky lg:top-28 lg:self-start">
            <p className="pp-caps text-ink-tertiary">Topics</p>
            <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {TOPICS.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setTopic(t.id);
                      setOpen(null);
                    }}
                    className={
                      "rounded-full px-3.5 py-2 text-left text-sm font-medium transition-colors lg:w-full lg:rounded-xl " +
                      (topic === t.id
                        ? "bg-[color:var(--pp-primary-950)] text-white"
                        : "bg-white text-ink-secondary ring-1 ring-[color:var(--border-default)] hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <section aria-labelledby="faq-list-heading" className={searching ? "lg:col-span-2" : ""}>
          <h2 id="faq-list-heading" className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {searching ? `Results for “${q.trim()}”` : active.label}
          </h2>

          {filtered.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-line bg-white p-8 text-center">
              <p className="text-base font-medium text-[color:var(--pp-primary-950)]">No matches</p>
              <p className="mt-1 text-sm text-ink-secondary">Try another keyword, or contact our care team.</p>
              <Link to="/messages" className="mt-4 inline-block text-sm font-medium text-[color:var(--pp-violet)]">
                Contact care →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map(([question, answer]) => {
                const id = question;
                const isOpen = open === id;
                return (
                  <div
                    key={id}
                    className={
                      "rounded-2xl bg-white px-5 py-4 transition-[border-color] " +
                      (isOpen ? "border border-[color:var(--pp-violet)]" : "border border-line")
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : id)}
                      className="flex w-full items-start justify-between gap-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base font-medium leading-snug text-[color:var(--pp-primary-900)]">
                        {question}
                      </span>
                      <span className="mt-0.5 shrink-0 text-ink-tertiary" aria-hidden>
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-sm leading-relaxed text-[color:var(--pp-primary-800)]">{answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="rounded-2xl border border-line bg-white px-6 py-8 text-center sm:px-10">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">Still need help?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
          Our care team is here Mon–Sat. Email care@pocketpills.com or call 1-855-950-7226.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:care@pocketpills.com"
            className="inline-flex h-11 items-center rounded-full bg-cta px-6 text-sm font-medium text-white transition-colors hover:bg-cta-hover"
          >
            Email care
          </a>
          <Link
            to="/how-it-works"
            className="inline-flex h-11 items-center rounded-full border border-line px-6 text-sm font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]"
          >
            How it works
          </Link>
        </div>
      </aside>
    </div>
  );
}
