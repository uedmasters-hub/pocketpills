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
    placeholder: "Search by name, city, or street…",
    ariaLabel: "Search pharmacies",
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

export function normalizeSearchQuery(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ");
}

export function textMatchesQuery(haystack: string, query: string): boolean {
  const needle = normalizeSearchQuery(query);
  if (!needle) return true;
  const h = normalizeSearchQuery(haystack);
  if (h.includes(needle)) return true;
  return needle.split(" ").every((w) => w.length > 0 && h.includes(w));
}
