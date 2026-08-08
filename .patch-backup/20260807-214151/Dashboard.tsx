import { Link } from "react-router-dom";
import { Card, Badge, Progress, SectionHead } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useUser, greeting } from "@/lib/user";

export function Dashboard() {
  const { displayName } = useUser();
  return (
    <div className="space-y-8">
      <div>
        <p className="text-ink-tertiary">{greeting()},</p>
        <h1 className="font-display text-3xl font-extrabold text-ink">{displayName}</h1>
      </div>

      {/* Today / upcoming tasks */}
      <section>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 md:col-span-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Today's health</p>
              <Badge tone="wellness">On track</Badge>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">Medication adherence · this week</span>
                  <span className="font-semibold text-ink tnum">6/7 days</span>
                </div>
                <Progress value={85} tone="wellness" />
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-surface-1 p-3.5">
                <span className="text-xl">⏰</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Take Ramipril 5mg</p>
                  <p className="text-sm text-ink-tertiary">Due at 8:00 PM</p>
                </div>
                <Button size="sm" variant="wellness">Mark taken</Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="font-semibold text-ink">Next appointment</p>
            <div className="mt-4 rounded-xl bg-primary-subtle p-4">
              <p className="text-sm font-semibold text-primary">Follow-up · Dr. Shah</p>
              <p className="mt-1 text-sm text-ink-secondary">Thu, 14 Aug · 10:30 AM</p>
              <p className="mt-0.5 text-sm text-ink-tertiary">Video consultation</p>
            </div>
            <Button size="sm" variant="secondary" fullWidth className="mt-3">Reschedule</Button>
          </Card>
        </div>
      </section>

      {/* Medications */}
      <section>
        <div className="flex items-center justify-between">
          <SectionHead title="Your medications" />
          <Link to="/pharmacy" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { name: "Ramipril 5mg", meta: "1 tablet daily · 12 left", tone: "wellness" as const, status: "Active" },
            { name: "Birth Control", meta: "Refill ships in 5 days", tone: "info" as const, status: "Auto-refill" },
          ].map((m) => (
            <Card key={m.name} className="flex items-center gap-4 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-subtle text-xl">💊</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{m.name}</p>
                <p className="text-sm text-ink-tertiary">{m.meta}</p>
              </div>
              <Badge tone={m.tone}>{m.status}</Badge>
            </Card>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section>
        <Card className="flex flex-col items-start gap-3 border-accent/30 bg-accent-subtle p-6 sm:flex-row sm:items-center">
          <span className="text-3xl">🌤️</span>
          <div className="flex-1">
            <p className="font-semibold text-ink">Flu season is coming</p>
            <p className="text-sm text-ink-secondary">Book a flu shot at a partner pharmacy near you.</p>
          </div>
          <Button variant="secondary" size="sm">Explore</Button>
        </Card>
      </section>
    </div>
  );
}
