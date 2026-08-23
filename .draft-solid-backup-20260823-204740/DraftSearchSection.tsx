import { SHELL_X } from "@/components/layout/Grid";
import { LandingSearchWidget } from "@/components/landing/LandingSearchWidget";
import { SearchShieldIcon } from "@/components/landing/SearchIcons";
import { useI18n } from "@/lib/i18n";

/**
 * Search headline + pill widget — top half of the merged draft panel.
 * `data-draft-search-end` marks the element the fold maths measures to.
 */
export function DraftSearchSection({
  onOpenChange,
}: {
  onOpenChange?: (open: boolean) => void;
}) {
  const { tx } = useI18n();
  return (
    <section className="draft-search-section" aria-label={tx("Search healthcare services")}>
      <header className={`${SHELL_X} shrink-0 text-center`}>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink-secondary">
          <SearchShieldIcon className="h-4 w-4 text-[color:var(--pp-primary-950)]" />
          {tx("Nepal's complete healthcare platform")}
        </p>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-[clamp(1.625rem,3.8vw,2.375rem)] font-medium leading-[1.15] tracking-tight text-[color:var(--pp-headline)]">
          {tx("Find any healthcare service")}
        </h1>
        <p className="mx-auto mt-3 max-w-[42rem] text-[0.9375rem] leading-relaxed text-ink-secondary [text-wrap:balance] md:text-base">
          {tx(
            "Search verified hospitals, clinics, doctors, nurses, home care providers, ambulances, emergency services, pathology labs, surgeries, outpatient care, and more\u2014all in one trusted platform.",
          )}
        </p>
      </header>
      <div className={`${SHELL_X} shrink-0`} data-draft-search-end>
        <LandingSearchWidget spotlight onOpenChange={onOpenChange} />
      </div>
    </section>
  );
}
