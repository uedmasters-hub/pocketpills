export interface Treatment {
  slug: string; name: string; category: string; blurb: string; from: number; eligible: boolean; emoji: string;
}
export const treatments: Treatment[] = [
  { slug: "birth-control", name: "Birth Control", category: "Sexual health", blurb: "Ongoing prescription and free delivery, renewed automatically.", from: 0, eligible: true, emoji: "💊" },
  { slug: "acne", name: "Acne", category: "Dermatology", blurb: "Prescription treatments for clearer skin, assessed online.", from: 20, eligible: true, emoji: "✨" },
  { slug: "uti", name: "UTI", category: "Everyday care", blurb: "Fast assessment and treatment for urinary tract infections.", from: 25, eligible: true, emoji: "💧" },
  { slug: "high-blood-pressure", name: "Blood Pressure", category: "Chronic care", blurb: "Continuous monitoring, medication, and pharmacist support.", from: 25, eligible: true, emoji: "❤️" },
  { slug: "diabetes", name: "Diabetes", category: "Chronic care", blurb: "Long-term management with refills, reminders, and check-ins.", from: 30, eligible: true, emoji: "🩸" },
  { slug: "acid-reflux", name: "Acid Reflux", category: "Digestive", blurb: "Manage heartburn and GERD with a tailored plan.", from: 22, eligible: true, emoji: "🔥" },
];

export type EntryIconKey = "treatment" | "fill" | "transfer" | "explore";
export interface EntryPoint { id: EntryIconKey; title: string; desc: string; to: string; tile: string; fg: string; }
export const entryPoints: EntryPoint[] = [
  { id: "treatment", title: "Doctor-led treatment", desc: "Get assessed online and prescribed by a Canadian clinician.", to: "/find-care", tile: "linear-gradient(135deg,#2DD4BF,#14B8A6)", fg: "#ffffff" },
  { id: "fill", title: "Fill your prescription", desc: "Already have a prescription? We'll fill and deliver it free.", to: "/fill", tile: "linear-gradient(135deg,#3E3985,#272451)", fg: "#ffffff" },
  { id: "transfer", title: "Transfer a prescription", desc: "Move your medications from another pharmacy—we handle it.", to: "/transfer", tile: "linear-gradient(135deg,#7C74BC,#4A44A0)", fg: "#ffffff" },
  { id: "explore", title: "Explore medications", desc: "Search prices, coverage, and info on 5,000+ medications.", to: "/drug", tile: "linear-gradient(135deg,#C7C3E5,#A5A0D3)", fg: "#322E6B" },
];

/* ── Medications Index ──────────────────────────────────── */
export const therapeuticClasses = [
  "Alimentary tract & metabolism",
  "Blood & blood-forming organs",
  "Cardiovascular system",
  "Dermatologicals",
  "Genito-urinary & sex hormones",
  "Systemic hormonal preparations",
  "Antiinfectives for systemic use",
  "Antineoplastic & immunomodulating",
  "Musculo-skeletal system",
  "Nervous system",
  "Antiparasitic products",
  "Respiratory system",
  "Sensory organs",
  "Various",
] as const;
export type TherapeuticClass = (typeof therapeuticClasses)[number];

export interface Drug {
  slug: string; name: string; generic?: string; cls: TherapeuticClass;
  forms: string[]; dosages: string[]; manufacturer: string; coverage: number; price: number; rx: boolean;
}

export const drugs: Drug[] = [
  { slug: "abilify", name: "Abilify", generic: "Aripiprazole", cls: "Nervous system", forms: ["Tablet"], dosages: ["5mg","10mg","15mg","20mg"], manufacturer: "Otsuka", coverage: 55, price: 48, rx: true },
  { slug: "accutane", name: "Accutane", generic: "Isotretinoin", cls: "Dermatologicals", forms: ["Capsule"], dosages: ["10mg","20mg","30mg","40mg"], manufacturer: "Cipher Pharmaceuticals", coverage: 60, price: 42, rx: true },
  { slug: "acetaminophen", name: "Acetaminophen", cls: "Nervous system", forms: ["Tablet","Liquid"], dosages: ["325mg","500mg"], manufacturer: "Various", coverage: 0, price: 8, rx: false },
  { slug: "advair", name: "Advair Diskus", generic: "Fluticasone/Salmeterol", cls: "Respiratory system", forms: ["Inhaler"], dosages: ["100/50","250/50","500/50"], manufacturer: "GSK", coverage: 70, price: 64, rx: true },
  { slug: "alysena", name: "Alysena", generic: "Ethinyl estradiol/Levonorgestrel", cls: "Genito-urinary & sex hormones", forms: ["Tablet"], dosages: ["0.1/0.02mg"], manufacturer: "Apotex", coverage: 80, price: 18, rx: true },
  { slug: "amoxicillin", name: "Amoxicillin", cls: "Antiinfectives for systemic use", forms: ["Capsule","Liquid"], dosages: ["250mg","500mg"], manufacturer: "Various", coverage: 60, price: 15, rx: true },
  { slug: "atorvastatin", name: "Atorvastatin", generic: "Atorvastatin", cls: "Cardiovascular system", forms: ["Tablet"], dosages: ["10mg","20mg","40mg","80mg"], manufacturer: "Pfizer", coverage: 65, price: 14, rx: true },
  { slug: "biktarvy", name: "Biktarvy", cls: "Antiinfectives for systemic use", forms: ["Tablet"], dosages: ["50/200/25mg"], manufacturer: "Gilead", coverage: 75, price: 120, rx: true },
  { slug: "ceftin", name: "Ceftin", generic: "Cefuroxime", cls: "Antiinfectives for systemic use", forms: ["Tablet"], dosages: ["250mg","500mg"], manufacturer: "GSK", coverage: 55, price: 26, rx: true },
  { slug: "cipralex", name: "Cipralex", generic: "Escitalopram", cls: "Nervous system", forms: ["Tablet"], dosages: ["10mg","20mg"], manufacturer: "Lundbeck", coverage: 60, price: 22, rx: true },
  { slug: "diclofenac", name: "Diclofenac", cls: "Musculo-skeletal system", forms: ["Tablet","Gel"], dosages: ["25mg","50mg"], manufacturer: "Various", coverage: 50, price: 16, rx: true },
  { slug: "escitalopram", name: "Escitalopram", cls: "Nervous system", forms: ["Tablet"], dosages: ["10mg","20mg"], manufacturer: "Various", coverage: 60, price: 16, rx: true },
  { slug: "finasteride", name: "Finasteride", cls: "Genito-urinary & sex hormones", forms: ["Tablet"], dosages: ["1mg","5mg"], manufacturer: "Various", coverage: 40, price: 29, rx: true },
  { slug: "jardiance", name: "Jardiance", generic: "Empagliflozin", cls: "Alimentary tract & metabolism", forms: ["Tablet"], dosages: ["10mg","25mg"], manufacturer: "Boehringer Ingelheim", coverage: 70, price: 96, rx: true },
  { slug: "lantus", name: "Lantus", generic: "Insulin glargine", cls: "Alimentary tract & metabolism", forms: ["Injection"], dosages: ["100u/mL"], manufacturer: "Sanofi", coverage: 80, price: 88, rx: true },
  { slug: "levothyroxine", name: "Levothyroxine", cls: "Systemic hormonal preparations", forms: ["Tablet"], dosages: ["25mcg","50mcg","100mcg","150mcg"], manufacturer: "Various", coverage: 65, price: 11, rx: true },
  { slug: "loniten", name: "Minoxidil", generic: "Minoxidil", cls: "Dermatologicals", forms: ["Topical","Tablet"], dosages: ["2%","5%"], manufacturer: "Various", coverage: 30, price: 24, rx: true },
  { slug: "metformin", name: "Metformin", cls: "Alimentary tract & metabolism", forms: ["Tablet"], dosages: ["500mg","850mg","1000mg"], manufacturer: "Various", coverage: 65, price: 10, rx: true },
  { slug: "minocycline", name: "Minocycline", cls: "Antiinfectives for systemic use", forms: ["Capsule"], dosages: ["50mg","100mg"], manufacturer: "Various", coverage: 55, price: 20, rx: true },
  { slug: "modafinil", name: "Modafinil", cls: "Nervous system", forms: ["Tablet"], dosages: ["100mg","200mg"], manufacturer: "Various", coverage: 45, price: 54, rx: true },
  { slug: "mounjaro", name: "Mounjaro", generic: "Tirzepatide", cls: "Alimentary tract & metabolism", forms: ["Injection"], dosages: ["2.5mg","5mg","7.5mg"], manufacturer: "Eli Lilly", coverage: 50, price: 235, rx: true },
  { slug: "ozempic", name: "Ozempic", generic: "Semaglutide", cls: "Alimentary tract & metabolism", forms: ["Injection"], dosages: ["0.25mg","0.5mg","1mg","2mg"], manufacturer: "Novo Nordisk", coverage: 60, price: 139, rx: true },
  { slug: "pantoprazole", name: "Pantoprazole", cls: "Alimentary tract & metabolism", forms: ["Tablet"], dosages: ["20mg","40mg"], manufacturer: "Various", coverage: 55, price: 13, rx: true },
  { slug: "prednisone", name: "Prednisone", cls: "Systemic hormonal preparations", forms: ["Tablet"], dosages: ["5mg","10mg","50mg"], manufacturer: "Various", coverage: 50, price: 12, rx: true },
  { slug: "ramipril", name: "Ramipril", cls: "Cardiovascular system", forms: ["Capsule"], dosages: ["2.5mg","5mg","10mg"], manufacturer: "Various", coverage: 65, price: 12, rx: true },
  { slug: "salbutamol", name: "Salbutamol", generic: "Salbutamol", cls: "Respiratory system", forms: ["Inhaler"], dosages: ["100mcg"], manufacturer: "Various", coverage: 60, price: 22, rx: true },
  { slug: "sertraline", name: "Sertraline", cls: "Nervous system", forms: ["Tablet"], dosages: ["25mg","50mg","100mg"], manufacturer: "Various", coverage: 60, price: 16, rx: true },
  { slug: "synthroid", name: "Synthroid", generic: "Levothyroxine", cls: "Systemic hormonal preparations", forms: ["Tablet"], dosages: ["50mcg","75mcg","100mcg"], manufacturer: "Abbott", coverage: 65, price: 15, rx: true },
  { slug: "tetracycline", name: "Tetracycline", cls: "Antiinfectives for systemic use", forms: ["Capsule"], dosages: ["250mg","500mg"], manufacturer: "Various", coverage: 50, price: 18, rx: true },
  { slug: "trulicity", name: "Trulicity", generic: "Dulaglutide", cls: "Alimentary tract & metabolism", forms: ["Injection"], dosages: ["0.75mg","1.5mg"], manufacturer: "Eli Lilly", coverage: 60, price: 175, rx: true },
  { slug: "ventolin", name: "Ventolin", generic: "Salbutamol", cls: "Respiratory system", forms: ["Inhaler"], dosages: ["100mcg"], manufacturer: "GSK", coverage: 60, price: 25, rx: true },
  { slug: "wegovy", name: "Wegovy", generic: "Semaglutide", cls: "Alimentary tract & metabolism", forms: ["Injection"], dosages: ["0.25mg","0.5mg","1.7mg","2.4mg"], manufacturer: "Novo Nordisk", coverage: 45, price: 249, rx: true },
  { slug: "xarelto", name: "Xarelto", generic: "Rivaroxaban", cls: "Blood & blood-forming organs", forms: ["Tablet"], dosages: ["10mg","15mg","20mg"], manufacturer: "Bayer", coverage: 70, price: 92, rx: true },
  { slug: "zoloft", name: "Zoloft", generic: "Sertraline", cls: "Nervous system", forms: ["Tablet"], dosages: ["25mg","50mg","100mg"], manufacturer: "Pfizer", coverage: 60, price: 19, rx: true },
];

/* Educational, generic monograph text (NOT medical advice). */
export function drugMonograph(name: string): { section: string; body: string }[] {
  return [
    { section: "Dosage", body: `Your dose of ${name} is set by your prescriber based on your condition, body weight, and response to treatment. Take ${name} exactly as prescribed, ideally at the same time each day. If you miss a dose, take it when you remember unless it's almost time for the next one—never double up. Do not change your dose without speaking to your care team.` },
    { section: "Side Effects", body: `Most people tolerate ${name} well. Mild effects such as stomach upset, headache, or drowsiness may occur and often settle over time. Contact your pharmacist if side effects are bothersome, and seek urgent care for signs of a serious allergic reaction such as rash, swelling, or trouble breathing.` },
    { section: "Available Form", body: `${name} is dispensed in the strengths and formats shown in the "Available forms" panel. Your prescriber selects the strength that's right for you; your pharmacist can explain how to take or store it.` },
    { section: "Contraindications", body: `Do not take ${name} if you are allergic to it or any of its ingredients. Tell your provider if you are pregnant, planning a pregnancy, or breastfeeding, and about any kidney or liver conditions before starting ${name}.` },
    { section: "Precautions", body: `${name} may interact with other prescription drugs, over-the-counter products, and supplements. Share a full list of everything you take with your pharmacist so any interactions can be reviewed and managed.` },
    { section: "Warnings", body: `Before starting ${name}, inform your provider of any medical conditions, allergies, and current medications. Follow any monitoring your prescriber recommends and report unusual symptoms promptly.` },
  ];
}
