import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { normalizeVendorType, type BusinessVendorType } from "@/lib/businessProfile";
import { saveOwnerPassword } from "@/lib/providerDelegates";

export type AmbulanceRole = "owner" | "driver";
/** @deprecated use accountRole — kept for pharmacy session compat */
export type PharmacyRole = "owner" | "delegate";
export type AccountRole = "owner" | "delegate";

export type ProviderAccount = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  orgName: string;
  vendorType: BusinessVendorType;
  ambulanceRole?: AmbulanceRole;
  /** owner = full portal; delegate = feature-gated staff */
  accountRole?: AccountRole;
  /** @deprecated alias of accountRole for pharmacy */
  pharmacyRole?: PharmacyRole;
  /** Parent owner workspace id when accountRole === delegate */
  ownerOrgId?: string;
  /** @deprecated alias of ownerOrgId */
  pharmacyOrgId?: string;
  delegateId?: string;
  onboarded: boolean;
  /** Nepal Medical Council number when this account claimed an NMC profile */
  nmcNumber?: string;
  /** DDA pharmacy registration when this account claimed a pharmacy profile */
  ddaNumber?: string;
};

type ProviderState = {
  provider: ProviderAccount | null;
  signedIn: boolean;
  logIn: (email: string, opts?: Partial<ProviderAccount> & { password?: string }) => void;
  signUp: (input: {
    email: string;
    firstName: string;
    lastName: string;
    orgName: string;
    vendorType: BusinessVendorType;
    ambulanceRole?: AmbulanceRole;
    accountRole?: AccountRole;
    pharmacyRole?: PharmacyRole;
    phone?: string;
    password?: string;
    nmcNumber?: string;
    ddaNumber?: string;
    id?: string;
  }) => ProviderAccount;
  logOut: () => void;
  update: (p: Partial<ProviderAccount>) => void;
  /** Replace session (account switch) without clearing stashed owner unless cleared */
  setSession: (account: ProviderAccount) => void;
  displayName: string;
  workspaceId: string;
  isDelegate: boolean;
  /** @deprecated use isDelegate */
  isPharmacyDelegate: boolean;
};

const Ctx = createContext<ProviderState | null>(null);
const KEY = "pp.provider.v1";

function normalizeAccount(raw: ProviderAccount): ProviderAccount {
  const vendorType = normalizeVendorType(raw.vendorType as string);
  const isDel =
    raw.accountRole === "delegate" ||
    raw.pharmacyRole === "delegate" ||
    Boolean(raw.delegateId);

  const ownerOrgId = isDel ? String(raw.ownerOrgId ?? raw.pharmacyOrgId ?? "") : undefined;

  return {
    ...raw,
    vendorType,
    ambulanceRole:
      vendorType === "ambulance"
        ? raw.ambulanceRole === "driver"
          ? "driver"
          : "owner"
        : undefined,
    accountRole: isDel ? "delegate" : "owner",
    pharmacyRole: vendorType === "pharmacy" ? (isDel ? "delegate" : "owner") : undefined,
    ownerOrgId,
    pharmacyOrgId: vendorType === "pharmacy" && isDel ? ownerOrgId : undefined,
    delegateId: isDel ? String(raw.delegateId ?? "") : undefined,
    nmcNumber: raw.nmcNumber ? String(raw.nmcNumber).trim() : undefined,
    ddaNumber: raw.ddaNumber ? String(raw.ddaNumber).trim() : undefined,
  };
}

function read(): ProviderAccount | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return normalizeAccount(JSON.parse(raw) as ProviderAccount);
  } catch {
    return null;
  }
}

function write(p: ProviderAccount | null) {
  if (!p) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(p));
}

export function pharmacyWorkspaceId(provider: ProviderAccount | null | undefined): string {
  return providerWorkspaceId(provider);
}

export function providerWorkspaceId(provider: ProviderAccount | null | undefined): string {
  if (!provider) return "anon";
  if (provider.accountRole === "delegate" && provider.ownerOrgId) return provider.ownerOrgId;
  if (provider.pharmacyRole === "delegate" && provider.pharmacyOrgId) return provider.pharmacyOrgId;
  return provider.id;
}

export function ProviderAuthProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ProviderAccount | null>(() =>
    typeof window !== "undefined" ? read() : null,
  );

  useEffect(() => {
    write(provider);
  }, [provider]);

  useEffect(() => {
    setProvider((cur) => {
      if (!cur) return cur;
      let next = normalizeAccount(cur);
      const org = next.orgName.trim();
      if (!org || org.toLowerCase() === "your practice") {
        const full = [next.firstName, next.lastName].filter(Boolean).join(" ").trim();
        if (full && full !== org) next = { ...next, orgName: full };
      }
      return next;
    });
  }, []);

  const value = useMemo<ProviderState>(() => {
    const displayName =
      [provider?.firstName, provider?.lastName].filter(Boolean).join(" ") ||
      provider?.orgName ||
      provider?.email ||
      "Provider";

    const isDelegate = provider?.accountRole === "delegate";

    return {
      provider,
      signedIn: !!provider,
      workspaceId: providerWorkspaceId(provider),
      isDelegate,
      isPharmacyDelegate: isDelegate && provider?.vendorType === "pharmacy",
      logIn: (email, opts) => {
        const firstName = opts?.firstName ?? "Alex";
        const lastName = opts?.lastName ?? "Chen";
        const fullName = [firstName, lastName].filter(Boolean).join(" ");
        const vendorType = normalizeVendorType(opts?.vendorType ?? "doctor");
        const isDel =
          opts?.accountRole === "delegate" ||
          opts?.pharmacyRole === "delegate" ||
          Boolean(opts?.delegateId);
        const id =
          opts?.id ??
          `prov-${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${vendorType}${
            vendorType === "ambulance"
              ? `-${opts?.ambulanceRole === "driver" ? "driver" : "owner"}`
              : isDel
                ? `-delegate`
                : ""
          }`;
        const account = normalizeAccount({
          id,
          email: email.trim().toLowerCase(),
          firstName,
          lastName,
          phone: opts?.phone ?? "",
          orgName: opts?.orgName?.trim() || fullName,
          vendorType,
          ambulanceRole:
            vendorType === "ambulance"
              ? opts?.ambulanceRole === "driver"
                ? "driver"
                : "owner"
              : undefined,
          accountRole: isDel ? "delegate" : "owner",
          pharmacyRole: vendorType === "pharmacy" ? (isDel ? "delegate" : "owner") : undefined,
          ownerOrgId: opts?.ownerOrgId ?? opts?.pharmacyOrgId,
          pharmacyOrgId: opts?.pharmacyOrgId ?? opts?.ownerOrgId,
          delegateId: opts?.delegateId,
          onboarded: opts?.onboarded ?? true,
          nmcNumber: opts?.nmcNumber,
          ddaNumber: opts?.ddaNumber,
        });
        if (!isDel && opts?.password) {
          saveOwnerPassword(account.id, opts.password, account.email);
        }
        setProvider(account);
      },
      signUp: (input) => {
        const vendorType = normalizeVendorType(input.vendorType);
        const account = normalizeAccount({
          id: input.id?.trim() || `prov-${Date.now().toString(36)}`,
          email: input.email.trim().toLowerCase(),
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phone: input.phone?.trim() ?? "",
          orgName:
            input.orgName.trim() ||
            [input.firstName, input.lastName].filter(Boolean).join(" ") ||
            "Your practice",
          vendorType,
          ambulanceRole:
            vendorType === "ambulance"
              ? input.ambulanceRole === "driver"
                ? "driver"
                : "owner"
              : undefined,
          accountRole: "owner",
          pharmacyRole: vendorType === "pharmacy" ? "owner" : undefined,
          onboarded: true,
          nmcNumber: input.nmcNumber ? String(input.nmcNumber).trim() : undefined,
          ddaNumber: input.ddaNumber ? String(input.ddaNumber).trim() : undefined,
        });
        if (input.password) saveOwnerPassword(account.id, input.password, account.email);
        write(account);
        setProvider(account);
        return account;
      },
      logOut: () => setProvider(null),
      setSession: (account) => setProvider(normalizeAccount(account)),
      update: (p) =>
        setProvider((cur) => {
          if (!cur) return cur;
          return normalizeAccount({ ...cur, ...p });
        }),
      displayName,
    };
  }, [provider]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProvider() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProvider must be used within ProviderAuthProvider");
  return ctx;
}
