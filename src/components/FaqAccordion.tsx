import { useId, useState } from "react";
import { EnableAddButton, EnableLine } from "@/components/listingEnable";
import { useI18n } from "@/lib/i18n";

export type FaqItem = { q: string; a: string };

function PlusMinus({ open }: { open: boolean }) {
  return (
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[color:var(--pp-primary-900)]" aria-hidden>
      {open ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      )}
    </span>
  );
}

/** Homepage-style FAQ: left heading, separate rounded cards, plus/minus. */
export function FaqAccordion({
  items,
  onChange,
}: {
  items: FaqItem[];
  onChange?: (items: FaqItem[]) => void;
}) {
  const { tx } = useI18n();
  const baseId = useId();
  const enable = Boolean(onChange);
  const [open, setOpen] = useState<number | null>(items.length ? 0 : null);
  if (!items.length && !enable) return null;

  const patch = (index: number, partial: Partial<FaqItem>) => {
    onChange?.(items.map((row, i) => (i === index ? { ...row, ...partial } : row)));
  };

  return (
    <section className="min-w-0 scroll-mt-28" aria-labelledby={`${baseId}-heading`}>
      <div className="grid gap-8 lg:grid-cols-[minmax(200px,260px)_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Frequently Asked")}</p>
          <h2
            id={`${baseId}-heading`}
            className="mt-3 font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-3xl"
          >
            {tx("Your questions, answered.")}
          </h2>
        </div>

        <div className="flex min-w-0 flex-col gap-4" role="list">
          {items.map((item, i) => {
            const isOpen = open === i || enable;
            const btnId = `${baseId}-btn-${i}`;
            const panelId = `${baseId}-panel-${i}`;
            return (
              <div
                key={i}
                role="listitem"
                className={
                  "rounded-2xl bg-white px-6 py-5 shadow-[0_8px_24px_rgba(24,7,48,0.04)] transition-[border-color] duration-200 sm:px-8 sm:py-6 " +
                  (isOpen ? "border border-[color:var(--pp-violet)]" : "border border-line")
                }
              >
                {enable ? (
                  <div className="flex items-start justify-between gap-4">
                    <EnableLine
                      value={item.q}
                      onChange={(q) => patch(i, { q })}
                      placeholder={tx("Question")}
                      className="text-base font-medium leading-snug text-[color:var(--pp-primary-900)]"
                    />
                    <button
                      type="button"
                      className="shrink-0 text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
                      onClick={() => onChange?.(items.filter((_, j) => j !== i))}
                    >
                      {tx("Remove")}
                    </button>
                  </div>
                ) : (
                  <button
                    id={btnId}
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span className="text-base font-medium leading-snug text-[color:var(--pp-primary-900)]">
                      {tx(item.q)}
                    </span>
                    <PlusMinus open={isOpen} />
                  </button>
                )}
                <div id={panelId} role="region" aria-labelledby={btnId} hidden={!isOpen}>
                  {isOpen ? (
                    enable ? (
                      <EnableLine
                        multiline
                        rows={3}
                        value={item.a}
                        onChange={(a) => patch(i, { a })}
                        placeholder={tx("Answer")}
                        className="mt-4 text-sm leading-relaxed text-[color:var(--pp-primary-800)] sm:text-base"
                      />
                    ) : (
                      <p className="mt-4 pr-8 text-sm leading-relaxed text-[color:var(--pp-primary-800)] sm:text-base">
                        {tx(item.a)}
                      </p>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
          {enable ? (
            <EnableAddButton onClick={() => onChange?.([...items, { q: "", a: "" }])}>
              + {tx("Add question")}
            </EnableAddButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}
