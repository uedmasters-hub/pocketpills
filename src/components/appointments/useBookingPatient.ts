import { useMemo, useRef, useState } from "react";
import { loadFamily, saveFamily } from "@/lib/accountPrefs";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import {
  addPatientUpload,
  deletePatientFile,
  ensurePatientDb,
  ensurePatientFolder,
  getPatientLibrary,
} from "@/lib/patientRecords";
import type { VisitTab } from "@/components/appointments/BookingFieldsDraft";

export type BookingPatientOption = {
  id: string;
  name: string;
  relation: string;
  badge?: string;
  contact: string;
};

export type BookingAttached = {
  id: string;
  title: string;
  detail: string;
  source: "library" | "upload" | "lab";
};

type PatientShare = {
  attached: BookingAttached[];
  findingIds: string[];
};

export function useBookingPatient() {
  const { tx } = useI18n();
  const { user } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const contact = user?.phone || user?.email || "";
  const selfName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || tx("You");

  const [otherPatients, setOtherPatients] = useState<BookingPatientOption[]>(() => seedOtherPatients(contact));
  const [visitTab, setVisitTab] = useState<VisitTab>("saved");
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newDob, setNewDob] = useState("");
  const [dobError, setDobError] = useState("");
  const [patientId, setPatientId] = useState("self");
  const [shareByPatient, setShareByPatient] = useState<Record<string, PatientShare>>({});
  const [recordsRev, setRecordsRev] = useState(0);
  const [skipReports, setSkipReports] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");

  const patients: BookingPatientOption[] = useMemo(
    () => [
      { id: "self", name: selfName, relation: "Myself", badge: "Self", contact },
      ...otherPatients,
    ],
    [otherPatients, selfName, contact],
  );

  const patient = patients.find((p) => p.id === patientId) ?? patients[0];
  const library = useMemo(() => {
    ensurePatientDb();
    return getPatientLibrary(patientId, { name: patient?.name, relation: patient?.relation });
  }, [patientId, patient?.name, patient?.relation, recordsRev]);
  const share = shareByPatient[patientId] ?? { attached: [], findingIds: [] };
  const attached = share.attached;
  const findingIds = share.findingIds;
  const uploads = library.uploads;

  const patchShare = (id: string, patch: Partial<PatientShare>) => {
    setShareByPatient((cur) => {
      const prev = cur[id] ?? { attached: [], findingIds: [] };
      return { ...cur, [id]: { ...prev, ...patch } };
    });
  };

  const attachReport = (r: BookingAttached) => {
    setSkipReports(false);
    setShareByPatient((cur) => {
      const prev = cur[patientId] ?? { attached: [], findingIds: [] };
      if (prev.attached.some((x) => x.id === r.id)) return cur;
      return { ...cur, [patientId]: { ...prev, attached: [...prev.attached, r] } };
    });
  };

  const detachReport = (id: string) => {
    setShareByPatient((cur) => {
      const prev = cur[patientId] ?? { attached: [], findingIds: [] };
      return { ...cur, [patientId]: { ...prev, attached: prev.attached.filter((x) => x.id !== id) } };
    });
  };

  const deleteUpload = (id: string) => {
    deletePatientFile(patientId, id);
    setRecordsRev((n) => n + 1);
    detachReport(id);
  };

  const toggleUpload = (id: string) => {
    const existing = attached.find((a) => a.id === id);
    if (existing) {
      detachReport(id);
      return;
    }
    const file = uploads.find((u) => u.id === id);
    if (file) attachReport({ id: file.id, title: file.title, detail: file.detail, source: "upload" });
  };

  const toggleLibraryReport = (id: string) => {
    const existing = attached.find((a) => a.id === id);
    if (existing) {
      detachReport(id);
      return;
    }
    const r = library.reports.find((x) => x.id === id);
    if (!r) return;
    attachReport({ id: r.id, title: r.title, detail: r.detail, source: "library" });
  };

  const toggleFinding = (id: string) => {
    setShareByPatient((cur) => {
      const prev = cur[patientId] ?? { attached: [], findingIds: [] };
      const nextIds = prev.findingIds.includes(id)
        ? prev.findingIds.filter((x) => x !== id)
        : [...prev.findingIds, id];
      return { ...cur, [patientId]: { ...prev, findingIds: nextIds } };
    });
  };

  const onUpload = (files: FileList | null) => {
    if (!files?.length) return;
    setSkipReports(false);
    const next: BookingAttached[] = [];
    for (const file of Array.from(files)) {
      const row = addPatientUpload(patientId, {
        id: `upload-${patientId}-${file.name}-${file.size}`,
        title: file.name.trim() || tx("Untitled upload"),
        detail: tx("Uploaded from device"),
      });
      next.push({ id: row.id, title: row.title, detail: row.detail, source: "upload" });
    }
    setRecordsRev((n) => n + 1);
    setShareByPatient((cur) => {
      const prev = cur[patientId] ?? { attached: [], findingIds: [] };
      const ids = new Set(prev.attached.map((c) => c.id));
      return {
        ...cur,
        [patientId]: { ...prev, attached: [...prev.attached, ...next.filter((n) => !ids.has(n.id))] },
      };
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
    ensurePatientFolder(id, { name, relation });
    setOtherPatients((cur) => {
      const next = [...cur, { id, name, relation, contact }];
      persistOtherPatients(next);
      return next;
    });
    setPatientId(id);
    setVisitTab("saved");
    setNewName("");
    setNewRelation("");
    setNewDob("");
    setDobError("");
  };

  const whoPanel = {
    tab: visitTab,
    onTab: (id: VisitTab) => {
      setVisitTab(id);
      if (id !== "new") {
        setNewName("");
        setNewRelation("");
        setNewDob("");
        setDobError("");
      }
    },
    patients,
    patientId,
    onSelect: setPatientId,
    newName,
    newRelation,
    newDob,
    dobError,
    onNewName: setNewName,
    onNewRelation: setNewRelation,
    onNewDob: (v: string) => {
      setNewDob(v);
      setDobError("");
    },
    onSavePatient: addPassenger,
    reports: library.reports,
    uploads,
    attachedIds: attached.map((a) => a.id),
    onToggleLibrary: toggleLibraryReport,
    onToggleUpload: toggleUpload,
    onDeleteUpload: deleteUpload,
    onUpload: () => fileRef.current?.click(),
    findings: library.consults,
    findingIds,
    onToggleFinding: toggleFinding,
  };

  return {
    fileRef,
    onUpload,
    visitTab,
    patient,
    patientId,
    library,
    attached,
    findingIds,
    skipReports,
    symptoms,
    setSymptoms,
    notes,
    setNotes,
    detachReport,
    patchShare,
    whoPanel,
  };
}

function seedOtherPatients(contact: string): BookingPatientOption[] {
  ensurePatientDb();
  const family = loadFamily();
  if (family.length > 0) {
    return family.map((m) => {
      ensurePatientFolder(m.id, { name: m.name, relation: m.relationship || "Family member" });
      return {
        id: m.id,
        name: m.name,
        relation: m.relationship || "Family member",
        contact,
      };
    });
  }
  ensurePatientFolder("demo-partner", { name: "Alex Rivera", relation: "Spouse" });
  ensurePatientFolder("demo-child", { name: "Sam Rivera", relation: "Child" });
  return [
    { id: "demo-partner", name: "Alex Rivera", relation: "Spouse", contact },
    { id: "demo-child", name: "Sam Rivera", relation: "Child", contact },
  ];
}

function persistOtherPatients(list: BookingPatientOption[]) {
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
