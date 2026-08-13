import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  WEEKDAYS,
  TIME_OPTIONS,
  defaultEndFor,
  endOptionsAfter,
  formatSlotWindow,
  isValidSlotRange,
  parseSlotWindow,
} from "@/lib/timeSlots";

/** Matches provider form fields elsewhere (Finance, Doctors, etc.). */
const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

export type SlotRow = {
  id: string;
  day: string;
  window: string;
};

type Props = {
  slots: SlotRow[];
  onAdd: (slot: { day: string; window: string }) => void;
  onRemove: (id: string) => void;
  emptyHint?: string;
};

/**
 * Day · Start · End dropdowns + compact Add — aligned with existing provider field styles.
 */
export function WeeklySlotEditor({ slots, onAdd, onRemove, emptyHint }: Props) {
  const { tx } = useI18n();
  const [day, setDay] = useState<string>("Monday");
  const [start, setStart] = useState("9:00 AM");
  const [end, setEnd] = useState("12:00 PM");

  useEffect(() => {
    const opts = endOptionsAfter(start);
    if (!opts.includes(end)) {
      setEnd(defaultEndFor(start));
    }
  }, [start, end]);

  const endChoices = endOptionsAfter(start);
  const canAdd = isValidSlotRange(start, end);

  const add = () => {
    if (!canAdd) return;
    onAdd({ day, window: formatSlotWindow(start, end) });
  };

  return (
    <div>
      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
          {tx("Add a time slot")}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1">
            <span className={LABEL}>{tx("Day")}</span>
            <select className={FIELD} value={day} onChange={(e) => setDay(e.target.value)}>
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {tx(d)}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0 flex-1">
            <span className={LABEL}>{tx("Start")}</span>
            <select
              className={FIELD}
              value={start}
              onChange={(e) => {
                const next = e.target.value;
                setStart(next);
                setEnd(defaultEndFor(next));
              }}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0 flex-1">
            <span className={LABEL}>{tx("End")}</span>
            <select className={FIELD} value={end} onChange={(e) => setEnd(e.target.value)}>
              {endChoices.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <Button
            size="sm"
            disabled={!canAdd}
            onClick={add}
            className="h-11 shrink-0 !px-5 !py-0"
          >
            {tx("Add")}
          </Button>
        </div>
      </div>

      {slots.length === 0 ? (
        <p className="mt-4 text-sm text-ink-tertiary">
          {emptyHint ?? tx("No slots yet. Add your first window above.")}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {[...slots]
            .sort((a, b) => {
              const di = WEEKDAYS.indexOf(a.day as (typeof WEEKDAYS)[number]);
              const dj = WEEKDAYS.indexOf(b.day as (typeof WEEKDAYS)[number]);
              const dcmp = (di < 0 ? 99 : di) - (dj < 0 ? 99 : dj);
              if (dcmp !== 0) return dcmp;
              return a.window.localeCompare(b.window);
            })
            .map((s) => {
              const parsed = parseSlotWindow(s.window);
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[color:var(--pp-primary-950)]">{tx(s.day)}</p>
                    <p className="mt-0.5 text-sm text-ink-tertiary">
                      {parsed ? (
                        <>
                          <span className="text-[color:var(--pp-primary-950)]">{parsed.start}</span>
                          <span className="mx-1.5 text-ink-tertiary">–</span>
                          <span className="text-[color:var(--pp-primary-950)]">{parsed.end}</span>
                        </>
                      ) : (
                        s.window
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
                    onClick={() => onRemove(s.id)}
                  >
                    {tx("Remove")}
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
