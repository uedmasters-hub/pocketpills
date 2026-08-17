import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";

type Phase = "send" | "done";

export function BookingRequestStatus({
  doctorName,
  visitLabel,
  date,
  time,
  patientName,
  specialtyLabel,
  fee,
  confirmation,
  onClose,
}: {
  doctorName: string;
  visitLabel: string;
  date: string;
  time: string;
  patientName: string;
  specialtyLabel?: string;
  fee: number;
  confirmation: { no: string; id: string };
  onClose: () => void;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>("send");
  const [sendStep, setSendStep] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = window.setTimeout(() => setSendStep(1), reduce ? 200 : 900);
    const t2 = window.setTimeout(() => setSendStep(2), reduce ? 400 : 1800);
    const t3 = window.setTimeout(() => setPhase("done"), reduce ? 600 : 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const title = phase === "send" ? tx("Sending request") : tx("Request sent");

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <ConfettiBurst fire={phase === "done"} />
      <header className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span />
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
            {tx("Your request is being sent to {name} for approval.").replace("{name}", doctorName)}
          </p>
          <ol className="mx-auto mt-8 max-w-xs space-y-3 text-left">
            {[tx("Payment received"), tx("Request sent to doctor"), tx("Waiting for approval")].map((label, i) => (
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
      ) : (
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
              {tx("We’ll notify you when {name} approves your visit.").replace("{name}", doctorName)}
            </p>
            <p className="mt-4 rounded-xl bg-[color:var(--pp-primary-100)] px-4 py-3 font-mono text-sm font-semibold text-[color:var(--pp-primary-950)]">
              {confirmation.no}
            </p>
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
              onClick={() => nav(confirmation.id ? `/appointments/visit/${confirmation.id}` : "/appointments")}
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
      )}
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
