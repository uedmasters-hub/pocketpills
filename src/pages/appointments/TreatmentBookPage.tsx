/**
 * Treatment step 2 — patient, payment, and confirm.
 * Slot is auto-picked so the flow stays two steps.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BookingPaymentOption, VisitWhoPanel } from "@/components/appointments/BookingFieldsDraft";
import { BookingReviewSidebar } from "@/components/appointments/BookingReviewSidebar";
import { useBookingPatient } from "@/components/appointments/useBookingPatient";
import { BookingRequestStatus } from "@/components/appointments/BookingCheckout";
import { usePaymentFields } from "@/components/checkout/ChoosePaymentOption";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import type { CheckoutContext } from "@/lib/offers";
import {
  createAppointment,
  firstOpenSlot,
  getProvider,
  nextOpenSlots,
  specialtyById,
  type VisitType,
} from "@/lib/appointments";
import { consultQuote } from "@/lib/bookingQuote";
import { treatments } from "@/lib/data";
import { isPastDate, isSlotInPast, todayIso } from "@/lib/timeSlots";
import { treatmentSpecialty } from "@/lib/treatmentGuides";
import { ServicePageShell } from "@/pages/appointments/ServicePageShell";

export function TreatmentBookPage() {
  const { tx } = useI18n();
  const { user, update } = useUser();
  const nav = useNavigate();
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const booking = useBookingPatient();
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

  const treatment = treatments.find((x) => x.slug === slug);
  const providerId = params.get("provider") ?? "";
  const provider = providerId ? getProvider(providerId) : undefined;

  const specialtyId = treatment
    ? treatmentSpecialty(treatment.slug, treatment.category)
    : provider?.specialties[0];
  const specialty = specialtyId ? specialtyById(specialtyId) : undefined;

  const visitType: VisitType | null = provider
    ? provider.visitTypes.includes("virtual")
      ? "virtual"
      : provider.visitTypes[0] ?? "clinic"
    : null;

  const slot = useMemo(() => {
    if (!provider || !visitType) return null;
    return firstOpenSlot(provider.id, todayIso(), visitType);
  }, [provider, visitType]);

  const date = slot?.date ?? "";
  const time = slot?.time ?? "";
  const slotPast = Boolean(date && time) && (isPastDate(date) || isSlotInPast(date, time));
  const nextSlots = useMemo(() => {
    if (!provider || !visitType) return [];
    return nextOpenSlots(provider.id, visitType, date, time, 4);
  }, [provider, visitType, date, time]);

  const [picked, setPicked] = useState<{ date: string; time: string } | null>(null);
  const activeDate = picked?.date || date;
  const activeTime = picked?.time || time;

  const [confirmation, setConfirmation] = useState<{ no: string; id: string } | null>(null);
  const pay = usePaymentFields(user?.cardLast4);
  const fee = provider?.consultationFee ?? 0;
  const quote = consultQuote(fee);
  const backTo = `/appointments/treatments/${slug}`;

  if (!treatment) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Treatment not found")}</p>
        <Link
          to="/dashboard"
          className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
        >
          ‹ {tx("Back")}
        </Link>
      </div>
    );
  }

  if (!provider || !visitType) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Choose a specialist first")}</p>
        <Link
          to={backTo}
          className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
        >
          ‹ {tx("Back to treatment")}
        </Link>
      </div>
    );
  }

  const payAndCreate = () => {
    if (!specialty || !patient || visitTab === "new") return;
    if (!activeDate || !activeTime) return;
    if (isPastDate(activeDate) || isSlotInPast(activeDate, activeTime)) return;
    if (!pay.ready(quote.beforeOffer)) return;
    try {
      update({ paymentOnFile: true, cardLast4: pay.last4 });
    } catch {
      /* demo — ignore */
    }
    const appt = createAppointment({
      providerId: provider.id,
      providerKind: provider.kind,
      providerName: provider.name,
      clinicianId: provider.id,
      clinicianName: provider.name,
      specialtyId: specialty.id,
      specialtyLabel: specialty.label,
      visitType,
      date: activeDate,
      time: activeTime,
      patientName: patient.name,
      patientRelation: patient.relation,
      patientId,
      contact: patient.contact,
      notes: notes.trim(),
      symptoms: symptoms.trim() || treatment.name,
      fee,
      reportIds: skipReports ? [] : attached.map((a) => a.id),
      findingIds,
      clinicName: visitType === "clinic" ? provider.name : undefined,
      clinicAddress: visitType === "clinic" ? provider.address || provider.city : undefined,
      status: "pending",
    });
    setConfirmation({ no: appt.confirmationNo, id: appt.id });
  };

  if (confirmation) {
    return (
      <BookingRequestStatus
        doctorName={provider.name}
        visitLabel={tx(treatment.name)}
        date={activeDate}
        time={activeTime}
        patientName={patient?.name ?? ""}
        specialtyLabel={specialty ? tx(specialty.label) : undefined}
        fee={fee}
        confirmation={confirmation}
        onClose={() => nav("/appointments")}
        awaitingParty="doctor"
      />
    );
  }

  return (
    <ServicePageShell
      backTo={backTo}
      backLabel={tx(treatment.name)}
      aside={
        <BookingReviewSidebar
          doctorName={provider.name}
          doctorImage={provider.imageUrl}
          credentials={[provider.subtitle.split(/[·•]/)[0]?.trim(), specialty ? tx(specialty.label) : null]
            .filter(Boolean)
            .join(" • ")}
          verified
          visitType={visitType}
          visitKindLabel={tx(treatment.name)}
          locationLabel={visitType === "clinic" ? provider.city : undefined}
          quoteKind="consult"
          fee={fee}
          date={activeDate}
          time={activeTime}
          nextSlots={slotPast ? nextSlots : []}
          onPickSlot={(nextDate, nextTime) => setPicked({ date: nextDate, time: nextTime })}
          patient={patient ?? null}
          reports={skipReports ? [] : attached}
          onRemoveReport={detachReport}
          findings={library.consults
            .filter((f) => findingIds.includes(f.id))
            .map((f) => ({
              id: f.id,
              title: f.title,
              detail: f.detail,
            }))}
          onRemoveFinding={(id) =>
            patchShare(patientId, { findingIds: findingIds.filter((x) => x !== id) })
          }
          symptoms={symptoms}
          onSymptoms={setSymptoms}
          notes={notes}
          onNotes={setNotes}
          onConfirm={payAndCreate}
          confirmLabel="Pay and confirm"
          lede="Confirm, then send the request."
          confirmDisabled={!patient || !specialty || visitTab === "new" || !pay.ready(quote.beforeOffer)}
          confirmHint={
            visitTab === "new"
              ? tx("Save or cancel the new patient to continue.")
              : !pay.ready(quote.beforeOffer)
                ? tx("Choose a payment option on the left to continue.")
                : undefined
          }
          offerContext={
            {
              kind: "consult",
              amount: quote.beforeOffer,
              specialty: specialty ? tx(specialty.label) : tx(treatment.name),
            } satisfies CheckoutContext
          }
        />
      }
    >
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx(treatment.name)}</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Pay and confirm")}
      </h1>
      <p className="mt-2 max-w-xl text-ink-secondary">
        {tx("Choose who this is for, pick a payment option, then confirm. The next open slot is reserved for you.")}
      </p>

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

      <div className="mt-8 space-y-6">
        <VisitWhoPanel {...whoPanel} />
        <BookingPaymentOption pay={pay} savedLast4={user?.cardLast4} due={quote.beforeOffer} />
      </div>
    </ServicePageShell>
  );
}
