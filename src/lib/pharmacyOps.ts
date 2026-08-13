/**
 * Pharmacy prescription queue + inventory (demo).
 */

export type RxStatus = "new" | "preparing" | "ready" | "completed" | "declined";

export type PharmacyAddress = {
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal: string;
};

export type PharmacyOrderLine = {
  id: string;
  /** Links to inventory SKU id when known */
  skuId?: string;
  medication: string;
  skuCode: string;
  qtyRequested: number;
  qtyFulfilled: number;
  unit: string;
  unavailable: boolean;
  adjustReason: string;
};

export type PharmacyOrder = {
  id: string;
  patientName: string;
  phone: string;
  status: RxStatus;
  requestedAt: string;
  fee?: number;
  deliveryMethod: "delivery" | "pickup";
  address: PharmacyAddress;
  lines: PharmacyOrderLine[];
  notes: string;
  rxNumber: string;
  /** Prescribing clinician shown on the order detail popup */
  prescriberName: string;
  /** Credentials / specialty shown in parentheses, e.g. "Ms. Mch." */
  prescriberCredentials: string;
  /** Derived convenience fields for older UI */
  medication: string;
  qty: string;
};

export type InventorySku = {
  id: string;
  name: string;
  sku: string;
  onHand: number;
  reorderAt: number;
  unit: string;
  batch: string;
  expiry: string;
  costPrice: number;
  sellPrice: number;
  offerPercent: number;
  offerLabel: string;
};

function ordersKey(orgId: string) {
  return `pp.pharmacy.orders.v3.${orgId}`;
}
function invKey(orgId: string) {
  return `pp.pharmacy.inventory.v4.${orgId}`;
}

function summarizeLines(lines: PharmacyOrderLine[]): { medication: string; qty: string } {
  if (lines.length === 0) return { medication: "Prescription", qty: "—" };
  if (lines.length === 1) {
    const l = lines[0];
    return {
      medication: l.medication,
      qty: `${l.unavailable ? 0 : l.qtyFulfilled} ${l.unit}`,
    };
  }
  return {
    medication: `${lines[0].medication} +${lines.length - 1} more`,
    qty: `${lines.length} items`,
  };
}

function normalizeLine(raw: Partial<PharmacyOrderLine>, fallbackId: string): PharmacyOrderLine {
  const qtyRequested = Math.max(0, Number(raw.qtyRequested) || 0);
  const unavailable = Boolean(raw.unavailable);
  const qtyFulfilled = unavailable
    ? 0
    : Math.max(0, Number(raw.qtyFulfilled ?? raw.qtyRequested) || 0);
  return {
    id: String(raw.id ?? fallbackId),
    skuId: raw.skuId ? String(raw.skuId) : undefined,
    medication: String(raw.medication ?? "Medication"),
    skuCode: String(raw.skuCode ?? ""),
    qtyRequested,
    qtyFulfilled,
    unit: String(raw.unit ?? "units").trim() || "units",
    unavailable,
    adjustReason: String(raw.adjustReason ?? "").trim(),
  };
}

function normalizeOrder(raw: Partial<PharmacyOrder> & { id: string }): PharmacyOrder {
  let lines: PharmacyOrderLine[] = Array.isArray(raw.lines)
    ? raw.lines.map((l, i) => normalizeLine(l, `${raw.id}-line-${i}`))
    : [];

  // Migrate legacy single-medication orders
  if (lines.length === 0 && raw.medication) {
    const qtyMatch = String(raw.qty ?? "").match(/(\d+)/);
    const n = qtyMatch ? Number(qtyMatch[1]) : 1;
    const unit = String(raw.qty ?? "").replace(/[\d\s]/g, "").trim() || "units";
    lines = [
      normalizeLine(
        {
          id: `${raw.id}-line-0`,
          medication: String(raw.medication),
          qtyRequested: n,
          qtyFulfilled: n,
          unit,
        },
        `${raw.id}-line-0`,
      ),
    ];
  }

  const summary = summarizeLines(lines);
  const address: PharmacyAddress = {
    line1: String(raw.address?.line1 ?? "221 King St W"),
    line2: raw.address?.line2 ? String(raw.address.line2) : undefined,
    city: String(raw.address?.city ?? "Toronto"),
    province: String(raw.address?.province ?? "ON"),
    postal: String(raw.address?.postal ?? "M5H 1K4"),
  };

  const status: RxStatus =
    raw.status === "preparing" ||
    raw.status === "ready" ||
    raw.status === "completed" ||
    raw.status === "declined"
      ? raw.status
      : "new";

  return {
    id: raw.id,
    patientName: String(raw.patientName ?? "Patient"),
    phone: String(raw.phone ?? ""),
    status,
    requestedAt: String(raw.requestedAt ?? new Date().toISOString()),
    fee: raw.fee != null ? Number(raw.fee) : undefined,
    deliveryMethod: raw.deliveryMethod === "pickup" ? "pickup" : "delivery",
    address,
    lines,
    notes: String(raw.notes ?? ""),
    rxNumber: String(raw.rxNumber ?? raw.id),
    prescriberName: String(raw.prescriberName ?? "Dr. Ramesh Mandal").trim() || "Dr. Ramesh Mandal",
    prescriberCredentials: String(raw.prescriberCredentials ?? "Ms. Mch.").trim(),
    medication: summary.medication,
    qty: summary.qty,
  };
}

function readOrders(orgId: string): PharmacyOrder[] {
  try {
    const raw = localStorage.getItem(ordersKey(orgId));
    if (!raw) return seedOrders(orgId);
    const parsed = JSON.parse(raw) as Partial<PharmacyOrder>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedOrders(orgId);
    return parsed
      .filter((o): o is Partial<PharmacyOrder> & { id: string } => Boolean(o?.id))
      .map(normalizeOrder);
  } catch {
    return seedOrders(orgId);
  }
}

function writeOrders(orgId: string, list: PharmacyOrder[]) {
  localStorage.setItem(ordersKey(orgId), JSON.stringify(list.map(normalizeOrder)));
}

function seedOrders(orgId: string): PharmacyOrder[] {
  const list: PharmacyOrder[] = [
    normalizeOrder({
      id: `rx-${orgId}-1`,
      patientName: "Elena Vargas",
      phone: "(416) 555-0142",
      status: "new",
      requestedAt: new Date().toISOString(),
      fee: 46,
      deliveryMethod: "delivery",
      address: {
        line1: "88 Queens Quay W",
        line2: "Apt 1204",
        city: "Toronto",
        province: "ON",
        postal: "M5J 0B8",
      },
      rxNumber: "RX-44821",
      notes: "Leave with concierge if not home.",
      prescriberName: "Dr. Ramesh Mandal",
      prescriberCredentials: "Ms. Mch.",
      lines: [
        {
          id: `rx-${orgId}-1-a`,
          skuId: `sku-${orgId}-1`,
          medication: "Atorvastatin 20mg",
          skuCode: "ATV-20",
          qtyRequested: 90,
          qtyFulfilled: 90,
          unit: "tabs",
          unavailable: false,
          adjustReason: "",
        },
        {
          id: `rx-${orgId}-1-b`,
          skuId: `sku-${orgId}-2`,
          medication: "Metformin 500mg",
          skuCode: "MET-500",
          qtyRequested: 60,
          qtyFulfilled: 60,
          unit: "tabs",
          unavailable: false,
          adjustReason: "",
        },
      ],
    }),
    normalizeOrder({
      id: `rx-${orgId}-2`,
      patientName: "Noah Kim",
      phone: "(647) 555-0198",
      status: "preparing",
      requestedAt: new Date(Date.now() - 7200000).toISOString(),
      fee: 18,
      deliveryMethod: "delivery",
      address: {
        line1: "350 Bay St",
        city: "Toronto",
        province: "ON",
        postal: "M5H 2S6",
      },
      rxNumber: "RX-44808",
      notes: "Patient asked to reduce qty if stock is short.",
      prescriberName: "Dr. Priya Shah",
      prescriberCredentials: "MD, CCFP",
      lines: [
        {
          id: `rx-${orgId}-2-a`,
          skuId: `sku-${orgId}-2`,
          medication: "Metformin 500mg",
          skuCode: "MET-500",
          qtyRequested: 60,
          qtyFulfilled: 60,
          unit: "tabs",
          unavailable: false,
          adjustReason: "",
        },
      ],
    }),
    normalizeOrder({
      id: `rx-${orgId}-3`,
      patientName: "Aisha Rahman",
      phone: "(905) 555-0111",
      status: "ready",
      requestedAt: new Date(Date.now() - 86400000).toISOString(),
      fee: 32,
      deliveryMethod: "pickup",
      address: {
        line1: "Corner Care Pharmacy",
        line2: "Will call counter",
        city: "Toronto",
        province: "ON",
        postal: "M5V 2T6",
      },
      rxNumber: "RX-44790",
      notes: "",
      prescriberName: "Dr. James Okonkwo",
      prescriberCredentials: "FRCPC",
      lines: [
        {
          id: `rx-${orgId}-3-a`,
          skuId: `sku-${orgId}-3`,
          medication: "Salbutamol inhaler",
          skuCode: "SAL-INH",
          qtyRequested: 1,
          qtyFulfilled: 1,
          unit: "units",
          unavailable: false,
          adjustReason: "",
        },
      ],
    }),
    normalizeOrder({
      id: `rx-${orgId}-4`,
      patientName: "Chris Nguyen",
      phone: "(416) 555-0177",
      status: "completed",
      requestedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      fee: 28,
      deliveryMethod: "delivery",
      address: {
        line1: "221 King St W",
        city: "Toronto",
        province: "ON",
        postal: "M5H 1K4",
      },
      rxNumber: "RX-44712",
      notes: "Delivered Mon morning.",
      prescriberName: "Dr. Ramesh Mandal",
      prescriberCredentials: "Ms. Mch.",
      lines: [
        {
          id: `rx-${orgId}-4-a`,
          skuId: `sku-${orgId}-1`,
          medication: "Atorvastatin 20mg",
          skuCode: "ATV-20",
          qtyRequested: 90,
          qtyFulfilled: 90,
          unit: "tabs",
          unavailable: false,
          adjustReason: "",
        },
      ],
    }),
  ];
  writeOrders(orgId, list);
  return list;
}

export function listPharmacyOrders(orgId: string): PharmacyOrder[] {
  return readOrders(orgId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export function getPharmacyOrder(orgId: string, id: string): PharmacyOrder | null {
  return readOrders(orgId).find((o) => o.id === id) ?? null;
}

export function updatePharmacyOrderStatus(
  orgId: string,
  id: string,
  status: RxStatus,
): PharmacyOrder | null {
  const list = readOrders(orgId);
  const idx = list.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  list[idx] = normalizeOrder({ ...list[idx], status });
  writeOrders(orgId, list);
  return list[idx];
}

export function adjustPharmacyOrderLine(
  orgId: string,
  orderId: string,
  lineId: string,
  patch: {
    qtyFulfilled?: number;
    unavailable?: boolean;
    adjustReason?: string;
  },
): PharmacyOrder | null {
  const list = readOrders(orgId);
  const idx = list.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;
  const order = list[idx];
  const lines = order.lines.map((line) => {
    if (line.id !== lineId) return line;
    const unavailable = patch.unavailable ?? line.unavailable;
    const qtyFulfilled = unavailable
      ? 0
      : Math.min(
          line.qtyRequested,
          Math.max(0, patch.qtyFulfilled ?? line.qtyFulfilled),
        );
    return normalizeLine(
      {
        ...line,
        unavailable,
        qtyFulfilled,
        adjustReason: patch.adjustReason ?? line.adjustReason,
      },
      line.id,
    );
  });
  list[idx] = normalizeOrder({ ...order, lines });
  writeOrders(orgId, list);
  return list[idx];
}

export function formatPharmacyAddress(a: PharmacyAddress): string {
  return [a.line1, a.line2, `${a.city}, ${a.province} ${a.postal}`].filter(Boolean).join("\n");
}

export function printPharmacyAddressLabel(order: PharmacyOrder, pharmacyName: string) {
  const addr = formatPharmacyAddress(order.address);
  const meds = order.lines
    .map((l) => {
      if (l.unavailable) return `• ${l.medication} — UNAVAILABLE${l.adjustReason ? ` (${l.adjustReason})` : ""}`;
      return `• ${l.medication} × ${l.qtyFulfilled} ${l.unit}${
        l.qtyFulfilled !== l.qtyRequested ? ` (requested ${l.qtyRequested})` : ""
      }`;
    })
    .join("<br/>");

  const html = `<!doctype html>
<html><head><title>Shipping label · ${order.rxNumber}</title>
<style>
  body { font-family: Georgia, serif; padding: 28px; color: #1a1033; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
  .box { border: 2px solid #1a1033; border-radius: 12px; padding: 16px 18px; max-width: 420px; }
  .to { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #666; margin-bottom: 6px; }
  .name { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .addr { white-space: pre-line; font-size: 15px; line-height: 1.45; }
  .meds { margin-top: 18px; font-size: 13px; line-height: 1.5; }
</style></head><body>
  <h1>${pharmacyName}</h1>
  <p class="meta">${order.rxNumber} · ${order.deliveryMethod === "pickup" ? "Pickup" : "Delivery"} · ${new Date().toLocaleString()}</p>
  <div class="box">
    <div class="to">${order.deliveryMethod === "pickup" ? "Will call" : "Ship to"}</div>
    <div class="name">${order.patientName}</div>
    <div class="addr">${addr.replace(/\n/g, "<br/>")}</div>
    ${order.phone ? `<div class="addr" style="margin-top:8px">${order.phone}</div>` : ""}
  </div>
  <div class="meds"><strong>Contents</strong><br/>${meds}</div>
  <p class="meta" style="margin-top:16px">Prescribed by: ${order.prescriberName}${
    order.prescriberCredentials ? ` (${order.prescriberCredentials})` : ""
  }</p>
  <script>window.onload = () => { window.print(); };</script>
</body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=560,height=720");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}

function monthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function normalizeSku(raw: Partial<InventorySku> & Pick<InventorySku, "id" | "name" | "sku">): InventorySku {
  const costPrice = Math.max(0, Number(raw.costPrice) || 0);
  const sellPrice = Math.max(0, Number(raw.sellPrice) || costPrice);
  const offerPercent = Math.min(100, Math.max(0, Number(raw.offerPercent) || 0));
  return {
    id: raw.id,
    name: String(raw.name ?? ""),
    sku: String(raw.sku ?? ""),
    onHand: Math.max(0, Number(raw.onHand) || 0),
    reorderAt: Math.max(0, Number(raw.reorderAt) || 0),
    unit: String(raw.unit ?? "units").trim() || "units",
    batch: String(raw.batch ?? "").trim(),
    expiry: String(raw.expiry ?? "").slice(0, 10),
    costPrice,
    sellPrice,
    offerPercent,
    offerLabel: String(raw.offerLabel ?? "").trim(),
  };
}

function readInv(orgId: string): InventorySku[] {
  try {
    const raw = localStorage.getItem(invKey(orgId));
    if (!raw) return seedInv(orgId);
    const parsed = JSON.parse(raw) as Partial<InventorySku>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedInv(orgId);
    return parsed
      .filter((s): s is Partial<InventorySku> & Pick<InventorySku, "id" | "name" | "sku"> =>
        Boolean(s && s.id && s.name && s.sku),
      )
      .map(normalizeSku);
  } catch {
    return seedInv(orgId);
  }
}

function writeInv(orgId: string, list: InventorySku[]) {
  localStorage.setItem(invKey(orgId), JSON.stringify(list.map(normalizeSku)));
}

function seedInv(orgId: string): InventorySku[] {
  const list: InventorySku[] = [
    normalizeSku({
      id: `sku-${orgId}-1`,
      name: "Atorvastatin 20mg",
      sku: "ATV-20",
      onHand: 48,
      reorderAt: 60,
      unit: "tabs",
      batch: "AT24A09",
      expiry: monthsFromNow(14),
      costPrice: 12.4,
      sellPrice: 28.0,
    }),
    normalizeSku({
      id: `sku-${orgId}-2`,
      name: "Metformin 500mg",
      sku: "MET-500",
      onHand: 150,
      reorderAt: 80,
      unit: "caps",
      batch: "MT25B02",
      expiry: monthsFromNow(18),
      costPrice: 6.5,
      sellPrice: 18.0,
      offerPercent: 15,
      offerLabel: "Refill savings",
    }),
    normalizeSku({
      id: `sku-${orgId}-3`,
      name: "Amlodipine 5mg",
      sku: "AML-5",
      onHand: 0,
      reorderAt: 40,
      unit: "tabs",
      batch: "AM23K01",
      expiry: monthsFromNow(-8),
      costPrice: 4.2,
      sellPrice: 14.0,
    }),
    normalizeSku({
      id: `sku-${orgId}-4`,
      name: "Losartan 50mg",
      sku: "LOS-50",
      onHand: 72,
      reorderAt: 30,
      unit: "tabs",
      batch: "LS25D04",
      expiry: monthsFromNow(22),
      costPrice: 9.1,
      sellPrice: 22.0,
    }),
    normalizeSku({
      id: `sku-${orgId}-5`,
      name: "Omeprazole 20mg",
      sku: "OME-20",
      onHand: 12,
      reorderAt: 24,
      unit: "caps",
      batch: "OM25A18",
      expiry: monthsFromNow(2),
      costPrice: 5.8,
      sellPrice: 16.5,
      offerPercent: 10,
      offerLabel: "Cash-pay deal",
    }),
    normalizeSku({
      id: `sku-${orgId}-6`,
      name: "Salbutamol inhaler",
      sku: "SAL-INH",
      onHand: 18,
      reorderAt: 10,
      unit: "units",
      batch: "SL25C11",
      expiry: monthsFromNow(9),
      costPrice: 14.0,
      sellPrice: 32.0,
    }),
    normalizeSku({
      id: `sku-${orgId}-7`,
      name: "Ramipril 5mg",
      sku: "RAM-5",
      onHand: 0,
      reorderAt: 20,
      unit: "tabs",
      batch: "RM24F12",
      expiry: monthsFromNow(11),
      costPrice: 3.9,
      sellPrice: 12.0,
    }),
    normalizeSku({
      id: `sku-${orgId}-8`,
      name: "Levothyroxine 50mcg",
      sku: "LEV-50",
      onHand: 96,
      reorderAt: 40,
      unit: "tabs",
      batch: "LV25E07",
      expiry: monthsFromNow(16),
      costPrice: 7.2,
      sellPrice: 19.0,
      offerPercent: 20,
      offerLabel: "Thyroid care",
    }),
  ];
  writeInv(orgId, list);
  return list;
}

export function listInventory(orgId: string): InventorySku[] {
  return readInv(orgId);
}

export function findInventoryForLine(orgId: string, line: PharmacyOrderLine): InventorySku | null {
  const inv = readInv(orgId);
  if (line.skuId) {
    const byId = inv.find((s) => s.id === line.skuId);
    if (byId) return byId;
  }
  if (line.skuCode) {
    const byCode = inv.find((s) => s.sku.toLowerCase() === line.skuCode.toLowerCase());
    if (byCode) return byCode;
  }
  return (
    inv.find((s) => s.name.toLowerCase() === line.medication.toLowerCase()) ?? null
  );
}

export function effectiveSellPrice(sku: InventorySku): number {
  if (!sku.offerPercent) return sku.sellPrice;
  return Math.round(sku.sellPrice * (1 - sku.offerPercent / 100) * 100) / 100;
}

export function isExpired(sku: InventorySku): boolean {
  if (!sku.expiry) return false;
  const exp = new Date(`${sku.expiry}T00:00:00`);
  if (Number.isNaN(exp.getTime())) return false;
  return exp.getTime() < Date.now();
}

export function isExpiringSoon(sku: InventorySku, withinDays = 90): boolean {
  if (!sku.expiry || isExpired(sku)) return false;
  const exp = new Date(`${sku.expiry}T00:00:00`);
  if (Number.isNaN(exp.getTime())) return false;
  const limit = Date.now() + withinDays * 86400000;
  return exp.getTime() <= limit;
}

export type InventoryStatus = "expired" | "out" | "low" | "ok";

export function inventoryStatus(sku: InventorySku): InventoryStatus {
  if (isExpired(sku)) return "expired";
  if (sku.onHand <= 0) return "out";
  if (sku.onHand <= sku.reorderAt) return "low";
  return "ok";
}

export function isOutOfStock(sku: InventorySku): boolean {
  return sku.onHand <= 0;
}

export function isLowStock(sku: InventorySku): boolean {
  return sku.onHand > 0 && sku.onHand <= sku.reorderAt;
}

export function isOnOffer(sku: InventorySku): boolean {
  return sku.offerPercent > 0;
}

export function adjustInventory(orgId: string, id: string, onHand: number): InventorySku | null {
  const list = readInv(orgId);
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  list[idx] = normalizeSku({ ...list[idx], onHand: Math.max(0, onHand) });
  writeInv(orgId, list);
  return list[idx];
}

export function updateInventorySku(
  orgId: string,
  id: string,
  patch: Partial<Omit<InventorySku, "id">>,
): InventorySku | null {
  const list = readInv(orgId);
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  list[idx] = normalizeSku({ ...list[idx], ...patch, id });
  writeInv(orgId, list);
  return list[idx];
}

export function setInventoryOffer(
  orgId: string,
  id: string,
  offerPercent: number,
  offerLabel: string,
): InventorySku | null {
  return updateInventorySku(orgId, id, {
    offerPercent: Math.min(100, Math.max(0, offerPercent)),
    offerLabel: offerLabel.trim(),
  });
}

export function clearInventoryOffer(orgId: string, id: string): InventorySku | null {
  return updateInventorySku(orgId, id, { offerPercent: 0, offerLabel: "" });
}

export function addInventorySku(
  orgId: string,
  input: Omit<InventorySku, "id">,
): InventorySku {
  const created = normalizeSku({ ...input, id: `sku-${Date.now().toString(36)}` });
  writeInv(orgId, [...readInv(orgId), created]);
  return created;
}

export function receiveInventoryStock(
  orgId: string,
  id: string,
  patch: {
    qty: number;
    reorderAt?: number;
    batch?: string;
    expiry?: string;
    unit?: string;
    costPrice?: number;
    sellPrice?: number;
  },
): InventorySku | null {
  const list = readInv(orgId);
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const cur = list[idx];
  list[idx] = normalizeSku({
    ...cur,
    onHand: cur.onHand + Math.max(0, Math.floor(Number(patch.qty) || 0)),
    reorderAt: patch.reorderAt ?? cur.reorderAt,
    batch: patch.batch ?? cur.batch,
    expiry: patch.expiry ?? cur.expiry,
    unit: patch.unit ?? cur.unit,
    costPrice: patch.costPrice ?? cur.costPrice,
    sellPrice: patch.sellPrice ?? cur.sellPrice,
  });
  writeInv(orgId, list);
  return list[idx];
}

export function formatCad(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(amount);
}
