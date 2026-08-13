import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { formatFee } from "@/lib/appointments";
import {
  DOCTOR_PHOTO_OPTIONS,
  emptyStaffDraft,
  listStaff,
  newListId,
  removeStaff,
  saveStaff,
  staffTrustScore,
  type StaffExperience,
  type StaffMember,
} from "@/lib/hospitalStaff";
import { useProvider } from "@/lib/providerAuth";
import { WeeklySlotEditor } from "@/components/WeeklySlotEditor";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const AREA =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

export function ProviderDoctors() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const orgId = provider?.id ?? "anon";
  const [staff, setStaff] = useState(() => listStaff(orgId));
  const [draft, setDraft] = useState<StaffMember | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [specInput, setSpecInput] = useState("");
  const [langInput, setLangInput] = useState("");
  const [eduInput, setEduInput] = useState("");
  const [awardInput, setAwardInput] = useState("");
  const [licenseExtra, setLicenseExtra] = useState("");

  const isClinic = provider?.vendorType === "clinic";
  const title = isClinic ? tx("Team") : tx("Doctors");
  const blurb = isClinic
    ? tx("Build complete clinician profiles so patients trust your clinic.")
    : tx("Rich doctor profiles — licences, education, and availability patients can trust.");

  const openCreate = () => {
    setIsNew(true);
    setDraft(emptyStaffDraft());
    setSpecInput("");
    setLangInput("");
    setEduInput("");
    setAwardInput("");
    setLicenseExtra("");
  };

  const openEdit = (m: StaffMember) => {
    setIsNew(false);
    setDraft({ ...m });
    setSpecInput("");
    setLangInput("");
    setEduInput("");
    setAwardInput("");
    setLicenseExtra("");
  };

  const patch = (partial: Partial<StaffMember>) => {
    setDraft((d) => (d ? { ...d, ...partial } : d));
  };

  const save = () => {
    if (!draft || !draft.name.trim()) return;
    saveStaff(orgId, {
      ...draft,
      id: isNew || !draft.id ? undefined : draft.id,
      name: draft.name.trim(),
      specialty: draft.specialty.trim() || "General",
      credentials: draft.credentials.trim() || "MD",
      active: true,
    });
    setStaff(listStaff(orgId));
    setDraft(null);
    setIsNew(false);
  };

  const cancel = () => {
    setDraft(null);
    setIsNew(false);
  };

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pp-caps text-[color:var(--pp-violet)]">{title}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-secondary">{blurb}</p>
        </div>
        {!draft ? (
          <Button size="sm" onClick={openCreate}>
            {tx("Add doctor")}
          </Button>
        ) : null}
      </header>

      {draft ? (
        <DoctorEditor
          draft={draft}
          isNew={isNew}
          patch={patch}
          onSave={save}
          onCancel={cancel}
          specInput={specInput}
          setSpecInput={setSpecInput}
          langInput={langInput}
          setLangInput={setLangInput}
          eduInput={eduInput}
          setEduInput={setEduInput}
          awardInput={awardInput}
          setAwardInput={setAwardInput}
          licenseExtra={licenseExtra}
          setLicenseExtra={setLicenseExtra}
        />
      ) : (
        <ul className="space-y-3">
          {staff.map((m) => {
            const score = staffTrustScore(m);
            return (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4"
              >
                <img
                  src={m.imageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover object-top"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[color:var(--pp-primary-950)]">
                    {m.name}
                    {m.credentials ? (
                      <span className="ml-2 text-sm font-normal text-ink-tertiary">{m.credentials}</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-tertiary">
                    {m.specialty}
                    {m.licenseNumber ? ` · ${m.licenseBody} #${m.licenseNumber}` : ""} · {formatFee(m.feeFrom)}
                  </p>
                  <p className="mt-1 text-2xs text-ink-tertiary">
                    {tx("Trust profile")}: {score}% · {m.slots.length || "—"} {tx("slots")} ·{" "}
                    {m.experienceYears}+ {tx("yrs")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>
                    {tx("Edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      removeStaff(orgId, m.id);
                      setStaff(listStaff(orgId));
                    }}
                  >
                    {tx("Remove")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DoctorEditor({
  draft,
  isNew,
  patch,
  onSave,
  onCancel,
  specInput,
  setSpecInput,
  langInput,
  setLangInput,
  eduInput,
  setEduInput,
  awardInput,
  setAwardInput,
  licenseExtra,
  setLicenseExtra,
}: {
  draft: StaffMember;
  isNew: boolean;
  patch: (p: Partial<StaffMember>) => void;
  onSave: () => void;
  onCancel: () => void;
  specInput: string;
  setSpecInput: (v: string) => void;
  langInput: string;
  setLangInput: (v: string) => void;
  eduInput: string;
  setEduInput: (v: string) => void;
  awardInput: string;
  setAwardInput: (v: string) => void;
  licenseExtra: string;
  setLicenseExtra: (v: string) => void;
}) {
  const { tx } = useI18n();
  const score = staffTrustScore(draft);

  const addChip = (
    value: string,
    key: "specializations" | "languages" | "education" | "awards" | "licenses",
    clear: () => void,
  ) => {
    const v = value.trim();
    if (!v) return;
    if (draft[key].includes(v)) {
      clear();
      return;
    }
    patch({ [key]: [...draft[key], v] });
    clear();
  };

  const removeChip = (
    key: "specializations" | "languages" | "education" | "awards" | "licenses",
    value: string,
  ) => {
    patch({ [key]: draft[key].filter((x) => x !== value) });
  };

  const updateExp = (id: string, partial: Partial<StaffExperience>) => {
    patch({
      experience: draft.experience.map((e) => (e.id === id ? { ...e, ...partial } : e)),
    });
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
            {isNew ? tx("New doctor profile") : tx("Edit profile")}
          </h2>
          <span className="rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
            {tx("Trust score")} {score}%
          </span>
        </div>

        <Section title={tx("Photo & identity")} hint={tx("A clear portrait builds recognition and trust.")}>
          <div className="flex flex-wrap gap-3">
            {DOCTOR_PHOTO_OPTIONS.map((opt) => {
              const on = draft.imageUrl === opt.url;
              return (
                <button
                  key={opt.url}
                  type="button"
                  onClick={() => patch({ imageUrl: opt.url })}
                  className={
                    "overflow-hidden rounded-2xl border-2 " +
                    (on ? "border-[color:var(--pp-primary-950)]" : "border-transparent opacity-80 hover:opacity-100")
                  }
                >
                  <img src={opt.url} alt={opt.label} className="h-20 w-16 object-cover object-top" />
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={tx("Full name")}>
              <input className={FIELD} value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label={tx("Credentials")}>
              <input
                className={FIELD}
                value={draft.credentials}
                onChange={(e) => patch({ credentials: e.target.value })}
                placeholder={tx("e.g. MD, FRCPC")}
              />
            </Field>
            <Field label={tx("Primary specialty")}>
              <input
                className={FIELD}
                value={draft.specialty}
                onChange={(e) => patch({ specialty: e.target.value })}
              />
            </Field>
            <Field label={tx("Years of experience")}>
              <input
                type="number"
                min={0}
                className={FIELD}
                value={draft.experienceYears}
                onChange={(e) => patch({ experienceYears: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label={tx("Consult fee (CAD)")}>
              <input
                type="number"
                min={0}
                className={FIELD}
                value={draft.feeFrom}
                onChange={(e) => patch({ feeFrom: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label={tx("Availability summary")}>
              <input
                className={FIELD}
                value={draft.availability}
                onChange={(e) => patch({ availability: e.target.value })}
                placeholder={tx("Auto-filled from slots if empty")}
              />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Toggle
              label={tx("Virtual visits")}
              on={draft.virtual}
              onChange={(v) => patch({ virtual: v })}
            />
            <Toggle
              label={tx("In-clinic visits")}
              on={draft.clinic}
              onChange={(v) => patch({ clinic: v })}
            />
          </div>
        </Section>

        <Section title={tx("Specialisations")} hint={tx("Focus areas patients scan first.")}>
          <ChipEditor
            items={draft.specializations}
            input={specInput}
            setInput={setSpecInput}
            placeholder={tx("Add focus area")}
            onAdd={() => addChip(specInput, "specializations", () => setSpecInput(""))}
            onRemove={(v) => removeChip("specializations", v)}
          />
        </Section>

        <Section title={tx("Licence & credentials")} hint={tx("Licence numbers reassure patients this is a real clinician.")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx("Licence body")}>
              <input
                className={FIELD}
                value={draft.licenseBody}
                onChange={(e) => patch({ licenseBody: e.target.value })}
                placeholder={tx("e.g. CPSO")}
              />
            </Field>
            <Field label={tx("Licence number")}>
              <input
                className={FIELD}
                value={draft.licenseNumber}
                onChange={(e) => patch({ licenseNumber: e.target.value })}
                placeholder={tx("Registration #")}
              />
            </Field>
          </div>
          <div className="mt-4">
            <p className={LABEL}>{tx("Additional licences / certifications")}</p>
            <ChipEditor
              items={draft.licenses}
              input={licenseExtra}
              setInput={setLicenseExtra}
              placeholder={tx("e.g. ACLS certified")}
              onAdd={() => addChip(licenseExtra, "licenses", () => setLicenseExtra(""))}
              onRemove={(v) => removeChip("licenses", v)}
            />
          </div>
        </Section>

        <Section title={tx("Personal details")} hint={tx("How patients reach and understand you.")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx("Phone")}>
              <input
                className={FIELD}
                value={draft.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                inputMode="tel"
              />
            </Field>
            <Field label={tx("Email")}>
              <input
                className={FIELD}
                type="email"
                value={draft.email}
                onChange={(e) => patch({ email: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4">
            <p className={LABEL}>{tx("Languages")}</p>
            <ChipEditor
              items={draft.languages}
              input={langInput}
              setInput={setLangInput}
              placeholder={tx("Add language")}
              onAdd={() => addChip(langInput, "languages", () => setLangInput(""))}
              onRemove={(v) => removeChip("languages", v)}
            />
          </div>
          <div className="mt-4 grid gap-4">
            <Field label={tx("Short bio (card)")}>
              <textarea
                className={AREA}
                rows={2}
                value={draft.bio}
                onChange={(e) => patch({ bio: e.target.value })}
                placeholder={tx("One or two sentences patients see first.")}
              />
            </Field>
            <Field label={tx("About (detail page)")}>
              <textarea
                className={AREA}
                rows={4}
                value={draft.about}
                onChange={(e) => patch({ about: e.target.value })}
                placeholder={tx("Deeper story — approach, what patients can expect.")}
              />
            </Field>
          </div>
        </Section>

        <Section title={tx("Education & study")} hint={tx("Where they trained and certified.")}>
          <ChipEditor
            items={draft.education}
            input={eduInput}
            setInput={setEduInput}
            placeholder={tx("e.g. MD, University of Toronto")}
            onAdd={() => addChip(eduInput, "education", () => setEduInput(""))}
            onRemove={(v) => removeChip("education", v)}
          />
        </Section>

        <Section title={tx("Awards & recognition")}>
          <ChipEditor
            items={draft.awards}
            input={awardInput}
            setInput={setAwardInput}
            placeholder={tx("Add award")}
            onAdd={() => addChip(awardInput, "awards", () => setAwardInput(""))}
            onRemove={(v) => removeChip("awards", v)}
          />
        </Section>

        <Section title={tx("Work experience")} hint={tx("Roles that show a real career path.")}>
          <ul className="space-y-3">
            {draft.experience.map((e) => (
              <li key={e.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_7rem_auto]">
                <input
                  className={FIELD}
                  value={e.role}
                  onChange={(ev) => updateExp(e.id, { role: ev.target.value })}
                  placeholder={tx("Role")}
                />
                <input
                  className={FIELD}
                  value={e.organization}
                  onChange={(ev) => updateExp(e.id, { organization: ev.target.value })}
                  placeholder={tx("Organization")}
                />
                <input
                  className={FIELD}
                  value={e.years}
                  onChange={(ev) => updateExp(e.id, { years: ev.target.value })}
                  placeholder={tx("Years")}
                />
                <button
                  type="button"
                  className="text-sm text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
                  onClick={() => patch({ experience: draft.experience.filter((x) => x.id !== e.id) })}
                >
                  {tx("Remove")}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-[color:var(--pp-violet)]"
            onClick={() =>
              patch({
                experience: [
                  ...draft.experience,
                  { id: newListId("exp"), role: "", organization: "", years: "" },
                ],
              })
            }
          >
            + {tx("Add experience")}
          </button>
        </Section>

        <Section title={tx("Available slots")} hint={tx("Day, start, and end — easy for patients to scan.")}>
          <WeeklySlotEditor
            slots={draft.slots}
            onAdd={({ day, window }) =>
              patch({
                slots: [...draft.slots, { id: newListId("slot"), day, window }],
              })
            }
            onRemove={(id) => patch({ slots: draft.slots.filter((x) => x.id !== id) })}
          />
        </Section>

        <div className="flex flex-wrap gap-2 pb-8">
          <Button onClick={onSave} disabled={!draft.name.trim()}>
            {tx("Save profile")}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            {tx("Cancel")}
          </Button>
        </div>
      </div>

      <aside className="h-fit lg:sticky lg:top-28">
        <PatientTrustPreview doctor={draft} />
      </aside>
    </div>
  );
}

function PatientTrustPreview({ doctor }: { doctor: StaffMember }) {
  const { tx } = useI18n();
  return (
    <div className="rounded-[1.75rem] border border-[#E6E1EF] bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.05)]">
      <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Patient view")}</p>
      <p className="mt-1 text-2xs text-ink-tertiary">{tx("What builds trust on the care hub.")}</p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-[color:var(--pp-primary-100)]/40">
        <div className="flex gap-3 p-4">
          <img
            src={doctor.imageUrl}
            alt=""
            className="h-24 w-20 shrink-0 rounded-xl object-cover object-top"
          />
          <div className="min-w-0">
            <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Doctor")}</p>
            <p className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {doctor.name.trim() || tx("Doctor name")}
            </p>
            <p className="text-sm text-ink-secondary">
              {doctor.specialty || tx("Specialty")}
              {doctor.credentials ? ` · ${doctor.credentials}` : ""}
            </p>
            <p className="mt-2 text-2xs text-ink-tertiary">
              ★ 4.8 · {doctor.experienceYears}+ {tx("yrs")}
              {doctor.licenseNumber ? ` · ${doctor.licenseBody} #${doctor.licenseNumber}` : ""}
            </p>
          </div>
        </div>
      </div>

      {doctor.bio ? <p className="mt-3 text-sm text-ink-secondary">{doctor.bio}</p> : null}

      {doctor.specializations.length > 0 ? (
        <PreviewBlock title={tx("Specialisations")}>
          <div className="flex flex-wrap gap-1.5">
            {doctor.specializations.map((s) => (
              <span
                key={s}
                className="rounded-full bg-[color:var(--pp-primary-100)] px-2.5 py-1 text-2xs font-medium text-[color:var(--pp-primary-950)]"
              >
                {s}
              </span>
            ))}
          </div>
        </PreviewBlock>
      ) : null}

      {(doctor.licenseNumber || doctor.licenses.length > 0) && (
        <PreviewBlock title={tx("Licences")}>
          {doctor.licenseNumber ? (
            <p className="text-sm text-[color:var(--pp-primary-950)]">
              {doctor.licenseBody} #{doctor.licenseNumber}
            </p>
          ) : null}
          <ul className="mt-1 space-y-1">
            {doctor.licenses.map((l) => (
              <li key={l} className="text-sm text-ink-secondary">
                {l}
              </li>
            ))}
          </ul>
        </PreviewBlock>
      )}

      {doctor.education.length > 0 ? (
        <PreviewBlock title={tx("Education")}>
          <ul className="space-y-1">
            {doctor.education.map((e) => (
              <li key={e} className="text-sm text-ink-secondary">
                {e}
              </li>
            ))}
          </ul>
        </PreviewBlock>
      ) : null}

      {doctor.experience.length > 0 ? (
        <PreviewBlock title={tx("Experience")}>
          <ul className="space-y-2">
            {doctor.experience.map((e) => (
              <li key={e.id} className="text-sm">
                <span className="font-medium text-[color:var(--pp-primary-950)]">{e.role || "—"}</span>
                <span className="block text-2xs text-ink-tertiary">
                  {e.organization}
                  {e.years ? ` · ${e.years}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </PreviewBlock>
      ) : null}

      {doctor.awards.length > 0 ? (
        <PreviewBlock title={tx("Awards")}>
          <ul className="space-y-1">
            {doctor.awards.map((a) => (
              <li key={a} className="text-sm text-ink-secondary">
                {a}
              </li>
            ))}
          </ul>
        </PreviewBlock>
      ) : null}

      {doctor.slots.length > 0 ? (
        <PreviewBlock title={tx("Available slots")}>
          <ul className="space-y-1">
            {doctor.slots.map((s) => (
              <li key={s.id} className="text-sm text-ink-secondary">
                <span className="font-medium text-[color:var(--pp-primary-950)]">{s.day}</span> · {s.window}
              </li>
            ))}
          </ul>
        </PreviewBlock>
      ) : null}

      {doctor.languages.length > 0 ? (
        <p className="mt-3 text-2xs text-ink-tertiary">
          {tx("Languages")}: {doctor.languages.join(", ")}
        </p>
      ) : null}

      <p className="mt-4 text-center text-sm font-medium text-[color:var(--pp-primary-950)]">
        {formatFee(doctor.feeFrom)} {tx("consult")}
      </p>
    </div>
  );
}

function PreviewBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h3 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">{title}</h3>
      {hint ? <p className="mt-1 text-sm text-ink-tertiary">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

function Toggle({
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
        "rounded-full px-3.5 py-1.5 text-sm font-medium " +
        (on
          ? "bg-[color:var(--pp-primary-950)] text-white"
          : "border border-line bg-white text-[color:var(--pp-primary-950)]")
      }
    >
      {label}
    </button>
  );
}

function ChipEditor({
  items,
  input,
  setInput,
  placeholder,
  onAdd,
  onRemove,
}: {
  items: string[];
  input: string;
  setInput: (v: string) => void;
  placeholder: string;
  onAdd: () => void;
  onRemove: (v: string) => void;
}) {
  const { tx } = useI18n();
  return (
    <div>
      {items.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onRemove(item)}
              className="rounded-full bg-[color:var(--pp-primary-100)] px-3 py-1 text-2xs font-medium text-[color:var(--pp-primary-950)] hover:opacity-80"
              title={tx("Remove")}
            >
              {item} ×
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          className={FIELD}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={onAdd}>
          {tx("Add")}
        </Button>
      </div>
    </div>
  );
}
