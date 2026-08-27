/**
 * Resolve a denied or cancelled visit — reschedule, refund, or mark walked-in.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Caret } from "@/components/ui";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { clinicianNoun } from "@/lib/providerPortals";
import { consultQuote, formatMoney } from "@/lib/bookingQuote";
import { formatFee } from "@/lib/appointments";
import { createVisitRefund } from "@/lib/providerFinance";
import { useShellColumn } from "@/lib/columnHover";
import { endOptionsAfter, formatSlotWindow, startTimeOptions } from "@/lib/timeSlots";
import {
  CANCEL_CASES,
  PATIENT_STATUS,
  boardDoctors,
  cancellationPath,
  doctorCredentials,
  formatPatientDate,
  needsCancelFlow,
  openCancelCases,
  patientInitials,
  resolvePatientCancellation,
  splitDuration,
  useHospitalPatients,
  type DraftCancelCase,
} from "@/lib/hospitalPatientDraft";

const FIELD =
  "h-11 w-full rounded-full border border-line bg-white px-4 text-sm text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary focus:border-[color:var(--pp-primary-950)]";
const SELECT =
  "h-11 w-full appearance-none rounded-full border border-line bg-white px-4 pr-9 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const NOTE =
  "min-h-[6.5rem] w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm text-[color:var(--pp-primary-950)] outline-none placeholder:italic placeholder:text-ink-tertiary focus:border-[color:var(--pp-primary-950)]";

const OUTCOME_COPY: Record<string, string> = {
  rescheduled: "Rescheduled",
  refunded: "Refund started",
  walked_in: "Marked completed",
};

export function ProviderCancellationPage() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { workspaceId, provider } = useProvider();
  const clinician = clinicianNoun(provider?.vendorType);
  const doctors = boardDoctors(workspaceId);
  const { rows, upsert } = useHospitalPatients(workspaceId);
  const mainCol = useShellColumn("main");
  const railCol = useShellColumn("rail");

  const cases = useMemo(() => openCancelCases(rows), [rows]);
  const resolved = useMemo(
    () =>
      rows.filter(
        (p) => p.cancellation && p.cancellation.outcome !== "open" && !needsCancelFlow(p),
      ),
    [rows],
  );
  const selected =
    (patientId ? rows.find((p) => p.id === patientId) : null) ?? cases[0] ?? null;
  const openFlow = selected ? needsCancelFlow(selected) : false;

  const [caseId, setCaseId] = useState<DraftCancelCase>("reschedule");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("9:00 AM");
  const [end, setEnd] = useState("9:30 AM");
  const [doctor, setDoctor] = useState("");
  const [note, setNote] = useState("");
  const [walkedIn, setWalkedIn] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => {
    if (!selected) return;
    const window = splitDuration(selected.duration);
    setDate(selected.date);
    setStart(window.start);
    setEnd(window.end);
    setDoctor(selected.doctor);
    setNote(selected.cancellation?.note || "");
    setWalkedIn(false);
    setDone("");
    setCaseId("reschedule");
  }, [selected?.id]);

  useEffect(() => {
    if (patientId || !selected) return;
    nav(cancellationPath(selected.id), { replace: true });
  }, [patientId, selected?.id, nav]);

  const quote = selected ? consultQuote(selected.fee) : null;
  const ends = endOptionsAfter(start);
  const credentials = selected ? doctorCredentials(workspaceId, selected.doctor) || selected.department : "";
  const refundable = quote?.beforeOffer ?? 0;
  const status = selected ? PATIENT_STATUS[selected.status] : null;
  const outcome = selected?.cancellation?.outcome ?? "open";
  const locked = Boolean(selected && !openFlow);

  const ctaLabel =
    caseId === "reschedule"
      ? tx("Save new slot")
      : caseId === "refund"
        ? tx("Initiate refund")
        : tx("Mark completed");

  const ctaReady = (() => {
    if (!selected || locked) return false;
    if (caseId === "reschedule") return Boolean(date && start && end && doctor);
    if (caseId === "refund") return refundable > 0 && Boolean(note.trim() || selected.denyNote);
    return walkedIn;
  })();

  const activeCase = CANCEL_CASES.find((c) => c.id === caseId) ?? CANCEL_CASES[0];

  const apply = () => {
    if (!selected || !ctaReady) return;
    if (caseId === "reschedule") {
      upsert(
        resolvePatientCancellation(selected, "rescheduled", {
          date,
          duration: formatSlotWindow(start, end),
          doctor,
          status: "upcoming",
          approval: "pending",
          note,
        }),
      );
      setDone(tx("Visit moved to the new slot. The old online time is free."));
      return;
    }
    if (caseId === "refund") {
      const reason = note.trim() || selected.denyNote || tx("Booking cancelled");
      createVisitRefund(workspaceId, {
        patientName: selected.name,
        service: selected.reason,
        originalCharge: selected.fee,
        reason,
        serviceId: selected.id.toUpperCase(),
      });
      upsert(
        resolvePatientCancellation(selected, "refunded", {
          status: "cancelled",
          note: reason,
          refundAmount: refundable,
        }),
      );
      setDone(tx("Refund is held for review under Finance."));
      return;
    }
    upsert(
      resolvePatientCancellation(selected, "walked_in", {
        status: "completed",
        approval: "visit",
        note,
      }),
    );
    setDone(tx("Online booking closed. This visit is marked completed."));
  };

  return (
    <div className={"min-w-0 " + mainCol.className} onMouseEnter={mainCol.onMouseEnter}>
      <ProviderBreadcrumb
        items={[
          { label: tx("Patients"), to: "/provider/patients" },
          { label: tx("Cancellation") },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:gap-8">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white lg:grid lg:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]">
          <div className="border-b border-line lg:border-b-0 lg:border-r">
            <div className="px-4 py-3">
              <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
                {tx("Open cases")}
                <span className="ml-1.5 text-ink-tertiary tnum">({cases.length})</span>
              </h2>
            </div>
            {cases.length === 0 ? (
              <p className="border-t border-line px-4 py-8 text-sm text-ink-tertiary">
                {tx("No denied or cancelled visits are waiting.")}
              </p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {cases.map((p) => {
                  const on = selected?.id === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => nav(cancellationPath(p.id))}
                        className={
                          "flex w-full items-center gap-2.5 px-4 py-3 text-left " +
                          (on ? "bg-[color:var(--pp-primary-100)]/70" : "hover:bg-[color:var(--state-hover)]")
                        }
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                          {patientInitials(p.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[color:var(--pp-primary-950)]">
                            {p.name}
                          </span>
                          <span className="block truncate text-2xs text-ink-tertiary">
                            {tx(PATIENT_STATUS[p.status].label)}
                            {" · "}
                            {tx(p.reason)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="min-w-0">
            {!selected ? (
              <p className="px-5 py-16 text-center text-sm text-ink-tertiary">
                {tx("Deny or cancel a visit to start this flow.")}
              </p>
            ) : (
              <>
                <div className="px-5 py-4">
                  <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Resolving for")}</p>
                  <h2 className="mt-1 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                    {selected.name}
                  </h2>
                  <p className="mt-1 text-sm text-ink-tertiary">
                    {tx(selected.reason)}
                    {" · "}
                    {selected.duration}
                    {" · "}
                    {formatPatientDate(selected.date)}
                  </p>
                </div>

                {!done && !locked ? (
                  <div className="border-t border-line px-5 py-4">
                    <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
                      {tx("What should happen next?")}
                    </p>
                    <p className="mt-1 text-xs text-ink-tertiary">
                      {tx("Pick a use case for this patient, then complete the details below.")}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {CANCEL_CASES.map((item) => {
                        const on = caseId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setCaseId(item.id);
                              setDone("");
                            }}
                            className={
                              "rounded-2xl border px-3 py-3 text-left " +
                              (on
                                ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)]/60"
                                : "border-line hover:bg-[color:var(--state-hover)]")
                            }
                          >
                            <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">
                              {tx(item.title)}
                            </span>
                            <span className="mt-1 block text-2xs leading-relaxed text-ink-tertiary">
                              {tx(item.blurb)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-2xl bg-[color:var(--pp-primary-100)]/45 px-4 py-3">
                      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                        {tx("Use cases")} · {tx(activeCase.title)}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {activeCase.examples.map((example) => (
                          <li
                            key={example}
                            className="flex gap-2 text-xs leading-relaxed text-[color:var(--pp-primary-950)]"
                          >
                            <span
                              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--pp-violet)]"
                              aria-hidden
                            />
                            <span>{tx(example)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {done || locked ? (
                  <div className="border-t border-line px-5 py-6">
                    <p className="text-sm text-[color:var(--pp-primary-950)]">
                      {done ||
                        tx("This case is closed — {outcome}.").replace(
                          "{outcome}",
                          tx(OUTCOME_COPY[outcome] || outcome),
                        )}
                    </p>
                    {selected.cancellation?.note ? (
                      <p className="mt-3 rounded-lg bg-[color:var(--pp-primary-100)] px-3 py-2.5 text-xs leading-relaxed text-[color:var(--pp-primary-950)]">
                        {selected.cancellation.note}
                      </p>
                    ) : null}
                    {outcome === "rescheduled" ? (
                      <p className="mt-3 text-sm text-ink-secondary">
                        {formatPatientDate(selected.date)} · {selected.duration} · {selected.doctor}
                      </p>
                    ) : null}
                  </div>
                ) : caseId === "reschedule" ? (
                  <div className="border-t border-line px-5 py-5">
                    <p className="pp-caps text-[color:var(--pp-violet)]">{tx(activeCase.title)}</p>
                    <p className="mt-2 text-sm text-ink-secondary">
                      {tx("Pick a new day and time for {name}. The original online slot is released.").replace(
                        "{name}",
                        selected.name,
                      )}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Date")}</span>
                        <input
                          className={FIELD}
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </label>
                      <TimeSelect
                        label={tx("Start")}
                        value={start}
                        options={withCurrent(start, startTimeOptions())}
                        onChange={(next) => {
                          setStart(next);
                          const opts = endOptionsAfter(next);
                          if (!opts.includes(end)) setEnd(opts[0] || next);
                        }}
                      />
                      <TimeSelect
                        label={tx("End")}
                        value={end}
                        options={withCurrent(end, ends)}
                        onChange={setEnd}
                      />
                      <label className="block sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx(clinician)}</span>
                        <span className="relative block">
                          <select className={SELECT} value={doctor} onChange={(e) => setDoctor(e.target.value)}>
                            {doctors.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <Caret className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
                        </span>
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-medium text-ink-secondary">
                          {tx("Note to patient (optional)")}
                        </span>
                        <textarea
                          className={NOTE}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder={tx("Why this slot works better")}
                        />
                      </label>
                    </div>
                  </div>
                ) : caseId === "refund" ? (
                  <div className="border-t border-line px-5 py-5">
                    <p className="pp-caps text-[color:var(--pp-violet)]">{tx(activeCase.title)}</p>
                    {refundable <= 0 ? (
                      <p className="mt-2 text-sm text-ink-secondary">
                        {tx(
                          "This visit had no online fee, so there is nothing to refund. Reschedule or mark it completed instead.",
                        )}
                      </p>
                    ) : (
                      <>
                        <p className="mt-2 text-sm text-ink-secondary">
                          {tx("Refund for {name} is held and sent to Finance for approval.").replace(
                            "{name}",
                            selected.name,
                          )}
                        </p>
                        <dl className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between gap-3">
                            <dt className="text-ink-tertiary">{tx("Consultation fee")}</dt>
                            <dd className="tnum text-[color:var(--pp-primary-950)]">
                              {formatMoney(quote!.consultation)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-ink-tertiary">{tx("Convenience fee")}</dt>
                            <dd className="tnum text-[color:var(--pp-primary-950)]">
                              {formatMoney(quote!.convenience)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-ink-tertiary">
                              {tx("Insurance ({pct}%)").replace("{pct}", String(quote!.insurancePct))}
                            </dt>
                            <dd className="tnum text-[color:var(--pp-primary-950)]">
                              −{formatMoney(quote!.insurance)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3 border-t border-line pt-2">
                            <dt className="font-medium text-[color:var(--pp-primary-950)]">
                              {tx("Refund to patient")}
                            </dt>
                            <dd className="font-medium tnum text-[color:var(--pp-primary-950)]">
                              {formatMoney(refundable)}
                            </dd>
                          </div>
                        </dl>
                        <label className="mt-4 block">
                          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">
                            {tx("Refund note")}
                          </span>
                          <textarea
                            className={NOTE}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={tx("Why the fee should go back")}
                          />
                        </label>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-line px-5 py-5">
                    <p className="pp-caps text-[color:var(--pp-violet)]">{tx(activeCase.title)}</p>
                    <p className="mt-2 text-sm text-ink-secondary">
                      {tx("Close the unused online booking for {name} after an in-person visit.").replace(
                        "{name}",
                        selected.name,
                      )}
                    </p>
                    <label className="mt-4 flex items-start gap-3 rounded-2xl border border-line px-4 py-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-[color:var(--pp-violet)]"
                        checked={walkedIn}
                        onChange={(e) => setWalkedIn(e.target.checked)}
                      />
                      <span className="text-sm text-[color:var(--pp-primary-950)]">
                        {tx("Patient was seen in person. Close the online booking as completed.")}
                      </span>
                    </label>
                    <label className="mt-4 block">
                      <span className="mb-1.5 block text-sm font-medium text-ink-secondary">
                        {tx("Visit note (optional)")}
                      </span>
                      <textarea
                        className={NOTE}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={tx("Seen at reception / ward / clinic")}
                      />
                    </label>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <aside className={"h-fit xl:sticky xl:top-8 " + railCol.className} onMouseEnter={railCol.onMouseEnter}>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            {selected ? (
              <>
                <div className="flex items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Booking")}</p>
                    <p className="mt-1 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                      {selected.name}
                    </p>
                    <p className="mt-1 text-sm text-ink-tertiary">
                      {selected.age} {tx("years old")}
                    </p>
                  </div>
                  {status ? (
                    <span className={"shrink-0 rounded-full px-2.5 py-1 text-2xs font-semibold " + status.className}>
                      {tx(status.label)}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 border-t border-line px-5 py-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-sm font-semibold text-[color:var(--pp-primary-950)]">
                    {patientInitials(selected.doctor)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[color:var(--pp-primary-950)]">{selected.doctor}</p>
                    <p className="mt-0.5 truncate text-sm text-ink-tertiary">{credentials}</p>
                  </div>
                </div>
                <dl>
                  <Fact label={tx("Online slot")} value={`${selected.duration} · ${formatPatientDate(selected.date)}`} />
                  <Fact label={tx("Department")} value={tx(selected.department)} />
                  <Fact
                    label={tx("Visit type")}
                    value={selected.visitType === "virtual" ? tx("Virtual") : tx("In clinic")}
                  />
                  <Fact
                    label={tx("Opened as")}
                    value={tx(selected.cancellation?.source === "denied" ? "Denied" : "Cancelled")}
                  />
                </dl>
                {selected.denyNote || selected.cancellation?.reason ? (
                  <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-[color:var(--pp-primary-950)]">
                    {selected.cancellation?.reason || selected.denyNote}
                  </p>
                ) : null}
                <div className="border-t border-line px-5 py-4">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx("Paid online")}</p>
                  <p className="mt-1 font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                    {selected.fee <= 0 ? formatFee(0) : formatMoney(quote?.beforeOffer ?? 0)}
                  </p>
                </div>
                <div className="space-y-2 border-t border-line px-5 py-4">
                  {done || locked ? (
                    <>
                      {cases[0] && cases[0].id !== selected.id ? (
                        <Button fullWidth onClick={() => nav(cancellationPath(cases[0].id))}>
                          {tx("Next open case")}
                        </Button>
                      ) : null}
                      <Button fullWidth variant="outline" onClick={() => nav("/provider/patients")}>
                        {tx("Back to patients")}
                      </Button>
                      {outcome === "rescheduled" ? (
                        <Button fullWidth variant="secondary" onClick={() => nav("/provider/schedule")}>
                          {tx("Open schedule")}
                        </Button>
                      ) : null}
                      {outcome === "refunded" ? (
                        <Button fullWidth variant="secondary" onClick={() => nav("/provider/finance")}>
                          {tx("Open Finance")}
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Button fullWidth disabled={!ctaReady} onClick={apply}>
                        {ctaLabel}
                      </Button>
                      <Button fullWidth variant="outline" onClick={() => nav("/provider/patients")}>
                        {tx("Back to patients")}
                      </Button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="px-5 py-8">
                <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Next step")}</p>
                <p className="mt-2 text-sm text-ink-secondary">
                  {tx("Open a denied or cancelled visit, then use the cases on the left.")}
                </p>
              </div>
            )}
          </div>

          {resolved.length > 0 ? (
            <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
              <div className="px-4 py-3">
                <h2 className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Recently closed")}</h2>
              </div>
              <ul className="divide-y divide-line border-t border-line">
                {resolved.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => nav(cancellationPath(p.id))}
                      className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-[color:var(--state-hover)]"
                    >
                      <span className="truncate text-sm text-[color:var(--pp-primary-950)]">{p.name}</span>
                      <span className="shrink-0 text-2xs text-ink-tertiary">
                        {tx(OUTCOME_COPY[p.cancellation?.outcome || ""] || p.cancellation?.outcome || "")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line px-5 py-2.5">
      <dt className="shrink-0 text-sm text-ink-tertiary">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium leading-snug text-[color:var(--pp-primary-950)]" title={value}>
        {value}
      </dd>
    </div>
  );
}

function withCurrent(current: string, list: string[]) {
  if (!current || list.includes(current)) return list;
  return [current, ...list];
}

function TimeSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{label}</span>
      <span className="relative block">
        <select className={SELECT} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
          {options.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Caret className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
      </span>
    </label>
  );
}
