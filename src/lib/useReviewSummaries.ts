import { useEffect, useMemo, useState } from "react";
import { fetchReviewSummaries, type ReviewKind, type ReviewSummary } from "@/lib/reviewsApi";

export function useReviewSummaries(kind: ReviewKind, ids: string[]) {
  const key = useMemo(() => [...new Set(ids.filter(Boolean))].sort().join(","), [ids]);
  const [map, setMap] = useState<Record<string, ReviewSummary>>({});
  const [ready, setReady] = useState(!key);

  useEffect(() => {
    if (!key) {
      setMap({});
      setReady(true);
      return;
    }
    let live = true;
    setReady(false);
    void fetchReviewSummaries(kind, key.split(",")).then((next) => {
      if (!live) return;
      setMap(next);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [kind, key]);

  return { map, ready };
}
