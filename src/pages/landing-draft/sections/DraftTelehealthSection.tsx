import { Link } from "react-router-dom";
import { SHELL_X } from "@/components/layout/Grid";
import { bookingSpecialtyHref, landingSpecialtyLabel, orderedLandingSpecialties } from "@/lib/landingSpecialties";
import { useI18n } from "@/lib/i18n";

/** Desktop grid is 5×3. */
const GRID_SLOTS = 15;

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

/**
 * Draft replacement for Buy again + entry tiles.
 * Left: telehealth copy + book CTA. Right: specialty grid → booking hub.
 */
export function DraftTelehealthSection() {
  const { tx } = useI18n();
  const items = orderedLandingSpecialties(GRID_SLOTS);

  return (
    <section className={`${SHELL_X} pb-8 md:pb-10`} aria-labelledby="telehealth-heading">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(16rem,0.92fr)_minmax(0,1.2fr)] lg:gap-14 xl:gap-16">
        <div className="max-w-md lg:pt-2">
          <p className="inline-flex rounded-full bg-[#EDE8F8] px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[color:var(--pp-primary-950)]">
            {tx("Telehealth services")}
          </p>
          <h2
            id="telehealth-heading"
            className="mt-5 font-display text-[clamp(1.75rem,3.1vw,2.5rem)] font-medium leading-[1.12] tracking-tight text-[color:var(--pp-primary-950)]"
          >
            {tx("Your health goals, fully supported.")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-secondary">
            {tx(
              "Select a category to connect with our licensed medical specialists for private consults and fast home delivery.",
            )}
          </p>
          <Link
            to="/appointments"
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[color:var(--pp-primary-950)] px-7 py-3.5 text-base font-medium text-white transition-opacity duration-200 hover:opacity-90 active:opacity-80"
          >
            {tx("Book an appointment")}
          </Link>
        </div>

        <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-7 lg:grid-cols-5">
          {items.map((s) => {
            const label = landingSpecialtyLabel(s);
            return (
              <li key={s.id}>
                <Link
                  to={bookingSpecialtyHref(s.id)}
                  className="group flex flex-col items-center gap-2.5 rounded-xl text-center outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pp-violet)]"
                  aria-label={`${tx("Book an appointment")}: ${tx(label)}`}
                >
                  <img
                    src={s.imageUrl}
                    alt=""
                    loading="lazy"
                    onError={hideOnError}
                    className="h-[4.5rem] w-[4.5rem] object-contain transition-transform duration-200 group-hover:scale-[1.04] sm:h-[5rem] sm:w-[5rem]"
                  />
                  <span className="text-[0.8125rem] font-medium leading-snug text-[color:var(--pp-primary-950)] sm:text-sm">
                    {tx(label)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
