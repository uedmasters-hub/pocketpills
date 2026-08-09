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

type Step = "postal" | "result" | "options";

export function DeliveryCheck() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { signedIn } = useUser();
  const initial = formatPostal(params.get("postal") ?? "");

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
        ← Back
      </button>

      <p className="pp-caps mt-6 text-[color:var(--pp-violet)]">Delivery check</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
        {step === "postal" && "Check your postal code"}
        {step === "result" && (result?.covered ? "We deliver to you" : "Outside our network")}
        {step === "options" && "Choose a delivery speed"}
      </h1>
      <p className="mt-2 text-base text-ink-secondary">
        {step === "postal" && "Enter a Canadian postal code to see ETA, pharmacy region, and available speeds."}
        {step === "result" && result?.covered && (
          <>
            Free standard delivery to {result.province.name}
            {result.cityHint ? ` · ${result.cityHint}` : ""}.
          </>
        )}
        {step === "result" && result && !result.covered && "We couldn’t map this code. Double-check and try again."}
        {step === "options" && "Standard is always free. Upgrade only if you need it sooner."}
      </p>

      {/* Progress */}
      <ol className="mt-6 flex gap-1.5" aria-label="Progress">
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
          <label className="block" htmlFor="delivery-postal">
            <span className="mb-1.5 block text-sm font-medium text-ink-secondary">Postal code</span>
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
              Enter a valid Canadian postal code (e.g. M5H 2N2).
            </p>
          )}
          <Button type="button" fullWidth onClick={check} disabled={postal.length < 3}>
            Check delivery
          </Button>
          <p className="text-xs text-ink-tertiary">
            We deliver free to every province and territory. Same-day is available in select cities.
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
  if (!result.covered) {
    return (
      <section className="mt-8 space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{result.postal}</p>
          <p className="mt-2 text-sm text-ink-secondary">Try another postal code, or contact care for help.</p>
        </div>
        <Button type="button" fullWidth variant="secondary" onClick={onEdit}>
          Try another code
        </Button>
        <Link to="/messages" className="block text-center text-sm font-medium text-[color:var(--pp-violet)]">
          Contact care team
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
            <p className="text-sm text-ink-tertiary">Postal code</p>
            <p className="mt-0.5 font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
              {result.postal}
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="text-sm font-medium text-[color:var(--pp-violet)] transition-opacity hover:opacity-80"
          >
            Change
          </button>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-2xs text-ink-tertiary">Province</dt>
            <dd className="mt-0.5 text-sm font-medium text-[color:var(--pp-primary-950)]">
              {result.province.name} ({result.province.code})
            </dd>
          </div>
          <div>
            <dt className="text-2xs text-ink-tertiary">Standard ETA</dt>
            <dd className="mt-0.5 text-sm font-medium text-[color:var(--pp-primary-950)]">
              {standard?.eta ?? "2–3 business days"}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-xl border border-line bg-[color:var(--pp-primary-200)] px-4 py-3">
          <p className="text-2xs font-semibold uppercase tracking-wide text-[color:var(--pp-violet)]">
            Fulfilling pharmacy
          </p>
          <p className="mt-1 text-sm font-medium text-[color:var(--pp-primary-950)]">{result.pharmacy.name}</p>
          <p className="mt-0.5 text-xs text-ink-secondary">{result.pharmacy.address}</p>
          <p className="mt-1 text-xs text-ink-tertiary">License {result.pharmacy.license}</p>
        </div>

        {hasSameDay && (
          <p className="mt-4 text-sm text-wellness">
            Same-day delivery is available in your area.
          </p>
        )}
      </div>

      <Button type="button" fullWidth onClick={onContinue}>
        See delivery options
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
                <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">{s.label}</span>
                <span className="mt-0.5 block text-xs text-ink-tertiary">{s.eta}</span>
                {s.note && <span className="mt-1 block text-2xs text-ink-tertiary">{s.note}</span>}
              </span>
              <span className="shrink-0 text-sm font-medium text-[color:var(--pp-primary-950)]">{s.price}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-line bg-[color:var(--pp-primary-200)] px-4 py-3 text-sm text-ink-secondary">
        Selected: <span className="font-medium text-[color:var(--pp-primary-950)]">{chosen?.label}</span>
        {" · "}
        {chosen?.eta} · {chosen?.price}
      </div>

      <div className="space-y-2 pt-1">
        <Button type="button" fullWidth onClick={() => nav(signedIn ? "/transfer" : "/get-started")}>
          {signedIn ? "Transfer prescriptions here" : "Create account to continue"}
        </Button>
        <Button type="button" fullWidth variant="secondary" onClick={() => nav(signedIn ? "/fill" : "/login")}>
          {signedIn ? "Fill a prescription" : "Log in"}
        </Button>
        <button
          type="button"
          onClick={onDone}
          className="w-full py-2 text-center text-sm font-medium text-ink-tertiary transition-colors hover:text-[color:var(--pp-primary-950)]"
        >
          Done
        </button>
      </div>
    </section>
  );
}
