import { useEffect, useMemo, useRef, useState } from "react";
import { DetailSection, DetailMeta } from "@/components/DetailSection";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Badge, ConfirmModal, Modal, Tooltip } from "@/components/ui";
import { DIRECTORY_SIDEBAR_CARD } from "@/components/DirectoryDetailLayout";
import { DirectorySidebarMap } from "@/components/MapEmbed";
import { ChipGroup } from "@/components/care/PrepChoices";
import { STRUCTURED_PREP_IDS, StructuredPrepBody } from "@/components/care/PrepEditorFields";
import { FaqAccordion } from "@/components/FaqAccordion";
import { RelatedHealthcareOptions } from "@/components/RelatedHealthcareOptions";
import { useI18n } from "@/lib/i18n";
import { useShellColumn } from "@/lib/columnHover";
import { DEMO_REPORTS } from "@/lib/appointments";
import {
  acceptCareSlot,
  careTabsFor,
  careTab,
  careTabLocked,
  unlockAfterLabel,
  cancelCareEvent,
  completeCareEvent,
  loadJourneyPrep,
  resolveCareEvent,
  saveJourneyPrep,
  type AftercareItem,
  type CareKind,
  type CareTab,
  type CareEvent,
  type CareLine,
  type PrepItem,
} from "@/lib/careJourney";

export function CareJourneyPage({ kind }: { kind: CareKind }) {
  const { id } = useParams();
  const { tx } = useI18n();
  const [tick, setTick] = useState(0);
  const event = useMemo(() => resolveCareEvent(kind, id), [kind, id, tick]);

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 30_000);
    const bump = () => setTick((n) => n + 1);
    window.addEventListener("storage", bump);
    window.addEventListener("focus", bump);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("storage", bump);
      window.removeEventListener("focus", bump);
    };
  }, []);

  if (!event) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Details not found")}</p>
        <Link to="/appointments" className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Back to appointments")}
        </Link>
      </div>
    );
  }

  return <JourneyView event={event} onChanged={() => setTick((n) => n + 1)} />;
}

function JourneyView({ event, onChanged }: { event: CareEvent; onChanged: () => void }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const mainCol = useShellColumn("main");
  const railCol = useShellColumn("rail");
  const [tab, setTab] = useState<CareTab>("overview");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [doc, setDoc] = useState<AftercareItem | null>(null);
  const [warnOpen, setWarnOpen] = useState(false);
  const [urgentStuck, setUrgentStuck] = useState(false);
  const faqRef = useRef<HTMLDivElement>(null);
  const tabs = careTabsFor(event.line);
  const pre = event.stage === "pre";
  const cancelCta = cancelLabelFor(event.line);

  useEffect(() => {
    if (!careTabsFor(event.line).some((t) => t.id === tab)) setTab("overview");
  }, [event.id, event.line, tab]);

  useEffect(() => {
    if (!pre) {
      setUrgentStuck(false);
      return;
    }
    const el = faqRef.current;
    if (!el) return;

    const update = () => {
      setUrgentStuck(el.getBoundingClientRect().top <= window.innerHeight - 64);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const io = new IntersectionObserver(update, { root: null, threshold: [0, 0.05, 0.25, 1] });
    io.observe(el);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      io.disconnect();
    };
  }, [pre, event.id]);

  const onCancel = () => {
    cancelCareEvent(event);
    setCancelOpen(false);
    onChanged();
  };

  const onComplete = () => {
    completeCareEvent(event);
    onChanged();
  };

  return (
    <div className={pre && urgentStuck ? "pb-14" : undefined}>
      <div className="flex items-center justify-between gap-3">
        <Link
          to={event.backTo}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
        >
          ← {tx(event.backLabel)}
        </Link>
        <span className="truncate text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("Patient details")}</span>
        <span className="w-16" />
      </div>

      <Hero event={event} />

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(16rem,20rem)]">
        <div
          className={"min-w-0 lg:col-span-1 xl:col-span-2 " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          <TabBar tabs={tabs} tab={tab} onTab={setTab} />

          {tab === "overview" ? (
            <Overview
              event={event}
              onTab={setTab}
              onComplete={onComplete}
              onChanged={onChanged}
            />
          ) : null}
          {tab === "notes" ? <NotesPane event={event} /> : null}
          {tab === "prescription" ? (
            <RecordPane event={event} tab="prescription" item={event.prescription} onOpen={setDoc} />
          ) : null}
          {tab === "reports" ? <ReportsPane event={event} /> : null}
          {tab === "follow-up" ? (
            <RecordPane event={event} tab="follow-up" item={event.followUp} onOpen={setDoc} />
          ) : null}
        </div>

        <aside
          className={"space-y-4 lg:sticky lg:top-28 " + railCol.className}
          onMouseEnter={railCol.onMouseEnter}
        >
          <ProviderCard event={event} onCancel={() => setCancelOpen(true)} cancelCta={cancelCta} />
          {event.mapsQuery ? <DirectorySidebarMap query={event.mapsQuery} /> : null}
        </aside>
      </div>

      <div ref={faqRef} id="care-faq" className="mt-10">
        <FaqAccordion items={event.faqs} />
      </div>
      <div className="mt-10">
        <RelatedHealthcareOptions
          city={event.city}
          excludeId={event.excludeRelatedId}
          only={event.relatedOnly}
        />
      </div>

      {pre ? (
        <UrgentBar
          visible={urgentStuck}
          note={event.emergencyNote}
          onSigns={() => setWarnOpen(true)}
          onEmergency={() => nav("/appointments/services/svc-ambulance")}
        />
      ) : null}

      <ConfirmModal
        open={cancelOpen}
        title={tx(event.cancelTitle)}
        body={tx(event.cancelBody)}
        confirmLabel={tx("Yes, cancel")}
        cancelLabel={tx("Keep")}
        danger
        onConfirm={onCancel}
        onClose={() => setCancelOpen(false)}
      />
      <Modal open={Boolean(doc)} title={doc ? tx(doc.title) : ""} onClose={() => setDoc(null)}>
        {doc ? <p className="whitespace-pre-wrap">{tx(doc.body)}</p> : null}
        <p className="mt-3 text-xs text-ink-tertiary">{tx(event.disclaimer)}</p>
      </Modal>
      <Modal
        open={warnOpen}
        title={tx("Warning signs")}
        onClose={() => setWarnOpen(false)}
        footer={
          <Button size="sm" onClick={() => nav("/appointments/services/svc-ambulance")}>
            {tx("Emergency contact")}
          </Button>
        }
      >
        <p>{tx(event.emergencyNote)}</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {event.warningSigns.map((s) => (
            <li key={s} className="rounded-xl bg-[color:var(--pp-primary-100)] px-3 py-2 text-sm font-medium text-[color:var(--pp-primary-950)]">
              {tx(s)}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function cancelLabelFor(line: CareLine): string {
  if (line === "pharmacy" || line === "refill" || line === "transfer") return "Cancel order";
  if (line === "ambulance" || line === "urgent" || line === "oxygen" || line === "crisis" || line === "courier" || line === "nurseline") {
    return "Cancel request";
  }
  return "Cancel appointment";
}

function prepHeading(line: CareLine): string {
  if (line === "pharmacy" || line === "refill" || line === "transfer") return "Before it arrives";
  if (line === "courier") return "Before the courier arrives";
  if (line === "oxygen") return "Before delivery";
  if (line === "ambulance") return "While we dispatch";
  if (line === "crisis") return "While we connect";
  if (line === "nurseline") return "Before the call";
  if (line === "urgent") return "Before you go";
  if (line === "inward") return "Before admission";
  if (line === "surgery") return "Before surgery";
  return "Visit preparation";
}

function afterHeading(line: CareLine): string {
  if (line === "pharmacy" || line === "refill" || line === "transfer" || line === "courier") return "After it arrives";
  if (line === "oxygen") return "After delivery";
  if (line === "ambulance" || line === "urgent") return "After this request";
  if (line === "crisis") return "After this call";
  if (line === "nurseline") return "After the call";
  if (line === "inward") return "After discharge";
  if (line === "surgery") return "After your procedure";
  return "After your visit";
}

function Hero({ event }: { event: CareEvent }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const awaiting = Boolean(event.awaiting);
  const issue = event.issue;
  const tone =
    issue?.kind === "unavailable"
      ? "warning"
      : issue?.kind === "not_attempted"
        ? "warning"
        : event.stage === "cancelled"
          ? "neutral"
          : event.stage === "post"
            ? "info"
            : awaiting
              ? "info"
              : "wellness";

  return (
    <header className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
      <div className="px-5 py-6 text-center sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Badge tone={tone}>{tx(event.statusLabel)}</Badge>
          <span
            className="inline-flex items-center gap-1.5 font-mono text-xs font-medium tracking-wide text-ink-tertiary"
            aria-label={tx("Booking ID")}
          >
            <span className="pp-caps text-ink-tertiary/80">{tx("ID")}</span>
            {event.confirmationNo}
          </span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] sm:text-4xl">
          {tx(event.headline)}
        </h1>
        {awaiting || issue ? (
          <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-secondary">{tx(event.lede)}</p>
        ) : (
          <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-secondary">
            {event.providerName}
            <span className="mx-2 text-ink-tertiary/50">·</span>
            {event.whenLabel}
            <span className="mx-2 text-ink-tertiary/50">·</span>
            {tx(event.visitTypeLabel)}
          </p>
        )}
        {event.canJoin ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button size="sm" onClick={() => nav("/messages")}>
              {tx("Join virtual visit")}
            </Button>
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
        {event.heroFacts.map((row) => (
          <Fact key={row.k} k={tx(row.k)} v={row.v} />
        ))}
      </div>
    </header>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-line px-3 py-3 text-center sm:border-l sm:first:border-l-0 sm:px-4">
      <p className="text-2xs text-ink-tertiary">{k}</p>
      <p className="mt-1 text-sm font-semibold text-[color:var(--pp-primary-950)]">{v}</p>
    </div>
  );
}

function TabBar({
  tabs,
  tab,
  onTab,
}: {
  tabs: ReturnType<typeof careTabsFor>;
  tab: CareTab;
  onTab: (t: CareTab) => void;
}) {
  const { tx } = useI18n();
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label={tx("Visit sections")}>
      {tabs.map((t, i) => {
        const on = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onTab(t.id)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
              onTab(tabs[next].id);
            }}
            className={
              "relative shrink-0 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide " +
              (on ? "text-[color:var(--pp-primary-950)]" : "text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
            }
          >
            {tx(t.label)}
            {on ? <span className="absolute inset-x-3 -bottom-px h-0.5 bg-[color:var(--pp-primary-950)]" /> : null}
          </button>
        );
      })}
    </div>
  );
}

function Overview({
  event,
  onTab,
  onComplete,
  onChanged,
}: {
  event: CareEvent;
  onTab: (t: CareTab) => void;
  onComplete: () => void;
  onChanged: () => void;
}) {
  if (event.issue) {
    return (
      <div className="space-y-8">
        <IssuePanel event={event} onChanged={onChanged} />
        {event.helpful.length ? <HelpfulCard event={event} /> : null}
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {event.track ? <TrackCard event={event} /> : null}
      <PrepCard event={event} />
      <AftercareCard event={event} onTab={onTab} onComplete={onComplete} />
      {event.stage === "pre" ? <HelpfulCard event={event} /> : null}
    </div>
  );
}

function IssuePanel({ event, onChanged }: { event: CareEvent; onChanged: () => void }) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const issue = event.issue;
  if (!issue) return null;
  const pick = (date: string, time: string) => {
    acceptCareSlot(event, date, time);
    onChanged();
  };
  return (
    <DetailSection
      title={tx(issue.title)}
      meta={<DetailMeta>{tx(issue.kind === "cancelled" ? "Cancelled" : issue.kind === "not_attempted" ? "Not attempted" : "New slot needed")}</DetailMeta>}
    >
      <p className="text-sm leading-relaxed text-ink-secondary">{tx(issue.body)}</p>
      {event.offeredSlots?.length ? (
        <div className="mt-4">
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Next openings")}</p>
          <ul className="mt-2 space-y-2">
            {event.offeredSlots.map((s) => (
              <li key={`${s.date}-${s.time}`}>
                <button
                  type="button"
                  onClick={() => pick(s.date, s.time)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left hover:border-[color:var(--pp-violet)]"
                >
                  <span className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{s.label}</span>
                  <span className="text-sm font-medium text-[color:var(--pp-violet)]">{tx("Confirm this slot")}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {event.rebookHref ? (
          <Button size="sm" onClick={() => nav(event.rebookHref!)}>
            {tx(issue.kind === "cancelled" ? "Rebook" : "See all times")}
          </Button>
        ) : null}
        <Button size="sm" variant="secondary" onClick={() => nav(event.messageHref)}>
          {tx("Message care team")}
        </Button>
      </div>
    </DetailSection>
  );
}

function TrackCard({ event }: { event: CareEvent }) {
  const { tx } = useI18n();
  if (!event.track) return null;
  return (
    <DetailSection title={tx("Status")}>
      <ol className="space-y-3">
        {event.track.steps.map((step, i) => {
          const done = i <= event.track!.current && event.stage !== "cancelled";
          return (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span
                className={
                  "grid h-5 w-5 place-items-center rounded-full text-2xs font-bold " +
                  (done ? "bg-wellness text-white" : "border border-line text-ink-tertiary")
                }
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={done ? "text-[color:var(--pp-primary-950)]" : "text-ink-tertiary"}>{tx(step)}</span>
            </li>
          );
        })}
      </ol>
    </DetailSection>
  );
}

function PrepCard({ event }: { event: CareEvent }) {
  const { tx } = useI18n();
  const [values, setValues] = useState<Record<string, string>>(() => loadJourneyPrep(event.id));
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setValues(loadJourneyPrep(event.id));
    setOpenId(null);
  }, [event.id]);

  if (event.stage !== "pre" || !event.prep.length) return null;

  const displayOf = (item: PrepItem) => prepDisplayValue(item.id, values, event);
  const done = event.prep.filter((p) => displayOf(p).trim()).length;
  const active = event.prep.find((p) => p.id === openId) ?? null;

  const persistItem = (id: string, next: string) => {
    setValues((cur) => {
      const valuesNext = { ...cur, [id]: next.trim() };
      saveJourneyPrep(event.id, valuesNext);
      return valuesNext;
    });
  };

  const saveItem = (id: string, next: string) => {
    persistItem(id, next);
    setOpenId(null);
  };

  return (
    <DetailSection
      title={tx(prepHeading(event.line))}
      meta={
        <DetailMeta>
          {done} {tx("of")} {event.prep.length} {tx("ready")}
        </DetailMeta>
      }
      flush
    >
      <ul className="divide-y divide-line">
        {event.prep.map((item) => {
          const added = Boolean(displayOf(item).trim());
          const detail = prepDetail(item, displayOf(item));
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(item.id)}
                className="flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-[color:var(--state-hover)]"
              >
                <PrepMark on={added} />
                <span className="min-w-0 flex-1">
                  <span
                    className={
                      "block text-sm font-semibold " +
                      (added ? "text-[color:var(--pp-primary-950)]" : "text-ink-tertiary")
                    }
                  >
                    {tx(item.title)}
                  </span>
                  <span
                    className={
                      "mt-0.5 block text-sm leading-snug whitespace-normal break-words " +
                      (added ? "text-[color:var(--pp-violet)]" : "text-ink-tertiary")
                    }
                  >
                    {tx(detail)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {active ? (
        <PrepEditor
          item={active}
          event={event}
          value={displayOf(active)}
          guide={event.prepGuide ?? []}
          onSave={(next) => saveItem(active.id, next)}
          onClose={() => {
            if (active.id === "questions") persistItem("questions", displayOf(active).trim() || "reviewed");
            setOpenId(null);
          }}
        />
      ) : null}
    </DetailSection>
  );
}

function PrepMark({ on }: { on: boolean }) {
  return (
    <span
      className={
        "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-2xs font-bold " +
        (on ? "bg-[color:var(--pp-violet)] text-white" : "border-2 border-line bg-white text-transparent")
      }
      aria-hidden
    >
      ✓
    </span>
  );
}

function prepDisplayValue(id: string, stored: Record<string, string>, event: CareEvent): string {
  if (Object.prototype.hasOwnProperty.call(stored, id)) return stored[id];
  if (id === "story") return [event.symptoms, event.notes].filter((s) => s?.trim()).join("\n\n");
  if (id === "docs" && event.reports.length) return event.reports.map((r) => r.title).join("\n");
  return "";
}

function prepLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

const MEDS_READY = ["List is on my phone", "I'll bring the bottles"] as const;

function prepDetail(item: PrepItem, value: string): string {
  const lines = prepLines(value);
  if (!lines.length) return item.hint;
  if (item.id === "meds") {
    const named = lines.filter((l) => !(MEDS_READY as readonly string[]).includes(l));
    if (named.length) {
      return `${named.length} ${named.length === 1 ? "medicine" : "medicines"} added`;
    }
    return lines.join(" · ");
  }
  if (item.id === "docs") return `${lines.length} ${lines.length === 1 ? "document" : "documents"} added`;
  if (item.id === "questions") return "Guide reviewed";
  return lines.join(" · ");
}

function PrepEditor({
  item,
  event,
  value,
  guide,
  onSave,
  onClose,
}: {
  item: PrepItem;
  event: CareEvent;
  value: string;
  guide: { title: string; items: { q: string; why: string }[] }[];
  onSave: (next: string) => void;
  onClose: () => void;
}) {
  const { tx } = useI18n();
  const isDocs = item.id === "docs";
  const isList = item.id === "meds";
  const isQuestions = item.id === "questions";
  const [draft, setDraft] = useState(value);
  const [picked, setPicked] = useState<string[]>([]);
  const [uploads, setUploads] = useState<string[]>([]);
  const [lineDraft, setLineDraft] = useState("");
  const [dragging, setDragging] = useState(false);
  const [openTopic, setOpenTopic] = useState(0);

  useEffect(() => {
    const lines = prepLines(value);
    if (isDocs) {
      const ids: string[] = [];
      const files: string[] = [];
      for (const line of lines) {
        if (line.startsWith("file:")) files.push(line.slice(5));
        else {
          const hit = DEMO_REPORTS.find((r) => r.title === line);
          if (hit) ids.push(hit.id);
          else files.push(line);
        }
      }
      setPicked(ids);
      setUploads(files);
      setDraft(value);
    } else {
      setDraft(value);
      setPicked([]);
      setUploads([]);
    }
    setLineDraft("");
    setOpenTopic(0);
  }, [item.id, value, isDocs]);

  const lines = prepLines(draft);
  const namedMeds = lines.filter((l) => !(MEDS_READY as readonly string[]).includes(l));
  const readyMeds = lines.filter((l) => (MEDS_READY as readonly string[]).includes(l));

  const commit = () => {
    if (isDocs) {
      const titles = picked.flatMap((id) => {
        const t = DEMO_REPORTS.find((r) => r.id === id)?.title;
        return t ? [t] : [];
      });
      const files = uploads.map((name) => `file:${name}`);
      onSave([...files, ...titles].join("\n"));
      return;
    }
    onSave(draft);
  };

  const addLine = () => {
    const next = lineDraft.trim();
    if (!next) return;
    setDraft((cur) => (cur.trim() ? `${cur.trim()}\n${next}` : next));
    setLineDraft("");
  };

  const takeFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const names = Array.from(list)
      .filter((f) => /pdf|image|jpeg|jpg|png|heic|webp/i.test(f.type || f.name))
      .map((f) => f.name);
    if (!names.length) return;
    setUploads((cur) => [...cur, ...names.filter((n) => !cur.includes(n))]);
  };

  return (
    <Modal
      open
      title={tx(item.title)}
      onClose={onClose}
      footer={
        isQuestions ? undefined : (
          <>
            <Button size="sm" variant="secondary" onClick={onClose}>
              {tx("Cancel")}
            </Button>
            <Button size="sm" onClick={commit}>
              {tx("Save")}
            </Button>
          </>
        )
      }
    >
      <p className="mb-3 text-sm text-ink-tertiary">{tx(prepEditorLede(item.id))}</p>
      {isQuestions ? (
        <AskGuideAccordion topics={guide.length ? guide : DEFAULT_PREP_GUIDE} open={openTopic} onOpen={setOpenTopic} />
      ) : isDocs ? (
        <div className="space-y-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              takeFiles(e.dataTransfer.files);
            }}
            className={
              "flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 text-center " +
              (dragging ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)]" : "border-line bg-white")
            }
          >
            <input
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/png,image/heic,image/webp,.pdf,.jpg,.jpeg,.png,.heic"
              className="sr-only"
              onChange={(e) => {
                takeFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <span className="text-sm font-semibold text-[color:var(--pp-primary-950)]">
              {tx("Upload files")}
            </span>
            <span className="mt-1 text-xs text-ink-tertiary">
              {tx("Drop PDF, JPG, or PNG here, or tap to browse")}
            </span>
          </label>
          {uploads.length ? (
            <ul className="overflow-hidden rounded-xl border border-line">
              {uploads.map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-3 border-b border-line px-3 py-2.5 last:border-0"
                >
                  <span className="min-w-0 truncate text-sm text-[color:var(--pp-primary-950)]">{name}</span>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-ink-tertiary hover:text-danger"
                    onClick={() => setUploads((cur) => cur.filter((n) => n !== name))}
                  >
                    {tx("Remove")}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {tx("Already on file")}
            </p>
            <ul className="overflow-hidden rounded-xl border border-line">
              {DEMO_REPORTS.map((r) => {
                const on = picked.includes(r.id);
                return (
                  <li key={r.id} className="border-b border-line last:border-0">
                    <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          setPicked((cur) => (on ? cur.filter((id) => id !== r.id) : [...cur, r.id]))
                        }
                        className="mt-0.5 h-4 w-4 rounded border-line text-[color:var(--pp-violet)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">
                          {tx(r.title)}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-tertiary">{r.detail}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : isList ? (
        <div className="space-y-3">
          <ChipGroup
            options={MEDS_READY}
            selected={readyMeds}
            multiple
            onChange={(next) => setDraft([...next, ...namedMeds].join("\n"))}
          />
          {namedMeds.length ? (
            <ul className="overflow-hidden rounded-xl border border-line">
              {namedMeds.map((line, i) => (
                <li
                  key={`${line}-${i}`}
                  className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 last:border-0"
                >
                  <span className="min-w-0 text-sm text-[color:var(--pp-primary-950)]">{line}</span>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-ink-tertiary hover:text-danger"
                    onClick={() => setDraft([...readyMeds, ...namedMeds.filter((_, j) => j !== i)].join("\n"))}
                  >
                    {tx("Remove")}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-3 py-4 text-sm text-ink-tertiary">
              {tx("Tap a chip above, or add a name if you want it written here.")}
            </p>
          )}
          <div className="flex gap-2">
            <input
              value={lineDraft}
              onChange={(e) => setLineDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLine();
                }
              }}
              className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
              placeholder={tx("Medicine and dose")}
            />
            <Button size="sm" variant="secondary" type="button" onClick={addLine} disabled={!lineDraft.trim()}>
              {tx("Add to list")}
            </Button>
          </div>
        </div>
      ) : STRUCTURED_PREP_IDS.has(item.id) ? (
        <StructuredPrepBody
          item={item}
          line={event.line}
          locationLabel={event.locationLabel}
          draft={draft}
          setDraft={setDraft}
        />
      ) : (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
          placeholder={tx("Add a short note…")}
        />
      )}
    </Modal>
  );
}

const DEFAULT_PREP_GUIDE = [
  {
    title: "The visit plan",
    items: [
      {
        q: "What is the next step after today — test, medicine, or watchful waiting?",
        why: "You should leave knowing exactly what happens next.",
      },
    ],
  },
];

function AskGuideAccordion({
  topics,
  open,
  onOpen,
}: {
  topics: { title: string; items: { q: string; why: string }[] }[];
  open: number;
  onOpen: (i: number) => void;
}) {
  const { tx } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      {topics.map((topic, i) => {
        const isOpen = open === i;
        return (
          <div
            key={topic.title}
            className={
              "overflow-hidden rounded-xl border " +
              (isOpen ? "border-[color:var(--pp-violet)]" : "border-line")
            }
          >
            <button
              type="button"
              onClick={() => onOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(topic.title)}</span>
              <span className="text-ink-tertiary" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <ul className="space-y-3 border-t border-line px-3.5 py-3">
                {topic.items.map((p) => (
                  <li key={p.q}>
                    <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(p.q)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-tertiary">{tx(p.why)}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function prepEditorLede(id: string): string {
  if (id === "story") return "Tap when it started and how it feels. A one-line note is optional.";
  if (id === "meds") return "Confirm with a tap, or add a name if you want it written here.";
  if (id === "docs") return "Upload a file from this device, or attach a report already on file.";
  if (id === "questions") return "For you only — open a topic. Nothing here is sent to the clinic.";
  if (id === "oxygen") return "Tap what you use now so they can set flow without guessing.";
  if (id === "access") return "Tap what they will find at the door.";
  if (id === "phone") return "Confirm this phone is on, or give a different number.";
  if (id === "place") return "Share where you are, or type it and check the map.";
  if (id === "contact") return "Optional. Used only if they cannot reach you.";
  if (id === "address") return "Share your location or type an address, then check the map.";
  if (id === "fast") return "Tap whether this visit needs fasting.";
  if (id === "id") return "Tap what you will have ready. A photo on your phone is enough.";
  if (id === "ride") return "Day procedures usually need someone to take you home.";
  if (id === "space") return "Tap what is ready in the room.";
  if (id === "supplies") return "Tap what is already on site.";
  if (id === "plan") return "Tap how this fill will be paid.";
  if (id === "bag") return "Tap what you are packing.";
  return "Saved on this request. Demo only — not sent to a real clinic.";
}

function AftercareCard({
  event,
  onTab,
  onComplete,
}: {
  event: CareEvent;
  onTab: (t: CareTab) => void;
  onComplete: () => void;
}) {
  const { tx } = useI18n();
  const links = careTabsFor(event.line).filter((t) => t.id !== "overview");
  const anyLocked = links.some((t) => careTabLocked(event.line, t.id, event.stage));
  return (
    <DetailSection
      title={tx(afterHeading(event.line))}
      meta={
        anyLocked ? (
          <span className="flex items-center gap-3">
            <DetailMeta>{tx(unlockAfterLabel(event.line))}</DetailMeta>
            {!event.awaiting ? (
              <Tooltip label={tx("Demo: unlock aftercare without waiting for the calendar")}>
                <button
                  type="button"
                  onClick={onComplete}
                  className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)] hover:opacity-70"
                >
                  {tx("Preview")}
                </button>
              </Tooltip>
            ) : null}
          </span>
        ) : (
          <DetailMeta>{tx("Open a tab")}</DetailMeta>
        )
      }
    >
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={tx(afterHeading(event.line))}>
        {links.map((t) => {
          const locked = careTabLocked(event.line, t.id, event.stage);
          return (
            <button
              key={t.id}
              type="button"
              disabled={locked}
              aria-label={locked ? `${tx(t.label)} — ${tx(unlockAfterLabel(event.line))}` : undefined}
              onClick={() => onTab(t.id)}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium " +
                (locked
                  ? "cursor-not-allowed bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-900)] disabled:opacity-100"
                  : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] hover:opacity-80")
              }
            >
              {tx(t.label)}
              {locked ? <LockIcon /> : null}
            </button>
          );
        })}
      </div>
    </DetailSection>
  );
}

function HelpfulCard({ event }: { event: CareEvent }) {
  const { tx } = useI18n();
  if (!event.helpful.length) return null;
  return (
    <DetailSection
      title={tx(
        event.line === "pharmacy" || event.line === "refill" || event.line === "transfer"
          ? "Helpful while you wait"
          : event.line === "ambulance" || event.line === "urgent" || event.line === "oxygen" || event.line === "courier"
            ? "While we dispatch"
            : event.line === "crisis" || event.line === "nurseline"
              ? "While we connect"
              : "Helpful before your visit",
      )}
      flush
    >
      <ul className="divide-y divide-line">
        {event.helpful.slice(0, 3).map((h) => (
          <li key={h.title} className="px-5 py-3.5">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(h.title)}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-secondary">{tx(h.body)}</p>
          </li>
        ))}
      </ul>
    </DetailSection>
  );
}

function NotesPane({ event }: { event: CareEvent }) {
  const { tx } = useI18n();
  const copy = careTab("notes", event.line);
  const hasBooking = Boolean(event.notes?.trim() || event.symptoms?.trim());
  const clinician = event.stage === "post" ? event.summary : undefined;
  return (
    <DetailSection
      title={tx(copy.label)}
      meta={
        <DetailMeta>{tx(event.stage === "post" ? "This request" : "From booking")}</DetailMeta>
      }
    >
      {hasBooking ? (
        <div className="space-y-4">
          {event.symptoms ? (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Symptoms")}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--pp-primary-950)]">
                {event.symptoms}
              </p>
            </div>
          ) : null}
          {event.notes ? (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("You wrote")}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--pp-primary-950)]">
                {event.notes}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-ink-secondary">
          {tx("Nothing was written at booking. Add a note under {section} on Overview.")
            .replace("{section}", tx(prepHeading(event.line)))}
        </p>
      )}
      {clinician ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Clinician note")}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--pp-primary-950)]">
            {tx(clinician.body)}
          </p>
        </div>
      ) : event.stage !== "post" ? (
        <p className="mt-4 border-t border-line pt-4 text-sm text-ink-tertiary">{tx(copy.hint)}</p>
      ) : null}
    </DetailSection>
  );
}

function ReportsPane({ event }: { event: CareEvent }) {
  const { tx } = useI18n();
  const copy = careTab("reports", event.line);
  const empty = !event.reports.length && !event.findings.length;
  return (
    <DetailSection title={tx(copy.label)} meta={<DetailMeta>{tx("This visit")}</DetailMeta>} flush={!empty}>
      {empty ? (
        <p className="text-sm text-ink-secondary">{tx(copy.hint)}</p>
      ) : (
        <ul className="divide-y divide-line">
          {event.reports.map((r) => (
            <li key={r.id} className="px-5 py-3.5">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(r.title)}</p>
              <p className="mt-0.5 text-sm text-ink-tertiary">{r.detail}</p>
            </li>
          ))}
          {event.findings.map((f) => (
            <li key={f.id} className="px-5 py-3.5">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(f.title)}</p>
              <p className="mt-0.5 text-sm text-ink-tertiary">{f.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}

function RecordPane({
  event,
  tab,
  item,
  onOpen,
}: {
  event: CareEvent;
  tab: CareTab;
  item?: AftercareItem;
  onOpen: (item: AftercareItem) => void;
}) {
  const { tx } = useI18n();
  const copy = careTab(tab, event.line);
  const locked = careTabLocked(event.line, tab, event.stage);
  return (
    <DetailSection
      title={tx(copy.label)}
      meta={<DetailMeta>{tx(locked ? unlockAfterLabel(event.line) : "Ready")}</DetailMeta>}
    >
      {locked ? (
        <p className="text-sm text-ink-secondary">{tx(copy.hint)}</p>
      ) : item ? (
        <button type="button" onClick={() => onOpen(item)} className="w-full text-left">
          <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(item.title)}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{tx(item.body)}</p>
          <p className="mt-3 text-sm font-medium text-[color:var(--pp-violet)]">{tx("Open")}</p>
        </button>
      ) : (
        <p className="text-sm text-ink-secondary">{tx("Nothing on this visit yet.")}</p>
      )}
    </DetailSection>
  );
}

function ProviderCard({
  event,
  onCancel,
  cancelCta,
}: {
  event: CareEvent;
  onCancel: () => void;
  cancelCta: string;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  return (
    <div className={DIRECTORY_SIDEBAR_CARD}>
      <div className="flex gap-3">
        {event.providerImage ? (
          <img src={event.providerImage} alt="" className="h-16 w-16 rounded-2xl object-cover object-top" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[color:var(--pp-primary-100)] text-sm font-semibold text-[color:var(--pp-primary-950)]">
            {event.providerName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 self-center">
          <p className="font-semibold text-[color:var(--pp-primary-950)]">{event.providerName}</p>
          <p className="mt-0.5 text-sm text-ink-tertiary">{tx(event.credentials)}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat k={tx("Patients")} v={event.stats.patients} />
        <Stat k={tx("Years")} v={event.stats.years} />
        <Stat k={tx("Rating")} v={event.stats.rating} />
      </dl>
      <div className="mt-4 space-y-2">
        <Button fullWidth size="sm" onClick={() => nav(event.messageHref)}>
          {tx("Message care team")}
        </Button>
        {event.canCancel ? (
          <Button fullWidth size="sm" variant="ghost" onClick={onCancel}>
            {tx(cancelCta)}
          </Button>
        ) : event.rebookHref ? (
          <Button fullWidth size="sm" variant="ghost" onClick={() => nav(event.rebookHref!)}>
            {tx("Book follow-up")}
          </Button>
        ) : null}
        {event.receiptHref ? (
          <Button fullWidth size="sm" variant="secondary" onClick={() => nav(event.receiptHref!)}>
            {tx("View receipt")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-2xs text-ink-tertiary">{k}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-[color:var(--pp-primary-950)]">{v}</dd>
    </div>
  );
}

function UrgentBar({
  visible,
  note,
  onSigns,
  onEmergency,
}: {
  visible: boolean;
  note: string;
  onSigns: () => void;
  onEmergency: () => void;
}) {
  const { tx } = useI18n();

  useEffect(() => {
    document.body.toggleAttribute("data-urgent-bar", visible);
    window.dispatchEvent(new Event("pp-urgent-bar"));
    return () => {
      document.body.removeAttribute("data-urgent-bar");
      window.dispatchEvent(new Event("pp-urgent-bar"));
    };
  }, [visible]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="status"
      aria-hidden={!visible}
      className={
        "fixed inset-x-0 bottom-0 z-[60] w-screen max-w-[100vw] " +
        "transition-transform duration-300 ease-out " +
        (visible ? "translate-y-0" : "pointer-events-none translate-y-full")
      }
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-3 bg-[color:var(--error-900)] px-5 py-2.5 text-white md:px-8 xl:px-20">
        <p className="min-w-0 flex-1 text-xs leading-snug sm:text-sm">
          <span className="font-semibold">{tx("Urgent symptoms notice")}: </span>
          {tx(note)}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            tabIndex={visible ? 0 : -1}
            onClick={onSigns}
            className="rounded-full bg-white/15 px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide hover:bg-white/25"
          >
            {tx("View warning signs")}
          </button>
          <button
            type="button"
            tabIndex={visible ? 0 : -1}
            onClick={onEmergency}
            className="rounded-full bg-[color:var(--error-700)] px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide hover:opacity-90"
          >
            {tx("Emergency contact")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
      <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  );
}

