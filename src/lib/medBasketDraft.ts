/** Draft-only medicine list — add several, then prescribe or consult. */

import { drugs } from "@/lib/data";
import { addPrescriptionReport } from "@/lib/patientRecords";

export interface BasketItem {
  slug: string;
  name: string;
  generic?: string;
  dose: string;
  qty: number;
  rx: boolean;
  price: number;
  coverage: number;
  prescriptionFile?: string;
  viaConsult?: boolean;
}

const KEY = "pp.draft.medBasket";
const RX_KEY = "pp.draft.medBasketRx";
const EVENT = "pp-med-basket";
export const OPEN_LIST_EVENT = "pp-open-med-list";
export const CROP_RX_EVENT = "pp-crop-rx";
export const ASK_RX_UPLOAD_EVENT = "pp-ask-rx-upload";
export const DISPENSING_FEE = 11.99;

export type DraftRxBox = { x: number; y: number; w: number; h: number };

export type DraftRxFound = {
  name: string;
  strength: string;
  slug?: string;
  onList: boolean;
  directions?: string;
  snippetDataUrl?: string;
  snippetBox?: DraftRxBox;
};

export type DraftRxUpload = {
  fileName: string;
  matched: number;
  found: DraftRxFound[];
  ocrText?: string;
  ocrAvailable?: boolean;
  previewDataUrl?: string;
  reading?: boolean;
};

let previewMemory: { fileName: string; url: string } | null = null;
let snippetMemory: { fileName: string; urls: (string | undefined)[] } | null = null;
let rxFileMemory: { fileName: string; file: File } | null = null;
let rxOriginalMemory: { fileName: string; file: File; archiveDataUrl?: string } | null = null;

function rememberSnippets(fileName: string, found: DraftRxFound[]) {
  snippetMemory = { fileName, urls: found.map((row) => row.snippetDataUrl) };
}

function withSnippets(rx: DraftRxUpload): DraftRxUpload {
  if (snippetMemory?.fileName !== rx.fileName) return rx;
  return {
    ...rx,
    found: rx.found.map((row, i) =>
      row.snippetDataUrl || !snippetMemory!.urls[i]
        ? row
        : { ...row, snippetDataUrl: snippetMemory!.urls[i] },
    ),
  };
}

export function setDraftRxFile(fileName: string, file: File | null) {
  rxFileMemory = file ? { fileName, file } : null;
}

export function getDraftRxFile(fileName?: string): File | null {
  if (!rxFileMemory) return null;
  if (fileName && rxFileMemory.fileName !== fileName) return null;
  return rxFileMemory.file;
}

/** Uncropped original — profile / full prescription. Crop is only for scanning. */
export function setDraftRxOriginal(file: File | null) {
  rxOriginalMemory = file ? { fileName: file.name, file } : null;
}

export function getDraftRxOriginal(): File | null {
  return rxOriginalMemory?.file ?? null;
}

export function setDraftRxArchivePreview(dataUrl: string | undefined) {
  if (!rxOriginalMemory || !dataUrl) return;
  rxOriginalMemory.archiveDataUrl = dataUrl;
}

export function getDraftRxArchivePreview(): string | undefined {
  return rxOriginalMemory?.archiveDataUrl;
}

export function setDraftRxPreviewMemory(fileName: string, url: string | null) {
  if (previewMemory?.url.startsWith("blob:")) URL.revokeObjectURL(previewMemory.url);
  previewMemory = url ? { fileName, url } : null;
}

export function draftRxPreviewSrc(rx: DraftRxUpload | null): string | undefined {
  if (!rx) return undefined;
  if (previewMemory?.fileName === rx.fileName) return previewMemory.url;
  return rx.previewDataUrl;
}

function readRx(): DraftRxUpload | null {
  try {
    const raw = localStorage.getItem(RX_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftRxUpload;
    return parsed?.fileName ? parsed : null;
  } catch {
    return null;
  }
}

export function getDraftRxUpload(): DraftRxUpload | null {
  const rx = readRx();
  return rx ? withSnippets(rx) : null;
}

export function setDraftRxUpload(rx: DraftRxUpload | null) {
  if (!rx) {
    localStorage.removeItem(RX_KEY);
    setDraftRxPreviewMemory("", null);
    snippetMemory = null;
    rxFileMemory = null;
    rxOriginalMemory = null;
  } else {
    rememberSnippets(rx.fileName, rx.found);
    try {
      localStorage.setItem(RX_KEY, JSON.stringify(rx));
    } catch {
      const rest = { ...rx };
      delete rest.previewDataUrl;
      rest.found = rest.found.map((row) => {
        const copy = { ...row };
        delete copy.snippetDataUrl;
        return copy;
      });
      try {
        localStorage.setItem(RX_KEY, JSON.stringify(rest));
      } catch {
        /* quota */
      }
    }
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearDraftRxUpload() {
  setDraftRxUpload(null);
  resetPrescriptionFiles();
}

export function requestMedListPopover() {
  window.dispatchEvent(new Event(OPEN_LIST_EVENT));
}

export function requestRxCrop(file: File) {
  setDraftRxOriginal(file);
  requestMedListPopover();
  window.dispatchEvent(new CustomEvent<File>(CROP_RX_EVENT, { detail: file }));
}

export function requestRxUpload() {
  requestMedListPopover();
  window.dispatchEvent(new Event(ASK_RX_UPLOAD_EVENT));
}

export function patchDraftRxFound(index: number, patch: Partial<DraftRxFound>) {
  const rx = getDraftRxUpload();
  if (!rx || index < 0 || index >= rx.found.length) return;
  const found = rx.found.map((row, i) => (i === index ? { ...row, ...patch } : row));
  setDraftRxUpload({ ...rx, found });
}

export function removeDraftRxFound(index: number) {
  const rx = getDraftRxUpload();
  if (!rx || index < 0 || index >= rx.found.length) return;
  setDraftRxUpload({ ...rx, found: rx.found.filter((_, i) => i !== index) });
}

export function addDraftRxFound() {
  const rx = getDraftRxUpload();
  if (!rx) return;
  setDraftRxUpload({
    ...rx,
    found: [...rx.found, { name: "", strength: "", onList: false, directions: "" }],
  });
}

function read(): BasketItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BasketItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: BasketItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeMedBasket(cb: () => void) {
  const on = () => cb();
  window.addEventListener(EVENT, on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener(EVENT, on);
    window.removeEventListener("storage", on);
  };
}

export function listMedBasket(): BasketItem[] {
  return read();
}

export function addToMedBasket(input: { slug: string; dose: string; qty: number }): BasketItem | null {
  const drug = drugs.find((d) => d.slug === input.slug);
  if (!drug) return null;
  const dose = drug.dosages.includes(input.dose) ? input.dose : drug.dosages[0];
  const qty = [30, 60, 90].includes(input.qty) ? input.qty : 30;
  const items = read();
  const i = items.findIndex((row) => row.slug === drug.slug && row.dose === dose);
  const next: BasketItem = {
    slug: drug.slug,
    name: drug.name,
    generic: drug.generic,
    dose,
    qty,
    rx: drug.rx,
    price: drug.price,
    coverage: drug.coverage,
    prescriptionFile: i >= 0 ? items[i].prescriptionFile : undefined,
    viaConsult: i >= 0 ? items[i].viaConsult : undefined,
  };
  if (i >= 0) items[i] = next;
  else items.push(next);
  write(items);
  return next;
}

export function updateMedBasketItem(slug: string, dose: string, patch: Partial<BasketItem>) {
  write(
    read().map((row) => (row.slug === slug && row.dose === dose ? { ...row, ...patch } : row)),
  );
}

export function removeFromMedBasket(slug: string, dose: string) {
  const next = read().filter((row) => !(row.slug === slug && row.dose === dose));
  write(next);
  if (!next.length) setDraftRxUpload(null);
}

export function clearMedBasket() {
  write([]);
  setDraftRxUpload(null);
}

export function basketNeedsConsult(items = read()): boolean {
  return items.some((row) => row.rx && !row.prescriptionFile && !row.viaConsult);
}

/** Attached Rx photo does not cover selected medicines that still need a prescription. */
export function basketRxDoesNotMatch(items = read()): boolean {
  const rx = getDraftRxUpload();
  if (!rx?.fileName || rx.reading) return false;
  return basketNeedsConsult(items);
}

export const RX_MISMATCH_COPY = {
  title: "Prescription doesn’t match",
  note: "The one you attached doesn’t cover the medicine you’ve selected. Upload a matching prescription, or consult a doctor to issue a new one. That prescription will be available for review.",
  alert: "The prescription you attached doesn’t match the medicine you’ve selected. Continue to consult an available doctor to issue a new prescription. It will be available for review.",
};

export function consultLines(items = read()) {
  return items
    .filter((row) => row.rx && !row.prescriptionFile && !row.viaConsult)
    .map((row) => ({ slug: row.slug, name: row.name, dose: row.dose, qty: row.qty }));
}

export function markBasketConsultIssued() {
  write(
    read().map((row) =>
      row.rx && !row.prescriptionFile ? { ...row, viaConsult: true } : row,
    ),
  );
}

export function resetPrescriptionFiles() {
  write(
    read().map((row) =>
      row.prescriptionFile ? { ...row, prescriptionFile: undefined, viaConsult: false } : row,
    ),
  );
}

export function markPrescriptionOnSlugs(fileName: string, slugs: string[]) {
  if (!slugs.length) return;
  const set = new Set(slugs);
  write(
    read().map((row) =>
      set.has(row.slug) ? { ...row, prescriptionFile: fileName, viaConsult: false } : row,
    ),
  );
}

export function lineCost(item: BasketItem) {
  return Math.round(item.price * (item.qty / 30) * 100) / 100;
}

export function basketTotals(items = read()) {
  const drugCost = items.reduce((s, row) => s + lineCost(row), 0);
  const fee = items.length ? DISPENSING_FEE : 0;
  const covered = items.reduce(
    (s, row) => s + Math.round(lineCost(row) * (row.coverage / 100) * 100) / 100,
    0,
  );
  const total = Math.max(0, Math.round((drugCost + fee - covered) * 100) / 100);
  return { drugCost, fee, covered, total };
}

export function confirmBasketForConsult() {
  sessionStorage.setItem("pp.draft.basketConfirmed", "1");
}

export function basketIsConfirmed() {
  return sessionStorage.getItem("pp.draft.basketConfirmed") === "1";
}

/** Copy the shop Rx into the patient folder. Uses the uncropped photo when we have it. */
export function syncDraftRxToRecords() {
  const rx = getDraftRxUpload();
  if (!rx?.fileName || rx.reading) return;
  const archive = getDraftRxArchivePreview();
  addPrescriptionReport("self", {
    fileName: rx.fileName,
    previewDataUrl: archive,
    medicines: rx.found.map((row) => row.name),
    replacePreview: Boolean(archive),
  });
}
