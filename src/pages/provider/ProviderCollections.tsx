import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  getProviderRequests,
  updateProviderRequestStatus,
  type ProviderRequestStatus,
} from "@/lib/providerOps";

export function ProviderCollections() {
  const { tx } = useI18n();
  const [tick, setTick] = useState(0);
  const queue = getProviderRequests().filter((r) => r.status === "new" || r.status === "accepted");
  void tick;

  const setStatus = (id: string, status: ProviderRequestStatus) => {
    updateProviderRequestStatus(id, status);
    setTick((n) => n + 1);
  };

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Collections")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx("Collections queue")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("Draws and visits waiting for your lab team.")}
        </p>
      </header>

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
