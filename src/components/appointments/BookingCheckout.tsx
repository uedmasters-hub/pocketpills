import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { CheckoutOffers, useOfferQuote } from "@/components/offers/CheckoutOffers";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";

type Phase = "pay" | "send" | "done";

export function BookingCheckout({
  doctorName,
  visitLabel,
  date,
  time,
  patientName,
  specialtyLabel,
  fee,
  savedLast4,
  onBack,
  onClose,
  onPay,
}: {
  doctorName: string;
  visitLabel: string;
  date: string;
  time: string;
  patientName: string;
  specialtyLabel?: string;
  fee: number;
  savedLast4?: string;
  onBack: () => void;
  onClose: () => void;
  onPay: (cardLast4: string) => { no: string; id: string };
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>("pay");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [useSaved, setUseSaved] = useState(Boolean(savedLast4));
  const [confirmation, setConfirmation] = useState<{ no: string; id: string } | null>(null);
  const [sendStep, setSendStep] = useState(0);
  const offerCtx = useMemo(
    () => ({ kind: "consult" as const, amount: fee, specialty: specialtyLabel }),
    [fee, specialtyLabel],
  );
  const offerQuote = useOfferQuote(offerCtx);

  const digits = card.replace(/\s/g, "");
  const canPay =
    offerQuote.due <= 0 ||
    (useSaved
      ? Boolean(savedLast4)
      : digits.length >= 12 && exp.replace(/\s/g, "").length >= 4 && cvc.length >= 3);

  const pay = () => {
    if (!canPay) return;
    const last4 = useSaved && savedLast4 ? savedLast4 : digits.slice(-4) || "4242";
    const conf = onPay(last4);
    setConfirmation(conf);
    setPhase("send");
    setSendStep(0);
  };

  useEffect(() => {
    if (phase !== "send") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = window.setTimeout(() => setSendStep(1), reduce ? 200 : 900);
    const t2 = window.setTimeout(() => setSendStep(2), reduce ? 400 : 1800);
    const t3 = window.setTimeout(() => setPhase("done"), reduce ? 600 : 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [phase]);

  const title =
    phase === "pay" ? tx("Payment") : phase === "send" ? tx("Sending request") : tx("Request sent");

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <ConfettiBurst fire={phase === "done"} />
      <header className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {phase === "pay" ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 justify-self-start text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
          >
            ← {tx("Back")}
          </button>
        ) : (
          <span />
        )}
        <h1 className="text-center text-sm font-medium text-[color:var(--pp-primary-950)] sm:text-base">
          {title}
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center justify-self-end rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
          aria-label={tx("Close booking")}
        >
          ✕
        </button>
      </header>

      {phase === "pay" ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{doctorName}</p>
            <p className="mt-1 text-sm text-ink-tertiary">
              {date} · {time} · {visitLabel}
            </p>
            <p className="mt-1 text-sm text-ink-tertiary">{patientName}</p>
            {specialtyLabel ? (
              <p className="mt-1 text-sm text-ink-tertiary">{specialtyLabel}</p>
            ) : null}
            <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
              <span className="text-2xs text-ink-tertiary">{tx("Consultation")}</span>
              <span className="font-display text-2xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                {formatFee(fee)}
              </span>
            </div>
            {offerQuote.credit > 0 ? (
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-ink-secondary">{tx("Offer")}</span>
                <span className="font-medium text-[color:var(--pp-green)] tnum">
                  −${offerQuote.credit.toFixed(2)}
                </span>
              </div>
            ) : null}
            {offerQuote.credit > 0 ? (
              <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
                <span className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Due today")}</span>
                <span className="font-display text-xl font-medium text-[color:var(--pp-primary-950)] tnum">
                  {formatFee(offerQuote.due)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            {savedLast4 && useSaved ? (
              <>
                <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">
                  {tx("Card on file")}
                </p>
                <p className="mt-2 rounded-xl bg-[color:var(--pp-primary-100)] px-4 py-3 text-sm font-medium text-[color:var(--pp-primary-950)]">
                  Visa ····{savedLast4}
                </p>
                <button
                  type="button"
                  onClick={() => setUseSaved(false)}
                  className="mt-3 text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-70"
                >
                  {tx("Use a different card")}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <Field
                  label={tx("Card number")}
                  placeholder="4242 4242 4242 4242"
                  value={card}
                  onChange={(e) => setCard(e.target.value)}
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label={tx("Expiry")}
                    placeholder="12 / 27"
                    value={exp}
                    onChange={(e) => setExp(e.target.value)}
                    autoComplete="cc-exp"
                  />
                  <Field
                    label={tx("CVC")}
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </div>
                {savedLast4 ? (
                  <button
                    type="button"
                    onClick={() => setUseSaved(true)}
                    className="text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-70"
                  >
                    {tx("Use saved card")} ····{savedLast4}
                  </button>
                ) : null}
              </div>
            )}
            <p className="mt-4 text-xs text-ink-tertiary">
              {tx("Demo checkout — no real payment is processed.")}
            </p>
          </div>

          <CheckoutOffers context={offerCtx} />

          <Button fullWidth disabled={!canPay} onClick={pay} className="!rounded-2xl">
            {tx("Pay {amount}").replace("{amount}", formatFee(offerQuote.due))}
          </Button>
        </div>
      ) : null}

      {phase === "send" ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[color:var(--pp-primary-100)]"
            aria-hidden
          >
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--pp-primary-950)] border-t-transparent" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("Sending your request")}
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">
            {tx("Your request is being sent to {name} for approval.")
              .replace("{name}", doctorName)}
          </p>
          <ol className="mx-auto mt-8 max-w-xs space-y-3 text-left">
            {[
              tx("Payment received"),
              tx("Request sent to doctor"),
              tx("Waiting for approval"),
            ].map((label, i) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span
                  className={
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full text-2xs font-semibold " +
                    (sendStep > i
                      ? "bg-wellness text-white"
                      : sendStep === i
                        ? "bg-[color:var(--pp-primary-950)] text-white"
                        : "border border-line text-ink-tertiary")
                  }
                >
                  {sendStep > i ? "✓" : i + 1}
                </span>
                <span className={sendStep >= i ? "text-[color:var(--pp-primary-950)]" : "text-ink-tertiary"}>
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="animate-fade-up space-y-4">
          <div className="rounded-2xl border border-line bg-white p-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-wellness-subtle text-2xl" aria-hidden>
              ✓
            </span>
            <p className="pp-caps mt-4 text-[color:var(--pp-violet)]">{tx("Request sent")}</p>
            <h2 className="mt-2 font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Waiting for the doctor")}
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              {tx("We’ll notify you when {name} approves your visit.")
                .replace("{name}", doctorName)}
            </p>
            {confirmation ? (
              <p className="mt-4 rounded-xl bg-[color:var(--pp-primary-100)] px-4 py-3 font-mono text-sm font-semibold text-[color:var(--pp-primary-950)]">
                {confirmation.no}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-2xl border border-line bg-white p-5">
            <CheckoutRow k={tx("Provider")} v={doctorName} />
            <CheckoutRow k={tx("Date & time")} v={`${date} · ${time}`} />
            <CheckoutRow k={tx("Visit")} v={visitLabel} />
            <CheckoutRow k={tx("Patient")} v={patientName} />
            {specialtyLabel ? <CheckoutRow k={tx("Specialisation")} v={specialtyLabel} /> : null}
            <CheckoutRow k={tx("Paid")} v={formatFee(fee)} />
          </div>

          <div className="space-y-2 pt-2">
            <Button
              fullWidth
              onClick={() => nav(confirmation?.id ? `/appointments/visit/${confirmation.id}` : "/appointments")}
            >
              {tx("Open this visit")}
            </Button>
            <Button fullWidth variant="secondary" onClick={() => nav("/messages")}>
              {tx("Message care team")}
            </Button>
            <Button fullWidth variant="ghost" onClick={() => nav("/appointments")}>
              {tx("All appointments")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckoutRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-ink-tertiary">{k}</span>
      <span className="text-right text-sm font-medium text-[color:var(--pp-primary-950)]">{v}</span>
    </div>
  );
}
