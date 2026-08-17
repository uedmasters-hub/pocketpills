import { highlightSearchParts } from "@/lib/searchMatch";

/** Bold the letters that match the current search query; keep the rest unchanged. */
export function HighlightedText({
  text,
  query,
  enabled = true,
}: {
  text: string;
  query?: string;
  /** False for masked / unclaimed names so hidden last names cannot leak. */
  enabled?: boolean;
}) {
  const masked = text.includes("•••");
  if (!enabled || masked || !query?.trim()) return <>{text}</>;
  const parts = highlightSearchParts(text, query);
  if (parts.length === 1 && !parts[0].match) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <strong key={i} className="font-bold">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
