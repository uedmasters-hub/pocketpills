/**
 * Provider support tickets — platform tickets + customer inbox (demo).
 */

export type SupportCategory = "billing" | "listing" | "bookings" | "account" | "other";
export type SupportStatus = "open" | "closed";
/** to_platform = raised by vendor; from_customer = received from a patient */
export type SupportChannel = "to_platform" | "from_customer";

export type SupportMessage = {
  id: string;
  from: "you" | "support" | "customer";
  body: string;
  at: string;
};

export type SupportTicket = {
  id: string;
  channel: SupportChannel;
  subject: string;
  category: SupportCategory;
  status: SupportStatus;
  /** Patient name when channel is from_customer */
  customerName?: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
};

const KEY = "pp.providerSupport.v2";

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  billing: "Billing & payouts",
  listing: "Listing & care hub",
  bookings: "Requests & bookings",
  account: "Account access",
  other: "Something else",
};

export const SUPPORT_CHANNEL_LABELS: Record<SupportChannel, string> = {
  to_platform: "To platform",
  from_customer: "From customers",
};

function readAll(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as SupportTicket[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seed();
    return parsed.map(normalize);
  } catch {
    return seed();
  }
}

function normalize(t: SupportTicket): SupportTicket {
  return {
    ...t,
    channel: t.channel === "from_customer" ? "from_customer" : "to_platform",
    messages: Array.isArray(t.messages) ? t.messages : [],
  };
}

function writeAll(list: SupportTicket[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function seed(): SupportTicket[] {
  const now = Date.now();
  const list: SupportTicket[] = [
    {
      id: "tkt-seed-1",
      channel: "to_platform",
      subject: "When do hub bookings show in Requests?",
      category: "bookings",
      status: "closed",
      createdAt: new Date(now - 5 * 86400000).toISOString(),
      updatedAt: new Date(now - 4 * 86400000).toISOString(),
      messages: [
        {
          id: "m1",
          from: "you",
          body: "I published my listing but don’t see patient bookings yet.",
          at: new Date(now - 5 * 86400000).toISOString(),
        },
        {
          id: "m2",
          from: "support",
          body: "Once a patient books against your published listing id, the request appears in Requests automatically. Seed demo rows are always available.",
          at: new Date(now - 4 * 86400000).toISOString(),
        },
      ],
    },
    {
      id: "tkt-seed-2",
      channel: "to_platform",
      subject: "Payout not reflecting last week’s earnings",
      category: "billing",
      status: "open",
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      updatedAt: new Date(now - 1 * 86400000).toISOString(),
      messages: [
        {
          id: "m3",
          from: "you",
          body: "My available balance looks low after completed consults. Can you check settlement?",
          at: new Date(now - 2 * 86400000).toISOString(),
        },
        {
          id: "m4",
          from: "support",
          body: "We’re reviewing settlement for your account. Pending earnings usually clear within 2–3 business days.",
          at: new Date(now - 1 * 86400000).toISOString(),
        },
      ],
    },
    {
      id: "tkt-seed-c1",
      channel: "from_customer",
      subject: "Can I reschedule my lipid panel?",
      category: "bookings",
      status: "open",
      customerName: "Riley Okonkwo",
      createdAt: new Date(now - 6 * 3600000).toISOString(),
      updatedAt: new Date(now - 5 * 3600000).toISOString(),
      messages: [
        {
          id: "mc1",
          from: "customer",
          body: "Hi — I booked a lipid panel for tomorrow morning but need an afternoon slot instead.",
          at: new Date(now - 6 * 3600000).toISOString(),
        },
      ],
    },
    {
      id: "tkt-seed-c2",
      channel: "from_customer",
      subject: "Question about consult fee",
      category: "billing",
      status: "open",
      customerName: "Jordan Blake",
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      updatedAt: new Date(now - 2 * 86400000).toISOString(),
      messages: [
        {
          id: "mc2",
          from: "customer",
          body: "Is the consult fee the same for virtual and in-clinic?",
          at: new Date(now - 2 * 86400000).toISOString(),
        },
      ],
    },
    {
      id: "tkt-seed-c3",
      channel: "from_customer",
      subject: "Thank you for the visit",
      category: "other",
      status: "closed",
      customerName: "Samira Patel",
      createdAt: new Date(now - 8 * 86400000).toISOString(),
      updatedAt: new Date(now - 7 * 86400000).toISOString(),
      messages: [
        {
          id: "mc3",
          from: "customer",
          body: "Just wanted to say the follow-up notes were really clear. Thanks!",
          at: new Date(now - 8 * 86400000).toISOString(),
        },
        {
          id: "mc4",
          from: "you",
          body: "Glad it helped — reach out anytime if questions come up.",
          at: new Date(now - 7 * 86400000).toISOString(),
        },
      ],
    },
  ];
  writeAll(list);
  return list;
}

export function listTickets(channel?: SupportChannel): SupportTicket[] {
  const all = readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (!channel) return all;
  return all.filter((t) => t.channel === channel);
}

export function getTicket(id: string): SupportTicket | null {
  return readAll().find((t) => t.id === id) ?? null;
}

export function createTicket(input: {
  subject: string;
  category: SupportCategory;
  body: string;
}): SupportTicket {
  const now = new Date().toISOString();
  const ticket: SupportTicket = {
    id: `tkt-${Date.now().toString(36)}`,
    channel: "to_platform",
    subject: input.subject.trim(),
    category: input.category,
    status: "open",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `msg-${Date.now().toString(36)}`,
        from: "you",
        body: input.body.trim(),
        at: now,
      },
    ],
  };
  writeAll([ticket, ...readAll()]);
  return ticket;
}

export function replyToTicket(id: string, body: string): SupportTicket | null {
  const list = readAll();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const current = list[idx];
  const messages: SupportMessage[] = [
    ...current.messages,
    { id: `msg-${Date.now().toString(36)}`, from: "you", body: body.trim(), at: now },
  ];

  // Demo auto-reply only for platform tickets
  if (current.channel === "to_platform") {
    messages.push({
      id: `msg-${Date.now().toString(36)}-auto`,
      from: "support",
      body: "Thanks — we’ve received your note. A specialist will follow up shortly (demo auto-reply).",
      at: now,
    });
  }

  const ticket: SupportTicket = {
    ...current,
    status: "open",
    updatedAt: now,
    messages,
  };
  list[idx] = ticket;
  writeAll(list);
  return ticket;
}

export function closeTicket(id: string): SupportTicket | null {
  const list = readAll();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const ticket = { ...list[idx], status: "closed" as const, updatedAt: new Date().toISOString() };
  list[idx] = ticket;
  writeAll(list);
  return ticket;
}
