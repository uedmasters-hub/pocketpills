/**
 * Demo revenue dashboard — seeded + derived from completed provider requests.
 */

import { getProviderRequests } from "@/lib/providerOps";

export type RevenuePeriod = "7d" | "30d" | "90d";

export type RevenuePoint = {
  label: string;
  amount: number;
};

export type RevenueSummary = {
  period: RevenuePeriod;
  total: number;
  completedCount: number;
  averageTicket: number;
  series: RevenuePoint[];
  topServices: { name: string; amount: number; count: number }[];
};

function daysFor(period: RevenuePeriod) {
  if (period === "7d") return 7;
  if (period === "90d") return 90;
  return 30;
}

export function getRevenueSummary(period: RevenuePeriod = "30d"): RevenueSummary {
  const days = daysFor(period);
  const since = Date.now() - days * 86400000;
  const completed = getProviderRequests().filter(
    (r) => r.status === "completed" && new Date(r.requestedAt).getTime() >= since,
  );

  // Seed baseline so empty portals still show a believable chart
  const seedDaily = Array.from({ length: Math.min(days, 14) }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (Math.min(days, 14) - 1 - i));
    const base = 40 + ((i * 17) % 90);
    return { label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), amount: base };
  });

  const byDay = new Map<string, number>();
  for (const p of seedDaily) byDay.set(p.label, p.amount);

  let fromRequests = 0;
  const serviceMap = new Map<string, { amount: number; count: number }>();
  for (const r of completed) {
    const fee = r.fee ?? 0;
    fromRequests += fee;
    const d = new Date(r.requestedAt);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    byDay.set(label, (byDay.get(label) ?? 0) + fee);
    const cur = serviceMap.get(r.service) ?? { amount: 0, count: 0 };
    cur.amount += fee;
    cur.count += 1;
    serviceMap.set(r.service, cur);
  }

  const series = [...byDay.entries()].map(([label, amount]) => ({ label, amount }));
  // Keep last N points in order of seedDaily when possible
  const ordered =
    seedDaily.length > 0
      ? seedDaily.map((p) => ({ label: p.label, amount: byDay.get(p.label) ?? p.amount }))
      : series;

  const total = ordered.reduce((s, p) => s + p.amount, 0);
  const completedCount = completed.length + Math.round(total / 75);
  const averageTicket = completedCount ? Math.round(total / completedCount) : 0;

  const topServices = [...serviceMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (topServices.length === 0) {
    topServices.push(
      { name: "Consults", amount: Math.round(total * 0.45), count: 8 },
      { name: "Packages", amount: Math.round(total * 0.3), count: 4 },
      { name: "Follow-ups", amount: Math.round(total * 0.25), count: 6 },
    );
  }

  return {
    period,
    total,
    completedCount,
    averageTicket,
    series: ordered,
    topServices,
  };
}

export function formatCad(n: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}
