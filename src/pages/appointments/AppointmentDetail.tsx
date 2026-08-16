import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { DIRECTORY_SIDEBAR_CARD } from "@/components/DirectoryDetailLayout";
import { DirectorySidebarMap } from "@/components/MapEmbed";
import { FaqAccordion } from "@/components/FaqAccordion";
import { RelatedHealthcareOptions } from "@/components/RelatedHealthcareOptions";
import { DoctorArticlesSection, DoctorRelatedCard } from "@/components/doctor/DoctorDetailExtras";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import {
  DEMO_FINDINGS,
  DEMO_REPORTS,
  formatFee,
  getAppointment,
  getProvider,
  updateAppointmentStatus,
  type Appointment,
} from "@/lib/appointments";
import {
  canCancelVisit,
  canJoinVirtual,
  clinicKindLabel,
  downloadVisitIcs,
  formatVisitWhen,
  healthTips,
  knowledgeArticles,
  loadPrepChecked,
  mapsQueryForVisit,
  nextSteps,
  phaseLabel,
  phaseLede,
  questionsToAsk,
  rebookHref,
  receiptHref,
  relatedConditions,
  savePrepChecked,
  similarProviders,
  visitCountdown,
  visitDisclaimer,
  visitEmergencyNote,
  visitFaqs,
  visitPhase,
  visitTypeLabel,
  whatToBring,
  type VisitPhase,
} from "@/lib/appointmentGuide";
import { conditionHref, providerProfileHref } from "@/lib/doctorProfileContent";
import { mapsDirectionsUrl } from "@/lib/hospitalProfileContent";

export function AppointmentDetail() {
  const { tx } = useI18n();
  const { id } = useParams();
  const [tick, setTick] = useState(0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);

  const appointment = useMemo(() => getAppointment(id), [id, tick]);

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setConfirmCancel(false);
  }, [id]);

  useEffect(() => {
    if (!confirmCancel) return;
    keepRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmCancel(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmCancel]);

  if (!appointment) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Visit not found")}</p>
        <Link
          to="/appointments"
          className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
        >
          {tx("Back to appointments")}
        </Link>
      </div>
    );
  }

  const a = appointment;
  const provider = getProvider(a.providerId);
  const phase = visitPhase(a);

  const cancel = () => {
    updateAppointmentStatus(a.id, "cancelled");
    setConfirmCancel(false);
    setTick((n) => n + 1);
  };

  return (
    <div>
      <Link
        to="/appointments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        ← {tx("Appointments")}
      </Link>

      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 space-y-8">
          <VisitHero a={a} phase={phase} providerName={provider?.name} />

          <div className="lg:hidden">
            <VisitSidebar
              a={a}
              phase={phase}
              confirmCancel={confirmCancel}
              keepRef={keepRef}
              onCancelAsk={() => setConfirmCancel(true)}
              onCancelKeep={() => setConfirmCancel(false)}
              onCancel={cancel}
            />
          </div>

          <NextStepsCard a={a} phase={phase} />
          <PrepChecklist a={a} />
          <VisitFacts a={a} />
          <HealthTipsBlock specialtyId={a.specialtyId} />
          <SharedRecords a={a} />
          {provider ? <DoctorArticlesSection provider={provider} /> : null}
          <KnowledgeBase a={a} />
          <QuestionsBlock specialtyId={a.specialtyId} />
          <FaqAccordion items={visitFaqs(a, phase)} />
          <NearbyCare a={a} />
        </div>

        <aside className="hidden w-full shrink-0 lg:sticky lg:top-28 lg:block lg:w-80">
          <VisitSidebar
            a={a}
            phase={phase}
            confirmCancel={confirmCancel}
            keepRef={keepRef}
            onCancelAsk={() => setConfirmCancel(true)}
            onCancelKeep={() => setConfirmCancel(false)}
            onCancel={cancel}
          />
        </aside>
      </div>
    </div>
  );
}

function VisitHero({
  a,
  phase,
  providerName,
}: {
  a: Appointment;
  phase: VisitPhase;
  providerName?: string;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const name = providerName || a.clinicianName || a.providerName;
  const countdown = visitCountdown(a, phase);
  const join = canJoinVirtual(a, phase);
  const showDirections =
    a.visitType === "clinic" && (phase === "today" || phase === "starting-soon" || phase === "in-progress");
  const provider = getProvider(a.providerId);
  const query = mapsQueryForVisit(a, provider);

  return (
    <header className="overflow-hidden rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)]">
      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-center gap-2">
          <PhasePill phase={phase} />
          <p className="font-mono text-2xs text-ink-tertiary">{a.confirmationNo}</p>
          {countdown ? (
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
              {tx(countdown)}
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] sm:text-4xl">
          {tx("Visit with {name}").replace("{name}", name)}
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          {formatVisitWhen(a.date, a.time)}
          <span className="mx-2 text-ink-tertiary/50">·</span>
          {tx(visitTypeLabel(a.visitType))}
          <span className="mx-2 text-ink-tertiary/50">·</span>
          {tx(a.specialtyLabel)}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-secondary">{tx(phaseLede(a, phase))}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {join ? (
            <Button size="sm" onClick={() => nav("/messages")}>
              {tx("Join virtual visit")}
            </Button>
          ) : null}
          {showDirections && query ? (
            <Button size="sm" onClick={() => window.open(mapsDirectionsUrl(query), "_blank", "noreferrer")}>
              {tx("Get directions")}
            </Button>
          ) : null}
          {phase === "cancelled" || phase === "missed" || phase === "completed" ? (
            <Button size="sm" onClick={() => nav(rebookHref(a))}>
              {tx(phase === "completed" ? "Book follow-up" : "Rebook this clinician")}
            </Button>
          ) : null}
          <Button size="sm" variant={join || showDirections ? "secondary" : "primary"} onClick={() => nav("/messages")}>
            {tx("Message care team")}
          </Button>
        </div>
      </div>
    </header>
  );
}

function PhasePill({ phase }: { phase: VisitPhase }) {
  const { tx } = useI18n();
  const tone =
    phase === "cancelled" || phase === "missed"
      ? "bg-white text-ink-secondary"
      : phase === "completed"
        ? "bg-white text-ink-tertiary"
        : "bg-wellness-subtle text-wellness";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-2xs font-semibold ${tone}`}>
      {tx(phaseLabel(phase))}
    </span>
  );
}

function NextStepsCard({ a, phase }: { a: Appointment; phase: VisitPhase }) {
  const { tx } = useI18n();
  const steps = nextSteps(a, phase);
  return (
    <section>
      <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("What to do next")}
      </h2>
      <ol className="mt-4 space-y-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-2xl border border-line bg-white px-5 py-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-sm font-semibold text-[color:var(--pp-primary-950)] tnum">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx(step.title)}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{tx(step.detail)}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-2xl border border-line bg-white px-5 py-3 text-sm leading-relaxed text-ink-secondary">
        {tx(visitEmergencyNote())}
      </p>
    </section>
  );
}

function PrepChecklist({ a }: { a: Appointment }) {
  const { tx } = useI18n();
  const items = whatToBring(a);
  const [checked, setChecked] = useState<string[]>(() => loadPrepChecked(a.id));

  useEffect(() => {
    setChecked(loadPrepChecked(a.id));
  }, [a.id]);

  if (!items.length) return null;

  const toggle = (item: string) => {
    setChecked((cur) => {
      const next = cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item];
      savePrepChecked(a.id, next);
      return next;
    });
  };

  const done = items.filter((item) => checked.includes(item)).length;

  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("What to bring")}
        </h2>
        <p className="text-sm text-ink-tertiary tnum">
          {tx("{done} of {total} ready")
            .replace("{done}", String(done))
            .replace("{total}", String(items.length))}
        </p>
      </div>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {items.map((item) => {
          const on = checked.includes(item);
          return (
            <li key={item}>
              <label className="flex cursor-pointer items-start gap-3 px-5 py-3.5">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(item)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-[color:var(--pp-violet)]"
                />
                <span
                  className={
                    "text-sm leading-relaxed " +
                    (on ? "text-ink-tertiary line-through" : "text-[color:var(--pp-primary-950)]")
                  }
                >
                  {tx(item)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function VisitFacts({ a }: { a: Appointment }) {
  const { tx } = useI18n();
  const rows: { k: string; v: string }[] = [
    { k: tx("Confirmation"), v: a.confirmationNo },
    { k: tx("Date & time"), v: formatVisitWhen(a.date, a.time) },
    { k: tx("Visit type"), v: tx(visitTypeLabel(a.visitType)) },
    { k: tx("Specialisation"), v: tx(a.specialtyLabel) },
    { k: tx("Patient"), v: a.patientName },
    { k: tx("For"), v: tx(a.patientRelation) },
  ];
  if (a.contact) rows.push({ k: tx("Contact"), v: a.contact });
  if (a.clinicName) rows.push({ k: tx("Clinic"), v: a.clinicName });
  if (a.clinicAddress) rows.push({ k: tx("Address"), v: a.clinicAddress });
  if (a.fee != null) rows.push({ k: tx("Consultation fee"), v: formatFee(a.fee) });

  return (
    <section>
      <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Visit details")}
      </h2>
      <dl className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {rows.map((row, i) => (
          <div
            key={row.k}
            className={"flex justify-between gap-4 px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}
          >
            <dt className="shrink-0 text-sm text-ink-tertiary">{row.k}</dt>
            <dd className="max-w-[65%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">{row.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HealthTipsBlock({ specialtyId }: { specialtyId: Appointment["specialtyId"] }) {
  const { tx } = useI18n();
  const tips = healthTips(specialtyId);
  if (!tips.length) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Health tips before you go")}
      </h2>
      <p className="mt-1 text-sm text-ink-tertiary">{tx(visitDisclaimer())}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {tips.map((tip) => (
          <article key={tip.title} className="rounded-2xl border border-line bg-white p-5">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx(tip.title)}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{tx(tip.body)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SharedRecords({ a }: { a: Appointment }) {
  const { tx } = useI18n();
  const notes = (a.notes ?? "").trim();
  const symptoms = (a.symptoms ?? "").trim();
  const reports = (a.reportIds ?? [])
    .map((rid) => DEMO_REPORTS.find((r) => r.id === rid))
    .filter((r): r is (typeof DEMO_REPORTS)[number] => Boolean(r));
  const findings = (a.findingIds ?? [])
    .map((fid) => DEMO_FINDINGS.find((f) => f.id === fid))
    .filter((f): f is (typeof DEMO_FINDINGS)[number] => Boolean(f));

  if (!notes && !symptoms && !reports.length && !findings.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("What you shared")}
      </h2>
      {symptoms ? (
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Symptoms")}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--pp-primary-950)]">
            {symptoms}
          </p>
        </div>
      ) : null}
      {notes ? (
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Notes")}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--pp-primary-950)]">{notes}</p>
        </div>
      ) : null}
      {reports.length ? (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{r.title}</p>
              <p className="mt-0.5 text-sm text-ink-tertiary">
                {r.detail}
                <span className="mx-2 text-ink-tertiary/50">·</span>
                {r.date}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {findings.length ? (
        <ul className="space-y-2">
          {findings.map((f) => (
            <li key={f.id} className="rounded-2xl border border-line bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{f.title}</p>
              <p className="mt-0.5 text-sm text-ink-tertiary">{f.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function KnowledgeBase({ a }: { a: Appointment }) {
  const { tx } = useI18n();
  const articles = knowledgeArticles(a.specialtyId, a.visitType);
  const provider = getProvider(a.providerId);
  const conditions = relatedConditions(provider, a.specialtyId);

  if (!articles.length && !conditions.length) return null;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Knowledge base")}
        </h2>
        <p className="mt-1 text-sm text-ink-tertiary">
          {tx("Read these before the consult so you can take useful steps — and ask better questions.")}
        </p>
      </div>

      {articles.length ? (
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleReader key={article.slug} article={article} />
          ))}
        </div>
      ) : null}

      {conditions.length ? (
        <div>
          <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Related topics")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {conditions.map((c) => (
              <Link
                key={c}
                to={conditionHref(c)}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-[color:var(--pp-primary-950)] hover:border-[color:var(--pp-violet)]"
              >
                {tx(c)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ArticleReader({
  article,
}: {
  article: ReturnType<typeof knowledgeArticles>[number];
}) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <article
      className={
        "overflow-hidden rounded-2xl border bg-white " +
        (open ? "border-[color:var(--pp-violet)]" : "border-line")
      }
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 p-5 text-left"
        aria-expanded={open}
      >
        {article.imageUrl ? (
          <img src={article.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
            {tx("{n} min read").replace("{n}", String(article.minutes))}
          </span>
          <span className="mt-1 block font-semibold text-[color:var(--pp-primary-950)]">{tx(article.title)}</span>
          <span className="mt-1 block text-sm text-ink-tertiary">{tx(article.blurb)}</span>
        </span>
        <span className="mt-1 text-sm font-medium text-[color:var(--pp-violet)]">
          {open ? tx("Close") : tx("Read")}
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-line px-5 py-4">
          {article.paragraphs.map((p) => (
            <p key={p.slice(0, 48)} className="text-sm leading-relaxed text-ink-secondary">
              {tx(p)}
            </p>
          ))}
          <p className="text-xs text-ink-tertiary">{tx(visitDisclaimer())}</p>
        </div>
      ) : null}
    </article>
  );
}

function QuestionsBlock({ specialtyId }: { specialtyId: Appointment["specialtyId"] }) {
  const { tx } = useI18n();
  const items = questionsToAsk(specialtyId);
  if (!items.length) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Questions worth asking")}
      </h2>
      <p className="mt-1 text-sm text-ink-tertiary">
        {tx("Take these into the consult. Cross out any that do not apply.")}
      </p>
      <ol className="mt-4 space-y-2">
        {items.map((q, i) => (
          <li key={q} className="flex gap-3 rounded-2xl border border-line bg-white px-5 py-4">
            <span className="text-sm font-semibold text-ink-tertiary tnum">{i + 1}.</span>
            <p className="text-sm leading-relaxed text-[color:var(--pp-primary-950)]">{tx(q)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function NearbyCare({ a }: { a: Appointment }) {
  const { tx } = useI18n();
  const provider = getProvider(a.providerId);
  const similar = similarProviders(a);
  const phase = visitPhase(a);
  const showSimilar = similar.length > 0 && (phase === "cancelled" || phase === "missed");

  return (
    <div className="space-y-10">
      {showSimilar ? (
        <section>
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("Other clinicians in this specialisation")}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <DoctorRelatedCard key={p.id} item={p} />
            ))}
          </div>
        </section>
      ) : null}
      <RelatedHealthcareOptions city={provider?.city} excludeId={provider?.id} />
      <p className="text-center text-sm">
        <Link to="/appointments" className="font-medium text-[color:var(--pp-violet)] hover:opacity-70">
          {tx("Browse all care")} →
        </Link>
      </p>
    </div>
  );
}

function VisitSidebar({
  a,
  phase,
  confirmCancel,
  keepRef,
  onCancelAsk,
  onCancelKeep,
  onCancel,
}: {
  a: Appointment;
  phase: VisitPhase;
  confirmCancel: boolean;
  keepRef: Ref<HTMLButtonElement>;
  onCancelAsk: () => void;
  onCancelKeep: () => void;
  onCancel: () => void;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const provider = getProvider(a.providerId);
  const name = a.clinicianName || a.providerName;
  const profileHref = provider ? providerProfileHref(provider) : null;
  const query = a.visitType === "clinic" ? mapsQueryForVisit(a, provider) : "";
  const join = canJoinVirtual(a, phase);
  const cancellable = canCancelVisit(phase);

  return (
    <div className="space-y-3">
      <div className={DIRECTORY_SIDEBAR_CARD}>
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx(clinicKindLabel(a))}</p>
        <div className="mt-3 flex gap-3">
          {provider?.imageUrl ? (
            <img
              src={provider.imageUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-2xl object-cover object-top"
            />
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[color:var(--pp-primary-100)] text-sm font-semibold text-[color:var(--pp-primary-950)]">
              {name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 self-center">
            <p className="font-semibold text-[color:var(--pp-primary-950)]">{name}</p>
            <p className="mt-0.5 truncate text-sm text-ink-tertiary">{tx(a.specialtyLabel)}</p>
          </div>
        </div>
        {profileHref ? (
          <Link
            to={profileHref}
            className="mt-3 inline-flex text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
          >
            {tx("View profile")} →
          </Link>
        ) : null}

        <div className="mt-5 space-y-2">
          {join ? (
            <Button fullWidth onClick={() => nav("/messages")}>
              {tx("Join virtual visit")}
            </Button>
          ) : null}
          {query ? (
            <Button
              fullWidth
              variant={join ? "secondary" : "primary"}
              onClick={() => window.open(mapsDirectionsUrl(query), "_blank", "noreferrer")}
            >
              {tx("Get directions")}
            </Button>
          ) : null}
          <Button fullWidth variant="secondary" onClick={() => nav("/messages")}>
            {tx("Message care team")}
          </Button>
          {phase === "cancelled" || phase === "missed" || phase === "completed" ? (
            <Button fullWidth variant="ghost" onClick={() => nav(rebookHref(a))}>
              {tx(phase === "completed" ? "Book follow-up" : "Rebook")}
            </Button>
          ) : (
            <Button fullWidth variant="ghost" onClick={() => downloadVisitIcs(a, provider)}>
              {tx("Add to calendar")}
            </Button>
          )}
        </div>
      </div>

      {a.fee != null ? (
        <div className={DIRECTORY_SIDEBAR_CARD}>
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Payment")}</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-sm text-ink-secondary">{tx("Consultation")}</span>
            <span className="font-display text-2xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
              {formatFee(a.fee)}
            </span>
          </div>
          <p className="mt-3 text-xs text-ink-tertiary">{tx("Demo checkout — no real payment is processed.")}</p>
          <Link
            to={receiptHref(a.id)}
            className="mt-3 inline-flex text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
          >
            {tx("Download receipt")} →
          </Link>
        </div>
      ) : (
        <div className={DIRECTORY_SIDEBAR_CARD}>
          <Link
            to={receiptHref(a.id)}
            className="inline-flex text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
          >
            {tx("Download visit summary")} →
          </Link>
        </div>
      )}

      {query ? <DirectorySidebarMap query={query} /> : null}

      {cancellable ? (
        <div className={DIRECTORY_SIDEBAR_CARD}>
          {confirmCancel ? (
            <div>
              <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Cancel this visit?")}</p>
              <p className="mt-1 text-sm text-ink-tertiary">
                {tx("You can rebook the same clinician afterwards.")}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button ref={keepRef} fullWidth variant="secondary" onClick={onCancelKeep}>
                  {tx("Keep visit")}
                </Button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-center text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-70"
                >
                  {tx("Yes, cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onCancelAsk}
              className="w-full text-center text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-70"
            >
              {tx("Cancel appointment")}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AppointmentReceipt() {
  const { tx } = useI18n();
  const { id } = useParams();
  const a = getAppointment(id);
  if (!a) {
    return (
      <div className="min-h-screen bg-surface-0 p-10 text-center">
        <p className="text-lg font-semibold text-ink">{tx("Visit not found")}</p>
        <Link to="/appointments" className="mt-2 inline-block font-semibold text-primary hover:underline">
          {tx("Back to appointments")}
        </Link>
      </div>
    );
  }

  const provider = getProvider(a.providerId);
  const name = a.clinicianName || a.providerName;

  return (
    <div className="min-h-screen bg-surface-0 print:bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-line bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            to={`/appointments/visit/${a.id}`}
            className="text-sm font-semibold text-ink-secondary hover:text-ink"
          >
            ← {tx("Back to visit")}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center rounded-full bg-cta px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-cta-hover"
          >
            {tx("Download / Print receipt")}
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8 print:p-0">
        <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-stone-900 shadow-card print:rounded-none print:border-0 print:shadow-none sm:p-10">
          <div className="flex items-start justify-between">
            <Logo animate={false} className="text-[#4E2A84]" />
            <div className="text-right">
              <p className="text-xl font-medium text-stone-900">{tx("Visit receipt")}</p>
              <p className="text-sm text-stone-500">{a.confirmationNo}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
            <span className="font-semibold text-emerald-700">{tx(phaseLabel(visitPhase(a)))}</span>
            <span className="text-sm text-emerald-700">{formatVisitWhen(a.date, a.time)}</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-stone-500">{tx("Patient")}</p>
              <p className="font-medium text-stone-900">{a.patientName}</p>
              <p className="text-stone-600">{tx(a.patientRelation)}</p>
            </div>
            <div className="text-right">
              <p className="text-stone-500">{tx(clinicKindLabel(a))}</p>
              <p className="font-medium text-stone-900">{name}</p>
              <p className="text-stone-600">{tx(a.specialtyLabel)}</p>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-500">
                <th className="py-2 font-medium">{tx("Item")}</th>
                <th className="py-2 text-right font-medium">{tx("Amount")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stone-100">
                <td className="py-3">
                  {tx(visitTypeLabel(a.visitType))}
                  <span className="block text-stone-500">{tx(a.specialtyLabel)}</span>
                </td>
                <td className="py-3 text-right tnum">{formatFee(a.fee ?? 0)}</td>
              </tr>
            </tbody>
          </table>

          {a.clinicAddress || provider?.address ? (
            <p className="mt-6 text-sm text-stone-600">
              {a.clinicName || provider?.name}
              <br />
              {a.clinicAddress || provider?.address}
            </p>
          ) : (
            <p className="mt-6 text-sm text-stone-600">{tx("Virtual visit via PocketPills Messages")}</p>
          )}

          <p className="mt-8 text-xs leading-relaxed text-stone-500">
            {tx("Demo receipt — no real payment was processed. This is not a tax invoice.")}
          </p>
        </div>
      </div>
    </div>
  );
}
