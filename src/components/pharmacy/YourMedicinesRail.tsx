import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  requestMedListPopover,
  subscribeMedBasket,
  updateMedBasketItem,
} from "@/lib/medBasketDraft";
import { applyPrescriptionFile } from "@/lib/medBasketScan";

const INDEX = "/drug/draft";

/** Draft shop only — list is shown in Activity instead of live orders. */
export function useDraftShopBasket() {
  const { pathname } = useLocation();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeMedBasket(() => setTick((n) => n + 1)), []);
  const items = useMemo(() => listMedBasket(), [tick]);
  if (pathname !== INDEX || items.length === 0) return null;
  return items;
}

export function YourMedicinesRail() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);
  const items = useDraftShopBasket() ?? [];
  const needsConsult = basketNeedsConsult(items);
  const totals = basketTotals(items);
  const rxNeeded = items.filter((row) => row.rx && !row.prescriptionFile && !row.viaConsult);
  const rx = getDraftRxUpload();
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct] = useState(0);
  const [scanLabel, setScanLabel] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  const continueNext = () => {
    if (!items.length || scanning) return;
    confirmBasketForConsult();
    nav(needsConsult ? `${INDEX}/consult` : `${INDEX}/order`);
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
      requestMedListPopover();
    }
  };

  return (
    <div>
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
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

      {scanning ? (
        <div className="border-b border-line px-5 py-4">
          <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{scanLabel}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--pp-primary-100)]">
            <div
              className="h-full rounded-full bg-[color:var(--pp-violet)] transition-[width] duration-300"
              style={{ width: `${Math.max(6, scanPct)}%` }}
            />
          </div>
        </div>
      ) : null}

      {scanError && !rx ? (
        <p className="border-b border-line px-5 py-3 text-2xs text-ink-tertiary">{scanError}</p>
      ) : null}

      <ul>
        {items.map((row, i) => (
          <li key={`${row.slug}-${row.dose}`} className={i > 0 ? "border-t border-line" : ""}>
            <div className="flex items-start gap-2 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{row.name}</p>
                <p className="mt-0.5 text-2xs text-ink-tertiary">
                  {row.dose} • {tx("Qty")} {row.qty} • ${lineCost(row).toFixed(2)}
                </p>
              </div>
              <select
                value={row.qty}
                onChange={(e) => updateMedBasketItem(row.slug, row.dose, { qty: Number(e.target.value) })}
                className="h-8 shrink-0 rounded-lg border border-line bg-white px-1.5 text-2xs"
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
                onClick={() => removeFromMedBasket(row.slug, row.dose)}
                className="grid h-8 w-8 shrink-0 place-items-center text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
                aria-label={tx("Remove")}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between border-t border-line px-5 py-3">
        <span className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Total")}</span>
        <span className="font-display text-xl font-medium text-[color:var(--pp-primary-950)] tnum">
          ${totals.drugCost.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2 border-t border-line px-5 py-4">
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
            <button
              type="button"
              onClick={() => requestMedListPopover()}
              className="mt-2 text-left text-2xs font-medium text-[color:var(--pp-violet)]"
            >
              {tx("See medicines on this prescription")}
            </button>
          </div>
        ) : (
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
    </section>
    {rxNeeded.length > 0 ? (
      <p className="mt-3 text-sm leading-relaxed text-ink-tertiary">
        <span className="font-medium text-[color:var(--pp-primary-950)]">{tx("Prescription needed")}.</span>{" "}
        {tx("Upload an Rx for the medicines that need one, or continue to see a doctor.")}
      </p>
    ) : null}
    </div>
  );
}
