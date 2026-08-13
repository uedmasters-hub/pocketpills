import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { driverShifts } from "@/lib/ambulanceOps";

export function ProviderShifts() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const orgId = provider?.id ?? "anon";
  const shifts = driverShifts(orgId);

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Shifts")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx("My shifts")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("Upcoming duty windows assigned by your owner.")}
        </p>
      </header>
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
