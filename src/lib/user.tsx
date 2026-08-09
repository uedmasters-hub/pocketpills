import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface InsurancePlan {
  id: string;
  carrier: string;
  group: string;
  member: string;
}

/** @deprecated use InsurancePlan — kept for migration typing */
export type Insurance = InsurancePlan;

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  province: string;
  healthCard: string;
  address: string;
  /** Ordered list — index 0 is billed first (primary). */
  insurances: InsurancePlan[];
  allergies: string[];
  paymentOnFile?: boolean;
  cardLast4?: string;
  conditions?: string[];
  gender?: string;
  familyDoctor?: boolean | null;
  onboarded: boolean;
}

const EMPTY: Profile = {
  firstName: "", lastName: "", email: "", phone: "", dob: "", province: "ON",
  healthCard: "", address: "", insurances: [], allergies: [], onboarded: false,
};

interface UserState {
  user: Profile | null;
  signedIn: boolean;
  signUp: (email: string) => void;
  logIn: (email: string) => void;
  logOut: () => void;
  update: (p: Partial<Profile>) => void;
  /** Replace the active profile entirely (account switch). */
  replace: (p: Profile) => void;
  displayName: string;
  initials: string;
}

const Ctx = createContext<UserState | null>(null);
const KEY = "pp.user";

export function newInsuranceId() {
  return `ins_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function asPlan(raw: unknown): InsurancePlan | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const carrier = String(o.carrier ?? "").trim();
  if (!carrier) return null;
  return {
    id: String(o.id ?? newInsuranceId()),
    carrier,
    group: String(o.group ?? "").trim(),
    member: String(o.member ?? "").trim(),
  };
}

/** Accepts legacy single `insurance` object or `insurances` array. */
export function normalizeInsurances(raw: unknown, legacy?: unknown): InsurancePlan[] {
  if (Array.isArray(raw)) {
    return raw.map(asPlan).filter((p): p is InsurancePlan => !!p);
  }
  const one = asPlan(raw) ?? asPlan(legacy);
  return one ? [one] : [];
}

export function primaryInsurance(user: Profile | null | undefined): InsurancePlan | null {
  return user?.insurances?.[0] ?? null;
}

export function fmtInsurancePlan(p: InsurancePlan | null | undefined) {
  if (!p?.carrier) return "None";
  const bits = [p.carrier];
  if (p.group) bits.push(`Group ${p.group}`);
  if (p.member) bits.push(`Member ${p.member}`);
  return bits.join(" · ");
}

export function fmtInsuranceList(plans: InsurancePlan[]) {
  if (!plans.length) return "None";
  return plans
    .map((p, i) => `${i === 0 ? "Primary" : `Plan ${i + 1}`}: ${fmtInsurancePlan(p)}`)
    .join("; ");
}

function normalizeProfile(raw: Record<string, unknown>): Profile {
  const insurances = normalizeInsurances(raw.insurances, raw.insurance);
  return {
    ...EMPTY,
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    dob: String(raw.dob ?? ""),
    province: String(raw.province ?? "ON"),
    healthCard: String(raw.healthCard ?? ""),
    address: String(raw.address ?? ""),
    insurances,
    allergies: Array.isArray(raw.allergies) ? (raw.allergies as string[]) : [],
    paymentOnFile: Boolean(raw.paymentOnFile),
    cardLast4: raw.cardLast4 ? String(raw.cardLast4) : undefined,
    conditions: Array.isArray(raw.conditions) ? (raw.conditions as string[]) : undefined,
    gender: raw.gender ? String(raw.gender) : undefined,
    familyDoctor: (raw.familyDoctor as boolean | null | undefined) ?? undefined,
    onboarded: Boolean(raw.onboarded),
  };
}

function load(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return normalizeProfile(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return null;
  }
}

import { loadLanguage, saveLanguage } from "@/lib/accountPrefs";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(() => load());

  useEffect(() => {
    saveLanguage(loadLanguage());
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(KEY, JSON.stringify(user));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable — session-only */
    }
  }, [user]);

  const value = useMemo<UserState>(() => {
    const first = user?.firstName?.trim() ?? "";
    const last = user?.lastName?.trim() ?? "";
    const displayName = first || (user?.email ? user.email.split("@")[0] : "there");
    const initials = ((first[0] ?? user?.email?.[0] ?? "?") + (last[0] ?? "")).toUpperCase();
    return {
      user,
      signedIn: !!user,
      signUp: (email) => setUser({ ...EMPTY, email }),
      logIn: (email) => setUser((u) => u ?? {
        ...EMPTY,
        email,
        firstName: "Ramesh",
        lastName: "Chen",
        onboarded: true,
        address: "221 King St W, Toronto, ON",
      }),
      logOut: () => setUser(null),
      update: (p) => setUser((u) => {
        const base = u ?? { ...EMPTY };
        const next = { ...base, ...p };
        if (p.insurances) next.insurances = normalizeInsurances(p.insurances);
        return next;
      }),
      replace: (p) => setUser(normalizeProfile(p as unknown as Record<string, unknown>)),
      displayName,
      initials,
    };
  }, [user]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUser() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUser must be used inside UserProvider");
  return c;
}

/** Time-aware greeting, e.g. "Good morning". */
export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
