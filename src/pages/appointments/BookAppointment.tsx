/**
 * Book appointment — patient, payment, and visit review.
 */
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
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
  facilityServiceHref,
  formatFee,
  getFacilityService,
  getHostFacility,
  getProvider,
  isSpecialtyId,
  kindLabel,
  nextOpenSlots,
  serviceKindLabel,
  specialtyById,
  type SpecialtyId,
  type VisitType,
} from "@/lib/appointments";
import { consultQuote, serviceQuote } from "@/lib/bookingQuote";
import { isPastDate, isSlotInPast } from "@/lib/timeSlots";
import { ServicePageShell } from "@/pages/appointments/ServicePageShell";

export function BookAppointment() {
  const { tx } = useI18n();
  const { user, update } = useUser();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
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

  const providerId = params.get("provider");
  const provider = providerId ? getProvider(providerId) : undefined;
  const reasonParam = params.get("reason");
  const specialtyId: SpecialtyId | null = isSpecialtyId(reasonParam)
    ? reasonParam
    : provider?.specialties[0] ?? null;
  const specialty = specialtyId ? specialtyById(specialtyId) : undefined;

  const visitRaw = params.get("visit");
  const visitType: VisitType | null =
    visitRaw === "virtual" || visitRaw === "clinic" ? visitRaw : null;
  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";
  const bookedService = provider
    ? getFacilityService(provider, params.get("service") ?? "")
    : undefined;
  const facilityId = params.get("facility") || undefined;
  const slotPast = Boolean(date && time) && (isPastDate(date) || isSlotInPast(date, time));
  const nextSlots = useMemo(() => {
    if (!providerId || !visitType || !slotPast) return [];
    return nextOpenSlots(providerId, visitType, date, time, 4);
  }, [providerId, visitType, slotPast, date, time]);

  const pickSlot = (nextDate: string, nextTime: string) => {
    const next = new URLSearchParams(params);
    next.set("date", nextDate);
    next.set("time", nextTime);
    setParams(next, { replace: true });
  };

  const [confirmation, setConfirmation] = useState<{ no: string; id: string } | null>(null);
  const pay = usePaymentFields(user?.cardLast4);
  const slotReady = !!(date && time && visitType);

  if (!provider) {
    return (
      <EmptyState
        title={tx("Choose a provider first")}
        body={tx("Choose a specialisation, then pick a nearby doctor, clinic, or hospital.")}
        cta={tx("Browse specialisations")}
        onCta={() => nav("/appointments")}
      />
    );
  }

  const host =
    getHostFacility(facilityId) ?? (provider.kind !== "doctor" ? provider : undefined);
  const clinician = provider.kind === "doctor" ? provider : undefined;
  const org = host ?? provider;
  const facilityConsult = Boolean(host && clinician);

  if (!slotReady) {
    const back = bookedService
      ? facilityServiceHref(provider.id, bookedService.id)
      : `/appointments/provider/${provider.id}${(() => {
          const qs = new URLSearchParams();
          if (specialtyId) qs.set("specialty", specialtyId);
          if (host) qs.set("facility", host.id);
          const s = qs.toString();
          return s ? `?${s}` : "";
        })()}`;
    return (
      <EmptyState
        title={tx("Select a time first")}
        body={tx("Pick a virtual or in-clinic slot on the provider page, then continue here.")}
        cta={tx("Back to availability")}
        onCta={() => nav(back)}
      />
    );
  }

  const fee = bookedService
    ? bookedService.feeFrom
    : provider.consultationFee > 0
      ? provider.consultationFee
      : specialty?.feeFrom ?? 0;
  const quote = bookedService ? serviceQuote(fee) : consultQuote(fee);
  const isFacilityService = Boolean(bookedService);

  const backTo = bookedService
    ? facilityServiceHref(provider.id, bookedService.id)
    : `/appointments/provider/${provider.id}${(() => {
    const qs = new URLSearchParams();
    if (specialtyId) qs.set("specialty", specialtyId);
    if (facilityId) qs.set("facility", facilityId);
    const s = qs.toString();
    return s ? `?${s}` : "";
  })()}`;
  const close = () => nav(backTo);

  const goToPayment = () => {
    if (!specialty || !visitType || !patient || visitTab === "new") return;
    if (isPastDate(date) || isSlotInPast(date, time)) return;
    if (!pay.ready(quote.beforeOffer)) return;
    const conf = payAndCreate(pay.last4);
    if (conf.no) setConfirmation(conf);
  };

  const payAndCreate = (cardLast4: string) => {
    if (!specialty || !visitType || !patient) {
      return { no: "", id: "" };
    }
    try {
      update({ paymentOnFile: true, cardLast4 });
    } catch {
      /* demo — ignore */
    }
    const appt = createAppointment({
      providerId: org.id,
      providerKind: org.kind,
      providerName: org.name,
      clinicianId: clinician?.id ?? org.id,
      clinicianName: clinician?.name ?? org.name,
      specialtyId: specialty.id,
      specialtyLabel: specialty.label,
      visitType,
      date,
      time,
      patientName: patient.name,
      patientRelation: patient.relation,
      patientId,
      contact: patient.contact,
      notes: notes.trim(),
      symptoms: symptoms.trim(),
      fee,
      reportIds: skipReports ? [] : attached.map((a) => a.id),
      findingIds,
      clinicName: visitType === "clinic" ? org.name : undefined,
      clinicAddress: visitType === "clinic" ? org.address || org.city : undefined,
      facilityServiceKind: bookedService?.kind ?? (facilityConsult ? "consult" : undefined),
      facilityServiceLabel: bookedService?.label ?? (facilityConsult ? "Consultant" : undefined),
      status: "pending",
    });
    return { no: appt.confirmationNo, id: appt.id };
  };

  if (confirmation) {
    return (
      <BookingRequestStatus
        doctorName={org.name}
        visitLabel={
          bookedService
            ? tx(bookedService.label)
            : tx(visitType === "virtual" ? "Virtual visit" : "In-clinic visit")
        }
        date={date}
        time={time}
        patientName={patient.name}
        specialtyLabel={specialty ? tx(specialty.label) : undefined}
        consultantName={facilityConsult ? clinician?.name : undefined}
        fee={fee}
        confirmation={confirmation}
        onClose={close}
        awaitingParty={org.kind === "hospital" || org.kind === "clinic" ? org.kind : "doctor"}
      />
    );
  }

  return (
    <ServicePageShell
      backTo={backTo}
      aside={
        <BookingReviewSidebar
          doctorName={org.name}
          doctorImage={org.imageUrl}
          credentials={
            facilityConsult
              ? [clinician?.name, specialty ? tx(specialty.label) : null].filter(Boolean).join(" · ")
              : [
                  bookedService ? tx(serviceKindLabel(bookedService.kind)) : provider.subtitle.split(/[·•]/)[0]?.trim(),
                  !bookedService && specialty ? tx(specialty.label) : null,
                ]
                  .filter(Boolean)
                  .join(" • ") || tx(kindLabel(org.kind))
          }
          verified
          visitType={visitType}
          visitKindLabel={bookedService ? tx(bookedService.label) : facilityConsult ? tx("Consultant") : undefined}
          locationLabel={visitType === "clinic" ? org.city : undefined}
          quoteKind={isFacilityService || facilityConsult ? "service" : "consult"}
          feeLabel={isFacilityService ? tx("Service fee") : undefined}
          fee={fee}
          date={date}
          time={time}
          nextSlots={nextSlots}
          onPickSlot={pickSlot}
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
          onConfirm={goToPayment}
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
              kind: isFacilityService ? "service" : "consult",
              amount: quote.beforeOffer,
              specialty: bookedService
                ? tx(serviceKindLabel(bookedService.kind))
                : specialty
                  ? tx(specialty.label)
                  : undefined,
            } satisfies CheckoutContext
          }
        />
      }
    >
      <p className="pp-caps text-[color:var(--pp-violet)]">{org.name}</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Your details")}
      </h1>
      <p className="mt-2 text-ink-secondary">{clinician && host ? clinician.name : provider.name}</p>

      {bookedService ? (
        <>
          <h2 className="mt-8 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Selected services")}
          </h2>
          <p className="mt-1 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
            {tx(serviceKindLabel(bookedService.kind))}
          </p>
          <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm">
            <span className="font-medium text-[color:var(--pp-primary-950)]">{tx(bookedService.label)}</span>
            <span className="shrink-0 font-semibold tnum text-[color:var(--pp-primary-950)]">
              {formatFee(bookedService.feeFrom)}
            </span>
          </div>
        </>
      ) : facilityConsult ? (
        <>
          <h2 className="mt-8 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Selected services")}
          </h2>
          <p className="mt-1 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
            {tx("Consultant")}
          </p>
          <div className="mt-3 rounded-xl border border-line bg-white px-4 py-3 text-sm">
            <span className="font-medium text-[color:var(--pp-primary-950)]">{clinician?.name}</span>
            {specialty ? (
              <span className="mt-0.5 block text-ink-tertiary">{tx(specialty.label)}</span>
            ) : null}
          </div>
        </>
      ) : null}

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

function EmptyState({
  title,
  body,
  cta,
  onCta,
}: {
  title: string;
  body: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">{title}</h1>
      <p className="mt-2 text-sm text-ink-secondary">{body}</p>
      <Button className="mt-6 !rounded-full" onClick={onCta}>
        {cta}
      </Button>
    </div>
  );
}
