/**
 * Provider bundles, named offers, and redeemable promo codes (per org).
 */

import { listFacilityServices } from "@/lib/facilityServices";

export type OfferTarget = {
  id: string;
  label: string;
  kind: "service" | "bundle" | "product";
};

export type ProviderBundle = {
  id: string;
  name: string;
  blurb: string;
  serviceIds: string[];
  feeFrom: number;
};

export type DiscountType = "percent" | "amount";

export type ProviderDeal = {
  id: string;
  title: string;
  blurb: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  /** Service and/or bundle ids this deal applies to */
  targetIds: string[];
};

export type ProviderPromo = {
  id: string;
  code: string;
  label: string;
  serviceIds: string[];
  bundleIds: string[];
  startDate: string;
  endDate: string;
  /** 0 = unlimited */
  maxUses: number;
  usedCount: number;
  discountType: DiscountType;
  discountValue: number;
};

export type ProviderOfferings = {
  bundles: ProviderBundle[];
  deals: ProviderDeal[];
  promos: ProviderPromo[];
};

const KEY = (orgId: string) => `pp.provider.offerings.${orgId}`;

function emptyOfferings(): ProviderOfferings {
  return { bundles: [], deals: [], promos: [] };
}

function read(orgId: string): ProviderOfferings {
  try {
    const raw = localStorage.getItem(KEY(orgId));
    if (!raw) return emptyOfferings();
    const parsed = JSON.parse(raw) as Partial<ProviderOfferings>;
    return {
      bundles: Array.isArray(parsed.bundles) ? parsed.bundles.map(normalizeBundle) : [],
      deals: Array.isArray(parsed.deals) ? parsed.deals.map(normalizeDeal) : [],
      promos: Array.isArray(parsed.promos) ? parsed.promos.map(normalizePromo) : [],
    };
  } catch {
    return emptyOfferings();
  }
}

function write(orgId: string, data: ProviderOfferings) {
  localStorage.setItem(KEY(orgId), JSON.stringify(data));
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

function normalizeBundle(raw: Partial<ProviderBundle>): ProviderBundle {
  return {
    id: String(raw.id || newId("bun")),
    name: String(raw.name ?? "").trim(),
    blurb: String(raw.blurb ?? "").trim(),
    serviceIds: Array.isArray(raw.serviceIds) ? raw.serviceIds.map(String) : [],
    feeFrom: Number(raw.feeFrom) || 0,
  };
}

function normalizeDeal(raw: Partial<ProviderDeal>): ProviderDeal {
  return {
    id: String(raw.id || newId("deal")),
    title: String(raw.title ?? "").trim(),
    blurb: String(raw.blurb ?? "").trim(),
    discountType: raw.discountType === "amount" ? "amount" : "percent",
    discountValue: Number(raw.discountValue) || 0,
    startDate: String(raw.startDate ?? "").trim(),
    endDate: String(raw.endDate ?? "").trim(),
    targetIds: Array.isArray(raw.targetIds) ? raw.targetIds.map(String) : [],
  };
}

function normalizePromo(raw: Partial<ProviderPromo>): ProviderPromo {
  return {
    id: String(raw.id || newId("promo")),
    code: String(raw.code ?? "").trim().toUpperCase(),
    label: String(raw.label ?? "").trim(),
    serviceIds: Array.isArray(raw.serviceIds) ? raw.serviceIds.map(String) : [],
    bundleIds: Array.isArray(raw.bundleIds) ? raw.bundleIds.map(String) : [],
    startDate: String(raw.startDate ?? "").trim(),
    endDate: String(raw.endDate ?? "").trim(),
    maxUses: Math.max(0, Number(raw.maxUses) || 0),
    usedCount: Math.max(0, Number(raw.usedCount) || 0),
    discountType: raw.discountType === "amount" ? "amount" : "percent",
    discountValue: Number(raw.discountValue) || 0,
  };
}

export function loadOfferings(orgId: string): ProviderOfferings {
  return read(orgId);
}

export function listBundles(orgId: string): ProviderBundle[] {
  return read(orgId).bundles;
}

export function listDeals(orgId: string): ProviderDeal[] {
  return read(orgId).deals;
}

export function listPromos(orgId: string): ProviderPromo[] {
  return read(orgId).promos;
}

export function saveBundle(
  orgId: string,
  item: Omit<ProviderBundle, "id"> & { id?: string },
): ProviderBundle {
  const data = read(orgId);
  const next = normalizeBundle({ ...item, id: item.id || newId("bun") });
  const idx = data.bundles.findIndex((b) => b.id === next.id);
  if (idx >= 0) data.bundles[idx] = next;
  else data.bundles.push(next);
  write(orgId, data);
  return next;
}

export function removeBundle(orgId: string, id: string) {
  const data = read(orgId);
  data.bundles = data.bundles.filter((b) => b.id !== id);
  data.deals = data.deals.map((d) => ({
    ...d,
    targetIds: d.targetIds.filter((t) => t !== id),
  }));
  data.promos = data.promos.map((p) => ({
    ...p,
    bundleIds: p.bundleIds.filter((t) => t !== id),
  }));
  write(orgId, data);
}

export function saveDeal(
  orgId: string,
  item: Omit<ProviderDeal, "id"> & { id?: string },
): ProviderDeal {
  const data = read(orgId);
  const next = normalizeDeal({ ...item, id: item.id || newId("deal") });
  const idx = data.deals.findIndex((d) => d.id === next.id);
  if (idx >= 0) data.deals[idx] = next;
  else data.deals.push(next);
  write(orgId, data);
  return next;
}

export function removeDeal(orgId: string, id: string) {
  const data = read(orgId);
  data.deals = data.deals.filter((d) => d.id !== id);
  write(orgId, data);
}

export function savePromo(
  orgId: string,
  item: Omit<ProviderPromo, "id" | "usedCount"> & { id?: string; usedCount?: number },
): ProviderPromo {
  const data = read(orgId);
  const code = String(item.code ?? "").trim().toUpperCase();
  const clash = data.promos.find((p) => p.code === code && p.id !== item.id);
  if (clash) {
    throw new Error("That promo code is already in use.");
  }
  const prev = item.id ? data.promos.find((p) => p.id === item.id) : undefined;
  const next = normalizePromo({
    ...item,
    id: item.id || newId("promo"),
    code,
    usedCount: item.usedCount ?? prev?.usedCount ?? 0,
  });
  const idx = data.promos.findIndex((p) => p.id === next.id);
  if (idx >= 0) data.promos[idx] = next;
  else data.promos.push(next);
  write(orgId, data);
  return next;
}

export function removePromo(orgId: string, id: string) {
  const data = read(orgId);
  data.promos = data.promos.filter((p) => p.id !== id);
  write(orgId, data);
}

/** Services a bundle/promo can attach to: facility catalog + listing extras. */
export function listServiceTargets(
  orgId: string,
  listingServices: { id: string; label: string }[] = [],
): OfferTarget[] {
  const map = new Map<string, OfferTarget>();
  for (const s of listFacilityServices(orgId)) {
    if (!s.label.trim()) continue;
    map.set(s.id, { id: s.id, label: s.label, kind: "service" });
  }
  for (const s of listingServices) {
    if (!s.id || !s.label.trim() || map.has(s.id)) continue;
    map.set(s.id, { id: s.id, label: s.label, kind: "service" });
  }
  return [...map.values()];
}

export function listProductTargets(
  products: { id: string; label: string }[],
): OfferTarget[] {
  return products
    .filter((p) => p.id && p.label.trim())
    .map((p) => ({ id: p.id, label: p.label.trim(), kind: "product" as const }));
}

export function listBundleTargets(orgId: string): OfferTarget[] {
  return read(orgId).bundles.map((b) => ({
    id: b.id,
    label: b.name || "Untitled bundle",
    kind: "bundle",
  }));
}

export function formatDiscount(type: DiscountType, value: number): string {
  if (!value) return "";
  return type === "percent" ? `${value}% off` : `$${value} off`;
}

export function formatDateRange(start: string, end: string): string {
  if (!start && !end) return "";
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end)}`;
}

export function isWithinDateRange(start: string, end: string, now = new Date()): boolean {
  const day = now.toISOString().slice(0, 10);
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

export function promoRemaining(promo: ProviderPromo): string {
  if (!promo.maxUses) return "Unlimited";
  const left = Math.max(0, promo.maxUses - promo.usedCount);
  return `${promo.usedCount} / ${promo.maxUses} used · ${left} left`;
}

export function promoIsRedeemable(promo: ProviderPromo, now = new Date()): boolean {
  if (!promo.code) return false;
  if (!isWithinDateRange(promo.startDate, promo.endDate, now)) return false;
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return false;
  return true;
}

/** Apply a code to a service or bundle id. Returns the promo if valid. */
export function redeemPromo(
  orgId: string,
  code: string,
  targetId: string,
): { ok: true; promo: ProviderPromo } | { ok: false; reason: string } {
  const data = read(orgId);
  const promo = data.promos.find((p) => p.code === code.trim().toUpperCase());
  if (!promo) return { ok: false, reason: "Unknown code" };
  if (!promoIsRedeemable(promo)) return { ok: false, reason: "Code is expired or used up" };
  const applies =
    promo.serviceIds.includes(targetId) ||
    promo.bundleIds.includes(targetId) ||
    (promo.serviceIds.length === 0 && promo.bundleIds.length === 0);
  if (!applies) return { ok: false, reason: "Code does not apply to this item" };
  promo.usedCount += 1;
  write(orgId, data);
  return { ok: true, promo };
}
