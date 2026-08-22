/**
 * Provider operations inbox — requests, customers, and dashboard stats.
 * Seeded demo data + live rows linked to the published business profile id.
 */

import { appointmentIsPast, getAppointment, getAppointments, updateAppointmentStatus } from "@/lib/appointments";
import { getPublishedForOwner, hubPathForProfile } from "@/lib/businessProfile";
import { getCareWorkerBooking, getCareWorkerBookings, updateCareWorkerBookingStatus } from "@/lib/careWorkers";
import { getLabBooking, getLabBookings, updateLabBookingStatus } from "@/lib/labs";

export type ProviderRequestStatus = "new" | "accepted" | "completed" | "declined" | "reschedule";

export type ProviderRequest = {
  id: string;
  patientName: string;
  service: string;
  channel: "hub" | "direct" | "referral";
  status: ProviderRequestStatus;
  requestedAt: string;
  slot?: string;
  notes?: string;
  fee?: number;
};

export type ProviderCustomer = {
  id: string;
  name: string;
  lastService: string;
  visits: number;
  lastVisit: string;
};

const REQ_KEY = "pp.providerRequests.v1";

const SEED_REQUESTS: ProviderRequest[] = [
  {
    id: "req-seed-1",
    patientName: "Jordan Blake",
    service: "Annual health package",
    channel: "hub",
    status: "new",
    requestedAt: new Date().toISOString(),
    slot: "Tomorrow · 9:00 AM",
    fee: 49,
    notes: "Prefers morning draw",
  },
  {
    id: "req-seed-2",
    patientName: "Samira Patel",
    service: "Virtual consult",
    channel: "hub",
    status: "accepted",
    requestedAt: new Date(Date.now() - 86400000).toISOString(),
    slot: "Today · 2:00 PM",
    fee: 79,
  },
  {
    id: "req-seed-3",
    patientName: "Chris Nguyen",
    service: "Home vitals check",
    channel: "direct",
    status: "completed",
    requestedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    slot: "Mon · 11:00 AM",
    fee: 49,
  },
  {
    id: "req-seed-4",
    patientName: "Riley Okonkwo",
    service: "Lipid panel",
    channel: "referral",
    status: "new",
    requestedAt: new Date(Date.now() - 3600000).toISOString(),
    slot: "In 2 days · 8:30 AM",
    fee: 0,
  },
];

function readExtra(): ProviderRequest[] {
  try {
    const raw = localStorage.getItem(REQ_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProviderRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeExtra(list: ProviderRequest[]) {
  localStorage.setItem(REQ_KEY, JSON.stringify(list));
}

function sessionOwnerId(): string | undefined {
  try {
    const raw = localStorage.getItem("pp.provider.v1");
    if (!raw) return undefined;
    const p = JSON.parse(raw) as { id?: string; ownerOrgId?: string };
    return String(p.ownerOrgId || p.id || "") || undefined;
  } catch {
    return undefined;
  }
}

function liveRequestsFromHub(): ProviderRequest[] {
  const ownerId = sessionOwnerId();
  const pub = ownerId ? getPublishedForOwner(ownerId) : null;
  if (!pub?.publishedId) return [];
  const id = pub.publishedId;
  const out: ProviderRequest[] = [];

  for (const b of getLabBookings()) {
    if (b.labId !== id || b.status === "cancelled") continue;
    out.push({
      id: `lab-${b.id}`,
      patientName: b.patientName || "Patient",
      service: b.itemNames,
      channel: "hub",
      status: b.status === "completed" ? "completed" : b.status === "pending" ? "new" : "accepted",
      requestedAt: b.createdAt,
      slot: `${b.date} · ${b.time}`,
      fee: b.fee,
    });
  }

  for (const b of getCareWorkerBookings()) {
    if (b.workerId !== id || b.status === "cancelled") continue;
    out.push({
      id: `cw-${b.id}`,
      patientName: "Patient",
      service: b.service,
      channel: "hub",
      status: b.status === "completed" ? "completed" : b.status === "pending" ? "new" : "accepted",
      requestedAt: b.createdAt,
      slot: `${b.date} · ${b.time}`,
      fee: b.fee,
    });
  }

  for (const a of getAppointments()) {
    if (a.providerId !== id && a.clinicianId !== id) continue;
    if (a.status === "cancelled" || a.status === "not_attempted") continue;
    if (a.status !== "unavailable" && appointmentIsPast(a)) continue;
    out.push({
      id: `appt-${a.id}`,
      patientName: a.patientName || "Patient",
      service: a.specialtyLabel || "Consult",
      channel: "hub",
      status:
        a.status === "completed"
          ? "completed"
          : a.status === "pending"
            ? "new"
            : a.status === "unavailable"
              ? "reschedule"
              : "accepted",
      requestedAt: a.createdAt || `${a.date}T12:00:00`,
      slot: `${a.date} · ${a.time}`,
      fee: a.fee,
    });
  }

  return out;
}

export function getProviderRequests(): ProviderRequest[] {
  const extra = readExtra();
  const live = liveRequestsFromHub();
  const liveIds = new Set(live.map((r) => r.id));
  const extraOnly = extra.filter((r) => !liveIds.has(r.id));
  const ids = new Set([...extraOnly, ...live].map((r) => r.id));
  const seed = SEED_REQUESTS.filter((r) => !ids.has(r.id));
  return [...extraOnly, ...live, ...seed].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

function applyLiveBookingStatus(id: string, status: ProviderRequestStatus): boolean {
  if (id.startsWith("appt-")) {
    const appointmentId = id.slice("appt-".length);
    if (!getAppointment(appointmentId)) return false;
    const next =
      status === "accepted"
        ? "upcoming"
        : status === "declined"
          ? "cancelled"
          : status === "reschedule"
            ? "unavailable"
            : status === "completed"
              ? "completed"
              : status === "new"
                ? "pending"
                : null;
    if (next) updateAppointmentStatus(appointmentId, next);
    return true;
  }
  if (id.startsWith("lab-")) {
    const labId = id.slice("lab-".length);
    if (!getLabBooking(labId)) return false;
    const next =
      status === "accepted"
        ? "upcoming"
        : status === "declined"
          ? "cancelled"
          : status === "completed"
            ? "completed"
            : status === "new"
              ? "pending"
              : null;
    if (next) updateLabBookingStatus(labId, next);
    return true;
  }
  if (id.startsWith("cw-")) {
    const careId = id.slice("cw-".length);
    if (!getCareWorkerBooking(careId)) return false;
    const next =
      status === "accepted"
        ? "upcoming"
        : status === "declined"
          ? "cancelled"
          : status === "completed"
            ? "completed"
            : status === "new"
              ? "pending"
              : null;
    if (next) updateCareWorkerBookingStatus(careId, next);
    return true;
  }
  return false;
}

export function updateProviderRequestStatus(id: string, status: ProviderRequestStatus) {
  if (applyLiveBookingStatus(id, status)) {
    writeExtra(readExtra().filter((r) => r.id !== id));
    return;
  }
  const all = getProviderRequests();
  const row = all.find((r) => r.id === id);
  if (!row) return;
  const next = { ...row, status };
  const extra = readExtra().filter((r) => r.id !== id);
  writeExtra([next, ...extra]);
}

export function getProviderCustomers(): ProviderCustomer[] {
  const completed = getProviderRequests().filter((r) => r.status === "completed" || r.status === "accepted");
  const map = new Map<string, ProviderCustomer>();
  for (const r of completed) {
    const key = r.patientName.toLowerCase();
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        id: key,
        name: r.patientName,
        lastService: r.service,
        visits: 1,
        lastVisit: r.slot || r.requestedAt.slice(0, 10),
      });
    } else {
      cur.visits += 1;
      cur.lastService = r.service;
      cur.lastVisit = r.slot || r.requestedAt.slice(0, 10);
    }
  }
  return [...map.values()].sort((a, b) => b.visits - a.visits);
}

export type ProviderDashboardStats = {
  servicesPosted: number;
  openRequests: number;
  accepted: number;
  completed: number;
  customersServed: number;
  listingLive: boolean;
  listingName: string;
  hubPath: string | null;
};

export function getProviderDashboardStats(): ProviderDashboardStats {
  const ownerId = sessionOwnerId();
  const pub = ownerId ? getPublishedForOwner(ownerId) : null;
  const draftServices = (() => {
    if (!ownerId) return pub?.services.length ?? 0;
    try {
      const raw = localStorage.getItem(`pp.businessProfile.${ownerId}`);
      if (!raw) return pub?.services.length ?? 0;
      const d = JSON.parse(raw) as { services?: unknown[] };
      return Array.isArray(d.services) ? d.services.length : pub?.services.length ?? 0;
    } catch {
      return pub?.services.length ?? 0;
    }
  })();

  const requests = getProviderRequests();
  const customers = getProviderCustomers();

  return {
    servicesPosted: draftServices,
    openRequests: requests.filter((r) => r.status === "new").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    completed: requests.filter((r) => r.status === "completed").length,
    customersServed: customers.length,
    listingLive: pub?.status === "published",
    listingName: pub?.name || "",
    hubPath: pub ? hubPathForProfile(pub) : null,
  };
}
