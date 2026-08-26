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

/** Turn the row profile into contiguous ink ranges, merging tiny gaps. */
function bandsFromProfile(profile: number[], width: number): Range[] {
  const threshold = Math.max(2, Math.floor(width * INK_ROW_RATIO));
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
 * Segment a (preferably contrast-stretched) canvas into line-band crops.
 * Falls back to a single whole-image band when projection finds nothing,
 * so the caller always gets at least one thing to recognise.
 */
export function segmentLines(source: HTMLCanvasElement, maxLines = 24): LineBand[] {
  const ctx = source.getContext("2d");
  if (!ctx) return [];
  const { data } = ctx.getImageData(0, 0, source.width, source.height);
  const profile = rowInkProfile(data, source.width, source.height);
  const ranges = bandsFromProfile(profile, source.width);

  const bands: LineBand[] = [];
  for (const range of ranges.slice(0, maxLines)) {
    const canvas = cropBand(source, range);
    if (canvas) bands.push({ canvas, top: range.start, height: range.end - range.start });
  }

  if (!bands.length) {
    bands.push({ canvas: source, top: 0, height: source.height });
  }
  return bands;
}
