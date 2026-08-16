import { useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui";
import { BookingReviewSidebar } from "@/components/appointments/BookingReviewSidebar";
import { BookingCheckout } from "@/components/appointments/BookingCheckout";
import { useI18n } from "@/lib/i18n";
import { loadFamily, saveFamily } from "@/lib/accountPrefs";
import { useUser } from "@/lib/user";
import {
  DEMO_FINDINGS,
  DEMO_REPORTS,
  createAppointment,
  getProvider,
  isSpecialtyId,
  kindLabel,
  nextOpenSlots,
  specialtyById,
  type SpecialtyId,
  type VisitType,
} from "@/lib/appointments";
import { isPastDate, isSlotInPast } from "@/lib/timeSlots";

type PatientOption = {
  id: string;
  name: string;
  relation: string;
  badge?: string;
  contact: string;
};

type AttachedReport = {
  id: string;
  title: string;
  detail: string;
  source: "library" | "upload" | "lab";
};

export function BookAppointment() {
  const { tx } = useI18n();
  const { user, update } = useUser();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const providerId = params.get("provider");
  const provider = providerId ? getProvider(providerId) : undefined;
  const reasonParam = params.get("reason");
  const specialtyId: SpecialtyId | null = isSpecialtyId(reasonParam)
    ? reasonParam
    : provider?.specialties[0] ?? null;
  const specialty = specialtyId ? specialtyById(specialtyId) : undefined;

  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";
  const visitRaw = params.get("visit");
  const visitType: VisitType | null =
    visitRaw === "virtual" || visitRaw === "clinic" ? visitRaw : null;
  const facilityId = params.get("facility") || undefined;
  const slotPast = Boolean(date && time) && (isPastDate(date) || isSlotInPast(date, time));
  const nextSlots = useMemo(() => {
    if (!providerId || !visitType || !slotPast) return [];
    return nextOpenSlots(providerId, visitType, date, time, 4);
  }, [providerId, visitType, slotPast, date, time]);

  const pickSlot = (nextDate: string, nextTime: string) => {
    const next = new URLSearchParams(params);
    next.set("date", nextDate);
    next.set("time", nextTime);
    setParams(next, { replace: true });
  };

  const selfName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || tx("You");

  const [otherPatients, setOtherPatients] = useState<PatientOption[]>(() =>
    seedOtherPatients(user?.phone || user?.email || ""),
  );
  const [addingPatient, setAddingPatient] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newDob, setNewDob] = useState("");

  const [reportsOpen, setReportsOpen] = useState(false);
  const [consultsOpen, setConsultsOpen] = useState(false);
  const [dobError, setDobError] = useState("");

  const patients: PatientOption[] = useMemo(
    () => [
      {
        id: "self",
        name: selfName,
        relation: "Myself",
        badge: "Self",
        contact: user?.phone || user?.email || "",
      },
      ...otherPatients,
    ],
    [otherPatients, selfName, user?.email, user?.phone],
  );

  const [patientId, setPatientId] = useState("self");
  const [attached, setAttached] = useState<AttachedReport[]>([]);
  const [uploads, setUploads] = useState<AttachedReport[]>([]);
  const [skipReports, setSkipReports] = useState(false);
  const [findingIds, setFindingIds] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [checkout, setCheckout] = useState(false);

  const patient = patients.find((p) => p.id === patientId) ?? patients[0];
  const slotReady = !!(date && time && visitType);

  if (!provider) {
    return (
      <EmptyState
        title={tx("Choose a provider first")}
        body={tx("Choose a specialisation, then pick a nearby doctor, clinic, or hospital.")}
        cta={tx("Browse specialisations")}
        onCta={() => nav("/appointments")}
      />
    );
  }

  if (!slotReady) {
    const back = `/appointments/provider/${provider.id}${
      specialtyId ? `?specialty=${encodeURIComponent(specialtyId)}` : ""
    }`;
    return (
      <EmptyState
        title={tx("Select a time first")}
        body={tx("Pick a virtual or in-clinic slot on the provider page, then continue here.")}
        cta={tx("Back to availability")}
        onCta={() => nav(back)}
      />
    );
  }

  const fee =
    provider.consultationFee > 0 ? provider.consultationFee : specialty?.feeFrom ?? 0;

  const close = () => {
    const qs = new URLSearchParams();
    if (specialtyId) qs.set("specialty", specialtyId);
    if (facilityId) qs.set("facility", facilityId);
    nav(`/appointments/provider/${provider.id}?${qs.toString()}`);
  };

  const attachReport = (r: AttachedReport) => {
    setSkipReports(false);
    setAttached((cur) => (cur.some((x) => x.id === r.id) ? cur : [...cur, r]));
  };

  const detachReport = (id: string) => {
    setAttached((cur) => cur.filter((x) => x.id !== id));
  };

  const deleteUpload = (id: string) => {
    setUploads((cur) => cur.filter((x) => x.id !== id));
    detachReport(id);
  };

  const toggleUpload = (id: string) => {
    const existing = attached.find((a) => a.id === id);
    if (existing) {
      detachReport(id);
      return;
    }
    const file = uploads.find((u) => u.id === id);
    if (file) attachReport(file);
  };

  const toggleLibraryReport = (id: string) => {
    const existing = attached.find((a) => a.id === id);
    if (existing) {
      detachReport(id);
      return;
    }
    const r = DEMO_REPORTS.find((x) => x.id === id);
    if (!r) return;
    attachReport({ id: r.id, title: r.title, detail: r.detail, source: "library" });
  };

  const toggleFinding = (id: string) => {
    setFindingIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const onUpload = (files: FileList | null) => {
    if (!files?.length) return;
    setSkipReports(false);
    const next: AttachedReport[] = [];
    for (const file of Array.from(files)) {
      next.push({
        id: `upload-${file.name}-${file.size}`,
        title: file.name.trim() || tx("Untitled upload"),
        detail: tx("Uploaded from device"),
        source: "upload",
      });
    }
    setUploads((cur) => {
      const ids = new Set(cur.map((c) => c.id));
      return [...cur, ...next.filter((n) => !ids.has(n.id))];
    });
    setAttached((cur) => {
      const ids = new Set(cur.map((c) => c.id));
      return [...cur, ...next.filter((n) => !ids.has(n.id))];
    });
  };

  const addPassenger = () => {
    const name = newName.trim();
    const relation = newRelation.trim() || "Family member";
    const dob = newDob.trim();
    if (!name) return;
    if (dob && !isValidDob(dob)) {
      setDobError(tx("Use YYYY-MM-DD and a date in the past."));
      return;
    }
    const id = `pass-${Date.now()}`;
    const option: PatientOption = {
      id,
      name,
      relation,
      contact: user?.phone || user?.email || "",
    };
    setOtherPatients((cur) => {
      const next = [...cur, option];
      persistOtherPatients(next);
      return next;
    });

    setPatientId(id);
    setAddingPatient(false);
    setNewName("");
    setNewRelation("");
    setNewDob("");
    setDobError("");
  };

  const removePatient = (id: string) => {
    if (id === "self") return;
    setOtherPatients((cur) => {
      const next = cur.filter((p) => p.id !== id);
      persistOtherPatients(next);
      return next;
    });
    if (patientId === id) setPatientId("self");
  };

  const goToPayment = () => {
    if (!specialty || !visitType || !patient) return;
    if (isPastDate(date) || isSlotInPast(date, time)) return;
    setCheckout(true);
  };

  const payAndCreate = (cardLast4: string) => {
    if (!specialty || !visitType || !patient) {
      return { no: "", id: "" };
    }
    try {
      update({ paymentOnFile: true, cardLast4 });
    } catch {
      /* demo — ignore */
    }
    const appt = createAppointment({
      providerId: provider.id,
      providerKind: provider.kind,
      providerName: provider.name,
      specialtyId: specialty.id,
      specialtyLabel: specialty.label,
      visitType,
      date,
      time,
      patientName: patient.name,
      patientRelation: patient.relation,
      contact: patient.contact,
      notes: notes.trim(),
      symptoms: symptoms.trim(),
      fee,
      reportIds: skipReports ? [] : attached.map((a) => a.id),
      findingIds,
      clinicName: visitType === "clinic" ? provider.name : undefined,
      clinicAddress: visitType === "clinic" ? provider.address : undefined,
      status: "pending",
    });
    return { no: appt.confirmationNo, id: appt.id };
  };

  if (checkout) {
    return (
      <BookingCheckout
        doctorName={provider.name}
        visitLabel={tx(visitType === "virtual" ? "Virtual visit" : "In-clinic visit")}
        date={date}
        time={time}
        patientName={patient.name}
        specialtyLabel={specialty ? tx(specialty.label) : undefined}
        fee={fee}
        savedLast4={user?.cardLast4}
        onBack={() => setCheckout(false)}
        onClose={close}
        onPay={payAndCreate}
      />
    );
  }

  return (
    <div className="w-full min-w-0">
      <header className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button
          type="button"
          onClick={close}
          className="inline-flex items-center gap-1.5 justify-self-start text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
        >
          ← {tx("Back")}
        </button>
        <h1 className="text-center text-sm font-medium text-[color:var(--pp-primary-950)] sm:text-base">
          {tx("Patient details")}
        </h1>
        <button
          type="button"
          onClick={close}
          className="grid h-8 w-8 place-items-center justify-self-end rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
          aria-label={tx("Close booking")}
        >
          ✕
        </button>
      </header>

      <div className="grid w-full min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:gap-x-8 xl:gap-x-10">
        <div className="min-w-0 space-y-10 lg:col-start-1">
          <section>
            <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Who is this visit for?")}
            </h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              {tx("Choose a patient profile. History and reports are optional.")}
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
              {addingPatient ? (
                <div className="space-y-4 p-5">
                  <p className="text-sm font-semibold text-wellness">{tx("New patient")}</p>
                  <Field
                    label={tx("Full name")}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={tx("e.g. Jordan Lee")}
                    className="placeholder:italic"
                    autoComplete="name"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label={tx("Relationship")}
                      value={newRelation}
                      onChange={(e) => setNewRelation(e.target.value)}
                      placeholder={tx("e.g. Parent, child")}
                      className="placeholder:italic"
                    />
                    <Field
                      label={tx("Date of birth (optional)")}
                      value={newDob}
                      onChange={(e) => {
                        setNewDob(e.target.value);
                        setDobError("");
                      }}
                      placeholder="YYYY-MM-DD"
                      className="placeholder:italic"
                      inputMode="numeric"
                      error={dobError || undefined}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      onClick={addPassenger}
                      disabled={!newName.trim() || Boolean(newDob.trim() && !isValidDob(newDob.trim()))}
                    >
                      {tx("Save patient")}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setAddingPatient(false);
                        setNewName("");
                        setNewRelation("");
                        setNewDob("");
                        setDobError("");
                      }}
                    >
                      {tx("Cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingPatient(true)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[color:var(--state-hover)]"
                >
                  <span className="text-sm font-medium text-wellness">{tx("New patient")}</span>
                  <span className="text-lg leading-none text-wellness" aria-hidden>
                    +
                  </span>
                </button>
              )}
            </div>

            {patients.length === 0 ? (
              <p className="mt-4 text-sm text-ink-tertiary">
                {tx("Add a patient above to continue.")}
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {patients.map((p) => {
                  const on = patientId === p.id;
                  const isPrimary = p.id === "self";
                  const tag = isPrimary ? "Primary" : p.badge || p.relation;
                  return (
                    <div
                      key={p.id}
                      className={
                        "relative rounded-2xl border bg-white transition-colors " +
                        (on
                          ? "border-[color:var(--pp-primary-950)] shadow-[0_8px_24px_rgba(24,7,48,0.06)]"
                          : "border-line hover:border-[color:var(--border-strong)]")
                      }
                    >
                      <button
                        type="button"
                        onClick={() => setPatientId(p.id)}
                        aria-pressed={on}
                        className={"w-full p-4 text-left " + (isPrimary ? "" : "pr-10")}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span
                              className="block truncate font-semibold text-[color:var(--pp-primary-950)]"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                            <span className="mt-0.5 block truncate text-sm text-ink-tertiary">
                              {tx(p.relation)}
                            </span>
                          </span>
                          {tag ? (
                            <span className={"shrink-0 rounded-full px-2.5 py-1 text-2xs font-semibold " + relationTagClass(tag)}>
                              {tx(tag)}
                            </span>
                          ) : null}
                        </span>
                      </button>
                      {isPrimary ? null : (
                        <button
                          type="button"
                          onClick={() => removePatient(p.id)}
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
                          aria-label={`${tx("Remove")} ${p.name}`}
                        >
                          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                            <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Share your reports, or follow-ups")}
            </h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              {tx("Make consultant aware of your health condition, simply select to share.")}
            </p>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.heic,image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                onUpload(e.target.files);
                e.target.value = "";
                setReportsOpen(true);
              }}
            />

            <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
              <ShareBoard
                title={tx("Reports")}
                count={DEMO_REPORTS.length + uploads.length}
                open={reportsOpen}
                onToggle={() => setReportsOpen((v) => !v)}
                onUpload={() => fileRef.current?.click()}
                empty={tx("No reports yet. Upload a file to share.")}
              >
                {DEMO_REPORTS.map((r) => (
                  <ShareRow
                    key={r.id}
                    title={tx(r.title)}
                    detail={`${tx(r.detail)} · ${r.date}`}
                    checked={attached.some((a) => a.id === r.id)}
                    onToggle={() => toggleLibraryReport(r.id)}
                    kind="report"
                  />
                ))}
                {uploads.map((a) => (
                  <ShareRow
                    key={a.id}
                    title={a.title}
                    detail={tx(a.detail)}
                    checked={attached.some((x) => x.id === a.id)}
                    onToggle={() => toggleUpload(a.id)}
                    onDelete={() => deleteUpload(a.id)}
                    kind="report"
                  />
                ))}
              </ShareBoard>

              <ShareBoard
                title={tx("Earlier consultations")}
                count={DEMO_FINDINGS.length}
                open={consultsOpen}
                onToggle={() => setConsultsOpen((v) => !v)}
                onUpload={() => fileRef.current?.click()}
                empty={tx("No earlier consultations to share.")}
              >
                {DEMO_FINDINGS.map((f) => (
                  <ShareRow
                    key={f.id}
                    title={tx(f.title)}
                    detail={`${tx(f.detail)} · ${f.date}`}
                    checked={findingIds.includes(f.id)}
                    onToggle={() => toggleFinding(f.id)}
                    kind="finding"
                  />
                ))}
              </ShareBoard>
            </div>
          </section>
        </div>

        <BookingReviewSidebar
          doctorName={provider.name}
          doctorImage={provider.imageUrl}
          credentials={
            [
              provider.subtitle.split(/[·•]/)[0]?.trim(),
              specialty ? tx(specialty.label) : null,
            ]
              .filter(Boolean)
              .join(" • ") || tx(kindLabel(provider.kind))
          }
          verified={provider.kind === "doctor"}
          fee={fee}
          date={date}
          time={time}
          nextSlots={nextSlots}
          onPickSlot={pickSlot}
          patient={patient ?? null}
          reports={skipReports ? [] : attached}
          onRemoveReport={detachReport}
          findings={DEMO_FINDINGS.filter((f) => findingIds.includes(f.id)).map((f) => ({
            id: f.id,
            title: f.title,
            detail: f.detail,
          }))}
          onRemoveFinding={(id) => setFindingIds((cur) => cur.filter((x) => x !== id))}
          symptoms={symptoms}
          onSymptoms={setSymptoms}
          notes={notes}
          onNotes={setNotes}
          onConfirm={goToPayment}
          confirmDisabled={!patient || !specialty}
        />
      </div>
    </div>
  );
}

function seedOtherPatients(contact: string): PatientOption[] {
  const family = loadFamily();
  if (family.length > 0) {
    return family.map((m) => ({
      id: m.id,
      name: m.name,
      relation: m.relationship || "Family member",
      contact,
    }));
  }
  return [
    { id: "demo-partner", name: "Alex Rivera", relation: "Spouse", contact },
    { id: "demo-child", name: "Sam Rivera", relation: "Child", contact },
  ];
}

function persistOtherPatients(list: PatientOption[]) {
  try {
    saveFamily(
      list.map((p) => ({
        id: p.id,
        name: p.name,
        relationship: p.relation,
        dob: "",
        linked: true,
      })),
    );
  } catch {
    /* demo — ignore persistence errors */
  }
}

function relationTagClass(tag: string): string {
  const key = tag.toLowerCase();
  if (key === "primary" || key === "self") return "bg-wellness-subtle text-wellness";
  if (key === "spouse") return "bg-[color:var(--success-300)] text-[color:var(--success-900)]";
  if (key === "child") return "bg-[color:var(--secondary-600)] text-[color:var(--secondary-900)]";
  return "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]";
}

function isValidDob(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return false;
  const now = new Date();
  if (d > now) return false;
  if (now.getFullYear() - year > 120) return false;
  return true;
}

function ShareBoard({
  title,
  count,
  open,
  onToggle,
  onUpload,
  empty,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  onUpload: () => void;
  empty: string;
  children: ReactNode;
}) {
  const { tx } = useI18n();
  const id = `share-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="self-start w-full overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-[color:var(--pp-primary-950)]"
        >
          {title}{" "}
          <span className="font-normal text-ink-tertiary">
            {tx("Available")} ({count})
          </span>
        </button>
        <button
          type="button"
          onClick={onUpload}
          className="shrink-0 rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-80"
        >
          {tx("Upload")} +
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-100)]"
          aria-label={open ? tx("Collapse") : tx("Expand")}
        >
          <svg
            viewBox="0 0 20 20"
            className={"h-4 w-4 transition-transform " + (open ? "rotate-180" : "")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {open ? (
        <div id={id} className="bg-white">
          {count > 0 ? <ul>{children}</ul> : <p className="px-4 py-6 text-sm text-ink-tertiary">{empty}</p>}
        </div>
      ) : null}
    </div>
  );
}

function ShareRow({
  title,
  detail,
  checked,
  onToggle,
  onDelete,
  kind,
}: {
  title: string;
  detail: string;
  checked: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  kind: "report" | "finding";
}) {
  const { tx } = useI18n();
  return (
    <li className="border-t border-line first:border-t-0">
      <div className="flex w-full items-start gap-2 px-4 py-3.5">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={checked}
          className="flex min-w-0 flex-1 items-start gap-3 text-left transition-colors"
        >
          {kind === "report" ? <FileGlyph /> : <ConsultGlyph />}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[color:var(--pp-primary-950)]" title={title}>
              {title}
            </span>
            <span className="mt-0.5 block truncate text-xs text-ink-tertiary" title={detail}>
              {detail}
            </span>
          </span>
          <span
            className={
              "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border " +
              (checked
                ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-950)] text-white"
                : "border-[color:var(--pp-primary-950)]/35 bg-white")
            }
            aria-hidden
          >
            {checked ? (
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2.5 6.2 4.8 8.5 9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </span>
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
            aria-label={`${tx("Remove")} ${title}`}
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>
    </li>
  );
}

function FileGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-ink-tertiary" fill="none" aria-hidden>
      <path
        d="M5 2.5h4.2L12.5 6v7.2A1.3 1.3 0 0 1 11.2 14.5H5A1.3 1.3 0 0 1 3.7 13.2V3.8A1.3 1.3 0 0 1 5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M9 2.5V6h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function ConsultGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-ink-tertiary" fill="none" aria-hidden>
      <rect x="3" y="3.5" width="10" height="9.5" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 2.5v2M10 2.5v2M5.5 8h5M5.5 10.5h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function EmptyState({
  title,
  body,
  cta,
  onCta,
}: {
  title: string;
  body: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">{title}</h1>
      <p className="mt-2 text-sm text-ink-secondary">{body}</p>
      <Button className="mt-6 !rounded-full" onClick={onCta}>
        {cta}
      </Button>
    </div>
  );
}
