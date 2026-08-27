import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CheckoutOffers, useOfferQuote } from "@/components/offers/CheckoutOffers";
import { consultQuote, formatMoney, payableDue, serviceQuote } from "@/lib/bookingQuote";
import { useI18n } from "@/lib/i18n";
import { formatFee, type VisitType } from "@/lib/appointments";
import type { CheckoutContext } from "@/lib/offers";
import { addCalendarDays, isPastDate, isSlotInPast, monthDayShort, todayIso } from "@/lib/timeSlots";
import verifiedBadge from "../../../icons/verified badge.svg";
import { ReportThumb } from "@/components/records/ReportThumb";

const NOTES_MAX = 400;
const LIST_CAP = 8;

export type ReviewPatient = {
  id: string;
  name: string;
  relation: string;
  badge?: string;
};

export type ReviewReport = {
  id: string;
  title: string;
  detail: string;
  source: "library" | "upload" | "lab";
  previewSrc?: string;
};

export type ReviewFinding = {
  id: string;
  title: string;
  detail: string;
};

export function BookingReviewSidebar({
  doctorName,
  doctorImage,
  credentials,
  verified = true,
  visitType,
  fee,
  date,
  time,
  patient,
  reports,
  onRemoveReport,
  findings,
  onRemoveFinding,
  symptoms,
  onSymptoms,
  notes,
  onNotes,
  onConfirm,
  confirmDisabled,
  confirmHint: confirmHintProp,
  nextSlots = [],
  onPickSlot,
  offerContext,
  quoteKind = "consult",
  feeLabel,
  visitKindLabel,
  slotLabel: slotLabelProp,
  confirmLabel,
  lede,
}: {
  doctorName: string;
  doctorImage: string;
  credentials: string;
  verified?: boolean;
  visitType?: VisitType | null;
  locationLabel?: string;
  fee: number;
  date: string;
  time: string;
  patient: ReviewPatient | null;
  reports: ReviewReport[];
  onRemoveReport: (id: string) => void;
  findings: ReviewFinding[];
  onRemoveFinding: (id: string) => void;
  symptoms: string;
  onSymptoms: (value: string) => void;
  notes: string;
  onNotes: (value: string) => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmHint?: string;
  nextSlots?: { date: string; time: string }[];
  onPickSlot?: (date: string, time: string) => void;
  offerContext?: CheckoutContext;
  quoteKind?: "consult" | "service";
  feeLabel?: string;
  visitKindLabel?: string;
  slotLabel?: string;
  confirmLabel?: string;
  lede?: string;
}) {
  const { tx } = useI18n();
  const quote = quoteKind === "service" ? serviceQuote(fee) : consultQuote(fee);
  const offerQuote = useOfferQuote(
    offerContext ?? { kind: quoteKind === "service" ? "service" : "consult", amount: quote.beforeOffer },
  );
  const slotPast = Boolean(date && time) && (isPastDate(date) || isSlotInPast(date, time));
  const noPatient = !patient;
  const canConfirm = !noPatient && !slotPast && !confirmDisabled;
  const due = payableDue(quote.beforeOffer, offerQuote.credit);
  const visitKind =
    visitKindLabel ||
    (visitType === "virtual" ? tx("Virtual") : visitType === "clinic" ? tx("In clinic") : "");
  const slotLabel = slotLabelProp || (date && time ? `${time} - ${date}` : tx("Pick a time"));

  let confirmHint = confirmHintProp ?? "";
  if (!confirmHint) {
    if (noPatient) confirmHint = tx("Add a patient on the left to continue.");
    else if (slotPast) confirmHint = tx("This time is no longer available. Pick a next slot below.");
    else if (confirmDisabled) confirmHint = tx("Choose a payment option on the left to continue.");
  }

  return (
    <aside className="w-full min-w-0 space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-28 lg:self-start">
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-start justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Your visit")}
            </h2>
            <p className="mt-1 text-sm text-ink-tertiary">{lede ? tx(lede) : tx("Confirm, then send the request.")}</p>
          </div>
          {visitKind ? (
            <span className="shrink-0 rounded-full bg-[color:var(--pp-primary-100)] px-2.5 py-1 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
              {visitKind}
            </span>
          ) : null}
        </div>

        <div className="border-t border-line px-5 py-4">
          <ProviderBlock name={doctorName} imageUrl={doctorImage} credentials={credentials} verified={verified} />
        </div>

        <dl>
          <FactRow
            label={tx("Time slot")}
            value={slotLabel}
            muted={slotPast || !(date && time)}
            strike={slotPast}
          />
          <FactRow
            label={tx("Patient")}
            value={patient ? patient.name : tx("Choose a patient")}
            muted={!patient}
          />
        </dl>

        <div className="px-5">
          <VisitNotes
            symptoms={symptoms}
            onSymptoms={onSymptoms}
            notes={notes}
            onNotes={onNotes}
          />
        </div>

        {slotPast ? (
          <div role="status" className="border-t border-line bg-[color:var(--pp-primary-100)] px-5 py-3">
            <p className="text-sm text-[color:var(--pp-primary-950)]">
              {tx("This time is no longer available. Pick a next slot below.")}
            </p>
            {nextSlots.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {nextSlots.map((s) => (
                  <button
                    key={`${s.date}-${s.time}`}
                    type="button"
                    onClick={() => onPickSlot?.(s.date, s.time)}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--pp-primary-950)] hover:border-[color:var(--pp-primary-950)]"
                  >
                    {nextSlotLabel(s.date, s.time, tx)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-ink-tertiary">
                {tx("No later slots this week. Message the care team for help.")}
              </p>
            )}
          </div>
        ) : null}

        <div className="border-t border-line">
          <AttachAccordion title={tx("Reports")} count={reports.length}>
            {reports.slice(0, LIST_CAP).map((r, i) => (
              <AttachRow key={r.id} index={i + 1} title={r.title} previewSrc={r.previewSrc} onRemove={() => onRemoveReport(r.id)} />
            ))}
            {reports.length > LIST_CAP ? (
              <li className="px-5 py-1.5 text-2xs text-ink-tertiary">
                +{reports.length - LIST_CAP} {tx("more")}
              </li>
            ) : null}
          </AttachAccordion>
          <AttachAccordion title={tx("Findings")} count={findings.length}>
            {findings.slice(0, LIST_CAP).map((f, i) => (
              <AttachRow key={f.id} index={i + 1} title={f.title} onRemove={() => onRemoveFinding(f.id)} />
            ))}
            {findings.length > LIST_CAP ? (
              <li className="px-5 py-1.5 text-2xs text-ink-tertiary">
                +{findings.length - LIST_CAP} {tx("more")}
              </li>
            ) : null}
          </AttachAccordion>
        </div>

        <div className="border-t border-line px-5 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("You pay")}</p>
              <p className="mt-1 font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                {due <= 0 ? formatFee(0) : formatMoney(due)}
              </p>
            </div>
            <PriceToggle
              rows={[
                [tx(feeLabel || (quoteKind === "service" ? "Service fee" : "Consultation fee")), formatMoney(quote.consultation), false],
                quote.convenience > 0 ? [tx("Convenience fee"), formatMoney(quote.convenience), false] : null,
                quote.insurance > 0
                  ? [tx("Insurance ({pct}%)").replace("{pct}", String(quote.insurancePct)), `−${formatMoney(quote.insurance)}`, true]
                  : null,
                offerQuote.credit > 0 ? [tx("Offer"), `−${formatMoney(offerQuote.credit)}`, true] : null,
              ].filter(Boolean) as [string, string, boolean][]}
            />
          </div>
          <Button
            fullWidth
            className="mt-4"
            onClick={onConfirm}
            disabled={!canConfirm}
            title={canConfirm ? undefined : confirmHint || undefined}
          >
            {tx(confirmLabel || "Pay & send request")}
          </Button>
          {canConfirm ? null : <p className="mt-2 text-center text-xs text-ink-tertiary">{confirmHint}</p>}
        </div>
      </section>

      {offerContext ? <CheckoutOffers context={offerContext} /> : null}

      <p className="px-1 text-center text-2xs leading-relaxed text-ink-tertiary">
        {tx("Demo booking — no real visit is scheduled with a clinic.")}
      </p>
    </aside>
  );
}

function nextSlotLabel(date: string, time: string, tx: (s: string) => string) {
  const today = todayIso();
  const tomorrow = addCalendarDays(today, 1);
  const day = date === today ? tx("Today") : date === tomorrow ? tx("Tomorrow") : monthDayShort(date);
  return `${day} · ${time}`;
}

function ProviderBlock({
  name,
  imageUrl,
  credentials,
  verified,
}: {
  name: string;
  imageUrl: string;
  credentials: string;
  verified: boolean;
}) {
  const [broken, setBroken] = useState(!imageUrl);
  const initial = name.trim().charAt(0) || "D";

  return (
    <div className="flex items-center gap-3.5">
      {!broken ? (
        <img
          src={imageUrl}
          alt=""
          onError={() => setBroken(true)}
          className="h-14 w-14 shrink-0 rounded-full object-cover object-[center_20%]"
        />
      ) : (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-sm font-semibold text-[color:var(--pp-primary-950)]">
          {initial}
        </span>
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-semibold leading-snug text-[color:var(--pp-primary-950)]">
          <span className="truncate" title={name}>
            {name}
          </span>
          {verified ? <img src={verifiedBadge} alt="" className="h-3.5 w-3.5 shrink-0" /> : null}
        </p>
        {credentials ? (
          <p className="mt-0.5 truncate text-sm text-ink-tertiary" title={credentials}>
            {credentials}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FactRow({
  label,
  value,
  muted,
  strike,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strike?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line px-5 py-2.5">
      <dt className="shrink-0 text-sm text-ink-tertiary">{label}</dt>
      <dd
        className={
          "min-w-0 text-right text-sm font-medium leading-snug " +
          (muted ? "text-ink-tertiary" : "text-[color:var(--pp-primary-950)]") +
          (strike ? " line-through" : "")
        }
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function VisitNotes({
  symptoms,
  onSymptoms,
  notes,
  onNotes,
}: {
  symptoms: string;
  onSymptoms: (value: string) => void;
  notes: string;
  onNotes: (value: string) => void;
}) {
  const { tx } = useI18n();
  const value = notes || symptoms;
  const [active, setActive] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  const settleRef = useRef<number>(0);
  valueRef.current = value;
  const settled = !active && value.trim().length > 0;

  const clearSettle = () => {
    window.clearTimeout(settleRef.current);
  };

  const armSettle = () => {
    clearSettle();
    settleRef.current = window.setTimeout(() => {
      if (!valueRef.current.trim()) return;
      setActive(false);
    }, 3000);
  };

  useEffect(() => () => clearSettle(), []);

  const wake = () => {
    clearSettle();
    setActive(true);
    if (valueRef.current.trim()) armSettle();
  };

  const setValue = (next: string) => {
    const clipped = next.slice(0, NOTES_MAX);
    onNotes(clipped);
    if (symptoms) onSymptoms("");
    setActive(true);
    armSettle();
  };

  const fieldText =
    "col-start-1 row-start-1 min-w-0 w-full max-w-full whitespace-pre-wrap break-all [overflow-wrap:anywhere] text-xs font-normal leading-relaxed text-[color:var(--pp-primary-950)]";

  return (
    <div
      className={
        "mb-4 min-w-0 max-w-full overflow-hidden rounded-lg " +
        "transition-[background-color,padding] duration-300 ease-out motion-reduce:transition-none " +
        (settled
          ? "bg-[color:var(--pp-primary-100)] px-3 py-2.5"
          : "bg-transparent px-0 py-2")
      }
      onPointerDown={wake}
      onClick={() => fieldRef.current?.focus()}
    >
      <div className="grid min-w-0">
        <textarea
          ref={fieldRef}
          value={value}
          rows={1}
          onChange={(e) => setValue(e.target.value)}
          onFocus={wake}
          onKeyDown={wake}
          onBlur={() => {
            clearSettle();
            setActive(false);
          }}
          placeholder={tx("Describe your symptoms (optional)")}
          maxLength={NOTES_MAX}
          className={
            fieldText +
            " h-full resize-none overflow-hidden bg-transparent p-0 outline-none placeholder:truncate placeholder:whitespace-nowrap placeholder:italic placeholder:text-ink-tertiary/55"
          }
        />
        <span aria-hidden className={fieldText + " invisible pointer-events-none"}>
          {value || "\u00A0"}
        </span>
      </div>
    </div>
  );
}

function AttachAccordion({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-line first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-5 py-2.5 text-left text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
      >
        <span>
          {title} ({count})
        </span>
        <svg
          viewBox="0 0 12 12"
          className={"h-3.5 w-3.5 shrink-0 transition-transform " + (open ? "rotate-180" : "")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul id={id} className="max-h-44 overflow-y-auto pb-2">
          {count ? children : (
            <li className="px-5 pb-2 text-xs text-ink-tertiary">—</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

function AttachRow({ index, title, previewSrc, onRemove }: { index: number; title: string; previewSrc?: string; onRemove: () => void }) {
  const { tx } = useI18n();
  return (
    <li className="flex items-center gap-2 px-5 py-1.5">
      <span className="w-4 shrink-0 text-xs text-ink-tertiary tnum">{index}.</span>
      <ReportThumb src={previewSrc} className="h-8 w-10" />
      <span className="min-w-0 flex-1 truncate text-sm text-[color:var(--pp-primary-950)]">{title}</span>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
        aria-label={`${tx("Remove")} ${title}`}
      >
        ✕
      </button>
    </li>
  );
}

function PriceToggle({ rows }: { rows: [string, string, boolean][] }) {
  const { tx } = useI18n();
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="text-right">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70"
      >
        {open ? tx("Hide breakdown") : tx("Show breakdown")}
      </button>
      {open ? (
        <dl id={id} className="mt-2 space-y-1 text-xs">
          {rows.map(([k, v, tone]) => (
            <div key={k} className="flex justify-end gap-3">
              <dt className="text-ink-tertiary">{k}</dt>
              <dd className={"tnum " + (tone ? "font-medium text-[color:var(--pp-green)]" : "text-[color:var(--pp-primary-950)]")}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
