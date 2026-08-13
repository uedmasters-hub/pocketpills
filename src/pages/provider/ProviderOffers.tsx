import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Caret } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import { useProvider } from "@/lib/providerAuth";
import { loadDraftForProvider } from "@/lib/businessProfile";
import {
  clearInventoryOffer,
  isOnOffer,
  listInventory,
  setInventoryOffer,
  type InventorySku,
} from "@/lib/pharmacyOps";
import {
  formatDateRange,
  formatDiscount,
  listBundleTargets,
  listProductTargets,
  listServiceTargets,
  loadOfferings,
  promoIsRedeemable,
  promoRemaining,
  removeBundle,
  removeDeal,
  removePromo,
  saveBundle,
  saveDeal,
  savePromo,
  type DiscountType,
  type OfferTarget,
  type ProviderBundle,
  type ProviderDeal,
  type ProviderPromo,
} from "@/lib/providerOffers";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] placeholder:text-ink-tertiary outline-none focus:border-[color:var(--pp-primary-950)]";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

type Section = "bundles" | "offers" | "promos";
type DealSource = "named" | "inventory";
type ListedDeal = ProviderDeal & { source: DealSource };

const INV_PREFIX = "inv:";

function dealsFromInventory(skus: InventorySku[]): ListedDeal[] {
  return skus.filter(isOnOffer).map((s) => ({
    id: `${INV_PREFIX}${s.id}`,
    title: s.offerLabel || s.name,
    blurb: s.name,
    discountType: "percent" as const,
    discountValue: s.offerPercent,
    startDate: "",
    endDate: "",
    targetIds: [s.id],
    source: "inventory" as const,
  }));
}

function mergeDeals(named: ProviderDeal[], skus: InventorySku[]): ListedDeal[] {
  const covered = new Set(named.flatMap((d) => d.targetIds));
  const extra = dealsFromInventory(skus).filter((d) => !covered.has(d.targetIds[0] ?? ""));
  return [...named.map((d) => ({ ...d, source: "named" as const })), ...extra];
}

export function ProviderOffers() {
  const { tx } = useI18n();
  const { provider, workspaceId } = useProvider();
  const orgId = workspaceId;
  const isPharmacy = provider?.vendorType === "pharmacy";
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState<Record<Section, boolean>>({
    bundles: !isPharmacy,
    offers: Boolean(isPharmacy),
    promos: false,
  });
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setTick((n) => n + 1);
    setError(null);
  };
  void tick;

  const listingServices = provider
    ? loadDraftForProvider(provider)
        .services.filter((s) => s.kind === "service")
        .map((s) => ({ id: s.id, label: s.label }))
    : [];
  const services = listServiceTargets(orgId, listingServices);
  const data = loadOfferings(orgId);
  const bundleTargets = listBundleTargets(orgId);
  const inventory = isPharmacy ? listInventory(orgId) : [];
  const products = listProductTargets(inventory.map((s) => ({ id: s.id, label: s.name })));
  const listedDeals = mergeDeals(data.deals, inventory);

  const toggle = (key: Section) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Offers")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx("Bundles, deals & codes")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("Package services at one price, run time-bound deals, and issue promo codes with use limits.")}
        </p>
      </header>

      {error ? (
        <p className="mb-4 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {services.length === 0 && products.length === 0 ? (
        <p className="mb-6 rounded-2xl border border-line bg-white px-5 py-4 text-sm text-ink-secondary">
          {tx("Add services on your listing first — bundles and codes attach to those.")}{" "}
          <Link to="/provider/listing" className="font-medium text-[color:var(--pp-violet)] hover:opacity-70">
            {tx("Open listing")} →
          </Link>
        </p>
      ) : null}

      <div className="space-y-3">
        <Accordion
          title={tx("Bundles")}
          count={data.bundles.length}
          blurb={tx("Several services, one price.")}
          open={open.bundles}
          onToggle={() => toggle("bundles")}
        >
          <BundlePanel
            orgId={orgId}
            bundles={data.bundles}
            services={services}
            onChange={refresh}
          />
        </Accordion>

        <Accordion
          title={tx("Offers")}
          count={listedDeals.length}
          blurb={
            products.length
              ? tx("Named deals and inventory product offers.")
              : tx("Named deals patients see, with a date window.")
          }
          open={open.offers}
          onToggle={() => toggle("offers")}
        >
          <DealPanel
            orgId={orgId}
            deals={listedDeals}
            services={services}
            bundles={bundleTargets}
            products={products}
            onChange={refresh}
          />
        </Accordion>

        <Accordion
          title={tx("Promo codes")}
          count={data.promos.length}
          blurb={tx("Codes bound to services and bundles, with dates and use limits.")}
          open={open.promos}
          onToggle={() => toggle("promos")}
        >
          <PromoPanel
            orgId={orgId}
            promos={data.promos}
            services={services}
            bundles={bundleTargets}
            onChange={refresh}
            onError={setError}
          />
        </Accordion>
      </div>
    </div>
  );
}

function Accordion({
  title,
  count,
  blurb,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  blurb: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-[color:var(--state-hover)]"
      >
        <div className="min-w-0">
          <p className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {title}
            <span className="ml-2 text-sm font-normal text-ink-tertiary">{count}</span>
          </p>
          <p className="mt-0.5 text-sm text-ink-tertiary">{blurb}</p>
        </div>
        <Caret open={open} className="mt-0.5 text-ink-tertiary" />
      </button>
      {open ? <div className="border-t border-line px-5 py-5">{children}</div> : null}
    </section>
  );
}

function Chip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
        (on
          ? "bg-[color:var(--pp-primary-950)] text-white"
          : "bg-white text-ink-secondary ring-1 ring-line hover:text-[color:var(--pp-primary-950)]")
      }
    >
      {label}
    </button>
  );
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

function TargetPicker({
  label,
  targets,
  selected,
  onChange,
  empty,
}: {
  label: string;
  targets: OfferTarget[];
  selected: string[];
  onChange: (ids: string[]) => void;
  empty: string;
}) {
  const { tx } = useI18n();
  if (targets.length === 0) {
    return (
      <div>
        <p className={LABEL}>{label}</p>
        <p className="text-2xs text-ink-tertiary">{empty}</p>
      </div>
    );
  }
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {targets.map((t) => (
          <Chip
            key={t.id}
            label={t.kind === "bundle" ? `${t.label} · ${tx("Bundle")}` : t.kind === "product" ? `${t.label} · ${tx("Product")}` : t.label}
            on={selected.includes(t.id)}
            onClick={() => onChange(toggleId(selected, t.id))}
          />
        ))}
      </div>
    </div>
  );
}

function BundlePanel({
  orgId,
  bundles,
  services,
  onChange,
}: {
  orgId: string;
  bundles: ProviderBundle[];
  services: OfferTarget[];
  onChange: () => void;
}) {
  const { tx } = useI18n();
  const [name, setName] = useState("");
  const [feeFrom, setFeeFrom] = useState(79);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const add = () => {
    if (!name.trim() || serviceIds.length < 2) return;
    saveBundle(orgId, { name: name.trim(), blurb: "", serviceIds, feeFrom });
    setName("");
    setFeeFrom(79);
    setServiceIds([]);
    onChange();
  };

  return (
    <div>
      <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("New bundle")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_7rem_auto]">
        <label className="block min-w-0">
          <span className={LABEL}>{tx("Bundle name")}</span>
          <input
            className={FIELD}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tx("e.g. Flu season package")}
          />
        </label>
        <label className="block">
          <span className={LABEL}>{tx("Price (CAD)")}</span>
          <input
            type="number"
            min={0}
            className={FIELD}
            value={feeFrom || ""}
            onChange={(e) => setFeeFrom(Number(e.target.value) || 0)}
          />
        </label>
        <div className="flex items-end">
          <Button
            size="sm"
            className="!h-11 !px-5"
            onClick={add}
            disabled={!name.trim() || serviceIds.length < 2}
          >
            {tx("Add bundle")}
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <TargetPicker
          label={tx("Includes (pick at least two)")}
          targets={services}
          selected={serviceIds}
          onChange={setServiceIds}
          empty={tx("Add services on your listing first.")}
        />
      </div>

      {bundles.length === 0 ? (
        <p className="mt-6 text-sm text-ink-tertiary">{tx("No bundles yet.")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {bundles.map((b) => (
            <BundleRow
              key={b.id}
              bundle={b}
              services={services}
              expanded={editId === b.id}
              onToggle={() => setEditId(editId === b.id ? null : b.id)}
              onSave={(next) => {
                saveBundle(orgId, next);
                setEditId(null);
                onChange();
              }}
              onRemove={() => {
                removeBundle(orgId, b.id);
                if (editId === b.id) setEditId(null);
                onChange();
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function BundleRow({
  bundle,
  services,
  expanded,
  onToggle,
  onSave,
  onRemove,
}: {
  bundle: ProviderBundle;
  services: OfferTarget[];
  expanded: boolean;
  onToggle: () => void;
  onSave: (b: ProviderBundle) => void;
  onRemove: () => void;
}) {
  const { tx } = useI18n();
  const [draft, setDraft] = useState(bundle);
  const names = bundle.serviceIds
    .map((id) => services.find((s) => s.id === id)?.label)
    .filter(Boolean);

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => {
          setDraft(bundle);
          onToggle();
        }}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[color:var(--state-hover)]"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
            {bundle.name || tx("Untitled bundle")}
          </p>
          <p className="mt-0.5 truncate text-2xs text-ink-tertiary">
            {names.join(" · ") || tx("No services selected")}
          </p>
        </div>
        <span className="shrink-0 text-sm text-ink-tertiary">{formatFee(bundle.feeFrom)}</span>
      </button>
      {expanded ? (
        <div className="space-y-4 border-t border-line bg-[color:var(--pp-primary-100)]/30 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
            <label className="block min-w-0">
              <span className={LABEL}>{tx("Bundle name")}</span>
              <input
                className={FIELD}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={LABEL}>{tx("Price (CAD)")}</span>
              <input
                type="number"
                min={0}
                className={FIELD}
                value={draft.feeFrom || ""}
                onChange={(e) => setDraft({ ...draft, feeFrom: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
          <TargetPicker
            label={tx("Includes")}
            targets={services}
            selected={draft.serviceIds}
            onChange={(serviceIds) => setDraft({ ...draft, serviceIds })}
            empty={tx("Add services on your listing first.")}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="!h-10 !px-4" onClick={() => onSave(draft)}>
              {tx("Save")}
            </Button>
            <button
              type="button"
              onClick={onRemove}
              className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
            >
              {tx("Remove")}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function DealPanel({
  orgId,
  deals,
  services,
  bundles,
  products,
  onChange,
}: {
  orgId: string;
  deals: ListedDeal[];
  services: OfferTarget[];
  bundles: OfferTarget[];
  products: OfferTarget[];
  onChange: () => void;
}) {
  const { tx } = useI18n();
  const targets = useMemo(
    () => [...products, ...services, ...bundles],
    [products, services, bundles],
  );
  const productIds = useMemo(() => new Set(products.map((p) => p.id)), [products]);
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const syncProducts = (ids: string[], percent: number, label: string) => {
    for (const id of ids) {
      if (productIds.has(id)) setInventoryOffer(orgId, id, percent, label);
    }
  };

  const add = () => {
    if (!title.trim()) return;
    const selectedProducts = targetIds.filter((id) => productIds.has(id));
    const selectedOthers = targetIds.filter((id) => !productIds.has(id));
    if (discountType === "percent" && selectedProducts.length) {
      syncProducts(selectedProducts, discountValue, title.trim());
    }
    const keepNamed =
      selectedOthers.length > 0 || Boolean(startDate || endDate) || discountType === "amount";
    if (keepNamed || selectedProducts.length === 0) {
      saveDeal(orgId, {
        title: title.trim(),
        blurb: "",
        discountType,
        discountValue,
        startDate,
        endDate,
        targetIds: selectedOthers.length ? selectedOthers : targetIds,
      });
    }
    setTitle("");
    setDiscountValue(10);
    setStartDate("");
    setEndDate("");
    setTargetIds([]);
    onChange();
  };

  return (
    <div>
      <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("New offer")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block min-w-0 sm:col-span-2">
          <span className={LABEL}>{tx("Offer name")}</span>
          <input
            className={FIELD}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={tx("e.g. Spring refill savings")}
          />
        </label>
        <label className="block">
          <span className={LABEL}>{tx("Discount")}</span>
          <div className="flex gap-2">
            <select
              className={FIELD + " w-[7.5rem] shrink-0"}
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
            >
              <option value="percent">{tx("% off")}</option>
              <option value="amount">{tx("$ off")}</option>
            </select>
            <input
              type="number"
              min={0}
              className={FIELD}
              value={discountValue || ""}
              onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
            />
          </div>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block min-w-0">
            <span className={LABEL}>{tx("Starts")}</span>
            <input
              type="date"
              className={FIELD}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="block min-w-0">
            <span className={LABEL}>{tx("Ends")}</span>
            <input
              type="date"
              className={FIELD}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="mt-4">
        <TargetPicker
          label={
            products.length
              ? tx("Applies to products, services & bundles")
              : tx("Applies to services & bundles")
          }
          targets={targets}
          selected={targetIds}
          onChange={setTargetIds}
          empty={
            products.length
              ? tx("Add inventory products or listing services first.")
              : tx("Add services or a bundle first.")
          }
        />
      </div>
      <div className="mt-4">
        <Button size="sm" className="!h-11 !px-5" onClick={add} disabled={!title.trim()}>
          {tx("Add offer")}
        </Button>
      </div>

      {deals.length === 0 ? (
        <p className="mt-6 text-sm text-ink-tertiary">{tx("No offers yet.")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {deals.map((d) => (
            <DealRow
              key={d.id}
              deal={d}
              targets={targets}
              expanded={editId === d.id}
              onToggle={() => setEditId(editId === d.id ? null : d.id)}
              onSave={(next) => {
                if (d.source === "inventory") {
                  const skuId = next.targetIds[0] ?? d.targetIds[0];
                  if (skuId) {
                    setInventoryOffer(
                      orgId,
                      skuId,
                      next.discountType === "percent" ? next.discountValue : d.discountValue,
                      next.title.trim(),
                    );
                  }
                } else {
                  const selectedProducts = next.targetIds.filter((id) => productIds.has(id));
                  if (next.discountType === "percent") {
                    syncProducts(selectedProducts, next.discountValue, next.title.trim());
                    const removed = d.targetIds.filter(
                      (id) => productIds.has(id) && !next.targetIds.includes(id),
                    );
                    for (const id of removed) clearInventoryOffer(orgId, id);
                  }
                  saveDeal(orgId, next);
                }
                setEditId(null);
                onChange();
              }}
              onRemove={() => {
                if (d.source === "inventory") {
                  const skuId = d.targetIds[0];
                  if (skuId) clearInventoryOffer(orgId, skuId);
                } else {
                  for (const id of d.targetIds) {
                    if (productIds.has(id)) clearInventoryOffer(orgId, id);
                  }
                  removeDeal(orgId, d.id);
                }
                if (editId === d.id) setEditId(null);
                onChange();
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function DealRow({
  deal,
  targets,
  expanded,
  onToggle,
  onSave,
  onRemove,
}: {
  deal: ListedDeal;
  targets: OfferTarget[];
  expanded: boolean;
  onToggle: () => void;
  onSave: (d: ListedDeal) => void;
  onRemove: () => void;
}) {
  const { tx } = useI18n();
  const [draft, setDraft] = useState(deal);
  const range = formatDateRange(deal.startDate, deal.endDate);
  const names = deal.targetIds
    .map((id) => targets.find((t) => t.id === id)?.label)
    .filter(Boolean);
  const fromInventory = deal.source === "inventory";
  const productName = deal.blurb || names[0] || "";

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => {
          setDraft(deal);
          onToggle();
        }}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[color:var(--state-hover)]"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
            {deal.title || tx("Untitled offer")}
          </p>
          <p className="mt-0.5 truncate text-2xs text-ink-tertiary">
            {[
              formatDiscount(deal.discountType, deal.discountValue),
              fromInventory ? productName : range,
              fromInventory ? tx("Inventory") : names.join(" · "),
            ]
              .filter(Boolean)
              .join(" · ") || tx("No dates or targets")}
          </p>
        </div>
      </button>
      {expanded ? (
        <div className="space-y-4 border-t border-line bg-[color:var(--pp-primary-100)]/30 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block min-w-0 sm:col-span-2">
              <span className={LABEL}>{tx("Offer name")}</span>
              <input
                className={FIELD}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={LABEL}>{tx("Discount")}</span>
              <div className="flex gap-2">
                {fromInventory ? (
                  <span className="flex h-11 items-center rounded-xl border border-line bg-white px-3.5 text-sm text-ink-secondary">
                    {tx("% off")}
                  </span>
                ) : (
                  <select
                    className={FIELD + " w-[7.5rem] shrink-0"}
                    value={draft.discountType}
                    onChange={(e) =>
                      setDraft({ ...draft, discountType: e.target.value as DiscountType })
                    }
                  >
                    <option value="percent">{tx("% off")}</option>
                    <option value="amount">{tx("$ off")}</option>
                  </select>
                )}
                <input
                  type="number"
                  min={0}
                  className={FIELD}
                  value={draft.discountValue || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, discountValue: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </label>
            {fromInventory ? (
              <p className="self-end text-sm text-ink-secondary">
                {tx("Product")}: {productName}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <label className="block min-w-0">
                  <span className={LABEL}>{tx("Starts")}</span>
                  <input
                    type="date"
                    className={FIELD}
                    value={draft.startDate}
                    onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                  />
                </label>
                <label className="block min-w-0">
                  <span className={LABEL}>{tx("Ends")}</span>
                  <input
                    type="date"
                    className={FIELD}
                    value={draft.endDate}
                    onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                  />
                </label>
              </div>
            )}
          </div>
          {fromInventory ? null : (
            <TargetPicker
              label={tx("Applies to")}
              targets={targets}
              selected={draft.targetIds}
              onChange={(targetIds) => setDraft({ ...draft, targetIds })}
              empty={tx("Add services, a bundle, or inventory products first.")}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="!h-10 !px-4" onClick={() => onSave(draft)}>
              {tx("Save")}
            </Button>
            <button
              type="button"
              onClick={onRemove}
              className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
            >
              {tx("Remove")}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function PromoPanel({
  orgId,
  promos,
  services,
  bundles,
  onChange,
  onError,
}: {
  orgId: string;
  promos: ProviderPromo[];
  services: OfferTarget[];
  bundles: OfferTarget[];
  onChange: () => void;
  onError: (msg: string | null) => void;
}) {
  const { tx } = useI18n();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxUses, setMaxUses] = useState(0);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [bundleIds, setBundleIds] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const add = () => {
    if (!code.trim()) return;
    try {
      savePromo(orgId, {
        code: code.trim(),
        label: label.trim(),
        serviceIds,
        bundleIds,
        startDate,
        endDate,
        maxUses,
        discountType,
        discountValue,
      });
      setCode("");
      setLabel("");
      setDiscountValue(10);
      setStartDate("");
      setEndDate("");
      setMaxUses(0);
      setServiceIds([]);
      setBundleIds([]);
      onError(null);
      onChange();
    } catch (err) {
      onError(err instanceof Error ? err.message : tx("Could not save code."));
    }
  };

  return (
    <div>
      <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("New promo code")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block min-w-0">
          <span className={LABEL}>{tx("Code")}</span>
          <input
            className={FIELD + " uppercase"}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={tx("e.g. SAVE20")}
          />
        </label>
        <label className="block min-w-0">
          <span className={LABEL}>{tx("Internal label")}</span>
          <input
            className={FIELD}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={tx("Optional")}
          />
        </label>
        <label className="block">
          <span className={LABEL}>{tx("Discount")}</span>
          <div className="flex gap-2">
            <select
              className={FIELD + " w-[7.5rem] shrink-0"}
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
            >
              <option value="percent">{tx("% off")}</option>
              <option value="amount">{tx("$ off")}</option>
            </select>
            <input
              type="number"
              min={0}
              className={FIELD}
              value={discountValue || ""}
              onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
            />
          </div>
        </label>
        <label className="block">
          <span className={LABEL}>{tx("Max uses (0 = unlimited)")}</span>
          <input
            type="number"
            min={0}
            className={FIELD}
            value={maxUses || ""}
            onChange={(e) => setMaxUses(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </label>
        <label className="block min-w-0">
          <span className={LABEL}>{tx("Starts")}</span>
          <input
            type="date"
            className={FIELD}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="block min-w-0">
          <span className={LABEL}>{tx("Ends")}</span>
          <input
            type="date"
            className={FIELD}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-4 space-y-4">
        <TargetPicker
          label={tx("Works on services")}
          targets={services}
          selected={serviceIds}
          onChange={setServiceIds}
          empty={tx("Add services on your listing first.")}
        />
        <TargetPicker
          label={tx("Works on bundles")}
          targets={bundles}
          selected={bundleIds}
          onChange={setBundleIds}
          empty={tx("Add a bundle above first.")}
        />
      </div>
      <div className="mt-4">
        <Button size="sm" className="!h-11 !px-5" onClick={add} disabled={!code.trim()}>
          {tx("Add code")}
        </Button>
      </div>

      {promos.length === 0 ? (
        <p className="mt-6 text-sm text-ink-tertiary">{tx("No promo codes yet.")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {promos.map((p) => (
            <PromoRow
              key={p.id}
              promo={p}
              services={services}
              bundles={bundles}
              expanded={editId === p.id}
              onToggle={() => setEditId(editId === p.id ? null : p.id)}
              onSave={(next) => {
                try {
                  savePromo(orgId, next);
                  setEditId(null);
                  onError(null);
                  onChange();
                } catch (err) {
                  onError(err instanceof Error ? err.message : tx("Could not save code."));
                }
              }}
              onRemove={() => {
                removePromo(orgId, p.id);
                if (editId === p.id) setEditId(null);
                onChange();
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PromoRow({
  promo,
  services,
  bundles,
  expanded,
  onToggle,
  onSave,
  onRemove,
}: {
  promo: ProviderPromo;
  services: OfferTarget[];
  bundles: OfferTarget[];
  expanded: boolean;
  onToggle: () => void;
  onSave: (p: ProviderPromo) => void;
  onRemove: () => void;
}) {
  const { tx } = useI18n();
  const [draft, setDraft] = useState(promo);
  const live = promoIsRedeemable(promo);
  const range = formatDateRange(promo.startDate, promo.endDate);
  const svcNames = promo.serviceIds
    .map((id) => services.find((s) => s.id === id)?.label)
    .filter(Boolean);
  const bunNames = promo.bundleIds
    .map((id) => bundles.find((s) => s.id === id)?.label)
    .filter(Boolean);

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => {
          setDraft(promo);
          onToggle();
        }}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[color:var(--state-hover)]"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
            {promo.code}
            {promo.label ? (
              <span className="ml-2 font-normal text-ink-tertiary">{promo.label}</span>
            ) : null}
          </p>
          <p className="mt-0.5 truncate text-2xs text-ink-tertiary">
            {[
              formatDiscount(promo.discountType, promo.discountValue),
              promoRemaining(promo),
              range,
              [...svcNames, ...bunNames].join(" · "),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span
          className={
            "shrink-0 rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wide " +
            (live
              ? "bg-[color:var(--pp-green)]/15 text-[color:var(--pp-green)]"
              : "bg-[color:var(--pp-primary-100)] text-ink-tertiary")
          }
        >
          {live ? tx("Active") : tx("Inactive")}
        </span>
      </button>
      {expanded ? (
        <div className="space-y-4 border-t border-line bg-[color:var(--pp-primary-100)]/30 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block min-w-0">
              <span className={LABEL}>{tx("Code")}</span>
              <input
                className={FIELD + " uppercase"}
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              />
            </label>
            <label className="block min-w-0">
              <span className={LABEL}>{tx("Internal label")}</span>
              <input
                className={FIELD}
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={LABEL}>{tx("Discount")}</span>
              <div className="flex gap-2">
                <select
                  className={FIELD + " w-[7.5rem] shrink-0"}
                  value={draft.discountType}
                  onChange={(e) =>
                    setDraft({ ...draft, discountType: e.target.value as DiscountType })
                  }
                >
                  <option value="percent">{tx("% off")}</option>
                  <option value="amount">{tx("$ off")}</option>
                </select>
                <input
                  type="number"
                  min={0}
                  className={FIELD}
                  value={draft.discountValue || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, discountValue: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </label>
            <label className="block">
              <span className={LABEL}>{tx("Max uses (0 = unlimited)")}</span>
              <input
                type="number"
                min={0}
                className={FIELD}
                value={draft.maxUses || ""}
                onChange={(e) => setDraft({ ...draft, maxUses: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block min-w-0">
              <span className={LABEL}>{tx("Starts")}</span>
              <input
                type="date"
                className={FIELD}
                value={draft.startDate}
                onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
              />
            </label>
            <label className="block min-w-0">
              <span className={LABEL}>{tx("Ends")}</span>
              <input
                type="date"
                className={FIELD}
                value={draft.endDate}
                onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
              />
            </label>
          </div>
          <TargetPicker
            label={tx("Works on services")}
            targets={services}
            selected={draft.serviceIds}
            onChange={(serviceIds) => setDraft({ ...draft, serviceIds })}
            empty={tx("Add services on your listing first.")}
          />
          <TargetPicker
            label={tx("Works on bundles")}
            targets={bundles}
            selected={draft.bundleIds}
            onChange={(bundleIds) => setDraft({ ...draft, bundleIds })}
            empty={tx("Add a bundle first.")}
          />
          <p className="text-2xs text-ink-tertiary">{promoRemaining(draft)}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="!h-10 !px-4" onClick={() => onSave(draft)}>
              {tx("Save")}
            </Button>
            <button
              type="button"
              onClick={onRemove}
              className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
            >
              {tx("Remove")}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
