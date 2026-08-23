import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  PATIENT_SUPPORT_CATEGORY_LABELS,
  closePatientTicket,
  createPatientTicket,
  getPatientTicket,
  listPatientTickets,
  replyPatientTicket,
  type PatientSupportCategory,
  type PatientSupportTicket,
} from "@/lib/patientSupport";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const AREA =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";

export function HelpSupport() {
  const { tx } = useI18n();
  const [tickets, setTickets] = useState(() => listPatientTickets());
  const [activeId, setActiveId] = useState<string | null>(() => listPatientTickets()[0]?.id ?? null);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<PatientSupportCategory>("orders");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");

  const active: PatientSupportTicket | null = activeId ? getPatientTicket(activeId) : null;

  const refresh = (preferId?: string) => {
    const next = listPatientTickets();
    setTickets(next);
    const keep =
      preferId && next.some((t) => t.id === preferId)
        ? preferId
        : next.find((t) => t.id === activeId)?.id ?? next[0]?.id ?? null;
    setActiveId(keep);
  };

  const onCreate = () => {
    if (!subject.trim() || !body.trim()) return;
    const t = createPatientTicket({ subject, category, body });
    setSubject("");
    setBody("");
    setComposing(false);
    refresh(t.id);
  };

  const onReply = () => {
    if (!activeId || !reply.trim()) return;
    replyPatientTicket(activeId, reply);
    setReply("");
    refresh(activeId);
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Support")}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {tx("Help & support")}
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-secondary">
            {tx("Open a ticket for orders, billing, medications, or account help.")}
          </p>
        </div>
        <Button size="sm" className="!h-9 !px-4 !py-0" onClick={() => setComposing(true)}>
          {tx("New ticket")}
        </Button>
      </header>

      {composing ? (
        <section className="mb-8 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("New ticket")}
          </h2>
          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Subject")}</span>
              <input className={FIELD} value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Category")}</span>
              <select
                className={FIELD}
                value={category}
                onChange={(e) => setCategory(e.target.value as PatientSupportCategory)}
              >
                {(Object.keys(PATIENT_SUPPORT_CATEGORY_LABELS) as PatientSupportCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {tx(PATIENT_SUPPORT_CATEGORY_LABELS[c])}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Message")}</span>
              <textarea className={AREA} rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="!h-9 !px-4 !py-0" onClick={onCreate}>
                {tx("Submit")}
              </Button>
              <Button size="sm" variant="outline" className="!h-9 !px-4 !py-0" onClick={() => setComposing(false)}>
                {tx("Cancel")}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <ul className="space-y-2">
          {tickets.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-ink-tertiary">
              {tx("No tickets yet. Start with New ticket.")}
            </li>
          ) : (
            tickets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={
                    "w-full rounded-2xl border px-4 py-3 text-left transition-colors " +
                    (activeId === t.id
                      ? "border-[color:var(--pp-primary-950)] bg-white"
                      : "border-line bg-white/70 hover:bg-white")
                  }
                >
                  <p className="truncate text-sm font-medium text-[color:var(--pp-primary-950)]">{t.subject}</p>
                  <p className="mt-1 text-2xs text-ink-tertiary">
                    {tx(PATIENT_SUPPORT_CATEGORY_LABELS[t.category])} ·{" "}
                    {tx(t.status === "open" ? "Open" : "Closed")}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>

        <section className="rounded-2xl border border-line bg-white p-5">
          {!active ? (
            <p className="text-sm text-ink-tertiary">{tx("Select a ticket.")}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
                    {active.subject}
                  </h2>
                  <p className="mt-1 text-sm text-ink-tertiary">
                    {tx(PATIENT_SUPPORT_CATEGORY_LABELS[active.category])} ·{" "}
                    {tx(active.status === "open" ? "Open" : "Closed")}
                  </p>
                </div>
                {active.status === "open" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="!h-8 !px-3.5 !py-0 text-xs"
                    onClick={() => {
                      closePatientTicket(active.id);
                      refresh(active.id);
                    }}
                  >
                    {tx("Close")}
                  </Button>
                ) : null}
              </div>
              <ul className="mt-6 space-y-3">
                {active.messages.map((m) => (
                  <li
                    key={m.id}
                    className={
                      "rounded-2xl px-4 py-3 text-sm " +
                      (m.from === "you"
                        ? "bg-[color:var(--pp-primary-100)]/60 text-[color:var(--pp-primary-950)]"
                        : "border border-line bg-white text-ink-secondary")
                    }
                  >
                    <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                      {m.from === "you" ? tx("You") : tx("Support")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                  </li>
                ))}
              </ul>
              {active.status === "open" ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    className={FIELD}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={tx("Write a reply…")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onReply();
                      }
                    }}
                  />
                  <Button size="sm" className="!h-11 !px-5 !py-0 shrink-0 rounded-full" onClick={onReply}>
                    {tx("Send")}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
