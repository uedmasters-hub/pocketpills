import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";

export function Lightbox({
  open,
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  open: boolean;
  images: { src: string; label?: string }[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { tx } = useI18n();
  const current = images[index];

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, onPrev, onNext]);

  if (!open || !current || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] bg-[color:var(--pp-primary-950)]/92" role="dialog" aria-modal="true" aria-label={tx("Gallery")}>
      <button type="button" className="absolute inset-0 cursor-zoom-out" aria-label={tx("Close")} onClick={onClose} />

      <button
        type="button"
        onClick={onClose}
        aria-label={tx("Close")}
        className="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center text-white/90 hover:text-white sm:right-6 sm:top-6"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>

      {images.length > 1 ? (
        <button
          type="button"
          onClick={onPrev}
          aria-label={tx("Previous")}
          className="absolute left-1 top-1/2 z-10 grid h-14 w-14 -translate-y-1/2 place-items-center text-white/90 hover:text-white sm:left-3"
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}

      {images.length > 1 ? (
        <button
          type="button"
          onClick={onNext}
          aria-label={tx("Next")}
          className="absolute right-1 top-1/2 z-10 grid h-14 w-14 -translate-y-1/2 place-items-center text-white/90 hover:text-white sm:right-3"
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}

      <div className="pointer-events-none relative z-[1] flex h-full flex-col items-center justify-center px-16 py-16">
        <img
          src={current.src}
          alt={current.label || ""}
          className="pointer-events-auto max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        {current.label ? (
          <p className="pointer-events-none mt-4 text-sm text-white/80">{current.label}</p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
