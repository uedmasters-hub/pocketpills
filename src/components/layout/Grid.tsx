import type { ReactNode } from "react";

/**
 * Canonical page grid, derived from the landing page reference.
 *   width  : max-w-[105rem]  (1680px)
 *   gutters: 20 / 32 / 80px  (px-5 md:px-8 xl:px-20)
 * Every page and section should use these rather than hand-rolled containers.
 */
export const CONTAINER = "mx-auto w-full max-w-[105rem] px-5 md:px-8 xl:px-20";

/** Narrower measure for reading/forms inside the same gutters. */
export const CONTAINER_NARROW = "mx-auto w-full max-w-3xl px-5 md:px-8";

export function Container({
  children,
  narrow,
  className = "",
}: {
  children: ReactNode;
  narrow?: boolean;
  className?: string;
}) {
  return <div className={`${narrow ? CONTAINER_NARROW : CONTAINER} ${className}`}>{children}</div>;
}

/** Vertical rhythm scale — keeps section spacing consistent across the app. */
const RHYTHM = {
  none: "",
  sm: "py-8",
  md: "py-12 md:py-14",
  lg: "py-14 md:py-20",
} as const;

export function Section({
  children,
  space = "md",
  narrow,
  className = "",
  id,
}: {
  children: ReactNode;
  space?: keyof typeof RHYTHM;
  narrow?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`${narrow ? CONTAINER_NARROW : CONTAINER} ${RHYTHM[space]} ${className}`}>
      {children}
    </section>
  );
}

/** Page heading used by in-app screens (mirrors the landing type scale). */
export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--pp-violet)]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[color:var(--pp-primary-950)]">
          {title}
        </h1>
        {sub && <p className="mt-2 max-w-2xl text-ink-secondary">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

