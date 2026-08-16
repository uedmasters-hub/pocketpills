import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import { addCalendarDays, isPastDate, isSlotInPast, monthDayShort, todayIso } from "@/lib/timeSlots";
import verifiedBadge from "../../../icons/verified badge.svg";

const NOTES_MAX = 400;
const LIST_CAP = 8;

export type ReviewPatient = {
  id: string;
  name: string;
  relation: string;
  badge?: string;
};

export type ReviewReport = {
  id: string;
  title: string;
  detail: string;
  source: "library" | "upload" | "lab";
};

export type ReviewFinding = {
  id: string;
  title: string;
  detail: string;
};

export function BookingReviewSidebar({
  doctorName,
  doctorImage,
  credentials,
  verified = true,
  fee,
  date,
  time,
  patient,
  reports,
  onRemoveReport,
  findings,
  onRemoveFinding,
  symptoms,
  onSymptoms,
  notes,
  onNotes,
  onConfirm,
  confirmDisabled,
  nextSlots = [],
  onPickSlot,
}: {
  doctorName: string;
  doctorImage: string;
  credentials: string;
  verified?: boolean;
  fee: number;
  date: string;
  time: string;
  patient: ReviewPatient | null;
  reports: ReviewReport[];
  onRemoveReport: (id: string) => void;
  findings: ReviewFinding[];
  onRemoveFinding: (id: string) => void;
  symptoms: string;
  onSymptoms: (value: string) => void;
  notes: string;
  onNotes: (value: string) => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  nextSlots?: { date: string; time: string }[];
  onPickSlot?: (date: string, time: string) => void;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const slotPast = Boolean(date && time) && (isPastDate(date) || isSlotInPast(date, time));
  const noPatient = !patient;
  const canConfirm = !noPatient && !slotPast && !confirmDisabled;
  const slotLabel = date && time ? `${date} - ${time}` : tx("Pick a time");

  let confirmHint = "";
  if (noPatient) confirmHint = tx("Add a patient on the left to continue.");
  else if (slotPast) confirmHint = tx("This time is no longer available. Pick a next slot below.");

  return (
    <aside className="w-full min-w-0 space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-28 lg:self-start">
      <div>
        <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Review visit")}
        </h2>
        <p className="mt-1 text-sm text-ink-tertiary">{tx("Confirm details before booking")}</p>
      </div>
      <div className="flex w-full max-h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-[1.5rem] border border-line bg-white shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-6">
          <DoctorHead
            name={doctorName}
            imageUrl={doctorImage}
            credentials={credentials}
            verified={verified}
          />

          <div className="mt-6 flex items-start justify-between gap-4 border-t border-line pt-6">
            <div className="min-w-0">
              <p className="text-2xs text-ink-tertiary">{tx("Consultation")}</p>
              <p className="mt-1.5 font-display text-2xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                {formatFee(fee)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xs text-ink-tertiary">{tx("Time slot")}</p>
              <p
                className={
                  "mt-1.5 whitespace-nowrap text-sm font-medium leading-snug " +
                  (slotPast
                    ? "text-ink-tertiary line-through"
                    : "text-[color:var(--pp-primary-950)]")
                }
                title={slotLabel}
              >
                {slotLabel}
              </p>
            </div>
          </div>

          {slotPast ? (
            <div role="status" className="mt-4 rounded-xl bg-[color:var(--pp-primary-100)] px-3 py-3">
              <p className="text-xs text-[color:var(--pp-primary-950)]">
                {tx("This time is no longer available. Pick a next slot below.")}
              </p>
              {nextSlots.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {nextSlots.map((s) => (
                    <button
                      key={`${s.date}-${s.time}`}
                      type="button"
                      onClick={() => onPickSlot?.(s.date, s.time)}
                      className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-[color:var(--pp-primary-950)] hover:border-[color:var(--pp-primary-950)]"
                    >
                      {slotChipLabel(s.date, s.time, tx)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink-tertiary">
                  {tx("No later slots this week. Message the care team for help.")}
                </p>
              )}
            </div>
          ) : null}

          <div className="mt-6 border-t border-line pt-5">
            <PatientFact patient={patient} />
            <VisitNotes
              symptoms={symptoms}
              onSymptoms={onSymptoms}
              notes={notes}
              onNotes={onNotes}
            />
          </div>

          {reports.length > 0 || findings.length > 0 ? (
            <div className="mt-2">
              {reports.length > 0 ? (
                <AttachAccordion title={tx("Reports")} count={reports.length}>
                  {reports.slice(0, LIST_CAP).map((r, i) => (
                    <AttachRow
                      key={r.id}
                      index={i + 1}
                      title={r.title}
                      tooltip={sourceHint(r.source, tx)}
                      kind="report"
                      onRemove={() => onRemoveReport(r.id)}
                    />
                  ))}
                  {reports.length > LIST_CAP ? (
                    <li className="px-1 py-1.5 text-2xs text-ink-tertiary">
                      +{reports.length - LIST_CAP} {tx("more attached")}
                    </li>
                  ) : null}
                </AttachAccordion>
              ) : null}
              {findings.length > 0 ? (
                <AttachAccordion title={tx("Findings")} count={findings.length}>
                  {findings.slice(0, LIST_CAP).map((f, i) => (
                    <AttachRow
                      key={f.id}
                      index={i + 1}
                      title={f.title}
                      kind="finding"
                      onRemove={() => onRemoveFinding(f.id)}
                    />
                  ))}
                  {findings.length > LIST_CAP ? (
                    <li className="px-1 py-1.5 text-2xs text-ink-tertiary">
                      +{findings.length - LIST_CAP} {tx("more shared")}
                    </li>
                  ) : null}
                </AttachAccordion>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 space-y-3 px-6 pb-6 pt-5">
          <Button
            fullWidth
            onClick={onConfirm}
            disabled={!canConfirm}
            className="!rounded-2xl"
            title={canConfirm ? undefined : confirmHint || undefined}
          >
            {tx("Continue to payment")}
          </Button>
          <button
            type="button"
            onClick={() => nav("/messages")}
            className="w-full py-1 text-center text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-70"
          >
            {tx("Message care team")}
          </button>
        </div>
      </div>
      <p className="px-1 text-center text-2xs leading-relaxed text-ink-tertiary">
        {tx("Demo booking — no real visit is scheduled with a clinic.")}
      </p>
    </aside>
  );
}

function sourceHint(source: ReviewReport["source"], tx: (s: string) => string) {
  if (source === "upload") return tx("Uploaded from device");
  if (source === "lab") return tx("Connected lab");
  return tx("From your library");
}

function slotChipLabel(date: string, time: string, tx: (s: string) => string) {
  const today = todayIso();
  const tomorrow = addCalendarDays(today, 1);
  const day = date === today ? tx("Today") : date === tomorrow ? tx("Tomorrow") : monthDayShort(date);
  return `${day} · ${time}`;
}

function DoctorHead({
  name,
  imageUrl,
  credentials,
  verified,
}: {
  name: string;
  imageUrl: string;
  credentials: string;
  verified: boolean;
}) {
  const [broken, setBroken] = useState(!imageUrl);
  const initial = name.trim().charAt(0) || "D";

  return (
    <div className="flex items-center gap-3.5">
      {!broken ? (
        <img
          src={imageUrl}
          alt=""
          onError={() => setBroken(true)}
          className="h-14 w-14 shrink-0 rounded-full object-cover object-[center_20%]"
        />
      ) : (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-sm font-semibold text-[color:var(--pp-primary-950)]">
          {initial}
        </span>
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-semibold leading-snug text-[color:var(--pp-primary-950)]">
          <span className="truncate" title={name}>
            {name}
          </span>
          {verified ? (
            <img src={verifiedBadge} alt="" className="h-3.5 w-3.5 shrink-0" />
          ) : null}
        </p>
        {credentials ? (
          <p className="mt-0.5 truncate text-sm text-ink-tertiary" title={credentials}>
            {credentials}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PatientFact({ patient }: { patient: ReviewPatient | null }) {
  const { tx } = useI18n();
  if (!patient) {
    return (
      <p className="text-sm text-ink-tertiary">{tx("Choose a patient on the left to continue.")}</p>
    );
  }

  const badge = patient.badge || patient.relation;

  return (
    <div>
      <p className="text-2xs text-ink-tertiary">{tx("Patient")}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-base font-medium leading-snug text-[color:var(--pp-primary-950)]" title={patient.name}>
          {patient.name}
        </p>
        {badge ? (
          <span className="shrink-0 rounded-full bg-[color:var(--pp-primary-100)] px-2.5 py-0.5 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
            {tx(badge)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function AttachAccordion({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { tx } = useI18n();
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className={open ? "pb-3" : undefined}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-2 rounded-xl px-2 py-1 text-left text-ink-tertiary transition-colors hover:bg-[color:var(--pp-primary-100)] hover:text-[color:var(--pp-primary-950)]"
      >
        <span className="text-2xs font-normal">
          {title} ({count})
        </span>
        <span className="grid h-4 w-4 shrink-0 place-items-center">
          <Chevron open={open} />
        </span>
      </button>
      <div id={id} hidden={!open} className="mt-1 pb-1">
        {open ? <ul className="max-h-44 overflow-y-auto">{children}</ul> : null}
        <p className="sr-only">{tx("Remove an item to drop it from this visit.")}</p>
      </div>
    </div>
  );
}

function AttachRow({
  index,
  title,
  tooltip,
  kind,
  onRemove,
}: {
  index: number;
  title: string;
  tooltip?: string;
  kind: "report" | "finding";
  onRemove: () => void;
}) {
  const { tx } = useI18n();
  const full = tooltip ? `${title} · ${tooltip}` : title;
  return (
    <li className="-mx-2 flex items-center gap-2 px-2 py-1.5">
      <span className="w-4 shrink-0 text-xs text-ink-tertiary tnum">{index}.</span>
      {kind === "report" ? <FileCheckGlyph /> : null}
      <span className="min-w-0 flex-1 truncate text-sm text-[color:var(--pp-primary-950)]" title={full}>
        {title}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
        aria-label={`${tx("Remove")} ${title}`}
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
        </svg>
      </button>
    </li>
  );
}

function FileCheckGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-ink-tertiary" fill="none" aria-hidden>
      <path
        d="M5 2.5h4.2L12.5 6v7.2A1.3 1.3 0 0 1 11.2 14.5H5A1.3 1.3 0 0 1 3.7 13.2V3.8A1.3 1.3 0 0 1 5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M9 2.5V6h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.6 10.1 7 11.5l3.2-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VisitNotes({
  symptoms,
  onSymptoms,
  notes,
  onNotes,
}: {
  symptoms: string;
  onSymptoms: (value: string) => void;
  notes: string;
  onNotes: (value: string) => void;
}) {
  const { tx } = useI18n();
  const value = notes || symptoms;
  const [active, setActive] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  const settleRef = useRef<number>(0);
  valueRef.current = value;
  const settled = !active && value.trim().length > 0;

  const clearSettle = () => {
    window.clearTimeout(settleRef.current);
  };

  const armSettle = () => {
    clearSettle();
    settleRef.current = window.setTimeout(() => {
      if (!valueRef.current.trim()) return;
      setActive(false);
      fieldRef.current?.blur();
    }, 3000);
  };

  useEffect(() => () => clearSettle(), []);

  const setValue = (next: string) => {
    const clipped = next.slice(0, NOTES_MAX);
    onNotes(clipped);
    if (symptoms) onSymptoms("");
    setActive(true);
    armSettle();
  };

  const activate = () => {
    clearSettle();
    setActive(true);
    fieldRef.current?.focus();
  };

  const boxed = active || settled;
  const fieldText =
    "col-start-1 row-start-1 min-w-0 w-full max-w-full whitespace-pre-wrap break-all [overflow-wrap:anywhere] text-xs font-normal leading-relaxed";

  return (
    <div
      className={
        "mt-2 min-w-0 max-w-full overflow-hidden transition-colors " +
        (boxed
          ? "rounded-2xl border px-3 py-2.5 " +
            (settled
              ? "cursor-text border-transparent bg-[color:var(--pp-primary-100)]"
              : "border-line bg-white")
          : "")
      }
      onClick={settled ? activate : undefined}
    >
      <div className="grid min-w-0">
        <textarea
          ref={fieldRef}
          value={value}
          rows={1}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => {
            clearSettle();
            setActive(true);
          }}
          onBlur={() => {
            clearSettle();
            setActive(false);
          }}
          placeholder={tx("Describe your symptoms (optional)")}
          maxLength={NOTES_MAX}
          readOnly={settled}
          className={
            fieldText +
            " h-full resize-none overflow-hidden bg-transparent p-0 outline-none placeholder:truncate placeholder:whitespace-nowrap placeholder:italic placeholder:text-ink-tertiary/55 " +
            (settled ? "cursor-text text-ink-tertiary" : "text-[color:var(--pp-primary-950)]")
          }
        />
        <span aria-hidden className={fieldText + " invisible pointer-events-none"}>
          {value || "\u00A0"}
        </span>
      </div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={"h-4 w-4 shrink-0 transition-transform " + (open ? "rotate-180" : "")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
