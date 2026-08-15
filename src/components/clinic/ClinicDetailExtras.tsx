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
import { FaqAccordion } from "@/components/FaqAccordion";
import { RecentArticlesSection } from "@/components/RecentArticles";
import { providerProfileHref } from "@/lib/doctorProfileContent";
import { getFacilityClaim } from "@/lib/facilityDirectory";
import { ownerIdForListing } from "@/lib/businessProfile";
import { RelatedHealthcareOptions } from "@/components/RelatedHealthcareOptions";

const CARD = "rounded-2xl border border-line bg-white p-4";
const H2 = "font-display text-xl font-medium text-[color:var(--pp-primary-950)]";
const LEDE = "mt-1 text-sm text-ink-tertiary";

function SectionHead({ title, lede }: { title: string; lede?: string }) {
  const { tx } = useI18n();
  return (
    <>
      <h2 className={H2}>{tx(title)}</h2>
      {lede ? <p className={LEDE}>{tx(lede)}</p> : null}
    </>
  );
}

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
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Treatments & procedures"
        lede="Procedures listed for this clinic."
      />
      <div className="mt-4 space-y-3">
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
    </section>
  );
}

export function ClinicDoctorsSection({ clinic }: { clinic: ClinicView }) {
  if (!clinic.staff.length) return null;
  return (
    <section id="clinic-doctors" className="min-w-0 scroll-mt-28">
      <SectionHead title="Doctors & practitioners" lede="Clinicians listed as practising at this clinic." />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {clinic.staff.map((d) => (
          <ClinicDoctorCard key={d.id} doctor={d} facilityId={clinic.id} />
        ))}
      </div>
    </section>
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
        <img src={doctor.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover object-top" />
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
    <section className="min-w-0 scroll-mt-28">
      <SectionHead title="Conditions & areas of care" lede="Based on specialties and services listed on this clinic." />
      <div className="mt-4 flex flex-wrap gap-2">
        {areas.map((a) => (
          <span
            key={a}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-[color:var(--pp-primary-950)]"
          >
            {tx(a)}
          </span>
        ))}
      </div>
    </section>
  );
}

export function ClinicFacilitiesSection({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  const items = clinicFacilities(clinic);
  if (!items.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead title="Facilities & amenities" lede="Only items listed on this profile." />
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-[color:var(--pp-primary-950)]"
          >
            <span className="mt-0.5 text-wellness" aria-hidden>✓</span>
            {tx(item)}
          </li>
        ))}
      </ul>
    </section>
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
    <section className="min-w-0 scroll-mt-28">
      <SectionHead title="What to expect at your visit" lede="A typical booked visit at this clinic." />
      <ol className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {steps.map((s, i) => (
          <li key={s.k} className={"px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {i + 1}. {tx(s.k)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--pp-primary-950)]">{tx(s.v)}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-ink-tertiary">
        {tx("Bring photo ID, referrals, your medicine list, and insurance details if you use a plan.")}
      </p>
    </section>
  );
}

export function ClinicHoursSection({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  const rows = clinicHoursRows(clinic);
  const practitioners = clinic.staff.filter((d) => d.nextAvailable);
  if (!rows.length && !practitioners.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Clinic hours & availability"
        lede="Clinic opening hours are separate from when a listed practitioner can see you."
      />
      {rows.length ? (
        <dl className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
          {rows.map((row, i) => (
            <div key={row.k} className={"flex justify-between gap-4 px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
              <dt className="text-sm text-ink-tertiary">{tx(row.k)}</dt>
              <dd className="max-w-[60%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(row.v)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {practitioners.length ? (
        <div className={"mt-3 " + CARD}>
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
      {clinicWalkIn(clinic) ? (
        <p className="mt-3 text-sm text-ink-secondary">{tx("Walk-in visits are listed in addition to booked appointments.")}</p>
      ) : null}
    </section>
  );
}

export function ClinicNewsSection({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  if (!clinic.updates?.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead title="Clinic news & updates" lede="Announcements from this listing — not generic health articles." />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {clinic.updates.map((u) => (
          <article key={u.title} className={CARD}>
            <p className="text-2xs text-ink-tertiary">{u.date}</p>
            <h3 className="mt-1.5 font-semibold text-[color:var(--pp-primary-950)]">{tx(u.title)}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{tx(u.summary)}</p>
            <p className="mt-3 text-xs font-medium text-[color:var(--pp-violet)]">{tx("Read more")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ClinicArticlesSection({ clinic }: { clinic: ClinicView }) {
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
  if (!clinic.awards?.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead title="Achievements & certifications" lede="Verified recognitions listed on this profile." />
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
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
    </section>
  );
}

export function ClinicFaqSection({ clinic }: { clinic: ClinicView }) {
  return <FaqAccordion items={clinicFaqs(clinic)} />;
}

export function ClinicGallerySection({ clinic }: { clinic: ClinicView }) {
  const { tx } = useI18n();
  if (!clinic.gallery?.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead title="Clinic photos & facilities" lede="Verified images of this clinic." />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {clinic.gallery.map((g) => (
          <figure key={g.src + g.label} className="overflow-hidden rounded-2xl border border-line bg-white">
            <img src={g.src} alt={g.label} className="aspect-[4/3] w-full object-cover" />
            <figcaption className="px-3 py-2 text-2xs text-ink-tertiary">{tx(g.label)}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}


export function ClinicRelatedSection({ clinic }: { clinic: ClinicView }) {
  return (
    <RelatedHealthcareOptions
      city={clinic.city || clinic.address}
      excludeId={clinic.id}
      excludeHfCode={clinic.registrationNo}
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
  return (
    <>
      {includeDoctors ? <ClinicDoctorsSection clinic={clinic} /> : null}
      <ClinicConditionsSection clinic={clinic} />
      <ClinicFacilitiesSection clinic={clinic} />
      <ClinicExpectSection clinic={clinic} />
      <ClinicHoursSection clinic={clinic} />
      <ClinicNewsSection clinic={clinic} />
      <ClinicArticlesSection clinic={clinic} />
      <ClinicAwardsSection clinic={clinic} />
    </>
  );
}

export function ClinicProfileAfterReviews({ clinic }: { clinic: ClinicView }) {
  return (
    <>
      <ClinicFaqSection clinic={clinic} />
      <ClinicGallerySection clinic={clinic} />
    </>
  );
}
