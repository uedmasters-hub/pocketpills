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
import { LANDING_SERVICE_CATEGORIES } from "@/lib/landingServiceCategories";

const CDN = "https://static.pocketpills.com/acq-web";
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; };

function FooterServiceGrid() {
  const { tx } = useI18n();

  return (
    <div className="flex h-full min-h-0">
      <ul
        className="grid h-full min-h-0 grow grid-cols-4 content-center gap-x-3 gap-y-6 rounded-2xl border border-line bg-[color:var(--primary-200)] p-5 md:rounded-3xl sm:gap-x-4 sm:gap-y-7 sm:p-6"
        aria-label={tx("Care services")}
      >
        {LANDING_SERVICE_CATEGORIES.map((s) => (
          <li key={s.id}>
            <Link
              to={s.to}
              className="group flex flex-col items-center gap-2.5 rounded-xl text-center outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pp-violet)]"
              aria-label={tx(s.label)}
            >
              <img
                src={s.imageUrl}
                alt=""
                loading="lazy"
                onError={hideOnError}
                className="h-[4.5rem] w-[4.5rem] object-contain transition-transform duration-200 group-hover:scale-[1.04] sm:h-[5rem] sm:w-[5rem]"
              />
              <span className="text-[0.8125rem] font-medium leading-snug text-[color:var(--pp-primary-950)] sm:text-sm">
                {tx(s.label)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
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

            {/* Service category grid — same frame as the old 2×2 tiles */}
            <FooterServiceGrid />
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
