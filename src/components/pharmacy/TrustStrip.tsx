/** Storefront trust strip — ratings + Canadian care proof. */
const STATS = [
  { title: "100% Canadian Care", sub: "Trusted by millions of Canadians" },
  { title: "Over 2 million", sub: "5-star in-app reviews" },
  { title: "4.8 rating", sub: "46K+ App Store reviews" },
  { title: "4.6 rating", sub: "13K+ Google Play Store reviews" },
  { title: "4.7 score", sub: "9K+ Trustpilot reviews" },
] as const;

export function TrustStrip({ className = "" }: { className?: string }) {
  return (
    <div
      className={
        "overflow-hidden rounded-2xl border border-line bg-white px-4 py-5 sm:px-5 sm:py-6 " +
        className
      }
      aria-label="Trust and ratings"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-[color:var(--border-default)]">
        {STATS.map((s) => (
          <div key={s.sub} className="min-w-0 lg:px-5 first:lg:pl-1 last:lg:pr-1">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{s.title}</p>
            <p className="mt-0.5 text-2xs leading-snug text-ink-tertiary">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
