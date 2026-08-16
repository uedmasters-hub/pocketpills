import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/lib/user";
import { useI18n } from "@/lib/i18n";
import {
  OFFERS,
  OFFER_FILTERS,
  getOffer,
  loadActiveOfferId,
  loadClaimed,
  saveActiveOfferId,
  saveClaimed,
  type Offer,
  type OfferKind,
} from "@/lib/offers";

const CARD = "rounded-2xl border border-line bg-white";

type FilterId = "all" | OfferKind;

function KindIcon({ kind }: { kind: OfferKind }) {
  const c = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (kind) {
    case "featured":
      return (
        <svg {...c}>
          <path d="M12 3.5 14.2 9l5.8.5-4.4 3.8 1.4 5.7L12 16.2 7 19l1.4-5.7L4 9.5 9.8 9 12 3.5Z" />
        </svg>
      );
    case "card":
      return (
        <svg {...c}>
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <path d="M3 10.5h18" />
        </svg>
      );
    case "bank":
      return (
        <svg {...c}>
          <path d="M4 10h16v9H4z" />
          <path d="M2.5 10 12 4.5 21.5 10" />
          <path d="M8 14v5M12 14v5M16 14v5" />
        </svg>
      );
    default:
      return (
        <svg {...c}>
          <path d="M12 4v16M7 8.5c0-2 2.2-3.5 5-3.5s5 1.3 5 3.5-2 3-5 3.5-5 1.4-5 3.5 2.2 3.5 5 3.5" />
        </svg>
      );
  }
}

function copyText(text: string) {
  return navigator.clipboard?.writeText(text).catch(() => {
    /* ignore */
  });
}

function OfferCard({
  offer,
  claimed,
  active,
  copied,
  onClaim,
  onActivate,
  onCopy,
}: {
  offer: Offer;
  claimed: boolean;
  active: boolean;
  copied: boolean;
  onClaim: () => void;
  onActivate: () => void;
  onCopy: (code: string) => void;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();

  return (
    <article
      className={
        `${CARD} flex flex-col gap-4 p-5 sm:p-6 ` +
        (active ? "ring-2 ring-[color:var(--pp-primary-950)]" : "")
      }
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]">
          <KindIcon kind={offer.kind} />
        </span>
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[color:var(--pp-primary-200)] px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-primary-950)]">
                {tx(offer.badge)}
              </span>
              {offer.expires && (
                <span className="text-2xs text-ink-tertiary">{tx(offer.expires)}</span>
              )}
            </div>
            <p className="shrink-0 font-display text-xl font-medium leading-none text-[color:var(--pp-violet)] tnum">
              {tx(offer.savings)}
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-lg font-medium leading-snug text-[color:var(--pp-primary-950)]">
              {tx(offer.title)}
            </h3>
            <p className="text-sm leading-relaxed text-ink-secondary">{tx(offer.summary)}</p>
          </div>
        </div>
      </div>

      {offer.code && (
        <div className="flex items-center gap-3 rounded-xl bg-[color:var(--pp-primary-200)] px-3.5 py-2.5">
          <span className="shrink-0 text-xs text-ink-tertiary">{tx("Code")}</span>
          <code className="min-w-0 flex-1 truncate font-mono text-sm font-semibold tracking-wide text-[color:var(--pp-primary-950)]">
            {offer.code}
          </code>
          <button
            type="button"
            onClick={() => onCopy(offer.code!)}
            aria-label={
              copied
                ? `${offer.code} ${tx("copied")}`
                : `${tx("Copy code")} ${offer.code}`
            }
            className={
              "shrink-0 text-sm font-medium transition-opacity hover:opacity-70 " +
              (copied ? "text-[color:var(--pp-green)]" : "text-[color:var(--pp-violet)]")
            }
          >
            {copied ? tx("Copied") : tx("Copy")}
          </button>
        </div>
      )}

      <p className="text-2xs leading-relaxed text-ink-tertiary">{tx(offer.terms)}</p>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant={claimed ? "secondary" : "primary"}
          onClick={onClaim}
        >
          {claimed ? tx("Saved") : tx("Save offer")}
        </Button>
        {claimed && (
          <Button
            type="button"
            size="sm"
            variant={active ? "outline" : "ghost"}
            onClick={onActivate}
            aria-pressed={active}
          >
            {active ? tx("Applied at checkout") : tx("Apply at checkout")}
          </Button>
        )}
        {offer.href && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => nav(offer.href!)}
          >
            {offer.cta ? tx(offer.cta) : tx("View")}
          </Button>
        )}
      </div>
    </article>
  );
}

export function Offers() {
  const { tx } = useI18n();
  const { signedIn } = useUser();
  const nav = useNavigate();
  const [filter, setFilter] = useState<FilterId>("all");
  const [q, setQ] = useState("");
  const [claimed, setClaimed] = useState(() => loadClaimed());
  const [activeId, setActiveId] = useState(() => loadActiveOfferId());
  const [copied, setCopied] = useState("");
  const [partner, setPartner] = useState<string>("any");

  const partners = useMemo(() => {
    const set = new Set<string>();
    for (const o of OFFERS) {
      if (!o.partner) continue;
      if (filter === "card" && o.kind !== "card") continue;
      if (filter === "bank" && o.kind !== "bank") continue;
      if (filter === "featured" || filter === "other") continue;
      set.add(o.partner);
    }
    return ["any", ...[...set].sort()];
  }, [filter]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return OFFERS.filter((o) => {
      if (filter !== "all" && o.kind !== filter) return false;
      if (partner !== "any" && o.partner !== partner) return false;
      if (!t) return true;
      return (
        o.title.toLowerCase().includes(t) ||
        o.summary.toLowerCase().includes(t) ||
        (o.code ?? "").toLowerCase().includes(t) ||
        (o.partner ?? "").toLowerCase().includes(t) ||
        o.badge.toLowerCase().includes(t)
      );
    });
  }, [filter, q, partner]);

  const spotlight = OFFERS.filter((o) => o.spotlight);
  const claimedList = [...claimed]
    .map((id) => getOffer(id))
    .filter((o): o is Offer => !!o);

  const toggleClaim = (id: string) => {
    setClaimed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (activeId === id) {
          setActiveId(null);
          saveActiveOfferId(null);
        }
      } else {
        next.add(id);
      }
      saveClaimed(next);
      return next;
    });
  };

  const activate = (id: string) => {
    setActiveId((cur) => {
      const next = cur === id ? null : id;
      saveActiveOfferId(next);
      return next;
    });
    if (!claimed.has(id)) {
      setClaimed((prev) => {
        const next = new Set(prev);
        next.add(id);
        saveClaimed(next);
        return next;
      });
    }
  };

  const onCopy = (code: string) => {
    void copyText(code).then(() => {
      setCopied(code);
      window.setTimeout(() => setCopied(""), 1600);
    });
  };

  const sectionTitle = (kind: OfferKind) =>
    tx(
      ({
        featured: "Featured savings",
        card: "Credit & debit cards",
        bank: "Bank partners",
        other: "Other discounts",
      })[kind],
    );

  const grouped =
    filter === "all" && !q.trim() && partner === "any"
      ? (["featured", "card", "bank", "other"] as OfferKind[])
          .map((kind) => ({
            kind,
            items: filtered.filter((o) => o.kind === kind),
          }))
          .filter((g) => g.items.length > 0)
      : [{ kind: null as OfferKind | null, items: filtered }];

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Savings")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          {tx("Offers & discounts")}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-ink-secondary">
          {tx(
            "Medication specials, card cash-back, bank partners, and everyday codes — save what applies, apply one at checkout.",
          )}
        </p>
      </header>

      {/* Spotlight strip — not a card grid of marketing fluff; interactive CTAs */}
      <section aria-label={tx("Spotlight offers")} className="mb-10">
        <div className="grid gap-3 md:grid-cols-3">
          {spotlight.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => (o.href ? nav(o.href) : activate(o.id))}
              className={
                "group relative overflow-hidden rounded-2xl border border-line px-5 py-6 text-left transition-colors " +
                "bg-[color:var(--pp-primary-100)] hover:bg-[color:var(--pp-primary-200)]"
              }
            >
              <span className="pp-caps text-[color:var(--pp-violet)]">{tx(o.badge)}</span>
              <span className="mt-2 block font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                {tx(o.title)}
              </span>
              <span className="mt-3 flex items-center gap-2 text-sm font-medium text-[color:var(--pp-violet)]">
                {tx(o.savings)}
                <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {claimedList.length > 0 && (
        <section className={`${CARD} mb-8 p-5 sm:p-6`} aria-label={tx("Your saved offers")}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {tx("Your saved offers")}
            </h2>
            {activeId && (
              <p className="text-sm text-ink-secondary">
                {tx("Applied:")}{" "}
                <span className="font-medium text-[color:var(--pp-primary-950)]">{tx(getOffer(activeId)?.title ?? "")}</span>
              </p>
            )}
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {claimedList.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => activate(o.id)}
                  aria-pressed={activeId === o.id}
                  className={
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
                    (activeId === o.id
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
                  }
                >
                  {tx(o.badge)}
                  {o.code ? ` · ${o.code}` : ""}
                </button>
              </li>
            ))}
          </ul>
          {!signedIn && (
            <p className="mt-3 text-xs text-ink-tertiary">
              <Link to="/login" className="font-medium text-[color:var(--pp-violet)] hover:underline">
                {tx("Sign in")}
              </Link>{" "}
              {tx("to keep saved offers across devices. Codes still work as a guest on this browser.")}
            </p>
          )}
        </section>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label={tx("Filter offers")}>
          {OFFER_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setPartner("any");
              }}
              className={
                "rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                (filter === f.id
                  ? "bg-[color:var(--pp-primary-950)] text-white"
                  : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
              }
            >
              {tx(f.label)}
            </button>
          ))}
        </div>

        <label className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <span className="sr-only">{tx("Search")}</span>
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tx("Search code, bank, card…")}
            className="h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3.5 text-base text-ink placeholder:text-ink-tertiary focus:border-primary"
          />
        </label>
      </div>

      {(filter === "card" || filter === "bank" || filter === "all") && partners.length > 2 && (
        <div className="mb-8">
          <label className="block max-w-xs">
            <span className="mb-1.5 block text-sm font-medium text-ink-secondary">
              {filter === "card"
                ? tx("Card network")
                : filter === "bank"
                  ? tx("Your bank")
                  : tx("Partner")}
            </span>
            <select
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink focus:border-primary"
            >
              {partners.map((p) => (
                <option key={p} value={p}>
                  {p === "any" ? tx("Any partner") : p}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {copied ? `${tx("Copied")} ${copied}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className={`${CARD} px-6 py-14 text-center`}>
          <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("No offers match")}</p>
          <p className="mt-1 text-sm text-ink-tertiary">
            {tx("Try another filter or clear your search.")}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setFilter("all");
              setQ("");
              setPartner("any");
            }}
          >
            {tx("Reset filters")}
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map((g) => (
            <section key={g.kind ?? "results"} aria-label={g.kind ? sectionTitle(g.kind) : tx("Results")}>
              {g.kind && (
                <h2 className="mb-4 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                  {sectionTitle(g.kind)}
                </h2>
              )}
              <div className="grid gap-4 lg:grid-cols-2">
                {g.items.map((o) => (
                  <OfferCard
                    key={o.id}
                    offer={o}
                    claimed={claimed.has(o.id)}
                    active={activeId === o.id}
                    copied={copied === o.code}
                    onClaim={() => toggleClaim(o.id)}
                    onActivate={() => activate(o.id)}
                    onCopy={onCopy}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <aside className={`${CARD} mt-12 bg-[color:var(--pp-primary-100)] p-6 sm:p-8`}>
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("How checkout applies an offer")}
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink-secondary">
          <li>{tx("Save the offers that match your card, bank, or situation.")}</li>
          <li>
            {tx("Tap")}{" "}
            <strong className="font-medium text-[color:var(--pp-primary-950)]">
              {tx("Apply at checkout")}
            </strong>{" "}
            {tx("on one saved offer (only one active at a time).")}
          </li>
          <li>
            {tx(
              "On the payment step, related offers appear for that order. Apply one — insurance still bills first.",
            )}
          </li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" onClick={() => nav(signedIn ? "/fill" : "/get-started")}>
            {signedIn ? tx("Fill a prescription") : tx("Get started")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => nav("/drug")}>
            {tx("Browse medications")}
          </Button>
        </div>
      </aside>
    </div>
  );
}
