/**
 * Add a visit to the hospital board.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Caret, Modal } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { clinicianNoun } from "@/lib/providerPortals";
import {
  boardDoctors,
  DRAFT_DEPARTMENT_FILTERS,
  newDraftPatient,
  opsTodayIso,
  type DraftHospitalPatient,
} from "@/lib/hospitalPatientDraft";

const FIELD =
  "h-11 w-full rounded-full border border-line bg-white px-4 text-sm text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary focus:border-[color:var(--pp-primary-950)]";
const SELECT =
  "h-11 w-full appearance-none rounded-full border border-line bg-white px-4 pr-9 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";

export type AddDraftDefaults = {
  doctor?: string;
  date?: string;
  duration?: string;
};

export function AddDraftPatientModal({
  open,
  onClose,
  onAdd,
  defaults,
  title,
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (p: DraftHospitalPatient) => void;
  defaults?: AddDraftDefaults | null;
  title?: string;
  confirmLabel?: string;
}) {
  const { tx } = useI18n();
  const { workspaceId, provider } = useProvider();
  const doctors = boardDoctors(workspaceId);
  const heading = title ?? tx("Add visit");
  const confirm = confirmLabel ?? tx("Add visit");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [doctor, setDoctor] = useState<string>(doctors[0] || "");
  const [department, setDepartment] = useState<string>(DRAFT_DEPARTMENT_FILTERS[0]);
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(opsTodayIso());
  const [duration, setDuration] = useState("9:00 – 9:30 AM");

  const reset = () => {
    setName("");
    setAge("");
    setDoctor(defaults?.doctor || doctors[0] || "");
    setDepartment(DRAFT_DEPARTMENT_FILTERS[0]);
    setReason("");
    setDate(defaults?.date || opsTodayIso());
    setDuration(defaults?.duration || "9:00 – 9:30 AM");
  };

  useEffect(() => {
    if (!open) return;
    setName("");
    setAge("");
    setReason("");
    setDepartment(DRAFT_DEPARTMENT_FILTERS[0]);
    setDoctor(defaults?.doctor || doctors[0] || "");
    setDate(defaults?.date || opsTodayIso());
    setDuration(defaults?.duration || "9:00 – 9:30 AM");
  }, [open, defaults?.doctor, defaults?.date, defaults?.duration, workspaceId]);

  const submit = () => {
    const trimmed = name.trim();
    const years = Number(age);
    if (!trimmed || !Number.isFinite(years) || years < 0) return;
    onAdd(
      newDraftPatient({
        name: trimmed,
        age: Math.round(years),
        reason: reason.trim() || "Consult",
        duration: duration.trim() || "9:00 – 9:30 AM",
        doctor,
        date,
        department,
      }),
    );
    reset();
  };

  return (
    <Modal
      open={open}
      title={heading}
      onClose={() => {
        reset();
        onClose();
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tx("Cancel")}
          </Button>
          <Button onClick={submit} disabled={!name.trim() || !age.trim()}>
            {confirm}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Patient name")}</span>
          <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Age")}</span>
          <input className={FIELD} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx(clinicianNoun(provider?.vendorType))}</span>
          <span className="relative block">
            <select className={SELECT} value={doctor} onChange={(e) => setDoctor(e.target.value)}>
              {doctors.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Caret className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Department")}</span>
          <span className="relative block">
            <select className={SELECT} value={department} onChange={(e) => setDepartment(e.target.value)}>
              {DRAFT_DEPARTMENT_FILTERS.map((d) => (
                <option key={d} value={d}>
                  {tx(d)}
                </option>
              ))}
            </select>
            <Caret className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Service")}</span>
          <input className={FIELD} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={tx("Consult")} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Date")}</span>
          <input className={FIELD} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Time")}</span>
          <input className={FIELD} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </label>
      </div>
    </Modal>
  );
}
