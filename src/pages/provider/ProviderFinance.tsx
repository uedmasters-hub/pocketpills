import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Caret } from "@/components/ui";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";
import {
  LEDGER_KIND_LABELS,
  addBankAccount,
  addFunds,
  approveRefund,
  getBankAccount,
  getWallet,
  listAwaitingRefunds,
  listBankAccounts,
  listLedger,
  listRefundRequests,
  maskAccountNumber,
  raiseRefundConcern,
  rejectRefund,
  removeBankAccount,
  requestWithdrawal,
  setPrimaryBankAccount,
  type BankAccount,
  type LedgerEntry,
  type LedgerKind,
  type RefundRequest,
} from "@/lib/providerFinance";
import { formatCad, getRevenueSummary, type RevenuePeriod } from "@/lib/providerRevenue";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const AREA =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

type Tab = "overview" | "wallet" | "bank" | "refunds" | "activity";

export function ProviderFinance() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const orgId = provider?.id ?? "anon";
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const [tab, setTab] = useState<Tab>("wallet");
  const [tick, setTick] = useState(0);
  void tick;

  const refresh = () => setTick((n) => n + 1);
  const wallet = getWallet(orgId);
  const bank = getBankAccount(orgId);
  const banks = listBankAccounts(orgId);
  const ledger = listLedger(orgId);

  const tabs: { id: Tab; label: string }[] = [
    { id: "wallet", label: "Wallet" },
    { id: "bank", label: "Bank account" },
    { id: "refunds", label: "Refunds" },
    { id: "overview", label: "Revenue" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div>
      <ProviderBreadcrumb items={[home, { label: tx("Finance") }]} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={tx("Available")} value={formatCad(wallet.available)} />
        <Stat label={tx("In settlement")} value={formatCad(wallet.pending)} />
        <Stat label={tx("Paid out (lifetime)")} value={formatCad(wallet.lifetimeOut)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label={tx("Finance sections")}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={
              "rounded-full px-3.5 py-1.5 text-sm font-medium " +
              (tab === t.id
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
            }
          >
            {tx(t.label)}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "wallet" ? (
          <WalletPanel
            orgId={orgId}
            wallet={wallet}
            bank={bank}
            onDone={refresh}
            onGoBank={() => setTab("bank")}
          />
        ) : null}
        {tab === "bank" ? <BankPanel orgId={orgId} accounts={banks} onDone={refresh} /> : null}
        {tab === "refunds" ? <RefundPanel orgId={orgId} onDone={refresh} /> : null}
        {tab === "overview" ? <RevenueOverview /> : null}
        {tab === "activity" ? <ActivityPanel ledger={ledger} /> : null}
      </div>
    </div>
  );
}

function WalletPanel({
  orgId,
  wallet,
  bank,
  onDone,
  onGoBank,
}: {
  orgId: string;
  wallet: ReturnType<typeof getWallet>;
  bank: BankAccount | null;
  onDone: () => void;
  onGoBank: () => void;
}) {
  const { tx } = useI18n();
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [topupAmt, setTopupAmt] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const flash = (ok: string | null, error: string | null) => {
    setMsg(ok);
    setErr(error);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Withdraw")}
        </h2>
        <p className="mt-1 text-sm text-ink-tertiary">
          {bank
            ? tx("Send available funds to {bank} · {mask}")
                .replace("{bank}", bank.institutionName || tx("your bank"))
                .replace("{mask}", maskAccountNumber(bank.accountNumber))
            : tx("Add a bank account first to withdraw.")}
        </p>
        {!bank ? (
          <button
            type="button"
            className="mt-4 text-sm font-medium text-[color:var(--pp-violet)]"
            onClick={onGoBank}
          >
            {tx("Set up bank account")} →
          </button>
        ) : (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1">
              <span className={LABEL}>{tx("Amount (CAD)")}</span>
              <input
                className={FIELD}
                type="number"
                min={20}
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
                placeholder="100"
              />
            </label>
            <Button
              onClick={() => {
                const res = requestWithdrawal(orgId, Number(withdrawAmt));
                if (!res.ok) flash(null, res.error);
                else {
                  flash(tx("Withdrawal sent"), null);
                  setWithdrawAmt("");
                  onDone();
                }
              }}
            >
              {tx("Withdraw")}
            </Button>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {[50, 100, 250, wallet.available].filter((n, i, a) => n > 0 && a.indexOf(n) === i).map((n) => (
            <button
              key={n}
              type="button"
              className="rounded-full border border-line px-3 py-1 text-2xs font-medium text-[color:var(--pp-primary-950)]"
              onClick={() => setWithdrawAmt(String(Math.floor(n)))}
            >
              {n === wallet.available ? tx("Max") : formatCad(n)}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Add funds")}
        </h2>
        <p className="mt-1 text-sm text-ink-tertiary">
          {tx("Top up your wallet for refunds or adjustments (demo).")}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className={LABEL}>{tx("Amount (CAD)")}</span>
            <input
              className={FIELD}
              type="number"
              min={10}
              value={topupAmt}
              onChange={(e) => setTopupAmt(e.target.value)}
              placeholder="50"
            />
          </label>
          <Button
            variant="secondary"
            onClick={() => {
              const res = addFunds(orgId, Number(topupAmt));
              if (!res.ok) flash(null, res.error);
              else {
                flash(tx("Funds added"), null);
                setTopupAmt("");
                onDone();
              }
            }}
          >
            {tx("Add funds")}
          </Button>
        </div>
      </section>

      {(msg || err) && (
        <p
          className={
            "lg:col-span-2 text-sm font-medium " +
            (err ? "text-red-600" : "text-[color:var(--pp-green)]")
          }
        >
          {err || msg}
        </p>
      )}

      <p className="lg:col-span-2 text-2xs text-ink-tertiary">
        {tx("Demo only — no real bank transfers. Lifetime in")}: {formatCad(wallet.lifetimeIn)}.
      </p>
    </div>
  );
}

function BankPanel({
  orgId,
  accounts,
  onDone,
}: {
  orgId: string;
  accounts: BankAccount[];
  onDone: () => void;
}) {
  const { tx } = useI18n();
  const [adding, setAdding] = useState(accounts.length === 0);
  const [makePrimary, setMakePrimary] = useState(accounts.length === 0);
  const [form, setForm] = useState({
    accountHolder: "",
    institutionName: "",
    transitNumber: "",
    institutionNumber: "",
    accountNumber: "",
    accountType: "chequing" as "chequing" | "savings",
  });
  const [flash, setFlash] = useState<string | null>(null);

  const patch = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const ready =
    form.accountHolder.trim() &&
    form.institutionName.trim() &&
    form.transitNumber.replace(/\D/g, "").length >= 5 &&
    form.institutionNumber.replace(/\D/g, "").length >= 3 &&
    form.accountNumber.replace(/\D/g, "").length >= 5;

  const resetForm = () => {
    setForm({
      accountHolder: "",
      institutionName: "",
      transitNumber: "",
      institutionNumber: "",
      accountNumber: "",
      accountType: "chequing",
    });
    setMakePrimary(false);
  };

  const showFlash = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2000);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <header>
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Payout bank accounts")}
        </h2>
        <p className="mt-1 text-sm text-ink-tertiary">
          {tx("Add multiple CAD accounts and set which one receives withdrawals.")}
        </p>
        {flash ? (
          <p className="mt-2 text-sm font-medium text-[color:var(--pp-green)]">{flash}</p>
        ) : null}
      </header>

      {accounts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-ink-tertiary">
          {tx("No accounts yet. Add your first payout account below.")}
        </p>
      ) : (
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className={
                "flex flex-wrap items-center gap-3 rounded-2xl border bg-white px-4 py-3 " +
                (a.primary ? "border-[color:var(--pp-primary-950)]" : "border-line")
              }
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[color:var(--pp-primary-950)]">
                    {a.institutionName || tx("Bank")}
                  </p>
                  {a.primary ? (
                    <span className="rounded-full bg-[color:var(--pp-primary-950)] px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-white">
                      {tx("Primary")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm text-ink-tertiary">
                  {a.accountHolder} · {maskAccountNumber(a.accountNumber)} ·{" "}
                  {tx(a.accountType === "savings" ? "Savings" : "Chequing")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {!a.primary ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="!h-8 !px-3.5 !py-0 text-xs"
                    onClick={() => {
                      setPrimaryBankAccount(orgId, a.id);
                      showFlash(tx("Primary account updated"));
                      onDone();
                    }}
                  >
                    {tx("Set primary")}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="!h-8 !px-3.5 !py-0 text-xs"
                  onClick={() => {
                    removeBankAccount(orgId, a.id);
                    showFlash(tx("Account removed"));
                    onDone();
                  }}
                >
                  {tx("Remove")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!adding ? (
        <Button
          size="sm"
          variant="outline"
          className="!h-9 !px-4 !py-0"
          onClick={() => {
            setAdding(true);
            setMakePrimary(accounts.length === 0);
            resetForm();
          }}
        >
          {tx("Add account")}
        </Button>
      ) : (
        <section className="rounded-2xl border border-line bg-white p-5">
          <h3 className="text-sm font-semibold text-[color:var(--pp-primary-950)]">
            {tx("New account")}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={LABEL}>{tx("Account holder")}</span>
              <input
                className={FIELD}
                value={form.accountHolder}
                onChange={(e) => patch({ accountHolder: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={LABEL}>{tx("Bank / institution name")}</span>
              <input
                className={FIELD}
                value={form.institutionName}
                onChange={(e) => patch({ institutionName: e.target.value })}
                placeholder={tx("e.g. TD Canada Trust")}
              />
            </label>
            <label className="block">
              <span className={LABEL}>{tx("Transit (5)")}</span>
              <input
                className={FIELD}
                value={form.transitNumber}
                onChange={(e) => patch({ transitNumber: e.target.value })}
                inputMode="numeric"
              />
            </label>
            <label className="block">
              <span className={LABEL}>{tx("Institution (3)")}</span>
              <input
                className={FIELD}
                value={form.institutionNumber}
                onChange={(e) => patch({ institutionNumber: e.target.value })}
                inputMode="numeric"
              />
            </label>
            <label className="block">
              <span className={LABEL}>{tx("Account number")}</span>
              <input
                className={FIELD}
                value={form.accountNumber}
                onChange={(e) => patch({ accountNumber: e.target.value })}
                inputMode="numeric"
              />
            </label>
            <label className="block">
              <span className={LABEL}>{tx("Account type")}</span>
              <select
                className={FIELD}
                value={form.accountType}
                onChange={(e) => patch({ accountType: e.target.value as "chequing" | "savings" })}
              >
                <option value="chequing">{tx("Chequing")}</option>
                <option value="savings">{tx("Savings")}</option>
              </select>
            </label>
          </div>

          {accounts.length > 0 ? (
            <label className="mt-4 flex items-center gap-2 text-sm text-[color:var(--pp-primary-950)]">
              <input
                type="checkbox"
                checked={makePrimary}
                onChange={(e) => setMakePrimary(e.target.checked)}
                className="h-4 w-4 rounded border-line"
              />
              {tx("Set as primary for withdrawals")}
            </label>
          ) : (
            <p className="mt-4 text-2xs text-ink-tertiary">
              {tx("This will be your primary payout account.")}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="!h-9 !px-4 !py-0"
              disabled={!ready}
              onClick={() => {
                addBankAccount(orgId, { ...form, makePrimary: makePrimary || accounts.length === 0 });
                resetForm();
                setAdding(false);
                showFlash(tx("Account added"));
                onDone();
              }}
            >
              {tx("Save account")}
            </Button>
            {accounts.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                className="!h-9 !px-4 !py-0"
                onClick={() => {
                  setAdding(false);
                  resetForm();
                }}
              >
                {tx("Cancel")}
              </Button>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

function RefundPanel({ orgId, onDone }: { orgId: string; onDone: () => void }) {
  const { tx } = useI18n();
  const [flash, setFlash] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [concernText, setConcernText] = useState("");
  const awaiting = listAwaitingRefunds(orgId);
  const recent = listRefundRequests(orgId).filter((r) => r.status !== "awaiting");
  const held = awaiting.reduce((s, r) => s + r.refundableAmount, 0);

  const flashMsg = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2400);
  };

  const onApprove = (id: string) => {
    const res = approveRefund(orgId, id);
    if (!res.ok) {
      flashMsg(res.error);
      return;
    }
    flashMsg(tx("Refund approved — shipping to patient"));
    setExpandedId(null);
    onDone();
  };

  const onReject = (id: string) => {
    const res = rejectRefund(orgId, id);
    if (!res.ok) {
      flashMsg(res.error);
      return;
    }
    flashMsg(tx("Refund rejected — hold released"));
    setExpandedId(null);
    onDone();
  };

  const onConcern = (id: string) => {
    const res = raiseRefundConcern(orgId, id, concernText);
    if (!res.ok) {
      flashMsg(res.error);
      return;
    }
    flashMsg(tx("Concern sent to platform for review"));
    setExpandedId(null);
    setConcernText("");
    onDone();
  };

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Refunds to review")}
        </h2>
        <p className="mt-1 max-w-xl text-sm text-ink-tertiary">
          {tx("Approve or reject quickly — expand a row for breakup and to raise a concern.")}{" "}
          {held > 0 ? (
            <span className="font-medium text-[color:var(--pp-primary-950)]">
              {tx("Held")}: {formatCad(held)}
            </span>
          ) : null}
        </p>
        {flash ? (
          <p className="mt-2 text-sm font-medium text-[color:var(--pp-green)]">{flash}</p>
        ) : null}
      </header>

      {awaiting.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-5 py-10 text-center text-sm text-ink-tertiary">
          {tx("No refunds waiting for approval.")}
        </div>
      ) : (
        <ul className="space-y-2">
          {awaiting.map((r) => (
            <RefundReviewCard
              key={r.id}
              request={r}
              expanded={expandedId === r.id}
              concernText={concernText}
              onConcernText={setConcernText}
              onToggleExpand={() => {
                setExpandedId((cur) => (cur === r.id ? null : r.id));
                setConcernText("");
              }}
              onApprove={() => onApprove(r.id)}
              onReject={() => onReject(r.id)}
              onSubmitConcern={() => onConcern(r.id)}
            />
          ))}
        </ul>
      )}

      {recent.length > 0 ? (
        <section className="mt-8">
          <h3 className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Resolved")}</h3>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {recent.slice(0, 8).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <div>
                  <p className="font-medium text-[color:var(--pp-primary-950)]">
                    {r.serviceId} · {r.service}
                  </p>
                  <p className="text-2xs text-ink-tertiary">
                    {r.patientName}
                    {r.concernReason ? ` · ${tx("Concern")}: ${r.concernReason}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium tnum text-[color:var(--pp-primary-950)]">
                    {formatCad(r.refundableAmount)}
                  </p>
                  <p className="text-2xs capitalize text-ink-tertiary">
                    {tx(r.status === "concern" ? "With platform" : r.status === "declined" ? "Rejected" : r.status)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function RefundReviewCard({
  request: r,
  expanded,
  concernText,
  onConcernText,
  onToggleExpand,
  onApprove,
  onReject,
  onSubmitConcern,
}: {
  request: RefundRequest;
  expanded: boolean;
  concernText: string;
  onConcernText: (v: string) => void;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSubmitConcern: () => void;
}) {
  const { tx } = useI18n();

  return (
    <li className="rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
        <p className="min-w-0 flex-1 truncate text-sm text-[color:var(--pp-primary-950)]">
          <span className="font-medium">{r.serviceId}</span>
          <span className="text-ink-tertiary"> — </span>
          <span>{r.service}</span>
          <span className="ml-1.5 font-medium tnum">({formatCad(r.refundableAmount)})</span>
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" className="!h-8 !px-3.5 !py-0 text-xs" onClick={onApprove}>
            {tx("Approve")}
          </Button>
          <Button size="sm" variant="outline" className="!h-8 !px-3.5 !py-0 text-xs" onClick={onReject}>
            {tx("Reject")}
          </Button>
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? tx("Collapse") : tx("Expand")}
            onClick={onToggleExpand}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-100)]"
          >
            <Caret open={expanded} />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-line px-4 py-4">
          <p className="text-sm text-ink-secondary">
            {r.patientName} · {r.reason}
          </p>
          <p className="mt-1 text-2xs text-ink-tertiary">
            {tx("Requested")} {new Date(r.requestedAt).toLocaleString()}
          </p>

          <div className="mt-4 rounded-xl border border-line bg-[color:var(--pp-primary-100)]/30 px-4 py-3">
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {tx("Price breakup")}
            </p>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-secondary">{tx("Original charge")}</dt>
                <dd className="tnum font-medium text-[color:var(--pp-primary-950)]">
                  {formatCad(r.originalCharge)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-secondary">{tx("Platform commission")}</dt>
                <dd className="tnum text-ink-tertiary">−{formatCad(r.platformCommission)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-secondary">{tx("Other deductions")}</dt>
                <dd className="tnum text-ink-tertiary">−{formatCad(r.otherDeductions)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-2">
                <dt className="font-medium text-[color:var(--pp-primary-950)]">{tx("Refundable (held)")}</dt>
                <dd className="tnum font-semibold text-[color:var(--pp-primary-950)]">
                  {formatCad(r.refundableAmount)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className={LABEL}>{tx("Raise concern for platform")}</span>
              <textarea
                className={AREA}
                rows={2}
                value={concernText}
                onChange={(e) => onConcernText(e.target.value)}
                placeholder={tx("Explain what needs platform review…")}
              />
            </label>
            <Button
              size="sm"
              variant="secondary"
              className="!h-9 !px-4 !py-0"
              disabled={!concernText.trim()}
              onClick={onSubmitConcern}
            >
              {tx("Send concern")}
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function RevenueOverview() {
  const { tx } = useI18n();
  const [period, setPeriod] = useState<RevenuePeriod>("30d");
  const summary = useMemo(() => getRevenueSummary(period), [period]);
  const maxBar = Math.max(...summary.series.map((p) => p.amount), 1);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["7d", "7 days"],
            ["30d", "30 days"],
            ["90d", "90 days"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPeriod(id)}
            className={
              "rounded-full px-3.5 py-1.5 text-sm font-medium " +
              (period === id
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
            }
          >
            {tx(label)}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label={tx("Period total")} value={formatCad(summary.total)} />
        <Stat label={tx("Completed jobs")} value={String(summary.completedCount)} />
        <Stat label={tx("Avg. ticket")} value={formatCad(summary.averageTicket)} />
      </div>
      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Daily trend")}
        </h2>
        <div className="mt-6 flex h-40 items-end gap-1.5 sm:gap-2">
          {summary.series.map((p) => (
            <div key={p.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div
                className="w-full max-w-[2rem] rounded-t-md bg-[color:var(--pp-violet)]/80"
                style={{ height: `${Math.max(8, (p.amount / maxBar) * 100)}%` }}
                title={formatCad(p.amount)}
              />
              <span className="truncate text-[10px] text-ink-tertiary">{p.label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Top services")}
        </h2>
        <ul className="mt-4 divide-y divide-line">
          {summary.topServices.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-[color:var(--pp-primary-950)]">{s.name}</p>
                <p className="text-2xs text-ink-tertiary">
                  {s.count} {tx("jobs")}
                </p>
              </div>
              <p className="font-medium text-[color:var(--pp-primary-950)]">{formatCad(s.amount)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ActivityPanel({ ledger }: { ledger: LedgerEntry[] }) {
  const { tx } = useI18n();
  const [filter, setFilter] = useState<"all" | LedgerKind>("all");
  const rows = ledger.filter((e) => (filter === "all" ? true : e.kind === filter));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <FilterChip on={filter === "all"} onClick={() => setFilter("all")}>
          {tx("All")}
        </FilterChip>
        {(Object.keys(LEDGER_KIND_LABELS) as LedgerKind[]).map((k) => (
          <FilterChip key={k} on={filter === k} onClick={() => setFilter(k)}>
            {tx(LEDGER_KIND_LABELS[k])}
          </FilterChip>
        ))}
      </div>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {rows.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-ink-tertiary">{tx("No activity yet.")}</li>
        ) : (
          rows.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-medium text-[color:var(--pp-primary-950)]">{e.label}</p>
                <p className="mt-0.5 text-2xs text-ink-tertiary">
                  {tx(LEDGER_KIND_LABELS[e.kind])} · {tx(e.status)} ·{" "}
                  {new Date(e.createdAt).toLocaleString()}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
              <p
                className={
                  "shrink-0 font-medium tnum " +
                  (e.amount >= 0 ? "text-[color:var(--pp-green)]" : "text-[color:var(--pp-primary-950)]")
                }
              >
                {e.amount >= 0 ? "+" : ""}
                {formatCad(e.amount)}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function FilterChip({
  children,
  on,
  onClick,
}: {
  children: React.ReactNode;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-2xs font-semibold " +
        (on
          ? "bg-[color:var(--pp-primary-950)] text-white"
          : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
      }
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-4">
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">{value}</p>
    </div>
  );
}
