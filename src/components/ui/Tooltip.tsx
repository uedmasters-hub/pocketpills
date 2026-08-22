import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Short helper copy on hover/focus. Portaled so overflow-hidden cards don’t clip it. */
export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const above = r.top > 72;
      setPos({
        top: above ? r.top - 6 : r.bottom + 6,
        left: r.left + r.width / 2,
        above,
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

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <span
              role="tooltip"
              id={id}
              style={{ top: pos.top, left: pos.left }}
              className={
                "pointer-events-none fixed z-[90] w-max max-w-[16rem] -translate-x-1/2 rounded-lg bg-[color:var(--pp-primary-950)] px-2.5 py-1.5 text-center text-2xs font-medium leading-snug text-white shadow-[0_8px_20px_rgba(24,7,48,0.2)] " +
                (pos.above ? "-translate-y-full" : "")
              }
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
