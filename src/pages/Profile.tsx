import { Link } from "react-router-dom";
import { useUser } from "@/lib/user";
import { profileChecklist, pendingRows, type ChecklistId } from "@/lib/profile";

/* ── icons ─────────────────────────────────────────────── */
function RowIcon({ id }: { id: ChecklistId }) {
  const c = {
    width: 22, height: 22, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.5,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "personal":  return <svg {...c}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-3.8 3.4-5.8 7.5-5.8s7.5 2 7.5 5.8" /></svg>;
    case "health":    return <svg {...c}><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" /></svg>;
    case "card":      return <svg {...c}><path d="M9.5 3.5h5v5h5v5h-5v5h-5v-5h-5v-5h5v-5Z" /></svg>;
    case "insurance": return <svg {...c}><path d="M12 3.5l7 2.5v5.5c0 4-3 7.2-7 9-4-1.8-7-5-7-9V6l7-2.5Z" /><path d="m9.2 11.8 2 2 3.6-3.6" /></svg>;
    case "shipping":  return <svg {...c}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5Z" /></svg>;
    default:          return <svg {...c}><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M3 10.5h18" /></svg>;
  }
}

function NeedsAttention() {
  return (
    <span className="text-[#B4541F]" aria-label="Needs attention">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="12" cy="12" r="9" /><path d="M12 8.2v.01M12 11v5" />
      </svg>
    </span>
  );
}

/* ── form primitives ───────────────────────────────────── */


/* ── page ──────────────────────────────────────────────── */
function Done() {
  return (
    <span className="text-wellness" aria-label="Complete">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" /><path d="m8.4 12.2 2.4 2.4 4.6-4.8" />
      </svg>
    </span>
  );
}

export function Profile() {
  const { user } = useUser();
  const rows = profileChecklist(user);
  const outstanding = pendingRows(user).length;

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">Profile</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          Your profile
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {outstanding > 0
            ? `${outstanding} section${outstanding === 1 ? "" : "s"} still need attention. Completing them lets us bill your plans and deliver without delay.`
            : "Everything's up to date. We'll let you know if anything needs a refresh."}
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface-2">
        {rows.map((r, i) => (
          <Link
            key={r.id}
            to={`/profile/${r.id}`}
            className={
              "flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-[color:var(--state-hover)] " +
              (i < rows.length - 1 ? "border-b border-line" : "")
            }
          >
            <span className="shrink-0 text-[color:var(--pp-primary-950)]"><RowIcon id={r.id} /></span>
            <span className="min-w-0 flex-1 text-base text-[color:var(--pp-primary-950)]">{r.label}</span>
            {r.done
              ? <span className="flex items-center gap-2">
                  <span className="text-base text-ink-tertiary">{r.value ?? "Added"}</span>
                  {r.required && <Done />}
                </span>
              : <NeedsAttention />}
            <span className="shrink-0 text-ink-tertiary" aria-hidden>›</span>
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink-tertiary">
        Your information is encrypted and never shared without your permission.
      </p>
    </div>
  );
}

