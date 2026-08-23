import { useRef, useState } from "react";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-primary";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

/** Split a draft on commas into trimmed unique tokens. */
export function splitTagDraft(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const v = part.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** Parse draft tokens currently sitting in the comma-separated input. */
export function draftTokens(raw: string): string[] {
  return splitTagDraft(raw);
}

type Props = {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  suggestions?: readonly string[];
  addLabel?: string;
  suggestionsLabel?: string;
  removeLabel?: string;
};

/**
 * Tag field with focus suggestion chips.
 * Chips append into a comma-separated draft; Add / Enter commits each token as its own tag.
 */
export function TagSuggestField({
  label,
  items,
  onChange,
  placeholder,
  suggestions = [],
  addLabel = "Add",
  suggestionsLabel = "Suggestions",
  removeLabel = "Remove",
}: Props) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputId = `tags-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const draftIn = new Set(draftTokens(draft).map((x) => x.toLowerCase()));
  const taken = new Set([
    ...items.map((x) => x.toLowerCase()),
    ...draftIn,
  ]);
  const chips = suggestions.filter((s) => !items.some((x) => x.toLowerCase() === s.toLowerCase())).slice(0, 7);
  const showChips = focused && chips.length > 0;

  const commit = () => {
    const parts = splitTagDraft(draft);
    if (!parts.length) {
      setDraft("");
      return;
    }
    const existing = new Set(items.map((x) => x.toLowerCase()));
    const next = [...items];
    for (const p of parts) {
      if (existing.has(p.toLowerCase())) continue;
      existing.add(p.toLowerCase());
      next.push(p);
    }
    onChange(next);
    setDraft("");
  };

  const pickSuggestion = (s: string) => {
    const current = draftTokens(draft);
    const key = s.toLowerCase();
    const next = current.some((x) => x.toLowerCase() === key)
      ? current.filter((x) => x.toLowerCase() !== key)
      : [...current, s];
    setDraft(next.join(", "));
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setFocused(true);
    document.getElementById(inputId)?.focus();
  };

  return (
    <div>
      <label htmlFor={inputId} className={LABEL}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          className={FIELD}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setFocused(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setFocused(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <button
          type="button"
          onClick={commit}
          className="shrink-0 rounded-xl border border-line px-4 text-sm font-medium text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
        >
          {addLabel}
        </button>
      </div>
      {showChips ? (
        <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label={suggestionsLabel}>
          {chips.map((s) => {
            const inDraft = draftIn.has(s.toLowerCase());
            return (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickSuggestion(s)}
                aria-pressed={inDraft}
                className={
                  "inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors " +
                  (inDraft
                    ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)] font-medium text-[color:var(--pp-primary-950)]"
                    : "border-line bg-white text-ink-secondary hover:border-[color:var(--pp-violet)] hover:bg-[color:var(--pp-primary-100)] hover:text-[color:var(--pp-primary-950)]")
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      ) : null}
      {items.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-2" aria-label={label}>
          {items.map((it) => (
            <li
              key={it}
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-sm font-medium text-[color:var(--pp-primary-950)]"
            >
              {it}
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x !== it))}
                aria-label={`${removeLabel} ${it}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
