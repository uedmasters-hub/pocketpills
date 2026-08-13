import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { getProviderCustomers } from "@/lib/providerOps";

export function ProviderCustomers() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const customers = getProviderCustomers();
  const isPatients = provider?.vendorType === "doctor";

  return (
    <div>
      <header className="mb-6">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Relationships")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
          {isPatients ? tx("Patients") : tx("Customers")}
        </h1>
        <p className="mt-2 text-base text-ink-secondary">
          {tx("People you’ve accepted or completed care for.")}
        </p>
      </header>

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
