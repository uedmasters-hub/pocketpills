import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui";
import { treatments } from "@/lib/data";

function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-1/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="PocketPills home">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[color:var(--color-primary-fg)] text-lg">⊕</span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">Pocket<span className="text-primary">Pills</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-xl px-3.5 py-2 text-sm font-semibold text-ink-secondary hover:text-ink">Log in</Link>
          <Link to="/get-started" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-[color:var(--color-primary-fg)] hover:bg-primary-hover">Get started</Link>
        </div>
      </div>
    </header>
  );
}

export function Landing() {
  const nav = useNavigate();
  const go = () => nav("/get-started");
  return (
    <div className="min-h-screen bg-surface-0">
      <PublicHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
          <div className="animate-fade-up text-center">
            <Badge tone="wellness">🇨🇦 Complete care, without leaving home</Badge>
            <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-extrabold leading-[1.03] text-ink sm:text-6xl">
              Doctor visits, prescriptions & pharmacy—{" "}<span className="text-primary">all in one place.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-secondary">
              Consult licensed Canadian providers, renew or start a prescription, and get it delivered to your door—free. On your time, all online.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={go}>Get started</Button>
              <a href="#how" className="inline-flex h-13 items-center rounded-xl border border-line bg-surface-2 px-6 text-base font-semibold text-ink hover:border-strong">See how it works</a>
            </div>
            <p className="mt-6 text-sm text-ink-tertiary">Join <span className="font-semibold text-ink">800,000+</span> Canadians · 4.8★ app rating · NABP accredited</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-ink-tertiary">Proud pharmacy of</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {["Canadian Tire", "Toyota", "Neo", "KOHO", "Indeed", "123Dentist", "VetCare"].map((p) => (
              <span key={p} className="rounded-full border border-line bg-surface-1 px-3.5 py-1.5 text-sm font-semibold text-ink-secondary">{p}</span>
            ))}
          </div>
        </section>

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

        <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">How it works</p>
            <h2 className="mt-1.5 text-3xl font-bold text-ink">Do it all without leaving home</h2>
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

        <section className="border-y border-line bg-surface-1">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Treatments</p>
              <h2 className="mt-1.5 text-3xl font-bold text-ink">Find the right choice for you</h2>
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

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-3xl border border-line bg-primary-subtle p-10 text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold text-ink sm:text-4xl">Stay in control of your health.</h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-secondary">Free delivery to every province and territory. No membership fees, no waiting rooms.</p>
            <div className="mt-7"><Button size="lg" onClick={go}>Get started free</Button></div>
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
