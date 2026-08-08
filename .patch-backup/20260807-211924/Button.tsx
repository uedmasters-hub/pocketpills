import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "wellness";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 " +
  "disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.985] select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-[color:var(--color-primary-fg)] hover:bg-primary-hover active:bg-primary-pressed shadow-sm",
  secondary:
    "bg-surface-2 text-ink border border-line hover:border-strong hover:bg-surface-1",
  ghost: "text-primary hover:bg-primary-subtle",
  wellness: "bg-wellness text-white hover:brightness-95 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-6 text-base py-3.5",
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
