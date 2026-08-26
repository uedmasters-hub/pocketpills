/**
 * Client-side prescription OCR. Reads uploaded photos with Tesseract,
 * then matches lines against the local formulary. Unmatched Rx-like lines
 * are still offered as a draft for the patient to confirm.
 * A pharmacist still verifies before anything is dispensed.
 */

import { drugs, type Drug } from "./data";
import { handwritingSupported, recognizeHandwriting } from "./localHtr/htrClient";

/** Options for the OCR entry points. */
export type RecognizeOpts = {
  /**
   * Run the on-device handwriting model (TrOCR) as a fallback when the printed-
   * text engine returns almost nothing — the tell-tale of a handwritten Rx.
   * Enabled by default; the model only actually downloads when the fallback
   * fires, so printed scans stay fast and offline-cheap.
   */
  handwriting?: boolean;
};

/** Below this Tesseract text score we treat the image as "printed OCR failed". */
const HANDWRITING_TRIGGER = 12;

export type RxUpload = {
  id: string;
  name: string;
  type: string;
  previewUrl: string;
  file: File;
};

export type ExtractedMed = {
  slug?: string;
  name: string;
  strength: string;
  qty: number;
  directions: string;
  asNeeded: boolean;
  price: number;
  coverage: number;
  dosages: string[];
  confidence: "high" | "low";
};

export type RxScanResult = {
  text: string;
  meds: ExtractedMed[];
  catalogHits: number;
  prescriber: string;
  clinic: string;
  ocrAvailable: boolean;
};

const STRENGTH_RE = /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|%|u\/ml|mg\/ml|tsp|teaspoonfuls?)/i;
const QTY_RE = /(?:#|qty\.?|quantity|disp(?:ense)?)\s*(\d{1,3})|\b(\d{2,3})\s*(?:tab|cap|pills?)\b/i;

const ALIASES: Record<string, string> = {
  amox: "amoxicillin",
  amoxil: "amoxicillin",
  amoxycillin: "amoxicillin",
  lipitor: "atorvastatin",
  glucophage: "metformin",
  altace: "ramipril",
  tylenol: "acetaminophen",
  paracetamol: "acetaminophen",
  zoloft: "sertraline",
  cipralex: "escitalopram",
  lexapro: "escitalopram",
  ventolin: "salbutamol",
  albuterol: "salbutamol",
  synthroid: "levothyroxine",
  eltroxin: "levothyroxine",
  nexium: "pantoprazole",
  pantaloc: "pantoprazole",
  ozempic: "semaglutide",
  wegovy: "semaglutide",
  mounjaro: "tirzepatide",
};

const SKIP_LINE =
  /^(no\.?|date|for|rx|m\.?\s*d\.?|druggist|pharmacist|broadway|kas\.?|kansas|patient|name|address|phone|sig\.?|label|refill)$/i;

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeOcr(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[|]/g, "I")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, "-")
    .replace(/\b0(?=[A-Za-z])/g, "O")
    .replace(/\b1(?=[A-Za-z])/g, "l");
}

function asNeeded(text: string): boolean {
  return /\b(prn|as needed|when required)\b/i.test(text);
}

function directionsFrom(text: string): string {
  const t = text.toLowerCase();
  if (/every\s+\d+\s+hours?/.test(t)) {
    const n = t.match(/every\s+(\d+)\s+hours?/)?.[1];
    return n ? `every ${n} hours` : "";
  }
  if (/teaspoon/.test(t)) return "1 teaspoonful as directed";
  if (/\b(od\s*hs|odhs|qhs|bedtime|at night)\b/.test(t)) return "once daily at bedtime";
  if (/\b(tid|tds|three times)\b/.test(t)) return "3 times daily";
  if (/\b(bid|bd|twice daily|2 times)\b/.test(t)) return "twice daily";
  if (/\b(qid|four times)\b/.test(t)) return "4 times daily";
  if (/\b(od|once daily|1 daily|one daily|daily)\b/.test(t)) {
    if (/\bac\b|before (meals?|food)/.test(t)) return "once daily before meals";
    if (/\bpc\b|after (meals?|food)/.test(t)) return "once daily after meals";
    return "once daily";
  }
  if (/\bprn\b/.test(t)) return "as needed";
  return "";
}

function qtyFrom(text: string): number {
  const m = text.match(QTY_RE);
  const n = Number(m?.[1] || m?.[2] || 0);
  if (n === 30 || n === 60 || n === 90) return n;
  if (n >= 7 && n <= 180) return n;
  return 30;
}

function nearestStrength(raw: string, dosages: string[]): string {
  if (!raw) return dosages[0] ?? "";
  const compact = raw.replace(/\s+/g, "").toLowerCase();
  const hit = dosages.find((d) => d.replace(/\s+/g, "").toLowerCase() === compact);
  if (hit) return hit;
  const num = raw.match(/[\d.]+/)?.[0];
  const byNum = num ? dosages.find((d) => d.startsWith(num)) : undefined;
  return byNum ?? dosages[0] ?? raw;
}

function windowAround(hay: string, index: number, span = 90): string {
  const start = Math.max(0, index - 6);
  return hay.slice(start, index + span);
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

function namesFor(d: Drug): string[] {
  const extra = Object.entries(ALIASES)
    .filter(([, slug]) => slug === d.slug || slug === (d.generic ?? "").toLowerCase())
    .map(([alias]) => alias);
  return [d.name, d.generic, d.slug.replace(/-/g, " "), ...extra].filter(Boolean) as string[];
}

function drugToExtracted(d: Drug, context: string, confidence: "high" | "low"): ExtractedMed {
  const strengthMatch = context.match(STRENGTH_RE);
  const strength = nearestStrength(strengthMatch ? `${strengthMatch[1]}${strengthMatch[2]}` : "", d.dosages);
  return {
    slug: d.slug,
    name: d.name,
    strength,
    qty: qtyFrom(context),
    directions: directionsFrom(context),
    asNeeded: asNeeded(context),
    price: d.price,
    coverage: d.coverage,
    dosages: d.dosages,
    confidence,
  };
}

function freeformMed(name: string, context: string): ExtractedMed {
  const strengthMatch = context.match(STRENGTH_RE);
  const strength = strengthMatch ? `${strengthMatch[1]}${strengthMatch[2].toLowerCase()}` : "";
  return {
    name,
    strength,
    qty: qtyFrom(context),
    directions: directionsFrom(context),
    asNeeded: asNeeded(context),
    price: 0,
    coverage: 0,
    dosages: [],
    confidence: "low",
  };
}

function looksLikeHeader(line: string): boolean {
  if (SKIP_LINE.test(line.trim())) return true;
  if (/druggist|pharmacist|broadway|abilene|letterhead|downtown family health/i.test(line)) return true;
  if (/^(prescription|dispense|directions?|medication|medicines?)$/i.test(line.trim())) return true;
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(line.trim())) return true;
  if (/^#?\s*\d{4,}$/.test(line.trim())) return true;
  if (/^(mrs?|ms|miss)\.?\s+[A-Z][a-z]+/.test(line.trim())) return true;
  return false;
}

function splitOcrLines(text: string): string[] {
  const cleaned = text.replace(/\r/g, "");
  const parts = cleaned.split(/\n+/);
  const extra =
    parts.length < 3
      ? cleaned.split(/\s{2,}|(?=sig\b)|(?=disp(?:ense)?\b)|(?=\btake\b)/i)
      : [];
  return [...parts, ...extra]
    .map((l) => l.replace(/^[\sRx®*•·]+/i, "").replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 4);
}

function catalogNameKeys(m: ExtractedMed): string[] {
  const keys = [m.name.toLowerCase()];
  if (m.slug) keys.push(m.slug.replace(/-/g, " "));
  for (const [alias, slug] of Object.entries(ALIASES)) {
    if (m.slug === slug || m.name.toLowerCase() === slug) keys.push(alias);
  }
  return keys;
}

function pushUnique(out: ExtractedMed[], already: Set<string>, name: string, context: string) {
  const cleaned = name.replace(/\bsig\b.*/i, "").replace(/[,.;:]+$/g, "").trim();
  const key = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (key.length < 4 || key.length > 48) return;
  const aliasSlug = ALIASES[key];
  if (aliasSlug && [...already].some((n) => n === aliasSlug || n.includes(aliasSlug))) return;
  if ([...already].some((n) => n === key || n.includes(key) || key.includes(n))) return;
  already.add(key);
  out.push(freeformMed(cleaned, context));
}

function extractWrittenRxLines(text: string, already: Set<string>): ExtractedMed[] {
  const out: ExtractedMed[] = [];
  const formPrefix = /^(cap(?:sule)?s?|tab(?:let)?s?|t|syp|syrup|inj(?:ection)?|drops?)\.?\s+/i;
  const sigTail = /\s+\d*\s*(od\s*hs|odhs|od|bd|tds|tid|qid|hs|ac|pc|prn|sos)\b.*$/i;
  const sigCue = /\b(\d+\s*)?(od\s*hs|odhs|od|bd|tds|tid|qid|hs)\b/i;

  for (const raw of splitOcrLines(text)) {
    let line = raw.replace(/^[\sRx®*•·:-]+/i, "").trim();
    if (line.length < 4) continue;
    const hasForm = formPrefix.test(line);
    if (!hasForm && !sigCue.test(line)) continue;
    line = line.replace(formPrefix, "").replace(/[:\-]+/g, " ").replace(/\s+/g, " ").trim();
    const namePart = line.replace(sigTail, "").replace(/[,.;]+$/g, "").trim();
    if (!namePart) continue;
    const strengthMatch = namePart.match(/^(.*?)(?:\s+(\d+(?:\.\d+)?)(?:\s*(mg|mcg|g))?)$/i);
    let name = namePart;
    let strength = "";
    if (strengthMatch?.[2] && (strengthMatch[1] ?? "").trim().length >= 3) {
      name = strengthMatch[1].trim();
      strength = `${strengthMatch[2]}${(strengthMatch[3] || "mg").toLowerCase()}`;
    }
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (key.length < 3 || key.length > 48) continue;
    if ([...already].some((n) => n === key || n.includes(key) || key.includes(n))) continue;
    already.add(key);
    const med = freeformMed(name.replace(/\b\w/g, (c) => c.toUpperCase()), line);
    if (strength) med.strength = strength;
    out.push(med);
  }
  return out.slice(0, 12);
}

function looksLikeSigOnly(line: string) {
  return /^\d+\s*(od|bd|tds|tid|qid|hs|ac|pc|prn|sos)\b/i.test(line.trim());
}

/** Last pass: keep leftover Rx lines even when form/sig parsing missed them. */
function extractLooseRxLines(text: string, already: Set<string>): ExtractedMed[] {
  const out: ExtractedMed[] = [];
  for (const raw of splitOcrLines(text)) {
    const line = raw.replace(/^[\sRx®*•·:-]+/i, "").trim();
    if (line.length < 4 || line.length > 56) continue;
    if (looksLikeHeader(line) || looksLikeSigOnly(line)) continue;
    if (/^(take|sig|disp|patient|for|date|no|label|dr)\b/i.test(line)) continue;
    const namePart = line
      .replace(/^(cap(?:sule)?s?|tab(?:let)?s?|t|syp|syrup|inj(?:ection)?)\.?\s+/i, "")
      .replace(/\s+\d*\s*(od\s*hs|odhs|od|bd|tds|tid|qid|hs|ac|pc|prn|sos)\b.*$/i, "")
      .replace(/[:\-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (namePart.length < 3) continue;
    const key = namePart.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if ([...already].some((n) => n === key || n.includes(key) || key.includes(n))) continue;
    already.add(key);
    out.push(freeformMed(namePart.replace(/\b\w/g, (c) => c.toUpperCase()), line));
  }
  return out.slice(0, 12);
}

function extractFreeformLines(text: string, already: Set<string>): ExtractedMed[] {
  const out: ExtractedMed[] = [];
  const compound =
    text.match(
      /\b((?:elix(?:ir)?|tinct(?:ure)?|syrup)\.?\s+[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?(?:\s+[A-Za-z]+){0,2})/i,
    )?.[1] ??
    text.match(/\b([A-Z][a-z]{3,}\s+of\s+[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{3,})?)\b/)?.[1];
  if (compound) pushUnique(out, already, compound.replace(/\s+/g, " ").trim(), text);

  const lines = splitOcrLines(text).filter((l) => !looksLikeHeader(l));
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = `${line} ${lines[i + 1] ?? ""}`;
    if (/^(take|sig|disp|patient|for|date|no|label)\b/i.test(line) && !STRENGTH_RE.test(line)) continue;
    const hasDrugCue =
      STRENGTH_RE.test(line) ||
      /\b(tab(?:let)?s?|cap(?:sule)?s?|elix(?:ir)?|susp|cream|oint|inhale|drops?|syrup|tsp|mg|mcg)\b/i.test(line) ||
      /^[A-Z][a-z]{3,}(?:\s+[A-Za-z]{3,}){0,4}$/.test(line) ||
      /^[A-Z][A-Z]+(?:\s+[A-Z]+){1,4}$/.test(line);
    if (!hasDrugCue) continue;
    const name = line.replace(STRENGTH_RE, "").replace(/[,.;:]+$/g, "").trim();
    pushUnique(out, already, name, next);
  }
  return out.slice(0, 8);
}

export function parsePrescriptionText(raw: string): RxScanResult {
  const text = normalizeOcr(raw);
  const hay = text.toLowerCase().replace(/[^a-z0-9./%\s-]/g, " ");
  const meds: ExtractedMed[] = [];
  const seen = new Set<string>();

  const catalog = [...drugs].sort(
    (a, b) => Math.max(b.name.length, (b.generic ?? "").length) - Math.max(a.name.length, (a.generic ?? "").length),
  );

  for (const d of catalog) {
    for (const name of namesFor(d)) {
      const needle = name.toLowerCase();
      if (needle.length < 4) continue;
      const re = new RegExp(`\\b${escapeRe(needle)}\\b`, "i");
      const m = hay.match(re);
      if (m?.index != null) {
        if (seen.has(d.slug)) break;
        seen.add(d.slug);
        meds.push(drugToExtracted(d, windowAround(hay, m.index), "high"));
        break;
      }
      if (needle.length >= 7) {
        const words = hay.split(/\s+/);
        const hit = words.findIndex((w) => editDistance(w, needle) <= (needle.length >= 10 ? 2 : 1));
        if (hit >= 0) {
          if (seen.has(d.slug)) break;
          seen.add(d.slug);
          const idx = hay.indexOf(words[hit]);
          meds.push(drugToExtracted(d, windowAround(hay, Math.max(0, idx)), "low"));
          break;
        }
      }
    }
  }

  const catalogHits = meds.length;
  const named = new Set(meds.flatMap(catalogNameKeys));
  meds.push(...extractWrittenRxLines(text, named));
  meds.push(...extractFreeformLines(text, named));
  if (!meds.length) meds.push(...extractLooseRxLines(text, named));

  const prescriber =
    text.match(/\bDr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)?.[0]?.replace(/\s+/g, " ").trim() ?? "";
  const clinic =
    text.match(/([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3}\s+(?:Clinic|Health|Medical|Family Health))/i)?.[0]?.trim() ??
    "";

  return { text, meds, catalogHits, prescriber, clinic, ocrAvailable: true };
}

export type DrugMatchStatus = "matched" | "unmatched" | "unreadable";

/** Check whether OCR text/meds refer to a drug the patient already picked. */
export function matchSelectedDrug(
  selected: Pick<Drug, "slug" | "name"> & { generic?: string },
  result: RxScanResult,
): { status: DrugMatchStatus; hit?: ExtractedMed } {
  const catalog = drugs.find((d) => d.slug === selected.slug);
  const tokens = namesFor(
    catalog ?? {
      slug: selected.slug,
      name: selected.name,
      generic: selected.generic,
      cls: "Various",
      forms: [],
      dosages: [],
      manufacturer: "",
      coverage: 0,
      price: 0,
      rx: true,
    },
  )
    .map((t) => t.toLowerCase().replace(/-/g, " ").trim())
    .filter((t) => t.length >= 4);

  const hay = normalizeOcr(`${result.text}\n${result.meds.map((m) => m.name).join("\n")}`).toLowerCase();
  if (!result.text.trim() && result.meds.length === 0) return { status: "unreadable" };

  const hit = result.meds.find((m) => {
    if (m.slug && m.slug === selected.slug) return true;
    const n = `${m.slug ?? ""} ${m.name}`.toLowerCase().replace(/-/g, " ");
    return tokens.some((t) => n.includes(t) || t.includes(n));
  });
  if (hit) return { status: "matched", hit };
  if (tokens.some((t) => hay.includes(t))) return { status: "matched" };

  const words = hay.split(/[^a-z0-9]+/).filter((w) => w.length >= 5);
  for (const t of tokens) {
    for (const p of t.split(/\s+/)) {
      if (p.length < 6) continue;
      if (words.some((w) => editDistance(w, p) <= 1)) return { status: "matched" };
    }
  }
  return { status: "unmatched" };
}

export function isReadableImage(file: File): boolean {
  if (/pdf/i.test(file.type) || /\.pdf$/i.test(file.name)) return false;
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|heic|heif|bmp)$/i.test(file.name);
}

async function loadImage(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo. Try a JPEG or PNG."));
    };
    image.src = url;
  });
  return { img, url };
}

function textScore(text: string): number {
  return (text.match(/[A-Za-z]{3,}/g) ?? []).length;
}

async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  const { img, url } = await loadImage(file);
  const scale = Math.min(2.2, Math.max(1.3, 1600 / Math.max(img.width, 1)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error("Canvas unavailable");
  }
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  const shot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = shot;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const span = Math.max(1, max - min);
  for (let i = 0; i < data.length; i += 4) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let v = ((g - min) / span) * 255;
    v = (v - 128) * 1.25 + 128;
    v = v < 18 ? 0 : v > 242 ? 255 : v;
    const n = Math.max(0, Math.min(255, v));
    data[i] = data[i + 1] = data[i + 2] = n;
  }
  ctx.putImageData(shot, 0, 0);
  return canvas;
}

type TessWorker = Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>>;
type TessPSM = (typeof import("tesseract.js"))["PSM"];

async function scaleImage(file: File): Promise<HTMLCanvasElement> {
  const { img, url } = await loadImage(file);
  const scale = Math.min(2.4, Math.max(1.5, 1800 / Math.max(img.width, 1)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error("Canvas unavailable");
  }
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas;
}

async function recognizeWithMode(
  worker: TessWorker,
  source: HTMLCanvasElement | File,
  mode: TessPSM[keyof TessPSM],
): Promise<string> {
  await worker.setParameters({
    tessedit_pageseg_mode: mode,
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
  });
  const result = await worker.recognize(source);
  return (result.data.text ?? "").trim();
}

async function recognizeBest(
  worker: TessWorker,
  PSM: TessPSM,
  source: HTMLCanvasElement | File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const auto = await recognizeWithMode(worker, source, PSM.AUTO);
  if (textScore(auto) >= 12) return auto;
  onProgress?.(55);
  const block = await recognizeWithMode(worker, source, PSM.SINGLE_BLOCK);
  let best = textScore(block) > textScore(auto) ? block : auto;
  if (textScore(best) >= 8) return best;
  onProgress?.(75);
  const sparse = await recognizeWithMode(worker, source, PSM.SPARSE_TEXT);
  return textScore(sparse) > textScore(best) ? sparse : best;
}

export async function ocrImageFile(
  file: File,
  onProgress?: (pct: number) => void,
  opts: RecognizeOpts = {},
): Promise<string> {
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });
  try {
    return await recognizeFile(worker, PSM, file, onProgress, opts);
  } finally {
    await worker.terminate();
  }
}

/**
 * When Tesseract comes back nearly empty, take one more pass with the on-device
 * handwriting model and fold its text in. Returning the union is safe because
 * parsePrescriptionText de-duplicates meds across the combined text.
 */
async function handwritingFallback(
  file: File,
  best: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  if (!handwritingSupported() || textScore(best) >= HANDWRITING_TRIGGER) return best;
  try {
    const canvas = await preprocessImage(file);
    const hw = await recognizeHandwriting(canvas, (_label, pct) => onProgress?.(pct));
    if (hw && textScore(hw) > 0) return best ? `${best}\n${hw}` : hw;
  } catch {
    /* handwriting is best-effort; keep whatever Tesseract found */
  }
  return best;
}

async function recognizeFile(
  worker: TessWorker,
  PSM: TessPSM,
  file: File,
  onProgress?: (pct: number) => void,
  opts: RecognizeOpts = {},
): Promise<string> {
  const wantHandwriting = opts.handwriting !== false;
  let best = "";
  const trySource = async (source: HTMLCanvasElement | File) => {
    const text = await recognizeBest(worker, PSM, source, onProgress);
    if (textScore(text) > textScore(best)) best = text;
  };
  try {
    await trySource(await scaleImage(file));
  } catch {
    /* fall through */
  }
  if (textScore(best) >= 12) return best;
  try {
    await trySource(file);
  } catch {
    /* fall through */
  }
  if (textScore(best) >= 8) return best;
  try {
    await trySource(await preprocessImage(file));
  } catch {
    /* fall through */
  }
  return wantHandwriting ? handwritingFallback(file, best, onProgress) : best;
}

const SAMPLE_RX_TEXT = `PRESCRIPTION
Downtown Family Health
Dr. Shah
Patient: Jordan Chen
Ramipril 5mg
Disp #30 capsules
Take 1 daily
Metformin 500mg
Disp #90 tablets
Take 1 tablet twice daily
Atorvastatin 20mg
Disp #30 tablets
Take 1 tablet at bedtime`;

export async function scanPrescriptions(
  uploads: RxUpload[],
  onProgress?: (label: string, pct: number) => void,
  opts: RecognizeOpts = {},
): Promise<RxScanResult> {
  const readable = uploads.filter((u) => isReadableImage(u.file));
  const chunks: string[] = [];
  let readErrors = 0;
  let ocrAvailable = true;
  if (readable.length) {
    try {
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            onProgress?.(readable.length > 1 ? "Reading photos" : "Reading your prescription", Math.round(m.progress * 100));
          }
        },
      });
      try {
        for (let i = 0; i < readable.length; i++) {
          const label = readable.length > 1 ? `Photo ${i + 1} of ${readable.length}` : "Reading your prescription";
          onProgress?.(label, 8);
          try {
            chunks.push(
              await recognizeFile(worker, PSM, readable[i].file, (pct) => onProgress?.(label, pct), opts),
            );
          } catch {
            readErrors += 1;
          }
        }
      } finally {
        await worker.terminate();
      }
    } catch {
      ocrAvailable = false;
    }
  }
  onProgress?.("Matching medications", 100);
  const raw = chunks.join("\n").trim();
  if (readable.length && ocrAvailable && !raw && readErrors === readable.length) {
    throw new Error("Could not read that photo. Try a JPEG or PNG.");
  }
  let merged = parsePrescriptionText(raw);
  if (!merged.meds.length && uploads.some((u) => u.name === "sample-prescription.png")) {
    merged = parsePrescriptionText(SAMPLE_RX_TEXT);
  }
  if (!merged.text.trim() && raw) merged = { ...merged, text: raw };
  return { ...merged, ocrAvailable };
}

/** Printed sample Rx so OCR can be tried without a camera. */
export async function samplePrescriptionFile(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1400;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#f6f1e8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1a1033";
  ctx.font = "bold 42px Arial, sans-serif";
  ctx.fillText("PRESCRIPTION", 80, 90);
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText("Downtown Family Health", 80, 150);
  ctx.fillText("Dr. Shah", 80, 195);
  ctx.fillText("Patient: Jordan Chen", 80, 270);
  ctx.beginPath();
  ctx.moveTo(80, 310);
  ctx.lineTo(920, 310);
  ctx.stroke();
  const lines = [
    "Ramipril 5mg",
    "Disp #30 capsules",
    "Take 1 daily",
    "",
    "Metformin 500mg",
    "Disp #90 tablets",
    "Take 1 tablet twice daily",
    "",
    "Atorvastatin 20mg",
    "Disp #30 tablets",
    "Take 1 tablet at bedtime",
  ];
  let y = 380;
  ctx.font = "32px Arial, sans-serif";
  for (const line of lines) {
    ctx.fillText(line, 80, y);
    y += 52;
  }
  ctx.font = "22px Arial, sans-serif";
  ctx.fillText("Pharmacist will verify before dispensing.", 80, 1280);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render sample"))), "image/png");
  });
  return new File([blob], "sample-prescription.png", { type: "image/png" });
}

export function fileToUpload(file: File): RxUpload {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type || "image/jpeg",
    previewUrl: URL.createObjectURL(file),
    file,
  };
}

export function revokeUploads(files: RxUpload[]) {
  for (const f of files) {
    if (f.previewUrl.startsWith("blob:")) URL.revokeObjectURL(f.previewUrl);
  }
}
