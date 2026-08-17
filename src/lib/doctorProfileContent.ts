/**
 * Derived doctor-detail copy. Only surfaces registry / listing facts —
 * no invented awards, years, or statistics.
 */

import { specialtyById, type CareProvider, type SpecialtyId } from "@/lib/appointments";
import { getDoctorClaim } from "@/lib/doctorDirectory";
import { treatments } from "@/lib/data";
import type { SpecialisedGroup } from "@/lib/specialisedIn";

export type VerifiedCheck = { label: string };

export type PracticeLocationCard = {
  id: string;
  name: string;
  location: string;
  kind: string;
  visit: string;
  hours?: string;
  href: string;
};

export type HealthArticle = {
  slug: string;
  title: string;
  blurb: string;
  minutes: number;
  author: string;
  imageUrl?: string;
};

export const DOCTOR_REVIEW_TOPICS = [
  "Communication",
  "Care quality",
  "Waiting time",
  "Follow-up",
  "Staff",
  "Overall experience",
] as const;

const CONDITIONS: Partial<Record<SpecialtyId, string[]>> = {
  general: [
    "Fever and infections",
    "Diabetes",
    "Hypertension",
    "Respiratory problems",
    "Digestive problems",
  ],
  endocrinologist: ["Diabetes", "Thyroid disorders", "Hormone-related concerns"],
  cardiologist: ["Hypertension", "Heart-related concerns", "Preventive heart care"],
  pulmonologist: ["Respiratory problems", "Asthma", "Cough and breathing concerns"],
  gastroenterologist: ["Digestive problems", "Acidity and reflux", "Abdominal discomfort"],
  dermatologist: ["Skin concerns", "Acne", "Rashes"],
  gynecologist: ["Women’s health", "Menstrual concerns", "Contraception counselling"],
  pediatrician: ["Childhood infections", "Growth and development", "Fever in children"],
  psychiatrist: ["Anxiety", "Mood concerns", "Sleep problems"],
  neurologist: ["Headache", "Nerve-related concerns"],
  orthopedist: ["Joint pain", "Back and bone concerns"],
  ophthalmologist: ["Vision concerns", "Eye infections"],
  ent: ["Ear, nose and throat concerns", "Sinus problems"],
  urologist: ["Urinary concerns", "Kidney-related symptoms"],
  dentist: ["Tooth pain", "Oral health"],
  immunologist: ["Allergies", "Immunity-related concerns"],
  sexologist: ["Sexual health", "Contraception"],
  nutritionist: ["Diet and nutrition", "Weight-related concerns"],
  physiotherapist: ["Mobility", "Musculoskeletal pain"],
};

const ARTICLES: Partial<Record<SpecialtyId | "default", HealthArticle[]>> = {
  general: [
    {
      slug: "fever-when-to-see-a-doctor",
      title: "Fever and infections: when to see a doctor",
      blurb: "How to tell a passing illness from symptoms that need a clinician.",
      minutes: 4,
      author: "PocketPills",
      imageUrl: "/img/General Physician.png",
    },
    {
      slug: "living-with-hypertension",
      title: "Living with high blood pressure",
      blurb: "Everyday steps that support blood-pressure care between visits.",
      minutes: 5,
      author: "PocketPills",
      imageUrl: "/img/treatments/blood-pressure.png",
    },
    {
      slug: "diabetes-follow-up",
      title: "Diabetes follow-up: what to bring",
      blurb: "Readings, medicines, and questions that make a consult more useful.",
      minutes: 3,
      author: "PocketPills",
      imageUrl: "/img/treatments/uti.png",
    },
    {
      slug: "preventive-health-visit",
      title: "What a preventive health consult covers",
      blurb: "Screening, lifestyle, and when a follow-up is the right next step.",
      minutes: 4,
      author: "PocketPills",
      imageUrl: "/img/Cardiologist.png",
    },
  ],
  dermatologist: [
    {
      slug: "common-skin-concerns",
      title: "Common skin concerns you can raise online",
      blurb: "Acne, rashes, and when a photo-supported consult is appropriate.",
      minutes: 4,
      author: "PocketPills",
    },
  ],
  psychiatrist: [
    {
      slug: "anxiety-first-visit",
      title: "Preparing for a mental-health consult",
      blurb: "What to share, what to ask, and how follow-ups usually work.",
      minutes: 5,
      author: "PocketPills",
    },
  ],
  gastroenterologist: [
    {
      slug: "digestive-symptoms",
      title: "Digestive symptoms worth discussing",
      blurb: "Reflux, IBS-type discomfort, and how a clinician triages next steps.",
      minutes: 4,
      author: "PocketPills",
    },
  ],
  gynecologist: [
    {
      slug: "womens-health-visit",
      title: "Making the most of a women’s health visit",
      blurb: "Cycle changes, contraception, and questions that help the consult.",
      minutes: 4,
      author: "PocketPills",
    },
  ],
  default: [
    {
      slug: "how-online-consults-work",
      title: "How an online consult works",
      blurb: "Video visits, prescriptions when appropriate, and follow-up care.",
      minutes: 3,
      author: "PocketPills",
    },
    {
      slug: "prepare-for-appointment",
      title: "How to prepare for your appointment",
      blurb: "ID, medicine list, and notes that help your clinician help you.",
      minutes: 3,
      author: "PocketPills",
    },
  ],
};

export function nmcNumberOf(provider: CareProvider): string | null {
  return provider.id.startsWith("nmc-") ? provider.id.replace(/^nmc-/, "") : null;
}

export function providerProfileHref(provider: CareProvider): string {
  if (provider.kind === "doctor") {
    const nmc = nmcNumberOf(provider);
    return nmc ? `/doctors/${nmc}` : `/appointments/provider/${provider.id}`;
  }
  const hf = provider.id.startsWith("hf-") ? provider.id.replace(/^hf-/, "") : null;
  return hf ? `/facilities/${hf}` : `/appointments/provider/${provider.id}`;
}

export function formatVerifiedOn(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function doctorVerification(provider: CareProvider): {
  checks: VerifiedCheck[];
  registration?: { label: string; value: string };
  lastVerified?: string;
} | null {
  const nmc = nmcNumberOf(provider);
  const claim = nmc ? getDoctorClaim(nmc) : null;
  const checks: VerifiedCheck[] = [];

  if (nmc) checks.push({ label: "NMC registration verified" });
  if (claim?.published) {
    checks.push({ label: "Identity verified" });
    checks.push({ label: "Medical credentials verified" });
    if (provider.address) checks.push({ label: "Practice location verified" });
  }

  if (!checks.length) return null;

  const last = claim?.publishedAt || claim?.claimedAt;
  return {
    checks,
    registration: nmc ? { label: "NMC number", value: `#${nmc}` } : undefined,
    lastVerified: last ? formatVerifiedOn(last) : undefined,
  };
}

function unique(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.trim();
    if (!key || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    out.push(key);
  }
  return out;
}

export function doctorConditions(provider: CareProvider): string[] {
  const fromSpecialty = provider.specialties.flatMap((id) => CONDITIONS[id] ?? []);
  return unique([...fromSpecialty, ...(provider.focusAreas ?? [])]).slice(0, 8);
}

export function conditionsForSpecialty(id: SpecialtyId): string[] {
  return unique(CONDITIONS[id] ?? []).slice(0, 8);
}

export function doctorServices(provider: CareProvider, specialisedIn: SpecialisedGroup[]): string[] {
  const listed = [
    "General consultation",
    "Follow-up consultation",
    "Prescription review",
    "Preventive health consultation",
  ];
  if (provider.visitTypes.includes("virtual")) listed.splice(2, 0, "Online consultation");
  const fromGroups = specialisedIn.flatMap((g) => g.procedures).slice(0, 4);
  return unique([...listed, ...fromGroups]).slice(0, 8);
}

export function conditionHref(label: string): string {
  const hit = treatments.find((t) => t.name.toLowerCase() === label.toLowerCase());
  if (hit) return `/appointments/treatments/${hit.slug}`;
  return `/appointments`;
}

export function doctorExperience(provider: CareProvider): {
  jobs: { org: string; role: string; years: string }[];
  education: string[];
  certifications: string[];
} | null {
  const education = (provider.education ?? []).filter((line) => !/^Nepal Medical Council #/i.test(line));
  const certifications = (provider.education ?? []).filter((line) =>
    /CCFP|FRCPC|fellowship|diplom|board certified|college of/i.test(line),
  );
  const jobs: { org: string; role: string; years: string }[] = [];
  if (provider.experienceYears && provider.experienceYears > 0) {
    jobs.push({
      org: provider.city || "Clinical practice",
      role: provider.subtitle.split("·")[0]?.trim() || "Physician",
      years: `${provider.experienceYears} years in practice`,
    });
  }
  if (!jobs.length && !education.length && !certifications.length) return null;
  return { jobs, education, certifications };
}

export function doctorPracticeCards(
  provider: CareProvider,
  facilities: CareProvider[],
): PracticeLocationCard[] {
  if (facilities.length) {
    return facilities.map((f) => ({
      id: f.id,
      name: f.name,
      location: f.address || f.city,
      kind: f.subtitle || (f.kind === "hospital" ? "Hospital" : "Clinic"),
      visit: visitLabel(provider),
      hours: f.hours || provider.hours,
      href: providerProfileHref(f),
    }));
  }
  if (!provider.address && !provider.city) return [];
  return [
    {
      id: provider.id,
      name: provider.name,
      location: provider.address || provider.city,
      kind: "Clinic",
      visit: visitLabel(provider),
      hours: provider.hours,
      href: "",
    },
  ];
}

function visitLabel(provider: CareProvider): string {
  const bits: string[] = [];
  if (provider.visitTypes.includes("clinic")) bits.push("In-clinic");
  if (provider.visitTypes.includes("virtual")) bits.push("Online");
  return bits.join(" · ") || "By appointment";
}

export function doctorFaqs(
  provider: CareProvider,
  conditions: string[],
  specialisedIn: SpecialisedGroup[],
): { q: string; a: string }[] {
  const names = unique([
    ...specialisedIn.map((g) => g.specialty),
    ...conditions.slice(0, 5),
  ]);
  const treat =
    names.length > 0
      ? `${provider.name} lists ${names.join(", ")} on this profile. Open Specialised in above for procedure detail.`
      : `${provider.name} offers consults in ${provider.specialties.join(", ") || "general practice"}.`;
  const online = provider.visitTypes.includes("virtual")
    ? `Yes. ${provider.name} offers online consultations through PocketPills.`
    : `Online consultations are not listed on this profile. In-clinic visits may still be available.`;
  const langs = provider.languages.length
    ? provider.languages.join(", ")
    : "Languages are not listed on this profile.";

  return [
    { q: "What conditions does this doctor treat?", a: treat },
    { q: "Does the doctor offer online consultations?", a: online },
    {
      q: "How long is a consultation?",
      a: "Visit length is confirmed when you book. Choose a time in Availability, then continue to patient details and payment.",
    },
    {
      q: "Can I book a follow-up?",
      a: "Yes. Follow-up consultation is listed among this doctor’s services — use Availability to pick a slot.",
    },
    { q: "What languages does the doctor speak?", a: langs },
    {
      q: "Can I receive a prescription after an online consultation?",
      a: provider.visitTypes.includes("virtual")
        ? "If clinically appropriate, a clinician may issue a prescription after an online visit."
        : "Prescriptions, when appropriate, are issued after a listed visit type on this profile.",
    },
    {
      q: "What should I prepare before my appointment?",
      a: "Have a photo ID, your current medicine list, and any recent reports ready. Note the questions you want to ask.",
    },
  ];
}

export function doctorArticles(provider: CareProvider): HealthArticle[] {
  return articlesForSpecialties(provider.specialties);
}

export function articlesForSpecialties(specialties: readonly SpecialtyId[]): HealthArticle[] {
  const out: HealthArticle[] = [];
  const seen = new Set<string>();
  const keys: Array<SpecialtyId | "default"> = [...specialties, "general", "default"];
  for (const key of keys) {
    for (const article of ARTICLES[key] ?? []) {
      if (seen.has(article.slug)) continue;
      seen.add(article.slug);
      out.push(article);
      if (out.length >= 4) return out;
    }
  }
  return out;
}

export function articleBySlug(slug: string): HealthArticle | undefined {
  for (const list of Object.values(ARTICLES)) {
    const hit = list?.find((a) => a.slug === slug);
    if (hit) return hit;
  }
  return undefined;
}

export type DoctorHighlightFact = {
  key: "nmc" | "college" | "experience" | "hospital" | "since";
  label: string;
};

/** Registry / listing facts only — never invents years, colleges, or hospital names. */
export function doctorHighlightFacts(
  provider: CareProvider,
  facilities: CareProvider[] = [],
): DoctorHighlightFact[] {
  const facts: DoctorHighlightFact[] = [];
  const nmc = nmcNumberOf(provider);
  if (nmc) facts.push({ key: "nmc", label: "NMC registered" });

  const college = (provider.education ?? []).find((line) => {
    if (/^Nepal Medical Council/i.test(line)) return false;
    return /college|university|campus|institute|academy/i.test(line);
  });
  if (college) facts.push({ key: "college", label: college });

  if (provider.experienceYears && provider.experienceYears > 0) {
    facts.push({
      key: "experience",
      label: `${provider.experienceYears} yrs of experience`,
    });
  }

  const hospital = facilities[0]?.name?.trim();
  if (hospital) facts.push({ key: "hospital", label: hospital });

  const claim = nmc ? getDoctorClaim(nmc) : null;
  const since = claim?.publishedAt || claim?.claimedAt;
  if (since) {
    const year = new Date(since).getFullYear();
    if (!Number.isNaN(year)) facts.push({ key: "since", label: `Available since ${year}` });
  }

  return facts.slice(0, 5);
}

export type SpecialisationTile = {
  id: string;
  label: string;
  imageUrl: string;
};

const DEPARTMENT_TO_SPECIALTY: Record<string, SpecialtyId> = {
  Physician: "general",
  "Cosmetic Surgery": "dermatologist",
  Orthopedics: "orthopedist",
  Ophthalmology: "ophthalmologist",
  Urology: "urologist",
  Dental: "dentist",
};

/** Listed specialties with art — no placeholder departments. */
export function doctorSpecialisationTiles(
  provider: CareProvider,
  specialisedIn: SpecialisedGroup[],
): SpecialisationTile[] {
  const tiles: SpecialisationTile[] = [];
  const seen = new Set<string>();

  for (const id of provider.specialties) {
    const spec = specialtyById(id);
    if (!spec || seen.has(spec.id)) continue;
    seen.add(spec.id);
    tiles.push({ id: spec.id, label: spec.label, imageUrl: spec.imageUrl });
  }

  for (const group of specialisedIn) {
    const sid = DEPARTMENT_TO_SPECIALTY[group.specialty];
    if (!sid || seen.has(sid)) continue;
    const spec = specialtyById(sid);
    if (!spec) continue;
    seen.add(sid);
    tiles.push({ id: spec.id, label: spec.label, imageUrl: spec.imageUrl });
  }

  return tiles;
}
