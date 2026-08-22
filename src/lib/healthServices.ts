/** Ambulance / urgent / other on-demand services — request/dispatch demo. */

import { fieldsMatchQuery, sortBySearchRank } from "@/lib/searchMatch";

export type HealthServiceCategory = "ambulance" | "urgent-care" | "other";

export interface HealthService {
  id: string;
  category: HealthServiceCategory;
  name: string;
  blurb: string;
  phone?: string;
  etaMinutes?: number;
  feeFrom?: number;
  coverageNote?: string;
  city: string;
  available24h: boolean;
  emoji: string;
}

export type ServiceRequestStatus = "open" | "cancelled" | "completed";

export interface ServiceRequest {
  id: string;
  confirmationNo: string;
  serviceId: string;
  serviceName: string;
  category: HealthServiceCategory;
  address: string;
  notes: string;
  phone: string;
  etaMinutes?: number;
  status: ServiceRequestStatus;
  createdAt: string;
}

export const HEALTH_SERVICES: HealthService[] = [
  {
    id: "svc-ambulance",
    category: "ambulance",
    name: "Emergency ambulance",
    blurb: "Request emergency medical transport. For life-threatening emergencies call 911 first.",
    phone: "911",
    etaMinutes: 12,
    feeFrom: 45,
    coverageNote: "OHIP may cover medically necessary transport.",
    city: "Toronto",
    available24h: true,
    emoji: "🚑",
  },
  {
    id: "svc-non-emerg-transport",
    category: "ambulance",
    name: "Non-emergency medical transport",
    blurb: "Scheduled wheelchair or stretcher transport to appointments.",
    phone: "(416) 555-0911",
    etaMinutes: 45,
    feeFrom: 65,
    city: "Toronto",
    available24h: false,
    emoji: "🚐",
  },
  {
    id: "svc-urgent-care",
    category: "urgent-care",
    name: "Same-day urgent care desk",
    blurb: "Hold a spot at a partner walk-in for non-life-threatening needs.",
    phone: "(416) 555-0200",
    etaMinutes: 20,
    feeFrom: 0,
    coverageNote: "Covered / OHIP for eligible visits.",
    city: "Toronto",
    available24h: false,
    emoji: "🏥",
  },
  {
    id: "svc-after-hours",
    category: "urgent-care",
    name: "After-hours nurse line",
    blurb: "Speak with a nurse for triage advice when clinics are closed.",
    phone: "(416) 555-8888",
    etaMinutes: 5,
    feeFrom: 0,
    city: "Ontario",
    available24h: true,
    emoji: "📞",
  },
  {
    id: "svc-home-oxygen",
    category: "other",
    name: "Home oxygen support",
    blurb: "Arrange assessment and delivery for home oxygen therapy.",
    phone: "(416) 555-0444",
    etaMinutes: 120,
    feeFrom: 0,
    coverageNote: "ADP / insurance may apply.",
    city: "GTA",
    available24h: false,
    emoji: "💨",
  },
  {
    id: "svc-mental-crisis",
    category: "other",
    name: "Mental health crisis line",
    blurb: "Immediate connection to crisis support and local resources.",
    phone: "988",
    etaMinutes: 2,
    feeFrom: 0,
    city: "Canada",
    available24h: true,
    emoji: "💜",
  },
  {
    id: "svc-pharmacy-delivery",
    category: "other",
    name: "Urgent meds courier",
    blurb: "Same-day courier for time-sensitive prescriptions in select areas.",
    phone: "(416) 555-0330",
    etaMinutes: 90,
    feeFrom: 15,
    city: "Toronto",
    available24h: false,
    emoji: "📦",
  },
];

export function healthServiceCategoryLabel(c: HealthServiceCategory): string {
  switch (c) {
    case "ambulance":
      return "Ambulance";
    case "urgent-care":
      return "Urgent care";
    case "other":
      return "Other services";
  }
}

export function getHealthService(id: string): HealthService | undefined {
  return HEALTH_SERVICES.find((s) => s.id === id);
}

export function searchHealthServices(
  query: string,
  list: HealthService[] = HEALTH_SERVICES,
): HealthService[] {
  const needle = query.trim();
  if (!needle) return list;
  return sortBySearchRank(
    list.filter((s) =>
      fieldsMatchQuery(
        [s.name, s.blurb, s.city, healthServiceCategoryLabel(s.category), s.phone || ""],
        needle,
      ),
    ),
    needle,
    (s) => [s.name, s.blurb, s.city, healthServiceCategoryLabel(s.category), s.phone || ""],
  );
}

const REQ_KEY = "pp.serviceRequests.v1";

function readRequests(): ServiceRequest[] {
  try {
    const raw = localStorage.getItem(REQ_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ServiceRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRequests(list: ServiceRequest[]) {
  localStorage.setItem(REQ_KEY, JSON.stringify(list));
}

export function getServiceRequests(): ServiceRequest[] {
  return readRequests().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getServiceRequest(id: string | undefined | null): ServiceRequest | undefined {
  if (!id) return undefined;
  return getServiceRequests().find((r) => r.id === id);
}

export function createServiceRequest(input: {
  serviceId: string;
  address: string;
  notes: string;
  phone: string;
}): ServiceRequest | null {
  const service = getHealthService(input.serviceId);
  if (!service) return null;
  const req: ServiceRequest = {
    id: `svc-req-${Date.now()}`,
    confirmationNo: `PP-SVC-${String(Date.now()).slice(-4)}`,
    serviceId: service.id,
    serviceName: service.name,
    category: service.category,
    address: input.address.trim(),
    notes: input.notes.trim(),
    phone: input.phone.trim(),
    etaMinutes: service.etaMinutes,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  writeRequests([req, ...readRequests()]);
  return req;
}

export function updateServiceRequestStatus(id: string, status: ServiceRequestStatus) {
  writeRequests(readRequests().map((r) => (r.id === id ? { ...r, status } : r)));
}
