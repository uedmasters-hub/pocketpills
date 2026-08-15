import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import {
  lookupDdaPharmacy,
  normalizeRegNo,
  searchDdaPharmacies,
  verifyDdaPharmacyName,
  type DdaLookup,
  type DdaPharmacy,
} from "@/lib/ddaApi";
import {
  claimPharmacyProfile,
  clearNameFailures,
  displayPharmacyName,
  formatNepalMobile,
  getClaimOtpMeta,
  getPharmacyClaim,
  lastNameLockStatus,
  maskPharmacyName,
  displayPranali,
  pharmacyProviderId,
  placeLine,
  recordNameFailure,
  rememberVerifiedPharmacy,
  sameDda,
  sendPharmacyClaimOtp,
  verifyPharmacyClaimOtp,
} from "@/lib/pharmacyDirectory";
import { useProvider } from "@/lib/providerAuth";

const CARD = "rounded-2xl border border-line bg-white p-5 sm:p-6";

export function ClaimPharmacy() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const prefill = normalizeRegNo(params.get("reg") || params.get("nmc") || "") ?? "";

  const [regInput, setRegInput] = useState(prefill);
  const [lookup, setLookup] = useState<DdaLookup | null>(null);
  const [nameToken, setNameToken] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [hits, setHits] = useState<DdaPharmacy[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = nameQuery.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      setSearching(true);
      void searchDdaPharmacies(q).then((res) => {
        setSearching(false);
        if (res.ok) setHits(res.data);
        else setHits([]);
      });
    }, 320);
    return () => window.clearTimeout(t);
  }, [nameQuery]);

  const runLookup = async (raw?: string) => {
    const n = normalizeRegNo(raw ?? regInput);
    setError("");
    if (!n) {
      setError(tx("Enter a valid DDA registration number (8–16 digits)."));
      return;
    }
    setBusy(true);
    const res = await lookupDdaPharmacy(n);
    setBusy(false);
    if (!res.ok) {
      setLookup(null);
      setError(res.error);
      return;
    }
    setRegInput(n);
    const existing = getPharmacyClaim(n);
    if (existing) {
      nav(`/pharmacies/${n}`, { replace: true });
      return;
    }
    setLookup(res.data);
  };

  useEffect(() => {
    if (!prefill) return;
    void runLookup(prefill);
    // Directory cards land here with ?reg= — look up once, then name-token step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const runVerify = async () => {
    if (!lookup) return;
    setError("");
    const lock = lastNameLockStatus(lookup.registrationNo);
    if (lock.locked) {
      setError(
        tx("Too many incorrect names. Try again in {n}s.").replace("{n}", String(lock.waitSec)),
      );
      return;
    }
    if (nameToken.trim().length < 3) {
      setError(tx("Enter a distinctive word from the registered pharmacy name."));
      return;
    }
    setBusy(true);
    const res = await verifyDdaPharmacyName(lookup.registrationNo, nameToken);
    setBusy(false);
    if (!res.ok) {
      if (res.status === 403) {
        const next = recordNameFailure(lookup.registrationNo);
        setError(
          next.locked
            ? tx("Too many incorrect names. Try again in {n}s.").replace("{n}", String(next.waitSec))
            : tx("That name does not match this DDA registration. {n} tries left.").replace(
                "{n}",
                String(next.attemptsLeft),
              ),
        );
        return;
      }
      setError(res.error);
      return;
    }
    clearNameFailures(lookup.registrationNo);
    rememberVerifiedPharmacy(res.pharmacy);
    nav(`/pharmacies/${lookup.registrationNo}?claim=1`, { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl">
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Pharmacies")}</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
        {tx("Claim your DDA pharmacy")}
      </h1>
      <p className="mt-2 text-base text-ink-secondary">
        {tx(
          "Look up your Department of Drug Administration registration, confirm a distinctive word from the pharmacy name, then verify a mobile number once. Your public pharmacy page goes live after that.",
        )}
      </p>

      <ol className="mt-6 flex flex-wrap gap-2 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
        <li className={!lookup ? "text-[color:var(--pp-primary-950)]" : ""}>1. {tx("DDA number")}</li>
        <li aria-hidden>·</li>
        <li className={lookup ? "text-[color:var(--pp-primary-950)]" : ""}>2. {tx("Pharmacy name")}</li>
        <li aria-hidden>·</li>
        <li>3. {tx("Mobile claim")}</li>
      </ol>

      {!lookup ? (
        prefill && busy ? (
          <div className={`mt-6 ${CARD}`}>
            <p className="text-sm text-ink-secondary">
              {tx("Opening DDA #{n}…").replace("{n}", prefill)}
            </p>
          </div>
        ) : (
          <div className={`mt-6 ${CARD}`}>
            <Field
              label={tx("DDA registration number")}
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 3711213090457"
              value={regInput}
              onChange={(e) => {
                setRegInput(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runLookup();
              }}
              hint={tx("Digits only. 8–16 digits as on the DDA certificate.")}
            />
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <Button className="mt-5" fullWidth disabled={busy} onClick={() => void runLookup()}>
              {busy ? tx("Looking up…") : tx("Find my record")}
            </Button>

            <div className="mt-8 border-t border-line pt-6">
              <Field
                label={tx("Or search by name")}
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder={tx("Pharmacy name as on the DDA certificate")}
                hint={tx("Pick your row, then you’ll still confirm a distinctive name word.")}
              />
              {searching && <p className="mt-2 text-sm text-ink-tertiary">{tx("Searching registry…")}</p>}
              {hits.length > 0 && (
                <ul className="mt-3 overflow-hidden rounded-xl border border-line">
                  {hits.map((row, i) => (
                    <li key={row.registrationNo} className={i > 0 ? "border-t border-line" : ""}>
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-[color:var(--state-hover)]"
                        onClick={() => void runLookup(row.registrationNo)}
                      >
                        <span>
                          <span className="block font-medium text-[color:var(--pp-primary-950)]">
                            {getPharmacyClaim(row.registrationNo)?.published
                              ? displayPharmacyName(row.name)
                              : maskPharmacyName(row.name)}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-tertiary">
                            {displayPranali(row.pranali)
                              ? `${displayPranali(row.pranali)} · ${placeLine(row)}`
                              : placeLine(row)}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-ink-tertiary tnum">
                          DDA #{row.registrationNo}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {nameQuery.trim().length >= 2 && !searching && hits.length === 0 && (
                <p className="mt-3 text-sm text-ink-tertiary">{tx("No registry matches for that name.")}</p>
              )}
            </div>
          </div>
        )
      ) : (
        <div className={`mt-6 ${CARD}`}>
          <p className="text-sm text-ink-secondary">
            {tx("We found a DDA record in")}{" "}
            <span className="font-medium text-[color:var(--pp-primary-950)]">
              {placeLine({ place: lookup.place, district: lookup.district }) || tx("Nepal")}
            </span>
            {displayPranali(lookup.pranali) ? <> ({displayPranali(lookup.pranali)})</> : null}.{" "}
            {tx(
              "Enter a distinctive word from the registered name (not Pharmacy, Medical, Pvt, or Ltd). The directory hides the full name until you claim.",
            )}
          </p>
          <p className="mt-2 text-xs font-medium text-ink-tertiary tnum">DDA #{lookup.registrationNo}</p>
          {lookup.nameHint ? (
            <p className="mt-1 text-xs text-ink-tertiary">
              {tx("Hint")}: {lookup.nameHint}
            </p>
          ) : null}
          <div className="mt-5">
            <Field
              label={tx("Distinctive name word")}
              value={nameToken}
              autoComplete="off"
              onChange={(e) => {
                setNameToken(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runVerify();
              }}
              hint={tx("Example: Kanchan — not Pharmacy or Pvt.")}
            />
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <div className="mt-5 flex flex-col gap-2">
            <Button fullWidth disabled={busy} onClick={() => void runVerify()}>
              {busy ? tx("Checking…") : tx("Show my pharmacy page")}
            </Button>
            <button
              type="button"
              className="text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
              onClick={() => {
                setLookup(null);
                setNameToken("");
                setError("");
              }}
            >
              {tx("Use a different DDA number")}
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-ink-tertiary">
        {tx("Already claimed a profile?")}{" "}
        <Link to="/provider/login" className="font-medium text-[color:var(--pp-violet)] hover:underline">
          {tx("Provider sign in")}
        </Link>
      </p>
    </div>
  );
}

export function PharmacyClaimPanel({ pharmacy }: { pharmacy: DdaPharmacy }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { signedIn, provider, signUp } = useProvider();
  const n = String(pharmacy.registrationNo);
  const existing = getPharmacyClaim(n);
  const owned = Boolean(provider && existing && existing.providerId === provider.id);
  const otherClaim = Boolean(existing && !owned);
  const thisIdentity = signedIn && sameDda(provider?.ddaNumber, n);
  const needsNewIdentity = !thisIdentity;
  const displayName = displayPharmacyName(pharmacy.name);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const otpMeta = sent ? getClaimOtpMeta(n, phone) : null;
  void now;

  if (owned) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
        <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("This is your profile")}</p>
        <p className="mt-2 text-sm text-ink-secondary">
          {existing?.published
            ? tx("Your card is live on the pharmacy directory.")
            : tx("Claimed, but unpublished. Publish from your listing to show the card.")}
        </p>
        <div className="mt-5 space-y-2">
          <Button fullWidth onClick={() => nav("/provider/listing")}>
            {tx("Open listing")}
          </Button>
          <Button fullWidth variant="secondary" onClick={() => nav("/provider")}>
            {tx("Provider portal")}
          </Button>
        </div>
      </div>
    );
  }

  if (otherClaim) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
        <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Already claimed")}</p>
        <p className="mt-2 text-sm text-ink-secondary">
          {tx("This DDA number already has a published profile. Each registration can only be claimed once.")}
        </p>
        <Button fullWidth className="mt-5" onClick={() => nav(`/pharmacies/${n}`)}>
          {tx("View profile")}
        </Button>
      </div>
    );
  }

  const sendCode = () => {
    setError("");
    if (needsNewIdentity) {
      if (!email.includes("@")) {
        setError(tx("Enter a work email for this pharmacy profile."));
        return;
      }
      if (password.trim().length < 4) {
        setError(tx("Password must be at least 4 characters."));
        return;
      }
    }
    const res = sendPharmacyClaimOtp(n, phone);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setPhone(res.phone);
    setSent(true);
    setOk(tx("Demo verification code (no SMS in this build): {code}").replace("{code}", res.code));
  };

  const finish = () => {
    setError("");
    const checked = verifyPharmacyClaimOtp(n, phone, code);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setBusy(true);
    try {
      const tokens = displayName.split(" ").filter(Boolean);
      const account = needsNewIdentity
        ? signUp({
            id: pharmacyProviderId(n),
            email: email.trim().toLowerCase(),
            firstName: tokens[0] || displayName,
            lastName: tokens.slice(1).join(" ") || tokens[0] || "Pharmacy",
            orgName: displayName,
            vendorType: "pharmacy",
            phone: formatNepalMobile(checked.phone),
            password: password.trim(),
            ddaNumber: n,
          })
        : provider;
      if (!account) {
        setBusy(false);
        setError(tx("Could not create the provider account."));
        return;
      }
      const claim = claimPharmacyProfile({
        pharmacy: { ...pharmacy, registrationNo: n },
        providerId: account.id,
        email: email.trim() || account.email,
        phone: checked.phone,
      });
      setBusy(false);
      if ("error" in claim) {
        setError(claim.error);
        return;
      }
      nav(`/pharmacies/${n}`, { replace: true });
    } catch {
      setBusy(false);
      setError(tx("Could not finish the claim. Try again."));
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
      <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Claim this page")}</p>
      <p className="mt-1 text-sm text-ink-secondary">
        {tx("Verify a Nepal mobile number once. We’ll publish this DDA card on the pharmacy directory.")}
      </p>
      {signedIn && needsNewIdentity && (
        <p className="mt-3 rounded-xl bg-[color:var(--pp-primary-100)] px-3 py-2 text-sm text-[color:var(--pp-primary-950)]">
          {tx(
            "DDA #{n} is a separate profile. Create credentials for this registration — your other claimed pharmacies stay published.",
          ).replace("{n}", n)}
        </p>
      )}

      {needsNewIdentity && (
        <>
          <div className="mt-4">
            <Field
              label={tx("Work email")}
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mt-3">
            <Field
              label={tx("Password")}
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="mt-3">
        <Field
          label={tx("Mobile number")}
          type="tel"
          inputMode="tel"
          placeholder="98XXXXXXXX"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setSent(false);
          }}
          hint={tx("Nepal mobile, 10 digits starting with 9. +977 is OK.")}
        />
      </div>

      {sent && (
        <div className="mt-3">
          <Field
            label={tx("6-digit code")}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === "Enter") finish();
            }}
          />
          {otpMeta && (
            <p className="mt-2 text-2xs text-ink-tertiary">
              {tx("Expires in {n}s").replace("{n}", String(otpMeta.expiresInSec))}
              {otpMeta.resendInSec > 0
                ? ` · ${tx("Resend in {n}s").replace("{n}", String(otpMeta.resendInSec))}`
                : ""}
            </p>
          )}
        </div>
      )}

      {ok && (
        <p className="mt-3 rounded-xl bg-[color:var(--pp-primary-100)] px-3 py-2 text-sm font-medium text-[color:var(--pp-primary-950)]">
          {ok}
        </p>
      )}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-5 space-y-2">
        {!sent ? (
          <Button fullWidth disabled={busy} onClick={sendCode}>
            {tx("Send verification code")}
          </Button>
        ) : (
          <>
            <Button fullWidth disabled={busy || code.length !== 6} onClick={finish}>
              {busy ? tx("Publishing…") : tx("Verify and publish")}
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
              disabled={Boolean(otpMeta && otpMeta.resendInSec > 0)}
              onClick={sendCode}
            >
              {tx("Resend code")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
