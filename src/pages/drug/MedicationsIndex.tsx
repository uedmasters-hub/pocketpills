import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TrustStrip } from "@/components/pharmacy/TrustStrip";
import { drugs, therapeuticClasses } from "@/lib/data";

/** Compact class label — the full ATC names are too long for chips. */
const SHORT: Record<string, string> = {
  "Alimentary tract & metabolism": "Metabolism",
  "Blood & blood-forming organs": "Blood",
  "Cardiovascular system": "Cardiovascular",
  Dermatologicals: "Skin",
  "Genito-urinary & sex hormones": "Sexual health",
  "Systemic hormonal preparations": "Hormones",
  "Antiinfectives for systemic use": "Infections",
  "Antineoplastic & immunomodulating": "Immunology",
  "Musculo-skeletal system": "Musculoskeletal",
  "Nervous system": "Nervous system",
  "Antiparasitic products": "Antiparasitic",
  "Respiratory system": "Respiratory",
  "Sensory organs": "Sensory",
  Various: "Other",
};

function estimatePay(price: number, coverage: number) {
  return Math.round(price * (1 - coverage / 100) * 100) / 100;
}

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
      <header className="mb-6">
        <p className="pp-caps text-[color:var(--pp-violet)]">Online pharmacy</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          Shop medications
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          Compare prices, coverage, and forms across 5,000+ medications. Every Rx is reviewed by a
          licensed Canadian pharmacist before it ships — free delivery included.
        </p>
      </header>

      <TrustStrip className="mb-8" />

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search brand or generic name…"
          aria-label="Search medications"
          className="h-13 w-full rounded-2xl border border-line bg-white py-3.5 pl-11 pr-4 text-base text-ink placeholder:text-ink-tertiary focus:border-primary"
        />
      </div>

      <div className="pp-scroll -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by class">
        {["All", ...activeClasses].map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cls === c}
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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <p className="text-sm text-ink-tertiary tnum">
          {filtered.length} medication{filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex flex-wrap gap-0.5" aria-label="Jump to letter">
          {groups.map(([L]) => (
            <button
              key={L}
              type="button"
              onClick={() => jump(L)}
              aria-label={`Jump to medications starting with ${L}`}
              className="h-7 w-7 rounded-lg text-sm font-semibold text-[color:var(--pp-violet)] hover:bg-[color:var(--state-hover)]"
            >
              {L}
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="mt-8">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-12 text-center">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">No matches for “{q}”</p>
            <p className="mt-1 text-sm text-ink-tertiary">Try a brand or generic name.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map(([letter, items]) => (
              <section key={letter} id={`letter-${letter}`} className="scroll-mt-28">
                <h2 className="mb-3 font-display text-base font-medium text-[color:var(--pp-violet)]">
                  {letter}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((d) => {
                    const pay = estimatePay(d.price, d.coverage);
                    return (
                      <Link
                        key={d.slug}
                        to={`/drug/${d.slug}`}
                        className="group flex flex-col rounded-2xl border border-line bg-white p-4 transition-colors hover:bg-[color:var(--state-hover)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-semibold text-[color:var(--pp-primary-950)]">
                                {d.name}
                              </span>
                              {!d.rx ? (
                                <span className="shrink-0 rounded-full bg-[color:var(--pp-primary-100)] px-2 py-0.5 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                                  OTC
                                </span>
                              ) : (
                                <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-2xs font-medium text-ink-tertiary">
                                  Rx
                                </span>
                              )}
                            </span>
                            {d.generic && d.generic !== d.name && (
                              <span className="mt-0.5 block truncate text-sm text-ink-tertiary">
                                {d.generic}
                              </span>
                            )}
                          </span>
                        </div>

                        <p className="mt-2 text-2xs text-ink-tertiary">
                          {d.forms.join(" · ")}
                          {d.coverage > 0 ? ` · ${d.coverage}% typical coverage` : ""}
                        </p>

                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
                          <span>
                            <span className="block text-2xs text-ink-tertiary">From</span>
                            <span className="font-display text-xl font-medium text-[color:var(--pp-primary-950)] tnum">
                              ${pay.toFixed(2)}
                            </span>
                          </span>
                          <span className="text-sm font-medium text-[color:var(--pp-violet)] transition-transform group-hover:translate-x-0.5">
                            View →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
