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

/** Draft landing at /landing/draft — live `/` is unchanged. */
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
          {/* Layer 1 — full-viewport video hero */}
          <div className="draft-first-fold">
            <div className="draft-hero-bg">
              <DraftReveal soft delay={100} className="draft-hero-reveal">
                <DraftHeroVideo />
              </DraftReveal>
            </div>

            {/* Layer 2 — search docked to fold bottom (over video) */}
            <div className={`draft-search-dock ${FRAME}`}>
              <div className={`${SURFACE} draft-white-panel draft-white-panel--head`}>
                <DraftReveal delay={140}>
                  <DraftSearchSection />
                </DraftReveal>
              </div>
            </div>
          </div>

          {/* Layer 3 — shop continues the same white panel */}
          <div className={`draft-shop-wrap ${FRAME}`}>
            <div className={`${SURFACE} draft-white-panel draft-white-panel--tail`}>
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
