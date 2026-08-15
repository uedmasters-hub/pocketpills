/** Demo care booking — specialty → nearest providers → book. localStorage-backed. */

import { getPublishedCareProvider } from "@/lib/businessProfile";
import { getNmcProvider, listPublishedNmcProviders } from "@/lib/doctorDirectory";
import type { SpecialisedGroup } from "@/lib/specialisedIn";

export type VisitType = "virtual" | "clinic";
export type AppointmentStatus = "upcoming" | "completed" | "cancelled";
export type ProviderKind = "doctor" | "clinic" | "hospital";

export type SpecialtyId =
  | "general"
  | "dermatologist"
  | "gynecologist"
  | "pediatrician"
  | "cardiologist"
  | "neurologist"
  | "orthopedist"
  | "ophthalmologist"
  | "ent"
  | "gastroenterologist"
  | "endocrinologist"
  | "pulmonologist"
  | "urologist"
  | "psychiatrist"
  | "dentist"
  | "immunologist"
  | "sexologist"
  | "nutritionist"
  | "physiotherapist";

export interface Specialty {
  id: SpecialtyId;
  label: string;
  blurb: string;
  /** Starting consultation fee in CAD */
  feeFrom: number;
  /** Pastel circle accent (fallback) */
  accent: string;
  /** Local illustration under /img */
  imageUrl: string;
}

export type FacilityServiceKind =
  | "consult"
  | "lab"
  | "surgery"
  | "diagnostics"
  | "imaging"
  | "pharmacy";

export interface FacilityService {
  id: string;
  kind: FacilityServiceKind;
  label: string;
  blurb: string;
  feeFrom: number;
}

/** Unified card for doctors, clinics, and hospitals. */
export interface CareProvider {
  id: string;
  kind: ProviderKind;
  name: string;
  /** Credentials, facility type, or department */
  subtitle: string;
  imageUrl: string;
  specialties: SpecialtyId[];
  languages: string[];
  rating: number;
  reviewCount: number;
  /** Distance from demo user location (km) */
  distanceKm: number;
  /** Consultation fee in CAD */
  consultationFee: number;
  experienceYears?: number;
  nextAvailable: string;
  visitTypes: VisitType[];
  city: string;
  address?: string;
  bio: string;
  /** Longer about copy for detail pages */
  about?: string;
  hours?: string;
  phone?: string;
  /** Doctor: clinical focus areas */
  focusAreas?: string[];
  /** Doctor: education / credentials lines */
  education?: string[];
  /** Doctor: linked clinic/hospital ids */
  affiliatedFacilityIds?: string[];
  /** Clinic/hospital: bookable service catalogue */
  services?: FacilityService[];
  /** Clinic/hospital: amenity / facility highlights */
  amenities?: string[];
  /** Clinic/hospital: doctor ids on staff */
  staffIds?: string[];
  /** Departments / procedures shown on the public profile accordion */
  specialisedIn?: SpecialisedGroup[];
  /** Verified awards only — omit or empty to hide the section */
  awards?: { title: string; org: string; year: string }[];
}

/** @deprecated Prefer CareProvider */
export type Clinician = CareProvider;

export interface Appointment {
  id: string;
  confirmationNo: string;
  providerId: string;
  providerKind: ProviderKind;
  providerName: string;
  clinicianId: string;
  clinicianName: string;
  specialtyId: SpecialtyId;
  specialtyLabel: string;
  visitType: VisitType;
  date: string;
  time: string;
  patientName: string;
  patientRelation: string;
  contact: string;
  notes: string;
  symptoms: string;
  fee?: number;
  /** Attached report ids from DEMO_REPORTS */
  reportIds?: string[];
  /** Shared prior finding ids from DEMO_FINDINGS */
  findingIds?: string[];
  clinicName?: string;
  clinicAddress?: string;
  status: AppointmentStatus;
  createdAt: string;
}

const specialtyImg = (file: string) => `/img/${encodeURIComponent(file)}`;

export const SPECIALTIES: Specialty[] = [
  {
    id: "general",
    label: "General Physician",
    blurb: "Check-ups, new concerns, and everyday care.",
    feeFrom: 89,
    accent: "#E0F2FE",
    imageUrl: specialtyImg("General Physician.png"),
  },
  {
    id: "dermatologist",
    label: "Dermatologist",
    blurb: "Acne, rashes, eczema, and other skin concerns.",
    feeFrom: 89,
    accent: "#FFEDD5",
    imageUrl: specialtyImg("Dermatologist.png"),
  },
  {
    id: "gynecologist",
    label: "Gynecologist",
    blurb: "Pregnancy, menstrual health, and women’s care.",
    feeFrom: 89,
    accent: "#F3E8FF",
    imageUrl: specialtyImg("Gynecologist.png"),
  },
  {
    id: "pediatrician",
    label: "Pediatrician",
    blurb: "Care for infants, children, and teens.",
    feeFrom: 89,
    accent: "#FCE7F3",
    imageUrl: specialtyImg("Pediatrician.png"),
  },
  {
    id: "cardiologist",
    label: "Cardiologist",
    blurb: "Heart health, blood pressure, and related care.",
    feeFrom: 89,
    accent: "#FEE2E2",
    imageUrl: specialtyImg("Cardiologist.png"),
  },
  {
    id: "neurologist",
    label: "Neurologist",
    blurb: "Headache, nerve, and neurological concerns.",
    feeFrom: 89,
    accent: "#EDE9FE",
    imageUrl: specialtyImg("Neurologist.png"),
  },
  {
    id: "orthopedist",
    label: "Orthopedist",
    blurb: "Bones, joints, and musculoskeletal care.",
    feeFrom: 89,
    accent: "#EEF2FF",
    imageUrl: specialtyImg("Orthopedist.png"),
  },
  {
    id: "ophthalmologist",
    label: "Ophthalmologist",
    blurb: "Eye exams and vision-related concerns.",
    feeFrom: 89,
    accent: "#E0F2FE",
    imageUrl: specialtyImg("Ophthalmologist.png"),
  },
  {
    id: "ent",
    label: "ENT Specialist",
    blurb: "Ear, nose, and throat care.",
    feeFrom: 89,
    accent: "#FEF3C7",
    imageUrl: specialtyImg("ENT Specialist.png"),
  },
  {
    id: "gastroenterologist",
    label: "Gastroenterologist",
    blurb: "Acid reflux, IBS, and digestive concerns.",
    feeFrom: 89,
    accent: "#ECFDF5",
    imageUrl: specialtyImg("Gastroenterologist.png"),
  },
  {
    id: "endocrinologist",
    label: "Endocrinologist",
    blurb: "Diabetes, thyroid, and hormone-related care.",
    feeFrom: 89,
    accent: "#EEF2FF",
    imageUrl: specialtyImg("Endocrinologist.png"),
  },
  {
    id: "pulmonologist",
    label: "Pulmonologist",
    blurb: "Asthma, breathing, and lung-related care.",
    feeFrom: 89,
    accent: "#E0F2FE",
    imageUrl: specialtyImg("Pulmonologist.png"),
  },
  {
    id: "urologist",
    label: "Urologist",
    blurb: "Urinary and men’s urological health.",
    feeFrom: 89,
    accent: "#E0F2FE",
    imageUrl: specialtyImg("Urologist.png"),
  },
  {
    id: "psychiatrist",
    label: "Psychiatrist",
    blurb: "Anxiety, mood, sleep, and related support.",
    feeFrom: 89,
    accent: "#EDE9FE",
    imageUrl: specialtyImg("Psychiatrist.png"),
  },
  {
    id: "dentist",
    label: "Dentist",
    blurb: "Dental check-ups and oral health.",
    feeFrom: 89,
    accent: "#F0FDF4",
    imageUrl: specialtyImg("Dentist.png"),
  },
  {
    id: "immunologist",
    label: "Immunologist",
    blurb: "Allergies, immunity, and related concerns.",
    feeFrom: 89,
    accent: "#F3E8FF",
    imageUrl: specialtyImg("Immunologist.png"),
  },
  {
    id: "sexologist",
    label: "Sexologist",
    blurb: "Sexual health, contraception, and related concerns.",
    feeFrom: 89,
    accent: "#FCE7F3",
    imageUrl: specialtyImg("Sexologist.png"),
  },
  {
    id: "nutritionist",
    label: "Nutritionist",
    blurb: "Diet plans, weight, and nutrition coaching.",
    feeFrom: 89,
    accent: "#ECFDF5",
    imageUrl: specialtyImg("Nutritionist.png"),
  },
  {
    id: "physiotherapist",
    label: "Physiotherapist",
    blurb: "Injury recovery and movement therapy.",
    feeFrom: 89,
    accent: "#EEF2FF",
    imageUrl: specialtyImg("Physiotherapist.png"),
  },
];

const img = {
  doctorF1:
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
  doctorM1:
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
  doctorF2:
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face",
  doctorM2:
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face",
  doctorF3:
    "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop&crop=face",
  doctorM3:
    "https://images.unsplash.com/photo-1537368910025-70034834ec95?w=400&h=400&fit=crop&crop=face",
  clinic1:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=640&h=400&fit=crop",
  clinic2:
    "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=640&h=400&fit=crop",
  clinic3:
    "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=640&h=400&fit=crop",
  clinic4:
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=640&h=400&fit=crop",
  hospital1:
    "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=640&h=400&fit=crop",
  hospital2:
    "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=640&h=400&fit=crop",
  hospital3:
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=640&h=400&fit=crop",
  hospital4:
    "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=640&h=400&fit=crop",
};

export const PROVIDERS: CareProvider[] = [
  /* ── Doctors ─────────────────────────────────────────── */
  {
    id: "dr-shah",
    kind: "doctor",
    name: "Dr. Amrita Shah",
    subtitle: "MD, CCFP · Family medicine",
    imageUrl: img.doctorF1,
    specialties: ["general", "endocrinologist", "gynecologist", "cardiologist", "orthopedist"],
    languages: ["English", "Hindi"],
    rating: 4.9,
    reviewCount: 312,
    distanceKm: 1.2,
    consultationFee: 79,
    experienceYears: 12,
    nextAvailable: "Today",
    visitTypes: ["virtual", "clinic"],
    city: "Toronto, ON",
    address: "221 King St W, Toronto, ON M5H 1K4",
    bio: "Family physician focused on chronic care and women’s health visits.",
  },
  {
    id: "dr-chen",
    kind: "doctor",
    name: "Dr. Jordan Chen",
    subtitle: "MD, FRCPC · Psychiatry",
    imageUrl: img.doctorM1,
    specialties: ["psychiatrist", "general", "neurologist"],
    languages: ["English", "Mandarin"],
    rating: 4.8,
    reviewCount: 188,
    distanceKm: 3.4,
    consultationFee: 99,
    experienceYears: 15,
    nextAvailable: "Tomorrow",
    visitTypes: ["virtual"],
    city: "Toronto, ON",
    address: "100 Queens Quay E, Toronto, ON M5E 1Z2",
    bio: "Psychiatrist supporting anxiety, mood, and sleep concerns online.",
  },
  {
    id: "dr-okafor",
    kind: "doctor",
    name: "Dr. R. Okafor",
    subtitle: "MD, CCFP · Dermatology focus",
    imageUrl: img.doctorF2,
    specialties: ["dermatologist", "general", "sexologist", "ophthalmologist"],
    languages: ["English", "French"],
    rating: 4.7,
    reviewCount: 241,
    distanceKm: 4.8,
    consultationFee: 89,
    experienceYears: 10,
    nextAvailable: "Today",
    visitTypes: ["virtual", "clinic"],
    city: "Mississauga, ON",
    address: "Unit 6 - 6375 Dixie Rd, Mississauga, ON L5T 2E7",
    bio: "Dermatology-forward family practice with discreet sexual health visits.",
  },
  {
    id: "dr-nguyen",
    kind: "doctor",
    name: "Dr. J. Nguyen",
    subtitle: "NP · Digestive & therapy",
    imageUrl: img.doctorM2,
    specialties: ["gastroenterologist", "endocrinologist", "sexologist", "nutritionist", "dentist"],
    languages: ["English", "Vietnamese"],
    rating: 4.9,
    reviewCount: 420,
    distanceKm: 2.1,
    consultationFee: 69,
    experienceYears: 8,
    nextAvailable: "Today",
    visitTypes: ["virtual", "clinic"],
    city: "Toronto, ON",
    address: "221 King St W, Toronto, ON M5H 1K4",
    bio: "Nurse practitioner specializing in digestive concerns and ongoing therapy plans.",
  },
  {
    id: "dr-patel",
    kind: "doctor",
    name: "Dr. Priya Patel",
    subtitle: "MD, CCFP · Gynaecology",
    imageUrl: img.doctorF3,
    specialties: ["gynecologist", "sexologist", "general"],
    languages: ["English", "Gujarati"],
    rating: 4.8,
    reviewCount: 156,
    distanceKm: 5.6,
    consultationFee: 89,
    experienceYears: 14,
    nextAvailable: "In 2 days",
    visitTypes: ["virtual", "clinic"],
    city: "Toronto, ON",
    address: "790 Bay St, Toronto, ON M5G 1N8",
    bio: "Warm, thorough visits for gynaecology and sexual health questions.",
  },
  {
    id: "dr-lee",
    kind: "doctor",
    name: "Dr. Michelle Lee",
    subtitle: "MD · Internal medicine",
    imageUrl: img.doctorF1,
    specialties: ["endocrinologist", "cardiologist", "gastroenterologist", "general", "pulmonologist", "physiotherapist"],
    languages: ["English", "Korean"],
    rating: 4.6,
    reviewCount: 98,
    distanceKm: 6.9,
    consultationFee: 89,
    experienceYears: 18,
    nextAvailable: "Tomorrow",
    visitTypes: ["virtual", "clinic"],
    city: "North York, ON",
    address: "555 Finch Ave W, North York, ON M2R 1N5",
    bio: "Internal medicine for complex chronic conditions and care coordination.",
  },
  {
    id: "dr-singh",
    kind: "doctor",
    name: "Dr. Amar Singh",
    subtitle: "MD · Gastroenterology",
    imageUrl: img.doctorM3,
    specialties: ["gastroenterologist", "general", "nutritionist"],
    languages: ["English", "Punjabi"],
    rating: 4.7,
    reviewCount: 203,
    distanceKm: 7.2,
    consultationFee: 99,
    experienceYears: 11,
    nextAvailable: "Tomorrow",
    visitTypes: ["virtual", "clinic"],
    city: "Brampton, ON",
    address: "2100 Bovaird Dr E, Brampton, ON L6R 3B1",
    bio: "Focus on acid reflux, IBS, and everyday digestive concerns.",
  },
  {
    id: "dr-martin",
    kind: "doctor",
    name: "Dr. Elise Martin",
    subtitle: "MD, FRCPC · Psychiatry",
    imageUrl: img.doctorF2,
    specialties: ["psychiatrist", "neurologist"],
    languages: ["English", "French"],
    rating: 4.9,
    reviewCount: 267,
    distanceKm: 2.8,
    consultationFee: 109,
    experienceYears: 16,
    nextAvailable: "Today",
    visitTypes: ["virtual"],
    city: "Toronto, ON",
    address: "250 University Ave, Toronto, ON M5H 3E5",
    bio: "Adult psychiatry with same-week virtual follow-ups.",
  },

  /* ── Clinics ─────────────────────────────────────────── */
  {
    id: "clinic-pp-toronto",
    kind: "clinic",
    name: "PocketPills Care Clinic",
    subtitle: "Walk-in & booked visits",
    imageUrl: img.clinic1,
    specialties: ["general", "dermatologist", "gynecologist", "pediatrician", "ent"],
    languages: ["English", "French"],
    rating: 4.8,
    reviewCount: 890,
    distanceKm: 0.8,
    consultationFee: 79,
    nextAvailable: "Today",
    visitTypes: ["clinic", "virtual"],
    city: "Toronto, ON",
    address: "221 King St W, Toronto, ON M5H 1K4",
    bio: "Partner clinic for same-day and scheduled visits with PocketPills clinicians.",
  },
  {
    id: "clinic-greenwood",
    kind: "clinic",
    name: "Greenwood Family Clinic",
    subtitle: "Family practice · Extended hours",
    imageUrl: img.clinic2,
    specialties: ["general", "endocrinologist", "gastroenterologist", "nutritionist"],
    languages: ["English"],
    rating: 4.5,
    reviewCount: 412,
    distanceKm: 3.1,
    consultationFee: 69,
    nextAvailable: "Tomorrow",
    visitTypes: ["clinic"],
    city: "Toronto, ON",
    address: "1487 Danforth Ave, Toronto, ON M4J 1N5",
    bio: "Community family clinic with evening appointments and prescription renewals.",
  },
  {
    id: "clinic-harbour",
    kind: "clinic",
    name: "Harbourfront Walk-In",
    subtitle: "Urgent care clinic",
    imageUrl: img.clinic3,
    specialties: ["general", "dermatologist", "ent", "pediatrician", "orthopedist", "physiotherapist"],
    languages: ["English", "Mandarin"],
    rating: 4.4,
    reviewCount: 640,
    distanceKm: 1.9,
    consultationFee: 99,
    nextAvailable: "Today",
    visitTypes: ["clinic"],
    city: "Toronto, ON",
    address: "455 Queens Quay W, Toronto, ON M5V 2Y3",
    bio: "Walk-in and reserved slots for non-emergency same-day care.",
  },
  {
    id: "clinic-wellness",
    kind: "clinic",
    name: "Bayview Women’s Wellness",
    subtitle: "Gynaecology & sexual health",
    imageUrl: img.clinic4,
    specialties: ["gynecologist", "sexologist", "urologist"],
    languages: ["English", "French"],
    rating: 4.8,
    reviewCount: 318,
    distanceKm: 4.2,
    consultationFee: 89,
    nextAvailable: "Tomorrow",
    visitTypes: ["clinic", "virtual"],
    city: "North York, ON",
    address: "2401 Yonge St, Toronto, ON M4P 3H1",
    bio: "Dedicated women’s health clinic with discreet virtual follow-ups.",
  },

  /* ── Hospitals ───────────────────────────────────────── */
  {
    id: "hosp-sunnybrook",
    kind: "hospital",
    name: "Sunnybrook Health Sciences",
    subtitle: "Outpatient specialty clinics",
    imageUrl: img.hospital1,
    specialties: ["dermatologist", "endocrinologist", "gastroenterologist", "psychiatrist", "immunologist", "ophthalmologist", "dentist"],
    languages: ["English", "French"],
    rating: 4.6,
    reviewCount: 1204,
    distanceKm: 8.4,
    consultationFee: 0,
    nextAvailable: "In 2 days",
    visitTypes: ["clinic"],
    city: "Toronto, ON",
    address: "2075 Bayview Ave, Toronto, ON M4N 3M5",
    bio: "Hospital outpatient booking for specialty and chronic-care clinics.",
  },
  {
    id: "hosp-sinai",
    kind: "hospital",
    name: "Mount Sinai Hospital",
    subtitle: "Women’s & ambulatory care",
    imageUrl: img.hospital2,
    specialties: ["gynecologist", "sexologist", "general", "pediatrician"],
    languages: ["English"],
    rating: 4.7,
    reviewCount: 980,
    distanceKm: 2.4,
    consultationFee: 0,
    nextAvailable: "Tomorrow",
    visitTypes: ["clinic"],
    city: "Toronto, ON",
    address: "600 University Ave, Toronto, ON M5G 1X5",
    bio: "Hospital ambulatory clinics including women’s health and urgent outpatient care.",
  },
  {
    id: "hosp-toronto-general",
    kind: "hospital",
    name: "Toronto General Hospital",
    subtitle: "Outpatient & diagnostics",
    imageUrl: img.hospital3,
    specialties: ["gastroenterologist", "endocrinologist", "general", "nutritionist"],
    languages: ["English"],
    rating: 4.5,
    reviewCount: 1102,
    distanceKm: 2.6,
    consultationFee: 0,
    nextAvailable: "In 2 days",
    visitTypes: ["clinic"],
    city: "Toronto, ON",
    address: "200 Elizabeth St, Toronto, ON M5G 2C4",
    bio: "Major hospital campus with bookable outpatient specialty visits.",
  },
  {
    id: "hosp-camh",
    kind: "hospital",
    name: "CAMH",
    subtitle: "Mental health campus",
    imageUrl: img.hospital4,
    specialties: ["psychiatrist", "neurologist"],
    languages: ["English", "French"],
    rating: 4.4,
    reviewCount: 756,
    distanceKm: 3.7,
    consultationFee: 0,
    nextAvailable: "Tomorrow",
    visitTypes: ["clinic", "virtual"],
    city: "Toronto, ON",
    address: "1001 Queen St W, Toronto, ON M6J 1H4",
    bio: "Hospital outpatient psychiatry and virtual mental-health follow-ups.",
  },
];

/** Detail-page enrichment merged onto PROVIDERS below. */
const DETAIL: Record<string, Partial<CareProvider>> = {
  "dr-shah": {
    about:
      "Dr. Shah provides thorough family-medicine visits with a focus on chronic care plans and women’s health. Patients appreciate clear follow-ups and same-week renewals when clinically appropriate.",
    focusAreas: ["Family medicine", "Women’s health", "Chronic care", "Medication renewals"],
    education: ["MD, University of Toronto", "CCFP · College of Family Physicians of Canada"],
    affiliatedFacilityIds: ["clinic-pp-toronto", "hosp-sinai"],
    hours: "Mon–Fri 9am–5pm · Virtual evenings",
    phone: "1-855-950-7226",
  },
  "dr-chen": {
    about:
      "Dr. Chen offers virtual psychiatry for anxiety, mood, and sleep concerns, with structured follow-ups and coordination back to your family doctor when needed.",
    focusAreas: ["Anxiety", "Mood", "Sleep", "Adult psychiatry"],
    education: ["MD, UBC", "FRCPC · Psychiatry"],
    affiliatedFacilityIds: ["hosp-camh"],
    hours: "Tue–Sat · Virtual only",
    phone: "1-855-950-7226",
  },
  "dr-okafor": {
    about:
      "Dermatology-forward family practice covering acne, rashes, and discreet sexual-health visits — in clinic or by secure video.",
    focusAreas: ["Dermatology", "Sexual health", "General practice"],
    education: ["MD, McGill", "CCFP"],
    affiliatedFacilityIds: ["clinic-harbour"],
    hours: "Mon–Thu 10am–6pm",
    phone: "1-855-950-7226",
  },
  "dr-nguyen": {
    about:
      "Nurse practitioner care for digestive concerns, ongoing therapy plans, and prescription renewals with close pharmacist collaboration.",
    focusAreas: ["Digestive health", "Therapy plans", "Renewals"],
    education: ["NP · University of Toronto", "Primary health care"],
    affiliatedFacilityIds: ["clinic-pp-toronto", "clinic-greenwood"],
    hours: "Mon–Fri 8am–4pm",
    phone: "1-855-950-7226",
  },
  "dr-patel": {
    about:
      "Gynaecology and sexual-health visits with a warm, thorough approach — including contraception counselling and menstrual-health concerns.",
    focusAreas: ["Gynaecology", "Sexual health", "Contraception"],
    education: ["MD, McMaster", "CCFP"],
    affiliatedFacilityIds: ["clinic-wellness", "hosp-sinai"],
    hours: "Wed–Sat · Clinic & virtual",
    phone: "1-855-950-7226",
  },
  "dr-lee": {
    about:
      "Internal medicine for complex chronic conditions, care coordination across specialists, and urgent outpatient concerns.",
    focusAreas: ["Internal medicine", "Chronic disease", "Care coordination"],
    education: ["MD, University of Ottawa", "Internal medicine"],
    affiliatedFacilityIds: ["hosp-sunnybrook", "hosp-toronto-general"],
    hours: "Mon–Fri 9am–5pm",
    phone: "1-855-950-7226",
  },
  "dr-singh": {
    about:
      "Gastroenterology-focused visits for reflux, IBS, and everyday digestive concerns with clear next-step plans.",
    focusAreas: ["Reflux", "IBS", "Digestive health"],
    education: ["MD, University of Alberta", "Gastroenterology interest"],
    affiliatedFacilityIds: ["hosp-toronto-general", "clinic-greenwood"],
    hours: "Tue–Fri 9am–4pm",
    phone: "1-855-950-7226",
  },
  "dr-martin": {
    about:
      "Adult psychiatry with same-week virtual follow-ups and collaborative care with your existing providers.",
    focusAreas: ["Adult psychiatry", "Mood", "Anxiety"],
    education: ["MD, Université de Montréal", "FRCPC · Psychiatry"],
    affiliatedFacilityIds: ["hosp-camh"],
    hours: "Mon–Thu · Virtual",
    phone: "1-855-950-7226",
  },
  "clinic-pp-toronto": {
    about:
      "PocketPills Care Clinic is our flagship downtown site for same-day and scheduled visits. Book a consult, lab draw, or minor procedure — then manage prescriptions in the same app.",
    hours: "Mon–Sat 8am–8pm · Sun 10am–4pm",
    phone: "1-855-950-7226",
    staffIds: ["dr-shah", "dr-nguyen", "dr-okafor"],
    amenities: [
      "On-site pharmacy desk",
      "Private consult rooms",
      "Accessible entrance",
      "Wi-Fi & charging",
      "Wheelchair accessible",
      "Virtual follow-up rooms",
    ],
    services: [
      { id: "consult", kind: "consult", label: "Doctor consult", blurb: "Book with an on-site clinician for new or follow-up concerns.", feeFrom: 79 },
      { id: "lab", kind: "lab", label: "Lab & bloodwork", blurb: "Routine bloodwork and sample collection with results in your account.", feeFrom: 0 },
      { id: "diagnostics", kind: "diagnostics", label: "Diagnostics", blurb: "Point-of-care tests and screening panels.", feeFrom: 49 },
      { id: "pharmacy", kind: "pharmacy", label: "Pharmacy pickup", blurb: "Same-day pickup or free delivery after your visit.", feeFrom: 0 },
    ],
  },
  "clinic-greenwood": {
    about:
      "Neighbourhood family clinic with extended evening hours, prescription renewals, and team-based chronic-care visits.",
    hours: "Mon–Fri 9am–8pm · Sat 9am–2pm",
    phone: "416-555-0142",
    staffIds: ["dr-nguyen", "dr-singh", "dr-lee"],
    amenities: ["Evening appointments", "Family exam rooms", "On-site parking", "Lab draw station"],
    services: [
      { id: "consult", kind: "consult", label: "Family consult", blurb: "Book a family physician or NP for everyday care.", feeFrom: 69 },
      { id: "lab", kind: "lab", label: "Lab services", blurb: "Bloodwork and specimen collection on site.", feeFrom: 0 },
      { id: "diagnostics", kind: "diagnostics", label: "Screening", blurb: "Basic screening and monitoring panels.", feeFrom: 39 },
    ],
  },
  "clinic-harbour": {
    about:
      "Walk-in and reserved urgent-care slots for non-emergency same-day concerns near the waterfront.",
    hours: "Daily 8am–10pm",
    phone: "416-555-0198",
    staffIds: ["dr-okafor", "dr-shah"],
    amenities: ["Walk-in desk", "X-ray partner next door", "After-hours care", "Accessible washrooms"],
    services: [
      { id: "consult", kind: "consult", label: "Urgent consult", blurb: "Same-day clinician visits for non-emergency concerns.", feeFrom: 99 },
      { id: "lab", kind: "lab", label: "Urgent labs", blurb: "Priority sample collection when ordered by a clinician.", feeFrom: 0 },
      { id: "imaging", kind: "imaging", label: "Partner imaging", blurb: "Referrals to nearby X-ray and ultrasound.", feeFrom: 0 },
    ],
  },
  "clinic-wellness": {
    about:
      "Dedicated women’s health clinic offering gynaecology consults, sexual-health visits, and discreet virtual follow-ups.",
    hours: "Tue–Sat 9am–6pm",
    phone: "416-555-0177",
    staffIds: ["dr-patel", "dr-shah"],
    amenities: ["Private waiting lounge", "Female clinicians available", "Virtual follow-ups", "On-site counselling room"],
    services: [
      { id: "consult", kind: "consult", label: "Gynaecology consult", blurb: "Book a women’s-health clinician for consults and follow-ups.", feeFrom: 89 },
      { id: "lab", kind: "lab", label: "Women’s health labs", blurb: "Hormone panels, STI screening, and related labs.", feeFrom: 0 },
      { id: "diagnostics", kind: "diagnostics", label: "Screening", blurb: "Pap and related screening coordination.", feeFrom: 49 },
    ],
  },
  "hosp-sunnybrook": {
    about:
      "Major hospital campus with bookable outpatient specialty clinics for chronic care, dermatology, digestive health, and mental-health follow-ups.",
    hours: "Outpatient Mon–Fri 7am–6pm",
    phone: "416-480-6100",
    staffIds: ["dr-lee", "dr-okafor", "dr-singh", "dr-chen"],
    amenities: [
      "Outpatient registration",
      "On-site cafeteria",
      "Parking garage",
      "Pharmacy",
      "Wheelchair accessible",
      "Interpreter services",
    ],
    services: [
      { id: "consult", kind: "consult", label: "Specialty consult", blurb: "Outpatient appointments with hospital-affiliated clinicians.", feeFrom: 0 },
      { id: "lab", kind: "lab", label: "Hospital labs", blurb: "Full laboratory services with requisition.", feeFrom: 0 },
      { id: "surgery", kind: "surgery", label: "Day surgery", blurb: "Book ambulatory / day-surgery assessments.", feeFrom: 0 },
      { id: "imaging", kind: "imaging", label: "Imaging", blurb: "X-ray, ultrasound, and outpatient imaging bookings.", feeFrom: 0 },
      { id: "diagnostics", kind: "diagnostics", label: "Diagnostics", blurb: "Specialist diagnostic clinics and testing.", feeFrom: 0 },
    ],
  },
  "hosp-sinai": {
    about:
      "Women’s and ambulatory care hospital campus with outpatient clinics, urgent ambulatory visits, and specialist consultants.",
    hours: "Outpatient Mon–Fri 8am–5pm",
    phone: "416-586-4800",
    staffIds: ["dr-patel", "dr-shah", "dr-lee"],
    amenities: ["Women’s health pavilion", "Ambulatory surgery", "Parking", "Family waiting areas", "Pharmacy"],
    services: [
      { id: "consult", kind: "consult", label: "Ambulatory consult", blurb: "Book outpatient clinicians including women’s health.", feeFrom: 0 },
      { id: "lab", kind: "lab", label: "Labs", blurb: "Hospital laboratory services.", feeFrom: 0 },
      { id: "surgery", kind: "surgery", label: "Ambulatory surgery", blurb: "Day procedures and pre-op assessments.", feeFrom: 0 },
      { id: "diagnostics", kind: "diagnostics", label: "Diagnostics", blurb: "Outpatient diagnostic clinics.", feeFrom: 0 },
    ],
  },
  "hosp-toronto-general": {
    about:
      "Downtown hospital campus for outpatient specialty visits, diagnostics, and digestive / chronic-care clinics.",
    hours: "Outpatient Mon–Fri 7am–6pm",
    phone: "416-340-4800",
    staffIds: ["dr-singh", "dr-lee", "dr-nguyen"],
    amenities: ["Multiple outpatient towers", "Labs & imaging", "Food court", "Parking", "TTC accessible"],
    services: [
      { id: "consult", kind: "consult", label: "Outpatient consult", blurb: "Book specialty outpatient appointments.", feeFrom: 0 },
      { id: "lab", kind: "lab", label: "Labs", blurb: "Comprehensive hospital labs.", feeFrom: 0 },
      { id: "surgery", kind: "surgery", label: "Surgery assessment", blurb: "Pre-operative and day-surgery pathways.", feeFrom: 0 },
      { id: "imaging", kind: "imaging", label: "Imaging", blurb: "Advanced imaging bookings with requisition.", feeFrom: 0 },
    ],
  },
  "hosp-camh": {
    about:
      "Mental-health hospital campus offering outpatient psychiatry, virtual follow-ups, and collaborative care pathways.",
    hours: "Outpatient Mon–Fri 8am–5pm",
    phone: "416-535-8501",
    staffIds: ["dr-chen", "dr-martin"],
    amenities: ["Quiet waiting spaces", "Virtual visit pods", "Pharmacy", "Peer support desk", "Accessible campus"],
    services: [
      { id: "consult", kind: "consult", label: "Psychiatry consult", blurb: "Outpatient psychiatry appointments and virtual follow-ups.", feeFrom: 0 },
      { id: "diagnostics", kind: "diagnostics", label: "Assessments", blurb: "Structured mental-health assessments.", feeFrom: 0 },
      { id: "pharmacy", kind: "pharmacy", label: "On-site pharmacy", blurb: "Medication support after your visit.", feeFrom: 0 },
    ],
  },
};

for (const p of PROVIDERS) {
  const extra = DETAIL[p.id];
  if (extra) Object.assign(p, extra);
}

export function getFacilityStaff(facilityId: string): CareProvider[] {
  const facility = getProvider(facilityId);
  if (!facility?.staffIds?.length) return [];
  return facility.staffIds
    .map((id) => getProvider(id))
    .filter((x): x is CareProvider => !!x && x.kind === "doctor");
}

export function getAffiliatedFacilities(doctorId: string): CareProvider[] {
  const doctor = getProvider(doctorId);
  if (!doctor?.affiliatedFacilityIds?.length) return [];
  return doctor.affiliatedFacilityIds
    .map((id) => getProvider(id))
    .filter((x): x is CareProvider => !!x && x.kind !== "doctor");
}

export function serviceKindLabel(kind: FacilityServiceKind): string {
  switch (kind) {
    case "consult":
      return "Consult";
    case "lab":
      return "Lab";
    case "surgery":
      return "Surgery";
    case "diagnostics":
      return "Diagnostics";
    case "imaging":
      return "Imaging";
    case "pharmacy":
      return "Pharmacy";
  }
}

export const CLINICIANS: CareProvider[] = PROVIDERS.filter((p) => p.kind === "doctor");

const STORAGE_KEY = "pp.appointments.v1";

function readStore(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Appointment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(list: Appointment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getAppointments(): Appointment[] {
  return readStore().sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

export function getProvider(id: string): CareProvider | undefined {
  const published = getPublishedCareProvider();
  if (published && published.id === id) return published;
  const nmc = getNmcProvider(id);
  if (nmc) return nmc;
  return PROVIDERS.find((p) => p.id === id);
}

/** Seed + published business overlay (published first) + claimed NMC doctors. */
export function listProviders(): CareProvider[] {
  const published = getPublishedCareProvider();
  const nmc = listPublishedNmcProviders();
  const extra = [published, ...nmc].filter((p): p is CareProvider => Boolean(p));
  const seen = new Set(extra.map((p) => p.id));
  return [...extra, ...PROVIDERS.filter((p) => !seen.has(p.id))];
}

export function getClinician(id: string): CareProvider | undefined {
  return getProvider(id);
}

export function specialtyById(id: SpecialtyId | string | null | undefined): Specialty | undefined {
  if (!id) return undefined;
  return SPECIALTIES.find((s) => s.id === id);
}

export function formatFee(amount: number): string {
  if (amount <= 0) return "Covered / OHIP";
  return `$${amount}`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function filterProviders(opts: {
  kind?: ProviderKind | "all";
  specialtyId?: SpecialtyId;
  visitType?: VisitType;
  query?: string;
  city?: string;
  /** Nearest first when true (default true). */
  sortByDistance?: boolean;
}): CareProvider[] {
  const q = opts.query?.trim().toLowerCase() ?? "";
  const kind = opts.kind && opts.kind !== "all" ? opts.kind : undefined;
  const list = listProviders().filter((p) => {
    if (kind && p.kind !== kind) return false;
    if (opts.specialtyId && !p.specialties.includes(opts.specialtyId)) return false;
    if (opts.visitType && !p.visitTypes.includes(opts.visitType)) return false;
    if (opts.city && !p.city.toLowerCase().includes(opts.city.toLowerCase())) return false;
    if (!q) return true;

    const specialtyLabels = p.specialties
      .map((id) => specialtyById(id)?.label || id)
      .join(" ");
    const haystack = [
      p.name,
      p.subtitle,
      p.city,
      p.bio,
      p.address || "",
      p.kind,
      kindLabel(p.kind),
      specialtyLabels,
      ...p.languages,
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(q)) return true;
    return q.split(/\s+/).every((w) => w.length > 0 && haystack.includes(w));
  });
  if (opts.sortByDistance === false) return list;
  return [...list].sort((a, b) => a.distanceKm - b.distanceKm);
}

export function filterClinicians(opts: {
  specialtyId?: SpecialtyId;
  visitType?: VisitType;
  query?: string;
}): CareProvider[] {
  return filterProviders({ ...opts, kind: "doctor" });
}

export function upcomingDays(count = 7): { date: string; label: string; weekday: string }[] {
  const out: { date: string; label: string; weekday: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const weekday = d.toLocaleDateString("en-CA", { weekday: "short" });
    const label =
      i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
    out.push({ date, label, weekday });
  }
  return out;
}

const MORNING = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"];
const AFTERNOON = ["1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"];

export function slotsFor(providerId: string, date: string): { morning: string[]; afternoon: string[] } {
  const seed = [...providerId, ...date].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const pick = (arr: string[], n: number) => {
    const start = seed % Math.max(1, arr.length - n + 1);
    return arr.slice(start, start + n);
  };
  return {
    morning: pick(MORNING, 4),
    afternoon: pick(AFTERNOON, 4),
  };
}

/** Separate virtual vs in-clinic grids so both visit types can be shown on the detail page. */
export function slotsByVisitType(
  providerId: string,
  date: string,
  visitType: VisitType,
): { morning: string[]; afternoon: string[] } {
  const base = slotsFor(providerId, date);
  if (visitType === "virtual") {
    /* Offset virtual slots slightly so the two grids read as distinct. */
    const shift = (t: string) => {
      const i = [...MORNING, ...AFTERNOON].indexOf(t);
      const pool = [...MORNING, ...AFTERNOON];
      return pool[(i + 1) % pool.length] ?? t;
    };
    return {
      morning: base.morning.map(shift).slice(0, 4),
      afternoon: base.afternoon.map(shift).slice(0, 4),
    };
  }
  return base;
}

export function flattenSlots(slots: { morning: string[]; afternoon: string[] }): string[] {
  return [...slots.morning, ...slots.afternoon];
}

/** Demo health reports the member can attach to a visit. */
export const DEMO_REPORTS = [
  { id: "rep-blood", title: "Bloodwork — Feb 2026", detail: "CBC, lipid panel, A1C", date: "2026-02-12" },
  { id: "rep-rx", title: "Current medications list", detail: "Pharmacy summary PDF", date: "2026-03-01" },
  { id: "rep-img", title: "Chest X-ray report", detail: "Imaging · Sunnybrook", date: "2025-11-18" },
  { id: "rep-allergy", title: "Allergy & conditions summary", detail: "Profile health record", date: "2026-01-05" },
] as const;

/** Prior consult notes / findings the member can share with the clinician. */
export const DEMO_FINDINGS = [
  {
    id: "find-1",
    title: "Follow-up: blood pressure plan",
    detail: "Dr. Shah · Mar 2026 — continue current dose, recheck in 6 weeks.",
    date: "2026-03-10",
  },
  {
    id: "find-2",
    title: "Skin consult notes",
    detail: "Dr. Okafor · Jan 2026 — mild eczema; topical trial.",
    date: "2026-01-22",
  },
  {
    id: "find-3",
    title: "Mental health check-in",
    detail: "Dr. Chen · Dec 2025 — sleep improved; continue therapy plan.",
    date: "2025-12-08",
  },
] as const;

function nextConfirmationNo(): string {
  const n = 1000 + (readStore().length % 9000) + Math.floor(Math.random() * 90);
  return `PP-APPT-${n}`;
}

export function createAppointment(
  input: Omit<Appointment, "id" | "confirmationNo" | "status" | "createdAt" | "clinicianId" | "clinicianName"> & {
    clinicianId?: string;
    clinicianName?: string;
  },
): Appointment {
  const appt: Appointment = {
    ...input,
    clinicianId: input.clinicianId ?? input.providerId,
    clinicianName: input.clinicianName ?? input.providerName,
    id: `appt-${Date.now()}`,
    confirmationNo: nextConfirmationNo(),
    status: "upcoming",
    createdAt: new Date().toISOString(),
  };
  const list = readStore();
  list.unshift(appt);
  writeStore(list);
  return appt;
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus): Appointment | null {
  const list = readStore();
  const i = list.findIndex((a) => a.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], status };
  writeStore(list);
  return list[i];
}

export function appointmentIsPast(a: Appointment): boolean {
  if (a.status === "completed" || a.status === "cancelled") return true;
  const today = new Date().toISOString().slice(0, 10);
  return a.date < today;
}

export function kindLabel(kind: ProviderKind): string {
  if (kind === "doctor") return "Doctor";
  if (kind === "clinic") return "Clinic";
  return "Hospital";
}

export function isSpecialtyId(v: string | null | undefined): v is SpecialtyId {
  return !!v && SPECIALTIES.some((s) => s.id === v);
}
