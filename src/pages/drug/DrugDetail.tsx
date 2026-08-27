import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { DetailSection } from "@/components/DetailSection";
import { NEPAL_TRUST_STATS, TrustStrip } from "@/components/pharmacy/TrustStrip";
import { drugs, drugMonograph, drugImg } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useShellColumn } from "@/lib/columnHover";
import { addToMedBasket, listMedBasket, subscribeMedBasket } from "@/lib/medBasketDraft";
import { MedicationListPopover } from "@/pages/drug/MedicationListPopover";

const DISPENSING_FEE = 11.99;
const INDEX = "/drug";

export function DrugDetail() {
  const { tx } = useI18n();
  const { slug } = useParams();
  const mainCol = useShellColumn("main");
  const railCol = useShellColumn("rail");
  const drug = drugs.find((d) => d.slug === slug);

  const [dosage, setDosage] = useState(drug?.dosages[0] ?? "");
  const [qty, setQty] = useState(30);
  const [tab, setTab] = useState(0);
  const [packFailed, setPackFailed] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<string | undefined>();
  const [basketTick, setBasketTick] = useState(0);

  useEffect(() => subscribeMedBasket(() => setBasketTick((n) => n + 1)), []);
  const basketCount = useMemo(() => listMedBasket().length, [basketTick, listOpen]);

  useEffect(() => {
    setPackFailed(false);
  }, [slug]);

  const monograph = useMemo(() => (drug ? drugMonograph() : []), [drug]);
  const similar = useMemo(
    () => (drug ? drugs.filter((d) => d.cls === drug.cls && d.slug !== drug.slug).slice(0, 4) : []),
    [drug],
  );

  if (!drug) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Medication not found")}</p>
        <Link to={INDEX} className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Back to Medications Index")}
        </Link>
      </div>
    );
  }

  const drugCost = Math.round(drug.price * (qty / 30) * 100) / 100;
  const subtotal = drugCost + DISPENSING_FEE;
  const covered = Math.round(subtotal * (drug.coverage / 100) * 100) / 100;
  const total = Math.round((subtotal - covered) * 100) / 100;

  return (
    <div>
      <Link
        to={INDEX}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {tx("Medications Index")}
      </Link>

      {/*
        Store PDP grid:
        - Mobile: title → buy box → facts → info
        - Desktop: left stack | sticky price as third page column (Activity hidden in AppShell)
      */}
      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-10 lg:gap-y-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <header
          className={"flex min-w-0 items-start justify-between gap-4 lg:col-start-1 lg:row-start-1 sm:gap-6 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <div className="min-w-0">
            <h1 className="font-display text-4xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
              {drug.name}
            </h1>
            {drug.generic && drug.generic !== drug.name && (
              <p className="mt-1 text-base text-ink-tertiary">{drug.generic}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                {tx("Free delivery")}
              </span>
              <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                {tx(drug.cls)}
              </span>
              {drug.rx && (
                <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                  {tx("Rx")}
                </span>
              )}
            </div>
          </div>
          {!packFailed && (
            <img
              key={drug.slug}
              src={drugImg(drug.slug)}
              alt=""
              onError={() => setPackFailed(true)}
              className="h-28 w-auto max-w-[10rem] shrink-0 object-contain sm:h-36 sm:max-w-[12rem]"
            />
          )}
        </header>

        <aside
          className={
            "space-y-3 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:sticky lg:top-28 lg:self-start " +
            railCol.className
          }
          onMouseEnter={railCol.onMouseEnter}
        >
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Price lookup")}</p>
                <p className="mt-0.5 text-2xs text-ink-tertiary">{tx("Estimate with typical insurance")}</p>
              </div>
              <span className="shrink-0 rounded-full border border-line bg-white px-2.5 py-1 text-2xs font-medium text-[color:var(--pp-primary-950)]">
                {tx("Free delivery")}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs text-ink-secondary">{tx("Dosage")}</span>
                <select
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-white px-2.5 text-sm text-ink focus:border-primary"
                >
                  {drug.dosages.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-ink-secondary">{tx("Quantity")}</span>
                <select
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-line bg-white px-2.5 text-sm text-ink focus:border-primary"
                >
                  {[30, 60, 90].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <Row k={tx("Drug cost")} v={`$${drugCost.toFixed(2)}`} />
              <Row k={tx("Dispensing fee")} v={`$${DISPENSING_FEE.toFixed(2)}`} />
              <Row k={tx("Delivery")} v={tx("FREE")} tone />
              <Row k={`${tx("Insurance")} (${drug.coverage}%)`} v={`−$${covered.toFixed(2)}`} tone />
              <div className="flex items-end justify-between border-t border-line pt-3">
                <span className="font-semibold text-[color:var(--pp-primary-950)]">{tx("You pay")}</span>
                <span className="font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-2xs leading-relaxed text-ink-tertiary">
              {tx("Estimate. Final price depends on your prescription and plan.")}
            </p>

            <div className="mt-5 space-y-2">
              <Button
                fullWidth
                onClick={() => {
                  addToMedBasket({ slug: drug.slug, dose: dosage, qty });
                  setJustAdded(drug.slug);
                  setListOpen(true);
                }}
              >
                {tx("Add to my list")}
              </Button>
              {basketCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setJustAdded(undefined);
                    setListOpen(true);
                  }}
                  className="w-full text-center text-2xs font-medium text-[color:var(--pp-violet)]"
                >
                  {basketCount} {basketCount === 1 ? tx("medicine") : tx("medicines")} · {tx("Review list")}
                </button>
              ) : (
                <p className="text-center text-2xs leading-relaxed text-ink-tertiary">
                  {drug.rx
                    ? tx("Upload a prescription, add more, or continue to see a doctor.")
                    : tx("Add more if you need to, then continue to pay.")}
                </p>
              )}
            </div>
          </div>

          <p className="px-1 text-center text-2xs leading-relaxed text-ink-tertiary">
            {tx("Licensed Canadian pharmacists review every order before it ships.")}
          </p>
        </aside>

        <dl
          className={
            "grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:col-start-1 lg:row-start-2 " +
            mainCol.className
          }
          onMouseEnter={mainCol.onMouseEnter}
        >
          {[
            [tx("Available form"), drug.forms.map((f) => tx(f)).join(", ")],
            [tx("Dosage"), drug.dosages.join(", ")],
            [tx("Manufacturer"), drug.manufacturer],
          ].map(([k, v]) => (
            <div key={k} className="bg-white p-4">
              <dt className="text-2xs font-semibold uppercase tracking-[0.1em] text-ink-tertiary">{k}</dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--pp-primary-950)]">{v}</dd>
            </div>
          ))}
        </dl>

        <div
          className={"lg:col-start-1 lg:row-start-3 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <TrustStrip stats={NEPAL_TRUST_STATS} />
        </div>

        <section
          className={"min-w-0 lg:col-start-1 lg:row-start-4 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <DetailSection title={tx("Drug information")}>
          <div
            className="pp-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            role="tablist"
            aria-label={tx("Drug information sections")}
          >
            {monograph.map((m, i) => (
              <button
                key={m.section}
                type="button"
                id={`drug-tab-${i}`}
                role="tab"
                aria-selected={tab === i}
                aria-controls={`drug-panel-${i}`}
                tabIndex={tab === i ? 0 : -1}
                onClick={() => setTab(i)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const next =
                    e.key === "ArrowRight"
                      ? (i + 1) % monograph.length
                      : (i - 1 + monograph.length) % monograph.length;
                  setTab(next);
                }}
                className={
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                  (tab === i
                    ? "bg-[color:var(--pp-primary-950)] text-white"
                    : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
                }
              >
                {tx(m.section)}
              </button>
            ))}
          </div>

          <div
            id={`drug-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`drug-tab-${tab}`}
            className="mt-5 rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-6"
          >
            <h3 className="font-display text-md font-medium text-[color:var(--pp-primary-950)]">
              {tx(monograph[tab].section)}
            </h3>
            <p className="mt-2 max-w-[62ch] text-base leading-relaxed text-ink-secondary">
              {tx(monograph[tab].body).split("{name}").join(drug.name)}
            </p>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ink-tertiary">
            <span className="font-semibold text-ink-secondary">{tx("Educational summary — not medical advice.")}</span>{" "}
            {tx("Full monographs are reviewed by our pharmacists and cross-referenced with Health Canada.")}
          </p>
        </DetailSection>
        </section>
      </div>

      {similar.length > 0 && (
        <div id="similar-meds" className="mt-10">
        <DetailSection
          title={tx("Similar medications")}
          lede={`${tx("Others in")} ${tx(drug.cls)}.`}
          meta={
            <Link to={INDEX} className="text-sm font-medium text-[color:var(--pp-violet)] hover:underline">
              {tx("Browse all")}
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((d) => {
              const est = Math.round(d.price * (1 - d.coverage / 100) * 100) / 100;
              return (
                <Link
                  key={d.slug}
                  to={`${INDEX}/${d.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-4 transition-colors hover:bg-[color:var(--state-hover)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[color:var(--pp-primary-950)]">{d.name}</span>
                    {d.generic && d.generic !== d.name && (
                      <span className="mt-0.5 block truncate text-sm text-ink-tertiary">{d.generic}</span>
                    )}
                  </span>
                  <span className="mt-3 flex items-baseline justify-between gap-2 border-t border-line pt-3">
                    <span className="text-2xs text-ink-tertiary">{tx("From")}</span>
                    <span className="font-display text-lg font-medium text-[color:var(--pp-primary-950)] tnum">
                      ${est.toFixed(2)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </DetailSection>
        </div>
      )}

      <MedicationListPopover
        open={listOpen}
        onClose={() => setListOpen(false)}
        justAddedSlug={justAdded}
      />
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-secondary">{k}</span>
      <span className={tone ? "font-medium text-wellness tnum" : "text-ink tnum"}>{v}</span>
    </div>
  );
}
