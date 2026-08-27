import { useState } from "react";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { useI18n } from "@/lib/i18n";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";
import {
  listAvailability,
  removeAvailabilitySlot,
  upsertAvailabilitySlot,
} from "@/lib/providerAvailability";
import { WeeklySlotEditor } from "@/components/WeeklySlotEditor";

export function ProviderAvailability() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;
  const home = { label: tx(portal?.homeTitle || "Home"), to: "/provider" };
  const orgId = provider?.id ?? "anon";
  const [slots, setSlots] = useState(() => listAvailability(orgId));

  return (
    <div>
      <ProviderBreadcrumb items={[home, { label: tx("Availability") }]} />

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
