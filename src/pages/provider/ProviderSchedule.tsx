import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { getProviderRequests } from "@/lib/providerOps";

export function ProviderSchedule() {
  const { tx } = useI18n();
  const upcoming = getProviderRequests().filter(
    (r) => r.status === "new" || r.status === "accepted",
  );

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Schedule")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx("Today & upcoming")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("Open and accepted consults on your calendar.")}
        </p>
      </header>

      {upcoming.length === 0 ? (
        <p className="text-sm text-ink-tertiary">
          {tx("Nothing scheduled.")}{" "}
          <Link to="/provider/requests" className="font-medium text-[color:var(--pp-violet)]">
            {tx("View requests")}
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-white px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-[color:var(--pp-primary-950)]">{r.patientName}</p>
                <p className="text-sm text-ink-tertiary">{r.slot || tx("Time TBD")}</p>
              </div>
              <p className="mt-1 text-sm text-ink-secondary">{r.service}</p>
              <p className="mt-1 text-2xs uppercase tracking-wide text-ink-tertiary">{r.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
