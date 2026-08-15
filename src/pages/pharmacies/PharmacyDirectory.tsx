import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageSearchField } from "@/components/PageSearchField";
import { DirectoryFilterSelect } from "@/components/DirectoryFilterSelect";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import { listDdaPharmacies, listDdaDistricts, normalizeRegNo, type DdaPharmacy } from "@/lib/ddaApi";
import {
  displayPharmacyName,
  ensureDemoPublishedPharmacies,
  getPharmacyClaim,
  listPublishedPharmacyClaims,
  maskPharmacyName,
  displayPranali,
  pharmacyHours,
  placeLine,
  shortRegNo,
  subscribePharmacyDirectory,
  type PharmacyClaim,
} from "@/lib/pharmacyDirectory";
import {
  districtSelectOptions,
  nearbyDistricts,
  normalizeCityName,
  readSavedPharmacyDistrict,
  savePharmacyDistrict,
} from "@/lib/nepalCities";

const PAGE_SIZE = 20;
const PHOTO = "/img/treatments/uti.png";
const CARD =
  "group relative block w-full overflow-hidden rounded-[1.5rem] border border-[#E6E1EF] bg-white text-left " +
  "h-[12.75rem] transition-[transform,box-shadow,border-color] duration-200 " +
  "hover:-translate-y-0.5 hover:border-[#D9D2E8] hover:shadow-[0_14px_32px_rgba(40,24,72,0.08)]";

function readDirQuery() {
  const p = new URLSearchParams(window.location.search);
  const fromUrl = normalizeCityName(p.get("district") || p.get("city") || "");
  return {
    q: p.get("q") || "",
    page: Math.max(1, Number(p.get("page") || 1) || 1),
    district: fromUrl || readSavedPharmacyDistrict(),
    registered: p.get("registered") === "1",
  };
}

function claimAsPharmacy(claim: PharmacyClaim): DdaPharmacy {
  return {
    registrationNo: claim.registrationNo,
    name: claim.name,
    place: claim.place,
    district: claim.district,
    pranali: claim.pranali,
  };
}

function claimMatchesDistrict(claim: PharmacyClaim, district: string) {
  const needle = district.toLowerCase();
  return `${claim.district} ${claim.place}`.toLowerCase().includes(needle);
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

function registeredForDistrict(district: string): PharmacyClaim[] {
  const all = listPublishedPharmacyClaims();
  const local = all.filter((c) => claimMatchesDistrict(c, district));
  if (local.length) return local;
  return shuffleStable(all, district);
}

export function PharmacyDirectory() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { signedIn } = useUser();
  const initial = useMemo(() => readDirQuery(), []);
  const [q, setQ] = useState(initial.q);
  const [appliedQ, setAppliedQ] = useState(initial.q.trim());
  const appliedQRef = useRef(appliedQ);
  appliedQRef.current = appliedQ;
  const [page, setPage] = useState(initial.page);
  const [district, setDistrict] = useState(initial.district);
  const [registeredOnly, setRegisteredOnly] = useState(initial.registered);
  const [rev, setRev] = useState(0);
  const [rows, setRows] = useState<DdaPharmacy[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [pagerOpen, setPagerOpen] = useState(false);
  const [pagerQ, setPagerQ] = useState("");
  const pagerRef = useRef<HTMLInputElement>(null);
  const [apiDistricts, setApiDistricts] = useState<string[]>([]);

  useEffect(() => {
    const unsub = subscribePharmacyDirectory(() => setRev((n) => n + 1));
    ensureDemoPublishedPharmacies();
    void listDdaDistricts().then((list) => {
      if (list.length) setApiDistricts(list.map((d) => d.district));
    });
    return unsub;
  }, []);

  useEffect(() => {
    savePharmacyDistrict(district);
  }, [district]);

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
    if (district) p.set("district", district);
    if (registeredOnly) p.set("registered", "1");
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    const url = qs ? `/pharmacies?${qs}` : "/pharmacies";
    const now = `${window.location.pathname}${window.location.search}`;
    if (now !== url) window.history.replaceState(window.history.state, "", url);
  }, [page, district, registeredOnly]);

  useEffect(() => {
    if (registeredOnly) {
      setBusy(false);
      setError("");
      return;
    }
    let live = true;
    if (rows.length === 0) setBusy(true);
    setError("");
    void listDdaPharmacies({
      q: appliedQ || undefined,
      district: district || undefined,
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
  }, [page, appliedQ, rev, district, registeredOnly]);

  useEffect(() => {
    if (pagerOpen) pagerRef.current?.focus();
  }, [pagerOpen]);

  const goPage = (next: number) => {
    const max = registeredOnly
      ? Math.max(1, Math.ceil(registeredForDistrict(district).length / PAGE_SIZE))
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

  const selectDistrict = (next: string) => {
    const saved = savePharmacyDistrict(next);
    setDistrict(saved);
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
    const pool = registeredForDistrict(district);
    const needle = appliedQ.toLowerCase();
    if (!needle) return pool;
    return pool.filter((c) =>
      `${c.name} ${c.place} ${c.district} ${c.pranali} ${c.registrationNo}`.toLowerCase().includes(needle),
    );
  }, [district, appliedQ, rev]);

  const registeredPages = Math.max(1, Math.ceil(registeredPool.length / PAGE_SIZE));
  const pagedRegistered = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return registeredPool.slice(start, start + PAGE_SIZE);
  }, [registeredPool, page]);

  type GridItem =
    | { key: string; pharmacy: DdaPharmacy; activated: boolean }
    | { key: string; viewMore: true };

  const gridItems = useMemo((): GridItem[] => {
    if (registeredOnly) {
      return pagedRegistered.map((c) => ({
        key: c.registrationNo,
        pharmacy: claimAsPharmacy(c),
        activated: true,
      }));
    }
    const out: GridItem[] = [];
    const shown = new Set<string>();
    const pinRegistered = page === 1 && !appliedQ;
    if (pinRegistered && registeredPool.length > 0) {
      const moreThanFour = registeredPool.length > 4;
      const featured = registeredPool.slice(0, moreThanFour ? 3 : registeredPool.length);
      for (const c of featured) {
        shown.add(normalizeRegNo(c.registrationNo) || c.registrationNo);
        out.push({ key: c.registrationNo, pharmacy: claimAsPharmacy(c), activated: true });
      }
      if (moreThanFour) out.push({ key: "view-more-registered", viewMore: true });
    }
    for (const row of rows) {
      const n = normalizeRegNo(row.registrationNo) || String(row.registrationNo);
      if (shown.has(n)) continue;
      out.push({
        key: n,
        pharmacy: row,
        activated: Boolean(getPharmacyClaim(n)?.published),
      });
    }
    return out;
  }, [registeredOnly, pagedRegistered, page, appliedQ, registeredPool, rows, rev]);

  const resultCount = registeredOnly ? registeredPool.length : total;
  const cityEmpty = !busy && !error && !appliedQ && !registeredOnly && total === 0 && registeredPool.length === 0;
  const searchEmpty = !busy && !error && Boolean(appliedQ) && gridItems.length === 0;
  const districtOptions = useMemo(
    () => districtSelectOptions(district, apiDistricts),
    [district, apiDistricts],
  );
  const pagerTotalPages = registeredOnly ? registeredPages : totalPages;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-xl">
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Directory")}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
            {tx("Find a pharmacy")}
          </h1>
          <p className="mt-2 text-base text-ink-secondary">
            {tx(
              "Every DDA-registered pharmacy. Available profiles show hours and delivery. Unclaimed cards fade until the pharmacy verifies and claims.",
            )}
          </p>
        </div>
        <form className="w-full max-w-lg lg:pb-0.5" onSubmit={(e) => e.preventDefault()}>
          <p className="mb-1.5 text-right text-sm font-medium text-ink-secondary">{tx("Search pharmacies")}</p>
          <PageSearchField
            scope="pharmacies"
            value={q}
            onChange={setQ}
            pill
            placeholder="Name or place"
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

      {(gridItems.length > 0 || cityEmpty || searchEmpty || (!busy && !error)) && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-tertiary tnum">
            {busy && gridItems.length === 0
              ? tx("Loading…")
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
                {tx("Show all pharmacies")}
              </button>
            )}
            <DirectoryFilterSelect
              label={tx("District")}
              value={district}
              options={districtOptions}
              onChange={selectDistrict}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-2xl border border-line bg-white px-5 py-4 text-sm text-danger">{error}</p>
      )}

      {busy && gridItems.length === 0 && (
        <p className="mt-8 text-sm text-ink-tertiary">{tx("Loading registry…")}</p>
      )}

      {searchEmpty && (
        <div className="mt-8 rounded-2xl border border-line bg-white px-6 py-12 text-center">
          <p className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">{tx("No matches")}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
            {tx("Try a different name or place in {city}.").replace("{city}", district)}
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

      {cityEmpty && <DistrictEmptyState district={district} onSelectDistrict={selectDistrict} />}

      {gridItems.length > 0 && (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gridItems.map((item) =>
            "viewMore" in item ? (
              <li key={item.key}>
                <ViewMoreRegisteredCard
                  remaining={Math.max(0, registeredPool.length - 3)}
                  onClick={showRegisteredOnly}
                />
              </li>
            ) : (
              <li key={item.key}>
                <DirectoryCard
                  pharmacy={item.pharmacy}
                  activated={item.activated}
                  claimLocked={signedIn && !item.activated}
                  onOpen={() => {
                    if (signedIn && !item.activated) return;
                    nav(
                      item.activated
                        ? `/pharmacies/${item.pharmacy.registrationNo}`
                        : `/pharmacies/claim?reg=${encodeURIComponent(item.pharmacy.registrationNo)}`,
                    );
                  }}
                />
              </li>
            ),
          )}
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
        {tx("Are you a registered pharmacy?")}{" "}
        <Link to="/pharmacies/claim" className="font-medium text-[color:var(--pp-violet)] hover:underline">
          {tx("Claim your pharmacy")}
        </Link>
      </p>
    </div>
  );
}

function DistrictEmptyState({
  district,
  onSelectDistrict,
}: {
  district: string;
  onSelectDistrict: (district: string) => void;
}) {
  const { tx } = useI18n();
  const nearby = nearbyDistricts(district, 5);
  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center">
        <p className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("There are no pharmacies available in this district. You can check another district nearby.")}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Nearby districts")}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {nearby.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => onSelectDistrict(name)}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-[color:var(--pp-primary-950)] hover:border-[#D9D2E8] hover:bg-[color:var(--state-hover)]"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
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
  pharmacy,
  activated,
  claimLocked = false,
  onOpen,
}: {
  pharmacy: DdaPharmacy;
  activated: boolean;
  claimLocked?: boolean;
  onOpen: () => void;
}) {
  const { tx } = useI18n();
  const n = normalizeRegNo(pharmacy.registrationNo) || String(pharmacy.registrationNo);
  const claim = activated ? getPharmacyClaim(n) : null;
  const live = Boolean(activated && claim?.published);
  const faded = !live;
  const name = live ? displayPharmacyName(claim?.name || pharmacy.name) : maskPharmacyName(pharmacy.name);
  const place = placeLine(live && claim ? claim : pharmacy);
  const kind = displayPranali(claim?.pranali || pharmacy.pranali);
  const photo = live ? PHOTO : undefined;

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
          <img
            src={photo}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover object-[50%_40%]"
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
          <p className={"pp-caps " + (live ? "text-wellness" : "text-ink-tertiary")}>
            {live ? tx("Available") : tx("Not available")}
          </p>
          <h2 className="mt-2 block w-full truncate font-display text-lg font-medium leading-snug tracking-tight text-[color:var(--pp-primary-950)]">
            {name}
          </h2>
          <p className="mt-0.5 block w-full truncate text-sm leading-snug text-ink-tertiary">
            {kind ? `${kind} • ${place}` : place}
          </p>
          {live && (
            <p className="mt-1.5 text-sm font-medium leading-snug text-[color:var(--pp-primary-950)]">
              {pharmacyHours()}
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
        #{shortRegNo(n)}
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
            placeholder={tx("Page number, name or district")}
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
