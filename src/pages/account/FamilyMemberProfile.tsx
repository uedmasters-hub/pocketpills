import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { DateOfBirthField } from "@/components/DateOfBirthField";
import { DetailSection } from "@/components/DetailSection";
import { loadFamily, saveFamily } from "@/lib/accountPrefs";
import { getAppointments } from "@/lib/appointments";
import { careEventHref } from "@/lib/careJourney";
import { isoToDobDisplay } from "@/lib/dob";
import { fmtDate, getOrders, typeMeta } from "@/lib/orders";
import { ensurePatientFolder, getPatientLibrary, subscribePatientRecords } from "@/lib/patientRecords";
import { DocumentList } from "@/components/records/DocumentList";
import { useI18n } from "@/lib/i18n";

const RELATIONS = ["Spouse / partner", "Child", "Parent", "Sibling", "Other"];
const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-primary";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function samePerson(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function demoMedications(relationship: string): { name: string; detail: string }[] {
  const r = relationship.toLowerCase();
  if (/\b(spouse|partner|wife|husband)\b/.test(r)) {
    return [
      { name: "Prenatal vitamin", detail: "1 tablet daily · Active" },
      { name: "Ferrous sulfate", detail: "325 mg · Active" },
    ];
  }
  if (/\b(child|son|daughter|kid)\b/.test(r)) {
    return [
      { name: "Vitamin D drops", detail: "400 IU daily · Active" },
      { name: "Amoxicillin", detail: "Completed Dec 2025" },
    ];
  }
  if (/\b(parent|mother|father|mom|dad)\b/.test(r)) {
    return [
      { name: "Ramipril", detail: "5 mg daily · Active" },
      { name: "Atorvastatin", detail: "20 mg nightly · Active" },
    ];
  }
  return [{ name: "Daily vitamin", detail: "As needed · Active" }];
}

function RecordList({
  empty,
  rows,
}: {
  empty: string;
  rows: { key: string; title: string; detail: string; href?: string }[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-tertiary">{empty}</p>;
  }
  return (
    <ul>
      {rows.map((row, i) => {
        const body = (
          <>
            <p className="font-medium text-[color:var(--pp-primary-950)]">{row.title}</p>
            <p className="mt-0.5 text-sm text-ink-tertiary">{row.detail}</p>
          </>
        );
        return (
          <li key={row.key} className={i > 0 ? "border-t border-line" : undefined}>
            {row.href ? (
              <Link
                to={row.href}
                className="-mx-2 block rounded-xl px-2 py-3.5 transition-colors hover:bg-[color:var(--state-hover)]"
              >
                {body}
              </Link>
            ) : (
              <div className="py-3.5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function FamilyMemberProfile() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { memberId } = useParams();
  const id = memberId ? decodeURIComponent(memberId) : "";
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: RELATIONS[0], dob: "" });

  useEffect(() => subscribePatientRecords(() => setTick((n) => n + 1)), []);

  const member = useMemo(() => loadFamily().find((m) => m.id === id), [id, tick]);

  const library = useMemo(() => {
    if (!member) return { reports: [], uploads: [], consults: [] };
    return getPatientLibrary(member.id, { name: member.name, relation: member.relationship });
  }, [member]);

  const visits = useMemo(() => {
    if (!member) return [];
    return getAppointments().filter(
      (a) => a.patientId === member.id || samePerson(a.patientName, member.name),
    );
  }, [member]);

  const medOrders = useMemo(() => {
    if (!member) return [];
    return getOrders().filter(
      (o) =>
        samePerson(o.patient, member.name) &&
        (o.type === "fill" || o.type === "refill"),
    );
  }, [member]);

  if (!member) {
    return (
      <div>
        <BackToFamily />
        <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center">
          <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Family member not found")}</p>
          <Link
            to="/account/family"
            className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline"
          >
            {tx("Back to family")}
          </Link>
        </div>
      </div>
    );
  }

  const persist = (next: ReturnType<typeof loadFamily>) => {
    saveFamily(next);
    setTick((n) => n + 1);
  };

  const startEdit = () => {
    if (!member) return;
    setForm({ name: member.name, relationship: member.relationship, dob: member.dob });
    setEditing(true);
  };

  const saveEdit = () => {
    if (!member) return;
    const name = form.name.trim();
    if (!name) return;
    persist(
      loadFamily().map((m) =>
        m.id === member.id ? { ...m, name, relationship: form.relationship, dob: form.dob.trim() } : m,
      ),
    );
    try {
      ensurePatientFolder(member.id, { name, relation: form.relationship });
    } catch {
      /* demo folders — ignore */
    }
    setEditing(false);
  };

  const toggleLink = () => {
    if (!member) return;
    persist(loadFamily().map((m) => (m.id === member.id ? { ...m, linked: !m.linked } : m)));
  };

  const removeMember = () => {
    if (!member) return;
    persist(loadFamily().filter((m) => m.id !== member.id));
    nav("/account/family");
  };

  const relations = RELATIONS.includes(form.relationship)
    ? RELATIONS
    : [form.relationship, ...RELATIONS];

  const consultRows = [
    ...library.consults.map((c) => ({
      key: c.id,
      title: tx(c.title),
      detail: `${tx(c.detail)} · ${fmtDate(c.date)}`,
    })),
    ...visits.map((a) => ({
      key: `visit-${a.id}`,
      title: a.specialtyLabel || a.providerName,
      detail: `${a.providerName} · ${a.date} · ${a.time}`,
      href: careEventHref("visit", a.id),
    })),
  ];

  const medRows =
    medOrders.length > 0
      ? medOrders.map((o) => ({
          key: o.id,
          title: o.items[0]?.name || tx(typeMeta[o.type].label),
          detail: `${o.items.map((it) => `${it.name} ${it.strength}`.trim()).join(", ")} · ${fmtDate(o.date)}`,
          href: `/orders/${o.id}`,
        }))
      : demoMedications(member.relationship).map((m, i) => ({
          key: `demo-med-${i}`,
          title: tx(m.name),
          detail: tx(m.detail),
        }));

  return (
    <div>
      <BackToFamily />
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-base font-semibold text-[color:var(--pp-primary-950)]"
            aria-hidden
          >
            {initials(member.name)}
          </span>
          <div className="min-w-0">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Family")}</p>
            <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
              {member.name}
            </h1>
            <p className="mt-2 text-base text-ink-secondary">
              {tx(member.relationship)}
              {` · ${member.linked ? tx("Linked") : tx("Paused")}`}
            </p>
            {member.dob ? (
              <p className="mt-1 text-base text-ink-secondary">
                {tx("Born")} {isoToDobDisplay(member.dob) || member.dob}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={editing ? () => setEditing(false) : startEdit}>
            {editing ? tx("Cancel") : tx("Edit")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={toggleLink}>
            {member.linked ? tx("Linked") : tx("Paused")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmRemove(true)}>
            {tx("Remove")}
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        <DetailSection title={tx("About")}>
          {editing ? (
            <div className="space-y-4">
              <label className="block">
                <span className={LABEL}>{tx("Full name")}</span>
                <input
                  className={FIELD}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className={LABEL}>{tx("Relationship")}</span>
                <select
                  className={FIELD}
                  value={form.relationship}
                  onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                >
                  {relations.map((r) => (
                    <option key={r} value={r}>
                      {tx(r)}
                    </option>
                  ))}
                </select>
              </label>
              <DateOfBirthField
                label={tx("Date of birth (optional)")}
                value={form.dob}
                onChange={(v) => setForm((f) => ({ ...f, dob: v }))}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={saveEdit} disabled={!form.name.trim()}>
                  {tx("Save changes")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  {tx("Cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <dl>
              <Fact k={tx("Full name")} v={member.name} />
              <Fact k={tx("Relationship")} v={tx(member.relationship)} />
              <Fact
                k={tx("Date of birth")}
                v={member.dob ? isoToDobDisplay(member.dob) || member.dob : tx("Not added")}
              />
              <Fact k={tx("Access")} v={member.linked ? tx("Linked") : tx("Paused")} last />
            </dl>
          )}
        </DetailSection>

        {!member.linked ? (
          <DetailSection title={tx("Access paused")}>
            <p className="text-sm leading-relaxed text-ink-secondary">
              {tx(
                "Link this profile to see health history, consultations, and medications you manage for them.",
              )}
            </p>
            <Button type="button" size="sm" className="mt-4" onClick={toggleLink}>
              {tx("Link profile")}
            </Button>
          </DetailSection>
        ) : (
          <>
            <DetailSection title={tx("Health history")} flush>
              <div className="px-5">
                <DocumentList
                  files={[...library.uploads, ...library.reports]}
                  patientId={member.id}
                  empty={tx("No health records on file yet.")}
                />
              </div>
            </DetailSection>

            <DetailSection title={tx("Consultations")}>
              <RecordList empty={tx("No consultations on file yet.")} rows={consultRows} />
            </DetailSection>

            <DetailSection title={tx("Medications")}>
              <RecordList empty={tx("No medications on file yet.")} rows={medRows} />
            </DetailSection>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmRemove}
        title={tx("Remove this person?")}
        body={tx("They’ll be removed from your family list. You can add them again later.")}
        confirmLabel={tx("Remove")}
        cancelLabel={tx("Keep")}
        danger
        onConfirm={removeMember}
        onClose={() => setConfirmRemove(false)}
      />
    </div>
  );
}

function Fact({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div className={"flex justify-between gap-4 py-3.5 " + (last ? "" : "border-b border-line")}>
      <dt className="text-sm text-ink-tertiary">{k}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">{v}</dd>
    </div>
  );
}

function BackToFamily() {
  const { tx } = useI18n();
  return (
    <Link
      to="/account/family"
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-70"
    >
      <span aria-hidden>←</span> {tx("Back to family")}
    </Link>
  );
}
