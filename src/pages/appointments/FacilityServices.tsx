import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AvailabilityBoard,
  AvailabilityLocationPill,
  availabilityDayLabel,
} from "@/components/appointments/AvailabilityBoard";
import { useAvailabilityPicker } from "@/components/appointments/useAvailabilityPicker";
import { DetailSection } from "@/components/DetailSection";
import { DirectoryDetailLayout, DIRECTORY_SIDEBAR_CARD } from "@/components/DirectoryDetailLayout";
import { DirectorySidebarMap } from "@/components/MapEmbed";
import { PageSearchField } from "@/components/PageSearchField";
import { Button } from "@/components/ui/Button";
import { ClinicDoctorsSection } from "@/components/clinic/ClinicDetailExtras";
import {
  ConsultantServiceSection,
  FacilityBookingServiceSections,
} from "@/components/hospital/HospitalServiceSections";
import { clinicFromProvider, clinicMapsQuery } from "@/lib/clinicProfileContent";
import { hospitalFromProvider, hospitalMapsQuery } from "@/lib/hospitalProfileContent";
import { useI18n } from "@/lib/i18n";
import {
  facilityServicesHref,
  formatDistance,
  formatFee,
  getFacilityService,
  getFacilityStaff,
  getProvider,
  kindLabel,
  serviceKindLabel,
  type CareProvider,
  type FacilityService,
} from "@/lib/appointments";
import { defaultFacilitySpecialised, sanitizeSpecialisedIn } from "@/lib/specialisedIn";
import { isPastDate, isSlotInPast } from "@/lib/timeSlots";
import { ServicePageShell } from "@/pages/appointments/ServicePageShell";

function bookHref(opts: {
  providerId: string;
  serviceId: string;
  date: string;
  time: string;
}) {
  const qs = new URLSearchParams({
    provider: opts.providerId,
    service: opts.serviceId,
    date: opts.date,
    time: opts.time,
    visit: "clinic",
  });
  return `/appointments/book?${qs.toString()}`;
}

function specialisedFor(provider: CareProvider) {
  const stored = sanitizeSpecialisedIn(provider.specialisedIn);
  return stored.length
    ? stored
    : defaultFacilitySpecialised({
        name: provider.name,
        subtitle: provider.subtitle,
        specialties: provider.specialties,
        breadth: provider.kind === "clinic" ? "clinic" : "hospital",
      });
}

function serviceAbout(service: FacilityService, facilityName: string) {
  switch (service.kind) {
    case "consult":
      return `Choose a consultant practising at ${facilityName}. You’ll pick a date and time on their profile.`;
    case "lab":
      return `Book laboratory, imaging, or diagnostic testing at ${facilityName}. Bring a requisition if your clinician sent one.`;
    case "emergency":
      return `Hold an urgent desk slot at ${facilityName}. For life-threatening symptoms call 911 first — this demo does not dispatch a real emergency team.`;
    case "inward":
      return `Request a planned in-patient bed at ${facilityName}. The ward team confirms the admission window after you book.`;
    case "surgery":
      return `Book a day-surgery or pre-operative assessment at ${facilityName}.`;
    case "ambulance":
      return `Request ambulance or transfer transport with ${facilityName}. For life-threatening emergencies call 911 first.`;
    case "executive":
      return `Book an executive health assessment or corporate medical at ${facilityName}.`;
    case "imaging":
      return `Book outpatient imaging at ${facilityName}. A requisition may be required.`;
    case "diagnostics":
      return `Book diagnostic testing at ${facilityName}.`;
    case "pharmacy":
      return `Pick up or arrange hospital pharmacy support after your visit at ${facilityName}.`;
    case "rehab":
      return `Book physiotherapy or rehabilitation at ${facilityName}.`;
  }
}

function NotFound({ backTo = "/appointments" }: { backTo?: string }) {
  const { tx } = useI18n();
  return (
    <div className="py-16 text-center">
      <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Not found")}</p>
      <Link to={backTo} className="mt-4 inline-block text-sm text-[color:var(--pp-violet)]">
        ‹ {tx("Back")}
      </Link>
    </div>
  );
}

export function FacilityServicesPage() {
  const { tx } = useI18n();
  const { id = "" } = useParams();
  const [q, setQ] = useState("");
  const provider = getProvider(id);
  if (!provider || provider.kind === "doctor") {
    return <NotFound backTo="/appointments" />;
  }

  const hospitalHref = `/appointments/provider/${provider.id}`;

  return (
    <ServicePageShell backTo={hospitalHref} backLabel={tx("Back")}>
      <p className="pp-caps text-[color:var(--pp-violet)]">{provider.name}</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Select a service")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-tertiary">
        {tx("Choose what you need. Next you’ll open a detail page to review the service and book a time.")}
      </p>

      <PageSearchField
        scope="facility-services"
        value={q}
        onChange={setQ}
        pill
        className="mt-6"
      />

      <div className="mt-8">
        <FacilityBookingServiceSections provider={provider} query={q} onClearQuery={() => setQ("")} />
      </div>
    </ServicePageShell>
  );
}

export function FacilityServiceDetail() {
  const { id = "", serviceId = "" } = useParams();
  const provider = getProvider(id);
  const service = provider && provider.kind !== "doctor" ? getFacilityService(provider, serviceId) : undefined;
  if (!provider || provider.kind === "doctor") {
    return <NotFound backTo="/appointments" />;
  }
  if (!service) {
    return <NotFound backTo={facilityServicesHref(provider.id)} />;
  }
  return <FacilityServiceDetailReady provider={provider} service={service} />;
}

function FacilityServiceDetailReady({
  provider,
  service,
}: {
  provider: CareProvider;
  service: FacilityService;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const avail = useAvailabilityPicker(`${provider.id}:${service.id}`, "clinic");
  const isConsult = service.kind === "consult";
  const staff = getFacilityStaff(provider.id);
  const specialisedIn = specialisedFor(provider);
  const isClinic = provider.kind === "clinic";
  const hospital = hospitalFromProvider(provider, staff, specialisedIn);
  const clinic = clinicFromProvider(provider, staff, specialisedIn);
  const slotLabel = avail.time
    ? `${availabilityDayLabel(avail.days.find((d) => d.date === avail.date) ?? { label: avail.date }, tx)} · ${avail.time} · ${tx("In person")}`
    : tx("Select a date and time below");

  const startBook = () => {
    if (!avail.date || !avail.time) return;
    if (isPastDate(avail.date) || isSlotInPast(avail.date, avail.time)) return;
    nav(
      bookHref({
        providerId: provider.id,
        serviceId: service.id,
        date: avail.date,
        time: avail.time,
      }),
    );
  };

  const next =
    provider.nextAvailable === "Today" ||
    provider.nextAvailable === "Tomorrow" ||
    provider.nextAvailable === "In 2 days"
      ? tx(provider.nextAvailable)
      : provider.nextAvailable;

  return (
    <DirectoryDetailLayout
      backTo={facilityServicesHref(provider.id)}
      backLabel={tx("Back")}
      eyebrow={provider.name}
      name={tx(service.label)}
      subtitle={tx(serviceKindLabel(service.kind))}
      bio={tx(service.blurb)}
      about={tx(serviceAbout(service, provider.name))}
      imageUrl={provider.imageUrl}
      usps={[
        { label: tx(kindLabel(provider.kind)) },
        { label: tx("Digital Prescription") },
        { label: tx("Free Followup") },
      ]}
      badges={[
        provider.city ? { label: provider.city } : null,
        provider.distanceKm > 0 ? { label: `${formatDistance(provider.distanceKm)} ${tx("away")}` } : null,
        next ? { label: `${tx("Next")}: ${next}` } : null,
      ].filter(Boolean) as { label: string }[]}
      sidebar={
        <>
          <div className={DIRECTORY_SIDEBAR_CARD}>
            <p className="text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">
              {isConsult ? tx("Choose a consultant") : tx("Book visit")}
            </p>
            <p className="mt-2 text-sm leading-snug text-ink-tertiary">
              {isConsult
                ? tx("Pick a consultant at {name} to continue in this booking.").replace("{name}", provider.name)
                : slotLabel}
            </p>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
              <span>
                <span className="block text-2xs text-ink-tertiary">
                  {service.feeFrom === 0 ? tx("Coverage") : tx("From")}
                </span>
                <span className="font-display text-2xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                  {formatFee(service.feeFrom)}
                </span>
              </span>
              <span className="inline-flex h-7 items-center rounded-full bg-[color:var(--pp-primary-100)] px-3 text-xs font-semibold leading-none text-[color:var(--pp-primary-950)]">
                {tx(serviceKindLabel(service.kind))}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {isConsult ? (
                <Button
                  fullWidth
                  size="sm"
                  onClick={() =>
                    document.getElementById(isClinic ? "clinic-doctors" : "hospital-doctors")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                >
                  {tx("See consultants")}
                </Button>
              ) : (
                <Button fullWidth size="sm" onClick={startBook} disabled={!avail.date || !avail.time}>
                  {tx("Book appointment")}
                </Button>
              )}
            </div>
          </div>
          <p className="px-1 text-center text-2xs leading-relaxed text-ink-tertiary">
            {tx("Demo booking — no real visit is scheduled with a clinic.")}
          </p>
          <DirectorySidebarMap
            query={isClinic ? clinicMapsQuery(clinic) : hospitalMapsQuery(hospital)}
          />
        </>
      }
    >
      {isConsult ? (
        isClinic ? (
          staff.length ? (
            <ClinicDoctorsSection clinic={clinic} />
          ) : (
            <DetailSection title={tx("Doctors & specialists")}>
              <p className="rounded-xl border border-dashed border-line bg-[color:var(--pp-primary-100)] px-5 py-8 text-center text-sm text-ink-tertiary">
                {tx("No consultants listed yet.")}
              </p>
            </DetailSection>
          )
        ) : (
          <ConsultantServiceSection provider={provider} />
        )
      ) : (
        <AvailabilityBoard
          location={
            provider.city ? <AvailabilityLocationPill>{provider.city}</AvailabilityLocationPill> : null
          }
          date={avail.date}
          days={avail.days}
          weekOffset={avail.weekOffset}
          time={avail.time}
          slots={avail.slots}
          onSelectDay={avail.selectDay}
          onSelectTime={avail.selectTime}
          onShiftWeek={avail.shiftWeek}
        />
      )}
    </DirectoryDetailLayout>
  );
}
