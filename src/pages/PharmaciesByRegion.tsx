import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { MapEmbed } from "@/components/MapEmbed";
import { useUser } from "@/lib/user";
import { useI18n } from "@/lib/i18n";
import {
  REGIONS,
  getPharmacy,
  getRegion,
  pharmaciesInRegion,
  saveSelectedPharmacy,
  type AreaPharmacy,
  type Region,
} from "@/lib/pharmacies";

const CARD = "rounded-2xl border border-line bg-white";

function RegionPills({ active }: { active?: string }) {
  const { tx } = useI18n();
  return (
    <ul className="flex flex-wrap gap-2" aria-label={tx("Delivery regions")}>
      {REGIONS.map((r) => {
        const on = active?.toUpperCase() === r.code;
        return (
          <li key={r.code}>
            <Link
              to={`/pharmacies/${r.slug}`}
              aria-current={on ? "page" : undefined}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors " +
                (on
                  ? "bg-[color:var(--pp-primary-950)] text-white"
                  : "bg-[color:var(--primary-200)] text-[color:var(--pp-primary-950)] hover:bg-[color:var(--pp-primary-200)]")
              }
            >
              <span className="font-medium">{tx(r.name)}</span>
              <span className={"text-2xs " + (on ? "text-white/70" : "text-ink-tertiary")}>{r.code}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function PharmacyRow({
  p,
  selected,
  onSelect,
}: {
  p: AreaPharmacy;
  selected: boolean;
  onSelect: () => void;
}) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={
        `${CARD} flex w-full items-start gap-4 p-4 text-left transition-colors sm:p-5 ` +
        (selected
          ? "ring-2 ring-[color:var(--pp-primary-950)]"
          : "hover:bg-[color:var(--state-hover)]")
      }
    >
      <span
        className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
        aria-hidden
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M4 10h16v9H4z" />
          <path d="M2.5 10 12 4.5 21.5 10" />
          <path d="M8 14v5M12 14v5M16 14v5" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-[color:var(--pp-primary-950)]">{p.name}</span>
        <span className="mt-0.5 block text-sm text-ink-secondary">
          {p.address}, {p.city}, {p.province}
        </span>
        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-ink-tertiary">
          <span>{p.distance}</span>
          <span>{p.hours}</span>
          {p.sameDayHub && (
            <span className="font-medium text-[color:var(--pp-violet)]">{tx("Same-day hub nearby")}</span>
          )}
        </span>
      </span>
      <span className="shrink-0 text-sm font-medium text-[color:var(--pp-violet)]">
        {selected ? tx("Selected") : tx("Select")}
      </span>
    </button>
  );
}

function DetailPanel({
  region,
  pharmacy,
}: {
  region: Region;
  pharmacy: AreaPharmacy;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { signedIn } = useUser();
  const mapSrc =
    `https://www.openstreetmap.org/export/embed.html?bbox=${pharmacy.lng - 0.035}%2C${pharmacy.lat - 0.02}%2C${pharmacy.lng + 0.035}%2C${pharmacy.lat + 0.02}&layer=mapnik&marker=${pharmacy.lat}%2C${pharmacy.lng}`;

  const startTransfer = () => {
    saveSelectedPharmacy(pharmacy);
    nav(signedIn ? `/transfer?pharmacy=${encodeURIComponent(pharmacy.id)}` : "/get-started");
  };

  return (
    <aside className="hidden w-[20rem] shrink-0 lg:sticky lg:top-28 lg:block lg:self-start xl:w-[22rem]">
      <div className={`${CARD} overflow-hidden`}>
        <MapEmbed title={`${tx("Map near")} ${pharmacy.name}`} src={mapSrc} className="aspect-[4/3]" />
        <div className="p-5">
          <p className="pp-caps text-[color:var(--pp-violet)]">
            {pharmacy.city}, {pharmacy.province}
          </p>
          <h2 className="mt-1 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {pharmacy.name}
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">
            {pharmacy.address}, {pharmacy.city}, {pharmacy.province}
          </p>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-2xs text-ink-tertiary">{tx("Phone")}</dt>
              <dd className="mt-0.5 font-medium text-[color:var(--pp-primary-950)]">
                <a href={`tel:${pharmacy.phone.replace(/\D/g, "")}`} className="hover:underline">
                  {pharmacy.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-2xs text-ink-tertiary">{tx("Hours")}</dt>
              <dd className="mt-0.5 font-medium text-[color:var(--pp-primary-950)]">{pharmacy.hours}</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-xl bg-[color:var(--pp-primary-100)] p-4">
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Filled by")}</p>
            <p className="mt-1 font-medium text-[color:var(--pp-primary-950)]">{region.hub.name}</p>
            <p className="mt-0.5 text-sm text-ink-secondary">{region.hub.address}</p>
            <p className="mt-2 text-xs text-ink-tertiary">
              {tx("Licensed")} {region.hub.license} · {region.hub.college}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Button type="button" fullWidth onClick={startTransfer}>
              {tx("Transfer from this pharmacy")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => nav(`/delivery-check?province=${region.slug}`)}
            >
              {tx("Check delivery in")} {tx(region.name)}
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => nav(signedIn ? "/fill" : "/get-started")}
            >
              {tx("Fill a prescription instead")}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Mobile-only map + actions (desktop uses the sticky third column). */
function MobileDetail({
  region,
  pharmacy,
}: {
  region: Region;
  pharmacy: AreaPharmacy;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { signedIn } = useUser();
  const mapSrc =
    `https://www.openstreetmap.org/export/embed.html?bbox=${pharmacy.lng - 0.035}%2C${pharmacy.lat - 0.02}%2C${pharmacy.lng + 0.035}%2C${pharmacy.lat + 0.02}&layer=mapnik&marker=${pharmacy.lat}%2C${pharmacy.lng}`;

  return (
    <div className={`${CARD} overflow-hidden lg:hidden`}>
      <MapEmbed title={`${tx("Map near")} ${pharmacy.name}`} src={mapSrc} className="aspect-[16/10]" />
      <div className="space-y-3 p-5">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{pharmacy.name}</p>
        <p className="text-sm text-ink-secondary">
          {pharmacy.address}, {pharmacy.city}
        </p>
        <Button
          type="button"
          fullWidth
          size="sm"
          onClick={() => {
            saveSelectedPharmacy(pharmacy);
            nav(signedIn ? `/transfer?pharmacy=${encodeURIComponent(pharmacy.id)}` : "/get-started");
          }}
        >
          {tx("Transfer from this pharmacy")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          size="sm"
          onClick={() => nav(`/delivery-check?province=${region.slug}`)}
        >
          {tx("Check delivery")}
        </Button>
      </div>
    </div>
  );
}

function CanadaMapPanel() {
  const { tx } = useI18n();
  return (
    <aside className="hidden w-[20rem] shrink-0 lg:sticky lg:top-28 lg:block lg:self-start xl:w-[22rem]">
      <div className={`${CARD} overflow-hidden`}>
        <MapEmbed
          title={tx("Canada coverage map")}
          src="https://www.openstreetmap.org/export/embed.html?bbox=-141%2C41.5%2C-52%2C70&layer=mapnik"
          className="aspect-[4/3]"
        />
        <div className="p-5">
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Nationwide")}</p>
          <h2 className="mt-1 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Every province & territory")}
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">
            {tx(
              "Free standard delivery coast to coast. Pick a region to see local pharmacies we can transfer from.",
            )}
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-[color:var(--pp-primary-100)] p-3.5">
              <p className="font-medium text-[color:var(--pp-primary-950)]">{tx("Pocketpills East")}</p>
              <p className="mt-0.5 text-xs text-ink-secondary">Mississauga, ON · #307234</p>
            </div>
            <div className="rounded-xl bg-[color:var(--pp-primary-100)] p-3.5">
              <p className="font-medium text-[color:var(--pp-primary-950)]">{tx("Pocketpills West")}</p>
              <p className="mt-0.5 text-xs text-ink-secondary">Burnaby, BC · #30291</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Index — pick a province (also destination when footer links without code). */
export function PharmaciesIndex() {
  const { tx } = useI18n();
  return (
    <div>
      {/*
        lg+: map as sticky third column (nav + content + map).
        Activity rail is hidden on /pharmacies so the map owns that slot.
      */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <header className="mb-8">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Coverage")}</p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
              {tx("Pharmacies we deliver from")}
            </h1>
            <p className="mt-2 max-w-2xl text-base text-ink-secondary">
              {tx(
                "PocketPills ships free to every province and territory. Choose your area to see community pharmacies we can transfer from — then start a transfer or check delivery.",
              )}
            </p>
          </header>

          <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Pocketpills delivers to:")}
          </h2>
          <div className="mt-4">
            <RegionPills />
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {REGIONS.map((r) => {
              const count = pharmaciesInRegion(r.code).length;
              return (
                <Link
                  key={r.code}
                  to={`/pharmacies/${r.slug}`}
                  className={`${CARD} p-5 transition-colors hover:bg-[color:var(--state-hover)]`}
                >
                  <p className="font-semibold text-[color:var(--pp-primary-950)]">
                    {tx(r.name)}{" "}
                    <span className="text-sm font-medium text-ink-tertiary">{r.code}</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-secondary">
                    {count} {count === 1 ? tx("pharmacy") : tx("pharmacies")} · {tx("Served by")}{" "}
                    {r.hub.name}
                  </p>
                  <p className="mt-3 text-sm font-medium text-[color:var(--pp-violet)]">{tx("View list →")}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <CanadaMapPanel />
      </div>
    </div>
  );
}

/** Province / territory pharmacy list + select → transfer flow. */
export function PharmaciesByRegion() {
  const { tx } = useI18n();
  const { region: regionParam } = useParams();
  const [params] = useSearchParams();
  const region = getRegion(regionParam);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("pharmacy"));

  useEffect(() => {
    setSelectedId(params.get("pharmacy"));
    setQ("");
  }, [regionParam, params]);

  const list = useMemo(() => {
    if (!region) return [];
    const all = pharmaciesInRegion(region.code);
    const t = q.trim().toLowerCase();
    if (!t) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.city.toLowerCase().includes(t) ||
        p.address.toLowerCase().includes(t),
    );
  }, [region, q]);

  const selected = selectedId ? getPharmacy(selectedId) : list[0] ?? null;

  useEffect(() => {
    if (!selectedId && list[0]) setSelectedId(list[0].id);
  }, [list, selectedId]);

  if (!region) return <Navigate to="/pharmacies" replace />;

  return (
    <div>
      <Link
        to="/pharmacies"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-70"
      >
        <span aria-hidden>←</span> {tx("All regions")}
      </Link>

      {/*
        lg+: map + details as sticky third column (nav + list + map).
        Activity is hidden on /pharmacies so this column owns that slot.
      */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <header className="mb-6">
            <p className="pp-caps text-[color:var(--pp-violet)]">
              {tx("Coverage")} · {region.code}
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
              {tx("Pharmacies in")} {tx(region.name)}
            </h1>
            <p className="mt-2 max-w-2xl text-base text-ink-secondary">
              {tx("Select a pharmacy to transfer from. Orders for")} {tx(region.name)}{" "}
              {tx("are filled by")}{" "}
              <span className="font-medium text-[color:var(--pp-primary-950)]">{region.hub.name}</span>{" "}
              {tx("and delivered free to your door.")}
            </p>
          </header>

          <div className="mb-6">
            <RegionPills active={region.code} />
          </div>

          <label className="relative mb-6 block max-w-md">
            <span className="sr-only">
              {tx("Search pharmacies in")} {tx(region.name)}
            </span>
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
              placeholder={tx("Search by name, city, or street…")}
              className="h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3.5 text-base text-ink placeholder:text-ink-tertiary focus:border-primary"
            />
          </label>

          <p className="mb-3 text-sm text-ink-tertiary tnum">
            {list.length} {list.length === 1 ? tx("pharmacy") : tx("pharmacies")}
          </p>

          {list.length === 0 ? (
            <div className={`${CARD} px-6 py-12 text-center`}>
              <p className="font-semibold text-[color:var(--pp-primary-950)]">
                {tx("No matches in")} {tx(region.name)}
              </p>
              <p className="mt-1 text-sm text-ink-tertiary">
                {tx("Try another city name, or clear the search.")}
              </p>
              <Button type="button" size="sm" variant="secondary" className="mt-4" onClick={() => setQ("")}>
                {tx("Clear search")}
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {list.map((p) => (
                <li key={p.id}>
                  <PharmacyRow
                    p={p}
                    selected={selected?.id === p.id}
                    onSelect={() => setSelectedId(p.id)}
                  />
                </li>
              ))}
            </ul>
          )}

          {selected && selected.province === region.code && (
            <div className="mt-6">
              <MobileDetail region={region} pharmacy={selected} />
            </div>
          )}
        </div>

        {selected && selected.province === region.code && (
          <DetailPanel region={region} pharmacy={selected} />
        )}
      </div>
    </div>
  );
}
