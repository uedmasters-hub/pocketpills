import {
  listMedBasket,
  markPrescriptionOnSlugs,
  resetPrescriptionFiles,
  setDraftRxUpload,
  type DraftRxFound,
} from "@/lib/medBasketDraft";
import {
  fileToUpload,
  isReadableImage,
  matchSelectedDrug,
  revokeUploads,
  scanPrescriptions,
} from "@/lib/rxOcr";

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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

  const upload = fileToUpload(file);
  try {
    onProgress?.("Reading your prescription", 6);
    const result = await scanPrescriptions([upload], (label, pct) => {
      if (stopped()) return;
      onProgress?.(label, pct);
    });
    if (stopped()) return { matched: 0, found: [] };

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
    for (const med of result.meds) {
      const key = (med.slug ?? med.name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({
        name: med.name,
        strength: med.strength,
        slug: med.slug,
        onList: Boolean(med.slug && onList.has(med.slug)),
        directions: med.directions || undefined,
      });
    }

    const matched = onList.size;
    setDraftRxUpload({
      fileName: file.name,
      matched,
      found,
      ocrText: result.text,
      ocrAvailable: result.ocrAvailable,
    });
    if (!found.length) {
      return {
        matched,
        found,
        error: result.ocrAvailable
          ? "Prescription medicines unavailable. We couldn’t read names on this photo."
          : "Prescription reading isn’t available right now. Try another photo, or continue to see a doctor.",
      };
    }
    return { matched, found };
  } catch {
    setDraftRxUpload({ fileName: file.name, matched: 0, found: [], ocrAvailable: false });
    return { matched: 0, found: [], error: "Prescription medicines unavailable. We couldn’t read that photo." };
  } finally {
    revokeUploads([upload]);
  }
}
