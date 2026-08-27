/**
 * Hospital insights — gauge, calendar, yearly bars.
 */
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { appointmentPath } from "@/components/provider/HospitalDayBoard";
import { Caret, Tooltip, TooltipBubble } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import {
  CAL_KIND,
  GAUGE_RANGES,
  MONTH_SHORT,
  YEAR_MAX,
  YEAR_OPTIONS,
  YEAR_PATIENTS,
  YEAR_TARGET,
  eventsForDay,
  formatDelta,
  formatK,
  gaugeFromPatients,
  kindsOnDay,
  parseDraftToday,
  type CalKind,
  type GaugeRange,
} from "@/lib/hospitalOpsCharts";
import { useProvider } from "@/lib/providerAuth";
import { opsTodayIso, useHospitalPatients } from "@/lib/hospitalPatientDraft";

const PATIENTS_ALL = "/provider/patients";
const CARD = "overflow-visible rounded-2xl border border-line bg-white p-5";
const ICON_BTN =
  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]";

export function HospitalOpsInsights() {
  return (
    <div className="mt-6 space-y-4">
      <div className="grid items-stretch gap-4 xl:grid-cols-2">
        <PatientGaugeCard />
        <OpsCalendarCard />
      </div>
      <PatientYearChart />
    </div>
  );
}

function PatientGaugeCard() {
  const { tx } = useI18n();
  const { workspaceId } = useProvider();
  const { rows } = useHospitalPatients(workspaceId);
  const [range, setRange] = useState<GaugeRange>("week");
  const [focus, setFocus] = useState<"all" | "completed" | "upcoming" | "denied">("all");
  const slice = gaugeFromPatients(rows, range, opsTodayIso());
  const filled = Math.round((slice.completed / Math.max(1, slice.total)) * 20);
  const rangeLabel = GAUGE_RANGES.find((r) => r.id === range)?.label || "";
  const rangePhrase = range === "week" ? "in this week" : "in this month";

  return (
    <section className={CARD + " flex h-full flex-col"}>
      <CardHead
        title={tx("Total patients")}
        filter={
          <RangeMenu
            value={range}
            options={GAUGE_RANGES.map((r) => ({ id: r.id, label: tx(r.label) }))}
            onChange={setRange}
          />
        }
        menu={
          <KebabMenu
            items={[
              { to: PATIENTS_ALL, label: tx("View all patients") },
              {
                label: tx("Copy summary"),
                onClick: () =>
                  copyText(
                    `${tx("Total patients")} · ${tx(rangeLabel)}: ${slice.total}. ${tx("Completed")} ${slice.completed}, ${tx("Upcoming")} ${slice.upcoming}, ${tx("Denied")} ${slice.denied}.`,
                  ),
              },
            ]}
          />
        }
      />

      <div className="relative min-h-0 w-full flex-1">
        <SegmentGauge
          filled={filled}
          focus={focus}
          total={slice.total}
          completed={slice.completed}
          upcoming={slice.upcoming}
          denied={slice.denied}
          delta={slice.delta}
          rangePhrase={tx(rangePhrase)}
        />
      </div>

      <ul className="flex flex-wrap justify-center gap-2 pt-3">
        <LegendPill
          on={focus === "completed"}
          swatch="bg-[color:var(--pp-violet)]"
          label={`${tx("Completed")} — ${slice.completed}`}
          hint={`${tx("Completed")} · ${slice.completed} · ${tx(rangePhrase)}`}
          onClick={() => setFocus((f) => (f === "completed" ? "all" : "completed"))}
        />
        <LegendPill
          on={focus === "upcoming"}
          swatch="bg-[color:var(--pp-primary-200)]"
          label={`${tx("Upcoming")} — ${slice.upcoming}`}
          hint={`${tx("Upcoming")} · ${slice.upcoming} · ${tx(rangePhrase)}`}
          onClick={() => setFocus((f) => (f === "upcoming" ? "all" : "upcoming"))}
        />
        <LegendPill
          on={focus === "denied"}
          swatch="bg-danger"
          label={`${tx("Denied")} — ${slice.denied}`}
          hint={`${tx("Denied")} · ${slice.denied} · ${tx(rangePhrase)}`}
          onClick={() => setFocus((f) => (f === "denied" ? "all" : "denied"))}
        />
      </ul>
    </section>
  );
}

function SegmentGauge({
  filled,
  focus,
  total,
  completed,
  upcoming,
  denied,
  delta,
  rangePhrase,
}: {
  filled: number;
  focus: "all" | "completed" | "upcoming" | "denied";
  total: number;
  completed: number;
  upcoming: number;
  denied: number;
  delta: number;
  rangePhrase: string;
}) {
  const { tx } = useI18n();
  const [hover, setHover] = useState<number | null>(null);
  const [tip, setTip] = useState<{ on: boolean; x: number; y: number } | null>(null);
  const down = delta < 0;
  const n = 20;
  const pad = 18;
  const stroke = 14;
  const r0 = 86;
  const r1 = 134;
  const cx = 148;
  const cy = pad + r1 + stroke / 2;
  const vbW = cx * 2;
  const vbH = cy + stroke / 2 + pad;
  const start = Math.PI * 1.04;
  const end = -Math.PI * 0.04;

  const moveTip = (i: number, e: ReactMouseEvent<SVGLineElement>, ox: number, oy: number) => {
    const svg = e.currentTarget.ownerSVGElement;
    const ctm = svg?.getScreenCTM();
    if (!ctm || !svg) return;
    const pt = svg.createSVGPoint();
    pt.x = ox;
    pt.y = oy;
    const p = pt.matrixTransform(ctm);
    setHover(i);
    setTip({ on: i < filled, x: p.x, y: p.y });
  };

  return (
    <>
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label={`${tx("Total patients")} ${total}. ${tx("Completed")} ${completed}, ${tx("Upcoming")} ${upcoming}, ${tx("Denied")} ${denied}.`}
      >
        {Array.from({ length: n }, (_, i) => {
          const t = (i + 0.5) / n;
          const a = start + (end - start) * t;
          const x1 = cx + Math.cos(a) * r0;
          const y1 = cy - Math.sin(a) * r0;
          const x2 = cx + Math.cos(a) * r1;
          const y2 = cy - Math.sin(a) * r1;
          const on = i < filled;
          const dim =
            focus === "completed" ? !on : focus === "upcoming" ? on : focus === "denied";
          const hot = hover === i;
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={on ? "var(--pp-violet)" : "var(--pp-primary-200)"}
                strokeWidth={hot ? 16 : 13}
                strokeLinecap="round"
                opacity={dim ? 0.28 : 1}
                className="pointer-events-none transition-[stroke-width,opacity] duration-150"
              />
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={26}
                strokeLinecap="round"
                className="cursor-pointer"
                onMouseEnter={(e) => moveTip(i, e, x2, y2)}
                onMouseLeave={() => {
                  setHover(null);
                  setTip(null);
                }}
              />
            </g>
          );
        })}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="var(--pp-primary-950)"
          fontSize="42"
          fontWeight="500"
          fontFamily="Satoshi, sans-serif"
          className="tnum"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill={down ? "var(--color-danger)" : "var(--pp-green)"}
          fontSize="11"
          fontWeight="600"
          fontFamily="Satoshi, sans-serif"
        >
          {down ? "▾ " : "▴ "}
          {formatDelta(delta)} {rangePhrase}
        </text>
      </svg>
      {tip && typeof document !== "undefined"
        ? createPortal(
            <span
              role="tooltip"
              style={{ top: tip.y - 10, left: tip.x }}
              className="pointer-events-none fixed z-[90] -translate-x-1/2 -translate-y-full"
            >
              <TooltipBubble dot={tip.on ? "on" : "muted"}>
                {tip.on ? tx("Completed") : tx("Upcoming")}{" "}
                <span className="tnum">
                  {tip.on ? completed : upcoming} {tx("of")} {total}
                </span>
              </TooltipBubble>
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

function OpsCalendarCard() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { workspaceId } = useProvider();
  const { rows } = useHospitalPatients(workspaceId);
  const today = parseDraftToday();
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState(today);
  const [filter, setFilter] = useState<CalKind | "all">("all");

  const selOnCursor = selected.year === cursor.year && selected.month === cursor.month;
  const titleDate = selOnCursor
    ? new Date(selected.year, selected.month, selected.day)
    : new Date(cursor.year, cursor.month, 1);
  const label = selOnCursor
    ? `${selected.day} ${titleDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
    : titleDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const startPad = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - startPad + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const shift = (dir: number) => {
    const d = new Date(cursor.year, cursor.month + dir, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <section className={CARD + " flex h-full flex-col"} aria-label={tx("Calendar")}>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
          aria-label={tx("Previous month")}
          onClick={() => shift(-1)}
        >
          <Chevron dir="left" />
        </button>
        <p className="min-w-[12.5rem] text-center text-sm font-semibold text-[color:var(--pp-primary-950)] tnum">
          {label}
        </p>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
          aria-label={tx("Next month")}
          onClick={() => shift(1)}
        >
          <Chevron dir="right" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
          <p key={d} className="pb-2 text-2xs font-semibold tracking-wide text-ink-tertiary">
            {tx(d)}
          </p>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-line">
        <div className="grid h-full grid-cols-7 grid-rows-6">
          {cells.map((day, i) => {
            const edge =
              "min-h-[3.25rem] border-line [&:not(:nth-child(7n))]:border-r [&:not(:nth-last-child(-n+7))]:border-b";
            if (day == null) {
              return <div key={`e-${i}`} className={edge} />;
            }
            const events = eventsForDay(cursor.year, cursor.month, day, rows);
            const kinds = kindsOnDay(events).filter((k) => filter === "all" || k === filter);
            const isSel = selOnCursor && selected.day === day;
            const isToday = today.year === cursor.year && today.month === cursor.month && today.day === day;
            const tip = events.length
              ? events
                  .map((e) => e.label)
                  .slice(0, 4)
                  .join(" · ")
              : tx("No visits this day");
            return (
              <Tooltip
                key={day}
                label={tip}
                dot={events.length ? "on" : undefined}
                className={"h-full w-full " + edge}
              >
                <button
                  type="button"
                  onClick={() => {
                    const next = { year: cursor.year, month: cursor.month, day };
                    setSelected(next);
                    nav(appointmentPath(next));
                  }}
                  aria-current={isSel ? "date" : undefined}
                  className={
                    "flex h-full min-h-[3.25rem] w-full flex-col items-center justify-center gap-1 text-sm transition-colors " +
                    (isSel
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : isToday
                        ? "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
                        : "text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]")
                  }
                >
                  <span className="leading-none tnum">{day}</span>
                  <span className="flex h-1.5 items-center justify-center gap-0.5">
                    {kinds.map((k) => (
                      <span
                        key={k}
                        className={"h-1.5 w-1.5 rounded-full " + (isSel ? "bg-white/90" : CAL_KIND[k].className)}
                      />
                    ))}
                  </span>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1">
        {(Object.keys(CAL_KIND) as CalKind[]).map((k) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => setFilter((f) => (f === k ? "all" : k))}
              className={
                "inline-flex items-center gap-1.5 text-2xs font-medium transition-opacity " +
                (filter === "all" || filter === k ? "text-ink-secondary" : "text-ink-tertiary opacity-40")
              }
            >
              <span className={"h-1.5 w-1.5 rounded-full " + CAL_KIND[k].className} />
              {tx(CAL_KIND[k].label)}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PatientYearChart() {
  const { tx } = useI18n();
  const [year, setYear] = useState<(typeof YEAR_OPTIONS)[number]>(2026);
  const [pinned, setPinned] = useState(7);
  const [hover, setHover] = useState<number | null>(null);
  const series = YEAR_PATIENTS[year];
  const active = hover ?? pinned;
  const value = series[active] ?? 0;
  const yPct = (n: number) => `${100 - (n / YEAR_MAX) * 100}%`;

  return (
    <section className={CARD}>
      <CardHead
        title={tx("Total patients")}
        filter={
          <RangeMenu
            value={String(year)}
            options={YEAR_OPTIONS.map((y) => ({
              id: String(y),
              label: y === 2026 ? tx("This year") : tx("Last year"),
            }))}
            onChange={(id) => setYear(Number(id) as 2026 | 2025)}
          />
        }
        menu={
          <KebabMenu
            items={[
              { to: PATIENTS_ALL, label: tx("View all patients") },
              {
                label: tx("Copy summary"),
                onClick: () =>
                  copyText(
                    `${tx("Total patients")} ${year}: ${series.map((n, i) => `${MONTH_SHORT[i]} ${n}`).join(", ")}.`,
                  ),
              },
            ]}
          />
        }
      />

      <div className="mt-5 grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3">
        <div className="relative h-48 text-right text-2xs text-ink-tertiary tnum">
          {[5, 4, 3, 2, 1, 0].map((k) => (
            <span key={k} className="absolute right-0 -translate-y-1/2" style={{ top: yPct(k * 1000) }}>
              {k}K
            </span>
          ))}
        </div>

        <div className="relative h-48">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <div
              key={k}
              className="absolute inset-x-0 border-t border-line/80"
              style={{ top: yPct(k * 1000) }}
            />
          ))}
          <div
            className="pointer-events-none absolute inset-x-0 z-[1] border-t border-[color:var(--pp-violet)]"
            style={{ top: yPct(YEAR_TARGET) }}
          />
          {hover != null || pinned != null ? (
            <div
              className="pointer-events-none absolute inset-x-0 z-[2] border-t border-[color:var(--pp-primary-950)]"
              style={{ top: yPct(value) }}
            />
          ) : null}

          <div className="absolute inset-0 z-[3] flex items-end gap-1 px-0.5 sm:gap-1.5">
            {series.map((n, i) => {
              const on = active === i;
              const h = Math.max(6, (n / YEAR_MAX) * 100);
              return (
                <button
                  key={MONTH_SHORT[i]}
                  type="button"
                  aria-label={`${MONTH_SHORT[i]} ${year}: ${n} ${tx("patients")}`}
                  aria-pressed={on}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onClick={() => setPinned(i)}
                  className="group relative flex h-full min-w-0 flex-1 flex-col justify-end outline-none"
                >
                  <span
                    className="absolute inset-x-0 bottom-0 rounded-t-lg"
                    style={{
                      height: "100%",
                      background:
                        "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--pp-primary-400) 22%, white), color-mix(in srgb, var(--pp-primary-400) 22%, white) 3px, transparent 3px, transparent 7px)",
                    }}
                  />
                  <span
                    className={
                      "relative z-[1] w-full rounded-t-lg transition-all duration-200 " +
                      (on
                        ? "bg-[color:var(--pp-primary-950)]"
                        : "bg-[color:var(--pp-violet)] group-hover:bg-[color:var(--pp-primary-950)]")
                    }
                    style={{ height: `${h}%` }}
                  />
                  {on ? (
                    <>
                      <span
                        className="pointer-events-none absolute left-1/2 z-[4] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[color:var(--pp-violet)] bg-white"
                        style={{ top: `calc(${100 - h}% - 6px)` }}
                      />
                      <span
                        className="pointer-events-none absolute left-1/2 z-[5] -translate-x-1/2 -translate-y-full"
                        style={{ top: `calc(${100 - h}% - 14px)` }}
                      >
                        <TooltipBubble dot>{formatK(n)}</TooltipBubble>
                      </span>
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div />
        <div className="grid grid-cols-12 gap-1 text-center text-2xs text-ink-tertiary sm:gap-1.5">
          {MONTH_SHORT.map((m, i) => (
            <span key={m} className={active === i ? "font-semibold text-[color:var(--pp-primary-950)]" : ""}>
              {tx(m)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CardHead({
  title,
  filter,
  menu,
}: {
  title: string;
  filter?: ReactNode;
  menu: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">{title}</h2>
      <div className="flex shrink-0 items-center gap-1.5">
        {filter}
        {menu}
      </div>
    </div>
  );
}

function RangeMenu<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-medium text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
      >
        <FilterGlyph />
        {current}
        <Caret open={open} size={14} className="text-ink-tertiary" />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label={tx("Range")}
          className="absolute right-0 z-20 mt-1.5 min-w-[9.5rem] overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-[0_12px_32px_rgba(24,7,48,0.12)]"
        >
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={o.id === value}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={
                  "flex w-full px-3.5 py-2 text-left text-sm " +
                  (o.id === value
                    ? "bg-[color:var(--pp-primary-100)] font-medium text-[color:var(--pp-primary-950)]"
                    : "text-ink-secondary hover:bg-[color:var(--state-hover)]")
                }
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function KebabMenu({ items }: { items: { label: string; to?: string; onClick?: () => void }[] }) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        className={ICON_BTN}
        aria-label={tx("More")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <KebabGlyph />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 z-20 mt-1.5 min-w-[11rem] overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-[0_12px_32px_rgba(24,7,48,0.12)]"
        >
          {items.map((item) => (
            <li key={item.label}>
              {item.to ? (
                <Link
                  role="menuitem"
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block px-3.5 py-2 text-sm text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                  className="flex w-full px-3.5 py-2 text-left text-sm text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LegendPill({
  on,
  swatch,
  label,
  hint,
  onClick,
}: {
  on: boolean;
  swatch: string;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <li>
      <Tooltip label={hint} dot>
        <button
          type="button"
          aria-pressed={on}
          onClick={onClick}
          className={
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors " +
            (on
              ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
              : "border-line text-ink-secondary hover:bg-[color:var(--state-hover)]")
          }
        >
          <span className={"h-1.5 w-1.5 rounded-full " + swatch} />
          {label}
        </button>
      </Tooltip>
    </li>
  );
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

function FilterGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M2 3.5h12M4 8h8M6.5 12.5h3" strokeLinecap="round" />
    </svg>
  );
}

function KebabGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="8" cy="3.2" r="1.2" />
      <circle cx="8" cy="8" r="1.2" />
      <circle cx="8" cy="12.8" r="1.2" />
    </svg>
  );
}

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}
