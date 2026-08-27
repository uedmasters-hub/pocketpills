import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { treatments } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { ServicePageShell } from "@/pages/appointments/ServicePageShell";
import { DetailSection } from "@/components/DetailSection";
import { SkeletonImage } from "@/components/ui";
import {
  formatFee,
  specialtyById,
  type CareProvider,
} from "@/lib/appointments";
import { ensureDemoPublishedDoctors } from "@/lib/doctorDirectory";
import {
  specialistsForTreatment,
  treatmentGuide,
  treatmentSpecialty,
} from "@/lib/treatmentGuides";

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

export function TreatmentHubDetail() {
  const { tx } = useI18n();
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const treatment = treatments.find((x) => x.slug === slug);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    ensureDemoPublishedDoctors();
    setSeeded(true);
  }, []);

  const guide = useMemo(
    () => (treatment ? treatmentGuide(treatment.slug, treatment.name, treatment.category) : null),
    [treatment],
  );
  const specialty = treatment
    ? specialtyById(treatmentSpecialty(treatment.slug, treatment.category))
    : undefined;
  const specialists = useMemo(
    () => (treatment ? specialistsForTreatment(treatment) : []),
    [treatment, seeded],
  );
  const similar = treatment
    ? treatments
        .filter((x) => x.category === treatment.category && x.slug !== treatment.slug)
        .slice(0, 3)
    : [];

  if (!treatment || !guide) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Treatment not found")}</p>
        <Link
          to="/dashboard"
          className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
        >
          ‹ {tx("Back")}
        </Link>
      </div>
    );
  }

  const startWith = (id: string) => {
    nav(`/appointments/treatments/${treatment.slug}/book?provider=${encodeURIComponent(id)}`);
  };

  return (
    <ServicePageShell
      backTo="/dashboard"
      backLabel={tx("Treatments")}
      aside={
        <div
          id="start-treatment"
          className="overflow-hidden rounded-[1.75rem] border border-[#E6E1EF] bg-white shadow-[0_12px_40px_rgba(24,7,48,0.05)]"
        >
          <div className="px-5 py-4">
            <p className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {tx("Let's start treatment")}
            </p>
            <p className="mt-1 text-sm text-ink-tertiary">
              {tx("Pick a specialist. You'll pay and confirm on the next step.")}
            </p>
          </div>
          {specialists.length === 0 ? (
            <p className="border-t border-line px-5 py-8 text-center text-sm text-ink-tertiary">
              {tx("No specialists are listed right now. Browse doctors from appointments.")}
            </p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {specialists.map((doc) => (
                <li key={doc.id}>
                  <SpecialistRow
                    doctor={doc}
                    specialtyLabel={specialty ? tx(specialty.label) : tx("Specialist")}
                    onSelect={() => startWith(doc.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      }
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)]">
        <div className="flex flex-col sm:min-h-[11rem] sm:flex-row sm:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-6 sm:px-8">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx(treatment.category)}</p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
              {tx(treatment.name)}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {specialty ? (
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                  {tx(specialty.label)}
                </span>
              ) : null}
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                {tx("2 steps")}
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]">
                {tx("Pay to confirm")}
              </span>
            </div>
          </div>
          <div className="relative mx-auto h-36 w-full max-w-[11rem] shrink-0 sm:mx-0 sm:h-auto sm:w-[34%]">
            {treatment.img ? (
              <img
                src={treatment.img}
                alt=""
                onError={hideOnError}
                className="absolute inset-0 h-full w-full object-contain object-bottom"
              />
            ) : (
              <span className="grid h-full place-items-center text-6xl" aria-hidden>
                {treatment.emoji}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-secondary">{tx(guide.intro)}</p>
      <a
        href="#start-treatment"
        className="mt-4 inline-flex text-sm font-semibold text-[color:var(--pp-violet)] hover:underline lg:hidden"
      >
        {tx("Let's start treatment")} →
      </a>

      <div className="mt-8 space-y-6">
        <DetailSection title={tx("Symptoms")} lede={tx("Common signs. You do not need all of them.")}>
          <ul className="flex flex-wrap gap-2">
            {guide.symptoms.map((item) => (
              <li
                key={item}
                className="rounded-full border border-line bg-[color:var(--pp-primary-100)] px-3 py-1.5 text-sm text-[color:var(--pp-primary-950)]"
              >
                {tx(item)}
              </li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection title={tx("Treatment cycle")} flush>
          <ol>
            {guide.cycle.map((step, i) => (
              <li
                key={step.title}
                className={"flex gap-4 px-5 py-4 " + (i > 0 ? "border-t border-line" : "")}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-2xs font-bold text-[color:var(--pp-primary-950)] tnum">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[color:var(--pp-primary-950)]">
                    {tx(step.title)}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-secondary">{tx(step.detail)}</span>
                </span>
              </li>
            ))}
          </ol>
        </DetailSection>

        <div className="grid gap-6 sm:grid-cols-2">
          <DetailSection title={tx("How long it takes")}>
            <p className="text-sm leading-relaxed text-ink-secondary">{tx(guide.duration)}</p>
          </DetailSection>
          <DetailSection title={tx("If first care does not work")}>
            <p className="text-sm leading-relaxed text-ink-secondary">{tx(guide.ifFails)}</p>
          </DetailSection>
        </div>

        <DetailSection title={tx("What helps prevent it")}>
          <ul className="space-y-2.5">
            {guide.prevention.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-[color:var(--pp-primary-950)]">
                <span className="mt-0.5 text-wellness" aria-hidden>
                  ✓
                </span>
                {tx(item)}
              </li>
            ))}
          </ul>
        </DetailSection>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-ink-tertiary">
        {tx("This is a simple overview, not a diagnosis. Your specialist confirms what applies to you.")}
      </p>

      {similar.length > 0 ? (
        <p className="mt-8 text-sm text-ink-tertiary">
          {tx("Related")}
          {": "}
          {similar.map((s, i) => (
            <span key={s.slug}>
              {i > 0 ? " · " : null}
              <Link
                to={`/appointments/treatments/${s.slug}`}
                className="font-medium text-[color:var(--pp-violet)] hover:underline"
              >
                {tx(s.name)}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </ServicePageShell>
  );
}

function SpecialistRow({
  doctor,
  specialtyLabel,
  onSelect,
}: {
  doctor: CareProvider;
  specialtyLabel: string;
  onSelect: () => void;
}) {
  const { tx } = useI18n();
  const available = doctor.nextAvailable === "Today" || doctor.nextAvailable === "Tomorrow";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
    >
      <SkeletonImage
        src={doctor.imageUrl}
        alt=""
        className="h-12 w-12 shrink-0 rounded-xl"
        imgClassName="object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">{doctor.name}</p>
        <p className="mt-0.5 truncate text-xs text-ink-tertiary">
          {specialtyLabel}
          {" · "}
          <span className={available ? "text-wellness" : undefined}>
            {available ? tx("Available") : tx(doctor.nextAvailable)}
          </span>
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-[color:var(--pp-primary-950)] tnum">
        {formatFee(doctor.consultationFee)}
      </span>
    </button>
  );
}
