import { Fragment, useEffect, useMemo, useRef, useState, type Ref } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DirectoryFilterSelect } from "@/components/DirectoryFilterSelect";
import { AlsoFoundHeading } from "@/components/AlsoFoundHeading";
import { HighlightedText } from "@/components/HighlightedText";
import { PageSearchField } from "@/components/PageSearchField";
import { rankFieldsMatch, sortBySearchRank, textMatchesQuery, type SearchMatchTier } from "@/lib/searchMatch";
import { RatingChip } from "@/components/reviews/RatingChip";
import { DirectoryGridSkeleton, RatingChipSkeleton, ResultCountSkeleton, SkeletonImage } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import { formatFee } from "@/lib/appointments";
import { treatments, type Treatment } from "@/lib/data";
import { listNmcDoctors, normalizeNmcNumber, type NmcDoctor } from "@/lib/nmcApi";
import type { ReviewSummary } from "@/lib/reviewsApi";
import { useReviewSummaries } from "@/lib/useReviewSummaries";
import {
  cityFromNmcAddress,
  claimToCareProvider,
  ensureDemoPublishedDoctors,
  getDoctorClaim,
  listPublishedDoctorClaims,
  maskNmcLastName,
  subscribeDoctorDirectory,
  type DoctorClaim,
} from "@/lib/doctorDirectory";
import {
  citySelectOptions,
  nearbyCities,
  normalizeCityName,
  readSavedDoctorCity,
  saveDoctorCity,
} from "@/lib/nepalCities";

const PAGE_SIZE = 20;
const CARD =
  "group relative block w-full overflow-hidden rounded-[1.5rem] border border-[#E6E1EF] bg-white text-left " +
  "h-[12.75rem] transition-[transform,box-shadow,border-color] duration-200 " +
  "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]";

function readDirQuery() {
  const p = new URLSearchParams(window.location.search);
  const fromUrl = normalizeCityName(p.get("city") || "");
  return {
    q: p.get("q") || "",
    page: Math.max(1, Number(p.get("page") || 1) || 1),
    city: fromUrl || readSavedDoctorCity(),
    registered: p.get("registered") === "1",
  };
}

function claimAsDoctor(claim: DoctorClaim): NmcDoctor {
  return {
    nmcNumber: claim.nmcNumber,
    name: claim.name,
    address: claim.address,
    gender: claim.gender,
    degree: claim.degree,
  };
}

function claimMatchesCity(claim: DoctorClaim, city: string) {
  const needle = city.toLowerCase();
  return `${claim.city} ${claim.address}`.toLowerCase().includes(needle);
}

function shuffleStable<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h ^= seed.charCodeAt(i) * (i + 1);
  for (let i = out.length - 1; i > 0; i--) {
    h = (Math.imul(h, 16777619) + i) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function registeredForCity(city: string): DoctorClaim[] {
  const all = listPublishedDoctorClaims();
  const local = all.filter((c) => claimMatchesCity(c, city));
  if (local.length) return local;
  return shuffleStable(all, city);
}

function placeLine(address: string) {
  const parts = String(address || "")
    .split(",")
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p && p.toLowerCase() !== "nepal");
  if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  return parts[0] || cityFromNmcAddress(address);
}

export function DoctorDirectory() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { signedIn } = useUser();
  const initial = useMemo(() => readDirQuery(), []);
  const [q, setQ] = useState(initial.q);
  const [appliedQ, setAppliedQ] = useState(initial.q.trim());
  const appliedQRef = useRef(appliedQ);
  appliedQRef.current = appliedQ;
  const [page, setPage] = useState(initial.page);
  const [city, setCity] = useState(initial.city);
  const [registeredOnly, setRegisteredOnly] = useState(initial.registered);
  const [rev, setRev] = useState(0);
  const [rows, setRows] = useState<NmcDoctor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [pagerOpen, setPagerOpen] = useState(false);
  const [pagerQ, setPagerQ] = useState("");
  const pagerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeDoctorDirectory(() => setRev((n) => n + 1));
    ensureDemoPublishedDoctors();
    return unsub;
  }, []);

  useEffect(() => {
    saveDoctorCity(city);
  }, [city]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = q.trim();
      if (next === appliedQRef.current) return;
      setAppliedQ(next);
      setPage(1);
    }, 500);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (registeredOnly) p.set("registered", "1");
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    const url = qs ? `/doctors?${qs}` : "/doctors";
    const now = `${window.location.pathname}${window.location.search}`;
    if (now !== url) window.history.replaceState(window.history.state, "", url);
  }, [page, city, registeredOnly]);

  useEffect(() => {
    if (registeredOnly) {
      setBusy(false);
      setError("");
      return;
    }
    let live = true;
    if (rows.length === 0) setBusy(true);
    setError("");
    void listNmcDoctors({
      q: appliedQ || undefined,
      address: city || undefined,
      page,
      limit: PAGE_SIZE,
    }).then((res) => {
      if (!live) return;
      setBusy(false);
      if (!res.ok) {
        setRows([]);
        setTotal(0);
        setTotalPages(1);
        setError(res.error);
        return;
      }
      setRows(res.data);
      setTotal(res.total);
      setTotalPages(Math.max(1, res.totalPages));
    });
    return () => {
      live = false;
    };
  }, [page, appliedQ, rev, city, registeredOnly]);

  useEffect(() => {
    if (pagerOpen) pagerRef.current?.focus();
  }, [pagerOpen]);

  const goPage = (next: number) => {
    const max = registeredOnly
      ? Math.max(1, Math.ceil(registeredForCity(city).length / PAGE_SIZE))
      : Math.max(1, totalPages);
    setPage(Math.min(Math.max(1, next), max));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyPagerQuery = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (/^\d+$/.test(t)) {
      goPage(Number(t));
      setPagerOpen(false);
      setPagerQ("");
      return;
    }
    setQ(t);
    setPagerOpen(false);
    setPagerQ("");
  };

  const selectCity = (next: string) => {
    const saved = saveDoctorCity(next);
    setCity(saved);
    setQ("");
    setAppliedQ("");
    setPage(1);
    setPagerOpen(false);
    setPagerQ("");
  };

  const showRegisteredOnly = () => {
    setRegisteredOnly(true);
    setQ("");
    setAppliedQ("");
    setPage(1);
    setPagerOpen(false);
    setPagerQ("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const registeredPool = useMemo(() => {
    const pool = registeredForCity(city);
    if (!appliedQ.trim()) return pool;
    const hits = pool.filter((c) =>
      textMatchesQuery(`${c.name} ${c.degree} ${c.address} ${c.city}`, appliedQ),
    );
    return sortBySearchRank(hits, appliedQ, (c) => [c.name, c.degree, c.address, c.city]);
  }, [city, appliedQ, rev]);

  const registeredPages = Math.max(1, Math.ceil(registeredPool.length / PAGE_SIZE));
  const pagedRegistered = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return registeredPool.slice(start, start + PAGE_SIZE);
  }, [registeredPool, page]);

  type GridItem =
    | { key: string; doctor: NmcDoctor; activated: boolean; tier: SearchMatchTier | null }
    | { key: string; viewMore: true };

  const gridItems = useMemo((): GridItem[] => {
    const searching = Boolean(appliedQ.trim());
    const tierOf = (d: NmcDoctor): SearchMatchTier | null =>
      searching ? rankFieldsMatch([d.name, d.degree, d.address], appliedQ) : null;
    const isLive = (nmcNumber: string) =>
      Boolean(getDoctorClaim(normalizeNmcNumber(nmcNumber) || nmcNumber)?.published);
    if (registeredOnly) {
      return pagedRegistered.map((c) => {
        const doctor = claimAsDoctor(c);
        return { key: c.nmcNumber, doctor, activated: true, tier: tierOf(doctor) };
      });
    }
    const rankedRows = searching
      ? sortBySearchRank(
          rows,
          appliedQ,
          (r) => [r.name, r.degree, r.address],
          (r) => isLive(r.nmcNumber),
        )
      : rows;
    const out: GridItem[] = [];
    const shown = new Set<string>();
    const pinAvailable = searching ? page === 1 : page === 1 && !appliedQ;
    if (pinAvailable && registeredPool.length > 0) {
      if (searching) {
        for (const c of registeredPool) {
          const nmc = normalizeNmcNumber(c.nmcNumber) || c.nmcNumber;
          shown.add(nmc);
          const doctor = claimAsDoctor(c);
          out.push({ key: nmc, doctor, activated: true, tier: tierOf(doctor) });
        }
      } else {
        const moreThanFour = registeredPool.length > 4;
        const featured = registeredPool.slice(0, moreThanFour ? 3 : registeredPool.length);
        for (const c of featured) {
          shown.add(normalizeNmcNumber(c.nmcNumber) || c.nmcNumber);
          const doctor = claimAsDoctor(c);
          out.push({ key: c.nmcNumber, doctor, activated: true, tier: tierOf(doctor) });
        }
        if (moreThanFour) out.push({ key: "view-more-registered", viewMore: true });
      }
    } else if (searching) {
      for (const c of registeredPool) shown.add(normalizeNmcNumber(c.nmcNumber) || c.nmcNumber);
    }
    for (const row of rankedRows) {
      const nmc = normalizeNmcNumber(row.nmcNumber) || String(row.nmcNumber);
      if (shown.has(nmc)) continue;
      out.push({
        key: nmc,
        doctor: row,
        activated: isLive(nmc),
        tier: tierOf(row),
      });
    }
    return out;
  }, [registeredOnly, pagedRegistered, page, appliedQ, registeredPool, rows, rev]);

  const liveReviewIds = useMemo(
    () =>
      gridItems.flatMap((item) =>
        "doctor" in item && item.activated
          ? [normalizeNmcNumber(item.doctor.nmcNumber) || String(item.doctor.nmcNumber)]
          : [],
      ),
    [gridItems],
  );
  const { map: reviewSummaries, ready: reviewsReady } = useReviewSummaries("doctor", liveReviewIds);

  const resultCount = registeredOnly ? registeredPool.length : total;
  const cityEmpty = !busy && !error && !appliedQ && !registeredOnly && total === 0 && registeredPool.length === 0;
  const searchEmpty = !busy && !error && Boolean(appliedQ) && gridItems.length === 0;
  const cityOptions = useMemo(() => citySelectOptions(city), [city]);
  const pagerTotalPages = registeredOnly ? registeredPages : totalPages;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-xl">
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Directory")}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
            {tx("Find a doctor")}
          </h1>
          <p className="mt-2 text-base text-ink-secondary">
            {tx(
              "Every registered physician. Available profiles show a photo, fee, and booking. Unclaimed cards hide the last name until the physician verifies and claims.",
            )}
          </p>
        </div>
        <form
          className="w-full max-w-lg lg:pb-0.5"
          onSubmit={(e) => e.preventDefault()}
        >
          <p className="mb-1.5 text-right text-sm font-medium text-ink-secondary">{tx("Search doctors")}</p>
          <PageSearchField
            scope="doctors"
            value={q}
            onChange={setQ}
            pill
            placeholder="Name or degree"
          />
        </form>
      </header>

      <div className="flex flex-wrap items-center gap-4 text-sm text-ink-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-wellness" aria-hidden />
          {tx("Available")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[color:var(--pp-primary-300)]" aria-hidden />
          {tx("Not available")}
        </span>
      </div>

      {(busy || gridItems.length > 0 || cityEmpty || searchEmpty || !error) && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-tertiary tnum">
            {busy && gridItems.length === 0
              ? <ResultCountSkeleton />
              : searchEmpty || cityEmpty
                ? tx("0 results found")
                : resultCount === 1
                  ? tx("1 result found")
                  : tx("{n} results found").replace("{n}", String(resultCount))}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {registeredOnly && (
              <button
                type="button"
                className="text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
                onClick={() => {
                  setRegisteredOnly(false);
                  setPage(1);
                }}
              >
                {tx("Show all doctors")}
              </button>
            )}
            <DirectoryFilterSelect label={tx("City")} value={city} options={cityOptions} onChange={selectCity} />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-2xl border border-line bg-white px-5 py-4 text-sm text-danger">{error}</p>
      )}

      {busy && gridItems.length === 0 && (
        <DirectoryGridSkeleton label={tx("Loading registry…")} />
      )}

      {searchEmpty && (
        <div className="mt-8 rounded-2xl border border-line bg-white px-6 py-12 text-center">
          <p className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">{tx("No matches")}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
            {tx("Try a different name or degree in {city}.").replace("{city}", city)}
          </p>
          <button
            type="button"
            className="mt-6 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
            onClick={() => setQ("")}
          >
            {tx("Clear search")}
          </button>
        </div>
      )}

      {cityEmpty && (
        <CityEmptyState city={city} onSelectCity={selectCity} onOpenTreatment={(to) => nav(to)} />
      )}

      {gridItems.length > 0 && (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gridItems.map((item, i) => {
            if ("viewMore" in item) {
              return (
                <li key={item.key}>
                  <ViewMoreRegisteredCard
                    remaining={Math.max(0, registeredPool.length - 3)}
                    onClick={showRegisteredOnly}
                  />
                </li>
              );
            }
            const prev = i > 0 ? gridItems[i - 1] : null;
            const showAlso =
              Boolean(appliedQ.trim()) &&
              item.tier === "also" &&
              (!prev ||
                !("tier" in prev) ||
                prev.tier !== "also" ||
                ("activated" in prev && prev.activated !== item.activated));
            return (
              <Fragment key={item.key}>
                {showAlso && <AlsoFoundHeading as="li" />}
                <li>
                  <DirectoryCard
                    doctor={item.doctor}
                    activated={item.activated}
                    highlightQuery={appliedQ}
                    claimLocked={signedIn && !item.activated}
                    summary={
                      reviewSummaries[
                        normalizeNmcNumber(item.doctor.nmcNumber) || String(item.doctor.nmcNumber)
                      ]
                    }
                    ratingPending={!reviewsReady}
                    onOpen={() => {
                      if (signedIn && !item.activated) return;
                      nav(
                        item.activated
                          ? `/doctors/${item.doctor.nmcNumber}`
                          : `/doctors/claim?nmc=${encodeURIComponent(item.doctor.nmcNumber)}`,
                      );
                    }}
                  />
                </li>
              </Fragment>
            );
          })}
        </ul>
      )}

      {pagerTotalPages > 1 && (
        <Pagination
          page={page}
          totalPages={pagerTotalPages}
          onPage={goPage}
          searchOpen={pagerOpen}
          searchValue={pagerQ}
          searchRef={pagerRef}
          onSearchChange={setPagerQ}
          onToggleSearch={() => setPagerOpen(true)}
          onCloseSearch={() => {
            setPagerOpen(false);
            setPagerQ("");
          }}
          onSubmitSearch={() => applyPagerQuery(pagerQ)}
        />
      )}

      <p className="mt-10 text-center text-sm text-ink-tertiary">
        {tx("Are you a registered specialist?")}{" "}
        <Link to="/doctors/claim" className="font-medium text-[color:var(--pp-violet)] hover:underline">
          {tx("Claim your profile")}
        </Link>
      </p>
    </div>
  );
}

function CityEmptyState({
  city,
  onSelectCity,
  onOpenTreatment,
}: {
  city: string;
  onSelectCity: (city: string) => void;
  onOpenTreatment: (to: string) => void;
}) {
  const { tx } = useI18n();
  const nearby = nearbyCities(city, 5);
  const featured = treatments.slice(0, 3);
  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center">
        <p className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("There are no doctors available in your city. You can check doctors in another city or choose the treatment you are looking for.")}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Nearby cities")}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {nearby.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => onSelectCity(name)}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-[color:var(--pp-primary-950)] hover:border-[#D9D2E8] hover:bg-[color:var(--state-hover)]"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Treatments")}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((t) => (
            <li key={t.slug}>
              <EmptyTreatmentCard treatment={t} onOpen={() => onOpenTreatment(`/appointments/treatments/${t.slug}`)} />
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => onOpenTreatment("/appointments")}
              className={
                "flex h-full min-h-[14rem] w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#D4CDE3] bg-[#FBFAFE] px-5 py-6 text-center " +
                "transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]"
              }
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </span>
              <p className="mt-4 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
                {tx("View More")}
              </p>
              <p className="mt-1 text-sm text-ink-tertiary">{tx("See all treatments")}</p>
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}

function EmptyTreatmentCard({
  treatment,
  onOpen,
}: {
  treatment: Treatment;
  onOpen: () => void;
}) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        "group flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] border border-[#E6E1EF] bg-white text-left " +
        "transition-[transform,box-shadow,border-color] duration-200 " +
        "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]"
      }
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-[color:var(--pp-primary-200)]">
        {treatment.img ? (
          <img
            src={treatment.img}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full place-items-center text-4xl" aria-hidden>
            {treatment.emoji}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx(treatment.category)}</p>
        <h3 className="mt-1 font-display text-lg font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx(treatment.name)}
        </h3>
        <p className="mt-3 text-sm font-medium text-[color:var(--pp-primary-950)]">
          {tx("View treatment")} →
        </p>
      </div>
    </button>
  );
}

function ViewMoreRegisteredCard({
  remaining,
  onClick,
}: {
  remaining: number;
  onClick: () => void;
}) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex h-[12.75rem] w-full flex-col items-center justify-center overflow-hidden rounded-[1.5rem] " +
        "border border-dashed border-[#D4CDE3] bg-[#FBFAFE] px-5 text-center " +
        "transition-[transform,box-shadow,border-color] duration-200 " +
        "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]"
      }
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </span>
      <p className="mt-4 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
        {tx("View more")}
      </p>
      <p className="mt-1 text-sm text-ink-tertiary">
        {tx("{n} registered").replace("{n}", String(remaining))}
      </p>
    </button>
  );
}

function DirectoryCard({
  doctor,
  activated,
  claimLocked = false,
  summary,
  ratingPending = false,
  highlightQuery = "",
  onOpen,
}: {
  doctor: NmcDoctor;
  activated: boolean;
  claimLocked?: boolean;
  summary?: ReviewSummary;
  ratingPending?: boolean;
  highlightQuery?: string;
  onOpen: () => void;
}) {
  const { tx } = useI18n();
  const nmc = normalizeNmcNumber(doctor.nmcNumber) || String(doctor.nmcNumber);
  const claim = activated ? getDoctorClaim(nmc) : null;
  const p = claim ? claimToCareProvider(claim) : null;
  const live = Boolean(activated && p);
  const faded = !live;
  const name = live && p ? p.name : maskNmcLastName(doctor.name);
  const degree = (claim?.degree || doctor.degree || "").trim() || "MBBS";
  const place = placeLine((live ? p?.address || claim?.address : doctor.address) || "");
  const fee = p?.consultationFee ?? 79;
  const photo = live ? p?.imageUrl : undefined;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={claimLocked}
      aria-disabled={claimLocked || undefined}
      className={
        CARD +
        (faded ? " opacity-[0.42]" : "") +
        (claimLocked
          ? " cursor-not-allowed hover:translate-y-0 hover:border-[#E6E1EF] hover:shadow-none"
          : "")
      }
    >
      {photo && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[40%]" aria-hidden>
          <SkeletonImage
            src={photo}
            alt=""
            loading="lazy"
            className="h-full w-full"
            imgClassName="object-cover object-[22%_12%]"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 18%)",
              maskImage: "linear-gradient(to right, transparent 0%, #000 18%)",
            }}
          />
          <span className="absolute inset-y-0 left-0 w-[22%] bg-gradient-to-r from-white to-transparent" />
        </div>
      )}

      <div
        className={
          "relative z-10 flex h-full min-w-0 flex-col justify-between px-5 py-5 " +
          (photo ? "w-[66%] pr-2" : "w-full")
        }
      >
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2.5">
            <p className={"pp-caps " + (live ? "text-wellness" : "text-ink-tertiary")}>
              {live ? tx("Available") : tx("Not available")}
            </p>
            {live ? (
              summary ? (
                <RatingChip summary={summary} />
              ) : ratingPending ? (
                <RatingChipSkeleton />
              ) : null
            ) : null}
          </div>
          <h2
            className={
              "mt-2 block w-full min-w-0 overflow-hidden truncate font-display text-lg font-medium leading-snug tracking-tight text-[color:var(--pp-primary-950)]" +
              (live ? "" : " select-none")
            }
          >
            {live ? <HighlightedText text={name} query={highlightQuery} /> : name}
          </h2>
          <p className="mt-0.5 block w-full truncate text-sm leading-snug text-ink-tertiary">
            {degree} • {place}
          </p>
          {live && (
            <p className="mt-1.5 font-display text-xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
              {formatFee(fee)}
            </p>
          )}
        </div>
        <p
          className={
            "text-sm font-medium " + (live ? "text-[color:var(--pp-primary-950)]" : "text-ink-tertiary")
          }
        >
          {live ? tx("View profile") : tx("Claim this profile")} →
        </p>
      </div>

      <span className="absolute right-3 top-3 z-10 grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-2xs font-semibold text-[color:var(--pp-primary-950)] shadow-sm tnum">
        #{nmc}
      </span>
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
  searchOpen,
  searchValue,
  searchRef,
  onSearchChange,
  onToggleSearch,
  onCloseSearch,
  onSubmitSearch,
}: {
  page: number;
  totalPages: number;
  onPage: (n: number) => void;
  searchOpen: boolean;
  searchValue: string;
  searchRef: Ref<HTMLInputElement>;
  onSearchChange: (v: string) => void;
  onToggleSearch: () => void;
  onCloseSearch: () => void;
  onSubmitSearch: () => void;
}) {
  const { tx } = useI18n();
  const pages = useMemo(() => pageWindow(page, totalPages), [page, totalPages]);
  return (
    <div className="relative mx-auto mt-10 h-12 w-full max-w-xl">
      <nav
        aria-hidden={searchOpen}
        aria-label={tx("Pagination")}
        className={
          "absolute inset-0 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
          (searchOpen ? "pointer-events-none scale-95 opacity-0" : "scale-100 opacity-100")
        }
      >
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-full bg-[color:var(--pp-primary-100)] px-5 py-2.5 text-sm font-medium text-ink-secondary disabled:opacity-45"
        >
          {tx("Previous")}
        </button>
        {pages.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-1 text-sm text-[color:var(--pp-primary-950)]">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => onPage(n)}
              className={
                "grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-medium tnum " +
                (n === page
                  ? "bg-[color:var(--pp-primary-950)] text-white"
                  : "text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]")
              }
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label={tx("Search pages")}
          onClick={onToggleSearch}
          className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]"
        >
          <SearchIcon />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[color:var(--pp-primary-950)] shadow-[0_6px_16px_rgba(24,7,48,0.08)] disabled:opacity-45"
        >
          {tx("Next")}
        </button>
      </nav>

      <div
        className={
          "absolute inset-0 origin-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
          (searchOpen
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-x-[0.28] scale-y-90 opacity-0")
        }
      >
        <div className="relative h-12 w-full">
          <span className="pointer-events-none absolute inset-y-0 left-4 grid w-5 place-items-center text-ink-tertiary">
            <SearchIcon />
          </span>
          <input
            ref={searchRef}
            value={searchValue}
            autoComplete="off"
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmitSearch();
              }
              if (e.key === "Escape") onCloseSearch();
            }}
            placeholder={tx("Page number, Name, city or degree")}
            className="h-12 w-full rounded-full border border-line bg-white py-0 pl-11 pr-11 text-base text-[color:var(--pp-primary-950)] shadow-[0_6px_16px_rgba(24,7,48,0.06)] placeholder:text-ink-tertiary"
          />
          <button
            type="button"
            aria-label={tx("Close search")}
            className="absolute inset-y-0 right-3 grid w-8 place-items-center text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
            onClick={onCloseSearch}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16.5 20.5 21" strokeLinecap="round" />
    </svg>
  );
}

function pageWindow(page: number, total: number): Array<number | "…"> {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, "…", total];
  if (page >= total - 2) return [1, "…", total - 2, total - 1, total];
  return [1, "…", page - 1, page, page + 1, "…", total];
}

