import { Link, useNavigate } from "react-router-dom";
import { Card, SectionHead } from "@/components/ui";
import { EntryPoints } from "@/pages/entry/EntryPoints";
import { treatments } from "@/lib/data";
import { useUser, greeting } from "@/lib/user";

export function Home() {
  const nav = useNavigate();
  const { displayName } = useUser();
  return (
    <div className="space-y-14">
      {/* Entry points — "What would you like to do?" */}
      <section>
        <div className="mb-1">
          <p className="text-ink-tertiary">{greeting()},</p>
          <h1 className="font-display text-3xl font-medium text-ink">{displayName}</h1>
        </div>
        <p className="mb-5 mt-3 pp-caps text-ink-tertiary">
          What would you like to do?
        </p>
        <EntryPoints />
      </section>

      {/* Popular treatments */}
      <section>
        <div className="flex items-end justify-between">
          <SectionHead eyebrow="Popular treatments" title="Start a treatment plan"
            sub="Assessed online by Canadian clinicians. Free delivery, no membership fees." />
          <Link to="/appointments" className="hidden shrink-0 text-sm font-semibold text-primary hover:underline sm:block">See all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {treatments.slice(0, 3).map((t) => (
            <Card key={t.slug} interactive onClick={() => nav(`/appointments/treatments/${t.slug}`)} className="p-5">
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
    </div>
  );
}
