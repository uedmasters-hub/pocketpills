import { type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import {
  rankFieldsMatch,
  rankSearchMatch,
  shouldShowAlsoFound,
  type SearchMatchTier,
} from "@/lib/searchMatch";

/** Full-width divider used between close matches and weaker / infix hits. */
export function AlsoFoundHeading({ as: Tag = "div" }: { as?: "div" | "li" }) {
  const { tx } = useI18n();
  return (
    <Tag className="col-span-full list-none pt-3">
      <p className="pp-caps text-ink-tertiary">{tx("Also found")}</p>
    </Tag>
  );
}

export function mapSearchHits<T>(
  items: T[],
  query: string,
  haystack: (item: T) => Array<string | null | undefined> | string,
  render: (item: T) => ReactNode,
  headingAs: "div" | "li" = "div",
): ReactNode[] {
  const q = query.trim();
  const tierOf = (item: T): SearchMatchTier | null => {
    if (!q) return null;
    const h = haystack(item);
    return Array.isArray(h) ? rankFieldsMatch(h, q) : rankSearchMatch(h, q);
  };
  const out: ReactNode[] = [];
  items.forEach((item, i) => {
    if (q && shouldShowAlsoFound(items, i, tierOf)) {
      out.push(<AlsoFoundHeading key="also-found" as={headingAs} />);
    }
    out.push(render(item));
  });
  return out;
}
