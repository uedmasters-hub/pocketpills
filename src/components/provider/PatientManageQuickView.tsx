/**
 * Hospital patient visit panel — approve, reschedule, or review records.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Caret } from "@/components/ui";
import { ReportThumb } from "@/components/records/ReportThumb";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { consultQuote, formatMoney } from "@/lib/bookingQuote";
import { formatFee } from "@/lib/appointments";
import { endOptionsAfter, formatSlotWindow, startTimeOptions } from "@/lib/timeSlots";
import {
  doctorCredentials,
  PATIENT_STATUS,
  cancellationPath,
  formatPatientDate,
  needsCancelFlow,
  patientInitials,
  splitDuration,
  startPatientCancellation,
  type DraftApproval,
  type DraftHospitalPatient,
  type DraftPatientFile,
} from "@/lib/hospitalPatientDraft";

const FIELD =
  "h-11 w-full rounded-full border border-line bg-white px-4 text-sm text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary focus:border-[color:var(--pp-primary-950)]";
const SELECT =
  "h-11 w-full appearance-none rounded-full border border-line bg-white px-4 pr-9 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const NOTE =
  "min-h-[5.5rem] w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm text-[color:var(--pp-primary-950)] outline-none placeholder:italic placeholder:text-ink-tertiary focus:border-[color:var(--pp-primary-950)]";

const APPROVAL_LABEL: Record<DraftApproval, string> = {
  pending: "Awaiting decision",
  visit: "Visit approved",
  consultant: "Consultant approved",
  denied: "Denied",
};

export function PatientManageQuickView({
  patient,
  open,
  onClose,
  onChange,
  reviewOnly = false,
}: {
  patient: DraftHospitalPatient | null;
  open: boolean;
  onClose: () => void;
  onChange: (next: DraftHospitalPatient) => void;
  reviewOnly?: boolean;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { workspaceId } = useProvider();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const viewFileRef = useRef<DraftPatientFile | null>(null);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("9:00 AM");
  const [end, setEnd] = useState("9:30 AM");
  const [denyNote, setDenyNote] = useState("");
  const [viewFile, setViewFile] = useState<DraftPatientFile | null>(null);
  viewFileRef.current = viewFile;

  useEffect(() => {
    if (!patient) return;
    const window = splitDuration(patient.duration);
    setDate(patient.date);
    setStart(window.start);
    setEnd(window.end);
    setDenyNote(patient.denyNote);
    setViewFile(null);
  }, [patient?.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (viewFileRef.current) {
        setViewFile(null);
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open || !patient || typeof document === "undefined") return null;

  const quote = consultQuote(patient.fee);
  const locked = patient.status === "completed" || reviewOnly;
  const cancelOpen = needsCancelFlow(patient);
  const rxFiles = patient.reports.filter(isPrescriptionFile);
  const reportFiles = patient.reports.filter((f) => !isPrescriptionFile(f));
  const ends = endOptionsAfter(start);
  const slotLabel = `${patient.duration} · ${patient.date}`;
  const credentials = doctorCredentials(workspaceId, patient.doctor) || patient.department;
  const visitKind = patient.visitType === "virtual" ? tx("Virtual") : tx("In clinic");
  const status = PATIENT_STATUS[patient.status];

  const patch = (partial: Partial<DraftHospitalPatient>) => onChange({ ...patient, ...partial });

  const saveSlot = () => {
    if (locked || !date) return;
    patch({ date, duration: formatSlotWindow(start, end), status: patient.status === "denied" ? "upcoming" : patient.status });
  };

  const approve = (kind: "visit" | "consultant") => {
    if (locked) return;
    patch({
      approval: kind,
      denyNote: "",
      status: patient.status === "denied" ? "upcoming" : patient.status,
    });
  };

  const deny = () => {
    const note = denyNote.trim();
    if (locked || !note) return;
    patch(startPatientCancellation(patient, "denied", note));
    onClose();
    nav(cancellationPath(patient.id));
  };

  const cancelBooking = () => {
    const note = denyNote.trim();
    if (locked || !note) return;
    patch(startPatientCancellation(patient, "cancelled", note));
    onClose();
    nav(cancellationPath(patient.id));
  };

  const continueCancel = () => {
    onClose();
    nav(cancellationPath(patient.id));
  };

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[color:var(--pp-primary-950)]/40"
        aria-label={tx("Close")}
        onClick={() => {
          if (viewFileRef.current) {
            setViewFile(null);
            return;
          }
          onClose();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 flex max-h-[min(46rem,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_48px_rgba(24,7,48,0.16)] outline-none"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="pp-caps text-[color:var(--pp-violet)]">
              {reviewOnly ? tx("Visit records") : tx("Manage patient")}
            </p>
            <h2 id={titleId} className="mt-1 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {patient.name}
            </h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              {patient.age} {tx("years old")}
              {" · "}
              {tx(patient.reason)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={"rounded-full px-2.5 py-1 text-2xs font-semibold " + status.className}>
              {tx(status.label)}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
              aria-label={tx("Close")}
            >
              ✕
            </button>
          </div>
        </div>

        <div key={patient.id} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
            <DoctorBlock name={patient.doctor} credentials={credentials} />
            <span className="shrink-0 rounded-full bg-[color:var(--pp-primary-100)] px-2.5 py-1 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
              {visitKind}
            </span>
          </div>

          <dl>
            <FactRow label={tx("Time slot")} value={slotLabel} />
            <FactRow label={tx("Patient")} value={patient.name} />
            <FactRow label={tx("Department")} value={tx(patient.department)} />
            <FactRow label={tx("Decision")} value={tx(APPROVAL_LABEL[patient.approval])} />
          </dl>

          <div className="border-t border-line px-5 py-3">
            {patient.symptoms.trim() ? (
              <p className="rounded-lg bg-[color:var(--pp-primary-100)] px-3 py-2.5 text-xs leading-relaxed text-[color:var(--pp-primary-950)]">
                {patient.symptoms}
              </p>
            ) : (
              <p className="px-0 py-2 text-xs italic text-ink-tertiary/70">
                {reviewOnly ? tx("No visit notes") : tx("Describe your symptoms (optional)")}
              </p>
            )}
          </div>

          {reviewOnly ? (
            <p className="border-t border-line px-5 py-3 text-sm text-ink-tertiary">
              {tx("This visit has ended. Open a file below to review prescriptions, reports, and notes.")}
            </p>
          ) : null}

          <AttachAccordion title={tx("Prescriptions")} count={rxFiles.length} defaultOpen={reviewOnly && rxFiles.length > 0}>
            {rxFiles.map((r, i) => (
              <FileRow key={r.id} index={i + 1} file={r} onOpen={setViewFile} />
            ))}
          </AttachAccordion>
          <AttachAccordion title={tx("Reports")} count={reportFiles.length} defaultOpen={reviewOnly && reportFiles.length > 0}>
            {reportFiles.map((r, i) => (
              <FileRow key={r.id} index={i + 1} file={r} onOpen={setViewFile} />
            ))}
          </AttachAccordion>
          <AttachAccordion title={tx("Findings")} count={patient.findings.length} defaultOpen={reviewOnly && patient.findings.length > 0}>
            {patient.findings.map((r, i) => (
              <FileRow key={r.id} index={i + 1} file={r} onOpen={setViewFile} />
            ))}
          </AttachAccordion>
          <AttachAccordion title={tx("Previous consults")} count={patient.consults.length} defaultOpen={reviewOnly && patient.consults.length > 0}>
            {patient.consults.map((r, i) => (
              <FileRow key={r.id} index={i + 1} file={r} onOpen={setViewFile} />
            ))}
          </AttachAccordion>

          <div className="border-t border-line px-5 py-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("You pay")}</p>
                <p className="mt-1 font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                  {patient.fee <= 0 ? formatFee(0) : formatMoney(quote.beforeOffer)}
                </p>
              </div>
              {patient.fee > 0 ? (
                <PriceToggle
                  rows={[
                    [tx("Consultation fee"), formatMoney(quote.consultation)],
                    [tx("Convenience fee"), formatMoney(quote.convenience)],
                    [tx("Insurance ({pct}%)").replace("{pct}", String(quote.insurancePct)), `−${formatMoney(quote.insurance)}`],
                  ]}
                />
              ) : null}
            </div>
          </div>

          {reviewOnly ? null : (
          <section className="border-t border-line px-5 py-4">
            <h3 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">{tx("Manage visit")}</h3>
            {locked ? (
              <p className="mt-2 text-sm text-ink-tertiary">{tx("This visit is already completed.")}</p>
            ) : cancelOpen ? (
              <>
                <p className="mt-2 text-sm text-ink-secondary">
                  {tx("This booking was denied or cancelled. Finish it on the cancellation page.")}
                </p>
                {patient.denyNote ? (
                  <p className="mt-3 rounded-lg bg-[color:var(--pp-primary-100)] px-3 py-2.5 text-xs leading-relaxed text-[color:var(--pp-primary-950)]">
                    {patient.denyNote}
                  </p>
                ) : null}
                <Button size="sm" className="mt-3" onClick={continueCancel}>
                  {tx("Continue cancellation")}
                </Button>
              </>
            ) : (
              <>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Date")}</span>
                    <input className={FIELD} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </label>
                  <TimeSelect
                    label={tx("Start")}
                    value={start}
                    options={withCurrent(start, startTimeOptions())}
                    onChange={(next) => {
                      setStart(next);
                      const opts = endOptionsAfter(next);
                      if (!opts.includes(end)) setEnd(opts[0] || next);
                    }}
                  />
                  <TimeSelect
                    label={tx("End")}
                    value={end}
                    options={withCurrent(end, ends)}
                    onChange={setEnd}
                  />
                </div>
                <Button size="sm" variant="secondary" className="mt-3" onClick={saveSlot}>
                  {tx("Save date and time")}
                </Button>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => approve("visit")} disabled={patient.approval === "visit"}>
                    {tx("Approve visit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => approve("consultant")}
                    disabled={patient.approval === "consultant"}
                  >
                    {tx("Approve consultant")}
                  </Button>
                </div>

                <label className="mt-4 block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Deny or cancel with a note")}</span>
                  <textarea
                    className={NOTE}
                    value={denyNote}
                    onChange={(e) => setDenyNote(e.target.value)}
                    placeholder={tx("Reason the visit cannot go ahead")}
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={deny} disabled={!denyNote.trim()}>
                    {tx("Deny")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelBooking} disabled={!denyNote.trim()}>
                    {tx("Cancel booking")}
                  </Button>
                </div>
              </>
            )}
          </section>
          )}
        </div>
        {viewFile ? <FilePreview file={viewFile} onClose={() => setViewFile(null)} /> : null}
      </div>
    </div>,
    document.body,
  );
}

function withCurrent(current: string, list: string[]) {
  if (!current || list.includes(current)) return list;
  return [current, ...list];
}

function TimeSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{label}</span>
      <span className="relative block">
        <select className={SELECT} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
          {options.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Caret className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
      </span>
    </label>
  );
}

function DoctorBlock({ name, credentials }: { name: string; credentials: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-sm font-semibold text-[color:var(--pp-primary-950)]">
        {patientInitials(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-[color:var(--pp-primary-950)]">{name}</p>
        <p className="mt-0.5 truncate text-sm text-ink-tertiary">{credentials}</p>
      </div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line px-5 py-2.5">
      <dt className="shrink-0 text-sm text-ink-tertiary">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium leading-snug text-[color:var(--pp-primary-950)]" title={value}>
        {value}
      </dd>
    </div>
  );
}

function AttachAccordion({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-5 py-2.5 text-left text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        <span>
          {title} ({count})
        </span>
        <svg
          viewBox="0 0 12 12"
          className={"h-3.5 w-3.5 shrink-0 transition-transform " + (open ? "rotate-180" : "")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul id={id} className="max-h-44 overflow-y-auto pb-2">
          {count ? children : (
            <li className="px-5 pb-2 text-xs text-ink-tertiary">—</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

function FileRow({
  index,
  file,
  onOpen,
}: {
  index: number;
  file: DraftPatientFile;
  onOpen: (file: DraftPatientFile) => void;
}) {
  const { tx } = useI18n();
  const rx = isPrescriptionFile(file);
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(file)}
        className="flex w-full items-center gap-2 px-5 py-1.5 text-left hover:bg-[color:var(--state-hover)]"
      >
        <span className="w-4 shrink-0 text-xs text-ink-tertiary tnum">{index}.</span>
        <ReportThumb src={file.previewSrc} placeholder className="h-8 w-10" />
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="block truncate text-sm text-[color:var(--pp-primary-950)]">{file.title}</span>
            {rx ? (
              <span className="shrink-0 rounded-full bg-[color:var(--pp-primary-100)] px-2 py-0.5 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                {tx("Prescription")}
              </span>
            ) : null}
          </span>
          <span className="block truncate text-2xs text-ink-tertiary">
            {file.detail}
            {file.date ? ` · ${formatPatientDate(file.date)}` : ""}
          </span>
        </span>
      </button>
    </li>
  );
}

function FilePreview({ file, onClose }: { file: DraftPatientFile; onClose: () => void }) {
  const { tx } = useI18n();
  const rx = isPrescriptionFile(file);
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="pp-caps text-[color:var(--pp-violet)]">{rx ? tx("Prescription") : tx("Record")}</p>
          <h3 className="mt-1 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">{file.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
          aria-label={tx("Close")}
        >
          ✕
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {file.previewSrc ? (
          <img
            src={file.previewSrc}
            alt=""
            className="max-h-[min(36rem,70vh)] w-full rounded-xl border border-line bg-white object-contain object-top"
          />
        ) : (
          <p className="text-sm text-ink-secondary">
            {tx("No photo is stored for this file. The title and date stay on your record.")}
          </p>
        )}
        <p className="mt-3 text-sm text-ink-tertiary">
          {file.detail}
          {file.date ? ` · ${formatPatientDate(file.date)}` : ""}
        </p>
      </div>
    </div>
  );
}

function isPrescriptionFile(file: DraftPatientFile) {
  if (file.previewSrc?.includes("medications")) return true;
  return /prescription|medication/i.test(`${file.title} ${file.detail}`);
}

function PriceToggle({ rows }: { rows: [string, string][] }) {
  const { tx } = useI18n();
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="text-right">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70"
      >
        {open ? tx("Hide breakdown") : tx("Show breakdown")}
      </button>
      {open ? (
        <dl id={id} className="mt-2 space-y-1 text-xs">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-end gap-3">
              <dt className="text-ink-tertiary">{k}</dt>
              <dd className="text-[color:var(--pp-primary-950)] tnum">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
