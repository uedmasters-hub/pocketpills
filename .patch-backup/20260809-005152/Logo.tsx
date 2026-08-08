import { Link } from "react-router-dom";

/**
 * The PocketPills mark. Both paths use `currentColor`, so the logo takes the
 * colour of whatever it sits in — set `text-…` on the parent or pass className.
 */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 377 370" fill="none" className={className} role="img" aria-label="PocketPills">
      <path
        fill="currentColor"
        d="M273 0C330.438 5.86282e-06 377 46.5624 377 104V266C377 323.438 330.438 370 273 370H149V296H243C275.033 296 301 270.033 301 238V139C301 106.967 275.033 81 243 81H134C101.967 81 76 106.967 76 139V366.185C32.1628 353.959 0 313.736 0 266V104C0 46.5624 46.5624 0 104 0H273Z"
      />
      <path
        fill="currentColor"
        d="M213 150C221.837 150 229 157.163 229 166V211C229 219.837 221.837 227 213 227H164C155.163 227 148 219.837 148 211V166C148 157.163 155.163 150 164 150H213Z"
      />
    </svg>
  );
}

/**
 * Full lockup: mark + wordmark. Inherits colour the same way.
 *   <Logo />                          → brand purple
 *   <Logo className="text-white" />   → on a dark surface
 */
export function Logo({
  className = "text-[color:var(--pp-primary-950)]",
  markClassName = "h-7 w-7",
  wordClassName = "text-[17px]",
  showWord = true,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  showWord?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      {showWord && (
        <span className={`font-display font-extrabold tracking-tight ${wordClassName}`}>pocketpills</span>
      )}
    </span>
  );
}

/** Logo wrapped in a link — the common case in headers and footers. */
export function LogoLink({
  to = "/",
  className,
  markClassName,
  wordClassName,
  showWord,
}: {
  to?: string;
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  showWord?: boolean;
}) {
  return (
    <Link to={to} aria-label="PocketPills home">
      <Logo className={className} markClassName={markClassName} wordClassName={wordClassName} showWord={showWord} />
    </Link>
  );
}
