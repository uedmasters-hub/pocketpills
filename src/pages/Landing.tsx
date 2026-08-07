import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui";
import { treatments } from "@/lib/data";

/* ── Overlaid, scroll-aware header ──────────────────────── */
function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const light = !scrolled;

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300 " +
        (scrolled ? "border-b border-line bg-surface-1/90 backdrop-blur" : "bg-transparent")
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2" aria-label="PocketPills home">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-primary text-lg shadow-sm">⊕</span>
            <span className={"font-display text-lg font-extrabold tracking-tight " + (light ? "text-white" : "text-ink")}>
              Pocket<span className={light ? "text-white/70" : "text-primary"}>Pills</span>
            </span>
          </Link>
          <div className={"hidden items-center rounded-full p-1 text-sm font-semibold lg:flex " + (light ? "bg-white/10 backdrop-blur" : "border border-line bg-surface-2")}>
            {["For Patients", "For Providers", "For Partners"].map((a, i) => (
              <button
                key={a}
                className={
                  "rounded-full px-3 py-1.5 transition-colors " +
                  (i === 0
                    ? light ? "bg-white text-stone-900" : "bg-primary-subtle text-primary"
                    : light ? "text-white/70 hover:text-white" : "text-ink-tertiary hover:text-ink")
                }
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <nav className="hidden items-center gap-6 xl:flex">
          {[["How it works", "#how"], ["Treatments", "#treatments"], ["Reviews", "#reviews"]].map(([label, href]) => (
            <a key={label} href={href} className={"text-sm font-semibold " + (light ? "text-white/80 hover:text-white" : "text-ink-secondary hover:text-ink")}>
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className={"inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors " + (light ? "border-white/40 text-white hover:bg-white/10" : "border-line text-ink hover:bg-surface-2")}>
            Sign in
          </Link>
          <Link to="/get-started" className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-[color:var(--color-primary-fg)] hover:bg-primary-hover">
            Sign up
          </Link>
          <span className={"ml-1 hidden text-sm font-semibold underline sm:inline " + (light ? "text-white/80" : "text-ink-tertiary")}>EN</span>
        </div>
      </div>
    </header>
  );
}

/* ── Floating product cards (hero visual, CSS only) ─────── */
function HeroCards() {
  return (
    <div className="relative mx-auto hidden w-full max-w-sm lg:block" aria-hidden>
      <div className="absolute -inset-6 rounded-[2rem] bg-white/5 blur-2xl" />
      <Card className="relative rotate-[-3deg] p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-wellness-subtle font-bold text-wellness">AS</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Dr. Amrita Shah</p>
            <p className="text-xs text-ink-tertiary">Prescription approved</p>
          </div>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-wellness text-sm text-white">✓</span>
        </div>
      </Card>
      <Card className="relative z-10 -mt-2 ml-10 rotate-[2deg] p-4 shadow-float">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-subtle text-xl">💊</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Ramipril 5mg</p>
            <p className="text-xs text-ink-tertiary">Auto-refill · 12 left</p>
          </div>
          <span className="rounded-full bg-wellness-subtle px-2 py-0.5 text-xs font-semibold text-wellness">Active</span>
        </div>
      </Card>
      <Card className="relative -mt-1 rotate-[-1deg] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">🚚 Out for delivery</p>
          <span className="text-xs font-semibold text-primary">Arrives today</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-1">
          <div className="h-full w-2/3 rounded-full bg-primary" />
        </div>
      </Card>
    </div>
  );
}

/* ── Stats bar ──────────────────────────────────────────── */
function StatsBar() {
  const stats = [
    { icon: "🍁", big: "100% Canadian care", small: "Trusted across Canada" },
    { icon: "👥", big: "800K+ members", small: "Never miss a dose" },
    { icon: "🍏", big: "4.8 rating", small: "App Store reviews" },
    { icon: "▶️", big: "4.6 rating", small: "Google Play reviews" },
    { icon: "🛡️", big: "NABP accredited", small: "Licensed pharmacy" },
  ];
  return (
    <section className="border-b border-line bg-surface-1">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-5 px-4 py-6 sm:px-6 md:grid-cols-5 md:divide-x md:divide-line">
        {stats.map((s) => (
          <div key={s.big} className="flex items-center gap-3 md:justify-center md:px-2">
            <span className="text-2xl leading-none">{s.icon}</span>
            <div>
              <p className="font-semibold leading-tight text-ink">{s.big}</p>
              <p className="text-xs text-ink-tertiary">{s.small}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stars() {
  return <span className="text-sm text-coral-500" aria-label="5 out of 5">★★★★★</span>;
}

/* ── Testimonials ───────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    { name: "Kim O.", text: "Moved provinces with no doctor—they set up telehealth and renewed my meds without delay." },
    { name: "Ellie B.", text: "Simple refills, medication reminders, and fast delivery. Managing prescriptions is finally easy." },
    { name: "Peter S.", text: "The convenience and communication are unbeatable. It just takes the hassle away." },
    { name: "Briar L.", text: "The pharmacists are knowledgeable and friendly, and the telehealth team is great too." },
    { name: "Christine P.", text: "Getting a doctor is hard. They ship fast, connect me with care, and go above and beyond." },
    { name: "Angie A.", text: "I haven't had a family doctor in years—this makes it possible to still get my meds." },
  ];
  return (
    <section id="reviews" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Our members love us</p>
        <h2 className="mt-1.5 text-3xl font-bold text-ink sm:text-4xl">Why Canadians choose PocketPills</h2>
        <p className="mt-3 inline-flex items-center gap-2 text-ink-secondary">
          <span className="font-display text-xl font-extrabold text-ink">4.9</span> average · <Stars /> · verified reviews
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {reviews.map((r) => (
          <Card key={r.name} className="p-5">
            <Stars />
            <p className="mt-2 text-ink-secondary">“{r.text}”</p>
            <p className="mt-3 text-sm font-semibold text-ink">{r.name}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ── App download ───────────────────────────────────────── */
function AppBadge({ glyph, top, bottom }: { glyph: string; top: string; bottom: string }) {
  return (
    <a href="#" className="inline-flex items-center gap-3 rounded-2xl bg-stone-900 px-5 py-2.5 text-white transition-transform hover:scale-[1.02]">
      <span className="text-2xl leading-none">{glyph}</span>
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-white/70">{top}</span>
        <span className="block text-sm font-semibold">{bottom}</span>
      </span>
    </a>
  );
}
function AppDownload() {
  return (
    <section className="border-y border-line bg-surface-1">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">The app</p>
          <h2 className="mt-1.5 text-3xl font-bold text-ink sm:text-4xl">Complete care, right from your phone</h2>
          <p className="mt-3 max-w-md text-ink-secondary">
            Track appointments, medications, and deliveries. Get refill reminders and message your
            care team anytime.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <AppBadge glyph="🍏" top="Download on the" bottom="App Store" />
            <AppBadge glyph="▶️" top="Get it on" bottom="Google Play" />
          </div>
          <p className="mt-4 text-sm text-ink-tertiary">Rated 4.8 across 46K+ reviews.</p>
        </div>
        <div className="flex justify-center">
          <div className="w-56 rounded-[2rem] border-8 border-stone-900 bg-surface-2 p-3 shadow-float">
            <div className="rounded-2xl bg-surface-1 p-3">
              <p className="text-xs text-ink-tertiary">Good afternoon,</p>
              <p className="font-display text-lg font-extrabold text-ink">Alex</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-surface-2 p-2">
                  <span>⏰</span><span className="text-xs font-semibold text-ink">Take Ramipril · 8 PM</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-primary-subtle p-2">
                  <span>🚚</span><span className="text-xs font-semibold text-primary">Order arrives today</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-wellness-subtle p-2">
                  <span>✓</span><span className="text-xs font-semibold text-wellness">Refill approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────── */
function Faq() {
  const items = [
    ["What is PocketPills?", "An online healthcare platform: consult a licensed provider, get prescriptions, and have medication delivered—free, all in one place."],
    ["Who can use it?", "Anyone in Canada with a valid address and either provincial or private coverage."],
    ["Is delivery really free?", "Yes—free delivery to every province and territory, including rural and remote communities."],
    ["Does it replace my family doctor?", "No. We're here between visits for renewals, everyday concerns, and ongoing conditions."],
    ["Is my information secure?", "Yes. Data is encrypted, SOC 2 Type 2 certified, and PIPEDA compliant—never shared without your permission."],
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">FAQ</p>
        <h2 className="mt-1.5 text-3xl font-bold text-ink sm:text-4xl">Your questions, answered</h2>
      </div>
      <div className="mt-8 space-y-3">
        {items.map(([q, a], i) => {
          const isOpen = open === i;
          return (
            <Card key={q} className="overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-ink">{q}</span>
                <span className={"shrink-0 text-primary transition-transform " + (isOpen ? "rotate-45" : "")}>＋</span>
              </button>
              {isOpen && <p className="px-5 pb-5 -mt-1 text-ink-secondary">{a}</p>}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/* ── Delivers to ────────────────────────────────────────── */
function DeliversTo() {
  const provinces = ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland & Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"];
  return (
    <section className="border-y border-line bg-surface-1">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-ink">Free delivery, coast to coast</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {provinces.map((p) => (
            <span key={p} className="rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-sm text-ink-secondary">{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────── */
function Footer() {
  const cols: [string, string[]][] = [
    ["Treatment", ["Birth Control", "Acne", "UTI", "Blood Pressure", "Diabetes", "Acid Reflux"]],
    ["Pharmacy", ["Prescriptions", "Refills", "Transfer", "Delivery", "Order history"]],
    ["Medications", ["Search", "Browse A–Z", "Compare", "Insurance", "Pricing"]],
    ["Company", ["About", "Careers", "Blog", "Contact", "Privacy", "Terms"]],
  ];
  return (
    <footer className="border-t border-line bg-surface-2">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-6">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[color:var(--color-primary-fg)] text-lg">⊕</span>
              <span className="font-display text-lg font-extrabold text-ink">Pocket<span className="text-primary">Pills</span></span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-tertiary">
              Complete care from Canadian providers—consult, prescribe, and deliver, all in one place.
            </p>
            <div className="mt-4 text-sm text-ink-secondary">
              Care team: <a href="tel:18559507226" className="font-semibold text-primary">1-855-950-7226</a>
              <p className="mt-1 text-ink-tertiary">Text · Email · Fax · 7 days a week</p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-tertiary">NABP</span>
              <span className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-tertiary">SOC 2 Type 2</span>
              <span className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-tertiary">PIPEDA</span>
            </div>
          </div>
          {cols.map(([title, links]) => (
            <div key={title}>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-tertiary">
                {links.map((l) => (<li key={l}><a href="#" className="hover:text-ink">{l}</a></li>))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-4 text-xs text-ink-tertiary sm:flex-row sm:px-6">
          <span>© 2026 PocketPills · Conceptual redesign, not affiliated with PocketPills Inc.</span>
          <span>PocketPills is not a pharmacy or a drug manufacturer. · EN / FR</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Landing ────────────────────────────────────────────── */
export function Landing() {
  const nav = useNavigate();
  const go = () => nav("/get-started");

  const heroBg = {
    backgroundImage: [
      "radial-gradient(900px 500px at 82% 15%, rgba(20,184,166,0.30), transparent 60%)",
      "radial-gradient(820px 480px at 10% 92%, rgba(234,88,12,0.16), transparent 55%)",
      "radial-gradient(680px 420px at 28% 20%, rgba(124,116,188,0.55), transparent 62%)",
      "linear-gradient(135deg, #1c1a3f 0%, #322e6b 48%, #4a44a0 100%)",
    ].join(", "),
  };

  return (
    <div className="min-h-screen bg-surface-0">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden" style={heroBg}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "22px 22px" }} aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[color:var(--surface-0)]" aria-hidden />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 pt-32 pb-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-40 lg:pb-28">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur">
              🇨🇦 Complete care, without leaving home
            </span>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Your health,
              <br />
              <span className="text-white/85">handled.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg text-white/80 lg:mx-0">
              Same-day online care, prescription renewals, and free pharmacy delivery—backed by
              licensed Canadian doctors and pharmacists, ready when you are.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button size="lg" onClick={go} className="rounded-full px-8">Get started now</Button>
              <a href="#how" className="inline-flex h-13 items-center rounded-full border border-white/30 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10">
                See how it works
              </a>
            </div>
            <p className="mt-6 text-sm text-white/70">Trusted by 800,000+ Canadians · 4.8★ rated</p>
          </div>

          <HeroCards />
        </div>
      </section>

      <StatsBar />

      <main>
        {/* Partners */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-ink-tertiary">Proud pharmacy of</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {["Canadian Tire", "Toyota", "Neo", "KOHO", "Indeed", "123Dentist", "VetCare"].map((p) => (
              <span key={p} className="rounded-full border border-line bg-surface-1 px-3.5 py-1.5 text-sm font-semibold text-ink-secondary">{p}</span>
            ))}
          </div>
        </section>

        {/* Value props */}
        <section className="border-y border-line bg-surface-1">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:px-6 md:grid-cols-3">
            {[
              { icon: "🔍", t: "Find the right care", d: "Tell us your concern and get matched to a care pathway in minutes." },
              { icon: "🩺", t: "Consult a provider", d: "Licensed Canadian doctors review your case and prescribe when appropriate." },
              { icon: "📦", t: "Delivered & managed", d: "Free delivery, refill reminders, and insurance handled for you." },
            ].map((v) => (
              <Card key={v.t} className="p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-subtle text-2xl">{v.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-ink">{v.t}</h3>
                <p className="mt-1.5 text-ink-secondary">{v.d}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">How it works</p>
            <h2 className="mt-1.5 text-3xl font-bold text-ink sm:text-4xl">Do it all without leaving home</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { n: "01", t: "Become a member", d: "Sign up free and tell us what you need." },
              { n: "02", t: "Get assessed online", d: "A short questionnaire and clinician review." },
              { n: "03", t: "We fill your script", d: "Pharmacists verify and package your meds." },
              { n: "04", t: "Delivered to you", d: "Free delivery, reminders, and refills." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-line bg-surface-1 p-5">
                <p className="font-display text-sm font-bold text-primary tnum">{s.n}</p>
                <p className="mt-2 font-semibold text-ink">{s.t}</p>
                <p className="mt-1 text-sm text-ink-tertiary">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Treatments */}
        <section id="treatments" className="border-y border-line bg-surface-1">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Treatments</p>
              <h2 className="mt-1.5 text-3xl font-bold text-ink sm:text-4xl">Find the right choice for you</h2>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {treatments.map((t) => (
                <Card key={t.slug} interactive onClick={go} className="flex items-center gap-4 p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-subtle text-2xl">{t.emoji}</span>
                  <div className="min-w-0"><p className="font-semibold text-ink">{t.name}</p><p className="truncate text-sm text-ink-tertiary">{t.category}</p></div>
                  <span className="ml-auto text-ink-tertiary" aria-hidden>→</span>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Testimonials />
        <AppDownload />
        <Faq />
        <DeliversTo />

        {/* CTA band */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-3xl border border-line bg-primary-subtle p-10 text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold text-ink sm:text-4xl">Stay in control of your health.</h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-secondary">Free delivery to every province and territory. No membership fees, no waiting rooms.</p>
            <div className="mt-7"><Button size="lg" onClick={go} className="rounded-full px-8">Get started free</Button></div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
