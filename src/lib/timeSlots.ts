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

export function plusMinutes(label: string, mins: number): string | null {
  const start = timeToMinutes(label);
  if (start < 0) return null;
  const next = TIME_OPTIONS.find((t) => timeToMinutes(t) === start + mins);
  return next ?? null;
}

/** Starts that have a following 30-minute end (never 11:30 PM). */
export function startTimeOptions(): string[] {
  return TIME_OPTIONS.filter((t) => plusMinutes(t, 30));
}

/** When a start is chosen, the matching "to" is the next 30-minute mark. */
export function nextSlotEnd(start: string): string {
  return plusMinutes(start, 30) || endOptionsAfter(start)[0] || start;
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

/** Listing clocks use Nepal time, not the browser/OS timezone. */
export const APP_TIMEZONE = "Asia/Kathmandu";
const NEPAL_OFFSET = "+05:45";

function zonedParts(at = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(at)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    weekday: map.weekday,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  };
}

function nepalNoon(iso: string) {
  return new Date(`${iso}T12:00:00${NEPAL_OFFSET}`);
}

export function todayIso(): string {
  return zonedParts().date;
}

export function addCalendarDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Every ISO date in the calendar month of `iso` (UTC date parts). */
export function isoDatesInMonth(iso: string): string[] {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return [];
  const out: string[] = [];
  for (let d = 1; d <= 31; d++) {
    const next = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const [ny, nm] = next.split("-").map(Number);
    if (ny !== y || nm !== m) break;
    out.push(next);
  }
  return out;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function weekdayShort(iso: string): string {
  return nepalNoon(iso).toLocaleDateString("en-CA", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  });
}

export function weekdayLong(iso: string): string {
  return nepalNoon(iso).toLocaleDateString("en-CA", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
  });
}

/** Visual grouping only — Morning until noon, Afternoon until 5:00 PM, Evening from 5:00 PM. */
export function availabilitySlotBands(): { morning: string[]; afternoon: string[]; evening: string[] } {
  const starts = startTimeOptions();
  return {
    morning: starts.filter((t) => {
      const m = timeToMinutes(t);
      return m >= 6 * 60 && m < 12 * 60;
    }),
    afternoon: starts.filter((t) => {
      const m = timeToMinutes(t);
      return m >= 12 * 60 && m < 17 * 60;
    }),
    evening: starts.filter((t) => {
      const m = timeToMinutes(t);
      return m >= 17 * 60 && m <= 21 * 60 + 30;
    }),
  };
}

export function monthLong(iso: string): string {
  return nepalNoon(iso).toLocaleDateString("en-CA", {
    timeZone: APP_TIMEZONE,
    month: "long",
  });
}

export function monthDayShort(iso: string): string {
  return nepalNoon(iso).toLocaleDateString("en-CA", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
  });
}

export function isPastDate(iso: string, at = new Date()): boolean {
  return Boolean(iso) && iso < zonedParts(at).date;
}

/** True when this clock time has already started or passed in Nepal. */
export function isSlotInPast(iso: string, timeLabel: string, at = new Date()): boolean {
  if (!iso || !timeLabel) return true;
  const now = zonedParts(at);
  if (iso < now.date) return true;
  if (iso > now.date) return false;
  const slotMin = timeToMinutes(timeLabel);
  return slotMin >= 0 && slotMin <= now.minutes;
}

function utcDayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1) / 86_400_000;
}

/** Minutes from now (Nepal) until the slot starts. Negative when the slot has begun. */
export function minutesUntilSlot(iso: string, timeLabel: string, at = new Date()): number | null {
  if (!iso || !timeLabel) return null;
  const slotMin = timeToMinutes(timeLabel);
  if (slotMin < 0) return null;
  const now = zonedParts(at);
  return (utcDayIndex(iso) - utcDayIndex(now.date)) * 24 * 60 + slotMin - now.minutes;
}
