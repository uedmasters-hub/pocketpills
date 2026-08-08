import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/* ── Card ───────────────────────────────────────────────── */
export function Card({
  className = "",
  interactive,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={
        "bg-surface-2 border border-line rounded-2xl " +
        (interactive
          ? "cursor-pointer transition-colors duration-150 hover:bg-[color:var(--pp-primary-100)] "
          : "") +
        className
      }
      {...props}
    />
  );
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── Field (labeled input) ──────────────────────────────── */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}
export function Field({ label, hint, id, className = "", ...props }: FieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={fieldId} className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{label}</span>
      <input
        id={fieldId}
        className={
          "w-full h-11 rounded-xl border border-line bg-surface-2 px-3.5 text-ink " +
          "placeholder:text-ink-tertiary transition-colors focus:border-primary " +
          className
        }
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-ink-tertiary">{hint}</span>}
    </label>
  );
}

/* ── Progress bar ───────────────────────────────────────── */
export function Progress({ value, tone = "primary" }: { value: number; tone?: "primary" | "wellness" }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-1 border border-line"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
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
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--pp-violet)]">{eyebrow}</p>
      )}
      <h2 className="font-display text-[clamp(20px,2.2vw,28px)] font-extrabold tracking-tight text-[color:var(--pp-primary-950)]">{title}</h2>
      {sub && <p className="mt-1.5 max-w-2xl text-ink-secondary">{sub}</p>}
    </div>
  );
}
