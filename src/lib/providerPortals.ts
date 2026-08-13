/**
 * Portal registry — grouped nav + home copy keyed by vendor type and role.
 */

import type { BusinessVendorType } from "@/lib/businessProfile";
import type { AccountRole, AmbulanceRole, PharmacyRole } from "@/lib/providerAuth";
import {
  featuresForVendor,
  normalizeDelegateFeatures,
  type DelegateFeatures,
} from "@/lib/providerDelegates";

export type PortalNavLeaf = {
  to: string;
  label: string;
  end?: boolean;
};

export type PortalNavGroup = {
  id: string;
  label: string;
  children: PortalNavLeaf[];
};

export type PortalNavEntry = PortalNavLeaf | PortalNavGroup;

/** @deprecated use PortalNavLeaf — kept so existing imports type-check */
export type PortalNavItem = PortalNavLeaf;

export type PortalDefinition = {
  id: BusinessVendorType;
  label: string;
  homeTitle: string;
  homeBlurb: string;
  requestsLabel: string;
  showListing: boolean;
  nav: PortalNavEntry[];
};

export function isNavGroup(entry: PortalNavEntry): entry is PortalNavGroup {
  return "children" in entry && Array.isArray((entry as PortalNavGroup).children);
}

export function flattenNav(nav: PortalNavEntry[]): PortalNavLeaf[] {
  const out: PortalNavLeaf[] = [];
  for (const entry of nav) {
    if (isNavGroup(entry)) out.push(...entry.children);
    else out.push(entry);
  }
  return out;
}

const HOME: PortalNavLeaf = { to: "/provider", label: "Home", end: true };

const ORDERS_PATHS = new Set(["/provider/requests", "/provider/finance", "/provider/revenue"]);
const CONNECT_PATHS = new Set(["/provider/chat", "/provider/support", "/provider/delegates"]);
const EXPLORE_PATHS = new Set(["/provider/offers", "/provider/listing"]);

function group(id: string, label: string, children: PortalNavLeaf[]): PortalNavGroup | null {
  const items = children.filter(Boolean);
  if (items.length === 0) return null;
  return { id, label, children: items };
}

function sharedGroups(opts: {
  requestsLabel: string;
  showListing: boolean;
  includeDelegates?: boolean;
}): PortalNavEntry[] {
  const connect: PortalNavLeaf[] = [
    { to: "/provider/chat", label: "Chat" },
    { to: "/provider/support", label: "Support" },
  ];
  if (opts.includeDelegates !== false) {
    connect.push({ to: "/provider/delegates", label: "Delegates" });
  }
  const explore: PortalNavLeaf[] = [{ to: "/provider/offers", label: "Offers" }];
  if (opts.showListing) explore.push({ to: "/provider/listing", label: "Listing" });

  return [
    group("orders", "Orders", [
      { to: "/provider/requests", label: opts.requestsLabel },
      { to: "/provider/finance", label: "Finance" },
    ]),
    group("connect", "Connect", connect),
    group("explore", "Explore", explore),
  ].filter((g): g is PortalNavGroup => g != null);
}

/** Bucket a flat feature list into Care / Orders / Connect / Explore. */
export function groupNav(leaves: PortalNavLeaf[]): PortalNavEntry[] {
  const home = leaves.find((l) => l.to === "/provider");
  const care: PortalNavLeaf[] = [];
  const orders: PortalNavLeaf[] = [];
  const connect: PortalNavLeaf[] = [];
  const explore: PortalNavLeaf[] = [];

  for (const leaf of leaves) {
    if (leaf.to === "/provider") continue;
    if (ORDERS_PATHS.has(leaf.to)) orders.push(leaf);
    else if (CONNECT_PATHS.has(leaf.to)) connect.push(leaf);
    else if (EXPLORE_PATHS.has(leaf.to)) explore.push(leaf);
    else care.push(leaf);
  }

  return [
    ...(home ? [home] : []),
    group("care", "Care", care),
    group("orders", "Orders", orders),
    group("connect", "Connect", connect),
    group("explore", "Explore", explore),
  ].filter((e): e is PortalNavEntry => e != null);
}

const HOSPITAL: PortalDefinition = {
  id: "hospital",
  label: "Hospital portal",
  homeTitle: "Hospital operations",
  homeBlurb: "Manage doctors, facility services, and today’s care board.",
  requestsLabel: "Requests",
  showListing: true,
  nav: [
    HOME,
    group("care", "Care", [
      { to: "/provider/doctors", label: "Doctors" },
      { to: "/provider/services", label: "Services" },
      { to: "/provider/monitor", label: "Monitor" },
    ])!,
    ...sharedGroups({ requestsLabel: "Requests", showListing: true }),
  ],
};

const CLINIC: PortalDefinition = {
  id: "clinic",
  label: "Clinic portal",
  homeTitle: "Clinic workspace",
  homeBlurb: "Coordinate your team, services, and patient requests.",
  requestsLabel: "Requests",
  showListing: true,
  nav: [
    HOME,
    group("care", "Care", [
      { to: "/provider/team", label: "Team" },
      { to: "/provider/services", label: "Services" },
    ])!,
    ...sharedGroups({ requestsLabel: "Requests", showListing: true }),
  ],
};

const DOCTOR: PortalDefinition = {
  id: "doctor",
  label: "Doctor portal",
  homeTitle: "Your practice",
  homeBlurb: "See today’s schedule, patients, and consult requests.",
  requestsLabel: "Requests",
  showListing: true,
  nav: [
    HOME,
    group("care", "Care", [
      { to: "/provider/schedule", label: "Schedule" },
      { to: "/provider/patients", label: "Patients" },
    ])!,
    ...sharedGroups({ requestsLabel: "Requests", showListing: true }),
  ],
};

const LAB: PortalDefinition = {
  id: "lab",
  label: "Lab portal",
  homeTitle: "Lab operations",
  homeBlurb: "Manage tests, collections, and inbound requests.",
  requestsLabel: "Requests",
  showListing: true,
  nav: [
    HOME,
    group("care", "Care", [
      { to: "/provider/tests", label: "Tests & packages" },
      { to: "/provider/collections", label: "Collections" },
    ])!,
    ...sharedGroups({ requestsLabel: "Requests", showListing: true }),
  ],
};

const PHARMACY: PortalDefinition = {
  id: "pharmacy",
  label: "Pharmacy portal",
  homeTitle: "Pharmacy counter",
  homeBlurb: "Fill prescriptions, track inventory, and watch revenue.",
  requestsLabel: "Orders",
  showListing: true,
  nav: [
    HOME,
    group("care", "Care", [
      { to: "/provider/prescriptions", label: "Prescriptions" },
      { to: "/provider/inventory", label: "Inventory" },
    ])!,
    ...sharedGroups({ requestsLabel: "Orders", showListing: true }),
  ],
};

const INDIVIDUAL: PortalDefinition = {
  id: "individual",
  label: "Vendor portal",
  homeTitle: "Your services",
  homeBlurb: "Set availability and the care you offer patients.",
  requestsLabel: "Requests",
  showListing: true,
  nav: [
    HOME,
    group("care", "Care", [
      { to: "/provider/services", label: "Services" },
      { to: "/provider/availability", label: "Availability" },
    ])!,
    ...sharedGroups({ requestsLabel: "Requests", showListing: true }),
  ],
};

const AMBULANCE_OWNER: PortalDefinition = {
  id: "ambulance",
  label: "Ambulance portal · Owner",
  homeTitle: "Fleet & dispatch",
  homeBlurb: "Manage vehicles and assign runs across your fleet.",
  requestsLabel: "Runs",
  showListing: true,
  nav: [
    HOME,
    group("care", "Care", [
      { to: "/provider/fleet", label: "Fleet" },
      { to: "/provider/dispatch", label: "Dispatch" },
    ])!,
    ...sharedGroups({ requestsLabel: "Runs", showListing: true }),
  ],
};

const AMBULANCE_DRIVER: PortalDefinition = {
  id: "ambulance",
  label: "Ambulance portal · Driver",
  homeTitle: "Your runs",
  homeBlurb: "Shifts and assigned transports for today.",
  requestsLabel: "My runs",
  showListing: false,
  nav: [
    HOME,
    group("care", "Care", [
      { to: "/provider/shifts", label: "My shifts" },
      { to: "/provider/runs", label: "Assigned runs" },
    ])!,
    group("orders", "Orders", [{ to: "/provider/finance", label: "Finance" }])!,
    group("connect", "Connect", [
      { to: "/provider/chat", label: "Chat" },
      { to: "/provider/support", label: "Support" },
    ])!,
  ],
};

const STAFF_BASE: PortalDefinition = {
  id: "doctor",
  label: "Staff desk",
  homeTitle: "Staff desk",
  homeBlurb: "Access only the modules your account owner enabled for you.",
  requestsLabel: "Requests",
  showListing: false,
  nav: [{ to: "/provider/requests", label: "Requests" }],
};

/** Build staff nav from live feature grants for any vendor. */
export function delegatePortal(
  vendorType: BusinessVendorType,
  features: DelegateFeatures,
): PortalDefinition {
  const f = normalizeDelegateFeatures(vendorType, features);
  const defs = featuresForVendor(vendorType);
  const leaves = defs.filter((d) => f[d.id]).map((d) => ({ to: d.path, label: d.label }));
  const nav = groupNav(leaves.length > 0 ? leaves : [{ to: "/provider/requests", label: "Requests" }]);
  return {
    ...STAFF_BASE,
    id: vendorType,
    label: "Staff desk",
    requestsLabel: defs.find((d) => d.required)?.label ?? "Requests",
    nav,
  };
}

/** @deprecated use delegatePortal */
export function pharmacyDelegatePortal(features: DelegateFeatures): PortalDefinition {
  return delegatePortal("pharmacy", features);
}

function isDelegateRole(accountRole?: AccountRole | null, pharmacyRole?: PharmacyRole | null) {
  return accountRole === "delegate" || pharmacyRole === "delegate";
}

export function portalFor(
  vendorType: BusinessVendorType,
  ambulanceRole?: AmbulanceRole | null,
  accountOrPharmacyRole?: AccountRole | PharmacyRole | null,
): PortalDefinition {
  if (isDelegateRole(accountOrPharmacyRole as AccountRole, accountOrPharmacyRole as PharmacyRole)) {
    return { ...STAFF_BASE, id: vendorType };
  }
  switch (vendorType) {
    case "hospital":
      return HOSPITAL;
    case "clinic":
      return CLINIC;
    case "doctor":
      return DOCTOR;
    case "lab":
      return LAB;
    case "pharmacy":
      return PHARMACY;
    case "ambulance":
      return ambulanceRole === "driver" ? AMBULANCE_DRIVER : AMBULANCE_OWNER;
    case "individual":
    default:
      return INDIVIDUAL;
  }
}

export function portalAllowedPaths(
  vendorType: BusinessVendorType,
  ambulanceRole?: AmbulanceRole | null,
  accountOrPharmacyRole?: AccountRole | PharmacyRole | null,
): Set<string> {
  const portal = portalFor(vendorType, ambulanceRole, accountOrPharmacyRole);
  const paths = new Set(flattenNav(portal.nav).map((n) => n.to));
  if (paths.has("/provider/finance")) paths.add("/provider/revenue");
  return paths;
}
