import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { useI18n } from "@/lib/i18n";
import {
  SIGNUP_VENDOR_TYPES,
  VENDOR_TYPE_LABELS,
  type BusinessVendorType,
} from "@/lib/businessProfile";
import { useProvider, type AmbulanceRole } from "@/lib/providerAuth";
import {
  authenticateDelegate,
  delegateDisplayName,
  logDelegateActivity,
} from "@/lib/pharmacyDelegates";
import { ProviderPasswordResetPanel } from "@/components/ProviderPasswordResetPanel";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

function ProviderAuthChrome({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  const { tx } = useI18n();
  return (
    <div className="min-h-screen bg-[color:var(--pp-page)]">
      <AnnouncementBar />
      <main className="mx-auto grid w-full max-w-[58rem] gap-10 px-5 py-12 md:px-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-14">
        <div className="mx-auto w-full max-w-[26rem] lg:mx-0">
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Providers")}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {title}
          </h1>
          <p className="mt-2 text-base text-ink-secondary">{sub}</p>
          <div className="mt-8">{children}</div>
        </div>
        <aside className="hidden pt-10 lg:block">
          <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("A portal for every care role")}
          </h2>
          <ul className="mt-6 space-y-4 text-sm text-ink-secondary">
            <li>{tx("Hospital and clinic: doctors, services, and ops boards.")}</li>
            <li>{tx("Pharmacy, lab, ambulance, and solo vendors each get their own tools.")}</li>
            <li>{tx("Every portal can create staff delegates with feature-level access.")}</li>
          </ul>
          <p className="mt-10 text-sm text-ink-tertiary">
            {tx("Looking for prescriptions or appointments as a patient?")}{" "}
            <Link to="/login" className="font-medium text-[color:var(--pp-violet)] hover:underline">
              {tx("Patient login")}
            </Link>
          </p>
        </aside>
      </main>
    </div>
  );
}

export function ProviderLogin() {
  const { tx } = useI18n();
  const { signedIn, logIn, isDelegate } = useProvider();
  const nav = useNavigate();
  const [mode, setMode] = useState<"provider" | "delegate">("provider");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [vendorType, setVendorType] = useState<BusinessVendorType>("doctor");
  const [ambulanceRole, setAmbulanceRole] = useState<AmbulanceRole>("owner");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  if (signedIn) {
    return <Navigate to={isDelegate ? "/provider/requests" : "/provider"} replace />;
  }

  if (resetOpen) {
    return (
      <ProviderAuthChrome
        title={tx("Reset password")}
        sub={tx("Recover access to your provider main account.")}
      >
        <ProviderPasswordResetPanel
          emailHint={email}
          onCancel={() => setResetOpen(false)}
          onDone={({ newPassword }) => {
            setPassword(newPassword);
            setResetOpen(false);
            setMode("provider");
            setError("");
          }}
        />
      </ProviderAuthChrome>
    );
  }

  const submitProvider = () => {
    if (!email.includes("@") || password.length < 1) return;
    setBusy(true);
    setError("");
    const orgDefaults: Partial<Record<BusinessVendorType, string>> = {
      hospital: "Riverside General",
      clinic: "Harbour Family Clinic",
      doctor: "Alex Chen",
      lab: "ClearPath Diagnostics",
      pharmacy: "Corner Care Pharmacy",
      individual: "Alex Chen Care",
      ambulance: "CityLink Ambulance",
    };
    window.setTimeout(() => {
      logIn(email.trim(), {
        vendorType,
        ambulanceRole: vendorType === "ambulance" ? ambulanceRole : undefined,
        accountRole: "owner",
        pharmacyRole: vendorType === "pharmacy" ? "owner" : undefined,
        orgName: orgDefaults[vendorType],
        firstName: "Alex",
        lastName: vendorType === "ambulance" && ambulanceRole === "driver" ? "Driver" : "Chen",
        password: password.trim(),
      });
      nav("/provider", { replace: true });
    }, 280);
  };

  const submitDelegate = () => {
    if (!username.trim() || password.length < 1) return;
    setBusy(true);
    setError("");
    window.setTimeout(() => {
      const d = authenticateDelegate(username, password);
      if (!d) {
        setBusy(false);
        setError(tx("Invalid username or password, or account deactivated."));
        return;
      }
      logIn(`${d.username}@delegate.local`, {
        id: `prov-delegate-${d.id}`,
        vendorType: d.vendorType,
        accountRole: "delegate",
        pharmacyRole: d.vendorType === "pharmacy" ? "delegate" : undefined,
        ownerOrgId: d.orgId,
        pharmacyOrgId: d.vendorType === "pharmacy" ? d.orgId : undefined,
        delegateId: d.id,
        orgName: d.orgName,
        firstName: d.firstName,
        lastName: d.lastName,
      });
      logDelegateActivity({
        orgId: d.orgId,
        delegateId: d.id,
        delegateName: delegateDisplayName(d),
        action: "Signed in",
        detail: "Opened staff desk",
      });
      nav("/provider/requests", { replace: true });
    }, 280);
  };

  return (
    <ProviderAuthChrome
      title={tx("Provider sign in")}
      sub={
        mode === "delegate"
          ? tx("Staff delegate — use the username your practice created. Access follows enabled features.")
          : tx("Choose your portal type for this demo session.")
      }
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["provider", "Provider"],
            ["delegate", "Staff delegate"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              setError("");
            }}
            className={
              "rounded-full px-3.5 py-1.5 text-sm font-medium " +
              (mode === id
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
            }
          >
            {tx(label)}
          </button>
        ))}
      </div>

      {mode === "delegate" ? (
        <>
          <label className="block">
            <span className={LABEL}>{tx("Username")}</span>
            <input
              className={FIELD}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="counter.staff"
            />
          </label>
          <label className="mt-4 block">
            <span className={LABEL}>{tx("Password")}</span>
            <input
              className={FIELD}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          <Button
            fullWidth
            className="mt-6"
            disabled={busy || !username.trim() || password.length < 1}
            onClick={submitDelegate}
          >
            {tx("Sign in to staff desk")}
          </Button>
        </>
      ) : (
        <>
          <label className="block">
            <span className={LABEL}>{tx("Work email")}</span>
            <input
              className={FIELD}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.ca"
            />
          </label>
          <label className="mt-4 block">
            <span className={LABEL}>{tx("Password")}</span>
            <input
              className={FIELD}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
            onClick={() => setResetOpen(true)}
          >
            {tx("Forgot password?")}
          </button>
          <div className="mt-4">
            <p className={LABEL}>{tx("Sign in as")}</p>
            <div className="flex flex-wrap gap-2">
              {SIGNUP_VENDOR_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setVendorType(t)}
                  className={
                    "rounded-full px-3.5 py-1.5 text-sm font-medium " +
                    (vendorType === t
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
                  }
                >
                  {tx(VENDOR_TYPE_LABELS[t])}
                </button>
              ))}
            </div>
          </div>
          {vendorType === "ambulance" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {(["owner", "driver"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setAmbulanceRole(role)}
                  className={
                    "rounded-full px-3.5 py-1.5 text-sm font-medium " +
                    (ambulanceRole === role
                      ? "bg-[color:var(--pp-violet)] text-white"
                      : "border border-line bg-white text-[color:var(--pp-primary-950)]")
                  }
                >
                  {tx(role === "owner" ? "Owner" : "Driver")}
                </button>
              ))}
            </div>
          ) : null}
          <Button
            fullWidth
            className="mt-6"
            disabled={busy || !email.includes("@") || password.length < 1}
            onClick={submitProvider}
          >
            {tx("Sign in")}
          </Button>
        </>
      )}
      <p className="mt-6 text-center text-sm text-ink-secondary">
        {tx("New provider?")}{" "}
        <Link to="/provider/get-started" className="font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Create an account")}
        </Link>
      </p>
    </ProviderAuthChrome>
  );
}

export function ProviderSignUp() {
  const { tx } = useI18n();
  const { signedIn, signUp } = useProvider();
  const nav = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vendorType, setVendorType] = useState<BusinessVendorType>("doctor");
  const [ambulanceRole, setAmbulanceRole] = useState<AmbulanceRole>("owner");
  const [busy, setBusy] = useState(false);

  if (signedIn) return <Navigate to="/provider" replace />;

  const isDoctor = vendorType === "doctor";
  const ready =
    isDoctor ||
    (firstName.trim() &&
      lastName.trim() &&
      orgName.trim() &&
      email.includes("@") &&
      password.trim().length >= 4);

  const submit = () => {
    if (!ready) return;
    if (isDoctor) {
      nav("/doctors/claim");
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      signUp({
        email,
        firstName,
        lastName,
        orgName,
        vendorType,
        ambulanceRole: vendorType === "ambulance" ? ambulanceRole : undefined,
        accountRole: "owner",
        pharmacyRole: vendorType === "pharmacy" ? "owner" : undefined,
        password: password.trim(),
      });
      nav(
        vendorType === "ambulance" && ambulanceRole === "driver" ? "/provider" : "/provider/listing",
        { replace: true },
      );
    }, 320);
  };

  return (
    <ProviderAuthChrome
      title={tx("Join as a provider")}
      sub={tx("Pick your portal — hospital, pharmacy, ambulance, and more.")}
    >
      <div>
        <p className={LABEL}>{tx("Portal type")}</p>
        <div className="flex flex-wrap gap-2">
          {SIGNUP_VENDOR_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setVendorType(t)}
              className={
                "rounded-full px-3.5 py-1.5 text-sm font-medium " +
                (vendorType === t
                  ? "bg-[color:var(--pp-primary-950)] text-white"
                  : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
              }
            >
              {tx(VENDOR_TYPE_LABELS[t])}
            </button>
          ))}
        </div>
      </div>
      {isDoctor ? (
        <p className="mt-4 text-sm text-ink-secondary">
          {tx(
            "Doctors onboard from the Nepal Medical Council registry: search your NMC number, confirm last name, then claim the page with mobile verification.",
          )}
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>{tx("First name")}</span>
              <input className={FIELD} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label className="block">
              <span className={LABEL}>{tx("Last name")}</span>
              <input className={FIELD} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>
          <label className="mt-4 block">
            <span className={LABEL}>{tx("Practice / organization")}</span>
            <input className={FIELD} value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className={LABEL}>{tx("Work email")}</span>
            <input
              className={FIELD}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="mt-4 block">
            <span className={LABEL}>{tx("Password")}</span>
            <input
              className={FIELD}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        </>
      )}
      {vendorType === "ambulance" ? (
        <div className="mt-4">
          <p className={LABEL}>{tx("Ambulance role")}</p>
          <div className="flex flex-wrap gap-2">
            {(["owner", "driver"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setAmbulanceRole(role)}
                className={
                  "rounded-full px-3.5 py-1.5 text-sm font-medium " +
                  (ambulanceRole === role
                    ? "bg-[color:var(--pp-violet)] text-white"
                    : "border border-line bg-white text-[color:var(--pp-primary-950)]")
                }
              >
                {tx(role === "owner" ? "Owner" : "Driver")}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <Button fullWidth className="mt-6" disabled={busy || !ready} onClick={submit}>
        {isDoctor ? tx("Claim your NMC profile") : tx("Create provider account")}
      </Button>
      <p className="mt-6 text-center text-sm text-ink-secondary">
        {tx("Already registered?")}{" "}
        <Link to="/provider/login" className="font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Sign in")}
        </Link>
      </p>
    </ProviderAuthChrome>
  );
}

export function RequireProvider({ children }: { children: React.ReactNode }) {
  const { signedIn } = useProvider();
  const loc = useLocation();
  if (!signedIn) return <Navigate to="/provider/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}
