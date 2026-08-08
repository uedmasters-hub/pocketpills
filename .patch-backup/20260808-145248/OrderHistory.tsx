import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Badge, SectionHead } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { orders, getOrder, orderTotals, typeMeta, statusMeta, money, fmtDate, type OrderStatus } from "@/lib/orders";

const IN_PROGRESS: OrderStatus[] = ["verifying", "processing", "out_for_delivery"];

/* ── History list ───────────────────────────────────────── */
export function OrderHistory() {
  const [tab, setTab] = useState<"all" | "progress" | "delivered">("all");
  const list = orders.filter((o) =>
    tab === "all" ? true : tab === "progress" ? IN_PROGRESS.includes(o.status) : o.status === "delivered",
  );

  return (
    <div>
      <SectionHead eyebrow="Pharmacy" title="Order history" sub="View past orders, receipts, and invoices." />

      <div className="mb-5 flex gap-2">
        {([["all", "All"], ["progress", "In progress"], ["delivered", "Delivered"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={"rounded-full px-4 py-2 text-sm font-semibold " + (tab === id ? "bg-primary text-[color:var(--color-primary-fg)]" : "border border-line bg-surface-2 text-ink-secondary hover:border-strong")}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((o) => {
          const t = orderTotals(o);
          return (
            <Link key={o.id} to={`/orders/${o.id}`} className="block">
              <Card interactive className="flex items-center gap-4 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-subtle text-xl">{typeMeta[o.type].icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{o.id}</p>
                    <Badge tone={statusMeta[o.status].tone}>{statusMeta[o.status].label}</Badge>
                  </div>
                  <p className="truncate text-sm text-ink-tertiary">
                    {fmtDate(o.date)} · {o.items.map((i) => i.name).join(", ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-ink tnum">{money(t.total)}</p>
                  <p className="text-xs text-ink-tertiary">{o.items.length} item{o.items.length === 1 ? "" : "s"}</p>
                </div>
                <span className="shrink-0 text-ink-tertiary" aria-hidden>→</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ── Order detail ───────────────────────────────────────── */
export function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const o = getOrder(id);

  if (!o) {
    return (
      <Card className="p-10 text-center">
        <p className="text-lg font-semibold text-ink">Order not found</p>
        <Link to="/orders" className="mt-2 inline-block font-semibold text-primary hover:underline">Back to order history</Link>
      </Card>
    );
  }
  const t = orderTotals(o);
  const timeline: { label: string; state: "done" | "active" | "todo" }[] = (() => {
    const order: OrderStatus[] = ["verifying", "processing", "out_for_delivery", "delivered"];
    const cur = o.status === "cancelled" ? 0 : order.indexOf(o.status);
    const labels = ["Order placed", "Processing", "Out for delivery", "Delivered"];
    return labels.map((label, i) => ({ label, state: i < cur ? "done" : i === cur ? "active" : "todo" }));
  })();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link to="/orders" className="text-sm font-semibold text-ink-tertiary hover:text-ink">← Order history</Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-ink">{o.id}</h1>
            <Badge tone={statusMeta[o.status].tone}>{statusMeta[o.status].label}</Badge>
          </div>
          <p className="mt-1 text-ink-tertiary">{typeMeta[o.type].label} · {fmtDate(o.date)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => nav(`/orders/${o.id}/receipt`)}>View receipt</Button>
          <Button size="sm" variant="secondary" onClick={() => nav(`/orders/${o.id}/invoice`)}>View invoice</Button>
          <Button size="sm" onClick={() => nav("/fill")}>Reorder</Button>
        </div>
      </div>

      {/* Timeline */}
      {o.status !== "cancelled" && (
        <Card className="mt-6 p-5">
          <ol className="flex justify-between">
            {timeline.map((s, i, arr) => (
              <li key={s.label} className="relative flex flex-1 flex-col items-center text-center">
                {i < arr.length - 1 && <span className={"absolute left-1/2 top-3 h-0.5 w-full " + (s.state === "done" ? "bg-primary" : "bg-line")} />}
                <span className={"relative z-10 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold " + (s.state === "done" ? "bg-primary text-[color:var(--color-primary-fg)]" : s.state === "active" ? "bg-primary/20 text-primary ring-2 ring-primary" : "border-2 border-line bg-surface-2 text-ink-tertiary")}>{s.state === "done" ? "✓" : i + 1}</span>
                <span className={"mt-2 text-[11px] font-medium " + (s.state === "todo" ? "text-ink-tertiary" : "text-ink")}>{s.label}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Items */}
      <Card className="mt-4 p-0">
        <p className="border-b border-line px-5 py-3 font-semibold text-ink">Items</p>
        {o.items.map((it) => (
          <div key={it.name} className="flex items-center justify-between border-b border-line px-5 py-3 last:border-0">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-subtle">💊</span>
              <div><p className="font-medium text-ink">{it.name} {it.strength}</p><p className="text-sm text-ink-tertiary">Qty {it.qty}</p></div>
            </div>
            <span className="text-ink tnum">{money(it.qty * it.unitPrice)}</span>
          </div>
        ))}
      </Card>

      {/* Totals */}
      <Card className="mt-4 p-5">
        <Row k="Subtotal" v={money(t.subtotal)} />
        <Row k="Dispensing fee" v={money(t.dispensing)} />
        <Row k="Delivery" v="FREE" tone="wellness" />
        {t.insurance > 0 && <Row k="Insurance covered" v={`−${money(t.insurance)}`} tone="wellness" />}
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
          <span className="font-semibold text-ink">Total paid</span>
          <span className="font-display text-xl font-extrabold text-ink tnum">{money(t.total)}</span>
        </div>
        <p className="mt-2 text-xs text-ink-tertiary">
          {o.payment.method === "insurance" ? "Billed to insurance" : o.payment.method === "mixed" ? `Insurance + Visa ····${o.payment.cardLast4}` : `Visa ····${o.payment.cardLast4}`}
        </p>
      </Card>

      {/* Meta */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-5"><p className="text-xs text-ink-tertiary">Delivered to</p><p className="mt-1 font-medium text-ink">{o.patient}</p><p className="text-sm text-ink-secondary">{o.address}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-tertiary">Care team</p>{o.prescriber && <p className="mt-1 text-sm text-ink-secondary">Prescriber: {o.prescriber}</p>}{o.pharmacist && <p className="text-sm text-ink-secondary">Pharmacist: {o.pharmacist}</p>}</Card>
      </div>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "wellness" }) {
  return <div className="flex items-center justify-between text-sm"><span className="text-ink-secondary">{k}</span><span className={tone === "wellness" ? "font-medium text-wellness tnum" : "text-ink tnum"}>{v}</span></div>;
}
