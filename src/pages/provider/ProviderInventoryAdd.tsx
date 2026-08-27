import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { useShellColumn } from "@/lib/columnHover";
import {
  addInventorySku,
  formatCad,
  inventoryStatus,
  listInventory,
  receiveInventoryStock,
  type InventorySku,
  type InventoryStatus,
} from "@/lib/pharmacyOps";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] placeholder:text-ink-tertiary outline-none focus:border-[color:var(--pp-primary-950)]";
const SELECT =
  FIELD +
  " appearance-none bg-[length:0.9rem] bg-[right_1rem_center] bg-no-repeat pr-10";
const SELECT_CHEVRON = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234e2a84'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
} as const;
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";
const MONEY =
  FIELD + " pl-8";

const UNITS = [
  { value: "tabs", label: "Tabs" },
  { value: "caps", label: "Caps" },
  { value: "units", label: "Units" },
  { value: "bottles", label: "Bottles" },
  { value: "packs", label: "Packs" },
] as const;

const STATUS_COPY: Record<InventoryStatus, { label: string; tone: string }> = {
  expired: { label: "Expired", tone: "bg-danger-subtle text-danger" },
  out: { label: "Out of stock", tone: "bg-danger-subtle text-danger" },
  low: { label: "Low stock", tone: "bg-warning-subtle text-warning" },
  ok: { label: "In stock", tone: "bg-success-subtle text-success" },
};

type Mode = "new" | "receive";
type Draft = {
  name: string;
  sku: string;
  qty: number;
  reorderAt: number;
  unit: string;
  batch: string;
  expiry: string;
  costPrice: number;
  sellPrice: number;
};

const emptyDraft = (): Draft => ({
  name: "",
  sku: "",
  qty: 0,
  reorderAt: 20,
  unit: "tabs",
  batch: "",
  expiry: "",
  costPrice: 0,
  sellPrice: 0,
});

function skuFromName(name: string) {
  const letters = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
  const num = name.match(/\d+/)?.[0];
  if (!letters) return "";
  return num ? `MED-${letters}-${num.padStart(3, "0")}` : `MED-${letters}`;
}

function formatExpiry(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function RequiredMark() {
  return <span className="text-[color:var(--pp-violet)]"> *</span>;
}

export function ProviderInventoryAdd() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { workspaceId } = useProvider();
  const mainCol = useShellColumn("main");
  const railCol = useShellColumn("rail");
  const orgId = workspaceId;
  const items = useMemo(() => listInventory(orgId), [orgId]);
  const [mode, setMode] = useState<Mode>("new");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [skuTouched, setSkuTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = items.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    if (mode !== "receive") return;
    const s = items.find((i) => i.id === selectedId);
    if (!s) return;
    setDraft({
      name: s.name,
      sku: s.sku,
      qty: 0,
      reorderAt: s.reorderAt,
      unit: s.unit,
      batch: s.batch,
      expiry: s.expiry,
      costPrice: s.costPrice,
      sellPrice: s.sellPrice,
    });
    setSkuTouched(true);
  }, [mode, selectedId, items]);

  const patch = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setError(null);
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === "name" && mode === "new" && !skuTouched) {
        next.sku = skuFromName(String(value));
      }
      return next;
    });
  };

  const existingOnHand = mode === "receive" ? selected?.onHand ?? 0 : 0;
  const previewQty = mode === "receive" ? existingOnHand + draft.qty : draft.qty;
  const previewSku: InventorySku = {
    id: selected?.id ?? "preview",
    name: draft.name.trim() || tx("Product name"),
    sku: draft.sku.trim(),
    onHand: previewQty,
    reorderAt: draft.reorderAt,
    unit: draft.unit,
    batch: draft.batch,
    expiry: draft.expiry,
    costPrice: draft.costPrice,
    sellPrice: draft.sellPrice,
    offerPercent: selected?.offerPercent ?? 0,
    offerLabel: selected?.offerLabel ?? "",
  };
  const status = inventoryStatus(previewSku);
  const margin = useMemo(() => {
    if (draft.sellPrice <= 0) return null;
    return ((draft.sellPrice - draft.costPrice) / draft.sellPrice) * 100;
  }, [draft.costPrice, draft.sellPrice]);

  const nameClash =
    mode === "new" &&
    draft.name.trim() &&
    items.some((s) => s.name.toLowerCase() === draft.name.trim().toLowerCase());

  const unitOptions = useMemo(() => {
    const extra = draft.unit && !UNITS.some((u) => u.value === draft.unit) ? draft.unit : null;
    return extra ? [...UNITS, { value: extra, label: extra }] : [...UNITS];
  }, [draft.unit]);

  const save = () => {
    if (mode === "receive") {
      if (!selected) {
        setError(tx("Choose a product to receive stock for."));
        return;
      }
      if (draft.qty <= 0) {
        setError(tx("Enter a quantity to add."));
        return;
      }
      if (!draft.expiry) {
        setError(tx("Expiry date is required."));
        return;
      }
      receiveInventoryStock(orgId, selected.id, {
        qty: draft.qty,
        reorderAt: draft.reorderAt,
        batch: draft.batch.trim(),
        expiry: draft.expiry,
        unit: draft.unit.trim() || "units",
        costPrice: draft.costPrice,
        sellPrice: draft.sellPrice,
      });
      nav("/provider/inventory");
      return;
    }

    if (!draft.name.trim()) {
      setError(tx("Product name is required."));
      return;
    }
    if (!draft.sku.trim()) {
      setError(tx("SKU is required."));
      return;
    }
    if (items.some((s) => s.sku.toLowerCase() === draft.sku.trim().toLowerCase())) {
      setError(tx("That SKU is already in inventory. Receive stock instead."));
      return;
    }
    if (!draft.expiry) {
      setError(tx("Expiry date is required."));
      return;
    }
    if (draft.sellPrice <= 0) {
      setError(tx("Sell price is required."));
      return;
    }
    addInventorySku(orgId, {
      name: draft.name.trim(),
      sku: draft.sku.trim(),
      onHand: Math.max(0, draft.qty),
      reorderAt: draft.reorderAt,
      unit: draft.unit.trim() || "units",
      batch: draft.batch.trim(),
      expiry: draft.expiry,
      costPrice: draft.costPrice,
      sellPrice: draft.sellPrice,
      offerPercent: 0,
      offerLabel: "",
    });
    nav("/provider/inventory");
  };

  return (
    <div>
      <ProviderBreadcrumb
        items={[
          { label: tx("Inventory"), to: "/provider/inventory" },
          { label: tx("Add inventory") },
        ]}
      />

      {error ? (
        <p className="mb-4 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div
          className={"min-w-0 space-y-4 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <div className="flex gap-5 border-b border-line" role="tablist" aria-label={tx("How to add inventory")}>
            {(
              [
                ["new", "New inventory item"],
                ["receive", "Receive stock"],
              ] as const
            ).map(([id, label]) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    if (id === mode) return;
                    setError(null);
                    if (id === "new") {
                      setMode("new");
                      setSkuTouched(false);
                      setDraft(emptyDraft());
                    } else {
                      setMode("receive");
                      if (!selectedId && items[0]) setSelectedId(items[0].id);
                    }
                  }}
                  className={
                    "-mb-px shrink-0 border-b-2 pb-3 text-sm transition-colors duration-200 " +
                    (active
                      ? "border-[color:var(--pp-primary-950)] font-medium text-[color:var(--pp-primary-950)]"
                      : "border-transparent text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
                  }
                >
                  {tx(label)}
                </button>
              );
            })}
          </div>
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {tx("Product information")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={LABEL}>
                  {tx("Product / medication")}
                  <RequiredMark />
                </span>
                {mode === "receive" ? (
                  items.length === 0 ? (
                    <p className="text-sm text-ink-tertiary">
                      {tx("No products yet — add a new item first.")}
                    </p>
                  ) : (
                    <select
                      className={SELECT}
                      style={SELECT_CHEVRON}
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                    >
                      {items.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  <input
                    className={FIELD}
                    value={draft.name}
                    onChange={(e) => patch("name", e.target.value)}
                    placeholder={tx("e.g. Atorvastatin 20mg")}
                  />
                )}
                {nameClash ? (
                  <p className="mt-1.5 text-2xs text-ink-tertiary">
                    {tx("A product with this name already exists. Use Receive stock to add quantity.")}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <span className={LABEL}>{tx("SKU")}</span>
                <input
                  className={FIELD}
                  value={draft.sku}
                  readOnly={mode === "receive"}
                  onChange={(e) => {
                    setSkuTouched(true);
                    patch("sku", e.target.value);
                  }}
                />
              </label>
              <label className="block">
                <span className={LABEL}>{tx("Unit")}</span>
                <select
                  className={SELECT}
                  style={SELECT_CHEVRON}
                  value={draft.unit}
                  onChange={(e) => patch("unit", e.target.value)}
                >
                  {unitOptions.map((u) => (
                    <option key={u.value} value={u.value}>
                      {tx(u.label)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {tx("Stock details")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>
                  {mode === "receive" ? tx("Quantity to add") : tx("Initial quantity")}
                  <RequiredMark />
                </span>
                <input
                  type="number"
                  min={0}
                  className={FIELD}
                  value={draft.qty}
                  onChange={(e) => patch("qty", Math.max(0, Number(e.target.value) || 0))}
                />
                {mode === "receive" && selected ? (
                  <p className="mt-1.5 text-2xs text-ink-tertiary">
                    {tx("Currently on hand")}: {selected.onHand} {selected.unit}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <span className={LABEL}>{tx("Reorder level")}</span>
                <input
                  type="number"
                  min={0}
                  className={FIELD}
                  value={draft.reorderAt}
                  onChange={(e) => patch("reorderAt", Math.max(0, Number(e.target.value) || 0))}
                />
                <p className="mt-1.5 text-2xs text-ink-tertiary">
                  {tx("Alert when stock falls below this.")}
                </p>
              </label>
              <label className="block">
                <span className={LABEL}>{tx("Batch number")}</span>
                <input
                  className={FIELD}
                  value={draft.batch}
                  onChange={(e) => patch("batch", e.target.value)}
                  placeholder={tx("e.g. B-2023-X9")}
                />
              </label>
              <label className="block">
                <span className={LABEL}>
                  {tx("Expiry date")}
                  <RequiredMark />
                </span>
                <input
                  type="date"
                  className={FIELD}
                  value={draft.expiry}
                  onChange={(e) => patch("expiry", e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {tx("Pricing")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={LABEL}>{tx("Cost (CAD)")}</span>
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-tertiary">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={MONEY}
                    value={draft.costPrice}
                    onChange={(e) => patch("costPrice", Math.max(0, Number(e.target.value) || 0))}
                  />
                </span>
              </label>
              <label className="block">
                <span className={LABEL}>
                  {tx("Sell price (CAD)")}
                  <RequiredMark />
                </span>
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-tertiary">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={MONEY}
                    value={draft.sellPrice}
                    onChange={(e) => patch("sellPrice", Math.max(0, Number(e.target.value) || 0))}
                  />
                </span>
              </label>
              <div>
                <p className={LABEL}>{tx("Margin")}</p>
                <div
                  className={
                    "flex h-11 items-center rounded-xl px-3.5 text-sm font-medium tnum " +
                    (margin == null
                      ? "border border-line bg-white text-ink-tertiary"
                      : margin < 0
                        ? "bg-danger-subtle text-danger"
                        : "bg-success-subtle text-success")
                  }
                >
                  {margin == null ? "—" : `${margin.toFixed(1)}%`}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside
          className={"h-fit lg:sticky lg:top-8 " + railCol.className}
          onMouseEnter={railCol.onMouseEnter}
        >
          <section className="rounded-2xl border border-line bg-white p-5">
            <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("Live preview")}</p>
            <div className="mt-4 border-t border-line pt-4">
              <p className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                {previewSku.name}
              </p>
              <p className="mt-1 text-sm text-ink-tertiary">
                {tx("SKU")}: {draft.sku.trim() || "—"}
              </p>
              <div className="mt-3">
                <StatusPill status={status} />
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <PreviewRow
                label={tx("Stock level")}
                value={`${previewQty} ${draft.unit || tx("units")}`}
              />
              <PreviewRow label={tx("Expiry")} value={formatExpiry(draft.expiry)} />
              <PreviewRow
                label={tx("Retail price")}
                value={draft.sellPrice > 0 ? formatCad(draft.sellPrice) : "—"}
              />
            </dl>
            <div className="mt-5 space-y-1">
              <Button fullWidth onClick={save}>
                {tx("Save & add")}
              </Button>
              <button
                type="button"
                onClick={() => nav("/provider/inventory")}
                className="flex w-full items-center justify-center py-3 text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity duration-200 hover:opacity-70"
              >
                {tx("Cancel")}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-ink-tertiary">{label}</dt>
      <dd className="font-medium text-[color:var(--pp-primary-950)]">{value}</dd>
    </div>
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
