import { useEffect, useRef, useState, type ReactNode } from "react";

/** Soft enter when a draft section loads / scrolls into view. */
export function DraftReveal({
  children,
  className = "",
  delay = 0,
  soft = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  soft?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setOn(true);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    );
    io.observe(el);
    const fallback = window.setTimeout(show, 2400);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={[
        "pp-reveal",
        soft ? "pp-reveal-soft" : "",
        on ? "pp-reveal-in" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
