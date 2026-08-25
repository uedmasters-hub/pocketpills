import { SHELL_X } from "@/components/layout/Grid";

/** Hairline between blocks on the merged landing panel. */
export function DraftSectionDivider({ flush = false }: { flush?: boolean } = {}) {
  return (
    <div className={`${SHELL_X}${flush ? "" : " pb-8 md:pb-10"}`} role="separator">
      <div className="border-t border-line" />
    </div>
  );
}
