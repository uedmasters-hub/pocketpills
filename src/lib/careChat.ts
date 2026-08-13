/**
 * Shared care chat — patient Messages and provider Chat read/write the same threads.
 * Demo persistence via localStorage; same-tab + cross-tab sync.
 */

export type ChatSender = "patient" | "provider";
export type ChatPeerRole = "Clinician" | "Pharmacist" | "Support" | "Provider";

export type CareChatMessage = {
  id: string;
  sender: ChatSender;
  body: string;
  at: string; // ISO
};

export type CareChatThread = {
  id: string;
  /** Name the patient sees for the other party */
  peerName: string;
  peerRole: ChatPeerRole;
  /** Patient display name (provider inbox) */
  patientName: string;
  preview: string;
  tone: string;
  orderId?: string | null;
  unreadPatient: boolean;
  unreadProvider: boolean;
  updatedAt: string;
  messages: CareChatMessage[];
};

const KEY = "pp.careChat.v1";
const EVENT = "pp:careChat";

function nowIso() {
  return new Date().toISOString();
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.max(1, Math.round(diff / 60_000))}m`;
  if (diff < 86400_000) return `${Math.max(1, Math.round(diff / 3600_000))}h`;
  if (diff < 7 * 86400_000) return `${Math.max(1, Math.round(diff / 86400_000))}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameDay = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today · ${time}`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === d.toDateString()) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString(undefined, { weekday: "short" })} · ${time}`;
}

export function threadWhenLabel(thread: CareChatThread): string {
  return formatWhen(thread.updatedAt);
}

function seed(): CareChatThread[] {
  const now = Date.now();
  const t = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();
  return [
    {
      id: "clinician",
      peerName: "Dr. Amrita Shah",
      peerRole: "Clinician",
      patientName: "Ramesh Mandal",
      preview: "Your prescription is approved and sent to pharmacy.",
      tone: "bg-[#E8E4FF] text-[color:var(--pp-violet)]",
      unreadPatient: true,
      unreadProvider: false,
      updatedAt: t(120),
      messages: [
        {
          id: "c1",
          sender: "provider",
          body: "Hi Ramesh — I’ve reviewed your assessment. Your prescription is approved and sent to pharmacy.",
          at: t(130),
        },
        {
          id: "c2",
          sender: "patient",
          body: "Thanks! How long until it ships?",
          at: t(125),
        },
        {
          id: "c3",
          sender: "provider",
          body: "Usually 1–2 days after the pharmacy verifies. You’ll get tracking in Orders.",
          at: t(120),
        },
      ],
    },
    {
      id: "pharmacy",
      peerName: "PocketPills Pharmacy",
      peerRole: "Pharmacist",
      patientName: "Ramesh Mandal",
      preview: "We're verifying your order #PP-RX-3391.",
      tone: "bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]",
      unreadPatient: false,
      unreadProvider: true,
      updatedAt: t(1440),
      orderId: "PP-RX-3391",
      messages: [
        {
          id: "p1",
          sender: "provider",
          body: "We’re verifying your order #PP-RX-3391 with your insurance. No action needed.",
          at: t(1500),
        },
        {
          id: "p2",
          sender: "patient",
          body: "Perfect, thank you.",
          at: t(1440),
        },
      ],
    },
    {
      id: "care",
      peerName: "Care Support",
      peerRole: "Support",
      patientName: "Ramesh Mandal",
      preview: "How was your recent delivery?",
      tone: "bg-[color:var(--secondary-500)] text-[color:var(--secondary-900)]",
      unreadPatient: false,
      unreadProvider: false,
      updatedAt: t(4320),
      messages: [
        {
          id: "s1",
          sender: "provider",
          body: "How was your recent delivery? Reply anytime — we’re here 7 days a week.",
          at: t(4320),
        },
      ],
    },
    {
      id: "lab-riley",
      peerName: "North Labs",
      peerRole: "Provider",
      patientName: "Riley Okonkwo",
      preview: "Can I reschedule my lipid panel?",
      tone: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]",
      unreadPatient: false,
      unreadProvider: true,
      updatedAt: t(360),
      messages: [
        {
          id: "l1",
          sender: "patient",
          body: "Hi — I booked a lipid panel for tomorrow morning but need an afternoon slot instead.",
          at: t(360),
        },
      ],
    },
    {
      id: "billing-jordan",
      peerName: "Your practice",
      peerRole: "Provider",
      patientName: "Jordan Blake",
      preview: "Is the consult fee the same for virtual and in-clinic?",
      tone: "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]",
      unreadPatient: false,
      unreadProvider: true,
      updatedAt: t(2880),
      messages: [
        {
          id: "b1",
          sender: "patient",
          body: "Is the consult fee the same for virtual and in-clinic?",
          at: t(2880),
        },
      ],
    },
  ];
}

function readAll(): CareChatThread[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      writeAll(s);
      return s;
    }
    const parsed = JSON.parse(raw) as CareChatThread[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const s = seed();
      writeAll(s);
      return s;
    }
    return parsed;
  } catch {
    const s = seed();
    writeAll(s);
    return s;
  }
}

function writeAll(list: CareChatThread[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function listThreads(side?: "patient" | "provider"): CareChatThread[] {
  const all = readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (side === "patient") {
    // Demo patient inbox — only their own conversations
    return all.filter((t) => t.patientName === "Ramesh Mandal");
  }
  return all;
}

export function getThread(id: string): CareChatThread | null {
  return readAll().find((t) => t.id === id) ?? null;
}

export function resolveThreadId(
  withParam: string | null,
  orderParam: string | null,
  side: "patient" | "provider" = "patient",
): string {
  const all = listThreads(side);
  if (withParam && all.some((t) => t.id === withParam)) return withParam;
  if (withParam && getThread(withParam) && side === "provider") return withParam;
  if (orderParam) {
    const byOrder = all.find((t) => t.orderId === orderParam || t.id === "pharmacy");
    if (byOrder) return byOrder.id;
    if (orderParam.startsWith("PP-TR")) {
      const care = all.find((t) => t.id === "care");
      if (care) return care.id;
    }
  }
  return all[0]?.id ?? "care";
}

export function sendMessage(
  threadId: string,
  sender: ChatSender,
  body: string,
): CareChatThread | null {
  const text = body.trim();
  if (!text) return null;
  const list = readAll();
  const idx = list.findIndex((t) => t.id === threadId);
  if (idx < 0) return null;
  const at = nowIso();
  const msg: CareChatMessage = {
    id: `msg-${Date.now().toString(36)}`,
    sender,
    body: text,
    at,
  };
  const current = list[idx];
  const next: CareChatThread = {
    ...current,
    messages: [...current.messages, msg],
    preview: text,
    updatedAt: at,
    unreadPatient: sender === "provider" ? true : current.unreadPatient,
    unreadProvider: sender === "patient" ? true : current.unreadProvider,
  };
  if (sender === "patient") next.unreadPatient = false;
  if (sender === "provider") next.unreadProvider = false;
  list[idx] = next;
  writeAll(list);
  return next;
}

export function markThreadRead(threadId: string, side: "patient" | "provider"): void {
  const list = readAll();
  const idx = list.findIndex((t) => t.id === threadId);
  if (idx < 0) return;
  const t = list[idx];
  if (side === "patient" && !t.unreadPatient) return;
  if (side === "provider" && !t.unreadProvider) return;
  list[idx] = {
    ...t,
    unreadPatient: side === "patient" ? false : t.unreadPatient,
    unreadProvider: side === "provider" ? false : t.unreadProvider,
  };
  writeAll(list);
}

export function unreadCountFor(side: "patient" | "provider"): number {
  return listThreads(side).filter((t) =>
    side === "patient" ? t.unreadPatient : t.unreadProvider,
  ).length;
}

/** Subscribe to thread changes (same tab + other tabs). Returns unsubscribe. */
export function subscribeCareChat(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) onChange();
  };
  const onLocal = () => onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onLocal);
  };
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function displayPeerName(name: string, translate: (s: string) => string) {
  if (name === "PocketPills Pharmacy" || name === "Care Support") return translate(name);
  return name;
}
