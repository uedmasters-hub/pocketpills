import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { MapEmbed } from "@/components/MapEmbed";
import { RegionGridSkeleton } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { listDdaDistricts, type DdaDistrict } from "@/lib/ddaApi";
import { useShellColumn } from "@/lib/columnHover";
import { getRegion } from "@/lib/pharmacies";
import {
  FEATURED_DELIVERY_DISTRICTS,
  districtFromSlug,
  pharmacyDirectoryPath,
  savePharmacyDistrict,
} from "@/lib/nepalCities";

const CARD = "rounded-2xl border border-line bg-white";
const NEPAL_MAP =
  "https://www.openstreetmap.org/export/embed.html?bbox=80.0%2C26.3%2C88.2%2C30.5&layer=mapnik";

function formatCount(n: number) {
  return n.toLocaleString("en-US");
}

function featuredPills(districts: DdaDistrict[]): DdaDistrict[] {
  const byName = new Map(districts.map((d) => [d.district.toLowerCase(), d]));
  return FEATURED_DELIVERY_DISTRICTS.map((name) => {
    const hit = byName.get(name.toLowerCase());
    return hit ?? { district: name, count: 0 };
  });
}

function DistrictPills({
  items,
  active,
}: {
  items: DdaDistrict[];
  active?: string;
}) {
  const { tx } = useI18n();
  return (
    <ul className="flex flex-wrap gap-2" aria-label={tx("Delivery regions")}>
      {items.map((d) => {
        const on = active?.toLowerCase() === d.district.toLowerCase();
        return (
          <li key={d.district}>
            <Link
              to={pharmacyDirectoryPath(d.district)}
              aria-current={on ? "page" : undefined}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors " +
                (on
                  ? "bg-[color:var(--pp-primary-950)] text-white"
                  : "bg-[color:var(--primary-200)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
              }
            >
              <span className="font-medium">{tx(d.district)}</span>
              {d.count > 0 && (
                <span className={"text-2xs tnum " + (on ? "text-white/70" : "text-ink-tertiary")}>
                  {formatCount(d.count)}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function NepalMapPanel({ total, districtCount }: { total: number; districtCount: number }) {
  const { tx } = useI18n();
  const railCol = useShellColumn("rail");
  return (
    <aside
      className={
        "hidden w-[20rem] shrink-0 lg:sticky lg:top-28 lg:block lg:self-start xl:w-[22rem] " +
        railCol.className
      }
      onMouseEnter={railCol.onMouseEnter}
    >
      <div className={`${CARD} overflow-hidden`}>
        <MapEmbed title={tx("Nepal coverage map")} src={NEPAL_MAP} className="aspect-[4/3]" />
        <div className="p-5">
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Nationwide")}</p>
          <h2 className="mt-1 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Every DDA district")}
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">
            {tx(
              "Delivery across Nepal. Pick a district to see DDA-registered pharmacies — claimed profiles can fill and transfer.",
            )}
          </p>
          {total > 0 && (
            <p className="mt-3 text-sm font-medium text-[color:var(--pp-primary-950)] tnum">
              {formatCount(total)} {tx("pharmacies")}
              {districtCount > 0 ? ` · ${formatCount(districtCount)} ${tx("districts")}` : ""}
            </p>
          )}
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-[color:var(--pp-primary-100)] p-3.5">
              <p className="font-medium text-[color:var(--pp-primary-950)]">{tx("Pocketpills Nepal")}</p>
              <p className="mt-0.5 text-xs text-ink-secondary">{tx("Kathmandu · DDA registry")}</p>
            </div>
            <div className="rounded-xl bg-[color:var(--pp-primary-100)] p-3.5">
              <p className="font-medium text-[color:var(--pp-primary-950)]">{tx("Department of Drug Administration")}</p>
              <p className="mt-0.5 text-xs text-ink-secondary">{tx("Licensed pharmacy directory")}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Index — pick a DDA district. */
export function PharmaciesIndex() {
  const { tx } = useI18n();
  const mainCol = useShellColumn("main");
  const [districts, setDistricts] = useState<DdaDistrict[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let live = true;
    void listDdaDistricts().then((rows) => {
      if (!live) return;
      setDistricts(rows);
      setBusy(false);
    });
    return () => {
      live = false;
    };
  }, []);

  const pills = useMemo(() => featuredPills(districts), [districts]);
  const cards = districts.length ? districts : pills;
  const total = districts.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div
          className={"min-w-0 flex-1 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <header className="mb-8">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Coverage")}</p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
              {tx("Pharmacies we deliver from")}
            </h1>
            <p className="mt-2 max-w-2xl text-base text-ink-secondary">
              {tx(
                "PocketPills delivers across Nepal. Choose a district to see DDA-registered pharmacies — then claim, fill, or transfer.",
              )}
            </p>
          </header>

          <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Pocketpills delivers to:")}
          </h2>
          {busy && districts.length === 0 ? (
            <div className="mt-4">
              <RegionGridSkeleton label={tx("Loading districts…")} />
            </div>
          ) : (
            <>
          <div className="mt-4">
            <DistrictPills items={pills} />
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((d) => (
              <Link
                key={d.district}
                to={pharmacyDirectoryPath(d.district)}
                className={`${CARD} p-5 transition-colors hover:bg-[color:var(--state-hover)]`}
              >
                <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx(d.district)}</p>
                <p className="mt-1 text-sm text-ink-secondary">
                  {d.count > 0
                    ? `${formatCount(d.count)} ${d.count === 1 ? tx("pharmacy") : tx("pharmacies")}`
                    : tx("DDA-registered pharmacies")}{" "}
                  · {tx("Served by")} {tx("Pocketpills Nepal")}
                </p>
                <p className="mt-3 text-sm font-medium text-[color:var(--pp-violet)]">{tx("View list →")}</p>
              </Link>
            ))}
          </div>
            </>
          )}
        </div>

        <NepalMapPanel total={total} districtCount={districts.length} />
      </div>
    </div>
  );
}

/** Legacy `/pharmacies/regions/:region` — CA slugs and district slugs land on the DDA directory. */
export function PharmaciesByRegion() {
  const { region: regionParam } = useParams();
  const [districts, setDistricts] = useState<string[] | null>(null);

  useEffect(() => {
    let live = true;
    void listDdaDistricts().then((rows) => {
      if (!live) return;
      const names = rows.map((d) => d.district);
      setDistricts(names.length ? names : [...FEATURED_DELIVERY_DISTRICTS]);
    });
    return () => {
      live = false;
    };
  }, []);

  if (getRegion(regionParam)) {
    return <Navigate to="/pharmacies/regions" replace />;
  }

  if (!regionParam) return <Navigate to="/pharmacies/regions" replace />;
  if (!districts) {
    return <RegionGridSkeleton label="Loading district" />;
  }

  const name = districtFromSlug(regionParam, districts);
  if (name) {
    savePharmacyDistrict(name);
    return <Navigate to={pharmacyDirectoryPath(name)} replace />;
  }

  return <Navigate to="/pharmacies/regions" replace />;
}
