/**
 * Page-scoped search.
 *
 * Each page searches only its own dataset. Cross-page / FAQ universal search
 * will be enabled separately later — do not mix scopes here.
 */

export type PageSearchScope =
  | "appointments"
  | "appointments-providers"
  | "treatments"
  | "medications"
  | "offers"
  | "pharmacies"
  | "doctors"
  | "facilities"
  | "orders"
  | "facility-services"
  /** Reserved — not wired yet. */
  | "universal";

export type PageSearchCopy = {
  placeholder: string;
  ariaLabel: string;
  listeningEn: string;
  listeningNe: string;
};

export const PAGE_SEARCH_COPY: Record<PageSearchScope, PageSearchCopy> = {
  appointments: {
    placeholder: 'Try "fever", "acne", "pharmacy", or "ambulance".',
    ariaLabel: "Search specialisations, treatments, pharmacies, labs, and services",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
  "appointments-providers": {
    placeholder: 'Try a doctor name, "clinic", or city…',
    ariaLabel: "Search doctors, clinics, and hospitals",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
  treatments: {
    placeholder: 'Try "heartburn", "birth control", "blood pressure"…',
    ariaLabel: "Search symptoms or treatments",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
  medications: {
    placeholder: "Search brand or generic name…",
    ariaLabel: "Search medications",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
  offers: {
    placeholder: "Search code, bank, card…",
    ariaLabel: "Search offers",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
  pharmacies: {
    placeholder: "Name or place",
    ariaLabel: "Search pharmacies",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
  doctors: {
    placeholder: "Name, city or degree",
    ariaLabel: "Search doctors",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
  facilities: {
    placeholder: "Name or district",
    ariaLabel: "Search hospitals, clinics, and labs",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
  orders: {
    placeholder: 'Try a medicine, lab, or "transfer"…',
    ariaLabel: "Search live orders",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
  "facility-services": {
    placeholder: 'Try "fever", "acne", "pharmacy", or "ambulance".',
    ariaLabel: "Search consultants, labs, and hospital services",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
  universal: {
    placeholder: "Search treatments, meds, FAQ…",
    ariaLabel: "Search everything",
    listeningEn: "Listening in English… speak, then pause",
    listeningNe: "Listening in Nepali… speak, then pause",
  },
};

export {
  compactSearchText,
  fieldsMatchQuery,
  normalizeSearchQuery,
  textMatchesQuery,
} from "@/lib/searchMatch";
