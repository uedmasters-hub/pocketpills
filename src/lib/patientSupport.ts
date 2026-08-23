/**
 * Patient Help & support tickets (demo, localStorage).
 */

export type PatientSupportCategory =
  | "orders"
  | "billing"
  | "medication"
  | "appointments"
  | "account"
  | "other";

export type SupportStatus = "open" | "closed";

export type SupportMessage = {
  id: string;
  from: "you" | "support";
  body: string;
  at: string;
};

export type PatientSupportTicket = {
  id: string;
  subject: string;
  category: PatientSupportCategory;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
};

const KEY = "pp.patientSupport.v1";

export const PATIENT_SUPPORT_CATEGORY_LABELS: Record<PatientSupportCategory, string> = {
  orders: "Orders & delivery",
  billing: "Billing & insurance",
  medication: "Medications & refills",
  appointments: "Appointments",
  account: "Account & profile",
  other: "Something else",
};

function readAll(): PatientSupportTicket[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as PatientSupportTicket[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

function writeAll(list: PatientSupportTicket[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function seed(): PatientSupportTicket[] {
  const now = Date.now();
  const list: PatientSupportTicket[] = [
    {
      id: "pt-seed-1",
      subject: "Delivery delayed on my refill",
      category: "orders",
      status: "open",
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      updatedAt: new Date(now - 1 * 86400000).toISOString(),
      messages: [
        {
          id: "pm1",
          from: "you",
          body: "My refill said out for delivery yesterday but tracking hasn’t moved. Can you check?",
          at: new Date(now - 2 * 86400000).toISOString(),
        },
        {
          id: "pm2",
          from: "support",
          body: "Thanks for flagging this — we’re checking with the courier and will update you within one business day.",
          at: new Date(now - 1 * 86400000).toISOString(),
        },
      ],
    },
    {
      id: "pt-seed-2",
      subject: "Insurance not applied at checkout",
      category: "billing",
      status: "closed",
      createdAt: new Date(now - 8 * 86400000).toISOString(),
      updatedAt: new Date(now - 6 * 86400000).toISOString(),
      messages: [
        {
          id: "pm3",
          from: "you",
          body: "I added my Sun Life plan but the fill still charged the full amount.",
          at: new Date(now - 8 * 86400000).toISOString(),
        },
        {
          id: "pm4",
          from: "support",
          body: "We re-ran billing with your plan on file. A refund for the covered portion should appear in 3–5 business days.",
          at: new Date(now - 6 * 86400000).toISOString(),
        },
      ],
    },
  ];
  writeAll(list);
  return list;
}

export function listPatientTickets(): PatientSupportTicket[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getPatientTicket(id: string): PatientSupportTicket | null {
  return readAll().find((t) => t.id === id) ?? null;
}

export function createPatientTicket(input: {
  subject: string;
  category: PatientSupportCategory;
  body: string;
}): PatientSupportTicket {
  const now = new Date().toISOString();
  const ticket: PatientSupportTicket = {
    id: `pt-${Date.now().toString(36)}`,
    subject: input.subject.trim(),
    category: input.category,
    status: "open",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `pm-${Date.now().toString(36)}`,
        from: "you",
        body: input.body.trim(),
        at: now,
      },
    ],
  };
  writeAll([ticket, ...readAll()]);
  return ticket;
}

export function replyPatientTicket(id: string, body: string): PatientSupportTicket | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const ticket = {
    ...all[idx],
    updatedAt: now,
    messages: [
      ...all[idx].messages,
      {
        id: `pm-${Date.now().toString(36)}`,
        from: "you" as const,
        body: body.trim(),
        at: now,
      },
    ],
  };
  all[idx] = ticket;
  writeAll(all);
  return ticket;
}

export function closePatientTicket(id: string): PatientSupportTicket | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const ticket = { ...all[idx], status: "closed" as const, updatedAt: new Date().toISOString() };
  all[idx] = ticket;
  writeAll(all);
  return ticket;
}
