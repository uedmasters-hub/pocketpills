import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Field } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import {
  createServiceRequest,
  getHealthService,
  healthServiceCategoryLabel,
} from "@/lib/healthServices";
import { ServiceCtaCard, ServicePageShell } from "@/pages/appointments/ServicePageShell";

export function ServiceDetail() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { id = "" } = useParams();
  const service = getHealthService(id);

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState<string | null>(null);

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

  if (done) {
    return (
      <ServicePageShell
        aside={
          <ServiceCtaCard
            eyebrow={tx("Request sent")}
            body={
              service.etaMinutes
                ? tx("Estimated response ~{n} min").replace("{n}", String(service.etaMinutes))
                : tx("Our team will follow up shortly.")
            }
            cta={tx("Back to care")}
            onCta={() => nav("/appointments")}
            footer={<span className="font-mono">{done}</span>}
          />
        }
      >
        <p className="pp-caps text-[color:var(--pp-violet)]">
          {tx(healthServiceCategoryLabel(service.category))}
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
          {tx(service.name)}
        </h1>
        <p className="mt-2 text-ink-secondary">{tx("Your request is confirmed.")}</p>
        {service.phone ? (
          <p className="mt-6 text-sm text-ink-secondary">
            {tx("Or call")}{" "}
            <a className="font-semibold text-[color:var(--pp-violet)]" href={`tel:${service.phone}`}>
              {service.phone}
            </a>
          </p>
        ) : null}
      </ServicePageShell>
    );
  }

  return (
    <ServicePageShell
      aside={
        <ServiceCtaCard
          eyebrow={
            service.etaMinutes != null
              ? `${tx("Typical ETA")} · ~${service.etaMinutes} ${tx("min")}`
              : service.available24h
                ? tx("Available 24/7")
                : service.city
          }
          priceHint={service.feeFrom != null && service.feeFrom > 0 ? tx("From") : tx("Coverage")}
          price={
            service.feeFrom != null && service.feeFrom > 0
              ? formatFee(service.feeFrom)
              : tx("Covered")
          }
          body={tx("Confirm your location and we’ll dispatch or connect you.")}
          cta={tx("Request service")}
          ctaDisabled={!address.trim() || !phone.trim()}
          onCta={() => {
            const r = createServiceRequest({
              serviceId: service.id,
              address,
              notes,
              phone,
            });
            if (r) setDone(r.confirmationNo);
          }}
          secondary={service.phone ? tx("Call now") : undefined}
          onSecondary={service.phone ? () => window.open(`tel:${service.phone}`, "_self") : undefined}
          footer={service.coverageNote ? tx(service.coverageNote) : undefined}
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

      <h2 className="mt-10 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Request details")}
      </h2>
      <div className="mt-4 space-y-4">
        <Field
          label={tx("Pickup / service address")}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={tx("Street, city")}
        />
        <Field
          label={tx("Contact phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={tx("Mobile number")}
        />
        <label className="block text-sm font-medium text-ink-secondary">
          {tx("Notes")}
          <textarea
            className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tx("Symptoms, access instructions…")}
          />
        </label>
      </div>
    </ServicePageShell>
  );
}
