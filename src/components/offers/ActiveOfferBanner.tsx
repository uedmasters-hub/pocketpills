import { Link } from "react-router-dom";
import { getActiveOffer, saveActiveOfferId } from "@/lib/offers";
import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("pp-offers-change", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("pp-offers-change", cb);
  };
}

function getSnapshot() {
  return loadActiveOfferIdSafe();
}

function loadActiveOfferIdSafe() {
  try {
    return localStorage.getItem("pp.offers.active");
  } catch {
    return null;
  }
}

/** Notify same-tab listeners when the active offer changes. */
export function notifyOffersChange() {
  window.dispatchEvent(new Event("pp-offers-change"));
}

/** Compact checkout banner when an offer is applied from /offers. */
export function ActiveOfferBanner() {
  const activeId = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const offer = activeId ? getActiveOffer() : null;
  if (!offer) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-[color:var(--pp-primary-100)] px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">Offer applied</p>
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
          Change
        </Link>
        <button
          type="button"
          className="text-sm font-medium text-ink-tertiary transition-opacity hover:opacity-70"
          onClick={() => {
            saveActiveOfferId(null);
            notifyOffersChange();
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
