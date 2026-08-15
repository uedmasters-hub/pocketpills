import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import {
  clearSiteAccessSession,
  passwordUnlock,
  readSiteAccessSession,
  validateSiteAccessSession,
  writeSiteAccessSession,
} from "@/lib/siteAccess";
import { AccessGateSkeleton } from "@/components/ui";

const ink = "text-[#3A2A5C]";
const muted = "text-[#8A8399]";
const softLabel = "text-[#6B6380]";

const inputBase =
  "h-12 w-full rounded-2xl border border-[#E4E0EC] bg-white px-4 text-[15px] text-[#3A2A5C] outline-none transition-shadow placeholder:text-[#B4ADC4] focus:border-[#C8BFE0] focus:shadow-[0_0_0_3px_rgba(90,70,140,0.08)]";

const softBtn =
  "h-12 w-full rounded-2xl bg-[#E8E6F0] text-[15px] font-medium text-[#8A8399] transition-colors disabled:cursor-not-allowed enabled:bg-[#3A2A5C] enabled:text-white enabled:hover:bg-[#2C2048]";

/**
 * Preview gate: temporary password only (magic link paused).
 * Sessions last 30 minutes (server-enforced + local expiry).
 */
export function SiteAccessGate({ children }: { children: ReactNode }) {
  const existing = readSiteAccessSession();
  const [ok, setOk] = useState(!!existing);
  const [checking, setChecking] = useState(!!existing);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = readSiteAccessSession();
      if (!session) {
        if (!cancelled) {
          setOk(false);
          setChecking(false);
        }
        return;
      }
      if (!cancelled) setChecking(true);
      const valid = await validateSiteAccessSession(session.sessionToken);
      if (cancelled) return;
      if (!valid) {
        clearSiteAccessSession();
        setOk(false);
      } else {
        setOk(true);
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return <AccessGateSkeleton />;
  }

  if (ok) return <>{children}</>;

  const onPassword = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await passwordUnlock(password);
      writeSiteAccessSession(session);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F4F9] px-5 py-14">
      <div className="mb-9">
        <Logo />
      </div>

      <div className="w-full max-w-[440px] rounded-[1.75rem] bg-white px-7 py-8 shadow-[0_16px_48px_rgba(40,24,72,0.08)] sm:px-9 sm:py-9">
        <h1 className={`font-display text-[1.75rem] font-semibold tracking-tight ${ink}`}>
          Preview access
        </h1>

        <form onSubmit={onPassword} className="mt-7">
          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${softLabel}`}>Password</span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className={`${inputBase} pr-14 ${error ? "!border-[#D97757]" : ""}`}
                aria-invalid={!!error}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium ${muted} transition-colors hover:text-[#3A2A5C]`}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && (
            <p className="mt-2 text-sm leading-snug text-[#D97757]" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy || !password} className={`mt-5 ${softBtn}`}>
            {busy ? "Checking…" : "Continue"}
          </button>
        </form>
      </div>

      <p className={`mt-9 max-w-md text-center text-xs leading-relaxed ${muted}`}>
        Thanks for taking the time to explore this work. This is a temporary assessment project and
        will be removed soon. If you’d like access, please use the temporary password or reach out
        to Ramesh at{" "}
        <a
          href="tel:+919538000060"
          className="underline decoration-[#8A8399]/45 underline-offset-2 transition-colors hover:text-[#3A2A5C]"
        >
          +91 95380 00060
        </a>
        .
      </p>
    </div>
  );
}
