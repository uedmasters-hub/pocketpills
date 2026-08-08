import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, Badge } from "@/components/ui";
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
      <Card className="p-10 text-center">
        <p className="text-lg font-semibold text-ink">Medication not found</p>
        <Link to="/drug" className="mt-2 inline-block font-semibold text-primary hover:underline">Back to Medications Index</Link>
      </Card>
    );
  }

  const drugCost = Math.round(drug.price * (qty / 30) * 100) / 100;
  const subtotal = drugCost + DISPENSING_FEE;
  const covered = Math.round(subtotal * (drug.coverage / 100) * 100) / 100;
  const total = Math.round((subtotal - covered) * 100) / 100;

  return (
    <div>
      <Link to="/drug" className="text-sm font-semibold text-ink-tertiary hover:text-ink">← Medications Index</Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-subtle text-3xl">💊</span>
            <div>
              <h1 className="text-3xl font-extrabold text-ink">{drug.name}</h1>
              {drug.generic && <p className="text-ink-tertiary">{drug.generic}</p>}
            </div>
          </div>
          <p className="mt-4 text-ink-secondary">
            Order your {drug.name} prescription online through PocketPills and get free delivery to your
            door, anywhere in Canada. {drug.rx ? "Prescription required." : "Available over the counter."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="wellness">Free delivery</Badge>
            <Badge tone="neutral">{drug.cls}</Badge>
            {drug.rx && <Badge tone="primary">Rx</Badge>}
          </div>
        </div>

        {/* Quick facts */}
        <Card className="w-full shrink-0 p-5 md:w-72">
          {[
            ["Available form", drug.forms.join(", ")],
            ["Dosage", drug.dosages.join(", ")],
            ["Manufacturer", drug.manufacturer],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-line py-2.5 last:border-0">
              <p className="text-xs text-ink-tertiary">{k}</p>
              <p className="text-sm font-medium text-ink">{v}</p>
            </div>
          ))}
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="mt-6 border-info/30 bg-info-subtle p-4">
        <p className="text-sm text-ink-secondary">
          <span className="font-semibold text-ink">Educational summary — not medical advice.</span> Full
          monographs are reviewed by our pharmacists and cross-referenced with Health Canada. Sign in for
          complete details, or ask our care team anytime.
        </p>
      </Card>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Drug information (tabbed) */}
        <div>
          <h2 className="text-xl font-bold text-ink">Drug information</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-[180px_1fr]">
            <nav className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible" aria-label="Drug information sections">
              {monograph.map((m, i) => (
                <button
                  key={m.section}
                  onClick={() => setTab(i)}
                  className={
                    "shrink-0 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors " +
                    (tab === i ? "bg-primary-subtle text-primary" : "text-ink-secondary hover:bg-surface-2")
                  }
                  aria-current={tab === i ? "true" : undefined}
                >
                  {m.section}
                </button>
              ))}
            </nav>
            <Card className="p-5">
              <h3 className="font-display text-lg font-bold text-ink">{monograph[tab].section}</h3>
              <p className="mt-2 leading-relaxed text-ink-secondary">{monograph[tab].body}</p>
            </Card>
          </div>
        </div>

        {/* Price lookup + why */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Card className="p-5">
            <p className="font-semibold text-ink">Price lookup</p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-secondary">Dosage</span>
                <select value={dosage} onChange={(e) => setDosage(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-ink focus:border-primary">
                  {drug.dosages.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-secondary">Quantity</span>
                <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-ink focus:border-primary">
                  {[30, 60, 90].map((n) => <option key={n} value={n}>{n} doses</option>)}
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <Row k="Drug cost" v={`$${drugCost.toFixed(2)}`} />
              <Row k="Dispensing fee" v={`$${DISPENSING_FEE.toFixed(2)}`} />
              <Row k="Delivery" v="FREE" tone="wellness" />
              <Row k={`Insurance (${drug.coverage}%)`} v={`−$${covered.toFixed(2)}`} tone="wellness" />
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="font-semibold text-ink">Total (CAD)</span>
                <span className="font-display text-xl font-extrabold text-ink tnum">${total.toFixed(2)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink-tertiary">Estimate. Final price depends on your prescription and plan. On average ~20% cheaper than other pharmacies.</p>
          </Card>

          <Card className="p-5">
            <p className="font-semibold text-ink">Get this medication</p>
            <p className="mt-1 text-sm text-ink-tertiary">A valid prescription is required.</p>
            <div className="mt-3 space-y-2">
              <Button fullWidth onClick={() => nav("/find-care")}>Request via consultation</Button>
              <Button fullWidth variant="secondary" onClick={() => nav("/fill")}>I have a prescription</Button>
              <Button fullWidth variant="ghost" onClick={() => nav("/transfer")}>Transfer from another pharmacy</Button>
            </div>
          </Card>
        </aside>
      </div>

      {/* Why PocketPills */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink">Why PocketPills</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { icon: "⏰", t: "Get your meds on time", d: "Delivered to you at no added cost, with reminders." },
            { icon: "💬", t: "Personalized support", d: "Call, text, or email—real humans, ready to help." },
            { icon: "🚚", t: "Free delivery to your door", d: "Discreet, with real-time tracking updates." },
          ].map((v) => (
            <Card key={v.t} className="p-5">
              <span className="text-2xl">{v.icon}</span>
              <p className="mt-2 font-semibold text-ink">{v.t}</p>
              <p className="mt-1 text-sm text-ink-tertiary">{v.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Similar medications */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-ink">Similar medications</h2>
          <p className="text-sm text-ink-tertiary">Others in {drug.cls}.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((d) => (
              <Link key={d.slug} to={`/drug/${d.slug}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 hover:border-strong">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-subtle">💊</span>
                <span className="min-w-0"><span className="block truncate font-semibold text-ink">{d.name}</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "wellness" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-secondary">{k}</span>
      <span className={tone === "wellness" ? "font-medium text-wellness tnum" : "text-ink tnum"}>{v}</span>
    </div>
  );
}
