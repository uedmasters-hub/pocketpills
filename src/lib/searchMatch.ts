/**
 * Flexible search matching for typed and voice queries.
 *
 * Voice often emits a single compound ("lifeguard") or a stem ("Shankar")
 * while listings store spaced or longer forms ("Life Guard", "Shankarapur").
 */

export function normalizeSearchQuery(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactSearchText(text: string): string {
  return normalizeSearchQuery(text).replace(/\s+/g, "");
}

function tokenMatchesHay(token: string, hayTokens: string[], compactHay: string): boolean {
  if (!token) return true;
  if (compactHay.includes(token)) return true;
  return hayTokens.some((h) => {
    if (h === token) return true;
    if (h.startsWith(token)) return true;
    if (token.length >= 3 && h.includes(token)) return true;
    return false;
  });
}

/** True when `query` matches `haystack` as a phrase, compound, or partial stem. */
export function textMatchesQuery(haystack: string, query: string): boolean {
  const needle = normalizeSearchQuery(query);
  if (!needle) return true;
  const hay = normalizeSearchQuery(haystack);
  if (!hay) return false;
  if (hay.includes(needle)) return true;

  const compactHay = hay.replace(/\s+/g, "");
  const compactNeedle = needle.replace(/\s+/g, "");
  if (compactHay.includes(compactNeedle)) return true;

  const hayTokens = hay.split(" ").filter(Boolean);
  const needleTokens = needle.split(" ").filter(Boolean);
  return needleTokens.every((token) => tokenMatchesHay(token, hayTokens, compactHay));
}

/** Match a query against several fields as one bag of text (any-field combinations). */
export function fieldsMatchQuery(
  fields: Array<string | null | undefined>,
  query: string,
): boolean {
  return textMatchesQuery(fields.filter((f) => f != null && f !== "").join(" "), query);
}

/** How tightly a listing matches the query. Lower is better. */
export type SearchMatchTier = "exact" | "combination" | "also";

export const SEARCH_TIER_ORDER: Record<SearchMatchTier, number> = {
  exact: 0,
  combination: 1,
  also: 2,
};

function betterTier(a: SearchMatchTier | null, b: SearchMatchTier): SearchMatchTier {
  if (!a) return b;
  return SEARCH_TIER_ORDER[b] < SEARCH_TIER_ORDER[a] ? b : a;
}

/**
 * Classify a match:
 * - exact: whole word / same compound ("Shankar …", "Life Guard" for "lifeguard")
 * - combination: query is a prefix of a longer word ("Shankarapur")
 * - also: query sits inside another word ("Devshankara")
 */
export function rankSearchMatch(haystack: string, query: string): SearchMatchTier | null {
  const needle = normalizeSearchQuery(query);
  if (!needle) return null;
  if (!textMatchesQuery(haystack, query)) return null;

  const hay = normalizeSearchQuery(haystack);
  const hayTokens = hay.split(" ").filter(Boolean);
  const needleTokens = needle.split(" ").filter(Boolean);
  const compactNeedle = needle.replace(/\s+/g, "");
  const compactHay = hay.replace(/\s+/g, "");

  let best: SearchMatchTier | null = null;

  if (hay === needle || compactHay === compactNeedle) best = betterTier(best, "exact");
  if (needleTokens.every((nt) => hayTokens.some((ht) => ht === nt))) best = betterTier(best, "exact");

  let acc = "";
  for (const token of hayTokens) {
    acc += token;
    if (acc === compactNeedle) {
      best = betterTier(best, "exact");
      break;
    }
    if (acc.startsWith(compactNeedle) && acc.length > compactNeedle.length) {
      best = betterTier(best, "combination");
      break;
    }
    if (!compactNeedle.startsWith(acc)) break;
  }

  for (const ht of hayTokens) {
    if (ht === compactNeedle || needleTokens.some((nt) => ht === nt)) {
      best = betterTier(best, "exact");
      continue;
    }
    if (ht.startsWith(compactNeedle) || needleTokens.some((nt) => nt.length >= 2 && ht.startsWith(nt) && ht !== nt)) {
      best = betterTier(best, "combination");
      continue;
    }
    if (
      (compactNeedle.length >= 3 && ht.includes(compactNeedle) && !ht.startsWith(compactNeedle)) ||
      needleTokens.some((nt) => nt.length >= 3 && ht.includes(nt) && !ht.startsWith(nt))
    ) {
      best = betterTier(best, "also");
    }
  }

  if (compactHay.includes(compactNeedle) && !best) best = "also";
  return best;
}

/** Rank using the name first, then other fields. */
export function rankFieldsMatch(
  fields: Array<string | null | undefined>,
  query: string,
): SearchMatchTier | null {
  const list = fields.filter((f): f is string => f != null && f !== "");
  if (!list.length) return null;
  const primary = rankSearchMatch(list[0], query);
  if (primary) return primary;
  let best: SearchMatchTier | null = null;
  for (const field of list.slice(1)) {
    const tier = rankSearchMatch(field, query);
    if (tier) best = best ? betterTier(best, tier) : tier;
  }
  return best;
}

export function compareSearchTier(
  a: SearchMatchTier | null,
  b: SearchMatchTier | null,
): number {
  const oa = a ? SEARCH_TIER_ORDER[a] : 99;
  const ob = b ? SEARCH_TIER_ORDER[b] : 99;
  return oa - ob;
}

export function sortBySearchRank<T>(
  items: T[],
  query: string,
  haystack: (item: T) => Array<string | null | undefined> | string,
  prefer?: (item: T) => boolean,
): T[] {
  const needle = normalizeSearchQuery(query);
  if (!needle && !prefer) return items;
  return [...items].sort((a, b) => {
    if (prefer) {
      const pa = prefer(a) ? 0 : 1;
      const pb = prefer(b) ? 0 : 1;
      if (pa !== pb) return pa - pb;
    }
    if (!needle) return 0;
    const ha = haystack(a);
    const hb = haystack(b);
    const ra = Array.isArray(ha) ? rankFieldsMatch(ha, query) : rankSearchMatch(ha, query);
    const rb = Array.isArray(hb) ? rankFieldsMatch(hb, query) : rankSearchMatch(hb, query);
    const order = compareSearchTier(ra, rb);
    if (order !== 0) return order;
    const na = Array.isArray(ha) ? String(ha[0] || "") : ha;
    const nb = Array.isArray(hb) ? String(hb[0] || "") : hb;
    return na.localeCompare(nb, undefined, { sensitivity: "base" });
  });
}

export function shouldShowAlsoFound<T>(
  items: T[],
  index: number,
  tierOf: (item: T) => SearchMatchTier | null,
): boolean {
  if (tierOf(items[index]) !== "also") return false;
  if (index === 0) return true;
  return tierOf(items[index - 1]) !== "also";
}

export type HighlightPart = { text: string; match: boolean };

function escapeRegex(char: string): string {
  return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Array<{ start: number; end: number }> = [sorted[0]];
  for (const next of sorted.slice(1)) {
    const last = out[out.length - 1];
    if (next.start <= last.end) last.end = Math.max(last.end, next.end);
    else out.push({ ...next });
  }
  return out;
}

/** Ranges in the original string that should be bold for this query. */
export function highlightSearchRanges(text: string, query: string): Array<{ start: number; end: number }> {
  const compact = compactSearchText(query);
  if (!compact || !text) return [];
  const sep = "[^\\p{L}\\p{N}]*";
  const pattern = compact.split("").map(escapeRegex).join(sep);
  const ranges: Array<{ start: number; end: number }> = [];
  try {
    const re = new RegExp(pattern, "giu");
    for (const match of text.matchAll(re)) {
      if (match.index == null || !match[0]) continue;
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  } catch {
    return [];
  }
  return mergeRanges(ranges);
}

export function highlightSearchParts(text: string, query: string): HighlightPart[] {
  // Masked directory names ("Sai •••") must never be highlighted — matching
  // against the hidden tail would paint last names back onto the card.
  if (text.includes("•••")) return [{ text, match: false }];
  const ranges = highlightSearchRanges(text, query);
  if (!ranges.length) return [{ text, match: false }];
  const parts: HighlightPart[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) parts.push({ text: text.slice(cursor, range.start), match: false });
    parts.push({ text: text.slice(range.start, range.end), match: true });
    cursor = range.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts;
}
