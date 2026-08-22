import { Link, useParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { formatFee, getAppointment, getProvider } from "@/lib/appointments";
import {
  clinicKindLabel,
  formatVisitWhen,
  phaseLabel,
  visitPhase,
  visitTypeLabel,
} from "@/lib/appointmentGuide";
import { CareJourneyPage } from "@/pages/care/CareJourneyPage";

export function AppointmentDetail() {
  return <CareJourneyPage kind="visit" />;
}

export function AppointmentReceipt() {
  const { tx } = useI18n();
  const { id } = useParams();
  const a = getAppointment(id);
  if (!a) {
    return (
      <div className="min-h-screen bg-surface-0 p-10 text-center">
        <p className="text-lg font-semibold text-ink">{tx("Visit not found")}</p>
        <Link to="/appointments" className="mt-2 inline-block font-semibold text-primary hover:underline">
          {tx("Back to appointments")}
        </Link>
      </div>
    );
  }

  const provider = getProvider(a.providerId);
  const hostName = a.providerName;
  const consultant =
    a.clinicianName && a.clinicianName !== a.providerName ? a.clinicianName : null;
  const phase = visitPhase(a);
  const banner =
    phase === "cancelled" || phase === "missed" || phase === "unavailable"
      ? "rounded-xl bg-amber-50 px-4 py-3 text-amber-900"
      : phase === "pending"
        ? "rounded-xl bg-sky-50 px-4 py-3 text-sky-900"
        : "rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800";
  const receiptNote =
    phase === "cancelled"
      ? "Payment receipt for this booking. The visit itself was cancelled."
      : phase === "missed"
        ? "Payment receipt for this booking. The consult was not attempted."
        : phase === "unavailable"
          ? "Payment receipt for this booking. A new slot still needs confirming."
          : phase === "pending"
            ? a.providerKind === "hospital"
              ? "Payment receipt for this request. The hospital has not accepted yet."
              : a.providerKind === "clinic"
                ? "Payment receipt for this request. The clinic has not accepted yet."
                : "Payment receipt for this request. The clinician has not accepted yet."
            : null;

  return (
    <div className="min-h-screen bg-surface-0 print:bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-line bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            to={`/appointments/visit/${a.id}`}
            className="text-sm font-semibold text-ink-secondary hover:text-ink"
          >
            ← {tx("Back to visit")}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center rounded-full bg-cta px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-cta-hover"
          >
            {tx("Download / Print receipt")}
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8 print:p-0">
        <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-stone-900 shadow-card print:rounded-none print:border-0 print:shadow-none sm:p-10">
          <div className="flex items-start justify-between">
            <Logo animate={false} className="text-[#4E2A84]" />
            <div className="text-right">
              <p className="text-xl font-medium text-stone-900">{tx("Visit receipt")}</p>
              <p className="text-sm text-stone-500">{a.confirmationNo}</p>
            </div>
          </div>

          <div className={`mt-6 flex items-center justify-between ${banner}`}>
            <span className="font-semibold">{tx(phaseLabel(phase, a.providerKind))}</span>
            <span className="text-sm">{formatVisitWhen(a.date, a.time)}</span>
          </div>
          {receiptNote ? <p className="mt-3 text-sm text-stone-600">{tx(receiptNote)}</p> : null}

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-stone-500">{tx("Patient")}</p>
              <p className="font-medium text-stone-900">{a.patientName}</p>
              <p className="text-stone-600">{tx(a.patientRelation)}</p>
            </div>
            <div className="text-right">
              <p className="text-stone-500">{tx(clinicKindLabel(a))}</p>
              <p className="font-medium text-stone-900">{hostName}</p>
              <p className="text-stone-600">
                {consultant ? `${consultant} · ${tx(a.specialtyLabel)}` : tx(a.specialtyLabel)}
              </p>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-500">
                <th className="py-2 font-medium">{tx("Item")}</th>
                <th className="py-2 text-right font-medium">{tx("Amount")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stone-100">
                <td className="py-3">
                  {tx(a.facilityServiceLabel || visitTypeLabel(a.visitType))}
                  <span className="block text-stone-500">
                    {consultant ? `${consultant} · ${tx(a.specialtyLabel)}` : tx(a.specialtyLabel)}
                  </span>
                </td>
                <td className="py-3 text-right tnum">{formatFee(a.fee ?? 0)}</td>
              </tr>
            </tbody>
          </table>

          {a.clinicAddress || provider?.address ? (
            <p className="mt-6 text-sm text-stone-600">
              {a.clinicName || provider?.name}
              <br />
              {a.clinicAddress || provider?.address}
            </p>
          ) : (
            <p className="mt-6 text-sm text-stone-600">{tx("Virtual visit via PocketPills Messages")}</p>
          )}

          <p className="mt-8 text-xs leading-relaxed text-stone-500">
            {tx("Demo receipt — no real payment was processed. This is not a tax invoice.")}
          </p>
        </div>
      </div>
    </div>
  );
}
