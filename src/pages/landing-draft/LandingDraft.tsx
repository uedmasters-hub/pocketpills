import { useNavigate } from "react-router-dom";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FRAME, SURFACE } from "@/components/layout/Grid";
import { useUser } from "@/lib/user";
import { DraftHeroVideo } from "@/pages/landing-draft/DraftHeroVideo";
import { DraftReveal } from "@/pages/landing-draft/DraftReveal";
import { DraftLowerSection } from "@/pages/landing-draft/sections/DraftLowerSection";
import { DraftSearchSection } from "@/pages/landing-draft/sections/DraftSearchSection";
import { DraftShopSection } from "@/pages/landing-draft/sections/DraftShopSection";
import "@/pages/landing-draft/landingDraft.css";

/**
 * Draft landing at /landing/draft — rebuilt with isolated sections.
 * Live `/` (Landing) is unchanged.
 */
export function LandingDraft() {
  const nav = useNavigate();
  const { signedIn } = useUser();
  const go = (to?: string) => nav(signedIn ? (to ?? "/app") : "/get-started");

  return (
    <div className="min-h-screen bg-[color:var(--pp-page)]">
      <AnnouncementBar onGo={() => go()} />
      <SiteHeader />

      <main>
        <div className="draft-stage">
          {/* First fold: video + search (search always visible at bottom) */}
          <div className="draft-first-fold">
            <div className="draft-hero-slot">
              <DraftReveal soft delay={100}>
                <DraftHeroVideo />
              </DraftReveal>
            </div>

            <div className={`draft-search-anchor ${FRAME}`}>
              <div className={`draft-panel draft-panel-top ${SURFACE}`}>
                <DraftReveal delay={140}>
                  <DraftSearchSection />
                </DraftReveal>
              </div>
            </div>
          </div>

          {/* Shop continues the same white column — no seam */}
          <div className={`${FRAME} relative z-10`}>
            <div className={`draft-panel draft-panel-bottom ${SURFACE}`}>
              <DraftShopSection go={go} />
            </div>
          </div>
        </div>

        <DraftLowerSection go={go} />
      </main>

      <DraftReveal>
        <SiteFooter go={go} variant="full" />
      </DraftReveal>
    </div>
  );
}
