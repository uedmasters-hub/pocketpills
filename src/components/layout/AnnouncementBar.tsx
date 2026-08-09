import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DISMISS_KEY = "pp.announce.dismissed";
const ANNOUNCE_INTERVAL_MS = 8000;
const ANNOUNCE_FADE =
  "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

const TRUST_ITEMS: { id: string; label: string; icon: "shield" | "truck" | "heart" | "star" | "check" }[] = [
  { id: "licensed", label: "Licensed Canadian practitioners", icon: "shield" },
  { id: "shipping", label: "Free and fast shipping", icon: "truck" },
  { id: "trusted", label: "Trusted by over 800,000 Canadians", icon: "heart" },
  { id: "appstore", label: "4.8 on the App Store", icon: "star" },
  { id: "billing", label: "Direct insurance billing", icon: "check" },
  { id: "trustpilot", label: "4.8 on Trustpilot", icon: "star" },
];

function CircleArrow({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.3 12h5.2M12.4 9.4l2.6 2.6-2.6 2.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustIcon({ name }: { name: (typeof TRUST_ITEMS)[number]["icon"] }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.5 2.8 7.8 7 9 4.2-1.2 7-4.5 7-9V6l-7-3Z" />
          <path d="M12 8v5" />
          <path d="M12 16.2h.01" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M3 7h11v10H3z" />
          <path d="M14 10h4l3 3v4h-7V10Z" />
          <circle cx="7" cy="18" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="18" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20Z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="m12 3.2 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.6 7.2 18l.9-5.4L4.2 8.9l5.4-.8L12 3.2Z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.5 2.8 7.8 7 9 4.2-1.2 7-4.5 7-9V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
  }
}

function TrustMarquee() {
  const loop = [...TRUST_ITEMS, ...TRUST_ITEMS];
  return (
    <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <div className="pp-marquee flex w-max items-center gap-8 pr-8" style={{ animationDuration: "36s" }}>
        {loop.map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className="inline-flex shrink-0 items-center gap-2 text-2xs text-white/85 sm:text-xs"
          >
            <span className="text-white">
              <TrustIcon name={item.icon} />
            </span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Sitewide promo / trust bar. Lives above SiteHeader on every chrome layout.
 * Dismiss is session-scoped so it stays gone while browsing.
 */
export function AnnouncementBar({ onGo }: { onGo?: () => void } = {}) {
  const nav = useNavigate();
  const [show, setShow] = useState(() => !readDismissed());
  const [mode, setMode] = useState<"offer" | "trust">("offer");
  const [reduced, setReduced] = useState(false);

  const go =
    onGo ??
    (() => {
      nav("/offers");
    });

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!show || reduced) return;
    const id = window.setInterval(() => {
      setMode((m) => (m === "offer" ? "trust" : "offer"));
    }, ANNOUNCE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [show, reduced]);

  if (!show) return null;

  const isOffer = reduced || mode === "offer";

  const dismiss = () => {
    setShow(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="relative z-50 overflow-hidden bg-[color:var(--pp-navy)] text-white"
      role="region"
      aria-label={isOffer ? "Promotion" : "Why Pocketpills"}
      aria-live="polite"
    >
      <div className="relative mx-auto flex h-10 max-w-[1600px] items-center px-10 sm:h-11 sm:px-12">
        <div
          className={
            "absolute inset-x-10 flex items-center justify-center gap-3 sm:inset-x-12 sm:gap-4 " +
            ANNOUNCE_FADE +
            " " +
            (isOffer ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0")
          }
        >
          <span className="text-2xs text-white/85 sm:text-xs">Ozempic® now at just $139</span>
          <button
            type="button"
            onClick={go}
            className="inline-flex items-center gap-1.5 text-2xs font-semibold text-white transition-opacity duration-200 hover:opacity-80 sm:text-xs"
          >
            View offers <CircleArrow />
          </button>
        </div>

        <div
          className={
            "absolute inset-x-10 flex items-center sm:inset-x-12 " +
            ANNOUNCE_FADE +
            " " +
            (isOffer ? "pointer-events-none -translate-y-1 opacity-0" : "translate-y-0 opacity-100")
          }
        >
          {reduced ? (
            <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-1 py-1">
              {TRUST_ITEMS.slice(0, 3).map((item) => (
                <span key={item.id} className="inline-flex items-center gap-2 text-2xs text-white/85">
                  <span className="text-white">
                    <TrustIcon name={item.icon} />
                  </span>
                  {item.label}
                </span>
              ))}
            </div>
          ) : (
            <TrustMarquee />
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 z-10 text-2xs text-white/55 transition-colors hover:text-white sm:right-5"
          aria-label="Dismiss announcement"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
