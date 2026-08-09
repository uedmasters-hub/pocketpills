import { useId, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Card, Field, Progress, Badge, Switch } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useUser, newInsuranceId } from "@/lib/user";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";

/* ── Shared auth chrome ─────────────────────────────────── */
function AuthShell({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--pp-page)]">
      <AnnouncementBar />
      <SiteHeader variant="minimal" />
      <main className="mx-auto grid w-full max-w-[58rem] gap-10 px-5 py-10 md:px-8 md:py-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-14 xl:gap-20">
        <div className="mx-auto w-full max-w-[26rem] lg:mx-0">{children}</div>
        {aside && <aside className="hidden pt-1 lg:block">{aside}</aside>}
      </main>
    </div>
  );
}

function TrustAside() {
  const items: { label: string; icon: ReactNode }[] = [
    {
      label: "Licensed Canadian pharmacy, NABP accredited",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 3h6v3H9V3Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 6h8l1.2 12.2A2 2 0 0 1 15.2 20H8.8a2 2 0 0 1-2-1.8L8 6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M10 11h4M12 9v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Free delivery to every province and territory",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 7h11v10H3V7Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M14 10h4l3 3v4h-7v-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="7" cy="18.5" r="1.4" fill="currentColor" />
          <circle cx="17.5" cy="18.5" r="1.4" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "Pharmacists and clinicians available 7 days a week",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 6.5h10a3 3 0 0 1 3 3V14a3 3 0 0 1-3 3H9l-4 3v-3.5A3 3 0 0 1 5 14V6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "PIPEDA compliant · SOC 2 Type 2 · your data stays yours",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-sm pt-14">
      <h2 className="font-display text-2xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
        Why join PocketPills
      </h2>
      <ul className="mt-8 space-y-5">
        {items.map((it) => (
          <li key={it.label} className="flex gap-3.5 text-sm leading-snug text-ink-secondary">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-950)] text-white">
              {it.icon}
            </span>
            <span className="pt-1.5">{it.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <p className="font-display text-[2.75rem] font-medium leading-none tracking-tight text-[color:var(--pp-primary-400)]">
          800,000+
        </p>
        <p className="mt-2 text-sm text-ink-secondary">Canadians never miss a dose</p>
      </div>
    </div>
  );
}

/* ── Identity helpers ───────────────────────────────────── */
type IdKind = "email" | "phone" | "unknown";

function detectId(raw: string): IdKind {
  const v = raw.trim();
  if (!v) return "unknown";
  if (v.includes("@") || /[a-zA-Z].*@/.test(v)) return "email";
  if (/[a-zA-Z]/.test(v)) return "email";
  const digits = v.replace(/\D/g, "");
  if (digits.length >= 3 && /^[\d\s()+.\-]+$/.test(v)) return "phone";
  return "unknown";
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+${d.slice(0, 1)} (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
}

const inputClass =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink " +
  "placeholder:text-ink-tertiary transition-colors duration-200 " +
  "hover:border-[color:var(--neutral-400)] focus:border-[color:var(--primary-600)]";

/* ── Icons ──────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.422 2.206-1.187 3.022-.8.86-2.13 1.523-3.236 1.433-.13-1.09.43-2.22 1.17-3.02.8-.86 2.2-1.49 3.253-1.435zM20.85 17.43c-.57 1.29-.84 1.86-1.57 3-.92 1.39-2.22 3.12-3.83 3.14-1.43.02-1.8-.93-3.74-.92-1.95.01-2.35.94-3.78.92-1.61-.02-2.84-1.57-3.76-2.96-2.58-3.9-2.85-8.48-1.26-10.9 1.14-1.73 2.95-2.74 4.65-2.74 1.73 0 2.82.95 4.25.95 1.39 0 2.23-.96 4.24-.96 1.52 0 3.12.82 4.25 2.24-3.73 2.05-3.13 7.38.55 8.23z" />
    </svg>
  );
}

function EyeIcon({ off }: { off?: boolean }) {
  if (off) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 3l18 18M10.6 10.7a2.5 2.5 0 0 0 3.5 3.5M9.4 5.5A10.5 10.5 0 0 1 12 5c5 0 9.3 3.1 11 7-.5 1.2-1.2 2.3-2.1 3.2M6.7 6.7C4.7 8 3.3 9.8 2 12c1.7 3.9 6 7 10 7 1.3 0 2.6-.3 3.8-.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CodeArrow() {
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--pp-primary-950)] text-white" aria-hidden>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h12M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/* ── OTP inputs ─────────────────────────────────────────── */
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const setAt = (i: number, ch: string) => {
    const next = value.padEnd(6, " ").split("");
    next[i] = ch;
    onChange(next.join("").replace(/\s/g, "").slice(0, 6));
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={d.trim()}
          aria-label={`Digit ${i + 1}`}
          className="h-12 w-11 rounded-xl border border-line bg-white text-center text-lg font-medium text-ink transition-colors focus:border-[color:var(--primary-600)] sm:w-12"
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            if (!ch) {
              setAt(i, " ");
              return;
            }
            setAt(i, ch);
            refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (pasted) {
              onChange(pasted);
              refs.current[Math.min(pasted.length, 5)]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}

/* ── Log in ─────────────────────────────────────────────── */
type LoginPhase = "form" | "otp" | "magic";

export function Login() {
  const { logIn, signedIn } = useUser();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const idField = useId();
  const pwField = useId();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phase, setPhase] = useState<LoginPhase>("form");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  const kind = detectId(identifier);
  const isPhone = kind === "phone";
  const isEmail = kind === "email";
  const dest = loc.state?.from ?? "/app";

  if (signedIn) return <Navigate to={dest} replace />;

  const finish = (who: string) => {
    logIn(who.includes("@") ? who : `${who.replace(/\D/g, "")}@phone.pocketpills`);
    nav(dest, { replace: true });
  };

  const social = (provider: string) => {
    setBusy(true);
    window.setTimeout(() => finish(`${provider.toLowerCase()}@demo.pocketpills`), 350);
  };

  const sendCode = () => {
    if (isPhone && !isValidPhone(identifier)) return;
    if (isEmail && !isValidEmail(identifier)) return;
    if (kind === "unknown") return;
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      if (isEmail) setPhase("magic");
      else {
        setPhase("otp");
        setOtp("");
        setResent(false);
      }
    }, 450);
  };

  const goAccount = () => {
    if (isPhone && isValidPhone(identifier)) {
      sendCode();
      return;
    }
    if (!isValidEmail(identifier) || password.length < 1) return;
    setBusy(true);
    window.setTimeout(() => finish(identifier.trim()), 300);
  };

  const verifyOtp = () => {
    if (otp.length < 6) return;
    setBusy(true);
    window.setTimeout(() => finish(identifier), 350);
  };

  const canPrimary =
    isPhone
      ? isValidPhone(identifier)
      : isValidEmail(identifier) && password.length >= 1;

  const canCode =
    (isPhone && isValidPhone(identifier)) || (isEmail && isValidEmail(identifier));

  const backToForm = () => {
    setPhase("form");
    setOtp("");
    setBusy(false);
    setResent(false);
  };

  return (
    <AuthShell aside={<TrustAside />}>
      {/* Page intro — matches reference above the card */}
      <div className="mb-6">
        {phase !== "form" && (
          <button
            type="button"
            onClick={backToForm}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary transition-colors hover:text-[color:var(--pp-primary-950)]"
          >
            <span aria-hidden>←</span> Back
          </button>
        )}
        <h1 className="font-display text-[1.75rem] font-medium tracking-tight text-[color:var(--pp-primary-950)] sm:text-3xl">
          {phase === "otp" ? "Enter your code" : phase === "magic" ? "Check your email" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm text-ink-secondary sm:text-base">
          {phase === "otp"
            ? `We texted a 6-digit code to ${identifier.trim()}.`
            : phase === "magic"
              ? `A sign-in link is on its way to ${identifier.trim()}.`
              : "Sign in to manage your prescriptions and orders."}
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-line bg-white p-6 sm:p-8">
        {phase === "form" && (
          <>
            <div className="space-y-4">
              <label htmlFor={idField} className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Phone or Email</span>
                <input
                  id={idField}
                  value={identifier}
                  inputMode={isPhone ? "tel" : isEmail ? "email" : "text"}
                  autoComplete={isPhone ? "tel" : "username"}
                  placeholder="Enter phone number or email"
                  onChange={(e) => {
                    const next = e.target.value;
                    setIdentifier(detectId(next) === "phone" ? formatPhone(next) : next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canPrimary) goAccount();
                  }}
                  className={inputClass}
                />
                {isPhone && (
                  <span className="mt-1.5 block text-xs text-ink-tertiary">
                    Mobile detected — we'll sign you in with a one-time code.
                  </span>
                )}
              </label>

              {/* Password collapses for phone; stays for email / unknown */}
              <div
                className={
                  "grid transition-[grid-template-rows,opacity] duration-300 ease-out " +
                  (isPhone ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")
                }
                aria-hidden={isPhone}
              >
                <div className="overflow-hidden">
                  <label htmlFor={pwField} className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
                    <span className="relative block">
                      <input
                        id={pwField}
                        type={showPw ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        disabled={isPhone}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && canPrimary) goAccount();
                        }}
                        className={inputClass + " pr-11"}
                      />
                      <button
                        type="button"
                        tabIndex={isPhone ? -1 : 0}
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary transition-colors hover:text-ink"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        <EyeIcon off={showPw} />
                      </button>
                    </span>
                  </label>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={sendCode}
                      disabled={!isValidEmail(identifier)}
                      className="text-sm text-ink-secondary underline decoration-line underline-offset-2 transition-colors hover:text-[color:var(--pp-primary-950)] disabled:opacity-40"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              fullWidth
              onClick={goAccount}
              disabled={!canPrimary || busy}
              className="mt-5 !rounded-2xl"
            >
              {busy ? "Please wait…" : isPhone ? "Send code" : "Go to your account"}
            </Button>

            <button
              type="button"
              onClick={sendCode}
              disabled={!canCode || busy}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              Log in with code <CodeArrow />
            </button>

            <div className="my-5 flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-line" />
              <span className="text-xs text-ink-tertiary">or</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => social("Google")}
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-line bg-white px-3 text-sm font-medium text-ink transition-colors hover:bg-[color:var(--state-hover)]"
              >
                <GoogleIcon /> Google
              </button>
              <button
                type="button"
                onClick={() => social("Apple")}
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-line bg-white px-3 text-sm font-medium text-ink transition-colors hover:bg-[color:var(--state-hover)]"
              >
                <AppleIcon /> Apple
              </button>
            </div>

            <div className="mt-7 border-t border-line pt-5 text-center">
              <Link
                to="/get-started"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--pp-primary-950)] hover:underline"
              >
                New to Pocketpills? <span className="underline">Create account</span>
                <span aria-hidden>→</span>
              </Link>
              <p className="mt-3 text-2xs leading-relaxed text-ink-tertiary">
                By proceeding, you agree to our{" "}
                <a href="#terms" className="underline underline-offset-2 hover:text-ink-secondary">
                  Terms of Use
                </a>{" "}
                &amp;{" "}
                <a href="#privacy" className="underline underline-offset-2 hover:text-ink-secondary">
                  Privacy Policy
                </a>
                . Message &amp; data rates apply.
              </p>
            </div>
          </>
        )}

        {phase === "otp" && (
          <div className="space-y-5">
            <OtpInput value={otp} onChange={setOtp} />
            <Button fullWidth onClick={verifyOtp} disabled={otp.length < 6 || busy} className="!rounded-2xl">
              {busy ? "Verifying…" : "Verify & sign in"}
            </Button>
            <p className="text-center text-sm text-ink-secondary">
              Didn't get it?{" "}
              <button
                type="button"
                className="font-semibold text-[color:var(--pp-violet)] hover:underline"
                onClick={() => {
                  setResent(true);
                  setOtp("");
                }}
              >
                {resent ? "Code resent" : "Resend code"}
              </button>
            </p>
            <p className="text-center text-xs text-ink-tertiary">Demo — any 6 digits work.</p>
          </div>
        )}

        {phase === "magic" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-line bg-[color:var(--pp-primary-200)] px-4 py-5 text-center">
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">Link sent</p>
              <p className="mt-1 text-sm text-ink-secondary">
                Open the email on this device to finish signing in.
              </p>
            </div>
            <Button
              fullWidth
              className="!rounded-2xl"
              onClick={() => {
                setBusy(true);
                window.setTimeout(() => finish(identifier.trim()), 300);
              }}
              disabled={busy}
            >
              {busy ? "Signing in…" : "I've opened the link (demo)"}
            </Button>
            <button
              type="button"
              onClick={sendCode}
              className="mx-auto block text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
            >
              Resend link
            </button>
          </div>
        )}
      </div>
    </AuthShell>
  );
}

/* ── Sign up + onboarding ───────────────────────────────── */
const STEPS = ["Account", "About you", "Coverage", "Delivery"] as const;

export function SignUp() {
  const { signUp, update, user } = useUser();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    email: "", password: "", firstName: "", lastName: "", dob: "", phone: "",
    province: "ON", healthCard: "", hasInsurance: true, carrier: "", group: "", member: "",
    address: "", allergies: "",
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const canNext =
    step === 0 ? !!f.firstName && !!f.lastName && !!f.email && !!f.password :
    step === 1 ? !!f.dob && !!f.phone :
    step === 2 ? true :
    !!f.address;

  const next = () => {
    if (step === 0 && !user) {
      signUp(f.email);
      update({ firstName: f.firstName, lastName: f.lastName });
    }
    if (step < STEPS.length - 1) return setStep(step + 1);
    update({
      email: f.email, firstName: f.firstName, lastName: f.lastName, dob: f.dob, phone: f.phone,
      province: f.province, healthCard: f.healthCard, address: f.address,
      allergies: f.allergies ? f.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
      insurances: f.hasInsurance
        ? [{ id: newInsuranceId(), carrier: f.carrier || "Sun Life", group: f.group, member: f.member }]
        : [],
      onboarded: true,
    });
    nav("/app", { replace: true });
  };

  return (
    <AuthShell aside={<TrustAside />}>
      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="pp-caps text-[color:var(--pp-violet)]">Join PocketPills</p>
          <p className="text-xs text-ink-tertiary tnum">Step {step + 1} of {STEPS.length}</p>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} label={`Step ${step + 1} of ${STEPS.length}`} />
      </div>

      <h1 className="font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
        {step === 0 ? "Create your account" : step === 1 ? (f.firstName ? `Nice to meet you, ${f.firstName}` : "Tell us about you") : step === 2 ? "Your coverage" : "Where should we deliver?"}
      </h1>
      <p className="mt-2 text-ink-secondary">
        {step === 0 ? "Free to join. No membership fees, ever." :
         step === 1 ? "This helps your pharmacist care for you safely." :
         step === 2 ? "We'll bill your plan directly so you pay less." :
         "Free delivery, anywhere in Canada."}
      </p>

      <Card className="mt-6 space-y-4 p-6">
        {step === 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" placeholder="Alex" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} />
              <Field label="Last name" placeholder="Mandal" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
            <Field label="Email" type="email" placeholder="you@example.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
            <Field label="Password" type="password" placeholder="At least 8 characters" value={f.password} onChange={(e) => set("password", e.target.value)} />
            <p className="text-xs text-ink-tertiary">By continuing you agree to our Terms and Privacy Policy.</p>
          </>
        )}
        {step === 1 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date of birth" placeholder="YYYY-MM-DD" value={f.dob} onChange={(e) => set("dob", e.target.value)} />
              <Field label="Phone" placeholder="(416) 555-0100" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <Field label="Allergies (optional)" placeholder="e.g. penicillin, sulfa" value={f.allergies} onChange={(e) => set("allergies", e.target.value)} hint="Separate with commas." />
          </>
        )}
        {step === 2 && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-secondary" id="auth-province-label">Province</span>
              <select
                value={f.province}
                onChange={(e) => set("province", e.target.value)}
                aria-labelledby="auth-province-label"
                className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-ink focus:border-primary"
              >
                {["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <Field label="Health card number (optional)" value={f.healthCard} onChange={(e) => set("healthCard", e.target.value)} />
            <div className="border-t border-line pt-4">
              <Switch
                checked={f.hasInsurance}
                onChange={(v) => set("hasInsurance", v)}
                label="I have private insurance"
                desc="We'll bill your plan directly."
              />
            </div>
            {f.hasInsurance && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Carrier" placeholder="Sun Life" value={f.carrier} onChange={(e) => set("carrier", e.target.value)} />
                <Field label="Group #" value={f.group} onChange={(e) => set("group", e.target.value)} />
                <Field label="Member ID" value={f.member} onChange={(e) => set("member", e.target.value)} />
              </div>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <Field label="Delivery address" placeholder="Street, city, province, postal code" value={f.address} onChange={(e) => set("address", e.target.value)} />
            <div className="rounded-xl bg-wellness-subtle p-4">
              <Badge tone="wellness">Free delivery</Badge>
              <p className="mt-2 text-sm text-ink-secondary">Standard delivery is always free, to every province and territory.</p>
            </div>
          </>
        )}
      </Card>

      <div className="mt-5 flex items-center justify-between gap-3">
        {step > 0 ? <Button variant="secondary" onClick={() => setStep(step - 1)}>← Back</Button> : <span />}
        <Button onClick={next} disabled={!canNext}>{step === STEPS.length - 1 ? "Create account" : "Continue"}</Button>
      </div>

      {step === 0 && (
        <p className="mt-5 text-center text-sm text-ink-secondary">
          Already a member? <Link to="/login" className="font-semibold text-[color:var(--pp-violet)] hover:underline">Sign in</Link>
        </p>
      )}
    </AuthShell>
  );
}

/* ── Route guard ────────────────────────────────────────── */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { signedIn } = useUser();
  const loc = useLocation();
  if (!signedIn) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}
