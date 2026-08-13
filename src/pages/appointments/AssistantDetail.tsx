import { Link, useNavigate, useParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { formatDistance, formatFee } from "@/lib/appointments";
import { careWorkerKindLabel, getCareWorker } from "@/lib/careWorkers";
import { ServiceCtaCard, ServicePageShell } from "@/pages/appointments/ServicePageShell";

export function AssistantDetail() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { id = "" } = useParams();
  const worker = getCareWorker(id);

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
          body={tx("Book a home, clinic, or virtual visit.")}
          cta={tx("Book visit")}
          onCta={() => nav(`/appointments/assistants/${worker.id}/book`)}
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

      <h2 className="mt-10 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Services")}
      </h2>
      <ul className="mt-4 space-y-3">
        {worker.services.map((s) => (
          <li key={s} className="rounded-2xl border border-line bg-white px-4 py-3.5">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx(s)}</p>
            <p className="mt-0.5 text-sm text-ink-tertiary">
              {worker.visitTypes.map((v) => tx(v === "home" ? "Home" : v === "clinic" ? "Clinic" : "Virtual")).join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </ServicePageShell>
  );
}
