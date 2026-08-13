import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import {
  createDelegate,
  defaultDelegateFeatures,
  featuresForVendor,
  listDelegateActivity,
  listDelegates,
  resetDelegatePassword,
  setDelegateActive,
  setDelegateFeature,
  type DelegateActivity,
  type DelegateFeatures,
  type FeatureDef,
  type ProviderDelegate,
} from "@/lib/providerDelegates";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

export function ProviderDelegates() {
  const { tx } = useI18n();
  const { provider, isDelegate, workspaceId } = useProvider();
  const [tick, setTick] = useState(0);
  const [filterDelegateId, setFilterDelegateId] = useState<string>("all");
  const [formError, setFormError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const vendorType = provider?.vendorType ?? "doctor";
  const featureDefs = featuresForVendor(vendorType);
  const [createFeatures, setCreateFeatures] = useState<DelegateFeatures>(() =>
    defaultDelegateFeatures(vendorType),
  );
  const [resetPw, setResetPw] = useState<Record<string, string>>({});
  void tick;

  if (
    !provider ||
    isDelegate ||
    (provider.vendorType === "ambulance" && provider.ambulanceRole === "driver")
  ) {
    return <Navigate to="/provider" replace />;
  }

  const orgId = workspaceId;
  const delegates = listDelegates(orgId);
  const activity = listDelegateActivity(orgId, {
    delegateId: filterDelegateId === "all" ? undefined : filterDelegateId,
  });

  const refresh = () => setTick((t) => t + 1);

  const onCreate = () => {
    const res = createDelegate({
      orgId,
      orgName: provider.orgName,
      vendorType,
      username,
      password,
      firstName,
      lastName,
      features: createFeatures,
    });
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setFormError("");
    setFirstName("");
    setLastName("");
    setUsername("");
    setPassword("");
    setCreateFeatures(defaultDelegateFeatures(vendorType));
    refresh();
  };

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Delegates")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx("Staff delegates")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx(
            "Create username/password logins and choose which modules they can use. Switch into a delegate from your header when you need to work as staff — password required.",
          )}
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
          {tx("Create delegate")}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={LABEL}>{tx("First name")}</span>
            <input className={FIELD} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="block">
            <span className={LABEL}>{tx("Last name")}</span>
            <input className={FIELD} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
          <label className="block">
            <span className={LABEL}>{tx("Username")}</span>
            <input
              className={FIELD}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="desk.staff"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className={LABEL}>{tx("Password")}</span>
            <input
              className={FIELD}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        </div>

        <FeatureGrantGrid
          defs={featureDefs}
          features={createFeatures}
          onToggle={(featureId, enabled) =>
            setCreateFeatures((cur) => {
              const next = { ...cur, [featureId]: enabled };
              for (const d of featureDefs) {
                if (d.required) next[d.id] = true;
              }
              return next;
            })
          }
        />

        {formError ? <p className="mt-3 text-sm text-red-700">{formError}</p> : null}
        <div className="mt-4">
          <Button size="sm" className="!h-9 !px-4 !py-0" onClick={onCreate}>
            {tx("Create login")}
          </Button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Staff accounts")}
        </h2>
        <ul className="mt-4 space-y-3">
          {delegates.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-ink-tertiary">
              {tx("No delegates yet.")}
            </li>
          ) : (
            delegates.map((d) => (
              <DelegateRow
                key={d.id}
                d={d}
                defs={featuresForVendor(d.vendorType)}
                resetValue={resetPw[d.id] ?? ""}
                onResetChange={(v) => setResetPw((m) => ({ ...m, [d.id]: v }))}
                onToggle={() => {
                  setDelegateActive(orgId, d.id, !d.active);
                  refresh();
                }}
                onFeature={(featureId, enabled) => {
                  setDelegateFeature(orgId, d.id, featureId, enabled);
                  refresh();
                }}
                onReset={() => {
                  const res = resetDelegatePassword(orgId, d.id, resetPw[d.id] ?? "");
                  if (!res.ok) {
                    setFormError(res.error);
                    return;
                  }
                  setFormError("");
                  setResetPw((m) => ({ ...m, [d.id]: "" }));
                  refresh();
                }}
              />
            ))
          )}
        </ul>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("Delegate activity")}
          </h2>
          <label className="block min-w-[12rem]">
            <span className="sr-only">{tx("Filter by staff")}</span>
            <select
              className={FIELD}
              value={filterDelegateId}
              onChange={(e) => setFilterDelegateId(e.target.value)}
            >
              <option value="all">{tx("All activity")}</option>
              {delegates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} (@{d.username})
                </option>
              ))}
            </select>
          </label>
        </div>
        <ul className="mt-4 space-y-2">
          {activity.length === 0 ? (
            <li className="rounded-2xl border border-line bg-white px-5 py-8 text-center text-sm text-ink-tertiary">
              {tx("No staff activity yet.")}
            </li>
          ) : (
            activity.slice(0, 80).map((a) => <ActivityRow key={a.id} a={a} />)
          )}
        </ul>
      </section>
    </div>
  );
}

function FeatureGrantGrid({
  defs,
  features,
  onToggle,
}: {
  defs: FeatureDef[];
  features: DelegateFeatures;
  onToggle: (featureId: string, enabled: boolean) => void;
}) {
  const { tx } = useI18n();
  return (
    <div className="mt-5">
      <p className={LABEL}>{tx("Features")}</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {defs.map((meta) => {
          const on = Boolean(features[meta.id]);
          const locked = Boolean(meta.required);
          return (
            <li key={meta.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => onToggle(meta.id, !on)}
                className={
                  "flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors " +
                  (on
                    ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)]/50"
                    : "border-line bg-white hover:bg-[color:var(--state-hover)]") +
                  (locked ? " cursor-default opacity-90" : "")
                }
              >
                <span
                  className={
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-2xs font-bold " +
                    (on
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : "border border-line bg-white text-ink-tertiary")
                  }
                  aria-hidden
                >
                  {on ? "✓" : ""}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">
                    {tx(meta.label)}
                    {locked ? (
                      <span className="ml-1.5 text-2xs font-normal text-ink-tertiary">
                        ({tx("always on")})
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-2xs text-ink-tertiary">{tx(meta.blurb)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DelegateRow({
  d,
  defs,
  resetValue,
  onResetChange,
  onToggle,
  onFeature,
  onReset,
}: {
  d: ProviderDelegate;
  defs: FeatureDef[];
  resetValue: string;
  onResetChange: (v: string) => void;
  onToggle: () => void;
  onFeature: (featureId: string, enabled: boolean) => void;
  onReset: () => void;
}) {
  const { tx } = useI18n();
  return (
    <li className="rounded-2xl border border-line bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[color:var(--pp-primary-950)]">
            {d.firstName} {d.lastName}
          </p>
          <p className="mt-0.5 text-2xs text-ink-tertiary">
            @{d.username} · {d.active ? tx("Active") : tx("Deactivated")}
          </p>
        </div>
        <Button size="sm" variant="outline" className="!h-8 !px-3 !py-0 text-xs" onClick={onToggle}>
          {d.active ? tx("Deactivate") : tx("Reactivate")}
        </Button>
      </div>

      <FeatureGrantGrid features={d.features} defs={defs} onToggle={onFeature} />

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="block min-w-[10rem] flex-1">
          <span className={LABEL}>{tx("New password")}</span>
          <input
            className={FIELD}
            type="password"
            value={resetValue}
            onChange={(e) => onResetChange(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <Button size="sm" className="!h-11 !px-4 !py-0" onClick={onReset}>
          {tx("Reset password")}
        </Button>
      </div>
    </li>
  );
}

function ActivityRow({ a }: { a: DelegateActivity }) {
  const { tx } = useI18n();
  const when = new Date(a.at);
  const stamp = Number.isNaN(when.getTime())
    ? a.at
    : when.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
  return (
    <li className="rounded-2xl border border-line bg-white px-4 py-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-[color:var(--pp-primary-950)]">
          {a.delegateName} · {tx(a.action)}
        </p>
        <p className="text-2xs text-ink-tertiary">{stamp}</p>
      </div>
      <p className="mt-1 text-ink-secondary">{a.detail}</p>
    </li>
  );
}
