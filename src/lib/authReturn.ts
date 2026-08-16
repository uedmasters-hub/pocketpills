/** Resume a guest’s in-progress journey after login or sign-up. */

const STORAGE_KEY = "pp.authReturn";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

const AUTH_PATHS = new Set([
  "/login",
  "/get-started",
  "/provider/login",
  "/provider/get-started",
]);

type Stored = { path: string; savedAt: number };

export function pathFromLocation(loc: { pathname: string; search?: string; hash?: string }): string {
  return `${loc.pathname}${loc.search ?? ""}${loc.hash ?? ""}`;
}

export function isSafeReturnPath(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.includes("://") || path.includes("\\")) return false;
  const pathname = path.split("?")[0]?.split("#")[0] ?? "";
  if (!pathname || AUTH_PATHS.has(pathname)) return false;
  if (pathname.startsWith("/provider")) return false;
  return path.length <= 2000;
}

export function safeReturnPath(raw: unknown, fallback = "/app"): string {
  return isSafeReturnPath(raw) ? raw.trim() : fallback;
}

export function saveAuthReturn(path: string): void {
  if (!isSafeReturnPath(path)) return;
  try {
    const payload: Stored = { path: path.trim(), savedAt: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
}

export function peekAuthReturn(): string | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || typeof parsed.path !== "string" || typeof parsed.savedAt !== "number") {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (Date.now() - parsed.savedAt > MAX_AGE_MS || !isSafeReturnPath(parsed.path)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.path;
  } catch {
    return null;
  }
}

export function consumeAuthReturn(): string | null {
  const path = peekAuthReturn();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return path;
}

/** Prefer the URL passed through router state, then the cached journey. */
export function takeAuthReturn(preferred?: unknown): string {
  const fromState = isSafeReturnPath(preferred) ? preferred.trim() : "";
  const fromStore = consumeAuthReturn();
  return fromState || fromStore || "/app";
}
