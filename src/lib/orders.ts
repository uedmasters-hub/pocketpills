export type OrderType = "fill" | "consultation" | "transfer" | "refill" | "lab";
export type OrderStatus = "verifying" | "processing" | "out_for_delivery" | "delivered" | "cancelled";

export interface OrderItem {
  name: string;
  strength: string;
  qty: number;
  unitPrice: number; // per unit, CAD
}

export interface Order {
  id: string;
  invoiceNo: string;
  date: string; // ISO
  type: OrderType;
  status: OrderStatus;
  patient: string;
  address: string;
  items: OrderItem[];
  dispensingFee: number;
  insuranceCovered: number;
  payment: { method: "card" | "insurance" | "mixed"; cardLast4?: string };
  prescriber?: string;
  pharmacist?: string;
  /** Source pharmacy name — set for transfer orders */
  fromPharmacy?: string;
  /** Fulfilling pharmacy for a medication fill */
  pharmacyName?: string;
  /** Lab centre name — set for lab visit orders */
  labName?: string;
  /** Scheduled visit slot for lab / consult-style bookings */
  visitSlot?: string;
  /** Linked lab booking id */
  labBookingId?: string;
}

export const typeMeta: Record<OrderType, { label: string; icon: string }> = {
  fill: { label: "Prescription fill", icon: "💊" },
  consultation: { label: "Consultation", icon: "🩺" },
  transfer: { label: "Transfer", icon: "📦" },
  refill: { label: "Refill", icon: "🔁" },
  lab: { label: "Lab visit", icon: "🧪" },
};

export const statusMeta: Record<OrderStatus, { label: string; tone: "primary" | "info" | "wellness" | "danger" | "neutral" | "warning" }> = {
  verifying: { label: "Pharmacist verifying", tone: "warning" },
  processing: { label: "Processing", tone: "primary" },
  out_for_delivery: { label: "Out for delivery", tone: "wellness" },
  delivered: { label: "Delivered", tone: "wellness" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

/** Chip classes — each live status reads at a glance (cancelled / verifying especially). */
export function statusPillClass(status: OrderStatus): string {
  switch (status) {
    case "verifying":
      /* Amber — review / attention, same clarity as cancelled */
      return "bg-warning-subtle text-warning";
    case "processing":
      /* Cool sky blue — clearly not purple verifying */
      return "bg-[color:var(--color-processing-subtle)] text-[color:var(--color-processing)]";
    case "out_for_delivery":
      return "bg-[color:var(--secondary-500)] text-[color:var(--secondary-800)]";
    case "delivered":
      return "bg-wellness-subtle text-wellness";
    case "cancelled":
      return "bg-danger-subtle text-danger";
  }
}

/** Transfer-specific status copy for pharmacy tracking */
export function transferStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "verifying": return "Contacting your pharmacy";
    case "processing": return "Moving prescriptions";
    case "out_for_delivery": return "Ready to fill & deliver";
    case "delivered": return "Transfer complete";
    case "cancelled": return "Cancelled";
  }
}

export const TRANSFER_HINTS = [
  {
    title: "We reach out to your pharmacy",
    detail: "A pharmacist contacts them to start the transfer. No action needed from you.",
    when: "Today",
  },
  {
    title: "Prescriptions move to PocketPills",
    detail: "Once released, your meds appear in Pharmacy so you can review and approve fills.",
    when: "1–2 days",
  },
  {
    title: "We fill and deliver — free",
    detail: "Approve the order cost and we’ll ship free to your door across Canada.",
    when: "After transfer",
  },
] as const;

export const TRANSFER_TRACK_STEPS = [
  "Request received",
  "Contacting pharmacy",
  "Prescriptions moving",
  "Ready to fill",
] as const;

/** Map order status → active track step index for transfers */
export function transferStepIndex(status: OrderStatus): number {
  if (status === "verifying") return 1;
  if (status === "processing") return 2;
  if (status === "out_for_delivery" || status === "delivered") return 3;
  return 0;
}

const SEED: Order[] = [
  {
    id: "PP-RX-3391", invoiceNo: "INV-2026-3391", date: "2026-08-06", type: "fill", status: "out_for_delivery",
    patient: "Ramesh Mandal", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Ramipril", strength: "5mg", qty: 90, unitPrice: 0.42 }],
    dispensingFee: 11.99, insuranceCovered: 30.0, payment: { method: "mixed", cardLast4: "4242" },
    prescriber: "Dr. Amrita Shah", pharmacist: "R. Okafor, RPh",
  },
  {
    id: "PP-48210", invoiceNo: "INV-2026-8210", date: "2026-07-18", type: "consultation", status: "delivered",
    patient: "Ramesh Mandal", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Alysena", strength: "0.1/0.02mg", qty: 84, unitPrice: 0.21 }],
    dispensingFee: 11.99, insuranceCovered: 29.63, payment: { method: "insurance" },
    prescriber: "Dr. Amrita Shah", pharmacist: "R. Okafor, RPh",
  },
  {
    id: "PP-RX-3120", invoiceNo: "INV-2026-3120", date: "2026-06-15", type: "refill", status: "delivered",
    patient: "Ramesh Mandal", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Atorvastatin", strength: "20mg", qty: 90, unitPrice: 0.47 }],
    dispensingFee: 11.99, insuranceCovered: 35.0, payment: { method: "mixed", cardLast4: "4242" },
    pharmacist: "J. Nguyen, RPh",
  },
  {
    id: "PP-RF-4410", invoiceNo: "INV-2026-4410", date: "2026-08-20", type: "refill", status: "verifying",
    patient: "Ramesh Mandal", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Metformin", strength: "500mg", qty: 90, unitPrice: 0.11 }],
    dispensingFee: 11.99, insuranceCovered: 18.0, payment: { method: "mixed", cardLast4: "4242" },
    pharmacist: "R. Okafor, RPh",
  },
  {
    id: "PP-RF-4388", invoiceNo: "INV-2026-4388", date: "2026-08-12", type: "refill", status: "processing",
    patient: "Ramesh Mandal", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Alysena", strength: "0.1/0.02mg", qty: 84, unitPrice: 0.21 }],
    dispensingFee: 11.99, insuranceCovered: 29.63, payment: { method: "insurance" },
    pharmacist: "J. Nguyen, RPh",
  },
  {
    id: "PP-TR-2984", invoiceNo: "INV-2026-2984", date: "2026-06-02", type: "transfer", status: "processing",
    patient: "Ramesh Mandal", address: "221 King St W, Toronto, ON M5H 1K4",
    fromPharmacy: "Shoppers Drug Mart",
    items: [
      { name: "Metformin", strength: "500mg", qty: 90, unitPrice: 0.11 },
      { name: "Pantoprazole", strength: "40mg", qty: 30, unitPrice: 0.43 },
    ],
    dispensingFee: 11.99, insuranceCovered: 24.0, payment: { method: "mixed", cardLast4: "4242" },
  },
  {
    id: "PP-RX-2765", invoiceNo: "INV-2026-2765", date: "2026-05-09", type: "fill", status: "delivered",
    patient: "Ramesh Mandal", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Salbutamol", strength: "100mcg", qty: 1, unitPrice: 22.0 }],
    dispensingFee: 11.99, insuranceCovered: 20.4, payment: { method: "mixed", cardLast4: "4242" },
    pharmacist: "J. Nguyen, RPh",
  },
  {
    id: "PP-TR-8425", invoiceNo: "INV-2026-8425", date: "2026-08-18", type: "transfer", status: "cancelled",
    patient: "Ramesh Mandal", address: "221 King St W, Toronto, ON M5H 1K4",
    fromPharmacy: "Manabiyata Pharmacy",
    items: [
      { name: "Metformin", strength: "500mg", qty: 90, unitPrice: 0.11 },
      { name: "Atorvastatin", strength: "20mg", qty: 90, unitPrice: 0.47 },
    ],
    dispensingFee: 11.99, insuranceCovered: 0, payment: { method: "insurance" },
  },
  {
    id: "PP-MED-4599", invoiceNo: "INV-2026-4599", date: "2026-08-16", type: "fill", status: "cancelled",
    patient: "Ramesh Mandal", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Abilify", strength: "10mg", qty: 30, unitPrice: 1.85 }],
    dispensingFee: 11.99, insuranceCovered: 0, payment: { method: "card", cardLast4: "4242" },
    pharmacist: "R. Okafor, RPh",
  },
];

const KEY = "pp.orders.extra";

function loadExtra(): Order[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function saveExtra(list: Order[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** Seed catalog (kept for any legacy direct imports) */
export const orders: Order[] = SEED;

export function getOrders(): Order[] {
  const extra = typeof window !== "undefined" ? loadExtra() : [];
  const ids = new Set(extra.map((o) => o.id));
  return [...extra, ...SEED.filter((o) => !ids.has(o.id))];
}

export function isActiveOrder(o: Order): boolean {
  return o.status !== "delivered" && o.status !== "cancelled";
}

/** Collapse repeat demo fills / labs / transfers into one live row. Newest wins. */
export function normalizeLiveSlot(value: string): string {
  return value
    .toLowerCase()
    .replace(/[•·⋅]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function liveOrderKey(o: Order): string {
  if (o.type === "lab") {
    return ["lab", (o.labName || "").toLowerCase(), normalizeLiveSlot(o.visitSlot || "")].join("|");
  }
  if (o.type === "transfer") {
    return ["transfer", (o.fromPharmacy || "").toLowerCase()].join("|");
  }
  const name = (o.items[0]?.name || typeMeta[o.type].label).toLowerCase();
  const kind = o.type === "refill" ? "fill" : o.type;
  return [kind, name, o.status].join("|");
}

export function mergeActiveOrders(list: Order[] = getOrders()): Order[] {
  const seen = new Set<string>();
  const out: Order[] = [];
  for (const o of list) {
    if (!isActiveOrder(o)) continue;
    const key = liveOrderKey(o);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(o);
  }
  return out;
}

export function getOrder(id: string | undefined): Order | undefined {
  if (!id) return undefined;
  return getOrders().find((o) => o.id === id);
}

export function addOrder(order: Order): Order {
  const extra = loadExtra().filter((o) => o.id !== order.id);
  saveExtra([order, ...extra]);
  return order;
}

/** Persist a patch (works for seed + user-created orders via localStorage overlay). */
export function updateOrder(id: string, patch: Partial<Order>): Order | undefined {
  const current = getOrder(id);
  if (!current) return undefined;
  return addOrder({ ...current, ...patch });
}

export function canCancelOrder(o: Order): boolean {
  return o.status === "verifying" || o.status === "processing" || o.status === "out_for_delivery";
}

export function cancelOrder(id: string): Order | undefined {
  const current = getOrder(id);
  if (!current || !canCancelOrder(current)) return undefined;
  return updateOrder(id, { status: "cancelled" });
}

export function createTransferOrder(input: {
  fromPharmacy: string;
  address: string;
  patient?: string;
  cardLast4?: string;
}): Order {
  const existing = getOrders().find(
    (o) =>
      isActiveOrder(o) &&
      o.type === "transfer" &&
      (o.fromPharmacy || "").toLowerCase() === input.fromPharmacy.trim().toLowerCase(),
  );
  if (existing) return existing;
  const n = Math.floor(1000 + Math.random() * 9000);
  const today = new Date().toISOString().slice(0, 10);
  return addOrder({
    id: `PP-TR-${n}`,
    invoiceNo: `INV-2026-${n}`,
    date: today,
    type: "transfer",
    status: "verifying",
    patient: input.patient ?? "Ramesh Mandal",
    address: input.address,
    fromPharmacy: input.fromPharmacy,
    items: [{ name: "Prescription transfer", strength: "—", qty: 1, unitPrice: 0 }],
    dispensingFee: 0,
    insuranceCovered: 0,
    payment: { method: "mixed", cardLast4: input.cardLast4 ?? "4242" },
    pharmacist: "Care team",
  });
}

export function labStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "verifying":
      return "Visit scheduled";
    case "processing":
      return "Preparing for your visit";
    case "out_for_delivery":
      return "Check-in ready";
    case "delivered":
      return "Visit complete";
    case "cancelled":
      return "Cancelled";
  }
}

export const LAB_TRACK_STEPS = ["Booked", "Confirmed", "Visit day", "Complete"] as const;

export function labStepIndex(status: OrderStatus): number {
  if (status === "verifying") return 0;
  if (status === "processing") return 1;
  if (status === "out_for_delivery") return 2;
  if (status === "delivered") return 3;
  return 0;
}

export function createMedicationOrder(input: {
  name: string;
  strength: string;
  qty: number;
  unitPrice: number;
  dispensingFee: number;
  insuranceCovered: number;
  address: string;
  patient?: string;
  cardLast4?: string;
  due: number;
  pharmacyName?: string;
}): Order {
  const existing = getOrders().find(
    (o) =>
      isActiveOrder(o) &&
      (o.type === "fill" || o.type === "refill") &&
      o.status === "verifying" &&
      (o.items[0]?.name || "").toLowerCase() === input.name.trim().toLowerCase() &&
      (o.items[0]?.strength || "") === input.strength,
  );
  if (existing) return existing;
  const n = Math.floor(1000 + Math.random() * 9000);
  const today = new Date().toISOString().slice(0, 10);
  return addOrder({
    id: `PP-MED-${n}`,
    invoiceNo: `INV-MED-${n}`,
    date: today,
    type: "fill",
    status: "verifying",
    patient: input.patient ?? "Ramesh Mandal",
    address: input.address,
    items: [{ name: input.name, strength: input.strength, qty: input.qty, unitPrice: input.unitPrice }],
    dispensingFee: input.dispensingFee,
    insuranceCovered: input.insuranceCovered,
    payment: {
      method: input.due <= 0 ? "insurance" : "mixed",
      cardLast4: input.due <= 0 ? undefined : input.cardLast4 ?? "4242",
    },
    pharmacist: input.pharmacyName ? undefined : "Care team",
    pharmacyName: input.pharmacyName,
  });
}

export function createLabOrder(input: {
  labName: string;
  labAddress: string;
  itemNames: string;
  fee: number;
  date: string;
  time: string;
  patient?: string;
  labBookingId?: string;
  confirmationNo?: string;
}): Order {
  const slot = `${input.date} · ${input.time}`;
  const existing = getOrders().find((o) => {
    if (!isActiveOrder(o) || o.type !== "lab") return false;
    if (input.labBookingId && o.labBookingId === input.labBookingId) return true;
    return (o.labName || "") === input.labName && o.visitSlot === slot;
  });
  if (existing) return existing;
  const n = Math.floor(1000 + Math.random() * 9000);
  const id = input.confirmationNo?.replace("PP-LAB-", "PP-LAB-") ?? `PP-LAB-${n}`;
  const orderId = id.startsWith("PP-") ? id : `PP-LAB-${n}`;
  return addOrder({
    id: orderId,
    invoiceNo: `INV-LAB-${n}`,
    date: input.date,
    type: "lab",
    status: "verifying",
    patient: input.patient ?? "Ramesh Mandal",
    address: input.labAddress,
    labName: input.labName,
    visitSlot: `${input.date} · ${input.time}`,
    labBookingId: input.labBookingId,
    items: [
      {
        name: input.itemNames,
        strength: `${input.date} · ${input.time}`,
        qty: 1,
        unitPrice: input.fee,
      },
    ],
    dispensingFee: 0,
    insuranceCovered: 0,
    payment: { method: input.fee <= 0 ? "insurance" : "card", cardLast4: input.fee <= 0 ? undefined : "4242" },
    pharmacist: "Lab care team",
  });
}

export interface Totals { subtotal: number; dispensing: number; delivery: number; insurance: number; tax: number; total: number; }
export function orderTotals(o: Order): Totals {
  const subtotal = round(o.items.reduce((s, it) => s + it.qty * it.unitPrice, 0));
  const dispensing = o.dispensingFee;
  const delivery = 0;
  const insurance = o.insuranceCovered;
  const tax = 0; // prescription drugs are zero-rated for GST/HST in Canada
  const total = Math.max(0, round(subtotal + dispensing + delivery + tax - insurance));
  return { subtotal, dispensing, delivery, insurance, tax, total };
}

export const round = (n: number) => Math.round(n * 100) / 100;
export const money = (n: number) => `$${n.toFixed(2)}`;
export const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
