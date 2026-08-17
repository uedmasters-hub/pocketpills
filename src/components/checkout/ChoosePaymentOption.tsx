import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { getOffer } from "@/lib/offers";

export type PayMethod = "card" | "upi" | "emi" | "health";

const UPI_HANDLES = ["@okhdfcbank", "@okicici", "@oksbi", "@paytm", "@ybl"] as const;
const EMI_PLANS = ["3 months · 0% interest", "6 months · 0% interest", "12 months · from 8%"] as const;

export function usePaymentFields(savedLast4?: string) {
  const [method, setMethod] = useState<PayMethod>("card");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12 / 27");
  const [cvc, setCvc] = useState("123");
  const [useSaved, setUseSaved] = useState(Boolean(savedLast4));
  const [healthNumber, setHealthNumber] = useState("");
  const [upiName, setUpiName] = useState("");
  const [upiHandle, setUpiHandle] = useState<string>(UPI_HANDLES[0]);
  const [upiVerified, setUpiVerified] = useState(false);
  const [emiPlan, setEmiPlan] = useState("");

  const last4 = useSaved && savedLast4 ? savedLast4 : card.replace(/\s/g, "").slice(-4) || "4242";

  const ready = (due: number) => {
    if (due <= 0) return true;
    if (method === "card") {
      if (useSaved && savedLast4) return true;
      const digits = card.replace(/\s/g, "");
      return digits.length >= 12 && exp.replace(/\s/g, "").length >= 4 && cvc.length >= 3;
    }
    if (method === "upi") return upiVerified;
    if (method === "emi") return Boolean(emiPlan);
    if (method === "health") return healthNumber.trim().length >= 4;
    return false;
  };

  const setUpiNameAndReset = (v: string) => {
    setUpiName(v);
    setUpiVerified(false);
  };

  const setUpiHandleAndReset = (v: string) => {
    setUpiHandle(v);
    setUpiVerified(false);
  };

  return {
    method,
    setMethod,
    card,
    setCard,
    exp,
    setExp,
    cvc,
    setCvc,
    useSaved,
    setUseSaved,
    healthNumber,
    setHealthNumber,
    upiName,
    setUpiName: setUpiNameAndReset,
    upiHandle,
    setUpiHandle: setUpiHandleAndReset,
    upiVerified,
    setUpiVerified,
    emiPlan,
    setEmiPlan,
    last4,
    ready,
  };
}

export type PaymentFields = ReturnType<typeof usePaymentFields>;

export function SideTabPanel({
  label,
  tabs,
  value,
  onChange,
  children,
}: {
  label: string;
  tabs: { id: string; title: string; hint?: string }[];
  value: string;
  onChange: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="grid md:grid-cols-[minmax(11rem,15rem)_minmax(0,1fr)]">
        <div className="border-b border-line md:border-b-0 md:border-r" role="tablist" aria-label={label}>
          {tabs.map((m) => {
            const on = value === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onChange(m.id)}
                className={
                  "flex w-full flex-col items-start border-b border-line px-4 py-3.5 text-left last:border-b-0 " +
                  (on
                    ? "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
                    : "bg-white text-ink-secondary hover:bg-[color:var(--state-hover)]")
                }
              >
                <span className={"text-sm " + (on ? "font-semibold" : "font-medium")}>{m.title}</span>
                {m.hint ? (
                  <span className={"mt-0.5 text-xs " + (on ? "text-ink-secondary" : "text-ink-tertiary")}>
                    {m.hint}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="min-w-0 p-5">{children}</div>
      </div>
    </div>
  );
}

export function ChoosePaymentOption({
  pay,
  savedLast4,
  due = 1,
}: {
  pay: PaymentFields;
  savedLast4?: string;
  due?: number;
}) {
  const { tx } = useI18n();
  const bmo = getOffer("bank-bmo");
  const amex = getOffer("card-amex");
  const inputClass =
    "h-12 rounded-xl border border-line bg-surface-2 px-4 text-base text-ink placeholder:text-ink-tertiary " +
    "hover:bg-[color:var(--state-hover)] focus:border-[color:var(--primary-600)]";

  const methods: { id: PayMethod; title: string; hint: string }[] = [
    { id: "card", title: tx("Credit / Debit / ATM Card"), hint: "" },
    { id: "upi", title: tx("UPI"), hint: tx("Pay by any UPI app") },
    { id: "emi", title: tx("EMI"), hint: tx("Credit Card EMI") },
    { id: "health", title: tx("Have a health Card?"), hint: "" },
  ];

  const verifyUpi = () => {
    if (pay.upiName.trim().length < 2) return;
    pay.setUpiVerified(true);
  };

  return (
    <section>
      <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Choose payment option")}
      </h2>
      <p className="mt-1 text-sm text-ink-tertiary">{tx("Choose payment option and continue.")}</p>

      <div className="mt-5">
        <SideTabPanel
          label={tx("Payment method")}
          tabs={methods}
          value={pay.method}
          onChange={(id) => pay.setMethod(id as PayMethod)}
        >
          {due <= 0 ? (
            <p className="mb-4 rounded-xl bg-[color:var(--pp-primary-100)] px-4 py-3 text-sm text-[color:var(--pp-primary-950)]">
              {tx("Nothing due today. Add a method in case a balance remains.")}
            </p>
          ) : null}
          {pay.method === "card" ? (
            savedLast4 && pay.useSaved ? (
              <div>
                <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Card on file")}</p>
                <p className="mt-2 rounded-xl bg-[color:var(--pp-primary-100)] px-4 py-3 text-sm font-medium text-[color:var(--pp-primary-950)]">
                  Visa ····{savedLast4}
                </p>
                <button
                  type="button"
                  onClick={() => pay.setUseSaved(false)}
                  className="mt-3 text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-70"
                >
                  {tx("Use a different card")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Field
                  label={tx("Card number")}
                  placeholder="4242 4242 4242 4242"
                  value={pay.card}
                  onChange={(e) => pay.setCard(e.target.value)}
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label={tx("Expiry")}
                    placeholder="12 / 27"
                    value={pay.exp}
                    onChange={(e) => pay.setExp(e.target.value)}
                    autoComplete="cc-exp"
                  />
                  <Field
                    label={tx("CVC")}
                    placeholder="123"
                    value={pay.cvc}
                    onChange={(e) => pay.setCvc(e.target.value)}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </div>
                {savedLast4 ? (
                  <button
                    type="button"
                    onClick={() => pay.setUseSaved(true)}
                    className="text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-70"
                  >
                    {tx("Use saved card")} ····{savedLast4}
                  </button>
                ) : null}
                <div className="grid gap-2 pt-1 sm:grid-cols-2">
                  {bmo ? (
                    <div className="rounded-xl border border-line bg-[color:var(--pp-primary-100)] px-3 py-2.5">
                      <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
                        {tx(bmo.badge)}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-[color:var(--pp-primary-950)]">{tx(bmo.title)}</p>
                    </div>
                  ) : null}
                  {amex ? (
                    <div className="rounded-xl border border-line bg-[color:var(--pp-primary-100)] px-3 py-2.5">
                      <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
                        {tx(amex.badge)}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-[color:var(--pp-primary-950)]">{tx(amex.title)}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          ) : pay.method === "upi" ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Pay by any UPI app")}</p>
              <p className="text-sm text-ink-secondary">
                {tx("Scan the code in your UPI app, or enter your UPI ID.")}
              </p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("UPI ID")}</span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    value={pay.upiName}
                    onChange={(e) => pay.setUpiName(e.target.value.replace(/@.*/g, "").replace(/\s/g, ""))}
                    placeholder="yourname"
                    autoComplete="off"
                    spellCheck={false}
                    className={inputClass + " min-w-0 flex-1"}
                  />
                  <select
                    value={pay.upiHandle}
                    onChange={(e) => pay.setUpiHandle(e.target.value)}
                    aria-label={tx("UPI handle")}
                    className={inputClass + " sm:w-[11.5rem]"}
                  >
                    {UPI_HANDLES.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <Button
                    className="!rounded-xl !px-5 shrink-0"
                    disabled={pay.upiName.trim().length < 2 || pay.upiVerified}
                    onClick={verifyUpi}
                  >
                    {pay.upiVerified ? tx("Verified") : tx("Verify")}
                  </Button>
                </div>
                {pay.upiVerified ? (
                  <span className="mt-1.5 block text-sm text-[color:var(--pp-green)]">
                    {tx("UPI ID verified")} · {pay.upiName}
                    {pay.upiHandle}
                  </span>
                ) : null}
              </label>
            </div>
          ) : pay.method === "emi" ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Credit Card EMI")}</p>
              <p className="text-sm text-ink-secondary">{tx("Choose a demo EMI plan. No real charges are made.")}</p>
              <div className="space-y-2" role="radiogroup" aria-label={tx("EMI")}>
                {EMI_PLANS.map((plan) => {
                  const on = pay.emiPlan === plan;
                  return (
                    <button
                      key={plan}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => pay.setEmiPlan(plan)}
                      className={
                        "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium " +
                        (on
                          ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
                          : "border-line text-[color:var(--pp-primary-950)] hover:border-[color:var(--pp-primary-950)]")
                      }
                    >
                      {tx(plan)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Have a health Card?")}</p>
              <p className="text-sm text-ink-secondary">
                {tx("We'll bill your provincial plan first. Enter the number on your health card.")}
              </p>
              <Field
                label={tx("Health card number")}
                placeholder={tx("e.g. 1234-567-890")}
                value={pay.healthNumber}
                onChange={(e) => pay.setHealthNumber(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}
          <p className="mt-4 text-xs text-ink-tertiary">{tx("Demo checkout — no real payment is processed.")}</p>
        </SideTabPanel>
      </div>
    </section>
  );
}
