import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/lib/user";
import { pendingRows, profileChecklist } from "@/lib/profile";
import { useRightRail } from "@/lib/rightRail";
import { useI18n } from "@/lib/i18n";
import { StickyChrome } from "@/components/layout/StickyChrome";
import { Caret } from "@/components/ui";
import { PageSearchField } from "@/components/PageSearchField";
import { DetailMeta, DetailSection } from "@/components/DetailSection";
import {
  statusMeta,
  transferStatusLabel,
  labStatusLabel,
  typeMeta,
  mergeActiveOrders,
  normalizeLiveSlot,
  type Order,
} from "@/lib/orders";
import {
  getLabBookings,
  labBookingIsPast,
  type LabBooking,
} from "@/lib/labs";
import { careEventHref } from "@/lib/careJourney";
import { fieldsMatchQuery } from "@/lib/searchMatch";

const LIVE_SEARCH_AFTER = 7;

type LiveKind = "pharmacy" | "labs" | "transfer";

type LiveRow = {
  id: string;
  kind: LiveKind;
  title: string;
  sub?: string;
  cue: string;
  accent: string;
  hay: string;
  href: string;
};

function liveLabKey(name: string, slot: string) {
  return `lab|${name.toLowerCase()}|${normalizeLiveSlot(slot)}`;
}

function collectLiveRows(): LiveRow[] {
  const orders = mergeActiveOrders();
  const coveredLabs = new Set(
    orders
      .filter((o) => o.type === "lab")
      .map((o) => liveLabKey(o.labName || "", o.visitSlot || "")),
  );
  const seenLab = new Set<string>();
  const labs: LabBooking[] = [];
  for (const b of getLabBookings()) {
    if (b.status !== "pending" && b.status !== "upcoming") continue;
    if (labBookingIsPast(b)) continue;
    const key = liveLabKey(b.labName, `${b.date} ${b.time}`);
    if (b.orderId || coveredLabs.has(key) || seenLab.has(key)) continue;
    seenLab.add(key);
    labs.push(b);
  }

  const orderRows: LiveRow[] = orders.map((o) => {
    const isTransfer = o.type === "transfer";
    const isLab = o.type === "lab";
    const cue = isTransfer
      ? transferStatusLabel(o.status)
      : isLab
        ? labStatusLabel(o.status)
        : statusMeta[o.status].label;
    const title = isLab
      ? (o.labName ?? "Lab visit")
      : (o.items[0]?.name ?? (isTransfer ? "Prescription transfer" : typeMeta[o.type].label));
    const href =
      isLab && o.labBookingId ? careEventHref("lab", o.labBookingId) : `/orders/${o.id}`;
    return {
      id: o.id,
      kind: isLab ? "labs" : isTransfer ? "transfer" : "pharmacy",
      title,
      sub: isLab ? o.visitSlot : o.items.length > 1 ? o.items.map((i) => i.name).join(" · ") : undefined,
      cue,
      accent: orderAccent(o),
      href,
      hay: [title, cue, o.id, o.labName, o.visitSlot, o.fromPharmacy, typeMeta[o.type].label, ...o.items.map((i) => `${i.name} ${i.strength}`)].join(" "),
    };
  });

  const labRows: LiveRow[] = labs.map((b) => ({
    id: b.id,
    kind: "labs",
    title: b.labName,
    sub: `${b.date} · ${b.time}`,
    cue: "Visit scheduled",
    accent: "var(--pp-green)",
    href: careEventHref("lab", b.id),
    hay: [b.labName, b.itemNames, b.date, b.time, "lab visit", "visit scheduled"].join(" "),
  }));

  return [...orderRows, ...labRows];
}

const GROUP_ORDER: LiveKind[] = ["pharmacy", "labs", "transfer"];
const GROUP_LABEL: Record<LiveKind, string> = {
  pharmacy: "Pharmacy",
  labs: "Labs",
  transfer: "Transfers",
};

function groupLiveRows(rows: LiveRow[]): { id: LiveKind; label: string; rows: LiveRow[] }[] {
  return GROUP_ORDER.map((id) => ({
    id,
    label: GROUP_LABEL[id],
    rows: rows.filter((r) => r.kind === id),
  })).filter((g) => g.rows.length);
}

function LiveKindTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: LiveKind; label: string; count: number }[];
  active: LiveKind;
  onChange: (id: LiveKind) => void;
}) {
  const { tx } = useI18n();
  return (
    <div
      className="flex items-stretch rounded-full border border-line bg-[color:var(--pp-primary-100)] p-0.5"
      role="tablist"
      aria-label={tx("Live order type")}
    >
      {tabs.map((t, i) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`live-tab-${t.id}`}
            aria-selected={on}
            aria-controls={`live-panel-${t.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
              onChange(tabs[next].id);
            }}
            className={
              "flex min-w-0 flex-1 items-center justify-center rounded-full p-2.5 text-[11px] font-semibold leading-none transition-colors " +
              (on
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "text-ink-tertiary hover:bg-white/70 hover:text-[color:var(--pp-primary-950)]")
            }
          >
            <span className="block truncate">
              {tx(t.label)}{" "}
              <span className={"tnum " + (on ? "text-white/75" : "")}>{t.count}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function orderAccent(o: Order) {
  if (o.status === "verifying") return "var(--warning-900)";
  if (o.status === "processing") return "var(--color-processing)";
  if (o.status === "out_for_delivery") return "var(--secondary-800)";
  if (o.type === "transfer") return "var(--pp-violet)";
  if (o.type === "lab") return "var(--pp-green)";
  return "var(--pp-primary-950)";
}

function LiveRowButton({
  row,
  onClick,
}: {
  row: LiveRow;
  onClick: () => void;
}) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(row.title)}</span>
          <span className="shrink-0 text-lg leading-none text-ink-tertiary" aria-hidden>
            ›
          </span>
        </span>
        {row.sub ? (
          <span className="mt-0.5 block text-sm leading-snug text-ink-tertiary">{row.sub}</span>
        ) : null}
        <span
          className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-semibold"
          style={{
            color: row.accent,
            background: `color-mix(in srgb, ${row.accent} 12%, white)`,
          }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: row.accent }} aria-hidden />
          {tx("Live")} · {tx(row.cue)}
        </span>
      </span>
    </button>
  );
}

function ActivityBody() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { user } = useUser();
  const [liveQuery, setLiveQuery] = useState("");
  const [liveTab, setLiveTab] = useState<LiveKind | null>(null);
  const pending = pendingRows(user);
  const required = profileChecklist(user).filter((r) => r.required);
  const profileDone = required.filter((r) => r.done).length;
  const profileTotal = required.length;
  const live = collectLiveRows();
  const groups = groupLiveRows(live);
  const tabs = groups.map((g) => ({ id: g.id, label: g.label, count: g.rows.length }));
  const activeTab =
    liveTab && groups.some((g) => g.id === liveTab) ? liveTab : (groups[0]?.id ?? "pharmacy");
  const tabRows = live.filter((row) => row.kind === activeTab);
  const showLiveSearch = tabRows.length > LIVE_SEARCH_AFTER || Boolean(liveQuery.trim());
  const visibleLive = liveQuery.trim()
    ? tabRows.filter((row) => fieldsMatchQuery([row.hay], liveQuery))
    : tabRows;
  const empty = pending.length === 0 && live.length === 0;
  const progress = profileTotal > 0 ? profileDone / profileTotal : 1;

  if (empty) {
    return (
      <div className="rounded-2xl border border-line bg-white px-5 py-6">
        <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("You’re all caught up")}</p>
        <p className="mt-1 text-xs text-ink-tertiary">{tx("No pending tasks or live orders.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
                {tx("Complete your profile")}
              </h2>
              <p className="mt-1 text-sm text-ink-tertiary">
                {profileDone} {tx("of")} {profileTotal} {tx("done")} · {pending.length} {tx("left")}
              </p>
            </div>
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xs font-semibold text-[color:var(--pp-primary-950)]"
              style={{
                background: `conic-gradient(var(--pp-primary-950) ${progress * 360}deg, var(--pp-primary-200) 0)`,
              }}
              aria-hidden
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white tnum">
                {Math.round(progress * 100)}%
              </span>
            </span>
          </div>
          {/* Full-bleed bar — edge to edge, not padded like an orphan strip */}
          <div
            className="h-1 bg-[color:var(--pp-primary-200)]"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={tx("Profile completion")}
          >
            <div
              className="h-full bg-[color:var(--pp-primary-950)] transition-[width] duration-300"
              style={{ width: `${Math.max(progress * 100, progress > 0 ? 6 : 0)}%` }}
            />
          </div>
          <ul>
            {pending.map((r, i) => (
              <li key={r.id} className="border-t border-line">
                <button
                  type="button"
                  onClick={() => nav(`/profile/${r.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
                >
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[color:var(--pp-primary-300)] text-[10px] font-semibold leading-none text-ink-tertiary tnum"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-[color:var(--pp-primary-950)]">
                    {tx(r.label)}
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

      {live.length > 0 && (
        <DetailSection
          title={tx("Live orders")}
          meta={
            <DetailMeta>
              {live.length} {tx("live")}
            </DetailMeta>
          }
          flush
        >
          {tabs.length > 1 ? (
            <div className="border-b border-line px-5 py-3">
              <LiveKindTabs
                tabs={tabs}
                active={activeTab}
                onChange={(id) => {
                  setLiveTab(id);
                  setLiveQuery("");
                }}
              />
            </div>
          ) : null}
          {showLiveSearch ? (
            <div className="border-b border-line px-5 py-3">
              <PageSearchField scope="orders" value={liveQuery} onChange={setLiveQuery} />
            </div>
          ) : null}
          {visibleLive.length === 0 ? (
            <p className="px-5 py-5 text-sm text-ink-tertiary">{tx("No matching live orders.")}</p>
          ) : (
            <ul
              id={`live-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={tabs.length > 1 ? `live-tab-${activeTab}` : undefined}
              className={
                "divide-y divide-line " +
                (visibleLive.length > LIVE_SEARCH_AFTER
                  ? "max-h-[min(28rem,calc(100vh-16rem))] overflow-y-auto"
                  : "")
              }
            >
              {visibleLive.map((row) => (
                <li key={row.id}>
                  <LiveRowButton row={row} onClick={() => nav(row.href)} />
                </li>
              ))}
            </ul>
          )}
        </DetailSection>
      )}
    </div>
  );
}

/** Compact summary used on small screens — expands in place. */
export function MobileActivity() {
  const { tx } = useI18n();
  const { user } = useUser();
  const pending = pendingRows(user).length;
  const live = collectLiveRows().length;
  const total = pending + live;
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        id="mobile-activity-trigger"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
        aria-expanded={open}
        aria-controls="mobile-activity-panel"
      >
        <span>
          <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("Activity")}</span>
          <span className="mt-0.5 block text-xs text-ink-tertiary">
            {total === 0
              ? tx("You’re all caught up")
              : `${pending ? `${pending} ${tx("pending")}` : ""}${pending && live ? " · " : ""}${live ? `${live} ${tx("live")}` : ""}`}
          </span>
        </span>
        <span className="text-ink-tertiary">
          <Caret open={open} />
        </span>
      </button>
      {open && (
        <div id="mobile-activity-panel" className="mt-3">
          <ActivityBody />
        </div>
      )}
    </div>
  );
}

/** Right rail — sticky with top gap synced to header hide/show. */
export function ActivityRail() {
  const { tx } = useI18n();
  const { pathname } = useLocation();
  return (
    <aside className="hidden w-72 shrink-0 lg:block xl:w-80" aria-label={tx("Activity")}>
      <StickyChrome>
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">{tx("Activity")}</h2>
        <div className="mt-5">
          <ActivityBody key={pathname} />
        </div>
      </StickyChrome>
    </aside>
  );
}

function ReviewBody() {
  const { tx } = useI18n();
  const { review, clearReview } = useRightRail();
  if (!review) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <ul>
        {review.changes.map((c, i) => (
          <li key={`${c.label}-${i}`} className={"px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
            <p className="text-xs font-medium text-ink-tertiary">{tx(c.label)}</p>
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
      <div className="space-y-1 border-t border-line px-5 py-4">
        <button
          type="button"
          onClick={() => {
            review.onConfirm();
            clearReview();
          }}
          className="flex w-full items-center justify-center rounded-full bg-cta px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-cta-hover active:bg-cta-pressed"
        >
          {tx(review.ctaLabel ?? "Save changes")}
        </button>
        <button
          type="button"
          onClick={() => {
            review.onDiscard?.();
            clearReview();
          }}
          className="flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]"
        >
          {tx("Discard")}
        </button>
      </div>
    </section>
  );
}

export function MobileReview() {
  const { tx } = useI18n();
  const { review } = useRightRail();
  const [open, setOpen] = useState(true);
  if (!review) return null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        id="mobile-review-trigger"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
        aria-expanded={open}
        aria-controls="mobile-review-panel"
      >
        <span className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">{tx("Review")}</span>
        <span className="text-ink-tertiary">
          <Caret open={open} />
        </span>
      </button>
      {open && (
        <div id="mobile-review-panel" className="mt-3">
          <ReviewBody />
        </div>
      )}
    </div>
  );
}

export function ReviewRail() {
  const { tx } = useI18n();
  const { review } = useRightRail();
  if (!review) return null;

  return (
    <aside className="hidden w-72 shrink-0 lg:block xl:w-80" aria-label={tx("Review")}>
      <StickyChrome>
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">{tx("Review")}</h2>
        <div className="mt-5">
          <ReviewBody />
        </div>
      </StickyChrome>
    </aside>
  );
}

/** Width spacer so focused flows don’t shift the main column. */
export function ActivityRailSpacer() {
  return <div className="hidden w-72 shrink-0 lg:block xl:w-80" aria-hidden />;
}
