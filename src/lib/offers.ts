/** Offers, partner discounts, and claim state (localStorage). */

export type OfferKind = "featured" | "card" | "bank" | "other";

export interface Offer {
  id: string;
  kind: OfferKind;
  /** Short chip above the title */
  badge: string;
  title: string;
  summary: string;
  /** Primary savings line, e.g. "15% off" or "$139" */
  savings: string;
  /** Promo / partner code when applicable */
  code?: string;
  /** Deep link when the offer is product-specific */
  href?: string;
  cta?: string;
  /** Card / bank partner name for filtering */
  partner?: string;
  /** Fine print */
  terms: string;
  expires?: string;
  /** Highlight in hero strip */
  spotlight?: boolean;
}

const CLAIMED_KEY = "pp.offers.claimed";
const ACTIVE_KEY = "pp.offers.active";

export const OFFERS: Offer[] = [
  /* ── Featured product / care ─────────────────────────── */
  {
    id: "ozempic-139",
    kind: "featured",
    badge: "Limited time",
    title: "Ozempic® at $139",
    summary: "Brand-name semaglutide at a transparent cash price, with pharmacist support and free delivery.",
    savings: "$139",
    code: "OZEMPIC139",
    href: "/drug/ozempic",
    cta: "View medication",
    terms: "Cash price before insurance. Eligibility and stock verified by a Canadian pharmacist. Offer may change.",
    expires: "While supplies last",
    spotlight: true,
  },
  {
    id: "hair-39",
    kind: "featured",
    badge: "First month",
    title: "Hair loss care from $39/mo",
    summary: "Clinician-prescribed finasteride or minoxidil plans with discreet packaging.",
    savings: "$39/mo",
    code: "HAIR39",
    href: "/find-care",
    cta: "Start assessment",
    terms: "Introductory month for new hair-loss consultations. Ongoing price shown after clinician review.",
    expires: "New patients",
    spotlight: true,
  },
  {
    id: "bc-free",
    kind: "featured",
    badge: "Free assessment",
    title: "Birth control — $0 consult",
    summary: "Online assessment with a licensed clinician. Most plans cover the prescription.",
    savings: "Consult $0",
    href: "/treatment/birth-control",
    cta: "Get started",
    terms: "Assessment fee waived. Medication cost depends on your provincial and private coverage.",
    spotlight: true,
  },
  {
    id: "first-fill",
    kind: "featured",
    badge: "New to PocketPills",
    title: "First fill credit",
    summary: "Get $20 off your first prescription fill when you transfer or upload an Rx.",
    savings: "$20 off",
    code: "WELCOME20",
    href: "/fill",
    cta: "Fill a prescription",
    terms: "One-time credit on your first completed fill. Cannot combine with cash-price specials under $50.",
    expires: "90 days after signup",
  },

  /* ── Credit / debit cards ────────────────────────────── */
  {
    id: "card-visa",
    kind: "card",
    badge: "Visa",
    title: "Visa Infinite — 10% back",
    summary: "Earn 10% statement credit on eligible PocketPills pharmacy purchases billed to Visa Infinite.",
    savings: "10% back",
    code: "VISA10PP",
    partner: "Visa",
    terms: "Canadian Visa Infinite cards. Credit posted by issuer within 1–2 statements. Excludes consult fees.",
    expires: "Ongoing",
  },
  {
    id: "card-mc",
    kind: "card",
    badge: "Mastercard",
    title: "World Elite Mastercard — $15 off",
    summary: "World Elite cardholders save $15 on orders over $75 when paying with Mastercard.",
    savings: "$15 off",
    code: "MCELITE15",
    partner: "Mastercard",
    terms: "Minimum $75 before insurance. One redemption per calendar month.",
    expires: "Ongoing",
  },
  {
    id: "card-amex",
    kind: "card",
    badge: "Amex",
    title: "American Express — 2× points",
    summary: "Double Membership Rewards® points on PocketPills when you pay with a linked Amex.",
    savings: "2× points",
    code: "AMEX2X",
    partner: "American Express",
    terms: "Must enroll via Amex Offers. Points issued by American Express per their terms.",
    expires: "Quarterly refresh",
  },
  {
    id: "card-interac",
    kind: "card",
    badge: "Interac",
    title: "Interac debit — $5 off delivery upgrades",
    summary: "Pay with Interac debit and waive same-day upgrade fees in select cities.",
    savings: "$5 off",
    code: "INTERAC5",
    partner: "Interac",
    terms: "Where same-day is available. Standard delivery remains free either way.",
    expires: "Ongoing",
  },

  /* ── Banks ───────────────────────────────────────────── */
  {
    id: "bank-td",
    kind: "bank",
    badge: "TD",
    title: "TD Bank — 12% off cash pays",
    summary: "TD chequing or credit customers save 12% on the uninsured portion of eligible fills.",
    savings: "12% off",
    code: "TDBANK12",
    partner: "TD",
    terms: "Verify with the last 4 digits of your TD card at checkout. Max $40 savings per order.",
    expires: "Dec 31, 2026",
  },
  {
    id: "bank-rbc",
    kind: "bank",
    badge: "RBC",
    title: "RBC — free priority packing",
    summary: "RBC clients get complimentary priority packing on every order this season.",
    savings: "Priority pack",
    code: "RBCPACK",
    partner: "RBC",
    terms: "Enter your RBC client code once; applies automatically to future orders on this device.",
    expires: "Ongoing",
  },
  {
    id: "bank-scotiabank",
    kind: "bank",
    badge: "Scotiabank",
    title: "Scotiabank — $25 transfer bonus",
    summary: "Transfer a prescription and get $25 credit when you bank with Scotiabank.",
    savings: "$25 credit",
    code: "SCOTIA25",
    partner: "Scotiabank",
    href: "/transfer",
    cta: "Start a transfer",
    terms: "New transfers only. Credit applied after the first successful fill from the transfer.",
    expires: "Jun 30, 2026",
  },
  {
    id: "bank-bmo",
    kind: "bank",
    badge: "BMO",
    title: "BMO — 8% off wellness consults",
    summary: "Save 8% on doctor-led treatment consult fees when you pay with BMO.",
    savings: "8% off",
    code: "BMOCARE8",
    partner: "BMO",
    href: "/find-care",
    cta: "Browse treatments",
    terms: "Applies to consult fees only, not medication. Stacks with free-assessment promos where noted.",
    expires: "Ongoing",
  },
  {
    id: "bank-cibc",
    kind: "bank",
    badge: "CIBC",
    title: "CIBC — family account perk",
    summary: "CIBC customers can add a second family member at no admin fee for 12 months.",
    savings: "Family perk",
    code: "CIBCFAM",
    partner: "CIBC",
    href: "/account/family",
    cta: "Manage family",
    terms: "One complimentary family seat. Requires signed-in account linked to this offer.",
    expires: "Ongoing",
  },

  /* ── Other ───────────────────────────────────────────── */
  {
    id: "other-refer",
    kind: "other",
    badge: "Referral",
    title: "Give $20, get $20",
    summary: "Share PocketPills with a friend. You both receive $20 after their first fill.",
    savings: "$20 each",
    code: "FRIEND20",
    terms: "Friend must be new to PocketPills. Credits apply to prescription fills, not consults.",
    expires: "Ongoing",
  },
  {
    id: "other-student",
    kind: "other",
    badge: "Students",
    title: "Student — 15% off cash pays",
    summary: "Full-time students save 15% on the uninsured portion with a .edu or student ID verify.",
    savings: "15% off",
    code: "STUDENT15",
    terms: "Annual re-verification. Max $50 per order. Not valid with bank cash-pay discounts.",
    expires: "Academic year",
  },
  {
    id: "other-senior",
    kind: "other",
    badge: "65+",
    title: "Seniors — waived dispensing fee",
    summary: "Patients 65+ get the dispensing fee waived on up to three fills each month.",
    savings: "Fee waived",
    code: "SENIORFEE",
    terms: "Confirm date of birth on your profile. Provincial seniors’ plans still bill first.",
    expires: "Ongoing",
  },
  {
    id: "other-employer",
    kind: "other",
    badge: "Workplace",
    title: "Employer wellness code",
    summary: "If your workplace partners with PocketPills, enter their code for plan-specific savings.",
    savings: "Varies",
    code: "WORKWELL",
    terms: "Replace WORKWELL with your employer code if different. HR can confirm eligibility.",
    expires: "Per employer",
  },
];

export const OFFER_FILTERS: { id: "all" | OfferKind; label: string }[] = [
  { id: "all", label: "All offers" },
  { id: "featured", label: "Featured" },
  { id: "card", label: "Cards" },
  { id: "bank", label: "Banks" },
  { id: "other", label: "Other discounts" },
];

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export function loadClaimed(): Set<string> {
  return readSet(CLAIMED_KEY);
}

export function loadActiveOfferId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveOfferId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new Event("pp-offers-change"));
  } catch {
    /* ignore */
  }
}

export function saveClaimed(ids: Set<string>) {
  writeSet(CLAIMED_KEY, ids);
  try {
    window.dispatchEvent(new Event("pp-offers-change"));
  } catch {
    /* ignore */
  }
}

export function getOffer(id: string) {
  return OFFERS.find((o) => o.id === id);
}

export function getActiveOffer() {
  const id = loadActiveOfferId();
  return id ? getOffer(id) ?? null : null;
}
