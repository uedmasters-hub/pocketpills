import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import { useProvider } from "@/lib/providerAuth";
import { runsForDriver, updateRunStatus } from "@/lib/ambulanceOps";

export function ProviderRuns() {
  const { tx } = useI18n();
  const { provider, displayName } = useProvider();
  const orgId = provider?.id ?? "anon";
  const [tick, setTick] = useState(0);
  const runs = runsForDriver(orgId, displayName);
  void tick;

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Runs")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx("Assigned runs")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("Transports assigned to you — mark en route or complete.")}
        </p>
      </header>

      {runs.length === 0 ? (
        <p className="text-sm text-ink-tertiary">{tx("No active runs right now.")}</p>
      ) : (
        <ul className="space-y-3">
          {runs.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-white px-5 py-4">
              <p className="font-medium text-[color:var(--pp-primary-950)]">{r.patientName}</p>
              <p className="mt-1 text-sm text-ink-tertiary">
                {r.pickup} → {r.dropoff}
              </p>
              <p className="mt-1 text-2xs text-ink-tertiary">
                {tx(r.status.replace("_", " "))}
                {r.fee != null ? ` · ${formatFee(r.fee)}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "assigned" ? (
                  <button
                    type="button"
                    className="rounded-full bg-[color:var(--pp-primary-950)] px-3.5 py-2 text-sm font-medium text-white"
                    onClick={() => {
                      updateRunStatus(orgId, r.id, "en_route");
                      setTick((n) => n + 1);
                    }}
                  >
                    {tx("En route")}
                  </button>
                ) : null}
                {r.status === "assigned" || r.status === "en_route" ? (
                  <button
                    type="button"
                    className="rounded-full border border-line px-3.5 py-2 text-sm font-medium text-[color:var(--pp-primary-950)]"
                    onClick={() => {
                      updateRunStatus(orgId, r.id, "completed");
                      setTick((n) => n + 1);
                    }}
                  >
                    {tx("Complete")}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
