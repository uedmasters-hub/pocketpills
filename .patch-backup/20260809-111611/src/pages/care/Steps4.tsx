import { useNavigate } from "react-router-dom";
import { FlowLayout } from "@/components/layout/FlowLayout";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui";
import { useJourney } from "@/lib/journey";
import { treatments } from "@/lib/data";

/* ── Confirmation ───────────────────────────────────────── */
export function Confirmation() {
  const nav = useNavigate();
  const { treatmentSlug, reset } = useJourney();
  const t = treatments.find((x) => x.slug === treatmentSlug);

  const finish = (to: string) => {
    reset();
    nav(to);
  };

  return (
    <FlowLayout step="confirmation" title="" hideFooter>
      <div className="animate-fade-up text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-wellness-subtle text-3xl">
          🎉
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink">Order confirmed</h1>
        <p className="mt-2 text-ink-secondary">
          Your {t?.name.toLowerCase()} treatment is being prepared. We'll text you when it ships.
        </p>

        <Card className="mt-8 p-6 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-tertiary">Order</span>
            <span className="font-semibold text-ink tnum">#PP-48210</span>
          </div>

          {/* Delivery tracking timeline */}
          <ol className="mt-5 space-y-0">
            {[
              { label: "Order placed", meta: "Just now", state: "done" },
              { label: "Pharmacist verifying", meta: "Within 1 hour", state: "active" },
              { label: "Packed & shipped", meta: "Tomorrow", state: "todo" },
              { label: "Delivered", meta: "Est. Fri, 2 days", state: "todo" },
            ].map((s, i, arr) => (
              <li key={s.label} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span
                    className={
                      "grid h-6 w-6 place-items-center rounded-full text-2xs font-bold " +
                      (s.state === "done"
                        ? "bg-wellness text-white"
                        : s.state === "active"
                          ? "bg-primary text-[color:var(--color-primary-fg)]"
                          : "border-2 border-line bg-surface-2 text-ink-tertiary")
                    }
                  >
                    {s.state === "done" ? "✓" : i + 1}
                  </span>
                  {i < arr.length - 1 && <span className="my-1 w-0.5 flex-1 bg-line" style={{ minHeight: 24 }} />}
                </div>
                <div className="pb-4">
                  <p className={"font-semibold " + (s.state === "todo" ? "text-ink-tertiary" : "text-ink")}>
                    {s.label}
                  </p>
                  <p className="text-sm text-ink-tertiary">{s.meta}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="wellness" onClick={() => finish("/dashboard")}>Go to My Health</Button>
          <Button variant="secondary" onClick={() => finish("/pharmacy")}>Track this order</Button>
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-surface-1 p-5 text-left">
          <Badge tone="accent">What's next</Badge>
          <p className="mt-2 font-semibold text-ink">Care doesn't stop at delivery</p>
          <p className="mt-1 text-sm text-ink-secondary">
            We'll set up reminders, track your progress, and check in before your refill is due — so
            staying on treatment is effortless.
          </p>
        </div>
      </div>
    </FlowLayout>
  );
}

