import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PhoneField } from "@/components/PhoneField";
import { DetailSection } from "@/components/DetailSection";
import { LocationPicker } from "@/components/care/LocationPicker";
import { ChipGroup, ChoiceList, FieldLabel, joinChoices } from "@/components/care/PrepChoices";
import {
  ACCESS,
  ACCESS_AMBULANCE,
  ACCESS_COURIER,
  STORY_HOW,
  STORY_WHEN,
} from "@/components/care/PrepEditorFields";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import { isValidPhone } from "@/lib/phone";
import { serviceQuote } from "@/lib/bookingQuote";
import type { CheckoutContext } from "@/lib/offers";
import {
  createServiceRequest,
  getHealthService,
  healthServiceCategoryLabel,
} from "@/lib/healthServices";
import { BookingPaymentOption, VisitWhoPanel } from "@/components/appointments/BookingFieldsDraft";
import { BookingReviewSidebar } from "@/components/appointments/BookingReviewSidebar";
import { useBookingPatient } from "@/components/appointments/useBookingPatient";
import { usePaymentFields } from "@/components/checkout/ChoosePaymentOption";
import { ServicePageShell } from "@/pages/appointments/ServicePageShell";

export function ServiceDetail() {
  const { tx } = useI18n();
  const { user, update } = useUser();
  const nav = useNavigate();
  const { id = "" } = useParams();
  const service = getHealthService(id);
  const booking = useBookingPatient();
  const pay = usePaymentFields(user?.cardLast4);

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [extra, setExtra] = useState("");
  const [access, setAccess] = useState<string[]>([]);
  const [storyWhen, setStoryWhen] = useState<string[]>([]);
  const [storyHow, setStoryHow] = useState<string[]>([]);

  if (!service) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">{tx("Service not found")}</p>
        <Link to="/appointments" className="mt-4 inline-block text-sm text-[color:var(--pp-violet)]">
          ‹ {tx("Back")}
        </Link>
      </div>
    );
  }

  const needsAccess =
    service.category === "ambulance" ||
    service.id === "svc-home-oxygen" ||
    service.id === "svc-pharmacy-delivery";
  const needsStory =
    service.id === "svc-urgent-care" ||
    service.id === "svc-after-hours" ||
    service.id === "svc-mental-crisis";
  const needsAddress =
    service.category === "ambulance" ||
    service.id === "svc-home-oxygen" ||
    service.id === "svc-pharmacy-delivery" ||
    service.id === "svc-urgent-care";
  const accessOpts =
    service.category === "ambulance"
      ? ACCESS_AMBULANCE
      : service.id === "svc-pharmacy-delivery"
        ? ACCESS_COURIER
        : ACCESS;

  const composeNotes = () =>
    [
      booking.patient ? `Patient: ${booking.patient.name}` : "",
      access.length ? `Access: ${joinChoices(access)}` : "",
      joinChoices([...storyWhen, ...storyHow]),
      extra.trim(),
      booking.notes.trim(),
    ]
      .filter(Boolean)
      .join("\n");

  const fee = service.feeFrom ?? 0;
  const due = serviceQuote(fee).beforeOffer;
  const offerContext = {
    kind: "service",
    amount: due,
    specialty: healthServiceCategoryLabel(service.category),
  } satisfies CheckoutContext;
  const slotEyebrow =
    service.etaMinutes != null
      ? `${tx("Typical ETA")} · ~${service.etaMinutes} ${tx("min")}`
      : service.available24h
        ? tx("Available 24/7")
        : service.city;
  const canRequest =
    isValidPhone(phone) &&
    !(needsAddress && !address.trim()) &&
    Boolean(booking.patient) &&
    booking.visitTab !== "new" &&
    pay.ready(due);

  const confirm = () => {
    if (!canRequest) return;
    try {
      if (due > 0) update({ paymentOnFile: true, cardLast4: pay.last4 });
    } catch {
      /* demo */
    }
    const r = createServiceRequest({
      serviceId: service.id,
      address,
      notes: composeNotes(),
      phone: phone.trim() || booking.patient?.contact || "",
    });
    if (r) nav(`/appointments/services/request/${r.id}`);
  };

  return (
    <ServicePageShell
      aside={
        <BookingReviewSidebar
          doctorName={tx(service.name)}
          doctorImage=""
          credentials={tx(healthServiceCategoryLabel(service.category))}
          verified={false}
          visitKindLabel={tx(healthServiceCategoryLabel(service.category))}
          quoteKind="service"
          feeLabel={tx("Service fee")}
          fee={fee}
          date=""
          time=""
          slotLabel={slotEyebrow}
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
          confirmDisabled={!canRequest}
          confirmHint={
            booking.visitTab === "new"
              ? tx("Save or cancel the new patient to continue.")
              : !isValidPhone(phone)
                ? tx("Add a contact phone to continue.")
                : needsAddress && !address.trim()
                  ? tx("Add a pickup address to continue.")
                  : !pay.ready(due)
                    ? tx("Choose a payment option on the left to continue.")
                    : undefined
          }
          offerContext={offerContext}
        />
      }
    >
      <p className="text-4xl" aria-hidden>
        {service.emoji}
      </p>
      <p className="mt-3 pp-caps text-[color:var(--pp-violet)]">
        {tx(healthServiceCategoryLabel(service.category))}
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
        {tx(service.name)}
      </h1>
      <p className="mt-2 text-ink-secondary">{tx(service.blurb)}</p>

      {service.id === "svc-ambulance" ? (
        <p className="mt-6 rounded-2xl bg-wellness-subtle px-4 py-3 text-sm text-wellness">
          {tx("If this is life-threatening, call 911 immediately.")}
        </p>
      ) : null}

      <div className="mt-10">
        <DetailSection title={tx("Request details")}>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-[color:var(--pp-primary-950)]">
                {tx(needsAddress ? "Pickup / service address" : "Where you are")}
                {needsAddress ? null : (
                  <span className="font-normal text-ink-tertiary"> ({tx("optional")})</span>
                )}
              </p>
              <LocationPicker value={address} onChange={setAddress} placeholder="Street, city" />
            </div>
            <PhoneField
              label={tx("Contact phone")}
              value={phone}
              onChange={setPhone}
            />
            {needsAccess ? (
              <div>
                <FieldLabel>Entrance / access</FieldLabel>
                <ChoiceList options={accessOpts} selected={access} multiple onChange={setAccess} />
              </div>
            ) : null}
            {needsStory ? (
              <div className="space-y-4">
                <div>
                  <FieldLabel>When it started</FieldLabel>
                  <ChipGroup options={STORY_WHEN} selected={storyWhen} onChange={setStoryWhen} />
                </div>
                <div>
                  <FieldLabel>How it feels now</FieldLabel>
                  <ChipGroup options={STORY_HOW} selected={storyHow} onChange={setStoryHow} />
                </div>
              </div>
            ) : null}
            <label className="block">
              <span className="text-sm font-medium text-ink-secondary">
                {tx("Anything else")} <span className="font-normal text-ink-tertiary">({tx("optional")})</span>
              </span>
              <input
                className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface-2 px-4 text-sm text-ink outline-none focus:border-[color:var(--pp-primary-950)]"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder={tx("One line is enough")}
              />
            </label>
          </div>
        </DetailSection>
      </div>

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
