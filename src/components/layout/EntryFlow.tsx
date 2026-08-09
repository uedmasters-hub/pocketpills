import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui";

interface EntryFlowProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  step: number; // 1-indexed
  total: number;
  children: ReactNode;
  onBack?: () => void;
  backTo?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideNav?: boolean;
}

export function EntryFlow({
  eyebrow,
  title,
  subtitle,
  step,
  total,
  children,
  onBack,
  backTo = "/app",
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  hideNav,
}: EntryFlowProps) {
  const nav = useNavigate();
  const pct = (step / total) * 100;

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-8">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="pp-caps text-[color:var(--pp-violet)]">{eyebrow}</p>
          <p className="text-xs font-medium text-ink-tertiary tnum">Step {step} of {total}</p>
        </div>
        <Progress value={pct} />
      </div>

      <div className="animate-fade-up">
        <h1 className="text-2xl font-medium text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-ink-secondary">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>

      {!hideNav && (
        <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-2/95 p-3 shadow-float backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <Button variant="secondary" onClick={() => (onBack ? onBack() : nav(backTo))}>← Back</Button>
          {onNext && <Button onClick={onNext} disabled={nextDisabled}>{nextLabel}</Button>}
        </div>
      )}
    </div>
  );
}
