import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface ReviewChange {
  label: string;
  /** Previous value — omit when adding something new. */
  from?: string;
  to: string;
}

export interface ReviewSession {
  title: string;
  changes: ReviewChange[];
  ctaLabel?: string;
  onConfirm: () => void;
  onDiscard?: () => void;
}

interface RightRailState {
  /** When set, Activity hides and the review panel takes the right column. */
  review: ReviewSession | null;
  setReview: (session: ReviewSession | null) => void;
  clearReview: () => void;
}

const Ctx = createContext<RightRailState | null>(null);

export function RightRailProvider({ children }: { children: ReactNode }) {
  const [review, setReviewState] = useState<ReviewSession | null>(null);

  const setReview = useCallback((session: ReviewSession | null) => {
    setReviewState(session);
  }, []);

  const clearReview = useCallback(() => {
    setReviewState(null);
  }, []);

  const value = useMemo(
    () => ({ review, setReview, clearReview }),
    [review, setReview, clearReview],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRightRail() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRightRail must be used inside RightRailProvider");
  return c;
}

/**
 * Publish a review session while `active` and there are changes.
 * Clears automatically on unmount or when edits are reverted.
 */
export function useReviewDraft(opts: {
  active: boolean;
  title: string;
  changes: ReviewChange[];
  ctaLabel?: string;
  onConfirm: () => void;
  onDiscard?: () => void;
}) {
  const { setReview, clearReview } = useRightRail();
  const confirmRef = useRef(opts.onConfirm);
  const discardRef = useRef(opts.onDiscard);
  confirmRef.current = opts.onConfirm;
  discardRef.current = opts.onDiscard;

  const changeKey = opts.changes
    .map((c) => `${c.label}|${c.from ?? ""}|${c.to}`)
    .join(";;");

  useEffect(() => {
    if (!opts.active || opts.changes.length === 0) {
      clearReview();
      return;
    }

    setReview({
      title: opts.title,
      changes: opts.changes,
      ctaLabel: opts.ctaLabel,
      onConfirm: () => confirmRef.current(),
      onDiscard: () => discardRef.current?.(),
    });

    return () => clearReview();
  }, [
    opts.active,
    opts.title,
    opts.ctaLabel,
    changeKey,
    setReview,
    clearReview,
  ]);
}
