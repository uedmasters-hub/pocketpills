import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { DetailSection } from "@/components/DetailSection";
import { RatingStars } from "@/components/reviews/RatingChip";
import { ReviewsPanelSkeleton } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import {
  deleteOwnReview,
  fetchReviews,
  reportReview,
  writeReview,
  type ReviewItem,
  type ReviewKind,
  type ReviewSort,
  type ReviewSummary,
} from "@/lib/reviewsApi";
import { useUser } from "@/lib/user";

function reviewDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "short" });
  return `${day} ${month}, ${d.getFullYear()}`;
}

function reviewerInitial(name: string) {
  const ch = name.trim().charAt(0);
  return ch ? ch.toUpperCase() : "P";
}

function VerifiedPatientBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-wellness-subtle px-2 py-0.5 text-2xs font-semibold text-wellness">
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
        <path
          d="M2.4 6.2 4.7 8.4 9.6 3.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}

function ReviewTopicPills({ topics, tx }: { topics: string[]; tx: (s: string) => string }) {
  return (
    <div className="min-w-0">
      <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-tertiary">
        {tx("Review topics")}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-4">
        {topics.map((t) => (
          <span
            key={t}
            className="rounded-full bg-[color:var(--pp-primary-300)] px-3.5 py-1.5 text-xs font-medium text-[color:var(--pp-primary-950)]"
          >
            {tx(t)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ReviewsPanel({
  kind,
  subjectId,
  listingName,
  canWrite = true,
  owned = false,
  onSummary,
  topics,
}: {
  kind: ReviewKind;
  subjectId: string;
  listingName: string;
  canWrite?: boolean;
  owned?: boolean;
  onSummary?: (summary: ReviewSummary) => void;
  topics?: string[];
}) {
  const { tx } = useI18n();
  const { signedIn, user, displayName } = useUser();
  const who = signedIn && user?.email ? { email: user.email, name: displayName } : null;

  const [sort, setSort] = useState<ReviewSort>("recent");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ReviewItem[]>([]);
  const [mine, setMine] = useState<ReviewItem | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [writing, setWriting] = useState(false);
  const [reported, setReported] = useState<Record<string, boolean>>({});

  const load = async (nextPage = page, nextSort = sort) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetchReviews({ kind, id: subjectId, page: nextPage, sort: nextSort, who });
      setRows(res.data);
      setMine(res.mine);
      setSummary(res.summary);
      setTotalPages(res.pagination.totalPages);
      onSummary?.(res.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : tx("Could not load reviews."));
      onSummary?.({
        subjectId,
        average: 0,
        count: 0,
        histogram: [0, 0, 0, 0, 0],
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load(1, sort);
    // identity + listing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, subjectId, sort, who?.email]);

  const histogramTotal = Math.max(1, summary?.count || 0);
  const hasReviews = Boolean(summary && summary.count > 0);

  const writeCta =
    canWrite && !owned ? (
      signedIn ? (
        writing ? null : (
          <button
            type="button"
            className="rounded-full bg-[color:var(--pp-primary-950)] px-5 py-2.5 text-sm font-medium text-white"
            onClick={() => setWriting(true)}
          >
            {mine ? tx("Edit your review") : tx("Write a review")}
          </button>
        )
      ) : (
        <Link
          to="/login"
          className="rounded-full bg-[color:var(--pp-primary-950)] px-5 py-2.5 text-sm font-medium text-white"
        >
          {tx("Write a review")}
        </Link>
      )
    ) : null;

  const sortAndWrite = (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {hasReviews ? (
        <label className="inline-flex items-center gap-2.5 text-sm text-ink-tertiary">
          {tx("Sort by:")}
          <span className="relative inline-flex">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as ReviewSort);
                setPage(1);
              }}
              className="h-10 appearance-none rounded-full border border-line bg-white pl-4 pr-10 text-sm font-medium leading-none text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
              aria-label={tx("Sort reviews")}
            >
              <option value="recent">{tx("Most recent")}</option>
              <option value="high">{tx("Highest")}</option>
              <option value="low">{tx("Lowest")}</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3.5 grid w-4 place-items-center text-[color:var(--pp-primary-950)]">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </label>
      ) : (
        <span />
      )}
    </div>
  );

  return (
    <DetailSection title={tx("Patient reviews")} meta={writeCta}>

      {busy && !hasReviews && !mine ? (
        <div>
          <ReviewsPanelSkeleton heading={false} label={tx("Loading reviews")} />
        </div>
      ) : null}

      {hasReviews ? (
        <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
          <div className="inline-flex items-center gap-5 rounded-[1.5rem] border border-line bg-white px-5 py-4">
            <div className="shrink-0">
              <p className="font-display text-[1.75rem] font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                {summary && summary.count ? summary.average.toFixed(1) : "—"}
              </p>
              <p className="mt-0.5 text-2xs text-ink-tertiary">{tx("out of 5")}</p>
              <div className="mt-1.5">
                <RatingStars value={summary?.average || 0} size="sm" />
              </div>
              <p className="mt-1.5 text-2xs text-ink-tertiary">
                {summary && summary.count
                  ? tx("Based on {n} reviews").replace("{n}", String(summary.count))
                  : tx("No reviews yet")}
              </p>
            </div>
            <ul className="shrink-0 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = summary?.histogram[star - 1] || 0;
                const pct = (n / histogramTotal) * 100;
                return (
                  <li key={star} className="flex items-center gap-2 text-2xs text-ink-tertiary">
                    <span className="w-[3.4rem] shrink-0">
                      {star} {tx(star === 1 ? "star" : "stars")}
                    </span>
                    <span className="h-1.5 w-[5.5rem] shrink-0 overflow-hidden rounded-full bg-[color:var(--pp-primary-200)]">
                      <span className="block h-full rounded-full bg-[#E8B931]" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-3.5 text-right tnum">{n}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          {topics?.length ? (
            <div className="min-w-0 max-w-sm">
              <ReviewTopicPills topics={topics} tx={tx} />
            </div>
          ) : null}
        </div>
      ) : topics?.length && !busy ? (
        <div>
          <ReviewTopicPills topics={topics} tx={tx} />
        </div>
      ) : null}

      {!hasReviews && !busy && !mine && !writing ? (
        <p className="mt-4 text-sm text-ink-tertiary">
          {tx("Be the first to review {name}.").replace("{name}", listingName)}{" "}
          {canWrite && !owned ? (
            signedIn ? (
              <button
                type="button"
                className="font-medium text-[color:var(--pp-primary-950)] underline underline-offset-2"
                onClick={() => setWriting(true)}
              >
                {tx("Review Now")}
              </button>
            ) : (
              <Link
                to="/login"
                className="font-medium text-[color:var(--pp-primary-950)] underline underline-offset-2"
              >
                {tx("Review Now")}
              </Link>
            )
          ) : null}
        </p>
      ) : null}

      {mine?.status === "pending" ? (
        <p className="mt-4 text-sm text-ink-tertiary">
          {tx("Your review is waiting for PocketPills to approve it. Only you can see it until then.")}
        </p>
      ) : null}

      {!writing && hasReviews ? sortAndWrite : null}

      {canWrite && !owned && signedIn && writing ? (
        <div className="mt-4">
          <ReviewForm
            listingName={listingName}
            initial={mine}
            busy={busy}
            onCancel={() => setWriting(false)}
            onSave={async (payload) => {
              if (!who) return;
              await writeReview({ kind, subjectId, ...payload, who });
              setWriting(false);
              await load(1, sort);
            }}
          />
        </div>
      ) : null}

      {owned && (
        <p className="mt-4 rounded-2xl border border-line bg-[color:var(--pp-primary-100)] px-5 py-3 text-sm text-[color:var(--pp-primary-950)]">
          {tx("You can read patient feedback here. Hide, show, and delete are reserved for the PocketPills platform team.")}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {rows.length > 0 ? (
      <ul className="mt-5 divide-y divide-[color:var(--border-divider)] overflow-hidden rounded-2xl border border-line bg-white">
        {rows.map((row) => (
          <li key={row.id} className="px-5 py-5">
            <div className="flex items-start gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-300)] text-sm font-semibold text-[color:var(--pp-primary-950)]">
                {reviewerInitial(row.reviewerName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[color:var(--pp-primary-950)]">
                    {row.reviewerName}
                    {row.status === "pending" ? (
                      <span className="rounded-full bg-[color:var(--pp-primary-300)] px-2 py-0.5 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                        {tx("Awaiting approval")}
                      </span>
                    ) : (
                      <VerifiedPatientBadge label={tx("Verified Patient")} />
                    )}
                  </p>
                  <p className="text-xs text-ink-tertiary">{reviewDate(row.createdAt)}</p>
                </div>
                <div className="mt-1.5">
                  <RatingStars value={row.rating} size="sm" />
                </div>
                {row.title ? (
                  <p className="mt-2.5 font-semibold text-[color:var(--pp-primary-950)]">{row.title}</p>
                ) : null}
                <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{row.body}</p>
                <div className="mt-3 flex justify-end gap-3 text-xs font-medium">
                  {row.mine && who ? (
                    <>
                      <button type="button" className="text-[color:var(--pp-violet)] hover:underline" onClick={() => setWriting(true)}>
                        {tx("Edit")}
                      </button>
                      <button
                        type="button"
                        className="text-danger hover:underline"
                        onClick={async () => {
                          if (!who) return;
                          await deleteOwnReview(row.id, who);
                          await load(1, sort);
                        }}
                      >
                        {tx("Remove")}
                      </button>
                    </>
                  ) : who && !owned ? (
                    reported[row.id] ? (
                      <span className="text-ink-tertiary">{tx("Reported")}</span>
                    ) : (
                      <button
                        type="button"
                        className="font-normal text-[color:var(--neutral-500)] hover:text-[color:var(--pp-primary-950)]"
                        onClick={async () => {
                          await reportReview(row.id, who);
                          setReported((prev) => ({ ...prev, [row.id]: true }));
                        }}
                      >
                        {tx("Report")}
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      ) : null}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-full bg-[color:var(--pp-primary-100)] px-4 py-2 text-sm disabled:opacity-45"
            onClick={() => {
              const next = page - 1;
              setPage(next);
              void load(next, sort);
            }}
          >
            {tx("Previous")}
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            className="rounded-full bg-white px-4 py-2 text-sm shadow-[0_6px_16px_rgba(24,7,48,0.08)] disabled:opacity-45"
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void load(next, sort);
            }}
          >
            {tx("Next")}
          </button>
        </div>
      )}
    </DetailSection>
  );
}

function ReviewForm({
  listingName,
  initial,
  busy,
  onSave,
  onCancel,
}: {
  listingName: string;
  initial: ReviewItem | null;
  busy: boolean;
  onSave: (payload: { rating: number; title: string; body: string }) => Promise<void>;
  onCancel?: () => void;
}) {
  const { tx } = useI18n();
  const [rating, setRating] = useState(initial?.rating || 0);
  const [title, setTitle] = useState(initial?.title || "");
  const [body, setBody] = useState(initial?.body || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ready = rating >= 1 && body.trim().length >= 20;

  return (
    <form
      className="rounded-2xl border border-line bg-white p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ready) return;
        setSaving(true);
        setError("");
        try {
          await onSave({ rating, title: title.trim(), body: body.trim() });
        } catch (err) {
          setError(err instanceof Error ? err.message : tx("Could not save your review."));
        } finally {
          setSaving(false);
        }
      }}
    >
      <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">
        {initial ? tx("Update your review") : tx("Write a review")}
      </p>
      <p className="mt-1 text-sm text-ink-tertiary">{tx("Share how your visit went with {name}. PocketPills will review it before it appears publicly.").replace("{name}", listingName)}</p>
      <div className="mt-4">
        <RatingStars value={rating} size="lg" interactive onChange={setRating} label={tx("Your rating")} />
      </div>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Headline (optional)")}</span>
        <input
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
          placeholder={tx("What stood out?")}
        />
      </label>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Your experience")}</span>
        <textarea
          value={body}
          maxLength={2000}
          rows={4}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm leading-relaxed text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
          placeholder={tx("At least 20 characters. Be specific and fair.")}
        />
        <span className="mt-1 block text-2xs text-ink-tertiary tnum">{body.trim().length}/2000</span>
      </label>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={saving || busy || !ready}>{saving ? tx("Saving…") : tx("Publish review")}</Button>
        {onCancel ? (
          <button type="button" className="px-3 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]" onClick={onCancel}>
            {tx("Cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
