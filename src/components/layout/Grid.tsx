import type { ReactNode } from "react";

/**
 * Canonical page grid — body sections and footer share these so edges align.
 *   width  : max-w-[105rem]  (1680px)
 *   gutters: 20 / 32 / 80px  (px-5 md:px-8 xl:px-20)
 *
 * FRAME = gutters outside white islands (landing). CONTAINER = gutters inside
 * max-width (in-app / footer). Use FRAME + SURFACE for landing islands so they
 * match the upper white shell width.
 */
export const FRAME = "px-5 md:px-8 xl:px-20";
export const SURFACE = "mx-auto w-full max-w-[105rem]";
export const CONTAINER = `${SURFACE} ${FRAME}`;

/** Narrower measure for reading/forms inside the same gutters. */
export const CONTAINER_NARROW = "mx-auto w-full max-w-3xl px-5 md:px-8";

/** Consistent lavender gap between landing section islands (single value — not py on each). */
export const SECTION_GAP = "gap-8 md:gap-10";

/** Margin before the first island after the upper white shell / before the footer. */
export const SECTION_GAP_Y = "mt-8 md:mt-10";

/** @deprecated Prefer SECTION_GAP — kept for in-app Section rhythm. */
export const SECTION_Y = "py-12 md:py-16";

/** Gap above the full-bleed white footer — same as section island gap. */
export const FOOTER_GAP = "mt-8 md:mt-10";

/** Shared inner padding for white / colored landing islands. */
export const ISLAND_PAD = "px-6 py-12 sm:px-8 md:px-10 md:py-16";

/** Horizontal padding inside the upper white shell (Welcome → Partners). */
export const SHELL_X = "px-5 sm:px-8 xl:px-14";

/** Vertical block spacing inside the upper white shell. */
export const SHELL_BLOCK = `${SHELL_X} pb-12 md:pb-14`;

/** Landing island corner radius. */
export const ISLAND_RADIUS = "rounded-[28px]";

/** Landing section title — Satoshi medium, production-scale. */
export const SECTION_TITLE =
  "font-display text-3xl font-medium leading-snug tracking-tight text-[color:var(--pp-primary-950)] md:text-[1.813rem]";

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

/** Page heading used by in-app screens (mirrors production: Satoshi medium). */
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
          <p className="pp-caps mb-1.5 text-[color:var(--pp-violet)]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {title}
        </h1>
        {sub && <p className="mt-2 max-w-2xl text-base text-ink-secondary">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
