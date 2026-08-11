import { Link, useParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { getOrder, orderTotals, typeMeta, money, fmtDate } from "@/lib/orders";

/* Shared paper chrome: a no-print toolbar + a light "paper" sheet that prints cleanly. */
function DocShell({ children, backTo, docName }: { children: React.ReactNode; backTo: string; docName: string }) {
  const { tx } = useI18n();
  return (
    <div className="min-h-screen bg-surface-0 print:bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-line bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to={backTo} className="text-sm font-semibold text-ink-secondary hover:text-ink">← {tx("Back to order")}</Link>
          <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center rounded-full bg-cta px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-cta-hover">
            {tx("Download / Print {name}").replace("{name}", docName)}
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8 print:p-0">
        <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-stone-900 shadow-card print:rounded-none print:border-0 print:shadow-none sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Logo className="text-[#4E2A84]" markClassName="h-9 w-9" wordClassName="text-lg" />
  );
}

function NotFound() {
  const { tx } = useI18n();
  return (
    <div className="min-h-screen bg-surface-0 p-10 text-center">
      <p className="text-lg font-semibold text-ink">{tx("Document not found")}</p>
      <Link to="/orders" className="mt-2 inline-block font-semibold text-primary hover:underline">{tx("Back to order history")}</Link>
    </div>
  );
}

/* ── Receipt ────────────────────────────────────────────── */
export function Receipt() {
  const { tx } = useI18n();
  const { id } = useParams();
  const o = getOrder(id);
  if (!o) return <NotFound />;
  const t = orderTotals(o);

  const paymentLine =
    o.payment.method === "insurance"
      ? tx("Insurance (direct bill)")
      : o.payment.method === "mixed"
        ? `${tx("Insurance + Visa")} ····${o.payment.cardLast4}`
        : `${tx("Visa")} ····${o.payment.cardLast4}`;

  return (
    <DocShell backTo={`/orders/${o.id}`} docName="receipt">
      <div className="flex items-start justify-between">
        <Brand />
        <div className="text-right">
          <p className="text-xl font-medium text-stone-900">{tx("Receipt")}</p>
          <p className="text-sm text-stone-500">{o.id}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
        <span className="font-semibold text-emerald-700">{tx("Paid")}</span>
        <span className="text-sm text-emerald-700">{fmtDate(o.date)}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-stone-500">{tx("Billed to")}</p><p className="font-medium text-stone-900">{o.patient}</p><p className="text-stone-600">{o.address}</p></div>
        <div className="text-right"><p className="text-stone-500">{tx("Order type")}</p><p className="font-medium text-stone-900">{tx(typeMeta[o.type].label)}</p></div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead><tr className="border-b border-stone-200 text-left text-stone-500"><th className="py-2 font-medium">{tx("Item")}</th><th className="py-2 text-center font-medium">{tx("Qty")}</th><th className="py-2 text-right font-medium">{tx("Amount")}</th></tr></thead>
        <tbody>
          {o.items.map((it) => (
            <tr key={it.name} className="border-b border-stone-100"><td className="py-2.5 text-stone-900">{it.name} {it.strength}</td><td className="py-2.5 text-center text-stone-600">{it.qty}</td><td className="py-2.5 text-right text-stone-900">{money(it.qty * it.unitPrice)}</td></tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
        <DocRow k="Subtotal" v={money(t.subtotal)} />
        <DocRow k="Dispensing fee" v={money(t.dispensing)} />
        <DocRow k="Delivery" v={tx("FREE")} />
        {t.insurance > 0 && <DocRow k="Insurance covered" v={`−${money(t.insurance)}`} />}
        <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900"><span>{tx("Amount paid")}</span><span>{money(t.total)}</span></div>
      </div>

      <p className="mt-6 text-xs text-stone-500">
        {tx("Payment")}: {paymentLine}.
        {" "}{tx("Thank you for choosing PocketPills. Questions? Call 1-855-950-7226.")}
      </p>
    </DocShell>
  );
}

/* ── Invoice ────────────────────────────────────────────── */
export function Invoice() {
  const { tx } = useI18n();
  const { id } = useParams();
  const o = getOrder(id);
  if (!o) return <NotFound />;
  const t = orderTotals(o);

  return (
    <DocShell backTo={`/orders/${o.id}`} docName="invoice">
      <div className="flex items-start justify-between">
        <Brand />
        <div className="text-right">
          <p className="text-xl font-medium text-stone-900">{tx("Invoice")}</p>
          <p className="text-sm text-stone-500">{o.invoiceNo}</p>
          <p className="text-sm text-stone-500">{tx("Issued")} {fmtDate(o.date)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-stone-500">{tx("From")}</p>
          <p className="font-semibold text-stone-900">{tx("PocketPills Pharmacy")}</p>
          <p className="text-stone-600">{tx("Accreditation #")}: NABP-000000</p>
          <p className="text-stone-600">100 Pharmacy Way, Surrey, BC</p>
          <p className="text-stone-600">1-855-950-7226</p>
        </div>
        <div>
          <p className="text-stone-500">{tx("Bill to")}</p>
          <p className="font-semibold text-stone-900">{o.patient}</p>
          <p className="text-stone-600">{o.address}</p>
          {o.prescriber && <p className="text-stone-600">{tx("Prescriber")}: {o.prescriber}</p>}
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead><tr className="border-b border-stone-200 text-left text-stone-500">
          <th className="py-2 font-medium">{tx("Description")}</th><th className="py-2 text-center font-medium">{tx("Qty")}</th><th className="py-2 text-right font-medium">{tx("Unit")}</th><th className="py-2 text-right font-medium">{tx("Amount")}</th>
        </tr></thead>
        <tbody>
          {o.items.map((it) => (
            <tr key={it.name} className="border-b border-stone-100">
              <td className="py-2.5 text-stone-900">{it.name} {it.strength}</td>
              <td className="py-2.5 text-center text-stone-600">{it.qty}</td>
              <td className="py-2.5 text-right text-stone-600">{money(it.unitPrice)}</td>
              <td className="py-2.5 text-right text-stone-900">{money(it.qty * it.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
        <DocRow k="Subtotal" v={money(t.subtotal)} />
        <DocRow k="Dispensing fee" v={money(t.dispensing)} />
        <DocRow k="Delivery" v={tx("FREE")} />
        <DocRow k="GST/HST" v={money(t.tax)} />
        {t.insurance > 0 && <DocRow k="Insurance adjustment" v={`−${money(t.insurance)}`} />}
        <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900"><span>{tx("Total (CAD)")}</span><span>{money(t.total)}</span></div>
        <div className="flex justify-between text-stone-600"><span>{tx("Amount paid")}</span><span>{money(t.total)}</span></div>
        <div className="flex justify-between font-semibold text-stone-900"><span>{tx("Balance due")}</span><span>{money(0)}</span></div>
      </div>

      <p className="mt-6 border-t border-stone-200 pt-4 text-xs text-stone-500">
        {tx("Prescription medications are zero-rated for GST/HST in Canada. This invoice was generated by PocketPills. Retain for your records or insurance claims. PocketPills is not a pharmacy or a drug manufacturer.")}
      </p>
    </DocShell>
  );
}

function DocRow({ k, v }: { k: string; v: string }) {
  const { tx } = useI18n();
  return <div className="flex justify-between text-stone-600"><span>{tx(k)}</span><span className="tabular-nums text-stone-900">{v}</span></div>;
}
