import {
  LandingFaq,
  LandingHowItWorks,
  LandingJoinBand,
  LandingNabpBand,
  LandingTestimonials,
} from "@/pages/LandingSections";
import { FRAME, SURFACE, SECTION_GAP, SECTION_GAP_Y } from "@/components/layout/Grid";
import { DraftReveal } from "@/pages/landing-draft/DraftReveal";

/** How it works, testimonials, join band, FAQ — below the white island. */
export function DraftLowerSection({ go }: { go: (to?: string) => void }) {
  return (
    <div className={`draft-lower ${FRAME} ${SECTION_GAP_Y}`}>
      <div className={`${SURFACE} flex flex-col ${SECTION_GAP} pb-0`}>
        <DraftReveal>
          <LandingHowItWorks />
        </DraftReveal>
        <DraftReveal>
          <LandingTestimonials />
        </DraftReveal>
        <DraftReveal>
          <LandingJoinBand go={go} />
        </DraftReveal>
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
