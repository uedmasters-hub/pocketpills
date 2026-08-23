import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  isActiveOrder,
  orderTotals,
  statusMeta,
  statusPillClass,
  money,
  fmtDate,
  transferStatusLabel,
  transferStepIndex,
  TRANSFER_TRACK_STEPS,
  TRANSFER_HINTS,
  labStatusLabel,
  type Order,
} from "@/lib/orders";

const PILL = "rounded-full px-3 py-1 text-xs font-semibold";
const TILE_PAD_X = "px-3 sm:px-4";
const TILE_PAD = `${TILE_PAD_X} py-3 sm:py-4`;

export type PastFilter = "all" | "delivered" | "cancelled";

export function progressPct(o: Order): number {
  if (o.type === "transfer") {
    return ((transferStepIndex(o.status) + 1) / TRANSFER_TRACK_STEPS.length) * 100;
  }
  if (o.status === "verifying") return 33;
  if (o.status === "processing") return 55;
  if (o.status === "out_for_delivery") return 80;
  if (o.status === "delivered") return 100;
  return 0;
}

export function StatusPill({ status }: { status: keyof typeof statusMeta }) {
  const { tx } = useI18n();
  return <span className={`${PILL} ${statusPillClass(status)}`}>{tx(statusMeta[status].label)}</span>;
}

export function OrderSection({
  title,
  count,
  aside,
  toolbar,
  children,
}: {
  title: string;
  count: number;
  /** Optional right-side label in the header (e.g. active subtype). */
  aside?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex items-baseline justify-between gap-3 px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">{title}</h2>
          <span className="tnum text-sm text-ink-tertiary">{count}</span>
        </div>
        {aside ? (
          <span className="shrink-0 text-sm font-medium text-[color:var(--pp-violet)]">{aside}</span>
        ) : null}
      </div>
      {toolbar ? <div className="border-t border-line px-3 sm:px-4">{toolbar}</div> : null}
      <div className="border-t border-line p-3 sm:p-4">{children}</div>
    </section>
  );
}

export function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  trailing,
  ariaLabel,
}: {
  items: { id: T; label: string; count: number }[];
  value: T;
  onChange: (id: T) => void;
  trailing?: ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className="mb-8 flex items-center justify-between gap-3 border-b border-line">
      <div className="flex min-w-0 gap-1 overflow-x-auto" role="tablist" aria-label={ariaLabel}>
        {items.map((item) => {
          const on = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(item.id)}
              className={
                "relative -mb-px shrink-0 px-3 py-3 text-sm font-medium transition-colors sm:px-4 " +
                (on
                  ? "text-[color:var(--pp-primary-950)]"
                  : "text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
              }
            >
              {item.label}
              <span className="ml-1.5 tnum text-ink-tertiary">{item.count}</span>
              {on ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[color:var(--pp-primary-950)]" />
              ) : null}
            </button>
          );
        })}
      </div>
      {trailing}
    </div>
  );
}

export function PastStatusTabs({
  value,
  onChange,
  allCount,
  deliveredCount,
  cancelledCount,
}: {
  value: PastFilter;
  onChange: (v: PastFilter) => void;
  allCount: number;
  deliveredCount: number;
  cancelledCount: number;
}) {
  const { tx } = useI18n();
  const items: { id: PastFilter; label: string; count: number }[] = [
    { id: "all", label: tx("All"), count: allCount },
    { id: "delivered", label: tx("Delivered"), count: deliveredCount },
    { id: "cancelled", label: tx("Cancelled"), count: cancelledCount },
  ];
  return (
    <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={tx("Past order status")}>
      {items.map((item) => {
        const on = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(item.id)}
            className={
              "relative -mb-px shrink-0 px-3 py-3 text-sm font-medium transition-colors " +
              (on
                ? "text-[color:var(--pp-primary-950)]"
                : "text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
            }
          >
            {item.label}
            <span className="ml-1.5 tnum text-ink-tertiary">{item.count}</span>
            {on ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[color:var(--pp-primary-950)]" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function NoteIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
      aria-hidden
    >
      <path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V9L14 3Z" />
      <path d="M14 3v5.5h5.5M9 12.5h6M9 16h4" strokeLinecap="round" />
    </svg>
  );
}

function NoteCue({ detail, tooltipId }: { detail: string; tooltipId: string }) {
  const { tx } = useI18n();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const above = r.top > 120;
      setPos({
        top: above ? r.top - 8 : r.bottom + 8,
        left: Math.min(Math.max(r.left + r.width / 2, 140), window.innerWidth - 140),
        above,
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        className={
          "grid h-7 w-7 shrink-0 place-items-center rounded-md text-[color:var(--pp-primary-950)]/50 " +
          "transition-colors hover:bg-[color:var(--pp-primary-100)] hover:text-[color:var(--pp-primary-950)]"
        }
        aria-hidden
      >
        <NoteIcon />
      </span>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              id={tooltipId}
              style={{ top: pos.top, left: pos.left }}
              className={
                "pointer-events-none fixed z-[90] w-[min(18rem,calc(100vw-1.5rem))] -translate-x-1/2 " +
                "rounded-2xl border border-line bg-[color:var(--pp-primary-100)] px-3.5 py-3 " +
                "shadow-[0_10px_28px_rgba(24,7,48,0.12)] " +
                (pos.above ? "-translate-y-full" : "")
              }
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--pp-primary-950)]">
                <NoteIcon />
                {tx("Notes")}:
              </p>
              <p className="mt-1.5 text-sm leading-snug text-[color:var(--pp-primary-950)]/85">{tx(detail)}</p>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

function orderTitle(o: Order, tx: (s: string) => string) {
  if (o.type === "transfer") {
    return o.fromPharmacy ? `${tx("From")} ${o.fromPharmacy}` : tx("Prescription transfer");
  }
  if (o.type === "lab") return o.labName ?? tx("Lab visit");
  return o.items[0]?.name ?? o.id;
}

function orderMeta(o: Order, tx: (s: string) => string) {
  const total = orderTotals(o).total;
  if (o.type === "transfer") return `${fmtDate(o.date)} · ${o.id}`;
  if (o.type === "lab") {
    return `${o.visitSlot ?? fmtDate(o.date)}${o.items[0]?.name ? ` · ${o.items[0].name}` : ""}`;
  }
  return `${fmtDate(o.date)} · ${o.items.length} ${o.items.length === 1 ? tx("item") : tx("items")}${
    total > 0 ? ` · ${money(total)}` : ""
  }`;
}

function orderStatusLabel(o: Order) {
  if (o.type === "lab") return labStatusLabel(o.status);
  if (o.type === "transfer") return transferStatusLabel(o.status);
  return statusMeta[o.status].label;
}

export function OrderTile({ o }: { o: Order }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const active = isActiveOrder(o);
  const pct = Math.round(progressPct(o));
  const statusLabel = orderStatusLabel(o);
  const title = orderTitle(o, tx);
  const meta = orderMeta(o, tx);
  const cue =
    o.type === "transfer" && active
      ? TRANSFER_HINTS[Math.min(transferStepIndex(o.status), TRANSFER_HINTS.length - 1)].detail
      : null;
  const noteId = useId();
  const canReorder = o.status === "delivered" || o.status === "cancelled";

  const openOrder = () => nav(`/orders/${o.id}`);
  const reorder = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    nav(o.type === "transfer" ? "/transfer" : o.type === "lab" ? "/appointments" : "/fill");
  };

  if (!active) {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={openOrder}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openOrder();
          }
        }}
        className={
          `flex h-full min-h-[7.5rem] cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-white text-left transition-colors ` +
          "hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)]"
        }
      >
        <div className={`flex items-center justify-between gap-3 border-b border-line ${TILE_PAD_X} py-3`}>
          <StatusPill status={o.status} />
          {canReorder ? (
            <button
              type="button"
              onClick={reorder}
              className="shrink-0 text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)] hover:opacity-70"
            >
              {tx("Reorder")}
            </button>
          ) : null}
        </div>
        <div className={`flex flex-1 flex-col ${TILE_PAD}`}>
          <p className="truncate text-base font-semibold text-[color:var(--pp-primary-950)]">{title}</p>
          <p className="mt-1 truncate text-sm text-ink-tertiary">{meta}</p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openOrder}
      className={
        "flex h-full min-h-[7.5rem] flex-col overflow-hidden rounded-2xl border border-line bg-white text-left transition-colors " +
        "hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)]"
      }
    >
      {cue ? (
        <span className="sr-only">
          {tx("Notes")}: {tx(cue)}
        </span>
      ) : null}
      <div className={`flex items-center justify-between gap-2 ${TILE_PAD_X} pt-3 sm:pt-4`}>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`${PILL} min-w-0 truncate ${statusPillClass(o.status)}`}>
            {tx(statusLabel)}
          </span>
          {cue ? <NoteCue detail={cue} tooltipId={noteId} /> : null}
        </div>
        <span className="tnum shrink-0 text-sm text-ink-tertiary">{pct}%</span>
      </div>

      <div
        className="mt-3 h-1 w-full bg-[color:var(--pp-primary-200)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${o.id} progress`}
      >
        <div
          className="h-full bg-[color:var(--pp-primary-950)] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className={`flex flex-1 flex-col ${TILE_PAD}`}>
        <p className="truncate text-base font-semibold text-[color:var(--pp-primary-950)]">{title}</p>
        <p className="mt-1 truncate text-sm text-ink-tertiary">{meta}</p>
      </div>
    </button>
  );
}

export function OrderTileGrid({ orders }: { orders: Order[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {orders.map((o) => (
        <OrderTile key={o.id} o={o} />
      ))}
    </div>
  );
}
