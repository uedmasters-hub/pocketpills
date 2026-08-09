import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "wellness" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

/**
 * Button states mirror production `.ds-btn-*`:
 *   primary  → neutral-800, hover neutral-600, disabled neutral-200
 *   secondary→ white / light, hover neutral-300, active→inverted
 *   ghost    → neutral-100, hover neutral-300
 * Focus: 3px primary-500 ring (from global :focus-visible).
 */
const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-full " +
  "transition-all duration-200 ease-in-out select-none " +
  "disabled:cursor-not-allowed disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-cta text-white hover:bg-cta-hover active:bg-cta-pressed " +
    "disabled:bg-[color:var(--color-cta-disabled-bg)] disabled:text-[color:var(--color-cta-disabled-fg)]",
  secondary:
    "bg-surface-2 text-neutral-800 shadow-btn " +
    "hover:bg-neutral-300 hover:shadow-none " +
    "active:bg-neutral-600 active:text-white active:shadow-none " +
    "disabled:bg-neutral-200 disabled:text-[color:var(--gray-500)] disabled:shadow-none",
  ghost:
    "bg-neutral-100 text-neutral-900 " +
    "hover:bg-neutral-300 " +
    "active:bg-neutral-600 active:text-white " +
    "disabled:bg-neutral-200 disabled:text-[color:var(--gray-500)]",
  outline:
    "bg-transparent text-neutral-800 border border-neutral-800 " +
    "hover:bg-neutral-100 active:bg-neutral-800 active:text-white " +
    "disabled:border-neutral-300 disabled:text-[color:var(--gray-500)]",
  wellness:
    "bg-wellness text-white hover:opacity-90 active:opacity-80 " +
    "disabled:opacity-45",
};

const sizes: Record<Size, string> = {
  sm: "px-6 py-3 text-sm",
  md: "px-8 py-4 text-md",
  lg: "px-6 py-2.5 text-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
