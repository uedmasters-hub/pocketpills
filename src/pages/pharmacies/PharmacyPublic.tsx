import type { ReactNode } from "react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { DetailPageSkeleton, RatingChipSkeleton, useEnterSkeleton } from "@/components/ui";
import { DirectoryDetailLayout, DIRECTORY_SIDEBAR_CARD } from "@/components/DirectoryDetailLayout";
import { RatingChip } from "@/components/reviews/RatingChip";
import { ReviewsPanel } from "@/components/reviews/ReviewsPanel";
import { useI18n } from "@/lib/i18n";
import type { ReviewSummary } from "@/lib/reviewsApi";
import { normalizeRegNo } from "@/lib/ddaApi";
import { getRegion } from "@/lib/pharmacies";
import {
  ddaNumberFromId,
  displayPharmacyName,
  formatNepalMobile,
  getPharmacyClaim,
  getVerifiedPharmacy,
  pharmacyHours,
  displayPranali,
  placeLine,
  sameDda,
} from "@/lib/pharmacyDirectory";
import { useProvider } from "@/lib/providerAuth";
import {
  PharmacyAboutFacts,
  PharmacyProfileAfterReviews,
  PharmacyProfileMid,
  PharmacyRelatedSection,
  PharmacySidebarMap,
} from "@/components/pharmacy/PharmacyDetailExtras";
import { PHARMACY_REVIEW_TOPICS, pharmacyFromListing } from "@/lib/pharmacyProfileContent";
import { PharmacyClaimPanel } from "@/pages/pharmacies/ClaimPharmacy";

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
        district={claim.district}
        pranali={claim.pranali}
        phone={claim.phone}
        live
        owned={owned}
        ownerId={claim.providerId}
        backTo="/pharmacies"
        backLabel={tx("Pharmacy directory")}
        sidebar={
          owned ? (
            <div className={DIRECTORY_SIDEBAR_CARD}>
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Your live profile")}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                {tx("Patients can find this pharmacy. Edit hours and bio from your listing.")}
              </p>
              <Button fullWidth size="sm" className="mt-4" onClick={() => nav("/provider/listing")}>
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
          district={claim.district}
          pranali={claim.pranali}
          phone={claim.phone}
          live={false}
          owned
          ownerId={claim.providerId}
          backTo="/pharmacies"
          backLabel={tx("Pharmacy directory")}
          sidebar={
            <div className={DIRECTORY_SIDEBAR_CARD}>
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Unpublished")}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                {tx("You claimed this DDA profile, but the card is hidden until you publish the listing.")}
              </p>
              <Button fullWidth size="sm" className="mt-4" onClick={() => nav("/provider/listing")}>
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
        district={verified.district}
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
  district,
  pranali,
  phone,
  live,
  owned = false,
  ownerId,
  backTo,
  backLabel,
  sidebar,
}: {
  name: string;
  registrationNo: string;
  place: string;
  district?: string;
  pranali: string;
  phone?: string;
  live: boolean;
  owned?: boolean;
  ownerId?: string;
  backTo: string;
  backLabel: string;
  sidebar: ReactNode;
}) {
  const { tx } = useI18n();
  const entering = useEnterSkeleton(registrationNo);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const kind = displayPranali(pranali);
  const hours = pharmacyHours();
  const bio = tx("{name} is a DDA-registered pharmacy in {place}.")
    .replace("{name}", name)
    .replace("{place}", place);
  const about = live
    ? tx("{name} claimed this DDA profile and can receive fills and transfers through PocketPills.")
        .replace("{name}", name)
    : tx("{name}’s DDA record is pre-filled from the pharmacy registry. Claim it to publish this card.")
        .replace("{name}", name);
  const serviceKeys = live
    ? ["Prescription fills", "Same-day delivery", "OTC consult"]
    : ["Prescription fills", "OTC consult"];
  const services = serviceKeys.map((s) => tx(s));
  const pharmacy = pharmacyFromListing({
    name,
    registrationNo,
    place,
    district,
    kindLabel: kind || tx("Pharmacy"),
    phone,
    hours,
    about,
    live,
    ownerId,
    listedServices: serviceKeys,
  });

  if (entering) return <DetailPageSkeleton label={tx("Loading profile")} />;

  return (
    <DirectoryDetailLayout
      backTo={backTo}
      backLabel={backLabel}
      eyebrow={tx("Pharmacy")}
      name={name}
      subtitle={[kind && kind.toLowerCase() !== "pharmacy" ? kind : null, `DDA #${registrationNo}`]
        .filter(Boolean)
        .join(" • ")}
      bio={bio}
      about={about}
      imageUrl={PHOTO}
      usps={[
        { label: tx("DDA registered") },
        { label: tx("Digital Prescription") },
        { label: tx("Pharmacist review") },
      ]}
      leadingBadges={
        reviewSummary == null ? (
          <RatingChipSkeleton variant="badge" />
        ) : reviewSummary.count ? (
          <RatingChip summary={reviewSummary} variant="badge" />
        ) : null
      }
      badges={[
        { label: tx("DDA registry"), strong: true },
        live ? { label: `${tx("Next")}: ${tx("Today")}` } : null,
      ].filter(Boolean) as { label: string; strong?: boolean }[]}
      extras={[{ title: tx("Services"), items: services, check: true }]}
      details={[
        { k: tx("DDA number"), v: `#${registrationNo}` },
        { k: tx("Location"), v: place },
        kind ? { k: tx("Type"), v: kind } : null,
        live ? { k: tx("Hours"), v: hours } : null,
        phone ? { k: tx("Phone"), v: formatNepalMobile(phone) } : null,
      ].filter(Boolean) as { k: string; v: string }[]}
      afterAbout={<PharmacyAboutFacts pharmacy={pharmacy} />}
      sidebar={
        <>
          {sidebar}
          <PharmacySidebarMap pharmacy={pharmacy} />
        </>
      }
      reviews={
        live || owned ? (
          <ReviewsPanel
            kind="pharmacy"
            subjectId={registrationNo}
            listingName={name}
            canWrite={live}
            owned={owned}
            onSummary={setReviewSummary}
            topics={[...PHARMACY_REVIEW_TOPICS]}
          />
        ) : undefined
      }
      afterReviews={
        <>
          <PharmacyProfileAfterReviews pharmacy={pharmacy} />
          <PharmacyRelatedSection pharmacy={pharmacy} />
        </>
      }
    >
      <PharmacyProfileMid pharmacy={pharmacy} />
    </DirectoryDetailLayout>
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
    <div className={DIRECTORY_SIDEBAR_CARD}>
      <p className="text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">{tx("This pharmacy is live")}</p>
      <p className="mt-2 text-sm leading-snug text-ink-secondary">{hours}</p>
      <p className="mt-2 text-sm leading-snug text-ink-tertiary">{tx("Free standard delivery where PocketPills ships.")}</p>
      <div className="mt-4 space-y-2">
        <Button fullWidth size="sm" onClick={onFill}>
          {tx("Fill a prescription")}
        </Button>
        <Button fullWidth size="sm" variant="secondary" onClick={onTransfer}>
          {tx("Transfer a prescription")}
        </Button>
      </div>
    </div>
  );
}
