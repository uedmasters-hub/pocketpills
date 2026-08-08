import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/lib/user";

const NAV = [
  { to: "/find-care", label: "Find Care", icon: "🔍" },
  { to: "/dashboard", label: "My Health", icon: "❤️" },
  { to: "/pharmacy", label: "Pharmacy", icon: "💊" },
  { to: "/messages", label: "Messages", icon: "💬" },
];

function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2" aria-label="PocketPills home">
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


function UserMenu() {
  const { user, signedIn, initials, displayName, logOut } = useUser();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  if (!signedIn)
    return (
      <Link to="/login" className="inline-flex h-9 items-center rounded-xl border border-line bg-surface-2 px-3.5 text-sm font-semibold text-ink">
        Sign in
      </Link>
    );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 py-1 pl-1 pr-2.5 text-sm font-semibold text-ink hover:border-strong"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-xs text-[color:var(--color-primary-fg)]">{initials}</span>
        <span className="hidden sm:inline">{displayName}</span>
        <span className="text-ink-tertiary" aria-hidden>⌄</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-float">
            <div className="border-b border-line p-4">
              <p className="font-semibold text-ink">{displayName}</p>
              <p className="truncate text-xs text-ink-tertiary">{user?.email}</p>
            </div>
            {[["My Health", "/dashboard"], ["Orders & receipts", "/orders"], ["Pharmacy", "/pharmacy"], ["Profile & settings", "/account"]].map(([label, to]) => (
              <button key={to} role="menuitem" onClick={() => { setOpen(false); nav(to); }}
                className="block w-full px-4 py-2.5 text-left text-sm font-medium text-ink-secondary hover:bg-surface-1">
                {label}
              </button>
            ))}
            <button role="menuitem" onClick={() => { setOpen(false); logOut(); nav("/"); }}
              className="block w-full border-t border-line px-4 py-2.5 text-left text-sm font-semibold text-danger hover:bg-surface-1">
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // Hide chrome navigation while inside the focused flagship flow.
  const focusedFlow = pathname.startsWith("/care/");

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="sticky top-0 z-30 border-b border-line bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[105rem] items-center justify-between gap-4 px-5 md:px-8 xl:px-20">
          <Logo to="/app" />
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
              <UserMenu />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[105rem] px-5 pb-28 pt-10 md:px-8 md:pb-16 xl:px-20">{children}</main>

      {!focusedFlow && (
        <footer className="border-t border-line bg-surface-1">
          <div className="mx-auto grid w-full max-w-[105rem] gap-8 px-5 py-10 md:grid-cols-4 md:px-8 xl:px-20">
            <div className="md:col-span-2">
              <Logo />
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
