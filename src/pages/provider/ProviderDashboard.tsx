import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { portalFor, flattenNav } from "@/lib/providerPortals";
import { getProviderCustomers, getProviderDashboardStats, getProviderRequests } from "@/lib/providerOps";
import { listStaff } from "@/lib/hospitalStaff";
import { listPharmacyOrders } from "@/lib/pharmacyOps";
import { listRuns } from "@/lib/ambulanceOps";

export function ProviderDashboard() {
  const { tx } = useI18n();
  const { displayName, provider, workspaceId, isDelegate } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const stats = getProviderDashboardStats();
  const customers = getProviderCustomers().slice(0, 4);
  const orgId = workspaceId;
  const isPharmacy = provider?.vendorType === "pharmacy";
  const pharmacyOrders = isPharmacy ? listPharmacyOrders(orgId) : [];
  const recent = isPharmacy
    ? pharmacyOrders.slice(0, 4).map((o) => ({
        id: o.id,
        patientName: o.patientName,
        service: o.medication,
        status: o.status,
      }))
    : getProviderRequests().slice(0, 4);

  if (isDelegate) {
    return <Navigate to="/provider/requests" replace />;
  }

  const extras = (() => {
    if (!provider) return null;
    if (provider.vendorType === "hospital" || provider.vendorType === "clinic") {
      return { label: tx("Doctors / team"), value: String(listStaff(orgId).length) };
    }
    if (provider.vendorType === "pharmacy") {
      const open = listPharmacyOrders(orgId).filter((o) => o.status !== "completed").length;
      return { label: tx("Open Rx"), value: String(open) };
    }
    if (provider.vendorType === "ambulance") {
      const open = listRuns(orgId).filter((r) => r.status === "queued" || r.status === "assigned").length;
      return { label: tx("Active runs"), value: String(open) };
    }
    return null;
  })();

  const shortcuts =
    flattenNav(portal?.nav ?? [])
      .filter((n) => n.to !== "/provider" && n.to !== "/provider/finance" && n.to !== "/provider/support")
      .slice(0, 4);

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{portal ? tx(portal.label) : tx("Home")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {portal ? tx(portal.homeTitle) : tx("Welcome")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {portal ? tx(portal.homeBlurb) : null}{" "}
          <span className="font-medium text-[color:var(--pp-primary-950)]">
            {provider?.orgName || displayName}
          </span>
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {extras ? <StatCard label={extras.label} value={extras.value} /> : (
          <StatCard label={tx("Services posted")} value={String(stats.servicesPosted)} />
        )}
        <StatCard
          label={portal?.requestsLabel ? tx(`New ${portal.requestsLabel.toLowerCase()}`) : tx("New requests")}
          value={String(stats.openRequests)}
          tone="alert"
        />
        <StatCard label={tx("In progress")} value={String(stats.accepted)} />
        <StatCard label={tx("Customers served")} value={String(stats.customersServed)} />
      </div>

      {shortcuts.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {shortcuts.map((s) => (
            <Link key={s.to} to={s.to}>
              <Button size="sm" variant="secondary">
                {tx(s.label)}
              </Button>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {portal?.showListing ? (
          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                {tx("Listing")}
              </h2>
              <span
                className={
                  "rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wide " +
                  (stats.listingLive
                    ? "bg-[color:var(--pp-primary-950)] text-white"
                    : "bg-[color:var(--pp-primary-100)] text-ink-tertiary")
                }
              >
                {stats.listingLive ? tx("Live on hub") : tx("Draft")}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-secondary">
              {stats.listingName
                ? stats.listingName
                : tx("Publish so patients can find you on the care hub.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/provider/listing">
                <Button size="sm">{stats.listingLive ? tx("Edit listing") : tx("Set up listing")}</Button>
              </Link>
              {stats.hubPath ? (
                <Link to={stats.hubPath} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary">
                    {tx("View on care hub")}
                  </Button>
                </Link>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Driver workspace")}
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              {tx("Check your shifts and assigned runs. Listing is managed by the fleet owner.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/provider/shifts">
                <Button size="sm">{tx("My shifts")}</Button>
              </Link>
              <Link to="/provider/runs">
                <Button size="sm" variant="secondary">
                  {tx("Assigned runs")}
                </Button>
              </Link>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {portal ? tx(portal.requestsLabel) : tx("Requests")}
            </h2>
            <Link
              to={
                provider?.vendorType === "ambulance" && provider.ambulanceRole === "driver"
                  ? "/provider/runs"
                  : "/provider/requests"
              }
              className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
            >
              {tx("See all")} →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recent.length === 0 ? (
              <li className="text-sm text-ink-tertiary">{tx("Nothing in the queue yet.")}</li>
            ) : (
              recent.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 text-sm">
                  <span>
                    <span className="font-medium text-[color:var(--pp-primary-950)]">{r.patientName}</span>
                    <span className="mt-0.5 block text-ink-tertiary">{r.service}</span>
                  </span>
                  <StatusPill status={r.status} />
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {provider?.vendorType === "doctor" || provider?.vendorType === "clinic" ? (
        <section className="mt-6 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Recent patients")}
            </h2>
            <Link
              to={provider.vendorType === "doctor" ? "/provider/patients" : "/provider/requests"}
              className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
            >
              {tx("See all")} →
            </Link>
          </div>
          {customers.length === 0 ? (
            <p className="mt-4 text-sm text-ink-tertiary">
              {tx("Patients appear after you accept or complete requests.")}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {customers.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <span className="font-medium text-[color:var(--pp-primary-950)]">{c.name}</span>
                    <span className="mt-0.5 block text-ink-tertiary">{c.lastService}</span>
                  </span>
                  <span className="text-ink-tertiary tnum">
                    {c.visits} {tx("visits")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "alert";
}) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-4">
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{label}</p>
      <p
        className={
          "mt-2 font-display text-3xl font-medium leading-none tnum " +
          (tone === "alert" && value !== "0"
            ? "text-[color:var(--pp-violet)]"
            : "text-[color:var(--pp-primary-950)]")
        }
      >
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const { tx } = useI18n();
  const styles: Record<string, string> = {
    new: "bg-[color:var(--pp-primary-950)] text-white",
    accepted: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]",
    completed: "text-[color:var(--pp-green)]",
    declined: "text-ink-tertiary",
  };
  return (
    <span className={"shrink-0 rounded-full px-2 py-0.5 text-2xs font-semibold capitalize " + (styles[status] || "")}>
      {tx(status)}
    </span>
  );
}
