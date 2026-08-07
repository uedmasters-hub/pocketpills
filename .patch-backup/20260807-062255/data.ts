export interface Treatment {
  slug: string;
  name: string;
  category: string;
  blurb: string;
  from: number; // monthly price in CAD
  eligible: boolean;
  emoji: string;
}

export const treatments: Treatment[] = [
  { slug: "cold-flu", name: "Cold & Flu", category: "Everyday care", blurb: "Fast relief for seasonal symptoms, assessed online.", from: 19, eligible: true, emoji: "🤧" },
  { slug: "birth-control", name: "Birth Control", category: "Sexual health", blurb: "Ongoing prescription and free delivery, renewed automatically.", from: 0, eligible: true, emoji: "💊" },
  { slug: "acid-reflux", name: "Acid Reflux", category: "Digestive", blurb: "Manage heartburn and GERD with a tailored plan.", from: 22, eligible: true, emoji: "🔥" },
  { slug: "hair-loss", name: "Hair Loss", category: "Dermatology", blurb: "Evidence-based treatments to slow and reverse thinning.", from: 29, eligible: true, emoji: "💇" },
  { slug: "high-blood-pressure", name: "Blood Pressure", category: "Chronic care", blurb: "Continuous monitoring, medication, and pharmacist support.", from: 25, eligible: true, emoji: "❤️" },
  { slug: "allergies", name: "Allergies", category: "Everyday care", blurb: "Year-round and seasonal allergy management.", from: 18, eligible: true, emoji: "🌾" },
];

export interface Intent {
  id: string;
  label: string;
  desc: string;
  emoji: string;
  to: string;
}

export const intents: Intent[] = [
  { id: "symptoms", label: "I have symptoms", desc: "Describe how you feel and get matched to care", emoji: "🩺", to: "/find-care" },
  { id: "medication", label: "I need medication", desc: "Start a treatment for a specific condition", emoji: "💊", to: "/find-care" },
  { id: "renew", label: "Renew a prescription", desc: "Refill or renew an existing medication", emoji: "🔁", to: "/pharmacy" },
  { id: "transfer", label: "Transfer my pharmacy", desc: "Move prescriptions to PocketPills for free", emoji: "📦", to: "/pharmacy" },
];
