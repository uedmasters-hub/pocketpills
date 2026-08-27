/**
 * Splits a prescription image into individual line-band crops.
 *
 * Why this exists: TrOCR is a *single-line* recognizer. Handed a whole
 * multi-line prescription it reads only the first line (confirmed behaviour of
 * the vision-encoder-decoder). So before handing anything to the handwriting
 * model we cut the page into horizontal line bands using a classic horizontal
 * projection profile — no ML, no Tesseract bounding-box coupling, just pixel
 * row sums. This keeps the handwriting path self-contained and cheap.
 *
 * Everything here is main-thread canvas work; the crops are turned into
 * transferable ImageData in htrClient before crossing into the worker.
 */

export type LineBand = {
  /** Cropped, padded, white-background canvas for one text line. */
  canvas: HTMLCanvasElement;
  /** Top edge of the band in the source canvas (for debugging / ordering). */
  top: number;
  height: number;
  /** Left edge and width in the source canvas, for highlighting that line. */
  left: number;
  width: number;
};

/** Row is "ink" if its dark-pixel share clears this fraction of the width. */
const INK_ROW_RATIO = 0.012;
/** A pixel counts as ink below this luma (source is already contrast-stretched). */
const INK_LUMA = 140;
/** Merge bands separated by less than this many rows — kerning, descenders. */
const MERGE_GAP = 6;
/** Drop specks shorter than this — dust, underline fragments. */
const MIN_BAND_H = 10;
/** White padding baked around each crop; TrOCR likes breathing room. */
const PAD_Y = 8;
const PAD_X = 12;
/** Upscale short lines so glyph strokes survive the model's own resize. */
const TARGET_LINE_H = 64;
const MAX_LINE_H = 160;

type Range = { start: number; end: number };

/** Dark-pixel count per row across the whole width. */
function rowInkProfile(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  win?: { x0: number; x1: number; y0: number; y1: number },
): number[] {
  const x0 = win?.x0 ?? 0;
  const x1 = win?.x1 ?? width;
  const y0 = win?.y0 ?? 0;
  const y1 = win?.y1 ?? height;
  const profile = new Array<number>(y1 - y0).fill(0);
  for (let y = y0; y < y1; y++) {
    let ink = 0;
    const rowStart = y * width * 4;
    for (let x = x0; x < x1; x++) {
      const i = rowStart + x * 4;
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (luma < INK_LUMA) ink++;
    }
    profile[y - y0] = ink;
  }
  return profile;
}

/** 90th-percentile of non-blank rows — the ink a typical text row carries. */
function inkP90(profile: number[]): number {
  const nz = profile.filter((v) => v > 0).sort((a, b) => a - b);
  return nz.length ? nz[Math.min(nz.length - 1, Math.floor(nz.length * 0.9))] : 0;
}

/**
 * Split a band that is clearly taller than its neighbours at its deepest
 * interior valley.
 *
 * Handwritten lines touch: an ascender from one line meets a descender from the
 * one above, so no row is ever blank between them and pure thresholding fuses
 * them. On a real prescription this fused "Placida" and "Escitat" into a single
 * crop, and TrOCR reads only the first line of whatever it is given — so the
 * second medicine simply disappeared.
 */
function splitTallBands(bands: Range[], profile: number[], offset: number, depth = 0): Range[] {
  if (depth > 3 || bands.length === 0) return bands;
  const heights = bands.map((b) => b.end - b.start).sort((a, b) => a - b);
  const median = heights[Math.floor(heights.length / 2)];
  const out: Range[] = [];
  for (const band of bands) {
    const h = band.end - band.start;
    if (h < median * 1.6 || h < 40) {
      out.push(band);
      continue;
    }
    const margin = Math.floor(h * 0.28);
    let bestY = -1;
    let bestV = Infinity;
    for (let y = band.start + margin; y < band.end - margin; y++) {
      const v = profile[y - offset];
      if (v < bestV) {
        bestV = v;
        bestY = y;
      }
    }
    let sum = 0;
    for (let y = band.start; y < band.end; y++) sum += profile[y - offset] ?? 0;
    const mean = sum / h;
    if (bestY > 0 && bestV < mean * 0.55) {
      out.push(
        ...splitTallBands(
          [{ start: band.start, end: bestY }, { start: bestY, end: band.end }],
          profile,
          offset,
          depth + 1,
        ),
      );
    } else {
      out.push(band);
    }
  }
  return out;
}

/**
 * Turn a row profile into contiguous ink ranges.
 *
 * `relative` picks the threshold from the region's own ink (used inside a
 * column cell, where a shallow valley still separates two lines); the coarse
 * page pass keeps the fixed width fraction, because lowering it there merges
 * neighbouring blocks rather than separating them.
 */
function bandsFromProfile(
  profile: number[],
  width: number,
  opts: { relative?: boolean; offset?: number; mergeGap?: number } = {},
): Range[] {
  const { relative = false, offset = 0, mergeGap = MERGE_GAP } = opts;
  const threshold = relative
    ? Math.max(3, Math.round(inkP90(profile) * 0.22))
    : Math.max(2, Math.floor(width * INK_ROW_RATIO));

  const raw: Range[] = [];
  let start = -1;
  for (let i = 0; i < profile.length; i++) {
    const inky = profile[i] >= threshold;
    if (inky && start === -1) start = i + offset;
    if (!inky && start !== -1) {
      raw.push({ start, end: i + offset });
      start = -1;
    }
  }
  if (start !== -1) raw.push({ start, end: profile.length + offset });

  const merged: Range[] = [];
  for (const band of raw) {
    const prev = merged[merged.length - 1];
    if (prev && band.start - prev.end <= mergeGap) prev.end = band.end;
    else merged.push({ ...band });
  }
  const kept = merged.filter((b) => b.end - b.start >= MIN_BAND_H);
  return relative ? splitTallBands(kept, profile, offset) : kept;
}

function sourceRect(
  source: HTMLCanvasElement,
  band: Range,
  col?: Range,
): { left: number; top: number; width: number; height: number } {
  const top = Math.max(0, band.start - PAD_Y);
  const bottom = Math.min(source.height, band.end + PAD_Y);
  const left = col ? Math.max(0, col.start - PAD_X) : 0;
  const right = col ? Math.min(source.width, col.end + PAD_X) : source.width;
  return { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

/** Crop one band, pad it, and upscale toward a legible line height. */
function cropBand(source: HTMLCanvasElement, band: Range): HTMLCanvasElement | null {
  const rawH = band.end - band.start;
  const scale = Math.min(
    MAX_LINE_H / rawH,
    Math.max(1, TARGET_LINE_H / rawH),
  );
  const rect = sourceRect(source, band);

  const out = document.createElement("canvas");
  out.width = Math.round((source.width + PAD_X * 2) * scale);
  out.height = Math.round(rect.height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    source,
    0,
    rect.top,
    source.width,
    rect.height,
    Math.round(PAD_X * scale),
    0,
    Math.round(source.width * scale),
    Math.round(rect.height * scale),
  );
  return out;
}

/**
 * Column ink spans inside one row band.
 *
 * South Asian prescriptions are routinely two-column — vitals ("BP: 130/90")
 * on the left, the Rx list on the right, sharing the same rows. A pure
 * horizontal projection glues those into one very wide, mostly-empty crop that
 * TrOCR reads badly. Splitting each band at wide vertical whitespace gaps
 * recovers the columns without needing layout analysis.
 */
function columnSpans(
  data: Uint8ClampedArray,
  width: number,
  band: Range,
): Range[] {
  const ink = new Array<number>(width).fill(0);
  for (let y = band.start; y < band.end; y++) {
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      const i = rowStart + x * 4;
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (luma < INK_LUMA) ink[x]++;
    }
  }
  // A gap must be a real column break, not inter-word spacing.
  const gapLimit = Math.max(24, Math.round(width * 0.045));
  const minSpan = Math.max(16, Math.round(width * 0.02));

  const spans: Range[] = [];
  let start = -1;
  let gap = 0;
  for (let x = 0; x < width; x++) {
    if (ink[x] > 0) {
      if (start === -1) start = x;
      gap = 0;
    } else if (start !== -1) {
      gap++;
      if (gap >= gapLimit) {
        spans.push({ start, end: x - gap + 1 });
        start = -1;
        gap = 0;
      }
    }
  }
  if (start !== -1) spans.push({ start, end: width });
  return spans.filter((s) => s.end - s.start >= minSpan);
}

/** Crop one band restricted to a column span, padded and upscaled. */
function cropCell(source: HTMLCanvasElement, band: Range, col: Range): HTMLCanvasElement | null {
  const rawH = band.end - band.start;
  const scale = Math.min(MAX_LINE_H / rawH, Math.max(1, TARGET_LINE_H / rawH));
  const rect = sourceRect(source, band, col);
  if (rect.width <= 0 || rect.height <= 0) return null;

  const out = document.createElement("canvas");
  out.width = Math.round(rect.width * scale);
  out.height = Math.round(rect.height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, rect.left, rect.top, rect.width, rect.height, 0, 0, out.width, out.height);
  return out;
}

function asBand(
  source: HTMLCanvasElement,
  canvas: HTMLCanvasElement,
  band: Range,
  col?: Range,
): LineBand {
  const rect = sourceRect(source, band, col);
  return {
    canvas,
    top: rect.top,
    height: rect.height,
    left: rect.left,
    width: rect.width,
  };
}

/**
 * Segment a canvas into line-band crops.
 *
 * Order matters, and the obvious order is wrong. Splitting rows first and
 * columns second leaves a tall multi-line cell whenever the page is
 * two-column: the left column's ink bridges every gap in the right column, so
 * the whole Rx list fuses into one band. Measured on a real prescription that
 * produced a single 492px crop holding five medicines, and TrOCR read only the
 * first — which is exactly how three medicines went missing.
 *
 * So: coarse rows, then columns, then rows AGAIN inside each column cell where
 * the neighbouring column can no longer bridge the gaps.
 */
export function segmentLines(source: HTMLCanvasElement, maxLines = 40): LineBand[] {
  const ctx = source.getContext("2d");
  if (!ctx) return [];
  const { data } = ctx.getImageData(0, 0, source.width, source.height);
  const coarse = bandsFromProfile(
    rowInkProfile(data, source.width, source.height),
    source.width,
  );

  const bands: LineBand[] = [];
  const push = (band: Range, col: Range) => {
    if (bands.length >= maxLines) return;
    const canvas = cropCell(source, band, col);
    if (canvas) bands.push(asBand(source, canvas, band, col));
  };

  for (const band of coarse) {
    if (bands.length >= maxLines) break;
    const spans = columnSpans(data, source.width, band);
    if (!spans.length) {
      const canvas = cropBand(source, band);
      if (canvas) bands.push(asBand(source, canvas, band));
      continue;
    }
    for (const col of spans) {
      const inner = bandsFromProfile(
        rowInkProfile(data, source.width, source.height, {
          x0: col.start,
          x1: col.end,
          y0: band.start,
          y1: band.end,
        }),
        col.end - col.start,
        { relative: true, offset: band.start, mergeGap: 4 },
      );
      if (!inner.length) {
        push(band, col);
        continue;
      }
      for (const line of inner) push(line, col);
    }
  }

  if (!bands.length) {
    bands.push({ canvas: source, top: 0, height: source.height, left: 0, width: source.width });
  }
  return bands;
}
