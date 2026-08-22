export function DoctorPhoto({
  src,
  className,
  rounded = "full",
}: {
  src?: string;
  className: string;
  rounded?: "full" | "xl";
}) {
  const round = rounded === "full" ? "rounded-full" : "rounded-xl";
  if (src?.trim()) {
    return <img src={src.trim()} alt="" className={className + " " + round + " object-cover object-top"} />;
  }
  return <div className={className + " " + round + " bg-[color:var(--pp-primary-200)]"} aria-hidden />;
}
