/**
 * Hourly hospital schedule board.
 */
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddDraftPatientModal, type AddDraftDefaults } from "@/components/provider/AddDraftPatientModal";
import { PatientManageQuickView } from "@/components/provider/PatientManageQuickView";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import {
  BOARD_END_MIN,
  BOARD_START_MIN,
  CAL_KIND,
  bookingsForDay,
  dateKey,
  packBookingLanes,
  parseDraftToday,
  type HourlyBooking,
} from "@/lib/hospitalOpsCharts";
import {
  boardDoctors,
  cancellationPath,
  doctorCredentials,
  needsCancelFlow,
  useHospitalPatients,
  patientInitials,
} from "@/lib/hospitalPatientDraft";
import { TIME_OPTIONS, formatSlotWindow, plusMinutes } from "@/lib/timeSlots";

const HOUR_H = 64;
const HOURS = (BOARD_END_MIN - BOARD_START_MIN) / 60;
const GRID_H = HOURS * HOUR_H;
const COL_W = "13.5rem";
const TIME_W = "4rem";

function clockMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

export type CalDate = { year: number; month: number; day: number };

export function appointmentPath(date: CalDate) {
  return `/provider/schedule/${dateKey(date.year, date.month, date.day)}`;
}

export function HospitalDayBoard({ date }: { date: CalDate }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { workspaceId } = useProvider();
  const doctors = boardDoctors(workspaceId);
  const { rows, upsert } = useHospitalPatients(workspaceId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [addDefaults, setAddDefaults] = useState<AddDraftDefaults | null>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hour = Math.min(HOURS - 1, Math.floor(clockMinutes() / 60));
    el.scrollTop = hour * HOUR_H;
    el.scrollLeft = 0;
  }, [date.year, date.month, date.day]);

  const title = new Date(date.year, date.month, date.day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const bookings = bookingsForDay(date.year, date.month, date.day, rows);
  const openPatient = openId ? rows.find((p) => p.id === openId) ?? null : null;
  const today = parseDraftToday();
  const isToday = today.year === date.year && today.month === date.month && today.day === date.day;
  const cutoffMin = slotCutoffMin(date);
  const openBooking = openId ? bookings.find((b) => b.patientId === openId) : undefined;
  const reviewOnly = Boolean(openBooking && cutoffMin != null && openBooking.endMin <= cutoffMin);

  const go = (next: CalDate) => nav(appointmentPath(next));
  const shift = (dir: number) => {
    const d = new Date(date.year, date.month, date.day + dir);
    go({ year: d.getFullYear(), month: d.getMonth(), day: d.getDate() });
  };

  return (
    <>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-white">
        <header className="flex shrink-0 items-center gap-2 px-5 py-4">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
            aria-label={tx("Previous day")}
            onClick={() => shift(-1)}
          >
            <Chevron dir="left" />
          </button>
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)] tnum">{title}</h2>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
            aria-label={tx("Next day")}
            onClick={() => shift(1)}
          >
            <Chevron dir="right" />
          </button>
        </header>

        <WeekStrip date={date} onPick={go} />

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto border-t border-line">
          <div
            className="grid"
            style={{
              width: `calc(${TIME_W} + ${doctors.length} * ${COL_W})`,
              gridTemplateColumns: `${TIME_W} repeat(${doctors.length}, ${COL_W})`,
            }}
          >
            <div className="sticky top-0 left-0 z-30 h-[4.25rem] border-b border-r border-line bg-white" />
            {doctors.map((name) => (
              <DoctorHead key={name} name={name} orgId={workspaceId} />
            ))}

            <div className="relative sticky left-0 z-20 overflow-visible border-r border-line bg-white" style={{ height: GRID_H }}>
              {Array.from({ length: HOURS }, (_, i) => (
                <p
                  key={i}
                  className={
                    "absolute right-2 text-2xs font-medium leading-none tnum " +
                    (cutoffMin != null && i * 60 < cutoffMin ? "text-ink-tertiary/50" : "text-ink-tertiary")
                  }
                  style={{ top: i * HOUR_H + 8 }}
                >
                  {hourLabel(i)}
                </p>
              ))}
            </div>

            {doctors.map((name) => (
              <DoctorLane
                key={name}
                doctor={name}
                bookings={bookings.filter((b) => b.doctor === name)}
                cutoffMin={cutoffMin}
                showNow={isToday}
                onOpen={(id) => {
                  const patient = rows.find((p) => p.id === id);
                  if (patient && needsCancelFlow(patient)) {
                    nav(cancellationPath(id));
                    return;
                  }
                  setOpenId(id);
                }}
                onAddSlot={(duration) =>
                  setAddDefaults({
                    doctor: name,
                    date: dateKey(date.year, date.month, date.day),
                    duration,
                  })
                }
              />
            ))}
          </div>
        </div>
      </section>

      <AddDraftPatientModal
        open={Boolean(addDefaults)}
        defaults={addDefaults}
        onClose={() => setAddDefaults(null)}
        onAdd={(p) => {
          upsert(p);
          setAddDefaults(null);
        }}
      />
      <PatientManageQuickView
        patient={openPatient}
        open={Boolean(openPatient)}
        reviewOnly={reviewOnly}
        onClose={() => setOpenId(null)}
        onChange={upsert}
      />
    </>
  );
}

function WeekStrip({ date, onPick }: { date: CalDate; onPick: (next: CalDate) => void }) {
  const { tx } = useI18n();
  const today = parseDraftToday();
  const start = new Date(date.year, date.month, date.day);
  start.setDate(start.getDate() - start.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  });

  return (
    <div className="flex shrink-0 gap-1 border-t border-line px-3 py-3 sm:px-5">
      {days.map((d, i) => {
        const on = d.year === date.year && d.month === date.month && d.day === date.day;
        const isToday = d.year === today.year && d.month === today.month && d.day === today.day;
        return (
          <button
            key={`${d.year}-${d.month}-${d.day}`}
            type="button"
            onClick={() => onPick(d)}
            aria-current={on ? "date" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-[color:var(--pp-primary-950)] hover:opacity-70"
          >
            <span className="text-2xs font-medium text-ink-tertiary">{tx(["S", "M", "T", "W", "T", "F", "S"][i])}</span>
            <span
              className={
                "grid h-8 w-8 place-items-center rounded-full text-sm tnum " +
                (on
                  ? "bg-[color:var(--pp-primary-950)] font-semibold text-white"
                  : isToday
                    ? "font-semibold ring-1 ring-[color:var(--pp-violet)]"
                    : "")
              }
            >
              {d.day}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DoctorHead({ name, orgId }: { name: string; orgId: string }) {
  const creds = doctorCredentials(orgId, name);
  return (
    <div className="sticky top-0 z-10 flex h-[4.25rem] items-center gap-2.5 overflow-visible border-b border-l border-line bg-white px-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-2xs font-semibold text-[color:var(--pp-primary-950)]">
        {patientInitials(name.replace(/^Dr\.\s*/, ""))}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">{name}</p>
        <p className="mt-0.5 truncate text-2xs leading-snug text-ink-tertiary">{creds}</p>
      </div>
    </div>
  );
}

function DoctorLane({
  doctor,
  bookings,
  cutoffMin,
  showNow,
  onOpen,
  onAddSlot,
}: {
  doctor: string;
  bookings: HourlyBooking[];
  cutoffMin: number | null;
  showNow: boolean;
  onOpen: (patientId: string) => void;
  onAddSlot: (duration: string) => void;
}) {
  const { tx } = useI18n();
  const packed = useMemo(() => packBookingLanes(bookings), [bookings]);
  const nowTop = showNow ? yFor(clockMinutes()) : 0;
  const pastH = cutoffMin == null ? 0 : yFor(cutoffMin);

  return (
    <div className="relative border-l border-line bg-[color:var(--pp-primary-100)]/40" style={{ height: GRID_H }}>
      {Array.from({ length: HOURS * 2 }, (_, i) => {
        const startMin = i * 30;
        const past = cutoffMin != null && startMin < cutoffMin;
        return (
          <button
            key={`${doctor}-${i}`}
            type="button"
            disabled={past}
            aria-label={past ? tx("Past time") : tx("Add visit")}
            className={
              "absolute inset-x-0 z-0 p-0 " +
              (i % 2 === 0 ? "border-t border-line/80 " : "") +
              (past
                ? "cursor-default bg-[color:var(--pp-primary-950)]/[0.05]"
                : "cursor-pointer bg-transparent hover:bg-[color:var(--state-hover)]")
            }
            style={{ top: i * (HOUR_H / 2), height: HOUR_H / 2 }}
            onClick={() => {
              if (past) return;
              onAddSlot(hourSlotDuration(Math.floor(i / 2), i % 2 === 1));
            }}
          />
        );
      })}
      {pastH > 0 ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-0 bg-[color:var(--pp-primary-950)]/[0.04]"
          style={{ height: pastH }}
        />
      ) : null}
      {packed.map(({ booking, lane, lanes }) => {
        const top = yFor(booking.startMin);
        const height = Math.max(56, yFor(booking.endMin) - top);
        const width = `calc((100% - 0.75rem) / ${lanes})`;
        const left = `calc(0.375rem + ${lane} * (100% - 0.75rem) / ${lanes})`;
        const clickable = Boolean(booking.patientId);
        const past = cutoffMin != null && booking.endMin <= cutoffMin;
        const cls =
          "absolute z-[1] overflow-hidden rounded-2xl border border-line bg-white px-2.5 py-1.5 pr-5 text-left shadow-[0_4px_14px_rgba(24,7,48,0.06)] " +
          (past ? "opacity-50 hover:opacity-100 " : "") +
          (clickable ? "hover:bg-[color:var(--state-hover)]" : "");
        const inner = (
          <>
            <p className="truncate text-2xs font-semibold leading-none text-[color:var(--pp-primary-950)]">
              {booking.name}
            </p>
            {height >= 72 ? (
              <p className="mt-0.5 truncate text-2xs leading-none text-ink-tertiary">{booking.reason}</p>
            ) : null}
            <p className="mt-1 truncate text-2xs leading-none text-ink-tertiary tnum">{booking.window}</p>
            <span
              className={"absolute right-2 top-2 h-1.5 w-1.5 rounded-full " + CAL_KIND[booking.kind].className}
            />
          </>
        );
        return clickable ? (
          <button
            key={booking.id}
            type="button"
            onClick={() => onOpen(booking.patientId!)}
            aria-label={past ? `${booking.name}. ${tx("Review visit")}` : booking.name}
            className={cls}
            style={{ top, height, width, left }}
          >
            {inner}
          </button>
        ) : (
          <div key={booking.id} className={cls} style={{ top, height, width, left }}>
            {inner}
          </div>
        );
      })}
      {showNow ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-[2] border-t border-[color:var(--pp-violet)]"
          style={{ top: nowTop }}
        >
          <span className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--pp-violet)]" />
        </div>
      ) : null}
    </div>
  );
}

function slotCutoffMin(date: CalDate): number | null {
  const today = parseDraftToday();
  const a = date.year * 400 + date.month * 32 + date.day;
  const b = today.year * 400 + today.month * 32 + today.day;
  if (a < b) return BOARD_END_MIN;
  if (a > b) return null;
  return clockMinutes();
}

function hourSlotDuration(hour: number, secondHalf: boolean): string {
  const idx = Math.min(TIME_OPTIONS.length - 1, hour * 2 + (secondHalf ? 1 : 0));
  const start = TIME_OPTIONS[idx];
  const end = plusMinutes(start, 30) ?? "12:00 AM";
  return formatSlotWindow(start, end);
}

function yFor(min: number) {
  const clamped = Math.min(BOARD_END_MIN, Math.max(BOARD_START_MIN, min));
  return ((clamped - BOARD_START_MIN) / 60) * HOUR_H;
}

function hourLabel(hour: number) {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      {dir === "left" ? (
        <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
