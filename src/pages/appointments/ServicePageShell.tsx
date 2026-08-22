import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

/**
 * Shared transactional layout for hub service pages:
 * left nav (AppShell) · middle detail/input · sticky right price/CTA.
 */
export function ServicePageShell({
  backTo = "/appointments",
  backLabel,
  children,
  aside,
}: {
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();

  return (
    <div>
      <button
        type="button"
        onClick={() => nav(backTo)}
        aria-label={backLabel ?? tx("Back")}
        className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70"
      >
        ‹ {backLabel ?? tx("Back")}
      </button>

      <div
        className={
          aside
            ? "mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:gap-x-8 xl:gap-x-10"
            : "mt-4"
        }
      >
        <div className="min-w-0">{children}</div>
        {aside ? <aside className="h-fit lg:sticky lg:top-28">{aside}</aside> : null}
      </div>
    </div>
  );
}

export function ServiceCtaCard({
  eyebrow,
  title,
  price,
  priceHint,
  body,
  cta,
  onCta,
  ctaDisabled,
  secondary,
  onSecondary,
  footer,
}: {
  eyebrow?: ReactNode;
  title?: string;
  price?: ReactNode;
  priceHint?: string;
  body?: ReactNode;
  cta: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  secondary?: string;
  onSecondary?: () => void;
  footer?: ReactNode;
}) {
  const { tx } = useI18n();
  return (
    <div className="rounded-[1.75rem] border border-[#E6E1EF] bg-white p-5 shadow-[0_12px_40px_rgba(24,7,48,0.05)]">
      {eyebrow ? <div className="text-sm text-ink-tertiary">{eyebrow}</div> : null}
      {title ? (
        <p className="mt-1 text-sm font-semibold text-[color:var(--pp-primary-950)]">{title}</p>
      ) : null}
      {price != null ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-2xs text-ink-tertiary">{priceHint ?? tx("From")}</p>
          <div className="mt-1 font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
            {price}
          </div>
        </div>
      ) : null}
      {body ? <div className="mt-3 text-sm text-ink-secondary">{body}</div> : null}
      <div className="mt-5 space-y-2">
        <Button fullWidth disabled={ctaDisabled} onClick={onCta}>
          {cta}
        </Button>
        {secondary && onSecondary ? (
          <Button fullWidth variant="secondary" onClick={onSecondary}>
            {secondary}
          </Button>
        ) : null}
      </div>
      {footer ? (
        <div className="mt-3 text-center text-2xs leading-relaxed text-ink-tertiary">{footer}</div>
      ) : null}
    </div>
  );
}
