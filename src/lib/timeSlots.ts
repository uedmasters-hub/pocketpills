/**
 * Google Calendar–style weekly slot helpers (day + start/end dropdowns).
 */

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/** 30-minute increments, 12-hour labels (Google-style). */
export function buildTimeOptions(): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const period = h < 12 ? "AM" : "PM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      out.push(`${hour12}:${m === 0 ? "00" : "30"} ${period}`);
    }
  }
  return out;
}

export const TIME_OPTIONS = buildTimeOptions();

export function timeToMinutes(label: string): number {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return -1;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const period = m[3].toUpperCase();
  if (period === "AM") {
    if (h === 12) h = 0;
  } else if (h !== 12) {
    h += 12;
  }
  return h * 60 + min;
}

export function formatSlotWindow(start: string, end: string): string {
  return `${start} – ${end}`;
}

/** Best-effort parse of "9:00 AM – 12:00 PM" style windows. */
export function parseSlotWindow(window: string): { start: string; end: string } | null {
  const parts = window.split(/\s*[–—-]\s*/);
  if (parts.length < 2) return null;
  const start = parts[0].trim();
  const end = parts[1].trim();
  if (timeToMinutes(start) < 0 || timeToMinutes(end) < 0) return null;
  return { start, end };
}

export function endOptionsAfter(start: string): string[] {
  const startMin = timeToMinutes(start);
  if (startMin < 0) return TIME_OPTIONS;
  return TIME_OPTIONS.filter((t) => timeToMinutes(t) > startMin);
}

export function defaultEndFor(start: string): string {
  const opts = endOptionsAfter(start);
  // Prefer +3 hours when possible
  const startMin = timeToMinutes(start);
  const prefer = TIME_OPTIONS.find((t) => timeToMinutes(t) === startMin + 180);
  if (prefer && opts.includes(prefer)) return prefer;
  return opts[0] ?? start;
}

export function isValidSlotRange(start: string, end: string): boolean {
  const a = timeToMinutes(start);
  const b = timeToMinutes(end);
  return a >= 0 && b > a;
}
