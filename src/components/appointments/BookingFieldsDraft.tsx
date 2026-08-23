import { useEffect, useState, type ReactNode } from "react";
import { DetailSection } from "@/components/DetailSection";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui";
import { DateOfBirthField } from "@/components/DateOfBirthField";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n";
import type { PayMethod, PaymentFields } from "@/components/checkout/ChoosePaymentOption";

const UPI_HANDLES = ["@okhdfcbank", "@okicici", "@oksbi", "@paytm", "@ybl"] as const;
const EMI_OFFERS = [
  { bank: "BMO", card: "BMO CashBack Mastercard", plan: "3 months · 0% interest" },
  { bank: "TD", card: "TD Cash Back Visa", plan: "3 months · 0% interest" },
  { bank: "RBC", card: "RBC Avion Visa", plan: "6 months · 0% interest" },
  { bank: "Scotiabank", card: "Scotia Momentum Visa", plan: "6 months · 0% interest" },
  { bank: "CIBC", card: "CIBC Dividend Visa", plan: "12 months · from 8%" },
] as const;
const RELATIONS = ["Spouse", "Parent", "Child", "Partner", "Sibling", "Family member"] as const;
const DEMO_EXTRA_CARD = "5672";

export type VisitTabDraft = "saved" | "new" | "reports" | "consults";
export type VisitTab = VisitTabDraft;

export type DraftPatient = {
  id: string;
  name: string;
  relation: string;
  badge?: string;
};

export function VisitWhoPanelDraft({
  tab,
  onTab,
  patients,
  patientId,
  onSelect,
  newName,
  newRelation,
  newDob,
  dobError,
  onNewName,
  onNewRelation,
  onNewDob,
  onSavePatient,
  reports,
  uploads,
  attachedIds,
  onToggleLibrary,
  onToggleUpload,
  onDeleteUpload,
  onUpload,
  findings,
  findingIds,
  onToggleFinding,
}: {
  tab: VisitTabDraft;
  onTab: (id: VisitTabDraft) => void;
  patients: DraftPatient[];
  patientId: string;
  onSelect: (id: string) => void;
  newName: string;
  newRelation: string;
  newDob: string;
  dobError: string;
  onNewName: (v: string) => void;
  onNewRelation: (v: string) => void;
  onNewDob: (v: string) => void;
  onSavePatient: () => void;
  reports: { id: string; title: string; detail: string; date: string }[];
  uploads: { id: string; title: string; detail: string }[];
  attachedIds: string[];
  onToggleLibrary: (id: string) => void;
  onToggleUpload: (id: string) => void;
  onDeleteUpload: (id: string) => void;
  onUpload: () => void;
  findings: { id: string; title: string; detail: string; date: string }[];
  findingIds: string[];
  onToggleFinding: (id: string) => void;
}) {
  const { tx } = useI18n();
  const reportCount = reports.length + uploads.length;
  const consultCount = findings.length;
  const [picker, setPicker] = useState<null | "reports" | "consults">(null);

  useEffect(() => {
    if (tab === "reports") setPicker("reports");
    if (tab === "consults") setPicker("consults");
  }, [tab]);

  useEffect(() => {
    setPicker(null);
  }, [patientId]);

  const closePicker = () => {
    setPicker(null);
    if (tab === "reports" || tab === "consults") onTab("saved");
  };

  return (
    <DetailSection title={tx("Who is this visit for?")} flush>
      <SplitPane
        left={
          <ul className="space-y-1.5" role="radiogroup" aria-label={tx("Saved patient(s)")}>
            {patients.map((p) => {
              const on = patientId === p.id && tab !== "new";
              const tag = p.id === "self" ? "Primary" : p.badge || p.relation;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      onSelect(p.id);
                      onTab("saved");
                    }}
                    className={
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left " +
                      (on ? "bg-[color:var(--pp-primary-100)]" : "hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    <span
                      className={
                        "grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-semibold " +
                        (on
                          ? "bg-[color:var(--pp-primary-950)] text-white"
                          : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
                      }
                    >
                      {initials(p.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">{p.name}</span>
                      <span className="block truncate text-xs text-ink-tertiary">{tx(tag)}</span>
                    </span>
                    <RadioDot on={on} />
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => onTab("new")}
                className={
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left " +
                  (tab === "new" ? "bg-[color:var(--pp-primary-100)]" : "hover:bg-[color:var(--state-hover)]")
                }
              >
                <PlusCircle />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Add a family member")}</span>
                  <span className="block text-xs text-ink-tertiary">{tx("Spouse, child, or someone you care for")}</span>
                </span>
              </button>
            </li>
          </ul>
        }
      >
        {tab === "new" ? (
          <div className="space-y-3">
            <Field
              label={tx("Full name")}
              value={newName}
              onChange={(e) => onNewName(e.target.value)}
              placeholder={tx("e.g. Jordan Lee")}
              className="placeholder:italic"
              autoComplete="name"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Relationship")}</span>
                <select
                  value={newRelation}
                  onChange={(e) => onNewRelation(e.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink focus:border-[color:var(--pp-primary-950)]"
                >
                  <option value="">{tx("e.g. Parent, child")}</option>
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {tx(r)}
                    </option>
                  ))}
                </select>
              </label>
              <DateOfBirthField
                label={tx("Date of birth (optional)")}
                value={newDob}
                onChange={onNewDob}
                error={dobError || undefined}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onSavePatient} disabled={!newName.trim()}>
                {tx("Save patient")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onTab("saved")}>
                {tx("Cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<HistoryIcon />}
                value={consultCount}
                selected={findingIds.length}
                label={tx("Prev consults")}
                onClick={() => setPicker("consults")}
              />
              <StatCard
                icon={<ReportIcon />}
                value={reportCount}
                selected={attachedIds.length}
                label={tx("Reports ready")}
                tone="green"
                onClick={() => setPicker("reports")}
              />
            </div>
            <button
              type="button"
              onClick={() => setPicker("consults")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
            >
              <PlusCircle small />
              {tx("View patient history")}
            </button>
          </div>
        )}

        <Modal
          open={picker === "reports"}
          title={tx("Reports")}
          onClose={closePicker}
          footer={
            <Button size="sm" onClick={closePicker}>
              {tx("Done")}
            </Button>
          }
        >
          <ShareList count={reportCount} onUpload={onUpload} empty={tx("No reports yet. Upload a file to share.")}>
            {reports.map((r) => (
              <ShareRow
                key={r.id}
                title={tx(r.title)}
                detail={`${tx(r.detail)} · ${r.date}`}
                checked={attachedIds.includes(r.id)}
                onToggle={() => onToggleLibrary(r.id)}
              />
            ))}
            {uploads.map((a) => (
              <ShareRow
                key={a.id}
                title={a.title}
                detail={tx(a.detail)}
                checked={attachedIds.includes(a.id)}
                onToggle={() => onToggleUpload(a.id)}
                onDelete={() => onDeleteUpload(a.id)}
              />
            ))}
          </ShareList>
        </Modal>

        <Modal
          open={picker === "consults"}
          title={tx("Past consultations")}
          onClose={closePicker}
          footer={
            <Button size="sm" onClick={closePicker}>
              {tx("Done")}
            </Button>
          }
        >
          <ShareList count={consultCount} empty={tx("No earlier consultations to share.")}>
            {findings.map((f) => (
              <ShareRow
                key={f.id}
                title={tx(f.title)}
                detail={`${tx(f.detail)} · ${f.date}`}
                checked={findingIds.includes(f.id)}
                onToggle={() => onToggleFinding(f.id)}
              />
            ))}
          </ShareList>
        </Modal>
      </SplitPane>
    </DetailSection>
  );
}

export function ChoosePaymentOptionDraft({
  pay,
  savedLast4,
  due = 1,
}: {
  pay: PaymentFields;
  savedLast4?: string;
  due?: number;
}) {
  const { tx } = useI18n();
  const [addingCard, setAddingCard] = useState(false);
  const primaryLast4 = savedLast4 || "8788";
  const extraLast4 = primaryLast4 === DEMO_EXTRA_CARD ? "8788" : DEMO_EXTRA_CARD;
  const savedCards = [
    { last4: primaryLast4, brand: "visa" as const },
    { last4: extraLast4, brand: "visa" as const },
  ];
  const selectedLast4 = pay.useSaved ? primaryLast4 : pay.card.replace(/\s/g, "").slice(-4);
  const inputClass =
    "h-11 rounded-xl border border-line bg-white px-3.5 text-sm text-ink placeholder:text-ink-tertiary " +
    "focus:border-[color:var(--pp-primary-950)]";

  const pickSaved = (last4: string) => {
    setAddingCard(false);
    pay.setMethod("card");
    if (last4 === primaryLast4 && savedLast4) {
      pay.setUseSaved(true);
      return;
    }
    pay.setUseSaved(false);
    pay.setCard(`4111 1111 1111 ${last4}`);
  };

  const verifyUpi = () => {
    if (pay.upiName.trim().length < 2) return;
    pay.setUpiVerified(true);
  };

  const methods: { id: PayMethod; title: string; hint?: string; icon: ReactNode }[] = [
    { id: "card", title: tx("Credit / Debit / ATM Card"), icon: <CardIcon /> },
    { id: "upi", title: tx("UPI"), hint: tx("Pay by any UPI app"), icon: <QrIcon /> },
    { id: "emi", title: tx("EMI"), hint: tx("Credit Card EMI"), icon: <WalletIcon /> },
  ];

  return (
    <DetailSection title={tx("Choose payment option")} flush>
      <SplitPane
        left={
          <div>
            <div className="space-y-1.5" role="radiogroup" aria-label={tx("Payment method")}>
              {methods.map((m) => {
                const on = pay.method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setAddingCard(false);
                      pay.setMethod(m.id);
                    }}
                    className={
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left " +
                      (on ? "bg-[color:var(--pp-primary-100)]" : "hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    <span
                      className={
                        "grid h-10 w-10 shrink-0 place-items-center rounded-full " +
                        (on
                          ? "bg-[color:var(--pp-primary-950)] text-white"
                          : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
                      }
                    >
                      {m.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-snug text-[color:var(--pp-primary-950)]">{m.title}</span>
                      {m.hint ? <span className="mt-0.5 block text-xs text-ink-tertiary">{m.hint}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setAddingCard(false);
                pay.setMethod("health");
              }}
              className={
                "mt-1.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left " +
                (pay.method === "health" ? "bg-[color:var(--pp-primary-100)]" : "hover:bg-[color:var(--state-hover)]")
              }
            >
              <PlusCircle />
              <span className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Have a health Card?")}</span>
            </button>
          </div>
        }
      >
        {due <= 0 ? (
          <p className="mb-3 text-sm text-ink-tertiary">
            {tx("Nothing due today. Add a method in case a balance remains.")}
          </p>
        ) : null}

        {pay.method === "card" ? (
          addingCard ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label={tx("Card number")}
                  placeholder="4242 4242 4242 4242"
                  value={pay.card}
                  onChange={(e) => pay.setCard(e.target.value)}
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
              </div>
              <Field
                label={tx("Expiry")}
                placeholder="12 / 27"
                value={pay.exp}
                onChange={(e) => pay.setExp(e.target.value)}
                autoComplete="cc-exp"
              />
              <Field
                label={tx("CVC")}
                placeholder="123"
                value={pay.cvc}
                onChange={(e) => pay.setCvc(e.target.value)}
                inputMode="numeric"
                autoComplete="cc-csc"
              />
              <button
                type="button"
                onClick={() => {
                  setAddingCard(false);
                  if (savedLast4) pay.setUseSaved(true);
                }}
                className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70 sm:col-span-2 text-left"
              >
                {tx("Use saved card")}
              </button>
            </div>
          ) : (
            <div>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {savedCards.map((c) => {
                  const on = selectedLast4 === c.last4 && !addingCard;
                  return (
                    <li key={c.last4}>
                      <div
                        className={
                          "flex h-full items-center gap-2.5 rounded-xl border px-3 py-2.5 " +
                          (on
                            ? "border-[color:var(--pp-primary-950)]/25 bg-[color:var(--pp-primary-100)]"
                            : "border-line bg-white")
                        }
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => pickSaved(c.last4)}
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                        >
                          <VisaLogo />
                          <span className="min-w-0 truncate text-xs font-medium tracking-wide text-[color:var(--pp-primary-950)] tnum">
                            .... {c.last4}
                          </span>
                        </button>
                        <label className="sr-only" htmlFor={`cvv-${c.last4}`}>
                          {tx("CVV")}
                        </label>
                        <input
                          id={`cvv-${c.last4}`}
                          value={on ? pay.cvc : ""}
                          onChange={(e) => {
                            if (!on) pickSaved(c.last4);
                            pay.setCvc(e.target.value.replace(/\D/g, "").slice(0, 4));
                          }}
                          onFocus={() => {
                            if (!on) pickSaved(c.last4);
                          }}
                          placeholder={tx("CVV")}
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          className={
                            "h-8 w-11 shrink-0 rounded-md border bg-white text-center text-sm tnum outline-none placeholder:text-ink-tertiary " +
                            (on ? "border-[color:var(--pp-primary-950)]" : "border-line")
                          }
                        />
                        <RadioDot on={on} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => {
                  pay.setMethod("card");
                  pay.setUseSaved(false);
                  setAddingCard(true);
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
              >
                <PlusCircle small />
                {tx("Add a new card")}
              </button>
            </div>
          )
        ) : pay.method === "upi" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("UPI ID")}</p>
              <p className="mt-1 text-xs text-ink-tertiary">{tx("Scan the code in your UPI app, or enter your UPI ID.")}</p>
              <input
                value={pay.upiName}
                onChange={(e) => pay.setUpiName(e.target.value.replace(/@.*/g, "").replace(/\s/g, ""))}
                placeholder="yourname"
                autoComplete="off"
                spellCheck={false}
                className={inputClass + " mt-3 w-full"}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("UPI handle")}</p>
              <select
                value={pay.upiHandle}
                onChange={(e) => pay.setUpiHandle(e.target.value)}
                aria-label={tx("UPI handle")}
                className={inputClass + " mt-3 w-full"}
              >
                {UPI_HANDLES.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                className="mt-3"
                disabled={pay.upiName.trim().length < 2 || pay.upiVerified}
                onClick={verifyUpi}
              >
                {pay.upiVerified ? tx("Verified") : tx("Verify")}
              </Button>
              {pay.upiVerified ? (
                <p className="mt-2 text-xs text-[color:var(--pp-green)]">
                  {tx("UPI ID verified")} · {pay.upiName}
                  {pay.upiHandle}
                </p>
              ) : null}
            </div>
          </div>
        ) : pay.method === "emi" ? (
          <div>
            <p className="mb-2 text-xs text-ink-tertiary">
              {tx("Pick the bank that issued your card. Demo only — no real charges.")}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label={tx("EMI")}>
              {EMI_OFFERS.map((offer) => {
                const value = `${offer.bank} · ${offer.plan}`;
                const on = pay.emiPlan === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pay.setEmiPlan(value)}
                    className={
                      "rounded-xl border px-3 py-2.5 text-left " +
                      (on
                        ? "border-[color:var(--pp-primary-950)]/25 bg-[color:var(--pp-primary-100)]"
                        : "border-line bg-white hover:border-[color:var(--pp-primary-950)]/30")
                    }
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span>
                        <span className="block text-sm font-semibold text-[color:var(--pp-primary-950)]">{offer.bank}</span>
                        <span className="mt-0.5 block text-2xs text-ink-tertiary">{offer.card}</span>
                        <span className="mt-1 block text-xs text-[color:var(--pp-primary-950)]">{tx(offer.plan)}</span>
                      </span>
                      <RadioDot on={on} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={tx("Health card number")}
              placeholder={tx("e.g. 1234-567-890")}
              value={pay.healthNumber}
              onChange={(e) => pay.setHealthNumber(e.target.value)}
              autoComplete="off"
            />
            <p className="self-end text-xs leading-relaxed text-ink-tertiary">
              {tx("We'll bill your provincial plan first. Enter the number on your health card.")}
            </p>
          </div>
        )}
      </SplitPane>
    </DetailSection>
  );
}

function SplitPane({ left, children }: { left: ReactNode; children: ReactNode }) {
  return (
    <div className="grid md:grid-cols-[minmax(12.5rem,30%)_minmax(0,1fr)] md:items-stretch">
      <div className="border-b border-line p-3 md:border-b-0 md:border-r">{left}</div>
      <div className="min-w-0 p-4">{children}</div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  selected,
  label,
  tone,
  onClick,
}: {
  icon: ReactNode;
  value: number;
  selected?: number;
  label: string;
  tone?: "green";
  onClick: () => void;
}) {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3 text-left hover:border-[color:var(--pp-primary-950)]/30"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center text-[color:var(--pp-violet)]">{icon}</span>
      <span>
        <span className="block font-display text-2xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
          {value}
        </span>
        <span
          className={
            "mt-1 block text-2xs font-semibold uppercase tracking-wide " +
            (tone === "green" ? "text-[color:var(--pp-green)]" : "text-[color:var(--pp-primary-950)]")
          }
        >
          {label}
        </span>
        {selected ? (
          <span className="mt-0.5 block text-2xs text-ink-tertiary">
            {selected} {tx("selected")}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function RadioDot({ on }: { on: boolean }) {
  return (
    <span
      className={
        "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 " +
        (on ? "border-[color:var(--pp-primary-950)]" : "border-line")
      }
      aria-hidden
    >
      {on ? <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--pp-primary-950)]" /> : null}
    </span>
  );
}

function PlusCircle({ small }: { small?: boolean }) {
  return (
    <span
      className={
        "grid shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-100)] text-[color:var(--pp-violet)] " +
        (small ? "h-5 w-5" : "h-10 w-10")
      }
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className={small ? "h-3 w-3" : "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="6" width="18" height="12" rx="2.2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <path d="M13 13h3v3h-3zM18 13v3M13 18h3M18 18h2" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="6" width="18" height="13" rx="2.2" />
      <path d="M3 10h18M16.5 14.5h.01" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" strokeLinecap="round" />
      <path d="M4.5 5.5v3.5H8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8.5V12l2.5 1.5" strokeLinecap="round" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-[color:var(--pp-green)]" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 4.5h7.2L18.5 9v10.2A1.3 1.3 0 0 1 17.2 20.5H7A1.3 1.3 0 0 1 5.7 19.2V5.8A1.3 1.3 0 0 1 7 4.5Z" strokeLinejoin="round" />
      <path d="M14 4.5V9h4.5M8.5 13h7M8.5 16h4.5" strokeLinecap="round" />
    </svg>
  );
}

/** Official-style Visa wordmark. */
function VisaLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-8 shrink-0" role="img" aria-label="Visa">
      <title>Visa</title>
      <path
        fill="#1434CB"
        d="M9.112 8.262 5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.215h3.43c.437 0 .831.292.954.802l.873 4.639 2.157-5.443zm8.033 5.049c.01-2.455-3.392-2.59-3.368-3.688.008-.333.325-.688 1.02-.78.344-.046 1.293-.083 2.37.435l.422-1.972c-.577-.21-1.32-.41-2.226-.41-2.353 0-4.011 1.248-4.025 3.038-.016 1.323 1.18 2.06 2.08 2.5.927.456 1.238.748 1.234 1.156-.005.624-.747.9-1.44.91-1.213.016-1.916-.328-2.479-.591l-.436 2.04c.572.263 1.627.49 2.72.502 2.569 0 4.248-1.23 4.253-3.14m5.251 2.447h2.05l-1.79-7.196h-1.888c-.388 0-.72.225-.86.572l-3.331 6.624h2.332l.463-1.28h2.847zm-2.453-2.866 1.168-3.216.67 3.216zm-15.216-4.33-1.835 7.196H.56L2.394 8.262z"
      />
    </svg>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

function ShareList({
  count,
  onUpload,
  empty,
  children,
}: {
  count: number;
  onUpload?: () => void;
  empty: string;
  children: ReactNode;
}) {
  const { tx } = useI18n();
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs text-ink-tertiary">
          {tx("Available")} ({count})
        </p>
        {onUpload ? (
          <button type="button" onClick={onUpload} className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70">
            {tx("Upload")} +
          </button>
        ) : null}
      </div>
      {count > 0 ? <ul>{children}</ul> : <p className="text-sm text-ink-tertiary">{empty}</p>}
    </div>
  );
}

function ShareRow({
  title,
  detail,
  checked,
  onToggle,
  onDelete,
}: {
  title: string;
  detail: string;
  checked: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  const { tx } = useI18n();
  return (
    <li className="border-t border-line first:border-t-0">
      <div className="flex items-center gap-1">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left">
          <span
            className={
              "grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border text-[9px] " +
              (checked
                ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-950)] text-white"
                : "border-line bg-white")
            }
            aria-hidden
          >
            {checked ? "✓" : null}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-[color:var(--pp-primary-950)]">{title}</span>
            <span className="block truncate text-2xs text-ink-tertiary">{detail}</span>
          </span>
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
            aria-label={`${tx("Remove")} ${title}`}
          >
            ✕
          </button>
        ) : null}
      </div>
    </li>
  );
}

export { VisitWhoPanelDraft as VisitWhoPanel, ChoosePaymentOptionDraft as BookingPaymentOption };
