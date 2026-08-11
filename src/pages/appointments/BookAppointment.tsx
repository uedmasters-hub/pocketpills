import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { loadFamily, saveFamily, type FamilyMember } from "@/lib/accountPrefs";
import { useUser } from "@/lib/user";
import {
  DEMO_FINDINGS,
  DEMO_REPORTS,
  createAppointment,
  formatFee,
  getProvider,
  isSpecialtyId,
  kindLabel,
  specialtyById,
  type SpecialtyId,
  type VisitType,
} from "@/lib/appointments";

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

/** Demo lab network reports the member can browse without downloading locally. */
const CONNECTED_LAB_REPORTS = [
  {
    id: "lab-lifelabs-1",
    lab: "LifeLabs",
    title: "Comprehensive metabolic panel",
    detail: "Drawn Jul 28, 2026 · Available in network",
    date: "2026-07-28",
  },
  {
    id: "lab-dynacare-1",
    lab: "Dynacare",
    title: "Thyroid panel (TSH, Free T4)",
    detail: "Drawn Jun 12, 2026 · Available in network",
    date: "2026-06-12",
  },
  {
    id: "lab-lifelabs-2",
    lab: "LifeLabs",
    title: "Vitamin D & B12",
    detail: "Drawn May 3, 2026 · Available in network",
    date: "2026-05-03",
  },
] as const;

export function BookAppointment() {
  const { tx } = useI18n();
  const { user } = useUser();
  const nav = useNavigate();
  const [params] = useSearchParams();
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
  const serviceId = params.get("service") || undefined;

  const selfName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || tx("You");

  const [extraPatients, setExtraPatients] = useState<PatientOption[]>([]);
  const [addingPatient, setAddingPatient] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newDob, setNewDob] = useState("");

  const [browsingLabs, setBrowsingLabs] = useState(false);

  const basePatients: PatientOption[] = useMemo(() => {
    const family = loadFamily();
    const list: PatientOption[] = [
      {
        id: "self",
        name: selfName,
        relation: "Myself",
        badge: "Primary",
        contact: user?.phone || user?.email || "",
      },
    ];
    for (const m of family) {
      list.push({
        id: m.id,
        name: m.name,
        relation: m.relationship || "Family member",
        contact: user?.phone || user?.email || "",
      });
    }
    if (list.length === 1) {
      list.push(
        {
          id: "demo-partner",
          name: "Alex Rivera",
          relation: "Spouse",
          contact: user?.phone || "",
        },
        {
          id: "demo-child",
          name: "Sam Rivera",
          relation: "Child",
          contact: user?.phone || "",
        },
      );
    }
    return list;
  }, [selfName, user?.email, user?.phone]);

  const patients = [...basePatients, ...extraPatients];

  const [done, setDone] = useState(false);
  const [patientId, setPatientId] = useState("self");
  const [attached, setAttached] = useState<AttachedReport[]>([]);
  const [skipReports, setSkipReports] = useState(false);
  const [findingIds, setFindingIds] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmation, setConfirmation] = useState<{ no: string; id: string } | null>(null);

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

  const summaryLine = `${date} · ${time} · ${tx(
    visitType === "virtual" ? "Virtual visit" : "In-clinic visit",
  )}`;

  const attachReport = (r: AttachedReport) => {
    setSkipReports(false);
    setAttached((cur) => (cur.some((x) => x.id === r.id) ? cur : [...cur, r]));
  };

  const detachReport = (id: string) => {
    setAttached((cur) => cur.filter((x) => x.id !== id));
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

  const toggleLabReport = (id: string) => {
    const existing = attached.find((a) => a.id === id);
    if (existing) {
      detachReport(id);
      return;
    }
    const r = CONNECTED_LAB_REPORTS.find((x) => x.id === id);
    if (!r) return;
    attachReport({
      id: r.id,
      title: r.title,
      detail: `${r.lab} · ${r.detail}`,
      source: "lab",
    });
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
        title: file.name,
        detail: tx("Uploaded from device"),
        source: "upload",
      });
    }
    setAttached((cur) => {
      const ids = new Set(cur.map((c) => c.id));
      return [...cur, ...next.filter((n) => !ids.has(n.id))];
    });
  };

  const addPassenger = () => {
    const name = newName.trim();
    const relation = newRelation.trim() || "Family member";
    if (!name) return;
    const id = `pass-${Date.now()}`;
    const option: PatientOption = {
      id,
      name,
      relation,
      contact: user?.phone || user?.email || "",
    };
    setExtraPatients((cur) => [...cur, option]);

    /* Persist to family prefs when possible */
    const member: FamilyMember = {
      id,
      name,
      relationship: relation,
      dob: newDob.trim(),
      linked: true,
    };
    try {
      const family = loadFamily();
      saveFamily([...family, member]);
    } catch {
      /* demo — ignore persistence errors */
    }

    setPatientId(id);
    setAddingPatient(false);
    setNewName("");
    setNewRelation("");
    setNewDob("");
  };

  const confirm = () => {
    if (!specialty || !visitType || !patient) return;
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
    });
    setConfirmation({ no: appt.confirmationNo, id: appt.id });
    setDone(true);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg">
        <header className="mb-6 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-transparent">‹</span>
          <h1 className="text-sm font-medium text-[color:var(--pp-primary-950)] sm:text-base">
            {tx("Confirmed")}
          </h1>
          <button
            type="button"
            onClick={() => nav("/appointments")}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[color:var(--state-hover)]"
            aria-label={tx("Close booking")}
          >
            ✕
          </button>
        </header>

        <div className="rounded-2xl border border-line bg-white p-6 text-center">
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Confirmed")}</p>
          <h2 className="mt-2 font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("You’re booked")}
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">
            {tx("We’ll send a reminder before your visit. Join virtual visits from Messages.")}
          </p>
          {confirmation && (
            <p className="mt-4 rounded-xl bg-[color:var(--pp-primary-100)] px-4 py-3 font-mono text-sm font-semibold text-[color:var(--pp-primary-950)]">
              {confirmation.no}
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2 rounded-2xl border border-line bg-white p-5">
          <ReviewRow k={tx("Provider")} v={provider.name} />
          <ReviewRow k={tx("Date & time")} v={summaryLine} />
          <ReviewRow k={tx("Patient")} v={`${patient.name} (${tx(patient.relation)})`} />
          {specialty && <ReviewRow k={tx("Specialisation")} v={tx(specialty.label)} />}
          <ReviewRow k={tx("Consultation")} v={formatFee(fee)} />
        </div>

        <div className="mt-8 space-y-2">
          <Button fullWidth onClick={() => nav("/appointments")}>
            {tx("View appointments")}
          </Button>
          <Button fullWidth variant="secondary" onClick={() => nav("/messages")}>
            {tx("Message care team")}
          </Button>
          <Button fullWidth variant="ghost" onClick={() => nav("/dashboard")}>
            {tx("Back to dashboard")}
          </Button>
        </div>
      </div>
    );
  }

  const reportSummary =
    skipReports || attached.length === 0
      ? tx("None attached")
      : attached.map((a) => a.title).join(", ");

  const findingsSummary =
    findingIds.length === 0
      ? tx("None selected")
      : findingIds
          .map((id) => DEMO_FINDINGS.find((f) => f.id === id)?.title)
          .filter(Boolean)
          .join(", ");

  return (
    <div>
      <header className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={close}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
        >
          ← {tx("Back")}
        </button>
        <h1 className="text-sm font-medium text-[color:var(--pp-primary-950)] sm:text-base">
          {tx("Patient details")}
        </h1>
        <button
          type="button"
          onClick={close}
          className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
          aria-label={tx("Close booking")}
        >
          ✕
        </button>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* ── Left: details ───────────────────────────────── */}
        <div className="min-w-0 space-y-8 lg:col-start-1">
          {/* Provider strip */}
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5">
            <img
              src={provider.imageUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl object-cover object-top"
            />
            <div className="min-w-0">
              <p className="font-semibold text-[color:var(--pp-primary-950)]">{provider.name}</p>
              <p className="text-sm text-ink-tertiary">
                {tx(kindLabel(provider.kind))} · {provider.city}
              </p>
              <p className="mt-0.5 text-sm text-ink-secondary">{summaryLine}</p>
            </div>
          </div>

          {/* Patients */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                  {tx("Who is this visit for?")}
                </h2>
                <p className="mt-1 text-sm text-ink-tertiary">
                  {tx("Choose a patient profile. History and reports are optional.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddingPatient((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--pp-primary-100)] px-3.5 py-2 text-sm font-semibold text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--pp-primary-200)]"
              >
                <span aria-hidden>+</span> {tx("Add passenger")}
              </button>
            </div>

            {addingPatient && (
              <div className="mt-4 space-y-3 rounded-2xl border border-line bg-white p-4 shadow-[0_8px_30px_rgba(24,7,48,0.04)]">
                <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">
                  {tx("New passenger")}
                </p>
                <Field
                  label={tx("Full name")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={tx("e.g. Jordan Lee")}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label={tx("Relationship")}
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    placeholder={tx("e.g. Parent, child")}
                  />
                  <Field
                    label={tx("Date of birth (optional)")}
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button onClick={addPassenger} disabled={!newName.trim()}>
                    {tx("Save passenger")}
                  </Button>
                  <Button variant="ghost" onClick={() => setAddingPatient(false)}>
                    {tx("Cancel")}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {patients.map((p) => {
                const on = patientId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPatientId(p.id)}
                    aria-pressed={on}
                    className={
                      "rounded-2xl border p-4 text-left transition-colors " +
                      (on
                        ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)] shadow-[0_8px_24px_rgba(24,7,48,0.06)]"
                        : "border-line bg-white hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span>
                        <span className="block font-semibold text-[color:var(--pp-primary-950)]">
                          {p.name}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-tertiary">
                          {tx(p.relation)}
                        </span>
                      </span>
                      {p.badge ? (
                        <span className="shrink-0 rounded-full bg-wellness-subtle px-2.5 py-1 text-2xs font-semibold text-wellness">
                          {tx(p.badge)}
                        </span>
                      ) : on ? (
                        <span className="text-wellness" aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Reports */}
          <section>
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Reports")}
            </h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              {tx("Attach from your library, upload a file, or browse connected labs.")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]"
              >
                <span aria-hidden>↑</span> {tx("Upload report")}
              </button>
              <button
                type="button"
                onClick={() => setBrowsingLabs((v) => !v)}
                className={
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors " +
                  (browsingLabs
                    ? "bg-[color:var(--pp-primary-950)] text-white"
                    : "border border-line bg-white text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]")
                }
              >
                <span aria-hidden>◎</span> {tx("Browse lab network")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSkipReports(true);
                  setAttached([]);
                }}
                className={
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors " +
                  (skipReports
                    ? "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
                    : "text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
                }
              >
                {tx("Continue without reports")}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.heic,image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  onUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {browsingLabs && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
                <div className="border-b border-line bg-[color:var(--pp-primary-100)] px-4 py-3">
                  <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">
                    {tx("Connected labs")}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-tertiary">
                    {tx("Results stay in-network — no local download needed.")}
                  </p>
                </div>
                <ul>
                  {CONNECTED_LAB_REPORTS.map((r, i) => {
                    const on = attached.some((a) => a.id === r.id);
                    return (
                      <li key={r.id} className={i > 0 ? "border-t border-line" : ""}>
                        <button
                          type="button"
                          onClick={() => toggleLabReport(r.id)}
                          className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
                        >
                          <span>
                            <span className="block text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
                              {r.lab}
                            </span>
                            <span className="mt-0.5 block text-sm font-semibold text-[color:var(--pp-primary-950)]">
                              {tx(r.title)}
                            </span>
                            <span className="mt-0.5 block text-xs text-ink-tertiary">
                              {tx(r.detail)}
                            </span>
                          </span>
                          <span
                            className={
                              "mt-1 shrink-0 rounded-full px-2.5 py-1 text-2xs font-semibold " +
                              (on
                                ? "bg-wellness-subtle text-wellness"
                                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
                            }
                          >
                            {on ? tx("Attached") : tx("Attach")}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                {tx("Your library")}
              </p>
              {DEMO_REPORTS.map((r) => {
                const on = attached.some((a) => a.id === r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleLibraryReport(r.id)}
                    aria-pressed={on}
                    className={
                      "flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors " +
                      (on
                        ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)]"
                        : "border-line bg-white hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    <span>
                      <span className="block text-sm font-semibold text-[color:var(--pp-primary-950)]">
                        {tx(r.title)}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-tertiary">
                        {tx(r.detail)} · {r.date}
                      </span>
                    </span>
                    <span
                      className={"mt-0.5 text-sm " + (on ? "text-wellness" : "text-ink-tertiary")}
                      aria-hidden
                    >
                      {on ? "✓" : "○"}
                    </span>
                  </button>
                );
              })}
            </div>

            {attached.some((a) => a.source === "upload") && (
              <div className="mt-3 space-y-2">
                <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                  {tx("Uploaded")}
                </p>
                {attached
                  .filter((a) => a.source === "upload")
                  .map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">
                          {a.title}
                        </p>
                        <p className="text-xs text-ink-tertiary">{tx(a.detail)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => detachReport(a.id)}
                        className="shrink-0 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
                      >
                        {tx("Remove")}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Findings */}
          <section>
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Earlier consultations")}
            </h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              {tx("Share prior findings with your clinician (optional).")}
            </p>
            <div className="mt-4 space-y-2">
              {DEMO_FINDINGS.map((f) => {
                const on = findingIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFinding(f.id)}
                    aria-pressed={on}
                    className={
                      "flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors " +
                      (on
                        ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)]"
                        : "border-line bg-white hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    <span>
                      <span className="block text-sm font-semibold text-[color:var(--pp-primary-950)]">
                        {tx(f.title)}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-tertiary">{tx(f.detail)}</span>
                    </span>
                    <span
                      className={"mt-0.5 text-sm " + (on ? "text-wellness" : "text-ink-tertiary")}
                      aria-hidden
                    >
                      {on ? "✓" : "○"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-3 pb-4">
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("History & notes")}
            </h2>
            <p className="text-sm text-ink-tertiary">
              {tx("Optional — anything that helps prepare the visit.")}
            </p>
            <Field
              label={tx("Symptoms (optional)")}
              placeholder={tx("Briefly describe what you’re experiencing…")}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
            <Field
              label={tx("Notes (optional)")}
              placeholder={tx("Anything the clinician should know…")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        {/* ── Right: live review + CTA ────────────────────── */}
        <aside className="space-y-3 lg:col-start-2 lg:row-span-1 lg:row-start-1 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">
              {tx("Review visit")}
            </p>
            <p className="mt-0.5 text-2xs text-ink-tertiary">{tx("Confirm details before booking")}</p>

            <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
              <img
                src={provider.imageUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl object-cover object-top"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">
                  {provider.name}
                </p>
                <p className="truncate text-xs text-ink-tertiary">{summaryLine}</p>
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
              <span>
                <span className="block text-2xs text-ink-tertiary">{tx("Consultation")}</span>
                <span className="font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                  {formatFee(fee)}
                </span>
              </span>
              {specialty && (
                <span className="rounded-full bg-[color:var(--pp-primary-100)] px-2.5 py-1 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                  {tx(specialty.label)}
                </span>
              )}
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-tertiary">{tx("Patient")}</dt>
                <dd className="max-w-[60%] text-right font-medium text-[color:var(--pp-primary-950)]">
                  {patient.name}
                  <span className="block text-xs font-normal text-ink-tertiary">
                    {tx(patient.badge || patient.relation)}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-tertiary">{tx("Reports")}</dt>
                <dd className="max-w-[60%] text-right font-medium text-[color:var(--pp-primary-950)]">
                  {skipReports || attached.length === 0
                    ? tx("None attached")
                    : tx("{n} attached").replace("{n}", String(attached.length))}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-tertiary">{tx("Findings")}</dt>
                <dd className="max-w-[60%] text-right font-medium text-[color:var(--pp-primary-950)]">
                  {findingIds.length === 0
                    ? tx("None selected")
                    : tx("{n} shared").replace("{n}", String(findingIds.length))}
                </dd>
              </div>
              {serviceId && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-tertiary">{tx("Service")}</dt>
                  <dd className="font-medium text-[color:var(--pp-primary-950)]">{serviceId}</dd>
                </div>
              )}
            </dl>

            {(reportSummary !== tx("None attached") || findingsSummary !== tx("None selected")) && (
              <div className="mt-4 space-y-2 border-t border-line pt-3 text-xs text-ink-tertiary">
                {reportSummary !== tx("None attached") && (
                  <p>
                    <span className="font-semibold text-[color:var(--pp-primary-950)]">
                      {tx("Reports")}:
                    </span>{" "}
                    {reportSummary}
                  </p>
                )}
                {findingsSummary !== tx("None selected") && (
                  <p>
                    <span className="font-semibold text-[color:var(--pp-primary-950)]">
                      {tx("Findings")}:
                    </span>{" "}
                    {findingsSummary}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 space-y-2">
              <Button fullWidth onClick={confirm} disabled={!patient}>
                {tx("Confirm appointment")}
              </Button>
              <Button fullWidth variant="secondary" onClick={() => nav("/messages")}>
                {tx("Message care team")}
              </Button>
            </div>
          </div>
          <p className="px-1 text-center text-2xs leading-relaxed text-ink-tertiary">
            {tx("Demo booking — no real visit is scheduled with a clinic.")}
          </p>
        </aside>
      </div>
    </div>
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

function ReviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-ink-tertiary">{k}</span>
      <span className="text-right text-sm font-medium text-[color:var(--pp-primary-950)]">{v}</span>
    </div>
  );
}
