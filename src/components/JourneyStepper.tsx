import { CARE_STEPS, type CareStepKey } from "@/lib/journey";

/*
  Signature element. Answers the IA's three questions on every flagship screen:
  Where am I · what's done · what's next. Threads the whole care journey into
  one connected experience (docs/03_UX/Information Architecture.md).
*/
export function JourneyStepper({ current }: { current: CareStepKey }) {
  const idx = CARE_STEPS.findIndex((s) => s.key === current);
  const pct = (idx / (CARE_STEPS.length - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Your care journey
        </p>
        <p className="text-xs font-medium text-ink-tertiary tnum">
          Step {idx + 1} of {CARE_STEPS.length}
        </p>
      </div>

      <div className="relative">
        {/* track */}
        <div className="absolute left-0 right-0 top-[11px] h-0.5 bg-line" aria-hidden />
        <div
          className="absolute left-0 top-[11px] h-0.5 bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
        <ol className="relative flex justify-between">
          {CARE_STEPS.map((s, i) => {
            const done = i < idx;
            const active = i === idx;
            return (
              <li key={s.key} className="flex flex-col items-center gap-2" style={{ flex: "0 0 auto" }}>
                <span
                  className={
                    "grid h-6 w-6 place-items-center rounded-full border-2 text-2xs font-bold transition-colors " +
                    (done
                      ? "border-primary bg-primary text-[color:var(--color-primary-fg)]"
                      : active
                        ? "border-primary bg-surface-2 text-primary"
                        : "border-line bg-surface-2 text-ink-tertiary")
                  }
                  aria-current={active ? "step" : undefined}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={
                    "hidden text-2xs font-medium sm:block " +
                    (active ? "text-ink" : "text-ink-tertiary")
                  }
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

