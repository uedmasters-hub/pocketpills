import { useId } from "react";
import type { ReviewSummary } from "@/lib/reviewsApi";
import { DIRECTORY_CHIP } from "@/components/DirectoryDetailLayout";

const STAR_PATH = "M12 3.6 14.6 9l6 .9-4.3 4.2 1 5.9L12 17.3 6.7 20l1-5.9L3.4 9.9 9.4 9 12 3.6Z";
const GOLD = "#E8B931";
const GOLD_EMPTY = "#EDE6C8";
const BRAND_EMPTY = "#E6E1EF";

export function RatingStars({
  value,
  size = "md",
  interactive = false,
  onChange,
  label,
  tone = "gold",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (n: number) => void;
  label?: string;
  tone?: "gold" | "brand";
}) {
  const uid = useId();
  const px = size === "lg" ? 22 : size === "sm" ? 14 : 16;
  const rounded = Math.round(value * 2) / 2;
  const fillColor = tone === "gold" ? GOLD : "var(--pp-violet)";
  const emptyColor = tone === "gold" ? GOLD_EMPTY : BRAND_EMPTY;
  return (
    <span className="inline-flex items-center gap-0.5" role={interactive ? "radiogroup" : "img"} aria-label={label || `${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = rounded >= n ? 1 : rounded >= n - 0.5 ? 0.5 : 0;
        const gid = `${uid}-${n}`;
        const star = (
          <svg width={px} height={px} viewBox="0 0 24 24" aria-hidden className="shrink-0">
            <defs>
              <linearGradient id={gid}>
                <stop offset={`${fill * 100}%`} stopColor={fillColor} />
                <stop offset={`${fill * 100}%`} stopColor={emptyColor} />
              </linearGradient>
            </defs>
            <path d={STAR_PATH} fill={`url(#${gid})`} />
          </svg>
        );
        if (!interactive) return <span key={n}>{star}</span>;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className="rounded-sm p-0.5 hover:scale-105"
            onClick={() => onChange?.(n)}
          >
            {star}
          </button>
        );
      })}
    </span>
  );
}

export function RatingChip({
  summary,
  variant = "card",
}: {
  summary?: ReviewSummary | null;
  variant?: "card" | "badge";
}) {
  if (!summary || summary.count < 1) return null;
  if (variant === "badge") {
    return <ReviewCountChip average={summary.average} count={summary.count} />;
  }
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${summary.average.toFixed(1)} out of 5`}>
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <path d={STAR_PATH} fill="var(--pp-violet)" />
      </svg>
      <span className="text-xs font-semibold leading-none text-[color:var(--pp-primary-950)] tnum">
        {summary.average.toFixed(1)}
      </span>
      <span className="text-xs font-normal leading-none text-ink-tertiary">/ 5</span>
    </span>
  );
}

/** Hero-row rating pill — same white bordered chip as registry / next. */
export function ReviewCountChip({ average, count }: { average: number; count: number }) {
  const label = `${average.toFixed(1)} • ${count} ${count === 1 ? "review" : "reviews"}`;
  return (
    <span
      className={DIRECTORY_CHIP + " gap-1.5"}
      aria-label={`${average.toFixed(1)} out of 5 from ${count} ${count === 1 ? "review" : "reviews"}`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <path d={STAR_PATH} fill="var(--pp-violet)" />
      </svg>
      {label}
    </span>
  );
}
