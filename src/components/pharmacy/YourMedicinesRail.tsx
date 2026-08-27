import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  basketNeedsConsult,
  basketRxDoesNotMatch,
  basketTotals,
  clearDraftRxUpload,
  confirmBasketForConsult,
  draftRxPreviewSrc,
  getDraftRxUpload,
  lineCost,
  listMedBasket,
  removeFromMedBasket,
  requestMedListPopover,
  requestRxCrop,
  requestRxUpload,
  RX_MISMATCH_COPY,
  subscribeMedBasket,
  updateMedBasketItem,
} from "@/lib/medBasketDraft";

const INDEX = "/drug";

/** Shop index — list is shown in Activity instead of live orders. */
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
  const [mismatchOpen, setMismatchOpen] = useState(false);
  const items = useDraftShopBasket() ?? [];
  const needsConsult = basketNeedsConsult(items);
  const totals = basketTotals(items);
  const rxNeeded = items.filter((row) => row.rx && !row.prescriptionFile && !row.viaConsult);
  const rx = getDraftRxUpload();
  const previewSrc = draftRxPreviewSrc(rx);
  const reading = Boolean(rx?.reading);
  const mismatch = basketRxDoesNotMatch(items);

  const goNext = () => {
    confirmBasketForConsult();
    nav(needsConsult ? `${INDEX}/consult` : `${INDEX}/order`);
  };

  const continueNext = () => {
    if (!items.length || reading) return;
    if (mismatch) {
      setMismatchOpen(true);
      return;
    }
    goNext();
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
          if (file) requestRxCrop(file);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
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
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <button
              type="button"
              onClick={() => requestMedListPopover()}
              className="relative block w-full outline-none ring-[color:var(--pp-violet)] focus-visible:ring-2"
              aria-label={tx("See medicines on this prescription")}
            >
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt=""
                  className="h-20 w-full object-cover object-top"
                />
              ) : (
                <div className="grid h-20 place-items-center bg-[color:var(--pp-primary-100)] text-2xs text-ink-tertiary">
                  {tx("Prescription photo")}
                </div>
              )}
              {reading ? (
                <div className="absolute inset-0 grid place-items-center bg-white/70 text-2xs font-medium text-[color:var(--pp-primary-950)]">
                  {tx("Reading your prescription")}
                </div>
              ) : null}
            </button>
            <div className="flex items-center gap-2 border-t border-line px-3 py-2">
              <p className="min-w-0 flex-1 truncate text-2xs font-medium text-[color:var(--pp-primary-950)]">
                {rx.fileName}
              </p>
              <button
                type="button"
                onClick={() => {
                  clearDraftRxUpload();
                  requestRxUpload();
                }}
                className="grid h-8 w-8 shrink-0 place-items-center text-[color:var(--pp-primary-950)] hover:opacity-70"
                aria-label={tx("Remove prescription")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={() => requestMedListPopover()}
              className="w-full border-t border-line px-3 py-2 text-left text-2xs font-medium text-[color:var(--pp-violet)]"
            >
              {tx("See medicines on this prescription")}
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            disabled={reading}
            className="!border-line"
            onClick={() => fileRef.current?.click()}
          >
            {tx("Upload prescription")}
          </Button>
        )}
        <Button size="sm" fullWidth disabled={reading || !items.length} onClick={continueNext}>
          {tx("Continue")}
        </Button>
      </div>
    </section>
    {mismatch ? (
      <p className="mt-3 text-sm leading-relaxed text-ink-tertiary">
        <span className="font-medium text-[color:var(--pp-primary-950)]">{tx(RX_MISMATCH_COPY.title)}.</span>{" "}
        {tx(RX_MISMATCH_COPY.note)}
      </p>
    ) : rxNeeded.length > 0 ? (
      <p className="mt-3 text-sm leading-relaxed text-ink-tertiary">
        <span className="font-medium text-[color:var(--pp-primary-950)]">{tx("Prescription needed")}.</span>{" "}
        {tx("Upload an Rx for the medicines that need one, or continue to see a doctor.")}
      </p>
    ) : null}
    <ConfirmModal
      open={mismatchOpen}
      title={tx(RX_MISMATCH_COPY.title)}
      body={tx(RX_MISMATCH_COPY.alert)}
      confirmLabel={tx("Continue to consult")}
      cancelLabel={tx("Go back")}
      onClose={() => setMismatchOpen(false)}
      onConfirm={() => {
        setMismatchOpen(false);
        goNext();
      }}
    />
    </div>
  );
}
