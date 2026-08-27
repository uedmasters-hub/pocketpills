import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  DEPARTMENTS,
  DEPT_TABS,
  deptLoadLevel,
  type DeptRow,
  type DeptTab,
} from "@/lib/hospitalPatientDraft";

export function HospitalDeptOverview() {
  const { tx } = useI18n();
  const [tab, setTab] = useState<DeptTab>("inpatient");
  const rows = DEPARTMENTS[tab];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Department overview")}
          </h2>
          <Link
            to="/provider/services"
            className="shrink-0 text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
          >
            {tx("View all")}
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label={tx("Department type")}>
          {DEPT_TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className={
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
                  (on
                    ? "bg-[color:var(--pp-primary-950)] text-white"
                    : "bg-[color:var(--pp-primary-100)] text-ink-secondary hover:text-[color:var(--pp-primary-950)]")
                }
              >
                {tx(t.label)}
              </button>
            );
          })}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-2xs text-ink-tertiary">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--pp-primary-200)]" aria-hidden />
            {tx("Stable")}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--pp-violet)]" aria-hidden />
            {tx("Moderate")}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--pp-primary-950)]" aria-hidden />
            {tx("Almost full")}
          </li>
        </ul>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {rows.map((row) => (
          <li key={row.id}>
            <DeptLoadRow row={row} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DeptLoadRow({ row }: { row: DeptRow }) {
  const { tx } = useI18n();
  const level = deptLoadLevel(row.used, row.cap);
  const pct = Math.min(100, Math.round((row.used / Math.max(1, row.cap)) * 100));
  const bar =
    level === "full"
      ? "bg-[color:var(--pp-primary-950)]"
      : level === "moderate"
        ? "bg-[color:var(--pp-violet)]"
        : "bg-[color:var(--pp-primary-200)]";

  return (
    <article className="px-5 py-3.5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]">
          <BedIcon />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">
          {tx(row.label)}
        </p>
        <p className="shrink-0 text-sm font-medium text-[color:var(--pp-primary-950)] tnum">
          {row.used}/{row.cap}
        </p>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[color:var(--pp-primary-100)]">
        <div className={"h-full rounded-full " + bar} style={{ width: `${pct}%` }} />
      </div>
    </article>
  );
}

function BedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M3 18V9h7a4 4 0 0 1 4 4v5" strokeLinecap="round" />
      <path d="M3 14h18v4" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}
