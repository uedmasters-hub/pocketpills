import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  confirmProviderPasswordReset,
  requestProviderPasswordReset,
} from "@/lib/providerDelegates";

const FIELD =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-secondary";

/**
 * Demo provider password reset — shows a one-time code (no real email).
 */
export function ProviderPasswordResetPanel({
  ownerId,
  emailHint,
  onDone,
  onCancel,
}: {
  ownerId?: string;
  emailHint?: string;
  onDone: (info: { ownerId: string; newPassword: string }) => void;
  onCancel: () => void;
}) {
  const { tx } = useI18n();
  const [email, setEmail] = useState(emailHint ?? "");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"request" | "confirm">(ownerId ? "request" : "request");

  const sendCode = () => {
    setError("");
    const res = requestProviderPasswordReset({
      ownerId,
      email: email.trim() || emailHint,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDemoCode(res.code);
    setSentTo(res.email);
    setStep("confirm");
  };

  const submitReset = () => {
    setError("");
    if (newPassword !== confirm) {
      setError(tx("Passwords do not match."));
      return;
    }
    const res = confirmProviderPasswordReset({
      ownerId,
      code,
      newPassword,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone({ ownerId: res.ownerId, newPassword: newPassword.trim() });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
          {tx("Reset password")}
        </h3>
        <p className="mt-1 text-sm text-ink-secondary">
          {tx("We’ll generate a one-time code for your work email (demo — shown on screen).")}
        </p>
      </div>

      {step === "request" ? (
        <>
          {!ownerId ? (
            <label className="block">
              <span className={LABEL}>{tx("Work email")}</span>
              <input
                className={FIELD}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.ca"
              />
            </label>
          ) : (
            <p className="rounded-xl bg-[color:var(--pp-primary-100)]/50 px-3.5 py-3 text-sm text-ink-secondary">
              {tx("Resetting password for")}{" "}
              <span className="font-medium text-[color:var(--pp-primary-950)]">
                {emailHint || tx("main account")}
              </span>
            </p>
          )}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="!h-9 !px-4 !py-0" onClick={sendCode}>
              {tx("Send reset code")}
            </Button>
            <Button size="sm" variant="outline" className="!h-9 !px-4 !py-0" onClick={onCancel}>
              {tx("Back")}
            </Button>
          </div>
        </>
      ) : (
        <>
          {demoCode ? (
            <p className="rounded-xl border border-line bg-[color:var(--pp-page)] px-3.5 py-3 text-sm text-ink-secondary">
              {tx("Demo code for")}{" "}
              <span className="font-medium text-[color:var(--pp-primary-950)]">{sentTo}</span>
              :{" "}
              <span className="font-semibold tracking-widest text-[color:var(--pp-primary-950)]">
                {demoCode}
              </span>
            </p>
          ) : null}
          <label className="block">
            <span className={LABEL}>{tx("Reset code")}</span>
            <input
              className={FIELD}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </label>
          <label className="block">
            <span className={LABEL}>{tx("New password")}</span>
            <input
              className={FIELD}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className={LABEL}>{tx("Confirm password")}</span>
            <input
              className={FIELD}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="!h-9 !px-4 !py-0" onClick={submitReset}>
              {tx("Update password")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="!h-9 !px-4 !py-0"
              onClick={() => {
                setStep("request");
                setDemoCode(null);
                setCode("");
                setError("");
              }}
            >
              {tx("Back")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
