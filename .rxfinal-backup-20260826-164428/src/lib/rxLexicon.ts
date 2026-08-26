/**
 * Prescription line vocabulary for South Asian (Nepal / India) handwritten Rx.
 *
 * Two jobs:
 * 1. Decide what is NOT a medicine — letterhead, credentials, facility name,
 *    contact block, patient admin fields, vitals, and lifestyle advice. Getting
 *    this wrong is how "SENIOR MEDICAL OFFICER" ends up on a patient's basket.
 * 2. Decide what IS plausibly a medicine — an Rx form prefix, a dosing sig, a
 *    strength, or a known brand token. A line must show one of these signals;
 *    "looks capitalised" is not a signal.
 *
 * The brand list is a RECOGNITION aid only — it helps the fuzzy matcher settle
 * on a spelling when handwriting is ambiguous. It deliberately carries no
 * generic-ingredient mapping: inferring an ingredient from a misread brand is
 * exactly the sort of guess that must not reach a patient. Ingredient mapping
 * stays with the verified formulary in data.ts, and a pharmacist verifies
 * everything before dispensing.
 */

/** Dosage form prefixes as written on South Asian scripts. */
export const RX_FORM_RE =
  /^(cap(?:sule)?s?|tabs?|tablets?|t|c|syp|syrup|susp(?:ension)?|inj(?:ection)?|drops?|oint(?:ment)?|cream|gel|neb|inh(?:aler)?|sachets?|lot(?:ion)?|supp)\s*\.?\s+/i;

/** Strength tokens, including Indian/Nepali units. */
export const STRENGTH_TOKEN_RE =
  /\b\d+(?:\.\d+)?\s*(mg|mcg|ug|g|gm|ml|l|iu|u|%|mg\/ml|mcg\/ml)\b/i;

/** Latin dosing abbreviations common on Nepali/Indian prescriptions. */
export const SIG_TOKEN_RE =
  /\b(od|bd|bid|tds|tid|qid|qds|hs|ohs|ohhs|ac|pc|prn|sos|stat|qd|q\d+h|nocte|mane)\b/i;

/** Morning-noon-night dosing grid, e.g. "1-0-1" or "1/2-0-1". */
export const GRID_SIG_RE = /\b(\d(?:\/\d)?)\s*-\s*(\d(?:\/\d)?)\s*-\s*(\d(?:\/\d)?)\b/;

/** Clock-time cues, e.g. "7AM", "6 PM". */
export const CLOCK_RE = /\b(\d{1,2})\s*(am|pm)\b/i;

/**
 * Seed list of brand names widely dispensed in Nepal and India, used only to
 * stabilise spelling when handwriting is ambiguous. Extend from the live
 * formulary rather than hand-editing where possible.
 */
export const BRAND_TOKENS: string[] = [
  // Analgesic / antipyretic
  "crocin", "calpol", "dolo", "combiflam", "meftal", "brufen", "voveran",
  "flexon", "nise", "zerodol", "ultracet", "sumo", "paracip",
  // Antibiotic
  "augmentin", "azee", "azithral", "zifi", "taxim", "monocef", "cifran",
  "ciplox", "norflox", "metrogyl", "flagyl", "moxikind", "clavam",
  // Gastro
  "pan", "pantop", "pantocid", "razo", "razo-d", "rozad", "omez", "ocid",
  "rantac", "aciloc", "zinetac", "domstal", "emeset", "ondem", "zofer",
  "cyclopam", "drotin", "duphalac", "econorm", "sporlac", "ambulax",
  // Cardio / metabolic
  "ecosprin", "clopilet", "atorva", "storvas", "rosuvas", "telma", "telma-h",
  "amlokind", "amlong", "losar", "stamlo", "concor", "metolar", "dytor",
  "glycomet", "amaryl", "janumet", "istamet", "galvus", "zoryl",
  // Thyroid
  "thyronorm", "eltroxin", "thyrox",
  // Respiratory / allergy
  "montair", "montek", "allegra", "cetzine", "levocet", "avil", "sinarest",
  "asthalin", "foracort", "budecort", "deriphyllin", "seroflo",
  // Steroid
  "wysolone", "omnacortil", "betnesol", "medrol",
  // CNS / psych
  "escitat", "nexito", "cipralex", "petril", "clonotril", "alprax", "restyl",
  "etizola", "zolfresh", "placida", "lonazep", "frisium", "encorate",
  // Supplement
  "shelcal", "calcimax", "neurobion", "becosules", "limcee", "zincovit",
  "orofer", "livogen", "folvite", "rocaltrol", "uprise",
];

const BRAND_SET = new Set(BRAND_TOKENS);

/* ------------------------------------------------------------------ */
/* Non-medicine line detection                                         */
/* ------------------------------------------------------------------ */

/** Prescriber credentials, degrees, registration. */
const CREDENTIAL_RE =
  /\b(m\.?b\.?b\.?s|m\.?d\b|m\.?s\b|d\.?m\b|m\.?ch\b|b\.?d\.?s|d\.?n\.?b|f\.?r\.?c\.?s|dip\b|ph\.?d|reg(?:d|istration)?\.?\s*(no|number)|nmc|council|licence|license)\b/i;

/** Job titles / roles printed on letterheads. */
const ROLE_RE =
  /\b(senior|junior|chief|consultant|resident|professor|assoc(?:iate)?|asst|assistant|director|incharge|in-charge)?\s*(medical\s+officer|physician|surgeon|specialist|consultant|practitioner|pathologist|radiologist|anaesthetist|dentist|director)\b/i;

/** Facility names. */
const FACILITY_RE =
  /\b(hospital|clinic|nursing\s+home|health\s+(centre|center|post|care)|polyclinic|diagnostic|laborator(y|ies)|pharmacy|medical\s+(college|store|hall)|institute|chikitsalaya)\b/i;

/** Contact / address blocks. */
const CONTACT_RE =
  /(\b(mob(ile)?|ph(one)?|tel|fax|email|e-mail|website)\b\s*[.:]?)|@|\bwww\.|https?:\/\/|\b\d{6}\b|\b(nagar|marg|road|rd\.?|street|st\.?|colony|chowk|tole|sadak|ward\s*no)\b/i;

/** Patient admin fields. */
const ADMIN_RE =
  /\b(name|patient|sex|gender|age|date|dob|address|opd|ipd|uhid|reg\s*no|bill|receipt|token|weight|wt|height|ht|ref(?:erred)?\s*by)\b\s*[:.\-]?/i;

/** Vitals and measurements. */
const VITALS_RE =
  /\b(b\.?p|spo2|sp02|pulse|pr|hr|rr|temp(erature)?|sugar|rbs|fbs|ppbs|hb|tsh|mmhg|bpm|bmi)\b/i;

/** Lifestyle advice and follow-up instructions. */
const ADVICE_RE =
  /\b(diet|walk|exercise|rest|follow\s*(up)?|review|revisit|come\s+back|avoid|plenty|water\s+intake|salt|smoking|alcohol|physiotherapy|investigation|advice|complaint|diagnosis|history|c\/o|k\/c\/o)\b/i;

/** Signature / stamp / footer boilerplate. */
const FOOTER_RE =
  /\b(signature|sign|stamp|seal|verified|pharmacist|dispens(e|ed|ing)|not\s+valid|computer\s+generated|thank\s+you|get\s+well)\b/i;

/** A line that is entirely Devanagari (letterheads are often bilingual). */
const DEVANAGARI_ONLY_RE = /^[\u0900-\u097F\s.,:;()\-–—/०-९]+$/;

/** Pure date / number / punctuation noise. */
const NOISE_RE =
  /^([\s\d.,:;()\-–—/\\|*•·_'"]+|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|rx|r\/?x|℞)$/i;

/**
 * True when the line is letterhead, admin, vitals, advice or footer text —
 * anything that must never be offered to the patient as a medicine.
 */
export function isNonMedLine(raw: string): boolean {
  const line = raw.replace(/\s+/g, " ").trim();
  if (!line) return true;
  if (NOISE_RE.test(line)) return true;
  if (DEVANAGARI_ONLY_RE.test(line)) return true;
  if (CREDENTIAL_RE.test(line)) return true;
  if (ROLE_RE.test(line)) return true;
  if (FACILITY_RE.test(line)) return true;
  if (CONTACT_RE.test(line)) return true;
  if (VITALS_RE.test(line)) return true;
  if (FOOTER_RE.test(line)) return true;
  // Advice/admin only count when the line carries no real drug signal, so
  // "T. Placida 1 OD - after food" survives while "- Diet" does not.
  if ((ADVICE_RE.test(line) || ADMIN_RE.test(line)) && !hasStrongRxSignal(line)) return true;
  // "Dr. Someone" as a whole line is the prescriber, not a drug.
  if (/^d\s*r\.?\s+[a-z]/i.test(line) && !RX_FORM_RE.test(line)) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Drug signal detection                                               */
/* ------------------------------------------------------------------ */

/** Normalised alphanumeric token list for a line. */
function tokens(line: string): string[] {
  return line
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((t) => t.length >= 3);
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = dp[i];
      dp[i] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[i], dp[i - 1]);
      prev = cur;
    }
  }
  return dp[a.length];
}

/** Digit/letter shapes handwriting OCR routinely swaps. */
function deOcr(word: string): string {
  return word
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/5/g, "s")
    .replace(/8/g, "b")
    .replace(/2/g, "z");
}

/**
 * Closest known brand spelling for a token, or null.
 *
 * Tolerance scales with word length rather than sitting at a flat 1-2 edits.
 * Handwriting OCR routinely returns two or three wrong characters in a seven
 * letter brand ("escitot" for "escitat", "placidu" for "placida"), and a flat
 * tolerance silently drops exactly those.
 */
export function matchBrandToken(word: string): string | null {
  const cleaned = word.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (cleaned.length < 4) return null;

  for (const variant of [cleaned, deOcr(cleaned)]) {
    if (BRAND_SET.has(variant)) return variant;
  }

  const tolerance = Math.min(3, Math.max(1, Math.round(cleaned.length * 0.34)));
  let best: string | null = null;
  let bestScore = tolerance + 1;
  for (const variant of [cleaned, deOcr(cleaned)]) {
    for (const brand of BRAND_TOKENS) {
      const d = editDistance(variant, brand);
      if (d < bestScore) {
        bestScore = d;
        best = brand;
      }
    }
  }
  return bestScore <= tolerance ? best : null;
}

/** Strength/format qualifiers that legitimately follow a brand name. */
const BRAND_SUFFIXES = new Set([
  "d", "md", "dsr", "sr", "cr", "xl", "er", "ds", "plus", "forte", "h", "am", "l",
]);

/**
 * Locate the medicine inside a noisy line by anchoring on a recognised brand.
 *
 * Handwriting OCR wraps the real name in debris — the dosage form "Cap." comes
 * back as "Gp", "T." as "IE", and stray pen marks arrive as "°" or "I". Rather
 * than trying to scrub every possible artefact, find the token that matches a
 * known brand and build the name outward from there, which discards the debris
 * by construction.
 */
export function anchorBrandName(
  line: string,
): { name: string; index: number; known: boolean } | null {
  const raw = line.split(/[^A-Za-z0-9°/-]+/).filter(Boolean);
  for (let i = 0; i < raw.length; i++) {
    const brand = matchBrandToken(raw[i]);
    if (!brand) continue;
    const parts = [brand];
    // A suffix must be a bare word ("Razo D", "Pan DSR"). Tokens carrying
    // digits are dose text — "10D" is "1 OD", not a formulation qualifier.
    const rawNext = raw[i + 1] ?? "";
    const next = /^[A-Za-z]+$/.test(rawNext) ? rawNext.toLowerCase() : "";
    if (next && BRAND_SUFFIXES.has(next)) parts.push(next);
    const name = parts
      .join(" ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { name, index: i + parts.length - 1, known: true };
  }
  return null;
}

/** Does any token on this line resemble a known brand? */
export function hasBrandToken(line: string): boolean {
  return tokens(line).some((t) => matchBrandToken(t) !== null);
}

/**
 * A "strong" signal means this line is structured like a prescription entry:
 * a dosage form, a dosing sig, a dosing grid, or an explicit strength.
 */
export function hasStrongRxSignal(line: string): boolean {
  return (
    RX_FORM_RE.test(line.trim()) ||
    SIG_TOKEN_RE.test(line) ||
    GRID_SIG_RE.test(line) ||
    STRENGTH_TOKEN_RE.test(line)
  );
}

/** Any signal at all, including a recognised brand spelling. */
export function hasRxSignal(line: string): boolean {
  return hasStrongRxSignal(line) || hasBrandToken(line);
}

/**
 * Whole-document check: does this OCR text contain anything shaped like a
 * prescription entry? Used to decide whether the handwriting model is needed —
 * a printed letterhead alone must not count as a successful read.
 */
export function hasMedSignal(text: string): boolean {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3 && !isNonMedLine(l))
    .some((l) => hasRxSignal(l));
}

/* ------------------------------------------------------------------ */
/* Sig parsing                                                         */
/* ------------------------------------------------------------------ */

export type SigParts = {
  directions: string;
  asNeeded: boolean;
  strength: string;
};

const GRID_WORDS = ["morning", "midday", "night"];

function gridDirections(m: RegExpMatchArray): string {
  const slots = [m[1], m[2], m[3]];
  const active = slots
    .map((v, i) => (v !== "0" ? `${v} ${GRID_WORDS[i]}` : null))
    .filter(Boolean) as string[];
  if (!active.length) return "";
  return active.join(", ");
}

/** Read Nepali/Indian dosing conventions off a single Rx line. */
export function parseSig(line: string): SigParts {
  const t = ` ${line.toLowerCase()} `;
  const asNeeded = /\b(prn|sos|as\s+needed|when\s+required)\b/.test(t);

  const strengthMatch = line.match(STRENGTH_TOKEN_RE);
  const strength = strengthMatch ? strengthMatch[0].replace(/\s+/g, "").toLowerCase() : "";

  // Bare-number strengths ("Escitat 10") are resolved by strengthAfter(),
  // which requires the number to sit next to the name. Scanning the whole line
  // here would invent strengths from stray pen marks.

  const grid = line.match(GRID_SIG_RE);
  let directions = grid ? gridDirections(grid) : "";

  if (!directions) {
    if (/\b(ohhs|ohs|od\s*hs|qhs|nocte|bedtime|at\s+night)\b/.test(t)) directions = "once daily at bedtime";
    else if (/\b(tds|tid|three\s+times)\b/.test(t)) directions = "3 times daily";
    else if (/\b(qid|qds|four\s+times)\b/.test(t)) directions = "4 times daily";
    else if (/\b(bd|bid|twice\s+daily|two\s+times)\b/.test(t)) directions = "twice daily";
    else if (/\b(od|qd|once\s+daily|mane|daily)\b/.test(t)) directions = "once daily";
    else if (/\bhs\b/.test(t)) directions = "at bedtime";
    else if (/\bstat\b/.test(t)) directions = "immediately, once";
  }

  const modifiers: string[] = [];
  if (/\bac\b|before\s+(meals?|food)/.test(t)) modifiers.push("before food");
  else if (/\bpc\b|after\s+(meals?|food)/.test(t)) modifiers.push("after food");

  const clock = line.match(CLOCK_RE);
  if (clock) modifiers.push(`at ${clock[1]}${clock[2].toUpperCase()}`);

  if (modifiers.length) {
    directions = directions ? `${directions} ${modifiers.join(", ")}` : modifiers.join(", ");
  }
  if (!directions && asNeeded) directions = "as needed";

  return { directions: directions.trim(), asNeeded, strength };
}

/**
 * Strip form prefix, sig, strength and trailing noise off a line, leaving the
 * medicine name. Returns "" when nothing name-like survives.
 */
export function extractMedName(line: string): string {
  let name = line
    .replace(/^[\s\-–—*•·:>)\]]+/, "")
    .replace(RX_FORM_RE, "")
    .replace(GRID_SIG_RE, " ")
    .replace(CLOCK_RE, " ")
    .replace(STRENGTH_TOKEN_RE, " ")
    // Food-timing and duration phrases trail the dose, never the name.
    .replace(/\b(before|after|with)\s+(food|meals?|breakfast|lunch|dinner)\b/gi, " ")
    .replace(/\bempty\s+stomach\b/gi, " ")
    .replace(/\b(x|for)\s*\d+\s*(day|days|week|weeks|month|months|d|w|m)\b/gi, " ")
    .replace(/\b\d+\s*(day|days|week|weeks|month|months)\b/gi, " ")
    .replace(/\b(continue|cont|to\s+continue|then|and)\b/gi, " ");

  // Cut everything from the first standalone sig token onwards.
  const sigCut = name.search(
    /\b(od|bd|bid|tds|tid|qid|qds|hs|ohs|ohhs|ac|pc|prn|sos|stat|nocte|mane)\b/i,
  );
  if (sigCut > 0) name = name.slice(0, sigCut);

  name = name
    .replace(/\b\d+(?:\.\d+)?\b/g, " ")
    .replace(/[.,;:\-–—/\\|*•·]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (name.length < 3 || name.length > 48) return "";
  if (isNonMedLine(name)) return "";
  return name;
}

/** Title-case a recovered name, preferring the canonical brand spelling. */
export function canonicaliseName(name: string): { name: string; known: boolean } {
  const parts = name.split(/\s+/).filter(Boolean);
  let known = false;
  const out = parts.map((p) => {
    const brand = matchBrandToken(p);
    if (brand) {
      known = true;
      return brand.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return p.replace(/\b\w/g, (c) => c.toUpperCase());
  });
  return { name: out.join(" "), known };
}

/* ------------------------------------------------------------------ */
/* Whole-line parse                                                    */
/* ------------------------------------------------------------------ */

export type RxLine = {
  name: string;
  strength: string;
  directions: string;
  asNeeded: boolean;
  known: boolean;
};

/**
 * Strength written immediately after the name, e.g. "Escitat 10" or
 * "Cetzine 10mg". Adjacency matters: scanning the whole line for any bare
 * number invents strengths out of stray marks — a garbled "1 BD" became a
 * confident "8mg" on a real prescription. A dose count of 1 is not a strength.
 */
function strengthAfter(tokens: string[], nameIndex: number): string {
  for (let i = nameIndex + 1; i <= nameIndex + 2 && i < tokens.length; i++) {
    const t = tokens[i].toLowerCase();
    const united = t.match(/^(\d+(?:\.\d+)?)(mg|mcg|ug|g|gm|ml|iu|%)$/);
    if (united) return `${united[1]}${united[2]}`;
    if (/^\d{1,4}$/.test(t)) {
      const n = Number(t);
      if (n >= 2 && n <= 2000) return `${n}mg`;
      return ""; // a lone "1" is the tablet count; stop looking.
    }
    if (!/^\d/.test(t)) break; // hit a word — strength would have come first.
  }
  return "";
}

/** Parse one prescription line into name, strength and directions. */
export function parseRxLine(line: string): RxLine | null {
  if (isNonMedLine(line)) return null;

  const sig = parseSig(line);
  const anchor = anchorBrandName(line);

  if (anchor) {
    const tokens = line.split(/[^A-Za-z0-9°/-]+/).filter(Boolean);
    const strength = sig.strength || strengthAfter(tokens, anchor.index);
    return {
      name: anchor.name,
      strength,
      directions: sig.directions,
      asNeeded: sig.asNeeded,
      known: true,
    };
  }

  // No known brand — fall back to structural cleanup, and only keep the line
  // if it still looks like a prescription entry.
  if (!hasStrongRxSignal(line)) return null;
  const recovered = extractMedName(line);
  if (!recovered) return null;
  const { name } = canonicaliseName(recovered);
  return {
    name,
    strength: sig.strength,
    directions: sig.directions,
    asNeeded: sig.asNeeded,
    known: false,
  };
}
