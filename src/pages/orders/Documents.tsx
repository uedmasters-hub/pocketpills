import { Link, useParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { getOrder, orderTotals, typeMeta, money, fmtDate } from "@/lib/orders";

/* Shared paper chrome: a no-print toolbar + a light "paper" sheet that prints cleanly. */
function DocShell({ children, backTo, docName }: { children: React.ReactNode; backTo: string; docName: string }) {
  return (
    <div className="min-h-screen bg-surface-0 print:bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-line bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to={backTo} className="text-sm font-semibold text-ink-secondary hover:text-ink">← Back to order</Link>
          <button onClick={() => window.print()} className="inline-flex h-9 items-center rounded-full bg-cta px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-cta-hover">
            Download / Print {docName}
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
  return (
    <div className="min-h-screen bg-surface-0 p-10 text-center">
      <p className="text-lg font-semibold text-ink">Document not found</p>
      <Link to="/orders" className="mt-2 inline-block font-semibold text-primary hover:underline">Back to order history</Link>
    </div>
  );
}

/* ── Receipt ────────────────────────────────────────────── */
export function Receipt() {
  const { id } = useParams();
  const o = getOrder(id);
  if (!o) return <NotFound />;
  const t = orderTotals(o);

  return (
    <DocShell backTo={`/orders/${o.id}`} docName="receipt">
      <div className="flex items-start justify-between">
        <Brand />
        <div className="text-right">
          <p className="text-xl font-medium text-stone-900">Receipt</p>
          <p className="text-sm text-stone-500">{o.id}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
        <span className="font-semibold text-emerald-700">Paid</span>
        <span className="text-sm text-emerald-700">{fmtDate(o.date)}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-stone-500">Billed to</p><p className="font-medium text-stone-900">{o.patient}</p><p className="text-stone-600">{o.address}</p></div>
        <div className="text-right"><p className="text-stone-500">Order type</p><p className="font-medium text-stone-900">{typeMeta[o.type].label}</p></div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead><tr className="border-b border-stone-200 text-left text-stone-500"><th className="py-2 font-medium">Item</th><th className="py-2 text-center font-medium">Qty</th><th className="py-2 text-right font-medium">Amount</th></tr></thead>
        <tbody>
          {o.items.map((it) => (
            <tr key={it.name} className="border-b border-stone-100"><td className="py-2.5 text-stone-900">{it.name} {it.strength}</td><td className="py-2.5 text-center text-stone-600">{it.qty}</td><td className="py-2.5 text-right text-stone-900">{money(it.qty * it.unitPrice)}</td></tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
        <DocRow k="Subtotal" v={money(t.subtotal)} />
        <DocRow k="Dispensing fee" v={money(t.dispensing)} />
        <DocRow k="Delivery" v="FREE" />
        {t.insurance > 0 && <DocRow k="Insurance covered" v={`−${money(t.insurance)}`} />}
        <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900"><span>Amount paid</span><span>{money(t.total)}</span></div>
      </div>

      <p className="mt-6 text-xs text-stone-500">
        Payment: {o.payment.method === "insurance" ? "Insurance (direct bill)" : o.payment.method === "mixed" ? `Insurance + Visa ····${o.payment.cardLast4}` : `Visa ····${o.payment.cardLast4}`}.
        Thank you for choosing PocketPills. Questions? Call 1-855-950-7226.
      </p>
    </DocShell>
  );
}

/* ── Invoice ────────────────────────────────────────────── */
export function Invoice() {
  const { id } = useParams();
  const o = getOrder(id);
  if (!o) return <NotFound />;
  const t = orderTotals(o);

  return (
    <DocShell backTo={`/orders/${o.id}`} docName="invoice">
      <div className="flex items-start justify-between">
        <Brand />
        <div className="text-right">
          <p className="text-xl font-medium text-stone-900">Invoice</p>
          <p className="text-sm text-stone-500">{o.invoiceNo}</p>
          <p className="text-sm text-stone-500">Issued {fmtDate(o.date)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-stone-500">From</p>
          <p className="font-semibold text-stone-900">PocketPills Pharmacy</p>
          <p className="text-stone-600">Accreditation #: NABP-000000</p>
          <p className="text-stone-600">100 Pharmacy Way, Surrey, BC</p>
          <p className="text-stone-600">1-855-950-7226</p>
        </div>
        <div>
          <p className="text-stone-500">Bill to</p>
          <p className="font-semibold text-stone-900">{o.patient}</p>
          <p className="text-stone-600">{o.address}</p>
          {o.prescriber && <p className="text-stone-600">Prescriber: {o.prescriber}</p>}
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead><tr className="border-b border-stone-200 text-left text-stone-500">
          <th className="py-2 font-medium">Description</th><th className="py-2 text-center font-medium">Qty</th><th className="py-2 text-right font-medium">Unit</th><th className="py-2 text-right font-medium">Amount</th>
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
        <DocRow k="Delivery" v="FREE" />
        <DocRow k="GST/HST" v={money(t.tax)} />
        {t.insurance > 0 && <DocRow k="Insurance adjustment" v={`−${money(t.insurance)}`} />}
        <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900"><span>Total (CAD)</span><span>{money(t.total)}</span></div>
        <div className="flex justify-between text-stone-600"><span>Amount paid</span><span>{money(t.total)}</span></div>
        <div className="flex justify-between font-semibold text-stone-900"><span>Balance due</span><span>{money(0)}</span></div>
      </div>

      <p className="mt-6 border-t border-stone-200 pt-4 text-xs text-stone-500">
        Prescription medications are zero-rated for GST/HST in Canada. This invoice was generated by PocketPills.
        Retain for your records or insurance claims. PocketPills is not a pharmacy or a drug manufacturer.
      </p>
    </DocShell>
  );
}

function DocRow({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between text-stone-600"><span>{k}</span><span className="tabular-nums text-stone-900">{v}</span></div>;
}

