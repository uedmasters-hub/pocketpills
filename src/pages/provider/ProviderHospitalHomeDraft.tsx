/**
 * Provider operations homepage.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { portalFor, clinicianNoun, opsListingCta, showDeptOverview } from "@/lib/providerPortals";
import { getProviderDashboardStats, getProviderRequests } from "@/lib/providerOps";
import { listStaff } from "@/lib/hospitalStaff";
import { listPharmacyOrders } from "@/lib/pharmacyOps";
import { listRuns } from "@/lib/ambulanceOps";
import { fieldsMatchQuery } from "@/lib/searchMatch";
import { useShellColumn } from "@/lib/columnHover";

import { HospitalDeptOverview } from "@/components/provider/HospitalDeptOverview";
import { HospitalOpsInsights } from "@/components/provider/HospitalOpsInsights";
import { PatientManageQuickView } from "@/components/provider/PatientManageQuickView";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import {
  opsTodayIso,
  PATIENT_STATUS,
  cancellationPath,
  needsCancelFlow,
  patientInitials,
  useHospitalPatients,
  type DraftHospitalPatient,
  type DraftPatientStatus,
} from "@/lib/hospitalPatientDraft";

type PatientView = "grid" | "list";

export function ProviderHospitalHomeDraft() {
  const { tx } = useI18n();
  const { displayName, provider, workspaceId } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const stats = getProviderDashboardStats();
  const team = listStaff(workspaceId).length;
  const isPharmacy = provider?.vendorType === "pharmacy";
  const recent = isPharmacy
    ? listPharmacyOrders(workspaceId).slice(0, 4).map((o) => ({
        id: o.id,
        patientName: o.patientName,
        service: o.medication,
        status: o.status,
      }))
    : getProviderRequests().slice(0, 4);
  const listingCta = opsListingCta(provider?.vendorType);
  const teamLabel = clinicianNoun(provider?.vendorType, true);
  const extraStat = (() => {
    if (provider?.vendorType === "pharmacy") {
      const open = listPharmacyOrders(workspaceId).filter((o) => o.status !== "completed").length;
      return { label: tx("Open Rx"), value: String(open) };
    }
    if (provider?.vendorType === "ambulance") {
      const open = listRuns(workspaceId).filter((r) => r.status === "queued" || r.status === "assigned").length;
      return { label: tx("Active runs"), value: String(open) };
    }
    return { label: `${tx(teamLabel)} / ${tx("team")}`, value: String(team) };
  })();
  const mainCol = useShellColumn("main");
  const railCol = useShellColumn("rail");

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] xl:gap-x-10">
      <div className={"min-w-0 " + mainCol.className} onMouseEnter={mainCol.onMouseEnter}>
        <ProviderBreadcrumb
          className="mb-8"
          items={[
            {
              label: `${portal ? tx(portal.homeTitle) : tx("Operations")}${
                provider?.orgName || displayName
                  ? ` · ${provider?.orgName || displayName}`
                  : ""
              }`,
            },
          ]}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label={extraStat.label} value={extraStat.value} />
          <StatCard label={tx("New requests")} value={String(stats.openRequests)} tone="alert" />
          <StatCard label={tx("In progress")} value={String(stats.accepted)} />
          <StatCard label={tx("Customers served")} value={String(stats.customersServed)} />
        </div>

        <HospitalOpsInsights />

        {portal?.showListing !== false ? (
        <section className="mt-6 rounded-2xl border border-line bg-white p-5">
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
            {listingCta ? (
              <Link to={listingCta.to}>
                <Button size="sm" variant="secondary">
                  {tx(listingCta.label)}
                </Button>
              </Link>
            ) : null}
          </div>
        </section>
        ) : null}

        <section className="mt-6 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {portal ? tx(portal.requestsLabel) : tx("Requests")}
            </h2>
            <Link
              to="/provider/requests"
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

      <aside
        className={"h-fit space-y-6 xl:sticky xl:top-8 " + railCol.className}
        onMouseEnter={railCol.onMouseEnter}
      >
        <HospitalOpsRail />
      </aside>
    </div>
  );
}

function HospitalOpsRail() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { workspaceId, provider } = useProvider();
  const { rows, upsert } = useHospitalPatients(workspaceId);
  const clinician = clinicianNoun(provider?.vendorType);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<PatientView>("grid");
  const [openId, setOpenId] = useState<string | null>(null);

  const patients = useMemo(() => {
    const today = rows.filter((p) => p.date === opsTodayIso());
    const q = query.trim();
    if (!q) return today;
    return today.filter((p) => fieldsMatchQuery([p.name, p.doctor, p.reason], q));
  }, [query, rows]);

  const openPatient = openId ? rows.find((p) => p.id === openId) ?? null : null;

  const openVisit = (patient: DraftHospitalPatient) => {
    if (needsCancelFlow(patient)) {
      nav(cancellationPath(patient.id));
      return;
    }
    setOpenId(patient.id);
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {tx("Patients today")}
              <span className="ml-1.5 text-ink-tertiary tnum">({patients.length})</span>
            </h2>
            <div className="flex shrink-0 items-center gap-1.5">
              <ViewToggle view={view} onChange={setView} />
              <Link
                to="/provider/patients"
                className="pl-1 text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
              >
                {tx("View all")}
              </Link>
            </div>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">{tx("Search patient or {role}").replace("{role}", clinician.toLowerCase())}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx("Search patient or {role}").replace("{role}", clinician.toLowerCase())}
              className="h-11 w-full rounded-full border border-line bg-white px-4 text-sm text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary focus:border-[color:var(--pp-primary-950)]"
            />
          </label>
        </div>

        {patients.length === 0 ? (
          <p className="border-t border-line px-5 py-10 text-center text-sm text-ink-tertiary">
            {tx("No patients match that search.")}
          </p>
        ) : view === "grid" ? (
          <ul className="pp-scroll grid max-h-[28rem] grid-cols-2 gap-3 overflow-y-auto border-t border-line p-4">
            {patients.map((p) => (
              <li key={p.id}>
                <PatientCard patient={p} clinician={clinician} onOpen={() => openVisit(p)} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="pp-scroll max-h-[28rem] divide-y divide-line overflow-y-auto border-t border-line">
            {patients.map((p) => (
              <li key={p.id}>
                <PatientRow patient={p} onOpen={() => openVisit(p)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {showDeptOverview(provider?.vendorType) ? <HospitalDeptOverview /> : null}

      <PatientManageQuickView
        patient={openPatient}
        open={Boolean(openPatient)}
        onClose={() => setOpenId(null)}
        onChange={upsert}
      />
    </>
  );
}

function PatientCard({
  patient,
  clinician,
  onOpen,
}: {
  patient: DraftHospitalPatient;
  clinician: string;
  onOpen: () => void;
}) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full w-full flex-col rounded-2xl border border-line bg-white p-3.5 text-left hover:bg-[color:var(--state-hover)]"
    >
      <PatientStatusBadge status={patient.status} />
      <div className="mt-3 flex min-w-0 items-center gap-2.5">
        <Avatar name={patient.name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">{patient.name}</p>
          <p className="mt-0.5 truncate text-2xs text-ink-tertiary">
            {patient.age} {tx("years old")}
          </p>
        </div>
      </div>
      <dl className="mt-3 space-y-1 text-2xs">
        <div>
          <dt className="inline text-ink-tertiary">{tx("Reason")}: </dt>
          <dd className="inline font-medium text-[color:var(--pp-primary-950)]">{tx(patient.reason)}</dd>
        </div>
        <div>
          <dt className="inline text-ink-tertiary">{tx("Duration")}: </dt>
          <dd className="inline font-medium text-[color:var(--pp-primary-950)] tnum">{patient.duration}</dd>
        </div>
        <div>
          <dt className="inline text-ink-tertiary">{tx(clinician)}: </dt>
          <dd className="inline font-medium text-[color:var(--pp-primary-950)]">{patient.doctor}</dd>
        </div>
      </dl>
    </button>
  );
}

function PatientRow({ patient, onOpen }: { patient: DraftHospitalPatient; onOpen: () => void }) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-[color:var(--state-hover)]"
    >
      <Avatar name={patient.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">{patient.name}</p>
        <p className="mt-0.5 truncate text-xs text-ink-tertiary">
          {patient.doctor}
          {" · "}
          {tx(patient.reason)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-2xs text-ink-tertiary tnum">{patient.duration}</p>
        <div className="mt-1 flex justify-end">
          <PatientStatusBadge status={patient.status} />
        </div>
      </div>
    </button>
  );
}

function PatientStatusBadge({ status }: { status: DraftPatientStatus }) {
  const { tx } = useI18n();
  const copy = PATIENT_STATUS[status];
  return (
    <span className={"inline-flex w-max rounded-full px-2 py-0.5 text-2xs font-semibold " + copy.className}>
      {tx(copy.label)}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-2xs font-semibold text-[color:var(--pp-primary-950)]"
      aria-hidden
    >
      {patientInitials(name)}
    </span>
  );
}

function ViewToggle({ view, onChange }: { view: PatientView; onChange: (v: PatientView) => void }) {
  const { tx } = useI18n();
  const btn = (id: PatientView, label: string, icon: ReactNode) => {
    const on = view === id;
    return (
      <button
        type="button"
        aria-pressed={on}
        aria-label={label}
        onClick={() => onChange(id)}
        className={
          "grid h-8 w-8 place-items-center rounded-full transition-colors " +
          (on
            ? "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
            : "text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]")
        }
      >
        {icon}
      </button>
    );
  };
  return (
    <div className="flex items-center" role="group" aria-label={tx("Patient layout")}>
      {btn(
        "grid",
        tx("Grid view"),
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <rect x="1" y="1" width="6" height="6" rx="1.2" />
          <rect x="9" y="1" width="6" height="6" rx="1.2" />
          <rect x="1" y="9" width="6" height="6" rx="1.2" />
          <rect x="9" y="9" width="6" height="6" rx="1.2" />
        </svg>,
      )}
      {btn(
        "list",
        tx("List view"),
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <rect x="1" y="2" width="14" height="2.2" rx="0.8" />
          <rect x="1" y="7" width="14" height="2.2" rx="0.8" />
          <rect x="1" y="12" width="14" height="2.2" rx="0.8" />
        </svg>,
      )}
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
