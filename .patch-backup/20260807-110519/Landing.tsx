import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui";
import { entryPoints, treatments, type EntryIconKey } from "@/lib/data";
import { useUser } from "@/lib/user";

const VIDEO_ID = "xbTcp1sTsME";

/* ── Entry tile icon (shared with in-app entry points) ──── */
function TileIcon({ id, color }: { id: EntryIconKey; color: string }) {
  const c = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (id === "treatment") return <svg {...c}><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" /><path d="M12 11v5M9.5 13.5h5" /></svg>;
  if (id === "fill") return <svg {...c}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h4M9 12h6M9 16h6" /></svg>;
  if (id === "transfer") return <svg {...c}><path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" /><path d="M15 12h6M18 9l3 3-3 3" /></svg>;
  return <svg {...c}><rect x="3.5" y="9" width="11" height="6" rx="3" transform="rotate(-35 9 12)" /><circle cx="16.5" cy="15.5" r="4" /></svg>;
}

function EntryTiles({ onPick }: { onPick: (to: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {entryPoints.map((e) => (
        <button key={e.id} onClick={() => onPick(e.to)}
          className="rounded-2xl border border-line bg-surface-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-float">
          <span className="grid h-11 w-11 place-items-center rounded-xl shadow-sm" style={{ backgroundImage: e.tile }}>
            <TileIcon id={e.id} color={e.fg} />
          </span>
          <p className="mt-3 text-sm font-semibold leading-snug text-ink">{e.title}</p>
        </button>
      ))}
    </div>
  );
}

/* ── Announcement bar ───────────────────────────────────── */
function AnnouncementBar({ onGo }: { onGo: () => void }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="relative z-50 bg-[#272451] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-10 py-2 text-center text-xs sm:text-sm">
        <span className="text-white/85">Free delivery on every order, anywhere in Canada</span>
        <button onClick={onGo} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold hover:bg-white/25">
          Get started <span aria-hidden>→</span>
        </button>
        <button onClick={() => setShow(false)} className="absolute right-4 text-white/60 hover:text-white" aria-label="Dismiss">✕</button>
      </div>
    </div>
  );
}

/* ── Header with dropdown nav ───────────────────────────── */
const MENUS: Record<string, [string, string][]> = {
  Treatment: [["Birth control", "/get-started"], ["Acne", "/get-started"], ["Blood pressure", "/get-started"], ["Diabetes", "/get-started"], ["See all treatments", "/get-started"]],
  "Online Pharmacy": [["Fill a prescription", "/get-started"], ["Transfer a prescription", "/get-started"], ["Refills", "/get-started"], ["Drug prices", "/drug"]],
  "How it works": [["Our process", "#how"], ["Packaging", "#how"], ["Delivery", "#delivers"]],
  Support: [["FAQs", "#faq"], ["Contact us", "#care"], ["Help centre", "#faq"]],
};

function Header() {
  const { signedIn, displayName } = useUser();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface-1/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[color:var(--color-primary-fg)] text-lg">⊕</span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">pocket<span className="text-primary">pills</span></span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setOpen(null)}>
          {Object.keys(MENUS).map((m) => (
            <div key={m} className="relative" onMouseEnter={() => setOpen(m)}>
              <button className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-ink-secondary hover:text-ink" aria-expanded={open === m}>
                {m} <span className="text-xs text-ink-tertiary" aria-hidden>⌄</span>
              </button>
              {open === m && (
                <div className="absolute left-0 top-full w-60 overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-float">
                  {MENUS[m].map(([label, to]) => (
                    to.startsWith("#")
                      ? <a key={label} href={to} onClick={() => setOpen(null)} className="block px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-1 hover:text-ink">{label}</a>
                      : <Link key={label} to={to} onClick={() => setOpen(null)} className="block px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-1 hover:text-ink">{label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link to="/app" className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-[color:var(--color-primary-fg)] hover:bg-primary-hover">
              Continue as {displayName}
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink-secondary hover:text-ink sm:inline-flex">
                <span aria-hidden>👤</span> Log in
              </Link>
              <Link to="/get-started" className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-[color:var(--color-primary-fg)] hover:bg-primary-hover">
                Join PocketPills
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Video hero ─────────────────────────────────────────── */
function VideoHero() {
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) setPlaying(false);
  }, []);

  const post = (fn: "playVideo" | "pauseVideo") =>
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: fn, args: [] }), "*");

  const toggle = () => { playing ? post("pauseVideo") : post("playVideo"); setPlaying(!playing); };

  const src =
    `https://www.youtube-nocookie.com/embed/${VIDEO_ID}` +
    `?autoplay=${reduced ? 0 : 1}&mute=1&loop=1&playlist=${VIDEO_ID}&controls=0&modestbranding=1` +
    `&rel=0&playsinline=1&showinfo=0&iv_load_policy=3&enablejsapi=1&start=54`;

  return (
    <section className="relative bg-[#EDE9FE] pb-24 pt-6 sm:pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative aspect-[16/8] overflow-hidden rounded-3xl bg-[#322e6b]">
          {/* video fills the frame */}
          <iframe
            ref={ref}
            title="How PocketPills works"
            src={src}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="pointer-events-none absolute left-1/2 top-1/2 h-[125%] w-[178%] -translate-x-1/2 -translate-y-1/2 sm:h-[130%] sm:w-[130%]"
          />
          {/* legibility scrim */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" aria-hidden />

          {/* corner labels */}
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-4 sm:p-6">
            <p className="text-xs font-semibold text-white drop-shadow sm:text-sm">
              <span className="mr-1.5" aria-hidden>🍁</span> Complete care, without leaving home
            </p>
            <p className="text-xs font-semibold text-white drop-shadow sm:text-sm">
              Trusted by 800,000+ Canadians · 4.8★ rated
            </p>
          </div>

          <button onClick={toggle}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-sm text-white backdrop-blur hover:bg-black/60"
            aria-label={playing ? "Pause video" : "Play video"}>
            {playing ? "❚❚" : "▶"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Welcome card (overlaps hero) ───────────────────────── */
function WelcomeCard({ onStart }: { onStart: () => void }) {
  const stats = [
    ["100% Canadian care", "Trusted by millions of Canadians"],
    ["Over 2 million", "5-star in-app reviews"],
    ["4.8 rating", "46K+ App Store reviews"],
    ["4.6 rating", "13K+ Google Play reviews"],
    ["4.7 score", "9K+ Trustpilot reviews"],
  ];
  return (
    <section className="relative z-10 -mt-20 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface-2 p-8 text-center shadow-float sm:p-10">
        <p className="font-semibold text-primary">Welcome to PocketPills</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Your health, handled.
        </h1>
        <div className="mt-6">
          <Button size="lg" onClick={onStart} className="rounded-full px-8">Start <span aria-hidden>⊕</span></Button>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 text-left sm:grid-cols-3 lg:grid-cols-5">
          {stats.map(([big, small]) => (
            <div key={small}>
              <p className="text-sm font-bold text-ink">{big}</p>
              <p className="text-xs text-ink-tertiary">{small}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Landing ────────────────────────────────────────────── */
export function Landing() {
  const nav = useNavigate();
  const { signedIn } = useUser();
  const go = (to?: string) => nav(signedIn ? (to ?? "/app") : "/get-started");

  const reviews = [
    { n: "Angie A.", t: "I haven't had a family doctor in 3 years—PocketPills makes it possible to still get my meds." },
    { n: "Kim O.", t: "Moved provinces with no doctor. They set me up with telehealth and renewed my meds without delay." },
    { n: "Christine P.", t: "Getting a doctor is hard. PocketPills ships fast, connects me with telehealth, and goes above and beyond." },
    { n: "Ellie B.", t: "Managing prescriptions is so easy. Simple refills, med reminders, and fast delivery." },
    { n: "Briar L.", t: "The pharmacists are knowledgeable and friendly, and the telehealth team is great too." },
    { n: "Kevin E.", t: "They handle all my refills and deal with my insurance directly. Makes life so easy." },
  ];

  const faqs: [string, string][] = [
    ["What is PocketPills?", "An online healthcare platform: consult a licensed provider, get prescriptions, and have medication delivered—free, all in one place."],
    ["Who can use PocketPills?", "Anyone in Canada with a valid address and either provincial or private coverage."],
    ["Can I order a prescription online?", "Yes. Upload it, have your clinic fax it, mail it in, or transfer from another pharmacy—we handle the rest."],
    ["What conditions can PocketPills help with?", "Everyday concerns like UTIs and acne, ongoing conditions like blood pressure and diabetes, plus birth control and more."],
    ["Does PocketPills replace my family doctor?", "No. We're here between visits for renewals, everyday concerns, and ongoing conditions."],
    ["Is PocketPills covered by insurance?", "We bill most provincial and private plans directly, so you only pay what's left."],
    ["Is delivery really free?", "Yes—free delivery to every province and territory, including rural and remote communities."],
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const provinces = [
    ["Alberta (AB)", "British Columbia (BC)"], ["Manitoba (MB)", "Newfoundland & Labrador (NL)"],
    ["New Brunswick (NB)", "Nova Scotia (NS)"], ["Northwest Territories (NT)", "Nunavut (NU)"],
    ["Ontario (ON)", "Prince Edward Island (PE)"], ["Quebec (QC)", "Saskatchewan (SK)"], ["Yukon (YT)", ""],
  ];

  return (
    <div className="min-h-screen bg-surface-0">
      <AnnouncementBar onGo={() => go()} />
      <Header />
      <VideoHero />
      <WelcomeCard onStart={() => go()} />

      <main>
        {/* Promo + entry tiles */}
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <p className="font-semibold text-ink">Buy again!</p>
                <button onClick={() => go("/messages")} className="text-sm font-semibold text-primary hover:underline">Talk to a licensed clinician →</button>
              </div>
              <div className="relative overflow-hidden rounded-3xl p-8 text-white"
                style={{ backgroundImage: "radial-gradient(600px 300px at 80% 20%, rgba(167,160,211,0.55), transparent 60%), linear-gradient(135deg,#4a44a0,#322e6b)" }}>
                <h3 className="font-display text-3xl font-extrabold leading-tight">Your refills,<br />on autopilot.</h3>
                <p className="mt-2 max-w-xs text-sm text-white/80">Auto-refill keeps your medication coming before you run out—no reminders to chase.</p>
                <button onClick={() => go("/pharmacy")} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#322e6b]">
                  Set up auto-refill <span aria-hidden>⊕</span>
                </button>
                <span className="pointer-events-none absolute -bottom-6 -right-4 text-8xl opacity-20" aria-hidden>💊</span>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3">
                <p className="font-semibold text-ink">Doctor-led treatment</p>
                <button onClick={() => go("/find-care")} className="text-sm font-semibold text-primary hover:underline">Talk to a licensed clinician →</button>
              </div>
              <EntryTiles onPick={(to) => go(to)} />
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: "Is this treatment right for you?", d: "Take a 2-minute assessment.", bg: "bg-surface-1", fg: "text-ink" },
              { t: "Get a prescription online.", d: "Reviewed by Canadian clinicians.", bg: "bg-primary text-white", fg: "text-white" },
              { t: "Changing care for Canadians.", d: "Our mission, and how we got here.", bg: "bg-wellness-subtle", fg: "text-ink" },
            ].map((c) => (
              <button key={c.t} onClick={() => go()} className={`rounded-3xl p-6 text-left ${c.bg} transition-transform hover:-translate-y-0.5`}>
                <p className={`font-display text-lg font-bold ${c.fg}`}>{c.t}</p>
                <p className={`mt-1 text-sm ${c.fg} opacity-80`}>{c.d}</p>
                <span className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${c.fg}`}>Learn more <span aria-hidden>⊕</span></span>
              </button>
            ))}
          </div>
        </section>

        {/* Partners */}
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-ink-tertiary">Proud pharmacy of</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {["Canadian Tire", "Toyota", "Neo", "KOHO", "Indeed", "123Dentist", "VetCare"].map((p) => (
              <span key={p} className="rounded-full border border-line bg-surface-1 px-3.5 py-1.5 text-sm font-semibold text-ink-secondary">{p}</span>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="reviews" className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-extrabold text-ink">Our members love us</h2>
            <p className="mt-2 text-ink-secondary">See why thousands across Canada choose PocketPills.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <Card key={r.n} className="p-5">
                <span className="text-sm text-coral-500" aria-label="5 out of 5">★★★★★</span>
                <p className="mt-2 text-sm text-ink-secondary">{r.t}</p>
                <p className="mt-3 text-sm font-semibold text-ink">{r.n}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <span className="rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold text-ink">4.9 ★ Google</span>
            <span className="rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold text-ink">4.8 / 5 Trustpilot</span>
          </div>
        </section>

        {/* Join band */}
        <section className="mx-auto mt-16 max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
            Join <span className="text-primary">800,000+</span> Canadians<br className="hidden sm:block" /> who never miss a dose.
          </h2>
          <div className="mt-6"><Button size="lg" onClick={() => go()} className="rounded-full px-8">Join PocketPills</Button></div>
        </section>

        {/* NABP band */}
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 rounded-3xl bg-[#0f3d33] p-8 text-white sm:flex-row sm:items-center sm:p-10">
            <div className="shrink-0 text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/60">Accredited by</p>
              <p className="font-display text-2xl font-extrabold">NABP</p>
              <p className="text-[10px] text-white/60">Healthcare Merchant</p>
            </div>
            <div className="hidden w-px self-stretch bg-white/20 sm:block" />
            <div>
              <h3 className="font-display text-2xl font-bold">Putting you first, every time.</h3>
              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Our licensed healthcare providers carefully assess each concern and provide expert medical
                guidance. Whether it's a diagnosis, treatment plan, or prescription, you can trust you're in good hands.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            <div>
              <p className="text-sm font-semibold text-primary">Frequently Asked</p>
              <h2 className="mt-1.5 font-display text-3xl font-extrabold text-ink">Your questions, answered.</h2>
              <button onClick={() => go()} className="mt-4 rounded-full bg-primary-subtle px-4 py-2 text-sm font-semibold text-primary">More FAQs</button>
            </div>
            <div className="space-y-2.5">
              {faqs.map(([q, a], i) => {
                const isOpen = openFaq === i;
                return (
                  <Card key={q} className="overflow-hidden">
                    <button onClick={() => setOpenFaq(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 p-4 text-left" aria-expanded={isOpen}>
                      <span className="font-medium text-ink">{q}</span>
                      <span className={"shrink-0 text-primary transition-transform " + (isOpen ? "rotate-45" : "")}>＋</span>
                    </button>
                    {isOpen && <p className="-mt-1 px-4 pb-4 text-sm text-ink-secondary">{a}</p>}
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* App + care team + tiles */}
        <section id="care" className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl p-8 text-white"
              style={{ backgroundImage: "radial-gradient(500px 260px at 85% 15%, rgba(167,160,211,0.5), transparent 60%), linear-gradient(135deg,#4a44a0,#272451)" }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h3 className="font-display text-3xl font-extrabold leading-tight">Stay in control<br />of your health.</h3>
                <div className="flex flex-col gap-2">
                  {[["🍏", "App Store"], ["▶️", "Google Play"]].map(([g, n]) => (
                    <span key={n} className="inline-flex items-center gap-2 rounded-xl bg-black/40 px-3 py-1.5 text-xs font-semibold">{g} {n}</span>
                  ))}
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-white p-5 text-stone-900">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-display text-lg font-bold">Our Care Team</p>
                  <div className="text-right text-xs text-stone-500">
                    <p>care@pocketpills.com</p>
                    <p>1-855-950-7226</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-stone-500">Monday – Saturday · 9:00 AM – 7:00 PM EST</p>
                <button onClick={() => go("/messages")} className="mt-3 w-full rounded-full border border-stone-300 py-2 text-sm font-semibold">Get in touch →</button>
              </div>
            </div>
            <div className="rounded-3xl border border-line bg-surface-1 p-6">
              <EntryTiles onPick={(to) => go(to)} />
            </div>
          </div>
        </section>

        {/* Delivers to */}
        <section id="delivers" className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 rounded-3xl border border-line bg-surface-1 p-8 lg:grid-cols-2">
            <div>
              <p className="font-display text-xl font-bold text-ink">PocketPills delivers to:</p>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-ink-secondary">
                {provinces.flat().filter(Boolean).map((p) => <span key={p}>{p}</span>)}
              </div>
            </div>
            <div className="rounded-2xl bg-surface-2 p-6">
              <p className="text-xs uppercase tracking-widest text-ink-tertiary">Your region</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">PocketPills East</p>
              <p className="mt-2 text-sm text-ink-secondary">Unit 6 · 4375 Dixie Rd, Mississauga, ON L4W 1V6</p>
              <p className="mt-3 text-sm text-ink-tertiary">Licensed by the Ontario College of Pharmacists</p>
              <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-ink-tertiary">
                <span>Pharmacy Licence No. #307234</span>
                <span>Pharmacy Manager</span>
              </div>
            </div>
          </div>
        </section>

        {/* Treatments quick links */}
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold text-ink">Popular treatments</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {treatments.map((t) => (
              <button key={t.slug} onClick={() => go(`/treatment/${t.slug}`)}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface-2 p-4 text-left hover:border-strong">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-subtle text-xl">{t.emoji}</span>
                <span className="min-w-0"><span className="block font-semibold text-ink">{t.name}</span><span className="block truncate text-sm text-ink-tertiary">{t.category}</span></span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-line bg-surface-1">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            {([
              ["Treatment", ["Treatment", "Weight loss", "Hair loss treatment", "ED treatment", "Birth control pills", "See all treatments →"]],
              ["Pharmacy", ["Online pharmacy", "Transfer a prescription", "Online drugstore", "Drug prices", "Get online prescription →"]],
              ["Medications", ["Ozempic", "Wegovy", "Modafinil", "Mounjaro", "Finasteride", "Buy drugs online →"]],
              ["Company", ["About us", "Contact PocketPills", "Help centre", "FAQs", "Accessibility", "Join PocketPills →"]],
            ] as [string, string[]][]).map(([title, links]) => (
              <div key={title}>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-tertiary">{title}</p>
                <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
                  {links.map((l) => <li key={l}><Link to="/get-started" className="hover:text-ink">{l}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <div className="flex items-center gap-3 text-ink-tertiary">
              {["📷", "in", "𝕏", "f"].map((i) => <span key={i} className="grid h-8 w-8 place-items-center rounded-lg border border-line">{i}</span>)}
              <span className="ml-2 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold">EN ⌄</span>
            </div>
            <p className="text-xs text-ink-tertiary">PocketPills is not a pharmacy or a drug manufacturer.</p>
            <div className="flex gap-2">
              <span className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-tertiary">NABP</span>
              <span className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-tertiary">SOC 2</span>
            </div>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-4 text-xs text-ink-tertiary sm:flex-row sm:px-6">
            <span>© 2026 PocketPills · Conceptual redesign, not affiliated with PocketPills Inc.</span>
            <span>Security · Terms of Use · Privacy Policy · Return Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
