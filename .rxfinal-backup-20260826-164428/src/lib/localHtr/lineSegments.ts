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
function rowInkProfile(data: Uint8ClampedArray, width: number, height: number): number[] {
  const profile = new Array<number>(height).fill(0);
  for (let y = 0; y < height; y++) {
    let ink = 0;
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      const i = rowStart + x * 4;
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (luma < INK_LUMA) ink++;
    }
    profile[y] = ink;
  }
  return profile;
}

/**
 * Rows are "ink" above a threshold derived from the page's own ink density.
 *
 * A fixed fraction of page width fails badly on real prescriptions: a short
 * right-column line ("T. Placida 1 OD") in thin pen strokes lands around 17
 * dark pixels per row, just under a fixed 1.2%-of-width cut, so entire
 * medicines vanish before recognition runs while longer lines survive. Scaling
 * against the median ink of non-blank rows adapts to faint handwriting, while
 * the fixed value stays an upper bound so dense printed pages behave as before.
 */
function bandsFromProfile(profile: number[], width: number): Range[] {
  const nonBlank = profile.filter((v) => v > 0).sort((a, b) => a - b);
  const median = nonBlank.length ? nonBlank[Math.floor(nonBlank.length / 2)] : 0;
  const ceiling = Math.floor(width * INK_ROW_RATIO);
  const adaptive = Math.round(median * 0.35);
  const threshold = Math.max(2, Math.min(ceiling, adaptive || ceiling));

  const raw: Range[] = [];
  let start = -1;
  for (let y = 0; y < profile.length; y++) {
    const inky = profile[y] >= threshold;
    if (inky && start === -1) start = y;
    if (!inky && start !== -1) {
      raw.push({ start, end: y });
      start = -1;
    }
  }
  if (start !== -1) raw.push({ start, end: profile.length });

  const merged: Range[] = [];
  for (const band of raw) {
    const prev = merged[merged.length - 1];
    if (prev && band.start - prev.end <= MERGE_GAP) {
      prev.end = band.end;
    } else {
      merged.push({ ...band });
    }
  }
  return merged.filter((b) => b.end - b.start >= MIN_BAND_H);
}

/** Crop one band, pad it, and upscale toward a legible line height. */
function cropBand(source: HTMLCanvasElement, band: Range): HTMLCanvasElement | null {
  const rawH = band.end - band.start;
  const scale = Math.min(
    MAX_LINE_H / rawH,
    Math.max(1, TARGET_LINE_H / rawH),
  );
  const top = Math.max(0, band.start - PAD_Y);
  const bottom = Math.min(source.height, band.end + PAD_Y);
  const bandH = bottom - top;

  const out = document.createElement("canvas");
  out.width = Math.round((source.width + PAD_X * 2) * scale);
  out.height = Math.round(bandH * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    source,
    0,
    top,
    source.width,
    bandH,
    Math.round(PAD_X * scale),
    0,
    Math.round(source.width * scale),
    Math.round(bandH * scale),
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
  const top = Math.max(0, band.start - PAD_Y);
  const bottom = Math.min(source.height, band.end + PAD_Y);
  const bandH = bottom - top;
  const left = Math.max(0, col.start - PAD_X);
  const right = Math.min(source.width, col.end + PAD_X);
  const cellW = right - left;
  if (cellW <= 0 || bandH <= 0) return null;

  const out = document.createElement("canvas");
  out.width = Math.round(cellW * scale);
  out.height = Math.round(bandH * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, left, top, cellW, bandH, 0, 0, out.width, out.height);
  return out;
}

/**
 * Segment a (preferably contrast-stretched) canvas into line-band crops,
 * splitting each band into columns where the layout warrants it. Falls back to
 * a single whole-image band when projection finds nothing, so the caller
 * always gets at least one thing to recognise.
 */
export function segmentLines(source: HTMLCanvasElement, maxLines = 40): LineBand[] {
  const ctx = source.getContext("2d");
  if (!ctx) return [];
  const { data } = ctx.getImageData(0, 0, source.width, source.height);
  const profile = rowInkProfile(data, source.width, source.height);
  const ranges = bandsFromProfile(profile, source.width);

  const bands: LineBand[] = [];
  for (const range of ranges) {
    if (bands.length >= maxLines) break;
    const spans = columnSpans(data, source.width, range);
    if (spans.length <= 1) {
      const canvas = spans.length === 1
        ? cropCell(source, range, spans[0])
        : cropBand(source, range);
      if (canvas) bands.push({ canvas, top: range.start, height: range.end - range.start });
      continue;
    }
    for (const span of spans) {
      if (bands.length >= maxLines) break;
      const canvas = cropCell(source, range, span);
      if (canvas) bands.push({ canvas, top: range.start, height: range.end - range.start });
    }
  }

  if (!bands.length) {
    bands.push({ canvas: source, top: 0, height: source.height });
  }
  return bands;
}
