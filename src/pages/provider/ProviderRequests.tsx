import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";
import {
  getProviderRequests,
  updateProviderRequestStatus,
  type ProviderRequest,
  type ProviderRequestStatus,
} from "@/lib/providerOps";
import { PharmacyOrdersInbox } from "@/pages/provider/PharmacyOrdersInbox";

export function ProviderRequests() {
  const { provider } = useProvider();

  if (provider?.vendorType === "pharmacy") {
    return <PharmacyOrdersInbox />;
  }

  return <GenericRequestsInbox />;
}

function GenericRequestsInbox() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<"all" | ProviderRequestStatus>("all");
  const requests = getProviderRequests().filter((r) => (filter === "all" ? true : r.status === filter));
  void tick;

  const setStatus = (id: string, status: ProviderRequestStatus) => {
    updateProviderRequestStatus(id, status);
    setTick((t) => t + 1);
  };

  const title = portal?.requestsLabel ?? "Requests";

  return (
    <div>
      <header className="mb-6">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Inbox")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
          {tx(title)}
        </h1>
        <p className="mt-2 text-base text-ink-secondary">
          {tx("Bookings and inquiries from the care hub and direct channels.")}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["all", "new", "accepted", "completed", "declined"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              "rounded-full px-3.5 py-1.5 text-sm font-medium capitalize " +
              (filter === f
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
            }
          >
            {tx(f === "all" ? "All" : f)}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {requests.length === 0 ? (
          <li className="rounded-2xl border border-line bg-white px-5 py-8 text-center text-sm text-ink-tertiary">
            {tx("No requests in this view.")}
          </li>
        ) : (
          requests.map((r) => <RequestRow key={r.id} r={r} onStatus={setStatus} />)
        )}
      </ul>
    </div>
  );
}

function RequestRow({
  r,
  onStatus,
}: {
  r: ProviderRequest;
  onStatus: (id: string, status: ProviderRequestStatus) => void;
}) {
  const { tx } = useI18n();
  return (
    <li className="rounded-2xl border border-line bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-[color:var(--pp-primary-950)]">{r.patientName}</p>
          <p className="mt-0.5 text-sm text-ink-secondary">{r.service}</p>
          <p className="mt-1 text-2xs text-ink-tertiary">
            {r.slot || r.requestedAt.slice(0, 10)} · {tx(r.channel)}
            {r.fee != null ? ` · ${formatFee(r.fee)}` : ""}
          </p>
          {r.notes ? <p className="mt-2 text-sm text-ink-tertiary">{r.notes}</p> : null}
        </div>
        <span className="rounded-full bg-[color:var(--pp-primary-100)] px-2.5 py-1 text-2xs font-semibold capitalize text-[color:var(--pp-primary-950)]">
          {tx(r.status)}
        </span>
      </div>
      {r.status === "new" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onStatus(r.id, "accepted")}>
            {tx("Accept")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onStatus(r.id, "declined")}>
            {tx("Decline")}
          </Button>
        </div>
      ) : null}
      {r.status === "accepted" ? (
        <div className="mt-4">
          <Button size="sm" variant="secondary" onClick={() => onStatus(r.id, "completed")}>
            {tx("Mark completed")}
          </Button>
        </div>
      ) : null}
    </li>
  );
}
