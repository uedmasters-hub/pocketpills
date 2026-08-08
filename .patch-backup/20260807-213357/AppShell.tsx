import { type ReactNode } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";

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

  return (
    <div className="min-h-screen bg-surface-0">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[105rem] px-5 pb-28 pt-10 md:px-8 md:pb-16 xl:px-20">{children}</main>

      {!focusedFlow && (
        <footer className="border-t border-line bg-surface-1">
          <div className="mx-auto grid w-full max-w-[105rem] gap-8 px-5 py-10 md:grid-cols-4 md:px-8 xl:px-20">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2" aria-label="PocketPills home">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[color:var(--color-primary-fg)] text-lg">⊕</span>
            <span className="font-display text-lg font-extrabold tracking-tight text-ink">Pocket<span className="text-primary">Pills</span></span>
          </Link>
              <p className="mt-3 max-w-sm text-sm text-ink-tertiary">
                Complete care from Canadian providers—consult, prescribe, and deliver, all in one
                place. Free delivery to every province and territory.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="text-ink-secondary">
                  Care team: <a href="tel:18559507226" className="font-semibold text-primary">1-855-950-7226</a>
                </span>
                <span className="text-ink-secondary">Text · Email · Fax</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Explore</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-tertiary">
                <li><Link to="/find-care" className="hover:text-ink">Find Care</Link></li>
                <li><Link to="/pharmacy" className="hover:text-ink">Pharmacy</Link></li>
                <li><Link to="/dashboard" className="hover:text-ink">My Health</Link></li>
                <li><Link to="/messages" className="hover:text-ink">Messages</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Trust</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-tertiary">
                <li>NABP accredited</li>
                <li>SOC 2 Type 2</li>
                <li>PIPEDA compliant</li>
                <li>4.8★ · 800k+ members</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-line">
            <div className="mx-auto flex w-full max-w-[105rem] flex-col justify-between gap-1 px-5 py-4 text-xs text-ink-tertiary sm:flex-row md:px-8 xl:px-20">
              <span>© 2026 PocketPills · Conceptual redesign, not affiliated with PocketPills Inc.</span>
              <span>PocketPills is not a pharmacy or a drug manufacturer.</span>
            </div>
          </div>
        </footer>
      )}

      {/* Mobile bottom nav — hidden in focused flow */}
      {!focusedFlow && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-1/95 backdrop-blur md:hidden">
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
