import { useCallback, useEffect, useRef, useState } from "react";
import type { RxCropBox } from "@/lib/medBasketScan";

const ZOOM_MIN = 1;
const ZOOM_MAX = 3.5;
const ZOOM_STEP = 0.5;

type Corner = "nw" | "ne" | "sw" | "se";
type Drag =
  | { kind: "move"; startX: number; startY: number; orig: RxCropBox }
  | { kind: "resize"; corner: Corner; startX: number; startY: number; orig: RxCropBox }
  | { kind: "pan"; startX: number; startY: number; origX: number; origY: number };

function clampBox(next: RxCropBox, minW: number, minH: number): RxCropBox {
  let { x, y, w, h } = next;
  w = Math.max(minW, Math.min(1, w));
  h = Math.max(minH, Math.min(1, h));
  x = Math.max(0, Math.min(1 - w, x));
  y = Math.max(0, Math.min(1 - h, y));
  return { x, y, w, h };
}

export const DEFAULT_RX_CROP: RxCropBox = { x: 0.05, y: 0.08, w: 0.9, h: 0.8 };

export function defaultRxLineBox(index: number): RxCropBox {
  const h = 0.08;
  const y = Math.min(0.88 - h, 0.12 + index * 0.09);
  return { x: 0.08, y, w: 0.58, h };
}

export function RxImageCropper({
  src,
  box,
  onChange,
  minW = 0.12,
  minH = 0.12,
  zoomable = true,
}: {
  src: string;
  box: RxCropBox;
  onChange: (box: RxCropBox) => void;
  minW?: number;
  minH?: number;
  zoomable?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<Drag | null>(null);
  const boxRef = useRef(box);
  boxRef.current = box;
  const [frame, setFrame] = useState({ left: 0, top: 0, w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  const layout = useCallback(
    (nextZoom = zoomRef.current, nextPan = panRef.current) => {
      const img = imgRef.current;
      const wrap = wrapRef.current;
      if (!img || !wrap || !img.naturalWidth) return;
      const cw = wrap.clientWidth;
      const ch = wrap.clientHeight;
      const fit = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * fit * nextZoom;
      const h = img.naturalHeight * fit * nextZoom;
      setFrame({
        left: (cw - w) / 2 + nextPan.x,
        top: (ch - h) / 2 + nextPan.y,
        w,
        h,
      });
    },
    [],
  );

  useEffect(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [src]);

  useEffect(() => {
    layout();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") {
      const onResize = () => layout();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    const ro = new ResizeObserver(() => layout());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [layout, src]);

  const panToCenterBox = (nextZoom: number) => {
    const img = imgRef.current;
    const wrap = wrapRef.current;
    if (!img || !wrap || !img.naturalWidth) return { x: 0, y: 0 };
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const fit = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * fit * nextZoom;
    const h = img.naturalHeight * fit * nextZoom;
    const b = boxRef.current;
    const cx = (b.x + b.w / 2) * w;
    const cy = (b.y + b.h / 2) * h;
    return {
      x: cw / 2 - (cw - w) / 2 - cx,
      y: ch / 2 - (ch - h) / 2 - cy,
    };
  };

  const applyZoom = (next: number) => {
    const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
    const nextPan = z <= 1 ? { x: 0, y: 0 } : panToCenterBox(z);
    zoomRef.current = z;
    panRef.current = nextPan;
    setZoom(z);
    setPan(nextPan);
    layout(z, nextPan);
  };

  const clientToNorm = (clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (!wrap || !frame.w) return { x: 0, y: 0 };
    const r = wrap.getBoundingClientRect();
    return {
      x: (clientX - r.left - frame.left) / frame.w,
      y: (clientY - r.top - frame.top) / frame.h,
    };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    e.preventDefault();
    if (d.kind === "pan") {
      const next = { x: d.origX + (e.clientX - d.startX), y: d.origY + (e.clientY - d.startY) };
      panRef.current = next;
      setPan(next);
      layout(zoomRef.current, next);
      return;
    }
    const p = clientToNorm(e.clientX, e.clientY);
    const dx = p.x - d.startX;
    const dy = p.y - d.startY;
    const o = d.orig;
    if (d.kind === "move") {
      onChange(clampBox({ ...o, x: o.x + dx, y: o.y + dy }, minW, minH));
      return;
    }
    let x = o.x;
    let y = o.y;
    let w = o.w;
    let h = o.h;
    if (d.corner.includes("w")) {
      const right = o.x + o.w;
      x = Math.min(right - minW, o.x + dx);
      w = right - x;
    }
    if (d.corner.includes("e")) w = o.w + dx;
    if (d.corner.includes("n")) {
      const bottom = o.y + o.h;
      y = Math.min(bottom - minH, o.y + dy);
      h = bottom - y;
    }
    if (d.corner.includes("s")) h = o.h + dy;
    onChange(clampBox({ x, y, w, h }, minW, minH));
  };

  const endDrag = () => {
    drag.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
  };

  const beginBox =
    (next: { kind: "move"; orig: RxCropBox } | { kind: "resize"; corner: Corner; orig: RxCropBox }) =>
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const p = clientToNorm(e.clientX, e.clientY);
      drag.current =
        next.kind === "move"
          ? { kind: "move", orig: next.orig, startX: p.x, startY: p.y }
          : { kind: "resize", corner: next.corner, orig: next.orig, startX: p.x, startY: p.y };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", endDrag);
    };

  const beginPan = (e: React.PointerEvent) => {
    if (!zoomable || zoom <= 1) return;
    e.preventDefault();
    drag.current = { kind: "pan", startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !zoomable) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoom(zoomRef.current + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
    };
    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, [zoomable]);

  const cropStyle =
    frame.w > 0
      ? {
          left: frame.left + box.x * frame.w,
          top: frame.top + box.y * frame.h,
          width: box.w * frame.w,
          height: box.h * frame.h,
        }
      : undefined;

  return (
    <div
      ref={wrapRef}
      onPointerDown={beginPan}
      className="relative h-80 touch-none overflow-hidden rounded-xl border border-line bg-[color:var(--pp-primary-100)]"
    >
      <img
        ref={imgRef}
        src={src}
        alt=""
        draggable={false}
        onLoad={() => layout()}
        className="absolute max-w-none select-none"
        style={{ left: frame.left, top: frame.top, width: frame.w, height: frame.h }}
      />
      {cropStyle ? (
        <div
          className="absolute cursor-move touch-none border-2 border-[color:var(--pp-violet)]"
          style={{
            ...cropStyle,
            boxShadow: "0 0 0 9999px rgba(24, 7, 48, 0.48)",
          }}
          onPointerDown={beginBox({ kind: "move", orig: box })}
        >
          {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
            <button
              key={corner}
              type="button"
              aria-label={corner}
              className={
                "absolute h-3.5 w-3.5 rounded-sm border-2 border-[color:var(--pp-violet)] bg-white " +
                (corner === "nw"
                  ? "-left-1.5 -top-1.5 cursor-nwse-resize"
                  : corner === "ne"
                    ? "-right-1.5 -top-1.5 cursor-nesw-resize"
                    : corner === "sw"
                      ? "-bottom-1.5 -left-1.5 cursor-nesw-resize"
                      : "-bottom-1.5 -right-1.5 cursor-nwse-resize")
              }
              onPointerDown={beginBox({ kind: "resize", corner, orig: box })}
            />
          ))}
        </div>
      ) : null}
      {zoomable ? (
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            disabled={zoom >= ZOOM_MAX}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => applyZoom(zoom + ZOOM_STEP)}
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-lg font-medium text-[color:var(--pp-primary-950)] shadow-sm disabled:opacity-40"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            disabled={zoom <= ZOOM_MIN}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => applyZoom(zoom - ZOOM_STEP)}
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-lg font-medium text-[color:var(--pp-primary-950)] shadow-sm disabled:opacity-40"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      ) : null}
    </div>
  );
}
