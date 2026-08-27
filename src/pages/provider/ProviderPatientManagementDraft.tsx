/**
 * Hospital patient board — every booked patient.
 */
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Caret } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { clinicianNoun, portalFor, showDeptOverview } from "@/lib/providerPortals";
import { fieldsMatchQuery } from "@/lib/searchMatch";
import { useShellColumn } from "@/lib/columnHover";
import { HospitalDeptOverview } from "@/components/provider/HospitalDeptOverview";
import { PatientManageQuickView } from "@/components/provider/PatientManageQuickView";
import { AddDraftPatientModal } from "@/components/provider/AddDraftPatientModal";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import {
  boardDoctors,
  DRAFT_DEPARTMENT_FILTERS,
  PATIENT_STATUS,
  cancellationPath,
  formatPatientDate,
  needsCancelFlow,
  patientInitials,
  useHospitalPatients,
  type DraftHospitalPatient,
  type DraftPatientStatus,
} from "@/lib/hospitalPatientDraft";

const PATIENTS_HOME = "/provider";
const PAGE_SIZE = 8;
const SELECT =
  "h-11 w-full appearance-none rounded-full border border-line bg-white px-4 pr-9 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const FIELD =
  "h-11 w-full rounded-full border border-line bg-white px-4 text-sm text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary focus:border-[color:var(--pp-primary-950)]";

type View = "grid" | "list";

export function ProviderPatientManagementDraft() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { workspaceId, provider } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const clinician = clinicianNoun(provider?.vendorType);
  const clinicians = clinicianNoun(provider?.vendorType, true);
  const doctors = boardDoctors(workspaceId);
  const { rows, upsert } = useHospitalPatients(workspaceId);
  const mainCol = useShellColumn("main");
  const railCol = useShellColumn("rail");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("list");
  const [doctor, setDoctor] = useState("all");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState<"all" | DraftPatientStatus>("all");
  const [date, setDate] = useState("all");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const dates = useMemo(
    () => Array.from(new Set(rows.map((p) => p.date))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    return rows.filter((p) => {
      if (doctor !== "all" && p.doctor !== doctor) return false;
      if (department !== "all" && p.department !== department) return false;
      if (status !== "all" && p.status !== status) return false;
      if (date !== "all" && p.date !== date) return false;
      if (q && !fieldsMatchQuery([p.name, p.doctor, p.reason, p.department], q)) return false;
      return true;
    });
  }, [rows, query, doctor, department, status, date]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const addPatient = (next: DraftHospitalPatient) => {
    upsert(next);
    setAddOpen(false);
    setPage(1);
  };

  const patchPatient = (next: DraftHospitalPatient) => {
    upsert(next);
  };

  const openPatient = openId ? rows.find((p) => p.id === openId) ?? null : null;

  const openVisit = (patient: DraftHospitalPatient) => {
    if (needsCancelFlow(patient)) {
      nav(cancellationPath(patient.id));
      return;
    }
    setOpenId(patient.id);
  };

  return (
    <div
      className={
        showDeptOverview(provider?.vendorType)
          ? "grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] xl:gap-x-10"
          : undefined
      }
    >
      <div className={"min-w-0 " + mainCol.className} onMouseEnter={mainCol.onMouseEnter}>
        <ProviderBreadcrumb
          items={[
            { label: tx(portal?.homeTitle || "Home"), to: PATIENTS_HOME },
            { label: tx("Patients") },
          ]}
        />

        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
                {tx("Appointments")}
                <span className="ml-1.5 text-ink-tertiary tnum">({filtered.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                <ViewToggle view={view} onChange={setView} />
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  {tx("Add new patient")}
                </Button>
              </div>
            </div>

            <label className="mt-3 block">
              <span className="sr-only">{tx("Search patient or {role}").replace("{role}", clinician.toLowerCase())}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPage();
                }}
                placeholder={tx("Search patient or {role}").replace("{role}", clinician.toLowerCase())}
                className={FIELD}
              />
            </label>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect
                label={tx(clinician)}
                value={doctor}
                onChange={(v) => {
                  setDoctor(v);
                  resetPage();
                }}
                options={[{ value: "all", label: tx("All {role}").replace("{role}", clinicians.toLowerCase()) }, ...doctors.map((d) => ({ value: d, label: d }))]}
              />
              <FilterSelect
                label={tx("Department")}
                value={department}
                onChange={(v) => {
                  setDepartment(v);
                  resetPage();
                }}
                options={[
                  { value: "all", label: tx("All departments") },
                  ...DRAFT_DEPARTMENT_FILTERS.map((d) => ({ value: d, label: tx(d) })),
                ]}
              />
              <FilterSelect
                label={tx("Status")}
                value={status}
                onChange={(v) => {
                  setStatus(v as "all" | DraftPatientStatus);
                  resetPage();
                }}
                options={[
                  { value: "all", label: tx("All statuses") },
                  { value: "active", label: tx("Active") },
                  { value: "upcoming", label: tx("Upcoming") },
                  { value: "completed", label: tx("Completed") },
                  { value: "denied", label: tx("Denied") },
                  { value: "cancelled", label: tx("Cancelled") },
                ]}
              />
              <FilterSelect
                label={tx("Date")}
                value={date}
                onChange={(v) => {
                  setDate(v);
                  resetPage();
                }}
                options={[
                  { value: "all", label: tx("All dates") },
                  ...dates.map((d) => ({ value: d, label: formatPatientDate(d) })),
                ]}
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="border-t border-line px-5 py-12 text-center text-sm text-ink-tertiary">
              {tx("No patients match these filters.")}
            </p>
          ) : view === "grid" ? (
            <ul className="grid grid-cols-1 gap-3 border-t border-line p-4 sm:grid-cols-2">
              {visible.map((p) => (
                <li key={p.id}>
                  <PatientCard patient={p} onOpen={() => openVisit(p)} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {visible.map((p) => (
                <li key={p.id}>
                  <PatientRow patient={p} onOpen={() => openVisit(p)} />
                </li>
              ))}
            </ul>
          )}

          {pages > 1 ? (
            <div className="flex flex-wrap items-center justify-end gap-1 border-t border-line px-4 py-3">
              <PageBtn
                label={tx("Previous")}
                disabled={safePage <= 1}
                onClick={() => setPage((n) => Math.max(1, n - 1))}
              >
                ‹
              </PageBtn>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <PageBtn key={n} label={String(n)} active={n === safePage} onClick={() => setPage(n)}>
                  {n}
                </PageBtn>
              ))}
              <PageBtn
                label={tx("Next")}
                disabled={safePage >= pages}
                onClick={() => setPage((n) => Math.min(pages, n + 1))}
              >
                ›
              </PageBtn>
            </div>
          ) : null}
        </section>
      </div>

      {showDeptOverview(provider?.vendorType) ? (
      <aside className={"h-fit xl:sticky xl:top-8 " + railCol.className} onMouseEnter={railCol.onMouseEnter}>
        <HospitalDeptOverview />
      </aside>
      ) : null}

      <AddDraftPatientModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addPatient}
        title={tx("Add new patient")}
        confirmLabel={tx("Add patient")}
      />
      <PatientManageQuickView
        patient={openPatient}
        open={Boolean(openPatient)}
        onClose={() => setOpenId(null)}
        onChange={patchPatient}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <select className={SELECT} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Caret className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
    </label>
  );
}

function PageBtn({
  children,
  label,
  onClick,
  disabled,
  active,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={
        "grid h-8 min-w-8 place-items-center rounded-full px-2.5 text-sm font-medium transition-colors " +
        (active
          ? "bg-cta text-white"
          : disabled
            ? "cursor-default text-ink-tertiary"
            : "text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]")
      }
    >
      {children}
    </button>
  );
}

function PatientCard({ patient, onOpen }: { patient: DraftHospitalPatient; onOpen: () => void }) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full w-full flex-col rounded-2xl border border-line bg-white p-4 text-left hover:bg-[color:var(--state-hover)]"
    >
      <div className="flex items-start justify-between gap-2">
        <StatusBadge status={patient.status} />
        <p className="text-2xs text-ink-tertiary tnum">{formatPatientDate(patient.date)}</p>
      </div>
      <div className="mt-3 flex min-w-0 items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-2xs font-semibold text-[color:var(--pp-primary-950)]">
          {patientInitials(patient.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">{patient.name}</p>
          <p className="mt-0.5 truncate text-2xs text-ink-tertiary">
            {patient.age} {tx("years old")}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-[color:var(--pp-primary-950)]">{tx(patient.reason)}</p>
      <p className="mt-1 text-xs text-ink-tertiary">
        {patient.doctor}
        {" · "}
        {patient.duration}
      </p>
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
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-2xs font-semibold text-[color:var(--pp-primary-950)]">
        {patientInitials(patient.name)}
      </span>
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
          <StatusBadge status={patient.status} />
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: DraftPatientStatus }) {
  const { tx } = useI18n();
  const copy = PATIENT_STATUS[status];
  return (
    <span className={"inline-flex w-max rounded-full px-2 py-0.5 text-2xs font-semibold " + copy.className}>
      {tx(copy.label)}
    </span>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const { tx } = useI18n();
  const btn = (id: View, label: string, icon: ReactNode) => {
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
