import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Badge } from "@/components/ui";
import { drugs, therapeuticClasses } from "@/lib/data";

export function MedicationsIndex() {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState<string>("All");

  const filtered = useMemo(
    () =>
      drugs
        .filter((d) => cls === "All" || d.cls === cls)
        .filter(
          (d) =>
            d.name.toLowerCase().includes(q.toLowerCase()) ||
            (d.generic ?? "").toLowerCase().includes(q.toLowerCase()),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [q, cls],
  );

  // group by first letter
  const groups = useMemo(() => {
    const m = new Map<string, typeof drugs>();
    for (const d of filtered) {
      const L = d.name[0].toUpperCase();
      if (!m.has(L)) m.set(L, []);
      m.get(L)!.push(d);
    }
    return [...m.entries()];
  }, [filtered]);

  const activeLetters = new Set(groups.map(([l]) => l));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Medications Index</p>
        <h1 className="mt-1.5 text-3xl font-extrabold text-ink sm:text-4xl">
          Search 5,000+ medications & ailments
        </h1>
        <p className="mt-2 max-w-2xl text-ink-secondary">
          Look up prices, coverage, forms, and information. All prescription medications are reviewed
          by a licensed pharmacist before dispensing.
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a medication (e.g. Ozempic, Metformin)…"
          className="mt-5 h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 text-ink placeholder:text-ink-tertiary focus:border-primary"
          aria-label="Search medications"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filter by therapeutic class */}
        <aside>
          <p className="mb-3 text-sm font-semibold text-ink">Filter by class</p>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {["All", ...therapeuticClasses].map((c) => (
              <button
                key={c}
                onClick={() => setCls(c)}
                className={
                  "rounded-lg px-3 py-1.5 text-left text-sm font-medium transition-colors " +
                  (cls === c ? "bg-primary-subtle text-primary" : "text-ink-secondary hover:bg-surface-2")
                }
              >
                {c}
              </button>
            ))}
          </div>
        </aside>

        <div>
          {/* A–Z quick nav */}
          <div className="mb-5 flex flex-wrap gap-1">
            {alphabet.map((L) => {
              const on = activeLetters.has(L);
              return on ? (
                <a key={L} href={`#letter-${L}`} className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-sm font-semibold text-primary hover:bg-primary-subtle">{L}</a>
              ) : (
                <span key={L} className="grid h-8 w-8 place-items-center rounded-lg text-sm font-semibold text-ink-disabled">{L}</span>
              );
            })}
          </div>

          <p className="mb-4 text-sm text-ink-tertiary tnum">{filtered.length} medications</p>

          {groups.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-lg font-semibold text-ink">No matches for “{q}”</p>
              <p className="mt-1 text-ink-tertiary">Try a brand or generic name.</p>
            </Card>
          ) : (
            <div className="space-y-8">
              {groups.map(([letter, items]) => (
                <section key={letter} id={`letter-${letter}`}>
                  <h2 className="mb-3 font-display text-xl font-extrabold text-primary">{letter}</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((d) => (
                      <Link
                        key={d.slug}
                        to={`/drug/${d.slug}`}
                        className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 transition-colors hover:border-strong"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-subtle text-base">💊</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-ink">{d.name}</span>
                          {d.generic && <span className="block truncate text-xs text-ink-tertiary">{d.generic}</span>}
                        </span>
                        {!d.rx && <Badge tone="neutral">OTC</Badge>}
                        <span className="text-ink-tertiary" aria-hidden>→</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
