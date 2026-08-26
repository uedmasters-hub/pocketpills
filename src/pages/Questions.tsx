import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useShellColumn } from "@/lib/columnHover";

export type FaqItem = {
  slug: string;
  q: string;
  a: string;
};

type Topic = {
  id: string;
  label: string;
  items: FaqItem[];
};

export const FAQ_TOPICS: Topic[] = [
  {
    id: "top",
    label: "Top FAQs",
    items: [
      {
        slug: "what-is-pocketpills",
        q: "What is Pocketpills?",
        a: "A full-service online healthcare platform that brings doctor visits, prescription renewals, and pharmacy deliveries together. Consult licensed Canadian providers, manage meds for yourself or family, and get prescriptions delivered — all online.",
      },
      {
        slug: "whats-new",
        q: "What’s new at Pocketpills?",
        a: "Complete care from seeing a doctor to getting prescriptions delivered — fewer appointments, less back-and-forth, more support in one place.",
      },
      {
        slug: "who-can-use",
        q: "Who can use Pocketpills?",
        a: "Anyone in Canada with a valid address and provincial or private coverage — for yourself or your family.",
      },
      {
        slug: "qualify-prescription",
        q: "How do I qualify for a prescription?",
        a: "A licensed Canadian clinician reviews your assessment or consult. If treatment is appropriate for your province and history, they can prescribe or renew. Eligibility depends on the condition and local regulations.",
      },
      {
        slug: "insurance-covered",
        q: "Is Pocketpills covered by insurance?",
        a: "In most cases yes. We accept major private plans, and many telehealth services are covered provincially. Fees are shown clearly before you confirm.",
      },
      {
        slug: "how-much-cost",
        q: "How much does it cost?",
        a: "Medication prices vary by drug and coverage. Standard delivery is free. Telehealth consult fees (when they apply) are shown before you confirm — many plans cover part or all of them.",
      },
      {
        slug: "questions-about-rx",
        q: "What if I have questions about my prescription?",
        a: "Pharmacists are available by phone, email, or in-app chat Mon–Fri 9 AM–9 PM ET and Sat 9 AM–7 PM ET.",
      },
    ],
  },
  {
    id: "orders",
    label: "Orders & delivery",
    items: [
      {
        slug: "delivery-free",
        q: "Is delivery free across Canada?",
        a: "Yes. Standard shipping is always free to every province and territory. Same-day is available in select cities.",
      },
      {
        slug: "delivery-time",
        q: "How long does delivery take?",
        a: "Usually 1–3 business days after your prescription is confirmed, with real-time tracking and discreet packaging.",
      },
      {
        slug: "track-order",
        q: "Can I track my order?",
        a: "Yes. You’ll get updates in your account and by text as your order moves from processing to delivery.",
      },
    ],
  },
  {
    id: "rx",
    label: "Prescriptions & refills",
    items: [
      {
        slug: "fill-existing-rx",
        q: "I already have a prescription. How do I fill it with Pocketpills?",
        a: "Upload a photo of your Rx, ask your clinic to fax 1-855-950-7226, or transfer from another pharmacy. We’ll verify, fill, and ship — usually within 1–3 business days.",
      },
      {
        slug: "transfer-prescription",
        q: "How do I transfer my prescriptions from a different pharmacy?",
        a: "Sign in, point us to your current pharmacy, and verify your details — we’ll handle the rest. Or upload a photo / ask your clinic to fax 1-855-950-7226.",
      },
      {
        slug: "refill-online",
        q: "Can I refill online?",
        a: "Yes. Refill from your account. We’ll remind you when it’s time so you can confirm or adjust delivery.",
      },
      {
        slug: "doctor-send-rx",
        q: "Can my doctor send prescriptions directly?",
        a: "Yes. Have them fax 1-855-950-7226. We’ll notify you when it’s received.",
      },
    ],
  },
  {
    id: "telehealth",
    label: "Telehealth",
    items: [
      {
        slug: "online-prescription",
        q: "Can I get a prescription online?",
        a: "Yes. Start a treatment or message care. A licensed provider can diagnose, prescribe, or renew — then we fill and ship if needed.",
      },
      {
        slug: "prescription-without-doctor",
        q: "Can I get a prescription without consulting a doctor?",
        a: "New prescriptions require a licensed clinician. If you already have a valid Rx, you can fill or transfer it without a new consult. Renewals may need a quick online assessment depending on the medication.",
      },
      {
        slug: "application-speed",
        q: "How fast is the application process?",
        a: "Most online assessments take a few minutes. A clinician typically reviews within hours during care hours; once prescribed or verified, filling and shipping usually follow in 1–3 business days.",
      },
      {
        slug: "replace-family-doctor",
        q: "Does Pocketpills replace my family doctor?",
        a: "No. We’re here between visits for renewals, everyday concerns, and ongoing conditions.",
      },
      {
        slug: "conditions-helped",
        q: "What conditions can you help with?",
        a: "Everyday concerns like UTIs and acne, ongoing conditions like blood pressure and diabetes, birth control, weight loss, and more.",
      },
    ],
  },
  {
    id: "account",
    label: "Account & family",
    items: [
      {
        slug: "manage-family",
        q: "Can I manage prescriptions for someone else?",
        a: "Yes. Use multi-profile for a child, partner, or family member — track shipments and adjust schedules from one account.",
      },
      {
        slug: "create-account",
        q: "How do I create an account?",
        a: "Join Pocketpills in a few minutes with your phone or email. We’ll guide you through profile, coverage, and delivery.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & security",
    items: [
      {
        slug: "health-info-protected",
        q: "How is my health information protected?",
        a: "We follow Canadian privacy laws with encryption, secure storage, access control, and consent-based sharing.",
      },
      {
        slug: "legitimate-pharmacy",
        q: "Is Pocketpills a legitimate pharmacy?",
        a: "Yes — licensed Canadian pharmacy, NABP accredited, SOC 2 Type 2 certified, and PIPEDA compliant.",
      },
    ],
  },
];

function findFaq(slug: string): { topicId: string; item: FaqItem } | null {
  for (const topic of FAQ_TOPICS) {
    const item = topic.items.find((i) => i.slug === slug);
    if (item) return { topicId: topic.id, item };
  }
  return null;
}

export function Questions() {
  const { t } = useI18n();
  const { hash, key } = useLocation();
  const navCol = useShellColumn("nav");
  const mainCol = useShellColumn("main");
  const [topic, setTopic] = useState(FAQ_TOPICS[0].id);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const slug = hash.replace(/^#/, "");
    if (!slug) return;
    const match = findFaq(slug);
    if (!match) return;
    setQ("");
    setTopic(match.topicId);
    setOpen(match.item.slug);
    const t = window.setTimeout(() => {
      document.getElementById(`faq-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [hash, key]);

  const active = FAQ_TOPICS.find((t) => t.id === topic) ?? FAQ_TOPICS[0];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return active.items;
    return FAQ_TOPICS.flatMap((t) => t.items).filter(
      (item) =>
        item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle),
    );
  }, [active, q]);

  const searching = q.trim().length > 0;

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="rounded-2xl border border-line bg-white p-6 sm:p-8 md:p-10">
        <p className="pp-caps text-[color:var(--pp-violet)]">{t("faq.helpCentre")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          {t("faq.title")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {t("faq.sub")}
        </p>
        <label className="mt-6 block max-w-xl">
          <span className="sr-only">{t("faq.search")}</span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(null);
            }}
            placeholder={t("faq.search")}
            className="h-12 w-full rounded-2xl border border-line bg-[color:var(--pp-page)] px-4 text-base text-ink outline-none placeholder:text-ink-tertiary focus:border-primary"
          />
        </label>
      </header>

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        {!searching && (
          <nav
            aria-label={t("faq.topics")}
            className={"lg:sticky lg:top-28 lg:self-start " + navCol.className}
            onMouseEnter={navCol.onMouseEnter}
          >
            <p className="pp-caps text-ink-tertiary">{t("faq.topics")}</p>
            <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {FAQ_TOPICS.map((t) => (
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

        <section
          aria-labelledby="faq-list-heading"
          className={(searching ? "lg:col-span-2 " : "") + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <h2 id="faq-list-heading" className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {searching ? `Results for “${q.trim()}”` : active.label}
          </h2>

          {filtered.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-line bg-white p-8 text-center">
              <p className="text-base font-medium text-[color:var(--pp-primary-950)]">{t("faq.noMatches")}</p>
              <p className="mt-1 text-sm text-ink-secondary">{t("faq.tryAnother")}</p>
              <Link to="/messages" className="mt-4 inline-block text-sm font-medium text-[color:var(--pp-violet)]">
                {t("common.contactCare")}
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map((item) => {
                const isOpen = open === item.slug;
                return (
                  <div
                    key={item.slug}
                    id={`faq-${item.slug}`}
                    className={
                      "scroll-mt-28 rounded-2xl bg-white px-5 py-4 transition-[border-color] " +
                      (isOpen ? "border border-[color:var(--pp-violet)]" : "border border-line")
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : item.slug)}
                      className="flex w-full items-start justify-between gap-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base font-medium leading-snug text-[color:var(--pp-primary-900)]">
                        {item.q}
                      </span>
                      <span className="mt-0.5 shrink-0 text-ink-tertiary" aria-hidden>
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-sm leading-relaxed text-[color:var(--pp-primary-800)]">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="rounded-2xl border border-line bg-white px-6 py-8 text-center sm:px-10">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">{t("faq.stillHelp")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
          {t("faq.stillSub")}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:care@pocketpills.com"
            className="inline-flex h-11 items-center rounded-full bg-cta px-6 text-sm font-medium text-white transition-colors hover:bg-cta-hover"
          >
            {t("faq.emailCare")}
          </a>
          <Link
            to="/how-it-works"
            className="inline-flex h-11 items-center rounded-full border border-line px-6 text-sm font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]"
          >
            {t("faq.howItWorks")}
          </Link>
        </div>
      </aside>
    </div>
  );
}
