import { LandingFaq, LandingNabpBand } from "@/pages/LandingSections";
import { FRAME, SURFACE, SECTION_GAP, SECTION_GAP_Y } from "@/components/layout/Grid";
import { DraftReveal } from "@/pages/landing-draft/DraftReveal";

/**
 * Below the break: NABP band and FAQ, each its own island with the page
 * background showing between them. Everything above lives on the merged panel.
 */
export function DraftLowerSection({ go }: { go: (to?: string) => void }) {
  return (
    <div className={`draft-lower ${FRAME} ${SECTION_GAP_Y}`}>
      <div className={`${SURFACE} flex flex-col ${SECTION_GAP} pb-0`}>
        <DraftReveal>
          <LandingNabpBand />
        </DraftReveal>
        <DraftReveal>
          <LandingFaq go={go} />
        </DraftReveal>
      </div>
    </div>
  );
}
