import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  PHONE_COUNTRIES,
  composePhone,
  formatPhoneCanonical,
  getPhoneCountry,
  groupPhoneCountriesByRegion,
  nationalLenFor,
  nationalMaskSegments,
  phoneDigits,
  splitPhone,
} from "@/lib/phone";

type Props = {
  label: string;
  /** Stored value, preferably `+977 - 1234567890`. */
  value: string;
  onChange: (formatted: string) => void;
  error?: string;
  hint?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  /** Hide the visible label (still exposed to assistive tech). */
  hideLabel?: boolean;
  /** Default country ISO when value has no recognizable dial code. */
  defaultCountry?: string;
  /** Limit the dropdown to these ISO codes (e.g. `["NP"]` for Nepal-only claims). */
  allowedIsos?: readonly string[];
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "id" | "className">;

/**
 * Phone input: country-code dropdown (default Nepal) + 10-digit national number.
 * Emits `+977 - 1234567890` when complete.
 */
export function PhoneField({
  label,
  value,
  onChange,
  error,
  hint,
  id,
  className = "",
  inputClassName = "",
  hideLabel = false,
  defaultCountry = DEFAULT_PHONE_COUNTRY_ISO,
  allowedIsos,
  ...props
}: Props) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const selectId = `${fieldId}-cc`;

  const countries = useMemo(() => {
    if (!allowedIsos?.length) return PHONE_COUNTRIES;
    const set = new Set(allowedIsos);
    const filtered = PHONE_COUNTRIES.filter((c) => set.has(c.iso));
    return filtered.length ? filtered : PHONE_COUNTRIES;
  }, [allowedIsos]);

  const fallbackIso = countries.some((c) => c.iso === defaultCountry)
    ? defaultCountry
    : countries[0]!.iso;

  const seed = splitPhone(value, fallbackIso);
  const [iso, setIso] = useState(() =>
    countries.some((c) => c.iso === seed.iso) ? seed.iso : fallbackIso,
  );
  const [national, setNational] = useState(seed.national);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    const qDigits = q.replace(/\D/g, "");
    return countries.filter((c) => {
      if (c.iso.toLowerCase().includes(q)) return true;
      if (c.label.toLowerCase().includes(q)) return true;
      if (c.region.toLowerCase().includes(q)) return true;
      if (c.dial.toLowerCase().includes(q)) return true;
      if (qDigits && c.code.includes(qDigits)) return true;
      return false;
    });
  }, [countries, query]);

  const regions = useMemo(
    () => groupPhoneCountriesByRegion(filteredCountries),
    [filteredCountries],
  );

  useEffect(() => {
    if (!value) {
      setNational("");
      setIso(fallbackIso);
      return;
    }
    const next = splitPhone(value, iso);
    setIso((prev) => {
      const prevCountry = getPhoneCountry(prev);
      if (prevCountry.code === next.cc && countries.some((c) => c.iso === prev)) return prev;
      return countries.some((c) => c.iso === next.iso) ? next.iso : fallbackIso;
    });
    setNational(next.national);
  }, [value, fallbackIso, countries]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPos(null);
      return;
    }
    const place = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      setMenuPos({
        top: r.bottom + 6,
        left: r.left,
        width: Math.max(r.width, 260),
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
      if (pickerRef.current?.contains(t)) return;
      if ((e.target as HTMLElement | null)?.closest?.("[data-phone-country-menu]")) return;
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

  const hintId = hint && !error ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const len = nationalLenFor(iso);
  const mask = nationalMaskSegments(national, iso);
  const country = getPhoneCountry(iso);
  const locked = countries.length === 1;

  const emit = (nextIso: string, nextNational: string) => {
    const digits = phoneDigits(nextNational).slice(0, nationalLenFor(nextIso));
    onChange(digits ? composePhone(nextIso, digits) : "");
  };

  const pickCountry = (nextIso: string) => {
    const trimmed = phoneDigits(national).slice(0, nationalLenFor(nextIso));
    setIso(nextIso);
    setNational(trimmed);
    emit(nextIso, trimmed);
    setOpen(false);
  };

  const menu =
    open && menuPos
      ? createPortal(
          <div
            data-phone-country-menu
            role="listbox"
            aria-label="Country codes by region"
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
                placeholder="Search country or code"
                aria-label="Search country or code"
                autoComplete="off"
                className={
                  "h-9 w-full rounded-lg border border-line bg-white px-3 text-sm " +
                  "text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary " +
                  "focus:border-primary"
                }
              />
            </div>
            <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
              {regions.length === 0 ? (
                <p className="px-3 py-3 text-sm text-ink-tertiary">No matches</p>
              ) : (
                regions.map((group) => (
                  <div key={group.region} role="group" aria-label={group.region}>
                    <p className="sticky top-0 z-[1] bg-[color:var(--pp-primary-100)] px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                      {group.region}
                    </p>
                    {group.countries.map((c) => {
                      const selected = c.iso === iso;
                      return (
                        <button
                          key={c.iso}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          title={c.label}
                          onClick={() => pickCountry(c.iso)}
                          className={
                            "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm tnum " +
                            (selected
                              ? "bg-[color:var(--pp-primary-200)] font-medium text-[color:var(--pp-violet)]"
                              : "text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-100)]")
                          }
                        >
                          <span>
                            {c.dial} {c.iso}
                          </span>
                          {selected ? (
                            <span aria-hidden className="text-xs">
                              ✓
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={"block " + className}>
      <span
        className={
          hideLabel
            ? "sr-only"
            : "mb-1.5 block text-sm font-medium text-ink-secondary"
        }
      >
        {label}
      </span>
      <div
        className={
          "box-border flex h-11 w-full items-stretch overflow-visible rounded-xl border border-line bg-white " +
          "focus-within:border-primary " +
          (error ? "border-danger " : "")
        }
      >
        <div ref={pickerRef} className="flex shrink-0 items-stretch border-r border-line">
          {locked ? (
            <span
              className="flex items-center px-3 text-sm tnum text-[color:var(--pp-primary-950)]"
              aria-label="Country code"
            >
              {country.dial} {country.iso}
            </span>
          ) : (
            <button
              ref={triggerRef}
              id={selectId}
              type="button"
              aria-label="Country code"
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={
                "flex min-w-[5.75rem] items-center gap-1.5 px-3 pr-2 text-sm tnum " +
                "text-[color:var(--pp-primary-950)] outline-none hover:bg-[color:var(--pp-primary-100)]/60"
              }
            >
              <span>
                {country.dial} {country.iso}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="opacity-60">
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
          )}
        </div>
        {menu}

        <span className="relative min-w-0 flex-1">
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
            autoComplete="tel-national"
            maxLength={len}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-label={`${label} (${country.dial})`}
            value={national}
            onChange={(e) => {
              const next = phoneDigits(e.target.value).slice(0, len);
              setNational(next);
              emit(iso, next);
            }}
            onBlur={() => {
              const canon = formatPhoneCanonical(composePhone(iso, national), iso);
              if (canon) onChange(canon);
              else if (!phoneDigits(national)) {
                setNational("");
                onChange("");
              }
            }}
            className={
              "relative box-border h-full w-full rounded-r-xl bg-transparent px-3.5 text-base tnum text-transparent " +
              "caret-[color:var(--pp-primary-950)] outline-none " +
              inputClassName
            }
          />
        </span>
      </div>
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
    </div>
  );
}
