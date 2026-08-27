import type { Treatment } from "@/lib/data";
import type { CareProvider, SpecialtyId } from "@/lib/appointments";
import { filterClinicians } from "@/lib/appointments";

export type TreatmentGuide = {
  intro: string;
  symptoms: string[];
  cycle: { title: string; detail: string }[];
  duration: string;
  ifFails: string;
  prevention: string[];
};

const CATEGORY_SPECIALTY: Record<string, SpecialtyId> = {
  Proctology: "gastroenterologist",
  "General Surgery": "gastroenterologist",
  Ophthalmology: "ophthalmologist",
  Urology: "urologist",
  "Cosmetic Surgery": "dermatologist",
  Orthopedics: "orthopedist",
  "Robotic Surgeries": "urologist",
  Oncology: "general",
  Dental: "dentist",
};

const SLUG_SPECIALTY: Record<string, SpecialtyId> = {
  piles: "gastroenterologist",
  "anal-fistula": "gastroenterologist",
  "anal-fissure": "gastroenterologist",
  "pilonidal-sinus": "gastroenterologist",
  "perianal-abscess": "gastroenterologist",
  hernia: "gastroenterologist",
  "robotic-hernia": "gastroenterologist",
  gallstone: "gastroenterologist",
  appendicitis: "gastroenterologist",
  "varicose-veins": "general",
  lasik: "ophthalmologist",
  cataract: "ophthalmologist",
  glaucoma: "ophthalmologist",
  "squint-eye": "ophthalmologist",
  "kidney-stone": "urologist",
  turp: "urologist",
  hydrocele: "urologist",
  circumcision: "urologist",
  varicocele: "urologist",
  urethroplasty: "urologist",
  "robotic-prostatectomy": "urologist",
  "prostate-cancer": "urologist",
  "hair-transplant": "dermatologist",
  gynaecomastia: "dermatologist",
  rhinoplasty: "dermatologist",
  liposuction: "dermatologist",
  "breast-lift": "dermatologist",
  "knee-replacement": "orthopedist",
  "knee-arthroscopy": "orthopedist",
  "shoulder-arthroscopy": "orthopedist",
  "lump-in-breast": "gynecologist",
  "breast-cancer": "gynecologist",
  "cervical-cancer": "gynecologist",
  "lung-cancer": "pulmonologist",
  "dental-implants": "dentist",
  "root-canal": "dentist",
  "teeth-whitening": "dentist",
};

const GUIDES: Record<string, TreatmentGuide> = {
  piles: {
    intro:
      "Piles (haemorrhoids) are swollen veins in the rectum or anus. They can bleed, itch, or feel like a lump. Many cases settle with medicine and everyday changes. A specialist confirms the type and the next step.",
    symptoms: [
      "Bright red bleeding after a stool",
      "Itching or irritation around the anus",
      "Pain when sitting or passing stool",
      "A soft lump near the anus",
      "Mucus on the stool",
    ],
    cycle: [
      {
        title: "Consult",
        detail: "A specialist reviews symptoms, diet, and any exam findings.",
      },
      {
        title: "First-line care",
        detail: "Fibre, fluids, stool softeners, and medicine for swelling and pain.",
      },
      {
        title: "Procedure if needed",
        detail: "Banding or a short day procedure, then a follow-up visit.",
      },
    ],
    duration:
      "Many people feel better in 1–2 weeks with medicine and diet. If a procedure is needed, it is usually a same-day visit with a few days of rest.",
    ifFails:
      "If bleeding, pain, or a lump does not settle, the specialist discusses banding or surgery. Piles can return, so prevention after treatment matters as much as the procedure.",
    prevention: [
      "Drink enough water and eat fibre every day",
      "Do not strain or sit long on the toilet",
      "Keep stools soft; ask before using harsh laxatives",
      "Move daily and avoid long stretches of sitting",
    ],
  },
  "varicose-veins": {
    intro:
      "Varicose veins are enlarged, twisted veins, usually in the legs. They can ache, swell, or feel heavy. Care starts with a specialist review, then compression, lifestyle changes, or a planned procedure.",
    symptoms: [
      "Visible bulging veins in the legs",
      "Aching or heaviness after standing",
      "Swelling around the ankles",
      "Itching or skin darkening near the vein",
      "Restless legs at night",
    ],
    cycle: [
      {
        title: "Consult",
        detail: "The specialist checks vein pattern, swelling, and skin changes.",
      },
      {
        title: "Support first",
        detail: "Compression, walking, and elevating the legs when you rest.",
      },
      {
        title: "Treat if needed",
        detail: "Office procedures or surgery when veins stay painful or worsen.",
      },
    ],
    duration:
      "Supportive care can ease heaviness within days. A procedure, if advised, is often a short visit with walking the same day and a check in 1–2 weeks.",
    ifFails:
      "If pain, swelling, or skin changes continue, the specialist reviews imaging and discusses closing or removing the affected veins.",
    prevention: [
      "Walk daily and avoid standing still for long",
      "Raise your legs when sitting for a while",
      "Maintain a healthy weight",
      "Use compression if the specialist recommends it",
    ],
  },
  hernia: {
    intro:
      "A hernia is a bulge where tissue pushes through a weak spot in the abdominal wall. It may be painless at first. A specialist confirms the type and whether watchful waiting or a planned repair is safer.",
    symptoms: [
      "A bulge in the groin or abdomen",
      "Ache that worsens with lifting or coughing",
      "Heaviness at the end of the day",
      "Bulge that reduces when you lie down",
      "Sudden severe pain or vomiting (urgent)",
    ],
    cycle: [
      {
        title: "Consult",
        detail: "Exam confirms the type and whether it is reducible.",
      },
      {
        title: "Plan",
        detail: "Watchful waiting for some hernias; planned repair for others.",
      },
      {
        title: "Repair and recover",
        detail: "Day procedure in most cases, then limited lifting for a few weeks.",
      },
    ],
    duration:
      "A consult is usually one visit. If repair is advised, recovery is often 1–3 weeks for light activity, longer before heavy lifting.",
    ifFails:
      "If the bulge becomes stuck, painful, or you have vomiting, seek urgent care. After repair, a repeat bulge is uncommon but possible — the specialist explains warning signs.",
    prevention: [
      "Avoid heavy lifting until you are cleared",
      "Treat constipation so you do not strain",
      "Keep a steady, healthy weight",
      "Stop smoking if you smoke — it slows healing",
    ],
  },
  lasik: {
    intro:
      "LASIK reshapes the cornea so you can see more clearly without glasses or contacts. Not every eye is a candidate. A specialist maps the eye, then you decide together.",
    symptoms: [
      "Blurred distance or near vision",
      "Reliance on glasses or contacts",
      "Glare or halos at night (to discuss)",
      "Dry, tired eyes with screens",
      "Uneven prescription between eyes",
    ],
    cycle: [
      {
        title: "Eye mapping",
        detail: "Exam, corneal thickness, and a candidacy check.",
      },
      {
        title: "Procedure",
        detail: "A short outpatient laser visit if you are a candidate.",
      },
      {
        title: "Settle and check",
        detail: "Vision often clears in days; follow-up confirms stability.",
      },
    ],
    duration:
      "The laser visit is brief. Many people return to desk work in 1–3 days. Full checks usually run over a few weeks.",
    ifFails:
      "If you are not a candidate, or vision is not as expected, the specialist discusses glasses, contacts, or another procedure. Enhancement is sometimes an option after the eye settles.",
    prevention: [
      "Do not rub your eyes after the procedure",
      "Use the drops exactly as prescribed",
      "Wear UV-safe sunglasses outdoors",
      "Keep follow-up visits even if you feel fine",
    ],
  },
  gallstone: {
    intro:
      "Gallstones are hard deposits in the gallbladder. They may cause no symptoms, or sudden pain after a fatty meal. A specialist confirms whether medicines, watchful waiting, or gallbladder removal is appropriate.",
    symptoms: [
      "Pain in the upper right abdomen after meals",
      "Pain that radiates to the shoulder or back",
      "Nausea or bloating after fatty food",
      "Indigestion that keeps returning",
      "Fever or yellowing of the eyes (urgent)",
    ],
    cycle: [
      {
        title: "Consult",
        detail: "History, exam, and imaging if needed.",
      },
      {
        title: "Calm the attack",
        detail: "Pain control, diet changes, and treating infection if present.",
      },
      {
        title: "Decide on surgery",
        detail: "Many symptomatic stones are treated with planned gallbladder removal.",
      },
    ],
    duration:
      "A painful attack often eases in hours to a day with care. If surgery is planned, it is usually a short stay with light activity in 1–2 weeks.",
    ifFails:
      "If pain, fever, or jaundice continues, you may need urgent imaging and hospital care. After removal, most people eat a normal diet; a few need longer fat restriction.",
    prevention: [
      "Eat regular meals; avoid very fatty binge meals",
      "Keep a gradual, healthy weight",
      "Stay hydrated",
      "Seek care early if pain returns with fever",
    ],
  },
  "anal-fistula": {
    intro:
      "An anal fistula is a small tunnel from inside the anal canal to the skin. It often follows an abscess. It rarely heals on its own, so a specialist plans the right procedure and aftercare.",
    symptoms: [
      "A small opening near the anus",
      "Ongoing discharge or spotting",
      "Pain or swelling that comes and goes",
      "Skin irritation around the opening",
      "Fever with a new abscess",
    ],
    cycle: [
      { title: "Consult", detail: "Exam maps the tract and any active infection." },
      { title: "Treat infection", detail: "Drain an abscess first if one is present." },
      { title: "Repair", detail: "A planned procedure, then wound care and follow-up." },
    ],
    duration:
      "Infection is treated first. Repair is usually a day visit. Wound healing can take a few weeks depending on the tract.",
    ifFails:
      "If discharge or a new abscess returns, the specialist re-maps the tract. Complex fistulas may need staged procedures rather than one visit.",
    prevention: [
      "Do not ignore a perianal abscess — get it drained",
      "Keep the area clean and dry after treatment",
      "Avoid straining; keep stools soft",
      "Attend every follow-up until the wound has closed",
    ],
  },
  cataract: {
    intro:
      "A cataract is clouding of the eye’s natural lens. Vision becomes hazy, glare increases, and colours dull. Surgery replaces the lens when daily life is affected.",
    symptoms: [
      "Cloudy or blurred vision",
      "Glare from headlights at night",
      "Colours looking faded",
      "Frequent changes in glasses",
      "Trouble reading or recognising faces",
    ],
    cycle: [
      { title: "Eye exam", detail: "Confirms the cataract and rules out other causes." },
      { title: "Lens surgery", detail: "A short outpatient procedure when you are ready." },
      { title: "Recover", detail: "Drops, a shield at night, and a vision check." },
    ],
    duration:
      "Surgery is usually under an hour. Many people notice clearer vision in days. Full checks run over a few weeks.",
    ifFails:
      "If vision stays cloudy, the specialist looks for other eye disease or a film behind the new lens, which can be treated in clinic.",
    prevention: [
      "Wear UV-safe sunglasses outdoors",
      "Manage diabetes and blood pressure",
      "Do not smoke",
      "Have regular eye exams after age 50",
    ],
  },
  "kidney-stone": {
    intro:
      "Kidney stones are hard deposits that form in the urinary tract. Small stones may pass with fluids and pain control. Larger ones need a specialist plan.",
    symptoms: [
      "Sharp pain in the back or side",
      "Pain that comes in waves",
      "Blood in the urine",
      "Nausea with the pain",
      "Burning or frequent urination",
    ],
    cycle: [
      { title: "Consult", detail: "Pain control, urine tests, and imaging if needed." },
      { title: "Pass or treat", detail: "Fluids and medicine for small stones; procedure for larger ones." },
      { title: "Prevent the next", detail: "Drink more, and adjust diet based on stone type." },
    ],
    duration:
      "A small stone may pass in a few days. Procedures are often same-day. Prevention is ongoing.",
    ifFails:
      "If pain, fever, or blocked urine continues, you may need urgent drainage. Recurring stones need a metabolic work-up, not only another procedure.",
    prevention: [
      "Drink enough water throughout the day",
      "Do not overdo salt",
      "Ask before cutting calcium — most people should not",
      "Share any previous stone analysis with the specialist",
    ],
  },
  "knee-replacement": {
    intro:
      "Knee replacement is for advanced joint damage when pain and stiffness limit walking, sleep, or daily life. A specialist confirms you have tried non-surgical care first.",
    symptoms: [
      "Knee pain at rest or at night",
      "Stiffness that makes stairs hard",
      "Swelling after short walks",
      "A grinding or locking feeling",
      "Pain that no longer responds to medicine",
    ],
    cycle: [
      { title: "Consult", detail: "Exam, X-rays, and a review of what you have already tried." },
      { title: "Prepare", detail: "Physio, medical clearance, and a planned surgery date." },
      { title: "Replace and rehab", detail: "Hospital stay, then weeks of guided physio." },
    ],
    duration:
      "Hospital stay is often a few days. Walking with support starts early. Most people need several weeks of physio before daily life feels easy.",
    ifFails:
      "If pain or stiffness continues after rehab, the specialist checks implant position, infection, and physio progress. Revision is uncommon and planned carefully.",
    prevention: [
      "Keep a healthy weight to reduce joint load",
      "Do the physio even on good days",
      "Avoid twisting sports until you are cleared",
      "Treat swelling early rather than pushing through",
    ],
  },
  "hair-transplant": {
    intro:
      "A hair transplant moves your own follicles to thinning areas. It is a planned cosmetic procedure. A specialist checks donor hair, pattern, and whether medical treatment should come first.",
    symptoms: [
      "Receding hairline",
      "Thinning at the crown",
      "Widening part",
      "Family pattern of hair loss",
      "Shedding that has been stable enough to plan",
    ],
    cycle: [
      { title: "Consult", detail: "Maps donor area, density, and medical options." },
      { title: "Procedure", detail: "Grafts are placed in a planned pattern." },
      { title: "Grow-in", detail: "Shed, then new growth over several months." },
    ],
    duration:
      "The procedure is a day visit. Transplanted hairs often shed first; visible growth is typically 3–9 months, with a later density check.",
    ifFails:
      "If density is less than expected, the specialist reviews technique, donor limits, and medical therapy. A second session is sometimes planned after growth is complete.",
    prevention: [
      "Treat medical hair loss if advised, before or after transplant",
      "Do not smoke around the procedure",
      "Protect the scalp from sun while it heals",
      "Follow washing and sleeping instructions exactly",
    ],
  },
  "anal-fissure": {
    intro:
      "An anal fissure is a small tear in the lining of the anus. It causes sharp pain and bright bleeding with stools. Most acute fissures heal with softening stools and medicine.",
    symptoms: [
      "Sharp pain during and after a stool",
      "Bright red blood on the paper",
      "A tight, burning feeling",
      "A small skin tag near the tear",
      "Avoiding stools because of pain",
    ],
    cycle: [
      { title: "Consult", detail: "Confirms a fissure and rules out other causes." },
      { title: "Heal", detail: "Stool softeners, sitz baths, and ointment to relax the muscle." },
      { title: "Procedure if chronic", detail: "A small procedure if the tear does not close." },
    ],
    duration:
      "Many acute fissures improve in 1–4 weeks if stools stay soft. Chronic tears take longer and may need a procedure.",
    ifFails:
      "If pain continues after several weeks of correct care, the specialist discusses a procedure to reduce sphincter pressure so the tear can close.",
    prevention: [
      "Keep stools soft every day",
      "Do not delay going to the toilet",
      "Avoid harsh wiping; pat dry",
      "Continue fibre even after the pain stops",
    ],
  },
};

const CATEGORY_FALLBACK: Record<
  string,
  Pick<TreatmentGuide, "symptoms" | "duration" | "prevention">
> = {
  Proctology: {
    symptoms: ["Pain or bleeding with stools", "A lump or discharge", "Itching or swelling"],
    duration: "A consult is one visit. Medicine may help in days to weeks; a procedure, if needed, is usually a short day visit.",
    prevention: ["Keep stools soft", "Do not strain", "Seek care early if pain or fever starts"],
  },
  "General Surgery": {
    symptoms: ["A lump or swelling", "Pain that worsens with activity", "Nausea or fever with pain"],
    duration: "The specialist confirms whether this is watchful waiting or a planned procedure. Recovery depends on the repair.",
    prevention: ["Avoid heavy lifting until cleared", "Treat constipation", "Keep a steady weight"],
  },
  Ophthalmology: {
    symptoms: ["Blurred or cloudy vision", "Glare, pain, or redness", "Trouble with night driving"],
    duration: "An eye exam is one visit. Procedures are often outpatient, with checks over the following weeks.",
    prevention: ["Wear UV-safe sunglasses", "Keep follow-up visits", "Do not rub treated eyes"],
  },
  Urology: {
    symptoms: ["Pain with urination", "Blood in the urine", "A swelling or change in stream"],
    duration: "Many urology plans start with tests, then medicine or a short procedure.",
    prevention: ["Drink enough water", "Do not ignore fever with urinary pain", "Share prior reports at the consult"],
  },
  "Cosmetic Surgery": {
    symptoms: ["A change you want assessed", "Asymmetry or discomfort", "Skin or contour concern"],
    duration: "A consult maps options and recovery. Procedures are planned; swelling often settles over weeks.",
    prevention: ["Follow aftercare exactly", "Do not smoke around a procedure", "Keep every review visit"],
  },
  Orthopedics: {
    symptoms: ["Joint pain or stiffness", "Swelling after activity", "Pain that limits sleep or stairs"],
    duration: "Non-surgical care is tried first when possible. Surgery, if advised, is followed by weeks of physio.",
    prevention: ["Keep a healthy weight", "Do the prescribed exercises", "Avoid twisting until cleared"],
  },
  "Robotic Surgeries": {
    symptoms: ["A condition already mapped for surgery", "Pain or a mass your doctor has reviewed", "Recovery questions"],
    duration: "Robotic procedures are planned. Hospital stay is often shorter than open surgery, with a staged return to activity.",
    prevention: ["Prepare as instructed", "Walk early after surgery if allowed", "Report fever or sudden pain"],
  },
  Oncology: {
    symptoms: ["A lump, bleeding, or unexplained weight change", "Pain that does not settle", "A finding on a scan or report"],
    duration: "The first visit is to understand the finding and next tests. Treatment timing depends on the diagnosis.",
    prevention: ["Bring prior reports and scans", "Do not delay a new lump or bleeding", "Keep screening visits you are due for"],
  },
  Dental: {
    symptoms: ["Tooth pain or sensitivity", "A missing or damaged tooth", "Gum swelling or bleeding"],
    duration: "Some dental plans are one visit; implants and canals are staged over weeks.",
    prevention: ["Brush and clean between teeth daily", "Do not ignore a cracked tooth", "Keep review visits"],
  },
};

function fallbackGuide(name: string, category: string): TreatmentGuide {
  const extra = CATEGORY_FALLBACK[category];
  return {
    intro: `${name} is reviewed by a specialist through PocketPills. This page covers usual symptoms, how care typically runs, and what to do next. Your specialist confirms what applies to you.`,
    symptoms: extra?.symptoms ?? [
      "A change that has lasted more than a few days",
      "Pain, swelling, or bleeding",
      "Something that is getting worse, not better",
    ],
    cycle: [
      {
        title: "Consult",
        detail: "A specialist reviews your history, reports, and what you want from treatment.",
      },
      {
        title: "Plan",
        detail: "You agree medicines, tests, or a procedure — only what you need.",
      },
      {
        title: "Follow-up",
        detail: "Check recovery, adjust the plan, and cover prevention.",
      },
    ],
    duration:
      extra?.duration ??
      "A consult is one visit. If a procedure is advised, timing and recovery are explained before you pay.",
    ifFails: `If first-line care for ${name} does not help, the specialist discusses the next option with you rather than repeating the same step.`,
    prevention: extra?.prevention ?? [
      "Share prior reports at the consult",
      "Follow the plan for the full course",
      "Return early if pain, fever, or bleeding worsens",
    ],
  };
}

export function treatmentSpecialty(slug: string, category: string): SpecialtyId {
  return SLUG_SPECIALTY[slug] ?? CATEGORY_SPECIALTY[category] ?? "general";
}

export function treatmentGuide(slug: string, name: string, category: string): TreatmentGuide {
  return GUIDES[slug] ?? fallbackGuide(name, category);
}

export function specialistsForTreatment(treatment: Treatment, limit = 5): CareProvider[] {
  const spec = treatmentSpecialty(treatment.slug, treatment.category);
  const primary = filterClinicians({ specialtyId: spec });
  const seen = new Set(primary.map((p) => p.id));
  const extra =
    primary.length >= limit
      ? []
      : filterClinicians({ specialtyId: "general" }).filter((p) => !seen.has(p.id));
  const rank = (p: CareProvider) =>
    p.nextAvailable === "Today" ? 0 : p.nextAvailable === "Tomorrow" ? 1 : 2;
  return [...primary, ...extra]
    .sort((a, b) => rank(a) - rank(b) || a.consultationFee - b.consultationFee)
    .slice(0, limit);
}
