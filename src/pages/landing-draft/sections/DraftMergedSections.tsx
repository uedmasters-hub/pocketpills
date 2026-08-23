import {
  LandingHowItWorks,
  LandingJoinBand,
  LandingTestimonials,
} from "@/pages/LandingSections";
import { DraftReveal } from "@/pages/landing-draft/DraftReveal";

/**
 * How it works, join band, testimonials — the lower half of the ONE merged
 * panel, continuous with search and shop above.
 *
 * These are the shared landing sections, so each still ships its own ISLAND
 * chrome for the live page. `.draft-merged` in landingDraft.css strips the
 * border, radius and white fill so they read as a single surface here.
 */
export function DraftMergedSections({ go }: { go: (to?: string) => void }) {
  return (
    <div className="draft-merged">
      <DraftReveal>
        <LandingHowItWorks />
      </DraftReveal>
      <DraftReveal>
        <LandingJoinBand go={go} />
      </DraftReveal>
      <DraftReveal>
        <LandingTestimonials />
      </DraftReveal>
    </div>
  );
}
