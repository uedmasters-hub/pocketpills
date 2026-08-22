import type { PointerEvent, ReactNode } from "react";
import { useRef } from "react";
import { DetailSection } from "@/components/DetailSection";
import { Tooltip } from "@/components/ui/Tooltip";
import { useI18n } from "@/lib/i18n";
import { SLOT_BANDS, type DaySlots } from "@/lib/appointments";
import { isPastDate, isSlotInPast, monthLong } from "@/lib/timeSlots";

function monthTitle(iso: string) {
  return monthLong(iso).toUpperCase();
}

export function availabilityDayLabel(
  d: { label: string },
  tx: (s: string) => string,
) {
  return d.label === "Today" || d.label === "Tomorrow" ? tx(d.label) : d.label;
}

const SLOT_GROUPS = [
  ["Morning", SLOT_BANDS.morning],
  ["Afternoon", SLOT_BANDS.afternoon],
  ["Evening", SLOT_BANDS.evening],
] as const;

export type AvailabilityBoardMode = "book" | "configure" | "display";

function WeekChevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      {dir === "prev" ? (
        <path d="M12.5 5 7.5 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M7.5 5 12.5 10l-5 5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function AvailabilityBoard({
  visitOptions,
  visitType,
  onSelectVisit,
  location,
  date,
  days,
  weekOffset,
  time = "",
  slots,
  onSelectDay,
  onSelectTime,
  onShiftWeek,
  mode = "book",
  title,
  onTitleChange,
  onPaintSlots,
  blockedSlots,
  monthSyncControl,
}: {
  visitOptions?: { id: string; label: string }[];
  visitType?: string;
  onSelectVisit?: (id: string) => void;
  location?: ReactNode;
  date: string;
  days: { date: string; label: string; weekday: string }[];
  weekOffset: number;
  time?: string;
  slots: DaySlots;
  onSelectDay: (date: string) => void;
  onSelectTime?: (t: string) => void;
  onShiftWeek: (delta: number) => void;
  mode?: AvailabilityBoardMode;
  title?: string;
  onTitleChange?: (title: string) => void;
  onPaintSlots?: (starts: string[]) => void;
  blockedSlots?: Record<string, string>;
  monthSyncControl?: ReactNode;
}) {
  const { tx } = useI18n();
  const available = new Set([...slots.morning, ...slots.afternoon, ...slots.evening]);
  const blocked = blockedSlots ?? {};
  const showVisit = (visitOptions?.length ?? 0) > 0 && onSelectVisit;
  const showToolbar = showVisit || location || monthSyncControl;
  const configure = mode === "configure";
  const display = mode === "display";
  const paintable = configure && Boolean(onPaintSlots);

  const drag = useRef<{ on: boolean } | null>(null);
  const longPress = useRef<number | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const working = useRef<string[] | null>(null);

  const paint = (slot: string, on: boolean) => {
    if (!onPaintSlots) return;
    if (on && blocked[slot]) return;
    const current = new Set(working.current ?? [...available]);
    if (on === current.has(slot)) return;
    if (on) current.add(slot);
    else current.delete(slot);
    const starts = [...current].filter((t) => !blocked[t]);
    working.current = starts;
    onPaintSlots(starts);
  };

  const beginPaint = (slot: string, on: boolean) => {
    if (on && blocked[slot]) return;
    working.current = [...available];
    drag.current = { on };
    paint(slot, on);
  };

  const endPaint = () => {
    drag.current = null;
    working.current = null;
    if (longPress.current) {
      window.clearTimeout(longPress.current);
      longPress.current = null;
    }
    startPoint.current = null;
  };

  const slotFromPoint = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    return el?.closest("[data-avail-slot]")?.getAttribute("data-avail-slot");
  };

  const onSlotPointerDown = (event: PointerEvent<HTMLButtonElement>, slot: string) => {
    if (!paintable || blocked[slot]) return;
    if (event.pointerType === "touch") {
      startPoint.current = { x: event.clientX, y: event.clientY };
      longPress.current = window.setTimeout(() => {
        event.currentTarget.setPointerCapture(event.pointerId);
        beginPaint(slot, !available.has(slot));
      }, 420);
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    beginPaint(slot, !available.has(slot));
  };

  const onSlotPointerMove = (event: PointerEvent) => {
    if (!paintable) return;
    if (longPress.current && startPoint.current) {
      const dx = event.clientX - startPoint.current.x;
      const dy = event.clientY - startPoint.current.y;
      if (dx * dx + dy * dy > 64) {
        window.clearTimeout(longPress.current);
        longPress.current = null;
      }
    }
    if (!drag.current) return;
    event.preventDefault();
    const slot = slotFromPoint(event.clientX, event.clientY);
    if (slot && !blocked[slot]) paint(slot, drag.current.on);
  };

  const onSlotPointerUp = (event: PointerEvent<HTMLButtonElement>, slot: string) => {
    if (!paintable) return;
    if (longPress.current) {
      window.clearTimeout(longPress.current);
      longPress.current = null;
      if (!drag.current && !blocked[slot]) paint(slot, !available.has(slot));
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    endPaint();
  };

  /**
   * Time-chip states (Hours / booking):
   * - selected: this visit type’s slot (or patient’s pick) — purple ring + dark text
   * - active: free to tap — white, no ring, medium purple-gray text
   * - disabled: taken by the other visit type (or past) — white, faint text
   */
  const slotClass = (kind: "selected" | "active" | "disabled") =>
    kind === "selected"
      ? "rounded-full border border-[color:var(--pp-primary-950)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--pp-primary-950)] tnum"
      : kind === "active"
        ? "rounded-full border border-transparent bg-white px-4 py-2 text-sm font-normal text-[color:var(--neutral-500)] tnum"
        : "rounded-full border border-transparent bg-white px-4 py-2 text-sm font-normal text-[color:var(--neutral-300)] tnum";

  const renderSlotButton = (t: string) => {
    const reason = blocked[t];
    const selectedHere = available.has(t) && !reason;

    if (mode === "book") {
      const open = selectedHere && !isSlotInPast(date, t);
      const picked = time === t;
      const kind = picked ? "selected" : open ? "active" : "disabled";
      const btn = (
        <button
          type="button"
          disabled={!open}
          onClick={() => open && onSelectTime?.(t)}
          className={slotClass(kind) + (open ? "" : " cursor-default")}
        >
          {t}
        </button>
      );
      return reason ? (
        <Tooltip key={t} label={reason}>
          {btn}
        </Tooltip>
      ) : (
        <span key={t} className="inline-flex">
          {btn}
        </span>
      );
    }

    // configure | display — selected = painted for this visit; disabled = other visit; else active
    const kind = reason ? "disabled" : selectedHere ? "selected" : "active";
    const btn = (
      <button
        type="button"
        data-avail-slot={reason ? undefined : t}
        aria-pressed={selectedHere}
        aria-label={reason ? `${t}. ${reason}` : t}
        disabled={display || Boolean(reason)}
        onPointerDown={(event) => onSlotPointerDown(event, t)}
        onPointerMove={onSlotPointerMove}
        onPointerUp={(event) => onSlotPointerUp(event, t)}
        onPointerCancel={endPaint}
        className={
          slotClass(kind) +
          (paintable && !reason ? " touch-none" : "") +
          (reason ? " cursor-not-allowed" : "") +
          (display ? " cursor-default" : "")
        }
      >
        {t}
      </button>
    );
    return reason ? (
      <Tooltip key={t} label={reason}>
        {btn}
      </Tooltip>
    ) : (
      <span key={t} className="inline-flex">
        {btn}
      </span>
    );
  };

  return (
    <DetailSection id="availability" title={tx(title || "Availability")} onTitleChange={onTitleChange}>
      {showToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            {showVisit ? (
              <div
                className="inline-flex rounded-full bg-[color:var(--pp-primary-200)] p-1"
                role="group"
                aria-label={tx("Visit type")}
              >
                {visitOptions!.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectVisit!(opt.id)}
                    className={
                      "rounded-full px-5 py-2 text-sm font-medium transition-colors " +
                      (visitType === opt.id
                        ? "bg-white text-[color:var(--pp-primary-950)] shadow-[0_1px_3px_rgba(24,7,48,0.1)]"
                        : "text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
            {monthSyncControl}
          </div>
          {location ? <div className="min-w-0 shrink-0">{location}</div> : null}
        </div>
      ) : null}

      {/* Soft lavender board: month + day strip + slots (matches Hours design) */}
      <div
        className={
          "overflow-hidden rounded-[1.25rem] border border-line bg-[color:var(--pp-primary-200)] " +
          (showToolbar ? "mt-4" : "")
        }
      >
        <div className="flex items-center justify-between px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => onShiftWeek(-7)}
            disabled={weekOffset <= 0}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-tertiary hover:text-[color:var(--pp-primary-950)] disabled:opacity-30"
            aria-label={tx("Previous week")}
          >
            <WeekChevron dir="prev" />
          </button>
          <p className="text-sm font-semibold tracking-[0.16em] text-[color:var(--pp-primary-950)]">
            {monthTitle(date || days[0]?.date || "")}
          </p>
          <button
            type="button"
            onClick={() => onShiftWeek(7)}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
            aria-label={tx("Next week")}
          >
            <WeekChevron dir="next" />
          </button>
        </div>

        <div
          className="grid grid-cols-7 border-y border-line bg-white"
          role="group"
          aria-label={tx("Choose a day")}
        >
          {days.map((d, i) => {
            const past = isPastDate(d.date);
            const on = d.date === date;
            return (
              <button
                key={d.date}
                type="button"
                disabled={past}
                onClick={() => {
                  if (!past) onSelectDay(d.date);
                }}
                className={
                  "relative min-w-0 px-1 py-3.5 text-center transition-colors " +
                  (i > 0 ? "border-l border-line " : "") +
                  (past
                    ? "cursor-default text-[color:var(--text-disabled)]"
                    : on
                      ? "z-[1] text-[color:var(--pp-primary-950)]"
                      : "text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]/50")
                }
              >
                {on && !past ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 border-2 border-[color:var(--pp-primary-950)]"
                  />
                ) : null}
                <span className={"relative block truncate text-2xs " + (past ? "" : "text-ink-tertiary")}>
                  {d.weekday}
                </span>
                <span className="relative mt-1 block truncate text-sm font-semibold">
                  {availabilityDayLabel(d, tx)}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className={"px-4 py-5 sm:px-5 " + (paintable ? "select-none" : "")}
          onPointerUp={paintable ? endPaint : undefined}
          onPointerCancel={paintable ? endPaint : undefined}
        >
          <div className="space-y-5">
            {SLOT_GROUPS.map(([label, band]) => (
              <div key={label}>
                <p className="text-2xs font-medium text-ink-tertiary">{tx(label)}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5 sm:gap-3">
                  {band.map((t) => renderSlotButton(t))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DetailSection>
  );
}

export function AvailabilityLocationPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-[16rem] truncate text-sm font-medium text-[color:var(--pp-primary-950)]">
      {children}
    </span>
  );
}

export function AvailabilityLocationSelect({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { tx } = useI18n();
  if (options.length > 1) {
    return (
      <label className="relative inline-flex min-w-[10rem] max-w-[16rem] items-center">
        <span className="sr-only">{tx("Branch")}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none truncate rounded-full border border-line bg-white py-2 pl-4 pr-9 text-sm font-medium text-[color:var(--pp-primary-950)] outline-none"
        >
          {options.map((opt) => (
            <option key={opt.id || opt.label} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-ink-tertiary">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </label>
    );
  }
  return <AvailabilityLocationPill>{options[0]?.label || tx("Location")}</AvailabilityLocationPill>;
}

/** Shared “Select for month” control for provider configure mode. */
export function AvailabilityMonthSyncControl({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { tx } = useI18n();
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[color:var(--pp-primary-950)]">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-line accent-[color:var(--pp-primary-950)]"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span className="font-medium">{tx("Select for month")}</span>
      <Tooltip
        label={tx(
          "Apply this day’s hours to every remaining day in the month. Editing another day turns this off; checking it again syncs the whole month to the day you are on.",
        )}
      >
        <span
          className="grid h-4 w-4 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-[0.65rem] font-semibold leading-none text-[color:var(--pp-primary-800)]"
          aria-hidden
        >
          i
        </span>
      </Tooltip>
    </label>
  );
}
