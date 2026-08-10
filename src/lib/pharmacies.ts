/** Canadian regions + sample community pharmacies PocketPills can transfer from. */

export interface Region {
  code: string;
  name: string;
  /** URL segment, lowercase */
  slug: string;
  hub: { name: string; address: string; license: string; college: string };
}

export interface AreaPharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  /** Walking / drive hint for demo lists */
  distance: string;
  sameDayHub: boolean;
}

export const REGIONS: Region[] = [
  {
    code: "AB",
    name: "Alberta",
    slug: "ab",
    hub: {
      name: "Pocketpills West",
      address: "Unit 200 - 4180 Lougheed Hwy, Burnaby, BC V5C 6A7",
      license: "#30291",
      college: "College of Pharmacists of BC (serves AB transfers)",
    },
  },
  {
    code: "BC",
    name: "British Columbia",
    slug: "bc",
    hub: {
      name: "Pocketpills West",
      address: "Unit 200 - 4180 Lougheed Hwy, Burnaby, BC V5C 6A7",
      license: "#30291",
      college: "College of Pharmacists of British Columbia",
    },
  },
  {
    code: "MB",
    name: "Manitoba",
    slug: "mb",
    hub: {
      name: "Pocketpills West",
      address: "Unit 200 - 4180 Lougheed Hwy, Burnaby, BC V5C 6A7",
      license: "#30291",
      college: "College of Pharmacists of Manitoba (partner)",
    },
  },
  {
    code: "NL",
    name: "Newfoundland & Labrador",
    slug: "nl",
    hub: {
      name: "Pocketpills East",
      address: "Unit 6 - 6375 Dixie Rd, Mississauga, ON L5T 2E7",
      license: "#307234",
      college: "Ontario College of Pharmacists",
    },
  },
  {
    code: "NB",
    name: "New Brunswick",
    slug: "nb",
    hub: {
      name: "Pocketpills East",
      address: "Unit 6 - 6375 Dixie Rd, Mississauga, ON L5T 2E7",
      license: "#307234",
      college: "Ontario College of Pharmacists",
    },
  },
  {
    code: "NS",
    name: "Nova Scotia",
    slug: "ns",
    hub: {
      name: "Pocketpills East",
      address: "Unit 6 - 6375 Dixie Rd, Mississauga, ON L5T 2E7",
      license: "#307234",
      college: "Ontario College of Pharmacists",
    },
  },
  {
    code: "NT",
    name: "Northwest Territories",
    slug: "nt",
    hub: {
      name: "Pocketpills West",
      address: "Unit 200 - 4180 Lougheed Hwy, Burnaby, BC V5C 6A7",
      license: "#30291",
      college: "College of Pharmacists of BC (territorial partner)",
    },
  },
  {
    code: "NU",
    name: "Nunavut",
    slug: "nu",
    hub: {
      name: "Pocketpills West",
      address: "Unit 200 - 4180 Lougheed Hwy, Burnaby, BC V5C 6A7",
      license: "#30291",
      college: "College of Pharmacists of BC (territorial partner)",
    },
  },
  {
    code: "ON",
    name: "Ontario",
    slug: "on",
    hub: {
      name: "Pocketpills East",
      address: "Unit 6 - 6375 Dixie Rd, Mississauga, ON L5T 2E7",
      license: "#307234",
      college: "Ontario College of Pharmacists",
    },
  },
  {
    code: "PE",
    name: "Prince Edward Island",
    slug: "pe",
    hub: {
      name: "Pocketpills East",
      address: "Unit 6 - 6375 Dixie Rd, Mississauga, ON L5T 2E7",
      license: "#307234",
      college: "Ontario College of Pharmacists",
    },
  },
  {
    code: "QC",
    name: "Quebec",
    slug: "qc",
    hub: {
      name: "Pocketpills East",
      address: "Unit 6 - 6375 Dixie Rd, Mississauga, ON L5T 2E7",
      license: "#307234",
      college: "Ontario College of Pharmacists (interprovincial)",
    },
  },
  {
    code: "SK",
    name: "Saskatchewan",
    slug: "sk",
    hub: {
      name: "Pocketpills West",
      address: "Unit 200 - 4180 Lougheed Hwy, Burnaby, BC V5C 6A7",
      license: "#30291",
      college: "Saskatchewan College of Pharmacy Professionals (partner)",
    },
  },
  {
    code: "YT",
    name: "Yukon",
    slug: "yt",
    hub: {
      name: "Pocketpills West",
      address: "Unit 200 - 4180 Lougheed Hwy, Burnaby, BC V5C 6A7",
      license: "#30291",
      college: "College of Pharmacists of BC (territorial partner)",
    },
  },
];

/** Seeded community pharmacies by province — enough for a real browse/select flow. */
const BY_PROVINCE: Record<string, Omit<AreaPharmacy, "province">[]> = {
  AB: [
    { id: "ab-1", name: "Shoppers Drug Mart — Kensington", address: "10201 104 Ave NW", city: "Edmonton", phone: "(780) 555-0142", hours: "8am–10pm", lat: 53.546, lng: -113.491, distance: "1.2 km", sameDayHub: true },
    { id: "ab-2", name: "London Drugs — Chinook", address: "6455 Macleod Trail SW", city: "Calgary", phone: "(403) 555-0198", hours: "9am–9pm", lat: 50.992, lng: -114.072, distance: "2.4 km", sameDayHub: true },
    { id: "ab-3", name: "Rexall — Whyte Ave", address: "10426 82 Ave NW", city: "Edmonton", phone: "(780) 555-0110", hours: "9am–8pm", lat: 53.518, lng: -113.498, distance: "3.1 km", sameDayHub: false },
    { id: "ab-4", name: "Safeway Pharmacy — Signal Hill", address: "5699 Signal Hill Centre SW", city: "Calgary", phone: "(403) 555-0177", hours: "8am–8pm", lat: 51.018, lng: -114.168, distance: "4.0 km", sameDayHub: false },
  ],
  BC: [
    { id: "bc-1", name: "Shoppers Drug Mart — Robson", address: "1125 Robson St", city: "Vancouver", phone: "(604) 555-0133", hours: "8am–midnight", lat: 49.285, lng: -123.126, distance: "0.8 km", sameDayHub: true },
    { id: "bc-2", name: "London Drugs — Broadway", address: "2220 W Broadway", city: "Vancouver", phone: "(604) 555-0166", hours: "9am–10pm", lat: 49.264, lng: -123.157, distance: "1.5 km", sameDayHub: true },
    { id: "bc-3", name: "Pharmasave — Victoria", address: "1594 Fairfield Rd", city: "Victoria", phone: "(250) 555-0121", hours: "9am–7pm", lat: 48.417, lng: -123.338, distance: "2.2 km", sameDayHub: false },
    { id: "bc-4", name: "Save-On-Foods Pharmacy — Burnaby", address: "4277 Kingsway", city: "Burnaby", phone: "(604) 555-0188", hours: "8am–9pm", lat: 49.232, lng: -123.006, distance: "3.6 km", sameDayHub: true },
  ],
  MB: [
    { id: "mb-1", name: "Shoppers Drug Mart — Osborne", address: "470 River Ave", city: "Winnipeg", phone: "(204) 555-0144", hours: "8am–10pm", lat: 49.872, lng: -97.146, distance: "1.0 km", sameDayHub: true },
    { id: "mb-2", name: "Rexall — Polo Park", address: "1485 Portage Ave", city: "Winnipeg", phone: "(204) 555-0190", hours: "9am–9pm", lat: 49.883, lng: -97.2, distance: "2.8 km", sameDayHub: false },
    { id: "mb-3", name: "Safeway Pharmacy — Grant Park", address: "1120 Grant Ave", city: "Winnipeg", phone: "(204) 555-0115", hours: "8am–8pm", lat: 49.855, lng: -97.16, distance: "3.4 km", sameDayHub: false },
  ],
  NL: [
    { id: "nl-1", name: "Shoppers Drug Mart — Bay Roberts", address: "286 Conception Bay Hwy", city: "Bay Roberts", phone: "(709) 555-0101", hours: "9am–9pm", lat: 47.596, lng: -53.265, distance: "<0.1 km", sameDayHub: false },
    { id: "nl-2", name: "Lawtons Drugs — St. John's", address: "70 Pippy Pl", city: "St. John's", phone: "(709) 555-0155", hours: "8am–10pm", lat: 47.58, lng: -52.735, distance: "1.8 km", sameDayHub: true },
    { id: "nl-3", name: "Dominion Pharmacy — Avalon Mall", address: "48 Kenmount Rd", city: "St. John's", phone: "(709) 555-0172", hours: "9am–8pm", lat: 47.56, lng: -52.76, distance: "2.5 km", sameDayHub: false },
  ],
  NB: [
    { id: "nb-1", name: "Shoppers Drug Mart — Fredericton", address: "465 Prospect St", city: "Fredericton", phone: "(506) 555-0130", hours: "8am–10pm", lat: 45.94, lng: -66.67, distance: "1.1 km", sameDayHub: true },
    { id: "nb-2", name: "Lawtons — Moncton", address: "499 Mountain Rd", city: "Moncton", phone: "(506) 555-0161", hours: "9am–9pm", lat: 46.1, lng: -64.8, distance: "2.0 km", sameDayHub: false },
    { id: "nb-3", name: "Jean Coutu — Saint John", address: "55 Hampton Rd", city: "Saint John", phone: "(506) 555-0184", hours: "9am–8pm", lat: 45.28, lng: -66.05, distance: "3.2 km", sameDayHub: false },
  ],
  NS: [
    { id: "ns-1", name: "Shoppers Drug Mart — Spring Garden", address: "5466 Spring Garden Rd", city: "Halifax", phone: "(902) 555-0122", hours: "8am–midnight", lat: 44.643, lng: -63.578, distance: "0.6 km", sameDayHub: true },
    { id: "ns-2", name: "Lawtons — Dartmouth Crossing", address: "110 Chain Lake Dr", city: "Dartmouth", phone: "(902) 555-0179", hours: "9am–9pm", lat: 44.7, lng: -63.55, distance: "4.1 km", sameDayHub: true },
    { id: "ns-3", name: "Sobeys Pharmacy — Bedford", address: "1496 Bedford Hwy", city: "Bedford", phone: "(902) 555-0148", hours: "8am–8pm", lat: 44.73, lng: -63.66, distance: "5.5 km", sameDayHub: false },
  ],
  NT: [
    { id: "nt-1", name: "Shoppers Drug Mart — Yellowknife", address: "5001 Franklin Ave", city: "Yellowknife", phone: "(867) 555-0111", hours: "9am–8pm", lat: 62.454, lng: -114.372, distance: "0.5 km", sameDayHub: false },
    { id: "nt-2", name: "Northern Pharmacy — Centre Square", address: "4910 50 Ave", city: "Yellowknife", phone: "(867) 555-0150", hours: "10am–6pm", lat: 62.456, lng: -114.37, distance: "0.9 km", sameDayHub: false },
  ],
  NU: [
    { id: "nu-1", name: "Arctic Pharmacy — Iqaluit", address: "Building 1085", city: "Iqaluit", phone: "(867) 555-0199", hours: "10am–6pm", lat: 63.746, lng: -68.517, distance: "0.4 km", sameDayHub: false },
    { id: "nu-2", name: "Northmart Pharmacy", address: "Astro Hill Complex", city: "Iqaluit", phone: "(867) 555-0134", hours: "9am–7pm", lat: 63.75, lng: -68.52, distance: "1.1 km", sameDayHub: false },
  ],
  ON: [
    { id: "on-1", name: "Shoppers Drug Mart — King West", address: "260 King St W", city: "Toronto", phone: "(416) 555-0100", hours: "8am–midnight", lat: 43.647, lng: -79.389, distance: "0.4 km", sameDayHub: true },
    { id: "on-2", name: "Rexall — Yonge & Bloor", address: "2 Bloor St E", city: "Toronto", phone: "(416) 555-0147", hours: "8am–10pm", lat: 43.671, lng: -79.387, distance: "1.6 km", sameDayHub: true },
    { id: "on-3", name: "Guardian — Mississauga", address: "3050 Confederation Pkwy", city: "Mississauga", phone: "(905) 555-0182", hours: "9am–9pm", lat: 43.59, lng: -79.64, distance: "3.2 km", sameDayHub: true },
    { id: "on-4", name: "Pharmasave — Ottawa Bank St", address: "221 Bank St", city: "Ottawa", phone: "(613) 555-0160", hours: "9am–8pm", lat: 45.417, lng: -75.696, distance: "2.1 km", sameDayHub: false },
    { id: "on-5", name: "Costco Pharmacy — Etobicoke", address: "50 Vickers Rd", city: "Toronto", phone: "(416) 555-0193", hours: "10am–8:30pm", lat: 43.63, lng: -79.55, distance: "6.8 km", sameDayHub: false },
  ],
  PE: [
    { id: "pe-1", name: "Shoppers Drug Mart — Charlottetown", address: "465 University Ave", city: "Charlottetown", phone: "(902) 555-0118", hours: "8am–10pm", lat: 46.24, lng: -63.13, distance: "0.7 km", sameDayHub: true },
    { id: "pe-2", name: "Lawtons — Summerside", address: "475 Granville St", city: "Summerside", phone: "(902) 555-0156", hours: "9am–8pm", lat: 46.4, lng: -63.79, distance: "2.9 km", sameDayHub: false },
  ],
  QC: [
    { id: "qc-1", name: "Jean Coutu — Plateau", address: "501 Avenue du Mont-Royal E", city: "Montréal", phone: "(514) 555-0125", hours: "8am–10pm", lat: 45.524, lng: -73.58, distance: "0.9 km", sameDayHub: true },
    { id: "qc-2", name: "Pharmaprix — Sainte-Catherine", address: "1500 Rue Sainte-Catherine O", city: "Montréal", phone: "(514) 555-0170", hours: "8am–midnight", lat: 45.497, lng: -73.579, distance: "1.4 km", sameDayHub: true },
    { id: "qc-3", name: "Uniprix — Québec City", address: "2600 Boul. Laurier", city: "Québec", phone: "(418) 555-0139", hours: "9am–9pm", lat: 46.77, lng: -71.28, distance: "2.6 km", sameDayHub: false },
    { id: "qc-4", name: "Brunet — Laval", address: "3035 Boul. le Carrefour", city: "Laval", phone: "(450) 555-0181", hours: "9am–8pm", lat: 45.56, lng: -73.74, distance: "4.3 km", sameDayHub: false },
  ],
  SK: [
    { id: "sk-1", name: "Shoppers Drug Mart — Saskatoon", address: "2325 Preston Ave S", city: "Saskatoon", phone: "(306) 555-0141", hours: "8am–10pm", lat: 52.11, lng: -106.62, distance: "1.3 km", sameDayHub: true },
    { id: "sk-2", name: "Rexall — Regina", address: "2102 Cornwall St", city: "Regina", phone: "(306) 555-0168", hours: "9am–9pm", lat: 50.45, lng: -104.61, distance: "2.0 km", sameDayHub: false },
    { id: "sk-3", name: "Safeway Pharmacy — Lawson Heights", address: "1615 Lenore Dr", city: "Saskatoon", phone: "(306) 555-0194", hours: "8am–8pm", lat: 52.16, lng: -106.64, distance: "3.7 km", sameDayHub: false },
  ],
  YT: [
    { id: "yt-1", name: "Shoppers Drug Mart — Whitehorse", address: "211 Main St", city: "Whitehorse", phone: "(867) 555-0120", hours: "9am–8pm", lat: 60.721, lng: -135.057, distance: "0.3 km", sameDayHub: false },
    { id: "yt-2", name: "Superstore Pharmacy — Whitehorse", address: "9029 Quartz Rd", city: "Whitehorse", phone: "(867) 555-0158", hours: "9am–7pm", lat: 60.73, lng: -135.08, distance: "1.8 km", sameDayHub: false },
  ],
};

const SELECTED_KEY = "pp.pharmacy.selected";

export function getRegion(slugOrCode: string | undefined): Region | null {
  if (!slugOrCode) return null;
  const key = slugOrCode.toLowerCase();
  return (
    REGIONS.find((r) => r.slug === key || r.code.toLowerCase() === key) ?? null
  );
}

export function pharmaciesInRegion(code: string): AreaPharmacy[] {
  const rows = BY_PROVINCE[code.toUpperCase()] ?? [];
  return rows.map((r) => ({ ...r, province: code.toUpperCase() }));
}

export function getPharmacy(id: string): AreaPharmacy | null {
  for (const code of Object.keys(BY_PROVINCE)) {
    const hit = BY_PROVINCE[code].find((p) => p.id === id);
    if (hit) return { ...hit, province: code };
  }
  return null;
}

export function saveSelectedPharmacy(p: AreaPharmacy) {
  try {
    sessionStorage.setItem(SELECTED_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function loadSelectedPharmacy(): AreaPharmacy | null {
  try {
    const raw = sessionStorage.getItem(SELECTED_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AreaPharmacy;
  } catch {
    return null;
  }
}

export function clearSelectedPharmacy() {
  try {
    sessionStorage.removeItem(SELECTED_KEY);
  } catch {
    /* ignore */
  }
}
