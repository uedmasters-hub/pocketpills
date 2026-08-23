import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DIRECTORY_SIDEBAR_CARD } from "@/components/DirectoryDetailLayout";
import { Button } from "@/components/ui/Button";
import { ClaimLookupSkeleton, Field, RegistrySearchSkeleton } from "@/components/ui";
import { PhoneField } from "@/components/PhoneField";
import { useI18n } from "@/lib/i18n";
import {
  lookupHfFacility,
  normalizeHfCode,
  searchHfFacilities,
  verifyHfFacilityName,
  type HfLookup,
  type HfFacility,
} from "@/lib/hfApi";
import {
  claimFacilityProfile,
  clearNameFailures,
  displayFacilityLevel,
  displayFacilityName,
  facilityProviderId,
  formatNepalMobile,
  getClaimOtpMeta,
  getFacilityClaim,
  lastNameLockStatus,
  maskFacilityName,
  recordNameFailure,
  rememberVerifiedFacility,
  sameHf,
  sendFacilityClaimOtp,
  vendorFromFacilityLevel,
  verifyFacilityClaimOtp,
} from "@/lib/facilityDirectory";
import { useProvider } from "@/lib/providerAuth";

const CARD = "rounded-2xl border border-line bg-white p-5 sm:p-6";

export function ClaimFacility() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const prefill = normalizeHfCode(params.get("hf") || params.get("code") || "") ?? "";

  const [codeInput, setCodeInput] = useState(prefill);
  const [lookup, setLookup] = useState<HfLookup | null>(null);
  const [nameToken, setNameToken] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [hits, setHits] = useState<HfFacility[]>([]);
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
      void searchHfFacilities(q).then((res) => {
        setSearching(false);
        if (res.ok) setHits(res.data);
        else setHits([]);
      });
    }, 320);
    return () => window.clearTimeout(t);
  }, [nameQuery]);

  const runLookup = async (raw?: string) => {
    const n = normalizeHfCode(raw ?? codeInput);
    setError("");
    if (!n) {
      setError(tx("Enter a valid health facility code (8–12 digits)."));
      return;
    }
    setBusy(true);
    const res = await lookupHfFacility(n);
    setBusy(false);
    if (!res.ok) {
      setLookup(null);
      setError(res.error);
      return;
    }
    setCodeInput(n);
    const existing = getFacilityClaim(n);
    if (existing) {
      nav(`/facilities/${n}`, { replace: true });
      return;
    }
    setLookup(res.data);
  };

  useEffect(() => {
    if (!prefill) return;
    void runLookup(prefill);
    // Directory cards land here with ?hf= — look up once, then name-token step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const runVerify = async () => {
    if (!lookup) return;
    setError("");
    const lock = lastNameLockStatus(lookup.hfCode);
    if (lock.locked) {
      setError(
        tx("Too many incorrect names. Try again in {n}s.").replace("{n}", String(lock.waitSec)),
      );
      return;
    }
    if (nameToken.trim().length < 3) {
      setError(tx("Enter a distinctive word from the registered facility name."));
      return;
    }
    setBusy(true);
    const res = await verifyHfFacilityName(lookup.hfCode, nameToken);
    setBusy(false);
    if (!res.ok) {
      if (res.status === 403) {
        const next = recordNameFailure(lookup.hfCode);
        setError(
          next.locked
            ? tx("Too many incorrect names. Try again in {n}s.").replace("{n}", String(next.waitSec))
            : tx("That name does not match this health facility. {n} tries left.").replace(
                "{n}",
                String(next.attemptsLeft),
              ),
        );
        return;
      }
      setError(res.error);
      return;
    }
    clearNameFailures(lookup.hfCode);
    rememberVerifiedFacility(res.facility);
    nav(`/facilities/${lookup.hfCode}?claim=1`, { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl">
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Facilities")}</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
        {tx("Claim your health facility")}
      </h1>
      <p className="mt-2 text-base text-ink-secondary">
        {tx(
          "Look up your health facility code, confirm a distinctive word from the registered name, then verify a mobile number once. Your public facility page goes live after that.",
        )}
      </p>

      <ol className="mt-6 flex flex-wrap gap-2 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
        <li className={!lookup ? "text-[color:var(--pp-primary-950)]" : ""}>1. {tx("Facility code")}</li>
        <li aria-hidden>·</li>
        <li className={lookup ? "text-[color:var(--pp-primary-950)]" : ""}>2. {tx("Facility name")}</li>
        <li aria-hidden>·</li>
        <li>3. {tx("Mobile claim")}</li>
      </ol>

      {!lookup ? (
        prefill && busy ? (
          <ClaimLookupSkeleton label={tx("Opening HF #{n}…").replace("{n}", prefill)} />
        ) : (
          <div className={`mt-6 ${CARD}`}>
            <Field
              label={tx("Health facility code")}
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 3060100072"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runLookup();
              }}
              hint={tx("Digits only. 8–12 digits as on the facility record.")}
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
                placeholder={tx("Facility name as registered")}
                hint={tx("Pick your row, then you’ll still confirm a distinctive name word.")}
              />
              {searching && <RegistrySearchSkeleton />}
              {hits.length > 0 && (
                <ul className="mt-3 overflow-hidden rounded-xl border border-line">
                  {hits.map((row, i) => (
                    <li key={row.hfCode} className={i > 0 ? "border-t border-line" : ""}>
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-[color:var(--state-hover)]"
                        onClick={() => void runLookup(row.hfCode)}
                      >
                        <span>
                          <span className="block font-medium text-[color:var(--pp-primary-950)]">
                            {getFacilityClaim(row.hfCode)?.published
                              ? displayFacilityName(row.name)
                              : maskFacilityName(row.name)}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-tertiary">
                            {displayFacilityLevel(row.facilityLevel)
                              ? `${displayFacilityLevel(row.facilityLevel)} · ${row.district || tx("Nepal")}`
                              : row.district || tx("Nepal")}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-ink-tertiary tnum">
                          HF #{row.hfCode}
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
            {tx("We found a health facility in")}{" "}
            <span className="font-medium text-[color:var(--pp-primary-950)]">
              {lookup.district || tx("Nepal")}
            </span>
            {displayFacilityLevel(lookup.facilityLevel) ? (
              <> ({displayFacilityLevel(lookup.facilityLevel)})</>
            ) : null}
            .{" "}
            {tx(
              "Enter a distinctive word from the registered name (not Hospital, Clinic, Health, Pvt, or Ltd). The directory hides the full name until you claim.",
            )}
          </p>
          <p className="mt-2 text-xs font-medium text-ink-tertiary tnum">HF #{lookup.hfCode}</p>
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
              hint={tx("Example: Peoples — not Hospital or Pvt.")}
            />
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <div className="mt-5 flex flex-col gap-2">
            <Button fullWidth disabled={busy} onClick={() => void runVerify()}>
              {busy ? tx("Checking…") : tx("Show my facility page")}
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
              {tx("Use a different facility code")}
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

export function FacilityClaimPanel({ facility }: { facility: HfFacility }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { signedIn, provider, signUp } = useProvider();
  const n = String(facility.hfCode);
  const existing = getFacilityClaim(n);
  const owned = Boolean(provider && existing && existing.providerId === provider.id);
  const otherClaim = Boolean(existing && !owned);
  const thisIdentity = signedIn && sameHf(provider?.hfCode, n);
  const needsNewIdentity = !thisIdentity;
  const displayName = displayFacilityName(facility.name);
  const vendor = vendorFromFacilityLevel(facility.facilityLevel);

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
      <div className={DIRECTORY_SIDEBAR_CARD}>
        <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("This is your profile")}</p>
        <p className="mt-2 text-sm text-ink-secondary">
          {existing?.published
            ? tx("Your card is live on the facility directory.")
            : tx("Claimed, but unpublished. Publish from your listing to show the card.")}
        </p>
        <div className="mt-4 space-y-2">
          <Button fullWidth size="sm" onClick={() => nav("/provider/listing")}>
            {tx("Open listing")}
          </Button>
          <Button fullWidth size="sm" variant="secondary" onClick={() => nav("/provider")}>
            {tx("Provider portal")}
          </Button>
        </div>
      </div>
    );
  }

  if (otherClaim) {
    return (
      <div className={DIRECTORY_SIDEBAR_CARD}>
        <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Already claimed")}</p>
        <p className="mt-2 text-sm text-ink-secondary">
          {tx("This facility code already has a published profile. Each facility can only be claimed once.")}
        </p>
        <Button fullWidth size="sm" className="mt-4" onClick={() => nav(`/facilities/${n}`)}>
          {tx("View profile")}
        </Button>
      </div>
    );
  }

  const sendCode = () => {
    setError("");
    if (needsNewIdentity) {
      if (!email.includes("@")) {
        setError(tx("Enter a work email for this facility profile."));
        return;
      }
      if (password.trim().length < 4) {
        setError(tx("Password must be at least 4 characters."));
        return;
      }
    }
    const res = sendFacilityClaimOtp(n, phone);
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
    const checked = verifyFacilityClaimOtp(n, phone, code);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setBusy(true);
    try {
      const tokens = displayName.split(" ").filter(Boolean);
      const account = needsNewIdentity
        ? signUp({
            id: facilityProviderId(n),
            email: email.trim().toLowerCase(),
            firstName: tokens[0] || displayName,
            lastName: tokens.slice(1).join(" ") || tokens[0] || "Facility",
            orgName: displayName,
            vendorType: vendor,
            phone: formatNepalMobile(checked.phone),
            password: password.trim(),
            hfCode: n,
          })
        : provider;
      if (!account) {
        setBusy(false);
        setError(tx("Could not create the provider account."));
        return;
      }
      const claim = claimFacilityProfile({
        facility: { ...facility, hfCode: n },
        providerId: account.id,
        email: email.trim() || account.email,
        phone: checked.phone,
      });
      setBusy(false);
      if ("error" in claim) {
        setError(claim.error);
        return;
      }
      nav(`/facilities/${n}`, { replace: true });
    } catch {
      setBusy(false);
      setError(tx("Could not finish the claim. Try again."));
    }
  };

  return (
    <div className={DIRECTORY_SIDEBAR_CARD}>
      <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Claim this page")}</p>
      <p className="mt-1 text-sm text-ink-secondary">
        {tx("Verify a Nepal mobile number once. We’ll publish this facility card on the directory.")}
      </p>
      {signedIn && needsNewIdentity && (
        <p className="mt-3 rounded-xl bg-[color:var(--pp-primary-100)] px-3 py-2 text-sm text-[color:var(--pp-primary-950)]">
          {tx(
            "HF #{n} is a separate profile. Create credentials for this facility — your other claimed profiles stay published.",
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
        <PhoneField
          label={tx("Mobile number")}
          value={phone}
          onChange={(v) => {
            setPhone(v);
            setSent(false);
          }}
          allowedIsos={["NP"]}
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

      <div className="mt-4 space-y-2">
        {!sent ? (
          <Button fullWidth size="sm" disabled={busy} onClick={sendCode}>
            {tx("Send verification code")}
          </Button>
        ) : (
          <>
            <Button fullWidth size="sm" disabled={busy || code.length !== 6} onClick={finish}>
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
