import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { DetailMeta, DetailSection } from "@/components/DetailSection";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import { useShellColumn } from "@/lib/columnHover";
import { isValidPhone } from "@/lib/phone";
import { ListingPageEditor } from "@/components/ListingPageEditor";
import { ListingSectionPreview } from "@/components/ListingSectionPreview";
import {
  SERVICE_PRESETS,
  VENDOR_TYPE_LABELS,
  OFFERING_KIND_LABELS,
  hubPathForProfile,
  ingestRemoteDraft,
  cachePublishedListing,
  listingNameFromProvider,
  loadDraftForProvider,
  newBusinessOffering,
  offeringMeta,
  servicesForHub,
  publishBusinessProfile,
  saveDraft,
  unpublishBusinessProfile,
  type BusinessCapabilities,
  type BusinessProfile,
  type BusinessService,
} from "@/lib/businessProfile";
import { listingSection, LISTING_SECTION_LABELS, type ListingSection, type ListingSectionKind } from "@/lib/listingPage";
import { apiLoadListing } from "@/lib/listingApi";
import { useProvider } from "@/lib/providerAuth";
import { nmcNumberFromId, setDoctorPublished } from "@/lib/doctorDirectory";
import { hfCodeFromId, setFacilityPublished } from "@/lib/facilityDirectory";
import { specialisedVariantForVendor } from "@/lib/specialisedIn";
import { SpecialisedInSection } from "@/components/SpecialisedIn";
import { PhoneField } from "@/components/PhoneField";

const FIELD =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-[color:var(--pp-primary-950)] placeholder:text-ink-tertiary outline-none focus:border-[color:var(--pp-primary-950)]";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

const STEPS = [
  { key: "essentials", title: "Essentials" },
  { key: "contact", title: "Contact & location" },
  { key: "practice", title: "Practice & services" },
  { key: "hours", title: "Hours & listing" },
  { key: "page", title: "Public page" },
] as const;

type PreviewMode = "card" | "page";

export function BusinessProfile() {
  const { tx } = useI18n();
  const { provider, update: updateProvider } = useProvider();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState<PreviewMode>("card");
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [customService, setCustomService] = useState("");

  useEffect(() => {
    if (!provider) return;
    const draft = loadDraftForProvider(provider);
    setProfile(draft);
    setDirty(false);
    const synced = listingNameFromProvider(provider);
    if (synced && provider.orgName.trim().toLowerCase() === "your practice") {
      updateProvider({ orgName: synced });
    } else if (draft.name.trim() && draft.name.trim() !== provider.orgName.trim()) {
      updateProvider({ orgName: draft.name.trim() });
    }
    void apiLoadListing(provider.id).then((row) => {
      if (row?.published) cachePublishedListing(row.published);
      if (!row?.draft) return;
      const remote = ingestRemoteDraft(provider.id, row.draft);
      if (!remote) return;
      setProfile((current) => {
        if (!current) return remote;
        const localTs = Date.parse(current.updatedAt) || 0;
        const remoteTs = Date.parse(remote.updatedAt) || 0;
        return remoteTs >= localTs ? remote : current;
      });
    });
  }, [provider?.id]);

  useEffect(() => {
    if (!savedFlash) return;
    const t = window.setTimeout(() => setSavedFlash(null), 2200);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  useEffect(() => {
    if (!provider || !profile || !dirty) return;
    const t = window.setTimeout(() => {
      saveDraft(profile, provider.id);
      setDirty(false);
      setSavedFlash(tx("Saved"));
    }, 900);
    return () => window.clearTimeout(t);
  }, [profile, dirty, provider, tx]);

  const mainCol = useShellColumn("main");
  const railCol = useShellColumn("rail");

  if (!provider || !profile) {
    return (
      <div className="py-16 text-center text-sm text-ink-tertiary">{tx("Loading listing…")}</div>
    );
  }

  const hubPath = hubPathForProfile(profile);
  const live = profile.status === "published" && !!profile.publishedId;

  const patch = (partial: Partial<BusinessProfile>) => {
    setProfile((p) => (p ? { ...p, ...partial } : p));
    setDirty(true);
    setStepError(null);
    if (partial.name !== undefined) {
      const name = partial.name.trim();
      if (name) updateProvider({ orgName: name });
    }
    if (partial.phone !== undefined) updateProvider({ phone: partial.phone });
  };

  const listingSectionRow = (kind: ListingSectionKind) =>
    listingSection(profile.pageSections, kind) ?? {
      id: kind,
      kind,
      title: LISTING_SECTION_LABELS[kind],
      enabled: true,
    };

  const listingEnable = (kind: ListingSectionKind) => ({
    onProfile: patch,
    onSection: (partial: Partial<ListingSection>) => {
      const sections = profile.pageSections ?? [];
      const row = listingSection(sections, kind);
      if (!row) {
        patch({
          pageSections: [...sections, { ...listingSectionRow(kind), ...partial }],
        });
        return;
      }
      patch({
        pageSections: sections.map((s) => (s.id === row.id ? { ...s, ...partial } : s)),
      });
    },
  });

  const patchCap = (key: keyof BusinessCapabilities, value: boolean) => {
    setProfile((p) =>
      p ? { ...p, capabilities: { ...p.capabilities, [key]: value } } : p,
    );
    setDirty(true);
  };

  const onPublish = () => {
    if (!profile.name.trim()) {
      setStep(0);
      setStepError(tx("Add a registered name before publishing."));
      return;
    }
    if (!profile.licenseNumber.trim()) {
      setStep(0);
      setStepError(tx("Add your licence or registration number."));
      return;
    }
    const next = publishBusinessProfile(profile, provider.id);
    if (next.publishedId) {
      const nmc = nmcNumberFromId(next.publishedId);
      if (nmc) setDoctorPublished(nmc, true);
      const hf = hfCodeFromId(next.publishedId);
      if (hf) setFacilityPublished(hf, true);
    }
    setProfile(next);
    updateProvider({ orgName: next.name });
    setDirty(false);
    setSavedFlash(tx("Live on care hub"));
  };

  const onUnpublish = () => {
    const next = unpublishBusinessProfile(provider.id);
    if (next.publishedId) {
      const nmc = nmcNumberFromId(next.publishedId);
      if (nmc) setDoctorPublished(nmc, false);
      const hf = hfCodeFromId(next.publishedId);
      if (hf) setFacilityPublished(hf, false);
    }
    setProfile(next);
    setDirty(false);
    setSavedFlash(tx("Unpublished"));
  };

  const togglePresetService = (label: string) => {
    const existing = profile.services.find(
      (s) => s.kind === "service" && s.label.toLowerCase() === label.toLowerCase(),
    );
    if (existing) {
      patch({ services: profile.services.filter((s) => s.id !== existing.id) });
      return;
    }
    if (profile.services.length >= 16) return;
    patch({ services: [...profile.services, newBusinessOffering("service", label, profile.feeFrom)] });
  };

  const addCustomService = () => {
    const label = customService.trim();
    if (!label || profile.services.length >= 16) return;
    if (profile.services.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
      setCustomService("");
      return;
    }
    patch({
      services: [...profile.services, newBusinessOffering("service", label, profile.feeFrom)],
    });
    setCustomService("");
  };

  const updateService = (id: string, partial: Partial<BusinessService>) => {
    patch({
      services: profile.services.map((s) => (s.id === id ? { ...s, ...partial } : s)),
    });
  };

  const removeService = (id: string) => {
    patch({
      services: profile.services
        .filter((s) => s.id !== id)
        .map((s) => ({ ...s, includedIds: s.includedIds.filter((x) => x !== id) })),
    });
  };

  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!profile.name.trim()) return tx("Registered name is required.");
      if (!profile.licenseNumber.trim()) return tx("Licence / registration number is required.");
    }
    if (index === 1) {
      if (!profile.address.trim()) return tx("Address is required.");
      if (!profile.city.trim()) return tx("City is required.");
      if (!isValidPhone(profile.phone)) return tx("Phone is required.");
      if (!profile.email.trim()) return tx("Email is required.");
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const goToStep = (i: number) => {
    if (i > step) {
      const err = validateStep(step);
      if (err) {
        setStepError(err);
        return;
      }
    }
    setStepError(null);
    setStep(i);
  };

  const showDoctorBits =
    profile.type === "doctor" || profile.type === "hospital" || profile.type === "clinic";
  const specialisedVariant = specialisedVariantForVendor(profile.type) ?? "doctor";
  const showLabBits = profile.type === "lab";
  const showIndividualBits =
    profile.type === "individual" || profile.type === "pharmacy" || profile.type === "ambulance";

  const presets = SERVICE_PRESETS[profile.type];

  const canvas = step === 4;

  return (
    <div className="pb-28 lg:pb-8">
      <div
        className={
          canvas
            ? ""
            : "grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]"
        }
      >
        <div
          className={"min-w-0 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Listing setup")}</p>

          <div className="mt-5 flex items-end justify-between gap-4 border-b border-line">
            <nav
              className="flex min-w-0 flex-1 gap-5 overflow-x-auto"
              aria-label={tx("Listing steps")}
            >
              {STEPS.map((s, i) => {
                const active = i === step;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => goToStep(i)}
                    className={
                      "-mb-px shrink-0 border-b-2 pb-3 text-sm transition-colors " +
                      (active
                        ? "border-[color:var(--pp-primary-950)] font-medium text-[color:var(--pp-primary-950)]"
                        : "border-transparent text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
                    }
                  >
                    {tx(s.title)}
                  </button>
                );
              })}
            </nav>
            <p className="shrink-0 pb-3 text-sm text-ink-tertiary">
              {tx("Step {n} of {total}")
                .replace("{n}", String(step + 1))
                .replace("{total}", String(STEPS.length))}
            </p>
          </div>

          <p className="sr-only" aria-live="polite">
            {dirty ? tx("Saving…") : savedFlash ? savedFlash : ""}
          </p>

          <div className="mt-8">
            {step === 0 ? (
              <DetailSection title={tx("Essentials")}>
                <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <BareField label={tx("Registered name")}>
                    <input
                      className={FIELD}
                      value={profile.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      placeholder={tx("Registered name")}
                      autoComplete="organization"
                    />
                  </BareField>
                  <BareField label={tx("Licence / registration number")}>
                    <input
                      className={FIELD}
                      value={profile.licenseNumber}
                      onChange={(e) => patch({ licenseNumber: e.target.value })}
                      placeholder={tx("Licence / registration number")}
                    />
                  </BareField>
                </div>
                <BareField label={tx("One-line intro")}>
                  <input
                    className={FIELD}
                    value={profile.subtitle || profile.bio}
                    onChange={(e) => patch({ subtitle: e.target.value, bio: e.target.value })}
                    placeholder={tx("One-line intro")}
                  />
                </BareField>
                </div>
              </DetailSection>
            ) : null}

            {step === 1 ? (
              <DetailSection title={tx("Contact & location")}>
                <div className="space-y-4">
                <BareField label={tx("Street address")}>
                  <input
                    className={FIELD}
                    value={profile.address}
                    onChange={(e) => patch({ address: e.target.value })}
                    placeholder={tx("Street address")}
                    autoComplete="street-address"
                  />
                </BareField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <BareField label={tx("City")}>
                    <input
                      className={FIELD}
                      value={profile.city}
                      onChange={(e) => patch({ city: e.target.value })}
                      placeholder={tx("City")}
                      autoComplete="address-level2"
                    />
                  </BareField>
                  <PhoneField
                    label={tx("Phone")}
                    value={profile.phone}
                    onChange={(v) => patch({ phone: v })}
                  />
                </div>
                <BareField label={tx("Email")}>
                  <input
                    className={FIELD}
                    type="email"
                    value={profile.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    placeholder={tx("Email")}
                    autoComplete="email"
                  />
                </BareField>
                <BareField label={tx("Website")}>
                  <input
                    className={FIELD}
                    type="url"
                    value={profile.website}
                    onChange={(e) => patch({ website: e.target.value })}
                    placeholder={tx("Website (optional)")}
                  />
                </BareField>
                </div>
              </DetailSection>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <DetailSection title={tx("Practice & services")}>
                <div className="space-y-6">
                {showDoctorBits ? (
                  <BareField label={tx("Specialty / focus")}>
                    <input
                      className={FIELD}
                      value={profile.specialtyNote}
                      onChange={(e) => patch({ specialtyNote: e.target.value })}
                      placeholder={tx("Specialty / focus")}
                    />
                  </BareField>
                ) : null}

                <div>
                  <p className={LABEL}>{tx("How you practice")}</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={tx("How you practice")}>
                    {showDoctorBits ? (
                      <>
                        <CapToggle
                          label={tx("Virtual")}
                          on={profile.capabilities.virtual}
                          onChange={(v) => patchCap("virtual", v)}
                        />
                        <CapToggle
                          label={tx("In clinic")}
                          on={profile.capabilities.clinic}
                          onChange={(v) => patchCap("clinic", v)}
                        />
                      </>
                    ) : null}
                    {showLabBits ? (
                      <>
                        <CapToggle
                          label={tx("Blood work")}
                          on={profile.capabilities.bloodwork}
                          onChange={(v) => patchCap("bloodwork", v)}
                        />
                        <CapToggle
                          label={tx("Imaging")}
                          on={profile.capabilities.imaging}
                          onChange={(v) => patchCap("imaging", v)}
                        />
                        <CapToggle
                          label={tx("Packages")}
                          on={profile.capabilities.packages}
                          onChange={(v) => patchCap("packages", v)}
                        />
                      </>
                    ) : null}
                    {showIndividualBits ? (
                      <>
                        <CapToggle
                          label={tx("Home")}
                          on={profile.capabilities.home}
                          onChange={(v) => patchCap("home", v)}
                        />
                        <CapToggle
                          label={tx("Clinic")}
                          on={profile.capabilities.clinic}
                          onChange={(v) => patchCap("clinic", v)}
                        />
                        <CapToggle
                          label={tx("Virtual")}
                          on={profile.capabilities.virtual}
                          onChange={(v) => patchCap("virtual", v)}
                        />
                      </>
                    ) : null}
                  </div>
                </div>

                {profile.type !== "lab" ? (
                  <div className="max-w-xs">
                    <label className="block">
                      <span className={LABEL}>{tx("Fee from (CAD)")}</span>
                      <input
                        type="number"
                        min={0}
                        className={FIELD}
                        value={profile.feeFrom || ""}
                        onChange={(e) => patch({ feeFrom: Number(e.target.value) || 0 })}
                      />
                    </label>
                  </div>
                ) : null}

                <div>
                  <p className={LABEL}>{tx("Services")}</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={tx("Services")}>
                    {presets.map((label) => {
                      const on = profile.services.some(
                        (s) =>
                          s.kind === "service" && s.label.toLowerCase() === label.toLowerCase(),
                      );
                      return (
                        <button
                          key={label}
                          type="button"
                          aria-pressed={on}
                          onClick={() => togglePresetService(label)}
                          className={
                            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
                            (on
                              ? "bg-[color:var(--pp-primary-950)] text-white"
                              : "bg-white text-ink-secondary ring-1 ring-line hover:text-[color:var(--pp-primary-950)]")
                          }
                        >
                          {tx(label)}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <BareField label={tx("Add a service")} className="min-w-0 flex-1">
                      <input
                        className={FIELD}
                        value={customService}
                        onChange={(e) => setCustomService(e.target.value)}
                        placeholder={tx("Add a service")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomService();
                          }
                        }}
                      />
                    </BareField>
                    <Button
                      size="sm"
                      variant="outline"
                      className="!h-12 shrink-0 !px-5"
                      onClick={addCustomService}
                      disabled={!customService.trim() || profile.services.length >= 16}
                    >
                      {tx("Add")}
                    </Button>
                  </div>

                  {profile.services.filter((s) => s.kind === "service").length > 0 ? (
                    <ul className="mt-4 overflow-hidden rounded-xl border border-line bg-[color:var(--pp-primary-100)]">
                      {profile.services
                        .filter((s) => s.kind === "service")
                        .map((s, i) => (
                          <li
                            key={s.id}
                            className={
                              "flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 " +
                              (i > 0 ? "border-t border-line" : "")
                            }
                          >
                            <p className="min-w-0 flex-1 text-sm font-medium text-[color:var(--pp-primary-950)]">
                              {s.label}
                            </p>
                            <label className="flex shrink-0 items-center gap-2">
                              <span className="text-2xs font-medium text-ink-tertiary">
                                {tx("Fee (CAD)")}
                              </span>
                              <input
                                type="number"
                                min={0}
                                className="h-10 w-[4.5rem] rounded-xl border border-line bg-white px-3 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
                                value={s.feeFrom || ""}
                                onChange={(e) =>
                                  updateService(s.id, { feeFrom: Number(e.target.value) || 0 })
                                }
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeService(s.id)}
                              className="shrink-0 text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
                            >
                              {tx("Remove")}
                            </button>
                          </li>
                        ))}
                    </ul>
                  ) : null}

                  <p className="mt-4 text-sm text-ink-tertiary">
                    {tx("Bundles, deals, and promo codes live in Offers.")}{" "}
                    <Link
                      to="/provider/offers"
                      className="font-medium text-[color:var(--pp-violet)] hover:opacity-70"
                    >
                      {tx("Open Offers")} →
                    </Link>
                  </p>
                </div>
                </div>
                </DetailSection>

                {showDoctorBits ? (
                  <SpecialisedInSection
                    variant={specialisedVariant}
                    groups={profile.specialisedIn}
                    onChange={(specialisedIn) => patch({ specialisedIn })}
                  />
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <ListingSectionPreview
                  profile={profile}
                  section={listingSectionRow("hours")}
                  enable={listingEnable("hours")}
                />
                <ListingSectionPreview
                  profile={profile}
                  section={listingSectionRow("about")}
                  enable={listingEnable("about")}
                />
                <ListingSectionPreview
                  profile={profile}
                  section={listingSectionRow("publications")}
                  enable={listingEnable("publications")}
                />

                {live ? (
                  <DetailSection title={tx("Listing")}>
                    <button
                      type="button"
                      onClick={onUnpublish}
                      className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
                    >
                      {tx("Unpublish listing")}
                    </button>
                  </DetailSection>
                ) : null}
              </div>
            ) : null}

            {step === 4 ? (
              <ListingPageEditor
                profile={profile}
                onChange={patch}
                live={live}
                hubPath={hubPath}
                onPublish={onPublish}
                onSaveDraft={() => {
                  saveDraft(profile, provider.id);
                  setDirty(false);
                  setSavedFlash(tx("Draft saved"));
                }}
                onUnpublish={live ? onUnpublish : undefined}
              />
            ) : null}
          </div>

          {canvas ? (
            <div className="mt-8">
              <Button variant="outline" size="sm" className="!h-11 !px-6" onClick={goBack}>
                {tx("Back")}
              </Button>
            </div>
          ) : (
            <>
              {stepError ? (
                <p className="mt-5 text-sm font-medium text-red-700" role="alert">
                  {stepError}
                </p>
              ) : null}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="!h-11 !px-6"
                  onClick={goBack}
                  disabled={step === 0}
                >
                  {tx("Back")}
                </Button>
                <Button size="sm" className="!h-11 !px-7" onClick={goNext}>
                  {tx("Continue")}
                </Button>
              </div>
            </>
          )}
        </div>

        {canvas ? null : (
        <aside
          className={"h-fit lg:sticky lg:top-28 " + railCol.className}
          onMouseEnter={railCol.onMouseEnter}
        >
          <DetailSection
            title={`${tx("Patient view")}`}
            meta={<DetailMeta>{live ? tx("Live") : tx("Draft")}</DetailMeta>}
          >
          <div className="flex items-center justify-end">
            <div className="flex rounded-full bg-[color:var(--pp-primary-100)] p-0.5">
              {(["card", "page"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPreview(mode)}
                  className={
                    "rounded-full px-3 py-1 text-2xs font-semibold uppercase tracking-wide " +
                    (preview === mode
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : "text-[color:var(--pp-primary-950)]")
                  }
                >
                  {tx(mode === "card" ? "Card" : "Page")}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {preview === "card" ? (
              <BusinessCardPreview profile={profile} />
            ) : (
              <BusinessPagePreview profile={profile} orgId={provider.id} />
            )}
          </div>

          {hubPath && live ? (
            <Link
              to={hubPath}
              className="mt-4 block text-center text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
            >
              {tx("Open on care hub")} →
            </Link>
          ) : null}
          </DetailSection>
        </aside>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
        {canvas ? (
          <Button fullWidth onClick={onPublish}>
            {live ? tx("Publish changes") : tx("Publish")}
          </Button>
        ) : (
          <Button fullWidth onClick={goNext}>
            {tx("Continue")}
          </Button>
        )}
      </div>
    </div>
  );
}

function BareField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={"block " + className}>
      <span className="sr-only">{label}</span>
      {children}
    </label>
  );
}

function CapToggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
        (on
          ? "bg-[color:var(--pp-primary-950)] text-white"
          : "border border-line bg-white text-[color:var(--pp-primary-950)]")
      }
    >
      {label}
    </button>
  );
}

function BusinessCardPreview({ profile }: { profile: BusinessProfile }) {
  const { tx } = useI18n();
  const kindLabel = VENDOR_TYPE_LABELS[profile.type];

  return (
    <div className="rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx(kindLabel)}</p>
        <span className="text-sm text-ink-tertiary">★ {profile.rating.toFixed(1)}</span>
      </div>
      <p className="mt-3 text-3xl" aria-hidden>
        {profile.emoji}
      </p>
      <p className="mt-2 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {profile.name.trim() || tx("Your name")}
      </p>
      <p className="mt-1 text-sm text-ink-tertiary">
        {profile.city || tx("City")}
        {profile.type !== "lab" ? ` · ${formatFee(profile.feeFrom)}` : ""}
      </p>
      <p className="mt-4 text-sm text-ink-tertiary">
        ★ {profile.rating.toFixed(1)} · {profile.nextAvailable || tx("Soon")}
      </p>
    </div>
  );
}

function BusinessPagePreview({
  profile,
  orgId,
}: {
  profile: BusinessProfile;
  orgId: string;
}) {
  const { tx } = useI18n();
  const items = servicesForHub(profile, orgId);

  return (
    <div className="max-h-[26rem] overflow-y-auto rounded-xl border border-line bg-[color:var(--pp-primary-100)] p-5">
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx(VENDOR_TYPE_LABELS[profile.type])}</p>
      <p className="mt-1 font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
        {profile.name.trim() || tx("Your name")}
      </p>
      {(profile.subtitle || profile.bio) && (
        <p className="mt-1 text-sm text-ink-secondary">{profile.subtitle || profile.bio}</p>
      )}
      <div className="mt-4 border-t border-line pt-4">
        <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
          {profile.address || tx("Address TBD")}
        </p>
        <p className="mt-1 text-sm text-ink-tertiary">{profile.hours || "—"}</p>
        {profile.phone ? (
          <p className="mt-1 text-sm text-[color:var(--pp-violet)]">{profile.phone}</p>
        ) : null}
      </div>
      {profile.specialisedIn.length > 0 && specialisedVariantForVendor(profile.type) ? (
        <div className="mt-4 border-t border-line pt-4">
          <SpecialisedInSection
            compact
            groups={profile.specialisedIn}
            variant={specialisedVariantForVendor(profile.type) ?? "doctor"}
          />
        </div>
      ) : null}
      {items.length > 0 ? (
        <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
          {items.map((s) => {
            const extra = offeringMeta(s, items);
            return (
              <li key={s.id} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span className="min-w-0 text-[color:var(--pp-primary-950)]">
                    {s.kind !== "service" ? (
                      <span className="mr-1.5 text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
                        {tx(OFFERING_KIND_LABELS[s.kind])}
                      </span>
                    ) : null}
                    {s.label || tx("Untitled service")}
                  </span>
                  <span className="shrink-0 text-ink-tertiary">
                    {s.feeFrom > 0 ? formatFee(s.feeFrom) : ""}
                  </span>
                </div>
                {extra ? <p className="mt-0.5 text-2xs text-ink-tertiary">{extra}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
