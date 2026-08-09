export type OrderType = "fill" | "consultation" | "transfer" | "refill";
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
}

export const typeMeta: Record<OrderType, { label: string; icon: string }> = {
  fill: { label: "Prescription fill", icon: "💊" },
  consultation: { label: "Consultation", icon: "🩺" },
  transfer: { label: "Transfer", icon: "📦" },
  refill: { label: "Refill", icon: "🔁" },
};

export const statusMeta: Record<OrderStatus, { label: string; tone: "primary" | "info" | "wellness" | "danger" | "neutral" }> = {
  verifying: { label: "Pharmacist verifying", tone: "primary" },
  processing: { label: "Processing", tone: "info" },
  out_for_delivery: { label: "Out for delivery", tone: "info" },
  delivered: { label: "Delivered", tone: "wellness" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export const orders: Order[] = [
  {
    id: "PP-RX-3391", invoiceNo: "INV-2026-3391", date: "2026-08-06", type: "fill", status: "out_for_delivery",
    patient: "Alex Chen", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Ramipril", strength: "5mg", qty: 90, unitPrice: 0.42 }],
    dispensingFee: 11.99, insuranceCovered: 30.0, payment: { method: "mixed", cardLast4: "4242" },
    prescriber: "Dr. Amrita Shah", pharmacist: "R. Okafor, RPh",
  },
  {
    id: "PP-48210", invoiceNo: "INV-2026-8210", date: "2026-07-18", type: "consultation", status: "delivered",
    patient: "Alex Chen", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Alysena", strength: "0.1/0.02mg", qty: 84, unitPrice: 0.21 }],
    dispensingFee: 11.99, insuranceCovered: 29.63, payment: { method: "insurance" },
    prescriber: "Dr. Amrita Shah", pharmacist: "R. Okafor, RPh",
  },
  {
    id: "PP-RX-3120", invoiceNo: "INV-2026-3120", date: "2026-06-15", type: "refill", status: "delivered",
    patient: "Alex Chen", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Atorvastatin", strength: "20mg", qty: 90, unitPrice: 0.47 }],
    dispensingFee: 11.99, insuranceCovered: 35.0, payment: { method: "mixed", cardLast4: "4242" },
    pharmacist: "J. Nguyen, RPh",
  },
  {
    id: "PP-TR-2984", invoiceNo: "INV-2026-2984", date: "2026-06-02", type: "transfer", status: "processing",
    patient: "Alex Chen", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [
      { name: "Metformin", strength: "500mg", qty: 90, unitPrice: 0.11 },
      { name: "Pantoprazole", strength: "40mg", qty: 30, unitPrice: 0.43 },
    ],
    dispensingFee: 11.99, insuranceCovered: 24.0, payment: { method: "mixed", cardLast4: "4242" },
  },
  {
    id: "PP-RX-2765", invoiceNo: "INV-2026-2765", date: "2026-05-09", type: "fill", status: "delivered",
    patient: "Alex Chen", address: "221 King St W, Toronto, ON M5H 1K4",
    items: [{ name: "Salbutamol", strength: "100mcg", qty: 1, unitPrice: 22.0 }],
    dispensingFee: 11.99, insuranceCovered: 20.4, payment: { method: "mixed", cardLast4: "4242" },
    pharmacist: "J. Nguyen, RPh",
  },
];

export function getOrder(id: string | undefined): Order | undefined {
  return orders.find((o) => o.id === id);
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
