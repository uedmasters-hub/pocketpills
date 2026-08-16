import { Link } from "react-router-dom";
import { getActiveOffer, saveActiveOfferId, subscribeOffers } from "@/lib/offers";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n";

function getSnapshot() {
  try {
    return localStorage.getItem("pp.offers.active");
  } catch {
    return null;
  }
}

/** Compact checkout banner when an offer is applied from /offers. */
export function ActiveOfferBanner() {
  const { tx } = useI18n();
  const activeId = useSyncExternalStore(subscribeOffers, getSnapshot, () => null);
  const offer = activeId ? getActiveOffer() : null;
  if (!offer) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-[color:var(--pp-primary-100)] px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
          {tx("Offer applied")}
        </p>
        <p className="mt-0.5 font-medium text-[color:var(--pp-primary-950)]">
          {offer.title}
          {offer.code ? (
            <>
              {" "}
              · <code className="text-sm">{offer.code}</code>
            </>
          ) : null}
        </p>
        <p className="text-sm text-ink-secondary">{offer.savings}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/offers"
          className="text-sm font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-70"
        >
          {tx("Change")}
        </Link>
        <button
          type="button"
          className="text-sm font-medium text-ink-tertiary transition-opacity hover:opacity-70"
          onClick={() => {
            saveActiveOfferId(null);
          }}
        >
          {tx("Remove")}
        </button>
      </div>
    </div>
  );
}
