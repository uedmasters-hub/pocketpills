import { Link, NavLink, Outlet, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  createDesignVersion,
  fetchDesignNav,
  fetchDesignVersions,
  publishDesignVersion,
  type DesignNavGroup,
  type DesignVersion,
} from "@/lib/designSystemApi";
import { useDesignSystemLive } from "@/lib/designSystemLive";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { LogoMark } from "@/components/Logo";

export function DesignSystemShell() {
  const [nav, setNav] = useState<DesignNavGroup[]>([]);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);
  const { live, refresh } = useDesignSystemLive();

  const reloadVersions = async () => {
    const r = await fetchDesignVersions();
    setVersions(r.versions);
    return r.versions;
  };

  useEffect(() => {
    void fetchDesignNav().then((r) => setNav(r.nav)).catch(() => setNav([]));
    void reloadVersions().catch(() => setVersions([]));
  }, [live?.id]);

  const versionId = params.get("v") || versions.find((v) => v.isLive)?.id || versions[0]?.id || "";
  const activeVersion = useMemo(
    () => versions.find((v) => v.id === versionId) || versions.find((v) => v.isLive) || versions[0],
    [versions, versionId],
  );

  const setVersion = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("v", id);
    setParams(next, { replace: true });
  };

  const onMakeLive = async () => {
    if (!activeVersion || activeVersion.isLive) return;
    setBusy(true);
    setError("");
    try {
      await publishDesignVersion(activeVersion.id);
      setConfirmPublish(false);
      const list = await reloadVersions();
      await refresh();
      const liveNow = list.find((v) => v.isLive);
      if (liveNow) setVersion(liveNow.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  };

  const onNewVersion = async () => {
    setBusy(true);
    setError("");
    try {
      const n = versions.filter((v) => v.slug.startsWith("v")).length + 1;
      const copyFromId = versions.find((v) => v.isLive)?.id || versions[0]?.id;
      const { version } = await createDesignVersion({
        slug: `v${n}`,
        label: `Version ${n}`,
        summary: "Created from Design docs.",
        copyFromId,
      });
      const list = await reloadVersions();
      const created = list.find((v) => v.id === version.id) || version;
      setVersion(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create version");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--pp-page)] text-[color:var(--pp-primary-950)]">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 text-[color:var(--pp-primary-950)]">
              <LogoMark className="h-7 w-7" />
              <span className="font-display text-lg font-bold tracking-tight">Design</span>
            </Link>
            {live ? (
              <span className="rounded-full bg-[color:var(--pp-primary-300)] px-2.5 py-0.5 text-2xs font-semibold">
                Live · {live.label}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink-tertiary">Version</span>
              <select
                className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium outline-none"
                value={activeVersion?.id || ""}
                onChange={(e) => setVersion(e.target.value)}
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                    {v.isLive ? " · Live" : v.status === "draft" ? " · Draft" : ""}
                  </option>
                ))}
              </select>
            </label>
            {activeVersion && !activeVersion.isLive ? (
              <Button size="sm" disabled={busy} onClick={() => setConfirmPublish(true)}>
                Make live
              </Button>
            ) : null}
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void onNewVersion()}>
              New version
            </Button>
          </div>
        </div>
        {error ? (
          <p className="border-t border-line bg-white px-4 py-2 text-sm text-[color:var(--error-900)] sm:px-6">
            {error}
          </p>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="space-y-5" aria-label="Design system">
            {nav.map((group) => (
              <div key={group.section}>
                <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      <NavLink
                        to={`/design/${group.section}/${item.slug}?v=${encodeURIComponent(activeVersion?.id || "")}`}
                        className={({ isActive }) =>
                          "block rounded-lg px-2.5 py-1.5 text-sm " +
                          (isActive
                            ? "bg-white font-medium text-[color:var(--pp-primary-950)] shadow-sm"
                            : "text-ink-secondary hover:bg-white/70")
                        }
                      >
                        {item.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet context={{ version: activeVersion, versions }} />
        </main>
      </div>

      <ConfirmModal
        open={confirmPublish}
        title="Make this version live?"
        body={
          activeVersion
            ? `Publish “${activeVersion.label}” now. Site tokens update immediately for everyone.`
            : ""
        }
        confirmLabel="Make live"
        onConfirm={() => void onMakeLive()}
        onClose={() => setConfirmPublish(false)}
      />
    </div>
  );
}
