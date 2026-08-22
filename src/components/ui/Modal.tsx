import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

/** Lightweight confirm / content dialog — one at a time, Escape to close. */
export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  const { tx } = useI18n();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[color:var(--pp-primary-950)]/40"
        aria-label={tx("Close")}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_16px_48px_rgba(24,7,48,0.16)] outline-none sm:p-6"
      >
        <div className="flex shrink-0 items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
            aria-label={tx("Close")}
          >
            ✕
          </button>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain text-sm leading-relaxed text-ink-secondary">
          {children}
        </div>
        {footer ? <div className="mt-5 flex shrink-0 flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  danger,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  const { tx } = useI18n();
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="secondary" onClick={onClose}>
            {cancelLabel ?? tx("Keep")}
          </Button>
          {danger ? (
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full px-6 py-3 text-sm font-medium text-danger hover:opacity-80"
            >
              {confirmLabel}
            </button>
          ) : (
            <Button size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </>
      }
    >
      <p>{body}</p>
    </Modal>
  );
}
