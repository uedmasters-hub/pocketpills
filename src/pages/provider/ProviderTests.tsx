import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { loadDraftForProvider } from "@/lib/businessProfile";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";

export function ProviderTests() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const draft = provider ? loadDraftForProvider(provider) : null;
  const caps = draft?.capabilities;

  return (
    <div>
      <ProviderBreadcrumb items={[home, { label: tx("Tests & packages") }]} />

      <ul className="space-y-3">
        <CapRow on={!!caps?.bloodwork} label={tx("Blood work")} />
        <CapRow on={!!caps?.imaging} label={tx("Imaging / scans")} />
        <CapRow on={!!caps?.packages} label={tx("Health packages")} />
      </ul>

      <div className="mt-6">
        <Link to="/provider/listing">
          <Button>{tx("Edit listing capabilities")}</Button>
        </Link>
      </div>
    </div>
  );
}

function CapRow({ on, label }: { on: boolean; label: string }) {
  const { tx } = useI18n();
  return (
    <li className="flex items-center justify-between rounded-2xl border border-line bg-white px-5 py-4">
      <span className="font-medium text-[color:var(--pp-primary-950)]">{label}</span>
      <span
        className={
          "rounded-full px-2.5 py-1 text-2xs font-semibold uppercase " +
          (on
            ? "bg-[color:var(--pp-green)]/15 text-[color:var(--pp-green)]"
            : "bg-[color:var(--pp-primary-100)] text-ink-tertiary")
        }
      >
        {on ? tx("On") : tx("Off")}
      </span>
    </li>
  );
}
