import { useEffect, useState, type InputHTMLAttributes } from "react";
import { dobDisplayToIso, dobMaskSegments, formatDobDisplay, isoToDobDisplay } from "@/lib/dob";

type Props = {
  label: string;
  /** Canonical value: ISO `YYYY-MM-DD` (or empty). */
  value: string;
  onChange: (iso: string) => void;
  error?: string;
  hint?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "id" | "className">;

/**
 * DOB input with persistent segment mask: typed digits replace `DD` / `MM` / `YYYY`
 * one segment at a time; unfilled placeholders stay visible.
 * Emits ISO `YYYY-MM-DD` when complete.
 */
export function DateOfBirthField({
  label,
  value,
  onChange,
  error,
  hint,
  id,
  className = "",
  inputClassName = "",
  ...props
}: Props) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const [display, setDisplay] = useState(() => (value ? isoToDobDisplay(value) : ""));

  useEffect(() => {
    const next = value ? isoToDobDisplay(value) : "";
    setDisplay((prev) => {
      const prevIso = dobDisplayToIso(prev);
      if (!value && prev.replace(/\D/g, "").length > 0 && prevIso === "") return prev;
      if (value && prevIso === value) return prev;
      return next;
    });
  }, [value]);

  const hintId = hint && !error ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const mask = dobMaskSegments(display);

  return (
    <label htmlFor={fieldId} className={"block " + className}>
      <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{label}</span>
      <span
        className={
          "relative box-border block h-11 w-full overflow-visible rounded-xl border border-line bg-white " +
          "focus-within:border-primary " +
          (error ? "border-danger " : "")
        }
      >
        {/* Persistent mask — unfilled DD/MM/YYYY stay visible */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center px-3.5 text-base tnum"
        >
          <span className="whitespace-pre">
            {mask.map((p, i) => (
              <span
                key={i}
                className={p.filled ? "text-[color:var(--pp-primary-950)]" : "text-ink-tertiary"}
              >
                {p.ch}
              </span>
            ))}
          </span>
        </span>
        <input
          {...props}
          id={fieldId}
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-label={label}
          value={display}
          onChange={(e) => {
            const next = formatDobDisplay(e.target.value);
            setDisplay(next);
            const digits = next.replace(/\D/g, "");
            if (digits.length === 8) onChange(dobDisplayToIso(next));
            else onChange("");
          }}
          onBlur={() => {
            const digits = display.replace(/\D/g, "");
            if (digits.length === 8) onChange(dobDisplayToIso(display));
            else if (digits.length === 0) onChange("");
          }}
          className={
            "relative h-full w-full rounded-xl bg-transparent px-3.5 text-base tnum text-transparent caret-[color:var(--pp-primary-950)] outline-none " +
            inputClassName
          }
        />
      </span>
      {hint && !error ? (
        <span id={hintId} className="mt-1 block text-sm text-ink-tertiary">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="mt-1 block text-sm text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
