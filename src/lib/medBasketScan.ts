import {
  draftRxPreviewSrc,
  getDraftRxFile,
  getDraftRxOriginal,
  getDraftRxUpload,
  listMedBasket,
  markPrescriptionOnSlugs,
  patchDraftRxFound,
  resetPrescriptionFiles,
  setDraftRxArchivePreview,
  setDraftRxFile,
  setDraftRxOriginal,
  setDraftRxPreviewMemory,
  setDraftRxUpload,
  type DraftRxFound,
} from "@/lib/medBasketDraft";
import { addPrescriptionReport } from "@/lib/patientRecords";
import { segmentLines } from "@/lib/localHtr/lineSegments";
import {
  fileToUpload,
  isReadableImage,
  matchSelectedDrug,
  medFromReadings,
  parsePrescriptionText,
  readHandwrittenRxLines,
  revokeUploads,
  scanPrescriptions,
} from "@/lib/rxOcr";

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fileToPreviewDataUrl(file: File, maxEdge = 720): Promise<string | undefined> {
  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("preview"));
      image.src = blobUrl;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height, 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", maxEdge > 800 ? 0.82 : 0.68);
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export type RxCropBox = { x: number; y: number; w: number; h: number };

/** Cut the chosen area from a prescription photo before OCR. */
export async function cropImageFile(file: File, box: RxCropBox): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("crop"));
      image.src = url;
    });
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;
    const sx = Math.max(0, Math.round(box.x * nw));
    const sy = Math.max(0, Math.round(box.y * nh));
    const sw = Math.max(16, Math.min(nw - sx, Math.round(box.w * nw)));
    const sh = Math.max(16, Math.min(nh - sy, Math.round(box.h * nh)));
    const boost = Math.min(2.4, Math.max(1, 1200 / Math.max(sw, sh)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(16, Math.round(sw * boost));
    canvas.height = Math.max(16, Math.round(sh * boost));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("crop");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop"))), "image/jpeg", 0.92);
    });
    return new File([blob], file.name, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImageFile(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("preview"));
    };
    img.src = url;
  });
}

function mentions(line: string, name: string) {
  const a = line.toLowerCase();
  const n = name.toLowerCase().trim();
  if (!n || n.length < 3) return false;
  if (a.includes(n)) return true;
  return n.split(/\s+/).filter((t) => t.length >= 3).every((t) => a.includes(t));
}

function bandToSnippet(canvas: HTMLCanvasElement): string {
  const targetW = 200;
  const targetH = 72;
  const srcH = canvas.height;
  const aspect = targetW / targetH;
  const srcW = Math.min(canvas.width, Math.max(1, Math.round(srcH * aspect * 1.25)));
  const out = document.createElement("canvas");
  out.width = targetW;
  out.height = targetH;
  const ctx = out.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", 0.6);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvas, 0, 0, srcW, srcH, 0, 0, targetW, targetH);
  return out.toDataURL("image/jpeg", 0.72);
}

function snippetBoxForBand(
  band: { left: number; top: number; width: number; height: number },
  canvasW: number,
  canvasH: number,
): RxCropBox {
  const aspect = 200 / 72;
  const srcW = Math.min(band.width, Math.max(1, band.height * aspect * 1.25));
  const padX = 0.008;
  const padY = 0.006;
  const x = Math.max(0, band.left / canvasW - padX);
  const y = Math.max(0, band.top / canvasH - padY);
  const w = Math.min(1 - x, srcW / canvasW + padX * 2);
  const h = Math.min(1 - y, band.height / canvasH + padY * 2);
  return { x, y, w: Math.max(0.04, w), h: Math.max(0.03, h) };
}

type MedSnippet = { dataUrl: string; box: RxCropBox };

/** Cut a snippet of the photo for each medicine, as close as we can to that line. */
async function snippetsForMeds(file: File, meds: { name: string }[], ocrText: string): Promise<(MedSnippet | undefined)[]> {
  if (!meds.length) return [];
  try {
    const { img, url } = await loadImageFile(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1400 / Math.max(img.width, img.height, 1));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    URL.revokeObjectURL(url);
    if (!ctx) return meds.map(() => undefined);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const bands = segmentLines(canvas).sort((a, b) => a.top - b.top);
    if (!bands.length) return meds.map(() => undefined);
    const ocrLines = ocrText
      .split(/\n+/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter((l) => l.length >= 3);
    const used = new Set<number>();
    const pickBand = (y: number) => {
      let best = -1;
      let bestDist = Infinity;
      bands.forEach((b, i) => {
        if (used.has(i)) return;
        const mid = b.top + b.height / 2;
        const dist = Math.abs(mid - y);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    };
    return meds.map((med, i) => {
      const lineIdx = ocrLines.findIndex((l) => mentions(l, med.name));
      const y =
        lineIdx >= 0 && ocrLines.length
          ? ((lineIdx + 0.5) / ocrLines.length) * canvas.height
          : ((i + 0.5) / meds.length) * canvas.height;
      const bandIdx = pickBand(y);
      if (bandIdx < 0) return undefined;
      used.add(bandIdx);
      const band = bands[bandIdx];
      return {
        dataUrl: bandToSnippet(band.canvas),
        box: snippetBoxForBand(band, canvas.width, canvas.height),
      };
    });
  } catch {
    return meds.map(() => undefined);
  }
}

async function fileFromSrc(src: string | undefined, fileName: string): Promise<File | null> {
  if (!src) return null;
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type || "image/jpeg" });
  } catch {
    return null;
  }
}

async function snippetFromCrop(file: File): Promise<string | undefined> {
  const { img, url } = await loadImageFile(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return bandToSnippet(canvas);
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Re-read one highlighted area on the already-scanned prescription. */
export async function rescanRxFoundAt(
  index: number,
  box: RxCropBox,
  onProgress?: (label: string, pct: number) => void,
  cancelled?: () => boolean,
): Promise<{ ok: boolean; error?: string }> {
  const rx = getDraftRxUpload();
  if (!rx || index < 0 || index >= rx.found.length) {
    return { ok: false, error: "That medicine isn’t on this prescription anymore." };
  }
  const stopped = () => cancelled?.() === true;
  const file =
    getDraftRxFile(rx.fileName) ?? (await fileFromSrc(draftRxPreviewSrc(rx), rx.fileName));
  if (!file) {
    return { ok: false, error: "We couldn’t open that photo. Try uploading it again." };
  }
  setDraftRxFile(rx.fileName, file);

  onProgress?.("Reading this area", 12);
  let upload: ReturnType<typeof fileToUpload> | null = null;
  try {
    const cut = await cropImageFile(file, box);
    if (stopped()) return { ok: false };
    const snippetDataUrl = (await snippetFromCrop(cut)) ?? rx.found[index].snippetDataUrl;
    const lineMeds = await readHandwrittenRxLines(cut, (label, pct) => {
      if (stopped()) return;
      onProgress?.(label, pct);
    });
    if (stopped()) return { ok: false };

    const current = rx.found[index];
    let hit =
      lineMeds.find((row) => mentions(row.name, current.name) || mentions(current.name, row.name)) ??
      lineMeds[0];
    if (!hit) {
      upload = fileToUpload(cut);
      const extra = await scanPrescriptions([upload], (label, pct) => {
        if (stopped()) return;
        onProgress?.(label, pct);
      });
      const parsed = medFromReadings([extra.text, ...extra.meds.map((m) => m.name)].filter(Boolean));
      const med = extra.meds[0];
      if (parsed || med) {
        hit = {
          name: parsed?.name || med?.name || "",
          strength: parsed?.strength || med?.strength || "",
          directions: parsed?.directions || med?.directions || "",
          known: parsed?.known ?? false,
          raw: parsed?.raw || extra.text,
          snippetDataUrl: snippetDataUrl ?? "",
          box,
        };
      }
    }
    if (stopped()) return { ok: false };

    const name = hit?.name.trim() || current.name;
    const catalog = name ? parsePrescriptionText(name).meds[0] : undefined;
    const onList = Boolean(catalog?.slug && listMedBasket().some((row) => row.slug === catalog.slug));
    if (catalog?.slug) markPrescriptionOnSlugs(rx.fileName, [catalog.slug]);
    patchDraftRxFound(index, {
      snippetDataUrl,
      snippetBox: box,
      ...(name
        ? {
            name,
            strength: hit?.strength || current.strength,
            slug: catalog?.slug,
            onList,
            directions: hit?.directions || current.directions,
          }
        : {}),
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "We couldn’t read that area. Move the box and try again." };
  } finally {
    if (upload) revokeUploads([upload]);
  }
}

/** Keep the uncropped photo for profile / full view. Crop is only for scanning. */
export async function rememberOriginalRxPhoto(file: File) {
  if (!isReadableImage(file)) return;
  setDraftRxOriginal(file);
  const archivePreview = await fileToPreviewDataUrl(file, 1400);
  setDraftRxArchivePreview(archivePreview);
  const rx = getDraftRxUpload();
  addPrescriptionReport("self", {
    fileName: file.name,
    previewDataUrl: archivePreview,
    medicines: rx?.found.map((row) => row.name) ?? [],
    replacePreview: true,
  });
}

/** Scan a prescription photo and mark / add matching medicines on the draft list. */
export async function applyPrescriptionFile(
  file: File,
  onProgress?: (label: string, pct: number) => void,
  cancelled?: () => boolean,
): Promise<{ matched: number; found: DraftRxFound[]; error?: string }> {
  const stopped = () => cancelled?.() === true;
  if (!isReadableImage(file)) {
    setDraftRxUpload({ fileName: file.name, matched: 0, found: [], ocrAvailable: false });
    return { matched: 0, found: [], error: "Use a photo of the prescription so we can match your list." };
  }

  const original = getDraftRxOriginal() ?? file;
  const liveUrl = URL.createObjectURL(file);
  setDraftRxFile(file.name, file);
  setDraftRxPreviewMemory(file.name, liveUrl);
  setDraftRxUpload({ fileName: file.name, matched: 0, found: [], reading: true });

  const upload = fileToUpload(file);
  let previewDataUrl: string | undefined;
  try {
    const archivePreview = await fileToPreviewDataUrl(original, 1400);
    previewDataUrl = original === file ? archivePreview : await fileToPreviewDataUrl(file, 720);
    setDraftRxArchivePreview(archivePreview);
    if (!stopped()) {
      setDraftRxUpload({ fileName: file.name, matched: 0, found: [], previewDataUrl, reading: true });
      addPrescriptionReport("self", {
        fileName: file.name,
        previewDataUrl: archivePreview,
        medicines: [],
        replacePreview: true,
      });
    }
    onProgress?.("Reading your prescription", 6);
    const lineMeds = await readHandwrittenRxLines(file, (label, pct) => {
      if (stopped()) return;
      onProgress?.(label, pct);
    });
    if (stopped()) return { matched: 0, found: [] };

    const stillThisFile = () => getDraftRxUpload()?.fileName === file.name;
    if (!stillThisFile()) return { matched: 0, found: [] };

    const hwText = lineMeds.map((row) => row.raw).join("\n");
    let result = hwText
      ? { ...parsePrescriptionText(hwText), ocrAvailable: true }
      : await scanPrescriptions([upload], (label, pct) => {
          if (stopped()) return;
          onProgress?.(label, pct);
        });
    if (stopped()) return { matched: 0, found: [] };
    if (!stillThisFile()) return { matched: 0, found: [] };

    onProgress?.("Matching your list", 100);
    resetPrescriptionFiles();
    const current = listMedBasket();
    const matchedSlugs = current
      .filter((row) => matchSelectedDrug(row, result).status === "matched")
      .map((row) => row.slug);
    for (const slug of matchedSlugs) {
      if (stopped()) return { matched: 0, found: [] };
      await sleep(140);
      markPrescriptionOnSlugs(file.name, [slug]);
    }

    const onList = new Set(listMedBasket().filter((row) => row.prescriptionFile).map((row) => row.slug));
    const found: DraftRxFound[] = [];
    const seen = new Set<string>();
    const pushFound = (row: DraftRxFound) => {
      const key = (row.slug ?? row.name).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      found.push({ ...row, onList: Boolean(row.slug && onList.has(row.slug)) });
    };

    if (lineMeds.length) {
      for (const line of lineMeds) {
        const catalog = result.meds.find(
          (med) =>
            med.name.toLowerCase() === line.name.toLowerCase() ||
            mentions(med.name, line.name) ||
            mentions(line.name, med.name),
        );
        pushFound({
          name: line.name,
          strength: catalog?.strength || line.strength,
          slug: catalog?.slug,
          onList: false,
          directions: catalog?.directions || line.directions || undefined,
          snippetDataUrl: line.snippetDataUrl,
          snippetBox: line.box,
        });
      }
    } else {
      for (const med of result.meds) {
        pushFound({
          name: med.name,
          strength: med.strength,
          slug: med.slug,
          onList: false,
          directions: med.directions || undefined,
        });
      }
    }

    const matched = onList.size;
    if (!stillThisFile()) return { matched: 0, found: [] };
    onProgress?.("Preparing previews", 100);
    const snippets = lineMeds.length ? [] : found.length ? await snippetsForMeds(file, found, result.text) : [];
    const withSnippets = found.map((row, i) =>
      snippets[i]
        ? { ...row, snippetDataUrl: snippets[i].dataUrl, snippetBox: snippets[i].box }
        : row,
    );
    if (!stillThisFile()) return { matched: 0, found: withSnippets };
    setDraftRxUpload({
      fileName: file.name,
      matched,
      found: withSnippets,
      ocrText: result.text,
      ocrAvailable: result.ocrAvailable,
      previewDataUrl,
    });
    addPrescriptionReport("self", {
      fileName: file.name,
      medicines: withSnippets.map((row) => row.name),
    });
    if (!withSnippets.length) {
      return {
        matched,
        found: withSnippets,
        error: result.ocrAvailable
          ? "Prescription medicines unavailable. We couldn’t read names on this photo."
          : "Prescription reading isn’t available right now. Try another photo, or continue to see a doctor.",
      };
    }
    return { matched, found: withSnippets };
  } catch {
    if (getDraftRxUpload()?.fileName === file.name) {
      setDraftRxUpload({
        fileName: file.name,
        matched: 0,
        found: [],
        previewDataUrl,
        ocrAvailable: false,
      });
      addPrescriptionReport("self", {
        fileName: file.name,
        medicines: [],
      });
    }
    return { matched: 0, found: [], error: "Prescription medicines unavailable. We couldn’t read that photo." };
  } finally {
    revokeUploads([upload]);
  }
}
