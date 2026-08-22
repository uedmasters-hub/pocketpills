import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AvailabilityBoard,
  AvailabilityLocationPill,
} from "@/components/appointments/AvailabilityBoard";
import { useAvailabilityPicker } from "@/components/appointments/useAvailabilityPicker";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import { formatFee } from "@/lib/appointments";
import { serviceQuote } from "@/lib/bookingQuote";
import type { CheckoutContext } from "@/lib/offers";
import {
  careVisitTypeLabel,
  careWorkerKindLabel,
  createCareWorkerBooking,
  getCareWorker,
  type CareVisitType,
} from "@/lib/careWorkers";
import { BookingPaymentOption, VisitWhoPanel } from "@/components/appointments/BookingFieldsDraft";
import { BookingReviewSidebar } from "@/components/appointments/BookingReviewSidebar";
import { useBookingPatient } from "@/components/appointments/useBookingPatient";
import { usePaymentFields } from "@/components/checkout/ChoosePaymentOption";
import { ServicePageShell } from "@/pages/appointments/ServicePageShell";

function parseVisit(raw: string | null, allowed: CareVisitType[]): CareVisitType | null {
  if (raw === "home" || raw === "clinic" || raw === "virtual") {
    return allowed.includes(raw) ? raw : null;
  }
  return null;
}

export function BookAssistant() {
  const { tx } = useI18n();
  const { user, update } = useUser();
  const nav = useNavigate();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const worker = getCareWorker(id);
  const booking = useBookingPatient();
  const pay = usePaymentFields(user?.cardLast4);

  const paramVisit = parseVisit(params.get("visit"), worker?.visitTypes ?? []);
  const paramDate = params.get("date") ?? "";
  const paramTime = params.get("time") ?? "";
  const paramService = params.get("service") ?? "";

  const [visitType, setVisitType] = useState<CareVisitType>(
    paramVisit ?? worker?.visitTypes[0] ?? "home",
  );
  const [service, setService] = useState(
    paramService && worker?.services.includes(paramService) ? paramService : (worker?.services[0] ?? ""),
  );
  const avail = useAvailabilityPicker(worker?.id ?? id, visitType);
  const locked = Boolean(paramDate && paramTime);

  const date = locked ? paramDate : avail.date;
  const time = locked ? paramTime : avail.time;

  const visitOptions = useMemo(
    () =>
      (worker?.visitTypes ?? []).map((v) => ({
        id: v,
        label: tx(careVisitTypeLabel(v)),
      })),
    [worker, tx],
  );

  if (!worker) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">{tx("Not found")}</p>
        <Link to="/appointments" className="mt-4 inline-block text-sm text-[color:var(--pp-violet)]">
          ‹ {tx("Back")}
        </Link>
      </div>
    );
  }

  const due = serviceQuote(worker.feeFrom).beforeOffer;
  const offerContext = {
    kind: "care",
    amount: due,
    specialty: careWorkerKindLabel(worker.kind),
  } satisfies CheckoutContext;

  const confirm = () => {
    if (!service || !date || !time || !booking.patient || booking.visitTab === "new" || !pay.ready(due)) return;
    try {
      update({ paymentOnFile: true, cardLast4: pay.last4 });
    } catch {
      /* demo */
    }
    const b = createCareWorkerBooking({
      workerId: worker.id,
      visitType,
      service,
      date,
      time,
      patientName: booking.patient.name,
      patientId: booking.patientId,
      notes: booking.notes.trim(),
    });
    if (b) nav(`/appointments/assistants/visit/${b.id}`);
  };

  return (
    <ServicePageShell
      backTo={`/appointments/assistants/${worker.id}`}
      aside={
        <BookingReviewSidebar
          doctorName={worker.name}
          doctorImage={worker.imageUrl || ""}
          credentials={tx(worker.subtitle)}
          verified={false}
          visitKindLabel={tx(careVisitTypeLabel(visitType))}
          quoteKind="service"
          feeLabel={tx("Visit fee")}
          fee={worker.feeFrom}
          date={date}
          time={time}
          patient={booking.patient}
          reports={booking.skipReports ? [] : booking.attached}
          onRemoveReport={booking.detachReport}
          findings={booking.library.consults
            .filter((f) => booking.findingIds.includes(f.id))
            .map((f) => ({ id: f.id, title: f.title, detail: f.detail }))}
          onRemoveFinding={(id) =>
            booking.patchShare(booking.patientId, {
              findingIds: booking.findingIds.filter((x) => x !== id),
            })
          }
          symptoms={booking.symptoms}
          onSymptoms={booking.setSymptoms}
          notes={booking.notes}
          onNotes={booking.setNotes}
          onConfirm={confirm}
          confirmDisabled={
            !service || !date || !time || !booking.patient || booking.visitTab === "new" || !pay.ready(due)
          }
          confirmHint={
            booking.visitTab === "new"
              ? tx("Save or cancel the new patient to continue.")
              : !pay.ready(due)
                ? tx("Choose a payment option on the left to continue.")
                : undefined
          }
          offerContext={offerContext}
        />
      }
    >
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx(careWorkerKindLabel(worker.kind))}</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Your details")}
      </h1>
      <p className="mt-2 text-ink-secondary">{worker.name}</p>

      <h2 className="mt-8 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
        {tx("Selected services")}
      </h2>
      <p className="mt-1 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
        {tx(careVisitTypeLabel(visitType))}
      </p>
      <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm">
        <span className="font-medium text-[color:var(--pp-primary-950)]">{tx(service)}</span>
        <span className="shrink-0 font-semibold tnum text-[color:var(--pp-primary-950)]">
          {formatFee(worker.feeFrom)}
        </span>
      </div>

      {locked ? null : (
        <>
          <h2 className="mt-8 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Service")}
          </h2>
          <div className="mt-4 space-y-3">
            {worker.services.map((s) => {
              const on = service === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setService(s)}
                  className={
                    "w-full rounded-2xl border px-4 py-3.5 text-left font-semibold transition-colors " +
                    (on
                      ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
                      : "border-line bg-white text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]")
                  }
                >
                  {tx(s)}
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <AvailabilityBoard
              visitOptions={visitOptions}
              visitType={visitType}
              onSelectVisit={(v) => setVisitType(v as CareVisitType)}
              location={worker.city ? <AvailabilityLocationPill>{worker.city}</AvailabilityLocationPill> : null}
              date={avail.date}
              days={avail.days}
              weekOffset={avail.weekOffset}
              time={avail.time}
              slots={avail.slots}
              onSelectDay={avail.selectDay}
              onSelectTime={avail.selectTime}
              onShiftWeek={avail.shiftWeek}
            />
          </div>
        </>
      )}

      <input
        ref={booking.fileRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.heic,image/*,application/pdf"
        multiple
        hidden
        className="hidden"
        onChange={(e) => {
          booking.onUpload(e.target.files);
          e.target.value = "";
          booking.whoPanel.onTab("reports");
        }}
      />

      <div className="mt-8 space-y-6">
        <VisitWhoPanel {...booking.whoPanel} />
        <BookingPaymentOption pay={pay} savedLast4={user?.cardLast4} due={due} />
      </div>
    </ServicePageShell>
  );
}
