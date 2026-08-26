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
import { useLocation } from "react-router-dom";

export type ShellColumn = "nav" | "main" | "rail";

/** Middle of the 5–7s idle window before columns return to full opacity. */
const IDLE_MS = 6000;

const DIM =
  "lg:opacity-60 lg:transition-opacity lg:duration-200 motion-reduce:transition-none";
const FULL = "lg:opacity-100 lg:transition-opacity lg:duration-200 motion-reduce:transition-none";

type ColumnHoverState = {
  hover: ShellColumn | null;
  idle: boolean;
  setHover: (col: ShellColumn | null) => void;
  onActivity: () => void;
  dimClass: (col: ShellColumn) => string;
};

const ColumnHoverContext = createContext<ColumnHoverState | null>(null);

export function ColumnHoverProvider({ children }: { children: ReactNode }) {
  const [hover, setHoverState] = useState<ShellColumn | null>(null);
  const [idle, setIdle] = useState(true);
  const hoverRef = useRef<ShellColumn | null>(null);
  const idleRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleIdle = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      idleRef.current = true;
      setIdle(true);
      timerRef.current = null;
    }, IDLE_MS);
  }, [clearTimer]);

  const wake = useCallback(() => {
    if (idleRef.current) {
      idleRef.current = false;
      setIdle(false);
    }
    scheduleIdle();
  }, [scheduleIdle]);

  const setHover = useCallback(
    (col: ShellColumn | null) => {
      hoverRef.current = col;
      setHoverState(col);
      if (col) wake();
      else {
        idleRef.current = true;
        setIdle(true);
        clearTimer();
      }
    },
    [wake, clearTimer],
  );

  const onActivity = useCallback(() => {
    if (!hoverRef.current) return;
    wake();
  }, [wake]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const { pathname } = useLocation();
  useEffect(() => {
    hoverRef.current = null;
    idleRef.current = true;
    setHoverState(null);
    setIdle(true);
    clearTimer();
  }, [pathname, clearTimer]);

  const value = useMemo<ColumnHoverState>(
    () => ({
      hover,
      idle,
      setHover,
      onActivity,
      dimClass: (col) => (hover && !idle && hover !== col ? DIM : FULL),
    }),
    [hover, idle, setHover, onActivity],
  );
  return <ColumnHoverContext.Provider value={value}>{children}</ColumnHoverContext.Provider>;
}

export function useColumnHover() {
  return useContext(ColumnHoverContext);
}

/** Outermost column row: clear dim when the pointer leaves, wake from idle on move. */
export function useColumnHoverRow() {
  const ctx = useColumnHover();
  return {
    onMouseLeave: ctx ? () => ctx.setHover(null) : undefined,
    onMouseMove: ctx?.onActivity,
  };
}

/** Bind a shell column: full opacity while hovered, slightly dimmed otherwise. */
export function useShellColumn(col: ShellColumn) {
  const ctx = useColumnHover();
  if (!ctx) return { className: "", onMouseEnter: undefined as undefined | (() => void) };
  return {
    className: ctx.dimClass(col),
    onMouseEnter: () => ctx.setHover(col),
  };
}
