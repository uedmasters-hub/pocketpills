import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  specialtyById,
  type CareProvider,
} from "@/lib/appointments";
import {
  clinicAboutFacts,
  clinicCareAreas,
  clinicFacilities,
  clinicFaqs,
  clinicHoursRows,
  clinicTreatments,
  clinicWalkIn,
  type ClinicView,
} from "@/lib/clinicProfileContent";
import { DoctorPhoto } from "@/components/DoctorPhoto";
import { DetailSection } from "@/components/DetailSection";
import { FaqAccordion } from "@/components/FaqAccordion";
import { Lightbox } from "@/components/ui/Lightbox";
import { RecentArticlesSection } from "@/components/RecentArticles";
import { nmcNumberOf, providerProfileHref } from "@/lib/doctorProfileContent";
import { getFacilityClaim } from "@/lib/facilityDirectory";
import { ownerIdForListing } from "@/lib/businessProfile";
import { RelatedHealthcareOptions } from "@/components/RelatedHealthcareOptions";
import { ListingCustomSections } from "@/components/ListingCustomSections";
import { enabledSectionsInOrder, listingSectionEnabled } from "@/lib/listingPage";

const CARD = "rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-4";

export function ClinicAboutFacts({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  const facts = clinicAboutFacts(clinic);
  if (!facts.length) return null;
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {facts.map((f) => (
        <div key={f.k} className={CARD}>
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx(f.k)}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--pp-primary-950)]">{f.v}</p>
        </div>
      ))}
    </div>
  );
}

export function ClinicTreatmentsSection({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  const all = clinicTreatments(clinic);
  if (!all.length) return null;
  const byDept = new Map<string, typeof all>();
  for (const row of all) {
    const list = byDept.get(row.department) ?? [];
    list.push(row);
    byDept.set(row.department, list);
  }
  return (
    <DetailSection
      title={tx("Treatments & procedures")}
      lede={tx("Procedures listed for this clinic.")}
    >
      <div className="space-y-3">
        {[...byDept.entries()].map(([dept, items]) => (
          <div key={dept} className={CARD}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx(dept)}</p>
            <ul className="mt-2 divide-y divide-line">
              {items.map((item) => (
                <li key={dept + item.name} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="text-sm text-[color:var(--pp-primary-950)]">{tx(item.name)}</span>
                  <span className="flex shrink-0 gap-3">
                    <Link to={item.href} className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70">
                      {tx("View details")}
                    </Link>
                    <Link
                      to={clinic.staff.length ? "#clinic-doctors" : "/appointments"}
                      className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70"
                    >
                      {tx("Book appointment")}
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </DetailSection>
  );
}

export function ClinicDoctorsSection({
  clinic,
  listedOnly = false,
}: {
  clinic: ClinicView;
  listedOnly?: boolean;
}) {
  if (clinic.hasListing && !listingSectionEnabled(clinic.pageSections, "doctors")) return null;
  const { tx } = useI18n();
  if (!clinic.staff.length) return null;
  if (listedOnly) {
    return (
      <DetailSection
        id="clinic-doctors"
        title={tx("Our doctors")}
        lede={tx("Clinicians practising at this clinic. Open a doctor’s profile from the doctors directory to book.")}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {clinic.staff.map((d) => (
            <ListedClinicDoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      </DetailSection>
    );
  }
  return (
    <DetailSection
      id="clinic-doctors"
      title={tx("Doctors & practitioners")}
      lede={tx("Clinicians listed as practising at this clinic.")}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {clinic.staff.map((d) => (
          <ClinicDoctorCard key={d.id} doctor={d} facilityId={clinic.id} />
        ))}
      </div>
    </DetailSection>
  );
}

function ListedClinicDoctorCard({ doctor }: { doctor: CareProvider }) {
  const spec = doctor.subtitle || (doctor.education?.[0] ?? "");
  const nmc = nmcNumberOf(doctor);
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-white px-4 py-5 text-center">
      <DoctorPhoto src={doctor.imageUrl} className="h-20 w-20" />
      <p className="mt-3 line-clamp-2 text-sm font-semibold text-[color:var(--pp-primary-950)]">{doctor.name}</p>
      {spec ? <p className="mt-1 line-clamp-2 text-xs text-ink-tertiary">{spec}</p> : null}
      {doctor.about ? <p className="mt-1 line-clamp-3 text-xs text-ink-tertiary">{doctor.about}</p> : null}
      {nmc ? <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-ink-tertiary">NMC #{nmc}</p> : null}
    </div>
  );
}

function ClinicDoctorCard({ doctor, facilityId }: { doctor: CareProvider; facilityId: string }) {
  const { tx } = useI18n();
  const spec = doctor.specialties[0] ? specialtyById(doctor.specialties[0])?.label : doctor.subtitle;
  const visit = [
    doctor.visitTypes.includes("clinic") ? tx("In-clinic") : null,
    doctor.visitTypes.includes("virtual") ? tx("Online") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const available =
    doctor.nextAvailable === "Today" || doctor.nextAvailable === "Tomorrow" || doctor.nextAvailable === "In 2 days"
      ? tx(doctor.nextAvailable)
      : doctor.nextAvailable;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white p-3">
      <div className="flex gap-3">
        <DoctorPhoto src={doctor.imageUrl} className="h-14 w-14 shrink-0" rounded="xl" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-[color:var(--pp-primary-950)]">{doctor.name}</p>
          <p className="mt-0.5 truncate text-xs text-ink-tertiary">{spec}</p>
          {doctor.education?.[0] ? (
            <p className="mt-0.5 truncate text-xs text-ink-tertiary">{doctor.education[0]}</p>
          ) : null}
        </div>
      </div>
      {doctor.reviewCount > 0 ? (
        <p className="mt-2 text-xs text-ink-tertiary">
          <span className="font-semibold text-[color:var(--pp-violet)]">★ {doctor.rating.toFixed(1)}</span>
          <span> · {doctor.reviewCount}</span>
        </p>
      ) : null}
      <p className="mt-1 text-2xs text-ink-tertiary">
        {[visit, available].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={providerProfileHref(doctor)} className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70">
          {tx("View profile")}
        </Link>
        <Link
          to={`/appointments/provider/${doctor.id}?facility=${encodeURIComponent(facilityId)}`}
          className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70"
        >
          {tx("Book appointment")}
        </Link>
      </div>
    </div>
  );
}

export function ClinicConditionsSection({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  const areas = clinicCareAreas(clinic);
  if (!areas.length) return null;
  return (
    <DetailSection
      title={tx("Conditions & areas of care")}
      lede={tx("Based on specialties and services listed on this clinic.")}
    >
      <div className="flex flex-wrap gap-2">
        {areas.map((a) => (
          <span
            key={a}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-[color:var(--pp-primary-950)]"
          >
            {tx(a)}
          </span>
        ))}
      </div>
    </DetailSection>
  );
}

export function ClinicFacilitiesSection({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  const items = clinicFacilities(clinic);
  if (!items.length) return null;
  return (
    <DetailSection title={tx("Facilities & amenities")} lede={tx("Only items listed on this profile.")}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 rounded-xl border border-line bg-[color:var(--pp-primary-100)] px-4 py-3 text-sm text-[color:var(--pp-primary-950)]"
          >
            <span className="mt-0.5 text-wellness" aria-hidden>✓</span>
            {tx(item)}
          </li>
        ))}
      </ul>
    </DetailSection>
  );
}

export function ClinicExpectSection({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  const steps = [
    { k: "Book an appointment", v: "Choose a listed service or practitioner and confirm your slot on PocketPills." },
    { k: "Check in at reception", v: clinicWalkIn(clinic)
        ? "Arrive at reception. Walk-ins and booked visits both check in at the front desk."
        : "Arrive a few minutes early. Quote your booking and bring photo ID." },
    { k: "Meet your practitioner", v: "See the listed clinician for your visit." },
    { k: "Diagnostics / treatment", v: "Labs or procedures run only if they are listed on this clinic profile." },
    { k: "Follow-up instructions", v: "Collect any reports at the desk, then book a follow-up from the practitioner’s page." },
  ];
  return (
    <div className="space-y-3">
      <DetailSection
        title={tx("What to expect at your visit")}
        lede={tx("A typical booked visit at this clinic.")}
        flush
      >
        <ol>
          {steps.map((s, i) => (
            <li key={s.k} className={"px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                {i + 1}. {tx(s.k)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--pp-primary-950)]">{tx(s.v)}</p>
            </li>
          ))}
        </ol>
      </DetailSection>
      <p className="px-1 text-sm text-ink-tertiary">
        {tx("Bring photo ID, referrals, your medicine list, and insurance details if you use a plan.")}
      </p>
    </div>
  );
}

export function ClinicHoursSection({ clinic }: { clinic: ClinicView }) {
  if (clinic.hasListing && !listingSectionEnabled(clinic.pageSections, "hours")) return null;
  const { tx } = useI18n();
  const rows = clinicHoursRows(clinic);
  const practitioners = clinic.staff.filter((d) => d.nextAvailable);
  if (!rows.length && !practitioners.length) return null;
  return (
    <div className="space-y-3">
      <DetailSection
        title={tx("Clinic hours & availability")}
        lede={tx("Clinic opening hours are separate from when a listed practitioner can see you.")}
        flush={rows.length > 0}
      >
        {rows.length ? (
          <dl>
            {rows.map((row, i) => (
              <div key={row.k} className={"flex justify-between gap-4 px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
                <dt className="text-sm text-ink-tertiary">{tx(row.k)}</dt>
                <dd className="max-w-[60%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(row.v)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {practitioners.length ? (
          <div className={(rows.length ? "border-t border-line px-5 py-4 " : "") + CARD}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {tx("Practitioner availability")}
            </p>
            <ul className="mt-2 divide-y divide-line">
              {practitioners.map((d) => (
                <li key={d.id} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="text-[color:var(--pp-primary-950)]">{d.name}</span>
                  <span className="text-ink-tertiary">
                    {d.nextAvailable === "Today" || d.nextAvailable === "Tomorrow" || d.nextAvailable === "In 2 days"
                      ? tx(d.nextAvailable)
                      : d.nextAvailable}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DetailSection>
      {clinicWalkIn(clinic) ? (
        <p className="px-1 text-sm text-ink-secondary">{tx("Walk-in visits are listed in addition to booked appointments.")}</p>
      ) : null}
    </div>
  );
}

export function ClinicNewsSection({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  if (!clinic.updates?.length) return null;
  return (
    <DetailSection
      title={tx("Clinic news & updates")}
      lede={tx("Announcements from this listing — not generic health articles.")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {clinic.updates.map((u) => (
          <article key={u.title} className={CARD}>
            <p className="text-2xs text-ink-tertiary">{u.date}</p>
            <h3 className="mt-1.5 font-semibold text-[color:var(--pp-primary-950)]">{tx(u.title)}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{tx(u.summary)}</p>
          </article>
        ))}
      </div>
    </DetailSection>
  );
}

export function ClinicArticlesSection({ clinic }: { clinic: ClinicView }) {
  if (clinic.hasListing && !listingSectionEnabled(clinic.pageSections, "publications")) return null;
  const ownerId = ownerIdForListing(
    clinic.id,
    clinic.registrationNo ? getFacilityClaim(clinic.registrationNo)?.providerId : undefined,
  );
  return (
    <RecentArticlesSection
      ownerId={ownerId}
      lede="News, articles, and other verified publications from this clinic."
    />
  );
}

export function ClinicAwardsSection({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  if (clinic.hasListing && !listingSectionEnabled(clinic.pageSections, "awards")) return null;
  if (!clinic.awards?.length) return null;
  return (
    <DetailSection
      title={tx("Achievements & certifications")}
      lede={tx("Verified recognitions listed on this profile.")}
      flush
    >
      <div>
        {clinic.awards.map((a, i) => (
          <div key={a.title + a.year} className={"px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(a.title)}</p>
            <p className="mt-0.5 text-sm text-ink-secondary">
              {a.org}
              <span className="text-ink-tertiary"> · {a.year}</span>
            </p>
          </div>
        ))}
      </div>
    </DetailSection>
  );
}

export function ClinicFaqSection({ clinic }: { clinic: ClinicView }) {
  if (clinic.hasListing && !listingSectionEnabled(clinic.pageSections, "faq")) return null;
  const items = clinic.faqs?.length ? clinic.faqs : clinicFaqs(clinic);
  if (!items.length) return null;
  return <FaqAccordion items={items} />;
}

export function ClinicGallerySection({ clinic }: { clinic: ClinicView }) {
  if (clinic.hasListing && !listingSectionEnabled(clinic.pageSections, "gallery")) return null;
  const { tx } = useI18n();
  const photos = clinic.gallery ?? [];
  const [index, setIndex] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <DetailSection title={tx("Clinic photos & facilities")} lede={tx("Verified images of this clinic.")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((g, i) => (
          <button
            key={g.src + g.label}
            type="button"
            onClick={() => setIndex(i)}
            className="overflow-hidden rounded-xl border border-line bg-[color:var(--pp-primary-100)] text-left"
          >
            <img src={g.src} alt={g.label} className="aspect-[4/3] w-full object-cover" />
            {g.label ? <span className="block px-3 py-2 text-2xs text-ink-tertiary">{tx(g.label)}</span> : null}
          </button>
        ))}
      </div>
      <Lightbox
        open={index != null}
        images={photos}
        index={index ?? 0}
        onClose={() => setIndex(null)}
        onPrev={() => setIndex((i) => (i == null ? 0 : (i - 1 + photos.length) % photos.length))}
        onNext={() => setIndex((i) => (i == null ? 0 : (i + 1) % photos.length))}
      />
    </DetailSection>
  );
}


export function ClinicRelatedSection({ clinic }: { clinic: ClinicView }) {
  return (
    <RelatedHealthcareOptions
      city={clinic.city || clinic.address}
      excludeId={clinic.id}
      excludeHfCode={clinic.registrationNo}
      only="clinic"
    />
  );
}

export function ClinicProfileMid({
  clinic,
  includeDoctors = true,
}: {
  clinic: ClinicView;
  includeDoctors?: boolean;
}) {
  if (clinic.hasListing && clinic.pageSections?.length) {
    return (
      <>
        {enabledSectionsInOrder(clinic.pageSections).map((section) => {
          if (section.kind === "doctors" && includeDoctors) {
            return <ClinicDoctorsSection key={section.id} clinic={clinic} listedOnly />;
          }
          if (section.kind === "specialised") return <ClinicConditionsSection key={section.id} clinic={clinic} />;
          if (section.kind === "facilities") return <ClinicFacilitiesSection key={section.id} clinic={clinic} />;
          if (section.kind === "hours") return <ClinicHoursSection key={section.id} clinic={clinic} />;
          if (section.kind === "publications") return <ClinicArticlesSection key={section.id} clinic={clinic} />;
          if (section.kind === "awards") return <ClinicAwardsSection key={section.id} clinic={clinic} />;
          if (section.kind === "faq") return <ClinicFaqSection key={section.id} clinic={clinic} />;
          if (section.kind === "gallery") return <ClinicGallerySection key={section.id} clinic={clinic} />;
          if (section.kind === "custom") {
            return (
              <ListingCustomSections
                key={section.id}
                sections={[section]}
                fallbackQuery={[clinic.address, clinic.city, clinic.name].filter(Boolean).join(", ")}
              />
            );
          }
          return null;
        })}
      </>
    );
  }

  const show = (kind: Parameters<typeof listingSectionEnabled>[1]) =>
    !clinic.hasListing || listingSectionEnabled(clinic.pageSections, kind);
  return (
    <>
      {includeDoctors && show("doctors") ? <ClinicDoctorsSection clinic={clinic} listedOnly /> : null}
      {show("specialised") ? <ClinicConditionsSection clinic={clinic} /> : null}
      {show("facilities") ? <ClinicFacilitiesSection clinic={clinic} /> : null}
      <ClinicExpectSection clinic={clinic} />
      {show("hours") ? <ClinicHoursSection clinic={clinic} /> : null}
      <ClinicNewsSection clinic={clinic} />
      {show("publications") ? <ClinicArticlesSection clinic={clinic} /> : null}
      {show("awards") ? <ClinicAwardsSection clinic={clinic} /> : null}
      <ListingCustomSections
        sections={clinic.pageSections}
        fallbackQuery={[clinic.address, clinic.city, clinic.name].filter(Boolean).join(", ")}
      />
    </>
  );
}

export function ClinicProfileAfterReviews({ clinic }: { clinic: ClinicView }) {
  if (clinic.hasListing) return null;
  return (
    <>
      <ClinicFaqSection clinic={clinic} />
      <ClinicGallerySection clinic={clinic} />
    </>
  );
}
