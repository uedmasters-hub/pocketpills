import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  getProviderRequests,
  updateProviderRequestStatus,
  type ProviderRequest,
  type ProviderRequestStatus,
} from "@/lib/providerOps";

const COLUMNS: { status: ProviderRequestStatus; title: string }[] = [
  { status: "new", title: "New" },
  { status: "accepted", title: "In progress" },
  { status: "completed", title: "Done" },
  { status: "declined", title: "Declined" },
];

export function ProviderMonitor() {
  const { tx } = useI18n();
  const [tick, setTick] = useState(0);
  const requests = getProviderRequests();
  void tick;

  const move = (r: ProviderRequest, status: ProviderRequestStatus) => {
    updateProviderRequestStatus(r.id, status);
    setTick((n) => n + 1);
  };

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Monitor")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx("Operations board")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("Today’s requests by status — move cards as care progresses.")}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const cards = requests.filter((r) => r.status === col.status);
          return (
            <section key={col.status} className="rounded-2xl border border-line bg-[color:var(--pp-primary-100)]/30 p-3">
              <h2 className="px-1 text-sm font-semibold text-[color:var(--pp-primary-950)]">
                {tx(col.title)}{" "}
                <span className="font-normal text-ink-tertiary">({cards.length})</span>
              </h2>
              <ul className="mt-3 space-y-2">
                {cards.map((r) => (
                  <li key={r.id} className="rounded-xl border border-line bg-white p-3">
                    <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{r.patientName}</p>
                    <p className="mt-0.5 text-2xs text-ink-tertiary">
                      {r.service}
                      {r.slot ? ` · ${r.slot}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {col.status === "new" ? (
                        <>
                          <Tiny onClick={() => move(r, "accepted")}>{tx("Accept")}</Tiny>
                          <Tiny onClick={() => move(r, "declined")}>{tx("Decline")}</Tiny>
                        </>
                      ) : null}
                      {col.status === "accepted" ? (
                        <Tiny onClick={() => move(r, "completed")}>{tx("Complete")}</Tiny>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Tiny({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-[color:var(--pp-primary-100)] px-2.5 py-1 text-2xs font-semibold text-[color:var(--pp-primary-950)] hover:opacity-80"
    >
      {children}
    </button>
  );
}
