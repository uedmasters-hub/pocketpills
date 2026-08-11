import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Field, Badge } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { MapEmbed } from "@/components/MapEmbed";
import { createTransferOrder, TRANSFER_HINTS, type Order } from "@/lib/orders";
import { useUser } from "@/lib/user";
import { getPharmacy, loadSelectedPharmacy } from "@/lib/pharmacies";
import { useI18n } from "@/lib/i18n";

/* ── Flow model ─────────────────────────────────────────── */
const STEPS = [
  { key: "postal", label: "Delivery" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "review", label: "Review" },
  { key: "trust", label: "Trust" },
  { key: "address", label: "Address" },
  { key: "payment", label: "Payment" },
  { key: "done", label: "Done" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  lat: number;
  lng: number;
  photos: string[];
}

interface Address {
  id: string;
  label: string;
  line: string;
  isDefault?: boolean;
}

const SAMPLE_PHARMACIES: Pharmacy[] = [
  {
    id: "1",
    name: "Shoppers Drug Mart",
    address: "286 Conception Bay Hwy, Bay Roberts, NL A0A 1G0, Canada",
    distance: "<0.1km",
    lat: 47.596, lng: -53.265,
    photos: [
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=240&h=160&fit=crop",
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=240&h=160&fit=crop",
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=240&h=160&fit=crop",
    ],
  },
  {
    id: "2",
    name: "Green's Drug Mart",
    address: "11 Main Hwy, Dildo, NL A0B 1P0, Canada",
    distance: "12km",
    lat: 47.568, lng: -53.548,
    photos: [
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=240&h=160&fit=crop",
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=240&h=160&fit=crop",
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=240&h=160&fit=crop",
    ],
  },
  {
    id: "3",
    name: "Lawtons Drugs",
    address: "45 Water St, St. John's, NL A1C 1A1, Canada",
    distance: "38km",
    lat: 47.561, lng: -52.712,
    photos: [
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=240&h=160&fit=crop",
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=240&h=160&fit=crop",
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=240&h=160&fit=crop",
    ],
  },
  {
    id: "4",
    name: "Pharmasave",
    address: "102 Conception Bay Hwy, Bay Roberts, NL A0A 1G0, Canada",
    distance: "0.4km",
    lat: 47.599, lng: -53.27,
    photos: [
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=240&h=160&fit=crop",
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=240&h=160&fit=crop",
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=240&h=160&fit=crop",
    ],
  },
  {
    id: "5",
    name: "Costco Pharmacy",
    address: "90 Aberdeen Ave, St. John's, NL A1A 5T3, Canada",
    distance: "41km",
    lat: 47.58, lng: -52.74,
    photos: [
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=240&h=160&fit=crop",
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=240&h=160&fit=crop",
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=240&h=160&fit=crop",
    ],
  },
];

const SAVED_ADDRESSES: Address[] = [
  {
    id: "home",
    label: "Home",
    line: "A-11 King St, Kirkland Lake, Ontario, P2N 2P2",
    isDefault: true,
  },
];

function formatPostal(raw: string) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

function isValidPostal(v: string) {
  return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(v.trim());
}

/* ── Shared chrome ──────────────────────────────────────── */
function TransferShell({
  stepKey,
  onBack,
  onClose,
  children,
  footer,
}: {
  stepKey: StepKey;
  onBack?: () => void;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { tx } = useI18n();
  const idx = STEPS.findIndex((s) => s.key === stepKey);
  const visible = STEPS.filter((s) => s.key !== "done");
  const visIdx = Math.min(idx, visible.length - 1);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-lg flex-col">
      {/* Top bar — Back · title · Close */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          className={
            "inline-flex items-center gap-1 text-sm font-medium transition-colors " +
            (onBack
              ? "text-[color:var(--pp-primary-950)] hover:opacity-70"
              : "pointer-events-none text-transparent")
          }
        >
          <span aria-hidden>‹</span> {tx("Back")}
        </button>
        <h1 className="text-sm font-medium text-[color:var(--pp-primary-950)] sm:text-base">
          {tx("Transfer prescriptions")}
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]"
          aria-label={tx("Close transfer")}
        >
          ✕
        </button>
      </header>

      {/* Step cues — where am I / what's next */}
      {stepKey !== "done" && (
        <div className="mb-8">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="pp-caps text-[color:var(--pp-violet)]">
              {tx(visible[visIdx]?.label)}
            </p>
            <p className="text-xs font-medium text-ink-tertiary tnum">
              {tx("Step {n} of {total}")
                .replace("{n}", String(visIdx + 1))
                .replace("{total}", String(visible.length))}
            </p>
          </div>
          <ol className="flex gap-1.5" aria-label={tx("Transfer progress")}>
            {visible.map((s, i) => {
              const done = i < visIdx;
              const active = i === visIdx;
              return (
                <li key={s.key} className="min-w-0 flex-1">
                  <span
                    className={
                      "block h-1.5 rounded-full transition-colors " +
                      (done || active
                        ? "bg-[color:var(--pp-primary-950)]"
                        : "bg-[color:var(--pp-primary-300)]")
                    }
                    title={tx("Step {n}: {label}")
                      .replace("{n}", String(i + 1))
                      .replace("{label}", tx(s.label))}
                  />
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-2xs text-ink-tertiary">
            {visIdx + 1 < visible.length
              ? tx("Next: {label}").replace("{label}", tx(visible[visIdx + 1]?.label))
              : tx("Almost done — confirm payment to finish")}
          </p>
        </div>
      )}

      <div className="animate-fade-up flex-1">{children}</div>

      {footer && <div className="sticky bottom-4 mt-8 space-y-3 pb-2">{footer}</div>}
    </div>
  );
}

function ContinueBar({
  onContinue,
  disabled,
  label,
  trust,
}: {
  onContinue: () => void;
  disabled?: boolean;
  label?: string;
  trust?: boolean;
}) {
  const { tx } = useI18n();
  return (
    <>
      {trust && (
        <p className="flex items-center justify-center gap-1.5 text-center text-2xs text-ink-tertiary">
          <span aria-hidden>🇨🇦</span>
          {tx("Trusted by 800,000+ Canadians")}
        </p>
      )}
      <Button fullWidth onClick={onContinue} disabled={disabled} className="!rounded-full">
        {label ?? tx("Continue")}
      </Button>
    </>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export function TransferPrescription() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { user, displayName } = useUser();
  const [step, setStep] = useState<StepKey>("postal");
  const [postal, setPostal] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [query, setQuery] = useState("");
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [addressId, setAddressId] = useState(SAVED_ADDRESSES[0].id);
  const [addingAddress, setAddingAddress] = useState(false);
  const [submitted, setSubmitted] = useState<Order | null>(null);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    province: "ON",
    postal: "",
  });
  const [card, setCard] = useState({ number: "", exp: "", cvv: "" });

  /* Prefill from /pharmacies/:region → Transfer from this pharmacy (once). */
  useEffect(() => {
    const id = params.get("pharmacy");
    const area = (id ? getPharmacy(id) : null) ?? loadSelectedPharmacy();
    if (!area) return;
    const mapped: Pharmacy = {
      id: area.id,
      name: area.name,
      address: `${area.address}, ${area.city}, ${area.province}`,
      distance: area.distance,
      lat: area.lat,
      lng: area.lng,
      photos: [
        "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=240&h=160&fit=crop",
        "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=240&h=160&fit=crop",
        "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=240&h=160&fit=crop",
      ],
    };
    setPharmacy(mapped);
    setQuery(area.name);
    setStep("review");
    // Intentionally once on mount — don't re-force review if the user goes back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => nav("/app");
  const etaReady = isValidPostal(postal) || useLocation;

  const deliveryAddress = useMemo(() => {
    if (addingAddress && newAddress.line1) {
      return [newAddress.line1, newAddress.line2, newAddress.city, newAddress.province, newAddress.postal]
        .filter(Boolean)
        .join(", ");
    }
    return SAVED_ADDRESSES.find((a) => a.id === addressId)?.line
      ?? user?.address
      ?? "221 King St W, Toronto, ON";
  }, [addingAddress, newAddress, addressId, user?.address]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SAMPLE_PHARMACIES;
    return SAMPLE_PHARMACIES.filter(
      (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
    );
  }, [query]);

  /* ── 1. Postal / ETA ─────────────────────────────────── */
  if (step === "postal") {
    return (
      <TransferShell stepKey="postal" onClose={close} footer={
        <ContinueBar trust onContinue={() => setStep("pharmacy")} disabled={!etaReady} />
      }>
        <h2 className="font-display text-[1.65rem] font-medium leading-snug tracking-tight text-[color:var(--pp-primary-950)] sm:text-3xl">
          {tx("See how quickly we can deliver to your door.")}
        </h2>
        <p className="mt-3 text-base text-ink-secondary">
          {tx("We provide free 2-day delivery to over 85% of Canadian homes.")}
        </p>

        <label className="mt-8 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Postal code")}</span>
          <input
            value={postal}
            onChange={(e) => {
              setPostal(formatPostal(e.target.value));
              setUseLocation(false);
            }}
            placeholder={tx("Enter postal code")}
            autoComplete="postal-code"
            className="h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink placeholder:text-ink-tertiary focus:border-[color:var(--primary-600)]"
          />
        </label>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-ink-secondary">
          <input
            type="checkbox"
            checked={useLocation}
            onChange={(e) => {
              setUseLocation(e.target.checked);
              if (e.target.checked) setPostal("A0A 0A0");
            }}
            className="h-4 w-4 rounded border-line text-[color:var(--pp-primary-950)]"
          />
          {tx("Use my current location")}
        </label>

        {etaReady && (
          <div className="mt-6 animate-fade-up rounded-2xl bg-[#D6F0EC] px-4 py-3.5 text-sm text-[color:var(--secondary-800)]">
            <p className="font-medium text-[color:var(--pp-primary-950)]">
              {tx("Good news! We deliver to you. Most orders arrive within:")}
            </p>
            <p className="mt-2 flex items-center gap-2 font-medium text-[#0A5A68]">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0A5A68] text-[10px] text-white" aria-hidden>✓</span>
              {tx("2–8 business days")}
            </p>
          </div>
        )}
      </TransferShell>
    );
  }

  /* ── 2. Find pharmacy ────────────────────────────────── */
  if (step === "pharmacy") {
    return (
      <TransferShell stepKey="pharmacy" onBack={() => setStep("postal")} onClose={close}>
        <h2 className="font-display text-[1.65rem] font-medium leading-snug tracking-tight text-[color:var(--pp-primary-950)] sm:text-3xl">
          {tx("Find your current pharmacy")}
        </h2>
        <p className="mt-3 text-base text-ink-secondary">
          {tx("Our team handles the entire transfer process with your old pharmacy from start to finish.")}
        </p>

        <p className="mt-5 text-right text-sm text-ink-secondary">
          {tx("Search pharmacy near:")}{" "}
          <button
            type="button"
            onClick={() => setStep("postal")}
            className="font-medium text-[color:var(--pp-primary-950)] underline underline-offset-2"
          >
            {postal || "A0A 0A0"}
          </button>
        </p>

        <div className="mt-3 flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{tx("Search pharmacy")}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx("Enter pharmacy or address")}
              className="h-12 w-full rounded-xl border border-line bg-white py-2 pl-4 pr-11 text-base text-ink placeholder:text-ink-tertiary focus:border-[color:var(--primary-600)]"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
          </label>
          <button
            type="button"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line bg-white text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]"
            aria-label={tx("Open map")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
              <path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13L15 6.5 9 4.5Z" strokeLinejoin="round" />
              <path d="M9 4.5v13M15 6.5v13" />
            </svg>
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
          {filtered.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPharmacy(p);
                setStep("review");
              }}
              className={
                "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-[color:var(--state-hover)] " +
                (i > 0 ? "border-t border-line" : "")
              }
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-[color:var(--pp-primary-950)]">{p.name}</span>
                <span className="mt-1 block text-sm leading-snug text-ink-secondary">{p.address}</span>
                <span className="mt-1.5 block text-sm text-ink-tertiary">{p.distance}</span>
              </span>
              <span className="mt-1 shrink-0 text-ink-tertiary" aria-hidden>›</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink-tertiary">{tx("No pharmacies match that search.")}</p>
          )}
        </div>
      </TransferShell>
    );
  }

  /* ── 3. Review pharmacy ──────────────────────────────── */
  if (step === "review" && pharmacy) {
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${pharmacy.lng - 0.04}%2C${pharmacy.lat - 0.025}%2C${pharmacy.lng + 0.04}%2C${pharmacy.lat + 0.025}&layer=mapnik&marker=${pharmacy.lat}%2C${pharmacy.lng}`;

    return (
      <TransferShell
        stepKey="review"
        onBack={() => setStep("pharmacy")}
        onClose={close}
        footer={<ContinueBar onContinue={() => setStep("trust")} />}
      >
        <div className="relative overflow-hidden rounded-2xl border border-line bg-[color:var(--pp-primary-200)]">
          <MapEmbed
            title={tx("Map near {name}").replace("{name}", pharmacy.name)}
            src={mapSrc}
            className="h-48 sm:h-56"
          />
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)] shadow-sm">
              {tx("Show all ▾")}
            </span>
          </div>
        </div>

        <h2 className="mt-6 font-display text-[1.65rem] font-medium leading-snug tracking-tight text-[color:var(--pp-primary-950)] sm:text-3xl">
          {tx("Review pharmacy location")}
        </h2>
        <p className="mt-3 text-base text-ink-secondary">
          {tx("Verify that we've got the right pharmacy so we can handle your transfer to get your order ready.")}
        </p>

        <div className="mt-5 rounded-2xl border border-line bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-[color:var(--pp-primary-950)]">{pharmacy.name}</p>
              <p className="mt-1 text-sm text-ink-secondary">{pharmacy.address}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep("pharmacy")}
              className="shrink-0 text-sm font-medium text-[color:var(--pp-primary-950)] underline underline-offset-2"
            >
              {tx("Change")}
            </button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {pharmacy.photos.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                className="h-16 w-20 shrink-0 rounded-xl object-cover sm:h-20 sm:w-24"
              />
            ))}
          </div>
        </div>
      </TransferShell>
    );
  }

  /* ── 4. Social proof ─────────────────────────────────── */
  if (step === "trust") {
    return (
      <TransferShell
        stepKey="trust"
        onBack={() => setStep("review")}
        onClose={close}
        footer={<ContinueBar onContinue={() => setStep("address")} />}
      >
        <div className="overflow-hidden rounded-3xl bg-[color:var(--pp-primary-950)] px-6 py-10 text-center text-white sm:px-8 sm:py-12">
          <p className="font-display text-xl font-medium leading-snug sm:text-2xl">
            {tx("The pharmacy")}{" "}
            <span className="mx-0.5 inline-block rounded-md bg-[#F5FF7A] px-1.5 py-0.5 font-semibold text-[color:var(--pp-primary-950)]">
              800,000+
            </span>{" "}
            {tx("Canadians Love")}
          </p>

          <p className="mt-10 font-display text-5xl font-medium text-[color:var(--pp-primary-400)]">4.8</p>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-white/85">
            <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
            </svg>
            {tx("Verified customer reviews")}
          </div>
          <div className="mt-2 flex justify-center gap-0.5 text-[color:var(--pp-star)]" aria-label={tx("4.8 out of 5 stars")}>
            {"★★★★★".split("").map((s, i) => (
              <span key={i} className={i === 4 ? "opacity-45" : ""}>{s}</span>
            ))}
          </div>

          <blockquote className="mx-auto mt-8 max-w-sm text-sm leading-relaxed text-white/90 sm:text-base">
            {tx("“Pocketpills makes life so much easier! My prescriptions are refilled and sent right to my door whenever they are needed, no more driving to a pharmacy or standing in line for them.”")}
          </blockquote>
          <p className="mt-4 text-sm font-medium text-[color:var(--pp-primary-400)]">Louisa</p>
        </div>
      </TransferShell>
    );
  }

  /* ── 5. Address ──────────────────────────────────────── */
  if (step === "address") {
    return (
      <TransferShell
        stepKey="address"
        onBack={() => setStep("trust")}
        onClose={close}
        footer={
          <ContinueBar
            onContinue={() => setStep("payment")}
            disabled={addingAddress && (!newAddress.line1 || !newAddress.city || !newAddress.postal)}
          />
        }
      >
        <h2 className="font-display text-[1.65rem] font-medium leading-snug tracking-tight text-[color:var(--pp-primary-950)] sm:text-3xl">
          {tx("Where should we deliver your medications?")}
        </h2>
        <p className="mt-3 text-base text-ink-secondary">
          {tx("We can deliver to your home, a loved one's place, or any location that suits your preference.")}
        </p>

        {!addingAddress ? (
          <div className="mt-6 space-y-3">
            {SAVED_ADDRESSES.map((a) => {
              const on = addressId === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAddressId(a.id)}
                  className={
                    "w-full rounded-2xl border bg-white p-4 text-left transition-[border-color] " +
                    (on
                      ? "border-[color:var(--pp-primary-950)]"
                      : "border-line hover:border-[color:var(--pp-primary-400)]")
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[color:var(--pp-primary-950)]">{tx(a.label)}</span>
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--pp-primary-200)] px-2 py-0.5 text-2xs font-semibold text-[color:var(--pp-primary-950)]">
                        {tx("Default")} <span aria-hidden>✓</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-ink-secondary">{a.line}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--pp-violet)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    {tx("Edit")}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setAddingAddress(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-[color:var(--pp-primary-200)] px-4 py-3.5 text-left text-sm font-medium text-[color:var(--pp-primary-950)] transition-opacity hover:opacity-90"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--pp-primary-950)] text-white" aria-hidden>+</span>
              {tx("Add a new address")}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-secondary">
                {tx("Name / Location")} <span className="text-danger">*</span>
              </span>
              <select
                value={newAddress.label}
                onChange={(e) => setNewAddress((a) => ({ ...a, label: e.target.value }))}
                className="h-12 w-full rounded-xl border border-line bg-white px-4 text-ink focus:border-[color:var(--primary-600)]"
              >
                {["Home", "Work", "Family", "Other"].map((l) => (
                  <option key={l} value={l}>{tx(l)}</option>
                ))}
              </select>
            </label>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink-secondary">
                {tx("Street address")} <span className="text-danger">*</span>
              </span>
              <div className="space-y-2">
                <input
                  value={newAddress.line1}
                  onChange={(e) => setNewAddress((a) => ({ ...a, line1: e.target.value }))}
                  placeholder={tx("Address Line 1")}
                  className="h-12 w-full rounded-xl border border-line bg-white px-4 text-ink placeholder:text-ink-tertiary focus:border-[color:var(--primary-600)]"
                />
                <input
                  value={newAddress.line2}
                  onChange={(e) => setNewAddress((a) => ({ ...a, line2: e.target.value }))}
                  placeholder={tx("Address Line 2")}
                  className="h-12 w-full rounded-xl border border-line bg-white px-4 text-ink placeholder:text-ink-tertiary focus:border-[color:var(--primary-600)]"
                />
              </div>
            </div>
            <Field
              label={tx("City *")}
              placeholder={tx("City")}
              value={newAddress.city}
              onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-secondary">
                {tx("Province")} <span className="text-danger">*</span>
              </span>
              <select
                value={newAddress.province}
                onChange={(e) => setNewAddress((a) => ({ ...a, province: e.target.value }))}
                className="h-12 w-full rounded-xl border border-line bg-white px-4 text-ink focus:border-[color:var(--primary-600)]"
              >
                {["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <Field
              label={tx("Postal code *")}
              placeholder="A0A 0A0"
              value={newAddress.postal}
              onChange={(e) => setNewAddress((a) => ({ ...a, postal: formatPostal(e.target.value) }))}
            />
            <button
              type="button"
              onClick={() => setAddingAddress(false)}
              className="text-sm font-medium text-ink-secondary hover:text-[color:var(--pp-primary-950)]"
            >
              {tx("← Use saved address instead")}
            </button>
          </div>
        )}
      </TransferShell>
    );
  }

  /* ── 6. Payment ──────────────────────────────────────── */
  if (step === "payment") {
    const canAdd = card.number.replace(/\s/g, "").length >= 12 && card.exp.length >= 4 && card.cvv.length >= 3;
    const submit = () => {
      const order = createTransferOrder({
        fromPharmacy: pharmacy?.name ?? "Your pharmacy",
        address: deliveryAddress,
        patient: displayName === "there" ? "Ramesh Mandal" : displayName,
        cardLast4: card.number.replace(/\s/g, "").slice(-4) || "4242",
      });
      setSubmitted(order);
      setStep("done");
    };
    return (
      <TransferShell
        stepKey="payment"
        onBack={() => setStep("address")}
        onClose={close}
        footer={
          <>
            <p className="text-center text-2xs text-ink-tertiary">{tx("Powered by Moneris")}</p>
            <Button fullWidth disabled={!canAdd} onClick={submit} className="!rounded-full">
              {tx("Add Card")}
            </Button>
            <p className="text-center text-2xs text-ink-tertiary">
              {tx("If you have zero copay, your card will not be charged anything.")}
            </p>
          </>
        }
      >
        <h2 className="font-display text-[1.65rem] font-medium leading-snug tracking-tight text-[color:var(--pp-primary-950)] sm:text-3xl">
          {tx("Enter payment method to setup seamless delivery.")}
        </h2>
        <p className="mt-3 text-base text-ink-secondary">
          {tx("We'll bill your insurance first. Your card is only charged for any remaining balance after you approve the order.")}
        </p>

        <div className="mt-5 flex gap-3 rounded-2xl border border-line bg-[color:var(--pp-primary-200)] px-4 py-3.5 text-sm text-ink-secondary">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-950)] text-[10px] font-bold text-white" aria-hidden>
            !
          </span>
          <p>
            {tx("Transfers are always free and your card will not be charged until you approve the cost of your order.")}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <Field
            label={tx("Card Number")}
            placeholder="•••• •••• •••• ••••"
            inputMode="numeric"
            value={card.number}
            onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={tx("Expiry (MMYY)")}
              placeholder={tx("MMYY")}
              inputMode="numeric"
              value={card.exp}
              onChange={(e) => setCard((c) => ({ ...c, exp: e.target.value }))}
            />
            <Field
              label={tx("CVV")}
              placeholder={tx("CVV")}
              inputMode="numeric"
              value={card.cvv}
              onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
            />
          </div>
        </div>
      </TransferShell>
    );
  }

  /* ── 7. Done ─────────────────────────────────────────── */
  const trackId = submitted?.id;
  return (
    <TransferShell stepKey="done" onClose={close}>
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-wellness-subtle text-3xl" aria-hidden>
          ✓
        </span>
        <h2 className="mt-5 font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">
          {tx("Transfer requested")}
        </h2>
        <p className="mt-2 text-ink-secondary">
          {tx("We'll contact {pharmacy} and move your prescriptions. Most transfers complete within 1–2 business days.").replace(
            "{pharmacy}",
            pharmacy?.name || tx("your pharmacy"),
          )}
        </p>
        {trackId && (
          <p className="mt-2 text-sm font-medium text-[color:var(--pp-primary-950)]">
            {tx("Tracking ID")} · <span className="tnum">{trackId}</span>
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-line bg-white p-5 text-left">
          <p className="mb-1 font-semibold text-[color:var(--pp-primary-950)]">{tx("What happens next")}</p>
          <p className="mb-3 text-xs text-ink-tertiary">{tx("Follow these cues — or track live anytime in Pharmacy.")}</p>
          {TRANSFER_HINTS.map((h, i) => (
            <div key={h.title} className={"flex gap-3 py-3 " + (i > 0 ? "border-t border-line" : "")}>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-xs font-bold text-[color:var(--pp-primary-950)] tnum">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(h.title)}</span>
                  <Badge tone="neutral">{tx(h.when)}</Badge>
                </span>
                <span className="mt-0.5 block text-sm text-ink-secondary">{tx(h.detail)}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-[#D6F0EC] px-4 py-3.5 text-left text-sm text-[color:var(--secondary-800)]">
          <p className="font-medium text-[color:var(--pp-primary-950)]">{tx("Tip")}</p>
          <p className="mt-1">
            {tx("Open")}{" "}
            <span className="font-medium">{tx("Pharmacy → Transfers")}</span>{" "}
            {tx("to see live status, pharmacy details, and next actions.")}
          </p>
        </div>

        <div className="mx-auto mt-6 inline-flex flex-col items-center gap-2 rounded-2xl border border-line bg-[color:var(--pp-primary-200)] p-4">
          <QRCodeSVG
            value={trackId ? `https://pocketpills.com/orders/${trackId}` : "https://pocketpills.com/pharmacy"}
            size={96}
            fgColor="#4E2A84"
            bgColor="#E5E3FF"
            marginSize={1}
          />
          <p className="text-2xs font-medium text-[color:var(--pp-primary-800)]">{tx("Scan to track this transfer")}</p>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => nav(trackId ? `/orders/${trackId}` : "/pharmacy")}>
            {tx("Track transfer")}
          </Button>
          <Button variant="secondary" onClick={() => nav("/pharmacy")}>{tx("Go to Pharmacy")}</Button>
        </div>
      </div>
    </TransferShell>
  );
}
