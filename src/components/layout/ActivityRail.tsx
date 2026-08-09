import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/lib/user";
import { pendingRows, profileChecklist } from "@/lib/profile";
import { useRightRail } from "@/lib/rightRail";
import {
  getOrders,
  statusMeta,
  transferStatusLabel,
  transferStepIndex,
  TRANSFER_TRACK_STEPS,
  typeMeta,
  type Order,
} from "@/lib/orders";

function isActiveOrder(o: Order) {
  return o.status !== "delivered" && o.status !== "cancelled";
}

const FILL_TRACK_STEPS = ["Placed", "Processing", "Out for delivery", "Delivered"] as const;

function fillStepIndex(status: Order["status"]) {
  if (status === "verifying") return 0;
  if (status === "processing") return 1;
  if (status === "out_for_delivery") return 2;
  if (status === "delivered") return 3;
  return 0;
}

function orderAccent(o: Order) {
  if (o.status === "out_for_delivery") return "var(--secondary-800)";
  if (o.type === "transfer") return "var(--pp-violet)";
  return "var(--pp-primary-950)";
}

function TrackSegments({
  steps,
  step,
  accent,
}: {
  steps: readonly string[];
  step: number;
  accent: string;
}) {
  return (
    <ol className="mt-2.5 flex gap-1" aria-hidden>
      {steps.map((label, i) => (
        <li key={label} className="min-w-0 flex-1">
          <span
            className="block h-1 rounded-full"
            style={{
              background: i <= step ? accent : "var(--pp-primary-300)",
            }}
          />
        </li>
      ))}
    </ol>
  );
}

function LiveOrderCard({ o, onClick }: { o: Order; onClick: () => void }) {
  const isTransfer = o.type === "transfer";
  const accent = orderAccent(o);
  const steps = isTransfer ? TRANSFER_TRACK_STEPS : FILL_TRACK_STEPS;
  const step = isTransfer ? transferStepIndex(o.status) : fillStepIndex(o.status);
  const cue = isTransfer ? transferStatusLabel(o.status) : statusMeta[o.status].label;
  const title = o.items[0]?.name ?? (isTransfer ? "Prescription transfer" : typeMeta[o.type].label);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl bg-white px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-[color:var(--pp-primary-950)]">{title}</span>
        <span className="shrink-0 text-ink-tertiary" aria-hidden>
          ›
        </span>
      </span>

      <TrackSegments steps={steps} step={step} accent={accent} />

      <span className="mt-2 block text-xs font-medium" style={{ color: accent }}>
        {cue}
      </span>
    </button>
  );
}

function ActivityBody() {
  const nav = useNavigate();
  const { user } = useUser();
  const pending = pendingRows(user);
  const required = profileChecklist(user).filter((r) => r.required);
  const profileDone = required.filter((r) => r.done).length;
  const profileTotal = required.length;
  const active = getOrders().filter(isActiveOrder);
  const empty = pending.length === 0 && active.length === 0;
  const progress = profileTotal > 0 ? profileDone / profileTotal : 1;

  if (empty) {
    return (
      <div className="rounded-2xl bg-white px-5 py-6">
        <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">You’re all caught up</p>
        <p className="mt-1 text-xs text-ink-tertiary">No pending tasks or live orders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <section className="overflow-hidden rounded-2xl bg-white">
          <div className="border-b border-line px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
                  Complete your profile
                </p>
                <p className="mt-0.5 text-xs text-ink-tertiary">
                  {profileDone} of {profileTotal} done · {pending.length} left
                </p>
              </div>
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xs font-medium text-[color:var(--pp-primary-950)]"
                style={{
                  background: `conic-gradient(var(--pp-primary-950) ${progress * 360}deg, var(--pp-primary-300) 0)`,
                }}
                aria-hidden
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white">
                  {Math.round(progress * 100)}%
                </span>
              </span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[color:var(--pp-primary-200)]">
              <div
                className="h-full rounded-full bg-[color:var(--pp-primary-950)] transition-[width] duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          <ul>
            {pending.map((r, i) => (
              <li key={r.id} className={i > 0 ? "border-t border-line" : undefined}>
                <button
                  type="button"
                  onClick={() => nav(`/profile/${r.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
                >
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-[#B4541F]/60"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium text-[color:var(--pp-primary-950)]">
                    {r.label}
                  </span>
                  <span className="text-ink-tertiary" aria-hidden>
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {active.length > 0 && (
        <section>
          <p className="pp-caps mb-3 text-[color:var(--pp-violet)]">Live orders</p>
          <div className="space-y-3">
            {active.map((o) => (
              <LiveOrderCard key={o.id} o={o} onClick={() => nav(`/orders/${o.id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Compact summary used on small screens — expands in place. */
export function MobileActivity() {
  const { user } = useUser();
  const pending = pendingRows(user).length;
  const live = getOrders().filter(isActiveOrder).length;
  const total = pending + live;
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">Activity</span>
          <span className="mt-0.5 block text-xs text-ink-tertiary">
            {total === 0
              ? "You’re all caught up"
              : `${pending ? `${pending} pending` : ""}${pending && live ? " · " : ""}${live ? `${live} live` : ""}`}
          </span>
        </span>
        <span className="text-ink-tertiary" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open && (
        <div className="mt-3">
          <ActivityBody />
        </div>
      )}
    </div>
  );
}

/** Sticky right rail — always mounted in AppShell so layout stays consistent. */
export function ActivityRail() {
  return (
    <aside className="hidden w-72 shrink-0 lg:block xl:w-80" aria-label="Activity">
      <div className="sticky top-28">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">Activity</h2>
        <p className="mt-1 text-sm text-ink-tertiary">What needs you next</p>
        <div className="mt-5">
          <ActivityBody />
        </div>
      </div>
    </aside>
  );
}

function ReviewBody() {
  const { review, clearReview } = useRightRail();
  if (!review) return null;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-white">
        <div className="border-b border-line px-4 py-4">
          <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{review.title}</p>
          <p className="mt-0.5 text-xs text-ink-tertiary">
            {review.changes.length} change{review.changes.length === 1 ? "" : "s"} to review
          </p>
        </div>
        <ul>
          {review.changes.map((c, i) => (
            <li key={`${c.label}-${i}`} className={"px-4 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
              <p className="text-xs font-medium text-ink-tertiary">{c.label}</p>
              {c.from != null && c.from !== "" ? (
                <p className="mt-1 text-sm text-[color:var(--pp-primary-950)]">
                  <span className="text-ink-tertiary line-through">{c.from}</span>
                  <span className="mx-1.5 text-ink-tertiary">→</span>
                  <span className="font-medium">{c.to || "—"}</span>
                </p>
              ) : (
                <p className="mt-1 text-sm font-medium text-[color:var(--pp-primary-950)]">{c.to || "—"}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            review.onConfirm();
            clearReview();
          }}
          className="flex w-full items-center justify-center rounded-full bg-cta px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-cta-hover active:bg-cta-pressed"
        >
          {review.ctaLabel ?? "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => {
            review.onDiscard?.();
            clearReview();
          }}
          className="flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

export function MobileReview() {
  const { review } = useRightRail();
  const [open, setOpen] = useState(true);
  if (!review) return null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">Review changes</span>
          <span className="mt-0.5 block text-xs text-ink-tertiary">
            {review.changes.length} update{review.changes.length === 1 ? "" : "s"} ready to save
          </span>
        </span>
        <span className="text-ink-tertiary" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open && (
        <div className="mt-3">
          <ReviewBody />
        </div>
      )}
    </div>
  );
}

export function ReviewRail() {
  const { review } = useRightRail();
  if (!review) return null;

  return (
    <aside className="hidden w-72 shrink-0 lg:block xl:w-80" aria-label="Review changes">
      <div className="sticky top-28">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">Review</h2>
        <p className="mt-1 text-sm text-ink-tertiary">Confirm before updating</p>
        <div className="mt-5">
          <ReviewBody />
        </div>
      </div>
    </aside>
  );
}

/** Width spacer so focused flows don’t shift the main column. */
export function ActivityRailSpacer() {
  return <div className="hidden w-72 shrink-0 lg:block xl:w-80" aria-hidden />;
}
