import { useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Card, Field, Progress, Badge } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/lib/user";

/* ── Shared auth chrome ─────────────────────────────────── */
function AuthShell({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-0">
      <header className="border-b border-line bg-surface-1">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[color:var(--color-primary-fg)] text-lg">⊕</span>
            <span className="font-display text-lg font-extrabold text-ink">Pocket<span className="text-primary">Pills</span></span>
          </Link>
          <a href="tel:18559507226" className="text-sm font-semibold text-ink-tertiary hover:text-ink">Need help? 1-855-950-7226</a>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-12 md:px-8 lg:grid-cols-[1fr_340px]">
        <div className="mx-auto w-full max-w-md lg:mx-0">{children}</div>
        {aside && <aside className="hidden lg:block">{aside}</aside>}
      </main>
    </div>
  );
}

function TrustAside() {
  return (
    <Card className="p-6">
      <p className="font-semibold text-ink">Why join PocketPills</p>
      <ul className="mt-4 space-y-3 text-sm text-ink-secondary">
        {[
          ["🇨🇦", "Licensed Canadian pharmacy, NABP accredited"],
          ["🚚", "Free delivery to every province and territory"],
          ["💬", "Pharmacists and clinicians available 7 days a week"],
          ["🔒", "PIPEDA compliant · SOC 2 Type 2 · your data stays yours"],
        ].map(([i, t]) => (
          <li key={t} className="flex gap-3"><span>{i}</span><span>{t}</span></li>
        ))}
      </ul>
      <div className="mt-5 border-t border-line pt-4">
        <p className="font-display text-2xl font-extrabold text-ink">800,000+</p>
        <p className="text-sm text-ink-tertiary">Canadians never miss a dose</p>
      </div>
    </Card>
  );
}

/* ── Log in ─────────────────────────────────────────────── */
export function Login() {
  const { logIn, signedIn } = useUser();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  if (signedIn) return <Navigate to={loc.state?.from ?? "/app"} replace />;

  const submit = () => {
    if (!email) return;
    logIn(email);
    nav(loc.state?.from ?? "/app", { replace: true });
  };

  return (
    <AuthShell aside={<TrustAside />}>
      <h1 className="text-3xl font-extrabold text-ink">Welcome back</h1>
      <p className="mt-2 text-ink-secondary">Sign in to manage your prescriptions and orders.</p>
      <Card className="mt-6 space-y-4 p-6">
        <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button fullWidth onClick={submit} disabled={!email}>Sign in</Button>
        <p className="text-center text-xs text-ink-tertiary">Demo sign-in — any email works, no password needed.</p>
      </Card>
      <p className="mt-5 text-center text-sm text-ink-secondary">
        New to PocketPills? <Link to="/get-started" className="font-semibold text-primary hover:underline">Create an account</Link>
      </p>
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
    step === 0 ? !!f.email && !!f.password :
    step === 1 ? !!f.firstName && !!f.lastName :
    step === 2 ? true :
    !!f.address;

  const next = () => {
    if (step === 0 && !user) signUp(f.email);
    if (step < STEPS.length - 1) return setStep(step + 1);
    update({
      email: f.email, firstName: f.firstName, lastName: f.lastName, dob: f.dob, phone: f.phone,
      province: f.province, healthCard: f.healthCard, address: f.address,
      allergies: f.allergies ? f.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
      insurance: f.hasInsurance ? { carrier: f.carrier || "Sun Life", group: f.group, member: f.member } : null,
      onboarded: true,
    });
    nav("/app", { replace: true });
  };

  return (
    <AuthShell aside={<TrustAside />}>
      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Join PocketPills</p>
          <p className="text-xs text-ink-tertiary tnum">Step {step + 1} of {STEPS.length}</p>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </div>

      <h1 className="text-3xl font-extrabold text-ink">
        {step === 0 ? "Create your account" : step === 1 ? "Tell us about you" : step === 2 ? "Your coverage" : "Where should we deliver?"}
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
            <Field label="Email" type="email" placeholder="you@example.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
            <Field label="Password" type="password" placeholder="At least 8 characters" value={f.password} onChange={(e) => set("password", e.target.value)} />
            <p className="text-xs text-ink-tertiary">By continuing you agree to our Terms and Privacy Policy.</p>
          </>
        )}
        {step === 1 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} />
              <Field label="Last name" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
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
              <span className="mb-1.5 block text-sm font-medium text-ink-secondary">Province</span>
              <select value={f.province} onChange={(e) => set("province", e.target.value)} className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-ink focus:border-primary">
                {["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <Field label="Health card number (optional)" value={f.healthCard} onChange={(e) => set("healthCard", e.target.value)} />
            <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-line pt-4">
              <span><span className="font-semibold text-ink">I have private insurance</span><span className="mt-0.5 block text-sm text-ink-tertiary">We'll bill your plan directly.</span></span>
              <span onClick={() => set("hasInsurance", !f.hasInsurance)} role="switch" aria-checked={f.hasInsurance} tabIndex={0}
                className={"relative h-7 w-12 shrink-0 rounded-full transition-colors " + (f.hasInsurance ? "bg-primary" : "bg-stone-300 dark:bg-stone-600")}>
                <span className={"absolute top-1 h-5 w-5 rounded-full bg-white transition-all " + (f.hasInsurance ? "left-6" : "left-1")} />
              </span>
            </label>
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
          Already a member? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
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
