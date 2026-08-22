import { useI18n } from "@/lib/i18n";

export function joinChoices(xs: string[]): string {
  return xs.map((s) => s.trim()).filter(Boolean).join(" · ");
}

export function parseChoices(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(/\s*·\s*|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function takeKnown(parts: string[], options: readonly string[]): string[] {
  return parts.filter((p) => options.includes(p));
}

export function leftovers(parts: string[], known: readonly string[]): string {
  return parts.filter((p) => !known.includes(p)).join(" · ");
}

export function ChoiceList({
  options,
  selected,
  onChange,
  multiple = false,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
}) {
  const { tx } = useI18n();
  return (
    <ul className="overflow-hidden rounded-xl border border-line" role={multiple ? "group" : "radiogroup"}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <li key={opt} className="border-b border-line last:border-0">
            <button
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={on}
              onClick={() => {
                if (multiple) {
                  onChange(on ? selected.filter((s) => s !== opt) : [...selected, opt]);
                } else {
                  onChange(on ? [] : [opt]);
                }
              }}
              className="flex w-full items-start gap-3 px-3.5 py-3 text-left hover:bg-[color:var(--state-hover)]"
            >
              <span
                className={
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold text-white " +
                  (on
                    ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-violet)]"
                    : "border-line bg-white")
                }
                aria-hidden
              >
                {multiple && on ? "✓" : on ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
              <span className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(opt)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ChipGroup({
  options,
  selected,
  onChange,
  multiple = false,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
}) {
  const { tx } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            aria-pressed={on}
            onClick={() => {
              if (multiple) {
                onChange(on ? selected.filter((s) => s !== opt) : [...selected, opt]);
              } else {
                onChange(on ? [] : [opt]);
              }
            }}
            className={
              "rounded-full border px-3.5 py-2 text-sm font-medium " +
              (on
                ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
                : "border-line bg-white text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]")
            }
          >
            {tx(opt)}
          </button>
        );
      })}
    </div>
  );
}

export function FieldLabel({ children }: { children: string }) {
  const { tx } = useI18n();
  return (
    <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx(children)}</p>
  );
}
