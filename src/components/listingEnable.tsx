import type { ReactNode } from "react";

/** Inputs that sit inside public listing chrome when a provider is enabling a block. */
export const ENABLE_FIELD =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-[color:var(--pp-primary-950)] placeholder:text-ink-tertiary outline-none focus:border-[color:var(--pp-primary-950)]";

export const ENABLE_AREA =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-[color:var(--pp-primary-950)] placeholder:text-ink-tertiary outline-none focus:border-[color:var(--pp-primary-950)]";

export const ENABLE_SELECT =
  "h-10 w-full appearance-none rounded-xl border border-line bg-white px-3 pr-8 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";

export function EnableAddButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full rounded-xl border border-dashed border-[color:var(--pp-primary-300)] bg-white px-4 py-3 text-sm font-medium text-[color:var(--pp-primary-950)] " +
        className
      }
    >
      {children}
    </button>
  );
}

export function EnableLine({
  value,
  onChange,
  placeholder,
  className = "",
  multiline = false,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const shared =
    "w-full bg-transparent outline-none placeholder:text-ink-tertiary " + className;
  if (multiline) {
    return (
      <textarea
        className={shared + " resize-y"}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  }
  return (
    <input
      className={shared}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
