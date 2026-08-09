import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { entryPoints, type EntryIconKey } from "@/lib/data";
import { useUser } from "@/lib/user";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FRAME, SURFACE, SECTION_TITLE, SECTION_GAP, SECTION_GAP_Y, ISLAND_PAD, ISLAND_RADIUS, SHELL_X, SHELL_BLOCK } from "@/components/layout/Grid";

const VIDEO_ID = "xbTcp1sTsME";

/* Product art. Swap these for local files in /public if you want to self-host. */
const CDN = "https://static.pocketpills.com/acq-web/redesign/home";
const IMG = {
  pen: `${CDN}/ozempic_pen.webp`,
  ozempicCard: `${CDN}/novo-nordisk/wegoyReview.webp`,
  sildenafilCard: `${CDN}/novo-nordisk/saxenda_review_card.webp`,
  novoCard: `${CDN}/novo-nordisk/nn_logo_card.webp`,
};
/* Hide the <img> if the asset can't load, revealing the CSS art beneath. */
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; };

/* ═══ shared bits ═══════════════════════ */
function TileIcon({ id }: { id: EntryIconKey }) {
  const p = { fill: "white", fillRule: "evenodd" as const, clipRule: "evenodd" as const };
  if (id === "treatment")
    return (
      <svg width="30" height="31" viewBox="0 0 48 56" fill="none" aria-hidden>
        <path fill="white" d="M34.7997 13.1502H40.9604C42.1711 13.1502 43.6711 14.2402 44.0461 15.3502C45.5247 26.5902 46.6068 37.9002 47.9461 49.1702C48.3961 52.6102 45.7604 55.7202 42.1497 56.0002H5.82826C2.14255 55.7902 -0.332452 52.7902 0.0318341 49.3102L3.56755 15.9902C3.68541 14.7102 5.30326 13.1502 6.65326 13.1502H12.964C12.8461 9.67018 13.264 6.24018 15.7283 3.53018C19.7997 -0.939824 26.7961 -1.15982 31.3068 2.85018C34.3711 5.57018 35.0247 9.30018 34.7783 13.1502H34.7997ZM32.0997 13.1502C32.1211 11.7802 32.1211 10.4102 31.8533 9.06018C30.5568 2.62018 22.2211 0.280176 17.7104 5.35018C15.7497 7.55018 15.5783 10.3602 15.5783 13.1502H32.0997ZM12.9747 15.7202H6.95326C6.95326 15.7202 6.63183 15.8902 6.57826 15.9402C6.13898 16.2602 6.08541 16.6302 6.02112 17.1202C5.30326 24.3002 4.58541 31.4802 3.85683 38.6502C3.49255 42.2202 2.84969 46.0402 2.65683 49.5902C2.53898 51.6902 3.55683 53.1202 5.82826 53.2802H42.2354C45.8461 52.7502 45.3747 50.2002 45.1068 47.5202C44.6033 42.4402 43.939 37.3602 43.3926 32.2802C42.8568 27.3402 42.5461 22.1602 41.8068 17.2702C41.7318 16.8002 41.689 16.2402 41.239 15.9502C41.1747 15.9102 40.7568 15.7202 40.7247 15.7202H34.7783V17.9702C36.5247 18.9202 36.5354 21.3102 34.8318 22.3102C32.3033 23.7902 29.6568 20.7102 31.4568 18.5702C31.6711 18.3202 32.164 18.0602 32.164 17.7502V15.7102H15.6426V18.0702C15.6426 18.0702 15.7604 18.0802 15.8247 18.1402C18.7818 20.9102 14.6568 24.2002 12.3854 21.9402C11.1854 20.7402 11.5283 18.8502 12.9533 17.9702V15.7202H12.9747Z" />
        <path fill="white" d="M27.9215 32.1H33.943C34.1573 32.1 34.6501 32.6 34.6501 32.86C34.5108 34.83 34.8537 37.07 34.6501 39.01C34.6287 39.25 34.5751 39.39 34.4251 39.58C34.3394 39.68 33.9644 39.97 33.868 39.97H27.9215C27.943 41.48 27.9001 43 27.9215 44.52C27.9215 44.67 27.9965 44.81 27.9965 44.95C28.018 45.73 28.0823 46.75 27.0644 46.92C25.093 46.78 22.8644 47.1 20.9358 46.92C20.3466 46.87 20.0037 46.5 19.9394 45.94L20.0037 39.97H14.2823C13.8858 39.97 13.3501 39.4 13.3501 39.01C13.543 37.11 13.0608 34.93 13.2751 33.07C13.2966 32.89 13.3608 32.69 13.468 32.54C13.543 32.43 13.9608 32.11 14.0573 32.11H20.0037C19.993 31.5 20.0251 30.89 20.0037 30.28C19.9715 28.97 19.768 27.2 19.9287 25.92C19.993 25.37 20.4644 25.07 21.0108 25.02C22.918 24.86 25.0608 25.15 27.0001 25.02C27.3644 25.01 27.9323 25.54 27.9323 25.84V32.1H27.9215Z" />
      </svg>
    );
  if (id === "fill")
    return (
      <svg width="30" height="31" viewBox="0 0 36 37" fill="none" aria-hidden>
        <path {...p} d="M10.125 9.75C10.125 9.12868 10.6287 8.625 11.25 8.625H16.5165C18.9927 8.625 21 10.6323 21 13.1085C21 15.3977 19.2843 17.2861 17.0687 17.5582L20.991 21.4805L24.517 17.9545C24.9563 17.5152 25.6687 17.5152 26.108 17.9545C26.5473 18.3938 26.5473 19.1062 26.108 19.5455L22.582 23.0715L26.3892 26.8788C26.8286 27.3181 26.8286 28.0305 26.3892 28.4698C25.9499 28.9091 25.2376 28.9091 24.7983 28.4698L20.991 24.6625L17.108 28.5455C16.6687 28.9848 15.9563 28.9848 15.517 28.5455C15.0777 28.1062 15.0777 27.3938 15.517 26.9545L19.4 23.0715L13.9204 17.5919H12.375V22.8C12.375 23.4213 11.8713 23.925 11.25 23.925C10.6287 23.925 10.125 23.4213 10.125 22.8V9.75ZM12.375 15.3419H16.5165C17.75 15.3419 18.75 14.342 18.75 13.1085C18.75 11.875 17.75 10.875 16.5165 10.875H12.375V15.3419Z" />
        <path {...p} d="M6.75 2.4375C4.88604 2.4375 3.375 3.94854 3.375 5.8125V32.25C3.375 34.114 4.88604 35.625 6.75 35.625H29.25C31.114 35.625 32.625 34.114 32.625 32.25V5.8125C32.625 3.94854 31.114 2.4375 29.25 2.4375H6.75ZM5.625 5.8125C5.625 5.19118 6.12868 4.6875 6.75 4.6875H29.25C29.8713 4.6875 30.375 5.19118 30.375 5.8125V32.25C30.375 32.8713 29.8713 33.375 29.25 33.375H6.75C6.12868 33.375 5.625 32.8713 5.625 32.25V5.8125Z" />
      </svg>
    );
  if (id === "transfer")
    return (
      <svg width="30" height="31" viewBox="0 0 36 37" fill="none" aria-hidden>
        <path {...p} d="M5.0625 1.875C3.19854 1.875 1.6875 3.38604 1.6875 5.25V8.625C1.6875 10.1814 2.74103 11.4917 4.17385 11.8818C4.02133 12.2665 3.9375 12.686 3.9375 13.125V32.25C3.9375 34.114 5.44854 35.625 7.3125 35.625H18.5625C20.4265 35.625 21.9375 34.114 21.9375 32.25V27.75C21.9375 27.1287 21.4338 26.625 20.8125 26.625C20.1912 26.625 19.6875 27.1287 19.6875 27.75V32.25C19.6875 32.8713 19.1838 33.375 18.5625 33.375H7.3125C6.69118 33.375 6.1875 32.8713 6.1875 32.25V13.125C6.1875 12.5037 6.69118 12 7.3125 12H18.5625C19.1838 12 19.6875 12.5037 19.6875 13.125V17.0114C19.6875 17.6327 20.1912 18.1364 20.8125 18.1364C21.4338 18.1364 21.9375 17.6327 21.9375 17.0114V13.125C21.9375 12.686 21.8537 12.2665 21.7011 11.8818C23.134 11.4917 24.1875 10.1814 24.1875 8.625V5.25C24.1875 3.38604 22.6765 1.875 20.8125 1.875H5.0625ZM20.8125 9.75C21.4338 9.75 21.9375 9.24632 21.9375 8.625V5.25C21.9375 4.62868 21.4338 4.125 20.8125 4.125H5.0625C4.44118 4.125 3.9375 4.62868 3.9375 5.25V8.625C3.9375 9.24632 4.44118 9.75 5.0625 9.75H20.8125Z" />
        <path fill="white" d="M26.7254 15.1605C27.1545 14.7112 27.8666 14.6948 28.316 15.1239L35.0895 21.5927C35.3118 21.8049 35.4375 22.0989 35.4375 22.4062C35.4375 22.7136 35.3118 23.0076 35.0895 23.2198L28.316 29.6886C27.8666 30.1177 27.1545 30.1013 26.7254 29.652C26.2963 29.2027 26.3127 28.4905 26.762 28.0614L31.5056 23.5312H14.0625C13.4412 23.5312 12.9375 23.0276 12.9375 22.4062C12.9375 21.7849 13.4412 21.2812 14.0625 21.2812H31.5056L26.762 16.7511C26.3127 16.322 26.2963 15.6099 26.7254 15.1605Z" />
      </svg>
    );
  return (
    <svg width="30" height="31" viewBox="0 0 36 37" fill="none" aria-hidden>
      <path {...p} d="M2.701 11.326C0.599667 13.4273 0.599666 16.8343 2.701 18.9356L9.37689 25.6115C11.4782 27.7128 14.8852 27.7128 16.9865 25.6115C19.0878 23.5102 19.0878 20.1032 16.9865 18.0019L10.3106 11.326C8.20927 9.22466 4.80233 9.22467 2.701 11.326ZM4.29199 17.3446C3.06934 16.122 3.06934 14.1396 4.29199 12.917C5.51465 11.6943 7.49696 11.6943 8.71962 12.917L11.2621 15.4594L6.83444 19.8871L4.29199 17.3446ZM8.42543 21.4781L12.8531 17.0504L15.3955 19.5929C16.6182 20.8155 16.6182 22.7978 15.3955 24.0205C14.1729 25.2432 12.1905 25.2432 10.9679 24.0205L8.42543 21.4781Z" />
      <path {...p} d="M27.6919 16.8154C31.7896 16.8154 35.1115 20.1373 35.1115 24.2351C35.1115 28.3328 31.7896 31.6547 27.6919 31.6547C26.0489 31.6547 24.5306 31.1207 23.3012 30.2167L18.5484 34.9695C18.1091 35.4089 17.3968 35.4089 16.9574 34.9695C16.5181 34.5302 16.5181 33.8178 16.9574 33.3785L21.7102 28.6257C20.8062 27.3963 20.2722 25.8781 20.2722 24.2351C20.2722 20.1373 23.5941 16.8154 27.6919 16.8154ZM32.8615 24.2351C32.8615 21.38 30.547 19.0654 27.6919 19.0654C24.8367 19.0654 22.5222 21.38 22.5222 24.2351C22.5222 27.0902 24.8367 29.4047 27.6919 29.4047C30.547 29.4047 32.8615 27.0902 32.8615 24.2351Z" />
      <path {...p} d="M11.8125 4.6875C11.8125 4.06618 12.3162 3.5625 12.9375 3.5625H32.0625C32.6838 3.5625 33.1875 4.06618 33.1875 4.6875C33.1875 10.59 28.4025 15.375 22.5 15.375C16.5975 15.375 11.8125 10.59 11.8125 4.6875ZM14.1368 5.8125C14.6869 9.94053 18.2215 13.125 22.5 13.125C26.7785 13.125 30.3132 9.94053 30.8632 5.8125H14.1368Z" />
    </svg>
  );
}

/** Circled arrow — exact geometry from the production markup. */
function ArrowCircle({ size = 24, circleFill = "var(--pp-primary-950)", arrowFill = "#fff" }: { size?: number; circleFill?: string; arrowFill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="12" fill={circleFill} />
      <path d="M7.81588 11.3698H14.6974L11.691 8.28258C11.4507 8.03586 11.4507 7.63098 11.691 7.38426C11.9313 7.13754 12.3194 7.13754 12.5597 7.38426L16.6196 11.5532C16.8599 11.7999 16.8599 12.1985 16.6196 12.4452L12.5597 16.6142C12.3194 16.8609 11.9313 16.8609 11.691 16.6142C11.4507 16.3675 11.4507 15.9689 11.691 15.7222L14.6974 12.635H7.81588C7.47704 12.635 7.19981 12.3503 7.19981 12.0024C7.19981 11.6544 7.47704 11.3698 7.81588 11.3698Z" fill={arrowFill} />
    </svg>
  );
}

/** 2×2 entry tiles — simple icon + label on the lavender well (no card chrome). */
function Tiles({ onPick, last }: { onPick: (to: string) => void; last?: { title: string; to: string } }) {
  const items = last ? [...entryPoints.slice(0, 3), { ...entryPoints[3], title: last.title, to: last.to }] : entryPoints;
  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2">
      {items.map((e) => (
        <button
          key={e.title}
          type="button"
          onClick={() => onPick(e.to)}
          className="flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-4 px-3 py-6 text-center transition-opacity duration-200 hover:opacity-80 active:opacity-70 sm:min-h-[160px] sm:gap-5"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl sm:h-16 sm:w-16" style={{ backgroundColor: e.tile }}>
            <TileIcon id={e.id} />
          </span>
          <span className="text-sm font-medium leading-snug text-[color:var(--pp-headline)] sm:text-base">{e.title}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══ 1. Announcement bar ═══════════════════════ */
function CircleArrow({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.3 12h5.2M12.4 9.4l2.6 2.6-2.6 2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnnouncementBar({ onGo }: { onGo: () => void }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="relative z-50 bg-[color:var(--pp-navy)] text-white" role="region" aria-label="Promotion">
      <div className="mx-auto flex max-w-[1600px] items-center justify-center gap-4 px-12 py-2.5 text-2xs sm:text-xs">
        <span className="text-white/80">Ozempic® now at just $139</span>
        <button type="button" onClick={onGo} className="inline-flex items-center gap-1.5 font-semibold text-white transition-opacity duration-200 hover:opacity-80">
          Get started <CircleArrow />
        </button>
        <button type="button" onClick={() => setShow(false)} className="absolute right-5 text-white/55 transition-colors hover:text-white" aria-label="Dismiss announcement">✕</button>
      </div>
    </div>
  );
}

/* ═══ 3. Hero (full-bleed autoplay video) ════════ */
/**
 * Hero media, in order of preference:
 *   1. HERO.file    — self-hosted mp4/webm. Most reliable: muted autoplay is
 *                     allowed everywhere and there's no third-party embed to fail.
 *                     Drop a file in /public and set the path below.
 *   2. HERO.youtube — iframe fallback (needs the video to allow embedding).
 *   3. Gradient     — always painted underneath, so the hero is never blank.
 */
const HERO = {
  file: "/hero.mp4",              // self-hosted; falls back to YouTube if missing
  poster: "",                     // e.g. "/hero-poster.jpg"
  youtube: VIDEO_ID,
  start: 54,
};

function Hero() {
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  /* Native video: attempt autoplay, and surface the control if the browser blocks it. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !HERO.file) return;
    if (reduced) { v.pause(); setPlaying(false); return; }
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [reduced]);

  const toggle = () => {
    const v = videoRef.current;
    if (v) {
      if (playing) v.pause(); else void v.play().catch(() => {});
      setPlaying(!playing);
      return;
    }
    // YouTube JS API needs an exact origin to accept commands.
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
    <section
      className="hero-viewport relative -mt-[65px] min-h-[520px] overflow-hidden bg-[color:var(--pp-lavender)] md:-mt-[82px]"
    >
      {/* Always-present backdrop so the hero reads as designed even with no media. */}
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

      {/* Soft gray wash — mutes the video and adds depth for badges */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[#D8D6E0]/45" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-transparent to-black/25" aria-hidden />

      <button
        type="button"
        onClick={toggle}
        className="absolute bottom-4 left-1/2 z-20 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-black/30 text-2xs text-white backdrop-blur transition-colors duration-200 hover:bg-black/50 sm:bottom-auto sm:left-auto sm:right-5 sm:top-28 sm:translate-x-0"
        aria-label={playing ? "Pause video" : "Play video"}
      >
        {playing ? "❚❚" : "▶"}
      </button>

      {/* Align with white shell below: FRAME gutters + SURFACE width */}
      <div className={`pointer-events-none absolute inset-x-0 bottom-14 z-30 md:bottom-16 ${FRAME}`}>
        <div className={`${SURFACE} flex flex-wrap items-center justify-between gap-3`}>
          <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-[color:var(--pp-navy)] shadow-sm backdrop-blur-sm">
            <span aria-hidden>🇨🇦</span>Complete care, without leaving home
          </span>
          <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-[color:var(--pp-navy)] shadow-sm backdrop-blur-sm">
            Trusted by 800,000+ Canadians · 4.8★ rated
          </span>
        </div>
      </div>
    </section>
  );
}

/* ═══ 4. Welcome card + stats ═══════════════════ */
function Welcome({ onStart }: { onStart: () => void }) {
  const stats = [
    ["100% Canadian Care", "Trusted by millions of Canadians"],
    ["Over 2 million", "5-star in-app reviews"],
    ["4.8 rating", "46K+ App Store reviews"],
    ["4.6 rating", "13K+ Google Play Store reviews"],
    ["4.7 score", "9K+ Trustpilot reviews"],
  ];
  return (
    <header className={`${SHELL_X} pb-10 pt-8 text-center sm:pt-10 md:pb-12`}>
      <p className="text-base font-semibold text-[color:var(--pp-violet)]">Welcome to Pocketpills</p>
      <h1 className="mx-auto mt-3 max-w-3xl font-display text-[clamp(2.25rem,4vw,2.875rem)] font-medium leading-[1.15] tracking-tight text-[color:var(--pp-headline)]">
        Your health, handled.
      </h1>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 inline-flex min-w-[12.5rem] items-center justify-center gap-2 rounded-full bg-cta px-12 py-4 text-md font-medium text-white transition-colors duration-200 hover:bg-cta-hover active:bg-cta-pressed"
      >
        get start <CircleArrow size={16} />
      </button>
      <div className="mt-10 grid grid-cols-2 gap-y-6 border-t border-line pt-8 text-left sm:grid-cols-3 lg:mt-12 lg:grid-cols-5 lg:divide-x lg:divide-line lg:pt-8">
        {stats.map(([big, small], i) => (
          <div key={small} className={i > 0 ? "lg:pl-6" : ""}>
            <p className="text-sm font-semibold text-ink">{big}</p>
            <p className="mt-1 text-2xs leading-snug text-ink-tertiary">{small}</p>
          </div>
        ))}
      </div>
    </header>
  );
}

/* ═══ 5. Buy again + tiles ════════════════════ */
function SectionHeads({ title, onLink }: { title: string; onLink: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h2 className="text-md font-semibold text-[color:var(--pp-primary-950)]">{title}</h2>
      <button
        type="button"
        onClick={onLink}
        className="inline-flex items-center gap-1.5 text-base text-[color:var(--pp-primary-950)] transition-opacity duration-200 hover:opacity-70"
      >
        Talk to a licensed clinician <span className="text-lg leading-none" aria-hidden>›</span>
      </button>
    </div>
  );
}

/** Outline ring + arrow, exact geometry from the production button. */
function RingArrow({ size = 20, color = "#4E2A84" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 21" fill="none" aria-hidden>
      <path d="M12.4588 9.42628H6.18653C5.87769 9.42628 5.625 9.68575 5.625 10.0029C5.625 10.32 5.87769 10.5795 6.18653 10.5795H12.4588L9.71853 13.3933C9.49954 13.6182 9.49954 13.9815 9.71853 14.2063C9.93753 14.4312 10.2913 14.4312 10.5103 14.2063L14.2108 10.4065C14.4297 10.1816 14.4297 9.81837 14.2108 9.59349L10.5103 5.79366C10.2913 5.56878 9.93753 5.56878 9.71853 5.79366C9.49954 6.01853 9.49954 6.38756 9.71853 6.61244L12.4588 9.42628Z" fill={color} />
      <path fillRule="evenodd" clipRule="evenodd" d="M20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10ZM18.8437 10C18.8437 14.8843 14.8843 18.8437 10 18.8437C5.11573 18.8437 1.15625 14.8843 1.15625 10C1.15625 5.11573 5.11573 1.15625 10 1.15625C14.8843 1.15625 18.8437 5.11573 18.8437 10Z" fill={color} />
    </svg>
  );
}

function BuyAgain({ go }: { go: (to?: string) => void }) {
  return (
    <section className={SHELL_BLOCK} aria-label="Shop and get care">
      <div className="grid gap-6 lg:min-h-[430px] lg:grid-cols-2 lg:gap-8">
        <div className="flex min-h-0 flex-col">
          <SectionHeads title="Buy again!" onLink={() => go("/messages")} />
          <div
            className="relative flex min-h-[280px] flex-1 overflow-hidden rounded-3xl lg:min-h-0"
            style={{ backgroundImage: "linear-gradient(135deg,#A78BEE 0%,#8A6FE3 45%,#6B4FC7 100%)" }}
          >
            <div className="grid h-full w-full grid-cols-2 overflow-hidden">
              <div className="relative z-10 flex flex-col justify-center gap-6 p-7 sm:gap-8 sm:p-10">
                <h3 className="font-display text-2xl font-light leading-[1.2] text-white sm:text-3xl sm:leading-[1.14]">
                  Ozempic<sup className="align-super text-[0.42em] font-normal">®</sup> now<br />at just $139
                </h3>
                <button
                  type="button"
                  onClick={() => go("/drug/ozempic")}
                  className="inline-flex w-max items-center gap-2.5 rounded-full bg-white px-6 py-3 text-base font-medium text-[color:var(--pp-primary-950)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get started <RingArrow />
                </button>
              </div>

              <div className="relative min-h-[220px]">
                <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[125%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
                  {[0.42, 0.6, 0.78, 0.96].map((k) => (
                    <span key={k} className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/25" style={{ width: `${k * 100}%` }} />
                  ))}
                </div>
                <img
                  src={IMG.pen}
                  alt="Ozempic injection pen available through Pocketpills"
                  loading="lazy"
                  onError={hideOnError}
                  className="absolute inset-0 h-full w-full object-contain object-bottom"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 w-full flex-col">
          <SectionHeads title="Doctor-led treatment" onLink={() => go("/find-care")} />
          <div className="w-full flex-1 rounded-3xl bg-[color:var(--primary-200)] p-2 sm:p-3">
            <Tiles onPick={(to) => go(to)} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══ 6. Feature cards ══════════════════════ */
/* Mirrors production: flex-col justify-between, full-bleed object-cover object-right
   image behind, title top (max-w-xs) and CTA row bottom, both above the image. */
function FeatureCard({
  onClick, bgClass, img, alt, textClass, cta, circleFill, arrowFill, children,
}: {
  onClick: () => void; bgClass: string; img: string; alt: string; textClass: string;
  cta: string; circleFill: string; arrowFill: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"group relative flex aspect-[13/9] min-h-[240px] flex-1 flex-col justify-between overflow-hidden rounded-3xl p-7 text-left transition-opacity duration-200 hover:opacity-95 active:opacity-90 sm:min-h-[260px] sm:p-8 " + bgClass}
    >
      <img src={img} alt={alt} loading="lazy" onError={hideOnError}
        className="absolute inset-0 h-full w-full object-cover object-right transition-transform duration-500 group-hover:scale-[1.02]" />
      <div className="relative z-10 max-w-[16rem]">
        <p className={"font-display text-lg font-medium leading-snug sm:text-xl " + textClass}>{children}</p>
      </div>
      <div className="relative z-10 flex items-center gap-3">
        <p className={"text-base font-medium " + textClass}>{cta}</p>
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          <ArrowCircle circleFill={circleFill} arrowFill={arrowFill} />
        </span>
      </div>
    </button>
  );
}

function FeatureCards({ go }: { go: (to?: string) => void }) {
  return (
    <section className={SHELL_BLOCK} aria-label="Featured treatments">
      <div className="flex flex-col gap-4 md:flex-row md:gap-5">
        <FeatureCard
          onClick={() => go("/drug/ozempic")}
          bgClass="bg-[color:var(--primary-200)]"
          img={IMG.ozempicCard}
          alt="Doctor-prescribed weight-loss treatments, now available through PocketPills."
          textClass="text-[color:var(--pp-primary-950)]"
          cta="Learn more"
          circleFill="#4E2A84"
          arrowFill="#ffffff"
        >
          Is Ozempic right for you?
        </FeatureCard>

        <FeatureCard
          onClick={() => go("/find-care")}
          bgClass="bg-[color:var(--pp-primary-950)]"
          img={IMG.sildenafilCard}
          alt="Get a Sildenafil prescription online through PocketPills."
          textClass="text-white"
          cta="Learn more"
          circleFill="#F5F4FA"
          arrowFill="#4E2A84"
        >
          Get a Sildenafil prescription.
        </FeatureCard>

        <FeatureCard
          onClick={() => go("/find-care")}
          bgClass="bg-[color:var(--pp-primary-300)]"
          img={IMG.novoCard}
          alt="PocketPills and Novo Nordisk, changing care for Canadians."
          textClass="text-[color:var(--pp-primary-950)]"
          cta="Our mission"
          circleFill="#F5F4FA"
          arrowFill="#4E2A84"
        >
          Pocketpills × Novo Nordisk Changing care for Canadians.
        </FeatureCard>
      </div>
    </section>
  );
}

/* ═══ 7. Partner marquee ═════════════════════ */
const ENTERPRISE = "https://static.pocketpills.com/webapp/images/enterprise";
const PARTNERS: { file: string; name: string; alt: string; w: number; h: number }[] = [
  { file: "canadian_tire.svg", name: "CANADIAN TIRE", alt: "Online pharmacy of Canadian Tire", w: 135, h: 28 },
  { file: "toyota.svg", name: "TOYOTA", alt: "Online pharmacy of TOYOTA", w: 112, h: 28 },
  { file: "neo.svg", name: "neo", alt: "Online pharmacy of Neo", w: 47, h: 28 },
  { file: "koho.svg", name: "KOHO", alt: "Online pharmacy of KOHO", w: 78, h: 28 },
  { file: "indeed.svg", name: "indeed", alt: "Online pharmacy of Indeed", w: 76, h: 28 },
  { file: "123_dentist.svg", name: "123DENTIST", alt: "Online pharmacy of 123Dentist", w: 103, h: 28 },
  { file: "vet_care.svg", name: "VetCare", alt: "Online pharmacy of VetCare", w: 83, h: 24 },
];

/** Renders the partner logo, falling back to its wordmark if the SVG can't load. */
function PartnerLogo({ file, name, alt, w, h }: (typeof PARTNERS)[number]) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return <span className="flex h-9 shrink-0 items-center whitespace-nowrap font-display text-base font-medium text-ink-tertiary/70">{name}</span>;
  return (
    <img
      src={`${ENTERPRISE}/${file}`}
      alt={alt}
      width={w}
      height={h}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-9 max-w-40 shrink-0 object-contain"
    />
  );
}

function Partners() {
  const group = (key: string) => (
    <div key={key} className="flex shrink-0 gap-28 pr-28">
      {PARTNERS.map((p) => <PartnerLogo key={key + p.file} {...p} />)}
    </div>
  );
  return (
    <section className={`${SHELL_X} pb-14 pt-2 md:pb-16`} aria-label="Enterprise partners">
      <div className="flex flex-col items-center">
        <h2 className="text-md font-medium text-[color:var(--pp-primary-950)]">Proud pharmacy of:</h2>
        <div className="mt-8 w-full">
          <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div className="pp-marquee flex w-fit" style={{ animationDuration: "47.2667s" }}>
              {group("a")}
              {group("b")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══ 8b. How it works ═══════════════════════════════ */
const HOW_CDN = "https://static.pocketpills.com/acq-web/redesign/home";
/** Seconds into each step clip before its card visual populates. */
const HOW_REVEAL_AT = 1.8;
const HOW_STEPS = [
  {
    title: "Become a member",
    video: `${HOW_CDN}/videos/step1.webm`,
    poster: `${HOW_CDN}/posterStep1.webp`,
    card: "/img/how/card1-welcome.webp",
    alt: "Welcome to Pocketpills — become a member.",
  },
  {
    title: "Match with experts",
    video: `${HOW_CDN}/videos/step2.webm`,
    poster: `${HOW_CDN}/posterStep2.webp`,
    // Multi-option floating expert scene (calling UI also at /img/how/card2-call.jpg)
    card: "/img/how/card2-experts.jpg",
    alt: "Match with Pocketpills clinicians and pharmacists.",
  },
  {
    title: "Manage your health on the go",
    video: `${HOW_CDN}/videos/step3.webm`,
    poster: `${HOW_CDN}/posterStep3.webp`,
    card: "/img/how/card3-manage.webp",
    alt: "Manage prescriptions, refills, and care from your phone with Pocketpills.",
  },
] as const;

function HowItWorks() {
  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState<boolean[]>(() => HOW_STEPS.map(() => false));
  const [inView, setInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const advanceTimer = useRef<number | null>(null);
  const step = HOW_STEPS[active];

  /* Start the sequence once the section is meaningfully on screen. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Reduced motion: skip the staged reveal and show everything. */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(HOW_STEPS.map(() => true));
      setInView(true);
    }
  }, []);

  useEffect(() => {
    if (!inView) return;
    const v = videoRef.current;
    if (!v) return;
    v.load();
    void v.play().catch(() => {});
  }, [active, inView]);

  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  const revealStep = (index: number) => {
    setRevealed((prev) => {
      if (prev[index]) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    const beat = Math.min(HOW_REVEAL_AT, Math.max(0.6, v.duration * 0.2));
    if (v.currentTime >= beat) revealStep(active);
  };

  const onEnded = () => {
    revealStep(active);
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      setActive((i) => (i + 1) % HOW_STEPS.length);
    }, 450);
  };

  const onCardClick = (i: number) => {
    if (!revealed[i]) return;
    setActive(i);
  };

  return (
    <section
      ref={sectionRef}
      id="how"
      className={`overflow-hidden ${ISLAND_RADIUS} bg-white`}
      aria-labelledby="how-heading"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8 xl:gap-10">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[24rem] shrink-0 overflow-hidden bg-[color:var(--primary-500)] lg:mx-0 lg:aspect-auto lg:w-[min(48%,30rem)] lg:max-w-none lg:self-stretch">
          {inView ? (
            <video
              key={step.video}
              ref={videoRef}
              muted
              playsInline
              autoPlay
              poster={step.poster}
              onTimeUpdate={onTimeUpdate}
              onEnded={onEnded}
              className="absolute inset-0 h-full w-full object-cover object-center"
              aria-label={step.alt}
            >
              <source src={step.video} type="video/webm" />
            </video>
          ) : (
            <div className="pp-skeleton absolute inset-0" aria-hidden />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-6 sm:px-6 lg:pl-2 lg:pr-8">
          <p className="pp-caps text-[color:var(--pp-violet)]">How it works</p>
          <h2 id="how-heading" className={`mt-2 max-w-xl ${SECTION_TITLE}`}>
            Do it <span className="text-[color:var(--pp-violet)]">all</span> without leaving home.
          </h2>

          <ol className="mt-6 grid grid-cols-1 gap-x-3 gap-y-7 sm:mt-7 sm:grid-cols-3 sm:gap-x-3">
            {HOW_STEPS.map((s, i) => {
              const isActive = i === active && revealed[i];
              const isReady = revealed[i];
              return (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => onCardClick(i)}
                    disabled={!isReady}
                    className={
                      "group flex w-full flex-col items-center text-center " +
                      (isReady ? "cursor-pointer" : "cursor-default")
                    }
                    aria-current={isActive ? "step" : undefined}
                    aria-busy={!isReady}
                  >
                    <span className="relative w-full pb-3.5">
                      <span
                        className={
                          "relative mx-auto block aspect-[3/4] w-full max-w-[9.5rem] overflow-hidden rounded-t-2xl rounded-b-none transition-[border-color,transform,box-shadow] duration-300 sm:max-w-[10.5rem] " +
                          (isReady ? "bg-[color:var(--pp-primary-200)]" : "bg-[#ececf1]") +
                          " " +
                          (isActive
                            ? "border border-[color:var(--pp-primary-950)] shadow-[0_8px_24px_rgba(78,42,132,0.12)]"
                            : "border border-transparent")
                        }
                      >
                        {isReady ? (
                          <img
                            src={s.card}
                            alt=""
                            loading="lazy"
                            onError={hideOnError}
                            className="pp-how-card-in absolute inset-0 h-full w-full object-cover object-top"
                          />
                        ) : (
                          <span className="pp-how-skel" aria-hidden />
                        )}
                      </span>
                      <span
                        className={
                          "absolute bottom-0 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full text-xs font-semibold transition-colors duration-300 " +
                          (isActive
                            ? "bg-[color:var(--pp-primary-950)] text-white"
                            : isReady
                              ? "bg-white text-[color:var(--pp-primary-950)] ring-1 ring-[color:var(--pp-primary-300)]"
                              : "bg-[color:var(--pp-primary-200)] text-[color:var(--pp-primary-400)] ring-1 ring-[color:var(--pp-primary-300)]")
                        }
                      >
                        {i + 1}
                      </span>
                    </span>
                    <span
                      className={
                        "mt-1.5 max-w-[9.5rem] text-xs font-medium leading-snug transition-colors duration-300 sm:text-sm " +
                        (isActive
                          ? "text-[color:var(--pp-primary-950)]"
                          : isReady
                            ? "text-[color:var(--pp-primary-800)]"
                            : "text-[color:var(--pp-primary-400)]")
                      }
                    >
                      {s.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ═══ 8. Testimonials ═══════════════════════ */
const STAR = "var(--pp-star)";

function FullStar({ w = 24 }: { w?: number }) {
  return (
    <svg width={w} height={w * (23 / 24)} viewBox="0 0 24 23" fill="none" aria-hidden>
      <path d="M12 0.863281L14.6942 9.15508H23.4127L16.3593 14.2797L19.0534 22.5715L12 17.4469L4.94658 22.5715L7.64074 14.2797L0.587322 9.15508H9.30583L12 0.863281Z" fill={STAR} />
    </svg>
  );
}

/* Decorative mark in each card's bottom-right (production cycles four of these). */
function ReviewMark({ id }: { id: "capsule" | "multi" | "plus" | "transfer" }) {
  const f = { fill: STAR, fillRule: "evenodd" as const, clipRule: "evenodd" as const };
  if (id === "capsule")
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path {...f} d="M14.687 5.00517C12.0134 2.33161 7.67874 2.33161 5.00518 5.00517C2.33161 7.67874 2.33161 12.0134 5.00517 14.687L10.452 20.1338L20.1338 10.452L14.687 5.00517ZM21.548 11.8662L11.8662 21.548L17.313 26.9948C19.9866 29.6684 24.3213 29.6684 26.9948 26.9948C29.6684 24.3213 29.6684 19.9866 26.9948 17.313L21.548 11.8662ZM3.59096 3.59096C7.04558 0.136348 12.6466 0.136346 16.1012 3.59096L28.409 15.8988C31.8637 19.3534 31.8636 24.9544 28.409 28.409C24.9544 31.8637 19.3534 31.8637 15.8988 28.409L3.59096 16.1012C0.136343 12.6466 0.136351 7.04557 3.59096 3.59096Z" />
      </svg>
    );
  if (id === "multi")
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path {...f} d="M2.40089 9.40089C0.533037 11.2687 0.533036 14.2971 2.40089 16.165L8.33502 22.0991C10.2029 23.967 13.2313 23.967 15.0991 22.0991C16.967 20.2313 16.967 17.2029 15.0991 15.335L9.16498 9.40089C7.29713 7.53303 4.26874 7.53304 2.40089 9.40089ZM3.8151 14.7508C2.7283 13.664 2.7283 11.9019 3.8151 10.8151C4.90191 9.7283 6.66397 9.7283 7.75077 10.8151L10.0107 13.0751L6.07506 17.0107L3.8151 14.7508ZM7.48927 18.4249L11.4249 14.4893L13.6849 16.7492C14.7717 17.836 14.7717 19.5981 13.6849 20.6849C12.5981 21.7717 10.836 21.7717 9.74923 20.6849L7.48927 18.4249Z" />
        <path {...f} d="M24.615 14.2804C28.2574 14.2804 31.2102 17.2332 31.2102 20.8756C31.2102 24.5181 28.2574 27.4708 24.615 27.4708C23.1545 27.4708 21.805 26.9962 20.7122 26.1926L16.4875 30.4173C16.097 30.8079 15.4638 30.8079 15.0733 30.4173C14.6827 30.0268 14.6827 29.3936 15.0733 29.0031L19.2979 24.7784C18.4944 23.6856 18.0198 22.3361 18.0198 20.8756C18.0198 17.2332 20.9725 14.2804 24.615 14.2804ZM29.2102 20.8756C29.2102 18.3377 27.1529 16.2804 24.615 16.2804C22.0771 16.2804 20.0198 18.3377 20.0198 20.8756C20.0198 23.4135 22.0771 25.4708 24.615 25.4708C27.1529 25.4708 29.2102 23.4135 29.2102 20.8756Z" />
        <path {...f} d="M10.5 3.5C10.5 2.94772 10.9477 2.5 11.5 2.5H28.5C29.0523 2.5 29.5 2.94772 29.5 3.5C29.5 8.74671 25.2467 13 20 13C14.7533 13 10.5 8.74671 10.5 3.5ZM12.5661 4.5C13.055 8.16936 16.1969 11 20 11C23.8031 11 26.945 8.16936 27.4339 4.5H12.5661Z" />
      </svg>
    );
  if (id === "plus")
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path {...f} d="M13.7812 3.5C13.229 3.5 12.7812 3.94772 12.7812 4.5V11.7812C12.7812 12.3335 12.3335 12.7812 11.7812 12.7812H4.5C3.94772 12.7812 3.5 13.229 3.5 13.7812V18.2188C3.5 18.771 3.94772 19.2188 4.5 19.2188H11.7812C12.3335 19.2188 12.7812 19.6665 12.7812 20.2188V27.5C12.7812 28.0523 13.229 28.5 13.7812 28.5H18.2188C18.771 28.5 19.2188 28.0523 19.2188 27.5V20.2188C19.2188 19.6665 19.6665 19.2188 20.2188 19.2188H27.5C28.0523 19.2188 28.5 18.771 28.5 18.2188V13.7812C28.5 13.229 28.0523 12.7812 27.5 12.7812H20.2188C19.6665 12.7812 19.2188 12.3335 19.2188 11.7812V4.5C19.2188 3.94772 18.771 3.5 18.2188 3.5H13.7812ZM10.7812 4.5C10.7812 2.84315 12.1244 1.5 13.7812 1.5H18.2188C19.8756 1.5 21.2188 2.84315 21.2188 4.5V10.7812H27.5C29.1569 10.7812 30.5 12.1244 30.5 13.7812V18.2188C30.5 19.8756 29.1569 21.2188 27.5 21.2188H21.2188V27.5C21.2188 29.1569 19.8756 30.5 18.2188 30.5H13.7812C12.1244 30.5 10.7812 29.1569 10.7812 27.5V21.2188H4.5C2.84315 21.2188 1.5 19.8756 1.5 18.2188V13.7812C1.5 12.1244 2.84315 10.7812 4.5 10.7812H10.7812V4.5Z" />
      </svg>
    );
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path {...f} d="M4.5 1C2.84315 1 1.5 2.34315 1.5 4V7C1.5 8.38347 2.43647 9.54821 3.71009 9.89492C3.57451 10.2369 3.5 10.6098 3.5 11V28C3.5 29.6569 4.84315 31 6.5 31H16.5C18.1569 31 19.5 29.6569 19.5 28V24C19.5 23.4477 19.0523 23 18.5 23C17.9477 23 17.5 23.4477 17.5 24V28C17.5 28.5523 17.0523 29 16.5 29H6.5C5.94772 29 5.5 28.5523 5.5 28V11C5.5 10.4477 5.94772 10 6.5 10H16.5C17.0523 10 17.5 10.4477 17.5 11V14.4545C17.5 15.0068 17.9477 15.4545 18.5 15.4545C19.0523 15.4545 19.5 15.0068 19.5 14.4545V11C19.5 10.6098 19.4255 10.2369 19.2899 9.89492C20.5635 9.54821 21.5 8.38347 21.5 7V4C21.5 2.34315 20.1569 1 18.5 1H4.5ZM18.5 8C19.0523 8 19.5 7.55228 19.5 7V4C19.5 3.44772 19.0523 3 18.5 3H4.5C3.94772 3 3.5 3.44772 3.5 4V7C3.5 7.55228 3.94772 8 4.5 8H18.5Z" />
      <path {...f} d="M23.7559 12.8094C24.1373 12.4099 24.7703 12.3954 25.1697 12.7768L31.1907 18.5268C31.3882 18.7155 31.5 18.9768 31.5 19.25C31.5 19.5232 31.3882 19.7845 31.1907 19.9732L25.1697 25.7232C24.7703 26.1046 24.1373 26.0901 23.7559 25.6907C23.3745 25.2912 23.389 24.6582 23.7884 24.2768L28.005 20.25H12.5C11.9477 20.25 11.5 19.8023 11.5 19.25C11.5 18.6977 11.9477 18.25 12.5 18.25H28.005L23.7884 14.2232C23.389 13.8418 23.3745 13.2088 23.7559 12.8094Z" />
    </svg>
  );
}

function CarouselArrow({ dir, active, onClick }: { dir: "l" | "r"; active: boolean; onClick: () => void }) {
  const c = active ? "#4E2A84" : "#AAACCA";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!active}
      aria-label={dir === "l" ? "Previous reviews" : "Next reviews"}
      className="hidden shrink-0 cursor-pointer transition-opacity duration-200 hover:opacity-70 active:opacity-50 disabled:cursor-default disabled:opacity-40 md:block"
    >
      <svg width="48" height="49" viewBox="0 0 48 49" fill="none" className="transition-all duration-300" aria-hidden>
        <path d="M1 24.1499C1 11.4474 11.2975 1.1499 24 1.1499C36.7025 1.1499 47 11.4474 47 24.1499C47 36.8525 36.7025 47.1499 24 47.1499C11.2975 47.1499 1 36.8525 1 24.1499Z" stroke={c} strokeWidth="2" />
        {dir === "l"
          ? <path d="M27.4145 16.4503C27.8009 16.8449 27.7942 17.478 27.3996 17.8644L20.9293 24.1999L27.3996 30.5354C27.7942 30.9218 27.8009 31.5549 27.4145 31.9495C27.0281 32.3441 26.395 32.3508 26.0004 31.9644L18.8004 24.9144C18.6083 24.7263 18.5 24.4688 18.5 24.1999C18.5 23.931 18.6083 23.6735 18.8004 23.4854L26.0004 16.4354C26.395 16.049 27.0281 16.0557 27.4145 16.4503Z" fill={c} />
          : <path d="M20.7847 16.4503C20.3983 16.8449 20.405 17.478 20.7996 17.8644L27.2699 24.1999L20.7996 30.5354C20.405 30.9218 20.3983 31.5549 20.7847 31.9495C21.1711 32.3441 21.8042 32.3508 22.1988 31.9644L29.3988 24.9144C29.591 24.7263 29.6992 24.4688 29.6992 24.1999C29.6992 23.931 29.591 23.6735 29.3988 23.4854L22.1988 16.4354C21.8042 16.049 21.1711 16.0557 20.7847 16.4503Z" fill={c} />}
      </svg>
    </button>
  );
}

const REVIEWS: { name: string; text: string; mark: "capsule" | "multi" | "plus" | "transfer" }[] = [
  { name: "Angie A.", mark: "capsule", text: "I haven't had a family doctor in 3 years—Pocketpills makes it possible to still get my meds." },
  { name: "Kim O.", mark: "multi", text: "Moved provinces with no doctor—Pocketpills set me up with telehealth and renewed my meds without delay. Love them!" },
  { name: "Christine P.", mark: "plus", text: "Getting a doctor is hard. Pocketpills ships fast, connects me with telehealth, and goes above and beyond. So grateful!" },
  { name: "Ellie B.", mark: "transfer", text: "Managing prescriptions is so easy with Pocketpills. Simple refills, med reminders, and fast delivery. Highly recommend!" },
  { name: "Briar L.", mark: "capsule", text: "Their pharmacists are knowledgeable and friendly, and their Telehealth team is great too. 10/10 would recommend." },
  { name: "Peter S.", mark: "multi", text: "I love the convenience, affordability and communication. Pocketpills makes it all go away." },
  { name: "S & R Khaled", mark: "plus", text: "No queue, no wait, no 'pickup isn't ready.' I can text the pharmacist anytime. Auto refills + doctor requests? Worth the switch." },
];

function Testimonials() {
  const box = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = () => {
    const el = box.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };
  useEffect(() => {
    sync();
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scroll = (d: number) => {
    const el = box.current;
    if (!el) return;
    const card = el.querySelector("article");
    const styles = getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap) || 24;
    const step = (card?.getBoundingClientRect().width ?? 280) + gap;
    el.scrollBy({ left: d * step, behavior: "smooth" });
  };

  return (
    <section className={`${ISLAND_RADIUS} bg-white`} aria-labelledby="reviews-heading">
      <div className={`flex flex-col gap-8 ${ISLAND_PAD} md:gap-10`}>
        <div className="mx-auto flex max-w-2xl flex-col gap-3 text-center text-[color:var(--pp-primary-950)]">
          <h2 id="reviews-heading" className={SECTION_TITLE}>Our members love us</h2>
          <p className="text-base leading-relaxed text-ink-secondary">
            See why thousands across Canada choose <span className="font-medium text-[color:var(--pp-primary-950)]">Pocketpills</span>.
          </p>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <CarouselArrow dir="l" active={!atStart} onClick={() => scroll(-1)} />

          <div
            ref={box}
            onScroll={sync}
            className="pp-scroll flex w-full min-w-0 flex-1 gap-6 overflow-x-scroll scroll-smooth"
            tabIndex={0}
            role="region"
            aria-label="Member reviews"
          >
            {REVIEWS.map((r) => (
              <article
                key={r.name}
                className="pp-snap flex min-h-[15.5rem] w-[calc((100%-1.5rem)/2)] shrink-0 flex-col rounded-2xl bg-[color:var(--pp-primary-200)] p-6 md:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]"
              >
                <div className="mb-3 flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => <FullStar key={i} />)}
                </div>
                <p className="text-base leading-relaxed text-[color:var(--pp-primary-800)]">{r.text}</p>
                <div className="mt-auto flex w-full items-center justify-between pt-5">
                  <p className="text-base font-semibold text-[color:var(--pp-primary-950)]">{r.name}</p>
                  <ReviewMark id={r.mark} />
                </div>
              </article>
            ))}
          </div>

          <CarouselArrow dir="r" active={!atEnd} onClick={() => scroll(1)} />
        </div>

        <div className="mx-auto flex items-center justify-center gap-1.5 rounded-xl border border-line px-5 py-3.5">
          <span className="text-base font-medium text-[color:var(--pp-primary-950)]">4.9</span>
          <span className="px-0.5" aria-hidden><FullStar w={16} /></span>
          <img src="https://static.pocketpills.com/acq-web/redesign/home/google-logo.png" alt="Google" width={73} height={25} loading="lazy" onError={hideOnError} className="mt-0.5" />
        </div>
      </div>
    </section>
  );
}

/* ═══ 9. Join band + testimonial marquee ══════════ */
const REVIEW_CDN = "https://static.pocketpills.com/acq-web/redesign/home/review_card";

interface Member { n: string; t: string; img: number; bg: string; dark: boolean; }
const MEMBERS: Member[] = [
  { n: "Peggy F.", img: 1, bg: "var(--pp-primary-950)", dark: true, t: "I am so happy that my meds are delivered right to my door. I never have to worry about running out." },
  { n: "Stacy P.", img: 2, bg: "var(--pp-primary-900)", dark: true, t: "I love how they help me stay on top of my refills. I never have to worry about it again!" },
  { n: "Jacqueline K.", img: 3, bg: "var(--pp-primary-300)", dark: false, t: "I love how I can track my delivery. Plus, they send me reminders when it's time to refill." },
  { n: "Kevin E.", img: 4, bg: "var(--pp-primary-200)", dark: false, t: "They handle all my refills and deal with my insurance directly. Makes life so easy." },
  { n: "Karen L.", img: 5, bg: "var(--pp-primary-950)", dark: true, t: "The best team of professionals, very knowledgeable and always ready to help." },
  { n: "Bob A.", img: 6, bg: "var(--pp-primary-900)", dark: true, t: "They take care of everything for me. I never have to worry about my medications." },
];

function SmallStar() {
  return (
    <svg width="15" height="14" viewBox="0 0 15 14" fill="currentColor" aria-hidden>
      <path d="M7.60039 0L9.21689 4.97508H14.448L10.2159 8.04984L11.8324 13.0249L7.60039 9.95016L3.36834 13.0249L4.98484 8.04984L0.752784 4.97508H5.98389L7.60039 0Z" />
    </svg>
  );
}

function TestimonialCard({ m }: { m: Member }) {
  return (
    <article
      className="flex h-[300px] min-w-[17rem] shrink-0 snap-center flex-col-reverse overflow-hidden rounded-2xl md:h-[330px] md:min-w-[38rem] md:flex-row"
      style={{ backgroundColor: m.bg }}
    >
      <div className="h-1/2 w-full shrink-0 md:h-full md:w-1/2">
        <picture>
          <source srcSet={`${REVIEW_CDN}/Testimonial_card_D${m.img}.webp`} media="(min-width: 768px)" width={794} height={578} />
          <img
            loading="lazy"
            onError={hideOnError}
            src={`${REVIEW_CDN}/Testimonial_card_M${m.img}.webp`}
            width={794}
            height={578}
            alt={`Pocketpills pharmacy customer review from ${m.n}`}
            className="h-full w-full scale-[1.01] object-cover"
          />
        </picture>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-4 p-6 md:gap-5 md:p-10">
        <h3 className={"font-display text-xl font-medium leading-tight " + (m.dark ? "text-white" : "text-[color:var(--pp-primary-950)]")}>{m.n}</h3>
        <div className="flex gap-1 text-[color:var(--pp-primary-400)]" aria-label="5 out of 5 stars">
          {Array.from({ length: 5 }).map((_, i) => <SmallStar key={i} />)}
        </div>
        <p className={"text-sm leading-relaxed " + (m.dark ? "text-[color:var(--pp-primary-200)]" : "text-[color:var(--pp-primary-800)]")}>{m.t}</p>
      </div>
    </article>
  );
}

function TrustpilotBadge() {
  return (
    <div className="mx-auto mt-10 hidden max-w-md items-center justify-center gap-4 rounded-xl bg-[color:var(--pp-primary-200)] px-5 py-2 md:flex">
      <p className="pp-caps text-ink-secondary">Excellent</p>
      <span className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-[color:var(--pp-primary-800)]">4.8 out of 5</span>
      <svg width="88" height="32" viewBox="0 0 88 32" fill="none" aria-label="Trustpilot">
        <path d="M8.61539 20.2816L12.359 19.3329L13.9231 24.1534L8.61539 20.2816ZM17.2308 14.0508H10.641L8.61539 7.8457L6.58975 14.0508H0L5.33334 17.897L3.30769 24.1021L8.64103 20.256L11.9231 17.897L17.2308 14.0508Z" fill="#219653" />
        <path d="M27.7865 10.5V21H25.6303V10.5H27.7865ZM31.0173 10.5V12.1947H22.45V10.5H31.0173ZM33.6928 14.899V21H31.6158V13.1971H33.5702L33.6928 14.899ZM36.0437 13.1466L36.0077 15.0721C35.9067 15.0577 35.7841 15.0457 35.6399 15.0361C35.5005 15.0216 35.373 15.0144 35.2577 15.0144C34.9644 15.0144 34.7096 15.0529 34.4932 15.1298C34.2817 15.2019 34.1038 15.3101 33.9596 15.4543C33.8202 15.5986 33.7144 15.774 33.6423 15.9808C33.575 16.1875 33.5365 16.4231 33.5269 16.6875L33.1086 16.5577C33.1086 16.0529 33.1591 15.5889 33.2601 15.1659C33.361 14.738 33.5077 14.3654 33.7 14.0481C33.8971 13.7308 34.1375 13.4856 34.4211 13.3125C34.7048 13.1394 35.0293 13.0529 35.3947 13.0529C35.5101 13.0529 35.6279 13.0625 35.748 13.0817C35.8682 13.0962 35.9668 13.1178 36.0437 13.1466ZM41.6399 19.1322V13.1971H43.7168V21H41.7625L41.6399 19.1322ZM41.8706 17.5312L42.4836 17.5168C42.4836 18.0361 42.4235 18.5192 42.3033 18.9663C42.1831 19.4087 42.0029 19.7933 41.7625 20.1202C41.5221 20.4423 41.2192 20.6947 40.8538 20.8774C40.4884 21.0553 40.0581 21.1442 39.563 21.1442C39.1831 21.1442 38.8322 21.0913 38.5101 20.9856C38.1928 20.875 37.9187 20.7043 37.688 20.4736C37.462 20.238 37.2841 19.9375 37.1543 19.5721C37.0293 19.2019 36.9668 18.7572 36.9668 18.238V13.1971H39.0437V18.2524C39.0437 18.4832 39.0702 18.6779 39.123 18.8365C39.1807 18.9952 39.2601 19.125 39.361 19.226C39.462 19.3269 39.5798 19.399 39.7144 19.4423C39.8538 19.4856 40.0077 19.5072 40.1759 19.5072C40.6038 19.5072 40.9404 19.4207 41.1855 19.2476C41.4355 19.0745 41.611 18.8389 41.712 18.5409C41.8178 18.238 41.8706 17.9014 41.8706 17.5312ZM49.5221 18.8437C49.5221 18.6947 49.4788 18.5601 49.3923 18.4399C49.3057 18.3197 49.1447 18.2091 48.9091 18.1082C48.6783 18.0024 48.3442 17.9062 47.9067 17.8197C47.5125 17.7332 47.1447 17.625 46.8033 17.4952C46.4668 17.3606 46.1735 17.1995 45.9235 17.012C45.6783 16.8245 45.486 16.6034 45.3466 16.3486C45.2072 16.0889 45.1375 15.7933 45.1375 15.4615C45.1375 15.1346 45.2072 14.8269 45.3466 14.5385C45.4908 14.25 45.6952 13.9952 45.9596 13.774C46.2288 13.5481 46.5557 13.3726 46.9404 13.2476C47.3298 13.1178 47.7673 13.0529 48.2529 13.0529C48.9307 13.0529 49.5125 13.1611 49.998 13.3774C50.4884 13.5937 50.8634 13.8918 51.123 14.2716C51.3875 14.6466 51.5197 15.0745 51.5197 15.5553H49.4428C49.4428 15.3534 49.3995 15.1731 49.313 15.0144C49.2312 14.851 49.1014 14.7236 48.9235 14.6322C48.7505 14.5361 48.5245 14.488 48.2456 14.488C48.0149 14.488 47.8154 14.5288 47.6471 14.6106C47.4788 14.6875 47.349 14.7933 47.2577 14.9279C47.1711 15.0577 47.1279 15.2019 47.1279 15.3606C47.1279 15.4808 47.1519 15.5889 47.2 15.6851C47.2529 15.7764 47.337 15.8606 47.4524 15.9375C47.5678 16.0144 47.7168 16.0865 47.8995 16.1538C48.087 16.2163 48.3178 16.274 48.5918 16.3269C49.1543 16.4423 49.6567 16.5937 50.099 16.7812C50.5413 16.9639 50.8923 17.2139 51.1519 17.5312C51.4115 17.8437 51.5413 18.2548 51.5413 18.7644C51.5413 19.1106 51.4644 19.4279 51.3105 19.7163C51.1567 20.0048 50.9355 20.2572 50.6471 20.4736C50.3586 20.6851 50.0125 20.851 49.6086 20.9712C49.2096 21.0865 48.7601 21.1442 48.2601 21.1442C47.5341 21.1442 46.9187 21.0144 46.4139 20.7548C45.9139 20.4952 45.5341 20.1659 45.2745 19.7668C45.0197 19.363 44.8923 18.9495 44.8923 18.5264H46.861C46.8706 18.8101 46.9428 19.0385 47.0774 19.2115C47.2168 19.3846 47.3923 19.5096 47.6038 19.5865C47.8202 19.6635 48.0533 19.7019 48.3033 19.7019C48.5726 19.7019 48.7961 19.6659 48.974 19.5937C49.1519 19.5168 49.2865 19.4159 49.3779 19.2909C49.474 19.1611 49.5221 19.012 49.5221 18.8437ZM56.712 13.1971V14.6683H52.1687V13.1971H56.712ZM53.2937 11.2716H55.3706V18.649C55.3706 18.875 55.3995 19.0481 55.4572 19.1683C55.5197 19.2885 55.611 19.3726 55.7312 19.4207C55.8514 19.4639 56.0029 19.4856 56.1855 19.4856C56.3154 19.4856 56.4307 19.4808 56.5317 19.4712C56.6375 19.4567 56.7264 19.4423 56.7985 19.4279L56.8057 20.9567C56.6279 21.0144 56.4355 21.0601 56.2288 21.0938C56.0221 21.1274 55.7937 21.1442 55.5437 21.1442C55.087 21.1442 54.688 21.0697 54.3466 20.9207C54.0101 20.7668 53.7505 20.5216 53.5678 20.1851C53.3851 19.8486 53.2937 19.4062 53.2937 18.8582V11.2716ZM59.9716 14.6971V24H57.8947V13.1971H59.8202L59.9716 14.6971ZM64.9115 17.012V17.1635C64.9115 17.7308 64.8442 18.2572 64.7096 18.7428C64.5798 19.2284 64.3875 19.6514 64.1327 20.012C63.8779 20.3678 63.5605 20.6466 63.1807 20.8486C62.8057 21.0457 62.373 21.1442 61.8827 21.1442C61.4067 21.1442 60.9932 21.0481 60.6423 20.8558C60.2913 20.6635 59.9956 20.3942 59.7553 20.0481C59.5197 19.6971 59.3298 19.2909 59.1855 18.8293C59.0413 18.3678 58.9307 17.8726 58.8538 17.3437V16.9471C58.9307 16.3798 59.0413 15.8606 59.1855 15.3894C59.3298 14.9135 59.5197 14.5024 59.7553 14.1562C59.9956 13.8053 60.2889 13.5337 60.6351 13.3413C60.986 13.149 61.3971 13.0529 61.8682 13.0529C62.3634 13.0529 62.7985 13.1466 63.1735 13.3341C63.5533 13.5216 63.8706 13.7909 64.1255 14.1418C64.3851 14.4928 64.5798 14.9111 64.7096 15.3966C64.8442 15.8822 64.9115 16.4207 64.9115 17.012ZM62.8274 17.1635V17.012C62.8274 16.6803 62.7985 16.375 62.7408 16.0962C62.688 15.8125 62.6014 15.5649 62.4812 15.3534C62.3658 15.1418 62.212 14.9784 62.0197 14.863C61.8322 14.7428 61.6038 14.6827 61.3346 14.6827C61.0509 14.6827 60.8081 14.7284 60.6062 14.8197C60.4091 14.9111 60.248 15.0433 60.123 15.2163C59.998 15.3894 59.9043 15.5962 59.8418 15.8365C59.7793 16.0769 59.7408 16.3486 59.7264 16.6514V17.6538C59.7505 18.0096 59.8178 18.3293 59.9283 18.613C60.0389 18.8918 60.2096 19.113 60.4404 19.2764C60.6711 19.4399 60.974 19.5216 61.349 19.5216C61.623 19.5216 61.8538 19.4615 62.0413 19.3413C62.2288 19.2163 62.3803 19.0457 62.4956 18.8293C62.6158 18.613 62.7 18.363 62.748 18.0793C62.8009 17.7957 62.8274 17.4904 62.8274 17.1635ZM68.3947 13.1971V21H66.3105V13.1971H68.3947ZM66.1807 11.1635C66.1807 10.8606 66.2865 10.6106 66.498 10.4135C66.7096 10.2163 66.9932 10.1178 67.349 10.1178C67.7 10.1178 67.9812 10.2163 68.1928 10.4135C68.4091 10.6106 68.5173 10.8606 68.5173 11.1635C68.5173 11.4663 68.4091 11.7163 68.1928 11.9135C67.9812 12.1106 67.7 12.2091 67.349 12.2091C66.9932 12.2091 66.7096 12.1106 66.498 11.9135C66.2865 11.7163 66.1807 11.4663 66.1807 11.1635ZM72.3033 9.92308V21H70.2192V9.92308H72.3033ZM73.688 17.1779V17.0264C73.688 16.4543 73.7697 15.9279 73.9331 15.4471C74.0966 14.9615 74.3346 14.5409 74.6471 14.1851C74.9596 13.8293 75.3442 13.5529 75.8009 13.3558C76.2577 13.1538 76.7817 13.0529 77.373 13.0529C77.9644 13.0529 78.4908 13.1538 78.9524 13.3558C79.4139 13.5529 79.8009 13.8293 80.1134 14.1851C80.4307 14.5409 80.6711 14.9615 80.8346 15.4471C80.998 15.9279 81.0798 16.4543 81.0798 17.0264V17.1779C81.0798 17.7452 80.998 18.2716 80.8346 18.7572C80.6711 19.238 80.4307 19.6587 80.1134 20.0192C79.8009 20.375 79.4163 20.6514 78.9596 20.8486C78.5029 21.0457 77.9788 21.1442 77.3875 21.1442C76.7961 21.1442 76.2697 21.0457 75.8081 20.8486C75.3514 20.6514 74.9644 20.375 74.6471 20.0192C74.3346 19.6587 74.0966 19.238 73.9331 18.7572C73.7697 18.2716 73.688 17.7452 73.688 17.1779ZM75.7649 17.0264V17.1779C75.7649 17.5048 75.7937 17.8101 75.8514 18.0937C75.9091 18.3774 76.0005 18.6274 76.1255 18.8437C76.2553 19.0553 76.4235 19.2212 76.6303 19.3413C76.837 19.4615 77.0894 19.5216 77.3875 19.5216C77.6759 19.5216 77.9235 19.4615 78.1303 19.3413C78.337 19.2212 78.5029 19.0553 78.6279 18.8437C78.7529 18.6274 78.8442 18.3774 78.9019 18.0937C78.9644 17.8101 78.9956 17.5048 78.9956 17.1779V17.0264C78.9956 16.7091 78.9644 16.4111 78.9019 16.1322C78.8442 15.8486 78.7505 15.5986 78.6206 15.3822C78.4956 15.1611 78.3298 14.988 78.123 14.863C77.9163 14.738 77.6663 14.6755 77.373 14.6755C77.0798 14.6755 76.8298 14.738 76.623 14.863C76.4211 14.988 76.2553 15.1611 76.1255 15.3822C76.0005 15.5986 75.9091 15.8486 75.8514 16.1322C75.7937 16.4111 75.7649 16.7091 75.7649 17.0264ZM86.1783 13.1971V14.6683H81.6351V13.1971H86.1783ZM82.7601 11.2716H84.837V18.649C84.837 18.875 84.8658 19.0481 84.9235 19.1683C84.986 19.2885 85.0774 19.3726 85.1976 19.4207C85.3178 19.4639 85.4692 19.4856 85.6519 19.4856C85.7817 19.4856 85.8971 19.4808 85.9981 19.4712C86.1038 19.4567 86.1928 19.4423 86.2649 19.4279L86.2721 20.9567C86.0942 21.0144 85.9019 21.0601 85.6952 21.0938C85.4884 21.1274 85.2601 21.1442 85.0101 21.1442C84.5533 21.1442 84.1543 21.0697 83.813 20.9207C83.4764 20.7668 83.2168 20.5216 83.0341 20.1851C82.8514 19.8486 82.7601 19.4062 82.7601 18.8582V11.2716Z" fill="#37325D" />
      </svg>
    </div>
  );
}

function JoinBand({ go }: { go: (to?: string) => void }) {
  const group = (key: string) => (
    <div key={key} className="flex w-fit shrink-0 gap-6 pr-6">
      {MEMBERS.map((m) => <TestimonialCard key={key + m.n} m={m} />)}
    </div>
  );
  return (
    <section className={`${ISLAND_RADIUS} bg-white ${ISLAND_PAD}`} aria-labelledby="join-heading">
      <div className="mb-10 flex flex-col items-center gap-6 md:mb-12">
        <h2 id="join-heading" className={`mx-auto max-w-xl text-center ${SECTION_TITLE}`}>
          Join <span className="text-[color:var(--pp-violet)]">800,000+</span> Canadians who never miss a dose.
        </h2>
        <button
          type="button"
          onClick={() => go()}
          className="w-max rounded-full bg-cta px-8 py-4 text-md font-medium text-white transition-colors duration-200 hover:bg-cta-hover active:bg-cta-pressed"
        >
          Join Pocketpills
        </button>
      </div>

      <div className="hidden md:block">
        <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
          <div className="pp-marquee flex w-fit" style={{ animationDuration: "49.65s" }}>
            {group("a")}
            {group("b")}
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <div className="pp-scroll -mx-2 flex w-[calc(100%+1rem)] gap-4 overflow-x-auto px-2 pb-2">
          {MEMBERS.map((m) => <TestimonialCard key={m.n} m={m} />)}
        </div>
      </div>

      <TrustpilotBadge />
    </section>
  );
}

/* ═══ 10. NABP band ═════════════════════════════════════ */
function NabpBand() {
  return (
    <section
      className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.35fr)] lg:items-stretch"
      aria-labelledby="nabp-heading"
    >
      <div className={`${ISLAND_RADIUS} relative min-h-[220px] overflow-hidden sm:min-h-[280px] lg:min-h-0`}>
        <img
          src="/img/nabp-care.png"
          alt="Licensed clinician writing a prescription"
          width={800}
          height={600}
          loading="lazy"
          onError={hideOnError}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div
        className={`flex flex-col gap-6 ${ISLAND_RADIUS} bg-[color:var(--pp-green)] p-8 text-white sm:flex-row sm:items-center sm:gap-8 sm:p-10 md:gap-10 md:px-12 md:py-11`}
      >
        <div className="flex shrink-0 flex-col items-center gap-3 sm:min-w-[7.5rem]">
          <p className="text-2xs uppercase tracking-[0.2em] text-white/60">Accredited by</p>
          <img
            src="https://static.pocketpills.com/acq-web/redesign/home/nabp.svg"
            alt="Pocketpills Online Pharmacy is an accredited member with NABP National Association of Boards of Pharmacy"
            width={205}
            height={241}
            loading="lazy"
            onError={hideOnError}
            className="h-auto w-20"
          />
        </div>
        <div className="hidden w-px self-stretch bg-white/20 sm:block" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="nabp-heading" className="font-display text-2xl font-medium leading-snug text-white md:text-3xl">
            Putting you first, every time.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
            Our licensed healthcare providers carefully assess each concern and provide expert medical guidance.
            Whether it's a diagnosis, treatment plan, or prescription, you can trust you're in good hands.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══ 11. FAQ ═══════════════════════════════════════════ */
function Faq({ go }: { go: (to?: string) => void }) {
  const faqs: [string, string][] = [
    [
      "What is Pocketpills?",
      "Pocketpills is now a comprehensive online healthcare platform that brings doctor visits, prescription renewals, and pharmacy deliveries together in one place. You can consult with licensed Canadian healthcare providers, manage medications for yourself or your family, and have prescriptions delivered to your door—without ever stepping into a clinic or pharmacy. All online, on your time.",
    ],
    ["What's new at Pocketpills?", "Doctor-led treatment plans, faster telehealth, and expanded same-day delivery in select regions."],
    ["Who can use Pocketpills online healthcare platform?", "Anyone in Canada with a valid address and either provincial or private coverage."],
    ["Can I order a prescription online?", "Yes. Upload it, have your clinic fax it, mail it in, or transfer from another pharmacy—we handle the rest."],
    ["What types of conditions can Pocketpills help with?", "Everyday concerns like UTIs and acne, ongoing conditions like blood pressure and diabetes, plus birth control and more."],
    ["Does Pocketpills replace my family doctor?", "No. We're here between visits for renewals, everyday concerns, and ongoing conditions."],
    ["Is Pocketpills covered by insurance or my health plan?", "We bill most provincial and private plans directly, so you only pay what's left."],
    ["Is Pocketpills legit?", "Yes—a licensed Canadian pharmacy, NABP accredited, SOC 2 Type 2 certified and PIPEDA compliant."],
    ["Can Pocketpills refill prescription orders for me?", "Yes. Auto-refill prepares your next fill and reminds you before you run out."],
    ["Is delivery free with Pocketpills online pharmacy?", "Always—free delivery to every province and territory."],
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="grid gap-8 lg:grid-cols-[minmax(240px,300px)_1fr] lg:gap-14" aria-labelledby="faq-heading">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="pp-caps text-[color:var(--pp-violet)]">Frequently Asked</p>
        <h2 id="faq-heading" className={`mt-3 ${SECTION_TITLE}`}>
          Your questions,<br className="hidden lg:block" /> answered.
        </h2>
        <button
          type="button"
          onClick={() => go()}
          className="mt-6 rounded-full bg-cta px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-cta-hover active:bg-cta-pressed"
        >
          More FAQs
        </button>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-4" role="list">
        {faqs.map(([q, a], i) => {
          const isOpen = open === i;
          const panelId = `faq-panel-${i}`;
          const btnId = `faq-btn-${i}`;
          return (
            <div
              key={q}
              role="listitem"
              className={
                "rounded-2xl bg-white px-6 py-5 transition-[border-color] duration-200 sm:px-8 sm:py-6 " +
                (isOpen
                  ? "border border-[color:var(--pp-violet)]"
                  : "border border-transparent")
              }
            >
              <button
                id={btnId}
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-start justify-between gap-4 text-left"
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className="text-base font-medium leading-snug text-[color:var(--pp-primary-900)] sm:text-md">{q}</span>
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[color:var(--pp-primary-900)]" aria-hidden>
                  {isOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12h14" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  )}
                </span>
              </button>
              <div id={panelId} role="region" aria-labelledby={btnId} hidden={!isOpen}>
                {isOpen && (
                  <p className="mt-4 pr-8 text-sm leading-relaxed text-[color:var(--pp-primary-800)] sm:text-base">
                    {a}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* Soft enter when a section loads / scrolls into view */
function Reveal({
  children,
  className = "",
  delay = 0,
  soft = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Opacity-only (no lift) — better for full-bleed media */
  soft?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setOn(true);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    );
    io.observe(el);
    const fallback = window.setTimeout(show, 2400);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={[
        "pp-reveal",
        soft ? "pp-reveal-soft" : "",
        on ? "pp-reveal-in" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ═══ Page ══════════════════════════════════════════════ */
export function Landing() {
  const nav = useNavigate();
  const { signedIn } = useUser();
  const go = (to?: string) => nav(signedIn ? (to ?? "/app") : "/get-started");

  return (
    <div className="min-h-screen bg-[color:var(--pp-page)]">
      <Reveal soft delay={0}>
        <AnnouncementBar onGo={() => go()} />
      </Reveal>
      <Reveal soft delay={60}>
        <SiteHeader />
      </Reveal>
      <main>
        <Reveal soft delay={100}>
          <Hero />
        </Reveal>

        {/* Continuous white shell — lavender only shows in the page margins */}
        <div className={`relative z-20 -mt-10 ${FRAME}`}>
          <div className={`${SURFACE} overflow-hidden ${ISLAND_RADIUS} bg-white`}>
            <Reveal delay={140}>
              <Welcome onStart={() => go()} />
            </Reveal>
            <Reveal delay={220}>
              <BuyAgain go={go} />
            </Reveal>
            <Reveal delay={300}>
              <FeatureCards go={go} />
            </Reveal>
            <Reveal delay={380}>
              <Partners />
            </Reveal>
          </div>
        </div>

        {/* Lower islands — same FRAME + SURFACE as the shell so edges align */}
        <div className={`${FRAME} ${SECTION_GAP_Y}`}>
          <div className={`${SURFACE} flex flex-col ${SECTION_GAP} pb-0`}>
            <Reveal>
              <HowItWorks />
            </Reveal>
            <Reveal>
              <Testimonials />
            </Reveal>
            <Reveal>
              <JoinBand go={go} />
            </Reveal>
            <Reveal>
              <NabpBand />
            </Reveal>
            <Reveal>
              <Faq go={go} />
            </Reveal>
          </div>
        </div>
      </main>

      <Reveal>
        <SiteFooter go={go} variant="full" />
      </Reveal>
    </div>
  );
}

