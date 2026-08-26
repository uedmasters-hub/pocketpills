import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MedicationListPopover } from "@/pages/drug/MedicationListPopover";
import { PageSearchField } from "@/components/PageSearchField";
import { NEPAL_TRUST_STATS, TrustStrip } from "@/components/pharmacy/TrustStrip";
import { drugs, therapeuticClasses } from "@/lib/data";
import { searchDrugs } from "@/lib/drugSearch";
import { useI18n } from "@/lib/i18n";
import { listMedBasket, OPEN_LIST_EVENT, subscribeMedBasket } from "@/lib/medBasketDraft";

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

export function MedicationsIndexDraft() {
  const { tx } = useI18n();
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("All");
  const listRef = useRef<HTMLDivElement>(null);
  const [basketTick, setBasketTick] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  useEffect(() => subscribeMedBasket(() => setBasketTick((n) => n + 1)), []);
  useEffect(() => {
    const on = () => setListOpen(true);
    window.addEventListener(OPEN_LIST_EVENT, on);
    return () => window.removeEventListener(OPEN_LIST_EVENT, on);
  }, []);
  const basketCount = useMemo(() => listMedBasket().length, [basketTick]);

  const filtered = useMemo(
    () =>
      searchDrugs(q)
        .filter((d) => cls === "All" || d.cls === cls)
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
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Online pharmacy")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          {tx("Shop medications")}
        </h1>
        {basketCount > 0 ? (
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--pp-primary-950)]"
          >
            {basketCount} {basketCount === 1 ? tx("medicine") : tx("medicines")} · {tx("Review list")}
          </button>
        ) : null}
      </header>

      <TrustStrip className="mb-8" stats={NEPAL_TRUST_STATS} />

      <PageSearchField
        scope="medications"
        value={q}
        onChange={setQ}
        className="mb-1"
      />

      <div
        className="pp-scroll -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1"
        role="group"
        aria-label={tx("Filter by class")}
      >
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
            {c === "All" ? tx("All") : tx(SHORT[c] ?? c)}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <p className="text-sm text-ink-tertiary tnum">
          {filtered.length} {filtered.length === 1 ? tx("medication") : tx("medications")}
        </p>
        <div className="flex flex-wrap gap-0.5" aria-label={tx("Jump to letter")}>
          {groups.map(([L]) => (
            <button
              key={L}
              type="button"
              onClick={() => jump(L)}
              aria-label={`${tx("Jump to medications starting with")} ${L}`}
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
            <p className="font-semibold text-[color:var(--pp-primary-950)]">
              {tx("No matches for")} “{q}”
            </p>
            <p className="mt-1 text-sm text-ink-tertiary">{tx("Try a brand or generic name.")}</p>
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
                        to={`/drug/draft/${d.slug}`}
                        className="group flex h-full flex-col rounded-2xl border border-line bg-white p-4 transition-colors hover:bg-[color:var(--state-hover)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-[color:var(--pp-primary-950)]">
                              {d.name}
                            </span>
                            {d.generic && d.generic !== d.name && (
                              <span className="mt-0.5 block truncate text-sm text-ink-tertiary">
                                {d.generic}
                              </span>
                            )}
                          </span>
                          {!d.rx ? (
                            <span className="shrink-0 rounded-full bg-[color:var(--pp-primary-100)] px-2 py-0.5 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                              {tx("OTC")}
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-2xs font-medium text-ink-tertiary">
                              {tx("Rx")}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 flex-1 text-2xs text-ink-tertiary">
                          {d.forms.map((f) => tx(f)).join(" · ")}
                          {d.coverage > 0 ? ` · ${d.coverage}% ${tx("typical coverage")}` : ""}
                        </p>

                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
                          <span>
                            <span className="block text-2xs text-ink-tertiary">{tx("From")}</span>
                            <span className="font-display text-xl font-medium text-[color:var(--pp-primary-950)] tnum">
                              ${pay.toFixed(2)}
                            </span>
                          </span>
                          <span className="text-sm font-medium text-[color:var(--pp-violet)] transition-transform group-hover:translate-x-0.5">
                            {tx("View →")}
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

      <MedicationListPopover open={listOpen} onClose={() => setListOpen(false)} />
    </div>
  );
}
