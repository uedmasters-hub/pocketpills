import { useNavigate } from "react-router-dom";
import { FlowLayout } from "@/components/layout/FlowLayout";
import { Card, Badge, Field, Switch } from "@/components/ui";
import { useJourney } from "@/lib/journey";
import { treatments } from "@/lib/data";

function useTreatment() {
  const { treatmentSlug } = useJourney();
  return treatments.find((t) => t.slug === treatmentSlug) ?? null;
}

const LIST_PRICE = 42;
const INSURANCE_COVERED = 30;

/* ── Medication review + insurance ──────────────────────── */
export function MedicationReview() {
  const nav = useNavigate();
  const t = useTreatment();
  const { useInsurance, setUseInsurance } = useJourney();

  return (
    <FlowLayout
      step="medication"
      title="Your medication"
      subtitle="Prescribed and ready to fill. Apply insurance to see your covered price."
      back="/care/doctor"
      onContinue={() => nav("/care/checkout")}
      continueLabel="Go to checkout"
    >
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-subtle text-3xl">
              {t?.emoji ?? "💊"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ink">{t?.name} treatment</p>
                <Badge tone="wellness">3-month supply</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-tertiary">Auto-refills before you run out. Cancel anytime.</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <Switch
            checked={useInsurance}
            onChange={setUseInsurance}
            label="Apply insurance"
            desc="Sun Life · Group 4402 · verified"
          />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-secondary">Medication</span>
            <span className="text-ink tnum">${LIST_PRICE.toFixed(2)}</span>
          </div>
          {useInsurance && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-wellness">Insurance covers</span>
              <span className="text-wellness tnum">−${INSURANCE_COVERED.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-ink-secondary">Delivery</span>
            <span className="text-wellness">Free</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="font-semibold text-ink">You pay today</span>
            <span className="font-display text-xl font-medium text-ink tnum">
              ${(useInsurance ? LIST_PRICE - INSURANCE_COVERED : LIST_PRICE).toFixed(2)}
            </span>
          </div>
        </Card>
      </div>
    </FlowLayout>
  );
}

/* ── Checkout ───────────────────────────────────────────── */
export function Checkout() {
  const nav = useNavigate();
  const { useInsurance } = useJourney();
  const total = useInsurance ? LIST_PRICE - INSURANCE_COVERED : LIST_PRICE;

  return (
    <FlowLayout
      step="checkout"
      title="Delivery & payment"
      subtitle="Free delivery across Canada. You won't be charged until your order ships."
      back="/care/medication"
      onContinue={() => nav("/care/confirmation")}
      continueLabel={`Place order · $${total.toFixed(2)}`}
    >
      <div className="space-y-4">
        <Card className="p-5">
          <p className="mb-3 font-semibold text-ink">Deliver to</p>
          <div className="space-y-3">
            <Field label="Full name" placeholder="Alex Chen" defaultValue="Alex Chen" />
            <Field label="Address" placeholder="221 King St W, Toronto, ON" defaultValue="221 King St W, Toronto, ON" />
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-semibold text-ink">Payment</p>
          <Field label="Card number" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" inputMode="numeric" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Expiry" placeholder="12 / 27" defaultValue="12 / 27" />
            <Field label="CVC" placeholder="123" defaultValue="123" inputMode="numeric" />
          </div>
          <p className="mt-3 text-xs text-ink-tertiary">🔒 Demo checkout — no real payment is processed.</p>
        </Card>
      </div>
    </FlowLayout>
  );
}
