import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import {
  attachLabBookingOrder,
  createLabBooking,
  getLab,
  labCollectionModeLabel,
  readLabDraft,
  resolveLabItem,
  summarizeLabSelection,
} from "@/lib/labs";
import { createLabOrder } from "@/lib/orders";
import { serviceQuote } from "@/lib/bookingQuote";
import type { CheckoutContext } from "@/lib/offers";
import { BookingPaymentOption, VisitWhoPanel } from "@/components/appointments/BookingFieldsDraft";
import { BookingReviewSidebar } from "@/components/appointments/BookingReviewSidebar";
import { useBookingPatient } from "@/components/appointments/useBookingPatient";
import { usePaymentFields } from "@/components/checkout/ChoosePaymentOption";
import { ServicePageShell } from "@/pages/appointments/ServicePageShell";

export function BookLab() {
  const { tx } = useI18n();
  const { user, update } = useUser();
  const nav = useNavigate();
  const { id = "" } = useParams();
  const lab = getLab(id);
  const booking = useBookingPatient();
  const pay = usePaymentFields(user?.cardLast4);

  const draft = useMemo(() => {
    const d = readLabDraft();
    if (!d || d.labId !== id) return null;
    return d;
  }, [id]);

  const summary = useMemo(
    () => (draft ? summarizeLabSelection(draft.itemIds) : { names: "", fee: 0, count: 0 }),
    [draft],
  );
  const due = serviceQuote(summary.fee).beforeOffer;

  const lineItems = (draft?.itemIds ?? [])
    .map((itemId) => resolveLabItem(itemId))
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((r) => ({
      id: r.item.id,
      name: r.name,
      fee: r.fee,
      collection: r.collection,
      isPackage: r.type === "bundle",
    }));

  const grouped = (
    [
      { mode: "home" as const, items: lineItems.filter((i) => i.collection === "home") },
      { mode: "physical" as const, items: lineItems.filter((i) => i.collection === "physical") },
    ] as const
  ).filter((g) => g.items.length > 0);

  const visitKindLabel =
    grouped.length === 1 ? tx(labCollectionModeLabel(grouped[0].mode)) : tx("Lab");

  if (!lab) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">{tx("Lab not found")}</p>
        <Link to="/appointments" className="mt-4 inline-block text-sm text-[color:var(--pp-violet)]">
          ‹ {tx("Back")}
        </Link>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">
          {tx("Select services first")}
        </p>
        <p className="mt-2 text-sm text-ink-tertiary">
          {tx("Pick packages, scans, or tests on the lab page, then continue.")}
        </p>
        <Link
          to={`/appointments/labs/${lab.id}`}
          className="mt-4 inline-block text-sm font-medium text-[color:var(--pp-violet)]"
        >
          ← {tx("Back to lab")}
        </Link>
      </div>
    );
  }

  const offerContext = {
    kind: "lab",
    amount: due,
    specialty: "lab",
  } satisfies CheckoutContext;

  const confirm = () => {
    if (!booking.patient || booking.visitTab === "new" || !pay.ready(due)) return;
    try {
      update({ paymentOnFile: true, cardLast4: pay.last4 });
    } catch {
      /* demo */
    }
    const b = createLabBooking({
      labId: lab.id,
      itemIds: draft.itemIds,
      date: draft.date,
      time: draft.time,
      patientName: booking.patient.name,
      patientId: booking.patientId,
      notes: booking.notes.trim(),
    });
    if (b) {
      const order = createLabOrder({
        labName: lab.name,
        labAddress: `${lab.address}, ${lab.city}`,
        itemNames: b.itemNames,
        fee: b.fee,
        date: b.date,
        time: b.time,
        patient: booking.patient.name,
        labBookingId: b.id,
        confirmationNo: b.confirmationNo,
      });
      attachLabBookingOrder(b.id, order.id);
      nav(`/appointments/labs/visit/${b.id}`);
    }
  };

  return (
    <ServicePageShell
      backTo={`/appointments/labs/${lab.id}`}
      aside={
        <BookingReviewSidebar
          doctorName={lab.name}
          doctorImage=""
          credentials={lab.subtitle}
          verified={false}
          visitKindLabel={visitKindLabel}
          quoteKind="service"
          feeLabel={tx("Lab tests")}
          fee={summary.fee}
          date={draft.date}
          time={draft.time}
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
          confirmDisabled={!booking.patient || booking.visitTab === "new" || !pay.ready(due)}
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
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Lab")}</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Your details")}
      </h1>
      <p className="mt-2 text-ink-secondary">{lab.name}</p>

      <h2 className="mt-8 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
        {tx("Selected services")}
      </h2>
      <div className="mt-3 space-y-5">
        {grouped.map((group) => (
          <div key={group.mode}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {tx(labCollectionModeLabel(group.mode))}
            </p>
            <ul className="mt-2 space-y-2">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm"
                >
                  <span>
                    <span className="font-medium text-[color:var(--pp-primary-950)]">{tx(item.name)}</span>
                    {item.isPackage ? (
                      <span className="mt-0.5 block text-2xs text-ink-tertiary">{tx("Package")}</span>
                    ) : null}
                  </span>
                  <span
                    className={
                      "shrink-0 font-semibold tnum " +
                      (item.fee <= 0
                        ? "text-[color:var(--pp-green)]"
                        : "text-[color:var(--pp-primary-950)]")
                    }
                  >
                    {item.fee <= 0 ? tx("FREE") : `$${item.fee.toFixed(2)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
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
