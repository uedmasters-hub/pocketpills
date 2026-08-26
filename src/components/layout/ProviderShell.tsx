import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Button } from "@/components/ui/Button";
import { Caret } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useColumnHoverRow, useShellColumn } from "@/lib/columnHover";
import { useProvider, type ProviderAccount } from "@/lib/providerAuth";
import {
  authenticateDelegate,
  clearStashedOwner,
  delegateDisplayName,
  getDelegateById,
  listDelegates,
  logDelegateActivity,
  peekStashedOwner,
  stashOwnerForSwitch,
  subscribeDelegateFeatures,
  verifyOwnerPassword,
  type DelegateFeatures,
  type ProviderDelegate,
} from "@/lib/providerDelegates";
import { ProviderPasswordResetPanel } from "@/components/ProviderPasswordResetPanel";
import {
  delegatePortal,
  flattenNav,
  isNavGroup,
  portalAllowedPaths,
  portalFor,
  type PortalNavEntry,
} from "@/lib/providerPortals";

const LEAF =
  "flex items-center rounded-xl px-3 py-1.5 text-sm transition-colors duration-200 " +
  "hover:bg-[color:var(--state-hover)]";
const IDLE = "font-normal text-ink-tertiary hover:text-[color:var(--pp-primary-950)]";
const ACTIVE = "font-medium text-[color:var(--pp-primary-950)] bg-white border border-line";
const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";

export function ProviderShell({ children }: { children?: ReactNode }) {
  const { tx } = useI18n();
  const { displayName, logOut, provider, setSession, workspaceId, isDelegate } = useProvider();
  const nav = useNavigate();
  const location = useLocation();
  const [featureTick, setFeatureTick] = useState(0);
  const [switchOpen, setSwitchOpen] = useState(false);
  const cols = useColumnHoverRow();
  const navCol = useShellColumn("nav");
  const mainCol = useShellColumn("main");

  useEffect(() => {
    if (!isDelegate) return;
    return subscribeDelegateFeatures(() => setFeatureTick((t) => t + 1));
  }, [isDelegate, provider?.delegateId]);

  const liveFeatures: DelegateFeatures | null =
    isDelegate && provider?.delegateId
      ? (getDelegateById(provider.delegateId)?.features ?? null)
      : null;
  void featureTick;

  const portal = provider
    ? isDelegate && liveFeatures
      ? delegatePortal(provider.vendorType, liveFeatures)
      : portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole)
    : null;

  const allowed = (() => {
    if (!provider) return new Set<string>();
    if (isDelegate && liveFeatures) {
      return new Set(flattenNav(delegatePortal(provider.vendorType, liveFeatures).nav).map((n) => n.to));
    }
    return portalAllowedPaths(provider.vendorType, provider.ambulanceRole, provider.accountRole);
  })();

  if (provider && portal) {
    const path = location.pathname.replace(/\/$/, "") || "/provider";
    const permitted = pathIsAllowed(path, allowed);
    if (isDelegate && (path === "/provider" || !permitted)) {
      const fallback = flattenNav(portal.nav)[0]?.to ?? "/provider/requests";
      if (path !== fallback) return <Navigate to={fallback} replace />;
    } else if (path !== "/provider" && !permitted) {
      return <Navigate to={flattenNav(portal.nav)[0]?.to ?? "/provider"} replace />;
    }
  }

  const headerName =
    provider?.orgName?.trim() && provider.orgName.trim().toLowerCase() !== "your practice"
      ? provider.orgName
      : displayName;

  const enabledLabels =
    liveFeatures && portal ? flattenNav(portal.nav).map((n) => n.label).join(", ") : null;

  const canSwitch =
    provider &&
    !(provider.vendorType === "ambulance" && provider.ambulanceRole === "driver");

  return (
    <div className="min-h-screen bg-surface-0">
      <AnnouncementBar />
      <header className="border-b border-line bg-[color:var(--pp-primary-100)]/50">
        <div className="mx-auto flex max-w-[105rem] items-center justify-between gap-4 px-5 py-4 md:px-8 xl:px-20">
          <div className="min-w-0">
            <p className="pp-caps text-[color:var(--pp-violet)]">
              {portal ? tx(portal.label) : tx("Provider")}
              {isDelegate ? ` · ${tx("Delegate")}` : ""}
            </p>
            <p className="truncate font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {headerName}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <span className="hidden max-w-[10rem] truncate text-sm text-ink-tertiary lg:inline">
              {displayName}
            </span>
            {canSwitch ? (
              <button
                type="button"
                onClick={() => setSwitchOpen(true)}
                className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-medium text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
              >
                {tx("Switch account")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                clearStashedOwner();
                logOut();
                nav("/provider/login");
              }}
              className="rounded-full px-4 py-2 text-sm font-medium text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
            >
              {tx("Log out")}
            </button>
          </div>
        </div>
      </header>

      <div
        className="mx-auto flex w-full max-w-[105rem] flex-col gap-8 px-5 py-8 md:px-8 lg:flex-row lg:items-stretch xl:px-20"
        onMouseLeave={cols.onMouseLeave}
        onMouseMove={cols.onMouseMove}
      >
        <aside
          className={"w-full shrink-0 lg:w-48 " + navCol.className}
          aria-label={tx("Provider navigation")}
          onMouseEnter={navCol.onMouseEnter}
        >
          <ProviderNav entries={portal?.nav ?? []} />
          <p className="mt-8 text-2xs leading-relaxed text-ink-tertiary">
            {isDelegate
              ? enabledLabels
                ? `${tx("Enabled for you")}: ${enabledLabels}.`
                : tx("Staff access is limited to modules your owner enabled.")
              : tx("Dedicated workspace for your provider type — separate from the patient app.")}
          </p>
        </aside>

        <main
          className={"min-w-0 flex-1 animate-fade-up " + mainCol.className}
          onMouseEnter={mainCol.onMouseEnter}
        >
          {children ?? <Outlet />}
        </main>
      </div>

      {switchOpen && provider ? (
        <SwitchAccountModal
          provider={provider}
          workspaceId={workspaceId}
          isDelegate={isDelegate}
          onClose={() => setSwitchOpen(false)}
          onSwitched={(path) => {
            setSwitchOpen(false);
            nav(path, { replace: true });
          }}
          setSession={setSession}
        />
      ) : null}
    </div>
  );
}

function pathIsAllowed(path: string, allowed: Set<string>) {
  if (allowed.has(path)) return true;
  for (const p of allowed) {
    if (p !== "/provider" && path.startsWith(`${p}/`)) return true;
  }
  return false;
}

function leafIsActive(to: string, path: string, end?: boolean) {
  if (end) return path === to;
  if (to === "/provider/finance") return path === to || path === "/provider/revenue";
  return path === to || path.startsWith(`${to}/`);
}

function groupIdForPath(entries: PortalNavEntry[], path: string): string | null {
  for (const entry of entries) {
    if (isNavGroup(entry) && entry.children.some((c) => leafIsActive(c.to, path, c.end))) {
      return entry.id;
    }
  }
  return null;
}

function ProviderNav({ entries }: { entries: PortalNavEntry[] }) {
  const { tx } = useI18n();
  const location = useLocation();
  const path = location.pathname.replace(/\/$/, "") || "/provider";
  const activeGroup = groupIdForPath(entries, path);
  const [openId, setOpenId] = useState<string | null>(activeGroup);

  useEffect(() => {
    if (activeGroup) setOpenId(activeGroup);
  }, [activeGroup]);

  return (
    <nav className="space-y-0.5">
      {entries.map((entry) => {
        if (!isNavGroup(entry)) {
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.end}
              className={({ isActive }) => `${LEAF} ${isActive ? ACTIVE : IDLE}`}
            >
              {tx(entry.label)}
            </NavLink>
          );
        }

        const open = openId === entry.id;
        const childActive = entry.children.some((c) => leafIsActive(c.to, path, c.end));

        return (
          <div key={entry.id} className="pt-1">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : entry.id)}
              className={
                "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left " +
                (childActive
                  ? "text-[color:var(--pp-primary-950)]"
                  : "text-ink-tertiary hover:text-[color:var(--pp-primary-950)]")
              }
            >
              <span className="pp-caps text-[0.7rem] tracking-wide">{tx(entry.label)}</span>
              <span className="text-ink-tertiary">
                <Caret open={open} />
              </span>
            </button>
            {open ? (
              <div className="mb-1 ml-2 space-y-0.5 border-l border-line pl-2">
                {entry.children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    end={child.end}
                    className={() =>
                      `${LEAF} ${leafIsActive(child.to, path, child.end) ? ACTIVE : IDLE}`
                    }
                  >
                    {tx(child.label)}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function SwitchAccountModal({
  provider,
  workspaceId,
  isDelegate,
  onClose,
  onSwitched,
  setSession,
}: {
  provider: ProviderAccount;
  workspaceId: string;
  isDelegate: boolean;
  onClose: () => void;
  onSwitched: (path: string) => void;
  setSession: (account: ProviderAccount) => void;
}) {
  const { tx } = useI18n();
  const delegates = listDelegates(workspaceId).filter((d) => d.active);
  const [targetId, setTargetId] = useState<string>(
    isDelegate ? "owner" : delegates[0]?.id ?? "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"switch" | "reset">("switch");
  const stashed = peekStashedOwner();

  const switchToDelegate = (d: ProviderDelegate, pw: string) => {
    const ok = authenticateDelegate(d.username, pw);
    if (!ok) {
      setError(tx("Incorrect password for this delegate."));
      return;
    }
    if (!isDelegate) {
      stashOwnerForSwitch(provider, provider.id);
    }
    setSession({
      id: `prov-delegate-${d.id}`,
      email: `${d.username}@delegate.local`,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: "",
      orgName: d.orgName,
      vendorType: d.vendorType,
      accountRole: "delegate",
      pharmacyRole: d.vendorType === "pharmacy" ? "delegate" : undefined,
      ownerOrgId: d.orgId,
      pharmacyOrgId: d.vendorType === "pharmacy" ? d.orgId : undefined,
      delegateId: d.id,
      onboarded: true,
    });
    logDelegateActivity({
      orgId: d.orgId,
      delegateId: d.id,
      delegateName: delegateDisplayName(d),
      action: "Switched into delegate",
      detail: "From main account (password verified)",
    });
    const features = d.features;
    const portal = delegatePortal(d.vendorType, features);
    onSwitched(flattenNav(portal.nav)[0]?.to ?? "/provider/requests");
  };

  const switchToOwner = (pw: string) => {
    const stash = peekStashedOwner();
    if (!stash) {
      setError(tx("No main account session to restore. Sign in as the owner instead."));
      return;
    }
    if (!verifyOwnerPassword(stash.ownerId, pw)) {
      setError(tx("Incorrect main account password."));
      return;
    }
    try {
      const account = JSON.parse(stash.accountJson) as ProviderAccount;
      clearStashedOwner();
      setSession({
        ...account,
        accountRole: "owner",
        pharmacyRole: account.vendorType === "pharmacy" ? "owner" : undefined,
        delegateId: undefined,
        ownerOrgId: undefined,
        pharmacyOrgId: undefined,
      });
      onSwitched("/provider");
    } catch {
      setError(tx("Could not restore the main account."));
    }
  };

  const submit = () => {
    setError("");
    if (!password.trim()) {
      setError(tx("Enter the password to switch."));
      return;
    }
    if (targetId === "owner") {
      switchToOwner(password.trim());
      return;
    }
    const d = delegates.find((x) => x.id === targetId) ?? getDelegateById(targetId);
    if (!d) {
      setError(tx("Select a delegate account."));
      return;
    }
    switchToDelegate(d, password.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="switch-account-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-lg">
        {mode === "reset" ? (
          <ProviderPasswordResetPanel
            ownerId={stashed?.ownerId ?? (isDelegate ? undefined : provider.id)}
            emailHint={stashed?.email ?? (!isDelegate ? provider.email : undefined)}
            onCancel={() => {
              setMode("switch");
              setError("");
            }}
            onDone={({ newPassword }) => {
              setMode("switch");
              setPassword(newPassword);
              setError("");
              setTargetId("owner");
            }}
          />
        ) : (
          <>
        <h2
          id="switch-account-title"
          className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]"
        >
          {tx("Switch account")}
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">
          {tx("Choose a profile and enter its password to continue.")}
        </p>

        <div className="mt-4 space-y-2">
          {(isDelegate || stashed) && (
            <button
              type="button"
              onClick={() => setTargetId("owner")}
              className={
                "w-full rounded-xl border px-3.5 py-3 text-left text-sm " +
                (targetId === "owner"
                  ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)]/50"
                  : "border-line")
              }
            >
              <span className="font-medium text-[color:var(--pp-primary-950)]">
                {tx("Main account")}
              </span>
              <span className="mt-0.5 block text-2xs text-ink-tertiary">
                {tx("Full portal — owner password required")}
              </span>
            </button>
          )}
          {!isDelegate &&
            delegates.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setTargetId(d.id)}
                className={
                  "w-full rounded-xl border px-3.5 py-3 text-left text-sm " +
                  (targetId === d.id
                    ? "border-[color:var(--pp-primary-950)] bg-[color:var(--pp-primary-100)]/50"
                    : "border-line")
                }
              >
                <span className="font-medium text-[color:var(--pp-primary-950)]">
                  {d.firstName} {d.lastName}
                </span>
                <span className="mt-0.5 block text-2xs text-ink-tertiary">
                  @{d.username} · {tx("Delegate password required")}
                </span>
              </button>
            ))}
          {!isDelegate && delegates.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-3.5 py-4 text-sm text-ink-tertiary">
              {tx("Create a delegate first under Delegates.")}
            </p>
          ) : null}
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Password")}</span>
          <input
            className={FIELD}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </label>
        {targetId === "owner" ? (
          <button
            type="button"
            className="mt-2 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
            onClick={() => {
              setMode("reset");
              setError("");
            }}
          >
            {tx("Forgot password?")}
          </button>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" className="!h-9 !px-4 !py-0" onClick={submit}>
            {tx("Switch")}
          </Button>
          <Button size="sm" variant="outline" className="!h-9 !px-4 !py-0" onClick={onClose}>
            {tx("Cancel")}
          </Button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
