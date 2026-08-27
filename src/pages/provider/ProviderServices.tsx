import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Caret } from "@/components/ui";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import { useShellColumn } from "@/lib/columnHover";
import {
  emptyServiceType,
  listFacilityServices,
  removeFacilityService,
  saveFacilityService,
  syncFacilityServicesToListing,
  type FacilityServiceItem,
  type FacilityServiceType,
} from "@/lib/facilityServices";
import { boardDoctors } from "@/lib/hospitalPatientDraft";
import { useProvider } from "@/lib/providerAuth";
import { clinicianNoun, portalFor } from "@/lib/providerPortals";
import { SERVICE_PRESETS } from "@/lib/businessProfile";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary focus:border-[color:var(--pp-primary-950)]";
const SELECT =
  "h-11 w-full appearance-none rounded-xl border border-line bg-white px-3.5 pr-9 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const FEE =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)] tnum";

/** Desk / rota coverage — no named clinician required (e.g. Emergency). */
const ANY_AVAILABLE = "Any available";

function prefersAnyAvailable(serviceName: string) {
  return /emergency/i.test(serviceName);
}

function doctorForService(serviceName: string, fallbackDoctor: string) {
  return prefersAnyAvailable(serviceName) ? ANY_AVAILABLE : fallbackDoctor;
}

export function ProviderServices() {
  const { tx } = useI18n();
  const { provider, workspaceId } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const clinician = clinicianNoun(provider?.vendorType);
  const orgId = provider?.id ?? "anon";
  const doctors = boardDoctors(workspaceId);
  const defaultDoctor = doctors[0] || "";
  const mainCol = useShellColumn("main");
  const railCol = useShellColumn("rail");

  const [items, setItems] = useState<FacilityServiceItem[]>(() =>
    listFacilityServices(orgId, provider ?? null, defaultDoctor),
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [editPaused, setEditPaused] = useState(false);
  const [label, setLabel] = useState("");
  const [doctor, setDoctor] = useState(defaultDoctor);
  const [types, setTypes] = useState<FacilityServiceType[]>([emptyServiceType(79)]);
  const [flash, setFlash] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const presets = provider ? SERVICE_PRESETS[provider.vendorType] || [] : [];
  const listedLabels = new Set(items.map((s) => s.label.toLowerCase()));

  const refresh = () => setItems(listFacilityServices(orgId, provider ?? null, defaultDoctor));

  const resetForm = () => {
    setEditId(null);
    setEditPaused(false);
    setLabel("");
    setDoctor(defaultDoctor);
    setTypes([emptyServiceType(79)]);
  };

  const loadIntoForm = (item: FacilityServiceItem) => {
    setEditId(item.id);
    setEditPaused(Boolean(item.paused));
    setLabel(item.label);
    setDoctor(item.doctor || doctorForService(item.label, defaultDoctor));
    setTypes(
      item.types.length > 0
        ? item.types.map((t) => ({ ...t }))
        : [emptyServiceType(item.feeFrom)],
    );
    setMenuId(null);
  };

  const fillPreset = (name: string) => {
    const existing = items.find((s) => s.label.toLowerCase() === name.toLowerCase());
    if (existing) {
      loadIntoForm(existing);
      return;
    }
    setEditId(null);
    setEditPaused(false);
    setLabel(name);
    setDoctor(doctorForService(name, defaultDoctor));
    setTypes([{ ...emptyServiceType(79), label: "General" }]);
    setMenuId(null);
  };

  const patchType = (id: string, partial: Partial<FacilityServiceType>) => {
    setTypes((rows) => rows.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  };

  const readyTypes = types.filter((t) => t.label.trim());
  const typesComplete =
    types.length > 0 &&
    types.every((t) => t.label.trim() && Number.isFinite(t.fee) && String(t.fee).trim() !== "");
  const canSave = Boolean(label.trim() && doctor.trim() && typesComplete);

  const submit = () => {
    if (!canSave) return;
    const cleaned = types
      .filter((t) => t.label.trim())
      .map((t) => ({
        ...t,
        label: t.label.trim(),
        fee: Number(t.fee) || 0,
      }));
    if (cleaned.length === 0) return;
    const feeFrom = Math.min(...cleaned.map((t) => t.fee));
    if (
      !editId &&
      listedLabels.has(label.trim().toLowerCase())
    ) {
      setFlash(tx("That service is already listed."));
      window.setTimeout(() => setFlash(null), 2000);
      return;
    }
    saveFacilityService(
      orgId,
      {
        id: editId || undefined,
        label: label.trim(),
        doctor: doctor.trim(),
        types: cleaned,
        feeFrom,
        paused: editId ? editPaused : false,
      },
      provider ?? null,
      defaultDoctor,
    );
    refresh();
    resetForm();
    setFlash(editId ? tx("Service updated") : tx("Service added"));
    window.setTimeout(() => setFlash(null), 2000);
  };

  const syncToListing = () => {
    if (!provider) return;
    syncFacilityServicesToListing(provider, defaultDoctor);
    refresh();
    setFlash(tx("Synced to listing draft"));
    window.setTimeout(() => setFlash(null), 2000);
  };

  return (
    <div>
      <ProviderBreadcrumb
        items={[home, { label: tx("Services") }]}
        end={
          <Button size="sm" variant="secondary" onClick={syncToListing} disabled={items.length === 0}>
            {tx("Sync to listing")}
          </Button>
        }
      />

      {flash ? (
        <p className="mb-4 text-sm font-medium text-[color:var(--pp-green)]" role="status">
          {flash}
        </p>
      ) : null}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:gap-x-10">
        <div className={"min-w-0 " + mainCol.className} onMouseEnter={mainCol.onMouseEnter}>
          <section className="rounded-2xl border border-line bg-white">
            <div className="px-5 py-4">
              <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
                {tx("Services")}
                <span className="ml-1.5 text-ink-tertiary tnum">({items.length})</span>
              </h2>
            </div>

            {items.length === 0 ? (
              <p className="border-t border-line px-5 py-10 text-sm text-ink-tertiary">
                {tx("No services yet. Add one on the right.")}
              </p>
            ) : (
              <ul className="grid gap-3 overflow-visible border-t border-line p-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((s) => {
                  const paused = Boolean(s.paused);
                  const menuOpen = menuId === s.id;
                  return (
                    <li
                      key={s.id}
                      className={
                        "relative rounded-2xl border bg-white " +
                        (menuOpen ? "z-20 " : "z-0 ") +
                        (paused
                          ? "border-line/80 bg-[color:var(--pp-primary-100)]/35"
                          : "border-line")
                      }
                    >
                      <div className="flex items-start justify-between gap-2 px-4 pt-4">
                        <div className={"min-w-0 " + (paused ? "opacity-55" : "")}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-display text-base font-medium text-[color:var(--pp-primary-950)]">
                              {s.label}
                            </p>
                            {paused ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--pp-primary-100)] px-2 py-0.5 text-2xs font-semibold text-ink-secondary">
                                <PauseGlyph />
                                {tx("Paused")}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-sm text-ink-tertiary">
                            {s.doctor === ANY_AVAILABLE
                              ? tx("Any available")
                              : s.doctor || tx("Unassigned")}
                          </p>
                        </div>
                        <ServiceMenu
                          open={menuOpen}
                          paused={paused}
                          onOpenChange={(on) => setMenuId(on ? s.id : null)}
                          onEdit={() => loadIntoForm(s)}
                          onPause={() => {
                            saveFacilityService(
                              orgId,
                              { ...s, paused: !paused },
                              provider ?? null,
                              defaultDoctor,
                            );
                            refresh();
                            setMenuId(null);
                          }}
                          onRemove={() => {
                            removeFacilityService(orgId, s.id, provider ?? null, defaultDoctor);
                            if (editId === s.id) resetForm();
                            refresh();
                            setMenuId(null);
                          }}
                        />
                      </div>
                      <ul
                        className={
                          "mt-3 space-y-2 border-t border-line px-4 py-3 " +
                          (paused ? "opacity-55" : "")
                        }
                      >
                        {s.types.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center justify-between gap-3 text-sm text-[color:var(--pp-primary-950)]"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span
                                className="h-1 w-1 shrink-0 rounded-full bg-[color:var(--pp-violet)]"
                                aria-hidden
                              />
                              <span className="truncate">{t.label}</span>
                            </span>
                            <span className="shrink-0 tnum text-ink-secondary">{formatFee(t.fee)}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className={"space-y-5 " + railCol.className} onMouseEnter={railCol.onMouseEnter}>
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {editId ? tx("Edit service") : tx("Add service")}
            </h2>

            <label className="mt-4 block">
              <span className="sr-only">{tx("Name")}</span>
              <input
                className={FIELD}
                placeholder={tx("Name")}
                value={label}
                onChange={(e) => {
                  const next = e.target.value;
                  setLabel(next);
                  if (prefersAnyAvailable(next) && (!doctor || doctors.includes(doctor))) {
                    setDoctor(ANY_AVAILABLE);
                  }
                }}
              />
            </label>

            <label className="relative mt-3 block">
              <span className="sr-only">{tx(clinician)}</span>
              <select
                className={SELECT}
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              >
                <option value="">{tx("Select {role}").replace("{role}", clinician.toLowerCase())}</option>
                <optgroup label={tx("Other")}>
                  <option value={ANY_AVAILABLE}>{tx("Any available")}</option>
                </optgroup>
                {doctors.length > 0 ? (
                  <optgroup label={tx(clinician)}>
                    {doctors.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
              <Caret className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            </label>
            {prefersAnyAvailable(label) ? (
              <p className="mt-1.5 text-2xs text-ink-tertiary">
                {tx("Emergency desks are covered by whoever is on duty — Any available is fine.")}
              </p>
            ) : null}

            <div className="mt-3 space-y-2">
              {types.map((row) => (
                <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
                  <input
                    className={FIELD}
                    placeholder={tx("Type")}
                    value={row.label}
                    onChange={(e) => patchType(row.id, { label: e.target.value })}
                  />
                  <input
                    type="number"
                    min={0}
                    className={FEE}
                    value={row.fee}
                    onChange={(e) => patchType(row.id, { fee: Number(e.target.value) || 0 })}
                    aria-label={tx("Fee")}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-3 text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
              onClick={() => setTypes((rows) => [...rows, emptyServiceType(rows[rows.length - 1]?.fee ?? 79)])}
            >
              + {tx("Add more")}
            </button>

            <div className="mt-5 flex flex-col gap-2">
              <Button fullWidth onClick={submit} disabled={!canSave}>
                {editId ? tx("Save service") : tx("Add service")}
              </Button>
              {editId ? (
                <button
                  type="button"
                  className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
                  onClick={resetForm}
                >
                  {tx("Cancel edit")}
                </button>
              ) : null}
            </div>
          </section>

          {presets.length > 0 ? (
            <section>
              <p className="mb-2 text-sm font-medium text-ink-secondary">{tx("Quick add")}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={tx("Service presets")}>
                {presets.map((name) => {
                  const inForm = label.trim().toLowerCase() === name.toLowerCase();
                  const listed = listedLabels.has(name.toLowerCase());
                  return (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={inForm}
                      onClick={() => fillPreset(name)}
                      className={
                        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
                        (inForm
                          ? "bg-[color:var(--pp-primary-950)] text-white"
                          : listed
                            ? "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] ring-1 ring-line"
                            : "bg-white text-ink-secondary ring-1 ring-line hover:text-[color:var(--pp-primary-950)]")
                      }
                    >
                      {tx(name)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-2xs text-ink-tertiary">
                {tx("Fills the form — review doctor, types, and price, then add.")}
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function ServiceMenu({
  open,
  paused,
  onOpenChange,
  onEdit,
  onPause,
  onRemove,
}: {
  open: boolean;
  paused: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onPause: () => void;
  onRemove: () => void;
}) {
  const { tx } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onOpenChange]);

  return (
    <div ref={wrap} className="relative z-30 shrink-0">
      <button
        type="button"
        className="grid h-8 w-8 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
        aria-label={tx("More")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => onOpenChange(!open)}
      >
        <KebabGlyph />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 min-w-[11rem] rounded-2xl border border-line bg-white py-1 shadow-[0_12px_32px_rgba(24,7,48,0.12)]"
        >
          <li>
            <button
              type="button"
              role="menuitem"
              className="flex w-full px-3.5 py-2 text-left text-sm text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
              onClick={onEdit}
            >
              {tx("Edit")}
            </button>
          </li>
          <li>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
              onClick={onPause}
            >
              {paused ? <PlayGlyph /> : <PauseGlyph />}
              {paused ? tx("Resume service") : tx("Pause service")}
            </button>
          </li>
          <li>
            <button
              type="button"
              role="menuitem"
              className="flex w-full px-3.5 py-2 text-left text-sm text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
              onClick={onRemove}
            >
              {tx("Remove")}
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

function KebabGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="8" cy="3.2" r="1.2" />
      <circle cx="8" cy="8" r="1.2" />
      <circle cx="8" cy="12.8" r="1.2" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="3.5" y="2.5" width="3" height="11" rx="0.75" />
      <rect x="9.5" y="2.5" width="3" height="11" rx="0.75" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4.5 2.8v10.4L13 8 4.5 2.8Z" />
    </svg>
  );
}
