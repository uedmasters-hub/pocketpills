import { fieldsMatchQuery, sortBySearchRank } from "@/lib/searchMatch";
import { getPublishedLabCentre } from "@/lib/businessProfile";

export type LabServiceKind = "blood" | "imaging" | "other";

export type LabTest = {
  id: string;
  name: string;
  description: string;
  category: string;
  turnaround: string;
  fasting?: boolean;
  feeFrom: number;
  covered?: boolean;
  kind: LabServiceKind;
  /** Read-only components / subtypes shown in package accordion (e.g. lipid fractions). */
  details?: string[];
};

export type LabBundle = {
  id: string;
  name: string;
  description: string;
  testIds: string[];
  fee: number;
  covered?: boolean;
  badge?: string;
};

export type LabCentre = {
  id: string;
  name: string;
  subtitle: string;
  address: string;
  city: string;
  distanceKm: number;
  hours: string;
  phone: string;
  rating: number;
  nextAvailable: string;
  lat: number;
  lng: number;
  /** Packages available at this centre */
  bundleIds: string[];
  /** Individual blood / other tests */
  testIds: string[];
  /** Physical / imaging tests (CT, MRI, ultrasound, etc.) */
  imagingIds: string[];
  emoji: string;
};

export type LabBookingStatus = "upcoming" | "completed" | "cancelled";

export type LabBooking = {
  id: string;
  confirmationNo: string;
  labId: string;
  labName: string;
  /** Selected bundle + test ids */
  itemIds: string[];
  itemNames: string;
  date: string;
  time: string;
  fee: number;
  patientName?: string;
  /** Linked row in order history / Activity */
  orderId?: string;
  status: LabBookingStatus;
  createdAt: string;
};

export type LabDraft = {
  labId: string;
  itemIds: string[];
  date: string;
  time: string;
  fee: number;
};

const LAB_DRAFT_KEY = "pp.labDraft.v1";

export const LAB_TESTS: LabTest[] = [
  {
    id: "cmp",
    name: "Comprehensive metabolic panel",
    description: "Kidney, liver, electrolytes, and glucose.",
    category: "Blood work",
    turnaround: "1–2 days",
    fasting: true,
    feeFrom: 0,
    covered: true,
    kind: "blood",
    details: [
      "Glucose",
      "Sodium, potassium, chloride",
      "BUN & creatinine",
      "AST, ALT, ALP, bilirubin",
      "Calcium & albumin",
    ],
  },
  {
    id: "cbc",
    name: "Complete blood count",
    description: "Red and white cells, platelets, hemoglobin.",
    category: "Blood work",
    turnaround: "Same day–1 day",
    feeFrom: 0,
    covered: true,
    kind: "blood",
    details: ["Hemoglobin & hematocrit", "WBC with differential", "Platelet count", "RBC indices"],
  },
  {
    id: "lipid",
    name: "Lipid panel",
    description: "Cholesterol and triglycerides.",
    category: "Blood work",
    turnaround: "1–2 days",
    fasting: true,
    feeFrom: 0,
    covered: true,
    kind: "blood",
    details: [
      "Total cholesterol",
      "HDL cholesterol",
      "LDL cholesterol",
      "Non-HDL cholesterol",
      "Triglycerides",
    ],
  },
  {
    id: "thyroid",
    name: "Thyroid panel (TSH)",
    description: "Screen for under- or over-active thyroid.",
    category: "Hormones",
    turnaround: "1–3 days",
    feeFrom: 25,
    kind: "blood",
    details: ["TSH", "Free T4 (reflex if indicated)"],
  },
  {
    id: "a1c",
    name: "HbA1c",
    description: "Average blood sugar over ~3 months.",
    category: "Diabetes",
    turnaround: "1–2 days",
    feeFrom: 0,
    covered: true,
    kind: "blood",
  },
  {
    id: "urine",
    name: "Urinalysis",
    description: "Infection, kidney, and metabolic markers.",
    category: "Urine",
    turnaround: "Same day–1 day",
    feeFrom: 0,
    covered: true,
    kind: "blood",
    details: ["Dipstick chemistry", "Specific gravity", "Microscopy if indicated"],
  },
  {
    id: "vitd",
    name: "Vitamin D",
    description: "25-OH vitamin D level.",
    category: "Vitamins",
    turnaround: "2–4 days",
    feeFrom: 45,
    kind: "blood",
  },
  {
    id: "covid",
    name: "COVID-19 PCR",
    description: "Molecular swab when clinically indicated.",
    category: "Infectious",
    turnaround: "1–2 days",
    feeFrom: 0,
    covered: true,
    kind: "other",
  },
  {
    id: "iron",
    name: "Iron studies",
    description: "Ferritin, iron, and TIBC.",
    category: "Blood work",
    turnaround: "1–2 days",
    feeFrom: 35,
    kind: "blood",
    details: ["Serum iron", "Ferritin", "TIBC", "Transferrin saturation"],
  },
  {
    id: "psa",
    name: "PSA",
    description: "Prostate-specific antigen screen.",
    category: "Hormones",
    turnaround: "1–3 days",
    feeFrom: 40,
    kind: "blood",
  },
  {
    id: "mri-brain",
    name: "MRI — Brain",
    description: "Detailed brain imaging. Referral preferred; self-pay slots available.",
    category: "MRI",
    turnaround: "Report in 3–5 days",
    feeFrom: 650,
    kind: "imaging",
  },
  {
    id: "mri-spine",
    name: "MRI — Lumbar spine",
    description: "Spine imaging for back pain and nerve symptoms.",
    category: "MRI",
    turnaround: "Report in 3–5 days",
    feeFrom: 700,
    kind: "imaging",
  },
  {
    id: "ct-chest",
    name: "CT — Chest",
    description: "Cross-sectional chest imaging.",
    category: "CT",
    turnaround: "Report in 2–4 days",
    feeFrom: 450,
    kind: "imaging",
  },
  {
    id: "ct-abdomen",
    name: "CT — Abdomen / pelvis",
    description: "Abdominal and pelvic CT scan.",
    category: "CT",
    turnaround: "Report in 2–4 days",
    feeFrom: 520,
    kind: "imaging",
  },
  {
    id: "us-abdomen",
    name: "Ultrasound — Abdomen",
    description: "Soft-tissue abdominal ultrasound.",
    category: "Ultrasound",
    turnaround: "Report in 1–3 days",
    feeFrom: 180,
    kind: "imaging",
  },
  {
    id: "xray-chest",
    name: "X-ray — Chest",
    description: "Standard chest radiograph.",
    category: "X-ray",
    turnaround: "Same day–1 day",
    feeFrom: 0,
    covered: true,
    kind: "imaging",
  },
  {
    id: "bone-density",
    name: "Bone density (DEXA)",
    description: "Osteoporosis screening scan.",
    category: "DEXA",
    turnaround: "Report in 2–3 days",
    feeFrom: 150,
    kind: "imaging",
  },
  {
    id: "ecg",
    name: "ECG / EKG",
    description: "Resting electrocardiogram.",
    category: "Cardiac",
    turnaround: "Same day",
    feeFrom: 0,
    covered: true,
    kind: "imaging",
  },
];

export const LAB_BUNDLES: LabBundle[] = [
  {
    id: "bundle-annual",
    name: "Annual health package",
    description: "CMP, CBC, lipid panel, and TSH — a practical yearly check.",
    testIds: ["cmp", "cbc", "lipid", "thyroid"],
    fee: 49,
    badge: "Popular",
  },
  {
    id: "bundle-diabetes",
    name: "Diabetes monitoring package",
    description: "A1c, CMP, and lipid panel for ongoing glucose care.",
    testIds: ["a1c", "cmp", "lipid"],
    fee: 0,
    covered: true,
    badge: "OHIP-friendly",
  },
  {
    id: "bundle-heart",
    name: "Heart risk package",
    description: "Lipid panel, CMP, and ECG for a quick cardiac snapshot.",
    testIds: ["lipid", "cmp", "ecg"],
    fee: 35,
  },
  {
    id: "bundle-energy",
    name: "Energy & vitamins package",
    description: "CBC, iron studies, vitamin D, and TSH.",
    testIds: ["cbc", "iron", "vitd", "thyroid"],
    fee: 89,
  },
  {
    id: "bundle-executive",
    name: "Executive wellness package",
    description: "CMP, CBC, lipids, thyroid, vitamin D, and A1c.",
    testIds: ["cmp", "cbc", "lipid", "thyroid", "vitd", "a1c"],
    fee: 129,
    badge: "Best value",
  },
];

export const LAB_CENTRES: LabCentre[] = [
  {
    id: "lab-lifelabs-king",
    name: "LifeLabs — King West",
    subtitle: "Walk-in, reserved draws & imaging referrals",
    address: "221 King St W",
    city: "Toronto",
    distanceKm: 0.8,
    hours: "Mon–Fri 7am–5pm · Sat 8am–1pm",
    phone: "(416) 555-0140",
    rating: 4.6,
    nextAvailable: "Today",
    lat: 43.6475,
    lng: -79.3868,
    bundleIds: ["bundle-annual", "bundle-diabetes", "bundle-heart", "bundle-energy"],
    testIds: ["cmp", "cbc", "lipid", "thyroid", "a1c", "urine", "vitd", "iron"],
    imagingIds: ["us-abdomen", "xray-chest", "ecg", "bone-density"],
    emoji: "🧪",
  },
  {
    id: "lab-dynacare-bay",
    name: "Dynacare — Bay Street",
    subtitle: "Collection centre with ultrasound",
    address: "100 Bay St",
    city: "Toronto",
    distanceKm: 1.4,
    hours: "Mon–Fri 7:30am–4:30pm",
    phone: "(416) 555-0188",
    rating: 4.5,
    nextAvailable: "Tomorrow",
    lat: 43.6496,
    lng: -79.3807,
    bundleIds: ["bundle-annual", "bundle-diabetes", "bundle-heart"],
    testIds: ["cmp", "cbc", "lipid", "thyroid", "a1c", "covid", "psa"],
    imagingIds: ["us-abdomen", "xray-chest", "ecg"],
    emoji: "🧬",
  },
  {
    id: "lab-gamma",
    name: "Gamma-Dynacare — Harbour",
    subtitle: "Fasting mornings & basic imaging",
    address: "12 Queens Quay W",
    city: "Toronto",
    distanceKm: 2.1,
    hours: "Mon–Fri 7am–3pm",
    phone: "(416) 555-0112",
    rating: 4.4,
    nextAvailable: "Today",
    lat: 43.6394,
    lng: -79.377,
    bundleIds: ["bundle-diabetes", "bundle-energy"],
    testIds: ["cmp", "lipid", "a1c", "urine", "vitd"],
    imagingIds: ["xray-chest", "ecg"],
    emoji: "🩸",
  },
  {
    id: "lab-medcan",
    name: "Medcan Lab Services",
    subtitle: "Executive panels, CT & MRI booking",
    address: "150 York St",
    city: "Toronto",
    distanceKm: 1.9,
    hours: "Mon–Fri 8am–6pm",
    phone: "(416) 555-0199",
    rating: 4.8,
    nextAvailable: "In 2 days",
    lat: 43.6488,
    lng: -79.3835,
    bundleIds: ["bundle-executive", "bundle-annual", "bundle-heart", "bundle-energy"],
    testIds: ["cmp", "cbc", "lipid", "thyroid", "vitd", "iron", "psa"],
    imagingIds: ["mri-brain", "mri-spine", "ct-chest", "ct-abdomen", "us-abdomen", "bone-density", "ecg"],
    emoji: "🔬",
  },
  {
    id: "lab-sunnybrook",
    name: "Sunnybrook Outpatient Lab",
    subtitle: "Hospital lab + advanced imaging",
    address: "2075 Bayview Ave",
    city: "Toronto",
    distanceKm: 8.2,
    hours: "Mon–Fri 7am–4pm",
    phone: "(416) 555-0160",
    rating: 4.3,
    nextAvailable: "Tomorrow",
    lat: 43.7224,
    lng: -79.3759,
    bundleIds: ["bundle-diabetes", "bundle-annual"],
    testIds: ["cmp", "cbc", "urine", "covid", "a1c"],
    imagingIds: ["mri-brain", "mri-spine", "ct-chest", "ct-abdomen", "xray-chest", "us-abdomen", "bone-density"],
    emoji: "🏥",
  },
  {
    id: "lab-community",
    name: "Community Care Labs — Midtown",
    subtitle: "Neighborhood draws & DEXA",
    address: "890 Eglinton Ave W",
    city: "Toronto",
    distanceKm: 5.6,
    hours: "Mon–Sat 8am–4pm",
    phone: "(416) 555-0133",
    rating: 4.7,
    nextAvailable: "Today",
    lat: 43.7036,
    lng: -79.4194,
    bundleIds: ["bundle-annual", "bundle-energy"],
    testIds: ["cmp", "cbc", "lipid", "urine", "thyroid"],
    imagingIds: ["bone-density", "xray-chest", "ecg"],
    emoji: "💉",
  },
  {
    id: "lab-westend",
    name: "West End Diagnostics",
    subtitle: "Same-week slots · ultrasound on site",
    address: "2400 Bloor St W",
    city: "Toronto",
    distanceKm: 6.4,
    hours: "Mon–Fri 8am–5pm",
    phone: "(416) 555-0171",
    rating: 4.2,
    nextAvailable: "In 2 days",
    lat: 43.6502,
    lng: -79.4778,
    bundleIds: ["bundle-heart", "bundle-diabetes"],
    testIds: ["cbc", "lipid", "a1c", "vitd", "covid"],
    imagingIds: ["us-abdomen", "ct-chest", "xray-chest", "ecg"],
    emoji: "🧫",
  },
];

export function getLab(id: string): LabCentre | undefined {
  const published = getPublishedLabCentre();
  if (published && published.id === id) return published;
  return LAB_CENTRES.find((l) => l.id === id);
}

export function listLabs(): LabCentre[] {
  const published = getPublishedLabCentre();
  if (!published) return LAB_CENTRES;
  return [published, ...LAB_CENTRES.filter((l) => l.id !== published.id)];
}

export function getLabTest(id: string): LabTest | undefined {
  return LAB_TESTS.find((t) => t.id === id);
}

export function getLabBundle(id: string): LabBundle | undefined {
  return LAB_BUNDLES.find((b) => b.id === id);
}

export function bundlesForLab(lab: LabCentre): LabBundle[] {
  return lab.bundleIds.map((id) => getLabBundle(id)).filter((b): b is LabBundle => !!b);
}

export function testsForLab(lab: LabCentre): LabTest[] {
  return lab.testIds.map((id) => getLabTest(id)).filter((t): t is LabTest => !!t);
}

export function imagingForLab(lab: LabCentre): LabTest[] {
  return lab.imagingIds.map((id) => getLabTest(id)).filter((t): t is LabTest => !!t);
}

export function labMapEmbedSrc(lab: LabCentre): string {
  const dLat = 0.012;
  const dLng = 0.018;
  const left = lab.lng - dLng;
  const right = lab.lng + dLng;
  const top = lab.lat + dLat;
  const bottom = lab.lat - dLat;
  const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lab.lat}%2C${lab.lng}`;
}

/** How the patient completes the service. */
export type LabCollectionMode = "physical" | "home";

export function labCollectionModeForTest(test: LabTest): LabCollectionMode {
  return test.kind === "imaging" ? "physical" : "home";
}

export function labCollectionModeForBundle(bundle: LabBundle): LabCollectionMode {
  const hasPhysical = bundle.testIds.some((id) => getLabTest(id)?.kind === "imaging");
  return hasPhysical ? "physical" : "home";
}

export function labCollectionModeLabel(mode: LabCollectionMode): string {
  return mode === "physical" ? "Physical visit" : "Home collection";
}

export function resolveLabItem(id: string):
  | { type: "bundle"; item: LabBundle; fee: number; name: string; collection: LabCollectionMode }
  | { type: "test"; item: LabTest; fee: number; name: string; collection: LabCollectionMode }
  | null {
  const bundle = getLabBundle(id);
  if (bundle) {
    return {
      type: "bundle",
      item: bundle,
      fee: bundle.fee,
      name: bundle.name,
      collection: labCollectionModeForBundle(bundle),
    };
  }
  const test = getLabTest(id);
  if (test) {
    return {
      type: "test",
      item: test,
      fee: test.feeFrom,
      name: test.name,
      collection: labCollectionModeForTest(test),
    };
  }
  return null;
}

export function summarizeLabSelection(itemIds: string[]): { names: string; fee: number; count: number } {
  const resolved = itemIds.map(resolveLabItem).filter((x): x is NonNullable<typeof x> => !!x);
  return {
    names: resolved.map((r) => r.name).join(", ") || "Lab visit",
    fee: resolved.reduce((sum, r) => sum + r.fee, 0),
    count: resolved.length,
  };
}

export function searchLabs(query: string, list: LabCentre[] = listLabs()): LabCentre[] {
  const needle = query.trim();
  if (!needle) return list;
  const hits = list.filter((l) => {
    const names = [
      ...testsForLab(l).map((t) => `${t.name} ${t.category}`),
      ...imagingForLab(l).map((t) => `${t.name} ${t.category} scan MRI CT`),
      ...bundlesForLab(l).map((b) => `${b.name} ${b.description} package bundle`),
    ].join(" ");
    return fieldsMatchQuery([l.name, l.subtitle, l.city, l.address, names], needle);
  });
  return sortBySearchRank(hits, needle, (l) => [l.name, l.subtitle, l.city, l.address]);
}

export function saveLabDraft(draft: LabDraft) {
  sessionStorage.setItem(LAB_DRAFT_KEY, JSON.stringify(draft));
}

export function readLabDraft(): LabDraft | null {
  try {
    const raw = sessionStorage.getItem(LAB_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LabDraft;
  } catch {
    return null;
  }
}

export function clearLabDraft() {
  sessionStorage.removeItem(LAB_DRAFT_KEY);
}

const LAB_BOOKINGS_KEY = "pp.labBookings.v1";

function readLabBookings(): LabBooking[] {
  try {
    const raw = localStorage.getItem(LAB_BOOKINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<LabBooking & { testId?: string; testName?: string }>;
    if (!Array.isArray(parsed)) return [];
    // Migrate older single-test bookings
    return parsed.map((b) => {
      if (b.itemIds?.length) return b as LabBooking;
      return {
        ...b,
        itemIds: b.testId ? [b.testId] : [],
        itemNames: b.testName || b.itemNames || "Lab visit",
      } as LabBooking;
    });
  } catch {
    return [];
  }
}

function writeLabBookings(list: LabBooking[]) {
  localStorage.setItem(LAB_BOOKINGS_KEY, JSON.stringify(list));
}

export function getLabBookings(): LabBooking[] {
  return readLabBookings().sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

export function createLabBooking(input: {
  labId: string;
  itemIds: string[];
  date: string;
  time: string;
  patientName?: string;
  orderId?: string;
}): LabBooking | null {
  const lab = getLab(input.labId);
  if (!lab || input.itemIds.length === 0) return null;
  const summary = summarizeLabSelection(input.itemIds);
  if (summary.count === 0) return null;
  const booking: LabBooking = {
    id: `lab-${Date.now()}`,
    confirmationNo: `PP-LAB-${String(Date.now()).slice(-4)}`,
    labId: lab.id,
    labName: lab.name,
    itemIds: input.itemIds,
    itemNames: summary.names,
    date: input.date,
    time: input.time,
    fee: summary.fee,
    patientName: input.patientName,
    orderId: input.orderId,
    status: "upcoming",
    createdAt: new Date().toISOString(),
  };
  writeLabBookings([booking, ...readLabBookings()]);
  clearLabDraft();
  return booking;
}

export function attachLabBookingOrder(bookingId: string, orderId: string) {
  const list = readLabBookings().map((b) => (b.id === bookingId ? { ...b, orderId } : b));
  writeLabBookings(list);
}

export function findLabBookingByOrderId(orderId: string): LabBooking | undefined {
  return readLabBookings().find((b) => b.orderId === orderId);
}

export function updateLabBookingStatus(id: string, status: LabBookingStatus) {
  const list = readLabBookings().map((b) => (b.id === id ? { ...b, status } : b));
  writeLabBookings(list);
}

/** Local calendar YYYY-MM-DD (avoids UTC shift from toISOString). */
export function localDateISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Past only after the visit calendar day ends — keeps same-day bookings on the hub. */
export function labBookingIsPast(b: LabBooking): boolean {
  return b.date < localDateISO();
}

export function labAvailabilityDays(count = 5): { date: string; label: string }[] {
  const out: { date: string; label: string }[] = [];
  const start = new Date();
  for (let i = 0; out.length < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === 0) continue;
    const date = localDateISO(d);
    const label =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
    out.push({ date, label });
  }
  return out;
}

export const LAB_TIME_SLOTS = ["7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM"];
