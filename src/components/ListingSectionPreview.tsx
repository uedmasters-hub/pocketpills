import { DetailSection } from "@/components/DetailSection";
import { DirectoryHeroCard } from "@/components/DirectoryDetailLayout";
import { DoctorProfileIntro, doctorHeroUsps } from "@/components/doctor/DoctorProfileIntro";
import { AvailabilityHoursEditor } from "@/components/AvailabilityHoursEditor";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ClinicAboutFacts } from "@/components/clinic/ClinicDetailExtras";
import { HospitalAboutFacts } from "@/components/hospital/HospitalDetailExtras";
import { HospitalFacilitiesGrid } from "@/components/hospital/HospitalFacilitiesGrid";
import { ENABLE_FIELD, ENABLE_AREA, EnableAddButton, EnableLine } from "@/components/listingEnable";
import { ListingBlockView } from "@/components/ListingBlockView";
import { PharmacyAboutFacts } from "@/components/pharmacy/PharmacyDetailExtras";
import { RecentArticlesSection } from "@/components/RecentArticles";
import { SpecialisedInSection } from "@/components/SpecialisedIn";
import { formatFee } from "@/lib/appointments";
import { availabilityBranchesForListing } from "@/lib/availabilityLocations";
import {
  newBusinessOffering,
  summarizeSchedule,
  type BusinessProfile,
} from "@/lib/businessProfile";
import { staffRowsAsProviders } from "@/lib/listingOverlay";
import { FACILITY_HERO_USPS } from "@/lib/facilityDirectory";
import type { ClinicView } from "@/lib/clinicProfileContent";
import type { HospitalView } from "@/lib/hospitalProfileContent";
import { listingSection, LISTING_SECTION_LABELS, type ListingSection } from "@/lib/listingPage";
import type { PharmacyView } from "@/lib/pharmacyProfileContent";
import { specialisedVariantForVendor } from "@/lib/specialisedIn";
import { useI18n } from "@/lib/i18n";

const CARD = "rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-4";

export type ListingEnable = {
  onProfile: (partial: Partial<BusinessProfile>) => void;
  onSection: (partial: Partial<ListingSection>) => void;
};

function staffFromListing(profile: BusinessProfile) {
  return staffRowsAsProviders(listingSection(profile.pageSections, "doctors")?.staff, profile.city);
}

function previewHospital(profile: BusinessProfile): HospitalView {
  return {
    id: profile.publishedId || "draft",
    name: profile.name,
    kindLabel: profile.type === "clinic" ? "Clinic" : "Hospital",
    facilityLevel: profile.subtitle,
    registrationNo: profile.licenseNumber || undefined,
    address: profile.address,
    city: profile.city,
    phone: profile.phone,
    hours: profile.hours,
    about: profile.about,
    specialisedIn: profile.specialisedIn,
    staff: staffFromListing(profile),
    amenities: [],
    bookable: profile.services.map((s) => ({ id: s.id, kind: "consult", label: s.label, blurb: s.blurb })),
    gallery: listingSection(profile.pageSections, "gallery")?.photos,
    awards: listingSection(profile.pageSections, "awards")?.awards,
    faqs: listingSection(profile.pageSections, "faq")?.faqs,
    pageSections: profile.pageSections,
    hasListing: true,
  };
}

function previewClinic(profile: BusinessProfile): ClinicView {
  const h = previewHospital(profile);
  return {
    id: h.id,
    name: h.name,
    kindLabel: "Clinic",
    facilityLevel: profile.subtitle,
    registrationNo: profile.licenseNumber || undefined,
    address: profile.address,
    city: profile.city,
    phone: profile.phone,
    hours: profile.hours,
    about: profile.about,
    specialisedIn: profile.specialisedIn,
    staff: h.staff,
    visitTypes: ["clinic"],
    specialties: ["general"],
    bookable: h.bookable,
    amenities: [],
    awards: h.awards,
    gallery: h.gallery,
    faqs: h.faqs,
    pageSections: profile.pageSections,
    hasListing: true,
  };
}

function previewPharmacy(profile: BusinessProfile): PharmacyView {
  return {
    id: profile.publishedId || "draft",
    name: profile.name,
    registrationNo: profile.licenseNumber || "",
    place: profile.city || profile.address,
    district: profile.city,
    kindLabel: "Pharmacy",
    phone: profile.phone,
    hours: profile.hours,
    about: profile.about,
    live: profile.status === "published",
    listedServices: profile.services.map((s) => s.label).filter(Boolean),
    pharmacists: [],
    inventory: null,
    pageSections: profile.pageSections,
    hasListing: true,
  };
}

function EmptyBlock({ title, text }: { title: string; text: string }) {
  return (
    <DetailSection title={title}>
      <p className="text-sm text-ink-tertiary">{text}</p>
    </DetailSection>
  );
}

function heroUsps(profile: BusinessProfile, tx: (s: string) => string) {
  if (profile.type === "hospital" || profile.type === "clinic") {
    return FACILITY_HERO_USPS.map((label) => ({ label: tx(label) }));
  }
  if (profile.type === "doctor") return doctorHeroUsps(tx);
  return [];
}

function heroEyebrow(profile: BusinessProfile, tx: (s: string) => string) {
  return tx(
    profile.type === "hospital"
      ? "Hospital"
      : profile.type === "clinic"
        ? "Clinic"
        : profile.type === "pharmacy"
          ? "Pharmacy"
          : profile.type === "lab"
            ? "Lab"
            : profile.type === "ambulance"
              ? "Ambulance"
              : "Doctor",
  );
}

export function ListingHeroPreview({
  profile,
  enable,
}: {
  profile: BusinessProfile;
  enable?: ListingEnable;
}) {
  const { tx } = useI18n();
  const eyebrow = heroEyebrow(profile, tx);
  const name = profile.name.trim() || tx("Your name");
  const subtitle = profile.subtitle || profile.bio;
  const heroEnable = enable
    ? {
        name: profile.name,
        subtitle: profile.subtitle || profile.bio,
        imageUrl: profile.imageUrl,
        onChange: (partial: { name?: string; subtitle?: string; imageUrl?: string }) =>
          enable.onProfile({
            ...partial,
            ...(partial.subtitle != null ? { bio: partial.subtitle } : {}),
          }),
      }
    : undefined;

  if (profile.type === "doctor") {
    return (
      <DoctorProfileIntro
        eyebrow={eyebrow}
        name={name}
        subtitle={subtitle}
        imageUrl={profile.imageUrl}
        usps={heroUsps(profile, tx)}
        about={profile.about.trim() || profile.bio.trim() || tx("Add a short about for this page.")}
        enable={heroEnable}
      />
    );
  }

  return (
    <DirectoryHeroCard
      eyebrow={eyebrow}
      name={name}
      subtitle={subtitle}
      imageUrl={profile.imageUrl}
      usps={heroUsps(profile, tx)}
      enable={heroEnable}
    />
  );
}

export function ListingSectionPreview({
  profile,
  section,
  enable,
}: {
  profile: BusinessProfile;
  section: ListingSection;
  enable?: ListingEnable;
}) {
  const { tx } = useI18n();
  const title = section.title || LISTING_SECTION_LABELS[section.kind];
  const setTitle = enable ? (next: string) => enable.onSection({ title: next }) : undefined;

  if (section.kind === "about") {
    const copy = profile.about.trim() || profile.bio.trim();
    return (
      <DetailSection
        title={title}
        onTitleChange={setTitle}
        lede={enable ? tx("These details appear on the public page.") : undefined}
      >
        {enable ? (
          <EnableLine
            multiline
            rows={4}
            value={profile.about}
            onChange={(about) => enable.onProfile({ about })}
            placeholder={tx("About this practice")}
            className="text-sm leading-relaxed text-ink-secondary"
          />
        ) : profile.type === "doctor" ? null : copy ? (
          <p className="text-sm leading-relaxed text-ink-secondary">{copy}</p>
        ) : (
          <p className="text-sm text-ink-tertiary">{tx("Add a short about for this page.")}</p>
        )}
        {enable ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {profile.licenseNumber ? (
              <div className={CARD}>
                <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Licence")}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--pp-primary-950)]">
                  {profile.licenseNumber}
                </p>
                <p className="mt-1 text-xs text-ink-tertiary">{tx("Registration cannot be edited here.")}</p>
              </div>
            ) : null}
            {(
              [
                ["Address", "address", profile.address],
                ["City", "city", profile.city],
                ["Phone", "phone", profile.phone],
                ["Hours", "hours", profile.hours],
              ] as const
            ).map(([label, key, value]) => (
              <div key={key} className={CARD}>
                <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx(label)}</p>
                <input
                  className={ENABLE_FIELD + " mt-1.5"}
                  value={value}
                  onChange={(e) => enable.onProfile({ [key]: e.target.value })}
                  placeholder={tx(label)}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            {profile.type === "hospital" ? <HospitalAboutFacts hospital={previewHospital(profile)} /> : null}
            {profile.type === "clinic" ? <ClinicAboutFacts clinic={previewClinic(profile)} /> : null}
            {profile.type === "pharmacy" ? <PharmacyAboutFacts pharmacy={previewPharmacy(profile)} /> : null}
            {profile.type !== "hospital" && profile.type !== "clinic" && profile.type !== "pharmacy" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { k: tx("Licence"), v: profile.licenseNumber },
                  { k: tx("Location"), v: profile.address || profile.city },
                  { k: tx("Phone"), v: profile.phone },
                  { k: tx("Hours"), v: profile.hours },
                ]
                  .filter((f) => f.v)
                  .map((f) => (
                    <div key={f.k} className={CARD}>
                      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{f.k}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--pp-primary-950)]">{f.v}</p>
                    </div>
                  ))}
              </div>
            ) : null}
          </>
        )}
      </DetailSection>
    );
  }

  if (section.kind === "facilities") {
    return <HospitalFacilitiesGrid hospital={previewHospital(profile)} />;
  }

  if (section.kind === "doctors") {
    const staff = staffFromListing(profile);
    if (!staff.length && !enable) return <EmptyBlock title={title} text={tx("No doctors listed yet.")} />;
    if (!staff.length) return <EmptyBlock title={title} text={tx("Add doctors with the listing tools.")} />;
    return (
      <DetailSection title={title} onTitleChange={setTitle} lede={tx("Clinicians practising here.")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {staff.map((d) => (
            <div key={d.id} className="flex flex-col items-center rounded-2xl border border-line bg-white px-4 py-5 text-center">
              <img src={d.imageUrl} alt="" className="h-20 w-20 rounded-full object-cover object-top" />
              <p className="mt-3 line-clamp-2 text-sm font-semibold text-[color:var(--pp-primary-950)]">{d.name}</p>
              {d.subtitle ? <p className="mt-1 line-clamp-2 text-xs text-ink-tertiary">{d.subtitle}</p> : null}
            </div>
          ))}
        </div>
      </DetailSection>
    );
  }

  if (section.kind === "specialised") {
    const variant = specialisedVariantForVendor(profile.type) ?? "facility";
    if (!profile.specialisedIn.length && !enable) {
      return <EmptyBlock title={title} text={tx("No specialties listed yet.")} />;
    }
    return (
      <SpecialisedInSection
        groups={profile.specialisedIn}
        variant={variant}
        title={title}
        onTitleChange={setTitle}
        onChange={enable ? (specialisedIn) => enable.onProfile({ specialisedIn }) : undefined}
      />
    );
  }

  if (section.kind === "services") {
    const items = profile.services;
    if (!items.length && !enable) return <EmptyBlock title={title} text={tx("No services listed yet.")} />;
    return (
      <DetailSection title={title} onTitleChange={setTitle}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((s) => (
            <li key={s.id} className={CARD}>
              {enable ? (
                <>
                  <input
                    className={ENABLE_FIELD + " font-semibold"}
                    value={s.label}
                    onChange={(e) =>
                      enable.onProfile({
                        services: items.map((row) => (row.id === s.id ? { ...row, label: e.target.value } : row)),
                      })
                    }
                    placeholder={tx("Service name")}
                  />
                  <textarea
                    className={ENABLE_AREA + " mt-2"}
                    rows={2}
                    value={s.blurb}
                    onChange={(e) =>
                      enable.onProfile({
                        services: items.map((row) => (row.id === s.id ? { ...row, blurb: e.target.value } : row)),
                      })
                    }
                    placeholder={tx("Short description")}
                  />
                  <input
                    className={ENABLE_FIELD + " mt-2"}
                    inputMode="numeric"
                    value={s.feeFrom || ""}
                    onChange={(e) =>
                      enable.onProfile({
                        services: items.map((row) =>
                          row.id === s.id ? { ...row, feeFrom: Number(e.target.value) || 0 } : row,
                        ),
                      })
                    }
                    placeholder={tx("Fee from")}
                  />
                  <button
                    type="button"
                    className="mt-2 text-xs text-ink-tertiary"
                    onClick={() => enable.onProfile({ services: items.filter((row) => row.id !== s.id) })}
                  >
                    {tx("Remove")}
                  </button>
                </>
              ) : (
                <>
                  <p className="font-semibold text-[color:var(--pp-primary-950)]">{s.label || tx("Service")}</p>
                  {s.blurb ? <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{s.blurb}</p> : null}
                  {s.feeFrom ? (
                    <p className="mt-2 text-sm font-medium text-[color:var(--pp-primary-950)]">{formatFee(s.feeFrom)}</p>
                  ) : null}
                </>
              )}
            </li>
          ))}
          {enable ? (
            <li>
              <EnableAddButton
                className="h-full min-h-[8rem]"
                onClick={() =>
                  enable.onProfile({
                    services: [...items, newBusinessOffering("service", "", profile.feeFrom)],
                  })
                }
              >
                + {tx("Add service")}
              </EnableAddButton>
            </li>
          ) : null}
        </ul>
      </DetailSection>
    );
  }

  if (section.kind === "hours") {
    const branches = availabilityBranchesForListing(profile);
    return (
      <AvailabilityHoursEditor
        title={title}
        onTitleChange={setTitle}
        schedule={profile.schedule}
        slotAvailability={profile.slotAvailability}
        city={profile.city}
        locations={branches}
        licenseNumber={profile.licenseNumber}
        readOnly={!enable}
        onChange={(schedule, slotAvailability) =>
          enable?.onProfile({ schedule, slotAvailability, hours: summarizeSchedule(schedule) })
        }
      />
    );
  }

  if (section.kind === "gallery") {
    const photos = section.photos ?? [];
    const shown = photos.filter((p) => p.src);
    if (!shown.length && !enable) return <EmptyBlock title={title} text={tx("No photos yet.")} />;
    return (
      <DetailSection title={title} onTitleChange={setTitle} lede={tx("Campus and care-area photos.")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(enable ? photos : shown).map((p, i) => (
            <figure key={i} className="overflow-hidden rounded-xl border border-line bg-[color:var(--pp-primary-100)]">
              {p.src ? (
                <img src={p.src} alt={p.label} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="aspect-[4/3] bg-[color:var(--pp-primary-200)]" />
              )}
              {enable ? (
                <div className="space-y-1 p-2">
                  <input
                    className={ENABLE_FIELD}
                    value={p.src}
                    onChange={(e) =>
                      enable.onSection({
                        photos: photos.map((row, j) => (j === i ? { ...row, src: e.target.value } : row)),
                      })
                    }
                    placeholder={tx("Image URL")}
                  />
                  <input
                    className={ENABLE_FIELD}
                    value={p.label}
                    onChange={(e) =>
                      enable.onSection({
                        photos: photos.map((row, j) => (j === i ? { ...row, label: e.target.value } : row)),
                      })
                    }
                    placeholder={tx("Label")}
                  />
                  <button
                    type="button"
                    className="text-xs text-ink-tertiary"
                    onClick={() => enable.onSection({ photos: photos.filter((_, j) => j !== i) })}
                  >
                    {tx("Remove")}
                  </button>
                </div>
              ) : p.label ? (
                <figcaption className="px-3 py-2 text-2xs text-ink-tertiary">{p.label}</figcaption>
              ) : null}
            </figure>
          ))}
          {enable ? (
            <button
              type="button"
              onClick={() => enable.onSection({ photos: [...photos, { src: "", label: "" }] })}
              className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--pp-primary-300)] bg-white text-sm font-medium"
            >
              + {tx("Add photo")}
            </button>
          ) : null}
        </div>
      </DetailSection>
    );
  }

  if (section.kind === "faq") {
    const faqs = section.faqs ?? [];
    if (!faqs.length && !enable) return <EmptyBlock title={title} text={tx("No questions yet.")} />;
    return (
      <FaqAccordion
        items={faqs}
        onChange={enable ? (next) => enable.onSection({ faqs: next }) : undefined}
      />
    );
  }

  if (section.kind === "publications") {
    return (
      <RecentArticlesSection
        title={title}
        onTitleChange={setTitle}
        lede={tx("News, articles, and other verified publications.")}
        publications={profile.publications}
        onChange={enable ? (publications) => enable.onProfile({ publications }) : undefined}
      />
    );
  }

  if (section.kind === "awards") {
    const awards = section.awards ?? [];
    const shown = awards.filter((a) => a.title.trim());
    if (!shown.length && !enable) return <EmptyBlock title={title} text={tx("No awards listed yet.")} />;
    return (
      <DetailSection title={title} onTitleChange={setTitle} flush>
        <div>
          {(enable ? awards : shown).map((a, i) => (
            <div key={i} className={"px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
              {enable ? (
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_5rem_auto]">
                  <input
                    className={ENABLE_FIELD}
                    value={a.title}
                    onChange={(e) =>
                      enable.onSection({
                        awards: awards.map((row, j) => (j === i ? { ...row, title: e.target.value } : row)),
                      })
                    }
                    placeholder={tx("Award")}
                  />
                  <input
                    className={ENABLE_FIELD}
                    value={a.org}
                    onChange={(e) =>
                      enable.onSection({
                        awards: awards.map((row, j) => (j === i ? { ...row, org: e.target.value } : row)),
                      })
                    }
                    placeholder={tx("Organisation")}
                  />
                  <input
                    className={ENABLE_FIELD}
                    value={a.year}
                    onChange={(e) =>
                      enable.onSection({
                        awards: awards.map((row, j) => (j === i ? { ...row, year: e.target.value } : row)),
                      })
                    }
                    placeholder={tx("Year")}
                  />
                  <button
                    type="button"
                    className="text-sm text-ink-tertiary"
                    onClick={() => enable.onSection({ awards: awards.filter((_, j) => j !== i) })}
                  >
                    {tx("Remove")}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{a.title}</p>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    {a.org}
                    {a.year ? <span className="text-ink-tertiary"> · {a.year}</span> : null}
                  </p>
                </>
              )}
            </div>
          ))}
          {enable ? (
            <div className={"px-5 py-3 " + (awards.length ? "border-t border-line" : "")}>
              <button
                type="button"
                className="text-sm font-medium text-[color:var(--pp-violet)]"
                onClick={() => enable.onSection({ awards: [...awards, { title: "", org: "", year: "" }] })}
              >
                + {tx("Add award")}
              </button>
            </div>
          ) : null}
        </div>
      </DetailSection>
    );
  }

  const place = [profile.address, profile.city].filter(Boolean).join(", ");
  if (section.kind === "custom") {
    return <ListingBlockView section={section} fallbackQuery={place} />;
  }
  return <EmptyBlock title={title} text={tx("Empty section.")} />;
}
