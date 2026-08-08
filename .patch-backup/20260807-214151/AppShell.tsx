import { type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useChromeVisibility } from "@/lib/useChromeVisibility";

const NAV = [
  { to: "/find-care", label: "Find Care", icon: "🔍" },
  { to: "/dashboard", label: "My Health", icon: "❤️" },
  { to: "/pharmacy", label: "Pharmacy", icon: "💊" },
  { to: "/messages", label: "Messages", icon: "💬" },
];


export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // Hide chrome navigation while inside the focused flagship flow.
  const focusedFlow = pathname.startsWith("/care/");
  const chromeHidden = useChromeVisibility();

  return (
    <div className="min-h-screen bg-surface-0">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[105rem] px-5 pb-28 pt-10 md:px-8 md:pb-16 xl:px-20">{children}</main>

      <SiteFooter />

      {/* Mobile bottom nav — hidden in focused flow */}
      {!focusedFlow && (
        <nav className={"fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-1/95 backdrop-blur transition-transform duration-300 ease-out md:hidden " + (chromeHidden ? "translate-y-full" : "translate-y-0")}>
          <div className="mx-auto grid max-w-md grid-cols-4">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold " +
                  (isActive ? "text-primary" : "text-ink-tertiary")
                }
              >
                <span className="text-lg leading-none">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
