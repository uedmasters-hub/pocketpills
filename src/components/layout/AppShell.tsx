import { useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useDismiss } from "@/lib/useDismiss";
import { useChromeVisibility } from "@/lib/useChromeVisibility";

/* ── sidebar icons ─────────────────────────────────────── */
type NavId = "dashboard" | "treatments" | "medications" | "orders" | "more";

function NavIcon({ id }: { id: NavId }) {
  const c = {
    width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.7,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "dashboard":
      return <svg {...c}><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></svg>;
    case "treatments":
      return <svg {...c}><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8.5 7V5.6A1.6 1.6 0 0 1 10.1 4h3.8a1.6 1.6 0 0 1 1.6 1.6V7" /><path d="M12 11.2v4.6M9.7 13.5h4.6" /></svg>;
    case "medications":
      return <svg {...c}><path d="M20.6 3.4a5.5 5.5 0 0 0-7.8 0l-9.4 9.4a5.5 5.5 0 0 0 7.8 7.8l9.4-9.4a5.5 5.5 0 0 0 0-7.8Z" /><path d="m8.1 8.1 7.8 7.8" /></svg>;
    case "orders":
      return <svg {...c}><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>;
    default:
      return <svg {...c}><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></svg>;
  }
}

const NAV: { id: NavId; label: string; to: string }[] = [
  { id: "dashboard", label: "Dashboard", to: "/dashboard" },
  { id: "treatments", label: "Treatments", to: "/find-care" },
  { id: "medications", label: "Medications", to: "/drug" },
  { id: "orders", label: "Orders", to: "/orders" },
];

const MORE: [string, string][] = [
  ["Profile", "/profile"],
  ["Pharmacy", "/pharmacy"],
  ["Messages", "/messages"],
  ["Profile & settings", "/account"],
];

const BASE = "flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[15px] transition-colors";
const IDLE = "text-ink-tertiary hover:bg-[color:var(--pp-primary-100)] hover:text-[color:var(--pp-primary-950)]";
const ACTIVE = "bg-[color:var(--pp-primary-100)] font-medium text-[color:var(--pp-primary-950)]";

/* ── sidebar ───────────────────────────────────────────── */
function Sidebar() {
  const [openMore, setOpenMore] = useState(false);
  const { pathname } = useLocation();
  const nav = useNavigate();
  const moreRef = useDismiss<HTMLDivElement>(openMore, () => setOpenMore(false));
  const moreActive = MORE.some(([, to]) => pathname.startsWith(to));

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <nav className="sticky top-28 flex flex-col gap-1">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `${BASE} ${isActive ? ACTIVE : IDLE}`}>
            <NavIcon id={n.id} />
            {n.label}
          </NavLink>
        ))}

        <div className="relative" ref={moreRef}>
          <button onClick={() => setOpenMore((o) => !o)} className={`${BASE} w-full ${moreActive ? ACTIVE : IDLE}`} aria-expanded={openMore}>
            <NavIcon id="more" />
            More
          </button>
          {openMore && (
            <>
              <div className="absolute left-2 right-0 z-20 mt-1 overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-float">
                {MORE.map(([label, to]) => (
                  <button key={to} onClick={() => { setOpenMore(false); nav(to); }}
                    className="block w-full px-4 py-2.5 text-left text-[13px] font-medium text-ink-secondary hover:bg-surface-1">
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>
    </aside>
  );
}

/* ── mobile bottom nav ─────────────────────────────────── */
function MobileNav({ hidden }: { hidden: boolean }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-1/95 backdrop-blur will-change-transform lg:hidden"
      style={{
        transform: hidden ? "translateY(100%)" : "translateY(0)",
        transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
      <div className="mx-auto grid max-w-md grid-cols-4">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to}
            className={({ isActive }) =>
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium " +
              (isActive ? "text-[color:var(--pp-primary-950)]" : "text-ink-tertiary")
            }>
            <NavIcon id={n.id} />
            {n.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/* ── shell ─────────────────────────────────────────────── */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const focusedFlow =
    pathname.startsWith("/care/") || pathname === "/fill" || pathname === "/transfer";
  const chromeHidden = useChromeVisibility();

  if (focusedFlow) {
    return (
      <div className="min-h-screen bg-surface-0">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[105rem] px-5 pb-24 pt-10 md:px-8 md:pb-16 xl:px-20">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-[105rem] gap-8 px-5 pb-28 pt-8 md:px-8 lg:pb-16 xl:px-20">
        <Sidebar />
        {/* One measure for every page: fill the space beside the sidebar so all
            screens share the same left and right edges. Pages cap their own
            reading width internally where prose needs it. */}
        <main className="w-full min-w-0 flex-1">{children}</main>
      </div>
      <MobileNav hidden={chromeHidden} />
    </div>
  );
}
