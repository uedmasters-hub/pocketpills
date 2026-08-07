import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { entryPoints, treatments, type EntryIconKey } from "@/lib/data";
import { useUser } from "@/lib/user";

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

/** 2×2 entry tiles — centered icon + label on a tinted card. */
function Tiles({ onPick, last }: { onPick: (to: string) => void; last?: { title: string; to: string } }) {
  const items = last ? [...entryPoints.slice(0, 3), { ...entryPoints[3], title: last.title, to: last.to }] : entryPoints;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {items.map((e) => (
        <button
          key={e.title}
          onClick={() => onPick(e.to)}
          style={{ backgroundColor: e.bg }}
          className="flex min-h-[150px] flex-col items-center justify-center gap-5 rounded-[20px] px-3 py-8 text-center transition-transform hover:-translate-y-0.5 sm:min-h-[210px] sm:gap-7"
        >
          <span className="grid h-12 w-12 place-items-center rounded-[14px] shadow-sm sm:h-14 sm:w-14" style={{ backgroundColor: e.tile }}>
            <TileIcon id={e.id} />
          </span>
          <span className="text-[13px] font-medium leading-snug text-[color:var(--pp-headline)] sm:text-[15px]">{e.title}</span>
        </button>
      ))}
    </div>
  );
}

function Avatar({ seed, className = "" }: { seed: string; className?: string }) {
  const hues = ["#A5A0D3", "#7C74BC", "#2DD4BF", "#FDBA74", "#C7C3E5", "#5A51A6"];
  const h = hues[seed.charCodeAt(0) % hues.length];
  return (
    <div className={"relative overflow-hidden " + className} style={{ background: `linear-gradient(150deg, ${h}, #322e6b)` }} aria-hidden>
      <div className="absolute inset-0 grid place-items-end justify-center"><div className="h-1/2 w-1/2 rounded-t-full bg-white/25" /></div>
      <div className="absolute left-1/2 top-[22%] h-[22%] w-[22%] -translate-x-1/2 rounded-full bg-white/35" />
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
    <div className="relative z-50 bg-[color:var(--pp-navy)] text-white">
      <div className="mx-auto flex max-w-[1600px] items-center justify-center gap-4 px-12 py-2.5 text-[11px] sm:text-xs">
        <span className="text-white/80">Ozempic® now at just $139</span>
        <button onClick={onGo} className="inline-flex items-center gap-1.5 font-semibold text-white hover:opacity-80">
          Get started <CircleArrow />
        </button>
        <button onClick={() => setShow(false)} className="absolute right-5 text-white/55 hover:text-white" aria-label="Dismiss">✕</button>
      </div>
    </div>
  );
}

/* ═══ 2. Header (floating glass pill over hero) ══════ */
const MENUS: Record<string, [string, string][]> = {
  Treatment: [["Weight loss", "/get-started"], ["Hair loss treatment", "/get-started"], ["ED treatment", "/get-started"], ["Birth control pills", "/get-started"], ["See all treatments", "/find-care"]],
  "Online Pharmacy": [["Fill a prescription", "/fill"], ["Transfer a prescription", "/transfer"], ["Online drugstore", "/drug"], ["Drug prices", "/drug"]],
  "How it works": [["Our process", "#how"], ["Packaging", "#how"], ["Delivery", "#delivers"]],
  Support: [["FAQs", "#faq"], ["Contact us", "#care"], ["Help centre", "#faq"]],
};

function Header() {
  const { signedIn, displayName } = useUser();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="sticky top-3 z-40 px-5 md:px-8 xl:px-20">
      <div
        className="mx-auto flex h-14 w-full max-w-[105rem] items-center justify-between gap-4 rounded-2xl px-5 backdrop-blur-md sm:px-6"
        style={{ backgroundColor: "var(--pp-nav-glass)" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color:var(--pp-violet)] text-sm font-bold text-white">p</span>
          <span className="font-display text-[17px] font-extrabold tracking-tight text-[color:var(--pp-navy)]">pocketpills</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" onMouseLeave={() => setOpen(null)}>
          {Object.keys(MENUS).map((m) => (
            <div key={m} className="relative" onMouseEnter={() => setOpen(m)}>
              <button className="flex items-center gap-1.5 py-2 text-[13px] font-medium text-[color:var(--pp-nav-ink)] hover:text-[color:var(--pp-navy)]" aria-expanded={open === m}>
                {m}<span className="text-[8px] opacity-60" aria-hidden>▼</span>
              </button>
              {open === m && (
                <div className="absolute left-0 top-full w-56 overflow-hidden rounded-2xl border border-line bg-surface-2 py-1 shadow-float">
                  {MENUS[m].map(([label, to]) =>
                    to.startsWith("#")
                      ? <a key={label} href={to} onClick={() => setOpen(null)} className="block px-4 py-2 text-[13px] text-ink-secondary hover:bg-surface-1 hover:text-ink">{label}</a>
                      : <Link key={label} to={to} onClick={() => setOpen(null)} className="block px-4 py-2 text-[13px] text-ink-secondary hover:bg-surface-1 hover:text-ink">{label}</Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {signedIn ? (
            <Link to="/app" className="inline-flex h-9 items-center rounded-full bg-[color:var(--pp-navy)] px-4 text-[13px] font-semibold text-white">Continue as {displayName}</Link>
          ) : (
            <>
              <Link to="/login" className="hidden items-center gap-1.5 text-[13px] font-medium text-[color:var(--pp-nav-ink)] hover:text-[color:var(--pp-navy)] sm:inline-flex">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-3.8 3.4-5.8 7.5-5.8s7.5 2 7.5 5.8" /></svg>
                Log in
              </Link>
              <Link to="/get-started" className="inline-flex h-9 items-center rounded-full bg-[color:var(--pp-navy)] px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">Join Pocketpills</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ 3. Hero (full-bleed autoplay video) ════════ */
function Hero() {
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) setPlaying(false);
  }, []);

  const cmd = (fn: "playVideo" | "pauseVideo") =>
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: fn, args: [] }), "*");

  const src =
    `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=${reduced ? 0 : 1}&mute=1&loop=1` +
    `&playlist=${VIDEO_ID}&controls=0&modestbranding=1&rel=0&playsinline=1&showinfo=0&iv_load_policy=3&enablejsapi=1&start=54`;

  return (
    <section className="relative -mt-[68px] h-[560px] overflow-hidden bg-[color:var(--pp-lavender)] sm:h-[660px]">
      {/* video fills the entire hero, edge to edge */}
      <iframe
        ref={ref}
        title="How PocketPills works"
        src={src}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="pointer-events-none absolute left-1/2 top-1/2 h-full w-[250%] -translate-x-1/2 -translate-y-1/2 sm:h-[132%] sm:w-full"
      />

      <button
        onClick={() => { cmd(playing ? "pauseVideo" : "playVideo"); setPlaying(!playing); }}
        className="absolute bottom-4 left-1/2 z-20 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full bg-black/25 text-[10px] text-white backdrop-blur hover:bg-black/45 sm:bottom-auto sm:left-auto sm:right-5 sm:top-24"
        aria-label={playing ? "Pause video" : "Play video"}
      >
        {playing ? "❚❚" : "▶"}
      </button>

      {/* corner labels */}
      <div className="absolute inset-x-0 bottom-5 z-10 mx-auto flex w-full max-w-[105rem] flex-wrap items-center justify-between gap-2 px-5 text-[11px] font-medium text-[color:var(--pp-navy)] md:px-8 xl:px-20">
        <span className="flex items-center gap-1.5"><span aria-hidden>🍁</span>Complete care, without leaving home</span>
        <span>Trusted by 800,000+ Canadians · 4.8★ rated</span>
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
    <section className="relative z-20 -mt-16 px-5 md:px-8 xl:px-20">
      <div className="mx-auto w-full max-w-[105rem] rounded-t-[28px] bg-surface-2 px-6 pb-12 pt-9 text-center sm:px-14">
        <p className="text-[15px] font-semibold text-[color:var(--pp-violet)]">Welcome to Pocketpills</p>
        <h1 className="mt-4 font-display text-[38px] font-extrabold leading-[1.05] tracking-tight text-[color:var(--pp-headline)] sm:text-[52px]">
          Your health, handled.
        </h1>
        <button
          onClick={onStart}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--pp-navy)] px-8 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Start <CircleArrow size={16} />
        </button>
        <div className="mt-11 grid grid-cols-2 gap-y-6 border-t border-line pt-7 text-left sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-line">
          {stats.map(([big, small], i) => (
            <div key={small} className={i > 0 ? "lg:pl-6" : ""}>
              <p className="text-[13px] font-bold text-ink">{big}</p>
              <p className="mt-1 text-[11px] leading-snug text-ink-tertiary">{small}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ 5. Buy again + tiles ════════════════════ */
function SectionHeads({ title, onLink }: { title: string; onLink: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
      <p className="text-[17px] font-bold text-[color:var(--pp-primary-950)]">{title}</p>
      <button onClick={onLink} className="inline-flex items-center gap-2 text-[15px] text-[color:var(--pp-primary-950)] hover:opacity-70">
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
    <section className="mx-auto w-full max-w-[105rem] px-5 pt-14 md:px-8 xl:px-20">
      <div className="grid gap-6 lg:grid-cols-[1.06fr_1fr] lg:gap-8">
        {/* promo — grid-cols-2: copy left, pen right */}
        <div>
          <SectionHeads title="Buy again!" onLink={() => go("/messages")} />
          <div
            className="relative overflow-hidden rounded-[24px] transition-shadow duration-300 hover:shadow-float"
            style={{ backgroundImage: "linear-gradient(135deg,#A78BEE 0%,#8A6FE3 45%,#6B4FC7 100%)" }}
          >
            <div className="grid grid-cols-2 overflow-hidden">
              <div className="relative z-10 flex flex-col justify-center gap-8 p-8 sm:p-12">
                <h2 className="font-display text-[clamp(26px,3vw,44px)] font-light leading-[1.14] text-[color:var(--pp-primary-100)]">
                  Ozempic<sup className="align-super text-[0.42em] font-normal">®</sup> now<br />at just $139
                </h2>
                <button
                  onClick={() => go("/drug/ozempic")}
                  className="inline-flex w-max items-center gap-2.5 rounded-full bg-white px-6 py-3 text-[15px] font-medium text-[color:var(--pp-primary-950)] transition-transform hover:scale-[1.02]"
                >
                  Get started <RingArrow />
                </button>
              </div>

              <div className="relative min-h-[280px]">
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

        {/* tiles */}
        <div>
          <SectionHeads title="Doctor-led treatment" onLink={() => go("/find-care")} />
          <Tiles onPick={(to) => go(to)} />
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
      onClick={onClick}
      className={"relative flex aspect-[13/9] min-h-[260px] flex-1 flex-col justify-between overflow-hidden rounded-[20px] p-8 text-left transition-transform hover:-translate-y-0.5 " + bgClass}
    >
      <img src={img} alt={alt} loading="lazy" onError={hideOnError}
        className="absolute inset-0 h-full w-full object-cover object-right" />
      <div className="relative z-10 max-w-xs">
        <p className={"font-display text-[clamp(17px,1.45vw,22px)] font-medium leading-snug " + textClass}>{children}</p>
      </div>
      <div className="relative z-10 flex items-center gap-3">
        <p className={"text-[15px] font-medium " + textClass}>{cta}</p>
        <ArrowCircle circleFill={circleFill} arrowFill={arrowFill} />
      </div>
    </button>
  );
}

function FeatureCards({ go }: { go: (to?: string) => void }) {
  return (
    <section className="mx-auto w-full max-w-[105rem] px-5 pt-12 md:px-8 xl:px-20">
      <div className="flex flex-col gap-5 md:flex-row md:justify-between">
        <FeatureCard
          onClick={() => go("/drug/ozempic")}
          bgClass="bg-[color:var(--pp-primary-100)]"
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
          textClass="text-[color:var(--pp-primary-100)]"
          cta="Learn more"
          circleFill="#F5F4FA"
          arrowFill="#4E2A84"
        >
          Get a Sildenafil prescription.
        </FeatureCard>

        <FeatureCard
          onClick={() => go("/find-care")}
          bgClass="bg-[#E5E4F6]"
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
    return <span className="flex h-9 shrink-0 items-center whitespace-nowrap font-display text-base font-bold text-ink-tertiary/70">{name}</span>;
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
    <section className="overflow-hidden pb-16 pt-14">
      <div className="flex flex-col items-center">
        <h2 className="text-[15px] text-[color:var(--pp-primary-950)]">Proud pharmacy of:</h2>
        <div className="mt-7 w-full">
          <div className="w-full overflow-hidden">
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

/* ═══ 8. Testimonials carousel ══════════════════════════ */
function Testimonials() {
  const box = useRef<HTMLDivElement>(null);
  const reviews = [
    { n: "Angie A.", t: "I haven't had a family doctor in 3 years—Pocketpills makes it possible to still get my meds." },
    { n: "Kim O.", t: "Moved provinces with no doctor—Pocketpills set me up with telehealth and renewed my meds without delay. Love them!" },
    { n: "Christine P.", t: "Getting a doctor is hard. Pocketpills ships fast, connects me with telehealth, and goes above and beyond. So grateful!" },
    { n: "Ellie B.", t: "Managing prescriptions is so easy with Pocketpills. Simple refills, med reminders, and fast delivery. Highly recommend!" },
    { n: "Briar L.", t: "The pharmacists are knowledgeable and friendly. Telehealth team too. 10/10 recommend." },
    { n: "Kevin E.", t: "They handle all my refills and deal with my insurance directly. Makes life so easy." },
  ];
  const scroll = (d: number) => box.current?.scrollBy({ left: d * 280, behavior: "smooth" });
  return (
    <section id="reviews" className="mx-auto w-full max-w-[105rem] px-5 py-10 md:px-8 xl:px-20">
      <h2 className="text-center font-display text-3xl font-extrabold text-[color:var(--pp-headline)]">Our members love us</h2>
      <p className="mt-2 text-center text-sm text-ink-secondary">See why thousands across Canada choose Pocketpills.</p>

      <div className="relative mt-8">
        <button onClick={() => scroll(-1)} aria-label="Previous" className="absolute -left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface-2 text-ink-secondary shadow-card hover:text-ink">‹</button>
        <button onClick={() => scroll(1)} aria-label="Next" className="absolute -right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface-2 text-ink-secondary shadow-card hover:text-ink">›</button>
        <div ref={box} className="pp-scroll flex gap-4 overflow-x-auto px-1 pb-2">
          {reviews.map((r) => (
            <div key={r.n} className="pp-snap w-[250px] shrink-0 rounded-2xl border border-line bg-surface-2 p-5">
              <span className="text-xs tracking-widest text-[color:var(--pp-violet-mid)]" aria-label="5 out of 5">★★★★★</span>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-secondary">{r.t}</p>
              <p className="mt-4 text-sm font-bold text-ink">{r.n}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold text-ink">
          4.9 ★ <span className="text-ink-tertiary">Google</span>
        </span>
      </div>
    </section>
  );
}

/* ═══ 9. Join band + member strip ═══════════════════════ */
function JoinBand({ go }: { go: (to?: string) => void }) {
  const members = [
    { n: "Adeline K.", t: "Right on track with my delivery. Love the reminders.", card: true },
    { n: "Kevin E.", t: "They handle my refills and deal with my insurance. So easy.", card: false },
    { n: "Karen L.", t: "The best team of professionals—knowledgeable and always ready to help.", card: true },
    { n: "Bob T.", t: "They make sure I never miss my medication.", card: false },
    { n: "Priya S.", t: "Refills arrive before I run out. I never think about it.", card: true },
  ];
  return (
    <section className="py-10">
      <div className="mx-auto w-full max-w-[105rem] px-5 text-center md:px-8 xl:px-20">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-snug text-[color:var(--pp-headline)] sm:text-4xl">
          Join <span className="text-[color:var(--pp-violet)]">800,000+</span> Canadians<br />who never miss a dose.
        </h2>
        <button onClick={() => go()} className="mt-6 rounded-full bg-[color:var(--pp-navy)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90">Join Pocketpills</button>
      </div>

      <div className="pp-scroll mt-10 flex gap-3 overflow-x-auto px-5 pb-2 sm:px-8">
        {members.map((m, i) => (
          <div key={m.n} className={"pp-snap h-52 w-64 shrink-0 overflow-hidden rounded-2xl " + (m.card ? "bg-[color:var(--pp-violet-mid)] p-5 text-white" : "relative")}>
            {m.card ? (
              <>
                <p className="font-display text-lg font-bold">{m.n}</p>
                <span className="mt-1 block text-[10px] tracking-widest text-white/70">★★★★★</span>
                <p className="mt-3 text-[12px] leading-relaxed text-white/85">{m.t}</p>
              </>
            ) : (
              <>
                <Avatar seed={m.n + i} className="absolute inset-0" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="font-display text-base font-bold text-white">{m.n}</p>
                  <p className="text-[11px] text-white/80">{m.t}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[11px] font-semibold text-ink">
          <span className="uppercase tracking-wide text-ink-tertiary">Excellent</span> 4.8 out of 5 <span className="text-wellness">★ Trustpilot</span>
        </span>
      </div>
    </section>
  );
}

/* ═══ 10. NABP band ═════════════════════════════════════ */
function NabpBand() {
  return (
    <section className="mx-auto w-full max-w-[105rem] px-5 py-10 md:px-8 xl:px-20">
      <div className="flex flex-col gap-6 rounded-2xl bg-[color:var(--pp-green)] p-8 text-white sm:flex-row sm:items-center sm:p-10">
        <div className="shrink-0 text-center">
          <p className="text-[8px] uppercase tracking-[0.2em] text-white/60">Accredited by</p>
          <div className="mx-auto mt-1 grid h-12 w-12 place-items-center rounded-full border-2 border-white/40"><span className="font-display text-sm font-extrabold">◈</span></div>
          <p className="mt-1 font-display text-lg font-extrabold leading-none">NABP</p>
          <p className="text-[7px] text-white/50">Healthcare Merchant</p>
        </div>
        <div className="hidden w-px self-stretch bg-white/20 sm:block" />
        <div>
          <h3 className="font-display text-2xl font-bold">Putting you first, every time.</h3>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/75">
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
    ["What is Pocketpills?", "An online healthcare platform: consult a licensed provider, get prescriptions, and have medication delivered—free, all in one place."],
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
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="mx-auto w-full max-w-[105rem] px-5 py-10 md:px-8 xl:px-20">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div>
          <p className="text-sm font-semibold text-primary">Frequently Asked</p>
          <h2 className="mt-1.5 font-display text-2xl font-extrabold leading-snug text-[color:var(--pp-headline)]">Your questions, answered.</h2>
          <button onClick={() => go()} className="mt-4 rounded-full bg-[color:var(--pp-navy)] px-4 py-2 text-xs font-semibold text-white">More FAQs</button>
        </div>
        <div className="space-y-2">
          {faqs.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} className="overflow-hidden rounded-xl bg-surface-1">
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left" aria-expanded={isOpen}>
                  <span className="text-[13px] font-medium text-ink">{q}</span>
                  <span className={"shrink-0 text-ink-tertiary transition-transform " + (isOpen ? "rotate-45" : "")}>＋</span>
                </button>
                {isOpen && <p className="px-5 pb-4 text-[13px] leading-relaxed text-ink-secondary">{a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══ 12. App card + Care team + tiles ══════════════════ */
function AppAndCare({ go }: { go: (to?: string) => void }) {
  return (
    <section id="care" className="mx-auto w-full max-w-[105rem] px-5 py-10 md:px-8 xl:px-20">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl p-7 text-white"
          style={{ backgroundImage: "radial-gradient(360px 240px at 88% 12%, rgba(167,160,211,.5), transparent 62%), linear-gradient(140deg,#5b52ad,#2b2560)" }}>
          <div className="flex items-start justify-between gap-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-sm font-bold">p</span>
            <div className="flex flex-col gap-1.5">
              {[["", "App Store"], ["▶", "Google Play"]].map(([g, n]) => (
                <span key={n} className="inline-flex items-center gap-2 rounded-lg bg-black/45 px-3 py-1.5 text-[10px] font-semibold">
                  <span aria-hidden>{g || "🍎"}</span>
                  <span><span className="block text-[7px] font-normal text-white/60">Download on the</span>{n}</span>
                </span>
              ))}
            </div>
          </div>
          <h3 className="mt-8 font-display text-2xl font-bold leading-snug">Stay in control<br />of your health.</h3>

          <div className="mt-6 rounded-xl bg-white p-5 text-stone-900">
            <div className="flex items-start justify-between gap-4">
              <p className="font-display text-base font-bold">Our Care Team</p>
              <div className="space-y-0.5 text-right text-[10px] text-stone-500">
                <p><span className="mr-2 text-stone-400">EMAIL</span>care@pocketpills.com</p>
                <p><span className="mr-2 text-stone-400">TEXT</span>1-855-950-7226</p>
                <p><span className="mr-2 text-stone-400">FAX</span>1-855-950-7226</p>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-stone-500">Monday – Saturday<br />9:00 AM – 7:00 PM EST</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-danger"><span className="h-1.5 w-1.5 rounded-full bg-danger" />Closed Now</span>
              <button onClick={() => go("/messages")} className="rounded-full border border-stone-300 px-4 py-1.5 text-[11px] font-semibold">Get In Touch ›</button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#EAE6FB] p-6">
          <Tiles onPick={(to) => go(to)} last={{ title: "How it works", to: "/find-care" }} />
        </div>
      </div>
    </section>
  );
}

/* ═══ 13. Delivers to ═══════════════════════════════════ */
function DeliversTo() {
  const left = ["Alberta (AB)", "Manitoba (MB)", "New Brunswick (NB)", "Northwest Territories (NT)", "Ontario (ON)", "Quebec (QC)", "Yukon (YT)"];
  const right = ["British Columbia (BC)", "Newfoundland & Labrador (NL)", "Nova Scotia (NS)", "Nunavut (NU)", "Prince Edward Island (PE)", "Saskatchewan (SK)"];
  return (
    <section id="delivers" className="mx-auto w-full max-w-[105rem] px-5 py-10 md:px-8 xl:px-20">
      <div className="grid gap-8 rounded-2xl bg-surface-1 p-8 lg:grid-cols-2">
        <div>
          <p className="font-display text-lg font-bold text-ink">Pocketpills delivers to:</p>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] text-ink-secondary">
            <div className="space-y-2">{left.map((p) => <p key={p}>{p}</p>)}</div>
            <div className="space-y-2">{right.map((p) => <p key={p}>{p}</p>)}</div>
          </div>
        </div>
        <div className="rounded-xl bg-surface-2 p-6">
          <p className="text-[10px] uppercase tracking-widest text-ink-tertiary">Your region</p>
          <p className="mt-1 font-display text-lg font-bold text-ink">Pocketpills East</p>
          <p className="mt-2 text-[11px] text-ink-secondary">UNIT 6 · 4375 DIXIE RD, MISSISSAUGA, ON, L4T 2E7</p>
          <p className="mt-3 text-[11px] text-ink-secondary">Pocketpills is licensed by <span className="text-primary underline">Ontario College of Pharmacists</span></p>
          <div className="mt-3 flex justify-between text-[11px] text-ink-tertiary">
            <span>Pharmacy License No.<br />#3072З4</span>
            <span className="text-right">Pharmacy Manager<br />Aisha Abo Saeda</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══ 14–15. Footer ═════════════════════════════════════ */
function Footer() {
  const cols: [string, string[]][] = [
    ["TREATMENT", ["Treatment", "Weight loss", "Hair loss treatment", "ED treatment", "Birth control pills", "See all treatments →"]],
    ["PHARMACY", ["Online pharmacy", "Transfer a prescription", "Online drugstore", "Drug prices", "Get online prescription →"]],
    ["MEDICATIONS", ["Ozempic", "Wegovy", "Modafinil", "Mounjaro", "Finasteride", "Buy drugs online →"]],
    ["COMPANY", ["About Us", "Contact Pocketpills", "Help Center", "FAQs", "Accessibility", "Join Pocketpills →"]],
  ];
  return (
    <footer className="bg-surface-1">
      <div className="mx-auto w-full max-w-[105rem] px-5 py-12 md:px-8 xl:px-20">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {cols.map(([title, links]) => (
            <div key={title}>
              <p className="text-[10px] font-bold tracking-widest text-ink-tertiary">{title}</p>
              <ul className="mt-3 space-y-2 text-[12px] text-ink-secondary">
                {links.map((l) => <li key={l}><Link to="/get-started" className="hover:text-ink">{l}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <div className="flex items-center gap-3">
            {["◎", "in", "𝕏", "f"].map((i) => (
              <span key={i} className="grid h-7 w-7 place-items-center rounded-md text-ink-tertiary hover:text-ink" aria-hidden>{i}</span>
            ))}
            <span className="ml-1 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-ink-secondary">EN ▾</span>
            <span className="ml-2 text-[11px] text-ink-tertiary">Pocketpills is not a pharmacy or a drug manufacturer</span>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-ink-tertiary">Certifications</p>
            <div className="mt-1.5 flex gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--pp-green)] text-[7px] font-bold text-white">NABP</span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2b5aa8] text-[7px] font-bold text-white">SOC2</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[105rem] flex-col justify-between gap-2 px-5 py-4 text-[11px] text-ink-tertiary sm:flex-row sm:px-8">
          <span>©2026 Pocketpills · Conceptual redesign, not affiliated with Pocketpills Inc.</span>
          <span className="flex gap-4"><a href="#faq">Security</a><a href="#faq">Terms of Use</a><a href="#faq">Privacy Policy</a><a href="#faq">Return Policy</a></span>
        </div>
      </div>
    </footer>
  );
}

/* ═══ Page ══════════════════════════════════════════════ */
export function Landing() {
  const nav = useNavigate();
  const { signedIn } = useUser();
  const go = (to?: string) => nav(signedIn ? (to ?? "/app") : "/get-started");

  return (
    <div className="min-h-screen bg-surface-2">
      <AnnouncementBar onGo={() => go()} />
      <Header />
      <Hero />
      <Welcome onStart={() => go()} />
      <BuyAgain go={go} />
      <FeatureCards go={go} />
      <Partners />
      <Testimonials />
      <JoinBand go={go} />
      <NabpBand />
      <Faq go={go} />
      <AppAndCare go={go} />
      <DeliversTo />
      <section className="mx-auto w-full max-w-[105rem] px-5 pb-6 md:px-8 xl:px-20">
        <div className="grid gap-3 sm:grid-cols-3">
          {treatments.slice(0, 3).map((t) => (
            <button key={t.slug} onClick={() => go(`/treatment/${t.slug}`)} className="flex items-center gap-3 rounded-xl bg-surface-1 p-4 text-left hover:bg-surface-2">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-subtle text-lg">{t.emoji}</span>
              <span><span className="block text-sm font-semibold text-ink">{t.name}</span><span className="block text-[11px] text-ink-tertiary">{t.category}</span></span>
            </button>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
