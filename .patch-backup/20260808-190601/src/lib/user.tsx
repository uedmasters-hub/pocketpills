import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface Insurance { carrier: string; group: string; member: string; }
export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  province: string;
  healthCard: string;
  address: string;
  insurance: Insurance | null;
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
  healthCard: "", address: "", insurance: null, allergies: [], onboarded: false,
};

interface UserState {
  user: Profile | null;
  signedIn: boolean;
  signUp: (email: string) => void;
  logIn: (email: string) => void;
  logOut: () => void;
  update: (p: Partial<Profile>) => void;
  displayName: string;
  initials: string;
}

const Ctx = createContext<UserState | null>(null);
const KEY = "pp.user";

function load(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(() => load());

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
      logIn: (email) => setUser((u) => u ?? { ...EMPTY, email, firstName: "Alex", lastName: "Chen", onboarded: true, address: "221 King St W, Toronto, ON" }),
      logOut: () => setUser(null),
      update: (p) => setUser((u) => (u ? { ...u, ...p } : { ...EMPTY, ...p })),
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
