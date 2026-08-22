import { useEffect, useState } from "react";
import { DoctorPhoto } from "@/components/DoctorPhoto";
import { DetailSection } from "@/components/DetailSection";
import { FacilityIcon } from "@/components/hospital/HospitalFacilitiesGrid";
import {
  apiCreateForeignDoctor,
  apiListForeignDoctors,
  type ForeignDoctorRecord,
} from "@/lib/foreignDoctorsApi";
import { getPublishedByHubId } from "@/lib/businessProfile";
import { cityFromNmcAddress } from "@/lib/doctorDirectory";
import { publishedOptionsForEmbed } from "@/lib/listingEmbeds";
import {
  listNmcDoctors,
  lookupNmc,
  normalizeNmcNumber,
  searchNmcDoctors,
  type NmcSearchRow,
} from "@/lib/nmcApi";
import { Modal } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import {
  newSectionId,
  type ListingFacilityGroup,
  type ListingStaffRow,
} from "@/lib/listingPage";

const FIELD =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-[color:var(--pp-primary-950)] placeholder:text-ink-tertiary outline-none focus:border-[color:var(--pp-primary-950)]";
const AREA =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-[color:var(--pp-primary-950)] placeholder:text-ink-tertiary outline-none focus:border-[color:var(--pp-primary-950)]";

export function FacilitiesCardEditor({
  title,
  onTitle,
  groups,
  onChange,
}: {
  title: string;
  onTitle: (title: string) => void;
  groups: ListingFacilityGroup[];
  onChange: (groups: ListingFacilityGroup[]) => void;
}) {
  const { tx } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <DetailSection title={title} onTitleChange={onTitle} lede={tx("Hover a card, then click to edit that card only.")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g, i) => {
          const editing = openId === g.id;
          return (
            <div
              key={g.id}
              className={
                "flex min-h-[9.5rem] flex-col rounded-3xl border bg-[color:var(--pp-primary-100)] p-5 text-left transition " +
                (editing
                  ? "border-[color:var(--pp-violet)] ring-2 ring-[color:var(--pp-violet)]"
                  : "border-line hover:ring-1 hover:ring-[color:var(--pp-violet)]/50")
              }
              onClick={() => setOpenId(g.id)}
            >
              {editing ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    className={FIELD + " font-semibold"}
                    value={g.title}
                    onChange={(e) =>
                      onChange(groups.map((row, j) => (j === i ? { ...row, title: e.target.value } : row)))
                    }
                    placeholder={tx("Title")}
                  />
                  <textarea
                    className={AREA}
                    rows={2}
                    value={g.blurb}
                    onChange={(e) =>
                      onChange(groups.map((row, j) => (j === i ? { ...row, blurb: e.target.value } : row)))
                    }
                    placeholder={tx("Short description")}
                  />
                  <textarea
                    className={AREA + " text-xs"}
                    rows={3}
                    value={g.items.join("\n")}
                    onChange={(e) =>
                      onChange(
                        groups.map((row, j) =>
                          j === i ? { ...row, items: e.target.value.split("\n") } : row,
                        ),
                      )
                    }
                    placeholder={tx("One item per line")}
                  />
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="text-xs text-ink-tertiary"
                      onClick={() => {
                        onChange(groups.filter((_, j) => j !== i));
                        setOpenId(null);
                      }}
                    >
                      {tx("Remove card")}
                    </button>
                    <button type="button" className="text-xs font-medium" onClick={() => setOpenId(null)}>
                      {tx("Done")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <FacilityIcon id={g.id} />
                  <p className="mt-4 font-semibold text-[color:var(--pp-primary-950)]">{g.title || tx("Untitled")}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-tertiary">{g.blurb || tx("Click to edit")}</p>
                </>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => {
            const id = newSectionId("facilities");
            onChange([...groups, { id, title: "", blurb: "", items: [] }]);
            setOpenId(id);
          }}
          className="flex min-h-[9.5rem] flex-col items-center justify-center rounded-3xl border border-dashed border-[color:var(--pp-primary-300)] bg-white text-sm font-medium"
        >
          + {tx("Add facility")}
        </button>
      </div>
    </DetailSection>
  );
}

function staffFromNmc(row: { nmcNumber: string; name: string; degree?: string; address?: string }): ListingStaffRow {
  const nmc = normalizeNmcNumber(row.nmcNumber) || row.nmcNumber.replace(/\D/g, "");
  const degree = (row.degree || "").trim();
  return {
    id: newSectionId("doctors"),
    name: row.name,
    specialty: degree,
    registerDegree: degree || undefined,
    nmcNumber: nmc,
    listingId: `nmc-${nmc}`,
    country: row.address ? cityFromNmcAddress(row.address) : undefined,
  };
}

function staffFromForeign(row: ForeignDoctorRecord): ListingStaffRow {
  return {
    id: newSectionId("doctors"),
    name: row.name,
    specialty: row.specialty,
    imageUrl: row.imageUrl || undefined,
    listingId: row.listingId,
    foreign: true,
    council: row.council || undefined,
    registrationNo: row.registrationNo || undefined,
    country: row.country || undefined,
    registerDegree: row.specialty || undefined,
  };
}

export function DoctorsCardEditor({
  title,
  onTitle,
  staff,
  onChange,
  excludePublishedId,
  ownerId,
}: {
  title: string;
  onTitle: (title: string) => void;
  staff: ListingStaffRow[];
  onChange: (staff: ListingStaffRow[]) => void;
  excludePublishedId?: string;
  ownerId?: string;
}) {
  const { tx } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const addRow = (row: ListingStaffRow) => {
    if (row.nmcNumber && staff.some((s) => s.nmcNumber === row.nmcNumber)) return;
    if (row.listingId && staff.some((s) => s.listingId === row.listingId)) return;
    onChange([...staff, row]);
    setPicking(false);
  };

  return (
    <DetailSection
      title={title}
      onTitleChange={onTitle}
      lede={tx("Add from the NMC register. Photo, education, and notes on this page do not change the register.")}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {staff.map((d, i) => {
          const fromRegister = Boolean(d.nmcNumber || d.foreign);
          const live =
            !fromRegister && d.listingId && !d.listingId.startsWith("nmc-") && !d.listingId.startsWith("fd-")
              ? getPublishedByHubId(d.listingId)
              : null;
          const name = fromRegister ? d.name : live?.name || d.name;
          const specialty = d.specialty || live?.subtitle;
          const imageUrl = d.imageUrl || (!fromRegister ? live?.imageUrl : undefined);
          const identityLocked = fromRegister;
          const editing = openId === d.id;
          const badge = d.nmcNumber
            ? `NMC #${d.nmcNumber}`
            : d.foreign
              ? [d.council, d.registrationNo].filter(Boolean).join(" · ") || tx("Foreign")
              : null;
          const patch = (partial: Partial<ListingStaffRow>) =>
            onChange(staff.map((row, j) => (j === i ? { ...row, ...partial } : row)));
          return (
            <div
              key={d.id}
              className={
                "flex flex-col items-center rounded-2xl border bg-white px-3 py-4 text-center transition " +
                (editing
                  ? "border-[color:var(--pp-violet)] ring-2 ring-[color:var(--pp-violet)]"
                  : "border-line hover:ring-1 hover:ring-[color:var(--pp-violet)]/50")
              }
              onClick={() => setOpenId(d.id)}
            >
              <DoctorPhoto src={imageUrl} className="h-16 w-16" />
              {editing ? (
                <div className="mt-3 w-full space-y-2" onClick={(e) => e.stopPropagation()}>
                  {identityLocked ? (
                    <>
                      <p className="text-sm font-semibold">{name || tx("Doctor")}</p>
                      {badge ? (
                        <p className="text-[0.65rem] uppercase tracking-wide text-ink-tertiary">{badge}</p>
                      ) : null}
                      <p className="text-[0.65rem] text-ink-tertiary">
                        {tx("Name and registration stay on the register. Changes below are only for this page.")}
                      </p>
                    </>
                  ) : (
                    <input
                      className={FIELD + " text-center"}
                      value={d.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      placeholder={tx("Name")}
                    />
                  )}
                  <input
                    className={FIELD + " text-center"}
                    value={d.specialty}
                    onChange={(e) => patch({ specialty: e.target.value })}
                    placeholder={tx("Education / qualification")}
                  />
                  {d.registerDegree && d.specialty !== d.registerDegree ? (
                    <p className="text-[0.65rem] text-ink-tertiary">
                      {tx("NMC at registration")}: {d.registerDegree}
                    </p>
                  ) : null}
                  <input
                    className={FIELD + " text-center"}
                    value={d.imageUrl || ""}
                    onChange={(e) => patch({ imageUrl: e.target.value })}
                    placeholder={tx("Photograph link")}
                  />
                  <textarea
                    className={AREA + " text-center"}
                    rows={2}
                    value={d.blurb || ""}
                    onChange={(e) => patch({ blurb: e.target.value })}
                    placeholder={tx("Other details for this page")}
                  />
                  {d.foreign && !d.nmcNumber ? (
                    <input
                      className={FIELD + " text-center"}
                      value={d.country || ""}
                      onChange={(e) => patch({ country: e.target.value })}
                      placeholder={tx("Country")}
                    />
                  ) : null}
                </div>
              ) : (
                <>
                  <p className="mt-3 line-clamp-2 text-sm font-semibold">{name || tx("Doctor")}</p>
                  {specialty ? <p className="mt-1 line-clamp-2 text-xs text-ink-tertiary">{specialty}</p> : null}
                  {badge ? (
                    <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-ink-tertiary">{badge}</p>
                  ) : null}
                </>
              )}
              {editing ? (
                <div className="mt-2 flex w-full justify-between" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="text-xs text-ink-tertiary"
                    onClick={() => {
                      onChange(staff.filter((_, j) => j !== i));
                      setOpenId(null);
                    }}
                  >
                    {tx("Remove")}
                  </button>
                  <button type="button" className="text-xs font-medium" onClick={() => setOpenId(null)}>
                    {tx("Done")}
                  </button>
                </div>
              ) : identityLocked ? (
                <p className="mt-1 text-[0.65rem] text-ink-tertiary">{tx("Name is from the register")}</p>
              ) : null}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex min-h-[9rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--pp-primary-300)] bg-white px-3 text-sm font-medium"
        >
          + {tx("Add doctor")}
        </button>
      </div>
      <DoctorAddPanel
        open={picking}
        alreadyNmc={staff.map((s) => s.nmcNumber).filter((n): n is string => Boolean(n))}
        alreadyListingIds={staff.map((s) => s.listingId).filter((id): id is string => Boolean(id))}
        excludePublishedId={excludePublishedId}
        ownerId={ownerId}
        onAdd={addRow}
        onClose={() => setPicking(false)}
      />
    </DetailSection>
  );
}

const EMPTY_FOREIGN = {
  name: "",
  council: "",
  registrationNo: "",
  specialty: "",
  country: "",
  imageUrl: "",
};

function DoctorAddPanel({
  open,
  alreadyNmc,
  alreadyListingIds,
  excludePublishedId,
  ownerId,
  onAdd,
  onClose,
}: {
  open: boolean;
  alreadyNmc: string[];
  alreadyListingIds: string[];
  excludePublishedId?: string;
  ownerId?: string;
  onAdd: (row: ListingStaffRow) => void;
  onClose: () => void;
}) {
  const { tx } = useI18n();
  const [mode, setMode] = useState<"nmc" | "foreign">("nmc");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<NmcSearchRow[]>([]);
  const [savedForeign, setSavedForeign] = useState<ForeignDoctorRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [foreign, setForeign] = useState(EMPTY_FOREIGN);

  const q = query.trim();
  const nmcFromQuery = normalizeNmcNumber(q);
  const published = publishedOptionsForEmbed("doctor", excludePublishedId).filter(
    (o) =>
      !alreadyListingIds.includes(o.refId) &&
      q.length >= 2 &&
      `${o.name} ${o.subtitle}`.toLowerCase().includes(q.toLowerCase()),
  );
  const reusableForeign = savedForeign.filter((row) => !alreadyListingIds.includes(row.listingId));

  useEffect(() => {
    if (!open) return;
    setMode("nmc");
    setQuery("");
    setHits([]);
    setError("");
    setBusy(false);
    setForeign(EMPTY_FOREIGN);
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "nmc" || nmcFromQuery || q.length < 2) {
      if (q.length < 2 || nmcFromQuery) setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      setSearching(true);
      void searchNmcDoctors(q).then((res) => {
        setSearching(false);
        if (res.ok) setHits(res.data);
        else setHits([]);
      });
    }, 320);
    return () => window.clearTimeout(t);
  }, [open, mode, q, nmcFromQuery]);

  useEffect(() => {
    if (!open || mode !== "foreign") return;
    void apiListForeignDoctors().then(setSavedForeign);
  }, [open, mode]);

  const findByNmc = async (raw: string) => {
    const nmc = normalizeNmcNumber(raw);
    setError("");
    if (!nmc) {
      setError(tx("Enter a name or NMC number."));
      return;
    }
    if (alreadyNmc.includes(nmc)) {
      setError(tx("That doctor is already on this page."));
      return;
    }
    setBusy(true);
    const listed = await listNmcDoctors({ q: nmc, limit: 8 });
    if (listed.ok) {
      const hit = listed.data.find((r) => normalizeNmcNumber(r.nmcNumber) === nmc);
      if (hit) {
        setBusy(false);
        onAdd(staffFromNmc(hit));
        return;
      }
    }
    const looked = await lookupNmc(nmc);
    setBusy(false);
    if (!looked.ok) {
      setError(looked.error);
      return;
    }
    onAdd(
      staffFromNmc({
        nmcNumber: looked.data.nmcNumber,
        name: `NMC #${looked.data.nmcNumber}`,
        degree: looked.data.degree,
        address: looked.data.cityHint,
      }),
    );
  };

  const find = async () => {
    if (nmcFromQuery) {
      await findByNmc(q);
      return;
    }
    if (q.length < 2) {
      setError(tx("Enter a name or NMC number."));
      return;
    }
    setSearching(true);
    const res = await searchNmcDoctors(q);
    setSearching(false);
    if (res.ok) setHits(res.data);
    else setHits([]);
    if (res.ok && res.data.length === 0 && !published.length) {
      setError(tx("No registry matches. Add as a foreign doctor if they are not on the NMC register."));
    }
  };

  const addForeign = async () => {
    if (!foreign.name.trim()) {
      setError(tx("Enter the doctor’s name."));
      return;
    }
    setBusy(true);
    setError("");
    const saved = await apiCreateForeignDoctor({
      name: foreign.name.trim(),
      specialty: foreign.specialty.trim(),
      council: foreign.council.trim(),
      registrationNo: foreign.registrationNo.trim(),
      country: foreign.country.trim(),
      imageUrl: foreign.imageUrl.trim(),
      createdBy: ownerId,
    });
    setBusy(false);
    if (!saved) {
      setError(tx("Could not save this doctor. Check the API server and try again."));
      return;
    }
    onAdd(staffFromForeign(saved));
  };

  return (
    <Modal open={open} title={mode === "foreign" ? tx("Foreign doctor") : tx("Add a doctor")} onClose={onClose}>
      {mode === "nmc" ? (
        <>
          <label className="block text-sm font-medium text-[color:var(--pp-primary-950)]">
            {tx("Search by name or NMC number")}
          </label>
          <input
            className={FIELD + " mt-1.5"}
            autoComplete="off"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void find();
            }}
            placeholder={tx("e.g. Santosh or 802")}
          />
          <p className="mt-1 text-xs text-ink-tertiary">{tx("Nepal Medical Council register.")}</p>
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-[color:var(--pp-primary-950)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void find()}
          >
            {busy ? tx("Looking up…") : tx("Find this doctor")}
          </button>
          {searching ? <p className="mt-3 text-sm text-ink-tertiary">{tx("Searching…")}</p> : null}
          {hits.length > 0 || published.length > 0 ? (
            <ul className="mt-3 overflow-hidden rounded-xl border border-line">
              {hits.map((row, i) => {
                const nmc = normalizeNmcNumber(row.nmcNumber) || row.nmcNumber;
                const taken = alreadyNmc.includes(nmc);
                return (
                  <li key={`nmc-${row.nmcNumber}`} className={i > 0 ? "border-t border-line" : ""}>
                    <button
                      type="button"
                      disabled={taken}
                      className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-[color:var(--state-hover)] disabled:opacity-40"
                      onClick={() => onAdd(staffFromNmc(row))}
                    >
                      <span>
                        <span className="block font-medium text-[color:var(--pp-primary-950)]">{row.name}</span>
                        <span className="mt-0.5 block text-xs text-ink-tertiary">
                          {row.degree || "—"} · {cityFromNmcAddress(row.address)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-ink-tertiary tnum">NMC #{row.nmcNumber}</span>
                    </button>
                  </li>
                );
              })}
              {published.map((o, i) => (
                <li key={o.refId} className={hits.length || i > 0 ? "border-t border-line" : ""}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[color:var(--state-hover)]"
                    onClick={() =>
                      onAdd({
                        id: newSectionId("doctors"),
                        name: o.name,
                        specialty: o.subtitle,
                        listingId: o.refId,
                        imageUrl: o.imageUrl,
                      })
                    }
                  >
                    <span>
                      <span className="block font-medium text-[color:var(--pp-primary-950)]">{o.name}</span>
                      {o.subtitle ? <span className="mt-0.5 block text-xs text-ink-tertiary">{o.subtitle}</span> : null}
                    </span>
                    <span className="text-sm text-[color:var(--pp-violet)]">+ {tx("Add")}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="mt-6 w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink-secondary hover:border-[color:var(--pp-violet)] hover:text-[color:var(--pp-primary-950)]"
            onClick={() => {
              setError("");
              setMode("foreign");
            }}
          >
            {tx("Add a foreign doctor")}
          </button>
          <p className="mt-1.5 text-center text-xs text-ink-tertiary">
            {tx("Not on the Nepal Medical Council register.")}
          </p>
        </>
      ) : (
        <div className="rounded-2xl border-2 border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)] p-4">
          <button
            type="button"
            className="text-sm text-ink-secondary hover:text-[color:var(--pp-primary-950)]"
            onClick={() => {
              setError("");
              setMode("nmc");
            }}
          >
            ← {tx("Search NMC instead")}
          </button>
          <p className="mt-3 text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Foreign doctor")}</p>
          <p className="mt-1 text-xs text-ink-tertiary">
            {tx("Add their council, licence number, and photo.")}
          </p>
          {reusableForeign.length ? (
            <ul className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
              {reusableForeign.slice(0, 6).map((row, i) => (
                <li key={row.id} className={i > 0 ? "border-t border-line" : ""}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[color:var(--state-hover)]"
                    onClick={() => onAdd(staffFromForeign(row))}
                  >
                    {row.imageUrl ? (
                      <img src={row.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 shrink-0 rounded-full bg-[color:var(--pp-primary-200)]" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">{row.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-ink-tertiary">
                        {[row.specialty, row.council, row.registrationNo, row.country].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="text-sm text-[color:var(--pp-violet)]">+ {tx("Add")}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              className={FIELD}
              value={foreign.name}
              onChange={(e) => setForeign({ ...foreign, name: e.target.value })}
              placeholder={tx("Full name")}
            />
            <input
              className={FIELD}
              value={foreign.specialty}
              onChange={(e) => setForeign({ ...foreign, specialty: e.target.value })}
              placeholder={tx("Specialty")}
            />
            <input
              className={FIELD}
              value={foreign.council}
              onChange={(e) => setForeign({ ...foreign, council: e.target.value })}
              placeholder={tx("Medical council / licence body")}
            />
            <input
              className={FIELD}
              value={foreign.registrationNo}
              onChange={(e) => setForeign({ ...foreign, registrationNo: e.target.value })}
              placeholder={tx("Registration number")}
            />
            <input
              className={FIELD}
              value={foreign.country}
              onChange={(e) => setForeign({ ...foreign, country: e.target.value })}
              placeholder={tx("Country")}
            />
            <input
              className={FIELD}
              value={foreign.imageUrl}
              onChange={(e) => setForeign({ ...foreign, imageUrl: e.target.value })}
              placeholder={tx("Image link")}
            />
          </div>
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-[color:var(--pp-primary-950)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void addForeign()}
          >
            {busy ? tx("Saving…") : tx("Save foreign doctor")}
          </button>
        </div>
      )}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </Modal>
  );
}
