import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { treatments, type Treatment } from "@/lib/data";

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

const CATEGORY_ORDER = [
  "Chronic care",
  "Dermatology",
  "Sexual health",
  "Everyday care",
  "Digestive",
] as const;

function priceLabel(t: Treatment) {
  if (t.from === 0) return "Covered by most plans";
  return (
    <>
      From <span className="font-semibold text-[color:var(--pp-primary-950)] tnum">${t.from}</span>
      <span className="text-ink-tertiary">/mo</span>
    </>
  );
}

function TreatmentCard({ t, onOpen }: { t: Treatment; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        "group flex flex-col overflow-hidden rounded-2xl border border-line bg-white text-left " +
        "transition-colors hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)]"
      }
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-[color:var(--pp-primary-200)]">
        {t.img ? (
          <img
            src={t.img}
            alt=""
            loading="lazy"
            onError={hideOnError}
            className="absolute inset-0 h-full w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full place-items-center text-5xl" aria-hidden>
            {t.emoji}
          </span>
        )}
        {t.eligible && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-2xs font-semibold text-wellness shadow-sm backdrop-blur-sm">
            Available online
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="pp-caps text-[color:var(--pp-violet)]">{t.category}</p>
        <h3 className="mt-1.5 font-display text-xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {t.name}
        </h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-secondary">{t.blurb}</p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
          <p className="text-sm text-ink-secondary">{priceLabel(t)}</p>
          <span className="text-sm font-medium text-[color:var(--pp-violet)] transition-transform group-hover:translate-x-0.5">
            View →
          </span>
        </div>
      </div>
    </button>
  );
}

export function FindCare() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const cats = useMemo(
    () => ["All", ...CATEGORY_ORDER.filter((c) => treatments.some((t) => t.category === c))],
    [],
  );
  const [cat, setCat] = useState("All");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return treatments.filter(
      (t) =>
        (cat === "All" || t.category === cat) &&
        (!needle ||
          t.name.toLowerCase().includes(needle) ||
          t.blurb.toLowerCase().includes(needle) ||
          t.category.toLowerCase().includes(needle)),
    );
  }, [q, cat]);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: filtered.filter((t) => t.category === category),
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <div>
      <header className="mb-6">
        <p className="pp-caps text-[color:var(--pp-violet)]">Find care</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          What would you like help with?
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          Search a symptom or condition, or browse doctor-led treatments. Assessment online — meds
          delivered free across Canada.
        </p>
      </header>

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
          placeholder='Try "heartburn", "birth control", "blood pressure"…'
          aria-label="Search symptoms or treatments"
          className="h-13 w-full rounded-2xl border border-line bg-white py-3.5 pl-11 pr-4 text-base text-ink placeholder:text-ink-tertiary focus:border-primary"
        />
      </div>

      <div className="pp-scroll -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by category">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cat === c}
            onClick={() => setCat(c)}
            className={
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors " +
              (cat === c
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
            }
          >
            {c}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm text-ink-tertiary tnum">
        {filtered.length} treatment{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-line bg-white px-6 py-14 text-center">
          <p className="font-semibold text-[color:var(--pp-primary-950)]">No matches for “{q}”</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-tertiary">
            Try a broader term, or message our care team to point you in the right direction.
          </p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCat("All");
            }}
            className="mt-5 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-10">
          {grouped.map((g) => (
            <section key={g.category} aria-labelledby={`cat-${g.category}`}>
              {cat === "All" && (
                <h2
                  id={`cat-${g.category}`}
                  className="mb-4 text-sm font-semibold text-[color:var(--pp-primary-950)]"
                >
                  {g.category}
                  <span className="ml-2 text-2xs font-medium text-ink-tertiary tnum">{g.items.length}</span>
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {g.items.map((t) => (
                  <TreatmentCard key={t.slug} t={t} onOpen={() => nav(`/treatment/${t.slug}`)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
