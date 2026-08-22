import { useState } from "react";
import { IMAGE_SIZE_META, IMAGE_SIZES, type ListingImageSize } from "@/lib/listingPage";
import { useI18n } from "@/lib/i18n";

export function ListingSizedImage({
  src,
  alt = "",
  size = "full",
  editable,
  onSize,
  showBadge,
  className = "",
}: {
  src: string;
  alt?: string;
  size?: ListingImageSize;
  editable?: boolean;
  onSize?: (size: ListingImageSize) => void;
  showBadge?: boolean;
  className?: string;
}) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const meta = IMAGE_SIZE_META[size];

  return (
    <div className={"relative " + meta.className + " " + className}>
      <img src={src} alt={alt} className="aspect-[4/3] w-full rounded-xl object-cover" />
      {editable && onSize ? (
        <div className="absolute bottom-2 left-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className="rounded-full bg-white/95 px-2 py-0.5 text-[0.65rem] font-medium text-[color:var(--pp-primary-950)] shadow-sm"
          >
            {tx(meta.label)} · {meta.hint}
          </button>
          {open ? (
            <div className="absolute bottom-7 left-0 z-20 flex overflow-hidden rounded-full border border-line bg-white shadow-md">
              {IMAGE_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSize(s);
                    setOpen(false);
                  }}
                  className={
                    "px-2.5 py-1 text-[0.65rem] " +
                    (s === size
                      ? "bg-[color:var(--pp-primary-950)] text-white"
                      : "text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]")
                  }
                >
                  {tx(IMAGE_SIZE_META[s].label)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : showBadge ? (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] text-ink-tertiary">
          {tx(meta.label)} · {meta.hint}
        </span>
      ) : null}
    </div>
  );
}
