/**
 * Provider finance — wallet, bank account, withdrawals, refunds, ledger (demo).
 */

import { formatCad } from "@/lib/providerRevenue";

export type BankAccount = {
  id: string;
  accountHolder: string;
  institutionName: string;
  /** Canadian transit (5) */
  transitNumber: string;
  /** Institution number (3) */
  institutionNumber: string;
  accountNumber: string;
  accountType: "chequing" | "savings";
  verified: boolean;
  /** Withdrawals use the primary account */
  primary: boolean;
  updatedAt: string;
};

export type BankAccountInput = {
  accountHolder: string;
  institutionName: string;
  transitNumber: string;
  institutionNumber: string;
  accountNumber: string;
  accountType: "chequing" | "savings";
  /** If true, becomes primary (others cleared) */
  makePrimary?: boolean;
};

export type LedgerKind =
  | "earning"
  | "withdrawal"
  | "refund"
  | "topup"
  | "fee"
  | "adjustment";

export type LedgerStatus = "pending" | "completed" | "failed" | "cancelled";

export type LedgerEntry = {
  id: string;
  kind: LedgerKind;
  amount: number;
  /** Signed effect on available balance when completed */
  status: LedgerStatus;
  label: string;
  note?: string;
  createdAt: string;
  completedAt?: string;
};

export type WalletSnapshot = {
  available: number;
  pending: number;
  lifetimeIn: number;
  lifetimeOut: number;
};

const bankKey = (orgId: string) => `pp.provider.bank.${orgId}`;
const ledgerKey = (orgId: string) => `pp.provider.ledger.${orgId}`;
const refundReqKey = (orgId: string) => `pp.provider.refundRequests.${orgId}`;

export type RefundRequestStatus = "awaiting" | "approved" | "concern" | "declined";

/** Patient-initiated refund — amount already reserved; vendor reviews / raises concern. */
export type RefundRequest = {
  id: string;
  /** Short service / booking reference shown in the list */
  serviceId: string;
  patientName: string;
  service: string;
  /** What the patient originally paid */
  originalCharge: number;
  /** Platform take retained (not refunded) */
  platformCommission: number;
  /** Processing / other fees retained */
  otherDeductions: number;
  /** Final amount held and paid to patient on approve */
  refundableAmount: number;
  reason: string;
  requestedAt: string;
  status: RefundRequestStatus;
  resolvedAt?: string;
  concernReason?: string;
};

/** @deprecated use refundableAmount */
function refundHoldAmount(r: RefundRequest): number {
  return r.refundableAmount ?? (r as { amount?: number }).amount ?? 0;
}

function normalizeRefundRequest(raw: Partial<RefundRequest> & { id: string; amount?: number }): RefundRequest {
  const original =
    raw.originalCharge ??
    raw.amount ??
    raw.refundableAmount ??
    0;
  const commission = raw.platformCommission ?? Math.round(original * 0.12);
  const other = raw.otherDeductions ?? Math.min(5, Math.round(original * 0.04));
  const refundable =
    raw.refundableAmount ??
    Math.max(0, original - commission - other);
  return {
    id: raw.id,
    serviceId: raw.serviceId ?? `SRV-${raw.id.slice(-6).toUpperCase()}`,
    patientName: raw.patientName ?? "Patient",
    service: raw.service ?? "Service",
    originalCharge: original,
    platformCommission: commission,
    otherDeductions: other,
    refundableAmount: refundable,
    reason: raw.reason ?? "",
    requestedAt: raw.requestedAt ?? new Date().toISOString(),
    status: (raw.status as RefundRequestStatus) ?? "awaiting",
    resolvedAt: raw.resolvedAt,
    concernReason: raw.concernReason,
  };
}

export const LEDGER_KIND_LABELS: Record<LedgerKind, string> = {
  earning: "Earning",
  withdrawal: "Withdrawal",
  refund: "Refund",
  topup: "Add funds",
  fee: "Platform fee",
  adjustment: "Adjustment",
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedLedger(orgId: string): LedgerEntry[] {
  const now = Date.now();
  const list: LedgerEntry[] = [
    {
      id: `led-${orgId}-1`,
      kind: "earning",
      amount: 890,
      status: "completed",
      label: "Settled consults · last week",
      createdAt: new Date(now - 6 * 86400000).toISOString(),
      completedAt: new Date(now - 6 * 86400000).toISOString(),
    },
    {
      id: `led-${orgId}-2`,
      kind: "fee",
      amount: -45,
      status: "completed",
      label: "Platform fee",
      createdAt: new Date(now - 6 * 86400000).toISOString(),
      completedAt: new Date(now - 6 * 86400000).toISOString(),
    },
    {
      id: `led-${orgId}-3`,
      kind: "withdrawal",
      amount: -250,
      status: "completed",
      label: "Payout to bank · ****4521",
      createdAt: new Date(now - 4 * 86400000).toISOString(),
      completedAt: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      id: `led-${orgId}-4`,
      kind: "refund",
      amount: -79,
      status: "completed",
      label: "Patient refund · Samira Patel",
      note: "Visit cancelled by clinic",
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      completedAt: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      id: `led-${orgId}-5`,
      kind: "earning",
      amount: 420,
      status: "pending",
      label: "In settlement · this week",
      createdAt: new Date(now - 86400000).toISOString(),
    },
    // Holds for refunds awaiting vendor approval (pre-deducted = refundable amount)
    {
      id: `led-${orgId}-hold-1`,
      kind: "refund",
      amount: -75,
      status: "pending",
      label: "Hold · Refund · Jordan Blake",
      note: "Patient cancelled virtual consult",
      createdAt: new Date(now - 5 * 3600000).toISOString(),
    },
    {
      id: `led-${orgId}-hold-2`,
      kind: "refund",
      amount: -41,
      status: "pending",
      label: "Hold · Refund · Riley Okonkwo",
      note: "Lab draw not completed",
      createdAt: new Date(now - 2 * 3600000).toISOString(),
    },
  ];
  writeJson(ledgerKey(orgId), list);
  return list;
}

function seedRefundRequests(orgId: string): RefundRequest[] {
  const now = Date.now();
  const list: RefundRequest[] = [
    normalizeRefundRequest({
      id: `rr-${orgId}-1`,
      serviceId: "SRV-88421",
      patientName: "Jordan Blake",
      service: "Virtual consult",
      originalCharge: 89,
      platformCommission: 11,
      otherDeductions: 3,
      refundableAmount: 75,
      reason: "Patient cancelled virtual consult",
      requestedAt: new Date(now - 5 * 3600000).toISOString(),
      status: "awaiting",
    }),
    normalizeRefundRequest({
      id: `rr-${orgId}-2`,
      serviceId: "SRV-99104",
      patientName: "Riley Okonkwo",
      service: "Lipid panel",
      originalCharge: 49,
      platformCommission: 6,
      otherDeductions: 2,
      refundableAmount: 41,
      reason: "Lab draw not completed",
      requestedAt: new Date(now - 2 * 3600000).toISOString(),
      status: "awaiting",
    }),
    normalizeRefundRequest({
      id: `rr-${orgId}-3`,
      serviceId: "SRV-77219",
      patientName: "Samira Patel",
      service: "Annual health package",
      originalCharge: 79,
      platformCommission: 9,
      otherDeductions: 3,
      refundableAmount: 67,
      reason: "Visit cancelled by clinic",
      requestedAt: new Date(now - 2 * 86400000).toISOString(),
      status: "approved",
      resolvedAt: new Date(now - 2 * 86400000).toISOString(),
    }),
  ];
  writeJson(refundReqKey(orgId), list);
  localStorage.setItem(`${refundReqKey(orgId)}.ver`, "3");
  return list;
}

export function listRefundRequests(orgId: string): RefundRequest[] {
  const ver = localStorage.getItem(`${refundReqKey(orgId)}.ver`);
  const stored = readJson<(Partial<RefundRequest> & { id: string; amount?: number })[]>(refundReqKey(orgId));
  const list =
    !stored || !Array.isArray(stored) || stored.length === 0 || ver !== "3"
      ? seedRefundRequests(orgId)
      : stored.map((r) => normalizeRefundRequest(r)).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  ensureRefundHolds(orgId, list);
  return list;
}

/** Ensure each awaiting refund has a matching pending ledger hold (pre-deduct). */
function ensureRefundHolds(orgId: string, requests: RefundRequest[]) {
  let ledger = listLedger(orgId);
  let changed = false;
  for (const req of requests) {
    if (req.status !== "awaiting" && req.status !== "concern") continue;
    const holdAmt = refundHoldAmount(req);
    const hasHold = ledger.some(
      (e) =>
        e.kind === "refund" &&
        e.status === "pending" &&
        e.amount === -holdAmt &&
        e.label.includes(req.patientName),
    );
    if (hasHold) continue;
    ledger = [
      {
        id: `led-hold-${req.id}`,
        kind: "refund" as const,
        amount: -holdAmt,
        status: "pending" as const,
        label: `Hold · Refund · ${req.patientName}`,
        note: req.reason,
        createdAt: req.requestedAt,
      },
      ...ledger,
    ];
    changed = true;
  }
  if (changed) writeLedger(orgId, ledger);
}

function writeRefundRequests(orgId: string, list: RefundRequest[]) {
  writeJson(refundReqKey(orgId), list);
}

export function listAwaitingRefunds(orgId: string): RefundRequest[] {
  return listRefundRequests(orgId).filter((r) => r.status === "awaiting");
}

export function createVisitRefund(
  orgId: string,
  input: {
    patientName: string;
    service: string;
    originalCharge: number;
    reason: string;
    serviceId?: string;
  },
): RefundRequest {
  const list = listRefundRequests(orgId);
  const req = normalizeRefundRequest({
    id: `ref-visit-${Date.now().toString(36)}`,
    serviceId: input.serviceId ?? `VISIT-${Date.now().toString(36).toUpperCase()}`,
    patientName: input.patientName,
    service: input.service,
    originalCharge: input.originalCharge,
    reason: input.reason,
    requestedAt: new Date().toISOString(),
    status: "awaiting",
  });
  const next = [req, ...list];
  writeRefundRequests(orgId, next);
  ensureRefundHolds(orgId, next);
  return req;
}

function findHold(orgId: string, req: RefundRequest) {
  const holdAmt = refundHoldAmount(req);
  return listLedger(orgId).find(
    (e) =>
      e.kind === "refund" &&
      e.status === "pending" &&
      e.amount === -holdAmt &&
      e.label.includes(req.patientName),
  );
}

/** Approve: release hold into a completed refund (already reserved on wallet). */
export function approveRefund(
  orgId: string,
  requestId: string,
): { ok: true } | { ok: false; error: string } {
  const requests = listRefundRequests(orgId);
  const req = requests.find((r) => r.id === requestId);
  if (!req || (req.status !== "awaiting" && req.status !== "concern")) {
    return { ok: false, error: "Refund is no longer awaiting review" };
  }

  const ledger = listLedger(orgId);
  const hold = findHold(orgId, req);
  const holdAmt = refundHoldAmount(req);

  const nextLedger = hold
    ? ledger.map((e) =>
        e.id === hold.id
          ? {
              ...e,
              status: "completed" as const,
              label: `Patient refund · ${req.patientName}`,
              note: req.reason,
              completedAt: new Date().toISOString(),
            }
          : e,
      )
    : [
        {
          id: `led-${Date.now().toString(36)}`,
          kind: "refund" as const,
          amount: -holdAmt,
          status: "completed" as const,
          label: `Patient refund · ${req.patientName}`,
          note: req.reason,
          createdAt: req.requestedAt,
          completedAt: new Date().toISOString(),
        },
        ...ledger,
      ];

  writeLedger(orgId, nextLedger);
  writeRefundRequests(
    orgId,
    requests.map((r) =>
      r.id === requestId
        ? { ...r, status: "approved" as const, resolvedAt: new Date().toISOString() }
        : r,
    ),
  );
  return { ok: true };
}

/**
 * Raise concern with reason — hold stays reserved; flagged for platform review (stub).
 */
export function raiseRefundConcern(
  orgId: string,
  requestId: string,
  concernReason: string,
): { ok: true } | { ok: false; error: string } {
  const reason = concernReason.trim();
  if (!reason) return { ok: false, error: "Add a reason for the concern" };

  const requests = listRefundRequests(orgId);
  const req = requests.find((r) => r.id === requestId);
  if (!req || req.status !== "awaiting") {
    return { ok: false, error: "Refund is no longer awaiting review" };
  }

  // Keep ledger hold pending; mark request for platform
  writeRefundRequests(
    orgId,
    requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: "concern" as const,
            concernReason: reason,
            resolvedAt: new Date().toISOString(),
          }
        : r,
    ),
  );
  return { ok: true };
}

/** Reject: release the hold back to available balance. */
export function rejectRefund(
  orgId: string,
  requestId: string,
): { ok: true } | { ok: false; error: string } {
  const requests = listRefundRequests(orgId);
  const req = requests.find((r) => r.id === requestId);
  if (!req || req.status !== "awaiting") {
    return { ok: false, error: "Refund is no longer awaiting review" };
  }

  const ledger = listLedger(orgId);
  const hold = findHold(orgId, req);
  if (hold) {
    writeLedger(
      orgId,
      ledger.map((e) =>
        e.id === hold.id
          ? {
              ...e,
              status: "cancelled" as const,
              label: `Refund rejected · ${req.patientName}`,
              completedAt: new Date().toISOString(),
            }
          : e,
      ),
    );
  }

  writeRefundRequests(
    orgId,
    requests.map((r) =>
      r.id === requestId
        ? { ...r, status: "declined" as const, resolvedAt: new Date().toISOString() }
        : r,
    ),
  );
  return { ok: true };
}

/** @deprecated Prefer rejectRefund / raiseRefundConcern */
export function declineRefund(
  orgId: string,
  requestId: string,
): { ok: true } | { ok: false; error: string } {
  return rejectRefund(orgId, requestId);
}

export function listBankAccounts(orgId: string): BankAccount[] {
  const raw = readJson<BankAccount | BankAccount[] | null>(bankKey(orgId));
  if (!raw) return [];
  // Migrate legacy single-object store
  if (!Array.isArray(raw)) {
    const migrated: BankAccount = {
      id: `bank-${Date.now().toString(36)}`,
      accountHolder: raw.accountHolder ?? "",
      institutionName: raw.institutionName ?? "",
      transitNumber: raw.transitNumber ?? "",
      institutionNumber: raw.institutionNumber ?? "",
      accountNumber: raw.accountNumber ?? "",
      accountType: raw.accountType === "savings" ? "savings" : "chequing",
      verified: !!raw.verified,
      primary: true,
      updatedAt: raw.updatedAt ?? new Date().toISOString(),
    };
    writeJson(bankKey(orgId), [migrated]);
    return [migrated];
  }
  const list = raw.map((a, i) => ({
    ...a,
    id: a.id || `bank-${i}`,
    primary: !!a.primary,
  }));
  // Ensure exactly one primary when any accounts exist
  if (list.length > 0 && !list.some((a) => a.primary)) {
    list[0] = { ...list[0], primary: true };
    writeJson(bankKey(orgId), list);
  }
  return list.sort((a, b) => Number(b.primary) - Number(a.primary) || b.updatedAt.localeCompare(a.updatedAt));
}

/** Primary payout account (or null). */
export function getBankAccount(orgId: string): BankAccount | null {
  const list = listBankAccounts(orgId);
  return list.find((a) => a.primary) ?? list[0] ?? null;
}

function writeBankAccounts(orgId: string, list: BankAccount[]) {
  writeJson(bankKey(orgId), list);
}

function normalizeBankFields(input: BankAccountInput) {
  return {
    accountHolder: input.accountHolder.trim(),
    institutionName: input.institutionName.trim(),
    transitNumber: input.transitNumber.replace(/\D/g, "").slice(0, 5),
    institutionNumber: input.institutionNumber.replace(/\D/g, "").slice(0, 3),
    accountNumber: input.accountNumber.replace(/\D/g, "").slice(0, 12),
    accountType: input.accountType,
  };
}

/** Add a new bank account. First account (or makePrimary) becomes primary. */
export function addBankAccount(orgId: string, input: BankAccountInput): BankAccount {
  const list = listBankAccounts(orgId);
  const makePrimary = input.makePrimary || list.length === 0;
  const nextList = makePrimary ? list.map((a) => ({ ...a, primary: false })) : list;
  const created: BankAccount = {
    id: `bank-${Date.now().toString(36)}`,
    ...normalizeBankFields(input),
    verified: true,
    primary: makePrimary,
    updatedAt: new Date().toISOString(),
  };
  writeBankAccounts(orgId, [created, ...nextList]);
  return created;
}

export function updateBankAccount(
  orgId: string,
  id: string,
  input: BankAccountInput,
): BankAccount | null {
  const list = listBankAccounts(orgId);
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  let next = list.map((a) =>
    a.id === id
      ? {
          ...a,
          ...normalizeBankFields(input),
          verified: true,
          updatedAt: new Date().toISOString(),
        }
      : a,
  );
  if (input.makePrimary) {
    next = next.map((a) => ({ ...a, primary: a.id === id }));
  }
  writeBankAccounts(orgId, next);
  return next.find((a) => a.id === id) ?? null;
}

export function setPrimaryBankAccount(orgId: string, id: string): boolean {
  const list = listBankAccounts(orgId);
  if (!list.some((a) => a.id === id)) return false;
  writeBankAccounts(
    orgId,
    list.map((a) => ({ ...a, primary: a.id === id, updatedAt: a.id === id ? new Date().toISOString() : a.updatedAt })),
  );
  return true;
}

export function removeBankAccount(orgId: string, id: string): boolean {
  const list = listBankAccounts(orgId);
  const target = list.find((a) => a.id === id);
  if (!target) return false;
  let next = list.filter((a) => a.id !== id);
  if (target.primary && next.length > 0) {
    next = next.map((a, i) => ({ ...a, primary: i === 0 }));
  }
  writeBankAccounts(orgId, next);
  return true;
}

/** @deprecated Prefer addBankAccount / updateBankAccount */
export function saveBankAccount(
  orgId: string,
  input: BankAccountInput & { verified?: boolean },
): BankAccount {
  return addBankAccount(orgId, { ...input, makePrimary: true });
}

export function maskAccountNumber(n: string) {
  const digits = n.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `••••${digits.slice(-4)}`;
}

export function listLedger(orgId: string): LedgerEntry[] {
  const stored = readJson<LedgerEntry[]>(ledgerKey(orgId));
  if (!stored || !Array.isArray(stored) || stored.length === 0) return seedLedger(orgId);
  return [...stored].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function writeLedger(orgId: string, list: LedgerEntry[]) {
  writeJson(ledgerKey(orgId), list);
}

export function getWallet(orgId: string): WalletSnapshot {
  const ledger = listLedger(orgId);
  let available = 0;
  let pending = 0;
  let lifetimeIn = 0;
  let lifetimeOut = 0;
  for (const e of ledger) {
    if (e.status === "completed") {
      available += e.amount;
      if (e.amount > 0) lifetimeIn += e.amount;
      else lifetimeOut += Math.abs(e.amount);
    } else if (e.status === "pending") {
      if (e.amount > 0) pending += e.amount;
      else {
        // pending withdrawal already reserved from available in UX; still count pending out
        pending += 0;
        available += e.amount; // reserve
      }
    }
  }
  return {
    available: Math.max(0, Math.round(available * 100) / 100),
    pending: Math.max(0, Math.round(pending * 100) / 100),
    lifetimeIn: Math.round(lifetimeIn),
    lifetimeOut: Math.round(lifetimeOut),
  };
}

function append(orgId: string, entry: LedgerEntry) {
  const list = listLedger(orgId);
  writeLedger(orgId, [entry, ...list]);
  return entry;
}

export function addFunds(
  orgId: string,
  amount: number,
  note?: string,
): { ok: true; entry: LedgerEntry } | { ok: false; error: string } {
  if (!Number.isFinite(amount) || amount < 10) {
    return { ok: false, error: "Minimum top-up is $10" };
  }
  if (amount > 10000) return { ok: false, error: "Maximum top-up is $10,000" };
  const entry = append(orgId, {
    id: `led-${Date.now().toString(36)}`,
    kind: "topup",
    amount: Math.round(amount),
    status: "completed",
    label: "Added funds to wallet",
    note,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  });
  return { ok: true, entry };
}

export function requestWithdrawal(
  orgId: string,
  amount: number,
): { ok: true; entry: LedgerEntry } | { ok: false; error: string } {
  const bank = getBankAccount(orgId);
  if (!bank || !bank.accountNumber) {
    return { ok: false, error: "Add a bank account before withdrawing" };
  }
  if (!Number.isFinite(amount) || amount < 20) {
    return { ok: false, error: "Minimum withdrawal is $20" };
  }
  const wallet = getWallet(orgId);
  if (amount > wallet.available) {
    return { ok: false, error: `Available balance is ${formatCad(wallet.available)}` };
  }
  const entry = append(orgId, {
    id: `led-${Date.now().toString(36)}`,
    kind: "withdrawal",
    amount: -Math.round(amount),
    status: "pending",
    label: `Withdrawal to ${maskAccountNumber(bank.accountNumber)}`,
    createdAt: new Date().toISOString(),
  });
  // Demo: auto-complete shortly via status flip on next read would need timer;
  // complete immediately after "processing" for MVP feel — use pending then user can refresh.
  // Complete after append for simpler demo UX:
  completePendingWithdrawal(orgId, entry.id);
  return { ok: true, entry: { ...entry, status: "completed", completedAt: new Date().toISOString() } };
}

function completePendingWithdrawal(orgId: string, id: string) {
  const list = listLedger(orgId).map((e) =>
    e.id === id
      ? { ...e, status: "completed" as const, completedAt: new Date().toISOString() }
      : e,
  );
  writeLedger(orgId, list);
}

export function cancelPending(orgId: string, id: string): boolean {
  const list = listLedger(orgId);
  const idx = list.findIndex((e) => e.id === id && e.status === "pending");
  if (idx < 0) return false;
  list[idx] = { ...list[idx], status: "cancelled", completedAt: new Date().toISOString() };
  writeLedger(orgId, list);
  return true;
}
