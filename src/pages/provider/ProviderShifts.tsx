import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";
import { driverShifts } from "@/lib/ambulanceOps";

export function ProviderShifts() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const orgId = provider?.id ?? "anon";
  const shifts = driverShifts(orgId);

  return (
    <div>
      <ProviderBreadcrumb items={[home, { label: tx("My shifts") }]} />
      <ul className="space-y-3">
        {shifts.map((s) => (
          <li key={s.id} className="rounded-2xl border border-line bg-white px-5 py-4">
            <p className="font-medium text-[color:var(--pp-primary-950)]">{s.label}</p>
            <p className="mt-1 text-sm text-ink-tertiary">
              {new Date(s.start).toLocaleString()} –{" "}
              {new Date(s.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="mt-1 text-2xs text-ink-tertiary">
              {tx("Vehicle")}: {s.vehicleCallSign}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
