import type { ReactNode } from "react";

/** Shared detail-page card: title inside the box, divider, then body. */
export function DetailSection({
  title,
  lede,
  meta,
  children,
  flush,
  className = "",
  id,
  onTitleChange,
}: {
  title: string;
  lede?: string;
  meta?: ReactNode;
  children?: ReactNode;
  flush?: boolean;
  className?: string;
  id?: string;
  onTitleChange?: (title: string) => void;
}) {
  return (
    <section
      id={id}
      className={"scroll-mt-28 overflow-hidden rounded-2xl border border-line bg-white " + className}
    >
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          {onTitleChange ? (
            <input
              className="w-full bg-transparent font-display text-lg font-medium text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Section title"
              aria-label="Section title"
            />
          ) : (
            <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">{title}</h2>
          )}
          {lede ? <p className="mt-1 text-sm text-ink-tertiary">{lede}</p> : null}
        </div>
        {meta}
      </div>
      {children != null ? (
        <div className={flush ? "border-t border-line" : "border-t border-line px-5 py-4"}>{children}</div>
      ) : null}
    </section>
  );
}

export function DetailMeta({ children }: { children: ReactNode }) {
  return (
    <p className="shrink-0 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary tnum">{children}</p>
  );
}
