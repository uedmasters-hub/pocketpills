import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  getOrders,
  getOrder,
  orderTotals,
  typeMeta,
  statusMeta,
  money,
  fmtDate,
  transferStatusLabel,
  transferStepIndex,
  TRANSFER_TRACK_STEPS,
  TRANSFER_HINTS,
  canCancelOrder,
  cancelOrder,
  type Order,
  type OrderStatus,
  type OrderType,
} from "@/lib/orders";

const IN_PROGRESS: OrderStatus[] = ["verifying", "processing", "out_for_delivery"];
const CARD = "rounded-2xl border border-line bg-white";
const PILL = "rounded-full px-3 py-1 text-xs font-semibold";

/** Quiet type cue — only a thin left edge, no chips or colored icons. */
const TYPE_RAIL: Record<OrderType, string> = {
  fill: "linear-gradient(180deg, #3D2A7A 0%, #6B5CE7 100%)",
  consultation: "linear-gradient(180deg, #9B93F0 0%, #C8C2FF 100%)",
  refill: "linear-gradient(180deg, #0A5A68 0%, #54C7DA 100%)",
  transfer: "linear-gradient(180deg, #8B7355 0%, #D2C2A8 100%)",
};

const TYPE_SECTIONS: { type: OrderType; title: string }[] = [
  { type: "fill", title: "Prescription fills" },
  { type: "consultation", title: "Consultations" },
  { type: "refill", title: "Refills" },
  { type: "transfer", title: "Transfers" },
];

function StatusPill({ status }: { status: OrderStatus }) {
  const style: Record<OrderStatus, string> = {
    verifying: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]",
    processing: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]",
    out_for_delivery: "bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]",
    delivered: "bg-wellness-subtle text-wellness",
    cancelled: "bg-danger-subtle text-danger",
  };
  return <span className={`${PILL} ${style[status]}`}>{statusMeta[status].label}</span>;
}

function orderTitle(o: Order) {
  if (o.type === "transfer") return o.fromPharmacy ? `From ${o.fromPharmacy}` : "Prescription transfer";
  const names = o.items.map((i) => i.name);
  if (names.length === 0) return typeMeta[o.type].label;
  if (names.length === 1) return names[0];
  if (names.length === 2) return names.join(" & ");
  return `${names[0]} +${names.length - 1} more`;
}

function OrderCard({ o }: { o: Order }) {
  const total = orderTotals(o).total;
  const cancelled = o.status === "cancelled";

  return (
    <Link
      to={`/orders/${o.id}`}
      className={
        `group relative flex items-center gap-4 overflow-hidden ${CARD} py-4 pl-5 pr-4 transition-colors ` +
        "hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)] sm:gap-6 sm:py-5 sm:pl-6 sm:pr-5 " +
        (cancelled ? "opacity-70" : "")
      }
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: TYPE_RAIL[o.type] }}
        aria-hidden
      />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-[color:var(--pp-primary-950)]">{orderTitle(o)}</span>
          <StatusPill status={o.status} />
        </span>
        <span className="mt-1 block truncate text-sm text-ink-tertiary">
          {fmtDate(o.date)} · {o.id}
          {o.items.length > 1 && o.type !== "transfer"
            ? ` · ${o.items.map((i) => i.name).join(", ")}`
            : ""}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block font-display text-lg font-medium text-[color:var(--pp-primary-950)] tnum">
          {o.type === "transfer" && total === 0 ? "Free" : money(total)}
        </span>
        <span className="mt-0.5 block text-2xs text-ink-tertiary">
          {o.type === "transfer"
            ? "No charge yet"
            : `${o.items.length} item${o.items.length === 1 ? "" : "s"}`}
        </span>
      </span>
    </Link>
  );
}

/* ── History ───────────────────────────────────────────── */
export function OrderHistory() {
  const [tab, setTab] = useState<"all" | "progress" | "delivered" | "cancelled">("all");
  const orders = getOrders();

  const counts = useMemo(() => {
    const progress = orders.filter((o) => IN_PROGRESS.includes(o.status)).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    return { all: orders.length, progress, delivered, cancelled };
  }, [orders]);

  const list = orders.filter((o) => {
    if (tab === "progress") return IN_PROGRESS.includes(o.status);
    if (tab === "delivered") return o.status === "delivered";
    if (tab === "cancelled") return o.status === "cancelled";
    return true;
  });

  const grouped = useMemo(() => {
    return TYPE_SECTIONS.map((section) => ({
      ...section,
      items: list.filter((o) => o.type === section.type),
    })).filter((s) => s.items.length > 0);
  }, [list]);

  const tabs = [
    ["all", "All", counts.all],
    ["progress", "In progress", counts.progress],
    ["delivered", "Delivered", counts.delivered],
    ["cancelled", "Cancelled", counts.cancelled],
  ] as const;

  return (
    <div>
      <header className="mb-6">
        <p className="pp-caps text-[color:var(--pp-violet)]">Orders</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          Order history
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          Track deliveries, reopen receipts, and reorder medications in one place.
        </p>
      </header>

      {counts.progress > 0 && (
        <button
          type="button"
          onClick={() => setTab("progress")}
          className={
            "mb-6 flex w-full items-center justify-between gap-4 rounded-2xl border border-line " +
            "bg-[color:var(--pp-primary-200)] px-5 py-4 text-left transition-opacity hover:opacity-90"
          }
        >
          <span>
            <span className="block text-sm font-semibold text-[color:var(--pp-primary-950)]">
              {counts.progress} order{counts.progress === 1 ? "" : "s"} on the way
            </span>
            <span className="mt-0.5 block text-xs text-ink-secondary">
              Tap to see what’s in progress — free delivery across Canada.
            </span>
          </span>
          <span className="shrink-0 text-sm font-medium text-[color:var(--pp-violet)]">View →</span>
        </button>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter orders">
          {tabs.map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                (tab === id
                  ? "bg-[color:var(--pp-primary-950)] text-white"
                  : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
              }
            >
              {label}
              <span
                className={
                  "tnum rounded-full px-1.5 py-0.5 text-2xs font-semibold " +
                  (tab === id ? "bg-white/20 text-white" : "bg-white text-ink-tertiary")
                }
              >
                {count}
              </span>
            </button>
          ))}
        </div>
        <Link
          to="/fill"
          className="text-sm font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-70"
        >
          New fill →
        </Link>
      </div>

      {list.length === 0 ? (
        <div className={`${CARD} px-6 py-14 text-center`}>
          <p className="font-semibold text-[color:var(--pp-primary-950)]">
            {tab === "all"
              ? "No orders yet"
              : tab === "progress"
                ? "No in-progress orders"
                : tab === "delivered"
                  ? "No delivered orders"
                  : "No cancelled orders"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-tertiary">
            {tab === "all"
              ? "When you fill, refill, or transfer a prescription, it will show up here."
              : "Try another filter, or place a new fill."}
          </p>
          <Link
            to="/fill"
            className="mt-5 inline-flex rounded-full bg-cta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cta-hover"
          >
            Fill a prescription
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((section) => (
            <section key={section.type} aria-labelledby={`orders-${section.type}`}>
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="h-4 w-1 shrink-0 rounded-full"
                  style={{ background: TYPE_RAIL[section.type] }}
                  aria-hidden
                />
                <h2
                  id={`orders-${section.type}`}
                  className="text-sm font-semibold text-[color:var(--pp-primary-950)]"
                >
                  {section.title}
                </h2>
                <span className="text-2xs text-ink-tertiary tnum">{section.items.length}</span>
              </div>
              <div className="space-y-2">
                {section.items.map((o) => (
                  <OrderCard key={o.id} o={o} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Detail ────────────────────────────────────────────── */
function SummaryPanel({
  o,
  totals,
  isTransfer,
}: {
  o: Order;
  totals: ReturnType<typeof orderTotals>;
  isTransfer: boolean;
}) {
  const nav = useNavigate();
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_48px_rgba(24,7,48,0.07)]">
      <div
        className="px-5 py-4"
        style={{ background: TYPE_RAIL[o.type] }}
      >
        <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-white/75">
          {o.status === "cancelled" ? "Order total" : isTransfer ? "Due now" : "Total paid"}
        </p>
        <p className="mt-1 font-display text-3xl font-medium leading-none text-white tnum">
          {isTransfer ? "$0.00" : money(totals.total)}
        </p>
      </div>

      <div className="space-y-2 px-5 py-4 text-sm">
        {isTransfer ? (
          <>
            <Row k="Transfer fee" v="FREE" tone />
            <Row k="Delivery" v="FREE" tone />
          </>
        ) : (
          <>
            <Row k="Subtotal" v={money(totals.subtotal)} />
            <Row k="Dispensing fee" v={money(totals.dispensing)} />
            <Row k="Delivery" v="FREE" tone />
            {totals.insurance > 0 && <Row k="Insurance" v={`−${money(totals.insurance)}`} tone />}
          </>
        )}
      </div>

      <div className="border-t border-line px-5 py-4">
        <p className="text-2xs text-ink-tertiary">
          {isTransfer
            ? `Card on file ····${o.payment.cardLast4} — charged only after you approve a fill.`
            : o.payment.method === "insurance"
              ? "Billed to insurance"
              : o.payment.method === "mixed"
                ? `Insurance + Visa ····${o.payment.cardLast4}`
                : `Visa ····${o.payment.cardLast4}`}
        </p>

        {!isTransfer && o.status !== "cancelled" && (
          <div className="mt-4 flex flex-col gap-2">
            <Button size="sm" variant="secondary" fullWidth onClick={() => nav(`/orders/${o.id}/receipt`)}>
              View receipt
            </Button>
            <Button size="sm" variant="ghost" fullWidth onClick={() => nav(`/orders/${o.id}/invoice`)}>
              Download invoice
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [o, setO] = useState(() => getOrder(id));
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    setO(getOrder(id));
    setConfirmCancel(false);
  }, [id]);

  if (!o) {
    return (
      <div className={`${CARD} p-12 text-center`}>
        <p className="font-semibold text-[color:var(--pp-primary-950)]">Order not found</p>
        <Link to="/orders" className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">
          Back to order history
        </Link>
      </div>
    );
  }

  const totals = orderTotals(o);
  const isTransfer = o.type === "transfer";
  const cancellable = canCancelOrder(o);
  const steps = isTransfer
    ? [...TRANSFER_TRACK_STEPS]
    : ["Order placed", "Processing", "Out for delivery", "Delivered"];
  const statusOrder: OrderStatus[] = ["verifying", "processing", "out_for_delivery", "delivered"];
  const cur = isTransfer
    ? transferStepIndex(o.status)
    : o.status === "cancelled"
      ? 0
      : statusOrder.indexOf(o.status);

  const onCancel = () => {
    const next = cancelOrder(o.id);
    if (next) {
      setO(next);
      setConfirmCancel(false);
    }
  };

  const statusLabel =
    isTransfer && o.status !== "cancelled" ? transferStatusLabel(o.status) : statusMeta[o.status].label;

  return (
    <div>
      <Link
        to={isTransfer ? "/pharmacy" : "/orders"}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {isTransfer ? "Pharmacy" : "Order history"}
      </Link>

      {/*
        lg+: summary as sticky third column (nav + content + summary).
        Below lg, summary sits under the hero so it’s never lost.
      */}
      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 space-y-5">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl border border-line bg-[color:var(--pp-primary-200)]">
            <span
              className="absolute inset-y-0 left-0 w-1.5"
              style={{ background: TYPE_RAIL[o.type] }}
              aria-hidden
            />
            <div className="px-5 py-6 pl-6 sm:px-7 sm:py-7 sm:pl-8">
              <div className="flex flex-wrap items-center gap-2">
                <p className="pp-caps text-[color:var(--pp-violet)]">{typeMeta[o.type].label}</p>
                <StatusPill status={o.status} />
              </div>
              <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] sm:text-4xl">
                {orderTitle(o)}
              </h1>
              <p className="mt-2 text-sm text-ink-secondary">
                {o.id}
                <span className="mx-2 text-ink-tertiary/50">·</span>
                {fmtDate(o.date)}
                {o.fromPharmacy ? (
                  <>
                    <span className="mx-2 text-ink-tertiary/50">·</span>
                    From {o.fromPharmacy}
                  </>
                ) : null}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {!isTransfer && (
                  <Button size="sm" onClick={() => nav("/fill")}>
                    Reorder
                  </Button>
                )}
                {isTransfer && o.status !== "cancelled" && (
                  <Button size="sm" variant="secondary" onClick={() => nav("/messages")}>
                    Message care team
                  </Button>
                )}
                {cancellable && !confirmCancel && (
                  <Button size="sm" variant="outline" onClick={() => setConfirmCancel(true)}>
                    Cancel order
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <SummaryPanel o={o} totals={totals} isTransfer={isTransfer} />
          </div>

          {confirmCancel && cancellable && (
            <div className={`${CARD} p-5`} role="alertdialog" aria-labelledby="cancel-order-title">
              <p id="cancel-order-title" className="font-semibold text-[color:var(--pp-primary-950)]">
                Cancel this order?
              </p>
              <p className="mt-1 text-sm text-ink-secondary">
                {isTransfer
                  ? "We’ll stop contacting your pharmacy. You can start a new transfer anytime."
                  : "We’ll stop processing this fill. You won’t be charged if payment hasn’t settled."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={onCancel}>
                  Yes, cancel order
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirmCancel(false)}>
                  Keep order
                </Button>
              </div>
            </div>
          )}

          {o.status === "cancelled" && (
            <div className={`${CARD} bg-[color:var(--pp-primary-100)] p-5`}>
              <p className="font-semibold text-[color:var(--pp-primary-950)]">This order was cancelled</p>
              <p className="mt-1 text-sm text-ink-secondary">
                Nothing further will ship. Start a new fill whenever you’re ready.
              </p>
              <Button size="sm" className="mt-4" onClick={() => nav(isTransfer ? "/transfer" : "/fill")}>
                {isTransfer ? "Start a transfer" : "Fill a prescription"}
              </Button>
            </div>
          )}

          {/* Vertical timeline — denser, more modern than a sparse stepper */}
          {o.status !== "cancelled" && (
            <section className={`${CARD} p-5 sm:p-6`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
                  Tracking
                </h2>
                <p className="text-sm font-medium text-[color:var(--pp-violet)]">{statusLabel}</p>
              </div>
              <ol className="mt-5 space-y-0">
                {steps.map((label, i) => {
                  const done = i < cur;
                  const active = i === cur;
                  const last = i === steps.length - 1;
                  return (
                    <li key={label} className="relative flex gap-4 pb-6 last:pb-0">
                      {!last && (
                        <span
                          className={
                            "absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-0.5 " +
                            (done ? "bg-[color:var(--pp-primary-950)]" : "bg-line")
                          }
                          aria-hidden
                        />
                      )}
                      <span
                        className={
                          "relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-2xs font-bold " +
                          (done
                            ? "bg-[color:var(--pp-primary-950)] text-white"
                            : active
                              ? "bg-white text-[color:var(--pp-primary-950)] ring-2 ring-[color:var(--pp-primary-950)]"
                              : "border-2 border-line bg-white text-ink-tertiary")
                        }
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p
                          className={
                            "text-sm font-semibold " +
                            (i > cur ? "text-ink-tertiary" : "text-[color:var(--pp-primary-950)]")
                          }
                        >
                          {label}
                        </p>
                        {active && (
                          <p className="mt-0.5 text-xs text-ink-secondary">
                            {isTransfer
                              ? "We’re working on this step now."
                              : i === 2
                                ? "Your package is on its way."
                                : "In progress with our pharmacy team."}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {isTransfer && o.status !== "cancelled" && (
            <section className={`${CARD} p-5 sm:p-6`}>
              <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
                What happens next
              </h2>
              <p className="mt-1 text-sm text-ink-tertiary">While we complete your transfer.</p>
              <div className="mt-4 space-y-0">
                {TRANSFER_HINTS.map((h, i) => {
                  const done = i < cur;
                  const active = i === Math.min(cur, TRANSFER_HINTS.length - 1);
                  return (
                    <div
                      key={h.title}
                      className={
                        "flex gap-3 py-3 " +
                        (i > 0 ? "border-t border-line " : "") +
                        (active ? "" : done ? "opacity-70" : "opacity-45")
                      }
                    >
                      <span
                        className={
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold tnum " +
                          (done
                            ? "bg-[color:var(--pp-primary-950)] text-white"
                            : active
                              ? "bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)] ring-2 ring-[color:var(--pp-primary-950)]"
                              : "bg-[color:var(--pp-primary-100)] text-ink-tertiary")
                        }
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{h.title}</p>
                          <span className="text-2xs text-ink-tertiary">{h.when}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-ink-secondary">{h.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className={`${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
                {isTransfer ? "Transfer details" : "Items"}
              </h2>
              {!isTransfer && (
                <span className="text-2xs text-ink-tertiary tnum">
                  {o.items.length} item{o.items.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {isTransfer ? (
              <div className="space-y-4 px-5 py-5 text-sm">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                    From pharmacy
                  </p>
                  <p className="mt-1 font-medium text-[color:var(--pp-primary-950)]">
                    {o.fromPharmacy ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">Note</p>
                  <p className="mt-1 text-ink-secondary">
                    Transfers are free. Your card is not charged until you approve a fill after the
                    transfer completes.
                  </p>
                </div>
              </div>
            ) : (
              o.items.map((it) => (
                <div
                  key={it.name}
                  className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--pp-primary-100)] text-sm font-semibold text-[color:var(--pp-primary-950)]"
                    aria-hidden
                  >
                    Rx
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[color:var(--pp-primary-950)]">
                      {it.name}{" "}
                      <span className="font-medium text-ink-secondary">{it.strength}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-ink-tertiary">Qty {it.qty}</p>
                  </div>
                  <span className="shrink-0 font-display text-base font-medium text-[color:var(--pp-primary-950)] tnum">
                    {money(it.qty * it.unitPrice)}
                  </span>
                </div>
              ))
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className={`${CARD} p-5`}>
              <p className="pp-caps text-ink-tertiary">
                {isTransfer ? "Deliver to" : o.status === "delivered" ? "Delivered to" : "Ship to"}
              </p>
              <p className="mt-2 font-semibold text-[color:var(--pp-primary-950)]">{o.patient}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-secondary">{o.address}</p>
            </div>
            <div className={`${CARD} p-5`}>
              <p className="pp-caps text-ink-tertiary">Care team</p>
              {o.prescriber && (
                <p className="mt-2 text-sm text-ink-secondary">
                  <span className="text-ink-tertiary">Prescriber</span>
                  <span className="mt-0.5 block font-medium text-[color:var(--pp-primary-950)]">
                    {o.prescriber}
                  </span>
                </p>
              )}
              {o.pharmacist && (
                <p className={`${o.prescriber ? "mt-3" : "mt-2"} text-sm text-ink-secondary`}>
                  <span className="text-ink-tertiary">Pharmacist</span>
                  <span className="mt-0.5 block font-medium text-[color:var(--pp-primary-950)]">
                    {o.pharmacist}
                  </span>
                </p>
              )}
              {!o.prescriber && !o.pharmacist && (
                <p className="mt-2 text-sm text-ink-secondary">Your PocketPills care team is on it.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden w-[20rem] shrink-0 lg:sticky lg:top-28 lg:block lg:self-start xl:w-[22rem]">
          <SummaryPanel o={o} totals={totals} isTransfer={isTransfer} />
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-secondary">{k}</span>
      <span className={tone ? "font-medium text-wellness tnum" : "text-ink tnum"}>{v}</span>
    </div>
  );
}
