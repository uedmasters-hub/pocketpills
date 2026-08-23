import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { FRAME, SURFACE } from "@/components/layout/Grid";

const VIDEO_ID = "xbTcp1sTsME";
const HERO = {
  file: "/hero.mp4",
  poster: "",
  youtube: VIDEO_ID,
  start: 6,
};

/** Full-bleed draft hero video with grey overlay and trust badges. */
export function DraftHeroVideo() {
  const { tx } = useI18n();
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !HERO.file) return;
    if (reduced) {
      v.pause();
      setPlaying(false);
      return;
    }

    const seekStart = () => {
      if (Math.abs(v.currentTime - HERO.start) > 0.35) v.currentTime = HERO.start;
    };

    const onLoaded = () => {
      seekStart();
      void v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };

    const onTimeUpdate = () => {
      if (v.currentTime > 0 && v.currentTime < 0.4) seekStart();
    };

    if (v.readyState >= 1) onLoaded();
    else v.addEventListener("loadedmetadata", onLoaded);

    v.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [reduced]);

  const toggle = () => {
    const v = videoRef.current;
    if (v) {
      if (playing) v.pause();
      else void v.play().catch(() => {});
      setPlaying(!playing);
      return;
    }
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: playing ? "pauseVideo" : "playVideo", args: [] }),
      "https://www.youtube-nocookie.com",
    );
    setPlaying(!playing);
  };

  const ytSrc =
    `https://www.youtube-nocookie.com/embed/${HERO.youtube}` +
    `?autoplay=1&mute=1&loop=1&playlist=${HERO.youtube}&controls=0&modestbranding=1` +
    `&rel=0&playsinline=1&showinfo=0&iv_load_policy=3&enablejsapi=1&start=${HERO.start}` +
    `&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`;

  return (
    <section className="draft-hero relative overflow-hidden bg-[color:var(--pp-lavender)]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(900px 520px at 70% 25%, rgba(167,160,211,.55), transparent 62%)," +
            "radial-gradient(700px 460px at 20% 80%, rgba(124,116,188,.35), transparent 60%)," +
            "linear-gradient(140deg,#EFEAFB 0%,#E1D9F5 55%,#CFC4EE 100%)",
        }}
        aria-hidden
      />

      {HERO.file && !failed ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO.poster || undefined}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={HERO.file} />
        </video>
      ) : (
        <iframe
          ref={frameRef}
          title="How PocketPills works"
          src={ytSrc}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="eager"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[max(100%,56.25vw)] w-[max(100%,177.78vh)] -translate-x-1/2 -translate-y-1/2"
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[#D8D6E0]/35" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/5 via-transparent to-black/20"
        aria-hidden
      />

      <button
        type="button"
        onClick={toggle}
        className="absolute bottom-4 left-1/2 z-20 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-black/30 text-2xs text-white backdrop-blur transition-colors duration-200 hover:bg-black/50 sm:bottom-auto sm:left-auto sm:right-5 sm:top-28 sm:translate-x-0"
        aria-label={playing ? "Pause video" : "Play video"}
      >
        {playing ? "❚❚" : "▶"}
      </button>

      <div
        className={`draft-hero-trust pointer-events-none absolute inset-x-0 z-30 ${FRAME}`}
      >
        <div className={`${SURFACE} flex flex-wrap items-center justify-between gap-3`}>
          <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-[color:var(--pp-navy)] shadow-sm backdrop-blur-sm">
            <span aria-hidden>🇨🇦</span>
            {tx("Complete care, without leaving home")}
          </span>
          <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-[color:var(--pp-navy)] shadow-sm backdrop-blur-sm">
            {tx("Trusted by 800,000+ Canadians · 4.8★ rated")}
          </span>
        </div>
      </div>
    </section>
  );
}
