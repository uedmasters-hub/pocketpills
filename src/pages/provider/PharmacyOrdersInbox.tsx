import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";
import { delegateDisplayName, logDelegateActivity } from "@/lib/pharmacyDelegates";
import {
  adjustPharmacyOrderLine,
  findInventoryForLine,
  formatCad,
  listPharmacyOrders,
  printPharmacyAddressLabel,
  updatePharmacyOrderStatus,
  type PharmacyAddress,
  type PharmacyOrder,
  type PharmacyOrderLine,
  type RxStatus,
} from "@/lib/pharmacyOps";

const FIELD =
  "h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";

const PARTIAL_FILL_NOTE =
  "User requested for low quantity, refund will be initiated along with the completion";

const STATUS_LABELS: Record<RxStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  declined: "Declined",
};

const TABS: Array<"all" | RxStatus> = [
  "all",
  "new",
  "preparing",
  "ready",
  "completed",
  "declined",
];

function formatAddressInline(a: PharmacyAddress) {
  return [a.line1, a.line2, `${a.city}, ${a.province} ${a.postal}`].filter(Boolean).join(" ");
}

function lineIsShort(orgId: string, line: PharmacyOrderLine) {
  if (line.unavailable) return false;
  const stock = findInventoryForLine(orgId, line);
  return stock != null && stock.onHand < line.qtyRequested;
}

function lineNeedsStockFix(orgId: string, line: PharmacyOrderLine) {
  if (line.unavailable) return false;
  const stock = findInventoryForLine(orgId, line);
  if (!stock) return false;
  return line.qtyFulfilled > stock.onHand;
}

function useOrderActor() {
  const { provider, workspaceId, isDelegate, displayName } = useProvider();
  const log = (action: string, detail: string, orderId?: string) => {
    if (!isDelegate || !provider?.delegateId) return;
    logDelegateActivity({
      orgId: workspaceId,
      delegateId: provider.delegateId,
      delegateName:
        displayName ||
        delegateDisplayName({
          firstName: provider.firstName,
          lastName: provider.lastName,
          username: provider.email.split("@")[0] ?? "staff",
        }),
      action,
      detail,
      orderId,
    });
  };
  return {
    orgId: workspaceId,
    pharmacyName: provider?.orgName?.trim() || "Pharmacy",
    log,
    isDelegate,
  };
}

function statusBadgeClass(status: RxStatus) {
  if (status === "new") {
    return "border border-line px-2 py-0.5 text-2xs font-medium text-ink-tertiary";
  }
  if (status === "declined") {
    return "bg-red-100 px-2 py-0.5 text-2xs font-semibold text-red-800";
  }
  if (status === "completed") {
    return "bg-[color:var(--pp-primary-100)] px-2 py-0.5 text-2xs font-semibold text-[color:var(--pp-primary-950)]";
  }
  return "bg-[color:var(--pp-primary-100)] px-2 py-0.5 text-2xs font-semibold text-[color:var(--pp-primary-950)]";
}

function lineSummary(order: PharmacyOrder) {
  const n = order.lines.length;
  if (n === 1) return order.lines[0].medication;
  return `${order.lines[0]?.medication ?? "Rx"} +${n - 1} more`;
}

function hasAdjustment(order: PharmacyOrder) {
  return order.lines.some((l) => l.unavailable || l.qtyFulfilled < l.qtyRequested);
}

export function PharmacyOrdersInbox() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const { orgId, pharmacyName, log } = useOrderActor();
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<"all" | RxStatus>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  void tick;

  const allOrders = listPharmacyOrders(orgId);
  const counts = TABS.reduce(
    (acc, f) => {
      acc[f] = f === "all" ? allOrders.length : allOrders.filter((o) => o.status === f).length;
      return acc;
    },
    {} as Record<"all" | RxStatus, number>,
  );

  const orders = allOrders.filter((o) => (filter === "all" ? true : o.status === filter));
  const active = activeId ? allOrders.find((o) => o.id === activeId) ?? null : null;

  const refresh = () => setTick((t) => t + 1);

  const setStatus = (id: string, status: RxStatus) => {
    updatePharmacyOrderStatus(orgId, id, status);
    const order = listPharmacyOrders(orgId).find((o) => o.id === id);
    log(
      status === "preparing"
        ? "Accepted order"
        : status === "declined"
          ? "Declined order"
          : status === "ready"
            ? "Marked ready"
            : status === "completed"
              ? "Fulfilled order"
              : "Updated order",
      order ? `${order.rxNumber} · ${order.patientName}` : id,
      id,
    );
    refresh();
    if (status === "preparing" || status === "declined") {
      setActiveId(null);
      setReviewing(false);
    }
  };

  return (
    <div>
      <ProviderBreadcrumb items={[home, { label: tx("Orders") }]} />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={tx("Order status")}>
        {TABS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => {
              setFilter(f);
              setActiveId(null);
              setReviewing(false);
            }}
            className={
              "rounded-full px-3.5 py-1.5 text-sm font-medium capitalize " +
              (filter === f
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
            }
          >
            {tx(f === "all" ? "All" : STATUS_LABELS[f])}
            <span className="ml-1.5 text-2xs opacity-80">({counts[f]})</span>
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-white p-12 text-center text-sm text-ink-tertiary">
          {tx("No orders in this view.")}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => {
            const adjusted = hasAdjustment(o);
            const selected = activeId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setActiveId(o.id);
                  setReviewing(false);
                }}
                className={
                  "group flex flex-col rounded-2xl border bg-white p-4 text-left transition-colors hover:bg-[color:var(--state-hover)] " +
                  (selected
                    ? "border-[color:var(--pp-primary-950)] ring-1 ring-[color:var(--pp-primary-950)]"
                    : "border-line")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-[color:var(--pp-primary-950)]">
                        {o.patientName}
                      </span>
                      <span className={`shrink-0 rounded-full ${statusBadgeClass(o.status)}`}>
                        {tx(STATUS_LABELS[o.status])}
                      </span>
                      {adjusted ? (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-medium text-amber-900">
                          {tx("Adjusted")}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink-tertiary">
                      {o.rxNumber} · {lineSummary(o)}
                    </span>
                  </span>
                </div>

                <p className="mt-2 text-2xs text-ink-tertiary">
                  {o.requestedAt.slice(0, 10)} ·{" "}
                  {tx(o.deliveryMethod === "pickup" ? "Pickup" : "Delivery")} ·{" "}
                  {o.lines.length} {tx(o.lines.length === 1 ? "item" : "items")}
                </p>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
                  <span>
                    <span className="block text-2xs text-ink-tertiary">{tx("Order total")}</span>
                    <span className="font-display text-xl font-medium text-[color:var(--pp-primary-950)] tnum">
                      {o.fee != null ? formatCad(o.fee) : "—"}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-[color:var(--pp-violet)] group-hover:opacity-80">
                    {tx("View →")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {active ? (
        <OrderDetailPanel
          order={listPharmacyOrders(orgId).find((o) => o.id === active.id) ?? active}
          orgId={orgId}
          pharmacyName={pharmacyName}
          reviewing={reviewing}
          onClose={() => {
            setActiveId(null);
            setReviewing(false);
          }}
          onReviewStock={() => setReviewing(true)}
          onStopReview={() => setReviewing(false)}
          onStatus={setStatus}
          onChanged={refresh}
          onLog={log}
        />
      ) : null}
    </div>
  );
}

function OrderDetailPanel({
  order,
  orgId,
  pharmacyName,
  reviewing,
  onClose,
  onReviewStock,
  onStopReview,
  onStatus,
  onChanged,
  onLog,
}: {
  order: PharmacyOrder;
  orgId: string;
  pharmacyName: string;
  reviewing: boolean;
  onClose: () => void;
  onReviewStock: () => void;
  onStopReview: () => void;
  onStatus: (id: string, status: RxStatus) => void;
  onChanged: () => void;
  onLog: (action: string, detail: string, orderId?: string) => void;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const canEdit = order.status === "new" || order.status === "preparing";
  const needsFix = order.lines.some((line) => lineNeedsStockFix(orgId, line));
  const hasUnavailable = order.lines.some((line) => line.unavailable);
  const hasPartial = order.lines.some(
    (line) => !line.unavailable && line.qtyFulfilled < line.qtyRequested,
  );
  const stockHandled = !needsFix && (hasUnavailable || hasPartial);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92dvh,42rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium tracking-wide text-[color:var(--pp-violet)]">
              {order.rxNumber}
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--pp-violet)] underline decoration-[color:var(--pp-violet)]/40 underline-offset-2 hover:opacity-80"
              onClick={() => {
                printPharmacyAddressLabel(order, pharmacyName);
                onLog("Opened prescription", `${order.rxNumber} · ${order.patientName}`, order.id);
              }}
            >
              {tx("Prescription")}
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--pp-violet)] text-white"
                aria-hidden
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6.2 4.8 8.5 9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>

          <h2
            id="order-detail-title"
            className="mt-3 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-[color:var(--pp-primary-950)] sm:text-[2rem]"
          >
            {order.patientName}
          </h2>
          <p className="mt-1.5 text-sm text-ink-secondary">{formatAddressInline(order.address)}</p>

          <ul className="mt-6 overflow-hidden rounded-2xl border border-[color:var(--pp-primary-200)]">
            {order.lines.map((line, i) => (
              <OrderLineRow
                key={line.id}
                orgId={orgId}
                orderId={order.id}
                orderLabel={`${order.rxNumber} · ${line.medication}`}
                line={line}
                reviewing={reviewing && canEdit && lineNeedsStockFix(orgId, line)}
                showDivider={i > 0}
                onChanged={onChanged}
                onLog={onLog}
                onLineResolved={onStopReview}
              />
            ))}
          </ul>
        </div>

        <div className="shrink-0 px-6 pb-6 pt-2 sm:px-8 sm:pb-7">
          <OrderFooter
            order={order}
            canEdit={canEdit}
            needsFix={needsFix}
            stockHandled={stockHandled}
            hasUnavailable={hasUnavailable}
            hasPartial={hasPartial}
            onReviewStock={onReviewStock}
            onAccept={() => onStatus(order.id, "preparing")}
            onDecline={() => onStatus(order.id, "declined")}
            onReady={() => onStatus(order.id, "ready")}
            onComplete={() => onStatus(order.id, "completed")}
            onAdjustInventory={() => {
              onClose();
              nav("/provider/inventory");
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function OrderFooter({
  order,
  canEdit,
  needsFix,
  stockHandled,
  hasUnavailable,
  hasPartial,
  onReviewStock,
  onAccept,
  onDecline,
  onReady,
  onComplete,
  onAdjustInventory,
}: {
  order: PharmacyOrder;
  canEdit: boolean;
  needsFix: boolean;
  stockHandled: boolean;
  hasUnavailable: boolean;
  hasPartial: boolean;
  onReviewStock: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onReady: () => void;
  onComplete: () => void;
  onAdjustInventory: () => void;
}) {
  const { tx } = useI18n();

  let actions: ReactNode = null;

  if (order.status === "new") {
    if (needsFix) {
      actions = (
        <>
          <Button size="sm" className="!h-11 !px-6 !py-0" onClick={onReviewStock}>
            {tx("Review stock")}
          </Button>
          <Button size="sm" variant="outline" className="!h-11 !px-6 !py-0" onClick={onDecline}>
            {tx("Decline")}
          </Button>
        </>
      );
    } else if (stockHandled && hasUnavailable && !hasPartial) {
      actions = (
        <>
          <Button size="sm" className="!h-11 !px-6 !py-0" onClick={onAdjustInventory}>
            {tx("Adjust inventory")}
          </Button>
          <p className="text-sm text-[color:var(--pp-primary-950)]">
            {tx("User informed about the inventory")}
          </p>
        </>
      );
    } else {
      actions = (
        <>
          <Button size="sm" className="!h-11 !px-6 !py-0" onClick={onAccept}>
            {tx("Accept")}
          </Button>
          <Button size="sm" variant="outline" className="!h-11 !px-6 !py-0" onClick={onDecline}>
            {tx("Decline")}
          </Button>
        </>
      );
    }
  } else if (order.status === "preparing") {
    actions = (
      <>
        <Button size="sm" className="!h-11 !px-6 !py-0" onClick={onReady}>
          {tx("Mark ready")}
        </Button>
        {canEdit && needsFix ? (
          <Button size="sm" variant="outline" className="!h-11 !px-6 !py-0" onClick={onReviewStock}>
            {tx("Review stock")}
          </Button>
        ) : null}
      </>
    );
  } else if (order.status === "ready") {
    actions = (
      <Button size="sm" className="!h-11 !px-6 !py-0" onClick={onComplete}>
        {tx("Mark completed")}
      </Button>
    );
  } else {
    actions = (
      <p className="text-sm text-ink-tertiary">
        {tx(STATUS_LABELS[order.status])}
        {order.fee != null ? ` · ${formatFee(order.fee)}` : ""}
      </p>
    );
  }

  const creds = order.prescriberCredentials.trim();
  const doctorLabel = creds
    ? `${order.prescriberName} (${creds})`
    : order.prescriberName;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-3">{actions}</div>
      <div className="ml-auto text-right">
        <p className="text-xs font-medium text-[color:var(--secondary-800)]/70">
          {tx("Prescribed by:")}
        </p>
        <p className="mt-0.5 text-sm font-medium text-[color:var(--secondary-800)]">{doctorLabel}</p>
      </div>
    </div>
  );
}

function OrderLineRow({
  orgId,
  orderId,
  orderLabel,
  line,
  reviewing,
  showDivider,
  onChanged,
  onLog,
  onLineResolved,
}: {
  orgId: string;
  orderId: string;
  orderLabel: string;
  line: PharmacyOrderLine;
  reviewing: boolean;
  showDivider: boolean;
  onChanged: () => void;
  onLog: (action: string, detail: string, orderId?: string) => void;
  onLineResolved: () => void;
}) {
  const { tx } = useI18n();
  const stock = findInventoryForLine(orgId, line);
  const short = lineIsShort(orgId, line);
  const partial =
    !line.unavailable && line.qtyFulfilled < line.qtyRequested && line.qtyFulfilled > 0;
  const [qty, setQty] = useState(
    short && stock ? Math.min(line.qtyRequested, stock.onHand) : line.qtyFulfilled,
  );
  const [reason, setReason] = useState(line.adjustReason);

  useEffect(() => {
    setQty(short && stock ? Math.min(line.qtyRequested, stock.onHand) : line.qtyFulfilled);
    setReason(line.adjustReason);
  }, [line.id, line.qtyFulfilled, line.adjustReason, line.unavailable, short, stock?.onHand]);

  const apply = (patch: {
    qtyFulfilled?: number;
    unavailable?: boolean;
    adjustReason?: string;
  }) => {
    adjustPharmacyOrderLine(orgId, orderId, line.id, patch);
    const detail = patch.unavailable
      ? `${orderLabel} marked unavailable${patch.adjustReason ? ` — ${patch.adjustReason}` : ""}`
      : `${orderLabel} fulfill ${patch.qtyFulfilled ?? line.qtyFulfilled}${
          patch.adjustReason ? ` — ${patch.adjustReason}` : ""
        }`;
    onLog("Adjusted order line", detail, orderId);
    onChanged();
  };

  const commitPartial = () => {
    const next = Math.max(0, Math.min(line.qtyRequested, qty));
    if (next === line.qtyFulfilled && !line.unavailable && (reason.trim() || "") === line.adjustReason) {
      return;
    }
    apply({
      qtyFulfilled: next,
      unavailable: false,
      adjustReason: reason.trim() || (next < line.qtyRequested ? PARTIAL_FILL_NOTE : ""),
    });
    if (stock && next <= stock.onHand) onLineResolved();
  };

  let statusPrimary: ReactNode = null;
  let statusSecondary: ReactNode = null;
  if (line.unavailable) {
    statusSecondary = (
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
        {tx("Not available")}
      </span>
    );
  } else if (short || partial) {
    statusPrimary = stock ? (
      <span className="whitespace-nowrap text-xs font-medium text-amber-900">
        {tx("On hand")}: {stock.onHand} {stock.unit}
      </span>
    ) : null;
    statusSecondary = (
      <span className="inline-flex shrink-0 rounded-full bg-[#F5D98A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-amber-950">
        {tx("Low stock")}
      </span>
    );
  } else {
    statusSecondary = (
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--pp-violet)]/70">
        {tx("Available")}
      </span>
    );
  }

  return (
    <li
      className={
        (showDivider ? "border-t border-[color:var(--pp-primary-200)] " : "") +
        (line.unavailable ? "bg-white" : short || partial ? "bg-[#FBF6E9]" : "bg-white")
      }
    >
      <div
        className={
          "grid grid-cols-1 items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(13.5rem,auto)_6.75rem] " +
          (line.unavailable ? "opacity-55" : "")
        }
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[color:var(--pp-primary-950)]">
            <span>{line.medication}</span>
            {line.skuCode ? (
              <span className="ml-2 font-normal text-ink-tertiary">{line.skuCode}</span>
            ) : null}
          </p>
          {partial && (line.adjustReason || PARTIAL_FILL_NOTE) ? (
            <p className="mt-1 text-2xs leading-snug text-ink-tertiary sm:hidden">
              {line.adjustReason || PARTIAL_FILL_NOTE}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 sm:min-w-[13.5rem]">
          <div className="min-w-0 justify-self-end text-right">{statusPrimary}</div>
          <div className="justify-self-end">{statusSecondary}</div>
        </div>

        <p className="whitespace-nowrap text-sm tabular-nums text-ink-tertiary sm:text-right">
          {(line.unavailable ? line.qtyRequested : line.qtyFulfilled)} / {line.qtyRequested}{" "}
          {line.unit}
        </p>

        {partial && (line.adjustReason || PARTIAL_FILL_NOTE) ? (
          <p className="col-span-full hidden text-2xs leading-snug text-ink-tertiary sm:block">
            {line.adjustReason || PARTIAL_FILL_NOTE}
          </p>
        ) : null}
      </div>

      {reviewing && !line.unavailable ? (
        <div className="grid gap-2 border-t border-amber-200/70 px-4 py-3 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center">
          <input
            type="number"
            min={0}
            max={line.qtyRequested}
            className={FIELD}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 0)}
            onBlur={commitPartial}
            aria-label={tx("Fulfill qty")}
          />
          <input
            className={FIELD}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={tx("Reason - e.g. backorder, damaged stock")}
          />
          <Button
            size="sm"
            className="!h-10 !shrink-0 !px-4 !py-0"
            onClick={() => {
              apply({
                qtyFulfilled: 0,
                unavailable: true,
                adjustReason: reason.trim() || "Out of stock",
              });
              onLineResolved();
            }}
          >
            {tx("Mark unavailable")}
          </Button>
        </div>
      ) : null}
    </li>
  );
}
