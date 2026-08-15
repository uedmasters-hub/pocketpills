import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export {
  AccessGateSkeleton,
  ClaimLookupSkeleton,
  DetailPageSkeleton,
  DirectoryCardSkeleton,
  DirectoryGridSkeleton,
  DirectoryHeroSkeleton,
  FormSectionSkeleton,
  RatingChipSkeleton,
  RegionGridSkeleton,
  RegistrySearchSkeleton,
  ResultCountSkeleton,
  ReviewsPanelSkeleton,
  Skeleton,
  SkeletonCircle,
  SkeletonImage,
  SkeletonText,
  useEnterSkeleton,
} from "./Skeleton";

/* ── Card ───────────────────────────────────────────────── */
type CardProps = HTMLAttributes<HTMLElement> & {
  interactive?: boolean;
};

export function Card({ className = "", interactive, ...props }: CardProps) {
  const cls =
    "rounded-2xl border border-line bg-surface-2 " +
    (interactive
      ? "w-full cursor-pointer text-left transition-colors duration-200 hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)] "
      : "") +
    className;

  if (interactive) {
    const { onClick, ...rest } = props as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button type="button" className={cls} onClick={onClick} {...rest} />
    );
  }

  return <div className={cls} {...(props as HTMLAttributes<HTMLDivElement>)} />;
}

/* ── Badge / status pill ────────────────────────────────── */
type Tone = "primary" | "wellness" | "accent" | "success" | "warning" | "danger" | "info" | "neutral";
const toneMap: Record<Tone, string> = {
  primary: "bg-primary-subtle text-primary",
  wellness: "bg-wellness-subtle text-wellness",
  accent: "bg-accent-subtle text-accent",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger-subtle text-danger",
  info: "bg-info-subtle text-info",
  neutral: "bg-surface-1 text-ink-secondary border border-line",
};
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── Field (labeled input) ──────────────────────────────── */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}
export function Field({ label, hint, error, id, className = "", ...props }: FieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label htmlFor={fieldId} className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{label}</span>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={
          "w-full h-12 rounded-xl border border-line bg-surface-2 px-4 text-base text-ink " +
          "placeholder:text-ink-tertiary transition-colors duration-200 " +
          "hover:bg-[color:var(--state-hover)] focus:border-[color:var(--primary-600)] " +
          className
        }
        {...props}
      />
      {hint && !error && (
        <span id={hintId} className="mt-1 block text-sm text-ink-tertiary">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="mt-1 block text-sm text-danger" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

/* ── Switch (accessible toggle) ─────────────────────────── */
export function Switch({
  checked,
  onChange,
  label,
  desc,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
  id?: string;
}) {
  const switchId = id ?? `switch-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-0">
        <label htmlFor={switchId} className="cursor-pointer font-semibold text-ink">
          {label}
        </label>
        {desc && <span className="mt-0.5 block text-sm text-ink-tertiary">{desc}</span>}
      </span>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "relative h-7 w-12 shrink-0 rounded-full transition-colors " +
          (checked ? "bg-primary" : "bg-stone-300 dark:bg-stone-600")
        }
      >
        <span
          className={
            "pointer-events-none absolute top-1 h-5 w-5 rounded-full bg-white transition-all " +
            (checked ? "left-6" : "left-1")
          }
          aria-hidden
        />
      </button>
    </div>
  );
}

/* ── Progress bar ───────────────────────────────────────── */
export function Progress({
  value,
  tone = "primary",
  label,
}: {
  value: number;
  tone?: "primary" | "wellness";
  /** Accessible name, e.g. "Step 2 of 5" */
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full border border-line bg-surface-1"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${tone === "wellness" ? "bg-wellness" : "bg-primary"}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* ── Section heading (eyebrow + title) ──────────────────── */
export function SectionHead({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <p className="pp-caps mb-1.5 text-[color:var(--pp-violet)]">{eyebrow}</p>
      )}
      <h2 className="font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">{title}</h2>
      {sub && <p className="mt-1.5 max-w-2xl text-base text-ink-secondary">{sub}</p>}
    </div>
  );
}

/** Stroke chevron used for dropdowns, accordions, and nav groups. */
export function Caret({
  open = false,
  size = 16,
  className = "",
}: {
  open?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={
        "shrink-0 transition-transform duration-200 " + (open ? "rotate-180 " : "") + className
      }
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
