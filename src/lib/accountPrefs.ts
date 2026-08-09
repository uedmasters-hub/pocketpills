/** Persisted account preferences (notifications, language, family, switchable accounts). */

export type LangCode = "en" | "fr";

export interface NotifPrefs {
  meds: boolean;
  delivery: boolean;
  refill: boolean;
  care: boolean;
  marketing: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  dob: string;
  /** Share orders & reminders with this person */
  linked: boolean;
}

export interface SavedAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Snapshot of last-known profile fields for quick switch (demo). */
  snapshot?: Record<string, unknown>;
}

const NOTIF_KEY = "pp.prefs.notifications";
const LANG_KEY = "pp.prefs.language";
const FAMILY_KEY = "pp.prefs.family";
const ACCOUNTS_KEY = "pp.prefs.accounts";

const DEFAULT_NOTIFS: NotifPrefs = {
  meds: true,
  delivery: true,
  refill: true,
  care: true,
  marketing: false,
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadNotifs(): NotifPrefs {
  return { ...DEFAULT_NOTIFS, ...read(NOTIF_KEY, {}) };
}

export function saveNotifs(p: NotifPrefs) {
  write(NOTIF_KEY, p);
}

export function loadLanguage(): LangCode {
  const v = read<string>(LANG_KEY, "en");
  return v === "fr" ? "fr" : "en";
}

export function saveLanguage(code: LangCode) {
  write(LANG_KEY, code);
  try {
    document.documentElement.lang = code === "fr" ? "fr-CA" : "en-CA";
  } catch {
    /* ignore */
  }
}

export function loadFamily(): FamilyMember[] {
  return read(FAMILY_KEY, [] as FamilyMember[]);
}

export function saveFamily(members: FamilyMember[]) {
  write(FAMILY_KEY, members);
}

export function newFamilyId() {
  return `fam_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Seed a demo second account the first time switch is opened. */
export function ensureDemoAccounts(current: {
  email: string;
  firstName: string;
  lastName: string;
  snapshot?: Record<string, unknown>;
}): SavedAccount[] {
  const list = read(ACCOUNTS_KEY, [] as SavedAccount[]);
  const byEmail = new Map(list.map((a) => [a.email.toLowerCase(), a]));

  if (current.email) {
    byEmail.set(current.email.toLowerCase(), {
      id: byEmail.get(current.email.toLowerCase())?.id ?? `acc_${current.email}`,
      email: current.email,
      firstName: current.firstName,
      lastName: current.lastName,
      snapshot: current.snapshot,
    });
  }

  if (![...byEmail.keys()].includes("priya@example.com")) {
    byEmail.set("priya@example.com", {
      id: "acc_priya",
      email: "priya@example.com",
      firstName: "Priya",
      lastName: "Sharma",
      snapshot: {
        firstName: "Priya",
        lastName: "Sharma",
        email: "priya@example.com",
        phone: "(604) 555-0142",
        dob: "1990-04-12",
        province: "BC",
        address: "88 West Pender St, Vancouver, BC",
        insurances: [],
        allergies: [],
        onboarded: true,
      },
    });
  }

  const next = [...byEmail.values()];
  write(ACCOUNTS_KEY, next);
  return next;
}

export function upsertSavedAccount(account: SavedAccount) {
  const list = read(ACCOUNTS_KEY, [] as SavedAccount[]);
  const i = list.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase());
  if (i >= 0) list[i] = { ...list[i], ...account };
  else list.push(account);
  write(ACCOUNTS_KEY, list);
  return list;
}

export const LANG_META: Record<LangCode, { label: string; native: string; hint: string }> = {
  en: {
    label: "English",
    native: "English (Canada)",
    hint: "Emails, app, and care messages in English.",
  },
  fr: {
    label: "Français",
    native: "Français (Canada)",
    hint: "Courriels, application et messages de soins en français.",
  },
};
