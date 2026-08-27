import { useState } from "react";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";
import {
  getProviderRequests,
  updateProviderRequestStatus,
  type ProviderRequestStatus,
} from "@/lib/providerOps";

export function ProviderCollections() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const [tick, setTick] = useState(0);
  const queue = getProviderRequests().filter((r) => r.status === "new" || r.status === "accepted");
  void tick;

  const setStatus = (id: string, status: ProviderRequestStatus) => {
    updateProviderRequestStatus(id, status);
    setTick((n) => n + 1);
  };

  return (
    <div>
      <ProviderBreadcrumb items={[home, { label: tx("Collections") }]} />

      {queue.length === 0 ? (
        <p className="text-sm text-ink-tertiary">{tx("Queue is clear.")}</p>
      ) : (
        <ul className="space-y-3">
          {queue.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-white px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[color:var(--pp-primary-950)]">{r.patientName}</p>
                  <p className="mt-1 text-sm text-ink-tertiary">
                    {r.service}
                    {r.slot ? ` · ${r.slot}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status === "new" ? (
                    <Chip onClick={() => setStatus(r.id, "accepted")}>{tx("Accept")}</Chip>
                  ) : null}
                  {r.status === "accepted" ? (
                    <Chip onClick={() => setStatus(r.id, "completed")}>{tx("Collected")}</Chip>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
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
