import {
  LandingBuyAgain,
  LandingFeatureCards,
  LandingPartners,
} from "@/pages/LandingSections";
import { DraftReveal } from "@/pages/landing-draft/DraftReveal";

/** Buy again, feature cards, and partners — inside the white draft panel. */
export function DraftShopSection({ go }: { go: (to?: string) => void }) {
  return (
    <section className="draft-shop-section" aria-label="Shop and get care">
      <DraftReveal delay={220}>
        <LandingBuyAgain go={go} compact />
      </DraftReveal>
      <DraftReveal delay={300}>
        <LandingFeatureCards go={go} />
      </DraftReveal>
      <DraftReveal delay={380}>
        <LandingPartners />
      </DraftReveal>
    </section>
  );
}
