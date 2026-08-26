import { useMemo, useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { SkeletonImage } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import { listImmediateConsultants, subscribeImmediateConsult } from "@/lib/immediateConsult";
import { basketIsConfirmed, consultLines, listMedBasket } from "@/lib/medBasketDraft";

const INDEX = "/drug/draft";

const CARD =
  "group relative block w-full overflow-hidden rounded-[1.5rem] border border-[#E6E1EF] bg-white text-left " +
  "h-[12.75rem] transition-[transform,box-shadow,border-color] duration-200 " +
  "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]";

const PHOTO_MASK = {
  WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 18%)",
  maskImage: "linear-gradient(to right, transparent 0%, #000 18%)",
} as const;

export function MedicationConsultDraft() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const lines = consultLines();
  const all = listMedBasket();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeImmediateConsult(() => setTick((n) => n + 1)), []);
  const consultants = useMemo(() => listImmediateConsultants(), [tick]);

  if (!all.length) return <Navigate to={INDEX} replace />;
  if (!basketIsConfirmed()) return <Navigate to={INDEX} replace />;
  if (!lines.length) return <Navigate to={`${INDEX}/order`} replace />;

  return (
    <div>
      <Link
        to={INDEX}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {tx("Your medicines")}
      </Link>

      <header className="mt-5 mb-6">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Prescription consult")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          {tx("Choose a doctor")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("You confirmed this list. One consult covers every medicine that still needs a prescription. Lowest fee first.")}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {lines.map((line) => (
            <li
              key={`${line.slug}-${line.dose}`}
              className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)]"
            >
              {line.name} · {line.dose}
            </li>
          ))}
        </ul>
      </header>

      <section>
        <h2 className="mb-3 font-display text-base font-medium text-[color:var(--pp-violet)]">
          {tx("Available doctors")}
        </h2>
        {consultants.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white px-5 py-10 text-center text-sm text-ink-tertiary">
            {tx("No doctors are available for an immediate consult right now.")}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {consultants.map((c) => (
              <li key={c.id}>
                <DoctorConsultCard
                  name={c.name}
                  meta={`${c.subtitle} • ${c.city}`}
                  photo={c.imageUrl}
                  status={c.available ? tx("Available") : tx(c.waitLabel)}
                  fee={c.fee}
                  onSelect={() => nav(`${INDEX}/consult/${c.id}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DoctorConsultCard({
  name,
  meta,
  photo,
  status,
  fee,
  onSelect,
}: {
  name: string;
  meta: string;
  photo: string;
  status: string;
  fee: number;
  onSelect: () => void;
}) {
  const { tx } = useI18n();
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    setPhotoFailed(false);
  }, [photo]);
  const showPhoto = Boolean(photo) && !photoFailed;

  return (
    <button type="button" onClick={onSelect} className={CARD}>
      {showPhoto ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[40%]" aria-hidden>
          <SkeletonImage
            src={photo}
            alt=""
            loading="lazy"
            className="h-full w-full"
            imgClassName="object-cover object-[22%_12%]"
            style={PHOTO_MASK}
            onError={() => setPhotoFailed(true)}
          />
          <span className="absolute inset-y-0 left-0 w-[22%] bg-gradient-to-r from-white to-transparent" />
        </div>
      ) : null}

      <div
        className={
          "relative z-10 flex h-full min-w-0 flex-col justify-between px-5 py-5 " +
          (showPhoto ? "w-[66%] pr-2" : "w-full")
        }
      >
        <div className="flex min-w-0 flex-col">
          <p className="pp-caps text-wellness">{status}</p>
          <h3 className="mt-2 block w-full min-w-0 overflow-hidden truncate font-display text-lg font-medium leading-snug tracking-tight text-[color:var(--pp-primary-950)]">
            {name}
          </h3>
          <p className="mt-0.5 block w-full truncate text-sm leading-snug text-ink-tertiary">{meta}</p>
          <p className="mt-1.5 font-display text-xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
            {formatFee(fee)}
          </p>
        </div>
        <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("Request")} →</p>
      </div>
    </button>
  );
}
