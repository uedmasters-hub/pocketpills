import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  FEATURED_DELIVERY_DISTRICTS,
  coerceNepalDistrict,
  nepalDistrictOptions,
} from "@/lib/nepalCities";

const FIELD =
  "box-border flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3.5 text-left text-base text-ink outline-none " +
  "hover:border-[color:var(--neutral-400)] focus:border-primary";

type Props = {
  label: string;
  value: string;
  onChange: (district: string) => void;
  id?: string;
  className?: string;
  /** Hide the visible label (still exposed to assistive tech). */
  hideLabel?: boolean;
};

/**
 * Nepal district picker — searchable, height-capped menu (portaled to avoid clipping).
 */
export function DistrictField({
  label,
  value,
  onChange,
  id,
  className = "",
  hideLabel = false,
}: Props) {
  const fieldId = id ?? `district-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const selected = coerceNepalDistrict(value);
  const options = useMemo(() => nepalDistrictOptions(selected), [selected]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((d) => d.toLowerCase().includes(q));
  }, [options, query]);

  const suggestions = useMemo(() => {
    const taken = selected.toLowerCase();
    return FEATURED_DELIVERY_DISTRICTS.filter((d) => d.toLowerCase() !== taken).slice(0, 6);
  }, [selected]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPos(null);
      return;
    }
    const place = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      const width = Math.max(r.width, 240);
      const maxH = 280; // search + list approx
      const spaceBelow = window.innerHeight - r.bottom - 12;
      const spaceAbove = r.top - 12;
      const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
      setMenuPos({
        top: openUp ? Math.max(8, r.top - Math.min(maxH, spaceAbove) - 6) : r.bottom + 6,
        left: Math.min(r.left, window.innerWidth - width - 8),
        width,
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const id = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if ((e.target as HTMLElement | null)?.closest?.("[data-district-menu]")) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (d: string) => {
    onChange(coerceNepalDistrict(d));
    setOpen(false);
  };

  const menu =
    open && menuPos
      ? createPortal(
          <div
            data-district-menu
            role="listbox"
            aria-label={label}
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
            className={
              "fixed z-[80] overflow-hidden rounded-xl border border-line bg-white " +
              "shadow-[0_12px_32px_rgba(24,7,48,0.14)]"
            }
          >
            <div className="border-b border-line p-2">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search district"
                aria-label="Search district"
                autoComplete="off"
                className={
                  "h-9 w-full rounded-lg border border-line bg-white px-3 text-sm " +
                  "text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary " +
                  "focus:border-primary"
                }
              />
            </div>
            <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-sm text-ink-tertiary">No matches</p>
              ) : (
                filtered.map((d) => {
                  const on = d.toLowerCase() === selected.toLowerCase();
                  return (
                    <button
                      key={d}
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => pick(d)}
                      className={
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm " +
                        (on
                          ? "bg-[color:var(--pp-primary-200)] font-medium text-[color:var(--pp-violet)]"
                          : "text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-100)]")
                      }
                    >
                      <span>{d}</span>
                      {on ? (
                        <span aria-hidden className="text-xs">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={"block " + className}>
      <span
        className={
          hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-ink-secondary"
        }
      >
        {label}
      </span>
      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={FIELD + (open ? " border-primary" : "")}
      >
        <span className="min-w-0 truncate">{selected}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0 opacity-60">
          <path
            d="m3 4.5 3 3 3-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {menu}
      {open && suggestions.length > 0 && !query.trim() ? (
        <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Suggested districts">
          {suggestions.map((d) => (
            <button
              key={d}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(d)}
              className={
                "inline-flex h-8 items-center rounded-full border border-line bg-white px-3 text-sm " +
                "text-ink-secondary transition-colors hover:border-[color:var(--pp-violet)] " +
                "hover:bg-[color:var(--pp-primary-100)] hover:text-[color:var(--pp-primary-950)]"
              }
            >
              {d}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
