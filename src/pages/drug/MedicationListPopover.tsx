import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ConfirmModal, Modal } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  addDraftRxFound,
  basketNeedsConsult,
  basketRxDoesNotMatch,
  basketTotals,
  clearDraftRxUpload,
  confirmBasketForConsult,
  ASK_RX_UPLOAD_EVENT,
  CROP_RX_EVENT,
  draftRxPreviewSrc,
  getDraftRxUpload,
  lineCost,
  listMedBasket,
  patchDraftRxFound,
  removeDraftRxFound,
  removeFromMedBasket,
  RX_MISMATCH_COPY,
  setDraftRxOriginal,
  subscribeMedBasket,
  updateMedBasketItem,
  type BasketItem,
  type DraftRxFound,
  type DraftRxUpload,
} from "@/lib/medBasketDraft";
import { applyPrescriptionFile, cropImageFile, rememberOriginalRxPhoto, rescanRxFoundAt, type RxCropBox } from "@/lib/medBasketScan";
import { isReadableImage } from "@/lib/rxOcr";
import { DEFAULT_RX_CROP, defaultRxLineBox, RxImageCropper } from "@/pages/drug/RxImageCropper";

const INDEX = "/drug";

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
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState<RxCropBox>(DEFAULT_RX_CROP);
  const [preparing, setPreparing] = useState(false);
  const [wantUpload, setWantUpload] = useState(false);
  const [dropOver, setDropOver] = useState(false);
  const [adjustIndex, setAdjustIndex] = useState<number | null>(null);
  const [mismatchOpen, setMismatchOpen] = useState(false);

  const beginCrop = (file: File) => {
    if (!isReadableImage(file)) {
      setScanError(tx("Use a photo of the prescription so we can match your list."));
      return;
    }
    setScanError(null);
    setWantUpload(true);
    setCropFile(file);
    setDraftRxOriginal(file);
    void rememberOriginalRxPhoto(file);
    setCropBox(DEFAULT_RX_CROP);
    setCropUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const clearCrop = () => {
    setCropUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCropFile(null);
    setCropBox(DEFAULT_RX_CROP);
    setPreparing(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const beginCropRef = useRef<(file: File) => void>(() => {});
  beginCropRef.current = beginCrop;
  const cropUrlRef = useRef<string | null>(null);
  cropUrlRef.current = cropUrl;
  const hadRx = useRef(false);

  useEffect(() => subscribeMedBasket(() => setTick((n) => n + 1)), []);
  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);
  useEffect(() => {
    const on = (e: Event) => {
      const file = (e as CustomEvent<File>).detail;
      if (file instanceof File) beginCropRef.current(file);
    };
    window.addEventListener(CROP_RX_EVENT, on);
    return () => window.removeEventListener(CROP_RX_EVENT, on);
  }, []);
  useEffect(() => {
    const on = () => setWantUpload(true);
    window.addEventListener(ASK_RX_UPLOAD_EVENT, on);
    return () => window.removeEventListener(ASK_RX_UPLOAD_EVENT, on);
  }, []);
  useEffect(
    () => () => {
      if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    },
    [],
  );
  useEffect(() => {
    if (open) return;
    setScanning(false);
    setScanError(null);
    setScanPct(0);
    setScanLabel("");
    setWantUpload(false);
    setDropOver(false);
    setAdjustIndex(null);
    setMismatchOpen(false);
    hadRx.current = false;
    clearCrop();
  }, [open]);

  const items = useMemo(() => listMedBasket(), [tick, open]);
  const rx = useMemo(() => getDraftRxUpload(), [tick, open]);
  const added = justAddedSlug
    ? items.find((row) => row.slug === justAddedSlug) ?? items[items.length - 1]
    : undefined;
  const needsConsult = basketNeedsConsult(items);
  const mismatch = basketRxDoesNotMatch(items);
  const matched = items.filter((row) => Boolean(row.prescriptionFile));
  const totals = basketTotals(items);
  const cropping = Boolean(cropUrl && cropFile);
  const reading = scanning || Boolean(rx?.reading);
  const askingUpload = wantUpload && !cropping && !rx && !reading;
  const previewSrc = draftRxPreviewSrc(rx);
  const adjusting = adjustIndex !== null && Boolean(previewSrc) && !cropping;

  useEffect(() => {
    if (!open) return;
    if (rx) hadRx.current = true;
    else if (hadRx.current) {
      hadRx.current = false;
      setWantUpload(true);
    }
  }, [open, rx]);
  const title = cropping
    ? tx("Crop prescription")
    : adjusting
      ? tx("Adjust this area")
      : askingUpload
        ? tx("Upload prescription")
        : rx
          ? tx("On this prescription")
          : added
            ? tx("{name} is on your list").replace("{name}", added.name)
            : tx("Your medicines");

  const close = () => {
    if (preparing) return;
    if (adjustIndex !== null) {
      setAdjustIndex(null);
      return;
    }
    clearCrop();
    onClose();
  };

  const canContinue = !reading && !cropping && !adjusting && (items.length > 0 || Boolean(rx));

  const continueNext = () => {
    if (!canContinue) return;
    if (mismatch) {
      setMismatchOpen(true);
      return;
    }
    confirmBasketForConsult();
    onClose();
    nav(needsConsult || !items.length ? `${INDEX}/consult` : `${INDEX}/order`);
  };

  const goConsultAfterMismatch = () => {
    setMismatchOpen(false);
    confirmBasketForConsult();
    onClose();
    nav(`${INDEX}/consult`);
  };

  const addMore = () => {
    if (reading || cropping) return;
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

  const scanArea = async () => {
    if (!cropFile || preparing) return;
    setPreparing(true);
    try {
      const cut = await cropImageFile(cropFile, cropBox);
      clearCrop();
      await runScan(cut);
    } catch {
      setPreparing(false);
      setScanError(tx("We couldn’t crop that photo. Try another image."));
    }
  };

  const scanFull = async () => {
    if (!cropFile || preparing) return;
    const file = cropFile;
    clearCrop();
    await runScan(file);
  };

  const openAdjust = (index: number) => {
    const line = rx?.found[index];
    if (!previewSrc || !line) return;
    setScanError(null);
    setCropBox(line.snippetBox ?? defaultRxLineBox(index));
    setAdjustIndex(index);
  };

  const rescanAdjust = async () => {
    if (adjustIndex == null || preparing) return;
    setPreparing(true);
    setScanError(null);
    setScanPct(12);
    setScanLabel(tx("Reading this area"));
    const result = await rescanRxFoundAt(
      adjustIndex,
      cropBox,
      (label, pct) => {
        if (cancelled.current) return;
        setScanLabel(tx(label));
        setScanPct(pct);
      },
      () => cancelled.current,
    );
    if (!cancelled.current) {
      setPreparing(false);
      setScanError(result.error ? tx(result.error) : null);
      if (result.ok) setAdjustIndex(null);
    }
  };

  return (
    <>
    <Modal
      open={open}
      title={title}
      onClose={close}
      footer={
        cropping ? (
          <div className="grid w-full basis-full grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              disabled={preparing}
              className="!border-line"
              onClick={() => void scanFull()}
            >
              {tx("Use full photo")}
            </Button>
            <Button size="sm" fullWidth disabled={preparing} onClick={() => void scanArea()}>
              {preparing ? tx("Preparing") : tx("Scan this area")}
            </Button>
          </div>
        ) : adjusting ? (
          <div className="grid w-full basis-full grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              disabled={preparing}
              className="!border-line"
              onClick={() => setAdjustIndex(null)}
            >
              {tx("Cancel")}
            </Button>
            <Button size="sm" fullWidth disabled={preparing} onClick={() => void rescanAdjust()}>
              {preparing ? tx("Reading") : tx("Rescan this area")}
            </Button>
          </div>
        ) : askingUpload ? (
          <div className="grid w-full basis-full grid-cols-2 gap-2">
            <Button variant="outline" size="sm" fullWidth className="!border-line" onClick={close}>
              {tx("Cancel")}
            </Button>
            <Button size="sm" fullWidth onClick={() => fileRef.current?.click()}>
              {tx("Upload")}
            </Button>
          </div>
        ) : rx ? (
          <div className="grid w-full basis-full grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              disabled={reading}
              className="!border-line text-[color:var(--pp-primary-950)]"
              onClick={() => addDraftRxFound()}
            >
              + {tx("Add more")}
            </Button>
            <Button size="sm" fullWidth disabled={!canContinue} onClick={continueNext}>
              {tx("Continue")}
            </Button>
          </div>
        ) : (
          <div className="grid w-full basis-full grid-cols-2 gap-2">
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
            <Button size="sm" fullWidth disabled={!canContinue} onClick={continueNext}>
              {tx("Continue")}
            </Button>
          </div>
        )
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) beginCrop(file);
        }}
      />

      {cropping && cropUrl ? (
        <div>
          <p className="mb-3 text-sm text-ink-secondary">
            {tx("Move and resize the box over the medicines you want to scan.")}
          </p>
          <RxImageCropper src={cropUrl} box={cropBox} onChange={setCropBox} />
          {scanError ? <p className="mt-3 text-sm text-ink-tertiary">{scanError}</p> : null}
        </div>
      ) : adjusting && previewSrc ? (
        <div>
          <p className="mb-3 text-sm text-ink-secondary">
            {tx("Move the highlight over this medicine, then rescan. Use + and − to zoom.")}
          </p>
          <RxImageCropper
            key={`adjust-${adjustIndex}`}
            src={previewSrc}
            box={cropBox}
            onChange={setCropBox}
            minW={0.08}
            minH={0.035}
          />
          {preparing ? (
            <div className="mt-3 rounded-xl border border-line bg-[color:var(--pp-primary-100)] px-3 py-3">
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
                {scanLabel || tx("Reading this area")}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[color:var(--pp-violet)] transition-[width] duration-300"
                  style={{ width: `${Math.max(6, scanPct || 18)}%` }}
                />
              </div>
            </div>
          ) : scanError ? (
            <p className="mt-3 text-sm text-ink-tertiary">{scanError}</p>
          ) : null}
        </div>
      ) : askingUpload ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDropOver(true);
          }}
          onDragLeave={() => setDropOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropOver(false);
            const file = e.dataTransfer.files[0];
            if (file) beginCrop(file);
          }}
          className={
            "grid h-56 w-full place-items-center rounded-xl border text-sm " +
            (dropOver
              ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
              : "border-line bg-[color:var(--pp-primary-100)] text-ink-tertiary")
          }
        >
          {tx("Upload prescription")}
        </button>
      ) : items.length === 0 && !rx ? (
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
            <RxPhotoCard
              rx={rx}
              previewSrc={previewSrc}
              onRemove={() => {
                clearDraftRxUpload();
                setScanError(null);
                setWantUpload(true);
              }}
            />
          ) : (
            <p>
              {tx("Upload your prescription to match these medicines and scan it to add any others automatically.")}
            </p>
          )}

          {reading ? (
            <div className="mt-4 rounded-xl border border-line bg-[color:var(--pp-primary-100)] px-3 py-3">
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
                {scanLabel || tx("Reading your prescription")}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[color:var(--pp-violet)] transition-[width] duration-300"
                  style={{ width: `${Math.max(6, scanPct || 18)}%` }}
                />
              </div>
            </div>
          ) : null}

          {rx && !reading ? (
            rx.found.length ? (
              <ul className="mt-3 divide-y divide-line">
                {rx.found.map((line, i) => (
                  <li key={`${i}-${line.slug ?? line.name}`}>
                    <RxFoundRow
                      line={line}
                      onName={(name) => patchDraftRxFound(i, { name })}
                      onDirections={(directions) => patchDraftRxFound(i, { directions })}
                      onRemove={() => removeDraftRxFound(i)}
                      onAdjust={() => openAdjust(i)}
                    />
                  </li>
                ))}
              </ul>
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
          ) : !reading ? (
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
        </div>
      )}
    </Modal>
    <ConfirmModal
      open={mismatchOpen}
      title={tx(RX_MISMATCH_COPY.title)}
      body={tx(RX_MISMATCH_COPY.alert)}
      confirmLabel={tx("Continue to consult")}
      cancelLabel={tx("Go back")}
      onClose={() => setMismatchOpen(false)}
      onConfirm={goConsultAfterMismatch}
    />
    </>
  );
}

function RxPhotoCard({
  rx,
  previewSrc,
  onRemove,
}: {
  rx: DraftRxUpload;
  previewSrc?: string;
  onRemove: () => void;
}) {
  const { tx } = useI18n();

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {previewSrc ? (
        <img src={previewSrc} alt="" className="h-40 w-full object-cover object-top" />
      ) : (
        <div className="grid h-40 place-items-center bg-[color:var(--pp-primary-100)] text-2xs text-ink-tertiary">
          {tx("Prescription photo")}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-line px-3 py-2">
        <p className="min-w-0 flex-1 truncate text-2xs font-medium text-[color:var(--pp-primary-950)]">{rx.fileName}</p>
        <button
          type="button"
          onClick={onRemove}
          className="grid h-8 w-8 shrink-0 place-items-center text-[color:var(--pp-primary-950)] hover:opacity-70"
          aria-label={tx("Remove prescription")}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function RxFoundRow({
  line,
  onName,
  onDirections,
  onRemove,
  onAdjust,
}: {
  line: DraftRxFound;
  onName: (name: string) => void;
  onDirections: (directions: string) => void;
  onRemove: () => void;
  onAdjust: () => void;
}) {
  const { tx } = useI18n();
  const directions = line.directions || line.strength || tx("As directed");

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <input
          value={line.name}
          onChange={(e) => onName(e.target.value)}
          placeholder={tx("Medicine name")}
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent text-[15px] font-semibold leading-tight text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary"
          aria-label={tx("Medicine name")}
        />
        <input
          value={directions}
          onChange={(e) => onDirections(e.target.value)}
          placeholder={tx("As directed")}
          autoComplete="off"
          className="mt-0.5 w-full bg-transparent text-[13px] leading-tight text-ink-tertiary outline-none placeholder:text-ink-tertiary"
          aria-label={tx("Directions")}
        />
      </div>
      <button
        type="button"
        onClick={onAdjust}
        className="shrink-0 rounded-lg outline-none ring-[color:var(--pp-violet)] hover:opacity-90 focus-visible:ring-2"
        aria-label={tx("Adjust this area")}
      >
        {line.snippetDataUrl ? (
          <img
            src={line.snippetDataUrl}
            alt=""
            className="h-10 w-[5.75rem] rounded-lg border border-line bg-white object-cover object-left"
          />
        ) : (
          <div className="grid h-10 w-[5.75rem] place-items-center rounded-lg border border-line bg-[color:var(--pp-primary-100)] text-[10px] text-ink-tertiary">
            {tx("Adjust")}
          </div>
        )}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-8 w-8 shrink-0 place-items-center text-[color:var(--pp-primary-950)] hover:opacity-70"
        aria-label={tx("Remove")}
      >
        <TrashIcon />
      </button>
    </div>
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
