/**
 * Per-patient reports and past consults.
 * Creates a local patient records database on first read if it does not exist.
 * Each patientId maps to their own files — never shared across family members.
 */
import { loadFamily } from "@/lib/accountPrefs";
import { todayIso } from "@/lib/timeSlots";

const DB_KEY = "pp.patientRecords.v1";
const IMG_KEY = "pp.patientRecordImages.v1";
const EVENT = "pp-patient-records";

export type PatientFileSource = "library" | "upload";
export type PatientFileKind = "report" | "prescription";

export type PatientFile = {
  id: string;
  patientId: string;
  title: string;
  detail: string;
  date: string;
  source: PatientFileSource;
  kind?: PatientFileKind;
  fileName?: string;
};

export type PatientConsult = {
  id: string;
  patientId: string;
  title: string;
  detail: string;
  date: string;
};

export type PatientFolder = {
  patientId: string;
  name: string;
  relation: string;
  reports: PatientFile[];
  consults: PatientConsult[];
};

type PatientDb = {
  v: 1;
  folders: Record<string, PatientFolder>;
};

function emptyDb(): PatientDb {
  return { v: 1, folders: {} };
}

function readDb(): PatientDb | null {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PatientDb;
    if (!parsed || parsed.v !== 1 || !parsed.folders || typeof parsed.folders !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDb(db: PatientDb) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* demo — ignore quota */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribePatientRecords(cb: () => void) {
  const on = () => cb();
  window.addEventListener(EVENT, on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener(EVENT, on);
    window.removeEventListener("storage", on);
  };
}

function readImages(): Record<string, string> {
  try {
    const raw = localStorage.getItem(IMG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeImage(id: string, dataUrl: string | undefined, replace = false) {
  if (!dataUrl) return;
  const all = readImages();
  if (all[id] && !replace) return;
  all[id] = dataUrl;
  try {
    localStorage.setItem(IMG_KEY, JSON.stringify(all));
  } catch {
    try {
      localStorage.setItem(IMG_KEY, JSON.stringify({ [id]: dataUrl }));
    } catch {
      /* quota */
    }
  }
}

function dropImage(id: string) {
  const all = readImages();
  if (!(id in all)) return;
  delete all[id];
  try {
    localStorage.setItem(IMG_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function getPatientFilePreview(id: string): string | undefined {
  return readImages()[id] || libraryPreviewSrc(id);
}

const LIBRARY_PREVIEWS: Record<string, string> = {
  "rep-blood": "/img/reports/bloodwork.png",
  "rep-rx": "/img/reports/medications.png",
  "rep-img": "/img/reports/chest-xray.png",
  "rep-allergy": "/img/reports/allergy.png",
  blood: "/img/reports/bloodwork.png",
  rx: "/img/reports/medications.png",
  img: "/img/reports/chest-xray.png",
  allergy: "/img/reports/allergy.png",
  prenatal: "/img/reports/bloodwork.png",
  pap: "/img/reports/bloodwork.png",
  thyroid: "/img/reports/bloodwork.png",
  iron: "/img/reports/bloodwork.png",
  lipid: "/img/reports/bloodwork.png",
  vaccines: "/img/reports/allergy.png",
  growth: "/img/reports/allergy.png",
  hearing: "/img/reports/chest-xray.png",
  ecg: "/img/reports/chest-xray.png",
  bone: "/img/reports/chest-xray.png",
  summary: "/img/reports/allergy.png",
};

function libraryPreviewSrc(id: string): string | undefined {
  if (LIBRARY_PREVIEWS[id]) return LIBRARY_PREVIEWS[id];
  const slug = id.includes("::rep-") ? id.split("::rep-")[1] : id.replace(/^rep-/, "");
  return slug ? LIBRARY_PREVIEWS[slug] : undefined;
}

export function downloadPatientFile(file: PatientFile): boolean {
  const src = getPatientFilePreview(file.id);
  if (!src || typeof document === "undefined") return false;
  const fromData = src.startsWith("data:");
  const mime = fromData ? src.slice(5, src.indexOf(";")) : "";
  const ext =
    mime === "image/png" || src.endsWith(".png")
      ? "png"
      : mime === "image/webp" || src.endsWith(".webp")
        ? "webp"
        : mime === "application/pdf" || src.endsWith(".pdf")
          ? "pdf"
          : "jpg";
  const name = file.fileName || `${file.title.replace(/[^\w.-]+/g, "-") || "report"}.${ext}`;
  const a = document.createElement("a");
  a.href = src;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}

function relationKind(patientId: string, relation: string): "self" | "spouse" | "child" | "parent" | "other" {
  if (patientId === "self") return "self";
  if (patientId === "demo-partner") return "spouse";
  if (patientId === "demo-child") return "child";
  const r = relation.toLowerCase();
  if (/\b(spouse|partner|wife|husband)\b/.test(r)) return "spouse";
  if (/\b(child|son|daughter|kid)\b/.test(r)) return "child";
  if (/\b(parent|mother|father|mom|dad)\b/.test(r)) return "parent";
  return "other";
}

function file(
  patientId: string,
  slug: string,
  title: string,
  detail: string,
  date: string,
): PatientFile {
  return { id: `${patientId}::rep-${slug}`, patientId, title, detail, date, source: "library" };
}

function consult(
  patientId: string,
  slug: string,
  title: string,
  detail: string,
  date: string,
): PatientConsult {
  return { id: `${patientId}::find-${slug}`, patientId, title, detail, date };
}

function seedCatalog(patientId: string, name: string, relation: string): { reports: PatientFile[]; consults: PatientConsult[] } {
  const kind = relationKind(patientId, relation);
  const who = name.trim() || "Patient";

  if (kind === "self") {
    return {
      reports: [
        { id: "rep-blood", patientId, title: "Bloodwork — Feb 2026", detail: "CBC, lipid panel, A1C", date: "2026-02-12", source: "library" },
        { id: "rep-rx", patientId, title: "Current medications list", detail: "Pharmacy summary PDF", date: "2026-03-01", source: "library" },
        { id: "rep-img", patientId, title: "Chest X-ray report", detail: "Imaging · Sunnybrook", date: "2025-11-18", source: "library" },
        { id: "rep-allergy", patientId, title: "Allergy & conditions summary", detail: "Profile health record", date: "2026-01-05", source: "library" },
      ],
      consults: [
        { id: "find-1", patientId, title: "Follow-up: blood pressure plan", detail: "Dr. Shah · Mar 2026 — continue current dose, recheck in 6 weeks.", date: "2026-03-10" },
        { id: "find-2", patientId, title: "Skin consult notes", detail: "Dr. Okafor · Jan 2026 — mild eczema; topical trial.", date: "2026-01-22" },
        { id: "find-3", patientId, title: "Mental health check-in", detail: "Dr. Chen · Dec 2025 — sleep improved; continue therapy plan.", date: "2025-12-08" },
      ],
    };
  }

  if (kind === "spouse") {
    return {
      reports: [
        file(patientId, "prenatal", "Prenatal labs — Mar 2026", "CBC, ferritin, TSH", "2026-03-04"),
        file(patientId, "pap", "Pap smear", "Routine cervical screening", "2026-01-16"),
        file(patientId, "thyroid", "Thyroid panel", "TSH, free T4", "2026-02-20"),
        file(patientId, "iron", "Iron studies", "Ferritin follow-up", "2026-04-02"),
      ],
      consults: [
        consult(patientId, "ob", "OB follow-up", "Dr. Patel · Mar 2026 — pregnancy check, next scan booked.", "2026-03-12"),
        consult(patientId, "nutrition", "Nutrition consult", "Dietitian · Feb 2026 — iron-rich meal plan.", "2026-02-18"),
        consult(patientId, "sleep", "Sleep check-in", "Dr. Chen · Jan 2026 — short-term insomnia; sleep hygiene.", "2026-01-28"),
      ],
    };
  }

  if (kind === "child") {
    return {
      reports: [
        file(patientId, "vaccines", "Immunization record", "Public health booklet", "2026-01-10"),
        file(patientId, "growth", "Growth chart", "Height and weight percentiles", "2026-03-22"),
        file(patientId, "hearing", "Hearing screen", "School / well-child screen", "2025-11-04"),
      ],
      consults: [
        consult(patientId, "well", "Well-child visit", "Dr. Singh · Mar 2026 — development on track.", "2026-03-22"),
        consult(patientId, "ear", "Ear infection notes", "Dr. Singh · Dec 2025 — otitis media; completed antibiotics.", "2025-12-14"),
      ],
    };
  }

  if (kind === "parent") {
    return {
      reports: [
        file(patientId, "ecg", "ECG report", "Resting 12-lead", "2026-02-08"),
        file(patientId, "lipid", "Lipid panel", "Cholesterol follow-up", "2026-01-19"),
        file(patientId, "bone", "Bone density", "DEXA summary", "2025-10-30"),
      ],
      consults: [
        consult(patientId, "cardio", "Cardiology follow-up", "Dr. Shah · Feb 2026 — BP stable on current dose.", "2026-02-08"),
        consult(patientId, "physical", "Annual physical", "Dr. Okafor · Nov 2025 — labs reviewed.", "2025-11-12"),
      ],
    };
  }

  return {
    reports: [
      file(patientId, "summary", `${who} — health summary`, "Profile health record", todayIso()),
    ],
    consults: [],
  };
}

function createFolder(patientId: string, meta?: { name?: string; relation?: string }): PatientFolder {
  const name = meta?.name?.trim() || (patientId === "self" ? "Primary" : "Family member");
  const relation = meta?.relation?.trim() || (patientId === "self" ? "Myself" : "Family member");
  const seeded = seedCatalog(patientId, name, relation);
  return { patientId, name, relation, reports: seeded.reports, consults: seeded.consults };
}

/** Create the patient records database if missing, and seed known family members. */
export function ensurePatientDb(): PatientDb {
  let db = readDb();
  let dirty = false;
  if (!db) {
    db = emptyDb();
    dirty = true;
  }
  const known: { id: string; name: string; relation: string }[] = [
    { id: "self", name: "Primary", relation: "Myself" },
    { id: "demo-partner", name: "Alex Rivera", relation: "Spouse" },
    { id: "demo-child", name: "Sam Rivera", relation: "Child" },
  ];
  try {
    for (const m of loadFamily()) {
      known.push({ id: m.id, name: m.name, relation: m.relationship || "Family member" });
    }
  } catch {
    /* ignore */
  }

  for (const p of known) {
    if (!db.folders[p.id]) {
      db.folders[p.id] = createFolder(p.id, p);
      dirty = true;
    }
  }

  if (dirty) writeDb(db);
  return db;
}

/** Load or create this patient's folder, mapped to their id. */
export function ensurePatientFolder(patientId: string, meta?: { name?: string; relation?: string }): PatientFolder {
  const db = ensurePatientDb();
  const existing = db.folders[patientId];
  if (existing) {
    let changed = false;
    if (meta?.name?.trim() && existing.name !== meta.name.trim()) {
      existing.name = meta.name.trim();
      changed = true;
    }
    if (meta?.relation?.trim() && existing.relation !== meta.relation.trim() && existing.consults.length + existing.reports.length === 0) {
      existing.relation = meta.relation.trim();
      changed = true;
    }
    if (changed) writeDb(db);
    return existing;
  }
  const folder = createFolder(patientId, meta);
  db.folders[patientId] = folder;
  writeDb(db);
  return folder;
}

export function getPatientLibrary(patientId: string, meta?: { name?: string; relation?: string }): {
  reports: PatientFile[];
  uploads: PatientFile[];
  consults: PatientConsult[];
} {
  const folder = ensurePatientFolder(patientId, meta);
  return {
    reports: folder.reports.filter((r) => r.source !== "upload"),
    uploads: folder.reports.filter((r) => r.source === "upload"),
    consults: folder.consults,
  };
}

export function addPatientUpload(
  patientId: string,
  input: { id: string; title: string; detail: string },
): PatientFile {
  const db = ensurePatientDb();
  const folder = ensurePatientFolder(patientId);
  const row: PatientFile = {
    id: input.id,
    patientId,
    title: input.title,
    detail: input.detail,
    date: todayIso(),
    source: "upload",
  };
  if (!folder.reports.some((r) => r.id === row.id)) {
    folder.reports.push(row);
    db.folders[patientId] = folder;
    writeDb(db);
  }
  return row;
}

/** Save a scanned prescription photo as a dated report on this patient's folder. */
export function addPrescriptionReport(
  patientId: string,
  input: { fileName: string; previewDataUrl?: string; medicines: string[]; replacePreview?: boolean },
): PatientFile {
  const db = ensurePatientDb();
  const folder = ensurePatientFolder(patientId);
  const date = todayIso();
  const slug = input.fileName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "rx";
  const id = `rx-${patientId}-${date}-${slug}`;
  const names = input.medicines.map((n) => n.trim()).filter(Boolean);
  const detail = names.length ? names.slice(0, 6).join(" · ") : input.fileName;
  const row: PatientFile = {
    id,
    patientId,
    title: `Prescription — ${date}`,
    detail,
    date,
    source: "upload",
    kind: "prescription",
    fileName: input.fileName,
  };
  const i = folder.reports.findIndex((r) => r.id === id);
  if (i >= 0) folder.reports[i] = row;
  else folder.reports.unshift(row);
  db.folders[patientId] = folder;
  writeImage(id, input.previewDataUrl, Boolean(input.replacePreview));
  writeDb(db);
  return row;
}

export function listPrescriptionReports(patientId: string): PatientFile[] {
  return getPatientLibrary(patientId).uploads.filter((r) => r.kind === "prescription");
}

export function listProfileDocuments(patientId: string): PatientFile[] {
  const lib = getPatientLibrary(patientId);
  return [...lib.uploads, ...lib.reports].sort((a, b) => {
    const ap = a.kind === "prescription" ? 0 : 1;
    const bp = b.kind === "prescription" ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return b.date.localeCompare(a.date);
  });
}

export function deletePatientFile(patientId: string, id: string) {
  const db = ensurePatientDb();
  const folder = db.folders[patientId];
  if (!folder) return;
  folder.reports = folder.reports.filter((r) => r.id !== id);
  db.folders[patientId] = folder;
  writeDb(db);
  dropImage(id);
}

export function findPatientReport(id: string): PatientFile | undefined {
  const db = ensurePatientDb();
  for (const folder of Object.values(db.folders)) {
    const hit = folder.reports.find((r) => r.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function findPatientConsult(id: string): PatientConsult | undefined {
  const db = ensurePatientDb();
  for (const folder of Object.values(db.folders)) {
    const hit = folder.consults.find((c) => c.id === id);
    if (hit) return hit;
  }
  return undefined;
}
