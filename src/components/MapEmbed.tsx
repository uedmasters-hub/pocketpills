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
