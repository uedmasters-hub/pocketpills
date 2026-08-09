import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { AppShell } from "@/components/layout/AppShell";
import { FRAME, SURFACE } from "@/components/layout/Grid";
import { useUser } from "@/lib/user";

/** Shared marketing chrome (header + footer). Used for always-public pages. */
function GuestMarketingChrome() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { signedIn } = useUser();
  const go = (to?: string) => nav(signedIn ? (to ?? "/dashboard") : "/get-started");

  return (
    <div className="min-h-screen bg-[color:var(--pp-page)]">
      <a
        href="#main"
        className="pp-skip rounded-full bg-[color:var(--pp-primary-950)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-80"
      >
        Skip to content
      </a>
      <AnnouncementBar onGo={() => go()} />
      <SiteHeader />
      <main id="main" tabIndex={-1} className={`${FRAME} pb-4 pt-8 md:pt-10`}>
        <div key={pathname} className={`${SURFACE} animate-fade-up`}>
          <Outlet />
        </div>
      </main>
      <SiteFooter go={go} variant="full" />
    </div>
  );
}

/**
 * Always public — How it works, About, FAQs.
 * Signed-in users still get marketing chrome (no AppShell).
 */
export function PublicMarketingLayout() {
  return <GuestMarketingChrome />;
}

/**
 * Treatment + Pharmacy dual chrome:
 * - Logged out → marketing
 * - Logged in  → AppShell (sidebar + Activity)
 */
export function DualBrowseLayout() {
  const { signedIn } = useUser();

  if (signedIn) {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
  }

  return <GuestMarketingChrome />;
}

/** @deprecated Prefer PublicMarketingLayout or DualBrowseLayout */
export const MarketingLayout = DualBrowseLayout;
