/** Hospital operations analytics — live patient counts plus yearly illustration. */

import {
  DRAFT_PATIENTS,
  splitDuration,
  type DraftHospitalPatient,
  type DraftPatientStatus,
  type DraftVisitType,
} from "@/lib/hospitalPatientDraft";
import { timeToMinutes } from "@/lib/timeSlots";

export type GaugeRange = "week" | "month";
export type CalKind = "checkup" | "surgery" | "followup";

export type GaugeSlice = {
  total: number;
  completed: number;
  upcoming: number;
  denied: number;
  delta: number;
};

export const GAUGE_RANGES: { id: GaugeRange; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

export const YEAR_MAX = 5000;
export const YEAR_TARGET = 4000;
export const YEAR_OPTIONS = [2026, 2025] as const;
export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const YEAR_PATIENTS: Record<number, number[]> = {
  2026: [2180, 2460, 2810, 3120, 3580, 4000, 3720, 4180, 3910, 4050, 4380, 4610],
  2025: [1840, 2010, 2280, 2590, 2940, 3310, 3180, 3490, 3370, 3620, 3810, 3960],
};

export const CAL_KIND: Record<CalKind, { label: string; className: string; swatch: string }> = {
  checkup: { label: "Check-ups", className: "bg-[color:var(--pp-violet)]", swatch: "var(--pp-violet)" },
  surgery: { label: "Surgeries", className: "bg-[color:var(--pp-primary-950)]", swatch: "var(--pp-primary-950)" },
  followup: { label: "Follow-ups", className: "bg-[color:var(--pp-violet-mid)]", swatch: "var(--pp-violet-mid)" },
};

export type DayEvent = {
  kind: CalKind;
  label: string;
};

export type HourlyBooking = {
  id: string;
  patientId?: string;
  name: string;
  reason: string;
  doctor: string;
  startMin: number;
  endMin: number;
  window: string;
  kind: CalKind;
  status?: DraftPatientStatus;
  visitType?: DraftVisitType;
};

export const BOARD_START_MIN = 0;
export const BOARD_END_MIN = 24 * 60;

export function classifyVisit(p: DraftHospitalPatient): CalKind {
  const r = p.reason.toLowerCase();
  const d = p.department.toLowerCase();
  if (d === "surgery" || /endoscop|post-op|icu|emergency/.test(r)) return "surgery";
  if (/follow|review|ward|maternity|paediatric/.test(r)) return "followup";
  return "checkup";
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function iso(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function dateKey(year: number, month: number, day: number) {
  return iso(year, month, day);
}

export function parseDateKey(key: string | undefined) {
  const m = key?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return parseDraftToday();
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return parseDraftToday();
  return { year, month, day };
}

function parseWindow(duration: string): { startMin: number; endMin: number } {
  const { start, end } = splitDuration(duration);
  let startMin = timeToMinutes(start);
  let endMin = timeToMinutes(end);
  if (startMin < 0) startMin = 9 * 60;
  if (endMin <= startMin) endMin = startMin + 30;
  return { startMin, endMin };
}

/** Booked visits for one day on the hourly doctor grid. */
export function bookingsForDay(
  year: number,
  month: number,
  day: number,
  patients: DraftHospitalPatient[] = DRAFT_PATIENTS,
): HourlyBooking[] {
  const date = iso(year, month, day);
  const named: HourlyBooking[] = patients
    .filter((p) => p.date === date)
    .map((p) => {
      const { startMin, endMin } = parseWindow(p.duration);
      return {
        id: p.id,
        patientId: p.id,
        name: p.name,
        reason: p.reason,
        doctor: p.doctor,
        startMin,
        endMin,
        window: p.duration,
        kind: classifyVisit(p),
        status: p.status,
        visitType: p.visitType,
      };
    });
  return named.sort((a, b) => a.startMin - b.startMin || a.doctor.localeCompare(b.doctor));
}

export function packBookingLanes(items: HourlyBooking[]) {
  return items.map((b) => {
    const group = items
      .filter((o) => o.startMin < b.endMin && o.endMin > b.startMin)
      .sort((a, c) => a.startMin - c.startMin || a.id.localeCompare(c.id));
    return {
      booking: b,
      lane: Math.max(0, group.findIndex((x) => x.id === b.id)),
      lanes: Math.max(1, group.length),
    };
  });
}

/** Booked visits for the month calendar. */
export function eventsForDay(year: number, month: number, day: number, patients: DraftHospitalPatient[] = DRAFT_PATIENTS): DayEvent[] {
  const date = iso(year, month, day);
  return patients
    .filter((p) => p.date === date)
    .map((p) => ({ kind: classifyVisit(p), label: `${p.name} · ${p.reason}` }));
}

export function gaugeFromPatients(
  patients: DraftHospitalPatient[],
  range: GaugeRange,
  todayIso: string,
): GaugeSlice {
  const today = Date.parse(`${todayIso}T12:00:00`);
  const span = range === "week" ? 6 : new Date(today).getDate() - 1;
  const start = today - span * 86400000;
  const prevStart = start - (span + 1) * 86400000;
  const prevEnd = start - 86400000;

  const inWindow = (from: number, to: number) =>
    patients.filter((p) => {
      const t = Date.parse(`${p.date}T12:00:00`);
      return t >= from && t <= to;
    });

  const sliceOf = (list: DraftHospitalPatient[]) => {
    const completed = list.filter((p) => p.status === "completed").length;
    const upcoming = list.filter((p) => p.status === "upcoming" || p.status === "active").length;
    const denied = list.filter((p) => p.status === "denied" || p.status === "cancelled").length;
    return { completed, upcoming, denied, total: completed + upcoming };
  };

  const current = sliceOf(inWindow(start, today));
  const previous = sliceOf(inWindow(prevStart, prevEnd));
  const delta = previous.total > 0 ? ((current.total - previous.total) / previous.total) * 100 : 0;
  return { ...current, delta };
}

export function kindsOnDay(events: DayEvent[]): CalKind[] {
  const order: CalKind[] = ["checkup", "surgery", "followup"];
  return order.filter((k) => events.some((e) => e.kind === k));
}

export function parseDraftToday() {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth(), day: n.getDate() };
}

export function formatK(n: number) {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return String(n);
}

export function formatDelta(n: number) {
  return `${Math.abs(n).toFixed(2)}%`;
}
