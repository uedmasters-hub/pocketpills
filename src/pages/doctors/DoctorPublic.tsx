import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { DoctorProfilePage } from "@/pages/appointments/ProviderDetail";
import { normalizeNmcNumber } from "@/lib/nmcApi";
import {
  claimToCareProvider,
  getDoctorClaim,
  getVerifiedNmc,
  nmcDoctorToCareProvider,
  nmcNumberFromId,
  sameNmc,
} from "@/lib/doctorDirectory";
import { useProvider } from "@/lib/providerAuth";
import { useUser } from "@/lib/user";
import { ClaimPanel } from "@/pages/doctors/ClaimDoctor";

export function DoctorPublic() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { nmcNumber: raw } = useParams();
  const [params] = useSearchParams();
  const wantClaim = params.get("claim") === "1";
  const { provider } = useProvider();
  const { signedIn } = useUser();

  const nmc = normalizeNmcNumber(raw || "") ?? nmcNumberFromId(raw || "");
  if (!nmc) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Invalid NMC number")}</p>
        <Link to="/doctors" className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Back to directory")}
        </Link>
      </div>
    );
  }

  const claim = getDoctorClaim(nmc);
  const verified = getVerifiedNmc(nmc);
  const owned = Boolean(
    provider &&
      claim &&
      (claim.providerId === provider.id || sameNmc(provider.nmcNumber, nmc)),
  );

  if (claim?.published) {
    const care = claimToCareProvider(claim);
    return (
      <DoctorProfilePage
        provider={care}
        backTo="/doctors"
        backLabel={tx("Doctor directory")}
        sidebar={
          owned ? (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Your live profile")}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                {tx("Patients can book this page. Edit hours and bio from your listing.")}
              </p>
              <Button fullWidth className="mt-5" onClick={() => nav("/provider/listing")}>
                {tx("Edit listing")}
              </Button>
            </div>
          ) : undefined
        }
      />
    );
  }

  if (claim && !claim.published) {
    if (owned) {
      return (
        <DoctorProfilePage
          provider={claimToCareProvider(claim)}
          backTo="/doctors"
          backLabel={tx("Doctor directory")}
          hideAvailability
          sidebar={
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Unpublished")}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                {tx("You claimed this NMC profile, but the card is hidden until you publish the listing.")}
              </p>
              <Button fullWidth className="mt-5" onClick={() => nav("/provider/listing")}>
                {tx("Publish listing")}
              </Button>
            </div>
          }
        />
      );
    }
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("This listing isn’t public yet")}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
          {tx("The physician has claimed this NMC record but hasn’t published their card.")}
        </p>
        <Link to="/doctors" className="mt-4 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Back to directory")}
        </Link>
      </div>
    );
  }

  if (verified) {
    const care = nmcDoctorToCareProvider(verified);
    return (
      <DoctorProfilePage
        provider={care}
        backTo="/doctors/claim"
        backLabel={tx("Claim flow")}
        hideAvailability
        sidebar={
          signedIn ? (
            <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
              <div className="pointer-events-none select-none opacity-[0.38]" aria-hidden>
                <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Claim this profile")}</p>
                <p className="mt-2 text-sm text-ink-secondary">{tx("Verify the last name, then publish this card.")}</p>
                <div className="mt-5 h-11 rounded-full bg-[color:var(--pp-primary-100)]" />
              </div>
              <p className="mt-4 text-sm font-medium text-[color:var(--pp-primary-950)]">
                {tx("You’re signed in as a patient, so claiming is unavailable.")}
              </p>
            </div>
          ) : (
            <ClaimPanel doctor={verified} />
          )
        }
      />
    );
  }

  if (wantClaim && !signedIn) {
    return <Navigate to={`/doctors/claim?nmc=${encodeURIComponent(nmc)}`} replace />;
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-12 text-center">
      <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Profile isn’t public")}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
        {tx(
          "Unclaimed NMC records stay private. If this is your registration, verify the last name to open the pre-filled page and claim it.",
        )}
      </p>
      {signedIn ? (
        <span className="mt-4 inline-block text-sm font-semibold text-[color:var(--pp-violet)] opacity-40">
          {tx("Claim this profile")}
        </span>
      ) : (
        <Link
          to={`/doctors/claim?nmc=${encodeURIComponent(nmc)}`}
          className="mt-4 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
        >
          {tx("Claim this profile")}
        </Link>
      )}
    </div>
  );
}
