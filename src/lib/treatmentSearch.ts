import { treatments, type Treatment } from "@/lib/data";
import { fieldsMatchQuery, sortBySearchRank } from "@/lib/searchMatch";

/** Extra symptom / alias terms for treatment search (EN + Nepali). */
const TREATMENT_ALIASES: Record<string, string[]> = {
  "weight-loss": ["obesity", "ozempic", "wegovy", "तौल", "मोटोपना", "weight"],
  "hair-loss": ["bald", "alopecia", "finasteride", "कपाल झर्ने", "रुखो कपाल"],
  "erectile-dysfunction": ["ed", "impotence", "viagra", "cialis", "यौन", "स्तंभन"],
  acne: ["pimple", "breakout", "मुँहासे", "दाग"],
  "birth-control": ["contraception", "pill", "गर्भनिरोधक"],
  uti: ["urine", "bladder", "urinary", "पिसाब"],
  "high-blood-pressure": ["hypertension", "bp", "blood pressure", "रक्तचाप"],
  diabetes: ["sugar", "insulin", "मधुमेह", "चिनी"],
  "acid-reflux": ["heartburn", "gerd", "acid", "एसिडिटी", "पेट पोल्ने"],
};

/**
 * Search treatments only — never mixes appointments, meds, or FAQ.
 */
export function searchTreatments(query: string, list: Treatment[] = treatments): Treatment[] {
  const needle = query.trim();
  if (!needle) return list;

  return sortBySearchRank(
    list.filter((t) => {
      const aliases = TREATMENT_ALIASES[t.slug] || [];
      const haystacks = [t.name, t.blurb, t.category, t.slug, ...aliases];
      return fieldsMatchQuery(haystacks, needle);
    }),
    needle,
    (t) => [t.name, t.blurb, t.category, t.slug, ...(TREATMENT_ALIASES[t.slug] || [])],
  );
}
