import { useEffect, useState } from "react";
import { SidebarMapPreview } from "@/components/MapEmbed";
import { useI18n } from "@/lib/i18n";

export function locationMapQuery(value: string): string {
  const coords = value.match(/-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+/);
  if (coords) return coords[0].replace(/\s+/g, "");
  return value.replace(/^Shared location\s*·\s*/i, "").trim();
}

function useDebounced(value: string, ms = 400) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setD(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return d;
}

type Mode = "share" | "saved" | "type";

export function LocationPicker({
  value,
  onChange,
  savedLabel,
  placeholder = "Street, city",
}: {
  value: string;
  onChange: (next: string) => void;
  savedLabel?: string;
  placeholder?: string;
}) {
  const { tx } = useI18n();
  const saved = savedLabel?.trim() ?? "";
  const [mode, setMode] = useState<Mode>(() => {
    if (!value.trim()) return "type";
    if (/^Shared location/i.test(value) || /-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+/.test(value)) return "share";
    if (saved && value.trim() === saved) return "saved";
    return "type";
  });
  const [typed, setTyped] = useState(mode === "type" ? value : "");
  const [geoState, setGeoState] = useState<"idle" | "loading" | "error">("idle");
  const mapQuery = useDebounced(locationMapQuery(mode === "type" ? typed : value), 400);

  const share = () => {
    if (!navigator.geolocation) {
      setGeoState("error");
      setMode("type");
      return;
    }
    setMode("share");
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        let next = `Shared location · ${coords}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { headers: { Accept: "application/json" } },
          );
          if (res.ok) {
            const data = (await res.json()) as { display_name?: string };
            if (data.display_name) next = data.display_name;
          }
        } catch {
          /* keep coords */
        }
        onChange(next);
        setGeoState("idle");
      },
      () => {
        setGeoState("error");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <ModeBtn
          selected={mode === "share"}
          label={tx("Share current location")}
          hint={tx("Uses this device. You can still edit after.")}
          onClick={share}
        />
        {saved ? (
          <ModeBtn
            selected={mode === "saved"}
            label={tx("Use the address on this request")}
            hint={saved}
            onClick={() => {
              setMode("saved");
              setGeoState("idle");
              onChange(saved);
            }}
          />
        ) : null}
        <ModeBtn
          selected={mode === "type"}
          label={tx("Type an address")}
          hint={tx("Street and city, then check the map.")}
          onClick={() => {
            setMode("type");
            setGeoState("idle");
            if (mode !== "type") {
              const start = value.trim() && mode !== "share" ? value : "";
              setTyped(start);
              onChange(start);
            }
          }}
        />
      </div>

      {mode === "share" && geoState === "loading" ? (
        <p className="text-sm text-ink-tertiary">{tx("Finding you…")}</p>
      ) : null}
      {geoState === "error" ? (
        <p className="text-sm text-ink-tertiary">
          {tx("Location was blocked on this device. Type an address instead.")}
        </p>
      ) : null}

      {mode === "type" ? (
        <input
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            onChange(e.target.value);
          }}
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
          placeholder={tx(placeholder)}
          autoComplete="street-address"
        />
      ) : null}

      {mapQuery ? (
        <div className="overflow-hidden rounded-xl border border-line">
          <SidebarMapPreview query={mapQuery} title={tx("Location preview")} />
        </div>
      ) : mode === "type" ? (
        <p className="text-xs text-ink-tertiary">{tx("The map appears once you type a street or city.")}</p>
      ) : null}
    </div>
  );
}

function ModeBtn({
  selected,
  label,
  hint,
  onClick,
}: {
  selected: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left " +
        (selected
          ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)]"
          : "border-line bg-white hover:bg-[color:var(--state-hover)]")
      }
    >
      <span
        className={
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 " +
          (selected
            ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-violet)]"
            : "border-line bg-white")
        }
        aria-hidden
      >
        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[color:var(--pp-primary-950)]">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-ink-tertiary">{hint}</span>
      </span>
    </button>
  );
}
