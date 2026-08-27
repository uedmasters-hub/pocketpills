import { useEffect, useMemo, useState } from "react";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { Switch } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";
import {
  declineConsultRequest,
  getImmediateOptIn,
  issueConsultPrescription,
  listConsultRequestsForConsultant,
  optInConsultantId,
  saveImmediateOptIn,
  subscribeImmediateConsult,
} from "@/lib/immediateConsult";
import { findPatientReport, getPatientFilePreview } from "@/lib/patientRecords";
import { ReportThumb } from "@/components/records/ReportThumb";

export function ProviderImmediateConsultDraft() {
  const { tx } = useI18n();
  const { provider, workspaceId, displayName } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const [tick, setTick] = useState(0);
  void tick;

  const existing = getImmediateOptIn(workspaceId);
  const [enabled, setEnabled] = useState(existing?.enabled ?? false);
  const [fee, setFee] = useState(String(existing?.fee ?? 79));
  const [subtitle, setSubtitle] = useState(
    existing?.subtitle ?? "MBBS · Immediate prescription consults",
  );

  useEffect(() => subscribeImmediateConsult(() => setTick((n) => n + 1)), []);

  const consultantId = optInConsultantId(workspaceId);
  const requests = useMemo(
    () => listConsultRequestsForConsultant(consultantId),
    [consultantId, tick],
  );
  const pending = requests.filter((r) => r.status === "in_consult" || r.status === "pending");
  const issued = requests.filter((r) => r.status === "issued");

  const save = (on = enabled) => {
    const n = Number(fee);
    saveImmediateOptIn({
      providerId: workspaceId,
      enabled: on,
      fee: Number.isFinite(n) && n > 0 ? n : 79,
      name: displayName || provider?.orgName || "Doctor",
      subtitle,
      imageUrl: "/img/doctors/doctor-m1.png",
      city: "Nepal",
    });
  };

  return (
    <div>
      <ProviderBreadcrumb items={[home, { label: tx("Immediate consults") }]} />

      <div className="rounded-2xl border border-line bg-white p-5">
        <Switch
          checked={enabled}
          onChange={(v) => {
            setEnabled(v);
            save(v);
          }}
          label={tx("Show me as an immediate consultant")}
          desc={tx("Patients see you on the medication consult list, not the general provider directory.")}
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field
            label={tx("Consult fee")}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            onBlur={() => save()}
            inputMode="decimal"
          />
          <Field
            label={tx("How you appear")}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            onBlur={() => save()}
          />
        </div>
        <p className="mt-3 text-2xs text-ink-tertiary">
          {tx("Listed as")} {displayName || provider?.orgName} · ${Number(fee) || 79}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
          {tx("Waiting for a prescription")}
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-white px-5 py-8 text-center text-sm text-ink-tertiary">
            {tx("No open consults. When a patient books you from a medication page, they show up here.")}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-4">
                <p className="font-semibold text-[color:var(--pp-primary-950)]">{r.patientName}</p>
                <p className="mt-0.5 text-sm text-ink-secondary">
                  {(r.items && r.items.length
                    ? r.items.map((i) => `${i.name} ${i.dose}`).join(" · ")
                    : `${r.drugName} · ${r.dose}`)}{" "}
                  · {tx("Qty")} {r.qty}
                </p>
                <p className="mt-1 text-2xs text-ink-tertiary">
                  {r.id} · ${r.fee} {tx("consult")}
                </p>
                {r.reportId ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-line px-3 py-2">
                    <ReportThumb src={getPatientFilePreview(r.reportId)} className="h-12 w-16" />
                    <div className="min-w-0">
                      <p className="text-2xs font-medium text-[color:var(--pp-primary-950)]">
                        {tx(findPatientReport(r.reportId)?.title ?? "Prescription photo")}
                      </p>
                      {findPatientReport(r.reportId)?.detail ? (
                        <p className="mt-0.5 truncate text-2xs text-ink-tertiary">
                          {findPatientReport(r.reportId)!.detail}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      issueConsultPrescription(
                        r.id,
                        r.items?.length
                          ? r.items.map((i) => `${i.name} ${i.dose}`).join(" · ")
                          : `${r.drugName} ${r.dose} · Qty ${r.qty}`,
                      )
                    }
                  >
                    {tx("Issue prescription")}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => declineConsultRequest(r.id)}>
                    {tx("Decline")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {issued.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Issued")}
          </h2>
          <ul className="mt-3 space-y-2">
            {issued.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
                <span className="font-medium text-[color:var(--pp-primary-950)]">{r.patientName}</span>
                <span className="text-ink-tertiary">
                  {" "}
                  · {r.drugName} · {r.dose}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
