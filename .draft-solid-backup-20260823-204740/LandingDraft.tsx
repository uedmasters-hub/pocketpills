import { useCallback, useLayoutEffect, useRef, useState } from "react";
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

/** Where the field lands after the focus scroll — 0.3 = just above centre. */
const FOCUS_VIEWPORT_RATIO = 0.3;

/**
 * Draft landing at /landing/draft.
 * Live `/` (Landing) is unchanged.
 *
 * First fold: video fills the whole viewport; ONE white panel (search + shop)
 * rides up over it so the search field sits a fixed gap above the fold bottom.
 */
export function LandingDraft() {
  const nav = useNavigate();
  const { signedIn } = useUser();
  const go = (to?: string) => nav(signedIn ? (to ?? "/app") : "/get-started");

  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  /*
    Measure panel top -> search field bottom and publish it as --draft-search-h.
    The panel's negative margin is derived from it, so the field always lands
    --draft-bottom-gap above the fold bottom regardless of copy or font size.
  */
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const panel = panelRef.current;
    if (!stage || !panel) return;
    const field = panel.querySelector<HTMLElement>("[data-draft-search-end]");
    if (!field) return;

    const measure = () => {
      const h = field.getBoundingClientRect().bottom - panel.getBoundingClientRect().top;
      if (h > 0) stage.style.setProperty("--draft-search-h", `${Math.round(h)}px`);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    ro.observe(field);
    window.addEventListener("resize", measure);
    const settle = window.setTimeout(measure, 500);
    void document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.clearTimeout(settle);
    };
  }, []);

  /* Focus mode: pull the field toward the middle, dim + blur everything else. */
  const onSearchOpenChange = useCallback((open: boolean) => {
    setFocused(open);
    if (!open) return;
    const field = panelRef.current?.querySelector<HTMLElement>("[data-draft-search-end]");
    if (!field) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      const top =
        window.scrollY +
        field.getBoundingClientRect().top -
        window.innerHeight * FOCUS_VIEWPORT_RATIO;
      window.scrollTo({ top: Math.max(top, 0), behavior: reduce ? "auto" : "smooth" });
    });
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--pp-page)]">
      <AnnouncementBar onGo={() => go()} />
      <SiteHeader />

      <main>
        <div ref={stageRef} className={`draft-stage${focused ? " is-focus" : ""}`}>
          {/* Video owns the full first fold */}
          <div className="draft-hero-slot">
            <DraftReveal soft delay={100}>
              <DraftHeroVideo />
            </DraftReveal>
          </div>

          {/* One panel, one border, one radius — search and shop share the surface */}
          <div className={`draft-panel-wrap ${FRAME}`}>
            <div ref={panelRef} className={`draft-panel ${SURFACE}`}>
              <DraftReveal soft delay={140}>
                <DraftSearchSection onOpenChange={onSearchOpenChange} />
              </DraftReveal>
              <DraftShopSection go={go} />
            </div>
          </div>
        </div>

        <DraftLowerSection go={go} />
      </main>

      <DraftReveal>
        <SiteFooter go={go} variant="full" />
      </DraftReveal>

      {focused ? <div className="draft-focus-scrim" aria-hidden /> : null}
    </div>
  );
}
