import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import {
  listFacilityServices,
  removeFacilityService,
  saveFacilityService,
} from "@/lib/facilityServices";
import { useProvider } from "@/lib/providerAuth";
import { loadDraftForProvider, saveDraft } from "@/lib/businessProfile";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";

export function ProviderServices() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const orgId = provider?.id ?? "anon";
  const [items, setItems] = useState(() => listFacilityServices(orgId));
  const [label, setLabel] = useState("");
  const [blurb, setBlurb] = useState("");
  const [feeFrom, setFeeFrom] = useState(79);
  const [flash, setFlash] = useState<string | null>(null);

  const add = () => {
    if (!label.trim()) return;
    saveFacilityService(orgId, { label: label.trim(), blurb: blurb.trim(), feeFrom });
    setItems(listFacilityServices(orgId));
    setLabel("");
    setBlurb("");
    setFeeFrom(79);
  };

  const syncToListing = () => {
    if (!provider) return;
    const draft = loadDraftForProvider(provider);
    const services = listFacilityServices(orgId).map((s) => ({
      id: s.id,
      kind: "service" as const,
      label: s.label,
      blurb: s.blurb,
      feeFrom: s.feeFrom,
      includedIds: [],
      promoCode: "",
      offerStart: "",
      offerEnd: "",
    }));
    saveDraft({ ...draft, services }, provider.id);
    setFlash(tx("Synced to listing draft"));
    window.setTimeout(() => setFlash(null), 2000);
  };

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Services")}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {tx("Service catalog")}
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-secondary">
            {tx("Offerings patients can request. Sync them into your public listing when ready.")}{" "}
            <Link to="/provider/offers" className="font-medium text-[color:var(--pp-violet)] hover:opacity-70">
              {tx("Bundles & promo codes")} →
            </Link>
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={syncToListing} disabled={items.length === 0}>
          {tx("Sync to listing")}
        </Button>
      </header>

      {flash ? <p className="mb-4 text-sm font-medium text-[color:var(--pp-green)]">{flash}</p> : null}

      <section className="mb-8 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
          {tx("Add service")}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_6rem_auto]">
          <input
            className={FIELD}
            placeholder={tx("Name")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className={FIELD}
            placeholder={tx("Short description")}
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
          />
          <input
            type="number"
            min={0}
            className={FIELD}
            value={feeFrom}
            onChange={(e) => setFeeFrom(Number(e.target.value) || 0)}
            aria-label={tx("Fee")}
          />
          <Button onClick={add}>{tx("Add")}</Button>
        </div>
      </section>

      {items.length === 0 ? (
        <p className="text-sm text-ink-tertiary">{tx("No services yet.")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4"
            >
              <div>
                <p className="font-medium text-[color:var(--pp-primary-950)]">{s.label}</p>
                <p className="mt-0.5 text-sm text-ink-tertiary">
                  {s.blurb || "—"} · {formatFee(s.feeFrom)}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
                onClick={() => {
                  removeFacilityService(orgId, s.id);
                  setItems(listFacilityServices(orgId));
                }}
              >
                {tx("Remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
