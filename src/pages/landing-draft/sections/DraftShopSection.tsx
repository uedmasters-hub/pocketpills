import {
  LandingFeatureCards,
  LandingPartners,
} from "@/pages/LandingSections";
import { DraftReveal } from "@/pages/landing-draft/DraftReveal";
import { DraftSectionDivider } from "@/pages/landing-draft/DraftSectionDivider";
import { DraftTelehealthSection } from "@/pages/landing-draft/sections/DraftTelehealthSection";

/** Telehealth booking, feature cards, and partners — inside the white draft panel. */
export function DraftShopSection({ go }: { go: (to?: string) => void }) {
  return (
    <section className="draft-shop-section" aria-label="Telehealth and featured care">
      <DraftSectionDivider />
      <DraftReveal delay={220}>
        <DraftTelehealthSection />
      </DraftReveal>
      <DraftSectionDivider />
      <DraftReveal delay={300}>
        <LandingFeatureCards go={go} />
      </DraftReveal>
      <DraftSectionDivider />
      <DraftReveal delay={380}>
        <LandingPartners />
      </DraftReveal>
    </section>
  );
}
