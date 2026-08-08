import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { JourneyStepper } from "@/components/JourneyStepper";
import type { CareStepKey } from "@/lib/journey";

interface FlowLayoutProps {
  step: CareStepKey;
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: string;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  hideFooter?: boolean;
}

export function FlowLayout({
  step,
  title,
  subtitle,
  children,
  back,
  onContinue,
  continueLabel = "Continue",
  continueDisabled,
  hideFooter,
}: FlowLayoutProps) {
  const nav = useNavigate();
  return (
    <div className="mx-auto w-full max-w-3xl">
      <JourneyStepper current={step} />
      <div className="animate-fade-up">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-ink-secondary">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>

      {!hideFooter && (
        <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-2/95 p-3 shadow-float backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          {back ? (
            <Button variant="secondary" onClick={() => nav(back)}>← Back</Button>
          ) : (
            <span />
          )}
          {onContinue && (
            <Button onClick={onContinue} disabled={continueDisabled}>{continueLabel}</Button>
          )}
        </div>
      )}
    </div>
  );
}
