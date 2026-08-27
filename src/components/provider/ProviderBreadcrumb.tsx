/**
 * Compact provider page trail — replaces caps + large title + blurb headers.
 */
import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

export type ProviderCrumb = {
  label: string;
  to?: string;
};

export function ProviderBreadcrumb({
  items,
  className = "mb-6",
  end,
}: {
  items: ProviderCrumb[];
  className?: string;
  /** Optional trailing actions (e.g. Add button) aligned with the trail. */
  end?: ReactNode;
}) {
  const { tx } = useI18n();
  if (items.length === 0) return null;

  const trail = (
    <nav
      className="flex flex-wrap items-center gap-1.5 text-sm text-ink-tertiary"
      aria-label={tx("Breadcrumb")}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 ? (
              <span aria-hidden className="text-ink-tertiary">
                ›
              </span>
            ) : null}
            {item.to && !last ? (
              <Link
                to={item.to}
                className="font-medium text-[color:var(--pp-violet)] hover:opacity-70"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-[color:var(--pp-primary-950)]">{item.label}</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );

  if (!end) {
    return <div className={className}>{trail}</div>;
  }

  return (
    <div className={"flex flex-wrap items-center justify-between gap-3 " + className}>
      {trail}
      {end}
    </div>
  );
}
