/** Hospital operations board — patients, doctors, and departments (persisted per org). */

import { useEffect, useState } from "react";
import { listStaff } from "@/lib/hospitalStaff";

export type DraftPatientStatus = "active" | "upcoming" | "completed" | "denied" | "cancelled";
export type DraftApproval = "pending" | "visit" | "consultant" | "denied";
export type DraftVisitType = "clinic" | "virtual";
export type DraftCancelSource = "denied" | "cancelled";
export type DraftCancelOutcome = "open" | "rescheduled" | "refunded" | "walked_in";
export type DraftCancelCase = "reschedule" | "refund" | "walked_in";

export type DraftCancellation = {
  source: DraftCancelSource;
  reason: string;
  openedAt: string;
  outcome: DraftCancelOutcome;
  resolvedAt?: string;
  note?: string;
  refundAmount?: number;
};

export type DraftPatientFile = {
  id: string;
  title: string;
  detail: string;
  date?: string;
  previewSrc?: string;
};

export type DraftHospitalPatient = {
  id: string;
  name: string;
  age: number;
  status: DraftPatientStatus;
  reason: string;
  duration: string;
  doctor: string;
  date: string;
  department: string;
  visitType: DraftVisitType;
  fee: number;
  symptoms: string;
  approval: DraftApproval;
  denyNote: string;
  cancellation?: DraftCancellation;
  reports: DraftPatientFile[];
  findings: DraftPatientFile[];
  consults: DraftPatientFile[];
};

export const PATIENT_STATUS: Record<DraftPatientStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-[color:var(--pp-primary-100)] text-ink-tertiary" },
  active: { label: "Active", className: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]" },
  upcoming: { label: "Upcoming", className: "bg-[color:var(--pp-primary-200)] text-[color:var(--pp-violet)]" },
  denied: { label: "Denied", className: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-violet)]" },
  cancelled: { label: "Cancelled", className: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-violet)]" },
};

export const CANCEL_CASES: {
  id: DraftCancelCase;
  title: string;
  blurb: string;
  examples: string[];
}[] = [
  {
    id: "reschedule",
    title: "Schedule for another day",
    blurb: "Move this visit to an open slot. The patient keeps the booking.",
    examples: [
      "Doctor ran late and the patient can come tomorrow morning.",
      "MRI slot denied for missing labs — rebook after creatinine is ready.",
      "Patient asked to change from this afternoon to next week.",
    ],
  },
  {
    id: "refund",
    title: "Initiate refund",
    blurb: "Return the fee and close the online booking.",
    examples: [
      "Visit cannot go ahead and no new slot is needed.",
      "Duplicate online booking — patient already paid elsewhere.",
      "Facility cancelled capacity and patient does not want to rebook.",
    ],
  },
  {
    id: "walked_in",
    title: "Mark as completed",
    blurb: "The patient already visited in person. Close the unused online booking as completed.",
    examples: [
      "Walk-in was seen at reception; cancel the leftover online slot.",
      "Ward admitted the patient directly; online consult is no longer needed.",
      "Patient finished the visit physically and only needs the online booking closed.",
    ],
  },
];

export const DRAFT_DOCTOR_META: Record<string, { credentials: string }> = {
  "Dr. Priya Nair": { credentials: "Family medicine · MD" },
  "Dr. Marcus Lee": { credentials: "Cardiology · MD" },
  "Dr. Sita Gurung": { credentials: "Radiology · MD" },
  "Dr. Raj Bhandari": { credentials: "Internal medicine · MD" },
  "Dr. Anjali Shrestha": { credentials: "Paediatrics · MD" },
  "Dr. Kenji Watanabe": { credentials: "Orthopaedics · MD" },
  "Dr. Maya Thapa": { credentials: "Obstetrics · MD" },
  "Dr. Farhan Siddiqui": { credentials: "Neurology · MD" },
};

const IMG = {
  blood: "/img/reports/bloodwork.png",
  rx: "/img/reports/medications.png",
  xray: "/img/reports/chest-xray.png",
  allergy: "/img/reports/allergy.png",
};

function file(id: string, title: string, detail: string, extra?: { date?: string; previewSrc?: string }): DraftPatientFile {
  return { id, title, detail, ...extra };
}

export type DeptTab = "inpatient" | "labs" | "diagnostics" | "surgery";

export type DeptRow = {
  id: string;
  label: string;
  used: number;
  cap: number;
};

export type DeptLoadLevel = "stable" | "moderate" | "full";

export const DRAFT_TODAY = "2026-08-27";

type PatientSeed = Pick<
  DraftHospitalPatient,
  "id" | "name" | "age" | "status" | "reason" | "duration" | "doctor" | "date" | "department"
> &
  Partial<
    Pick<
      DraftHospitalPatient,
      "visitType" | "fee" | "symptoms" | "approval" | "denyNote" | "cancellation" | "reports" | "findings" | "consults"
    >
  >;

const PATIENT_SEEDS: PatientSeed[] = [
  {
    id: "p1",
    name: "Abbela Nane",
    age: 26,
    status: "completed",
    reason: "General check-up",
    duration: "12:30 – 1:20 PM",
    doctor: "Dr. Priya Nair",
    date: "2026-08-27",
    department: "In-patient",
    fee: 80,
    approval: "visit",
    symptoms: "Tired for two weeks and wanted a general check-up before travel.",
    reports: [
      file("p1-blood", "Bloodwork — Feb 2026", "CBC, lipid panel, A1C", { date: "2026-02-12", previewSrc: IMG.blood }),
      file("p1-rx", "Prescription — ferrous sulfate", "Once daily · 4 weeks", { date: "2026-08-27", previewSrc: IMG.rx }),
    ],
    findings: [],
    consults: [
      file("p1-c1", "Follow-up: fatigue plan", "Dr. Priya Nair · Mar 2026 — rest, iron-rich meals, recheck if it lasts.", {
        date: "2026-03-10",
      }),
    ],
  },
  {
    id: "p2",
    name: "Ravi Shrestha",
    age: 41,
    status: "active",
    reason: "Cardiology consult",
    duration: "1:00 – 1:40 PM",
    doctor: "Dr. Marcus Lee",
    date: "2026-08-27",
    department: "Diagnostics",
    fee: 120,
    approval: "visit",
    symptoms: "Chest tightness after walking uphill. Father had a heart attack at 55.",
    reports: [
      file("p2-ecg", "ECG report", "Resting 12-lead", { date: "2026-08-20", previewSrc: IMG.xray }),
      file("p2-lipid", "Lipid panel", "Cholesterol follow-up", { date: "2026-08-18", previewSrc: IMG.blood }),
    ],
    findings: [file("p2-f1", "Elevated resting heart rate", "Noted on walk-in triage this morning.")],
    consults: [
      file("p2-c1", "GP referral notes", "Dr. Priya Nair · Aug 2026 — refer to cardiology for exertional tightness.", {
        date: "2026-08-19",
      }),
    ],
  },
  {
    id: "p3",
    name: "Maya Tamang",
    age: 33,
    status: "upcoming",
    reason: "Maternity review",
    duration: "2:00 – 2:30 PM",
    doctor: "Dr. Priya Nair",
    date: "2026-08-27",
    department: "In-patient",
    fee: 90,
    symptoms: "Mild swelling in the ankles this week. 28 weeks, first pregnancy.",
    reports: [
      file("p3-prenatal", "Prenatal labs — Aug 2026", "CBC, ferritin, TSH", { date: "2026-08-12", previewSrc: IMG.blood }),
    ],
    consults: [
      file("p3-c1", "OB follow-up", "Dr. Priya Nair · Aug 2026 — pregnancy check, next scan booked.", { date: "2026-08-12" }),
    ],
  },
  {
    id: "p4",
    name: "Jordan Blake",
    age: 52,
    status: "upcoming",
    reason: "CT scan",
    duration: "2:15 – 2:45 PM",
    doctor: "Dr. Sita Gurung",
    date: "2026-08-27",
    department: "Labs",
    fee: 180,
    symptoms: "Persistent cough for three weeks. GP asked for a chest CT.",
    reports: [
      file("p4-xray", "Chest X-ray report", "Imaging · Aug 2026", { date: "2026-08-21", previewSrc: IMG.xray }),
    ],
    consults: [
      file("p4-c1", "GP consult notes", "Dr. Raj Bhandari · Aug 2026 — cough not settling; imaging next.", {
        date: "2026-08-21",
      }),
    ],
  },
  {
    id: "p5",
    name: "Samira Patel",
    age: 29,
    status: "active",
    reason: "Endoscopy",
    duration: "1:20 – 2:10 PM",
    doctor: "Dr. Raj Bhandari",
    date: "2026-08-27",
    department: "Labs",
    fee: 220,
    approval: "consultant",
    symptoms: "Burning in the upper abdomen after meals. Tried antacids with little relief.",
    reports: [
      file("p5-blood", "Bloodwork — Aug 2026", "CBC, H. pylori antibody", { date: "2026-08-15", previewSrc: IMG.blood }),
    ],
    findings: [file("p5-f1", "Suspected gastritis", "From the referring clinic note.")],
    consults: [
      file("p5-c1", "GI clinic notes", "Dr. Raj Bhandari · Jul 2026 — trial PPI, book endoscopy if no change.", {
        date: "2026-07-22",
      }),
    ],
  },
  {
    id: "p6",
    name: "Chris Nguyen",
    age: 67,
    status: "completed",
    reason: "X-ray review",
    duration: "11:00 – 11:30 AM",
    doctor: "Dr. Marcus Lee",
    date: "2026-08-27",
    department: "Labs",
    fee: 70,
    approval: "visit",
    symptoms: "Follow-up on last month’s chest film. No new cough.",
    reports: [file("p6-xray", "Chest X-ray report", "Imaging · Jul 2026", { date: "2026-07-18", previewSrc: IMG.xray })],
    consults: [
      file("p6-c1", "Cardiology follow-up", "Dr. Marcus Lee · Jul 2026 — film reviewed, return if breathless.", {
        date: "2026-07-20",
      }),
    ],
  },
  {
    id: "p7",
    name: "Anisha Karki",
    age: 8,
    status: "upcoming",
    reason: "Paediatric review",
    duration: "3:00 – 3:30 PM",
    doctor: "Dr. Priya Nair",
    date: "2026-08-27",
    department: "In-patient",
    fee: 60,
    symptoms: "Ear pain on the right side since yesterday. Low fever last night.",
    reports: [
      file("p7-vax", "Immunization record", "Public health booklet", { date: "2026-01-10", previewSrc: IMG.allergy }),
    ],
    consults: [
      file("p7-c1", "Well-child visit", "Dr. Priya Nair · Mar 2026 — development on track.", { date: "2026-03-22" }),
    ],
  },
  {
    id: "p8",
    name: "Hari Magar",
    age: 58,
    status: "active",
    reason: "ICU follow-up",
    duration: "12:50 – 1:25 PM",
    doctor: "Dr. Raj Bhandari",
    date: "2026-08-27",
    department: "In-patient",
    fee: 0,
    visitType: "clinic",
    approval: "visit",
    symptoms: "Step-down from ICU. Family wants an update on the breathing plan.",
    reports: [
      file("p8-xray", "Chest X-ray report", "This admission", { date: "2026-08-26", previewSrc: IMG.xray }),
      file("p8-rx", "Current medications list", "Ward pharmacy summary", { date: "2026-08-26", previewSrc: IMG.rx }),
    ],
    findings: [file("p8-f1", "Oxygen wean in progress", "2 L nasal cannula this morning.")],
    consults: [
      file("p8-c1", "ICU daily note", "Dr. Raj Bhandari · Aug 2026 — stable, plan ward transfer.", { date: "2026-08-26" }),
    ],
  },
  {
    id: "p9",
    name: "Lila Basnet",
    age: 45,
    status: "denied",
    reason: "MRI",
    duration: "4:00 – 4:45 PM",
    doctor: "Dr. Sita Gurung",
    date: "2026-08-27",
    department: "Labs",
    fee: 250,
    approval: "denied",
    denyNote: "Need a recent creatinine result and a completed MRI safety form before we can book the magnet.",
    cancellation: {
      source: "denied",
      reason: "Need a recent creatinine result and a completed MRI safety form before we can book the magnet.",
      openedAt: "2026-08-27T08:10:00",
      outcome: "open",
    },
    symptoms: "Low back pain radiating to the left leg for six weeks.",
    reports: [],
    consults: [
      file("p9-c1", "Ortho notes", "Dr. Marcus Lee · Aug 2026 — trial physio, MRI if no change.", { date: "2026-08-08" }),
    ],
  },
  {
    id: "p10",
    name: "Riley Okonkwo",
    age: 36,
    status: "completed",
    reason: "Blood test review",
    duration: "10:15 – 10:45 AM",
    doctor: "Dr. Priya Nair",
    date: "2026-08-26",
    department: "Labs",
    fee: 55,
    approval: "visit",
    visitType: "virtual",
    symptoms: "Wants to go over last week’s labs. No new symptoms.",
    reports: [file("p10-blood", "Bloodwork — Aug 2026", "CBC, TSH", { date: "2026-08-20", previewSrc: IMG.blood })],
    consults: [
      file("p10-c1", "Virtual check-in", "Dr. Priya Nair · Jun 2026 — labs ordered for fatigue.", { date: "2026-06-14" }),
    ],
  },
  {
    id: "p11",
    name: "Nabin Adhikari",
    age: 61,
    status: "upcoming",
    reason: "Post-op check",
    duration: "3:30 – 4:00 PM",
    doctor: "Dr. Marcus Lee",
    date: "2026-08-27",
    department: "Surgery",
    fee: 100,
    symptoms: "Wound looks a little red. No fever. Surgery was ten days ago.",
    reports: [
      file("p11-op", "Operative summary", "Day surgery · Aug 2026", { date: "2026-08-17", previewSrc: IMG.allergy }),
    ],
    consults: [
      file("p11-c1", "Pre-op consult", "Dr. Marcus Lee · Aug 2026 — consent and plan reviewed.", { date: "2026-08-10" }),
    ],
  },
  {
    id: "p12",
    name: "Suman Rai",
    age: 22,
    status: "active",
    reason: "Emergency consult",
    duration: "1:10 – 1:50 PM",
    doctor: "Dr. Raj Bhandari",
    date: "2026-08-27",
    department: "In-patient",
    fee: 0,
    approval: "visit",
    symptoms: "Sudden abdominal pain since this morning. No vomiting yet.",
    reports: [],
    findings: [file("p12-f1", "Tender right lower quadrant", "Triage note.")],
    consults: [],
  },
  {
    id: "p13",
    name: "Priya Maharjan",
    age: 39,
    status: "upcoming",
    reason: "Ultrasound",
    duration: "5:00 – 5:30 PM",
    doctor: "Dr. Sita Gurung",
    date: "2026-08-28",
    department: "Diagnostics",
    fee: 95,
    visitType: "clinic",
    symptoms: "Pelvic pain on the left side for four days. Period is late.",
    reports: [],
    consults: [
      file("p13-c1", "GP visit", "Dr. Priya Nair · Aug 2026 — book pelvic ultrasound.", { date: "2026-08-25" }),
    ],
  },
  {
    id: "p14",
    name: "Deepak Thapa",
    age: 49,
    status: "completed",
    reason: "Private ward round",
    duration: "9:30 – 10:00 AM",
    doctor: "Dr. Marcus Lee",
    date: "2026-08-27",
    department: "In-patient",
    fee: 0,
    approval: "visit",
    symptoms: "Admitted overnight for observation. Feeling better this morning.",
    reports: [
      file("p14-rx", "Current medications list", "Ward pharmacy summary", { date: "2026-08-26", previewSrc: IMG.rx }),
    ],
    consults: [
      file("p14-c1", "Admission note", "Dr. Marcus Lee · Aug 2026 — observe, round in the morning.", { date: "2026-08-26" }),
    ],
  },
  {
    id: "p15",
    name: "Bina Khadka",
    age: 7,
    status: "upcoming",
    reason: "Fever review",
    duration: "6:30 – 7:00 PM",
    doctor: "Dr. Anjali Shrestha",
    date: "2026-08-27",
    department: "In-patient",
    fee: 70,
    symptoms: "Fever for two days. Drinking well. No rash.",
  },
  {
    id: "p16",
    name: "Arun Magar",
    age: 54,
    status: "active",
    reason: "Fracture follow-up",
    duration: "8:00 – 8:40 PM",
    doctor: "Dr. Kenji Watanabe",
    date: "2026-08-27",
    department: "Surgery",
    fee: 110,
    symptoms: "Wrist still swollen after last week’s fall. Splint feels tight.",
  },
  {
    id: "p17",
    name: "Sarita Poudel",
    age: 31,
    status: "upcoming",
    reason: "Labour check",
    duration: "10:15 – 10:45 PM",
    doctor: "Dr. Maya Thapa",
    date: "2026-08-27",
    department: "In-patient",
    fee: 0,
    symptoms: "Irregular contractions since evening. 38 weeks.",
  },
  {
    id: "p18",
    name: "Ishan KC",
    age: 19,
    status: "active",
    reason: "Emergency consult",
    duration: "1:00 – 1:40 AM",
    doctor: "Dr. Farhan Siddiqui",
    date: "2026-08-27",
    department: "In-patient",
    fee: 0,
    approval: "visit",
    symptoms: "Sudden headache and vomiting after a football match.",
  },
  {
    id: "p19",
    name: "Kiran Joshi",
    age: 44,
    status: "cancelled",
    reason: "General check-up",
    duration: "11:00 – 11:30 AM",
    doctor: "Dr. Priya Nair",
    date: "2026-08-27",
    department: "In-patient",
    fee: 80,
    approval: "visit",
    denyNote: "Patient arrived at reception and asked to cancel the online slot.",
    cancellation: {
      source: "cancelled",
      reason: "Patient arrived at reception and asked to cancel the online slot.",
      openedAt: "2026-08-27T10:40:00",
      outcome: "open",
    },
    symptoms: "Came in for a check-up, already seen at the desk this morning.",
  },
];

function hydratePatient(seed: PatientSeed): DraftHospitalPatient {
  const next: DraftHospitalPatient = {
    visitType: "clinic",
    fee: 80,
    symptoms: "",
    approval: seed.status === "denied" ? "denied" : seed.status === "upcoming" ? "pending" : "visit",
    denyNote: "",
    reports: [],
    findings: [],
    consults: [],
    ...seed,
  };
  if (!next.cancellation && (next.status === "denied" || next.status === "cancelled")) {
    next.cancellation = {
      source: next.status,
      reason: next.denyNote,
      openedAt: `${next.date}T12:00:00`,
      outcome: "open",
    };
  }
  return next;
}

export const DRAFT_PATIENTS: DraftHospitalPatient[] = PATIENT_SEEDS.map(hydratePatient);

const STORE_KEY = "pp.hospitalPatients.v1";
const STORE_EVENT = "pp:hospitalPatients";

function orgKey(orgId: string) {
  return `${STORE_KEY}.${orgId || "demo"}`;
}

export function opsTodayIso() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function shiftIso(iso: string, fromEpoch: string, toEpoch: string) {
  const a = Date.parse(`${iso}T12:00:00`);
  const from = Date.parse(`${fromEpoch}T12:00:00`);
  const to = Date.parse(`${toEpoch}T12:00:00`);
  if (Number.isNaN(a) || Number.isNaN(from) || Number.isNaN(to)) return iso;
  const next = new Date(to + (a - from));
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

function seedPatients(): DraftHospitalPatient[] {
  const today = opsTodayIso();
  return PATIENT_SEEDS.map((s) =>
    hydratePatient({
      ...s,
      date: shiftIso(s.date, DRAFT_TODAY, today),
    }),
  );
}

function writePatients(orgId: string, list: DraftHospitalPatient[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(orgKey(orgId), JSON.stringify(list));
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function listHospitalPatients(orgId: string): DraftHospitalPatient[] {
  if (typeof localStorage === "undefined") return seedPatients();
  try {
    const raw = localStorage.getItem(orgKey(orgId));
    if (!raw) {
      const seeded = seedPatients();
      writePatients(orgId, seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as DraftHospitalPatient[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = seedPatients();
      writePatients(orgId, seeded);
      return seeded;
    }
    return parsed.map((p) => hydratePatient(p));
  } catch {
    return seedPatients();
  }
}

export function upsertHospitalPatient(orgId: string, next: DraftHospitalPatient) {
  const list = listHospitalPatients(orgId);
  const i = list.findIndex((p) => p.id === next.id);
  if (i >= 0) list[i] = next;
  else list.unshift(next);
  writePatients(orgId, list);
}

export function getHospitalPatient(orgId: string, id: string) {
  return listHospitalPatients(orgId).find((p) => p.id === id) ?? null;
}

export function cancellationPath(patientId?: string) {
  return patientId ? `/provider/cancellations/${patientId}` : "/provider/cancellations";
}

export function needsCancelFlow(patient: DraftHospitalPatient) {
  if (patient.cancellation?.outcome && patient.cancellation.outcome !== "open") return false;
  return patient.status === "denied" || patient.status === "cancelled" || patient.cancellation?.outcome === "open";
}

export function openCancelCases(rows: DraftHospitalPatient[]) {
  return rows.filter(needsCancelFlow);
}

export function startPatientCancellation(
  patient: DraftHospitalPatient,
  source: DraftCancelSource,
  reason: string,
): DraftHospitalPatient {
  const note = reason.trim();
  return {
    ...patient,
    status: source,
    approval: source === "denied" ? "denied" : patient.approval,
    denyNote: note,
    cancellation: {
      source,
      reason: note,
      openedAt: new Date().toISOString(),
      outcome: "open",
    },
  };
}

export function resolvePatientCancellation(
  patient: DraftHospitalPatient,
  outcome: Exclude<DraftCancelOutcome, "open">,
  extra: Partial<DraftHospitalPatient> & { note?: string; refundAmount?: number },
): DraftHospitalPatient {
  const now = new Date().toISOString();
  const { note, refundAmount, ...rest } = extra;
  const opened = patient.cancellation ?? {
    source: patient.status === "denied" ? ("denied" as const) : ("cancelled" as const),
    reason: patient.denyNote,
    openedAt: now,
    outcome: "open" as const,
  };
  return {
    ...patient,
    ...rest,
    cancellation: {
      ...opened,
      outcome,
      resolvedAt: now,
      note: note?.trim() || opened.note,
      refundAmount: refundAmount ?? opened.refundAmount,
    },
  };
}

export function subscribeHospitalPatients(onChange: () => void) {
  window.addEventListener(STORE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STORE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useHospitalPatients(orgId: string) {
  const [rows, setRows] = useState(() => listHospitalPatients(orgId));
  useEffect(() => {
    setRows(listHospitalPatients(orgId));
    return subscribeHospitalPatients(() => setRows(listHospitalPatients(orgId)));
  }, [orgId]);
  return {
    rows,
    upsert: (next: DraftHospitalPatient) => upsertHospitalPatient(orgId, next),
  };
}

export function newDraftPatient(input: {
  name: string;
  age: number;
  doctor: string;
  department: string;
  reason: string;
  date: string;
  duration: string;
}): DraftHospitalPatient {
  return hydratePatient({
    id: `p-${Date.now()}`,
    status: "upcoming",
    approval: "pending",
    visitType: "clinic",
    fee: 80,
    symptoms: "",
    ...input,
  });
}

export const DRAFT_DOCTORS = [
  "Dr. Priya Nair",
  "Dr. Marcus Lee",
  "Dr. Sita Gurung",
  "Dr. Raj Bhandari",
  "Dr. Anjali Shrestha",
  "Dr. Kenji Watanabe",
  "Dr. Maya Thapa",
  "Dr. Farhan Siddiqui",
] as const;

export function boardDoctors(orgId: string): string[] {
  const staff = listStaff(orgId)
    .filter((s) => s.active)
    .map((s) => s.name.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of [...DRAFT_DOCTORS, ...staff]) {
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

export function doctorCredentials(orgId: string, name: string) {
  const staff = listStaff(orgId).find((s) => s.name === name);
  if (staff) {
    return [staff.specialty, staff.credentials].filter(Boolean).join(" · ");
  }
  return DRAFT_DOCTOR_META[name]?.credentials ?? "";
}

export const DRAFT_DEPARTMENT_FILTERS = ["In-patient", "Labs", "Diagnostics", "Surgery"] as const;

export const DEPT_TABS: { id: DeptTab; label: string }[] = [
  { id: "inpatient", label: "In-patient" },
  { id: "labs", label: "Labs" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "surgery", label: "Surgery" },
];

export const DEPARTMENTS: Record<DeptTab, DeptRow[]> = {
  inpatient: [
    { id: "inward", label: "In-ward", used: 42, cap: 60 },
    { id: "general", label: "General", used: 88, cap: 120 },
    { id: "private", label: "Private", used: 64, cap: 200 },
    { id: "children", label: "Children's", used: 18, cap: 24 },
    { id: "maternity", label: "Maternity", used: 24, cap: 40 },
    { id: "emergency", label: "Emergency", used: 16, cap: 18 },
    { id: "postop", label: "Post-op", used: 11, cap: 16 },
    { id: "icu", label: "ICU", used: 10, cap: 10 },
  ],
  labs: [
    { id: "xray", label: "X-ray", used: 22, cap: 40 },
    { id: "ct", label: "CT scan", used: 9, cap: 12 },
    { id: "mri", label: "MRI", used: 6, cap: 8 },
    { id: "endo", label: "Endoscopy", used: 7, cap: 10 },
    { id: "us", label: "Ultrasound", used: 14, cap: 20 },
    { id: "path", label: "Pathology", used: 31, cap: 50 },
  ],
  diagnostics: [
    { id: "ecg", label: "ECG", used: 18, cap: 30 },
    { id: "echo", label: "Echo", used: 8, cap: 12 },
    { id: "eeg", label: "EEG", used: 3, cap: 6 },
    { id: "pft", label: "Pulmonary function", used: 5, cap: 10 },
    { id: "holter", label: "Holter", used: 4, cap: 8 },
  ],
  surgery: [
    { id: "ot1", label: "OT 1", used: 4, cap: 6 },
    { id: "ot2", label: "OT 2", used: 5, cap: 6 },
    { id: "day", label: "Day surgery", used: 7, cap: 12 },
    { id: "cath", label: "Cath lab", used: 3, cap: 4 },
  ],
};

export function deptLoadLevel(used: number, cap: number): DeptLoadLevel {
  const p = cap > 0 ? used / cap : 0;
  if (p >= 0.9) return "full";
  if (p >= 0.6) return "moderate";
  return "stable";
}

export function patientInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function formatPatientDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}

/** Parse "12:30 – 1:20 PM" style windows used on the hospital board. */
export function splitDuration(duration: string): { start: string; end: string } {
  const parts = duration.split(/\s*[–—-]\s*/);
  if (parts.length < 2) return { start: "9:00 AM", end: "9:30 AM" };
  let start = parts[0].trim();
  const end = parts[1].trim();
  const period = end.match(/\b(AM|PM)$/i)?.[1]?.toUpperCase();
  if (period && !/\b(AM|PM)$/i.test(start)) start = `${start} ${period}`;
  return { start, end };
}
