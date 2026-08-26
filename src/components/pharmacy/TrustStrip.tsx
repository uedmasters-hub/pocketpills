import { useI18n } from "@/lib/i18n";

type TrustStat = { title: string; sub: string };

/** Storefront trust strip — ratings + Canadian care proof (live pages). */
const STATS: readonly TrustStat[] = [
  { title: "100% Canadian Care", sub: "Trusted by millions of Canadians" },
  { title: "Over 2 million", sub: "5-star in-app reviews" },
  { title: "4.8 rating", sub: "46K+ App Store reviews" },
  { title: "4.6 rating", sub: "13K+ Google Play Store reviews" },
  { title: "4.7 score", sub: "9K+ Trustpilot reviews" },
];

/** Nepal launch copy — no imported Canada ratings. */
export const NEPAL_TRUST_STATS: readonly TrustStat[] = [
  { title: "Care in Nepal", sub: "Licensed doctors, pharmacists, and pharmacies" },
  { title: "Pharmacist reviewed", sub: "Every Rx checked before it ships" },
  { title: "NMC-registered doctors", sub: "Book by name — no anonymous consults" },
  { title: "DDA pharmacies", sub: "Verified listings across districts" },
  { title: "Nepali and English", sub: "Care in the language you use" },
];

export function TrustStrip({
  className = "",
  stats = STATS,
}: {
  className?: string;
  stats?: readonly TrustStat[];
}) {
  const { tx } = useI18n();
  return (
    <div
      className={
        "overflow-hidden rounded-2xl border border-line bg-white px-4 py-5 sm:px-5 sm:py-6 " +
        className
      }
      aria-label={tx("Trust and ratings")}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-[color:var(--border-default)]">
        {stats.map((s) => (
          <div key={s.sub} className="min-w-0 lg:px-5 first:lg:pl-1 last:lg:pr-1">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(s.title)}</p>
            <p className="mt-0.5 text-2xs leading-snug text-ink-tertiary">{tx(s.sub)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
