import { useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import {
  ActivityRail,
  ActivityRailSpacer,
  MobileActivity,
  MobileReview,
  ReviewRail,
} from "@/components/layout/ActivityRail";
import { useRightRail } from "@/lib/rightRail";
import { useDismiss } from "@/lib/useDismiss";
import { ChromeVisibilityProvider, useChromeHidden } from "@/lib/chromeVisibility";
import { StickyChrome } from "@/components/layout/StickyChrome";
import { FRAME, SURFACE } from "@/components/layout/Grid";
import { useI18n } from "@/lib/i18n";
import { isFocusedPatientFlow } from "@/lib/marketingPaths";
import type { MessageKey } from "@/lib/i18n";

/* ── sidebar icons ─────────────────────────────────────── */
type NavId = "dashboard" | "appointments" | "medications" | "orders" | "more";

function NavIcon({ id }: { id: NavId }) {
  const c = {
    width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.7,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "dashboard":
      return <svg {...c}><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></svg>;
    case "appointments":
      return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /><circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" /></svg>;
    case "medications":
      return <svg {...c}><path d="M20.6 3.4a5.5 5.5 0 0 0-7.8 0l-9.4 9.4a5.5 5.5 0 0 0 7.8 7.8l9.4-9.4a5.5 5.5 0 0 0 0-7.8Z" /><path d="m8.1 8.1 7.8 7.8" /></svg>;
    case "orders":
      return <svg {...c}><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>;
    default:
      return <svg {...c}><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></svg>;
  }
}

const NAV: { id: NavId; labelKey: MessageKey; to: string }[] = [
  { id: "dashboard", labelKey: "app.dashboard", to: "/dashboard" },
  { id: "appointments", labelKey: "app.bookAppointment", to: "/appointments" },
  { id: "medications", labelKey: "app.medications", to: "/drug" },
  { id: "orders", labelKey: "app.orders", to: "/orders" },
];

const MORE: [MessageKey, string][] = [
  ["app.profile", "/profile"],
  ["app.support", "/support"],
  ["app.messages", "/messages"],
  ["app.offers", "/offers"],
  ["app.pharmaciesRegion", "/pharmacies/regions"],
  ["app.editProfile", "/account"],
  ["app.family", "/account/family"],
  ["app.notifications", "/notifications"],
];

/** Exact for leaf paths; prefix only when the path has real nested segments. */
function moreLinkActive(to: string, pathname: string) {
  if (pathname === to) return true;
  /* `/account` must not light up for `/account/family`, etc. */
  if (to === "/account") return false;
  return pathname.startsWith(`${to}/`);
}
/* Active: filled pill so current page is obvious. Hover: darker lavender tint. */
const BASE =
  "flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-base transition-colors duration-200 " +
  "hover:bg-[color:var(--state-hover)] active:bg-[color:var(--state-pressed)]";
const IDLE = "font-normal text-ink-tertiary hover:text-[color:var(--pp-primary-950)]";
const ACTIVE =
  "font-medium text-[color:var(--pp-primary-950)] bg-white " +
  "border border-line hover:bg-white";

function navIsActive(id: NavId, pathname: string) {
  switch (id) {
    case "dashboard":
      return pathname.startsWith("/dashboard") || pathname === "/app";
    case "medications":
      return pathname.startsWith("/drug") || pathname.startsWith("/medications");
    case "appointments":
      return (
        pathname.startsWith("/appointments") ||
        pathname.startsWith("/care") ||
        pathname.startsWith("/find-care") ||
        pathname.startsWith("/treatment")
      );
    case "orders":
      return pathname.startsWith("/orders");
    default:
      return false;
  }
}

/* ── sidebar ───────────────────────────────────────────── */
function Sidebar() {
  const [openMore, setOpenMore] = useState(false);
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { t } = useI18n();
  const moreRef = useDismiss<HTMLDivElement>(openMore, () => setOpenMore(false));
  const moreActive = MORE.some(([, to]) => moreLinkActive(to, pathname)) && !navIsActive("orders", pathname);

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <StickyChrome>
        <nav aria-label={t("nav.main")} className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = navIsActive(n.id, pathname);
          return (
            <NavLink
              key={n.to}
              to={n.to}
              aria-current={active ? "page" : undefined}
              className={`${BASE} ${active ? ACTIVE : IDLE}`}
            >
              <NavIcon id={n.id} />
              {t(n.labelKey)}
            </NavLink>
          );
        })}

        <div className="relative" ref={moreRef}>
          <button
            type="button"
            id="nav-more-trigger"
            onClick={() => setOpenMore((o) => !o)}
            className={`${BASE} w-full ${moreActive || openMore ? ACTIVE : IDLE}`}
            aria-expanded={openMore}
            aria-haspopup="menu"
            aria-controls={openMore ? "nav-more-menu" : undefined}
            aria-current={moreActive ? "page" : undefined}
          >
            <NavIcon id="more" />
            {t("app.more")}
          </button>
          {openMore && (
            <div
              id="nav-more-menu"
              role="menu"
              aria-labelledby="nav-more-trigger"
              className="absolute left-2 right-0 z-20 mt-1 overflow-hidden rounded-2xl border border-line bg-white shadow-float"
            >
              {MORE.map(([labelKey, to]) => {
                const on = moreLinkActive(to, pathname);
                return (
                  <button
                    key={to}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMore(false);
                      nav(to);
                    }}
                    className={
                      "block w-full px-4 py-2.5 text-left text-base font-medium transition-colors " +
                      (on
                        ? "bg-[color:var(--state-hover)] text-[color:var(--pp-primary-950)]"
                        : "text-ink-secondary hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>
      </StickyChrome>
    </aside>
  );
}

/* ── mobile bottom nav ─────────────────────────────────── */
function MobileNav({ hidden }: { hidden: boolean }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  return (
    <nav
      aria-label={t("nav.main")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur will-change-transform lg:hidden"
      style={{
        transform: hidden ? "translateY(100%)" : "translateY(0)",
        transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {NAV.map((n) => {
          const active = navIsActive(n.id, pathname);
          return (
            <NavLink
              key={n.to}
              to={n.to}
              aria-current={active ? "page" : undefined}
              className={
                "flex flex-col items-center gap-1 px-0.5 py-2.5 text-[0.65rem] leading-tight transition-colors hover:bg-[color:var(--state-hover)] sm:text-xs " +
                (active
                  ? "font-medium text-[color:var(--pp-primary-950)]"
                  : "font-normal text-ink-tertiary")
              }
            >
              <span
                className={
                  "grid h-8 w-8 place-items-center rounded-xl transition-colors " +
                  (active ? "bg-[color:var(--state-hover)]" : "")
                }
              >
                <NavIcon id={n.id} />
              </span>
              <span className="max-w-[4.5rem] truncate text-center">{t(n.labelKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/* ── shell ─────────────────────────────────────────────── */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ChromeVisibilityProvider>
      <AppShellBody>{children}</AppShellBody>
    </ChromeVisibilityProvider>
  );
}

function AppShellBody({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { tx } = useI18n();
  const chromeHidden = useChromeHidden();
  const { review } = useRightRail();
  const isMedOrder = /^\/drug\/[^/]+\/order/.test(pathname);
  const splitJourney = isMedOrder;
  const focusedFlow = isFocusedPatientFlow(pathname) || splitJourney;
  /* PDP / focused browse pages own a sticky right column — Activity would collide. */
  const isDrugDetail = /^\/drug\/[^/]+$/.test(pathname);
  /* Order detail pages only — list keeps Activity rail. */
  const isOrderDetail = /^\/orders\/[^/]+$/.test(pathname);
  const isPharmacies = pathname === "/pharmacies" || pathname.startsWith("/pharmacies/");
  const isDoctors = pathname === "/doctors" || pathname.startsWith("/doctors/");
  const isFacilities = pathname === "/facilities" || pathname.startsWith("/facilities/");
  const isAppointments = pathname.startsWith("/appointments");
  const hideActivityRail =
    isDrugDetail ||
    isOrderDetail ||
    isPharmacies ||
    isDoctors ||
    isFacilities ||
    isAppointments ||
    pathname === "/messages" ||
    pathname === "/support";
  const showActivity = !focusedFlow && !hideActivityRail;

  /**
   * One layout for every screen. Left nav + right rail are usually reserved on
   * large screens so the middle column never shifts. The right rail swaps
   * Activity ↔ Review when a page has unsaved edits. Drug / treatment / order /
   * pharmacies / appointments pages drop the rail so their sticky summary owns
   * the third column.
   */
  return (
    <div className="min-h-screen bg-surface-0">
      <a href="#main" className="pp-skip rounded-full bg-[color:var(--pp-primary-950)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-80">
        {tx("Skip to content")}
      </a>
      <AnnouncementBar />
      <SiteHeader />
      {splitJourney ? (
        <div className={`${FRAME} pb-10 pt-8`}>
          <main id="main" key={pathname} tabIndex={-1} className={`${SURFACE} min-w-0 animate-fade-up`}>
            {children}
          </main>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[105rem] flex-col gap-8 px-5 pb-28 pt-8 md:px-8 lg:flex-row lg:items-stretch lg:pb-10 xl:px-20">
          {focusedFlow ? <div className="hidden w-60 shrink-0 lg:block" aria-hidden /> : <Sidebar />}

          <div className="flex min-w-0 w-full flex-1 flex-col gap-8">
            {showActivity && (review ? <MobileReview /> : <MobileActivity />)}
            <main id="main" key={pathname} tabIndex={-1} className="w-full min-w-0 animate-fade-up">
              {children}
            </main>
          </div>

          {hideActivityRail ? null : focusedFlow ? (
            <ActivityRailSpacer />
          ) : review ? (
            <ReviewRail />
          ) : (
            <ActivityRail />
          )}
        </div>
      )}
      {!focusedFlow && <MobileNav hidden={chromeHidden} />}
    </div>
  );
}

