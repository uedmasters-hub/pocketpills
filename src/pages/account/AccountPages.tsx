import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui";
import { useUser, type Profile } from "@/lib/user";
import {
  ensureDemoAccounts,
  LANG_META,
  loadFamily,
  loadNotifs,
  newFamilyId,
  saveFamily,
  saveNotifs,
  upsertSavedAccount,
  type FamilyMember,
  type LangCode,
  type NotifChannel,
  type NotifPrefs,
  type NotifTopic,
  type SavedAccount,
} from "@/lib/accountPrefs";
import { useI18n } from "@/lib/i18n";

const CARD = "rounded-2xl border border-line bg-white";
const FIELD =
  "h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-base text-ink outline-none focus:border-primary";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

function PageHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  const { tx } = useI18n();
  return (
    <header className="mb-8">
      <p className="pp-caps text-[color:var(--pp-violet)]">{eyebrow ?? tx("Account")}</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
        {title}
      </h1>
      {sub && <p className="mt-2 max-w-xl text-base text-ink-secondary">{sub}</p>}
    </header>
  );
}

function BackLink() {
  const { t } = useI18n();
  return (
    <Link
      to="/account"
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-70"
    >
      <span aria-hidden>←</span> {t("lang.back")}
    </Link>
  );
}

function SavedToast({ show, label }: { show: boolean; label?: string }) {
  const { tx } = useI18n();
  return (
    <p className="sr-only" aria-live="polite">
      {show ? (label ?? tx("Saved")) : ""}
    </p>
  );
}

/* ── Notifications ─────────────────────────────────────── */
const NOTIF_CHANNELS: { key: NotifChannel; title: string; desc: string }[] = [
  {
    key: "sms",
    title: "SMS",
    desc: "Text messages to your phone number on file.",
  },
  {
    key: "email",
    title: "Email",
    desc: "Messages to the email on your account.",
  },
  {
    key: "app",
    title: "App notification",
    desc: "Push alerts in the PocketPills app.",
  },
];

const NOTIF_TOPICS: { key: NotifTopic; label: string }[] = [
  { key: "meds", label: "Medication reminders" },
  { key: "delivery", label: "Delivery updates" },
  { key: "refill", label: "Refill reminders" },
  { key: "care", label: "Care team messages" },
  { key: "marketing", label: "Offers & tips" },
];

/** Defaults applied when a channel is turned on. */
const CHANNEL_ON_DEFAULTS: Record<NotifTopic, boolean> = {
  meds: true,
  delivery: true,
  refill: true,
  care: true,
  marketing: false,
};

export function NotificationSettings() {
  const { tx } = useI18n();
  const [prefs, setPrefs] = useState(() => loadNotifs());
  const [saved, setSaved] = useState(false);

  const persist = (next: NotifPrefs) => {
    saveNotifs(next);
    setPrefs(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  const channelOn = (channel: NotifChannel) =>
    NOTIF_TOPICS.some((t) => prefs[t.key][channel]);

  const setChannelEnabled = (channel: NotifChannel, on: boolean) => {
    const next = { ...prefs };
    for (const topic of NOTIF_TOPICS) {
      next[topic.key] = {
        ...prefs[topic.key],
        [channel]: on ? CHANNEL_ON_DEFAULTS[topic.key] : false,
      };
    }
    persist(next);
  };

  const setTopic = (topic: NotifTopic, channel: NotifChannel, value: boolean) => {
    persist({
      ...prefs,
      [topic]: { ...prefs[topic], [channel]: value },
    });
  };

  return (
    <div>
      <BackLink />
      <PageHead
        title={tx("Notification settings")}
        sub={tx("Turn a channel on or off. Optionally refine topics when it’s on. Changes save automatically.")}
      />
      <SavedToast show={saved} />

      <h2 className="mb-4 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("How should we keep you updated?")}
      </h2>

      <div className="space-y-4">
        {NOTIF_CHANNELS.map((channel) => {
          const on = channelOn(channel.key);
          return (
            <section key={channel.key} className={`${CARD} overflow-hidden`}>
              <div className="px-5 py-5 sm:px-6">
                <Switch
                  checked={on}
                  onChange={(v) => setChannelEnabled(channel.key, v)}
                  label={tx(channel.title)}
                  desc={tx(channel.desc)}
                  id={`notif-channel-${channel.key}`}
                />
              </div>

              {on && (
                <fieldset className="space-y-1 border-t border-line px-5 py-4 sm:px-6">
                  <legend className="mb-2 px-2 text-xs font-medium text-ink-tertiary">
                    {tx("Include (optional)")}
                  </legend>
                  {NOTIF_TOPICS.map((topic) => {
                    const id = `notif-${channel.key}-${topic.key}`;
                    return (
                      <label
                        key={topic.key}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[color:var(--pp-primary-200)]"
                      >
                        <input
                          id={id}
                          type="checkbox"
                          checked={prefs[topic.key][channel.key]}
                          onChange={(e) => setTopic(topic.key, channel.key, e.target.checked)}
                          className="h-4 w-4 shrink-0 rounded border-line accent-[color:var(--pp-primary-950)]"
                        />
                        <span className="text-sm font-medium text-[color:var(--pp-primary-950)]">
                          {tx(topic.label)}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              )}
            </section>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-ink-tertiary">
        {tx("Transactional emails (receipts, security) always send. Carrier rates may apply for SMS.")}
      </p>
    </div>
  );
}

/* ── Language ──────────────────────────────────────────── */
export function LanguagePreference() {
  const { lang, setLang, t } = useI18n();
  const [saved, setSaved] = useState(false);

  const choose = (code: LangCode) => {
    setLang(code);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div>
      <BackLink />
      <PageHead
        eyebrow={t("lang.eyebrow")}
        title={t("lang.title")}
        sub={t("lang.sub")}
      />
      <SavedToast show={saved} label={t("lang.updated")} />

      <div className="space-y-3" role="radiogroup" aria-label={t("lang.group")}>
        {(Object.keys(LANG_META) as LangCode[]).map((code) => {
          const meta = LANG_META[code];
          const on = lang === code;
          const hintKey =
            code === "en" ? "lang.hint.en" : code === "fr" ? "lang.hint.fr" : "lang.hint.ne";
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
                <span className="mt-0.5 block text-sm text-ink-secondary">{t(hintKey)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-sm text-ink-tertiary">{t("lang.live")}</p>
    </div>
  );
}

/* ── Family ────────────────────────────────────────────── */
const RELATIONS = ["Spouse / partner", "Child", "Parent", "Sibling", "Other"];

export function ManageFamily() {
  const { tx } = useI18n();
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
        title={tx("Manage family")}
        sub={tx("Add people you manage medications for. Each person gets their own profile once they accept an invite.")}
      />
      <SavedToast show={saved} />

      {members.length === 0 && !adding && (
        <div className={`${CARD} px-6 py-12 text-center`}>
          <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("No family members yet")}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-secondary">
            {tx("Add a spouse, child, or parent so refills and deliveries stay organized in one place.")}
          </p>
          <Button type="button" size="sm" className="mt-5" onClick={() => setAdding(true)}>
            {tx("Add family member")}
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
                  {tx(m.relationship)}
                  {m.dob ? ` · ${tx("Born")} ${m.dob}` : ""}
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
                  {m.linked ? tx("Linked") : tx("Paused")}
                </button>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(m.id)}>
                  {tx("Remove")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <section className={`${CARD} mt-4 space-y-4 p-5 sm:p-6`}>
          <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("Add family member")}
          </h2>
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
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {tx(r)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>{tx("Date of birth (optional)")}</span>
            <input
              className={FIELD}
              value={form.dob}
              onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={add} disabled={!form.name.trim()}>
              {tx("Save member")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              {tx("Cancel")}
            </Button>
          </div>
        </section>
      )}

      {members.length > 0 && !adding && (
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => setAdding(true)}>
          {tx("Add another")}
        </Button>
      )}
    </div>
  );
}

/* ── Benefits ──────────────────────────────────────────── */
type BenefitIconId = "delivery" | "billing" | "care" | "packs" | "family";

function BenefitIcon({ id }: { id: BenefitIconId }) {
  const c = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (id) {
    case "delivery":
      return (
        <svg {...c}>
          <path d="M3.5 7.5h11v9h-11z" />
          <path d="M14.5 10.5h3.2l2.3 3v3h-5.5z" />
          <circle cx="7.5" cy="17.5" r="1.6" />
          <circle cx="17.5" cy="17.5" r="1.6" />
        </svg>
      );
    case "billing":
      return (
        <svg {...c}>
          <path d="M12 3.5 19.5 7v5.2c0 4.2-2.9 7.4-7.5 8.8-4.6-1.4-7.5-4.6-7.5-8.8V7L12 3.5Z" />
          <path d="M9 12.2 11 14.2 15.2 10" />
        </svg>
      );
    case "care":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "packs":
      return (
        <svg {...c}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 5v14M12 5v14M16 5v14M4 10h16M4 14h16" />
        </svg>
      );
    default:
      return (
        <svg {...c}>
          <circle cx="9" cy="8" r="2.8" />
          <path d="M3.5 19c0-2.9 2.4-4.8 5.5-4.8" />
          <circle cx="16.5" cy="9" r="2.2" />
          <path d="M13.2 19c0-2.4 1.7-4 3.8-4s3.5 1.4 3.5 3.5" />
        </svg>
      );
  }
}

const BENEFITS: { icon: BenefitIconId; title: string; body: string }[] = [
  {
    icon: "delivery",
    title: "Free delivery, every time",
    body: "Standard shipping to every province and territory — no membership fee.",
  },
  {
    icon: "billing",
    title: "Direct insurance billing",
    body: "We bill your provincial and private plans so you only pay what’s left.",
  },
  {
    icon: "care",
    title: "Licensed Canadian care",
    body: "Pharmacists and clinicians review every prescription before it ships.",
  },
  {
    icon: "packs",
    title: "PocketPacks & auto-refill",
    body: "Sorted pouches and refill reminders so you never scramble for a fill.",
  },
  {
    icon: "family",
    title: "Family coverage",
    body: "Manage meds for the people you care for from one account.",
  },
];

export function PocketpillsBenefits() {
  const { tx } = useI18n();
  const nav = useNavigate();
  return (
    <div>
      <BackLink />
      <PageHead
        title={tx("Pocketpills benefits")}
        sub={tx("What’s included with your account — no paid tier required.")}
      />

      <div className="relative overflow-hidden rounded-2xl border border-line bg-[color:var(--pp-primary-100)] p-6 sm:p-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Included")}</p>
        <h2 className="mt-2 font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Care that comes with the account")}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-ink-secondary">
          {tx("PocketPills is built around free delivery and pharmacist oversight — not upsells.")}
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {BENEFITS.map((b) => (
          <li key={b.title} className={`${CARD} flex gap-4 p-5`}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-950)]">
              <BenefitIcon id={b.icon} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx(b.title)}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{tx(b.body)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" onClick={() => nav("/fill")}>
          {tx("Fill a prescription")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => nav("/find-care")}>
          {tx("Explore treatments")}
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
  const { tx } = useI18n();
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

    const snap: Profile = {
      firstName: account.firstName,
      lastName: account.lastName,
      phone: "",
      dob: "",
      province: "ON",
      healthCard: "",
      address: "",
      insurances: [],
      allergies: [],
      onboarded: true,
      ...(account.snapshot as Partial<Profile> | undefined),
      email: account.email,
    };
    replace(snap);
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
        title={tx("Switch account")}
        sub={`${tx("Signed in as")} ${displayName}. ${tx("Pick another profile on this device, or add one.")}`}
      />
      <SavedToast show={switched} label={tx("Account switched")} />

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
                  <span className="text-xs font-semibold text-[color:var(--pp-violet)]">{tx("Current")}</span>
                ) : (
                  <span className="text-sm font-medium text-[color:var(--pp-violet)]">{tx("Switch")}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={`${CARD} mt-6 flex flex-wrap items-center gap-4 p-5`}>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Add another account")}</p>
          <p className="text-sm text-ink-tertiary">{tx("Sign in with a different email on this device.")}</p>
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
          {tx("Sign in")}
        </Button>
      </div>
    </div>
  );
}
