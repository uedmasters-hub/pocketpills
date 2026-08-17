import { drugs, type Drug } from "@/lib/data";
import { fieldsMatchQuery, sortBySearchRank } from "@/lib/searchMatch";

/**
 * Search medications only — brand / generic / class.
 * Never mixes treatments, appointments, or FAQ.
 */
export function searchDrugs(query: string, list: Drug[] = drugs): Drug[] {
  const needle = query.trim();
  if (!needle) return list;

  return sortBySearchRank(
    list.filter((d) => fieldsMatchQuery([d.name, d.generic ?? "", d.cls, d.slug], needle)),
    needle,
    (d) => [d.name, d.generic ?? "", d.cls, d.slug],
  );
}
