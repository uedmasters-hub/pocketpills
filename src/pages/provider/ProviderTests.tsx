import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { loadDraftForProvider } from "@/lib/businessProfile";
import { useProvider } from "@/lib/providerAuth";

export function ProviderTests() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const draft = provider ? loadDraftForProvider(provider) : null;
  const caps = draft?.capabilities;

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Tests")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx("Tests & packages")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("Controlled by your listing capabilities. Edit the listing to change what patients can book.")}
        </p>
      </header>

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
