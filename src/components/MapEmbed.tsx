import { mapsDirectionsUrl } from "@/lib/hospitalProfileContent";
import { useI18n } from "@/lib/i18n";

/** OpenStreetMap embed with the noisy iframe chrome cropped off. */
export function MapEmbed({
  src,
  title,
  className = "aspect-[4/3]",
}: {
  src: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-[color:var(--pp-primary-100)] ${className}`}>
      {/*
        OSM’s embed paints a tall attribution strip at the bottom.
        Scale the iframe slightly and clip so only the map shows.
      */}
      <iframe
        title={title}
        src={src}
        className="pointer-events-auto absolute left-0 top-0 h-[calc(100%+3.25rem)] w-full border-0"
        loading="lazy"
      />
      <span className="sr-only">Map data © OpenStreetMap contributors</span>
    </div>
  );
}

/** Compact sidebar preview: no place card, zoom controls, or footer chrome. */
export function SidebarMapPreview({
  query,
  title,
}: {
  query: string;
  title: string;
}) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&hl=en&t=m&output=embed&iwloc=`;
  return (
    <div className="relative h-36 w-full overflow-hidden rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)]">
      <iframe
        title={title}
        src={src}
        className="pointer-events-none absolute -left-[12%] -top-[38%] h-[180%] w-[124%] max-w-none border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        tabIndex={-1}
      />
    </div>
  );
}

/** Compact map + directions link for directory sidebars. */
export function DirectorySidebarMap({ query }: { query: string }) {
  const { tx } = useI18n();
  if (!query.trim()) return null;
  return (
    <div>
      <SidebarMapPreview query={query} title={tx("Map")} />
      <a
        href={mapsDirectionsUrl(query)}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
      >
        {tx("Get directions")} →
      </a>
    </div>
  );
}
