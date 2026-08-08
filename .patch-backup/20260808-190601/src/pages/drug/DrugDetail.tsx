import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { drugs, drugMonograph } from "@/lib/data";

const DISPENSING_FEE = 11.99;

export function DrugDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const drug = drugs.find((d) => d.slug === slug);

  const [dosage, setDosage] = useState(drug?.dosages[0] ?? "");
  const [qty, setQty] = useState(30);
  const [tab, setTab] = useState(0);

  const monograph = useMemo(() => (drug ? drugMonograph(drug.name) : []), [drug]);
  const similar = useMemo(
    () => (drug ? drugs.filter((d) => d.cls === drug.cls && d.slug !== drug.slug).slice(0, 4) : []),
    [drug],
  );

  if (!drug) {
    return (
      <div className="rounded-2xl border border-line bg-surface-2 p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">Medication not found</p>
        <Link to="/drug" className="mt-2 inline-block text-[14px] font-semibold text-[color:var(--pp-violet)] hover:underline">
          Back to Medications Index
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
      <Link to="/drug" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]">
        ← Medications Index
      </Link>

      {/* header */}
      <header className="mt-5">
        <h1 className="font-display text-[clamp(28px,3.2vw,38px)] font-extrabold tracking-tight text-[color:var(--pp-primary-950)]">
          {drug.name}
        </h1>
        {drug.generic && drug.generic !== drug.name && (
          <p className="mt-1 text-[15px] text-ink-tertiary">{drug.generic}</p>
        )}
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-secondary">
          Order your {drug.name} prescription online through PocketPills with free delivery anywhere
          in Canada. {drug.rx ? "Prescription required." : "Available over the counter."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-wellness-subtle px-3 py-1 text-[12px] font-semibold text-wellness">Free delivery</span>
          <span className="rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-[12px] font-medium text-[color:var(--pp-primary-950)]">{drug.cls}</span>
          {drug.rx && <span className="rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-[12px] font-medium text-[color:var(--pp-primary-950)]">Rx</span>}
        </div>
      </header>

      {/* quick facts — inline row, not a floating card */}
      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {[
          ["Available form", drug.forms.join(", ")],
          ["Dosage", drug.dosages.join(", ")],
          ["Manufacturer", drug.manufacturer],
        ].map(([k, v]) => (
          <div key={k} className="bg-surface-2 p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-tertiary">{k}</dt>
            <dd className="mt-1 text-[14px] font-medium text-[color:var(--pp-primary-950)]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        {/* drug information — horizontal tabs so the prose gets full width */}
        <section>
          <h2 className="font-display text-xl font-bold text-[color:var(--pp-primary-950)]">Drug information</h2>

          <div className="pp-scroll -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist">
            {monograph.map((m, i) => (
              <button
                key={m.section}
                role="tab"
                aria-selected={tab === i}
                onClick={() => setTab(i)}
                className={
                  "shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors " +
                  (tab === i
                    ? "bg-[color:var(--pp-primary-950)] text-white"
                    : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
                }
              >
                {m.section}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-surface-2 p-6">
            <h3 className="font-display text-[17px] font-bold text-[color:var(--pp-primary-950)]">{monograph[tab].section}</h3>
            <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-secondary">{monograph[tab].body}</p>
          </div>

          <p className="mt-4 text-[12px] leading-relaxed text-ink-tertiary">
            <span className="font-semibold text-ink-secondary">Educational summary — not medical advice.</span>{" "}
            Full monographs are reviewed by our pharmacists and cross-referenced with Health Canada.
          </p>
        </section>

        {/* price + actions */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface-2 p-5">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">Price lookup</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-ink-secondary">Dosage</span>
                <select value={dosage} onChange={(e) => setDosage(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-surface-2 px-2.5 text-[14px] text-ink focus:border-primary">
                  {drug.dosages.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-ink-secondary">Quantity</span>
                <select value={qty} onChange={(e) => setQty(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-line bg-surface-2 px-2.5 text-[14px] text-ink focus:border-primary">
                  {[30, 60, 90].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13px]">
              <Row k="Drug cost" v={`$${drugCost.toFixed(2)}`} />
              <Row k="Dispensing fee" v={`$${DISPENSING_FEE.toFixed(2)}`} />
              <Row k="Delivery" v="FREE" tone />
              <Row k={`Insurance (${drug.coverage}%)`} v={`−$${covered.toFixed(2)}`} tone />
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="font-semibold text-[color:var(--pp-primary-950)]">Total</span>
                <span className="font-display text-xl font-extrabold text-[color:var(--pp-primary-950)] tnum">${total.toFixed(2)}</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-tertiary">
              Estimate. Final price depends on your prescription and plan.
            </p>
          </div>

          <div className="space-y-2">
            <Button fullWidth onClick={() => nav("/find-care")}>Request via consultation</Button>
            <Button fullWidth variant="secondary" onClick={() => nav("/fill")}>I have a prescription</Button>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="font-display text-xl font-bold text-[color:var(--pp-primary-950)]">Similar medications</h2>
          <p className="text-[13px] text-ink-tertiary">Others in {drug.cls}.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((d) => (
              <Link key={d.slug} to={`/drug/${d.slug}`}
                className="rounded-2xl border border-line bg-surface-2 p-4 font-semibold text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--pp-primary-100)]">
                {d.name}
              </Link>
            ))}
          </div>
        </section>
      )}
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
