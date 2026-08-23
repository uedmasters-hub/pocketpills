import { useContext, type ReactNode } from "react";
import { ChromeVisibilityContext, stickyChromeStyle } from "@/lib/chromeVisibility";

/**
 * Sticky column slot that tracks header visibility: stays pinned with the same
 * visual top gap whether chrome is shown or hidden.
 */
export function StickyChrome({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const hidden = useContext(ChromeVisibilityContext) ?? false;
  return (
    <div
      className={`sticky z-10 self-start ${className}`.trim()}
      style={stickyChromeStyle(hidden)}
    >
      {children}
    </div>
  );
}

/** Static fallback when chrome sync is unavailable. */
export function StickyChromeStatic({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`sticky top-28 z-10 self-start ${className}`.trim()}>
      {children}
    </div>
  );
}
