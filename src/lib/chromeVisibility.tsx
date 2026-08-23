import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/** Match SiteHeader hide/show easing. */
export const CHROME_STICKY_MOTION = "top 380ms cubic-bezier(0.22, 1, 0.36, 1)";

/** Below announcement + header when chrome is visible (was top-28). */
export const STICKY_TOP_VISIBLE = "7rem";
/** Compact gap from viewport when header slides away — matches page pt-8 rhythm. */
export const STICKY_TOP_HIDDEN = "2rem";

const ChromeVisibilityContext = createContext<boolean | null>(null);

export { ChromeVisibilityContext };

export function stickyChromeStyle(hidden: boolean): CSSProperties {
  return {
    top: hidden ? STICKY_TOP_HIDDEN : STICKY_TOP_VISIBLE,
    transition: CHROME_STICKY_MOTION,
  };
}

/**
 * Hide top chrome while scrolling down; bring it back on scroll up,
 * near the top of the page, or once scrolling goes idle.
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (Math.abs(delta) > minDelta) {
        if (y < threshold) setHidden(false);
        else if (delta > 0) setHidden(true);
        else setHidden(false);
        lastY.current = y;
      }

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

/** One scroll listener for AppShell — header + sticky columns share this. */
export function ChromeVisibilityProvider({ children }: { children: ReactNode }) {
  const hidden = useChromeVisibility();
  return (
    <ChromeVisibilityContext.Provider value={hidden}>{children}</ChromeVisibilityContext.Provider>
  );
}

/** Prefer shared AppShell state; fall back to a local listener (marketing chrome). */
export function useChromeHidden(): boolean {
  const shared = useContext(ChromeVisibilityContext);
  const local = useChromeVisibility();
  return shared !== null ? shared : local;
}
