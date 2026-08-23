import { SHELL_X } from "@/components/layout/Grid";
import { LandingSearchWidget } from "@/components/landing/LandingSearchWidget";
import { SearchShieldIcon } from "@/components/landing/SearchIcons";
import { useI18n } from "@/lib/i18n";

/** Draft landing hero copy + search — replaces Welcome CTA block on /landing/draft. */
export function LandingSearchHero({ compact = false }: { compact?: boolean } = {}) {
  const { tx } = useI18n();
  return (
    <div className={compact ? "landing-draft-search-hero" : undefined}>
      <header className={`${SHELL_X} text-center ${compact ? "shrink-0" : "pt-8 sm:pt-10"}`}>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink-secondary">
          <SearchShieldIcon className="h-4 w-4 text-[color:var(--pp-primary-950)]" />
          {tx("Nepal's complete healthcare platform")}
        </p>
        <h1
          className={
            "mx-auto max-w-3xl font-display font-medium leading-[1.15] tracking-tight text-[color:var(--pp-headline)] " +
            (compact
              ? "mt-6 text-[clamp(1.625rem,3.8vw,2.375rem)]"
              : "mt-5 text-[clamp(2rem,4.5vw,2.875rem)]")
          }
        >
          {tx("Find any healthcare service")}
        </h1>
      </header>

      <div
        className={
          `${SHELL_X} shrink-0 ` +
          (compact ? "pb-0" : "mt-8 pb-10 sm:mt-10 md:pb-12")
        }
      >
        <LandingSearchWidget />
      </div>
    </div>
  );
}
