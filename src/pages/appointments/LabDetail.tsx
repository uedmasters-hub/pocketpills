import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapEmbed } from "@/components/MapEmbed";
import { Button } from "@/components/ui/Button";
import {
  AvailabilityBoard,
  AvailabilityLocationPill,
  availabilityDayLabel,
} from "@/components/appointments/AvailabilityBoard";
import { useAvailabilityPicker } from "@/components/appointments/useAvailabilityPicker";
import { useI18n } from "@/lib/i18n";
import { formatDistance, formatFee } from "@/lib/appointments";
import {
  bundlesForLab,
  getLab,
  getLabTest,
  imagingForLab,
  labCollectionModeForBundle,
  labCollectionModeLabel,
  labMapEmbedSrc,
  resolveLabItem,
  saveLabDraft,
  summarizeLabSelection,
  testsForLab,
  type LabBundle,
  type LabCollectionMode,
  type LabTest,
} from "@/lib/labs";
import { DetailSection } from "@/components/DetailSection";
import { ListingLandingExtras } from "@/components/ListingCustomSections";
import { ServicePageShell } from "@/pages/appointments/ServicePageShell";

function priceLabel(fee: number, covered?: boolean) {
  if (covered || fee <= 0) return "Covered / OHIP";
  return formatFee(fee);
}

function railMoney(fee: number) {
  if (fee <= 0) return { label: "FREE", free: true as const };
  return { label: `$${fee.toFixed(2)}`, free: false as const };
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

const selectCardClass = (selected: boolean) =>
  "rounded-2xl border transition-colors " +
  (selected
    ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)]"
    : "border-line bg-white hover:bg-[color:var(--state-hover)]");

export function LabDetail() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { id = "" } = useParams();
  const lab = getLab(id);

  const bundles = useMemo(() => (lab ? bundlesForLab(lab) : []), [lab]);
  const tests = useMemo(() => (lab ? testsForLab(lab) : []), [lab]);
  const imaging = useMemo(() => (lab ? imagingForLab(lab) : []), [lab]);
  const avail = useAvailabilityPicker(lab?.id ?? id, "clinic");
  const { date, time } = avail;

  const homeBundles = useMemo(
    () => bundles.filter((b) => labCollectionModeForBundle(b) === "home"),
    [bundles],
  );
  const physicalBundles = useMemo(
    () => bundles.filter((b) => labCollectionModeForBundle(b) === "physical"),
    [bundles],
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [openPackages, setOpenPackages] = useState<Record<string, boolean>>({});

  const summary = useMemo(() => summarizeLabSelection(selected), [selected]);
  const lineItems = useMemo(
    () =>
      selected
        .map((itemId) => resolveLabItem(itemId))
        .filter((x): x is NonNullable<typeof x> => !!x)
        .map((r) => ({
          id: r.item.id,
          name: r.name,
          fee: r.fee,
          collection: r.collection,
        })),
    [selected],
  );

  const railGroups = useMemo(() => {
    const home = lineItems.filter((i) => i.collection === "home");
    const physical = lineItems.filter((i) => i.collection === "physical");
    return [
      { mode: "home" as const, items: home },
      { mode: "physical" as const, items: physical },
    ].filter((g) => g.items.length > 0);
  }, [lineItems]);

  if (!lab) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Lab not found")}</p>
        <Link to="/appointments" className="mt-4 inline-block text-sm text-[color:var(--pp-violet)]">
          ‹ {tx("Back")}
        </Link>
      </div>
    );
  }

  const canContinue = selected.length > 0 && !!date && !!time;
  const totalMoney = railMoney(summary.fee);

  const togglePackageOpen = (bundleId: string) => {
    setOpenPackages((prev) => ({ ...prev, [bundleId]: !prev[bundleId] }));
  };

  return (
    <ServicePageShell
      aside={
        <div className="rounded-[1.75rem] border border-[#E6E1EF] bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-ink-tertiary tnum">
              {time
                ? `${availabilityDayLabel(avail.days.find((d) => d.date === date) ?? { label: date }, tx)} · ${time}`
                : tx("Select a date and time below")}
            </p>
            <p className="shrink-0 text-sm text-ink-tertiary">
              ★ {lab.rating.toFixed(1)} · {tx(lab.nextAvailable)}
            </p>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            {selected.length === 0 ? (
              <p className="text-sm text-ink-secondary">
                {tx("Select packages or tests to build your visit.")}
              </p>
            ) : (
              <>
                <p className="text-sm text-ink-secondary">
                  {tx("{n} services selected").replace("{n}", String(summary.count))}
                </p>
                <div className="mt-3 space-y-4">
                  {railGroups.map((group) => (
                    <div key={group.mode}>
                      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                        {tx(labCollectionModeLabel(group.mode))}
                      </p>
                      <ul className="mt-2 space-y-2">
                        {group.items.map((item) => {
                          const money = railMoney(item.fee);
                          return (
                            <li
                              key={item.id}
                              className="flex items-start justify-between gap-3 text-sm"
                            >
                              <span className="min-w-0 text-[color:var(--pp-primary-950)]">
                                {tx(item.name)}
                              </span>
                              <span
                                className={
                                  "shrink-0 font-medium tnum " +
                                  (money.free
                                    ? "text-[color:var(--pp-green)]"
                                    : "text-[color:var(--pp-primary-950)]")
                                }
                              >
                                {money.free ? tx("FREE") : money.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-end justify-between gap-3">
              <span className="font-semibold text-[color:var(--pp-primary-950)]">
                {tx("Estimated total")}
              </span>
              <span
                className={
                  "font-display text-3xl font-medium leading-none tnum " +
                  (selected.length === 0
                    ? "text-ink-tertiary"
                    : totalMoney.free
                      ? "text-[color:var(--pp-green)]"
                      : "text-[color:var(--pp-primary-950)]")
                }
              >
                {selected.length === 0 ? "—" : totalMoney.free ? tx("FREE") : totalMoney.label}
              </span>
            </div>
            <p className="mt-3 text-2xs leading-relaxed text-ink-tertiary">
              {tx("Estimate. Final price depends on your prescription and plan.")}
            </p>
          </div>

          <div className="mt-5">
            <Button
              fullWidth
              disabled={!canContinue}
              onClick={() => {
                saveLabDraft({
                  labId: lab.id,
                  itemIds: selected,
                  date,
                  time,
                  fee: summary.fee,
                });
                nav(`/appointments/labs/${lab.id}/book`);
              }}
            >
              {tx("Continue")}
            </Button>
            <p className="mt-3 text-center text-2xs leading-relaxed text-ink-tertiary">
              {selected.length === 0
                ? tx("Select services, then continue.")
                : tx("Next: patient details and payment — then you're booked.")}
            </p>
          </div>
        </div>
      }
    >
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Lab")}</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
        {lab.name}
      </h1>
      <p className="mt-2 text-ink-secondary">{tx(lab.subtitle)}</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(14rem,42%)]">
          <div className="flex flex-col justify-center p-5 sm:p-6">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Location")}</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--pp-primary-950)]">
              {lab.address}, {lab.city}
            </p>
            <p className="mt-1 text-sm text-ink-tertiary">
              {formatDistance(lab.distanceKm)} {tx("away")}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-ink-tertiary">{tx("Hours")}</dt>
                <dd className="text-[color:var(--pp-primary-950)]">{lab.hours}</dd>
              </div>
              <div>
                <dt className="text-ink-tertiary">{tx("Phone")}</dt>
                <dd>
                  <a
                    href={`tel:${lab.phone.replace(/\D/g, "")}`}
                    className="text-[color:var(--pp-violet)] hover:underline"
                  >
                    {lab.phone}
                  </a>
                </dd>
              </div>
            </dl>
            <a
              href={`https://www.openstreetmap.org/?mlat=${lab.lat}&mlon=${lab.lng}#map=16/${lab.lat}/${lab.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
            >
              {tx("Open in maps")} →
            </a>
          </div>
          <MapEmbed
            title={tx("Map near {name}").replace("{name}", lab.name)}
            src={labMapEmbedSrc(lab)}
            className="min-h-[11rem] border-t border-line md:min-h-full md:border-l md:border-t-0"
          />
        </div>
      </div>

      <div className="mt-10">
        <AvailabilityBoard
          location={lab.city ? <AvailabilityLocationPill>{lab.city}</AvailabilityLocationPill> : null}
          date={avail.date}
          days={avail.days}
          weekOffset={avail.weekOffset}
          time={avail.time}
          slots={avail.slots}
          onSelectDay={avail.selectDay}
          onSelectTime={avail.selectTime}
          onShiftWeek={avail.shiftWeek}
        />
      </div>

      {(homeBundles.length > 0 || tests.length > 0) ? (
        <CollectionSection
          mode="home"
          blurb={tx("Blood work and screens — collected at home or a draw station.")}
        >
          {homeBundles.length > 0 ? (
            <ServiceGroup
              title={tx("Packages")}
              hint={tx("Expand a package to review included tests. Contents are fixed.")}
            >
              <ul className="space-y-3">
                {homeBundles.map((b) => (
                  <PackageAccordion
                    key={b.id}
                    bundle={b}
                    selected={selected.includes(b.id)}
                    open={!!openPackages[b.id]}
                    onToggleSelect={() => setSelected((s) => toggleId(s, b.id))}
                    onToggleOpen={() => togglePackageOpen(b.id)}
                  />
                ))}
              </ul>
            </ServiceGroup>
          ) : null}
          {tests.length > 0 ? (
            <ServiceGroup title={tx("Individual tests")}>
              <ul className="space-y-3">
                {tests.map((t) => (
                  <SelectableTest
                    key={t.id}
                    test={t}
                    selected={selected.includes(t.id)}
                    onToggle={() => setSelected((s) => toggleId(s, t.id))}
                  />
                ))}
              </ul>
            </ServiceGroup>
          ) : null}
        </CollectionSection>
      ) : null}

      {(physicalBundles.length > 0 || imaging.length > 0) ? (
        <CollectionSection
          mode="physical"
          blurb={tx("CT, MRI, ultrasound, X-ray, DEXA, ECG — done in person at this centre.")}
        >
          {physicalBundles.length > 0 ? (
            <ServiceGroup
              title={tx("Packages")}
              hint={tx("Expand a package to review included tests. Contents are fixed.")}
            >
              <ul className="space-y-3">
                {physicalBundles.map((b) => (
                  <PackageAccordion
                    key={b.id}
                    bundle={b}
                    selected={selected.includes(b.id)}
                    open={!!openPackages[b.id]}
                    onToggleSelect={() => setSelected((s) => toggleId(s, b.id))}
                    onToggleOpen={() => togglePackageOpen(b.id)}
                  />
                ))}
              </ul>
            </ServiceGroup>
          ) : null}
          {imaging.length > 0 ? (
            <ServiceGroup title={tx("Scans & physical tests")}>
              <ul className="space-y-3">
                {imaging.map((t) => (
                  <SelectableTest
                    key={t.id}
                    test={t}
                    selected={selected.includes(t.id)}
                    onToggle={() => setSelected((s) => toggleId(s, t.id))}
                  />
                ))}
              </ul>
            </ServiceGroup>
          ) : null}
        </CollectionSection>
      ) : null}

      <ListingLandingExtras hubId={lab.id} />
    </ServicePageShell>
  );
}

function CollectionSection({
  mode,
  blurb,
  children,
}: {
  mode: LabCollectionMode;
  blurb: string;
  children: ReactNode;
}) {
  const { tx } = useI18n();

  return (
    <div className="mt-10">
    <DetailSection
      title={mode === "home" ? tx("Home collection services") : tx("Physical visit services")}
      lede={blurb}
      meta={<span className="pp-caps text-[color:var(--pp-violet)]">{tx(labCollectionModeLabel(mode))}</span>}
    >
      <div className="space-y-8">{children}</div>
    </DetailSection>
    </div>
  );
}

function ServiceGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{title}</h3>
      {hint ? <p className="mt-0.5 text-2xs text-ink-tertiary">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PackageAccordion({
  bundle,
  selected,
  open,
  onToggleSelect,
  onToggleOpen,
}: {
  bundle: LabBundle;
  selected: boolean;
  open: boolean;
  onToggleSelect: () => void;
  onToggleOpen: () => void;
}) {
  const { tx } = useI18n();
  const included = bundle.testIds
    .map((id) => getLabTest(id))
    .filter((t): t is LabTest => !!t);

  return (
    <li className={selectCardClass(selected)}>
      <div className="px-4 py-3.5">
        <button
          type="button"
          onClick={onToggleSelect}
          aria-pressed={selected}
          className="flex w-full items-start gap-3 text-left"
        >
          <span className="mt-0.5 shrink-0">
            <CheckMark on={selected} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[color:var(--pp-primary-950)]">
                    {tx(bundle.name)}
                  </span>
                  {bundle.badge ? (
                    <span className="rounded-full bg-[color:var(--pp-primary-200)] px-2 py-0.5 text-2xs font-medium text-[color:var(--pp-primary-950)]">
                      {tx(bundle.badge)}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-sm text-ink-tertiary">{tx(bundle.description)}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-[color:var(--pp-primary-950)] tnum">
                {priceLabel(bundle.fee, bundle.covered)}
              </span>
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={open}
          className="mt-2 ml-8 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
        >
          <span aria-hidden className={"transition-transform " + (open ? "rotate-90" : "")}>
            ›
          </span>
          {open
            ? tx("Hide included tests")
            : tx("Show included tests ({n})").replace("{n}", String(included.length))}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line px-4 py-3.5 sm:pl-12">
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
            {tx("Included — view only")}
          </p>
          <p className="mt-1 text-2xs text-ink-tertiary">
            {tx("Package contents can’t be changed. Expand a line to see panel details.")}
          </p>
          <ul className="mt-3 space-y-2">
            {included.map((test) => (
              <IncludedTestRow key={test.id} test={test} />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function IncludedTestRow({ test }: { test: LabTest }) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const hasDetails = (test.details?.length ?? 0) > 0;

  return (
    <li className="rounded-xl border border-line/80 bg-white/70 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(test.name)}</p>
          <p className="mt-0.5 text-2xs text-ink-tertiary">{tx(test.description)}</p>
        </div>
        {hasDetails ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="shrink-0 text-2xs font-medium text-[color:var(--pp-violet)] hover:opacity-70"
          >
            {open ? tx("Hide") : tx("Details")}
          </button>
        ) : null}
      </div>
      {open && hasDetails ? (
        <ul className="mt-2 space-y-1 border-t border-line/60 pt-2">
          {test.details!.map((line) => (
            <li key={line} className="flex gap-2 text-2xs text-ink-secondary">
              <span className="text-ink-tertiary" aria-hidden>
                ·
              </span>
              <span>{tx(line)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function SelectableTest({
  test,
  selected,
  onToggle,
}: {
  test: LabTest;
  selected: boolean;
  onToggle: () => void;
}) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const hasDetails = (test.details?.length ?? 0) > 0;

  return (
    <li className={selectCardClass(selected)}>
      <div className="px-4 py-3.5">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          className="flex w-full items-start gap-3 text-left"
        >
          <span className="mt-0.5 shrink-0">
            <CheckMark on={selected} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block font-semibold text-[color:var(--pp-primary-950)]">
                  {tx(test.name)}
                </span>
                <span className="mt-0.5 block text-sm text-ink-tertiary">{tx(test.description)}</span>
                <span className="mt-1 block text-2xs text-ink-tertiary">
                  {tx(test.category)}
                  {test.fasting ? ` · ${tx("Fasting")}` : ""}
                  {test.turnaround ? ` · ${test.turnaround}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-[color:var(--pp-primary-950)] tnum">
                {priceLabel(test.feeFrom, test.covered)}
              </span>
            </span>
          </span>
        </button>

        {hasDetails ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-2 ml-8 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
          >
            <span aria-hidden className={"transition-transform " + (open ? "rotate-90" : "")}>
              ›
            </span>
            {open ? tx("Hide details") : tx("Show details")}
          </button>
        ) : null}
      </div>

      {open && hasDetails ? (
        <div className="border-t border-line px-4 py-3 sm:pl-12">
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
            {tx("Includes")}
          </p>
          <ul className="mt-2 space-y-1">
            {test.details!.map((line) => (
              <li key={line} className="flex gap-2 text-sm text-ink-secondary">
                <span className="text-ink-tertiary" aria-hidden>
                  ·
                </span>
                <span>{tx(line)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function CheckMark({ on }: { on: boolean }) {
  return (
    <span
      className={
        "flex h-5 w-5 items-center justify-center rounded-md border text-[0.65rem] " +
        (on
          ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-950)] text-white"
          : "border-line bg-white text-transparent")
      }
      aria-hidden
    >
      ✓
    </span>
  );
}
