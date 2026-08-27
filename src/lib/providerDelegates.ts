/**
 * Provider delegates — staff accounts, per-vendor feature grants, activity (demo).
 */

import type { BusinessVendorType } from "@/lib/businessProfile";

export type FeatureDef = {
  id: string;
  label: string;
  path: string;
  blurb: string;
  required?: boolean;
};

export type DelegateFeatures = Record<string, boolean>;

export type ProviderDelegate = {
  id: string;
  orgId: string;
  orgName: string;
  vendorType: BusinessVendorType;
  username: string;
  /** Demo-only plaintext password */
  password: string;
  firstName: string;
  lastName: string;
  active: boolean;
  createdAt: string;
  features: DelegateFeatures;
};

export type DelegateActivity = {
  id: string;
  orgId: string;
  delegateId: string;
  delegateName: string;
  action: string;
  detail: string;
  orderId?: string;
  at: string;
};

const DELEGATES_KEY = "pp.provider.delegates.v1";
const ACTIVITY_KEY = "pp.provider.delegateActivity.v1";
const FEATURES_EVENT = "pp:providerDelegateFeatures";
const OWNER_PW_KEY = "pp.provider.ownerPasswords.v1";
const OWNER_EMAIL_KEY = "pp.provider.ownerEmails.v1";
const RESET_KEY = "pp.provider.passwordReset.v1";
const SWITCH_OWNER_KEY = "pp.provider.switchOwner.v1";

function inboxLabel(vendorType: BusinessVendorType): string {
  if (vendorType === "pharmacy") return "Orders";
  if (vendorType === "ambulance") return "Runs";
  return "Requests";
}

/** Grantable modules for each portal (owner chooses; required stays on). */
export function featuresForVendor(vendorType: BusinessVendorType): FeatureDef[] {
  const inbox: FeatureDef = {
    id: "inbox",
    label: inboxLabel(vendorType),
    path: "/provider/requests",
    blurb: "Receive and handle inbound work",
    required: true,
  };
  const finance: FeatureDef = {
    id: "finance",
    label: "Finance",
    path: "/provider/finance",
    blurb: "Wallet, bank, and refunds",
  };
  const chat: FeatureDef = {
    id: "chat",
    label: "Chat",
    path: "/provider/chat",
    blurb: "Patient message inbox",
  };
  const support: FeatureDef = {
    id: "support",
    label: "Support",
    path: "/provider/support",
    blurb: "Platform and customer tickets",
  };
  const offers: FeatureDef = {
    id: "offers",
    label: "Offers",
    path: "/provider/offers",
    blurb: "Bundles, deals, and promo codes",
  };

  const schedule: FeatureDef = {
    id: "schedule",
    label: "Schedule",
    path: "/provider/schedule",
    blurb: "Day board and visits",
  };
  const patients: FeatureDef = {
    id: "patients",
    label: "Patients",
    path: "/provider/patients",
    blurb: "Patient board",
  };
  const cancellations: FeatureDef = {
    id: "cancellations",
    label: "Cancellations",
    path: "/provider/cancellations",
    blurb: "Resolve denied and cancelled visits",
  };

  switch (vendorType) {
    case "pharmacy":
      return [
        { ...inbox, id: "orders", label: "Orders", blurb: "Receive, adjust, and fulfill prescription orders" },
        schedule,
        patients,
        cancellations,
        {
          id: "prescriptions",
          label: "Prescriptions",
          path: "/provider/prescriptions",
          blurb: "Kanban fulfillment queue",
        },
        {
          id: "inventory",
          label: "Inventory",
          path: "/provider/inventory",
          blurb: "Stock, expiry, cost, and offers",
        },
        finance,
        offers,
        chat,
        support,
      ];
    case "hospital":
      return [
        inbox,
        schedule,
        patients,
        cancellations,
        { id: "doctors", label: "Doctors", path: "/provider/doctors", blurb: "Staff directory and slots" },
        { id: "services", label: "Services", path: "/provider/services", blurb: "Facility services" },
        { id: "monitor", label: "Monitor", path: "/provider/monitor", blurb: "Care board" },
        finance,
        offers,
        chat,
        support,
      ];
    case "clinic":
      return [
        inbox,
        schedule,
        patients,
        cancellations,
        { id: "team", label: "Team", path: "/provider/team", blurb: "Clinic team profiles" },
        { id: "services", label: "Services", path: "/provider/services", blurb: "Clinic services" },
        finance,
        offers,
        chat,
        support,
      ];
    case "doctor":
      return [
        inbox,
        schedule,
        patients,
        cancellations,
        finance,
        offers,
        chat,
        support,
      ];
    case "lab":
      return [
        inbox,
        schedule,
        patients,
        cancellations,
        { id: "tests", label: "Tests", path: "/provider/tests", blurb: "Tests and packages" },
        {
          id: "collections",
          label: "Collections",
          path: "/provider/collections",
          blurb: "Draw and collection queue",
        },
        finance,
        offers,
        chat,
        support,
      ];
    case "ambulance":
      return [
        inbox,
        schedule,
        patients,
        cancellations,
        { id: "fleet", label: "Fleet", path: "/provider/fleet", blurb: "Vehicles" },
        { id: "dispatch", label: "Dispatch", path: "/provider/dispatch", blurb: "Assign runs" },
        finance,
        offers,
        chat,
        support,
      ];
    case "individual":
    default:
      return [
        inbox,
        schedule,
        patients,
        cancellations,
        { id: "services", label: "Services", path: "/provider/services", blurb: "Your offerings" },
        {
          id: "availability",
          label: "Availability",
          path: "/provider/availability",
          blurb: "Weekly slots",
        },
        finance,
        offers,
        chat,
        support,
      ];
  }
}

export function defaultDelegateFeatures(
  vendorType: BusinessVendorType,
  partial?: Partial<DelegateFeatures>,
): DelegateFeatures {
  const defs = featuresForVendor(vendorType);
  const out: DelegateFeatures = {};
  for (const d of defs) {
    out[d.id] = d.required ? true : Boolean(partial?.[d.id]);
  }
  // Migrate legacy pharmacy "orders" key
  if (vendorType === "pharmacy" && partial?.orders != null) {
    out.orders = true;
  }
  return out;
}

export function normalizeDelegateFeatures(
  vendorType: BusinessVendorType,
  raw?: Partial<DelegateFeatures> | null,
): DelegateFeatures {
  const src = { ...(raw ?? {}) };
  // Map older pharmacy inbox key
  if (vendorType === "pharmacy" && src.inbox != null && src.orders == null) {
    src.orders = src.inbox;
  }
  return defaultDelegateFeatures(vendorType, src);
}

function normalizeDelegate(
  raw: Partial<ProviderDelegate> & { id: string },
  fallbackVendor: BusinessVendorType = "doctor",
): ProviderDelegate {
  const vendorType = (raw.vendorType as BusinessVendorType) || fallbackVendor;
  return {
    id: raw.id,
    orgId: String(raw.orgId ?? ""),
    orgName: String(raw.orgName ?? "Practice"),
    vendorType,
    username: String(raw.username ?? "").toLowerCase(),
    password: String(raw.password ?? ""),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    active: raw.active !== false,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    features: normalizeDelegateFeatures(vendorType, raw.features),
  };
}

function readDelegates(): ProviderDelegate[] {
  try {
    const raw = localStorage.getItem(DELEGATES_KEY);
    if (!raw) {
      return migrateLegacyPharmacyDelegates();
    }
    const parsed = JSON.parse(raw) as Partial<ProviderDelegate>[];
    if (!Array.isArray(parsed)) return migrateLegacyPharmacyDelegates();
    return parsed
      .filter((d): d is Partial<ProviderDelegate> & { id: string } => Boolean(d?.id))
      .map((d) => normalizeDelegate(d, d.vendorType ?? "pharmacy"));
  } catch {
    return migrateLegacyPharmacyDelegates();
  }
}

function migrateLegacyPharmacyDelegates(): ProviderDelegate[] {
  const keys = ["pp.pharmacy.delegates.v2", "pp.pharmacy.delegates.v1"];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<ProviderDelegate>[];
      if (!Array.isArray(parsed) || parsed.length === 0) continue;
      const migrated = parsed
        .filter((d): d is Partial<ProviderDelegate> & { id: string } => Boolean(d?.id))
        .map((d) =>
          normalizeDelegate(
            {
              ...d,
              vendorType: "pharmacy",
              features: {
                ...(d.features ?? {}),
                orders: true,
              },
            },
            "pharmacy",
          ),
        );
      writeDelegates(migrated);
      return migrated;
    } catch {
      /* continue */
    }
  }
  return [];
}

function writeDelegates(list: ProviderDelegate[]) {
  localStorage.setItem(DELEGATES_KEY, JSON.stringify(list.map((d) => normalizeDelegate(d, d.vendorType))));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FEATURES_EVENT));
  }
}

function readActivity(): DelegateActivity[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("pp.pharmacy.delegateActivity.v1");
      if (legacy) {
        const parsed = JSON.parse(legacy) as DelegateActivity[];
        if (Array.isArray(parsed)) {
          writeActivity(parsed);
          return parsed;
        }
      }
      return [];
    }
    const parsed = JSON.parse(raw) as DelegateActivity[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeActivity(list: DelegateActivity[]) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list));
}

export function listDelegates(orgId: string): ProviderDelegate[] {
  return readDelegates()
    .filter((d) => d.orgId === orgId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDelegateById(id: string): ProviderDelegate | null {
  return readDelegates().find((d) => d.id === id) ?? null;
}

export function findDelegateByUsername(username: string): ProviderDelegate | null {
  const u = username.trim().toLowerCase();
  if (!u) return null;
  return readDelegates().find((d) => d.username === u && d.active) ?? null;
}

export function authenticateDelegate(
  username: string,
  password: string,
): ProviderDelegate | null {
  const d = findDelegateByUsername(username);
  if (!d || d.password !== password) return null;
  return d;
}

export function createDelegate(input: {
  orgId: string;
  orgName: string;
  vendorType: BusinessVendorType;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  features?: Partial<DelegateFeatures>;
}): { ok: true; delegate: ProviderDelegate } | { ok: false; error: string } {
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return { ok: false, error: "Username must be 3–32 characters (letters, numbers, . _ -)." };
  }
  if (input.password.trim().length < 4) {
    return { ok: false, error: "Password must be at least 4 characters." };
  }
  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { ok: false, error: "First and last name are required." };
  }
  if (readDelegates().some((d) => d.username === username)) {
    return { ok: false, error: "That username is already taken." };
  }

  const features = normalizeDelegateFeatures(input.vendorType, input.features);
  const defs = featuresForVendor(input.vendorType);
  const enabled = defs.filter((d) => features[d.id]).map((d) => d.label);

  const delegate = normalizeDelegate(
    {
      id: `del-${Date.now().toString(36)}`,
      orgId: input.orgId,
      orgName: input.orgName.trim() || "Practice",
      vendorType: input.vendorType,
      username,
      password: input.password.trim(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      active: true,
      createdAt: new Date().toISOString(),
      features,
    },
    input.vendorType,
  );
  writeDelegates([delegate, ...readDelegates()]);
  logDelegateActivity({
    orgId: input.orgId,
    delegateId: "owner",
    delegateName: "Account owner",
    action: "Created delegate",
    detail: `Account @${username} for ${delegate.firstName} ${delegate.lastName} · access: ${enabled.join(", ")}`,
  });
  return { ok: true, delegate };
}

export function setDelegateActive(orgId: string, delegateId: string, active: boolean): boolean {
  const list = readDelegates();
  const idx = list.findIndex((d) => d.id === delegateId && d.orgId === orgId);
  if (idx < 0) return false;
  list[idx] = { ...list[idx], active };
  writeDelegates(list);
  logDelegateActivity({
    orgId,
    delegateId: "owner",
    delegateName: "Account owner",
    action: active ? "Reactivated delegate" : "Deactivated delegate",
    detail: `@${list[idx].username}`,
  });
  return true;
}

export function setDelegateFeature(
  orgId: string,
  delegateId: string,
  featureId: string,
  enabled: boolean,
): boolean {
  const list = readDelegates();
  const idx = list.findIndex((d) => d.id === delegateId && d.orgId === orgId);
  if (idx < 0) return false;
  const defs = featuresForVendor(list[idx].vendorType);
  const meta = defs.find((d) => d.id === featureId);
  if (!meta) return false;
  if (meta.required && !enabled) return false;
  const next = normalizeDelegateFeatures(list[idx].vendorType, {
    ...list[idx].features,
    [featureId]: enabled,
  });
  list[idx] = { ...list[idx], features: next };
  writeDelegates(list);
  logDelegateActivity({
    orgId,
    delegateId: "owner",
    delegateName: "Account owner",
    action: enabled ? "Enabled feature" : "Disabled feature",
    detail: `@${list[idx].username} · ${meta.label}`,
  });
  return true;
}

export function resetDelegatePassword(
  orgId: string,
  delegateId: string,
  password: string,
): { ok: true } | { ok: false; error: string } {
  if (password.trim().length < 4) {
    return { ok: false, error: "Password must be at least 4 characters." };
  }
  const list = readDelegates();
  const idx = list.findIndex((d) => d.id === delegateId && d.orgId === orgId);
  if (idx < 0) return { ok: false, error: "Delegate not found." };
  list[idx] = { ...list[idx], password: password.trim() };
  writeDelegates(list);
  logDelegateActivity({
    orgId,
    delegateId: "owner",
    delegateName: "Account owner",
    action: "Reset delegate password",
    detail: `@${list[idx].username}`,
  });
  return { ok: true };
}

export function logDelegateActivity(input: {
  orgId: string;
  delegateId: string;
  delegateName: string;
  action: string;
  detail: string;
  orderId?: string;
}) {
  const row: DelegateActivity = {
    id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    orgId: input.orgId,
    delegateId: input.delegateId,
    delegateName: input.delegateName,
    action: input.action,
    detail: input.detail,
    orderId: input.orderId,
    at: new Date().toISOString(),
  };
  writeActivity([row, ...readActivity()].slice(0, 400));
}

export function listDelegateActivity(orgId: string, opts?: { delegateId?: string }): DelegateActivity[] {
  return readActivity()
    .filter((a) => a.orgId === orgId)
    .filter((a) => (opts?.delegateId ? a.delegateId === opts.delegateId : true))
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function delegateDisplayName(d: Pick<ProviderDelegate, "firstName" | "lastName" | "username">) {
  const full = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
  return full || `@${d.username}`;
}

export function subscribeDelegateFeatures(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener(FEATURES_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(FEATURES_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function enabledFeaturePaths(vendorType: BusinessVendorType, features: DelegateFeatures): string[] {
  return featuresForVendor(vendorType)
    .filter((d) => features[d.id])
    .map((d) => d.path);
}

/** Owner password store (demo) — used for login switch-back and reset. */
function readOwnerPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(OWNER_PW_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readOwnerEmails(): Record<string, string> {
  try {
    const raw = localStorage.getItem(OWNER_EMAIL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveOwnerPassword(ownerId: string, password: string, email?: string) {
  if (!ownerId || !password) return;
  const map = readOwnerPasswords();
  map[ownerId] = password;
  localStorage.setItem(OWNER_PW_KEY, JSON.stringify(map));
  if (email?.includes("@")) {
    const emails = readOwnerEmails();
    emails[email.trim().toLowerCase()] = ownerId;
    // also allow lookup by id → email
    emails[`id:${ownerId}`] = email.trim().toLowerCase();
    localStorage.setItem(OWNER_EMAIL_KEY, JSON.stringify(emails));
  }
}

export function verifyOwnerPassword(ownerId: string, password: string): boolean {
  const stored = readOwnerPasswords()[ownerId];
  if (!stored) {
    if (password.trim().length >= 1) {
      saveOwnerPassword(ownerId, password.trim());
      return true;
    }
    return false;
  }
  return stored === password;
}

export function getOwnerEmail(ownerId: string): string | null {
  return readOwnerEmails()[`id:${ownerId}`] ?? null;
}

export function resolveOwnerIdByEmail(email: string): string | null {
  const id = readOwnerEmails()[email.trim().toLowerCase()];
  return id && !id.startsWith("id:") ? id : null;
}

type PendingReset = {
  ownerId: string;
  email: string;
  code: string;
  expiresAt: number;
};

function readPendingReset(): PendingReset | null {
  try {
    const raw = localStorage.getItem(RESET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingReset;
    if (!parsed?.ownerId || !parsed?.code) return null;
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(RESET_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePendingReset(p: PendingReset | null) {
  if (!p) localStorage.removeItem(RESET_KEY);
  else localStorage.setItem(RESET_KEY, JSON.stringify(p));
}

function makeResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Start a demo password reset — returns the code so the UI can show it. */
export function requestProviderPasswordReset(input: {
  ownerId?: string;
  email?: string;
}): { ok: true; code: string; email: string; ownerId: string } | { ok: false; error: string } {
  let ownerId = input.ownerId?.trim() || "";
  let email = input.email?.trim().toLowerCase() || "";

  if (!ownerId && email) {
    ownerId = resolveOwnerIdByEmail(email) || "";
  }
  if (!email && ownerId) {
    email = getOwnerEmail(ownerId) || "";
  }
  if (!ownerId) {
    // Demo fallback: allow reset for the email even if never logged in yet
    if (!email.includes("@")) {
      return { ok: false, error: "Enter the work email on the main account." };
    }
    ownerId = `prov-${email.replace(/[^a-z0-9]+/g, "-")}-pending`;
  }
  if (!email.includes("@")) {
    email = `${ownerId}@provider.local`;
  }

  const code = makeResetCode();
  writePendingReset({
    ownerId,
    email,
    code,
    expiresAt: Date.now() + 15 * 60_000,
  });
  return { ok: true, code, email, ownerId };
}

export function confirmProviderPasswordReset(input: {
  code: string;
  newPassword: string;
  ownerId?: string;
}): { ok: true; ownerId: string } | { ok: false; error: string } {
  const pending = readPendingReset();
  if (!pending) {
    return { ok: false, error: "No reset in progress. Request a new code." };
  }
  if (input.ownerId && input.ownerId !== pending.ownerId) {
    return { ok: false, error: "Reset code does not match this account." };
  }
  if (input.code.trim() !== pending.code) {
    return { ok: false, error: "Incorrect reset code." };
  }
  if (input.newPassword.trim().length < 4) {
    return { ok: false, error: "New password must be at least 4 characters." };
  }
  saveOwnerPassword(pending.ownerId, input.newPassword.trim(), pending.email);
  // If pending id was a placeholder, also store under any known stash id aliases — already saved
  writePendingReset(null);
  return { ok: true, ownerId: pending.ownerId };
}

export type StashedOwnerSession = {
  accountJson: string;
  ownerId: string;
  email?: string;
};

export function stashOwnerForSwitch(account: object, ownerId: string) {
  const email =
    typeof account === "object" && account && "email" in account
      ? String((account as { email?: string }).email ?? "")
      : "";
  if (email.includes("@")) {
    saveOwnerPassword(ownerId, readOwnerPasswords()[ownerId] ?? "", email);
  }
  const payload: StashedOwnerSession = {
    accountJson: JSON.stringify(account),
    ownerId,
    email: email || undefined,
  };
  localStorage.setItem(SWITCH_OWNER_KEY, JSON.stringify(payload));
}

export function peekStashedOwner(): StashedOwnerSession | null {
  try {
    const raw = localStorage.getItem(SWITCH_OWNER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StashedOwnerSession;
  } catch {
    return null;
  }
}

export function clearStashedOwner() {
  localStorage.removeItem(SWITCH_OWNER_KEY);
}

export function takeStashedOwner(): StashedOwnerSession | null {
  const s = peekStashedOwner();
  if (s) clearStashedOwner();
  return s;
}

// --- Legacy pharmacy aliases (compat) ---
export type PharmacyDelegate = ProviderDelegate;
export type DelegateFeature = string;
export const DELEGATE_FEATURES = ["orders", "prescriptions", "inventory", "chat", "support", "finance"] as const;
export const DELEGATE_FEATURE_META = Object.fromEntries(
  featuresForVendor("pharmacy").map((d) => [
    d.id,
    { label: d.label, path: d.path, blurb: d.blurb, required: d.required },
  ]),
);
