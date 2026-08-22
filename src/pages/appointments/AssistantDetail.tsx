import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AvailabilityBoard,
  AvailabilityLocationPill,
  availabilityDayLabel,
} from "@/components/appointments/AvailabilityBoard";
import { useAvailabilityPicker } from "@/components/appointments/useAvailabilityPicker";
import { DetailSection } from "@/components/DetailSection";
import { ListingLandingExtras } from "@/components/ListingCustomSections";
import { useI18n } from "@/lib/i18n";
import { formatDistance, formatFee } from "@/lib/appointments";
import { careVisitTypeLabel, careWorkerKindLabel, getCareWorker, type CareVisitType } from "@/lib/careWorkers";
import { ServiceCtaCard, ServicePageShell } from "@/pages/appointments/ServicePageShell";

export function AssistantDetail() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { id = "" } = useParams();
  const worker = getCareWorker(id);
  const [visitType, setVisitType] = useState<CareVisitType>(worker?.visitTypes[0] ?? "clinic");
  const [service, setService] = useState(worker?.services[0] ?? "");
  const avail = useAvailabilityPicker(worker?.id ?? id, visitType);

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

  const visitOptions = worker.visitTypes.map((v) => ({
    id: v,
    label: tx(careVisitTypeLabel(v)),
  }));
  const slotLabel = avail.time
    ? `${availabilityDayLabel(avail.days.find((d) => d.date === avail.date) ?? { label: avail.date }, tx)} · ${avail.time} · ${tx(careVisitTypeLabel(visitType))}`
    : tx("Select a date and time below");

  const startBook = () => {
    if (!avail.date || !avail.time || !service) return;
    const qs = new URLSearchParams({
      visit: visitType,
      date: avail.date,
      time: avail.time,
      service,
    });
    nav(`/appointments/assistants/${worker.id}/book?${qs.toString()}`);
  };

  return (
    <ServicePageShell
      aside={
        <ServiceCtaCard
          eyebrow={
            <>
              ★ {worker.rating.toFixed(1)} · {tx(worker.nextAvailable)}
            </>
          }
          priceHint={tx("From")}
          price={formatFee(worker.feeFrom)}
          body={slotLabel}
          cta={tx("Book visit")}
          ctaDisabled={!avail.date || !avail.time || !service}
          onCta={startBook}
        />
      }
    >
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx(careWorkerKindLabel(worker.kind))}</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
        {worker.name}
      </h1>
      <p className="mt-2 text-ink-secondary">{tx(worker.subtitle)}</p>
      <p className="mt-4 text-base leading-relaxed text-ink-secondary">{tx(worker.bio)}</p>
      <p className="mt-4 text-sm text-ink-tertiary">
        {worker.city} · {formatDistance(worker.distanceKm)} · {worker.experienceYears}{" "}
        {tx("years experience")}
      </p>
      <p className="mt-1 text-sm text-ink-tertiary">{worker.languages.join(" · ")}</p>

      <div className="mt-10">
        <DetailSection title={tx("Services")}>
          <ul className="space-y-3">
            {worker.services.map((s) => {
              const on = service === s;
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setService(s)}
                    className={
                      "w-full rounded-xl border px-4 py-3.5 text-left transition-colors " +
                      (on
                        ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)]"
                        : "border-line bg-white hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx(s)}</p>
                    <p className="mt-0.5 text-sm text-ink-tertiary">
                      {worker.visitTypes.map((v) => tx(careVisitTypeLabel(v))).join(" · ")}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </DetailSection>
      </div>

      <div className="mt-10">
        <AvailabilityBoard
          visitOptions={visitOptions}
          visitType={visitType}
          onSelectVisit={(id) => setVisitType(id as CareVisitType)}
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

      <ListingLandingExtras hubId={worker.id} />
    </ServicePageShell>
  );
}
