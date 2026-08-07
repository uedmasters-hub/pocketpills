import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, Badge, SectionHead } from "@/components/ui";
import { intents, treatments } from "@/lib/data";

export function Home() {
  const nav = useNavigate();
  return (
    <div className="space-y-16">
      {/* Hero — the thesis: intent before features */}
      <section className="animate-fade-up">
        <Badge tone="wellness">🇨🇦 Licensed Canadian pharmacy</Badge>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] text-ink sm:text-5xl md:text-6xl">
          Healthcare that starts with{" "}
          <span className="text-primary">what you need</span>—not a menu of services.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-secondary">
          Tell us why you're here. We'll guide you to the right care, connect you with a
          licensed clinician, and deliver medication to your door.
        </p>

        {/* Intent cards — the decision hub */}
        <div className="mt-9">
          <p className="mb-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-tertiary">
            How can we help you today?
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {intents.map((it, i) => (
              <Card
                key={it.id}
                interactive
                onClick={() => nav(it.to)}
                className="flex items-center gap-4 p-4 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && nav(it.to)}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-subtle text-2xl">
                  {it.emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{it.label}</p>
                  <p className="truncate text-sm text-ink-tertiary">{it.desc}</p>
                </div>
                <span className="ml-auto text-ink-tertiary" aria-hidden>→</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended treatments */}
      <section>
        <div className="flex items-end justify-between">
          <SectionHead
            eyebrow="Popular treatments"
            title="Start a treatment plan"
            sub="Assessed online by Canadian clinicians. Free delivery, no membership fees."
          />
          <Link to="/find-care" className="hidden shrink-0 text-sm font-semibold text-primary hover:underline sm:block">
            See all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {treatments.slice(0, 3).map((t) => (
            <Card key={t.slug} interactive onClick={() => nav(`/treatment/${t.slug}`)} className="p-5">
              <span className="text-3xl">{t.emoji}</span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">{t.category}</p>
              <h3 className="mt-1 text-lg font-bold text-ink">{t.name}</h3>
              <p className="mt-1.5 text-sm text-ink-secondary">{t.blurb}</p>
              <p className="mt-4 text-sm text-ink-tertiary">
                {t.from === 0 ? "Covered by most plans" : <>From <span className="font-semibold text-ink tnum">${t.from}</span>/mo</>}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <SectionHead eyebrow="How it works" title="One connected experience" />
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { n: "01", t: "Tell us what you need", d: "Pick an intent or search a symptom." },
            { n: "02", t: "Get assessed online", d: "A short questionnaire and clinician review." },
            { n: "03", t: "We fill your script", d: "Pharmacists verify and package your meds." },
            { n: "04", t: "Delivered & managed", d: "Free delivery, reminders, and refills." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-surface-1 p-5">
              <p className="font-display text-sm font-bold text-primary tnum">{s.n}</p>
              <p className="mt-2 font-semibold text-ink">{s.t}</p>
              <p className="mt-1 text-sm text-ink-tertiary">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="rounded-3xl border border-line bg-surface-1 p-8 text-center">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {[
            ["4.8★", "App store rating"],
            ["300k+", "Canadians served"],
            ["Free", "Delivery, always"],
            ["PIPEDA", "Privacy compliant"],
          ].map(([big, small]) => (
            <div key={small}>
              <p className="font-display text-2xl font-extrabold text-ink">{big}</p>
              <p className="text-sm text-ink-tertiary">{small}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button size="lg" onClick={() => nav("/find-care")}>Find your care</Button>
        </div>
      </section>
    </div>
  );
}
