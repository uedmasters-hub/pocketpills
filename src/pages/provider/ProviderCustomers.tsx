import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";
import { getProviderCustomers } from "@/lib/providerOps";

export function ProviderCustomers() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const customers = getProviderCustomers();
  const isPatients = provider?.vendorType === "doctor";

  return (
    <div>
      <ProviderBreadcrumb
        items={[home, { label: isPatients ? tx("Patients") : tx("Customers") }]}
      />

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-5 py-10 text-center text-sm text-ink-tertiary">
          {tx("No customers yet. Accept a request to start building this list.")}
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {customers.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-[color:var(--pp-primary-950)]">{c.name}</p>
                <p className="mt-0.5 truncate text-sm text-ink-tertiary">{c.lastService}</p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <p className="font-medium text-[color:var(--pp-primary-950)] tnum">
                  {c.visits} {tx("visits")}
                </p>
                <p className="mt-0.5 text-2xs text-ink-tertiary">{c.lastVisit}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
