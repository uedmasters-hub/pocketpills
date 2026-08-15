import { useId, useState } from "react";
import { Caret } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import {
  ALL_SPECIALISED_OPTIONS,
  specialisedCatalog,
  specialisedCopy,
  toggleProcedure,
  toggleSpecialty,
  type SpecialisedGroup,
  type SpecialisedVariant,
} from "@/lib/specialisedIn";

function procedureCount(n: number) {
  return n === 1 ? "1 procedure" : `${n} procedures`;
}

function specialistCount(
  staff:
    | {
        specialisedIn?: SpecialisedGroup[];
        specialties: string[];
        subtitle: string;
        focusAreas?: string[];
      }[]
    | undefined,
  specialty: string,
) {
  if (!staff?.length) return 0;
  const key = specialty.toLowerCase();
  return staff.filter((d) => {
    if (d.specialisedIn?.some((g) => g.specialty.toLowerCase() === key)) return true;
    const blob = `${d.subtitle} ${d.specialties.join(" ")} ${(d.focusAreas ?? []).join(" ")}`.toLowerCase();
    if (key.includes("physician") || key === "general") {
      return d.specialties.includes("general") || /family|physician|general|mbbs|md/.test(blob);
    }
    return blob.includes(key.split(" ")[0] || key);
  }).length;
}

export function SpecialisedInSection({
  groups,
  variant,
  compact = false,
  staff,
}: {
  groups: SpecialisedGroup[];
  variant: SpecialisedVariant;
  compact?: boolean;
  staff?: { specialisedIn?: SpecialisedGroup[]; specialties: string[]; subtitle: string; focusAreas?: string[]; name: string }[];
}) {
  const { tx } = useI18n();
  const baseId = useId();
  const [open, setOpen] = useState<string | null>(null);
  const copy = specialisedCopy(variant);
  if (!groups.length) return null;

  return (
    <section className={compact ? "min-w-0" : "min-w-0 scroll-mt-28"}>
      <h2
        className={
          compact
            ? "text-sm font-semibold text-[color:var(--pp-primary-950)]"
            : "font-display text-xl font-medium text-[color:var(--pp-primary-950)]"
        }
      >
        {tx(copy.title)}
      </h2>
      {!compact ? (
        <>
          <p className="mt-1 text-sm text-ink-tertiary">{tx(copy.lede)}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
            {groups.map((g) => tx(g.specialty)).join(" · ")}
          </p>
        </>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {groups.map((group, i) => {
          const expanded = open === group.specialty;
          const btnId = `${baseId}-${i}-btn`;
          const panelId = `${baseId}-${i}-panel`;
          return (
            <div key={group.specialty} className={i > 0 ? "border-t border-line" : ""}>
              <button
                id={btnId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : group.specialty)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)] sm:px-5"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-[color:var(--pp-primary-950)]">
                    {tx(group.specialty)}
                  </span>
                  <span className="mt-0.5 block text-2xs text-ink-tertiary">
                    {specialistCount(staff, group.specialty) > 0
                      ? tx(
                          `${specialistCount(staff, group.specialty)} specialists · ${procedureCount(group.procedures.length)}`,
                        )
                      : tx(procedureCount(group.procedures.length))}
                  </span>
                </span>
                <Caret open={expanded} className="text-ink-tertiary" />
              </button>
              <div id={panelId} role="region" aria-labelledby={btnId} hidden={!expanded}>
                {expanded ? (
                  <div className="px-4 pb-4 sm:px-5">
                    <ul className="space-y-1.5">
                      {group.procedures.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-sm text-[color:var(--pp-primary-950)]"
                        >
                          <span className="text-wellness" aria-hidden>
                            ✓
                          </span>
                          {tx(item)}
                        </li>
                      ))}
                    </ul>
                    {specialistCount(staff, group.specialty) > 0 ? (
                      <a
                        href="#hospital-doctors"
                        className="mt-3 inline-block text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
                      >
                        {tx("View doctors")} →
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SpecialisedInEditor({
  value,
  variant,
  onChange,
}: {
  value: SpecialisedGroup[];
  variant: SpecialisedVariant;
  onChange: (next: SpecialisedGroup[]) => void;
}) {
  const { tx } = useI18n();
  const baseId = useId();
  const [open, setOpen] = useState<string | null>(null);
  const copy = specialisedCopy(variant);
  const selected = new Map(value.map((g) => [g.specialty, g]));

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx(copy.title)}</p>
      <p className="mb-3 text-sm text-ink-tertiary">{tx(copy.editorHint)}</p>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {ALL_SPECIALISED_OPTIONS.map((opt, i) => {
          const current = selected.get(opt.specialty);
          const on = Boolean(current);
          const catalog = specialisedCatalog(opt.specialty);
          if (!catalog) return null;
          const expanded = open === opt.specialty;
          const count = current?.procedures.length ?? 0;
          const btnId = `${baseId}-ed-${i}`;
          const panelId = `${baseId}-ed-panel-${i}`;
          return (
            <div key={opt.specialty} className={i > 0 ? "border-t border-line" : ""}>
              <div className="flex items-stretch">
                <label className="flex cursor-pointer items-center px-4 sm:px-5">
                  <span className="sr-only">
                    {tx("Include")} {tx(opt.specialty)}
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[color:var(--pp-primary-950)]"
                    checked={on}
                    onChange={(e) => {
                      const next = toggleSpecialty(value, opt.specialty, e.target.checked);
                      onChange(next);
                      if (e.target.checked) setOpen(opt.specialty);
                      else if (expanded) setOpen(null);
                    }}
                  />
                </label>
                <button
                  id={btnId}
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpen(expanded ? null : opt.specialty)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3.5 pr-4 text-left transition-colors hover:bg-[color:var(--state-hover)] sm:pr-5"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-[color:var(--pp-primary-950)]">
                      {tx(opt.specialty)}
                    </span>
                    <span className="mt-0.5 block text-2xs text-ink-tertiary">
                      {on
                        ? tx(`${count} of ${catalog.procedures.length} selected`)
                        : tx("Not listed")}
                    </span>
                  </span>
                  <Caret open={expanded} className="text-ink-tertiary" />
                </button>
              </div>
              <div id={panelId} role="region" aria-labelledby={btnId} hidden={!expanded}>
                {expanded ? (
                  <ul className="space-y-1 px-4 pb-4 pl-12 sm:px-5 sm:pl-14">
                    {catalog.procedures.map((item) => {
                      const checked = Boolean(current?.procedures.includes(item));
                      return (
                        <li key={item}>
                          <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-[color:var(--pp-primary-950)]">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 accent-[color:var(--pp-primary-950)]"
                              checked={checked}
                              onChange={(e) =>
                                onChange(
                                  toggleProcedure(value, opt.specialty, item, e.target.checked),
                                )
                              }
                            />
                            {tx(item)}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
