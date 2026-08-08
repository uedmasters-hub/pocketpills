import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/lib/user";
import { LogoMark } from "@/components/Logo";

const CDN = "https://static.pocketpills.com/acq-web";
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; };

/* ── 64px tile icons ──────────────────────────────────── */
type TileId = "doctor" | "fill" | "transfer" | "how";
const TILE: Record<TileId, { bg: string; label: string; to: string }> = {
  doctor: { bg: "#54C7DA", label: "Doctor-led treatment", to: "/find-care" },
  fill: { bg: "#4E2A84", label: "Fill your prescription", to: "/fill" },
  transfer: { bg: "#8C60FF", label: "Transfer a prescription", to: "/transfer" },
  how: { bg: "#AAA4FF", label: "How it works", to: "/drug" },
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
  return (
    <a href="#" className="inline-flex w-[172px] items-center gap-3 rounded-lg bg-black px-4 py-2 text-white transition-transform">
      {kind === "ios" ? (
        <svg width="24" height="28" viewBox="0 0 24 28" fill="white" aria-hidden><path d="M17.05 14.9c.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.02 2.28-1.27 3.13-2.53.99-1.45 1.4-2.85 1.42-2.92-.03-.01-2.72-1.04-2.72-4.12zM14.5 6.5c.71-.87 1.19-2.07 1.06-3.27-1.02.04-2.26.68-3 1.54-.66.76-1.24 1.98-1.08 3.15 1.14.09 2.3-.58 3.02-1.42z" /></svg>
      ) : (
        <svg width="24" height="26" viewBox="0 0 26 28" aria-hidden>
          <path d="M3 2.2c-.3.32-.48.8-.48 1.44v20.72c0 .64.18 1.12.5 1.42l.07.07 11.6-11.6v-.27L3.07 2.14 3 2.2z" fill="#00A0FF" />
          <path d="M18.6 18.13l-3.9-3.9v-.28l3.9-3.9.09.05 4.6 2.62c1.32.75 1.32 1.97 0 2.72l-4.6 2.62-.09.07z" fill="#FFBD00" />
          <path d="M18.7 18.06l-4-4L3 25.78c.43.46 1.15.52 1.96.06l13.74-7.78z" fill="#FF3A44" />
          <path d="M18.7 10.1L4.96 2.32C4.15 1.86 3.43 1.92 3 2.38l11.7 11.68 4-3.96z" fill="#00F076" />
        </svg>
      )}
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-medium tracking-wide">{kind === "ios" ? "Download on the" : "GET IT ON"}</span>
        <span className="block text-[17px] font-semibold leading-tight">{kind === "ios" ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  );
}

/* ── Social icons ─────────────────────────────────────── */
const SOCIAL_FILL = "#4E2A84";
function Social() {
  return (
    <div className="flex items-center gap-3">
      <a href="#" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 25" fill="none"><path d="M12 2.96758C15.2063 2.96758 15.5859 2.98164 16.8469 3.03789C18.0187 3.08945 18.6516 3.28633 19.0734 3.45039C19.6313 3.66602 20.0344 3.92852 20.4516 4.3457C20.8734 4.76758 21.1313 5.16602 21.3469 5.72383C21.5109 6.1457 21.7078 6.7832 21.7594 7.95039C21.8156 9.21601 21.8297 9.5957 21.8297 12.7973C21.8297 16.0035 21.8156 16.3832 21.7594 17.6441C21.7078 18.816 21.5109 19.4488 21.3469 19.8707C21.1313 20.4285 20.8687 20.8316 20.4516 21.2488C20.0297 21.6707 19.6313 21.9285 19.0734 22.1441C18.6516 22.3082 18.0141 22.5051 16.8469 22.5566C15.5813 22.6129 15.2016 22.627 12 22.627C8.79375 22.627 8.41406 22.6129 7.15313 22.5566C5.98125 22.5051 5.34844 22.3082 4.92656 22.1441C4.36875 21.9285 3.96562 21.666 3.54844 21.2488C3.12656 20.827 2.86875 20.4285 2.65312 19.8707C2.48906 19.4488 2.29219 18.8113 2.24062 17.6441C2.18438 16.3785 2.17031 15.9988 2.17031 12.7973C2.17031 9.59101 2.18438 9.21133 2.24062 7.95039C2.29219 6.77851 2.48906 6.1457 2.65312 5.72383C2.86875 5.16602 3.13125 4.76289 3.54844 4.3457C3.97031 3.92383 4.36875 3.66602 4.92656 3.45039C5.34844 3.28633 5.98594 3.08945 7.15313 3.03789C8.41406 2.98164 8.79375 2.96758 12 2.96758ZM12 0.806641C8.74219 0.806641 8.33438 0.820703 7.05469 0.876953C5.77969 0.933203 4.90312 1.13945 4.14375 1.43477C3.35156 1.74414 2.68125 2.15195 2.01562 2.82227C1.34531 3.48789 0.9375 4.1582 0.628125 4.9457C0.332812 5.70977 0.126563 6.58164 0.0703125 7.85664C0.0140625 9.14102 0 9.54883 0 12.8066C0 16.0645 0.0140625 16.4723 0.0703125 17.752C0.126563 19.027 0.332812 19.9035 0.628125 20.6629C0.9375 21.4551 1.34531 22.1254 2.01562 22.791C2.68125 23.4566 3.35156 23.8691 4.13906 24.1738C4.90313 24.4691 5.775 24.6754 7.05 24.7316C8.32969 24.7879 8.7375 24.802 11.9953 24.802C15.2531 24.802 15.6609 24.7879 16.9406 24.7316C18.2156 24.6754 19.0922 24.4691 19.8516 24.1738C20.6391 23.8691 21.3094 23.4566 21.975 22.791C22.6406 22.1254 23.0531 21.4551 23.3578 20.6676C23.6531 19.9035 23.8594 19.0316 23.9156 17.7566C23.9719 16.477 23.9859 16.0691 23.9859 12.8113C23.9859 9.55352 23.9719 9.1457 23.9156 7.86602C23.8594 6.59102 23.6531 5.71445 23.3578 4.95508C23.0625 4.1582 22.6547 3.48789 21.9844 2.82227C21.3188 2.15664 20.6484 1.74414 19.8609 1.43945C19.0969 1.14414 18.225 0.937891 16.95 0.881641C15.6656 0.820703 15.2578 0.806641 12 0.806641Z" fill={SOCIAL_FILL} /><path d="M12 6.64258C8.59687 6.64258 5.83594 9.40351 5.83594 12.8066C5.83594 16.2098 8.59687 18.9707 12 18.9707C15.4031 18.9707 18.1641 16.2098 18.1641 12.8066C18.1641 9.40351 15.4031 6.64258 12 6.64258ZM12 16.8051C9.79219 16.8051 8.00156 15.0145 8.00156 12.8066C8.00156 10.5988 9.79219 8.8082 12 8.8082C14.2078 8.8082 15.9984 10.5988 15.9984 12.8066C15.9984 15.0145 14.2078 16.8051 12 16.8051Z" fill={SOCIAL_FILL} /><path d="M19.8469 6.39878C19.8469 7.19566 19.2 7.83785 18.4078 7.83785C17.6109 7.83785 16.9687 7.19097 16.9687 6.39878C16.9687 5.60191 17.6156 4.95972 18.4078 4.95972C19.2 4.95972 19.8469 5.6066 19.8469 6.39878Z" fill={SOCIAL_FILL} /></svg></a>
      <a href="#" aria-label="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 25" fill="none"><path d="M22.2234 0.806641H1.77187C0.792187 0.806641 0 1.58008 0 2.53633V23.0723C0 24.0285 0.792187 24.8066 1.77187 24.8066H22.2234C23.2031 24.8066 24 24.0285 24 23.077V2.53633C24 1.58008 23.2031 0.806641 22.2234 0.806641ZM7.12031 21.2582H3.55781V9.80195H7.12031V21.2582ZM5.33906 8.24102C4.19531 8.24102 3.27187 7.31758 3.27187 6.17851C3.27187 5.03945 4.19531 4.11602 5.33906 4.11602C6.47812 4.11602 7.40156 5.03945 7.40156 6.17851C7.40156 7.31289 6.47812 8.24102 5.33906 8.24102ZM20.4516 21.2582H16.8937V15.6895C16.8937 14.3629 16.8703 12.652 15.0422 12.652C13.1906 12.652 12.9094 14.1004 12.9094 15.5957V21.2582H9.35625V9.80195H12.7687V11.3676H12.8156C13.2891 10.4676 14.4516 9.51602 16.1812 9.51602C19.7859 9.51602 20.4516 11.8879 20.4516 14.9723V21.2582Z" fill={SOCIAL_FILL} /></svg></a>
      <a href="#" aria-label="X"><svg width="17" height="17" viewBox="0 0 22 21" fill="none"><path d="M17.3263 0.710938H20.6998L13.3297 9.13443L22 20.5969H15.2112L9.89403 13.645L3.80995 20.5969H0.434432L8.31743 11.587L0 0.710938H6.96111L11.7674 7.06527L17.3263 0.710938ZM16.1423 18.5777H18.0116L5.94539 2.62407H3.93946L16.1423 18.5777Z" fill={SOCIAL_FILL} /></svg></a>
      <a href="#" aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 25" fill="none"><path d="M12 0.806641C5.37264 0.806641 0 6.17928 0 12.8066C0 18.4342 3.87456 23.1564 9.10128 24.4534V16.4738H6.62688V12.8066H9.10128V11.2265C9.10128 7.14216 10.9498 5.24904 14.9597 5.24904C15.72 5.24904 17.0318 5.39832 17.5685 5.54712V8.87112C17.2853 8.84136 16.7933 8.82648 16.1822 8.82648C14.2147 8.82648 13.4544 9.57192 13.4544 11.5097V12.8066H17.3741L16.7006 16.4738H13.4544V24.7188C19.3963 24.0012 24.0005 18.942 24.0005 12.8066C24 6.17928 18.6274 0.806641 12 0.806641Z" fill={SOCIAL_FILL} /></svg></a>
    </div>
  );
}

/* ── Footer ───────────────────────────────────────────── */
const PROVINCES = [
  "Alberta (AB)", "British Columbia (BC)", "Manitoba (MB)", "Newfoundland & Labrador (NL)",
  "New Brunswick (NB)", "Nova Scotia (NS)", "Northwest Territories (NT)", "Nunavut (NU)",
  "Ontario (ON)", "Prince Edward Island (PE)", "Quebec (QC)", "Saskatchewan (SK)", "Yukon (YT)",
];

const COLUMNS: { head: string; links: [string, string][]; cta: [string, string] }[] = [
  { head: "Treatment", links: [["Treatment", "/find-care"], ["Weight loss", "/find-care"], ["Hair loss treatment", "/find-care"], ["ED treatment", "/find-care"], ["Birth control pills", "/treatment/birth-control"]], cta: ["See all treatments", "/find-care"] },
  { head: "Pharmacy", links: [["Online pharmacy", "/pharmacy"], ["Transfer a prescription", "/transfer"], ["Online drugstore", "/drug"], ["Drug prices", "/drug"]], cta: ["Get online prescription", "/find-care"] },
  { head: "Medications", links: [["Ozempic", "/drug/ozempic"], ["Wegovy", "/drug/wegovy"], ["Modafinil", "/drug/modafinil"], ["Mounjaro", "/drug/mounjaro"], ["Finasteride", "/drug/finasteride"]], cta: ["Buy drugs online", "/drug"] },
  { head: "Company", links: [["About Us", "/find-care"], ["Contact Pocketpills", "/messages"], ["Help Center", "/drug"], ["FAQs", "#faq"], ["Accessibility", "/drug"]], cta: ["Join Pocketpills", "/get-started"] },
];

export type FooterVariant = "full" | "compact" | "none";

/** Full marketing footer on public pages; trimmed in-app; hidden inside flows. */
function useFooterVariant(): FooterVariant {
  const { pathname } = useLocation();
  const { signedIn } = useUser();
  if (pathname.startsWith("/care/") || pathname === "/fill" || pathname === "/transfer") return "none";
  if (pathname === "/login" || pathname === "/get-started") return "none";
  // The landing page is marketing: it always shows the full footer, signed in or not.
  if (pathname === "/") return "full";
  return signedIn ? "compact" : "full";
}

export function SiteFooter({ go: goProp, variant: forced }: { go?: (to?: string) => void; variant?: FooterVariant } = {}) {
  const nav = useNavigate();
  const derived = useFooterVariant();
  const variant = forced ?? derived;
  const go = goProp ?? ((to?: string) => nav(to ?? "/app"));

  if (variant === "none") return null;

  return (
    <section className="mx-auto flex w-full max-w-[105rem] flex-col gap-6 px-5 pb-12 md:px-8 xl:px-20">
      {/* Stay in control + Get Started — conversion block, public pages only */}
      {variant === "full" && (<>
      <div className="grid justify-center gap-6 md:gap-12 lg:grid-cols-[minmax(0,50rem)_1fr]">
        <div className="relative flex w-full flex-col gap-16 overflow-hidden rounded-2xl bg-[color:var(--pp-primary-950)] p-6 md:rounded-3xl sm:p-12">
          {/* decorative shapes */}
          <span className="pointer-events-none absolute -right-24 -top-32 h-[26rem] w-[26rem] rounded-full bg-[#7C4DFF]/45" aria-hidden />
          <span className="pointer-events-none absolute right-0 top-0 h-full w-[14%] bg-[#6B3FD4]/35" aria-hidden />
          <span className="pointer-events-none absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-[#5B2E9D]/40" aria-hidden />
          <img src={`${CDN}/redesign/home/footer-background.svg`} alt="" aria-hidden loading="lazy" onError={hideOnError}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40" />

          <div className="relative flex justify-between gap-6">
            <div className="flex w-full flex-col gap-6">
              <LogoMark className="h-11 w-11 text-white" />
              <h2 className="font-display text-[clamp(30px,3.6vw,46px)] font-medium leading-[1.12] tracking-tight text-white">
                Stay in control<br />of your health.
              </h2>
            </div>
            <div className="hidden shrink-0 flex-col gap-2 sm:flex">
              <StoreBadge kind="ios" />
              <StoreBadge kind="android" />
            </div>
          </div>

          {/* Care Team */}
          <div className="relative flex flex-col justify-between gap-10 rounded-2xl bg-white p-8 sm:flex-row sm:gap-6 md:p-10">
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-[26px] font-medium text-[color:var(--pp-primary-950)]">Our Care Team</h2>
              <p className="text-[15px] leading-relaxed text-ink-secondary">Monday - Saturday<br />9:00 AM - 7:00 PM EST</p>
              <span className="inline-flex w-max items-center gap-2 rounded-full bg-[#FDE8E8] px-3 py-1.5 text-[13px] font-medium text-[#D9534F]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D9534F]" />Closed Now
              </span>
            </div>

            <div className="flex flex-col justify-between gap-8">
              <div className="flex flex-col gap-3">
                {[["EMAIL", "care@pocketpills.com"], ["TEXT", "1-855-950-7225"], ["FAX", "1-855-950-7226"]].map(([k, v]) => (
                  <div key={k} className="flex items-center gap-8">
                    <p className="mb-0 w-12 text-[11px] font-semibold tracking-[0.1em] text-ink-tertiary">{k}</p>
                    <span className="text-[15px] text-[color:var(--pp-primary-950)] hover:underline">{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => go("/messages")}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-[color:var(--pp-primary-950)] px-6 py-3 text-[15px] font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--pp-primary-100)]">
                Get In Touch <ArrowRight w={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Get Started tiles */}
        <div className="flex h-full">
          <div className="grid grow grid-cols-2 gap-6 rounded-2xl bg-[color:var(--pp-primary-100)] p-8 md:rounded-3xl sm:p-12">
            {(Object.keys(TILE) as TileId[]).map((id) => (
              <button key={id} onClick={() => go(TILE[id].to)}
                className="flex flex-col items-center justify-center gap-5 rounded-2xl p-4 text-center transition-transform">
                <TileIcon64 id={id} />
                <p className="text-[15px] text-[color:var(--pp-primary-950)]">{TILE[id].label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      </>)}

      {/* Delivers to + links + legal */}
      <div className="flex flex-col gap-10 rounded-2xl bg-[color:var(--pp-primary-200)] px-3 py-8 md:rounded-3xl md:p-12">
        <div className="grid gap-10 px-3 py-8 sm:grid-cols-2 sm:gap-0 sm:p-0">
          <div className="flex flex-col gap-6 p-0 sm:py-8">
            <h2 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">Pocketpills delivers to:</h2>
            <div className="grid grid-cols-1 gap-y-2 md:grid-cols-2">
              {PROVINCES.map((p) => <span key={p} className="text-[13px] text-[color:var(--pp-primary-950)]">{p}</span>)}
            </div>
          </div>
          <div className="flex flex-col gap-6 rounded-2xl bg-[#E5E3FF80] px-4 py-8 sm:p-8">
            <div className="flex flex-col gap-6 text-[13px] text-ink-secondary">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em]">Your Region</p>
              <div className="flex flex-col gap-3">
                <h2 className="font-display text-lg font-bold text-[color:var(--pp-primary-950)]">Pocketpills East</h2>
                <p className="text-[11px] font-medium uppercase tracking-wide hover:underline">Unit 6 - 6375 Dixie Rd, Mississauga, ON, L5T 2E7</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[color:var(--pp-primary-950)]">
                Pocketpills is licensed by <span className="text-[color:var(--pp-violet)] hover:underline">Ontario College of Pharmacists</span>
              </p>
              <div className="flex justify-between text-[13px]">
                <div className="flex flex-col"><p className="text-ink-secondary">Pharmacy License No.</p><p className="text-[color:var(--pp-primary-800)]">#307234</p></div>
                <div className="flex flex-col"><p className="text-ink-secondary">Pharmacy Manager</p><p className="text-[color:var(--pp-primary-800)]">Aisha Abo Saada</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-line" />

        <div className="grid w-full grid-cols-2 gap-8 md:grid-cols-4">
          {COLUMNS.map((c) => (
            <div key={c.head} className="flex flex-col gap-6">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-tertiary">{c.head}</h4>
              <ul className="space-y-3">
                {c.links.map(([l, to]) => (
                  <li key={l} className="text-[13px] text-ink-secondary">
                    {to.startsWith("#") ? <a href={to} className="hover:text-[color:var(--pp-violet)]">{l}</a>
                      : <Link to={to} className="hover:text-[color:var(--pp-violet)]">{l}</Link>}
                  </li>
                ))}
                <li>
                  <button onClick={() => go(c.cta[1])} className="flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--pp-primary-950)] hover:underline">
                    {c.cta[0]} <ArrowRight />
                  </button>
                </li>
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-line" />

        {/* utility row — inside the card */}
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-4">
            <Social />
            <button className="flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5 text-[13px] text-ink-secondary">
              EN
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <p className="text-[12px] text-ink-tertiary">Pocketpills is not a pharmacy&nbsp; or a drug manufacturer</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-tertiary">Certifications</h3>
            <div className="flex items-center gap-3">
              <img loading="lazy" onError={hideOnError} src={`${CDN}/images/landing/footer/legitScript_logo.png`} width={52} height={52} alt="LegitScript approved" />
              <img loading="lazy" onError={hideOnError} src="https://static.pocketpills.com/webapp/rebrand/landing/logo_soc2.webp" width={52} height={52} className="h-[52px]" alt="SOC 2 certification" />
            </div>
          </div>
        </div>
      </div>

      {/* legal bar — outside the card */}
      <div className="flex flex-col justify-between gap-2 px-2 pt-2 text-[12px] text-ink-secondary sm:flex-row">
        <span>©2026 Pocketpills · Conceptual redesign, not affiliated with Pocketpills Inc.</span>
        <span className="flex flex-wrap items-center">
          {["Security", "Terms of Use", "Privacy Policy", "Return Policy"].map((l, i, a) => (
            <span key={l} className="flex items-center">
              <a href="#faq" className="hover:text-[color:var(--pp-violet)]">{l}</a>
              {i < a.length - 1 && <span className="px-3 text-ink-tertiary">|</span>}
            </span>
          ))}
        </span>
      </div>
    </section>
  );
}
