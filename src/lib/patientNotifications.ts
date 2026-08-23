/**
 * Patient notification inbox (demo, localStorage).
 */

export type PatientNotificationKind =
  | "order"
  | "refill"
  | "appointment"
  | "support"
  | "care";

export type PatientNotification = {
  id: string;
  kind: PatientNotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href?: string;
};

const KEY = "pp.patientNotifications.v1";

function readAll(): PatientNotification[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as PatientNotification[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

function writeAll(list: PatientNotification[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function seed(): PatientNotification[] {
  const now = Date.now();
  const list: PatientNotification[] = [
    {
      id: "n1",
      kind: "order",
      title: "Your order is out for delivery",
      body: "Metformin 500 mg should arrive today. Track progress anytime.",
      at: new Date(now - 2 * 3600000).toISOString(),
      read: false,
      href: "/orders?service=pharmacy",
    },
    {
      id: "n2",
      kind: "refill",
      title: "Refill reminder",
      body: "Atorvastatin is due in 5 days. Request a refill when you’re ready.",
      at: new Date(now - 1 * 86400000).toISOString(),
      read: false,
      href: "/orders?service=medication",
    },
    {
      id: "n3",
      kind: "appointment",
      title: "Upcoming virtual consult",
      body: "Tomorrow at 10:30 am with Dr. Amrita Shah. Join from Appointments.",
      at: new Date(now - 2 * 86400000).toISOString(),
      read: true,
      href: "/appointments",
    },
    {
      id: "n4",
      kind: "support",
      title: "Support replied to your ticket",
      body: "We have an update on “Delivery delayed on my refill”.",
      at: new Date(now - 3 * 86400000).toISOString(),
      read: true,
      href: "/support",
    },
    {
      id: "n5",
      kind: "care",
      title: "Lab results ready",
      body: "Your CBC & lipid panel results are available to review.",
      at: new Date(now - 5 * 86400000).toISOString(),
      read: true,
      href: "/orders?service=labs",
    },
  ];
  writeAll(list);
  return list;
}

export function listNotifications(): PatientNotification[] {
  return readAll().sort((a, b) => b.at.localeCompare(a.at));
}

export function unreadNotificationCount(): number {
  return readAll().filter((n) => !n.read).length;
}

export function markNotificationRead(id: string): void {
  const all = readAll();
  const next = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  writeAll(next);
}

export function markAllNotificationsRead(): void {
  writeAll(readAll().map((n) => ({ ...n, read: true })));
}

export function formatNotificationWhen(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
