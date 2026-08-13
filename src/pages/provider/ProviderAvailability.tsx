import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import {
  listAvailability,
  removeAvailabilitySlot,
  upsertAvailabilitySlot,
} from "@/lib/providerAvailability";
import { WeeklySlotEditor } from "@/components/WeeklySlotEditor";

export function ProviderAvailability() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const orgId = provider?.id ?? "anon";
  const [slots, setSlots] = useState(() => listAvailability(orgId));

  return (
    <div>
      <header className="mb-8">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Availability")}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
          {tx("When you work")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">
          {tx("Add weekly windows with day, start, and end — patients see these clearly.")}
        </p>
      </header>

      <WeeklySlotEditor
        slots={slots}
        onAdd={({ day, window }) => {
          setSlots(upsertAvailabilitySlot(orgId, { day, window }));
        }}
        onRemove={(id) => setSlots(removeAvailabilitySlot(orgId, id))}
      />
    </div>
  );
}
