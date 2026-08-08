import { Link } from "react-router-dom";

/**
 * The PocketPills mark. Both paths use `currentColor`, so the logo takes the
 * colour of whatever it sits in — set `text-…` on the parent or pass className.
 */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 377 370" fill="none" className={className} role="img" aria-label="PocketPills">
      {/* One path, evenodd: the tile is currentColor and the "p" (plus its
          counter) is knocked out, so whatever sits behind shows through.
          That lets the mark work on any surface without colour variants. */}
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M87 0H290C338.049 0 377 38.9512 377 87V283C377 331.049 338.049 370 290 370H87C38.9512 370 0 331.049 0 283V87C0 38.9512 38.9512 0 87 0ZM300 138.5C300 106.744 274.256 81 242.5 81H133.5C101.744 81 76 106.744 76 138.5V370H148V295H242.5C274.256 295 300 269.256 300 237.5V138.5ZM229 210.5C229 219.613 221.613 227 212.5 227H163.5C154.387 227 147 219.613 147 210.5V165.5C147 156.387 154.387 149 163.5 149H212.5C221.613 149 229 156.387 229 165.5V210.5Z"
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

