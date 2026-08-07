import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui";
import { entryPoints, type EntryIconKey } from "@/lib/data";

function Icon({ id, color }: { id: EntryIconKey; color: string }) {
  const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "treatment": // medical bag + cross
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2.5" />
          <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
          <path d="M12 11v5M9.5 13.5h5" />
        </svg>
      );
    case "fill": // prescription document
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h4M9 12h6M9 16h6" />
          <path d="M13 3v4a1 1 0 0 0 1 1h4" opacity="0" />
        </svg>
      );
    case "transfer": // box with arrow out
      return (
        <svg {...common}>
          <path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
          <path d="M15 12h6M18 9l3 3-3 3" />
        </svg>
      );
    case "explore": // capsules
      return (
        <svg {...common}>
          <rect x="3.5" y="9" width="11" height="6" rx="3" transform="rotate(-35 9 12)" />
          <path d="M8.6 8.2 12 11.6" transform="rotate(-35 9 12)" opacity="0.9" />
          <circle cx="16.5" cy="15.5" r="4" />
        </svg>
      );
  }
}

export function EntryPoints() {
  const nav = useNavigate();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entryPoints.map((e, i) => (
        <Card
          key={e.id}
          interactive
          onClick={() => nav(e.to)}
          role="button"
          tabIndex={0}
          onKeyDown={(ev) => ev.key === "Enter" && nav(e.to)}
          className="flex items-center gap-4 p-4 animate-fade-up"
          style={{ animationDelay: `${i * 55}ms` }}
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-sm" style={{ backgroundImage: e.tile }}>
            <Icon id={e.id} color={e.fg} />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{e.title}</p>
            <p className="text-sm text-ink-tertiary">{e.desc}</p>
          </div>
          <span className="ml-auto shrink-0 text-ink-tertiary" aria-hidden>→</span>
        </Card>
      ))}
    </div>
  );
}
