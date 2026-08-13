import { drugs, type Drug } from "@/lib/data";
import { textMatchesQuery } from "@/lib/pageSearch";

/**
 * Search medications only — brand / generic / class.
 * Never mixes treatments, appointments, or FAQ.
 */
export function searchDrugs(query: string, list: Drug[] = drugs): Drug[] {
  const needle = query.trim();
  if (!needle) return list;

  return list.filter((d) => {
    const haystacks = [d.name, d.generic ?? "", d.cls, d.slug];
    return haystacks.some((h) => textMatchesQuery(h, needle));
  });
}
