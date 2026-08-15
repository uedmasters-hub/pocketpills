/**
 * Specialty → procedure catalog for public profiles and listing setup.
 * Source of truth: treatments.json (Popular is a cross-cut, not a department).
 */

import treatmentCatalog from "../../treatments.json";

export type SpecialisedGroup = {
  specialty: string;
  procedures: string[];
};

export type SpecialisedVariant = "doctor" | "facility";

export const PHYSICIAN_SPECIALTY = "Physician";

export const PHYSICIAN_PROCEDURES = [
  "General consultation",
  "Follow-up",
  "Chronic care",
] as const;

const PHYSICIAN_GROUP: SpecialisedGroup = {
  specialty: PHYSICIAN_SPECIALTY,
  procedures: [...PHYSICIAN_PROCEDURES],
};

const HOSPITAL_CORE = [
  PHYSICIAN_SPECIALTY,
  "General Surgery",
  "Proctology",
  "Ophthalmology",
  "Urology",
  "Orthopedics",
  "Cosmetic Surgery",
  "Dental",
] as const;

const HOSPITAL_EXTENDED = ["Oncology", "Robotic Surgeries"] as const;

const CLINIC_CORE = [PHYSICIAN_SPECIALTY, "General Surgery"] as const;

/** Appointment-hub specialty ids → treatment departments. */
const SPECIALTY_HINT_TO_DEPARTMENT: Record<string, string> = {
  general: PHYSICIAN_SPECIALTY,
  orthopedist: "Orthopedics",
  ophthalmologist: "Ophthalmology",
  urologist: "Urology",
  dentist: "Dental",
  dermatologist: "Cosmetic Surgery",
};

function catalogDepartments(catalog: Record<string, string[]>): SpecialisedGroup[] {
  return Object.entries(catalog)
    .filter(([category]) => category !== "Popular")
    .map(([specialty, procedures]) => ({
      specialty,
      procedures: [...procedures],
    }));
}

export const TREATMENT_DEPARTMENTS: SpecialisedGroup[] = catalogDepartments(
  treatmentCatalog as Record<string, string[]>,
);

export const ALL_SPECIALISED_OPTIONS: SpecialisedGroup[] = [
  PHYSICIAN_GROUP,
  ...TREATMENT_DEPARTMENTS,
];

const BY_NAME = new Map(ALL_SPECIALISED_OPTIONS.map((g) => [g.specialty, g]));

export function specialisedCatalog(name: string): SpecialisedGroup | undefined {
  return BY_NAME.get(name);
}

export function sanitizeSpecialisedIn(raw: unknown): SpecialisedGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: SpecialisedGroup[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const specialty = String((row as SpecialisedGroup).specialty || "").trim();
    const catalog = specialisedCatalog(specialty);
    if (!catalog || seen.has(specialty)) continue;
    const allowed = new Set(catalog.procedures);
    const listed = Array.isArray((row as SpecialisedGroup).procedures)
      ? (row as SpecialisedGroup).procedures
      : [];
    const procedures = listed
      .map((p) => String(p || "").trim())
      .filter((p) => allowed.has(p));
    const next = procedures.length ? procedures : catalog.procedures;
    seen.add(specialty);
    out.push({ specialty, procedures: next });
  }
  return out;
}

export function specialisedCopy(variant: SpecialisedVariant) {
  if (variant === "doctor") {
    return {
      title: "Specialised in",
      lede: "Procedures this physician performs. Open a specialty to see the treatments offered.",
      editorHint:
        "Keep this focused — patients see only the procedures you personally perform.",
    };
  }
  return {
    title: "Departments & procedures",
    lede: "Treatments offered across this facility’s practitioners. Open a department to see the list.",
    editorHint:
      "List every department your practitioners cover. Hospitals typically show a longer catalogue than a solo clinic.",
  };
}

export function specialisedVariantForVendor(
  type: string | undefined,
): SpecialisedVariant | null {
  if (type === "doctor") return "doctor";
  if (type === "hospital" || type === "clinic") return "facility";
  return null;
}

function groupNamed(name: string): SpecialisedGroup | undefined {
  const catalog = specialisedCatalog(name);
  return catalog ? { specialty: catalog.specialty, procedures: [...catalog.procedures] } : undefined;
}

function groupsNamed(names: readonly string[]): SpecialisedGroup[] {
  return names.map(groupNamed).filter((g): g is SpecialisedGroup => Boolean(g));
}

function departmentFromDegree(degree: string): string {
  const d = degree.toLowerCase();
  if (d.includes("ortho")) return "Orthopedics";
  if (d.includes("ophthal") || d.includes("eye") || d.includes("netra")) return "Ophthalmology";
  if (d.includes("uro")) return "Urology";
  if (d.includes("dent") || d.includes("oral")) return "Dental";
  if (d.includes("onco") || d.includes("cancer")) return "Oncology";
  if (d.includes("plastic") || d.includes("cosmetic") || d.includes("aesthet")) {
    return "Cosmetic Surgery";
  }
  if (d.includes("procto") || d.includes("colorec")) return "Proctology";
  if (d.includes("robot")) return "Robotic Surgeries";
  if (/\bms\b/.test(d) || d.includes("surg")) return "General Surgery";
  return PHYSICIAN_SPECIALTY;
}

function groupsFromSpecialtyHints(ids: string[] | undefined): SpecialisedGroup[] {
  if (!ids?.length) return [];
  const names: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const name = SPECIALTY_HINT_TO_DEPARTMENT[id] || departmentFromDegree(id);
    if (seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return groupsNamed(names);
}

/** Solo physician: Physician OPD plus at most one mapped surgical department. */
export function defaultDoctorSpecialised(input: {
  degree?: string;
  subtitle?: string;
  specialties?: string[];
}): SpecialisedGroup[] {
  const fromIds = groupsFromSpecialtyHints(input.specialties);
  const mapped = departmentFromDegree(`${input.degree || ""} ${input.subtitle || ""}`);
  const surgical = fromIds.find((g) => g.specialty !== PHYSICIAN_SPECIALTY);
  const fromDegree = mapped === PHYSICIAN_SPECIALTY ? undefined : groupNamed(mapped);
  const extra = surgical || fromDegree;
  return extra ? [PHYSICIAN_GROUP, extra] : [PHYSICIAN_GROUP];
}

export function defaultFacilitySpecialised(input: {
  name?: string;
  facilityLevel?: string;
  subtitle?: string;
  specialties?: string[];
  breadth?: "clinic" | "hospital";
}): SpecialisedGroup[] {
  const hay = `${input.facilityLevel || ""} ${input.name || ""} ${input.subtitle || ""}`.toLowerCase();
  if (/eye|ophthal|netra/.test(hay)) return groupsNamed(["Ophthalmology"]);
  if (/dental|oral|tooth/.test(hay)) return groupsNamed(["Dental"]);
  if (/cancer|onco/.test(hay)) return groupsNamed(["Oncology", PHYSICIAN_SPECIALTY]);
  if (/ortho|bone/.test(hay)) return groupsNamed(["Orthopedics", PHYSICIAN_SPECIALTY]);
  if (/uro/.test(hay)) return groupsNamed(["Urology", PHYSICIAN_SPECIALTY]);

  const fromIds = groupsFromSpecialtyHints(input.specialties);
  const isClinic =
    input.breadth === "clinic" ||
    /health post|phc|clinic|polyclinic|outpatient/.test(hay);
  const isLarge =
    input.breadth === "hospital" ||
    /hospital|teaching|medical college|institute|academy/.test(hay);

  if (fromIds.length >= (isClinic ? 2 : 4)) return fromIds;

  const core = isClinic ? CLINIC_CORE : HOSPITAL_CORE;
  const extra = isLarge && !isClinic ? HOSPITAL_EXTENDED : [];
  const merged = new Map<string, SpecialisedGroup>();
  for (const g of [...fromIds, ...groupsNamed([...core, ...extra])]) {
    merged.set(g.specialty, g);
  }
  return [...merged.values()];
}

export function defaultSpecialisedForVendor(
  type: string | undefined,
  hints: {
    degree?: string;
    subtitle?: string;
    name?: string;
    facilityLevel?: string;
    specialties?: string[];
  } = {},
): SpecialisedGroup[] {
  if (type === "doctor") return defaultDoctorSpecialised(hints);
  if (type === "clinic") {
    return defaultFacilitySpecialised({ ...hints, breadth: "clinic" });
  }
  if (type === "hospital") {
    return defaultFacilitySpecialised({ ...hints, breadth: "hospital" });
  }
  return [];
}

export function toggleSpecialty(
  current: SpecialisedGroup[],
  specialty: string,
  on: boolean,
): SpecialisedGroup[] {
  const catalog = specialisedCatalog(specialty);
  if (!catalog) return current;
  if (!on) return current.filter((g) => g.specialty !== specialty);
  if (current.some((g) => g.specialty === specialty)) return current;
  return [...current, { specialty: catalog.specialty, procedures: [...catalog.procedures] }];
}

export function toggleProcedure(
  current: SpecialisedGroup[],
  specialty: string,
  procedure: string,
  on: boolean,
): SpecialisedGroup[] {
  const catalog = specialisedCatalog(specialty);
  if (!catalog || !catalog.procedures.includes(procedure)) return current;
  const existing = current.find((g) => g.specialty === specialty);
  if (!existing) {
    return on
      ? [...current, { specialty: catalog.specialty, procedures: [procedure] }]
      : current;
  }
  const next = on
    ? existing.procedures.includes(procedure)
      ? existing.procedures
      : [...existing.procedures, procedure]
    : existing.procedures.filter((p) => p !== procedure);
  if (!next.length) return current.filter((g) => g.specialty !== specialty);
  return current.map((g) => (g.specialty === specialty ? { ...g, procedures: next } : g));
}
