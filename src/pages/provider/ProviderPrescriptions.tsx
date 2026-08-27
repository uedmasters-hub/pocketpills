import { useState } from "react";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";
import {
  listPharmacyOrders,
  updatePharmacyOrderStatus,
  type PharmacyOrder,
  type RxStatus,
} from "@/lib/pharmacyOps";

const FLOW: RxStatus[] = ["new", "preparing", "ready", "completed"];
const LABELS: Record<RxStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  declined: "Declined",
};

export function ProviderPrescriptions() {
  const { tx } = useI18n();
  const { workspaceId, provider } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const orgId = workspaceId;
  const [tick, setTick] = useState(0);
  const orders = listPharmacyOrders(orgId).filter((o) => o.status !== "declined");
  void tick;

  const advance = (o: PharmacyOrder) => {
    const i = FLOW.indexOf(o.status);
    if (i < 0 || i >= FLOW.length - 1) return;
    updatePharmacyOrderStatus(orgId, o.id, FLOW[i + 1]);
    setTick((n) => n + 1);
  };

  return (
    <div>
      <ProviderBreadcrumb items={[home, { label: tx("Prescriptions") }]} />

      <div className="grid gap-4 lg:grid-cols-4">
        {FLOW.map((status) => {
          const cards = orders.filter((o) => o.status === status);
          return (
            <section key={status} className="rounded-2xl border border-line bg-[color:var(--pp-primary-100)]/30 p-3">
              <h2 className="px-1 text-sm font-semibold text-[color:var(--pp-primary-950)]">
                {tx(LABELS[status])}{" "}
                <span className="font-normal text-ink-tertiary">({cards.length})</span>
              </h2>
              <ul className="mt-3 space-y-2">
                {cards.map((o) => (
                  <li key={o.id} className="rounded-xl border border-line bg-white p-3">
                    <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{o.patientName}</p>
                    <p className="mt-0.5 text-2xs text-ink-tertiary">
                      {o.medication} · {o.qty}
                      {o.fee != null ? ` · ${formatFee(o.fee)}` : ""}
                    </p>
                    {status !== "completed" ? (
                      <button
                        type="button"
                        onClick={() => advance(o)}
                        className="mt-2 rounded-full bg-[color:var(--pp-primary-100)] px-2.5 py-1 text-2xs font-semibold text-[color:var(--pp-primary-950)]"
                      >
                        {tx("Advance")}
                      </button>
                    ) : null}
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
