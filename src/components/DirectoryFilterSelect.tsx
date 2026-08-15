import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useDismiss } from "@/lib/useDismiss";

/**
 * Shared City / District filter. Custom list so the open sheet stays inside
 * the page column (native <select> menus ignore layout and overflow the viewport).
 */
export function DirectoryFilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const root = rootRef.current;
    if (!menu || !root) return;

    const pill = root.getBoundingClientRect();
    const column = document.querySelector("[data-page-column]")?.getBoundingClientRect();
    const leftLimit = column?.left ?? 20;
    const maxW = Math.max(pill.width, pill.right - leftLimit);
    menu.style.maxWidth = `${Math.floor(maxW)}px`;
  }, [open, rootRef]);

  return (
    <div ref={rootRef} className="relative inline-flex items-center gap-2.5 text-sm">
      <span className="shrink-0 text-ink-tertiary">{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={
          "relative box-border inline-flex h-10 w-[12.5rem] shrink-0 items-center " +
          "rounded-full border border-line bg-white py-0 pl-4 pr-10 text-left text-sm font-medium " +
          "leading-none text-[color:var(--pp-primary-950)] shadow-[0_1px_2px_rgba(24,7,48,0.06)]"
        }
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <span className="pointer-events-none absolute inset-y-0 right-3 grid w-4 place-items-center text-[color:var(--pp-primary-950)]">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label={label}
          className={
            "absolute right-0 top-[calc(100%+0.5rem)] z-40 max-h-72 min-w-[12.5rem] overflow-y-auto " +
            "rounded-2xl border border-line bg-white py-1.5 shadow-[0_12px_32px_rgba(24,7,48,0.12)]"
          }
        >
          {options.map((name) => {
            const on = name === value;
            return (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => {
                  onChange(name);
                  close();
                }}
                className={
                  "flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm " +
                  (on
                    ? "bg-[color:var(--pp-primary-950)] font-medium text-white"
                    : "text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]")
                }
              >
                <span className="grid w-4 shrink-0 place-items-center" aria-hidden>
                  {on ? (
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 text-pretty">{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
