/**
 * Simple availability window for individual vendors / doctors.
 */

export type AvailabilitySlot = {
  id: string;
  day: string;
  window: string;
};

function key(orgId: string) {
  return `pp.provider.availability.${orgId}`;
}

const DEFAULT: AvailabilitySlot[] = [
  { id: "av-1", day: "Monday", window: "9:00 AM – 1:00 PM" },
  { id: "av-2", day: "Wednesday", window: "1:00 PM – 6:00 PM" },
  { id: "av-3", day: "Friday", window: "9:00 AM – 12:00 PM" },
];

export function listAvailability(orgId: string): AvailabilitySlot[] {
  try {
    const raw = localStorage.getItem(key(orgId));
    if (!raw) {
      localStorage.setItem(key(orgId), JSON.stringify(DEFAULT));
      return DEFAULT;
    }
    const parsed = JSON.parse(raw) as AvailabilitySlot[];
    return Array.isArray(parsed) ? parsed : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function saveAvailability(orgId: string, slots: AvailabilitySlot[]) {
  localStorage.setItem(key(orgId), JSON.stringify(slots));
}

export function upsertAvailabilitySlot(
  orgId: string,
  slot: Omit<AvailabilitySlot, "id"> & { id?: string },
): AvailabilitySlot[] {
  const list = listAvailability(orgId);
  if (slot.id) {
    const next = list.map((s) => (s.id === slot.id ? { ...s, day: slot.day, window: slot.window } : s));
    saveAvailability(orgId, next);
    return next;
  }
  const next = [
    ...list,
    { id: `av-${Date.now().toString(36)}`, day: slot.day, window: slot.window },
  ];
  saveAvailability(orgId, next);
  return next;
}

export function removeAvailabilitySlot(orgId: string, id: string): AvailabilitySlot[] {
  const next = listAvailability(orgId).filter((s) => s.id !== id);
  saveAvailability(orgId, next);
  return next;
}
