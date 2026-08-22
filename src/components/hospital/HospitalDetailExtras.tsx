import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  formatFee,
  specialtyById,
  type CareProvider,
} from "@/lib/appointments";
import { getFacilityClaim } from "@/lib/facilityDirectory";
import { ownerIdForListing } from "@/lib/businessProfile";
import { providerProfileHref, nmcNumberOf } from "@/lib/doctorProfileContent";
import { HospitalFacilitiesGrid } from "@/components/hospital/HospitalFacilitiesGrid";
import { DetailSection } from "@/components/DetailSection";
import { Lightbox } from "@/components/ui/Lightbox";
import { FaqAccordion } from "@/components/FaqAccordion";
import { RecentArticlesSection } from "@/components/RecentArticles";
import { RelatedHealthcareOptions } from "@/components/RelatedHealthcareOptions";
import {
  doctorsInDepartment,
  hospitalAboutFacts,
  hospitalEmergency,
  hospitalFaqs,
  hospitalTreatments,
  splitAmenities,
  type HospitalView,
} from "@/lib/hospitalProfileContent";
import { DoctorPhoto } from "@/components/DoctorPhoto";
import { ListingCustomSections } from "@/components/ListingCustomSections";
import { enabledSectionsInOrder, listingSectionEnabled } from "@/lib/listingPage";
import { SpecialisedInSection } from "@/components/SpecialisedIn";
import { DEFAULT_HOSPITAL_GALLERY } from "@/lib/hospitalLandingFacilities";

const CARD = "rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-4";

export function HospitalAboutFacts({ hospital }: { hospital: HospitalView }) {
  const { tx } = useI18n();
  const facts = hospitalAboutFacts(hospital);
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

export function HospitalDoctorsSection({
  hospital,
  listedOnly = false,
}: {
  hospital: HospitalView;
  listedOnly?: boolean;
}) {
  if (hospital.hasListing && !listingSectionEnabled(hospital.pageSections, "doctors")) return null;
  const { tx } = useI18n();
  const doctors = listedOnly ? hospital.staff.slice(0, 8) : hospital.staff;
  if (!doctors.length) return null;

  if (listedOnly) {
    return (
      <DetailSection
        id="hospital-doctors"
        title={tx("Our doctors")}
        lede={tx("Clinicians practising at this hospital. Open a doctor’s profile from the doctors directory to book.")}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {doctors.map((d) => (
            <ListedDoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      </DetailSection>
    );
  }

  const groups = hospital.specialisedIn
    .map((g) => ({ specialty: g.specialty, doctors: doctorsInDepartment(hospital.staff, g.specialty) }))
    .filter((g) => g.doctors.length > 0);
  const groupedIds = new Set(groups.flatMap((g) => g.doctors.map((d) => d.id)));
  const rest = hospital.staff.filter((d) => !groupedIds.has(d.id));
  const blocks = [
    ...groups,
    rest.length ? { specialty: "Other consultants", doctors: rest } : null,
  ].filter(Boolean) as { specialty: string; doctors: CareProvider[] }[];

  return (
    <DetailSection
      id="hospital-doctors"
      title={tx("Doctors & specialists")}
      lede={tx("Clinicians listed as practising at this facility.")}
    >
      <span id="consultants" className="sr-only" />
      <div className="space-y-4">
        {blocks.map((block) => (
          <div key={block.specialty}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {tx(block.specialty)}
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {block.doctors.map((d) => (
                <DoctorMiniCard key={d.id} doctor={d} facilityId={hospital.id} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </DetailSection>
  );
}

function ListedDoctorCard({ doctor }: { doctor: CareProvider }) {
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

function DoctorMiniCard({ doctor, facilityId }: { doctor: CareProvider; facilityId: string }) {
  const { tx } = useI18n();
  const spec = doctor.specialties[0] ? specialtyById(doctor.specialties[0])?.label : doctor.subtitle;
  const visit = [
    doctor.visitTypes.includes("clinic") ? tx("In-clinic") : null,
    doctor.visitTypes.includes("virtual") ? tx("Online") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white p-3">
      <div className="flex gap-3">
        <DoctorPhoto src={doctor.imageUrl} className="h-14 w-14 shrink-0" rounded="xl" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-[color:var(--pp-primary-950)]">{doctor.name}</p>
          <p className="mt-0.5 truncate text-xs text-ink-tertiary">{spec}</p>
          {doctor.education?.[0] ? (
            <p className="mt-0.5 truncate text-xs text-ink-tertiary">{doctor.education[0]}</p>
          ) : doctor.subtitle && doctor.subtitle !== spec ? (
            <p className="mt-0.5 truncate text-xs text-ink-tertiary">{doctor.subtitle}</p>
          ) : null}
        </div>
      </div>
      {doctor.reviewCount > 0 ? (
        <p className="mt-2 text-xs text-ink-tertiary">
          <span className="font-semibold text-[color:var(--pp-violet)]">★ {doctor.rating.toFixed(1)}</span>
          <span> · {doctor.reviewCount}</span>
          <span> · {formatFee(doctor.consultationFee)}</span>
        </p>
      ) : null}
      {visit ? <p className="mt-1 text-2xs text-ink-tertiary">{visit}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={providerProfileHref(doctor)}
          className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70"
        >
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

export function HospitalTreatmentsSection({ hospital }: { hospital: HospitalView }) {
  const { tx } = useI18n();
  const all = hospitalTreatments(hospital);
  const [q, setQ] = useState("");
  if (!all.length) return null;
  const query = q.trim().toLowerCase();
  const rows = query
    ? all.filter((r) => `${r.name} ${r.department}`.toLowerCase().includes(query))
    : all;
  const byDept = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byDept.get(row.department) ?? [];
    list.push(row);
    byDept.set(row.department, list);
  }

  return (
    <DetailSection
      title={tx("Treatments & procedures")}
      lede={tx("Procedures listed for this facility’s departments.")}
    >
      <label className="block">
        <span className="sr-only">{tx("Search procedures")}</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tx("Search procedures")}
          className="h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary focus:border-[color:var(--pp-primary-950)]"
        />
      </label>
      <div className="mt-4 space-y-4">
        {[...byDept.entries()].map(([dept, items]) => (
          <div key={dept} className={CARD}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx(dept)}</p>
            <ul className="mt-2 divide-y divide-line">
              {items.map((item) => (
                <li key={dept + item.name} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="text-sm text-[color:var(--pp-primary-950)]">{tx(item.name)}</span>
                  <span className="flex shrink-0 gap-3">
                    <Link
                      to={item.href}
                      className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70"
                    >
                      {tx("View details")}
                    </Link>
                    <Link
                      to={hospital.staff.length ? "#hospital-doctors" : "/appointments"}
                      className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70"
                    >
                      {tx("Book consultation")}
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!rows.length ? (
          <p className="text-sm text-ink-tertiary">{tx("No matching procedures on this profile.")}</p>
        ) : null}
      </div>
    </DetailSection>
  );
}

export function HospitalServicesFacilities({ hospital }: { hospital: HospitalView }) {
  const { tx } = useI18n();
  const { medical, patient } = splitAmenities(hospital);
  if (!medical.length && !patient.length) return null;
  return (
    <DetailSection title={tx("Services & facilities")} lede={tx("Only items listed on this profile.")}>
      <div className="grid gap-4 sm:grid-cols-2">
        {medical.length ? (
          <div className={CARD}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Medical services")}</p>
            <ul className="mt-3 space-y-1.5">
              {medical.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-[color:var(--pp-primary-950)]">
                  <span className="text-wellness" aria-hidden>✓</span>
                  {tx(item)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {patient.length ? (
          <div className={CARD}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Patient facilities")}</p>
            <ul className="mt-3 space-y-1.5">
              {patient.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-[color:var(--pp-primary-950)]">
                  <span className="text-wellness" aria-hidden>✓</span>
                  {tx(item)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </DetailSection>
  );
}

export function HospitalEmergencySection({ hospital }: { hospital: HospitalView }) {
  const { tx } = useI18n();
  const data = hospitalEmergency(hospital);
  if (!data) return null;
  const roundTheClock = data.notes.some((n) => /24\/7/.test(n));
  return (
    <DetailSection
      title={tx("Emergency care")}
      lede={tx("Shown only when emergency or urgent care is listed on this profile.")}
    >
      <div
        className={
          "rounded-xl border p-5 " +
          (roundTheClock
            ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)]"
            : "border-line bg-[color:var(--pp-primary-100)]")
        }
      >
        {roundTheClock ? (
          <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
            {tx("Listed 24/7")}
          </p>
        ) : null}
        <dl className="mt-2 space-y-2">
          {data.hours ? (
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-ink-tertiary">{tx("Hours")}</dt>
              <dd className="text-right text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(data.hours)}</dd>
            </div>
          ) : null}
          {data.phone ? (
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-ink-tertiary">{tx("Emergency contact")}</dt>
              <dd className="text-sm font-medium text-[color:var(--pp-primary-950)]">
                <a href={`tel:${data.phone.replace(/\s/g, "")}`} className="hover:opacity-70">
                  {data.phone}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
        {data.notes.length ? (
          <ul className="mt-3 space-y-1.5">
            {data.notes.map((n) => (
              <li key={n} className="text-sm text-[color:var(--pp-primary-950)]">
                {tx(n)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </DetailSection>
  );
}

export function HospitalGuideSection({ hospital }: { hospital: HospitalView }) {
  const { tx } = useI18n();
  const steps = [
    { k: "Before your visit", v: "Book a slot, note your department, and pack ID, reports, and your medicine list." },
    { k: "Registration / check-in", v: "Arrive at main reception or outpatient registration. Quote your PocketPills booking." },
    { k: "Finding your department", v: hospital.specialisedIn[0]
        ? `Follow signs to ${hospital.specialisedIn.map((g) => g.specialty).slice(0, 3).join(", ")}.`
        : "Follow on-site signs to your booked department." },
    { k: "Consultation / diagnostics", v: "See the listed clinician. Diagnostics run only if they are listed on this profile." },
    { k: "Payment / insurance", v: "Fees show before you confirm on PocketPills. Ask at the desk about any plan you use." },
    { k: "Reports and follow-up", v: "Collect reports from the listed lab/diagnostics desk, then book follow-up from the doctor’s page." },
  ];
  return (
    <DetailSection
      title={tx("Patient guide / what to expect")}
      lede={tx("A typical visit through PocketPills at a listed facility.")}
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
  );
}

export function HospitalNewsSection({ hospital }: { hospital: HospitalView }) {
  const { tx } = useI18n();
  if (!hospital.updates?.length) return null;
  return (
    <DetailSection
      title={tx("Hospital news & updates")}
      lede={tx("Announcements from this listing — not generic health articles.")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {hospital.updates.map((u) => (
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

export function HospitalArticlesSection({ hospital }: { hospital: HospitalView }) {
  if (hospital.hasListing && !listingSectionEnabled(hospital.pageSections, "publications")) return null;
  const ownerId = ownerIdForListing(
    hospital.id,
    hospital.registrationNo ? getFacilityClaim(hospital.registrationNo)?.providerId : undefined,
  );
  return (
    <RecentArticlesSection
      ownerId={ownerId}
      lede="News, articles, and other verified publications from this hospital."
    />
  );
}

export function HospitalAwardsSection({ hospital }: { hospital: HospitalView }) {
  const { tx } = useI18n();
  if (hospital.hasListing && !listingSectionEnabled(hospital.pageSections, "awards")) return null;
  if (!hospital.awards?.length) return null;
  return (
    <DetailSection
      title={tx("Accreditations, achievements & milestones")}
      lede={tx("Verified recognitions listed on this profile.")}
      flush
    >
      <div>
        {hospital.awards.map((a, i) => (
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

export function HospitalFaqSection({ hospital }: { hospital: HospitalView }) {
  if (hospital.hasListing && !listingSectionEnabled(hospital.pageSections, "faq")) return null;
  const items = hospital.faqs?.length ? hospital.faqs : hospitalFaqs(hospital);
  if (!items.length) return null;
  return <FaqAccordion items={items} />;
}

export function HospitalGallerySection({ hospital }: { hospital: HospitalView }) {
  const { tx } = useI18n();
  if (hospital.hasListing && !listingSectionEnabled(hospital.pageSections, "gallery")) return null;
  const photos = hospital.gallery?.length
    ? hospital.gallery
    : hospital.hasListing
      ? []
      : DEFAULT_HOSPITAL_GALLERY;
  if (!photos.length) return null;
  const [index, setIndex] = useState<number | null>(null);

  return (
    <DetailSection title={tx("Gallery")} lede={tx("Campus and care-area photos.")}>
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


export function HospitalRelatedSection({ hospital }: { hospital: HospitalView }) {
  return (
    <RelatedHealthcareOptions
      city={hospital.city || hospital.address}
      excludeId={hospital.id}
      excludeHfCode={hospital.registrationNo}
      only="hospital"
    />
  );
}

export function HospitalProfileMid({
  hospital,
  includeDoctors = true,
}: {
  hospital: HospitalView;
  includeDoctors?: boolean;
}) {
  if (hospital.hasListing && hospital.pageSections?.length) {
    return (
      <>
        {enabledSectionsInOrder(hospital.pageSections).map((section) => {
          if (section.kind === "facilities") return <HospitalFacilitiesGrid key={section.id} hospital={hospital} />;
          if (section.kind === "doctors" && includeDoctors) {
            return <HospitalDoctorsSection key={section.id} hospital={hospital} listedOnly />;
          }
          if (section.kind === "gallery") return <HospitalGallerySection key={section.id} hospital={hospital} />;
          if (section.kind === "faq") return <HospitalFaqSection key={section.id} hospital={hospital} />;
          if (section.kind === "publications") return <HospitalArticlesSection key={section.id} hospital={hospital} />;
          if (section.kind === "awards") return <HospitalAwardsSection key={section.id} hospital={hospital} />;
          if (section.kind === "specialised" && hospital.specialisedIn.length) {
            return (
              <SpecialisedInSection
                key={section.id}
                groups={hospital.specialisedIn}
                variant="facility"
                staff={hospital.staff}
              />
            );
          }
          if (section.kind === "custom") {
            return (
              <ListingCustomSections
                key={section.id}
                sections={[section]}
                fallbackQuery={[hospital.address, hospital.city, hospital.name].filter(Boolean).join(", ")}
              />
            );
          }
          return null;
        })}
      </>
    );
  }

  const show = (kind: Parameters<typeof listingSectionEnabled>[1]) =>
    !hospital.hasListing || listingSectionEnabled(hospital.pageSections, kind);
  return (
    <>
      {show("facilities") ? <HospitalFacilitiesGrid hospital={hospital} /> : null}
      {includeDoctors && show("doctors") ? <HospitalDoctorsSection hospital={hospital} listedOnly /> : null}
      {show("gallery") ? <HospitalGallerySection hospital={hospital} /> : null}
      {show("faq") ? <HospitalFaqSection hospital={hospital} /> : null}
      <ListingCustomSections
        sections={hospital.pageSections}
        fallbackQuery={[hospital.address, hospital.city, hospital.name].filter(Boolean).join(", ")}
      />
    </>
  );
}

export function HospitalProfileAfterReviews({ hospital: _hospital }: { hospital: HospitalView }) {
  return null;
}
