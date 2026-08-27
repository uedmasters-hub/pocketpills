import { useState } from "react";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";
import {
  assignRun,
  listFleet,
  listRuns,
  updateRunStatus,
  type DispatchRun,
} from "@/lib/ambulanceOps";

export function ProviderDispatch() {
  const { tx } = useI18n();
  const { provider, displayName } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const orgId = provider?.id ?? "anon";
  const [tick, setTick] = useState(0);
  const runs = listRuns(orgId);
  const fleet = listFleet(orgId).filter((v) => v.status === "available");
  void tick;

  const refresh = () => setTick((n) => n + 1);

  const onAssign = (run: DispatchRun, vehicleId: string) => {
    assignRun(orgId, run.id, vehicleId, displayName);
    refresh();
  };

  return (
    <div>
      <ProviderBreadcrumb items={[home, { label: tx("Dispatch") }]} />

      <ul className="space-y-3">
        {runs.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-white px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-[color:var(--pp-primary-950)]">{r.patientName}</p>
                <p className="mt-1 text-sm text-ink-tertiary">
                  {r.pickup} → {r.dropoff}
                </p>
                <p className="mt-1 text-2xs text-ink-tertiary">
                  {tx(r.priority === "urgent" ? "Urgent" : "Routine")} · {tx(r.status.replace("_", " "))}
                  {r.driverName ? ` · ${r.driverName}` : ""}
                  {r.fee != null ? ` · ${formatFee(r.fee)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.status === "queued" && fleet.length > 0 ? (
                  <select
                    className="h-10 rounded-xl border border-line bg-white px-3 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) onAssign(r, e.target.value);
                    }}
                  >
                    <option value="" disabled>
                      {tx("Assign unit…")}
                    </option>
                    {fleet.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.callSign}
                      </option>
                    ))}
                  </select>
                ) : null}
                {r.status === "assigned" || r.status === "en_route" ? (
                  <>
                    {r.status === "assigned" ? (
                      <Action onClick={() => { updateRunStatus(orgId, r.id, "en_route"); refresh(); }}>
                        {tx("En route")}
                      </Action>
                    ) : null}
                    <Action onClick={() => { updateRunStatus(orgId, r.id, "completed"); refresh(); }}>
                      {tx("Complete")}
                    </Action>
                  </>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Action({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-[color:var(--pp-primary-950)] px-3.5 py-2 text-sm font-medium text-white"
    >
      {children}
    </button>
  );
}
