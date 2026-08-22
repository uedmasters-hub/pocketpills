import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  getOrders,
  orderTotals,
  typeMeta,
  statusMeta,
  money,
  fmtDate,
  transferStatusLabel,
  labStatusLabel,
  type Order,
  type OrderStatus,
  type OrderType,
} from "@/lib/orders";
import { CareJourneyPage } from "@/pages/care/CareJourneyPage";

const IN_PROGRESS: OrderStatus[] = ["verifying", "processing", "out_for_delivery"];
const CARD = "rounded-2xl border border-line bg-white";
const PILL = "rounded-full px-3 py-1 text-xs font-semibold";

/** Quiet type cue — only a thin left edge, no chips or colored icons. */
const TYPE_RAIL: Record<OrderType, string> = {
  fill: "linear-gradient(180deg, #3D2A7A 0%, #6B5CE7 100%)",
  consultation: "linear-gradient(180deg, #9B93F0 0%, #C8C2FF 100%)",
  refill: "linear-gradient(180deg, #0A5A68 0%, #54C7DA 100%)",
  transfer: "linear-gradient(180deg, #8B7355 0%, #D2C2A8 100%)",
  lab: "linear-gradient(180deg, #2F5D50 0%, #7BC4A8 100%)",
};

const TYPE_SECTIONS: { type: OrderType; title: string }[] = [
  { type: "fill", title: "Prescription fills" },
  { type: "consultation", title: "Consultations" },
  { type: "lab", title: "Lab visits" },
  { type: "refill", title: "Refills" },
  { type: "transfer", title: "Transfers" },
];

function StatusPill({ status, type }: { status: OrderStatus; type?: OrderType }) {
  const { tx } = useI18n();
  const style: Record<OrderStatus, string> = {
    verifying: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]",
    processing: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]",
    out_for_delivery: "bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]",
    delivered: "bg-wellness-subtle text-wellness",
    cancelled: "bg-danger-subtle text-danger",
  };
  const label =
    type === "lab"
      ? labStatusLabel(status)
      : type === "transfer"
        ? transferStatusLabel(status)
        : statusMeta[status].label;
  return <span className={`${PILL} ${style[status]}`}>{tx(label)}</span>;
}

function orderTitle(o: Order, tx: (s: string) => string) {
  if (o.type === "transfer") return o.fromPharmacy ? `${tx("From")} ${o.fromPharmacy}` : tx("Prescription transfer");
  if (o.type === "lab") return o.labName ?? tx("Lab visit");
  const names = o.items.map((i) => i.name);
  if (names.length === 0) return tx(typeMeta[o.type].label);
  if (names.length === 1) return names[0];
  if (names.length === 2) return names.join(" & ");
  return `${names[0]} +${names.length - 1} ${tx("more")}`;
}

function OrderCard({ o }: { o: Order }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const total = orderTotals(o).total;
  const cancelled = o.status === "cancelled";
  const delivered = o.status === "delivered";
  const showDocs = delivered && o.type !== "transfer" && o.type !== "lab";

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => nav(`/orders/${o.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          nav(`/orders/${o.id}`);
        }
      }}
      className={
        `group relative flex cursor-pointer items-center gap-4 overflow-hidden ${CARD} py-4 pl-5 pr-4 transition-colors ` +
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
          <span className="truncate font-semibold text-[color:var(--pp-primary-950)]">{orderTitle(o, tx)}</span>
          <StatusPill status={o.status} type={o.type} />
        </span>
        <span className="mt-1 block truncate text-sm text-ink-tertiary">
          {o.type === "lab"
            ? `${o.visitSlot ?? fmtDate(o.date)} · ${o.items[0]?.name ?? o.id}`
            : `${fmtDate(o.date)} · ${o.id}${
                o.items.length > 1 && o.type !== "transfer"
                  ? ` · ${o.items.map((i) => i.name).join(", ")}`
                  : ""
              }`}
        </span>
      </span>

      {showDocs ? (
        <span className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nav(`/orders/${o.id}/receipt`);
            }}
            className="text-sm font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-70"
          >
            {tx("View receipt")}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nav(`/orders/${o.id}/invoice`);
            }}
            className="text-2xs font-medium text-ink-tertiary transition-colors hover:text-[color:var(--pp-primary-950)]"
          >
            {tx("Invoice")}
          </button>
        </span>
      ) : (
        <span className="shrink-0 text-right">
          <span className="block font-display text-lg font-medium text-[color:var(--pp-primary-950)] tnum">
            {o.type === "transfer" && total === 0 ? tx("Free") : money(total)}
          </span>
          <span className="mt-0.5 block text-2xs text-ink-tertiary">
            {o.type === "transfer"
              ? tx("No charge yet")
              : `${o.items.length} ${o.items.length === 1 ? tx("item") : tx("items")}`}
          </span>
        </span>
      )}
    </div>
  );
}

/* ── History ───────────────────────────────────────────── */
export function OrderHistory() {
  const { tx } = useI18n();
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
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Orders")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          {tx("Order history")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("Track deliveries, lab visits, receipts, and reorders in one place.")}
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
              {counts.progress} {counts.progress === 1 ? tx("order on the way") : tx("orders on the way")}
            </span>
            <span className="mt-0.5 block text-xs text-ink-secondary">
              {tx("Tap to see what’s in progress — free delivery across Canada.")}
            </span>
          </span>
          <span className="shrink-0 text-sm font-medium text-[color:var(--pp-violet)]">{tx("View →")}</span>
        </button>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={tx("Filter orders")}>
          {tabs.map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
              className={
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                (tab === id
                  ? "bg-[color:var(--pp-primary-950)] text-white"
                  : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
              }
            >
              {tx(label)}
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
          {tx("New fill →")}
        </Link>
      </div>

      {list.length === 0 ? (
        <div className={`${CARD} px-6 py-14 text-center`}>
          <p className="font-semibold text-[color:var(--pp-primary-950)]">
            {tab === "all"
              ? tx("No orders yet")
              : tab === "progress"
                ? tx("No in-progress orders")
                : tab === "delivered"
                  ? tx("No delivered orders")
                  : tx("No cancelled orders")}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-tertiary">
            {tab === "all"
              ? tx("When you fill, refill, or transfer a prescription, it will show up here.")
              : tx("Try another filter, or place a new fill.")}
          </p>
          <Link
            to="/fill"
            className="mt-5 inline-flex rounded-full bg-cta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cta-hover"
          >
            {tx("Fill a prescription")}
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
                  {tx(section.title)}
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

export function OrderDetail() {
  return <CareJourneyPage kind="order" />;
}
