import type { ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { normalizeRegNo } from "@/lib/ddaApi";
import { getRegion } from "@/lib/pharmacies";
import {
  ddaNumberFromId,
  displayPharmacyName,
  getPharmacyClaim,
  getVerifiedPharmacy,
  pharmacyHours,
  placeLine,
  sameDda,
} from "@/lib/pharmacyDirectory";
import { useProvider } from "@/lib/providerAuth";
import { PharmacyClaimPanel } from "@/pages/pharmacies/ClaimPharmacy";
import { ServicePageShell } from "@/pages/appointments/ServicePageShell";

const PHOTO = "/img/treatments/uti.png";

export function PharmacyPublic() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { regNo: raw } = useParams();
  const [params] = useSearchParams();
  const wantClaim = params.get("claim") === "1";
  const { provider } = useProvider();

  const region = getRegion(raw);
  if ((raw || "").toLowerCase() === "regions") {
    return <Navigate to="/pharmacies/regions" replace />;
  }
  if (region) {
    return <Navigate to={`/pharmacies/regions/${region.slug}`} replace />;
  }

  const n = normalizeRegNo(raw || "") ?? ddaNumberFromId(raw || "");
  if (!n) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Invalid DDA number")}</p>
        <Link to="/pharmacies" className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Back to directory")}
        </Link>
      </div>
    );
  }

  const claim = getPharmacyClaim(n);
  const verified = getVerifiedPharmacy(n);
  const owned = Boolean(
    provider &&
      claim &&
      (claim.providerId === provider.id || sameDda(provider.ddaNumber, n)),
  );

  if (claim?.published) {
    return (
      <PharmacyProfile
        name={displayPharmacyName(claim.name)}
        registrationNo={n}
        place={placeLine(claim)}
        pranali={claim.pranali}
        live
        backTo="/pharmacies"
        backLabel={tx("Pharmacy directory")}
        sidebar={
          owned ? (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Your live profile")}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                {tx("Patients can find this pharmacy. Edit hours and bio from your listing.")}
              </p>
              <Button fullWidth className="mt-5" onClick={() => nav("/provider/listing")}>
                {tx("Edit listing")}
              </Button>
            </div>
          ) : (
            <LivePharmacyCta
              hours={pharmacyHours()}
              onTransfer={() => nav("/transfer")}
              onFill={() => nav("/fill")}
            />
          )
        }
      />
    );
  }

  if (claim && !claim.published) {
    if (owned) {
      return (
        <PharmacyProfile
          name={displayPharmacyName(claim.name)}
          registrationNo={n}
          place={placeLine(claim)}
          pranali={claim.pranali}
          live={false}
          backTo="/pharmacies"
          backLabel={tx("Pharmacy directory")}
          sidebar={
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Unpublished")}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                {tx("You claimed this DDA profile, but the card is hidden until you publish the listing.")}
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
          {tx("The pharmacy has claimed this DDA record but hasn’t published their card.")}
        </p>
        <Link to="/pharmacies" className="mt-4 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Back to directory")}
        </Link>
      </div>
    );
  }

  if (verified) {
    return (
      <PharmacyProfile
        name={displayPharmacyName(verified.name)}
        registrationNo={n}
        place={placeLine(verified)}
        pranali={verified.pranali}
        live={false}
        backTo="/pharmacies/claim"
        backLabel={tx("Claim flow")}
        sidebar={<PharmacyClaimPanel pharmacy={verified} />}
      />
    );
  }

  if (wantClaim) {
    return <Navigate to={`/pharmacies/claim?reg=${encodeURIComponent(n)}`} replace />;
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-12 text-center">
      <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Profile isn’t public")}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
        {tx(
          "Unclaimed DDA records stay private. If this is your pharmacy, verify a distinctive name word to open the pre-filled page and claim it.",
        )}
      </p>
      <Link
        to={`/pharmacies/claim?reg=${encodeURIComponent(n)}`}
        className="mt-4 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
      >
        {tx("Claim this profile")}
      </Link>
    </div>
  );
}

function PharmacyProfile({
  name,
  registrationNo,
  place,
  pranali,
  live,
  backTo,
  backLabel,
  sidebar,
}: {
  name: string;
  registrationNo: string;
  place: string;
  pranali: string;
  live: boolean;
  backTo: string;
  backLabel: string;
  sidebar: ReactNode;
}) {
  const { tx } = useI18n();
  return (
    <ServicePageShell backTo={backTo} backLabel={backLabel} aside={sidebar}>
      <div className="overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white">
        <div className="relative h-40 bg-[color:var(--pp-primary-100)] sm:h-48">
          <img src={PHOTO} alt="" className="h-full w-full object-cover object-[50%_35%] opacity-90" />
          <span className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        </div>
        <div className="relative -mt-8 px-5 pb-6 sm:px-6">
          <p className={"pp-caps " + (live ? "text-wellness" : "text-ink-tertiary")}>
            {live ? tx("Available") : tx("Not available")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {name}
          </h1>
          <p className="mt-2 text-base text-ink-secondary">
            {(pranali || tx("Pharmacy"))} · {place}
          </p>
          <p className="mt-1 text-sm font-medium text-ink-tertiary tnum">DDA #{registrationNo}</p>
          {live && (
            <p className="mt-3 text-sm font-medium text-[color:var(--pp-primary-950)]">{pharmacyHours()}</p>
          )}
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Services")}
      </h2>
      <ul className="mt-4 space-y-3">
        {(live
          ? [tx("Prescription fills"), tx("Same-day delivery"), tx("OTC consult")]
          : [tx("Prescription fills"), tx("OTC consult")]
        ).map((s) => (
          <li key={s} className="rounded-2xl border border-line bg-white px-4 py-3.5">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">{s}</p>
            <p className="mt-0.5 text-sm text-ink-tertiary">{place}</p>
          </li>
        ))}
      </ul>
    </ServicePageShell>
  );
}

function LivePharmacyCta({
  hours,
  onTransfer,
  onFill,
}: {
  hours: string;
  onTransfer: () => void;
  onFill: () => void;
}) {
  const { tx } = useI18n();
  return (
    <div className="rounded-[1.75rem] border border-[#E6E1EF] bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.05)]">
      <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("This pharmacy is live")}</p>
      <p className="mt-2 text-sm text-ink-secondary">{hours}</p>
      <p className="mt-1 text-sm text-ink-tertiary">{tx("Free standard delivery where PocketPills ships.")}</p>
      <div className="mt-5 space-y-2">
        <Button fullWidth onClick={onFill}>
          {tx("Fill a prescription")}
        </Button>
        <Button fullWidth variant="secondary" onClick={onTransfer}>
          {tx("Transfer a prescription")}
        </Button>
      </div>
    </div>
  );
}
