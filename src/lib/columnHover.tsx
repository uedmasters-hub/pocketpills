import { type ReactNode } from "react";

export type ShellColumn = "nav" | "main" | "rail";

/** Checkout: payment info lives in the right rail and must stay readable. */
export function isCheckoutPath(pathname: string) {
  if (pathname === "/appointments/book") return true;
  if (/^\/appointments\/labs\/[^/]+\/book$/.test(pathname)) return true;
  if (/^\/appointments\/assistants\/[^/]+\/book$/.test(pathname)) return true;
  if (/^\/appointments\/services\/[^/]+$/.test(pathname) && !pathname.includes("/request/")) return true;
  if (/^\/drug\/consult\/[^/]+$/.test(pathname)) return true;
  if (pathname === "/drug/order") return true;
  if (/^\/drug\/[^/]+\/order$/.test(pathname)) return true;
  return false;
}

type ColumnHoverState = {
  hover: ShellColumn | null;
  idle: boolean;
  setHover: (col: ShellColumn | null) => void;
  onActivity: () => void;
  dimClass: (col: ShellColumn) => string;
};

export function ColumnHoverProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useColumnHover(): ColumnHoverState | null {
  return null;
}

export function useColumnHoverRow() {
  return {
    onMouseLeave: undefined as undefined | (() => void),
    onMouseMove: undefined as undefined | (() => void),
  };
}

export function useShellColumn(_col: ShellColumn) {
  return { className: "", onMouseEnter: undefined as undefined | (() => void) };
}
