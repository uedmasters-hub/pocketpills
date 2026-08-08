import { useEffect, useRef } from "react";

/**
 * Close a popover on outside click or Escape.
 *
 * Uses a document-level listener rather than a full-screen backdrop element:
 * a `fixed inset-0` overlay silently breaks whenever an ancestor has a CSS
 * transform (our header animates with translate-y), because the transform
 * becomes the containing block for fixed descendants.
 *
 *   const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
 *   <div ref={ref}> trigger + panel </div>
 */
export function useDismiss<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // pointerdown fires before click, so the menu closes even if the click
    // lands on something that re-renders.
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return ref;
}
