/**
 * Facility / vendor service catalog — doctor + typed fees, synced to listing draft.
 */
import {
  loadDraftForProvider,
  newBusinessOffering,
  saveDraft,
  SERVICE_PRESETS,
  type BusinessProfile,
  type BusinessVendorType,
} from "@/lib/businessProfile";

export type FacilityServiceType = {
  id: string;
  label: string;
  fee: number;
};

export type FacilityServiceItem = {
  id: string;
  label: string;
  doctor: string;
  types: FacilityServiceType[];
  /** Lowest type fee — used on the public listing. */
  feeFrom: number;
  /** Hidden from the public listing while paused. */
  paused?: boolean;
};

type ProviderRef = {
  id: string;
  orgName: string;
  vendorType: BusinessVendorType;
  phone?: string;
  firstName?: string;
  lastName?: string;
};

function key(orgId: string) {
  return `pp.provider.services.v2.${orgId}`;
}

function legacyKey(orgId: string) {
  return `pp.provider.services.${orgId}`;
}

function newTypeId() {
  return `ftype-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyServiceType(fee = 79): FacilityServiceType {
  return { id: newTypeId(), label: "", fee };
}

function minFee(types: FacilityServiceType[], fallback = 79) {
  const fees = types.map((t) => t.fee).filter((n) => Number.isFinite(n));
  return fees.length ? Math.min(...fees) : fallback;
}

function listingBlurb(item: FacilityServiceItem) {
  const typeLine = item.types
    .map((t) => t.label.trim())
    .filter(Boolean)
    .join(", ");
  return [item.doctor.trim(), typeLine].filter(Boolean).join(" · ");
}

export function normalizeFacilityService(
  raw: Partial<FacilityServiceItem> & {
    id?: string;
    label?: string;
    blurb?: string;
    feeFrom?: number;
  },
  fallbackDoctor = "",
): FacilityServiceItem {
  const feeFrom = Number(raw.feeFrom) || 79;
  let types = Array.isArray(raw.types)
    ? raw.types
        .map((t) => ({
          id: t.id || newTypeId(),
          label: String(t.label || "").trim(),
          fee: Number(t.fee) || feeFrom,
        }))
        .filter((t) => t.label || t.fee >= 0)
    : [];

  if (types.length === 0) {
    const fromBlurb = String(raw.blurb || "")
      .split("·")
      .map((p) => p.trim())
      .filter(Boolean);
    const maybeTypes = fromBlurb.filter((p) => !/^dr\.?\s/i.test(p));
    types =
      maybeTypes.length > 0
        ? maybeTypes.map((label) => ({ id: newTypeId(), label, fee: feeFrom }))
        : [{ id: newTypeId(), label: "General", fee: feeFrom }];
  }

  let doctor = String(raw.doctor || "").trim();
  if (!doctor && raw.blurb) {
    const first = String(raw.blurb)
      .split("·")
      .map((p) => p.trim())[0];
    if (first && /^dr\.?\s/i.test(first)) doctor = first;
  }
  if (!doctor) doctor = fallbackDoctor;

  return {
    id: raw.id || newBusinessOffering("service", raw.label || "Service", feeFrom).id,
    label: String(raw.label || "").trim() || "Service",
    doctor,
    types,
    feeFrom: minFee(types, feeFrom),
    paused: Boolean(raw.paused),
  };
}

function readJson(orgId: string): unknown[] {
  try {
    const raw = localStorage.getItem(key(orgId)) ?? localStorage.getItem(legacyKey(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(orgId: string, list: FacilityServiceItem[]) {
  localStorage.setItem(key(orgId), JSON.stringify(list));
}

function listedFromDraft(draft: BusinessProfile, fallbackDoctor: string): FacilityServiceItem[] {
  return draft.services
    .filter((s) => s.kind === "service")
    .map((s) =>
      normalizeFacilityService(
        {
          id: s.id,
          label: s.label,
          blurb: s.blurb,
          feeFrom: s.feeFrom,
        },
        fallbackDoctor,
      ),
    );
}

function persistListing(provider: ProviderRef, items: FacilityServiceItem[]) {
  const draft = loadDraftForProvider(provider);
  const others = draft.services.filter((s) => s.kind !== "service");
  const services = [
    ...items
      .filter((s) => !s.paused)
      .map((s) => ({
        ...newBusinessOffering("service", s.label, s.feeFrom),
        id: s.id,
        blurb: listingBlurb(s),
        feeFrom: s.feeFrom,
      })),
    ...others,
  ];
  saveDraft({ ...draft, services }, provider.id);
  writeLocal(provider.id, items);
}

function seedPresets(
  type: BusinessVendorType,
  feeFrom: number,
  doctor: string,
): FacilityServiceItem[] {
  return (SERVICE_PRESETS[type] || []).map((label) => {
    const assigned = /emergency/i.test(label) ? "Any available" : doctor;
    return normalizeFacilityService(
      {
        ...newBusinessOffering("service", label, feeFrom),
        doctor: assigned,
        types: [{ id: newTypeId(), label: "General", fee: feeFrom }],
      },
      assigned,
    );
  });
}

function mergeById(
  draftItems: FacilityServiceItem[],
  localItems: FacilityServiceItem[],
): FacilityServiceItem[] {
  if (localItems.length === 0) return draftItems;
  if (draftItems.length === 0) return localItems;
  const localById = new Map(localItems.map((s) => [s.id, s]));
  const draftIds = new Set(draftItems.map((s) => s.id));
  const used = new Set<string>();
  const merged = draftItems.map((d) => {
    const local = localById.get(d.id);
    if (!local) return d;
    used.add(d.id);
    return normalizeFacilityService({ ...d, ...local, label: local.label || d.label }, d.doctor);
  });
  for (const local of localItems) {
    if (used.has(local.id)) continue;
    // Keep paused (or other) local-only rows that were dropped from the listing.
    if (!draftIds.has(local.id) || local.paused) {
      if (!merged.some((m) => m.label.toLowerCase() === local.label.toLowerCase())) {
        merged.push(local);
      }
    }
  }
  return merged;
}

/** Listed services for this org — listing draft + local rich fields, else vendor presets. */
export function listFacilityServices(
  orgId: string,
  provider?: ProviderRef | null,
  fallbackDoctor = "",
): FacilityServiceItem[] {
  const local = readJson(orgId).map((raw) =>
    normalizeFacilityService(raw as Partial<FacilityServiceItem>, fallbackDoctor),
  );

  if (provider) {
    const draft = loadDraftForProvider(provider);
    const listed = listedFromDraft(draft, fallbackDoctor);
    if (listed.length > 0 || local.length > 0) {
      const merged = mergeById(listed, local);
      writeLocal(orgId, merged);
      return merged;
    }
    const seeded = seedPresets(provider.vendorType, draft.feeFrom || 79, fallbackDoctor);
    if (seeded.length === 0) return [];
    persistListing(provider, seeded);
    return seeded;
  }

  return local;
}

export function saveFacilityService(
  orgId: string,
  item: Omit<FacilityServiceItem, "id" | "feeFrom"> & { id?: string; feeFrom?: number },
  provider?: ProviderRef | null,
  fallbackDoctor = "",
): FacilityServiceItem {
  const list = listFacilityServices(orgId, provider, fallbackDoctor);
  const normalized = normalizeFacilityService(item, fallbackDoctor || item.doctor);
  let next: FacilityServiceItem[];
  let saved: FacilityServiceItem;

  if (item.id) {
    next = list.map((s) => (s.id === item.id ? { ...normalized, id: item.id } : s));
    saved = next.find((s) => s.id === item.id)!;
  } else {
    saved = {
      ...normalized,
      id: newBusinessOffering("service", normalized.label, normalized.feeFrom).id,
    };
    next = [...list, saved];
  }

  if (provider) persistListing(provider, next);
  else writeLocal(orgId, next);
  return saved;
}

export function removeFacilityService(
  orgId: string,
  id: string,
  provider?: ProviderRef | null,
  fallbackDoctor = "",
) {
  const next = listFacilityServices(orgId, provider, fallbackDoctor).filter((s) => s.id !== id);
  if (provider) persistListing(provider, next);
  else writeLocal(orgId, next);
}

export function syncFacilityServicesToListing(
  provider: ProviderRef,
  fallbackDoctor = "",
): FacilityServiceItem[] {
  const items = listFacilityServices(provider.id, provider, fallbackDoctor);
  persistListing(provider, items);
  return items;
}
