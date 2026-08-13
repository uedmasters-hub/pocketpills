import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  attachLabBookingOrder,
  createLabBooking,
  getLab,
  labCollectionModeLabel,
  readLabDraft,
  resolveLabItem,
  summarizeLabSelection,
} from "@/lib/labs";
import { createLabOrder } from "@/lib/orders";
import { ServiceCtaCard, ServicePageShell } from "@/pages/appointments/ServicePageShell";

export function BookLab() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { id = "" } = useParams();
  const lab = getLab(id);

  const draft = useMemo(() => {
    const d = readLabDraft();
    if (!d || d.labId !== id) return null;
    return d;
  }, [id]);

  const summary = useMemo(
    () => (draft ? summarizeLabSelection(draft.itemIds) : { names: "", fee: 0, count: 0 }),
    [draft],
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState<{ confirmationNo: string; names: string; date: string; time: string } | null>(
    null,
  );

  if (!lab) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">{tx("Lab not found")}</p>
        <Link to="/appointments" className="mt-4 inline-block text-sm text-[color:var(--pp-violet)]">
          ‹ {tx("Back")}
        </Link>
      </div>
    );
  }

  if (!draft && !done) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">
          {tx("Select services first")}
        </p>
        <p className="mt-2 text-sm text-ink-tertiary">
          {tx("Pick packages, scans, or tests on the lab page, then continue.")}
        </p>
        <Link
          to={`/appointments/labs/${lab.id}`}
          className="mt-4 inline-block text-sm font-medium text-[color:var(--pp-violet)]"
        >
          ← {tx("Back to lab")}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <ServicePageShell
        backTo="/appointments"
        aside={
          <ServiceCtaCard
            eyebrow={tx("Confirmed")}
            body={
              <span>
                {done.names}
                <span className="mt-1 block text-ink-tertiary">
                  {done.date} · {done.time}
                </span>
              </span>
            }
            cta={tx("Back to care")}
            onCta={() => nav("/appointments")}
            footer={<span className="font-mono">{done.confirmationNo}</span>}
          />
        }
      >
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Lab")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Lab visit booked")}
        </h1>
        <p className="mt-2 text-ink-secondary">{lab.name}</p>
        <p className="mt-4 text-sm text-ink-tertiary">
          {tx("We’ll text a reminder before your visit. Bring your OHIP card and any referral for imaging.")}
        </p>
      </ServicePageShell>
    );
  }

  const lineItems = draft!.itemIds
    .map((itemId) => resolveLabItem(itemId))
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((r) => ({
      id: r.item.id,
      name: r.name,
      fee: r.fee,
      collection: r.collection,
      isPackage: r.type === "bundle",
    }));

  const grouped = (
    [
      { mode: "home" as const, items: lineItems.filter((i) => i.collection === "home") },
      { mode: "physical" as const, items: lineItems.filter((i) => i.collection === "physical") },
    ] as const
  ).filter((g) => g.items.length > 0);

  return (
    <ServicePageShell
      backTo={`/appointments/labs/${lab.id}`}
      aside={
        <ServiceCtaCard
          eyebrow={`${draft!.date} · ${draft!.time}`}
          priceHint={tx("Estimated total")}
          price={summary.fee <= 0 ? tx("FREE") : `$${summary.fee.toFixed(2)}`}
          body={tx("{n} services").replace("{n}", String(summary.count))}
          cta={tx("Confirm booking")}
          ctaDisabled={!name.trim()}
          onCta={() => {
            const b = createLabBooking({
              labId: lab.id,
              itemIds: draft!.itemIds,
              date: draft!.date,
              time: draft!.time,
              patientName: name.trim(),
            });
            if (b) {
              const order = createLabOrder({
                labName: lab.name,
                labAddress: `${lab.address}, ${lab.city}`,
                itemNames: b.itemNames,
                fee: b.fee,
                date: b.date,
                time: b.time,
                patient: name.trim(),
                labBookingId: b.id,
                confirmationNo: b.confirmationNo,
              });
              attachLabBookingOrder(b.id, order.id);
              setDone({
                confirmationNo: b.confirmationNo,
                names: b.itemNames,
                date: b.date,
                time: b.time,
              });
            }
          }}
          footer={phone.trim() ? tx("We'll use your phone for visit reminders.") : undefined}
        />
      }
    >
      <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Lab")}</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Your details")}
      </h1>
      <p className="mt-2 text-ink-secondary">{lab.name}</p>

      <h2 className="mt-8 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
        {tx("Selected services")}
      </h2>
      <div className="mt-3 space-y-5">
        {grouped.map((group) => (
          <div key={group.mode}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {tx(labCollectionModeLabel(group.mode))}
            </p>
            <ul className="mt-2 space-y-2">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm"
                >
                  <span>
                    <span className="font-medium text-[color:var(--pp-primary-950)]">{tx(item.name)}</span>
                    {item.isPackage ? (
                      <span className="mt-0.5 block text-2xs text-ink-tertiary">{tx("Package")}</span>
                    ) : null}
                  </span>
                  <span
                    className={
                      "shrink-0 font-semibold tnum " +
                      (item.fee <= 0
                        ? "text-[color:var(--pp-green)]"
                        : "text-[color:var(--pp-primary-950)]")
                    }
                  >
                    {item.fee <= 0 ? tx("FREE") : `$${item.fee.toFixed(2)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
        {tx("Patient")}
      </h2>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-[color:var(--pp-primary-950)]">
            {tx("Full name")} <span className="text-ink-tertiary">*</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
            placeholder={tx("Name on OHIP card")}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx("Phone")}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
            placeholder="(416) 555-0100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[color:var(--pp-primary-950)]">
            {tx("Notes")} <span className="font-normal text-ink-tertiary">({tx("optional")})</span>
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1.5 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
            placeholder={tx("Fasting, referral #, preferred arm…")}
          />
        </label>
      </div>
    </ServicePageShell>
  );
}
