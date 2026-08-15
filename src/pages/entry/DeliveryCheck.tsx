import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  formatPostal,
  isValidPostal,
  lookupDelivery,
  type DeliveryLookup,
  type DeliverySpeed,
} from "@/lib/postal";
import { useUser } from "@/lib/user";
import { getRegion } from "@/lib/pharmacies";
import { useI18n } from "@/lib/i18n";

type Step = "postal" | "result" | "options";

/** Demo postal seeds when arriving from a province pharmacy page. */
const PROVINCE_POSTAL: Record<string, string> = {
  ab: "T2P 1J9",
  bc: "V6B 1A1",
  mb: "R3C 0A1",
  nl: "A1C 1A1",
  nb: "E3B 1A1",
  ns: "B3J 1A1",
  nt: "X1A 1A1",
  nu: "X0A 0H0",
  on: "M5H 2N2",
  pe: "C1A 1A1",
  qc: "H2Y 1C6",
  sk: "S7K 1A1",
  yt: "Y1A 1A1",
};

export function DeliveryCheck() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { signedIn } = useUser();
  const { tx } = useI18n();
  const provinceSlug = (params.get("province") ?? "").toLowerCase();
  const region = getRegion(provinceSlug);
  const seeded = provinceSlug ? PROVINCE_POSTAL[provinceSlug] : "";
  const initial = formatPostal(params.get("postal") ?? seeded ?? "");

  const [step, setStep] = useState<Step>(isValidPostal(initial) ? "result" : "postal");
  const [postal, setPostal] = useState(initial);
  const [speed, setSpeed] = useState<DeliverySpeed>("standard");
  const [touched, setTouched] = useState(false);

  const result = useMemo(() => (isValidPostal(postal) ? lookupDelivery(postal) : null), [postal]);
  const valid = isValidPostal(postal);

  useEffect(() => {
    if (result?.speeds.length) {
      const preferred = result.speeds.find((s) => s.id === "standard") ?? result.speeds[0];
      setSpeed(preferred.id);
    }
  }, [result?.postal]);

  const check = () => {
    setTouched(true);
    if (!valid) return;
    setStep("result");
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <button
        type="button"
        onClick={() => (step === "postal" ? nav(-1) : setStep(step === "options" ? "result" : "postal"))}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary transition-colors hover:text-[color:var(--pp-primary-950)]"
      >
        {tx("← Back")}
      </button>

      <p className="pp-caps mt-6 text-[color:var(--pp-violet)]">{tx("Delivery check")}</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
        {step === "postal" && tx("Check your postal code")}
        {step === "result" && (result?.covered ? tx("We deliver to you") : tx("Outside our network"))}
        {step === "options" && tx("Choose a delivery speed")}
      </h1>
      <p className="mt-2 text-base text-ink-secondary">
        {step === "postal" && tx("Enter a Canadian postal code to see ETA, pharmacy region, and available speeds.")}
        {step === "result" && result?.covered && (
          tx("Free standard delivery to {province}{cityHint}.")
            .replace("{province}", result.province.name)
            .replace("{cityHint}", result.cityHint ? ` · ${result.cityHint}` : "")
        )}
        {step === "result" && result && !result.covered && tx("We couldn’t map this code. Double-check and try again.")}
        {step === "options" && tx("Standard is always free. Upgrade only if you need it sooner.")}
      </p>

      {/* Progress */}
      <ol className="mt-6 flex gap-1.5" aria-label={tx("Progress")}>
        {(["postal", "result", "options"] as const).map((s, i) => {
          const active = step === s;
          const done = (["postal", "result", "options"] as const).indexOf(step) > i;
          return (
            <li key={s} className="min-w-0 flex-1">
              <span
                className="block h-1 rounded-full"
                style={{
                  background: active || done ? "var(--pp-primary-950)" : "var(--pp-primary-300)",
                }}
              />
            </li>
          );
        })}
      </ol>

      {step === "postal" && (
        <section className="mt-8 space-y-4">
          {region && (
            <div className="rounded-2xl border border-line bg-[color:var(--pp-primary-100)] px-4 py-3.5 text-sm">
              <p className="font-medium text-[color:var(--pp-primary-950)]">
                {tx("Checking delivery for {region}").replace("{region}", region.name)}
              </p>
              <p className="mt-0.5 text-ink-secondary">
                {tx("Enter any postal code in {code}, or ").replace("{code}", region.code)}{" "}
                <Link
                  to={`/pharmacies/regions/${region.slug}`}
                  className="font-medium text-[color:var(--pp-violet)] hover:underline"
                >
                  {tx("browse pharmacies")}
                </Link>
                .
              </p>
            </div>
          )}
          <label className="block" htmlFor="delivery-postal">
            <span className="mb-1.5 block text-sm font-medium text-ink-secondary">{tx("Postal code")}</span>
            <input
              id="delivery-postal"
              value={postal}
              onChange={(e) => setPostal(formatPostal(e.target.value))}
              onKeyDown={(e) => { if (e.key === "Enter") check(); }}
              placeholder="A1A 1A1"
              autoComplete="postal-code"
              inputMode="text"
              className="h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink outline-none focus:border-primary"
              aria-invalid={touched && !valid ? true : undefined}
              aria-describedby={touched && !valid ? "delivery-postal-error" : undefined}
            />
          </label>
          {touched && !valid && (
            <p id="delivery-postal-error" className="text-sm text-danger" role="alert">
              {tx("Enter a valid Canadian postal code (e.g. M5H 2N2).")}
            </p>
          )}
          <Button type="button" fullWidth onClick={check} disabled={postal.length < 3}>
            {tx("Check delivery")}
          </Button>
          <p className="text-xs text-ink-tertiary">
            {tx("We deliver free to every province and territory. Same-day is available in select cities.")}
          </p>
        </section>
      )}

      {step === "result" && result && (
        <ResultPanel
          result={result}
          onEdit={() => setStep("postal")}
          onContinue={() => setStep("options")}
        />
      )}

      {step === "options" && result && (
        <OptionsPanel
          result={result}
          speed={speed}
          onSpeed={setSpeed}
          signedIn={signedIn}
          onDone={() => nav(signedIn ? "/dashboard" : "/get-started")}
        />
      )}
    </div>
  );
}

function ResultPanel({
  result,
  onEdit,
  onContinue,
}: {
  result: DeliveryLookup;
  onEdit: () => void;
  onContinue: () => void;
}) {
  const { tx } = useI18n();

  if (!result.covered) {
    return (
      <section className="mt-8 space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{result.postal}</p>
          <p className="mt-2 text-sm text-ink-secondary">{tx("Try another postal code, or contact care for help.")}</p>
        </div>
        <Button type="button" fullWidth variant="secondary" onClick={onEdit}>
          {tx("Try another code")}
        </Button>
        <Link to="/messages" className="block text-center text-sm font-medium text-[color:var(--pp-violet)]">
          {tx("Contact care team")}
        </Link>
      </section>
    );
  }

  const standard = result.speeds.find((s) => s.id === "standard");
  const hasSameDay = result.speeds.some((s) => s.id === "same_day");

  return (
    <section className="mt-8 space-y-4">
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-tertiary">{tx("Postal code")}</p>
            <p className="mt-0.5 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {result.postal}
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="text-sm font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-80"
          >
            {tx("Change")}
          </button>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-2xs text-ink-tertiary">{tx("Province")}</dt>
            <dd className="mt-0.5 text-sm font-medium text-[color:var(--pp-primary-950)]">
              {result.province.name} ({result.province.code})
            </dd>
          </div>
          <div>
            <dt className="text-2xs text-ink-tertiary">{tx("Standard ETA")}</dt>
            <dd className="mt-0.5 text-sm font-medium text-[color:var(--pp-primary-950)]">
              {tx(standard?.eta ?? "2–3 business days")}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-xl border border-line bg-[color:var(--pp-primary-200)] px-4 py-3">
          <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
            {tx("Fulfilling pharmacy")}
          </p>
          <p className="mt-1 text-sm font-medium text-[color:var(--pp-primary-950)]">{result.pharmacy.name}</p>
          <p className="mt-0.5 text-xs text-ink-secondary">{result.pharmacy.address}</p>
          <p className="mt-1 text-xs text-ink-tertiary">
            {tx("License {code}").replace("{code}", result.pharmacy.license)}
          </p>
        </div>

        {hasSameDay && (
          <p className="mt-4 text-sm text-wellness">
            {tx("Same-day delivery is available in your area.")}
          </p>
        )}
      </div>

      <Button type="button" fullWidth onClick={onContinue}>
        {tx("See delivery options")}
      </Button>
    </section>
  );
}

function OptionsPanel({
  result,
  speed,
  onSpeed,
  signedIn,
  onDone,
}: {
  result: DeliveryLookup;
  speed: DeliverySpeed;
  onSpeed: (s: DeliverySpeed) => void;
  signedIn: boolean;
  onDone: () => void;
}) {
  const nav = useNavigate();
  const { tx } = useI18n();
  const chosen = result.speeds.find((s) => s.id === speed);

  return (
    <section className="mt-8 space-y-4">
      <div className="space-y-2">
        {result.speeds.map((s) => {
          const on = s.id === speed;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSpeed(s.id)}
              className={
                "flex w-full items-start justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-4 text-left transition-colors " +
                (on
                  ? "border-[color:var(--pp-primary-950)]"
                  : "border-line hover:bg-[color:var(--state-hover)]")
              }
            >
              <span>
                <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(s.label)}</span>
                <span className="mt-0.5 block text-xs text-ink-tertiary">{tx(s.eta)}</span>
                {s.note && <span className="mt-1 block text-2xs text-ink-tertiary">{tx(s.note)}</span>}
              </span>
              <span className="shrink-0 text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(s.price)}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-line bg-[color:var(--pp-primary-200)] px-4 py-3 text-sm text-ink-secondary">
        {tx("Selected:")}{" "}
        <span className="font-medium text-[color:var(--pp-primary-950)]">{chosen ? tx(chosen.label) : ""}</span>
        {" · "}
        {chosen ? tx(chosen.eta) : ""} · {chosen ? tx(chosen.price) : ""}
      </div>

      <div className="space-y-2 pt-1">
        <Button type="button" fullWidth onClick={() => nav(signedIn ? "/transfer" : "/get-started")}>
          {signedIn ? tx("Transfer prescriptions here") : tx("Create account to continue")}
        </Button>
        <Button type="button" fullWidth variant="secondary" onClick={() => nav(signedIn ? "/fill" : "/login")}>
          {signedIn ? tx("Fill a prescription") : tx("Log in")}
        </Button>
        <button
          type="button"
          onClick={onDone}
          className="w-full py-2 text-center text-sm font-medium text-ink-tertiary transition-colors hover:text-[color:var(--pp-primary-950)]"
        >
          {tx("Done")}
        </button>
      </div>
    </section>
  );
}
