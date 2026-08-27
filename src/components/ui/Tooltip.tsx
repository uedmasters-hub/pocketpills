import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Glowing status pip at the start of the label. `true` / `"on"` is violet. */
export type TooltipDot = true | "on" | "muted";

const DOT: Record<"on" | "muted", string> = {
  on: "bg-[color:var(--pp-violet)] shadow-[0_0_8px_var(--pp-violet)]",
  muted: "bg-[color:var(--pp-primary-200)]",
};

const RING =
  "relative inline-flex items-center gap-2 bg-white text-left text-xs font-semibold leading-snug text-[color:var(--pp-primary-950)] shadow-[0_16px_40px_rgba(90,70,180,0.38),0_0_0_4px_rgba(255,255,255,0.85)] ring-2 ring-[color:var(--pp-violet)]";

function Caret({ above }: { above: boolean }) {
  return above ? (
    <>
      <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent border-t-[color:var(--pp-violet)]" />
      <span className="absolute left-1/2 top-[calc(100%-1px)] h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-white" />
    </>
  ) : (
    <>
      <span className="absolute left-1/2 bottom-full h-0 w-0 -translate-x-1/2 border-x-[7px] border-b-[8px] border-x-transparent border-b-[color:var(--pp-violet)]" />
      <span className="absolute left-1/2 bottom-[calc(100%-1px)] h-0 w-0 -translate-x-1/2 border-x-[5px] border-b-[6px] border-x-transparent border-b-white" />
    </>
  );
}

/** Visual chrome for the shared tooltip — white pill, violet ring, caret. */
export function TooltipBubble({
  children,
  above = true,
  dot,
  variant = "pill",
  className = "",
}: {
  children: ReactNode;
  above?: boolean;
  dot?: TooltipDot;
  variant?: "pill" | "panel";
  className?: string;
}) {
  const shape =
    variant === "panel"
      ? "max-w-[18rem] items-start rounded-2xl px-3.5 py-2.5"
      : "max-w-[16rem] rounded-full px-3.5 py-2";
  return (
    <span className={[RING, shape, className].filter(Boolean).join(" ")}>
      {dot ? (
        <span
          className={
            (variant === "panel" ? "mt-0.5 " : "") +
            "h-2 w-2 shrink-0 rounded-full " +
            DOT[dot === "muted" ? "muted" : "on"]
          }
        />
      ) : null}
      <span className="min-w-0">{children}</span>
      <Caret above={above} />
    </span>
  );
}

/** Short helper copy on hover/focus. Portaled so overflow-hidden cards don’t clip it. */
export function Tooltip({
  label,
  children,
  className = "",
  dot,
  variant = "pill",
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  dot?: TooltipDot;
  variant?: "pill" | "panel";
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
        top: above ? r.top - 10 : r.bottom + 10,
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
      className={"inline-flex " + className}
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
                "pointer-events-none fixed z-[90] -translate-x-1/2 " +
                (pos.above ? "-translate-y-full" : "")
              }
            >
              <TooltipBubble above={pos.above} dot={dot} variant={variant}>
                {label}
              </TooltipBubble>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
