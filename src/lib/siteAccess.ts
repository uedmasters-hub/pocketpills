const STORAGE_KEY = "pp.siteAccess.session.v1";

export type SiteAccessSession = {
  sessionToken: string;
  expiresAt: string;
  method: "password" | "magic_link";
  email?: string | null;
};

export function readSiteAccessSession(): SiteAccessSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SiteAccessSession;
    if (!parsed?.sessionToken || !parsed?.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSiteAccessSession(session: SiteAccessSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSiteAccessSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      data.error ||
        (res.status === 405
          ? "Could not reach the access API. Restart the app with npm run dev."
          : `Request failed (${res.status})`),
    );
  }
  return data;
}

export function passwordUnlock(password: string) {
  return api<SiteAccessSession>("/api/access/password", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function validateSiteAccessSession(sessionToken: string): Promise<boolean> {
  try {
    const res = await fetch("/api/access/session", {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { valid?: boolean; expiresAt?: string };
    if (!data.valid) return false;
    if (data.expiresAt) {
      const existing = readSiteAccessSession();
      if (existing) {
        writeSiteAccessSession({ ...existing, expiresAt: data.expiresAt });
      }
    }
    return true;
  } catch {
    return false;
  }
}
