import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/lib/user";
import { useI18n } from "@/lib/i18n";
import { useDismiss } from "@/lib/useDismiss";
import { LANG_META, type LangCode } from "@/lib/accountPrefs";
import { LogoMark } from "@/components/Logo";
import { FRAME, SURFACE, FOOTER_GAP } from "@/components/layout/Grid";
import { isAlwaysPublicPath, isDualBrowsePath, isFocusedPatientFlow } from "@/lib/marketingPaths";
import { FEATURED_DELIVERY_DISTRICTS, pharmacyDirectoryPath } from "@/lib/nepalCities";

const CDN = "https://static.pocketpills.com/acq-web";
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; };

/* ── 64px tile icons ──────────────────────────────────── */
type TileId = "doctor" | "fill" | "transfer" | "how";
const TILE: Record<TileId, { bg: string; labelKey: "footer.doctorLed" | "footer.fillRx" | "footer.transferRx" | "footer.howItWorks"; to: string }> = {
  doctor: { bg: "#54C7DA", labelKey: "footer.doctorLed", to: "/appointments" },
  fill: { bg: "#4E2A84", labelKey: "footer.fillRx", to: "/fill" },
  transfer: { bg: "#8C60FF", labelKey: "footer.transferRx", to: "/transfer" },
  how: { bg: "#AAA4FF", labelKey: "footer.howItWorks", to: "/how-it-works" },
};

function TileIcon64({ id }: { id: TileId }) {
  const bg = TILE[id].bg;
  const w = { fill: "white", fillRule: "evenodd" as const, clipRule: "evenodd" as const };
  return (
    <svg width="56" height="56" viewBox="0 0 64 65" fill="none" aria-hidden>
      <path d="M0 16.8066C0 7.97008 7.16344 0.806641 16 0.806641H48C56.8366 0.806641 64 7.97008 64 16.8066V48.8066C64 57.6432 56.8366 64.8066 48 64.8066H16C7.16344 64.8066 0 57.6432 0 48.8066V16.8066Z" fill={bg} />
      {id === "doctor" && (
        <g transform="translate(14.7 12.3) scale(0.72)">
          <path fill="white" d="M34.7997 13.1502H40.9604C42.1711 13.1502 43.6711 14.2402 44.0461 15.3502C45.5247 26.5902 46.6068 37.9002 47.9461 49.1702C48.3961 52.6102 45.7604 55.7202 42.1497 56.0002H5.82826C2.14255 55.7902 -0.332452 52.7902 0.0318341 49.3102L3.56755 15.9902C3.68541 14.7102 5.30326 13.1502 6.65326 13.1502H12.964C12.8461 9.67018 13.264 6.24018 15.7283 3.53018C19.7997 -0.939824 26.7961 -1.15982 31.3068 2.85018C34.3711 5.57018 35.0247 9.30018 34.7783 13.1502H34.7997ZM32.0997 13.1502C32.1211 11.7802 32.1211 10.4102 31.8533 9.06018C30.5568 2.62018 22.2211 0.280176 17.7104 5.35018C15.7497 7.55018 15.5783 10.3602 15.5783 13.1502H32.0997ZM12.9747 15.7202H6.95326C6.95326 15.7202 6.63183 15.8902 6.57826 15.9402C6.13898 16.2602 6.08541 16.6302 6.02112 17.1202C5.30326 24.3002 4.58541 31.4802 3.85683 38.6502C3.49255 42.2202 2.84969 46.0402 2.65683 49.5902C2.53898 51.6902 3.55683 53.1202 5.82826 53.2802H42.2354C45.8461 52.7502 45.3747 50.2002 45.1068 47.5202C44.6033 42.4402 43.939 37.3602 43.3926 32.2802C42.8568 27.3402 42.5461 22.1602 41.8068 17.2702C41.7318 16.8002 41.689 16.2402 41.239 15.9502C41.1747 15.9102 40.7568 15.7202 40.7247 15.7202H34.7783V17.9702C36.5247 18.9202 36.5354 21.3102 34.8318 22.3102C32.3033 23.7902 29.6568 20.7102 31.4568 18.5702C31.6711 18.3202 32.164 18.0602 32.164 17.7502V15.7102H15.6426V18.0702C15.6426 18.0702 15.7604 18.0802 15.8247 18.1402C18.7818 20.9102 14.6568 24.2002 12.3854 21.9402C11.1854 20.7402 11.5283 18.8502 12.9533 17.9702V15.7202H12.9747Z" />
          <path fill="white" d="M27.9215 32.1H33.943C34.1573 32.1 34.6501 32.6 34.6501 32.86C34.5108 34.83 34.8537 37.07 34.6501 39.01C34.6287 39.25 34.5751 39.39 34.4251 39.58C34.3394 39.68 33.9644 39.97 33.868 39.97H27.9215C27.943 41.48 27.9001 43 27.9215 44.52C27.9215 44.67 27.9965 44.81 27.9965 44.95C28.018 45.73 28.0823 46.75 27.0644 46.92C25.093 46.78 22.8644 47.1 20.9358 46.92C20.3466 46.87 20.0037 46.5 19.9394 45.94L20.0037 39.97H14.2823C13.8858 39.97 13.3501 39.4 13.3501 39.01C13.543 37.11 13.0608 34.93 13.2751 33.07C13.2966 32.89 13.3608 32.69 13.468 32.54C13.543 32.43 13.9608 32.11 14.0573 32.11H20.0037C19.993 31.5 20.0251 30.89 20.0037 30.28C19.9715 28.97 19.768 27.2 19.9287 25.92C19.993 25.37 20.4644 25.07 21.0108 25.02C22.918 24.86 25.0608 25.15 27.0001 25.02C27.3644 25.01 27.9323 25.54 27.9323 25.84V32.1H27.9215Z" />
        </g>
      )}
      {id === "fill" && (<>
        <path {...w} d="M24.125 23.8066C24.125 23.1853 24.6287 22.6816 25.25 22.6816H30.5165C32.9927 22.6816 35 24.689 35 27.1651C35 29.4543 33.2843 31.3428 31.0687 31.6149L34.991 35.5372L38.517 32.0111C38.9563 31.5718 39.6687 31.5718 40.108 32.0111C40.5473 32.4505 40.5473 33.1628 40.108 33.6021L36.582 37.1282L40.3892 40.9354C40.8286 41.3748 40.8286 42.0871 40.3892 42.5264C39.9499 42.9658 39.2376 42.9658 38.7983 42.5264L34.991 38.7192L31.108 42.6021C30.6687 43.0415 29.9563 43.0415 29.517 42.6021C29.0777 42.1628 29.0777 41.4505 29.517 41.0111L33.4 37.1282L27.9204 31.6486H26.375V36.8566C26.375 37.478 25.8713 37.9816 25.25 37.9816C24.6287 37.9816 24.125 37.478 24.125 36.8566V23.8066ZM26.375 29.3986H30.5165C31.75 29.3986 32.75 28.3986 32.75 27.1651C32.75 25.9316 31.75 24.9316 30.5165 24.9316H26.375V29.3986Z" />
        <path {...w} d="M20.75 16.4941C18.886 16.4941 17.375 18.0052 17.375 19.8691V46.3066C17.375 48.1706 18.886 49.6816 20.75 49.6816H43.25C45.114 49.6816 46.625 48.1706 46.625 46.3066V19.8691C46.625 18.0052 45.114 16.4941 43.25 16.4941H20.75ZM19.625 19.8691C19.625 19.2478 20.1287 18.7441 20.75 18.7441H43.25C43.8713 18.7441 44.375 19.2478 44.375 19.8691V46.3066C44.375 46.928 43.8713 47.4316 43.25 47.4316H20.75C20.1287 47.4316 19.625 46.928 19.625 46.3066V19.8691Z" />
      </>)}
      {id === "transfer" && (<>
        <path {...w} d="M19.0625 15.9316C17.1985 15.9316 15.6875 17.4427 15.6875 19.3066V22.6816C15.6875 24.238 16.741 25.5484 18.1739 25.9384C18.0213 26.3232 17.9375 26.7426 17.9375 27.1816V46.3066C17.9375 48.1706 19.4485 49.6816 21.3125 49.6816H32.5625C34.4265 49.6816 35.9375 48.1706 35.9375 46.3066V41.8066C35.9375 41.1853 35.4338 40.6816 34.8125 40.6816C34.1912 40.6816 33.6875 41.1853 33.6875 41.8066V46.3066C33.6875 46.928 33.1838 47.4316 32.5625 47.4316H21.3125C20.6912 47.4316 20.1875 46.928 20.1875 46.3066V27.1816C20.1875 26.5603 20.6912 26.0566 21.3125 26.0566H32.5625C33.1838 26.0566 33.6875 26.5603 33.6875 27.1816V31.068C33.6875 31.6893 34.1912 32.193 34.8125 32.193C35.4338 32.193 35.9375 31.6893 35.9375 31.068V27.1816C35.9375 26.7426 35.8537 26.3232 35.7011 25.9384C37.134 25.5484 38.1875 24.238 38.1875 22.6816V19.3066C38.1875 17.4427 36.6765 15.9316 34.8125 15.9316H19.0625ZM34.8125 23.8066C35.4338 23.8066 35.9375 23.303 35.9375 22.6816V19.3066C35.9375 18.6853 35.4338 18.1816 34.8125 18.1816H19.0625C18.4412 18.1816 17.9375 18.6853 17.9375 19.3066V22.6816C17.9375 23.303 18.4412 23.8066 19.0625 23.8066H34.8125Z" />
        <path fill="white" d="M40.7254 29.2172C41.1545 28.7678 41.8666 28.7514 42.316 29.1806L49.0895 35.6493C49.3118 35.8616 49.4375 36.1555 49.4375 36.4629C49.4375 36.7702 49.3118 37.0642 49.0895 37.2765L42.316 43.7452C41.8666 44.1743 41.1545 44.158 40.7254 43.7086C40.2963 43.2593 40.3127 42.5472 40.762 42.1181L45.5056 37.5879H28.0625C27.4412 37.5879 26.9375 37.0842 26.9375 36.4629C26.9375 35.8416 27.4412 35.3379 28.0625 35.3379H45.5056L40.762 30.8077C40.3127 30.3786 40.2963 29.6665 40.7254 29.2172Z" />
      </>)}
      {id === "how" && (<>
        <path {...w} d="M16.701 25.3826C14.5997 27.484 14.5997 30.8909 16.701 32.9922L23.3769 39.6681C25.4782 41.7695 28.8852 41.7695 30.9865 39.6681C33.0878 37.5668 33.0878 34.1599 30.9865 32.0585L24.3106 25.3826C22.2093 23.2813 18.8023 23.2813 16.701 25.3826ZM18.292 31.4013C17.0693 30.1786 17.0693 28.1963 18.292 26.9736C19.5146 25.751 21.497 25.751 22.7196 26.9736L25.2621 29.5161L20.8344 33.9437L18.292 31.4013ZM22.4254 35.5347L26.8531 31.1071L29.3955 33.6495C30.6182 34.8722 30.6182 36.8545 29.3955 38.0771C28.1729 39.2998 26.1905 39.2998 24.9679 38.0771L22.4254 35.5347Z" />
        <path {...w} d="M41.6919 30.8721C45.7896 30.8721 49.1115 34.194 49.1115 38.2917C49.1115 42.3895 45.7896 45.7113 41.6919 45.7113C40.0489 45.7113 38.5306 45.1773 37.3012 44.2734L32.5484 49.0262C32.1091 49.4655 31.3968 49.4655 30.9574 49.0262C30.5181 48.5868 30.5181 47.8745 30.9574 47.4351L35.7102 42.6824C34.8062 41.453 34.2722 39.9347 34.2722 38.2917C34.2722 34.194 37.5941 30.8721 41.6919 30.8721ZM46.8615 38.2917C46.8615 35.4366 44.547 33.1221 41.6919 33.1221C38.8367 33.1221 36.5222 35.4366 36.5222 38.2917C36.5222 41.1468 38.8367 43.4613 41.6919 43.4613C44.547 43.4613 46.8615 41.1468 46.8615 38.2917Z" />
        <path {...w} d="M25.8125 18.7441C25.8125 18.1228 26.3162 17.6191 26.9375 17.6191H46.0625C46.6838 17.6191 47.1875 18.1228 47.1875 18.7441C47.1875 24.6467 42.4025 29.4316 36.5 29.4316C30.5975 29.4316 25.8125 24.6467 25.8125 18.7441ZM28.1368 19.8691C28.6869 23.9972 32.2215 27.1816 36.5 27.1816C40.7785 27.1816 44.3132 23.9972 44.8632 19.8691H28.1368Z" />
      </>)}
    </svg>
  );
}

function ArrowRight({ w = 16 }: { w?: number }) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function StoreBadge({ kind }: { kind: "ios" | "android" }) {
  const label = kind === "ios" ? "Download on the App Store" : "Get it on Google Play";
  const href =
    kind === "ios"
      ? "https://apps.apple.com/ca/app/pocketpills-doctor-pharmacy/id1367442074"
      : "https://play.google.com/store/apps/details?id=com.pocketpills&hl=en_CA";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-[172px] items-center gap-3 rounded-lg bg-black px-4 py-2 text-white transition-opacity hover:opacity-85 active:opacity-75"
      aria-label={label}
    >
      {kind === "ios" ? (
        <svg width="24" height="28" viewBox="0 0 24 28" fill="white" aria-hidden><path d="M17.05 14.9c.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.02 2.28-1.27 3.13-2.53.99-1.45 1.4-2.85 1.42-2.92-.03-.01-2.72-1.04-2.72-4.12zM14.5 6.5c.71-.87 1.19-2.07 1.06-3.27-1.02.04-2.26.68-3 1.54-.66.76-1.24 1.98-1.08 3.15 1.14.09 2.3-.58 3.02-1.42z" /></svg>
      ) : (
        <svg width="24" height="26" viewBox="0 0 24 26" aria-hidden>
          <path d="M3 2.2c-.3.32-.48.8-.48 1.44v20.72c0 .64.18 1.12.5 1.42l.07.07 11.6-11.6v-.27L3.07 2.14 3 2.2z" fill="#00A0FF" />
          <path d="M18.6 18.13l-3.9-3.9v-.28l3.9-3.9.09.05 4.6 2.62c1.32.75 1.32 1.97 0 2.72l-4.6 2.62-.09.07z" fill="#FFBD00" />
          <path d="M18.7 18.06l-4-4L3 25.78c.43.46 1.15.52 1.96.06l13.74-7.78z" fill="#FF3A44" />
          <path d="M18.7 10.1L4.96 2.32C4.15 1.86 3.43 1.92 3 2.38l11.7 11.68 4-3.96z" fill="#00F076" />
        </svg>
      )}
      <span className="flex flex-col leading-tight" aria-hidden>
        <span className="text-[9px] opacity-80">{kind === "ios" ? "Download on the" : "GET IT ON"}</span>
        <span className="text-sm font-semibold">{kind === "ios" ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  );
}

const SOCIAL_FILL = "#4E2A84";
const SOCIAL = [
  {
    key: "ig",
    label: "PocketPills on Instagram",
    href: "https://www.instagram.com/pocketpills/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={SOCIAL_FILL} aria-hidden>
        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.3.4.6.2 1 .5 1.5 1 .4.4.7.9 1 1.5.2.4.4 1.1.4 2.3.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.3-.2.6-.5 1-1 1.5-.4.4-.9.7-1.5 1-.4.2-1.1.4-2.3.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.3-.4-.6-.2-1-.5-1.5-1-.4-.4-.7-.9-1-1.5-.2-.4-.4-1.1-.4-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.3.2-.6.5-1 1-1.5.4-.4.9-.7 1.5-1 .4-.2 1.1-.4 2.3-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.2 0-3.5 0-4.8.1-1 .1-1.6.2-1.9.4-.5.2-.8.4-1.1.7-.3.3-.5.6-.7 1.1-.2.4-.3.9-.4 1.9-.1 1.2-.1 1.6-.1 4.8s0 3.5.1 4.8c.1 1 .2 1.6.4 1.9.2.5.4.8.7 1.1.3.3.6.5 1.1.7.4.2.9.3 1.9.4 1.2.1 1.6.1 4.8.1s3.5 0 4.8-.1c1-.1 1.6-.2 1.9-.4.5-.2.8-.4 1.1-.7.3-.3.5-.6.7-1.1.2-.4.3-.9.4-1.9.1-1.2.1-1.6.1-4.8s0-3.5-.1-4.8c-.1-1-.2-1.6-.4-1.9-.2-.5-.4-.8-.7-1.1-.3-.3-.6-.5-1.1-.7-.4-.2-.9-.3-1.9-.4-1.2-.1-1.6-.1-4.8-.1zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm6.4-8.3a1.2 1.2 0 1 1-2.3 0 1.2 1.2 0 0 1 2.3 0z" />
      </svg>
    ),
  },
  {
    key: "fb",
    label: "PocketPills on Facebook",
    href: "https://www.facebook.com/pocketpills",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={SOCIAL_FILL} aria-hidden>
        <path d="M14 8.2h2.5V5H14c-2.4 0-4.4 2-4.4 4.4V12H7v3.5h2.6V22h3.5v-6.5H16L16.7 12h-3.6V9.4c0-.7.5-1.2 1-1.2z" />
      </svg>
    ),
  },
  {
    key: "x",
    label: "PocketPills on X",
    href: "https://x.com/pocketpills",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={SOCIAL_FILL} aria-hidden>
        <path d="M18.9 2H22l-6.8 7.8L23 22h-6.5l-5.1-6.6L5.7 22H2.5l7.3-8.3L1 2h6.6l4.6 6L18.9 2zm-1.1 18h1.8L6.3 3.9H4.4L17.8 20z" />
      </svg>
    ),
  },
  {
    key: "yt",
    label: "PocketPills on YouTube",
    href: "https://www.youtube.com/@pocketpills",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={SOCIAL_FILL} aria-hidden>
        <path d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.6 12 4.6 12 4.6s-7.5 0-9.4.5A3 3 0 0 0 .5 7.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-4.8zM9.8 15.5v-7l6.3 3.5-6.3 3.5z" />
      </svg>
    ),
  },
] as const;

function Social() {
  return (
    <div className="flex items-center gap-3">
      {SOCIAL.map((s) => (
        <a
          key={s.key}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-[color:var(--state-hover)]"
          aria-label={s.label}
        >
          {s.icon}
        </a>
      ))}
    </div>
  );
}

const COLUMNS: { head: string; links: [string, string][]; cta: [string, string] }[] = [
  { head: "Treatment", links: [["Weight loss", "/appointments/treatments/weight-loss"], ["Hair loss", "/appointments/treatments/hair-loss"], ["Find a doctor", "/doctors"], ["Claim your profile", "/doctors/claim"], ["Find a hospital", "/facilities"], ["Claim your facility", "/facilities/claim"]], cta: ["See all treatments", "/appointments"] },
  { head: "Pharmacy", links: [["Find a pharmacy", "/pharmacies"], ["Claim your pharmacy", "/pharmacies/claim"], ["Fill a prescription", "/fill"], ["Transfer a prescription", "/transfer"], ["Pharmacies by region", "/pharmacies/regions"]], cta: ["Get started", "/get-started"] },
  { head: "Medications", links: [["Ozempic", "/drug/ozempic"], ["Browse A–Z", "/drug"], ["Offers", "/offers"]], cta: ["Search prices", "/drug"] },
  { head: "Company", links: [["About", "/about-us"], ["How it works", "/how-it-works"], ["FAQs", "/questions"], ["Help centre", "/questions"]], cta: ["Contact us", "/questions"] },
];

export type FooterVariant = "full" | "compact" | "none";

/** Full marketing footer on public pages; trimmed in-app; hidden inside flows. */
function useFooterVariant(): FooterVariant {
  const { pathname } = useLocation();
  const { signedIn } = useUser();
  if (isFocusedPatientFlow(pathname)) return "none";
  if (pathname === "/login" || pathname === "/get-started") return "none";
  if (pathname === "/" || isAlwaysPublicPath(pathname)) return "full";
  /* Treatment / Pharmacy: full footer only for guests. */
  if (isDualBrowsePath(pathname) && !signedIn) return "full";
  return signedIn ? "compact" : "full";
}

function LanguageSwitcher() {
  const { lang, setLang, short, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("footer.language")}
        className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]"
      >
        {short}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("footer.language")}
          className="absolute bottom-full left-0 z-30 mb-2 min-w-[11rem] overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-float"
        >
          {(Object.keys(LANG_META) as LangCode[]).map((code) => {
            const on = lang === code;
            return (
              <li key={code} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => {
                    setLang(code);
                    setOpen(false);
                  }}
                  className={
                    "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors " +
                    (on
                      ? "bg-[color:var(--state-hover)] font-semibold text-[color:var(--pp-primary-950)]"
                      : "text-ink-secondary hover:bg-[color:var(--state-hover)]")
                  }
                >
                  <span>{LANG_META[code].native}</span>
                  <span className="text-2xs font-medium text-ink-tertiary">{LANG_META[code].short}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Footer is full-bleed white (edge-to-edge), contrasting the lavender body.
 * Inner content uses FRAME + SURFACE so it matches the header pill and page body.
 */
export function SiteFooter({ go: goProp, variant: forced }: { go?: (to?: string) => void; variant?: FooterVariant } = {}) {
  const nav = useNavigate();
  const { t, tx } = useI18n();
  const derived = useFooterVariant();
  const variant = forced ?? derived;
  const go = goProp ?? ((to?: string) => nav(to ?? "/app"));

  if (variant === "none") return null;

  return (
    <footer className={`${FOOTER_GAP} w-full bg-white`}>
      <div className={FRAME}>
      <div className={`${SURFACE} py-10 md:py-12 flex flex-col gap-10 md:gap-12`}>
        {/* Stay in control + Get Started */}
        {variant === "full" && (
          <div className="grid justify-center gap-6 md:gap-12 lg:grid-cols-[minmax(0,50rem)_1fr]">
            <div className="relative flex w-full flex-col gap-16 overflow-hidden rounded-2xl bg-[color:var(--pp-primary-950)] p-6 md:rounded-3xl sm:p-12">
              <span className="pointer-events-none absolute -right-24 -top-32 h-[26rem] w-[26rem] rounded-full bg-[#7C4DFF]/45" aria-hidden />
              <span className="pointer-events-none absolute right-0 top-0 h-full w-[14%] bg-[#6B3FD4]/35" aria-hidden />
              <span className="pointer-events-none absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-[#5B2E9D]/40" aria-hidden />
              <img src={`${CDN}/redesign/home/footer-background.svg`} alt="" aria-hidden loading="lazy" onError={hideOnError}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40" />

              <div className="relative flex justify-between gap-6">
                <div className="flex w-full flex-col gap-6">
                  <LogoMark className="h-11 w-11 text-white" />
                  <h2 className="font-display text-4xl font-medium leading-[1.12] tracking-tight text-white md:text-5xl">
                    {tx("Stay in control of your health.")}
                  </h2>
                </div>
                <div className="hidden shrink-0 flex-col gap-2 sm:flex">
                  <StoreBadge kind="ios" />
                  <StoreBadge kind="android" />
                </div>
              </div>

              <div className="relative flex flex-col justify-between gap-10 rounded-2xl border border-line bg-white p-8 sm:flex-row sm:gap-6 md:p-10">
                <div className="flex flex-col gap-4">
                  <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">{tx("Our Care Team")}</h2>
                  <p className="text-base leading-relaxed text-ink-secondary">
                    {tx("Monday - Saturday")}
                    <br />
                    {tx("9:00 AM - 7:00 PM EST")}
                  </p>
                  <span className="inline-flex w-max items-center gap-2 rounded-full bg-[#FDE8E8] px-3 py-1.5 text-sm font-medium text-[#D9534F]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D9534F]" />
                    {tx("Closed Now")}
                  </span>
                </div>

                <div className="flex flex-col justify-between gap-8">
                  <div className="flex flex-col gap-3">
                    {([
                      ["Email", "care@pocketpills.com"],
                      ["Text", "1-855-950-7225"],
                      ["Fax", "1-855-950-7226"],
                    ] as const).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-8">
                        <p className="mb-0 w-12 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-tertiary">{tx(k)}</p>
                        <span className="text-base text-[color:var(--pp-primary-950)] hover:underline">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => go("/messages")}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-[color:var(--pp-primary-950)] px-6 py-3 text-base font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]">
                    {tx("Get In Touch")} <ArrowRight w={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Get Started tiles — soft fill on white footer */}
            <div className="flex h-full">
              <div className="grid grow grid-cols-2 gap-6 rounded-2xl border border-line bg-[color:var(--primary-200)] p-8 md:rounded-3xl sm:p-12">
                {(Object.keys(TILE) as TileId[]).map((id) => (
                  <button key={id} onClick={() => go(TILE[id].to)}
                    className="flex flex-col items-center justify-center gap-5 rounded-2xl p-4 text-center transition-colors hover:bg-white/70">
                    <TileIcon64 id={id} />
                    <p className="text-base text-[color:var(--pp-primary-950)]">{t(TILE[id].labelKey)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delivery + license — denser, balanced width */}
        <div className="grid items-start gap-8 border-t border-line pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div>
            <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {tx("Pocketpills delivers to:")}
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label={tx("Delivery regions")}>
              {FEATURED_DELIVERY_DISTRICTS.map((name) => (
                <li key={name}>
                  <Link
                    to={pharmacyDirectoryPath(name)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--primary-200)] px-3 py-1.5 text-sm text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--pp-primary-200)] active:bg-[color:var(--state-pressed)]"
                  >
                    <span className="font-medium">{tx(name)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/pharmacies/regions"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-80"
            >
              {tx("More…")} <ArrowRight w={14} />
            </Link>
          </div>

          <aside className="rounded-2xl border border-line bg-[color:var(--primary-200)] p-5 sm:p-6">
            <p className="pp-caps text-ink-tertiary">{tx("Your region")}</p>
            <h3 className="mt-2 font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
              {tx("Pocketpills Nepal")}
            </h3>
            <p className="mt-1 text-sm leading-snug text-ink-secondary">
              {tx("Kathmandu, Bagmati Province, Nepal")}
            </p>
            <p className="mt-4 text-sm leading-snug text-[color:var(--pp-primary-950)]">
              {tx("Licensed by")}{" "}
              <span className="font-medium text-[color:var(--pp-violet)]">
                {tx("Department of Drug Administration")}
              </span>
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-2xs text-ink-tertiary">{tx("Registry")}</dt>
                <dd className="mt-0.5 font-medium text-[color:var(--pp-primary-800)]">{tx("DDA pharmacies")}</dd>
              </div>
              <div>
                <dt className="text-2xs text-ink-tertiary">{tx("Coverage")}</dt>
                <dd className="mt-0.5 font-medium text-[color:var(--pp-primary-800)]">{tx("All districts")}</dd>
              </div>
            </dl>
          </aside>
        </div>

        {/* Link directories — clearer hierarchy, full usable width */}
        <nav aria-label={tx("Footer")} className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-10 sm:grid-cols-4 sm:gap-8">
          {COLUMNS.map((c) => (
            <div key={c.head} className="min-w-0">
              <h3 className="pp-caps text-[color:var(--pp-violet)]">{tx(c.head)}</h3>
              <ul className="mt-4 space-y-2.5">
                {c.links.map(([l, to]) => (
                  <li key={l}>
                    {to.startsWith("#") || to.includes("/#") ? (
                      <a href={to.includes("#") ? to.slice(to.indexOf("#")) : to} className="text-sm text-ink-secondary transition-colors hover:text-[color:var(--pp-primary-950)]">
                        {tx(l)}
                      </a>
                    ) : (
                      <Link to={to} className="text-sm text-ink-secondary transition-colors hover:text-[color:var(--pp-primary-950)]">
                        {tx(l)}
                      </Link>
                    )}
                  </li>
                ))}
                <li className="pt-1">
                  <button
                    type="button"
                    onClick={() => go(c.cta[1])}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-80"
                  >
                    {tx(c.cta[0])} <ArrowRight w={14} />
                  </button>
                </li>
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom bar — social, certs, legal in one compact band */}
        <div className="flex flex-col gap-6 border-t border-line pt-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Social />
              <LanguageSwitcher />
            </div>
            <div className="flex items-center gap-4">
              <p className="pp-caps text-ink-tertiary">{t("footer.certifications")}</p>
              <div className="flex items-center gap-3">
                <img loading="lazy" onError={hideOnError} src={`${CDN}/images/landing/footer/legitScript_logo.png`} width={44} height={44} alt="LegitScript approved" className="h-11 w-11 object-contain" />
                <img loading="lazy" onError={hideOnError} src="https://static.pocketpills.com/webapp/rebrand/landing/logo_soc2.webp" width={44} height={44} alt="SOC 2 certification" className="h-11 w-11 object-contain" />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-line/70 pt-5 text-xs text-ink-tertiary sm:flex-row sm:items-center">
            <p>
              {t("footer.copyright")}
              <span className="mt-1 block text-[11px] sm:mt-0 sm:ml-2 sm:inline">{t("footer.disclaimer")}</span>
            </p>
            <nav className="flex flex-wrap items-center gap-x-1" aria-label={t("footer.legal")}>
              {["Security", "Terms of Use", "Privacy Policy", "Return Policy"].map((l, i, a) => (
                <span key={l} className="flex items-center">
                  <a href="#faq" className="hover:text-[color:var(--pp-violet)]">{tx(l)}</a>
                  {i < a.length - 1 && <span className="px-2.5 text-ink-tertiary/50" aria-hidden>|</span>}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}
