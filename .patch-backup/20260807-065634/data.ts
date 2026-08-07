export interface Treatment {
  slug: string;
  name: string;
  category: string;
  blurb: string;
  from: number;
  eligible: boolean;
  emoji: string;
}

export const treatments: Treatment[] = [
  { slug: "birth-control", name: "Birth Control", category: "Sexual health", blurb: "Ongoing prescription and free delivery, renewed automatically.", from: 0, eligible: true, emoji: "💊" },
  { slug: "acne", name: "Acne", category: "Dermatology", blurb: "Prescription treatments for clearer skin, assessed online.", from: 20, eligible: true, emoji: "✨" },
  { slug: "uti", name: "UTI", category: "Everyday care", blurb: "Fast assessment and treatment for urinary tract infections.", from: 25, eligible: true, emoji: "💧" },
  { slug: "high-blood-pressure", name: "Blood Pressure", category: "Chronic care", blurb: "Continuous monitoring, medication, and pharmacist support.", from: 25, eligible: true, emoji: "❤️" },
  { slug: "diabetes", name: "Diabetes", category: "Chronic care", blurb: "Long-term management with refills, reminders, and check-ins.", from: 30, eligible: true, emoji: "🩸" },
  { slug: "acid-reflux", name: "Acid Reflux", category: "Digestive", blurb: "Manage heartburn and GERD with a tailored plan.", from: 22, eligible: true, emoji: "🔥" },
];

/* The 4 canonical homepage entry points (PocketPills "What would you like to do?"). */
export type EntryIconKey = "treatment" | "fill" | "transfer" | "explore";
export interface EntryPoint {
  id: EntryIconKey;
  title: string;
  desc: string;
  to: string;
  tile: string; // css gradient
  fg: string;   // icon stroke color
}

export const entryPoints: EntryPoint[] = [
  { id: "treatment", title: "Doctor-led treatment", desc: "Get assessed online and prescribed by a Canadian clinician.", to: "/find-care", tile: "linear-gradient(135deg,#2DD4BF,#14B8A6)", fg: "#ffffff" },
  { id: "fill", title: "Fill your prescription", desc: "Already have a prescription? We'll fill and deliver it free.", to: "/fill", tile: "linear-gradient(135deg,#3E3985,#272451)", fg: "#ffffff" },
  { id: "transfer", title: "Transfer a prescription", desc: "Move your medications from another pharmacy—we handle it.", to: "/transfer", tile: "linear-gradient(135deg,#7C74BC,#4A44A0)", fg: "#ffffff" },
  { id: "explore", title: "Explore medications", desc: "Search prices, coverage, and info on thousands of medications.", to: "/medications", tile: "linear-gradient(135deg,#C7C3E5,#A5A0D3)", fg: "#322E6B" },
];

/* Medication catalog for Explore. */
export interface Medication {
  slug: string;
  name: string;
  form: string;
  uses: string;
  from: number;
  rx: boolean;
}

export const medications: Medication[] = [
  { slug: "ramipril", name: "Ramipril", form: "Tablet · 2.5–10mg", uses: "High blood pressure, heart protection", from: 12, rx: true },
  { slug: "metformin", name: "Metformin", form: "Tablet · 500–1000mg", uses: "Type 2 diabetes", from: 10, rx: true },
  { slug: "atorvastatin", name: "Atorvastatin", form: "Tablet · 10–80mg", uses: "High cholesterol", from: 14, rx: true },
  { slug: "sertraline", name: "Sertraline", form: "Tablet · 25–200mg", uses: "Depression, anxiety", from: 16, rx: true },
  { slug: "levothyroxine", name: "Levothyroxine", form: "Tablet · 25–150mcg", uses: "Hypothyroidism", from: 11, rx: true },
  { slug: "pantoprazole", name: "Pantoprazole", form: "Tablet · 20–40mg", uses: "Acid reflux, GERD", from: 13, rx: true },
  { slug: "amoxicillin", name: "Amoxicillin", form: "Capsule · 250–500mg", uses: "Bacterial infections", from: 15, rx: true },
  { slug: "salbutamol", name: "Salbutamol", form: "Inhaler · 100mcg", uses: "Asthma relief", from: 22, rx: true },
];
