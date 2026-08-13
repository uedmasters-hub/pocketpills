import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { listFleet, saveVehicle, type VehicleStatus } from "@/lib/ambulanceOps";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";

export function ProviderFleet() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const orgId = provider?.id ?? "anon";
  const [fleet, setFleet] = useState(() => listFleet(orgId));
  const [callSign, setCallSign] = useState("");
  const [plate, setPlate] = useState("");

  const refresh = () => setFleet(listFleet(orgId));

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Fleet")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx("Vehicles")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("Track availability across your ambulance units.")}
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
          {tx("Add vehicle")}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            className={FIELD}
            placeholder={tx("Call sign")}
            value={callSign}
            onChange={(e) => setCallSign(e.target.value)}
          />
          <input
            className={FIELD}
            placeholder={tx("Plate")}
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
          <Button
            onClick={() => {
              if (!callSign.trim() || !plate.trim()) return;
              saveVehicle(orgId, {
                callSign: callSign.trim(),
                plate: plate.trim(),
                status: "available",
              });
              setCallSign("");
              setPlate("");
              refresh();
            }}
          >
            {tx("Add")}
          </Button>
        </div>
      </section>

      <ul className="space-y-3">
        {fleet.map((v) => (
          <li
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4"
          >
            <div>
              <p className="font-medium text-[color:var(--pp-primary-950)]">{v.callSign}</p>
              <p className="text-sm text-ink-tertiary">
                {v.plate}
                {v.notes ? ` · ${v.notes}` : ""}
              </p>
            </div>
            <select
              className="h-10 rounded-xl border border-line bg-white px-3 text-sm"
              value={v.status}
              onChange={(e) => {
                saveVehicle(orgId, { ...v, status: e.target.value as VehicleStatus });
                refresh();
              }}
            >
              <option value="available">{tx("Available")}</option>
              <option value="on_run">{tx("On run")}</option>
              <option value="maintenance">{tx("Maintenance")}</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
