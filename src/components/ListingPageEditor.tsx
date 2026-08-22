import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DetailSection } from "@/components/DetailSection";
import { ListingHeroPreview, ListingSectionPreview } from "@/components/ListingSectionPreview";
import { ListingLayoutPicker, type LayoutPick } from "@/components/ListingLayoutPicker";
import { FacilitiesCardEditor, DoctorsCardEditor } from "@/components/ListingCardEditors";
import { ListingSizedImage } from "@/components/ListingSizedImage";
import { Button } from "@/components/ui/Button";
import { listProviders } from "@/lib/appointments";
import { type BusinessProfile } from "@/lib/businessProfile";
import { publishedOptionsForEmbed, resolveEmbed } from "@/lib/listingEmbeds";
import { defaultLandingFacilityGroups } from "@/lib/hospitalLandingFacilities";
import { useI18n } from "@/lib/i18n";
import {
  LISTING_SECTION_LABELS,
  emptyEmbedSection,
  emptyLayoutSection,
  enabledSectionsInOrder,
  newSectionId,
  sectionLayoutLabel,
  type ListingColumn,
  type ListingSection,
} from "@/lib/listingPage";

const FIELD =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-[color:var(--pp-primary-950)] placeholder:text-ink-tertiary outline-none focus:border-[color:var(--pp-primary-950)]";
const AREA =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-[color:var(--pp-primary-950)] placeholder:text-ink-tertiary outline-none focus:border-[color:var(--pp-primary-950)]";

export function ListingPageEditor({
  profile,
  onChange,
  live,
  hubPath,
  onPublish,
  onSaveDraft,
  onUnpublish,
}: {
  profile: BusinessProfile;
  onChange: (partial: Partial<BusinessProfile>) => void;
  live: boolean;
  hubPath: string | null;
  onPublish: () => void;
  onSaveDraft: () => void;
  onUnpublish?: () => void;
}) {
  const { tx } = useI18n();
  const [selected, setSelected] = useState<string | "hero" | null>(null);
  const [insertBefore, setInsertBefore] = useState<string | "end" | null>(null);
  const sections = profile.pageSections ?? [];
  const visible = enabledSectionsInOrder(sections);

  const patchSections = (next: ListingSection[]) => onChange({ pageSections: next });

  const updateSection = (id: string, partial: Partial<ListingSection>) => {
    patchSections(sections.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  };

  const move = (id: string, dir: -1 | 1) => {
    const ids = visible.map((s) => s.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const a = sections.findIndex((s) => s.id === ids[i]);
    const b = sections.findIndex((s) => s.id === ids[j]);
    const next = [...sections];
    [next[a], next[b]] = [next[b], next[a]];
    patchSections(next);
  };

  const removeSection = (id: string) => {
    const row = sections.find((s) => s.id === id);
    if (!row) return;
    if (row.kind === "custom") {
      patchSections(sections.filter((s) => s.id !== id));
    } else {
      updateSection(id, { enabled: false });
    }
    setSelected(null);
  };

  const insertPick = (pick: LayoutPick, beforeId?: string) => {
    const incoming =
      pick.type === "embed" ? emptyEmbedSection(pick.kind) : emptyLayoutSection(pick.layout);
    if (!beforeId) {
      patchSections([...sections, incoming]);
      setSelected(incoming.id);
      return;
    }
    const idx = sections.findIndex((s) => s.id === beforeId);
    const next = [...sections];
    next.splice(idx < 0 ? next.length : idx, 0, incoming);
    patchSections(next);
    setSelected(incoming.id);
  };

  const facilities = listProviders().filter(
    (p) =>
      (p.kind === "hospital" || p.kind === "clinic") &&
      p.id &&
      p.id !== profile.publishedId,
  );

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">
            {tx("Public page")}
            <span className="ml-2 text-xs font-medium text-ink-tertiary">
              {live ? tx("Live") : tx("Draft")}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-ink-secondary">
            {tx("Patients see this page. Click a block to enable it — same components as the public profile, booking, and discover views.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hubPath && live ? (
            <Link
              to={hubPath}
              className="px-3 py-2 text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
            >
              {tx("Open live page")} →
            </Link>
          ) : null}
          {live && onUnpublish ? (
            <button
              type="button"
              onClick={onUnpublish}
              className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
            >
              {tx("Unpublish")}
            </button>
          ) : null}
          <Button variant="outline" size="sm" className="!h-10" onClick={onSaveDraft}>
            {tx("Save draft")}
          </Button>
          <Button size="sm" className="!h-10" onClick={onPublish}>
            {live ? tx("Publish changes") : tx("Publish")}
          </Button>
        </div>
      </div>

      {profile.type === "doctor" && facilities.length ? (
        <div className="rounded-2xl border border-line bg-white px-4 py-3">
          <p className="text-sm font-medium text-ink-secondary">{tx("Practises at")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {facilities.map((f) => {
              const id = f.id;
              const on = (profile.affiliatedFacilityIds ?? []).includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    onChange({
                      affiliatedFacilityIds: on
                        ? (profile.affiliatedFacilityIds ?? []).filter((x) => x !== id)
                        : [...(profile.affiliatedFacilityIds ?? []), id],
                    })
                  }
                  className={
                    "rounded-full px-3 py-1.5 text-sm " +
                    (on
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : "border border-line bg-white text-[color:var(--pp-primary-950)]")
                  }
                >
                  {f.city && f.name && !f.name.toLowerCase().includes(f.city.toLowerCase())
                    ? `${f.name} • ${f.city}`
                    : f.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-5">
        <BlockFrame
          selected={selected === "hero"}
          onSelect={() => setSelected("hero")}
          onDone={() => setSelected(null)}
          label={tx("Header")}
        >
          <HeroBlock profile={profile} onChange={onChange} editing={selected === "hero"} />
        </BlockFrame>

        <Inserter onOpen={() => setInsertBefore(visible[0]?.id ?? "end")} />

        {visible.map((section, index) => (
          <div key={section.id}>
            <BlockFrame
              selected={selected === section.id}
              onSelect={() => setSelected(section.id)}
              onDone={() => setSelected(null)}
              label={tx(sectionLayoutLabel(section))}
              onMoveUp={index > 0 ? () => move(section.id, -1) : undefined}
              onMoveDown={index < visible.length - 1 ? () => move(section.id, 1) : undefined}
              onDelete={() => removeSection(section.id)}
            >
              <SectionCanvas
                profile={profile}
                section={section}
                editing={selected === section.id}
                onSection={(partial) => updateSection(section.id, partial)}
                onProfile={onChange}
              />
            </BlockFrame>
            <Inserter onOpen={() => setInsertBefore(visible[index + 1]?.id ?? "end")} />
          </div>
        ))}

        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-tertiary">
            {tx("No sections yet. Use + to choose a layout.")}
          </p>
        ) : null}
      </div>

      <ListingLayoutPicker
        open={insertBefore != null}
        onClose={() => setInsertBefore(null)}
        onPick={(pick) => {
          insertPick(pick, insertBefore === "end" || !insertBefore ? undefined : insertBefore);
          setInsertBefore(null);
        }}
      />
    </div>
  );
}

function BlockFrame({
  selected,
  onSelect,
  onDone,
  label,
  children,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  selected: boolean;
  onSelect: () => void;
  onDone: () => void;
  label: string;
  children: React.ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
}) {
  const { tx } = useI18n();
  return (
    <div
      className={
        "group/block relative " + (selected ? "" : "cursor-pointer")
      }
      onClick={() => {
        if (!selected) onSelect();
      }}
    >
      <div
        className={
          "pointer-events-none absolute inset-0 rounded-[1.5rem] transition " +
          (selected
            ? "ring-2 ring-[color:var(--pp-violet)]"
            : "ring-1 ring-transparent group-hover/block:ring-[color:var(--pp-violet)]/50")
        }
      />
      <div
        className={
          "absolute right-3 top-3 z-10 items-center gap-2 " +
          (selected ? "flex" : "hidden group-hover/block:flex")
        }
      >
        <span
          className={
            "pointer-events-auto rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.12em] " +
            (selected
              ? "bg-[color:var(--pp-primary-950)] text-white"
              : "border border-line bg-white text-ink-tertiary")
          }
        >
          {label}
        </span>
        {selected || onDelete ? (
          <div className="pointer-events-auto flex overflow-hidden rounded-full border border-line bg-white shadow-sm">
            {selected ? (
              <button
                type="button"
                className="h-7 px-2.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
                onClick={(e) => {
                  e.stopPropagation();
                  onDone();
                }}
              >
                {tx("Done")}
              </button>
            ) : null}
            {onDelete ? (
              <>
                <IconBtn label={tx("Move up")} onClick={onMoveUp} disabled={!onMoveUp}>
                  ↑
                </IconBtn>
                <IconBtn label={tx("Move down")} onClick={onMoveDown} disabled={!onMoveDown}>
                  ↓
                </IconBtn>
                <IconBtn label={tx("Remove section")} onClick={onDelete} danger>
                  ×
                </IconBtn>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={selected ? "" : "pointer-events-none"}>{children}</div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={
        "h-8 w-8 text-sm disabled:opacity-30 " +
        (danger ? "text-red-700 hover:bg-red-50" : "text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]")
      }
    >
      {children}
    </button>
  );
}

function Inserter({ onOpen }: { onOpen: () => void }) {
  const { tx } = useI18n();
  return (
    <div className="group relative z-20 flex h-10 items-center justify-center">
      <div className="absolute inset-x-8 top-1/2 h-px bg-transparent group-hover:bg-[color:var(--pp-primary-200)]" />
      <button
        type="button"
        aria-label={tx("Add section")}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className="relative grid h-7 w-7 place-items-center rounded-full border border-dashed border-[color:var(--pp-primary-300)] bg-white text-lg leading-none text-[color:var(--pp-primary-950)] opacity-60 hover:opacity-100 group-hover:opacity-100"
      >
        +
      </button>
    </div>
  );
}

function HeroBlock({
  profile,
  onChange,
  editing,
}: {
  profile: BusinessProfile;
  onChange: (partial: Partial<BusinessProfile>) => void;
  editing: boolean;
}) {
  return (
    <ListingHeroPreview
      profile={profile}
      enable={editing ? { onProfile: onChange, onSection: () => undefined } : undefined}
    />
  );
}

function SectionCanvas({
  profile,
  section,
  editing,
  onSection,
  onProfile,
}: {
  profile: BusinessProfile;
  section: ListingSection;
  editing: boolean;
  onSection: (partial: Partial<ListingSection>) => void;
  onProfile: (partial: Partial<BusinessProfile>) => void;
}) {
  const title = section.title || LISTING_SECTION_LABELS[section.kind];
  const setTitle = (next: string) => onSection({ title: next });
  const enable = editing ? { onProfile, onSection } : undefined;

  if (editing && section.kind === "facilities") {
    const groups =
      section.facilityGroups?.length
        ? section.facilityGroups
        : defaultLandingFacilityGroups(profile.specialisedIn.map((g) => g.specialty));
    return (
      <FacilitiesCardEditor
        title={title}
        onTitle={setTitle}
        groups={groups}
        onChange={(facilityGroups) => onSection({ facilityGroups })}
      />
    );
  }

  if (editing && section.kind === "doctors") {
    return (
      <DoctorsCardEditor
        title={title}
        onTitle={setTitle}
        staff={section.staff ?? []}
        onChange={(staff) => onSection({ staff })}
        excludePublishedId={profile.publishedId}
        ownerId={profile.ownerId}
      />
    );
  }

  if (editing && section.kind === "custom") {
    return (
      <CustomLayoutEditor
        section={section}
        title={title}
        setTitle={setTitle}
        profile={profile}
        onSection={onSection}
        stop={(e) => e.stopPropagation()}
      />
    );
  }

  return <ListingSectionPreview profile={profile} section={section} enable={enable} />;
}

function CtaFields({
  label,
  href,
  onChange,
}: {
  label: string;
  href: string;
  onChange: (partial: { ctaLabel?: string; ctaHref?: string }) => void;
}) {
  const { tx } = useI18n();
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input
        className={FIELD}
        value={label}
        onChange={(e) => onChange({ ctaLabel: e.target.value })}
        placeholder={tx("Button label (optional)")}
      />
      <input
        className={FIELD}
        value={href}
        onChange={(e) => onChange({ ctaHref: e.target.value })}
        placeholder={tx("Link or path, e.g. /appointments")}
      />
    </div>
  );
}

function CustomLayoutEditor({
  section,
  title,
  setTitle,
  profile,
  onSection,
  stop,
}: {
  section: ListingSection;
  title: string;
  setTitle: (title: string) => void;
  profile: BusinessProfile;
  onSection: (partial: Partial<ListingSection>) => void;
  stop: (e: React.MouseEvent) => void;
}) {
  const { tx } = useI18n();
  const layout = section.layout ?? "text";

  if (layout === "embed") {
    if (section.embedKind === "doctor") {
      return (
        <DoctorsCardEditor
          title={title}
          onTitle={setTitle}
          staff={section.staff ?? []}
          onChange={(staff) => onSection({ staff })}
          excludePublishedId={profile.publishedId}
          ownerId={profile.ownerId}
        />
      );
    }
    return (
      <EmbedDirectoryEditor
        section={section}
        title={title}
        setTitle={setTitle}
        excludePublishedId={profile.publishedId}
        onSection={onSection}
        stop={stop}
      />
    );
  }

  if (layout === "imageText") {
    return (
      <DetailSection title={title} onTitleChange={setTitle} lede={tx("Photo beside a short story.")}>
        <div className="space-y-3" onClick={stop}>
          <div className="flex gap-2">
            {(["left", "right"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => onSection({ imageSide: side })}
                className={
                  "rounded-full px-3 py-1.5 text-sm " +
                  ((section.imageSide ?? "left") === side
                    ? "bg-[color:var(--pp-primary-950)] text-white"
                    : "border border-line bg-white text-[color:var(--pp-primary-950)]")
                }
              >
                {side === "left" ? tx("Image left") : tx("Image right")}
              </button>
            ))}
          </div>
          <input
            className={FIELD}
            value={section.imageUrl ?? ""}
            onChange={(e) => onSection({ imageUrl: e.target.value })}
            placeholder={tx("Image URL")}
          />
          {section.imageUrl ? (
            <ListingSizedImage
              src={section.imageUrl}
              size={section.imageSize || "l"}
              editable
              showBadge
              onSize={(imageSize) => onSection({ imageSize })}
            />
          ) : null}
          <textarea
            className={AREA}
            rows={5}
            value={section.customBody ?? ""}
            onChange={(e) => onSection({ customBody: e.target.value })}
            placeholder={tx("What patients should know")}
          />
          <CtaFields
            label={section.ctaLabel ?? ""}
            href={section.ctaHref ?? ""}
            onChange={onSection}
          />
        </div>
      </DetailSection>
    );
  }

  if (layout === "columns") {
    const columns: ListingColumn[] = section.columns?.length
      ? section.columns
      : [0, 1, 2].map((i) => ({ id: `${section.id}-col-${i}`, title: "", blurb: "" }));
    const setColumns = (next: ListingColumn[]) => onSection({ columns: next });
    return (
      <DetailSection title={title} onTitleChange={setTitle} lede={tx("Up to four cards.")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onClick={stop}>
          {columns.map((c, i) => (
            <div key={c.id} className="space-y-2 rounded-xl border border-line p-3">
              <input
                className={FIELD}
                value={c.title}
                onChange={(e) =>
                  setColumns(columns.map((row, j) => (j === i ? { ...row, title: e.target.value } : row)))
                }
                placeholder={tx("Title")}
              />
              <textarea
                className={AREA}
                rows={3}
                value={c.blurb}
                onChange={(e) =>
                  setColumns(columns.map((row, j) => (j === i ? { ...row, blurb: e.target.value } : row)))
                }
                placeholder={tx("Short description")}
              />
              <input
                className={FIELD}
                value={c.imageUrl ?? ""}
                onChange={(e) =>
                  setColumns(columns.map((row, j) => (j === i ? { ...row, imageUrl: e.target.value } : row)))
                }
                placeholder={tx("Image URL (optional)")}
              />
              {c.imageUrl ? (
                <ListingSizedImage
                  src={c.imageUrl}
                  size={c.imageSize || "full"}
                  editable
                  showBadge
                  onSize={(imageSize) =>
                    setColumns(columns.map((row, j) => (j === i ? { ...row, imageSize } : row)))
                  }
                />
              ) : null}
              <button
                type="button"
                className="text-xs text-ink-tertiary"
                onClick={() => setColumns(columns.filter((_, j) => j !== i))}
              >
                {tx("Remove")}
              </button>
            </div>
          ))}
          {columns.length < 4 ? (
            <button
              type="button"
              onClick={() =>
                setColumns([...columns, { id: newSectionId("custom"), title: "", blurb: "" }])
              }
              className="rounded-xl border border-dashed border-[color:var(--pp-primary-300)] bg-white px-4 py-8 text-sm font-medium"
            >
              + {tx("Add column")}
            </button>
          ) : null}
        </div>
      </DetailSection>
    );
  }

  if (layout === "gallery") {
    const photos = section.photos ?? [];
    return (
      <DetailSection title={title} onTitleChange={setTitle}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" onClick={stop}>
          {photos.map((p, i) => (
            <figure key={i} className="overflow-hidden rounded-xl border border-line bg-[color:var(--pp-primary-100)]">
              {p.src ? (
                <ListingSizedImage
                  src={p.src}
                  alt={p.label}
                  size={p.size || "m"}
                  editable
                  showBadge
                  onSize={(size) =>
                    onSection({
                      photos: photos.map((row, j) => (j === i ? { ...row, size } : row)),
                    })
                  }
                />
              ) : (
                <div className="aspect-square bg-[color:var(--pp-primary-200)]" />
              )}
              <div className="space-y-1 p-2">
                <input
                  className={FIELD}
                  value={p.src}
                  onChange={(e) =>
                    onSection({ photos: photos.map((row, j) => (j === i ? { ...row, src: e.target.value } : row)) })
                  }
                  placeholder={tx("Image URL")}
                />
                <input
                  className={FIELD}
                  value={p.label}
                  onChange={(e) =>
                    onSection({ photos: photos.map((row, j) => (j === i ? { ...row, label: e.target.value } : row)) })
                  }
                  placeholder={tx("Label")}
                />
                <button
                  type="button"
                  className="text-xs text-ink-tertiary"
                  onClick={() => onSection({ photos: photos.filter((_, j) => j !== i) })}
                >
                  {tx("Remove")}
                </button>
              </div>
            </figure>
          ))}
          <button
            type="button"
            onClick={() => onSection({ photos: [...photos, { src: "", label: "" }] })}
            className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--pp-primary-300)] bg-white text-sm font-medium"
          >
            + {tx("Add photo")}
          </button>
        </div>
      </DetailSection>
    );
  }

  if (layout === "accordion") {
    const faqs = section.faqs ?? [];
    return (
      <DetailSection title={title} onTitleChange={setTitle} lede={tx("Questions patients can expand.")}>
        <div className="space-y-3" onClick={stop}>
          {faqs.map((f, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-line p-3">
              <input
                className={FIELD}
                value={f.q}
                onChange={(e) =>
                  onSection({ faqs: faqs.map((row, j) => (j === i ? { ...row, q: e.target.value } : row)) })
                }
                placeholder={tx("Question")}
              />
              <textarea
                className={AREA}
                rows={2}
                value={f.a}
                onChange={(e) =>
                  onSection({ faqs: faqs.map((row, j) => (j === i ? { ...row, a: e.target.value } : row)) })
                }
                placeholder={tx("Answer")}
              />
              <button
                type="button"
                className="text-xs text-ink-tertiary"
                onClick={() => onSection({ faqs: faqs.filter((_, j) => j !== i) })}
              >
                {tx("Remove")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-[color:var(--pp-violet)]"
            onClick={() => onSection({ faqs: [...faqs, { q: "", a: "" }] })}
          >
            + {tx("Add question")}
          </button>
        </div>
      </DetailSection>
    );
  }

  if (layout === "map") {
    const placeHint = [profile.address, profile.city].filter(Boolean).join(", ");
    return (
      <DetailSection title={title} onTitleChange={setTitle} lede={tx("Shown on the public page.")}>
        <div className="space-y-3" onClick={stop}>
          <input
            className={FIELD}
            value={section.mapQuery ?? ""}
            onChange={(e) => onSection({ mapQuery: e.target.value })}
            placeholder={placeHint || tx("Address or place name")}
          />
          <textarea
            className={AREA}
            rows={3}
            value={section.customBody ?? ""}
            onChange={(e) => onSection({ customBody: e.target.value })}
            placeholder={tx("How to find us (optional)")}
          />
          <CtaFields
            label={section.ctaLabel ?? ""}
            href={section.ctaHref ?? ""}
            onChange={onSection}
          />
        </div>
      </DetailSection>
    );
  }

  return (
    <DetailSection title={title} onTitleChange={setTitle}>
      <div className="space-y-3" onClick={stop}>
        <textarea
          className={AREA}
          rows={5}
          value={section.customBody ?? ""}
          onChange={(e) => onSection({ customBody: e.target.value })}
          placeholder={tx("What patients should know")}
        />
        <CtaFields
          label={section.ctaLabel ?? ""}
          href={section.ctaHref ?? ""}
          onChange={onSection}
        />
      </div>
    </DetailSection>
  );
}

function EmbedDirectoryEditor({
  section,
  title,
  setTitle,
  excludePublishedId,
  onSection,
  stop,
}: {
  section: ListingSection;
  title: string;
  setTitle: (title: string) => void;
  excludePublishedId?: string;
  onSection: (partial: Partial<ListingSection>) => void;
  stop: (e: React.MouseEvent) => void;
}) {
  const { tx } = useI18n();
  const [q, setQ] = useState("");
  const kind = section.embedKind || "doctor";
  const embeds = section.embeds ?? [];
  const options = publishedOptionsForEmbed(kind, excludePublishedId).filter(
    (o) =>
      !embeds.some((e) => e.refId === o.refId) &&
      (!q.trim() || `${o.name} ${o.subtitle}`.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <DetailSection
      title={title}
      onTitleChange={setTitle}
      lede={tx("Add listings that already exist. You cannot change their name or registration.")}
    >
      <div className="space-y-3" onClick={stop}>
        <div className="grid gap-3 sm:grid-cols-2">
          {embeds.map((e) => {
            const card = resolveEmbed(e, kind);
            if (!card) return null;
            return (
              <div key={e.id} className="rounded-xl border border-line p-3">
                <p className="text-sm font-semibold">{card.name}</p>
                {card.subtitle ? <p className="mt-0.5 text-xs text-ink-tertiary">{card.subtitle}</p> : null}
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-ink-tertiary">{tx("Read only")}</p>
                <input
                  className={FIELD + " mt-2"}
                  value={e.ctaLabel ?? ""}
                  onChange={(ev) =>
                    onSection({
                      embeds: embeds.map((row) =>
                        row.id === e.id ? { ...row, ctaLabel: ev.target.value } : row,
                      ),
                    })
                  }
                  placeholder={tx("Button label (optional)")}
                />
                <input
                  className={FIELD + " mt-2"}
                  value={e.ctaHref ?? ""}
                  onChange={(ev) =>
                    onSection({
                      embeds: embeds.map((row) =>
                        row.id === e.id ? { ...row, ctaHref: ev.target.value } : row,
                      ),
                    })
                  }
                  placeholder={tx("Override link (optional)")}
                />
                <button
                  type="button"
                  className="mt-2 text-xs text-ink-tertiary"
                  onClick={() => onSection({ embeds: embeds.filter((row) => row.id !== e.id) })}
                >
                  {tx("Remove")}
                </button>
              </div>
            );
          })}
        </div>
        <input
          className={FIELD}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tx("Search to add")}
        />
        <ul className="max-h-48 overflow-y-auto rounded-xl border border-line">
          {options.slice(0, 20).map((o) => (
            <li key={o.refId} className="border-b border-line last:border-0">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[color:var(--state-hover)]"
                onClick={() =>
                  onSection({
                    embeds: [...embeds, { id: newSectionId("custom"), refId: o.refId }],
                  })
                }
              >
                <span>
                  <span className="block text-sm font-medium">{o.name}</span>
                  <span className="block text-xs text-ink-tertiary">{o.subtitle}</span>
                </span>
                <span className="text-sm text-[color:var(--pp-violet)]">+ {tx("Add")}</span>
              </button>
            </li>
          ))}
          {!options.length ? (
            <li className="px-3 py-4 text-sm text-ink-tertiary">{tx("Nothing else to add.")}</li>
          ) : null}
        </ul>
        <CtaFields
          label={section.ctaLabel ?? ""}
          href={section.ctaHref ?? ""}
          onChange={onSection}
        />
      </div>
    </DetailSection>
  );
}
