import { NEPAL_CITIES, NEPAL_DISTRICTS, normalizeCityName } from "@/lib/nepalCities";
import { normalizeSearchQuery } from "@/lib/searchMatch";
import { SPECIALTY_SEARCH_TERMS, searchSpecialties } from "@/lib/specialtySearch";
import { searchTreatments } from "@/lib/treatmentSearch";
import { searchPharmacies } from "@/lib/pharmacySearch";
import { searchLabs } from "@/lib/labs";
import { searchCareWorkers } from "@/lib/careWorkers";
import { searchHealthServices } from "@/lib/healthServices";
import { searchDrugs } from "@/lib/drugSearch";

/**
 * Global landing search.
 *
 * Turns one free-text box into intent: what kind of thing, which specialty or
 * treatment, and where. Handles multi-word phrasing ("suggest me a doctor for
 * weight loss"), location ("dentist in Biratnagar"), and Nepali, then routes to
 * the page that can actually answer it.
 *
 * Everything here is synchronous over data already bundled in the app — the
 * existing per-domain search helpers do the matching, this only decides which
 * of them to ask and how to phrase the deep link.
 */

export type GlobalHitKind =
  | "specialty"
  | "treatment"
  | "doctor"
  | "facility"
  | "pharmacy"
  | "lab"
  | "care-worker"
  | "service"
  | "medication"
  | "browse";

export interface GlobalHit {
  id: string;
  kind: GlobalHitKind;
  /** Primary line. */
  label: string;
  /** Secondary line — why this matched, or where it is. */
  hint: string;
  to: string;
  score: number;
}

export type EntityKind =
  | "doctor"
  | "nurse"
  | "pharmacy"
  | "facility"
  | "lab"
  | "ambulance"
  | "medication";

export interface ParsedQuery {
  raw: string;
  /** Query with filler words and the location phrase removed. */
  subject: string;
  /** Canonical city / district name, if one was named. */
  location: string | null;
  /** What kind of thing the person asked for, if they said. */
  entity: EntityKind | null;
}

/* ── Vocabulary ─────────────────────────────────────────────────────────── */

/** Filler that carries no search signal, English and Nepali. */
const NOISE = [
  "suggest me", "suggest", "recommend me", "recommend", "find me", "find",
  "show me", "show", "search for", "search", "looking for", "look for",
  "i need", "i want", "i am looking for", "need a", "need", "want",
  "please", "can you", "help me", "get me", "book a", "book",
  "the best", "best", "top", "good", "nearest", "nearby", "near me", "near",
  "a", "an", "the", "for", "of", "me", "my", "some", "any",
  /* Qualifiers that wrap the real subject: "weight loss PROGRAM" must still
     reach the weight-loss specialty. */
  "program", "programme", "plan", "package", "options", "option",
  "service", "services", "consultation", "consult", "appointment",
  "treatment for", "help with", "help",
  "मलाई", "खोज्नु", "खोज", "चाहियो", "चाहिन्छ", "सुझाव", "देखाउनुहोस्",
  "राम्रो", "सबैभन्दा", "नजिकैको", "नजिक", "कृपया",
];

/** Words that introduce a place. */
const LOCATION_LEADS = ["in", "at", "near", "around", "मा", "नजिक"];

const ENTITY_TERMS: Record<EntityKind, string[]> = {
  doctor: [
    "doctor", "doctors", "physician", "physicians", "dr", "specialist",
    "consultant", "surgeon", "डाक्टर", "चिकित्सक", "विशेषज्ञ",
  ],
  nurse: [
    "nurse", "nurses", "home care", "homecare", "caregiver", "care giver",
    "attendant", "midwife", "नर्स", "घरमै हेरचाह", "स्याहार",
  ],
  pharmacy: [
    "pharmacy", "pharmacies", "chemist", "medical store", "drugstore",
    "drug store", "औषधि पसल", "फार्मेसी",
  ],
  facility: [
    "hospital", "hospitals", "clinic", "clinics", "facility", "facilities",
    "health post", "healthpost", "medical centre", "medical center",
    "अस्पताल", "क्लिनिक", "स्वास्थ्य चौकी",
  ],
  lab: [
    "lab", "labs", "laboratory", "pathology", "diagnostic", "diagnostics",
    "blood test", "test", "tests", "scan", "प्रयोगशाला", "जाँच", "परीक्षण",
  ],
  ambulance: [
    "ambulance", "emergency", "urgent", "urgent care", "एम्बुलेन्स",
    "आपतकालीन", "आपत्कालीन",
  ],
  medication: [
    "medicine", "medicines", "medication", "medications", "drug", "drugs",
    "tablet", "tablets", "prescription", "औषधि", "ट्याब्लेट",
  ],
};

/* ── Parsing ────────────────────────────────────────────────────────────── */

const PLACES: string[] = Array.from(new Set([...NEPAL_CITIES, ...NEPAL_DISTRICTS]));

/**
 * Devanagari names for the places people actually type. NEPAL_CITIES is Latin
 * only, so without this "काठमाडौंमा" carries no location at all.
 */
const NE_PLACES: Record<string, string> = {
  "काठमाडौं": "Kathmandu", "काठमाण्डौ": "Kathmandu", "ललितपुर": "Lalitpur",
  "पाटन": "Lalitpur", "भक्तपुर": "Bhaktapur", "पोखरा": "Pokhara",
  "विराटनगर": "Biratnagar", "बिराटनगर": "Biratnagar", "वीरगंज": "Birgunj",
  "बीरगन्ज": "Birgunj", "धरान": "Dharan", "बुटवल": "Butwal",
  "नेपालगंज": "Nepalgunj", "नेपालगञ्ज": "Nepalgunj", "धनगढी": "Dhangadhi",
  "इटहरी": "Itahari", "हेटौडा": "Hetauda", "जनकपुर": "Janakpur",
  "भरतपुर": "Bharatpur", "चितवन": "Chitwan", "बिर्तामोड": "Birtamod",
};

/** Nepali case endings — "दाँतको" has to reach the "दाँत" specialty term. */
const NE_SUFFIXES = ["लाई", "बाट", "सँग", "हरू", "हरु", "को", "का", "की", "मा", "ले"];

/** Strip Devanagari case endings token by token. Latin text is untouched. */
export function stripNepaliSuffixes(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => {
      if (!/[\u0900-\u097F]/.test(word)) return word;
      for (const suf of NE_SUFFIXES) {
        if (word.length > suf.length + 1 && word.endsWith(suf)) {
          return word.slice(0, -suf.length);
        }
      }
      return word;
    })
    .join(" ")
    .trim();
}

function stripPhrases(text: string, phrases: string[]): string {
  let out = ` ${text} `;
  /* Longest first so "near me" is consumed before "near". */
  for (const p of [...phrases].sort((a, b) => b.length - a.length)) {
    out = out.split(` ${p} `).join(" ");
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Pull a Nepali city or district out of the query, if one is named. */
function extractLocation(text: string): { location: string | null; rest: string } {
  /* Devanagari place names first — they carry case endings ("काठमाडौंमा"). */
  for (const [ne, latin] of Object.entries(NE_PLACES)) {
    const at = text.indexOf(ne);
    if (at === -1) continue;
    const before = text.slice(0, at);
    const after = text.slice(at + ne.length).replace(/^(मा|बाट|को|मध्ये)/, "");
    const rest = stripPhrases(`${before} ${after}`.replace(/\s+/g, " ").trim(), LOCATION_LEADS);
    return { location: latin, rest };
  }

  const lower = ` ${text.toLowerCase()} `;

  let best: { place: string; index: number } | null = null;
  for (const place of PLACES) {
    const needle = ` ${place.toLowerCase()} `;
    const at = lower.indexOf(needle);
    if (at === -1) continue;
    /* Prefer the longest place name — "Kathmandu" over a substring city. */
    if (!best || place.length > best.place.length) best = { place, index: at };
  }
  if (!best) return { location: null, rest: text };

  const before = text.slice(0, best.index).trim();
  const after = text.slice(best.index + best.place.length).trim();
  const rest = stripPhrases(`${before} ${after}`.trim(), LOCATION_LEADS);
  return { location: normalizeCityName(best.place), rest };
}

function detectEntity(text: string): EntityKind | null {
  const padded = ` ${text.toLowerCase()} `;
  let found: { entity: EntityKind; len: number } | null = null;
  for (const [entity, terms] of Object.entries(ENTITY_TERMS) as [EntityKind, string[]][]) {
    for (const t of terms) {
      if (!padded.includes(` ${t} `)) continue;
      if (!found || t.length > found.len) found = { entity, len: t.length };
    }
  }
  return found?.entity ?? null;
}

export function parseQuery(raw: string): ParsedQuery {
  const trimmed = raw.trim();
  if (!trimmed) return { raw, subject: "", location: null, entity: null };

  const { location, rest } = extractLocation(trimmed);
  const entity = detectEntity(rest);

  /* The entity word has been read as intent — leaving it in the subject makes
     it a search TERM too, which produces "pharmacy pharmacies" and filters the
     directory by its own name. Strip it, then the filler. */
  const withoutEntity = entity
    ? stripPhrases(rest.toLowerCase(), ENTITY_TERMS[entity])
    : rest.toLowerCase();
  const subject = stripPhrases(withoutEntity, NOISE);

  return { raw: trimmed, subject, location, entity };
}

/* ── Link building ──────────────────────────────────────────────────────── */

function link(path: string, params: Record<string, string | null | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/** The directory that answers a given entity, carrying query + place through. */
function directoryHit(
  entity: EntityKind,
  subject: string,
  location: string | null,
  score: number,
): GlobalHit | null {
  const where = location ? ` in ${location}` : "";
  const term = subject.trim();

  switch (entity) {
    case "doctor":
      return {
        id: "dir-doctors",
        kind: "doctor",
        label: term ? `${term} doctors${where}` : `Doctors${where}`,
        hint: "Verified NMC-registered physicians",
        to: link("/doctors", { q: term, city: location }),
        score,
      };
    case "facility":
      return {
        id: "dir-facilities",
        kind: "facility",
        label: term ? `${term}${where}` : `Hospitals & clinics${where}`,
        hint: "Registered health facilities",
        to: link("/facilities", { q: term, district: location }),
        score,
      };
    case "pharmacy":
      return {
        id: "dir-pharmacies",
        kind: "pharmacy",
        label: term ? `${term} pharmacies${where}` : `Pharmacies${where}`,
        hint: "Licensed pharmacies near you",
        to: link("/pharmacies", { q: term, district: location }),
        score,
      };
    case "nurse":
      return {
        id: "dir-care",
        kind: "care-worker",
        label: `Home care & nurses${where}`,
        hint: "In-home assistance and attendants",
        to: link("/appointments", { q: term || "home care" }),
        score,
      };
    case "lab":
      return {
        id: "dir-labs",
        kind: "lab",
        label: `Labs & diagnostics${where}`,
        hint: "Book tests and pathology",
        to: link("/appointments", { q: term || "lab" }),
        score,
      };
    case "ambulance":
      return {
        id: "dir-ambulance",
        kind: "service",
        label: `Ambulance & emergency${where}`,
        hint: "Urgent care services",
        to: link("/appointments", { q: term || "ambulance" }),
        score,
      };
    case "medication":
      return {
        id: "dir-meds",
        kind: "medication",
        label: term ? `${term} medications` : "Medications",
        hint: "Browse and order medicines",
        /* MedicationsIndex has no q param — send them to the index itself. */
        to: "/drug",
        score,
      };
    default:
      return null;
  }
}

/* ── Resolver ───────────────────────────────────────────────────────────── */

/** Suggestions shown before anything is typed. */
export const DEFAULT_HITS: GlobalHit[] = [
  { id: "d-doctors", kind: "doctor", label: "Doctors", hint: "Find verified physicians", to: "/doctors", score: 0 },
  { id: "d-facilities", kind: "facility", label: "Hospitals & clinics", hint: "Browse facilities nearby", to: "/facilities", score: 0 },
  { id: "d-ambulance", kind: "service", label: "Ambulance & emergency", hint: "Urgent care services", to: "/appointments?q=ambulance", score: 0 },
  { id: "d-labs", kind: "lab", label: "Labs & pathology", hint: "Book tests and diagnostics", to: "/appointments?q=lab", score: 0 },
  { id: "d-care", kind: "care-worker", label: "Home care & nurses", hint: "In-home assistance", to: "/appointments?q=home care", score: 0 },
];

const MAX_HITS = 8;

/** How squarely a specialty's own keywords answer this query. */
function specialtyAffinity(id: keyof typeof SPECIALTY_SEARCH_TERMS, query: string): number {
  const q = normalizeSearchQuery(query);
  if (!q) return 0;
  let best = 0;
  for (const raw of SPECIALTY_SEARCH_TERMS[id] || []) {
    const t = normalizeSearchQuery(raw);
    if (!t) continue;
    if (t === q) best = Math.max(best, 100);
    else if (q.includes(t) && t.length >= 3) best = Math.max(best, 80);
    else if (t.includes(q) && q.length >= 3) best = Math.max(best, 60);
  }
  return best;
}

export function searchEverything(raw: string): GlobalHit[] {
  const parsed = parseQuery(raw);
  if (!normalizeSearchQuery(parsed.raw)) return DEFAULT_HITS;

  const hits: GlobalHit[] = [];
  const { subject, location, entity } = parsed;
  /* Fall back to the raw text when filler-stripping emptied the subject
     (e.g. someone literally searched "best"). */
  const term = subject || normalizeSearchQuery(parsed.raw);

  /* Devanagari fallback: try again with case endings removed. */
  const stemmed = stripNepaliSuffixes(term);
  const widen = <T,>(fn: (q: string) => T[]): T[] => {
    const direct = fn(term);
    if (direct.length || stemmed === term) return direct;
    return fn(stemmed);
  };

  /*
    The shared matcher ranks Devanagari poorly — searchSpecialties("दाँत") puts
    cardiologist above dentist. Rather than destabilise matching used across the
    app, re-rank the candidates here on explicit term affinity.
  */
  const specialties = [...widen(searchSpecialties)]
    .map((sp) => ({ sp, aff: specialtyAffinity(sp.id, term) || specialtyAffinity(sp.id, stemmed) }))
    .sort((a, b) => b.aff - a.aff)
    .map((x) => x.sp)
    .slice(0, 3);
  specialties.forEach((s, i) => {
    const where = location ? ` in ${location}` : "";
    hits.push({
      id: `sp-${s.id}`,
      kind: "specialty",
      label: `${s.label}${where}`,
      hint: s.blurb,
      /* A named specialty + doctor intent is a directory question, not a hub one. */
      to:
        entity === "doctor" || location
          ? link("/doctors", { q: s.label, city: location })
          : link("/appointments", { q: s.label }),
      score: 100 - i * 5 + (entity === "doctor" ? 12 : 0) + (location ? 8 : 0),
    });
  });

  /* 2. Treatments — "weight loss program", "hair loss" */
  widen(searchTreatments).slice(0, 3).forEach((t, i) => {
    hits.push({
      id: `tr-${t.slug}`,
      kind: "treatment",
      label: t.name,
      hint: t.blurb || `${t.category} treatment`,
      to: `/treatment/${t.slug}`,
      score: 92 - i * 5,
    });
  });

  /* 3. The directory for whatever kind of thing they named */
  if (entity) {
    const d = directoryHit(entity, subject, location, 110);
    if (d) hits.push(d);
  } else if (location) {
    /* Place but no kind — offer the two directories that are place-shaped. */
    const doctors = directoryHit("doctor", subject, location, 88);
    const facilities = directoryHit("facility", subject, location, 84);
    if (doctors) hits.push(doctors);
    if (facilities) hits.push(facilities);
  }

  /* 4. Named businesses and people — only from domains the query is actually
     about. Without this gate, "skin doctor" drags in any lab whose name
     loosely matches, which is noise dressed as a result. */
  const wants = (k: EntityKind) => !entity || entity === k;

  if (wants("pharmacy")) searchPharmacies(term).slice(0, 2).forEach((p, i) => {
    hits.push({
      id: `ph-${p.id}`,
      kind: "pharmacy",
      label: p.name,
      hint: [p.address, p.city].filter(Boolean).join(", "),
      to: link("/pharmacies", { q: p.name, district: location }),
      score: 80 - i * 4,
    });
  });

  if (wants("lab")) searchLabs(term).slice(0, 2).forEach((l, i) => {
    hits.push({
      id: `lb-${l.id}`,
      kind: "lab",
      label: l.name,
      hint: l.address || "Diagnostics and pathology",
      to: link("/appointments", { q: l.name }),
      score: 76 - i * 4,
    });
  });

  if (wants("nurse")) searchCareWorkers(term).slice(0, 2).forEach((c, i) => {
    hits.push({
      id: `cw-${c.id}`,
      kind: "care-worker",
      label: c.name,
      hint: c.subtitle || c.services.join(", "),
      to: link("/appointments", { q: c.name }),
      score: 72 - i * 4,
    });
  });

  if (wants("ambulance")) searchHealthServices(term).slice(0, 2).forEach((s, i) => {
    hits.push({
      id: `hs-${s.id}`,
      kind: "service",
      label: s.name,
      hint: s.blurb || "Health service",
      to: link("/appointments", { q: s.name }),
      score: 68 - i * 4,
    });
  });

  /* 5. Medicines by name — these resolve to a real product page */
  if (wants("medication")) searchDrugs(term).slice(0, 3).forEach((d, i) => {
    hits.push({
      id: `dg-${d.slug}`,
      kind: "medication",
      label: d.name,
      hint: [d.generic, d.cls].filter(Boolean).join(" · "),
      to: `/drug/${d.slug}`,
      score: (entity === "medication" ? 96 : 70) - i * 4,
    });
  });

  /* 6. Always leave a way through to the full hub */
  hits.push({
    id: "all",
    kind: "browse",
    label: `Search everything for “${parsed.raw}”`,
    hint: "See all matching care across the platform",
    to: link("/appointments", { q: parsed.raw }),
    score: -1,
  });

  const seen = new Set<string>();
  return hits
    .filter((h) => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HITS);
}

