import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  basketNeedsConsult,
  basketTotals,
  clearDraftRxUpload,
  confirmBasketForConsult,
  getDraftRxUpload,
  lineCost,
  listMedBasket,
  removeFromMedBasket,
  subscribeMedBasket,
  updateMedBasketItem,
  type BasketItem,
} from "@/lib/medBasketDraft";
import { applyPrescriptionFile } from "@/lib/medBasketScan";

const INDEX = "/drug/draft";

export function MedicationListPopover({
  open,
  onClose,
  justAddedSlug,
}: {
  open: boolean;
  onClose: () => void;
  justAddedSlug?: string;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const loc = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);
  const [tick, setTick] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct] = useState(0);
  const [scanLabel, setScanLabel] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => subscribeMedBasket(() => setTick((n) => n + 1)), []);
  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);
  useEffect(() => {
    if (open) return;
    setScanning(false);
    setScanError(null);
    setScanPct(0);
    setScanLabel("");
  }, [open]);

  const items = useMemo(() => listMedBasket(), [tick, open]);
  const rx = useMemo(() => getDraftRxUpload(), [tick, open]);
  const added = justAddedSlug
    ? items.find((row) => row.slug === justAddedSlug) ?? items[items.length - 1]
    : undefined;
  const needsConsult = basketNeedsConsult(items);
  const matched = items.filter((row) => Boolean(row.prescriptionFile));
  const totals = basketTotals(items);

  const continueNext = () => {
    if (!items.length || scanning) return;
    confirmBasketForConsult();
    onClose();
    nav(needsConsult ? `${INDEX}/consult` : `${INDEX}/order`);
  };

  const addMore = () => {
    if (scanning) return;
    onClose();
    if (loc.pathname !== INDEX && loc.pathname !== `${INDEX}/`) nav(INDEX);
  };

  const runScan = async (file: File) => {
    setScanError(null);
    setScanning(true);
    setScanPct(6);
    setScanLabel(tx("Reading your prescription"));
    const result = await applyPrescriptionFile(
      file,
      (label, pct) => {
        if (cancelled.current) return;
        setScanLabel(tx(label));
        setScanPct(pct);
      },
      () => cancelled.current,
    );
    if (!cancelled.current) {
      setScanError(result.error ? tx(result.error) : null);
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const title = rx?.found.length
    ? tx("On this prescription")
    : rx
      ? tx("Prescription medicines unavailable")
      : added
        ? tx("{name} is on your list").replace("{name}", added.name)
        : tx("Your medicines");

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className={"grid w-full basis-full gap-2 " + (rx ? "grid-cols-1" : "grid-cols-2")}>
          {rx ? null : (
            <Button
              variant="outline"
              size="sm"
              fullWidth
              disabled={scanning}
              className="!border-line"
              onClick={() => fileRef.current?.click()}
            >
              {tx("Upload prescription")}
            </Button>
          )}
          <Button size="sm" fullWidth disabled={scanning || !items.length} onClick={continueNext}>
            {tx("Continue")}
          </Button>
        </div>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void runScan(file);
        }}
      />

      {items.length === 0 && !rx ? (
        <div>
          <p>
            {tx("Upload your prescription to match these medicines and scan it to add any others automatically.")}
          </p>
          <button
            type="button"
            onClick={addMore}
            className="mt-4 text-sm font-medium text-[color:var(--pp-violet)]"
          >
            + {tx("Add more")}
          </button>
        </div>
      ) : (
        <div>
          {rx ? (
            <div className="rounded-xl border border-line bg-[color:var(--pp-primary-100)] px-3 py-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[color:var(--pp-primary-950)]">{rx.fileName}</p>
                  <p className="mt-0.5 text-2xs leading-relaxed text-ink-tertiary">
                    {tx("Remove this first to add another prescription.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearDraftRxUpload();
                    setScanError(null);
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
                  aria-label={tx("Remove prescription")}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <p>
              {tx("Upload your prescription to match these medicines and scan it to add any others automatically.")}
            </p>
          )}

          {scanning ? (
            <div className="mt-4 rounded-xl border border-line bg-[color:var(--pp-primary-100)] px-3 py-3">
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{scanLabel}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[color:var(--pp-violet)] transition-[width] duration-300"
                  style={{ width: `${Math.max(6, scanPct)}%` }}
                />
              </div>
            </div>
          ) : null}

          {rx && !scanning ? (
            rx.found.length ? (
              <div className="mt-4">
                <p className="text-sm text-ink-secondary">{tx("Medicines read from your prescription.")}</p>
                <ul className="mt-2 divide-y divide-line">
                  {rx.found.map((line) => (
                    <li key={`${line.slug ?? line.name}-${line.strength}`} className="py-3">
                      <p className="font-semibold text-[color:var(--pp-primary-950)]">{line.name}</p>
                      <p className="mt-0.5 text-2xs text-ink-tertiary">
                        {[line.strength, line.directions].filter(Boolean).join(" • ") || tx("As directed")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-line px-3 py-3">
                <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("Unavailable")}</p>
                <p className="mt-1 text-sm text-ink-tertiary">
                  {scanError ??
                    (rx.ocrAvailable === false
                      ? tx("Prescription reading isn’t available right now. Try another photo, or continue to see a doctor.")
                      : tx("Prescription medicines unavailable. We couldn’t read names on this photo."))}
                </p>
              </div>
            )
          ) : !scanning ? (
            <>
              {matched.length ? (
                <p className="mt-3 text-2xs text-wellness">
                  {matched.length} {matched.length === 1 ? tx("medicine matched") : tx("medicines matched")}
                </p>
              ) : null}

              <p className="mt-4 text-2xs font-medium text-ink-tertiary">{tx("Your list")}</p>
              <ul className="mt-1 divide-y divide-line">
                {items.map((row) => (
                  <li key={`${row.slug}-${row.dose}`}>
                    <PopoverRow
                      item={row}
                      onQty={(qty) => updateMedBasketItem(row.slug, row.dose, { qty })}
                      onRemove={() => removeFromMedBasket(row.slug, row.dose)}
                    />
                  </li>
                ))}
              </ul>

              <div className="mt-1 flex items-baseline justify-between border-t border-line py-3">
                <span className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Total")}</span>
                <span className="font-display text-xl font-medium text-[color:var(--pp-primary-950)] tnum">
                  ${totals.drugCost.toFixed(2)}
                </span>
              </div>
            </>
          ) : null}

          <button
            type="button"
            disabled={scanning}
            onClick={addMore}
            className="mt-2 text-sm font-medium text-[color:var(--pp-violet)] disabled:opacity-45"
          >
            + {tx("Add more")}
          </button>
        </div>
      )}
    </Modal>
  );
}

function PopoverRow({
  item,
  onQty,
  onRemove,
}: {
  item: BasketItem;
  onQty: (qty: number) => void;
  onRemove: () => void;
}) {
  const { tx } = useI18n();
  const cost = lineCost(item);

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{item.name}</p>
        <p className="mt-0.5 text-2xs text-ink-tertiary">
          {item.dose} • {tx("Qty")} {item.qty} • ${cost.toFixed(2)}
          {item.prescriptionFile ? ` · ${tx("matched")}` : item.rx ? ` · ${tx("needs Rx")}` : ""}
        </p>
      </div>
      <select
        value={item.qty}
        onChange={(e) => onQty(Number(e.target.value))}
        className="h-8 shrink-0 rounded-lg border border-line bg-white px-2 text-2xs text-[color:var(--pp-primary-950)]"
        aria-label={tx("Quantity")}
      >
        {[30, 60, 90].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-8 w-8 shrink-0 place-items-center text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
        aria-label={tx("Remove")}
      >
        ✕
      </button>
    </div>
  );
}
