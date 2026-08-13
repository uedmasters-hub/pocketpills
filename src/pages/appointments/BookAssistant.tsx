import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import {
  CARE_TIME_SLOTS,
  careAvailabilityDays,
  createCareWorkerBooking,
  getCareWorker,
  type CareVisitType,
} from "@/lib/careWorkers";
import { ServiceCtaCard, ServicePageShell } from "@/pages/appointments/ServicePageShell";

export function BookAssistant() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { id = "" } = useParams();
  const worker = getCareWorker(id);
  const days = useMemo(() => careAvailabilityDays(5), []);

  const [visitType, setVisitType] = useState<CareVisitType>(worker?.visitTypes[0] ?? "home");
  const [service, setService] = useState(worker?.services[0] ?? "");
  const [date, setDate] = useState(days[0]?.date ?? "");
  const [time, setTime] = useState(CARE_TIME_SLOTS[0]);
  const [done, setDone] = useState<string | null>(null);

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

  const visitLabel = (v: CareVisitType) =>
    v === "home" ? tx("Home") : v === "clinic" ? tx("Clinic") : tx("Virtual");

  if (done) {
    return (
      <ServicePageShell
        backTo="/appointments"
        aside={
          <ServiceCtaCard
            eyebrow={tx("Confirmed")}
            body={`${worker.name} · ${tx(service)}`}
            cta={tx("Back to care")}
            onCta={() => nav("/appointments")}
            footer={<span className="font-mono">{done}</span>}
          />
        }
      >
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Visit")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Visit booked")}
        </h1>
        <p className="mt-2 text-ink-secondary">
          {date} · {time} · {visitLabel(visitType)}
        </p>
      </ServicePageShell>
    );
  }

  return (
    <ServicePageShell
      backTo={`/appointments/assistants/${worker.id}`}
      aside={
        <ServiceCtaCard
          eyebrow={`${date} · ${time} · ${visitLabel(visitType)}`}
          priceHint={tx("From")}
          price={formatFee(worker.feeFrom)}
          body={tx(service)}
          cta={tx("Confirm booking")}
          ctaDisabled={!service || !date || !time}
          onCta={() => {
            const b = createCareWorkerBooking({
              workerId: worker.id,
              visitType,
              service,
              date,
              time,
            });
            if (b) setDone(b.confirmationNo);
          }}
        />
      }
    >
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Visit")}</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Book visit")}
      </h1>
      <p className="mt-2 text-ink-secondary">{worker.name}</p>

      <h2 className="mt-10 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Visit type")}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {worker.visitTypes.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVisitType(v)}
            className={
              "rounded-full px-4 py-2 text-sm font-medium " +
              (visitType === v
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
            }
          >
            {visitLabel(v)}
          </button>
        ))}
      </div>

      <h2 className="mt-8 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
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

      <h2 className="mt-8 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Date")}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {days.map((d) => (
          <button
            key={d.date}
            type="button"
            onClick={() => setDate(d.date)}
            className={
              "rounded-full px-4 py-2 text-sm font-medium " +
              (date === d.date
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
            }
          >
            {tx(d.label)}
          </button>
        ))}
      </div>

      <h2 className="mt-8 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Time")}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {CARE_TIME_SLOTS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTime(t)}
            className={
              "rounded-full px-4 py-2 text-sm font-medium " +
              (time === t
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
            }
          >
            {t}
          </button>
        ))}
      </div>
    </ServicePageShell>
  );
}
