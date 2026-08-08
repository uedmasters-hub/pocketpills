import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { drugs, therapeuticClasses } from "@/lib/data";

/** Compact class label — the full ATC names are too long for chips. */
const SHORT: Record<string, string> = {
  "Alimentary tract & metabolism": "Metabolism",
  "Blood & blood-forming organs": "Blood",
  "Cardiovascular system": "Cardiovascular",
  "Dermatologicals": "Skin",
  "Genito-urinary & sex hormones": "Sexual health",
  "Systemic hormonal preparations": "Hormones",
  "Antiinfectives for systemic use": "Infections",
  "Antineoplastic & immunomodulating": "Immunology",
  "Musculo-skeletal system": "Musculoskeletal",
  "Nervous system": "Nervous system",
  "Antiparasitic products": "Antiparasitic",
  "Respiratory system": "Respiratory",
  "Sensory organs": "Sensory",
  "Various": "Other",
};

export function MedicationsIndex() {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("All");
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      drugs
        .filter((d) => cls === "All" || d.cls === cls)
        .filter((d) => {
          const t = q.trim().toLowerCase();
          return !t || d.name.toLowerCase().includes(t) || (d.generic ?? "").toLowerCase().includes(t);
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [q, cls],
  );

  const groups = useMemo(() => {
    const m = new Map<string, typeof drugs>();
    for (const d of filtered) {
      const L = d.name[0].toUpperCase();
      if (!m.has(L)) m.set(L, []);
      m.get(L)!.push(d);
    }
    return [...m.entries()];
  }, [filtered]);

  /* Only classes that actually have results — dead filters are noise. */
  const activeClasses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of drugs) counts.set(d.cls, (counts.get(d.cls) ?? 0) + 1);
    return therapeuticClasses.filter((c) => counts.has(c));
  }, []);

  const jump = (letter: string) => {
    document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <header className="mb-8">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--pp-violet)]">
          Medications Index
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[color:var(--pp-primary-950)]">
          Search 5,000+ medications
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          Look up prices, coverage, and forms. Prescription medications are reviewed by a licensed
          pharmacist before dispensing.
        </p>
      </header>

      {/* search */}
      <div className="relative">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a medication…"
          aria-label="Search medications"
          className="h-13 w-full rounded-2xl border border-line bg-surface-2 py-3.5 pl-11 pr-4 text-base text-ink placeholder:text-ink-tertiary focus:border-primary"
        />
      </div>

      {/* class filter — horizontal, since the sidebar already owns the left edge */}
      <div className="pp-scroll -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {["All", ...activeClasses].map((c) => (
          <button
            key={c}
            onClick={() => setCls(c)}
            className={
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors " +
              (cls === c
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
            }
          >
            {c === "All" ? "All" : SHORT[c] ?? c}
          </button>
        ))}
      </div>

      {/* count + A–Z jump (only letters that exist) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <p className="text-sm text-ink-tertiary tnum">
          {filtered.length} medication{filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex flex-wrap gap-0.5">
          {groups.map(([L]) => (
            <button key={L} onClick={() => jump(L)}
              className="h-7 w-7 rounded-lg text-sm font-semibold text-[color:var(--pp-violet)] hover:bg-[color:var(--pp-primary-100)]">
              {L}
            </button>
          ))}
        </div>
      </div>

      {/* results */}
      <div ref={listRef} className="mt-8">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface-2 p-12 text-center">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">No matches for “{q}”</p>
            <p className="mt-1 text-sm text-ink-tertiary">Try a brand or generic name.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map(([letter, items]) => (
              <section key={letter} id={`letter-${letter}`} className="scroll-mt-28">
                <h2 className="mb-3 font-display text-base font-bold text-[color:var(--pp-violet)]">{letter}</h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((d) => (
                    <Link
                      key={d.slug}
                      to={`/drug/${d.slug}`}
                      className="group flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-4 transition-colors hover:bg-[color:var(--pp-primary-100)]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-semibold text-[color:var(--pp-primary-950)]">{d.name}</span>
                          {!d.rx && (
                            <span className="shrink-0 rounded-full bg-[color:var(--pp-primary-100)] px-2 py-0.5 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                              OTC
                            </span>
                          )}
                        </span>
                        {d.generic && d.generic !== d.name && (
                          <span className="mt-0.5 block truncate text-sm text-ink-tertiary">{d.generic}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-ink-tertiary" aria-hidden>→</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

