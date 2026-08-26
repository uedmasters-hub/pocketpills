/** Draft-only medicine list — add several, then prescribe or consult. */

import { drugs } from "@/lib/data";

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
export const DISPENSING_FEE = 11.99;

export type DraftRxFound = {
  name: string;
  strength: string;
  slug?: string;
  onList: boolean;
  directions?: string;
};

export type DraftRxUpload = {
  fileName: string;
  matched: number;
  found: DraftRxFound[];
  ocrText?: string;
  ocrAvailable?: boolean;
};

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
  return readRx();
}

export function setDraftRxUpload(rx: DraftRxUpload | null) {
  if (rx) localStorage.setItem(RX_KEY, JSON.stringify(rx));
  else localStorage.removeItem(RX_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function clearDraftRxUpload() {
  setDraftRxUpload(null);
  resetPrescriptionFiles();
}

export function requestMedListPopover() {
  window.dispatchEvent(new Event(OPEN_LIST_EVENT));
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
