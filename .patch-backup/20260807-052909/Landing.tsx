import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui";
import { treatments } from "@/lib/data";

/* ── Overlaid, scroll-aware public header ────────────────── */
function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const light = !scrolled; // light text while over the dark hero

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300 " +
        (scrolled ? "border-b border-line bg-surface-1/90 backdrop-blur" : "bg-transparent")
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2" aria-label="PocketPills home">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[color:var(--color-primary-fg)] text-lg">⊕</span>
            <span className={"font-display text-lg font-extrabold tracking-tight " + (light ? "text-white" : "text-ink")}>
              Pocket<span className={light ? "text-white/70" : "text-primary"}>Pills</span>
            </span>
          </Link>

          {/* audience segmented control */}
          <div className={"hidden items-center rounded-full p-1 text-sm font-semibold lg:flex " + (light ? "bg-white/10" : "border border-line bg-surface-2")}>
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

        <nav className="hidden items-center gap-6 md:flex">
          {[["How it works", "#how"], ["Treatments", "#treatments"], ["Membership", "#how"]].map(([label, href]) => (
            <a key={label} href={href} className={"text-sm font-semibold " + (light ? "text-white/80 hover:text-white" : "text-ink-secondary hover:text-ink")}>
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className={
              "inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors " +
              (light ? "border-white/40 text-white hover:bg-white/10" : "border-line text-ink hover:bg-surface-2")
            }
          >
            Sign in
          </Link>
          <Link
            to="/get-started"
            className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-[color:var(--color-primary-fg)] hover:bg-primary-hover"
          >
            Sign up
          </Link>
          <span className={"ml-1 hidden text-sm font-semibold underline sm:inline " + (light ? "text-white/80" : "text-ink-tertiary")}>EN</span>
        </div>
      </div>
    </header>
  );
}

/* ── Trust / stats bar ──────────────────────────────────── */
function StatsBar() {
  const stats = [
    { icon: "🍁", big: "100% Canadian care", small: "Trusted across Canada" },
    { icon: "👥", big: "800K+ members", small: "Never miss a dose" },
    { icon: "🍎", big: "4.8 rating", small: "App Store reviews" },
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
              <p className="font-semibold text-ink leading-tight">{s.big}</p>
              <p className="text-xs text-ink-tertiary">{s.small}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Landing ────────────────────────────────────────────── */
export function Landing() {
  const nav = useNavigate();
  const go = () => nav("/get-started");

  const heroBg = {
    backgroundImage: [
      "radial-gradient(1000px 500px at 78% 12%, rgba(20,184,166,0.28), transparent 60%)",
      "radial-gradient(900px 500px at 12% 88%, rgba(234,88,12,0.18), transparent 55%)",
      "radial-gradient(700px 420px at 30% 25%, rgba(124,116,188,0.55), transparent 60%)",
      "linear-gradient(135deg, #201d47 0%, #322e6b 48%, #4a44a0 100%)",
    ].join(", "),
  };

  return (
    <div className="min-h-screen bg-surface-0">
      <PublicHeader />

      {/* HERO */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden" style={heroBg}>
        {/* texture + bottom fade */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[color:var(--surface-0)]" aria-hidden />

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-24 pb-16 text-center sm:px-6">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur">
              🇨🇦 Complete care, without leaving home
            </span>

            <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl md:text-8xl">
              Your health,
              <br />
              <span className="text-white/90">handled.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
              Same-day online care, prescription renewals, and free pharmacy delivery—backed by
              licensed Canadian doctors and pharmacists, ready when you are.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={go} className="rounded-full px-8">Get started now</Button>
              <a
                href="#how"
                className="inline-flex h-13 items-center rounded-full border border-white/30 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
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

        {/* CTA band */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-3xl border border-line bg-primary-subtle p-10 text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold text-ink sm:text-4xl">Stay in control of your health.</h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-secondary">Free delivery to every province and territory. No membership fees, no waiting rooms.</p>
            <div className="mt-7"><Button size="lg" onClick={go} className="rounded-full px-8">Get started free</Button></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface-1">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-8 text-xs text-ink-tertiary sm:flex-row sm:px-6">
          <span>© 2026 PocketPills · Conceptual redesign, not affiliated with PocketPills Inc.</span>
          <span>Care team: <a href="tel:18559507226" className="font-semibold text-primary">1-855-950-7226</a> · PocketPills is not a pharmacy or drug manufacturer.</span>
        </div>
      </footer>
    </div>
  );
}
