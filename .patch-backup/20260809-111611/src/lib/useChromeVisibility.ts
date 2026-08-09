import { useEffect, useRef, useState } from "react";

/**
 * Hide top chrome while scrolling down; bring it back on scroll up,
 * near the top of the page, or once scrolling goes idle.
 *
 * Intent-based (scroll-up) restore is the primary trigger because it's
 * predictable. Idle-restore is the safety net so the header can never
 * stay lost if someone stops mid-page.
 */
export function useChromeVisibility({
  threshold = 90,
  idleMs = 700,
  minDelta = 6,
}: { threshold?: number; idleMs?: number; minDelta?: number } = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const idle = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Never hide chrome for users who prefer reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      // Ignore sub-pixel jitter and rubber-band overscroll.
      if (Math.abs(delta) > minDelta) {
        if (y < threshold) setHidden(false);
        else if (delta > 0) setHidden(true);   // scrolling down  -> hide
        else setHidden(false);                 // scrolling up    -> reveal
        lastY.current = y;
      }

      // Idle restore.
      window.clearTimeout(idle.current);
      idle.current = window.setTimeout(() => setHidden(false), idleMs);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idle.current);
    };
  }, [threshold, idleMs, minDelta]);

  return hidden;
}
