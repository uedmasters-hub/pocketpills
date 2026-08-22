import { useEffect, useState } from "react";

/** Floating action button — scrolls the window back to the top. */
export function ScrollToTopFab() {
  const [visible, setVisible] = useState(false);
  const [lift, setLift] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sync = () => setLift(document.body.hasAttribute("data-urgent-bar"));
    sync();
    window.addEventListener("pp-urgent-bar", sync);
    return () => window.removeEventListener("pp-urgent-bar", sync);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={
        "fixed right-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-cta text-white shadow-[0_8px_24px_rgba(24,7,48,0.22)] transition-[bottom,colors] duration-300 hover:bg-cta-hover active:bg-cta-pressed sm:right-8 " +
        (lift ? "bottom-[calc(40px+2.75rem)]" : "bottom-10")
      }
      aria-label="Scroll to top"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 19V5M12 5l-6 6M12 5l6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
