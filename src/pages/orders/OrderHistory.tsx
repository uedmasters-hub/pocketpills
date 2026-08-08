import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { orders, getOrder, orderTotals, typeMeta, statusMeta, money, fmtDate, type OrderStatus } from "@/lib/orders";

const IN_PROGRESS: OrderStatus[] = ["verifying", "processing", "out_for_delivery"];
const CARD = "rounded-2xl border border-line bg-surface-2";
const PILL = "rounded-full px-3 py-1 text-[12px] font-semibold";

function StatusPill({ status }: { status: OrderStatus }) {
  const tone: Record<string, string> = {
    primary: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]",
    info: "bg-info-subtle text-info",
    wellness: "bg-wellness-subtle text-wellness",
    danger: "bg-danger-subtle text-danger",
    neutral: "bg-surface-1 text-ink-secondary",
  };
  return <span className={`${PILL} ${tone[statusMeta[status].tone]}`}>{statusMeta[status].label}</span>;
}

/* ── History ───────────────────────────────────────────── */
export function OrderHistory() {
  const [tab, setTab] = useState<"all" | "progress" | "delivered">("all");
  const list = orders.filter((o) =>
    tab === "all" ? true : tab === "progress" ? IN_PROGRESS.includes(o.status) : o.status === "delivered",
  );

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--pp-violet)]">Orders</p>
        <h1 className="mt-2 font-display text-[clamp(24px,2.8vw,32px)] font-extrabold tracking-tight text-[color:var(--pp-primary-950)]">
          Order history
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-secondary">Past orders, receipts, and invoices.</p>
      </header>

      <div className="mb-6 flex gap-2">
        {([["all", "All"], ["progress", "In progress"], ["delivered", "Delivered"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={
              "rounded-full px-4 py-2 text-[13px] font-medium transition-colors " +
              (tab === id
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
            }>
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <p className="font-semibold text-[color:var(--pp-primary-950)]">Nothing here yet</p>
          <p className="mt-1 text-[14px] text-ink-tertiary">Orders will appear once you place one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className={`${CARD} flex items-center gap-4 p-4 transition-colors hover:bg-[color:var(--pp-primary-100)]`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--pp-primary-100)]" aria-hidden>
                {typeMeta[o.type].icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[color:var(--pp-primary-950)]">{o.id}</span>
                  <StatusPill status={o.status} />
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-ink-tertiary">
                  {fmtDate(o.date)} · {o.items.map((i) => i.name).join(", ")}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-semibold text-[color:var(--pp-primary-950)] tnum">{money(orderTotals(o).total)}</span>
                <span className="block text-[11px] text-ink-tertiary">{o.items.length} item{o.items.length === 1 ? "" : "s"}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Detail ────────────────────────────────────────────── */
export function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const o = getOrder(id);

  if (!o) {
    return (
      <div className={`${CARD} p-12 text-center`}>
        <p className="font-semibold text-[color:var(--pp-primary-950)]">Order not found</p>
        <Link to="/orders" className="mt-2 inline-block text-[14px] font-semibold text-[color:var(--pp-violet)] hover:underline">
          Back to order history
        </Link>
      </div>
    );
  }

  const t = orderTotals(o);
  const steps = ["Order placed", "Processing", "Out for delivery", "Delivered"];
  const order: OrderStatus[] = ["verifying", "processing", "out_for_delivery", "delivered"];
  const cur = o.status === "cancelled" ? 0 : order.indexOf(o.status);

  return (
    <div>
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]">
        ← Order history
      </Link>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[clamp(24px,2.8vw,30px)] font-extrabold tracking-tight text-[color:var(--pp-primary-950)]">{o.id}</h1>
            <StatusPill status={o.status} />
          </div>
          <p className="mt-1 text-[14px] text-ink-tertiary">{typeMeta[o.type].label} · {fmtDate(o.date)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => nav(`/orders/${o.id}/receipt`)}>Receipt</Button>
          <Button size="sm" variant="secondary" onClick={() => nav(`/orders/${o.id}/invoice`)}>Invoice</Button>
          <Button size="sm" onClick={() => nav("/fill")}>Reorder</Button>
        </div>
      </header>

      {o.status !== "cancelled" && (
        <div className={`${CARD} mt-6 p-6`}>
          <ol className="flex justify-between gap-2">
            {steps.map((label, i) => {
              const done = i < cur, active = i === cur;
              return (
                <li key={label} className="relative flex flex-1 flex-col items-center text-center">
                  {i < steps.length - 1 && (
                    <span className={"absolute left-1/2 top-[11px] h-0.5 w-full " + (done ? "bg-[color:var(--pp-primary-950)]" : "bg-line")} aria-hidden />
                  )}
                  <span className={
                    "relative z-10 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold " +
                    (done ? "bg-[color:var(--pp-primary-950)] text-white"
                      : active ? "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] ring-2 ring-[color:var(--pp-primary-950)]"
                      : "border-2 border-line bg-surface-2 text-ink-tertiary")
                  }>{done ? "✓" : i + 1}</span>
                  <span className={"mt-2 text-[11px] font-medium " + (i > cur ? "text-ink-tertiary" : "text-[color:var(--pp-primary-950)]")}>{label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <section className={`${CARD} overflow-hidden`}>
          <p className="border-b border-line px-5 py-3 font-semibold text-[color:var(--pp-primary-950)]">Items</p>
          {o.items.map((it) => (
            <div key={it.name} className="flex items-center justify-between border-b border-line px-5 py-3.5 last:border-0">
              <div>
                <p className="font-medium text-[color:var(--pp-primary-950)]">{it.name} {it.strength}</p>
                <p className="text-[13px] text-ink-tertiary">Qty {it.qty}</p>
              </div>
              <span className="text-[14px] text-ink tnum">{money(it.qty * it.unitPrice)}</span>
            </div>
          ))}
        </section>

        <aside className={`${CARD} h-max p-5`}>
          <p className="mb-3 font-semibold text-[color:var(--pp-primary-950)]">Summary</p>
          <div className="space-y-1.5 text-[13px]">
            <Row k="Subtotal" v={money(t.subtotal)} />
            <Row k="Dispensing fee" v={money(t.dispensing)} />
            <Row k="Delivery" v="FREE" tone />
            {t.insurance > 0 && <Row k="Insurance" v={`−${money(t.insurance)}`} tone />}
            <div className="flex items-center justify-between border-t border-line pt-2.5">
              <span className="font-semibold text-[color:var(--pp-primary-950)]">Total paid</span>
              <span className="font-display text-lg font-extrabold text-[color:var(--pp-primary-950)] tnum">{money(t.total)}</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-ink-tertiary">
            {o.payment.method === "insurance" ? "Billed to insurance"
              : o.payment.method === "mixed" ? `Insurance + Visa ····${o.payment.cardLast4}`
              : `Visa ····${o.payment.cardLast4}`}
          </p>
        </aside>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className={`${CARD} p-5`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-tertiary">Delivered to</p>
          <p className="mt-1.5 font-medium text-[color:var(--pp-primary-950)]">{o.patient}</p>
          <p className="text-[13px] text-ink-secondary">{o.address}</p>
        </div>
        <div className={`${CARD} p-5`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-tertiary">Care team</p>
          {o.prescriber && <p className="mt-1.5 text-[13px] text-ink-secondary">Prescriber: {o.prescriber}</p>}
          {o.pharmacist && <p className="text-[13px] text-ink-secondary">Pharmacist: {o.pharmacist}</p>}
        </div>
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
