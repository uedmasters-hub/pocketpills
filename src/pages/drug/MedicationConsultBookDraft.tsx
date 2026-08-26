import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ChoosePaymentOption, usePaymentFields } from "@/components/checkout/ChoosePaymentOption";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import {
  autoIssueDelayMs,
  createConsultRequest,
  getConsultRequest,
  getImmediateConsultant,
  issueConsultPrescription,
  subscribeImmediateConsult,
} from "@/lib/immediateConsult";
import {
  basketIsConfirmed,
  consultLines,
  listMedBasket,
  markBasketConsultIssued,
} from "@/lib/medBasketDraft";

const INDEX = "/drug/draft";

export function MedicationConsultBookDraft() {
  const { tx } = useI18n();
  const { consultantId } = useParams();
  const nav = useNavigate();
  const { displayName } = useUser();
  const pay = usePaymentFields();
  const consultant = consultantId ? getImmediateConsultant(consultantId) : undefined;
  const lines = consultLines();
  const all = listMedBasket();

  const [requestId, setRequestId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  void tick;

  useEffect(() => subscribeImmediateConsult(() => setTick((n) => n + 1)), []);

  const request = requestId ? getConsultRequest(requestId) : undefined;

  const lineKey = lines.map((l) => `${l.slug}:${l.dose}`).join("|");

  useEffect(() => {
    if (!request || request.status !== "in_consult" || !consultant) return;
    const delay = autoIssueDelayMs(consultant);
    if (delay == null) return;
    const note = lines.map((l) => `${l.name} ${l.dose}`).join(" · ");
    const t = window.setTimeout(() => {
      issueConsultPrescription(request.id, note);
    }, delay);
    return () => window.clearTimeout(t);
  }, [request?.id, request?.status, consultant, lineKey]);

  useEffect(() => {
    if (!request || request.status !== "issued") return;
    markBasketConsultIssued();
    nav(`${INDEX}/order?rx=${request.id}`, { replace: true });
  }, [request, nav]);

  if (!all.length || !basketIsConfirmed()) return <Navigate to={INDEX} replace />;
  if (!lines.length && !requestId) return <Navigate to={`${INDEX}/order`} replace />;

  if (!consultant) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Consultant not found")}</p>
        <Link
          to={`${INDEX}/consult`}
          className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
        >
          {tx("Back to consultants")}
        </Link>
      </div>
    );
  }

  const waiting = request?.status === "in_consult";
  const waitingForProvider = waiting && autoIssueDelayMs(consultant) == null;
  const first = lines[0];

  const payConsult = () => {
    if (!pay.ready(consultant.fee) || !first) return;
    const req = createConsultRequest({
      consultant,
      drugSlug: first.slug,
      drugName: lines.map((l) => l.name).join(", "),
      dose: first.dose,
      qty: first.qty,
      patientName: displayName || "Patient",
      items: lines,
    });
    setRequestId(req.id);
  };

  return (
    <div>
      <Link
        to={`${INDEX}/consult`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {tx("Consultants")}
      </Link>

      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Available doctor")}</p>
          <div className="mt-3 flex items-start gap-4">
            <img src={consultant.imageUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            <div>
              <h1 className="font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
                {consultant.name}
              </h1>
              <p className="mt-1 text-sm text-ink-tertiary">{consultant.subtitle}</p>
              <p className="mt-1 text-2xs text-wellness">{consultant.waitLabel}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-white p-5">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("This consult")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {lines.map((line) => (
                <li key={`${line.slug}-${line.dose}`} className="flex justify-between gap-3">
                  <span className="text-[color:var(--pp-primary-950)]">{line.name}</span>
                  <span className="text-ink-tertiary">
                    {line.dose} · {tx("Qty")} {line.qty}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
              {tx("The doctor reviews this list. If they issue prescriptions, you pay once and order everything together.")}
            </p>
          </div>

          {waiting ? (
            <div className="mt-6 rounded-2xl border border-line bg-[color:var(--pp-primary-100)] p-5">
              <p className="font-semibold text-[color:var(--pp-primary-950)]">
                {waitingForProvider ? tx("Waiting for the doctor to issue a prescription") : tx("Doctor is reviewing")}
              </p>
              <p className="mt-1 text-sm text-ink-secondary">
                {waitingForProvider
                  ? tx("They issue the Rx from their consultant desk. Stay on this page.")
                  : tx("Stay on this page. When the prescription is issued, you’ll go to payment and order.")}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)] lg:sticky lg:top-28">
          <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Consult fee")}</p>
          <p className="mt-3 font-display text-3xl font-medium text-[color:var(--pp-primary-950)] tnum">
            ${consultant.fee.toFixed(2)}
          </p>
          <p className="mt-1 text-2xs text-ink-tertiary">
            {tx("One fee for this list. Medicine is paid after the Rx is issued.")}
          </p>

          {waiting ? (
            <p className="mt-5 text-sm text-ink-secondary">{tx("Consult paid. Waiting on the prescription.")}</p>
          ) : (
            <>
              <div className="mt-5">
                <ChoosePaymentOption pay={pay} due={consultant.fee} />
              </div>
              <Button
                fullWidth
                className="mt-5"
                disabled={!pay.ready(consultant.fee)}
                onClick={payConsult}
              >
                {tx("Pay and start consult")}
              </Button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
