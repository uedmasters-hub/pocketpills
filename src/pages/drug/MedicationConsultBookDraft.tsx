import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { BookingPaymentOption, VisitWhoPanel } from "@/components/appointments/BookingFieldsDraft";
import { BookingReviewSidebar } from "@/components/appointments/BookingReviewSidebar";
import { useBookingPatient } from "@/components/appointments/useBookingPatient";
import { DetailSection } from "@/components/DetailSection";
import { usePaymentFields } from "@/components/checkout/ChoosePaymentOption";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import { consultQuote } from "@/lib/bookingQuote";
import type { CheckoutContext } from "@/lib/offers";
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
import { ServicePageShell } from "@/pages/appointments/ServicePageShell";

const INDEX = "/drug";

export function MedicationConsultBookDraft() {
  const { tx } = useI18n();
  const { consultantId } = useParams();
  const nav = useNavigate();
  const { user } = useUser();
  const pay = usePaymentFields(user?.cardLast4);
  const booking = useBookingPatient();
  const consultant = consultantId ? getImmediateConsultant(consultantId) : undefined;
  const lines = consultLines();
  const all = listMedBasket();
  const quote = consultQuote(consultant?.fee ?? 0);

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
      <ServicePageShell backTo={`${INDEX}/consult`} backLabel={tx("Consultants")}>
        <div className="rounded-2xl border border-line bg-white p-12 text-center">
          <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Consultant not found")}</p>
        </div>
      </ServicePageShell>
    );
  }

  const waiting = request?.status === "in_consult";
  const waitingForProvider = waiting && autoIssueDelayMs(consultant) == null;
  const first = lines[0];
  const {
    fileRef,
    onUpload,
    visitTab,
    patient,
    patientId,
    library,
    attached,
    findingIds,
    skipReports,
    symptoms,
    setSymptoms,
    notes,
    setNotes,
    detachReport,
    patchShare,
    whoPanel,
  } = booking;

  const payConsult = () => {
    if (waiting || !pay.ready(quote.beforeOffer) || !first || !patient || visitTab === "new") return;
    const rxAttached = skipReports ? [] : attached;
    const req = createConsultRequest({
      consultant,
      drugSlug: first.slug,
      drugName: lines.map((l) => l.name).join(", "),
      dose: first.dose,
      qty: first.qty,
      patientName: patient.name || "Patient",
      items: lines,
      reportId: rxAttached[0]?.id,
    });
    setRequestId(req.id);
  };

  const reports = skipReports
    ? []
    : attached.map((a) => ({
        id: a.id,
        title: a.title,
        detail: a.detail,
        source: a.source,
        previewSrc: a.previewSrc,
      }));

  return (
    <ServicePageShell
      backTo={`${INDEX}/consult`}
      backLabel={tx("Consultants")}
      aside={
        <BookingReviewSidebar
          doctorName={consultant.name}
          doctorImage={consultant.imageUrl}
          credentials={consultant.subtitle}
          verified
          visitKindLabel={tx("Available now")}
          slotLabel={consultant.waitLabel}
          date=""
          time=""
          fee={consultant.fee}
          quoteKind="consult"
          patient={patient ?? null}
          reports={reports}
          onRemoveReport={detachReport}
          findings={library.consults
            .filter((f) => findingIds.includes(f.id))
            .map((f) => ({ id: f.id, title: f.title, detail: f.detail }))}
          onRemoveFinding={(id) =>
            patchShare(patientId, { findingIds: findingIds.filter((x) => x !== id) })
          }
          symptoms={symptoms}
          onSymptoms={setSymptoms}
          notes={notes}
          onNotes={setNotes}
          onConfirm={payConsult}
          confirmLabel="Pay and start consult"
          lede="Confirm, then start the consult."
          confirmDisabled={
            waiting || !patient || visitTab === "new" || !pay.ready(quote.beforeOffer)
          }
          confirmHint={
            waiting
              ? tx("Consult paid. Waiting on the prescription.")
              : visitTab === "new"
                ? tx("Save or cancel the new patient to continue.")
                : !pay.ready(quote.beforeOffer)
                  ? tx("Choose a payment option on the left to continue.")
                  : undefined
          }
          offerContext={
            {
              kind: "consult",
              amount: quote.beforeOffer,
              specialty: tx("Family medicine"),
            } satisfies CheckoutContext
          }
        />
      }
    >
      <div className="space-y-6">
        <DetailSection
          title={tx("This consult")}
          lede={tx("The doctor reviews this list. If they issue prescriptions, you pay once and order everything together.")}
          flush
        >
          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <li key={`${line.slug}-${line.dose}`} className="flex justify-between gap-3 px-5 py-3 text-sm">
                <span className="font-medium text-[color:var(--pp-primary-950)]">{line.name}</span>
                <span className="shrink-0 text-ink-tertiary">
                  {line.dose} · {tx("Qty")} {line.qty}
                </span>
              </li>
            ))}
          </ul>
        </DetailSection>

      {waiting ? (
        <div className="rounded-2xl border border-line bg-[color:var(--pp-primary-100)] p-5">
          <p className="font-semibold text-[color:var(--pp-primary-950)]">
            {waitingForProvider ? tx("Waiting for the doctor to issue a prescription") : tx("Doctor is reviewing")}
          </p>
          <p className="mt-1 text-sm text-ink-secondary">
            {waitingForProvider
              ? tx("They issue the Rx from their consultant desk. Stay on this page.")
              : tx("Stay on this page. When the prescription is issued, you’ll go to payment and order.")}
          </p>
        </div>
      ) : (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.heic,image/*,application/pdf"
            multiple
            hidden
            className="hidden"
            onChange={(e) => {
              onUpload(e.target.files);
              e.target.value = "";
              whoPanel.onTab("reports");
            }}
          />
          <VisitWhoPanel {...whoPanel} />
          <BookingPaymentOption pay={pay} savedLast4={user?.cardLast4} due={quote.beforeOffer} />
        </>
      )}
      </div>
    </ServicePageShell>
  );
}
