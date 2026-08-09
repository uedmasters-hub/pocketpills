import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Badge, SectionHead } from "@/components/ui";
import { treatments } from "@/lib/data";

export function FindCare() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const cats = useMemo(() => ["All", ...new Set(treatments.map((t) => t.category))], []);
  const [cat, setCat] = useState("All");

  const filtered = treatments.filter(
    (t) =>
      (cat === "All" || t.category === cat) &&
      (t.name.toLowerCase().includes(q.toLowerCase()) ||
        t.blurb.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div>
      <SectionHead
        eyebrow="Find care"
        title="What would you like help with?"
        sub="Search a symptom or condition, or browse treatments. We'll recommend a care pathway."
      />

      <div className="mb-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try “heartburn”, “birth control”, “blood pressure”…"
          className="w-full h-12 rounded-2xl border border-line bg-surface-2 px-4 text-ink placeholder:text-ink-tertiary focus:border-primary"
          aria-label="Search symptoms or treatments"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors " +
                (cat === c ? "bg-primary text-[color:var(--color-primary-fg)]" : "bg-surface-2 text-ink-secondary border border-line hover:bg-[color:var(--state-hover)]")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-lg font-semibold text-ink">No matches for “{q}”</p>
          <p className="mt-1 text-ink-tertiary">
            Try a broader term, or message our care team to point you in the right direction.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.slug} interactive onClick={() => nav(`/treatment/${t.slug}`)} className="p-5">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{t.emoji}</span>
                {t.eligible && <Badge tone="wellness">Available online</Badge>}
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">{t.category}</p>
              <h3 className="mt-1 text-lg font-bold text-ink">{t.name}</h3>
              <p className="mt-1.5 text-sm text-ink-secondary">{t.blurb}</p>
              <p className="mt-4 text-sm text-ink-tertiary">
                {t.from === 0 ? "Covered by most plans" : <>From <span className="font-semibold text-ink tnum">${t.from}</span>/mo</>}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

