/**
 * Hospital / clinic staff doctor profiles — rich trust fields (demo localStorage).
 */

export type StaffSlot = {
  id: string;
  day: string;
  window: string;
};

export type StaffExperience = {
  id: string;
  role: string;
  organization: string;
  years: string;
};

export type StaffMember = {
  id: string;
  name: string;
  /** Short credentials line, e.g. MD, FRCPC */
  credentials: string;
  specialty: string;
  /** Additional focus / specialisation tags */
  specializations: string[];
  feeFrom: number;
  /** Plain summary still useful for list cards */
  availability: string;
  slots: StaffSlot[];
  phone: string;
  email: string;
  languages: string[];
  licenseNumber: string;
  /** Licensing body, e.g. CPSO */
  licenseBody: string;
  /** Extra licence / certification lines */
  licenses: string[];
  education: string[];
  awards: string[];
  experience: StaffExperience[];
  experienceYears: number;
  bio: string;
  about: string;
  imageUrl: string;
  virtual: boolean;
  clinic: boolean;
  active: boolean;
  createdAt: string;
};

const SEED_VERSION = 2;

function key(orgId: string) {
  return `pp.provider.doctors.${orgId}`;
}
function versionKey(orgId: string) {
  return `pp.provider.doctors.ver.${orgId}`;
}

function emptyMember(partial?: Partial<StaffMember>): StaffMember {
  return {
    id: "",
    name: "",
    credentials: "MD",
    specialty: "",
    specializations: [],
    feeFrom: 89,
    availability: "",
    slots: [],
    phone: "",
    email: "",
    languages: ["English"],
    licenseNumber: "",
    licenseBody: "CPSO",
    licenses: [],
    education: [],
    awards: [],
    experience: [],
    experienceYears: 5,
    bio: "",
    about: "",
    imageUrl: "/img/Cardiologist.png",
    virtual: true,
    clinic: true,
    active: true,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

function normalize(raw: Partial<StaffMember> & { id: string }): StaffMember {
  const base = emptyMember();
  return {
    ...base,
    ...raw,
    specializations: Array.isArray(raw.specializations) ? raw.specializations : [],
    slots: Array.isArray(raw.slots) ? raw.slots : [],
    languages: Array.isArray(raw.languages) && raw.languages.length ? raw.languages : ["English"],
    licenses: Array.isArray(raw.licenses) ? raw.licenses : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    awards: Array.isArray(raw.awards) ? raw.awards : [],
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    credentials: raw.credentials ?? "MD",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    licenseNumber: raw.licenseNumber ?? "",
    licenseBody: raw.licenseBody ?? "CPSO",
    bio: raw.bio ?? "",
    about: raw.about ?? "",
    imageUrl: raw.imageUrl || "/img/Cardiologist.png",
    experienceYears: typeof raw.experienceYears === "number" ? raw.experienceYears : 5,
    virtual: raw.virtual !== false,
    clinic: raw.clinic !== false,
    active: raw.active !== false,
  };
}

function read(orgId: string): StaffMember[] {
  try {
    const ver = Number(localStorage.getItem(versionKey(orgId)) || "0");
    const raw = localStorage.getItem(key(orgId));
    if (!raw || ver < SEED_VERSION) return seed(orgId);
    const parsed = JSON.parse(raw) as Partial<StaffMember>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seed(orgId);
    return parsed.filter((m) => m?.id).map((m) => normalize(m as StaffMember));
  } catch {
    return seed(orgId);
  }
}

function write(orgId: string, list: StaffMember[]) {
  localStorage.setItem(key(orgId), JSON.stringify(list));
  localStorage.setItem(versionKey(orgId), String(SEED_VERSION));
}

function seed(orgId: string): StaffMember[] {
  const list: StaffMember[] = [
    normalize({
      id: `doc-${orgId}-1`,
      name: "Dr. Priya Nair",
      credentials: "MD, CCFP",
      specialty: "Internal medicine",
      specializations: ["Preventive care", "Women’s health", "Chronic disease"],
      feeFrom: 89,
      availability: "Mon–Thu mornings",
      slots: [
        { id: "s1", day: "Monday", window: "9:00 AM – 12:00 PM" },
        { id: "s2", day: "Tuesday", window: "9:00 AM – 1:00 PM" },
        { id: "s3", day: "Thursday", window: "10:00 AM – 2:00 PM" },
      ],
      phone: "416-555-0142",
      email: "priya.nair@example.ca",
      languages: ["English", "Hindi", "Malayalam"],
      licenseNumber: "108452",
      licenseBody: "CPSO",
      licenses: ["CPSO Independent Practice", "ACLS certified"],
      education: [
        "MD, University of Toronto",
        "Residency · Internal Medicine, UHN",
        "CCFP · College of Family Physicians of Canada",
      ],
      awards: ["Patient Choice Award 2024", "UHN Teaching Excellence 2022"],
      experience: [
        { id: "e1", role: "Staff physician", organization: "University Health Network", years: "2019–present" },
        { id: "e2", role: "Clinical fellow", organization: "Sunnybrook Health Sciences", years: "2017–2019" },
      ],
      experienceYears: 12,
      bio: "Board-certified internist focused on clear plans and same-week follow-up.",
      about:
        "Dr. Nair helps adults manage complex conditions with practical, evidence-based care. Patients value her calm explanations and coordinated follow-through with specialists.",
      imageUrl: "/img/Cardiologist.png",
      virtual: true,
      clinic: true,
      active: true,
      createdAt: new Date().toISOString(),
    }),
    normalize({
      id: `doc-${orgId}-2`,
      name: "Dr. Marcus Lee",
      credentials: "MD, FRCPC",
      specialty: "Cardiology",
      specializations: ["Heart failure", "Hypertension", "Preventive cardiology"],
      feeFrom: 120,
      availability: "Tue / Fri afternoons",
      slots: [
        { id: "s1", day: "Tuesday", window: "1:00 PM – 5:00 PM" },
        { id: "s2", day: "Friday", window: "1:00 PM – 4:00 PM" },
      ],
      phone: "416-555-0198",
      email: "marcus.lee@example.ca",
      languages: ["English", "Mandarin"],
      licenseNumber: "992341",
      licenseBody: "CPSO",
      licenses: ["FRCPC Cardiology", "CPSO Independent Practice"],
      education: ["MD, UBC", "FRCPC · Cardiology", "Fellowship · Toronto General"],
      awards: ["Heart & Stroke Clinician Award 2023"],
      experience: [
        { id: "e1", role: "Cardiologist", organization: "Toronto General Hospital", years: "2016–present" },
      ],
      experienceYears: 15,
      bio: "Cardiologist helping patients prevent and manage heart disease.",
      about:
        "Dr. Lee combines advanced cardiac care with approachable coaching on lifestyle and medication. He works closely with primary care for shared plans.",
      imageUrl: "/img/Cardiologist.png",
      virtual: true,
      clinic: true,
      active: true,
      createdAt: new Date().toISOString(),
    }),
  ];
  write(orgId, list);
  return list;
}

export function listStaff(orgId: string): StaffMember[] {
  return read(orgId);
}

export function getStaff(orgId: string, id: string): StaffMember | null {
  return read(orgId).find((m) => m.id === id) ?? null;
}

export function saveStaff(
  orgId: string,
  member: Omit<StaffMember, "id" | "createdAt"> & { id?: string; createdAt?: string },
): StaffMember {
  const list = read(orgId);
  const availability =
    (member.availability ?? "").trim() ||
    (member.slots ?? [])
      .slice(0, 3)
      .map((s) => `${s.day} ${s.window}`)
      .join(" · ") ||
    "By appointment";

  if (member.id && list.some((m) => m.id === member.id)) {
    const next = list.map((m) =>
      m.id === member.id
        ? normalize({
            ...m,
            ...member,
            id: member.id,
            availability,
            createdAt: m.createdAt,
          })
        : m,
    );
    write(orgId, next);
    return next.find((m) => m.id === member.id)!;
  }

  const created = normalize({
    ...emptyMember(),
    ...member,
    id: `doc-${Date.now().toString(36)}`,
    availability,
    createdAt: new Date().toISOString(),
  });
  write(orgId, [created, ...list]);
  return created;
}

export function removeStaff(orgId: string, id: string) {
  write(
    orgId,
    read(orgId).filter((m) => m.id !== id),
  );
}

export function newListId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

export const DOCTOR_PHOTO_OPTIONS = [
  { label: "Cardiology", url: "/img/Cardiologist.png" },
  { label: "General", url: "/img/General Physician.png" },
  { label: "Neurology", url: "/img/Neurologist.png" },
  { label: "Dermatology", url: "/img/Dermatologist.png" },
  { label: "Pediatrics", url: "/img/Pediatrician.png" },
  { label: "Orthopedics", url: "/img/Orthopedist.png" },
];

export function emptyStaffDraft(): StaffMember {
  return emptyMember({
    id: "",
    name: "",
    specialty: "Family medicine",
    slots: [{ id: newListId("slot"), day: "Monday", window: "9:00 AM – 12:00 PM" }],
    bio: "",
    about: "",
  });
}

/** Completeness score 0–100 for trust checklist UI */
export function staffTrustScore(m: StaffMember): number {
  const checks = [
    !!m.name.trim(),
    !!m.specialty.trim(),
    !!m.licenseNumber.trim(),
    !!m.bio.trim(),
    !!m.about.trim(),
    m.education.length > 0,
    m.experience.length > 0,
    m.slots.length > 0 || !!m.availability.trim(),
    !!m.imageUrl,
    m.languages.length > 0,
    m.specializations.length > 0,
    !!m.phone.trim() || !!m.email.trim(),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
