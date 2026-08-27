import { useEffect, useLayoutEffect, useRef, useState, type ImgHTMLAttributes, type ReactNode } from "react";

type Round = "none" | "sm" | "md" | "lg" | "xl" | "full";

const ROUND: Record<Round, string> = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-[1.5rem]",
  full: "rounded-full",
};

export function Skeleton({
  className = "",
  rounded = "md",
}: {
  className?: string;
  rounded?: Round;
}) {
  return <span className={`pp-skeleton block ${ROUND[rounded]} ${className}`} aria-hidden />;
}

export function SkeletonText({
  lines = 2,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <span className={`block space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 && lines > 1 ? "w-[62%]" : "w-full"}`}
        />
      ))}
    </span>
  );
}

export function SkeletonCircle({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`pp-skeleton block rounded-full ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

/** Photo that holds layout with a sheen until the file paints. */
export function SkeletonImage({
  className = "",
  imgClassName = "",
  ...img
}: ImgHTMLAttributes<HTMLImageElement> & { imgClassName?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth > 0) setReady(true);
    else setReady(false);
  }, [img.src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!ready ? <span className="pp-skeleton absolute inset-0" aria-hidden /> : null}
      <img
        {...img}
        ref={ref}
        alt={img.alt ?? ""}
        onLoad={(e) => {
          setReady(true);
          img.onLoad?.(e);
        }}
        onError={(e) => {
          setReady(false);
          img.onError?.(e);
        }}
        className={
          (ready ? "opacity-100 " : "opacity-0 ") +
          "h-full w-full transition-opacity duration-300 " +
          imgClassName
        }
      />
    </div>
  );
}

/** Brief route-enter placeholder so detail pages don’t pop in empty. */
export function useEnterSkeleton(key: string, ms = 280) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    setShow(true);
    const id = window.setTimeout(() => setShow(false), ms);
    return () => window.clearTimeout(id);
  }, [key, ms]);
  return show;
}

function ScreenReaderStatus({ label }: { label: string }) {
  return (
    <span className="sr-only" role="status">
      {label}
    </span>
  );
}

function Stagger({ children, i }: { children: ReactNode; i: number }) {
  return (
    <div className="pp-skel-in" style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}>
      {children}
    </div>
  );
}

/** Directory listing card — same 12.75rem shell as live cards. */
export function DirectoryCardSkeleton() {
  return (
    <div className="relative h-[12.75rem] overflow-hidden rounded-[1.5rem] border border-[#E6E1EF] bg-white">
      <div className="flex h-full flex-col justify-between px-5 py-5">
        <div>
          <Skeleton className="h-2.5 w-20" rounded="full" />
          <Skeleton className="mt-3 h-5 w-[72%]" />
          <Skeleton className="mt-2 h-3.5 w-[54%]" />
          <Skeleton className="mt-3.5 h-6 w-16" />
        </div>
        <Skeleton className="h-3.5 w-24" />
      </div>
      <Skeleton className="absolute right-3 top-3 h-7 w-11" rounded="full" />
    </div>
  );
}

export function DirectoryGridSkeleton({
  count = 8,
  label = "Loading results",
}: {
  count?: number;
  label?: string;
}) {
  return (
    <div aria-busy="true">
      <ScreenReaderStatus label={label} />
      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <Stagger i={i}>
              <DirectoryCardSkeleton />
            </Stagger>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RatingChipSkeleton({ variant = "card" }: { variant?: "card" | "badge" }) {
  return (
    <Skeleton
      className={
        variant === "badge"
          ? "h-7 w-[7.25rem] border border-line !bg-white"
          : "h-3.5 w-12"
      }
      rounded="full"
    />
  );
}

export function ResultCountSkeleton() {
  return <Skeleton className="h-4 w-28" />;
}

/** Matches the public-profile hero: eyebrow, name, credentials, bio, pills, portrait. */
export function DirectoryHeroSkeleton() {
  return (
    <header className="min-w-0 overflow-hidden rounded-[1.5rem] border border-line bg-[color:var(--pp-primary-200)] sm:h-[16.5rem]">
      <div className="flex h-full flex-col sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-4 sm:px-6 sm:py-5">
          <Skeleton className="h-3 w-[4.25rem]" rounded="full" />
          <Skeleton className="mt-1.5 h-6 w-[min(100%,16rem)]" />
          <Skeleton className="mt-1.5 h-3.5 w-36" />
          <div className="mt-1.5 max-w-md space-y-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-[72%]" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="h-7 w-[7.25rem] border border-line !bg-white" rounded="full" />
            <Skeleton className="h-7 w-[5.75rem] border border-line !bg-white" rounded="full" />
            <Skeleton className="h-7 w-24 border border-line !bg-white" rounded="full" />
          </div>
        </div>
        <div className="relative h-52 w-full shrink-0 sm:h-auto sm:w-[32%]">
          <span className="pp-skeleton absolute inset-0 !rounded-none" aria-hidden />
        </div>
      </div>
    </header>
  );
}

/** Public doctor / pharmacy / facility profile. */
export function DetailPageSkeleton({ label = "Loading profile" }: { label?: string }) {
  return (
    <div aria-busy="true">
      <ScreenReaderStatus label={label} />
      <Skeleton className="h-4 w-28" />
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <DirectoryHeroSkeleton />
        </div>
        <div className="space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-3.5 w-40" />
            <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-16" rounded="full" />
            </div>
            <Skeleton className="mt-4 h-10 w-full" rounded="full" />
            <Skeleton className="mt-2 h-10 w-full" rounded="full" />
          </div>
        </div>
        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-2">
          <div>
            <Skeleton className="h-5 w-16" />
            <SkeletonText lines={3} className="mt-3 max-w-xl" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-2xl border border-line bg-white p-4">
                  <Skeleton className="h-3 w-24" />
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-3.5 w-[85%]" />
                    <Skeleton className="h-3.5 w-[70%]" />
                    <Skeleton className="h-3.5 w-[60%]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-5 w-20" />
            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={"flex justify-between px-5 py-3.5 " + (i > 1 ? "border-t border-line" : "")}>
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ))}
            </div>
          </div>
          <ReviewsPanelSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ReviewsPanelSkeleton({
  label = "Loading reviews",
  heading = true,
}: {
  label?: string;
  heading?: boolean;
}) {
  return (
    <div className="min-w-0" aria-busy="true">
      <ScreenReaderStatus label={label} />
      {heading ? <Skeleton className="h-5 w-40" /> : null}
      <div className={(heading ? "mt-5 " : "") + "flex flex-wrap items-start gap-x-8 gap-y-5"}>
        <div className="inline-flex items-center gap-5 rounded-[1.5rem] border border-line bg-white px-5 py-4">
          <div className="shrink-0">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="mt-1.5 h-3 w-12" />
            <Skeleton className="mt-2 h-3 w-20" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
          <div className="space-y-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <Skeleton className="h-2 w-12" />
                <Skeleton className="h-1.5 w-[5.5rem]" rounded="full" />
                <Skeleton className="h-2 w-3" />
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 max-w-sm">
          <Skeleton className="h-3 w-24" />
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Skeleton className="h-7 w-36" rounded="full" />
            <Skeleton className="h-7 w-40" rounded="full" />
            <Skeleton className="h-7 w-28" rounded="full" />
            <Skeleton className="h-7 w-32" rounded="full" />
          </div>
        </div>
      </div>
      <ul className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
        {[0, 1, 2].map((i) => (
          <li key={i} className="border-t border-[color:var(--border-divider)] first:border-t-0">
            <Stagger i={i}>
              <ReviewRowSkeleton />
            </Stagger>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewRowSkeleton() {
  return (
    <div className="flex gap-3.5 px-5 py-5">
      <SkeletonCircle size={40} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="mt-2 h-3 w-24" />
        <Skeleton className="mt-3 h-3.5 w-40" />
        <SkeletonText lines={2} className="mt-2" />
      </div>
    </div>
  );
}

export function RegionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-2 h-3.5 w-[80%]" />
      <Skeleton className="mt-3 h-3.5 w-20" />
    </div>
  );
}

export function RegionGridSkeleton({ count = 9, label = "Loading districts" }: { count?: number; label?: string }) {
  return (
    <div aria-busy="true">
      <ScreenReaderStatus label={label} />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-[4.5rem]" rounded="full" />
        ))}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <Stagger key={i} i={i}>
            <RegionCardSkeleton />
          </Stagger>
        ))}
      </div>
    </div>
  );
}

export function ClaimLookupSkeleton({ label = "Looking up record" }: { label?: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6" aria-busy="true">
      <ScreenReaderStatus label={label} />
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="mt-4 h-12 w-full" rounded="lg" />
      <Skeleton className="mt-3 h-3 w-48" />
      <Skeleton className="mt-5 h-12 w-full" rounded="full" />
    </div>
  );
}

export function RegistrySearchSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="mt-3 overflow-hidden rounded-xl border border-line" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className={"flex items-start justify-between gap-3 px-4 py-3 " + (i > 0 ? "border-t border-line" : "")}>
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-[60%]" />
            <Skeleton className="mt-1.5 h-3 w-[40%]" />
          </div>
          <Skeleton className="h-3 w-16" />
        </li>
      ))}
    </ul>
  );
}

export function AccessGateSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F4F9] px-5 py-14" aria-busy="true">
      <ScreenReaderStatus label="Checking access" />
      <div className="w-full max-w-[440px] rounded-[1.75rem] bg-white px-7 py-8 shadow-[0_16px_48px_rgba(40,24,72,0.08)] sm:px-9 sm:py-9">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-7 h-3.5 w-16" />
        <Skeleton className="mt-2 h-12 w-full" rounded="lg" />
        <Skeleton className="mt-5 h-12 w-full" rounded="lg" />
      </div>
    </div>
  );
}

export function FormSectionSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div aria-busy="true">
      <ScreenReaderStatus label={label} />
      <Skeleton className="h-3.5 w-16" />
      <div className="mt-5 flex items-center gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-6 max-w-3xl space-y-4">
        <Skeleton className="h-32 w-full" rounded="lg" />
        <Skeleton className="h-56 w-full" rounded="lg" />
      </div>
    </div>
  );
}
