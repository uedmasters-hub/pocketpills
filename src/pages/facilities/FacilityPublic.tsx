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
import { VENDOR_TYPE_LABELS, specialisedInFromListing } from "@/lib/businessProfile";
import { defaultFacilitySpecialised } from "@/lib/specialisedIn";
import { SpecialisedInSection } from "@/components/SpecialisedIn";
import {
  ClinicAboutFacts,
  ClinicProfileAfterReviews,
  ClinicProfileMid,
  ClinicRelatedSection,
  ClinicTreatmentsSection,
} from "@/components/clinic/ClinicDetailExtras";
import {
  HospitalAboutFacts,
  HospitalProfileAfterReviews,
  HospitalProfileMid,
  HospitalRelatedSection,
} from "@/components/hospital/HospitalDetailExtras";
import { DirectorySidebarMap } from "@/components/MapEmbed";
import { CLINIC_REVIEW_TOPICS, clinicFromHf, clinicMapsQuery } from "@/lib/clinicProfileContent";
import { HOSPITAL_REVIEW_TOPICS, hospitalFromHf, hospitalMapsQuery } from "@/lib/hospitalProfileContent";
import { normalizeHfCode } from "@/lib/hfApi";
import {
  displayFacilityLevel,
  displayFacilityName,
  facilityHours,
  formatNepalMobile,
  getFacilityClaim,
  getVerifiedFacility,
  hfCodeFromId,
  sameHf,
  vendorFromFacilityLevel,
} from "@/lib/facilityDirectory";
import { useProvider } from "@/lib/providerAuth";
import { FacilityClaimPanel } from "@/pages/facilities/ClaimFacility";

const PHOTO = "/img/treatments/blood-pressure.png";

export function FacilityPublic() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { hfCode: raw } = useParams();
  const [params] = useSearchParams();
  const wantClaim = params.get("claim") === "1";
  const { provider } = useProvider();

  const n = normalizeHfCode(raw || "") ?? hfCodeFromId(raw || "");
  if (!n) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Invalid facility code")}</p>
        <Link to="/facilities" className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Back to directory")}
        </Link>
      </div>
    );
  }

  const claim = getFacilityClaim(n);
  const verified = getVerifiedFacility(n);
  const owned = Boolean(
    provider &&
      claim &&
      (claim.providerId === provider.id || sameHf(provider.hfCode, n)),
  );

  if (claim?.published) {
    return (
      <FacilityProfile
        name={displayFacilityName(claim.name)}
        hfCode={n}
        district={claim.district || tx("Nepal")}
        facilityLevel={claim.facilityLevel}
        phone={claim.phone}
        live
        owned={owned}
        ownerId={claim.providerId}
        backTo="/facilities"
        backLabel={tx("Facility directory")}
        sidebar={
          owned ? (
            <div className={DIRECTORY_SIDEBAR_CARD}>
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Your live profile")}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                {tx("Patients can find this facility. Edit hours and bio from your listing.")}
              </p>
              <Button fullWidth size="sm" className="mt-4" onClick={() => nav("/provider/listing")}>
                {tx("Edit listing")}
              </Button>
            </div>
          ) : (
            <LiveFacilityCta
              hours={facilityHours()}
              onBook={() => nav("/appointments")}
            />
          )
        }
      />
    );
  }

  if (claim && !claim.published) {
    if (owned) {
      return (
        <FacilityProfile
          name={displayFacilityName(claim.name)}
          hfCode={n}
          district={claim.district || tx("Nepal")}
          facilityLevel={claim.facilityLevel}
          phone={claim.phone}
          live={false}
          owned
          ownerId={claim.providerId}
          backTo="/facilities"
          backLabel={tx("Facility directory")}
          sidebar={
            <div className={DIRECTORY_SIDEBAR_CARD}>
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Unpublished")}</p>
              <p className="mt-2 text-sm text-ink-secondary">
                {tx("You claimed this facility profile, but the card is hidden until you publish the listing.")}
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
          {tx("The facility has claimed this record but hasn’t published their card.")}
        </p>
        <Link to="/facilities" className="mt-4 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Back to directory")}
        </Link>
      </div>
    );
  }

  if (verified) {
    return (
      <FacilityProfile
        name={displayFacilityName(verified.name)}
        hfCode={n}
        district={verified.district || tx("Nepal")}
        facilityLevel={verified.facilityLevel}
        live={false}
        backTo="/facilities/claim"
        backLabel={tx("Claim flow")}
        sidebar={<FacilityClaimPanel facility={verified} />}
      />
    );
  }

  if (wantClaim) {
    return <Navigate to={`/facilities/claim?hf=${encodeURIComponent(n)}`} replace />;
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-12 text-center">
      <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Profile isn’t public")}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
        {tx(
          "Unclaimed facility records stay private. If this is your facility, verify a distinctive name word to open the pre-filled page and claim it.",
        )}
      </p>
      <Link
        to={`/facilities/claim?hf=${encodeURIComponent(n)}`}
        className="mt-4 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
      >
        {tx("Claim this profile")}
      </Link>
    </div>
  );
}

function FacilityProfile({
  name,
  hfCode,
  district,
  facilityLevel,
  phone,
  live,
  owned = false,
  ownerId,
  backTo,
  backLabel,
  sidebar,
}: {
  name: string;
  hfCode: string;
  district: string;
  facilityLevel: string;
  phone?: string;
  live: boolean;
  owned?: boolean;
  ownerId?: string;
  backTo: string;
  backLabel: string;
  sidebar: ReactNode;
}) {
  const { tx } = useI18n();
  const entering = useEnterSkeleton(hfCode);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const kind = displayFacilityLevel(facilityLevel);
  const vendor = vendorFromFacilityLevel(facilityLevel);
  const hours = facilityHours();
  const typeLabel = tx(VENDOR_TYPE_LABELS[vendor]);
  const bio = tx("{name} is a registered {kind} in {place}.")
    .replace("{name}", name)
    .replace("{kind}", kind || typeLabel.toLowerCase())
    .replace("{place}", district);
  const about = live
    ? tx("{name} claimed this health-facility profile and can receive patients through PocketPills.")
        .replace("{name}", name)
    : tx("{name}’s facility record is pre-filled from the health-facility registry. Claim it to publish this card.")
        .replace("{name}", name);
  const services = live
    ? [tx("Outpatient consults"), tx("Diagnostics"), tx("Follow-up care")]
    : [tx("Outpatient consults"), tx("Follow-up care")];
  const specialisedIn =
    vendor === "lab"
      ? []
      : specialisedInFromListing(
          ownerId,
          defaultFacilitySpecialised({
            name,
            facilityLevel,
            breadth: vendor === "clinic" ? "clinic" : "hospital",
          }),
        );

  const isClinic = vendor === "clinic";
  const hospital = isClinic
    ? null
    : hospitalFromHf({
        name,
        hfCode,
        district,
        facilityLevel: kind || facilityLevel,
        phone,
        hours: live ? hours : undefined,
        about,
        live,
        specialisedIn,
        kindLabel: typeLabel,
      });
  const clinic = isClinic
    ? clinicFromHf({
        name,
        hfCode,
        district,
        facilityLevel: kind || facilityLevel,
        phone,
        hours: live ? hours : undefined,
        about,
        live,
        specialisedIn,
        kindLabel: typeLabel,
      })
    : null;

  if (entering) return <DetailPageSkeleton label={tx("Loading profile")} />;

  return (
    <DirectoryDetailLayout
      backTo={backTo}
      backLabel={backLabel}
      eyebrow={typeLabel}
      name={name}
      subtitle={[kind && kind.toLowerCase() !== typeLabel.toLowerCase() ? kind : null, `HF #${hfCode}`]
        .filter(Boolean)
        .join(" • ")}
      bio={bio}
      about={about}
      imageUrl={PHOTO}
      usps={[
        { label: tx("Verified Doctors") },
        { label: tx("Digital Prescription") },
        { label: tx("Free Followup") },
      ]}
      leadingBadges={
        reviewSummary == null ? (
          <RatingChipSkeleton variant="badge" />
        ) : reviewSummary.count ? (
          <RatingChip summary={reviewSummary} variant="badge" />
        ) : null
      }
      badges={[
        { label: tx("Health facility registry"), strong: true },
        live ? { label: `${tx("Next")}: ${tx("Today")}` } : null,
      ].filter(Boolean) as { label: string; strong?: boolean }[]}
      extras={[{ title: tx("Services"), items: services, check: true }]}
      details={[
        { k: tx("Facility code"), v: `#${hfCode}` },
        { k: tx("Location"), v: district },
        kind ? { k: tx("Type"), v: kind } : null,
        live ? { k: tx("Hours"), v: hours } : null,
        phone ? { k: tx("Phone"), v: formatNepalMobile(phone) } : null,
      ].filter(Boolean) as { k: string; v: string }[]}
      afterAbout={
        clinic ? <ClinicAboutFacts clinic={clinic} /> : hospital ? <HospitalAboutFacts hospital={hospital} /> : null
      }
      sidebar={
        <>
          {sidebar}
          <DirectorySidebarMap
            query={clinic ? clinicMapsQuery(clinic) : hospital ? hospitalMapsQuery(hospital) : ""}
          />
        </>
      }
      reviews={
        live || owned ? (
          <ReviewsPanel
            kind="facility"
            subjectId={hfCode}
            listingName={name}
            canWrite={live}
            owned={owned}
            onSummary={setReviewSummary}
            topics={[...(clinic ? CLINIC_REVIEW_TOPICS : HOSPITAL_REVIEW_TOPICS)]}
          />
        ) : undefined
      }
      afterReviews={
        clinic ? (
          <>
            <ClinicProfileAfterReviews clinic={clinic} />
            <ClinicRelatedSection clinic={clinic} />
          </>
        ) : hospital ? (
          <>
            <HospitalProfileAfterReviews hospital={hospital} />
            <HospitalRelatedSection hospital={hospital} />
          </>
        ) : null
      }
    >
      {specialisedIn.length ? (
        <SpecialisedInSection groups={specialisedIn} variant="facility" />
      ) : null}
      {clinic ? (
        <>
          <ClinicTreatmentsSection clinic={clinic} />
          <ClinicProfileMid clinic={clinic} />
        </>
      ) : hospital ? (
        <HospitalProfileMid hospital={hospital} />
      ) : null}
    </DirectoryDetailLayout>
  );
}

function LiveFacilityCta({
  hours,
  onBook,
}: {
  hours: string;
  onBook: () => void;
}) {
  const { tx } = useI18n();
  return (
    <div className={DIRECTORY_SIDEBAR_CARD}>
      <p className="text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">{tx("This facility is live")}</p>
      <p className="mt-2 text-sm leading-snug text-ink-secondary">{hours}</p>
      <p className="mt-2 text-sm leading-snug text-ink-tertiary">{tx("Patients can book care through PocketPills.")}</p>
      <div className="mt-4 space-y-2">
        <Button fullWidth size="sm" onClick={onBook}>
          {tx("Book an appointment")}
        </Button>
      </div>
    </div>
  );
}
