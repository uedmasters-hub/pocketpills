import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import {
  lookupNmc,
  normalizeNmcNumber,
  searchNmcDoctors,
  verifyNmcLastName,
  type NmcDoctor,
  type NmcLookup,
  type NmcSearchRow,
} from "@/lib/nmcApi";
import {
  cityFromNmcAddress,
  claimDoctorProfile,
  clearLastNameFailures,
  doctorProviderId,
  formatNepalMobile,
  getClaimOtpMeta,
  getDoctorClaim,
  lastNameLockStatus,
  maskNmcLastName,
  recordLastNameFailure,
  rememberVerifiedNmc,
  sameNmc,
  sendClaimOtp,
  splitNmcName,
  verifyClaimOtp,
} from "@/lib/doctorDirectory";
import { useProvider } from "@/lib/providerAuth";

const CARD = "rounded-2xl border border-line bg-white p-5 sm:p-6";

export function ClaimDoctor() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const prefill = normalizeNmcNumber(params.get("nmc") || "") ?? "";

  const [nmcInput, setNmcInput] = useState(prefill);
  const [lookup, setLookup] = useState<NmcLookup | null>(null);
  const [lastName, setLastName] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [hits, setHits] = useState<NmcSearchRow[]>([]);
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
      void searchNmcDoctors(q).then((res) => {
        setSearching(false);
        if (res.ok) setHits(res.data);
        else setHits([]);
      });
    }, 320);
    return () => window.clearTimeout(t);
  }, [nameQuery]);

  const runLookup = async (raw?: string) => {
    const nmc = normalizeNmcNumber(raw ?? nmcInput);
    setError("");
    if (!nmc) {
      setError(tx("Enter a valid NMC registration number (digits only)."));
      return;
    }
    setBusy(true);
    const res = await lookupNmc(nmc);
    setBusy(false);
    if (!res.ok) {
      setLookup(null);
      setError(res.error);
      return;
    }
    setNmcInput(nmc);
    const existing = getDoctorClaim(nmc);
    if (existing) {
      nav(`/doctors/${nmc}`, { replace: true });
      return;
    }
    setLookup(res.data);
  };

  useEffect(() => {
    if (!prefill) return;
    void runLookup(prefill);
    // Directory cards land here with ?nmc= — look up once, then last-name step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const runVerify = async () => {
    if (!lookup) return;
    setError("");
    const lock = lastNameLockStatus(lookup.nmcNumber);
    if (lock.locked) {
      setError(
        tx("Too many incorrect last names. Try again in {n}s.").replace("{n}", String(lock.waitSec)),
      );
      return;
    }
    if (lastName.trim().length < 2) {
      setError(tx("Enter the last name on your NMC registration."));
      return;
    }
    setBusy(true);
    const res = await verifyNmcLastName(lookup.nmcNumber, lastName);
    setBusy(false);
    if (!res.ok) {
      if (res.status === 403) {
        const next = recordLastNameFailure(lookup.nmcNumber);
        setError(
          next.locked
            ? tx("Too many incorrect last names. Try again in {n}s.").replace("{n}", String(next.waitSec))
            : tx("Last name does not match this NMC registration. {n} tries left.").replace(
                "{n}",
                String(next.attemptsLeft),
              ),
        );
        return;
      }
      setError(res.error);
      return;
    }
    clearLastNameFailures(lookup.nmcNumber);
    rememberVerifiedNmc(res.doctor);
    nav(`/doctors/${lookup.nmcNumber}?claim=1`, { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl">
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Doctors")}</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
        {tx("Claim your NMC profile")}
      </h1>
      <p className="mt-2 text-base text-ink-secondary">
        {tx(
          "Look up your Nepal Medical Council number, confirm the last name on that record, then verify a mobile number once. Your public doctor page goes live after that.",
        )}
      </p>

      <ol className="mt-6 flex flex-wrap gap-2 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
        <li className={!lookup ? "text-[color:var(--pp-primary-950)]" : ""}>1. {tx("NMC number")}</li>
        <li aria-hidden>·</li>
        <li className={lookup ? "text-[color:var(--pp-primary-950)]" : ""}>2. {tx("Last name")}</li>
        <li aria-hidden>·</li>
        <li>3. {tx("Mobile claim")}</li>
      </ol>

      {!lookup ? (
        prefill && busy ? (
          <div className={`mt-6 ${CARD}`}>
            <p className="text-sm text-ink-secondary">
              {tx("Opening NMC #{n}…").replace("{n}", prefill)}
            </p>
          </div>
        ) : (
        <div className={`mt-6 ${CARD}`}>
          <Field
            label={tx("NMC registration number")}
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 1"
            value={nmcInput}
            onChange={(e) => {
              setNmcInput(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runLookup();
            }}
            hint={tx("Digits only. Leading zeros are ignored.")}
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
              placeholder={tx("Family name as on the NMC certificate")}
              hint={tx("Pick your row, then you’ll still confirm last name.")}
            />
            {searching && <p className="mt-2 text-sm text-ink-tertiary">{tx("Searching registry…")}</p>}
            {hits.length > 0 && (
              <ul className="mt-3 overflow-hidden rounded-xl border border-line">
                {hits.map((row, i) => (
                  <li key={row.nmcNumber} className={i > 0 ? "border-t border-line" : ""}>
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-[color:var(--state-hover)]"
                      onClick={() => void runLookup(row.nmcNumber)}
                    >
                      <span>
                        <span className="block font-medium text-[color:var(--pp-primary-950)]">
                          {getDoctorClaim(row.nmcNumber)?.published
                            ? row.name
                            : maskNmcLastName(row.name)}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-tertiary">
                          {row.degree || "—"} · {cityFromNmcAddress(row.address)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-ink-tertiary tnum">
                        NMC #{row.nmcNumber}
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
            {tx("We found an NMC record in")}{" "}
            <span className="font-medium text-[color:var(--pp-primary-950)]">{lookup.cityHint || tx("Nepal")}</span>
            {lookup.degree ? (
              <>
                {" "}
                ({lookup.degree})
              </>
            ) : null}
            . {tx("Enter the last name on that registration to open the pre-filled doctor page. The directory hides the family name until you claim.")}
          </p>
          <p className="mt-2 text-xs font-medium text-ink-tertiary tnum">NMC #{lookup.nmcNumber}</p>
          <div className="mt-5">
            <Field
              label={tx("Last name")}
              value={lastName}
              autoComplete="family-name"
              onChange={(e) => {
                setLastName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runVerify();
              }}
              hint={tx("Use the family name, including a parenthetical alias if that’s on the certificate.")}
            />
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <div className="mt-5 flex flex-col gap-2">
            <Button fullWidth disabled={busy} onClick={() => void runVerify()}>
              {busy ? tx("Checking…") : tx("Show my doctor page")}
            </Button>
            <button
              type="button"
              className="text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
              onClick={() => {
                setLookup(null);
                setLastName("");
                setError("");
              }}
            >
              {tx("Use a different NMC number")}
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

export function ClaimPanel({ doctor }: { doctor: NmcDoctor }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { signedIn, provider, signUp } = useProvider();
  const names = splitNmcName(doctor.name);
  const nmc = String(doctor.nmcNumber);
  const existing = getDoctorClaim(nmc);
  const owned = Boolean(provider && existing && existing.providerId === provider.id);
  const otherClaim = Boolean(existing && !owned);
  const thisIdentity = signedIn && sameNmc(provider?.nmcNumber, nmc);
  const needsNewIdentity = !thisIdentity;

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

  const otpMeta = sent ? getClaimOtpMeta(nmc, phone) : null;
  void now;

  if (owned) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
        <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("This is your profile")}</p>
        <p className="mt-2 text-sm text-ink-secondary">
          {existing?.published
            ? tx("Your card is live on the doctor directory and care hub.")
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
          {tx("This NMC number already has a published profile. Each registration can only be claimed once.")}
        </p>
        <Button fullWidth className="mt-5" onClick={() => nav(`/doctors/${nmc}`)}>
          {tx("View profile")}
        </Button>
      </div>
    );
  }

  const sendCode = () => {
    setError("");
    if (needsNewIdentity) {
      if (!email.includes("@")) {
        setError(tx("Enter a work email for this doctor profile."));
        return;
      }
      if (password.trim().length < 4) {
        setError(tx("Password must be at least 4 characters."));
        return;
      }
    }
    const res = sendClaimOtp(nmc, phone);
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
    const checked = verifyClaimOtp(nmc, phone, code);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setBusy(true);
    try {
      const account = needsNewIdentity
        ? signUp({
            id: doctorProviderId(nmc),
            email: email.trim().toLowerCase(),
            firstName: names.firstName || doctor.name,
            lastName: names.lastName || names.firstName,
            orgName: doctor.name,
            vendorType: "doctor",
            phone: formatNepalMobile(checked.phone),
            password: password.trim(),
            nmcNumber: nmc,
          })
        : provider;
      if (!account) {
        setBusy(false);
        setError(tx("Could not create the provider account."));
        return;
      }
      const claim = claimDoctorProfile({
        doctor: { ...doctor, nmcNumber: nmc },
        providerId: account.id,
        email: email.trim() || account.email,
        phone: checked.phone,
      });
      setBusy(false);
      if ("error" in claim) {
        setError(claim.error);
        return;
      }
      nav(`/doctors/${nmc}`, { replace: true });
    } catch {
      setBusy(false);
      setError(tx("Could not finish the claim. Try again."));
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
      <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Claim this page")}</p>
      <p className="mt-1 text-sm text-ink-secondary">
        {tx("Verify a Nepal mobile number once. We’ll publish this NMC card on the doctor directory.")}
      </p>
      {signedIn && needsNewIdentity && (
        <p className="mt-3 rounded-xl bg-[color:var(--pp-primary-100)] px-3 py-2 text-sm text-[color:var(--pp-primary-950)]">
          {tx("NMC #{n} is a separate profile. Create credentials for this registration — your other claimed doctors stay published.").replace(
            "{n}",
            nmc,
          )}
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
