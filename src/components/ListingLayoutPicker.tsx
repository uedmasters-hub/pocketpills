import { useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";
import {
  ADDABLE_LAYOUTS,
  DIRECTORY_BLOCKS,
  LAYOUT_META,
  type ListingBlockLayout,
  type ListingEmbedKind,
} from "@/lib/listingPage";

export type LayoutPick =
  | { type: "layout"; layout: ListingBlockLayout }
  | { type: "embed"; kind: ListingEmbedKind };

function Thumb({ layout }: { layout: ListingBlockLayout }) {
  const line = "rounded-sm bg-[color:var(--pp-primary-200)]";
  const box = "rounded-sm bg-[color:var(--pp-primary-200)]";
  const wrap = "flex h-[5.25rem] flex-col gap-1 rounded-lg bg-[color:var(--pp-primary-100)] p-2";

  if (layout === "imageText") {
    return (
      <div className={wrap}>
        <div className={line + " mx-auto h-1.5 w-1/3"} />
        <div className="mt-1 grid min-h-0 flex-1 grid-cols-[0.9fr_1.1fr] gap-1.5">
          <div className={box} />
          <div className="flex flex-col justify-center gap-1">
            <div className={line + " h-1.5 w-full"} />
            <div className={line + " h-1.5 w-4/5"} />
            <div className={line + " h-1.5 w-2/3"} />
            <div className={box + " mt-auto h-3 w-10"} />
          </div>
        </div>
      </div>
    );
  }

  if (layout === "columns") {
    return (
      <div className={wrap}>
        <div className={line + " mx-auto h-1.5 w-1/3"} />
        <div className="mt-1 grid min-h-0 flex-1 grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className={box + " aspect-square"} />
              <div className={line + " h-1 w-full"} />
              <div className={line + " h-1 w-2/3"} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === "gallery") {
    return (
      <div className={wrap}>
        <div className={line + " h-1.5 w-12"} />
        <div className="mt-1 grid min-h-0 flex-1 grid-cols-4 grid-rows-2 gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={box} />
          ))}
        </div>
      </div>
    );
  }

  if (layout === "accordion") {
    return (
      <div className={wrap}>
        <div className={line + " mx-auto h-1.5 w-1/3"} />
        <div className="mt-1 flex min-h-0 flex-1 flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-1 items-center justify-between rounded-sm bg-white px-1.5">
              <div className={line + " h-1 w-2/3"} />
              <span className="text-[8px] leading-none text-ink-tertiary">▾</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === "map") {
    return (
      <div className={wrap + " relative overflow-hidden"}>
        <div className={line + " mx-auto h-1.5 w-12"} />
        <div className="relative mt-1 min-h-0 flex-1 overflow-hidden rounded-sm bg-[color:var(--pp-primary-200)]">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, white 1px, transparent 1.5px)", backgroundSize: "10px 10px" }} />
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--pp-violet)]" />
        </div>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <div className={line + " h-2 w-1/3"} />
      <div className={line + " h-1.5 w-full"} />
      <div className={line + " h-1.5 w-5/6"} />
      <div className={line + " h-1.5 w-2/3"} />
      <div className={line + " h-1.5 w-4/5"} />
    </div>
  );
}

export function ListingLayoutPicker({
  open,
  onPick,
  onClose,
}: {
  open: boolean;
  onPick: (pick: LayoutPick) => void;
  onClose: () => void;
}) {
  const { tx } = useI18n();
  const [tab, setTab] = useState<"layout" | "directory">("layout");
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[color:var(--pp-primary-950)]/40"
        aria-label={tx("Close")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-layout-title"
        className="relative z-10 flex max-h-[min(42rem,calc(100vh-2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_16px_48px_rgba(24,7,48,0.16)] sm:p-6"
      >
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <h2 id="listing-layout-title" className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Choose a layout")}
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">
              {tx("Pick a section. It will appear on this page, in this spot.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)]"
            aria-label={tx("Close")}
          >
            ✕
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          {(["layout", "directory"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                "rounded-full px-3 py-1.5 text-sm " +
                (tab === id
                  ? "bg-[color:var(--pp-primary-950)] text-white"
                  : "border border-line text-[color:var(--pp-primary-950)]")
              }
            >
              {id === "layout" ? tx("Layouts") : tx("Doctors & services")}
            </button>
          ))}
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {tab === "layout" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ADDABLE_LAYOUTS.map((layout) => (
                <button
                  key={layout}
                  type="button"
                  onClick={() => onPick({ type: "layout", layout })}
                  className="rounded-2xl border border-line bg-white p-3 text-left transition-shadow hover:ring-2 hover:ring-[color:var(--pp-violet)]"
                >
                  <Thumb layout={layout} />
                  <p className="mt-2.5 text-sm font-semibold text-[color:var(--pp-primary-950)]">
                    {tx(LAYOUT_META[layout].title)}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-ink-tertiary">{tx(LAYOUT_META[layout].blurb)}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {DIRECTORY_BLOCKS.map((b) => (
                <button
                  key={b.kind}
                  type="button"
                  onClick={() => onPick({ type: "embed", kind: b.kind })}
                  className="rounded-2xl border border-line bg-white p-3 text-left transition-shadow hover:ring-2 hover:ring-[color:var(--pp-violet)]"
                >
                  <div className="flex h-[5.25rem] items-center justify-center gap-2 rounded-lg bg-[color:var(--pp-primary-100)] p-2">
                    <span className="h-8 w-8 rounded-full bg-white" />
                    <span className="h-8 w-8 rounded-full bg-white" />
                    <span className="h-8 w-8 rounded-full bg-white" />
                  </div>
                  <p className="mt-2.5 text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(b.title)}</p>
                  <p className="mt-0.5 text-xs leading-snug text-ink-tertiary">{tx(b.blurb)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
