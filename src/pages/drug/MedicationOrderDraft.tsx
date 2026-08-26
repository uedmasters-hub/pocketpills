import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui";
import { ChoosePaymentOption, usePaymentFields } from "@/components/checkout/ChoosePaymentOption";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import { createMedicationOrder } from "@/lib/orders";
import { getConsultRequest } from "@/lib/immediateConsult";
import {
  basketNeedsConsult,
  basketTotals,
  clearMedBasket,
  lineCost,
  listMedBasket,
} from "@/lib/medBasketDraft";

const INDEX = "/drug/draft";

export function MedicationOrderDraft() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { displayName, user } = useUser();
  const pay = usePaymentFields();
  const items = listMedBasket();
  const rx = params.get("rx") ? getConsultRequest(params.get("rx")!) : undefined;
  const issued = rx?.status === "issued";
  const totals = basketTotals(items);

  const [address, setAddress] = useState(
    user?.province ? `${user.province}, Nepal` : "Kathmandu, Nepal",
  );
  const [orderId, setOrderId] = useState("");
  const [orderedNames, setOrderedNames] = useState<string[]>([]);

  const needsConsult = basketNeedsConsult(items) && !issued;
  const canPay = useMemo(() => {
    if (!items.length || needsConsult) return false;
    return pay.ready(totals.total) && address.trim().length > 4;
  }, [items.length, needsConsult, pay, totals.total, address]);

  if (orderId) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-8 text-center">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Order placed")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Your medicines are on their way to review")}
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">{orderedNames.join(" · ")}</p>
        <p className="mt-1 font-mono text-sm text-ink-tertiary">{orderId}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button fullWidth onClick={() => nav(`/orders/${orderId}`)}>
            {tx("View order")}
          </Button>
          <Button fullWidth variant="secondary" onClick={() => nav(INDEX)}>
            {tx("Shop medications")}
          </Button>
        </div>
      </div>
    );
  }

  if (!items.length) return <Navigate to={INDEX} replace />;
  if (needsConsult) return <Navigate to={`${INDEX}/consult`} replace />;

  const placeOrder = () => {
    if (!canPay) return;
    const [first, ...rest] = items;
    const order = createMedicationOrder({
      name: first.name,
      strength: first.dose,
      qty: first.qty,
      unitPrice: first.price / 30,
      dispensingFee: totals.fee,
      insuranceCovered: totals.covered,
      address,
      patient: displayName || "Patient",
      cardLast4: pay.last4,
      due: totals.total,
      prescriber: issued ? rx?.consultantName : undefined,
      extraItems: rest.map((row) => ({
        name: row.name,
        strength: row.dose,
        qty: row.qty,
        unitPrice: row.price / 30,
      })),
    });
    setOrderedNames(items.map((row) => row.name));
    clearMedBasket();
    setOrderId(order.id);
  };

  return (
    <div>
      <Link
        to={INDEX}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {tx("Your medicines")}
      </Link>

      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Order medicine")}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {issued ? tx("Prescription issued — pay and order") : tx("Pay and order")}
          </h1>

          {issued && rx ? (
            <div className="mt-5 rounded-2xl border border-line bg-white p-5">
              <p className="text-2xs font-semibold uppercase tracking-[0.1em] text-wellness">
                {tx("Issued")}
              </p>
              <p className="mt-1 font-semibold text-[color:var(--pp-primary-950)]">{rx.consultantName}</p>
              <p className="mt-0.5 text-sm text-ink-secondary">
                {rx.rxNote || items.map((i) => i.name).join(" · ")}
              </p>
            </div>
          ) : null}

          <ul className="mt-5 space-y-2">
            {items.map((row) => (
              <li
                key={`${row.slug}-${row.dose}`}
                className="flex items-baseline justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3"
              >
                <span>
                  <span className="block font-medium text-[color:var(--pp-primary-950)]">{row.name}</span>
                  <span className="text-sm text-ink-tertiary">
                    {row.dose} · {tx("Qty")} {row.qty}
                  </span>
                </span>
                <span className="tnum text-sm text-ink">${lineCost(row).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <Field
              label={tx("Delivery address")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <aside className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)] lg:sticky lg:top-28">
          <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("You pay")}</p>
          <div className="mt-4 space-y-1.5 text-sm">
            <PriceRow k={tx("Drug cost")} v={`$${totals.drugCost.toFixed(2)}`} />
            <PriceRow k={tx("Dispensing fee")} v={`$${totals.fee.toFixed(2)}`} />
            <PriceRow k={tx("Delivery")} v={tx("FREE")} />
            {totals.covered > 0 ? <PriceRow k={tx("Insurance")} v={`−$${totals.covered.toFixed(2)}`} /> : null}
            <div className="flex items-end justify-between border-t border-line pt-3">
              <span className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Total")}</span>
              <span className="font-display text-3xl font-medium text-[color:var(--pp-primary-950)] tnum">
                ${totals.total.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-5">
            <ChoosePaymentOption pay={pay} due={totals.total} />
          </div>
          <Button fullWidth className="mt-5" disabled={!canPay} onClick={placeOrder}>
            {tx("Pay and order")}
          </Button>
        </aside>
      </div>
    </div>
  );
}

function PriceRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-secondary">{k}</span>
      <span className="tnum text-ink">{v}</span>
    </div>
  );
}
