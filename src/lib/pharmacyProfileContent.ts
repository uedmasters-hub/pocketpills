/**
 * Derived pharmacy-detail copy. Only surfaces DDA / listing / platform facts —
 * no invented pharmacists, inventory, delivery areas, or awards.
 */

import { formatVerifiedOn } from "@/lib/doctorProfileContent";
import { getPharmacyClaim } from "@/lib/pharmacyDirectory";
import { inventoryStatus, peekStoredInventory, type InventorySku } from "@/lib/pharmacyOps";
import { listDelegates } from "@/lib/providerDelegates";

export type PharmacyView = {
  id: string;
  name: string;
  registrationNo: string;
  place: string;
  district: string;
  kindLabel: string;
  phone?: string;
  hours?: string;
  about?: string;
  live: boolean;
  lastVerified?: string;
  ownerId?: string;
  listedServices: string[];
  pharmacists: { id: string; name: string }[];
  inventory: InventorySku[] | null;
  awards?: { title: string; org: string; year: string }[];
  gallery?: { src: string; label: string }[];
  updates?: { title: string; summary: string; date: string }[];
};

export const PHARMACY_REVIEW_TOPICS = [
  "Pharmacist helpfulness",
  "Medicine availability",
  "Service quality",
  "Delivery experience",
  "Waiting time",
  "Overall experience",
] as const;

export type PharmacyServiceItem = {
  id: string;
  label: string;
  blurb: string;
  href?: string;
  action?: string;
};

const SERVICE_COPY: Record<string, { blurb: string; href?: string; action?: string }> = {
  "Prescription fills": {
    blurb: "Dispensed after a pharmacist reviews a valid prescription.",
    href: "/fill",
    action: "Start order",
  },
  "Same-day delivery": {
    blurb: "Listed for this live PocketPills pharmacy. Times are confirmed at checkout.",
  },
  "OTC consult": {
    blurb: "Over-the-counter questions — a pharmacist reviews what is appropriate.",
    href: "/messages",
    action: "Ask a pharmacist",
  },
};

export function pharmacyFromListing(input: {
  name: string;
  registrationNo: string;
  place: string;
  district?: string;
  kindLabel: string;
  phone?: string;
  hours?: string;
  about: string;
  live: boolean;
  ownerId?: string;
  listedServices: string[];
}): PharmacyView {
  const claim = getPharmacyClaim(input.registrationNo);
  const ownerId = input.ownerId || claim?.providerId;
  const pharmacists = ownerId
    ? listDelegates(ownerId)
        .filter((d) => d.active)
        .map((d) => ({
          id: d.id,
          name: [d.firstName, d.lastName].filter(Boolean).join(" ").trim() || d.username,
        }))
        .filter((p) => p.name)
    : [];
  return {
    id: `dda-${input.registrationNo}`,
    name: input.name,
    registrationNo: input.registrationNo,
    place: input.place,
    district: input.district || "",
    kindLabel: input.kindLabel,
    phone: input.phone,
    hours: input.live ? input.hours : undefined,
    about: input.about,
    live: input.live,
    lastVerified: claim?.publishedAt || claim?.claimedAt,
    ownerId,
    listedServices: input.listedServices,
    pharmacists,
    inventory: input.live && ownerId ? peekStoredInventory(ownerId) : null,
  };
}

export function pharmacyVerification(p: PharmacyView): {
  checks: { label: string }[];
  registration?: { label: string; value: string };
  lastVerified?: string;
} | null {
  const checks: { label: string }[] = [];
  if (p.registrationNo) checks.push({ label: "Pharmacy registration verified" });
  if (p.live) {
    checks.push({ label: "Pharmacy identity verified" });
    if (p.place) checks.push({ label: "Address verified" });
    checks.push({ label: "Operating status verified" });
  } else if (p.registrationNo && p.place) {
    checks.push({ label: "Address on registry" });
  }
  if (p.pharmacists.length) checks.push({ label: "Pharmacist verified" });
  if (!checks.length) return null;
  return {
    checks,
    registration: p.registrationNo
      ? { label: "DDA registration", value: `#${p.registrationNo}` }
      : undefined,
    lastVerified: p.lastVerified ? formatVerifiedOn(p.lastVerified) : undefined,
  };
}

export function pharmacyAboutFacts(p: PharmacyView): { k: string; v: string }[] {
  const facts: { k: string; v: string }[] = [];
  facts.push({ k: "Pharmacy type", v: p.kindLabel || "Pharmacy" });
  if (p.place) facts.push({ k: "Areas served", v: p.place });
  if (p.listedServices.length) facts.push({ k: "Core services", v: p.listedServices.join(" · ") });
  facts.push({
    k: "Patient focus",
    v: p.live
      ? "Prescription fills and transfers through PocketPills"
      : "DDA registry record — claim to publish ordering",
  });
  return facts;
}

export function pharmacyServices(p: PharmacyView): PharmacyServiceItem[] {
  const items: PharmacyServiceItem[] = p.listedServices.map((label) => {
    const copy = SERVICE_COPY[label];
    return {
      id: label,
      label,
      blurb: copy?.blurb || "Listed on this pharmacy profile.",
      href: p.live ? copy?.href : undefined,
      action: p.live ? copy?.action : undefined,
    };
  });
  if (p.live && !items.some((s) => s.id === "refills")) {
    items.push({
      id: "refills",
      label: "Prescription refills",
      blurb: "Refill an active prescription through PocketPills after pharmacist review.",
      href: "/fill",
      action: "Start order",
    });
  }
  return items;
}

export function pharmacyOrderSteps(p: PharmacyView): { k: string; v: string }[] {
  if (!p.live) return [];
  return [
    { k: "Upload / submit prescription", v: "Send a photo or file of a valid prescription through PocketPills." },
    { k: "Pharmacist review", v: "A pharmacist checks the prescription before anything is dispensed." },
    { k: "Availability confirmation", v: "You are told what can be filled. Prescription medicines are not sold without authorization." },
    { k: "Payment", v: "Pay in the PocketPills checkout after the review." },
    { k: "Delivery", v: "PocketPills delivers where it ships. Times are confirmed at checkout." },
  ];
}

export type MedicineAvailabilityRow = {
  id: string;
  name: string;
  form: string;
  status: "Available" | "Limited availability" | "Out of stock";
};

export function pharmacyAvailabilityRows(p: PharmacyView): MedicineAvailabilityRow[] {
  if (!p.inventory?.length) return [];
  return p.inventory
    .filter((sku) => inventoryStatus(sku) !== "expired")
    .map((sku) => {
      const st = inventoryStatus(sku);
      return {
        id: sku.id,
        name: sku.name,
        form: [sku.unit, sku.sku].filter(Boolean).join(" · "),
        status: st === "ok" ? "Available" : st === "low" ? "Limited availability" : "Out of stock",
      };
    });
}

export function pharmacyDeliveryRows(p: PharmacyView): { k: string; v: string }[] {
  if (!p.live) return [];
  const rows: { k: string; v: string }[] = [
    { k: "Standard delivery", v: "Free standard delivery where PocketPills ships. Time is confirmed at checkout." },
  ];
  if (p.listedServices.some((s) => /same-day/i.test(s))) {
    rows.push({ k: "Same-day / express", v: "Listed for this pharmacy. Available in select locations at checkout — not a guaranteed ETA." });
  }
  rows.push({ k: "Order tracking", v: "Track the order from your PocketPills account after it is placed." });
  return rows;
}

export function pharmacySafetyGuides(): { k: string; v: string }[] {
  return [
    { k: "How to store medicines safely", v: "Keep medicines in a cool, dry place away from children. Follow any fridge or light instructions on the label." },
    { k: "How to read a prescription", v: "Check your name, the medicine, strength, how often to take it, and the prescriber. Ask a pharmacist if anything is unclear." },
    { k: "What to bring when collecting prescription medicines", v: "Bring photo ID and the prescription or booking reference. Share allergies and your current medicine list." },
    { k: "Medicine expiry awareness", v: "Do not use medicines past the expiry date on the pack. Ask a pharmacist how to dispose of leftovers." },
    { k: "Safe medicine-use reminders", v: "Take medicines as directed. This is general information, not a diagnosis — speak with a pharmacist or clinician if you are unsure." },
  ];
}

export type PharmacyArticle = {
  slug: string;
  title: string;
  blurb: string;
  minutes: number;
  author: string;
};

export function pharmacyArticles(): PharmacyArticle[] {
  return [
    {
      slug: "store-medicines-at-home",
      title: "How to store medicines at home",
      blurb: "Heat, moisture, and bathroom cabinets — simple habits that keep medicines effective.",
      minutes: 4,
      author: "PocketPills",
    },
    {
      slug: "understanding-prescription-labels",
      title: "Understanding prescription labels",
      blurb: "What the directions, warnings, and refill line actually mean.",
      minutes: 3,
      author: "PocketPills",
    },
    {
      slug: "generic-vs-brand",
      title: "Generic vs. brand medicines",
      blurb: "How generics relate to brand-name products, and what to ask your pharmacist.",
      minutes: 4,
      author: "PocketPills",
    },
    {
      slug: "take-medicines-safely",
      title: "How to take medicines safely",
      blurb: "Timing, missed doses, and when to pause and ask for help.",
      minutes: 4,
      author: "PocketPills",
    },
    {
      slug: "when-to-ask-a-pharmacist",
      title: "When to ask a pharmacist for help",
      blurb: "Side effects, interactions, and questions that belong with a pharmacist — not a search result.",
      minutes: 3,
      author: "PocketPills",
    },
  ];
}

export function pharmacyFaqs(p: PharmacyView): { q: string; a: string }[] {
  const delivery = p.live;
  const hours = p.hours;
  const pharmacists = p.pharmacists;
  return [
    {
      q: "Do I need a prescription?",
      a: "Yes for prescription medicines. A pharmacist will not dispense them without a valid prescription. Some over-the-counter items do not require one.",
    },
    {
      q: "Can I upload a prescription online?",
      a: p.live
        ? "Yes. Use Upload prescription / Fill a prescription on this page. A pharmacist reviews it before dispensing."
        : "Online ordering is available after this pharmacy publishes its PocketPills listing.",
    },
    {
      q: "How does prescription verification work?",
      a: "A pharmacist reviews the prescription, your details, and whether the medicine can be filled before payment and delivery.",
    },
    {
      q: "Does the pharmacy offer delivery?",
      a: delivery
        ? "Yes. Live PocketPills pharmacies use PocketPills delivery where it ships. Times are confirmed at checkout."
        : "Delivery is not listed on this profile yet.",
    },
    {
      q: "Which areas are covered?",
      a: delivery
        ? `This pharmacy is listed in ${p.place}. Delivery coverage is confirmed at checkout — PocketPills does not list a custom catchment on this profile.`
        : "Delivery areas are not listed on this profile.",
    },
    {
      q: "Can I collect my order in-store?",
      a: "In-store pickup is not listed on this profile. PocketPills orders are delivered where shipping is available.",
    },
    {
      q: "How long does delivery take?",
      a: delivery
        ? "Standard and same-day options (where listed) are shown at checkout. This page does not promise a pharmacy-specific ETA."
        : "Delivery times are not listed on this profile.",
    },
    {
      q: "Can I speak with a pharmacist?",
      a: pharmacists.length || p.live
        ? "Yes. Use Ask a pharmacist on this page, or message PocketPills after you start an order."
        : "Pharmacist chat is available after this listing is live.",
    },
    {
      q: "What should I bring when collecting a prescription?",
      a: "Bring photo ID, the prescription or order reference, and a list of medicines and allergies.",
    },
    {
      q: "What are the pharmacy opening hours?",
      a: hours ? hours : "Hours are listed after this pharmacy publishes its PocketPills card.",
    },
  ];
}

export function pharmacyMapsQuery(p: PharmacyView): string {
  return [p.name, p.place, p.district].filter(Boolean).join(", ");
}
