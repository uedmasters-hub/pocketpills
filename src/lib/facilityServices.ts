/**
 * Facility / vendor service catalog managed in-portal (feeds listing on sync).
 */

export type FacilityServiceItem = {
  id: string;
  label: string;
  blurb: string;
  feeFrom: number;
};

function key(orgId: string) {
  return `pp.provider.services.${orgId}`;
}

function read(orgId: string): FacilityServiceItem[] {
  try {
    const raw = localStorage.getItem(key(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FacilityServiceItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(orgId: string, list: FacilityServiceItem[]) {
  localStorage.setItem(key(orgId), JSON.stringify(list));
}

export function listFacilityServices(orgId: string): FacilityServiceItem[] {
  return read(orgId);
}

export function saveFacilityService(
  orgId: string,
  item: Omit<FacilityServiceItem, "id"> & { id?: string },
): FacilityServiceItem {
  const list = read(orgId);
  if (item.id) {
    const next = list.map((s) => (s.id === item.id ? { ...s, ...item, id: item.id } : s));
    write(orgId, next);
    return next.find((s) => s.id === item.id)!;
  }
  const created: FacilityServiceItem = {
    id: `fsvc-${Date.now().toString(36)}`,
    label: item.label,
    blurb: item.blurb,
    feeFrom: item.feeFrom,
  };
  write(orgId, [...list, created]);
  return created;
}

export function removeFacilityService(orgId: string, id: string) {
  write(
    orgId,
    read(orgId).filter((s) => s.id !== id),
  );
}
