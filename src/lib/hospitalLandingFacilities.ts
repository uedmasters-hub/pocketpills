import { LAB_BUNDLES, LAB_TESTS } from "@/lib/labs";
import type { HospitalView } from "@/lib/hospitalProfileContent";

export type LandingFacilityGroup = {
  id: string;
  title: string;
  blurb: string;
  items: string[];
};

const INPATIENT_ITEMS = [
  "General Ward",
  "Private Room",
  "Semi-Private Room",
  "Deluxe Room",
  "ICU Admission",
  "Day Care Admission",
  "Inpatient Nursing Care",
  "Postoperative Care",
];

/** First five tiles on the hospital landing grid; View all opens the rest too. */
export const LANDING_PREVIEW_IDS = [
  "diagnostics",
  "pharmacy",
  "rehab",
  "specialized",
  "packages",
] as const;

export function defaultLandingFacilityGroups(specialtyNames: string[] = []): LandingFacilityGroup[] {
  const specialties = specialtyNames
    .map((name) => name.trim())
    .filter((name) => name && !/physician/i.test(name) && !/surg/i.test(name));

  return [
    {
      id: "diagnostics",
      title: "Diagnostic Services",
      blurb: "Laboratory, imaging, and diagnostic testing with requisition.",
      items: LAB_TESTS.map((t) => t.name),
    },
    {
      id: "pharmacy",
      title: "Pharmacy & Medication",
      blurb: "Hospital pharmacy, counselling, and discharge prescriptions.",
      items: [
        "Hospital pharmacy",
        "Medication counselling",
        "Refills & delivery",
        "Discharge medications",
        "Prescription pickup",
      ],
    },
    {
      id: "rehab",
      title: "Rehabilitation",
      blurb: "Physiotherapy and recovery programmes after illness or surgery.",
      items: ["Physiotherapy", "Occupational therapy", "Speech therapy", "Post-surgical rehab"],
    },
    {
      id: "specialized",
      title: "Specialized Care",
      blurb: "Surgery and specialist programmes at this hospital.",
      items: ["Surgery", "Day-surgery and pre-operative assessments", ...specialties],
    },
    {
      id: "packages",
      title: "Health Packages",
      blurb: "Executive medicals and bundled screening packages.",
      items: LAB_BUNDLES.map((b) => b.name),
    },
    {
      id: "inpatient",
      title: "Inpatient & wards services",
      blurb: "Planned admission, ward types, and in-patient nursing.",
      items: INPATIENT_ITEMS,
    },
    {
      id: "other",
      title: "Other facilities",
      blurb: "Medical executive, ambulance, and supporting hospital services.",
      items: ["Medical executive", "Ambulance", "Transfer transport"],
    },
  ];
}

export function hospitalLandingGroups(hospital: HospitalView): LandingFacilityGroup[] {
  const custom = hospital.pageSections
    ?.find((s) => s.kind === "facilities" && s.enabled)
    ?.facilityGroups?.filter((g) => g.title.trim());
  if (custom?.length) {
    return custom.map((g) => ({
      id: g.id,
      title: g.title,
      blurb: g.blurb,
      items: g.items.map((i) => i.trim()).filter(Boolean),
    }));
  }
  return defaultLandingFacilityGroups(hospital.specialisedIn.map((g) => g.specialty));
}

export const DEFAULT_HOSPITAL_GALLERY: { src: string; label: string }[] = [
  {
    src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&h=800&fit=crop",
    label: "Diagnostic suite",
  },
  {
    src: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1200&h=800&fit=crop",
    label: "Hospital campus",
  },
  {
    src: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&h=800&fit=crop",
    label: "Care floor",
  },
  {
    src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop",
    label: "Consultation room",
  },
  {
    src: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=800&fit=crop",
    label: "Outpatient clinic",
  },
];
