import { useNavigate } from "react-router-dom";
import { entryPoints, type EntryIconKey } from "@/lib/data";

export function EntryIcon({ id, color }: { id: EntryIconKey; color: string }) {
  const c = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (id === "treatment") return <svg {...c}><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8.5 7V5.6A1.6 1.6 0 0 1 10.1 4h3.8a1.6 1.6 0 0 1 1.6 1.6V7" /><path d="M12 11.2v4.6M9.7 13.5h4.6" /></svg>;
  if (id === "fill") return <svg {...c}><rect x="4.5" y="3" width="15" height="18" rx="3" /><path d="M9 8.2h3.2a2 2 0 0 1 0 4H9V8.2v8" /><path d="M12.4 12.2 16 16.4" /></svg>;
  if (id === "transfer") return <svg {...c}><path d="M13.5 3.5H7.2A2.2 2.2 0 0 0 5 5.7v12.6a2.2 2.2 0 0 0 2.2 2.2h6.3" /><path d="M5 8h8.5M14.5 12h6M17.8 9l3 3-3 3" /></svg>;
  return <svg {...c}><rect x="3" y="8.5" width="11.5" height="6.4" rx="3.2" transform="rotate(-38 8.75 11.7)" /><path d="m6.2 7.6 3.6 3.6" transform="rotate(-38 8.75 11.7)" /><circle cx="16.6" cy="15.4" r="4.2" /><path d="M13.9 12.3 19.4 18.4" /></svg>;
}

/** Homepage entry tiles — matches the landing page tile system. */
export function EntryPoints() {
  const nav = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {entryPoints.map((e, i) => (
        <button
          key={e.id}
          onClick={() => nav(e.to)}
          style={{ backgroundColor: e.bg, animationDelay: `${i * 55}ms` }}
          className="flex min-h-[150px] animate-fade-up flex-col items-center justify-center gap-5 rounded-[20px] px-3 py-8 text-center transition-transform hover:-translate-y-0.5 sm:min-h-[190px] sm:gap-6"
        >
          <span className="grid h-12 w-12 place-items-center rounded-[14px] shadow-sm sm:h-14 sm:w-14" style={{ backgroundImage: e.tile }}>
            <EntryIcon id={e.id} color={e.fg} />
          </span>
          <span className="text-[13px] font-medium leading-snug text-[color:var(--pp-headline)] sm:text-[15px]">{e.title}</span>
        </button>
      ))}
    </div>
  );
}
