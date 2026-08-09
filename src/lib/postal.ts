/** Canadian postal code helpers + delivery coverage lookup. */

export function formatPostal(raw: string) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

export function isValidPostal(v: string) {
  return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(v.trim());
}

export function postalFsa(v: string) {
  return v.toUpperCase().replace(/\s/g, "").slice(0, 3);
}

/** First letter of FSA → province / territory. */
const FSA_PROVINCE: Record<string, { code: string; name: string }> = {
  A: { code: "NL", name: "Newfoundland and Labrador" },
  B: { code: "NS", name: "Nova Scotia" },
  C: { code: "PE", name: "Prince Edward Island" },
  E: { code: "NB", name: "New Brunswick" },
  G: { code: "QC", name: "Quebec" },
  H: { code: "QC", name: "Quebec" },
  J: { code: "QC", name: "Quebec" },
  K: { code: "ON", name: "Ontario" },
  L: { code: "ON", name: "Ontario" },
  M: { code: "ON", name: "Ontario" },
  N: { code: "ON", name: "Ontario" },
  P: { code: "ON", name: "Ontario" },
  R: { code: "MB", name: "Manitoba" },
  S: { code: "SK", name: "Saskatchewan" },
  T: { code: "AB", name: "Alberta" },
  V: { code: "BC", name: "British Columbia" },
  X: { code: "NT", name: "Northwest Territories / Nunavut" },
  Y: { code: "YT", name: "Yukon" },
};

export type DeliverySpeed = "standard" | "express" | "same_day";

export interface DeliveryLookup {
  postal: string;
  fsa: string;
  province: { code: string; name: string };
  covered: boolean;
  /** Free standard delivery always when covered. */
  speeds: { id: DeliverySpeed; label: string; eta: string; price: string; note?: string }[];
  pharmacy: { name: string; address: string; license: string };
  cityHint: string;
}

const EAST = new Set(["ON", "QC", "NL", "NS", "PE", "NB"]);
const WEST = new Set(["BC", "AB", "SK", "MB"]);

function pharmacyFor(code: string) {
  if (WEST.has(code) || code === "YT" || code === "NT") {
    return {
      name: "Pocketpills West",
      address: "Unit 200 - 4180 Lougheed Hwy, Burnaby, BC V5C 6A7",
      license: "#30291",
    };
  }
  return {
    name: "Pocketpills East",
    address: "Unit 6 - 6375 Dixie Rd, Mississauga, ON L5T 2E7",
    license: "#307234",
  };
}

function cityHint(fsa: string) {
  const map: Record<string, string> = {
    M5: "downtown Toronto",
    M4: "Toronto",
    M6: "Toronto",
    L5: "Mississauga",
    L4: "the GTA",
    K1: "Ottawa",
    H2: "Montreal",
    H3: "Montreal",
    V6: "Vancouver",
    V5: "Vancouver",
    T2: "Calgary",
    T5: "Edmonton",
    R3: "Winnipeg",
    S7: "Saskatoon",
  };
  return map[fsa.slice(0, 2)] ?? "";
}

/** Same-day FSAs (demo coverage for major metros). */
const SAME_DAY = new Set([
  "M4", "M5", "M6", "L4", "L5",
  "H2", "H3", "H4",
  "V5", "V6",
  "T2", "T5",
]);

/**
 * Resolve delivery options for a Canadian postal code.
 * Invalid input returns null — caller should validate first.
 */
export function lookupDelivery(postalRaw: string): DeliveryLookup | null {
  if (!isValidPostal(postalRaw)) return null;
  const postal = formatPostal(postalRaw);
  const fsa = postalFsa(postalRaw);
  const letter = fsa[0];
  const province = FSA_PROVINCE[letter];
  if (!province) {
    return {
      postal,
      fsa,
      province: { code: "—", name: "Unknown region" },
      covered: false,
      speeds: [],
      pharmacy: pharmacyFor("ON"),
      cityHint: "",
    };
  }

  const sameDay = SAME_DAY.has(fsa.slice(0, 2));
  const speeds: DeliveryLookup["speeds"] = [
    {
      id: "standard",
      label: "Standard",
      eta: EAST.has(province.code) || WEST.has(province.code) ? "2–3 business days" : "3–5 business days",
      price: "Free",
      note: "Included with every order",
    },
    {
      id: "express",
      label: "Express",
      eta: "1–2 business days",
      price: "$9.99",
      note: "Priority packing",
    },
  ];
  if (sameDay) {
    speeds.push({
      id: "same_day",
      label: "Same-day",
      eta: "Today, before 9 PM",
      price: "$14.99",
      note: "Order by 1 PM local time",
    });
  }

  return {
    postal,
    fsa,
    province,
    covered: true,
    speeds,
    pharmacy: pharmacyFor(province.code),
    cityHint: cityHint(fsa),
  };
}
