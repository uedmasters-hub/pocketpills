export function ReportThumb({
  src,
  className = "h-10 w-12",
  placeholder = false,
}: {
  src?: string;
  className?: string;
  placeholder?: boolean;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`shrink-0 rounded-lg border border-line bg-white object-cover object-top ${className}`}
      />
    );
  }
  if (!placeholder) return null;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-lg border border-line bg-[color:var(--pp-primary-100)] text-[color:var(--pp-primary-950)] ${className}`}
      aria-hidden
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
        <path d="M14 3v5h5" />
      </svg>
    </span>
  );
}
