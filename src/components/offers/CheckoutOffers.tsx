import { useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  applyOffer,
  applyOfferCode,
  getOffer,
  loadActiveOfferId,
  loadClaimed,
  quoteOffer,
  relatedOffers,
  saveActiveOfferId,
  subscribeOffers,
  type CheckoutContext,
  type Offer,
  type OfferQuote,
} from "@/lib/offers";

export function useOfferQuote(ctx: CheckoutContext): OfferQuote {
  const activeId = useSyncExternalStore(subscribeOffers, loadActiveOfferId, () => null);
  return quoteOffer(activeId ? getOffer(activeId) ?? null : null, ctx);
}

function offersSnapshot() {
  try {
    return `${loadActiveOfferId() ?? ""}|${[...loadClaimed()].sort().join(",")}`;
  } catch {
    return "";
  }
}

export function CheckoutOffers({ context }: { context: CheckoutContext }) {
  const { tx } = useI18n();
  const tick = useSyncExternalStore(subscribeOffers, offersSnapshot, () => "");
  const activeId = tick.split("|")[0] || null;
  const related = useMemo(() => relatedOffers(context, 4), [context, tick]);
  const quote = useMemo(
    () => quoteOffer(activeId ? getOffer(activeId) ?? null : null, context),
    [activeId, context],
  );

  const [code, setCode] = useState("");
  const [codeNote, setCodeNote] = useState<"ok" | "bad" | null>(null);

  const applyCode = () => {
    const hit = applyOfferCode(code);
    if (!hit) {
      setCodeNote("bad");
      return;
    }
    setCodeNote("ok");
    setCode("");
  };

  const apply = (offer: Offer) => {
    applyOffer(offer.id);
    setCodeNote(null);
  };

  return (
    <div className="space-y-3">
      {quote.offer ? (
        <div className="rounded-2xl border border-line bg-[color:var(--pp-primary-100)] px-4 py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
                {tx("Offer applied")}
              </p>
              <p className="mt-0.5 font-medium text-[color:var(--pp-primary-950)]">
                {tx(quote.offer.title)}
                {quote.offer.code ? (
                  <>
                    {" "}
                    · <code className="text-sm">{quote.offer.code}</code>
                  </>
                ) : null}
              </p>
              {quote.credit > 0 ? (
                <p className="mt-1 text-sm font-medium text-[color:var(--pp-green)]">
                  {tx("−{credit} off today").replace("{credit}", `$${quote.credit.toFixed(2)}`)}
                </p>
              ) : (
                <p className="text-sm text-ink-secondary">{tx(quote.offer.savings)}</p>
              )}
              {quote.note ? <p className="mt-1 text-sm text-ink-secondary">{tx(quote.note)}</p> : null}
            </div>
            <button
              type="button"
              className="text-sm font-medium text-ink-tertiary hover:opacity-70"
              onClick={() => saveActiveOfferId(null)}
            >
              {tx("Remove")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Related offers")}</p>
          <Link
            to="/offers"
            className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
          >
            {tx("All offers")}
          </Link>
        </div>
        <p className="mt-1 text-sm text-ink-tertiary">
          {tx("One offer per payment. Insurance still bills first.")}
        </p>

        <div className="mt-3 flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{tx("Promo code")}</span>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeNote(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyCode();
                }
              }}
              placeholder={tx("Enter a code")}
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-ink-tertiary focus:border-primary"
            />
          </label>
          <Button type="button" variant="secondary" className="shrink-0 !rounded-xl" onClick={applyCode}>
            {tx("Apply")}
          </Button>
        </div>
        {codeNote === "bad" ? (
          <p className="mt-2 text-sm text-danger">{tx("That code isn’t on our offers list.")}</p>
        ) : null}
        {codeNote === "ok" ? (
          <p className="mt-2 text-sm text-[color:var(--pp-green)]">{tx("Code applied.")}</p>
        ) : null}

        <ul className="mt-4 divide-y divide-line">
          {related.map((o) => {
            const on = o.id === activeId;
            return (
              <li key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                    {tx(o.badge)}
                    {on ? ` · ${tx("Applied")}` : ""}
                  </p>
                  <p className="truncate text-sm font-medium text-ink">{tx(o.title)}</p>
                  <p className="text-sm text-[color:var(--pp-violet)]">{tx(o.savings)}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={on ? "outline" : "secondary"}
                  onClick={() => (on ? saveActiveOfferId(null) : apply(o))}
                >
                  {on ? tx("Remove") : tx("Apply")}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
