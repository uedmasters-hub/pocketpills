/**
 * Unified order history — service tabs (Consultation, Medication, Pharmacy, …)
 * with subtype chips and Pharmacy-style grid. Replaces the separate /pharmacy surface.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  OrderSection,
  OrderTile,
} from "@/components/orders/OrderBoard";
import {
  getOrders,
  isActiveOrder,
  statusMeta,
  statusPillClass,
  money,
  fmtDate,
  transferStatusLabel,
  labStatusLabel,
  orderTotals,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { CareJourneyPage } from "@/pages/care/CareJourneyPage";

type ServiceId =
  | "all"
  | "consultation"
  | "medication"
  | "pharmacy"
  | "labs"
  | "assistance"
  | "emergencies";

type SubId = string;

type HistoryEntry = {
  id: string;
  service: Exclude<ServiceId, "all">;
  subtype: SubId;
  title: string;
  meta: string;
  status: OrderStatus;
  statusLabel: string;
  href: string;
  /** When set, render the shared OrderTile */
  order?: Order;
};

const SERVICE_SUBS: Record<
  Exclude<ServiceId, "all">,
  { id: SubId; label: string }[]
> = {
  consultation: [
    { id: "all", label: "All" },
    { id: "doctor", label: "Doctor" },
    { id: "clinic", label: "Clinic" },
    { id: "hospital", label: "Hospital" },
  ],
  medication: [
    { id: "all", label: "All" },
    { id: "prescription", label: "Prescription" },
    { id: "refill", label: "Refill" },
    { id: "otc", label: "OTC" },
  ],
  pharmacy: [
    { id: "all", label: "All" },
    { id: "fill", label: "Fill" },
    { id: "transfer", label: "Transfer" },
    { id: "pickup", label: "Pickup" },
  ],
  labs: [
    { id: "all", label: "All" },
    { id: "blood", label: "Blood work" },
    { id: "imaging", label: "Imaging" },
    { id: "pathology", label: "Pathology" },
  ],
  assistance: [
    { id: "all", label: "All" },
    { id: "nurse", label: "Nurse" },
    { id: "home", label: "Home visit" },
    { id: "support", label: "Care support" },
  ],
  emergencies: [
    { id: "all", label: "All" },
    { id: "ambulance", label: "Ambulance" },
    { id: "er", label: "ER" },
    { id: "urgent", label: "Urgent care" },
  ],
};

const SERVICE_LABEL: Record<Exclude<ServiceId, "all">, string> = {
  consultation: "Consultation",
  medication: "Medication",
  pharmacy: "Pharmacy",
  labs: "Labs",
  assistance: "Assistance",
  emergencies: "Emergencies",
};

const SERVICE_CTA: Record<Exclude<ServiceId, "all">, { label: string; to: string }> = {
  consultation: { label: "Book consult →", to: "/appointments" },
  medication: { label: "New fill →", to: "/fill" },
  pharmacy: { label: "Transfer →", to: "/transfer" },
  labs: { label: "Book a lab →", to: "/appointments" },
  assistance: { label: "Get help →", to: "/messages" },
  emergencies: { label: "Urgent care →", to: "/appointments" },
};

/** Demo rows so non-pharmacy services have something to browse in the draft. */
const DEMO_ENTRIES: HistoryEntry[] = [
  {
    id: "demo-consult-doc-1",
    service: "consultation",
    subtype: "doctor",
    title: "Dr. Amrita Shah",
    meta: "Aug 20, 2026 · Family medicine · Virtual",
    status: "delivered",
    statusLabel: "Completed",
    href: "/appointments",
  },
  {
    id: "demo-consult-clinic-1",
    service: "consultation",
    subtype: "clinic",
    title: "King West Family Clinic",
    meta: "Aug 12, 2026 · Follow-up · In person",
    status: "processing",
    statusLabel: "Confirmed",
    href: "/appointments",
  },
  {
    id: "demo-consult-hosp-1",
    service: "consultation",
    subtype: "hospital",
    title: "Toronto General — Cardiology",
    meta: "Jul 28, 2026 · Outpatient · Dr. Chen",
    status: "delivered",
    statusLabel: "Completed",
    href: "/appointments",
  },
  {
    id: "demo-med-otc-1",
    service: "medication",
    subtype: "otc",
    title: "Vitamin D3 1000 IU",
    meta: "Aug 8, 2026 · 1 bottle · $12.99",
    status: "delivered",
    statusLabel: "Delivered",
    href: "/drug",
  },
  {
    id: "demo-pharm-pickup-1",
    service: "pharmacy",
    subtype: "pickup",
    title: "Pharmacy pickup — Metformin",
    meta: "Aug 5, 2026 · Ready at counter",
    status: "out_for_delivery",
    statusLabel: "Ready for pickup",
    href: "/orders",
  },
  {
    id: "demo-lab-blood-1",
    service: "labs",
    subtype: "blood",
    title: "CBC & lipid panel",
    meta: "Aug 18, 2026 · Lifelabs · 9:30 am",
    status: "verifying",
    statusLabel: "Sample received",
    href: "/appointments",
  },
  {
    id: "demo-lab-img-1",
    service: "labs",
    subtype: "imaging",
    title: "Chest X-ray",
    meta: "Aug 1, 2026 · Imaging centre",
    status: "delivered",
    statusLabel: "Results ready",
    href: "/appointments",
  },
  {
    id: "demo-assist-nurse-1",
    service: "assistance",
    subtype: "nurse",
    title: "Injection support visit",
    meta: "Aug 15, 2026 · Home · 45 min",
    status: "processing",
    statusLabel: "Scheduled",
    href: "/appointments",
  },
  {
    id: "demo-assist-home-1",
    service: "assistance",
    subtype: "home",
    title: "Vitals & intake",
    meta: "Jul 22, 2026 · Completed",
    status: "delivered",
    statusLabel: "Completed",
    href: "/appointments",
  },
  {
    id: "demo-emer-amb-1",
    service: "emergencies",
    subtype: "ambulance",
    title: "Emergency ambulance",
    meta: "Jun 30, 2026 · Dispatched · Toronto",
    status: "delivered",
    statusLabel: "Completed",
    href: "/appointments",
  },
  {
    id: "demo-emer-urgent-1",
    service: "emergencies",
    subtype: "urgent",
    title: "Urgent care walk-in",
    meta: "Aug 10, 2026 · Same-day · Closed",
    status: "cancelled",
    statusLabel: "Cancelled",
    href: "/appointments",
  },
];

function mapOrder(o: Order): HistoryEntry | null {
  if (o.type === "consultation") {
    return {
      id: o.id,
      service: "consultation",
      subtype: "doctor",
      title: o.prescriber ?? o.items[0]?.name ?? o.id,
      meta: `${fmtDate(o.date)} · ${o.id}`,
      status: o.status,
      statusLabel: statusMeta[o.status].label,
      href: `/orders/${o.id}`,
      order: o,
    };
  }
  if (o.type === "lab") {
    return {
      id: o.id,
      service: "labs",
      subtype: "blood",
      title: o.labName ?? o.items[0]?.name ?? "Lab visit",
      meta: `${o.visitSlot ?? fmtDate(o.date)} · ${o.id}`,
      status: o.status,
      statusLabel: labStatusLabel(o.status),
      href: `/orders/${o.id}`,
      order: o,
    };
  }
  if (o.type === "transfer") {
    return {
      id: o.id,
      service: "pharmacy",
      subtype: "transfer",
      title: o.fromPharmacy ? `From ${o.fromPharmacy}` : "Prescription transfer",
      meta: `${fmtDate(o.date)} · ${o.id}`,
      status: o.status,
      statusLabel: transferStatusLabel(o.status),
      href: `/orders/${o.id}`,
      order: o,
    };
  }
  if (o.type === "refill") {
    const total = orderTotals(o).total;
    return {
      id: o.id,
      service: "medication",
      subtype: "refill",
      title: o.items[0]?.name ?? o.id,
      meta: `${fmtDate(o.date)} · ${o.items.length} item${o.items.length === 1 ? "" : "s"}${total > 0 ? ` · ${money(total)}` : ""}`,
      status: o.status,
      statusLabel: statusMeta[o.status].label,
      href: `/orders/${o.id}`,
      order: o,
    };
  }
  if (o.type === "fill") {
    const total = orderTotals(o).total;
    return {
      id: o.id,
      service: "medication",
      subtype: "prescription",
      title: o.items[0]?.name ?? o.id,
      meta: `${fmtDate(o.date)} · ${o.items.length} item${o.items.length === 1 ? "" : "s"}${total > 0 ? ` · ${money(total)}` : ""}`,
      status: o.status,
      statusLabel: statusMeta[o.status].label,
      href: `/orders/${o.id}`,
      order: o,
    };
  }
  return null;
}

const TILE_PAD_X = "px-3 sm:px-4";
const TILE_PAD = `${TILE_PAD_X} py-3 sm:py-4`;
const PILL = "rounded-full px-3 py-1 text-xs font-semibold";

/** Demo / non-order rows — same shell as OrderTile. */
function HistoryTile({ entry }: { entry: HistoryEntry }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const active = isActiveOrder({ status: entry.status } as Order);
  const pct = Math.round(
    entry.status === "verifying"
      ? 33
      : entry.status === "processing"
        ? 55
        : entry.status === "out_for_delivery"
          ? 80
          : entry.status === "delivered"
            ? 100
            : 0,
  );

  if (entry.order) return <OrderTile o={entry.order} />;

  if (!active) {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={() => nav(entry.href)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            nav(entry.href);
          }
        }}
        className={
          "flex h-full min-h-[7.5rem] cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-white text-left transition-colors " +
          "hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)]"
        }
      >
        <div className={`flex items-center justify-between gap-3 border-b border-line ${TILE_PAD_X} py-3`}>
          <span className={`${PILL} ${statusPillClass(entry.status)}`}>{tx(entry.statusLabel)}</span>
        </div>
        <div className={`flex flex-1 flex-col ${TILE_PAD}`}>
          <p className="truncate text-base font-semibold text-[color:var(--pp-primary-950)]">{entry.title}</p>
          <p className="mt-1 truncate text-sm text-ink-tertiary">{entry.meta}</p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => nav(entry.href)}
      className={
        "flex h-full min-h-[7.5rem] flex-col overflow-hidden rounded-2xl border border-line bg-white text-left transition-colors " +
        "hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)]"
      }
    >
      <div className={`flex items-center justify-between gap-2 ${TILE_PAD_X} pt-3 sm:pt-4`}>
        <span className={`${PILL} min-w-0 truncate ${statusPillClass(entry.status)}`}>
          {tx(entry.statusLabel)}
        </span>
        <span className="tnum shrink-0 text-sm text-ink-tertiary">{pct}%</span>
      </div>
      <div className="mt-3 h-1 w-full bg-[color:var(--pp-primary-200)]" role="progressbar" aria-valuenow={pct}>
        <div className="h-full bg-[color:var(--pp-primary-950)]" style={{ width: `${pct}%` }} />
      </div>
      <div className={`flex flex-1 flex-col ${TILE_PAD}`}>
        <p className="truncate text-base font-semibold text-[color:var(--pp-primary-950)]">{entry.title}</p>
        <p className="mt-1 truncate text-sm text-ink-tertiary">{entry.meta}</p>
      </div>
    </button>
  );
}

function HistoryGrid({ entries }: { entries: HistoryEntry[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map((e) => (
        <HistoryTile key={e.id} entry={e} />
      ))}
    </div>
  );
}

const SERVICE_IDS: ServiceId[] = [
  "all",
  "consultation",
  "medication",
  "pharmacy",
  "labs",
  "assistance",
  "emergencies",
];

function parseService(raw: string | null): ServiceId {
  return SERVICE_IDS.includes(raw as ServiceId) ? (raw as ServiceId) : "all";
}

/* ── History ───────────────────────────────────────────── */
export function OrderHistory() {
  const { tx } = useI18n();
  const [params, setParams] = useSearchParams();
  const [service, setService] = useState<ServiceId>(() => parseService(params.get("service")));
  const [subtype, setSubtype] = useState<SubId>("all");

  const catalog = useMemo(() => {
    const fromOrders = getOrders()
      .map(mapOrder)
      .filter((e): e is HistoryEntry => Boolean(e));
    const ids = new Set(fromOrders.map((e) => e.id));
    return [...fromOrders, ...DEMO_ENTRIES.filter((e) => !ids.has(e.id))].sort((a, b) =>
      b.meta.localeCompare(a.meta),
    );
  }, []);

  const serviceCounts = useMemo(() => {
    const counts: Record<ServiceId, number> = {
      all: catalog.length,
      consultation: 0,
      medication: 0,
      pharmacy: 0,
      labs: 0,
      assistance: 0,
      emergencies: 0,
    };
    for (const e of catalog) counts[e.service] += 1;
    return counts;
  }, [catalog]);

  const byService =
    service === "all" ? catalog : catalog.filter((e) => e.service === service);

  const subDefs = service === "all" ? [] : SERVICE_SUBS[service];
  const subCounts = useMemo(() => {
    const map: Record<string, number> = { all: byService.length };
    for (const s of subDefs) {
      if (s.id === "all") continue;
      map[s.id] = byService.filter((e) => e.subtype === s.id).length;
    }
    return map;
  }, [byService, subDefs]);

  const filtered =
    service === "all" || subtype === "all"
      ? byService
      : byService.filter((e) => e.subtype === subtype);

  const active = filtered.filter((e) => isActiveOrder({ status: e.status } as Order));
  const past = filtered.filter((e) => !isActiveOrder({ status: e.status } as Order));

  const onService = (next: ServiceId) => {
    setService(next);
    setSubtype("all");
    const p = new URLSearchParams(params);
    if (next === "all") p.delete("service");
    else p.set("service", next);
    setParams(p, { replace: true });
  };

  /** Service CTA as a link on the first section header only. */
  const headerLink =
    service === "all" ? null : (
      <Link
        to={SERVICE_CTA[service].to}
        className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
      >
        {tx(SERVICE_CTA[service].label.replace(/\s*→\s*$/, ""))}
      </Link>
    );

  const firstIsActive = active.length > 0;
  const firstTitle = firstIsActive ? tx("In progress") : tx("Recent");
  const firstEntries = firstIsActive ? active : past;
  const showRecentBelow = firstIsActive && past.length > 0;

  return (
    <div>
      <header className="mb-6">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Orders")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          {tx("Order history")}
        </h1>
      </header>

      {/* Service tabs */}
      <div className="mb-5 border-b border-line">
        <div
          className="flex min-w-0 gap-1 overflow-x-auto"
          role="tablist"
          aria-label={tx("Service")}
        >
          {(
            [
              ["all", "All"],
              ["consultation", "Consultation"],
              ["medication", "Medication"],
              ["pharmacy", "Pharmacy"],
              ["labs", "Labs"],
              ["assistance", "Assistance"],
              ["emergencies", "Emergencies"],
            ] as const
          ).map(([id, label]) => {
            const on = service === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onService(id)}
                className={
                  "relative -mb-px shrink-0 px-3 py-3 text-sm font-medium transition-colors sm:px-4 " +
                  (on
                    ? "text-[color:var(--pp-primary-950)]"
                    : "text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
                }
              >
                {tx(label)}
                <span className="ml-1.5 tnum text-ink-tertiary">{serviceCounts[id]}</span>
                {on ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[color:var(--pp-primary-950)]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtype chips */}
      {service !== "all" && subDefs.length > 0 ? (
        <div
          className="mb-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label={tx(`${SERVICE_LABEL[service]} type`)}
        >
          {subDefs
            .filter((s) => s.id === "all" || (subCounts[s.id] ?? 0) > 0)
            .map((s) => {
              const on = subtype === s.id;
              const label = s.id === "all" ? tx("All types") : tx(s.label);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSubtype(s.id)}
                  className={
                    "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
                    (on
                      ? "border border-[color:var(--pp-primary-950)] bg-white text-[color:var(--pp-primary-950)]"
                      : "border border-transparent bg-white text-ink-secondary hover:bg-[color:var(--pp-primary-300)] hover:text-[color:var(--pp-primary-950)]")
                  }
                >
                  {label}
                </button>
              );
            })}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-14 text-center">
          <p className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Nothing in this view yet")}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-tertiary">
            {tx("Try another service or type, or start a new request.")}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <OrderSection
            title={firstTitle}
            count={firstEntries.length}
            aside={headerLink ?? undefined}
          >
            <HistoryGrid entries={firstEntries} />
          </OrderSection>
          {showRecentBelow ? (
            <OrderSection title={tx("Recent")} count={past.length}>
              <HistoryGrid entries={past} />
            </OrderSection>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function OrderDetail() {
  return <CareJourneyPage kind="order" />;
}
