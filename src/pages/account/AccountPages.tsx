import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui";
import { useUser, type Profile } from "@/lib/user";
import {
  ensureDemoAccounts,
  LANG_META,
  loadFamily,
  loadLanguage,
  loadNotifs,
  newFamilyId,
  saveFamily,
  saveLanguage,
  saveNotifs,
  upsertSavedAccount,
  type FamilyMember,
  type LangCode,
  type NotifPrefs,
  type SavedAccount,
} from "@/lib/accountPrefs";

const CARD = "rounded-2xl border border-line bg-white";
const FIELD =
  "h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-base text-ink outline-none focus:border-primary";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

function PageHead({
  eyebrow = "Account",
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <header className="mb-8">
      <p className="pp-caps text-[color:var(--pp-violet)]">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
        {title}
      </h1>
      {sub && <p className="mt-2 max-w-xl text-base text-ink-secondary">{sub}</p>}
    </header>
  );
}

function BackLink() {
  return (
    <Link
      to="/account"
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-70"
    >
      <span aria-hidden>←</span> Edit profile
    </Link>
  );
}

function SavedToast({ show, label = "Saved" }: { show: boolean; label?: string }) {
  return (
    <p className="sr-only" aria-live="polite">
      {show ? label : ""}
    </p>
  );
}

/* ── Notifications ─────────────────────────────────────── */
const NOTIF_ROWS: { key: keyof NotifPrefs; title: string; desc: string }[] = [
  { key: "meds", title: "Medication reminders", desc: "Dose times and adherence nudges." },
  { key: "delivery", title: "Delivery updates", desc: "When your order ships and arrives." },
  { key: "refill", title: "Refill reminders", desc: "Before you run out of refills." },
  { key: "care", title: "Care team messages", desc: "Clinician and pharmacist replies." },
  { key: "marketing", title: "Offers & tips", desc: "Occasional product news. Optional." },
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState(() => loadNotifs());
  const [saved, setSaved] = useState(false);

  const set = (key: keyof NotifPrefs, value: boolean) => {
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      saveNotifs(next);
      return next;
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div>
      <BackLink />
      <PageHead
        title="Notification settings"
        sub="Choose how PocketPills keeps you in the loop. Changes save automatically."
      />
      <SavedToast show={saved} />

      <section className={`${CARD} divide-y divide-line overflow-hidden`}>
        {NOTIF_ROWS.map((row) => (
          <div key={row.key} className="px-5 py-4 sm:px-6">
            <Switch
              checked={prefs[row.key]}
              onChange={(v) => set(row.key, v)}
              label={row.title}
              desc={row.desc}
              id={`notif-${row.key}`}
            />
          </div>
        ))}
      </section>

      <p className="mt-4 text-xs text-ink-tertiary">
        Transactional emails (receipts, security) always send. Manage SMS in your phone settings.
      </p>
    </div>
  );
}

/* ── Language ──────────────────────────────────────────── */
export function LanguagePreference() {
  const [lang, setLang] = useState<LangCode>(() => loadLanguage());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    saveLanguage(lang);
  }, []);

  const choose = (code: LangCode) => {
    setLang(code);
    saveLanguage(code);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div>
      <BackLink />
      <PageHead
        title="Language preference"
        sub="Sets the language for emails and in-app copy. Care visits stay in your preferred language when available."
      />
      <SavedToast show={saved} label="Language updated" />

      <div className="space-y-3" role="radiogroup" aria-label="Language">
        {(Object.keys(LANG_META) as LangCode[]).map((code) => {
          const meta = LANG_META[code];
          const on = lang === code;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => choose(code)}
              className={
                `${CARD} flex w-full items-start gap-4 p-5 text-left transition-colors ` +
                (on
                  ? "ring-2 ring-[color:var(--pp-primary-950)]"
                  : "hover:bg-[color:var(--state-hover)]")
              }
            >
              <span
                className={
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 " +
                  (on
                    ? "border-[color:var(--pp-primary-950)]"
                    : "border-line")
                }
                aria-hidden
              >
                {on && <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--pp-primary-950)]" />}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-[color:var(--pp-primary-950)]">{meta.native}</span>
                <span className="mt-0.5 block text-sm text-ink-secondary">{meta.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-sm text-ink-tertiary">
        Demo note: UI strings stay in English; your preference is stored for when localization ships.
      </p>
    </div>
  );
}

/* ── Family ────────────────────────────────────────────── */
const RELATIONS = ["Spouse / partner", "Child", "Parent", "Sibling", "Other"];

export function ManageFamily() {
  const [members, setMembers] = useState<FamilyMember[]>(() => loadFamily());
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: RELATIONS[0], dob: "" });
  const [saved, setSaved] = useState(false);

  const persist = (next: FamilyMember[]) => {
    setMembers(next);
    saveFamily(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  const add = () => {
    const name = form.name.trim();
    if (!name) return;
    persist([
      ...members,
      {
        id: newFamilyId(),
        name,
        relationship: form.relationship,
        dob: form.dob.trim(),
        linked: true,
      },
    ]);
    setForm({ name: "", relationship: RELATIONS[0], dob: "" });
    setAdding(false);
  };

  const remove = (id: string) => persist(members.filter((m) => m.id !== id));
  const toggleLink = (id: string) =>
    persist(members.map((m) => (m.id === id ? { ...m, linked: !m.linked } : m)));

  return (
    <div>
      <BackLink />
      <PageHead
        title="Manage family"
        sub="Add people you manage medications for. Each person gets their own profile once they accept an invite."
      />
      <SavedToast show={saved} />

      {members.length === 0 && !adding && (
        <div className={`${CARD} px-6 py-12 text-center`}>
          <p className="font-semibold text-[color:var(--pp-primary-950)]">No family members yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-secondary">
            Add a spouse, child, or parent so refills and deliveries stay organized in one place.
          </p>
          <Button type="button" size="sm" className="mt-5" onClick={() => setAdding(true)}>
            Add family member
          </Button>
        </div>
      )}

      {members.length > 0 && (
        <ul className="space-y-3">
          {members.map((m) => (
            <li key={m.id} className={`${CARD} flex flex-wrap items-center gap-4 p-5`}>
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-sm font-semibold text-[color:var(--pp-primary-950)]"
                aria-hidden
              >
                {m.name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[color:var(--pp-primary-950)]">{m.name}</p>
                <p className="text-sm text-ink-tertiary">
                  {m.relationship}
                  {m.dob ? ` · Born ${m.dob}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleLink(m.id)}
                  aria-pressed={m.linked}
                  className={
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (m.linked
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : "bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)]")
                  }
                >
                  {m.linked ? "Linked" : "Paused"}
                </button>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(m.id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <section className={`${CARD} mt-4 space-y-4 p-5 sm:p-6`}>
          <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            Add family member
          </h2>
          <label className="block">
            <span className={LABEL}>Full name</span>
            <input
              className={FIELD}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className={LABEL}>Relationship</span>
            <select
              className={FIELD}
              value={form.relationship}
              onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
            >
              {RELATIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>Date of birth (optional)</span>
            <input
              className={FIELD}
              value={form.dob}
              onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={add} disabled={!form.name.trim()}>
              Save member
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </section>
      )}

      {members.length > 0 && !adding && (
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => setAdding(true)}>
          Add another
        </Button>
      )}
    </div>
  );
}

/* ── Benefits ──────────────────────────────────────────── */
const BENEFITS = [
  {
    title: "Free delivery, every time",
    body: "Standard shipping to every province and territory — no membership fee.",
  },
  {
    title: "Direct insurance billing",
    body: "We bill your provincial and private plans so you only pay what’s left.",
  },
  {
    title: "Licensed Canadian care",
    body: "Pharmacists and clinicians review every prescription before it ships.",
  },
  {
    title: "PocketPacks & auto-refill",
    body: "Sorted pouches and refill reminders so you never scramble for a fill.",
  },
  {
    title: "Family coverage",
    body: "Manage meds for the people you care for from one account.",
  },
];

export function PocketpillsBenefits() {
  const nav = useNavigate();
  return (
    <div>
      <BackLink />
      <PageHead
        title="Pocketpills benefits"
        sub="What’s included with your account — no paid tier required."
      />

      <div className="relative overflow-hidden rounded-2xl border border-line bg-[color:var(--pp-primary-100)] p-6 sm:p-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">Included</p>
        <h2 className="mt-2 font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
          Care that comes with the account
        </h2>
        <p className="mt-2 max-w-lg text-sm text-ink-secondary">
          PocketPills is built around free delivery and pharmacist oversight — not upsells.
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {BENEFITS.map((b) => (
          <li key={b.title} className={`${CARD} p-5`}>
            <p className="font-semibold text-[color:var(--pp-primary-950)]">{b.title}</p>
            <p className="mt-1 text-sm text-ink-secondary">{b.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" onClick={() => nav("/fill")}>
          Fill a prescription
        </Button>
        <Button type="button" variant="secondary" onClick={() => nav("/find-care")}>
          Explore treatments
        </Button>
      </div>
    </div>
  );
}

/* ── Switch account ────────────────────────────────────── */
function initialsOf(a: { firstName: string; lastName: string; email: string }) {
  const f = a.firstName?.[0] ?? a.email?.[0] ?? "?";
  const l = a.lastName?.[0] ?? "";
  return (f + l).toUpperCase();
}

export function SwitchAccount() {
  const nav = useNavigate();
  const { user, replace, displayName, logOut } = useUser();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [switched, setSwitched] = useState(false);

  useEffect(() => {
    if (!user) return;
    setAccounts(
      ensureDemoAccounts({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        snapshot: { ...user },
      }),
    );
  }, [user]);

  const activeEmail = user?.email?.toLowerCase() ?? "";

  const switchTo = (account: SavedAccount) => {
    if (!user || account.email.toLowerCase() === activeEmail) return;

    upsertSavedAccount({
      id: `acc_${user.email}`,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      snapshot: { ...user },
    });

    const snap = (account.snapshot ?? {
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      onboarded: true,
    }) as Profile;
    replace({ ...snap, email: account.email });
    setSwitched(true);
    window.setTimeout(() => {
      setSwitched(false);
      nav("/dashboard");
    }, 600);
  };

  const sorted = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        if (a.email.toLowerCase() === activeEmail) return -1;
        if (b.email.toLowerCase() === activeEmail) return 1;
        return a.firstName.localeCompare(b.firstName);
      }),
    [accounts, activeEmail],
  );

  return (
    <div>
      <BackLink />
      <PageHead
        title="Switch account"
        sub={`Signed in as ${displayName}. Pick another profile on this device, or add one.`}
      />
      <SavedToast show={switched} label="Account switched" />

      <ul className="space-y-3" role="list">
        {sorted.map((a) => {
          const active = a.email.toLowerCase() === activeEmail;
          return (
            <li key={a.id}>
              <button
                type="button"
                disabled={active}
                onClick={() => switchTo(a)}
                className={
                  `${CARD} flex w-full items-center gap-4 p-5 text-left transition-colors ` +
                  (active
                    ? "ring-2 ring-[color:var(--pp-primary-950)]"
                    : "hover:bg-[color:var(--state-hover)]")
                }
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-950)] text-sm font-semibold text-white">
                  {initialsOf(a)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[color:var(--pp-primary-950)]">
                    {[a.firstName, a.lastName].filter(Boolean).join(" ") || a.email.split("@")[0]}
                  </span>
                  <span className="block truncate text-sm text-ink-tertiary">{a.email}</span>
                </span>
                {active ? (
                  <span className="text-xs font-semibold text-[color:var(--pp-violet)]">Current</span>
                ) : (
                  <span className="text-sm font-medium text-[color:var(--pp-violet)]">Switch</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={`${CARD} mt-6 flex flex-wrap items-center gap-4 p-5`}>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[color:var(--pp-primary-950)]">Add another account</p>
          <p className="text-sm text-ink-tertiary">Sign in with a different email on this device.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            if (user) {
              upsertSavedAccount({
                id: `acc_${user.email}`,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                snapshot: { ...user },
              });
            }
            logOut();
            nav("/login");
          }}
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}
