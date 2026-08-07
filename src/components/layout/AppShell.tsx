import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";

const NAV = [
  { to: "/find-care", label: "Find Care", icon: "🔍" },
  { to: "/dashboard", label: "My Health", icon: "❤️" },
  { to: "/pharmacy", label: "Pharmacy", icon: "💊" },
  { to: "/messages", label: "Messages", icon: "💬" },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="PocketPills home">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[color:var(--color-primary-fg)] text-lg">
        ⊕
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-ink">
        Pocket<span className="text-primary">Pills</span>
      </span>
    </Link>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface-2 text-ink-secondary hover:border-strong"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // Hide chrome navigation while inside the focused flagship flow.
  const focusedFlow = pathname.startsWith("/care/");

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="sticky top-0 z-30 border-b border-line bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          {!focusedFlow && (
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    "rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors " +
                    (isActive ? "bg-primary-subtle text-primary" : "text-ink-secondary hover:bg-surface-2")
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {focusedFlow ? (
              <Link
                to="/dashboard"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-tertiary hover:text-ink"
              >
                Save & exit
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="hidden h-9 items-center rounded-xl border border-line bg-surface-2 px-3.5 text-sm font-semibold text-ink sm:inline-flex"
              >
                Account
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 md:pb-12">{children}</main>

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
