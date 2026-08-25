/** Footer Get Started 4×4 — real care services, not booking specialties. */

export interface LandingServiceCategory {
  id: string;
  label: string;
  to: string;
  imageUrl: string;
  /** Icons8 3D Fluency source; local PNG is what the UI loads. */
  sourceUrl: string;
}

function serviceImg(id: string, icons8Name: string): Pick<LandingServiceCategory, "imageUrl" | "sourceUrl"> {
  return {
    imageUrl: `/img/services/${id}.png`,
    sourceUrl: `https://img.icons8.com/3d-fluency/200/${icons8Name}.png`,
  };
}

export const LANDING_SERVICE_CATEGORIES: LandingServiceCategory[] = [
  { id: "hospital", label: "Hospital", to: "/facilities?q=hospital", ...serviceImg("hospital", "hospital-2") },
  { id: "clinic", label: "Clinic", to: "/facilities?q=clinic", ...serviceImg("clinic", "find-clinic") },
  { id: "doctor", label: "Doctor", to: "/doctors", ...serviceImg("doctor", "medical-doctor") },
  { id: "nurse", label: "Nurse", to: "/appointments?q=nurse", ...serviceImg("nurse", "nurse") },
  { id: "home-care", label: "Home care", to: "/appointments?q=home care", ...serviceImg("home-care", "home") },
  { id: "ambulance", label: "Ambulance", to: "/appointments?q=ambulance", ...serviceImg("ambulance", "ambulance") },
  { id: "pharmacy", label: "Pharmacy", to: "/pharmacies", ...serviceImg("pharmacy", "pharmacy-shop") },
  {
    id: "emergency-equipment",
    label: "Emergency equipment",
    to: "/appointments?q=oxygen",
    ...serviceImg("emergency-equipment", "medical-bag"),
  },
  {
    id: "urgent-services",
    label: "Urgent services",
    to: "/appointments?q=urgent",
    ...serviceImg("urgent-services", "delivery"),
  },
  { id: "medicines", label: "Medicines", to: "/drug", ...serviceImg("medicines", "pill") },
  { id: "assistant", label: "Assistant", to: "/appointments?q=assistant", ...serviceImg("assistant", "headset") },
  { id: "labs", label: "Labs", to: "/appointments?q=lab", ...serviceImg("labs", "microscope") },
  { id: "oxygen", label: "Oxygen", to: "/appointments?q=oxygen", ...serviceImg("oxygen", "lungs") },
  { id: "fill", label: "Fill prescription", to: "/fill", ...serviceImg("fill", "document") },
  { id: "transfer", label: "Transfer", to: "/transfer", ...serviceImg("transfer", "synchronize") },
  { id: "treatments", label: "Treatments", to: "/appointments", ...serviceImg("treatments", "heart-with-pulse") },
];
