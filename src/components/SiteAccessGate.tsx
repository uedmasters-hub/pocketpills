import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

const STORAGE_KEY = "pp.siteAccess.v1";
const SITE_PASSWORD = "ramsm";

function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function unlock() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Simple preview-gate for the redesign demo.
 * Password: ramsm — stored in sessionStorage for the tab session.
 */
export function SiteAccessGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(isUnlocked);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  if (ok) return <>{children}</>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      unlock();
      setOk(true);
      setError(false);
      return;
    }
    setError(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,7,48,0.06)] sm:p-8"
        >
          <h1 className="font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            Enter password
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            This preview is password protected.
          </p>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-sm font-medium text-[color:var(--pp-primary-950)]">
              Password
            </span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={
                  "h-12 w-full rounded-2xl border bg-white px-4 pr-12 text-base text-ink focus:border-primary " +
                  (error ? "border-danger" : "border-line")
                }
                aria-invalid={error}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && (
            <p className="mt-2 text-sm text-danger" role="alert">
              Incorrect password. Try again.
            </p>
          )}

          <Button type="submit" fullWidth className="mt-6 !rounded-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
