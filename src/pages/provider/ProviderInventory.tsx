import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Caret } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import {
  adjustInventory,
  effectiveSellPrice,
  formatCad,
  inventoryStatus,
  isExpiringSoon,
  isExpired,
  isLowStock,
  isOnOffer,
  isOutOfStock,
  listInventory,
  updateInventorySku,
  type InventorySku,
  type InventoryStatus,
} from "@/lib/pharmacyOps";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

type Draft = Omit<InventorySku, "id">;
type Tab = "all" | "low" | "expiring" | "out" | "offers";
type UnitFilter = "all" | "tabs" | "caps" | "units";
type SortKey = "name" | "stock" | "expiry";

const STATUS_COPY: Record<InventoryStatus, { label: string; tone: string }> = {
  expired: { label: "Expired", tone: "bg-danger-subtle text-danger" },
  out: { label: "Out of stock", tone: "bg-danger-subtle text-danger" },
  low: { label: "Low stock", tone: "bg-warning-subtle text-warning" },
  ok: { label: "In stock", tone: "bg-success-subtle text-success" },
};

function formatExpiry(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function matchesTab(s: InventorySku, tab: Tab) {
  if (tab === "low") return isLowStock(s);
  if (tab === "expiring") return isExpiringSoon(s);
  if (tab === "out") return isOutOfStock(s);
  if (tab === "offers") return isOnOffer(s);
  return true;
}

export function ProviderInventory() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { workspaceId } = useProvider();
  const orgId = workspaceId;
  const [items, setItems] = useState(() => listInventory(orgId));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Draft | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [unitFilter, setUnitFilter] = useState<UnitFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const menusRef = useRef<HTMLDivElement>(null);

  const refresh = () => setItems(listInventory(orgId));

  useEffect(() => {
    if (!filterOpen && !sortOpen) return;
    const close = (e: MouseEvent) => {
      if (menusRef.current && !menusRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [filterOpen, sortOpen]);

  const counts = useMemo(
    () => ({
      all: items.length,
      low: items.filter(isLowStock).length,
      expiring: items.filter(isExpiringSoon).length,
      out: items.filter(isOutOfStock).length,
      offers: items.filter(isOnOffer).length,
    }),
    [items],
  );

  const rows = useMemo(() => {
    const filtered = items.filter((s) => {
      if (!matchesTab(s, tab)) return false;
      if (unitFilter !== "all" && s.unit.toLowerCase() !== unitFilter) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortKey === "stock") return a.onHand - b.onHand;
      if (sortKey === "expiry") {
        const ae = a.expiry || "9999-12-31";
        const be = b.expiry || "9999-12-31";
        return ae.localeCompare(be);
      }
      return a.name.localeCompare(b.name);
    });
  }, [items, tab, unitFilter, sortKey]);

  const setEditField = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setEdit((d) => (d ? { ...d, [key]: value } : d));

  const startEdit = (s: InventorySku) => {
    setEditingId(s.id);
    const { id: _id, ...rest } = s;
    setEdit(rest);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdit(null);
  };

  const saveEdit = () => {
    if (!editingId || !edit || !edit.name.trim() || !edit.sku.trim()) return;
    updateInventorySku(orgId, editingId, {
      ...edit,
      name: edit.name.trim(),
      sku: edit.sku.trim(),
      unit: edit.unit.trim() || "units",
      batch: edit.batch.trim(),
      offerLabel: edit.offerLabel.trim(),
    });
    cancelEdit();
    refresh();
  };

  const setQty = (s: InventorySku, onHand: number) => {
    adjustInventory(orgId, s.id, onHand);
    refresh();
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "low", label: "Low stock", count: counts.low },
    { id: "expiring", label: "Expiring soon", count: counts.expiring },
    { id: "out", label: "Out of stock", count: counts.out },
    { id: "offers", label: "Offers", count: counts.offers },
  ];

  const unitFilters: { id: UnitFilter; label: string }[] = [
    { id: "all", label: "All units" },
    { id: "tabs", label: "Tablets" },
    { id: "caps", label: "Capsules" },
    { id: "units", label: "Units" },
  ];

  const sorts: { id: SortKey; label: string }[] = [
    { id: "name", label: "Name A–Z" },
    { id: "stock", label: "Stock, low first" },
    { id: "expiry", label: "Expiry, soonest" },
  ];

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Inventory")}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {tx("Inventory")}
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-secondary">
            {tx("Manage stock, expiry, pricing, and reorder levels.")}
          </p>
        </div>
        <Button size="sm" className="!h-11 !px-5 !py-0" onClick={() => nav("/provider/inventory/new")}>
          {tx("+ Add inventory")}
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={tx("Products")}
          value={counts.all}
          icon={<BoxIcon />}
        />
        <StatCard
          label={tx("Low stock")}
          value={counts.low}
          tone="warning"
          icon={<WarnIcon />}
        />
        <StatCard
          label={tx("Expiring soon")}
          value={counts.expiring}
          tone="warning"
          icon={<CalIcon />}
        />
        <StatCard
          label={tx("Out of stock")}
          value={counts.out}
          tone="danger"
          icon={<AlertIcon />}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={tx("Inventory filters")}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 " +
                (tab === t.id
                  ? "bg-[color:var(--pp-primary-950)] text-white"
                  : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
              }
            >
              {tx(t.label)}
              <span className="ml-1.5 text-2xs opacity-80">({t.count})</span>
            </button>
          ))}
        </div>

        <div ref={menusRef} className="flex flex-wrap gap-2">
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              className="!h-10 !px-4 !py-0"
              aria-expanded={filterOpen}
              onClick={() => {
                setFilterOpen((o) => !o);
                setSortOpen(false);
              }}
            >
              {tx("Filter")}
              <Caret open={filterOpen} size={14} />
            </Button>
            {filterOpen ? (
              <MenuPanel>
                {unitFilters.map((f) => (
                  <MenuItem
                    key={f.id}
                    active={unitFilter === f.id}
                    onClick={() => {
                      setUnitFilter(f.id);
                      setFilterOpen(false);
                    }}
                  >
                    {tx(f.label)}
                  </MenuItem>
                ))}
              </MenuPanel>
            ) : null}
          </div>
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              className="!h-10 !px-4 !py-0"
              aria-expanded={sortOpen}
              onClick={() => {
                setSortOpen((o) => !o);
                setFilterOpen(false);
              }}
            >
              {tx("Sort")}
              <Caret open={sortOpen} size={14} />
            </Button>
            {sortOpen ? (
              <MenuPanel>
                {sorts.map((s) => (
                  <MenuItem
                    key={s.id}
                    active={sortKey === s.id}
                    onClick={() => {
                      setSortKey(s.id);
                      setSortOpen(false);
                    }}
                  >
                    {tx(s.label)}
                  </MenuItem>
                ))}
              </MenuPanel>
            ) : null}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-white p-12 text-center text-sm text-ink-tertiary">
          {tx("No products in this view.")}
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
            <table className="w-full min-w-[56rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {["Product", "Stock", "Status", "Expiry", "Pricing", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 first:pl-5 last:pr-5 text-left"
                    >
                      <span className="pp-caps text-ink-tertiary">{tx(h)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const editing = editingId === s.id && edit;
                  return (
                    <tr key={s.id} className="border-b border-line last:border-0 align-top">
                      {editing ? (
                        <td colSpan={6} className="px-5 py-4">
                          <SkuFields draft={edit} onChange={setEditField} />
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button size="sm" className="!h-9 !px-4 !py-0" onClick={saveEdit}>
                              {tx("Save")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="!h-9 !px-4 !py-0"
                              onClick={cancelEdit}
                            >
                              {tx("Cancel")}
                            </Button>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-4 first:pl-5">
                            <ProductMeta sku={s} />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <StockValue sku={s} />
                          </td>
                          <td className="px-4 py-4">
                            <StatusPill status={inventoryStatus(s)} />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <ExpiryValue sku={s} />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <PricingValue sku={s} />
                          </td>
                          <td className="px-4 py-4 last:pr-5">
                            <RowActions
                              sku={s}
                              onQty={(n) => setQty(s, n)}
                              onEdit={() => startEdit(s)}
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="mt-6 space-y-3 md:hidden">
            {rows.map((s) => {
              const editing = editingId === s.id && edit;
              return (
                <li key={s.id} className="rounded-2xl border border-line bg-white px-5 py-4">
                  {editing ? (
                    <>
                      <SkuFields draft={edit} onChange={setEditField} />
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" className="!h-9 !px-4 !py-0" onClick={saveEdit}>
                          {tx("Save")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="!h-9 !px-4 !py-0"
                          onClick={cancelEdit}
                        >
                          {tx("Cancel")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <ProductMeta sku={s} />
                        <StatusPill status={inventoryStatus(s)} />
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-2xs text-ink-tertiary">{tx("Stock")}</dt>
                          <dd className="mt-0.5">
                            <StockValue sku={s} />
                          </dd>
                        </div>
                        <div>
                          <dt className="text-2xs text-ink-tertiary">{tx("Expiry")}</dt>
                          <dd className="mt-0.5">
                            <ExpiryValue sku={s} />
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-2xs text-ink-tertiary">{tx("Pricing")}</dt>
                          <dd className="mt-0.5">
                            <PricingValue sku={s} />
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-4">
                        <RowActions
                          sku={s}
                          onQty={(n) => setQty(s, n)}
                          onEdit={() => startEdit(s)}
                        />
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function SkuFields({
  draft,
  onChange,
}: {
  draft: Draft;
  onChange: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  const { tx } = useI18n();
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block sm:col-span-2">
        <span className={LABEL}>{tx("Name")}</span>
        <input
          className={FIELD}
          value={draft.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder={tx("Medication or product")}
        />
      </label>
      <label className="block">
        <span className={LABEL}>{tx("SKU")}</span>
        <input className={FIELD} value={draft.sku} onChange={(e) => onChange("sku", e.target.value)} />
      </label>
      <label className="block">
        <span className={LABEL}>{tx("Batch")}</span>
        <input className={FIELD} value={draft.batch} onChange={(e) => onChange("batch", e.target.value)} />
      </label>
      <label className="block">
        <span className={LABEL}>{tx("On hand")}</span>
        <input
          type="number"
          min={0}
          className={FIELD}
          value={draft.onHand}
          onChange={(e) => onChange("onHand", Number(e.target.value) || 0)}
        />
      </label>
      <label className="block">
        <span className={LABEL}>{tx("Reorder at")}</span>
        <input
          type="number"
          min={0}
          className={FIELD}
          value={draft.reorderAt}
          onChange={(e) => onChange("reorderAt", Number(e.target.value) || 0)}
        />
      </label>
      <label className="block">
        <span className={LABEL}>{tx("Unit")}</span>
        <input
          className={FIELD}
          value={draft.unit}
          onChange={(e) => onChange("unit", e.target.value)}
          placeholder={tx("tabs, units…")}
        />
      </label>
      <label className="block">
        <span className={LABEL}>{tx("Expiry")}</span>
        <input
          type="date"
          className={FIELD}
          value={draft.expiry}
          onChange={(e) => onChange("expiry", e.target.value)}
        />
      </label>
      <label className="block">
        <span className={LABEL}>{tx("Cost (CAD)")}</span>
        <input
          type="number"
          min={0}
          step="0.01"
          className={FIELD}
          value={draft.costPrice}
          onChange={(e) => onChange("costPrice", Number(e.target.value) || 0)}
        />
      </label>
      <label className="block">
        <span className={LABEL}>{tx("Sell price (CAD)")}</span>
        <input
          type="number"
          min={0}
          step="0.01"
          className={FIELD}
          value={draft.sellPrice}
          onChange={(e) => onChange("sellPrice", Number(e.target.value) || 0)}
        />
      </label>
      <label className="block">
        <span className={LABEL}>{tx("Offer %")}</span>
        <input
          type="number"
          min={0}
          max={100}
          className={FIELD}
          value={draft.offerPercent}
          onChange={(e) => onChange("offerPercent", Number(e.target.value) || 0)}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className={LABEL}>{tx("Offer label")}</span>
        <input
          className={FIELD}
          value={draft.offerLabel}
          onChange={(e) => onChange("offerLabel", e.target.value)}
          placeholder={tx("Optional — e.g. Refill savings")}
        />
      </label>
    </div>
  );
}

function ProductMeta({ sku }: { sku: InventorySku }) {
  const { tx } = useI18n();
  return (
    <div className="min-w-0">
      <p className="font-medium text-[color:var(--pp-primary-950)]">{sku.name}</p>
      <p className="mt-1 text-2xs text-ink-tertiary">
        {tx("SKU")}: {sku.sku}
        {sku.batch ? ` · ${tx("Batch")}: ${sku.batch}` : ""}
      </p>
      {sku.offerPercent > 0 ? (
        <p className="mt-1 text-2xs font-medium text-[color:var(--pp-violet)]">
          {sku.offerPercent}% {tx("off")}
          {sku.offerLabel ? ` · ${sku.offerLabel}` : ""}
        </p>
      ) : null}
    </div>
  );
}

function StockValue({ sku }: { sku: InventorySku }) {
  return (
    <p
      className={
        "font-display text-lg font-medium leading-none tnum " +
        (sku.onHand <= 0 ? "text-danger" : "text-[color:var(--pp-primary-950)]")
      }
    >
      {sku.onHand}{" "}
      <span className="text-sm font-normal text-ink-tertiary">{sku.unit}</span>
    </p>
  );
}

function StatusPill({ status }: { status: InventoryStatus }) {
  const { tx } = useI18n();
  const copy = STATUS_COPY[status];
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-1 text-2xs font-medium uppercase tracking-wide " +
        copy.tone
      }
    >
      {tx(copy.label)}
    </span>
  );
}

function ExpiryValue({ sku }: { sku: InventorySku }) {
  const critical = isExpired(sku) || isExpiringSoon(sku);
  return (
    <p
      className={
        "text-sm " +
        (critical
          ? "font-medium text-danger"
          : "text-[color:var(--pp-primary-950)]")
      }
    >
      {formatExpiry(sku.expiry)}
    </p>
  );
}

function PricingValue({ sku }: { sku: InventorySku }) {
  const { tx } = useI18n();
  const sell = effectiveSellPrice(sku);
  return (
    <div>
      <p className="text-sm text-ink-tertiary">
        {tx("Cost")} {formatCad(sku.costPrice)}
      </p>
      <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
        {tx("Sell")} {formatCad(sell)}
      </p>
    </div>
  );
}

function RowActions({
  sku,
  onQty,
  onEdit,
}: {
  sku: InventorySku;
  onQty: (n: number) => void;
  onEdit: () => void;
}) {
  const { tx } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex h-10 items-center rounded-xl border border-line bg-white">
        <button
          type="button"
          className="flex h-10 w-9 items-center justify-center rounded-l-xl text-ink-secondary transition-colors duration-200 hover:bg-[color:var(--state-hover)]"
          aria-label={tx("Decrease stock")}
          onClick={() => onQty(Math.max(0, sku.onHand - 1))}
        >
          −
        </button>
        <span className="tnum min-w-[1.75rem] text-center text-sm font-medium text-[color:var(--pp-primary-950)]">
          {sku.onHand}
        </span>
        <button
          type="button"
          className="flex h-10 w-9 items-center justify-center rounded-r-xl text-ink-secondary transition-colors duration-200 hover:bg-[color:var(--state-hover)]"
          aria-label={tx("Increase stock")}
          onClick={() => onQty(sku.onHand + 1)}
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={tx("Edit")}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-tertiary transition-colors duration-200 hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
      >
        <PencilIcon />
      </button>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone?: "warning" | "danger";
  icon: ReactNode;
}) {
  const alert = tone && value > 0;
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-4">
      <div className="flex items-start gap-3">
        <span
          className={
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
            (alert && tone === "danger"
              ? "bg-danger-subtle text-danger"
              : alert && tone === "warning"
                ? "bg-warning-subtle text-warning"
                : "bg-[color:var(--pp-primary-100)] text-ink-tertiary")
          }
        >
          {icon}
        </span>
        <div>
          <p
            className={
              "font-display text-3xl font-medium leading-none tnum " +
              (alert && tone === "danger"
                ? "text-danger"
                : alert && tone === "warning"
                  ? "text-warning"
                  : "text-[color:var(--pp-primary-950)]")
            }
          >
            {value}
          </p>
          <p className="mt-1.5 text-sm text-ink-secondary">{label}</p>
        </div>
      </div>
    </div>
  );
}

function MenuPanel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute right-0 z-20 mt-2 min-w-[12.5rem] rounded-2xl border border-line bg-white p-1">
      {children}
    </div>
  );
}

function MenuItem({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full rounded-xl px-3 py-2 text-left text-sm transition-colors duration-200 " +
        (active
          ? "bg-[color:var(--pp-primary-100)] font-medium text-[color:var(--pp-primary-950)]"
          : "text-ink-secondary hover:bg-[color:var(--state-hover)]")
      }
    >
      {children}
    </button>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function BoxIcon() {
  return (
    <Icon>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Icon>
  );
}

function WarnIcon() {
  return (
    <Icon>
      <path d="M10.3 4.2 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

function CalIcon() {
  return (
    <Icon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </Icon>
  );
}

function AlertIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </Icon>
  );
}

function PencilIcon() {
  return (
    <Icon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Icon>
  );
}
