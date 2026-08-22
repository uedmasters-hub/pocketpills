import { useEffect, useMemo, useState } from "react";
import {
  AvailabilityBoard,
  AvailabilityLocationSelect,
  AvailabilityMonthSyncControl,
} from "@/components/appointments/AvailabilityBoard";
import { ConfirmModal } from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n";
import { SLOT_BANDS, upcomingDays } from "@/lib/appointments";
import {
  conflictingSlotsForVisit,
  monthAvailabilityIsSynced,
  normalizeSlotAvailability,
  setSlotsForAvailabilityDate,
  setSlotsForAvailabilityMonth,
  slotsForAvailabilityDate,
  type BusinessDaySchedule,
  type BusinessSlotAvailability,
  type SlotVisitKey,
} from "@/lib/businessProfile";
import { rememberVerifiedFacility, hfProfileId } from "@/lib/facilityDirectory";
import { lookupHfFacility, normalizeHfCode } from "@/lib/hfApi";
import { isPastDate, monthKey, monthLong, todayIso } from "@/lib/timeSlots";

function daySlotsFromStarts(starts: string[]) {
  const set = new Set(starts);
  return {
    morning: SLOT_BANDS.morning.filter((t) => set.has(t)),
    afternoon: SLOT_BANDS.afternoon.filter((t) => set.has(t)),
    evening: SLOT_BANDS.evening.filter((t) => set.has(t)),
  };
}

function branchLabel(name: string, place?: string) {
  const n = name.trim();
  const p = (place || "").trim();
  if (n && p && !n.toLowerCase().includes(p.toLowerCase())) return `${n} • ${p}`;
  return n || p;
}

/** Listing/provider adapter: same AvailabilityBoard, configure or display. */
export function AvailabilityHoursEditor({
  schedule,
  onChange,
  title = "Availability",
  onTitleChange,
  city,
  locations,
  licenseNumber,
  slotAvailability,
  readOnly = false,
}: {
  schedule: BusinessDaySchedule[];
  onChange: (schedule: BusinessDaySchedule[], slotAvailability: BusinessSlotAvailability) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  city?: string;
  locations?: { id: string; label: string }[];
  licenseNumber?: string;
  slotAvailability?: BusinessSlotAvailability;
  readOnly?: boolean;
}) {
  const { tx } = useI18n();
  const availability = normalizeSlotAvailability(slotAvailability, schedule);
  const [registryBranch, setRegistryBranch] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    if (locations?.length) {
      setRegistryBranch(null);
      return;
    }
    const code = normalizeHfCode(licenseNumber || "");
    if (!code) {
      setRegistryBranch(null);
      return;
    }
    let cancelled = false;
    void lookupHfFacility(code).then((res) => {
      if (cancelled || !res.ok) return;
      rememberVerifiedFacility({
        hfCode: res.data.hfCode,
        name: res.data.nameHint,
        district: res.data.district,
        facilityLevel: res.data.facilityLevel,
      });
      setRegistryBranch({
        id: hfProfileId(res.data.hfCode),
        label: branchLabel(res.data.nameHint, res.data.district),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [licenseNumber, locations]);

  const branches = locations?.length
    ? locations
    : registryBranch
      ? [registryBranch]
      : city?.trim()
        ? [{ id: "primary", label: city.trim() }]
        : [];

  const [visit, setVisit] = useState<SlotVisitKey>("clinic");
  const [weekOffset, setWeekOffset] = useState(0);
  const [date, setDate] = useState(todayIso);
  const [locationId, setLocationId] = useState(branches[0]?.id ?? "");
  const [monthSync, setMonthSync] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const days = useMemo(() => upcomingDays(7, weekOffset), [weekOffset]);

  useEffect(() => {
    if (!branches.length) {
      setLocationId("");
      return;
    }
    if (!branches.some((b) => b.id === locationId)) {
      setLocationId(branches[0].id);
    }
  }, [branches, locationId]);

  // Visit / branch change leaves individual-edit mode.
  useEffect(() => {
    setMonthSync(false);
  }, [visit, locationId]);

  const loc = visit === "clinic" ? locationId || undefined : undefined;
  const starts = slotsForAvailabilityDate(availability, schedule, date, visit, loc);
  const conflicts = conflictingSlotsForVisit(availability, schedule, date, visit, loc);
  const blockedSlots = useMemo(() => {
    const reason =
      visit === "clinic"
        ? tx("Already selected as Virtual booking")
        : tx("Already selected as In-person booking");
    const out: Record<string, string> = {};
    for (const t of conflicts) out[t] = reason;
    return out;
  }, [conflicts, visit, tx]);

  // If the month drifts from this day's pattern, clear the sync flag.
  useEffect(() => {
    if (!monthSync || readOnly) return;
    if (!monthAvailabilityIsSynced(availability, schedule, date, visit, starts, loc)) {
      setMonthSync(false);
    }
  }, [availability, schedule, date, visit, starts, loc, monthSync, readOnly]);

  const commitDay = (iso: string, nextStarts: string[]) => {
    const filtered = nextStarts.filter((t) => !blockedSlots[t]);
    const next = setSlotsForAvailabilityDate(availability, schedule, iso, visit, filtered, loc);
    onChange(next.schedule, next.availability);
  };

  const commitMonth = (iso: string, nextStarts: string[]) => {
    const filtered = nextStarts.filter((t) => !blockedSlots[t]);
    const next = setSlotsForAvailabilityMonth(availability, schedule, iso, visit, filtered, loc);
    onChange(next.schedule, next.availability);
    setMonthSync(true);
  };

  const onPaint = (nextStarts: string[]) => {
    if (monthSync) {
      commitMonth(date, nextStarts);
      return;
    }
    commitDay(date, nextStarts);
    // Individual edit while month looked synced → stay unchecked.
    setMonthSync(false);
  };

  const selectDay = (next: string) => {
    if (next !== date) {
      // Changing day exits month-sync so the next paint is per-day unless they re-check.
      setMonthSync(false);
    }
    setDate(next);
  };

  const requestMonthSync = (checked: boolean) => {
    if (!checked) {
      setMonthSync(false);
      return;
    }
    setConfirmOpen(true);
  };

  const confirmMonthSync = () => {
    commitMonth(date, starts);
    setConfirmOpen(false);
  };

  const shiftWeek = (delta: number) => {
    const nextOffset = Math.max(0, weekOffset + delta);
    setWeekOffset(nextOffset);
    const nextDays = upcomingDays(7, nextOffset);
    if (nextDays.some((day) => day.date === date)) return;
    const pick = nextDays.find((day) => !isPastDate(day.date)) ?? nextDays[0];
    if (pick) {
      setMonthSync(false);
      setDate(pick.date);
    }
  };

  const visitOptions = [
    { id: "clinic" as const, label: tx("In person") },
    { id: "virtual" as const, label: tx("Virtual") },
  ];

  const showLocation = visit === "clinic" && branches.length > 0;
  const monthName = monthLong(date);

  const monthSyncControl = readOnly ? null : (
    <AvailabilityMonthSyncControl checked={monthSync} onCheckedChange={requestMonthSync} />
  );

  return (
    <>
      <AvailabilityBoard
        mode={readOnly ? "display" : "configure"}
        title={title}
        onTitleChange={onTitleChange}
        visitOptions={visitOptions}
        visitType={visit}
        onSelectVisit={(id) => setVisit(id as SlotVisitKey)}
        monthSyncControl={monthSyncControl}
        location={
          showLocation ? (
            <AvailabilityLocationSelect
              options={branches}
              value={locationId || branches[0].id}
              onChange={setLocationId}
            />
          ) : null
        }
        date={date}
        days={days}
        weekOffset={weekOffset}
        slots={daySlotsFromStarts(starts)}
        onSelectDay={selectDay}
        onShiftWeek={shiftWeek}
        blockedSlots={blockedSlots}
        onPaintSlots={readOnly ? undefined : onPaint}
      />

      <ConfirmModal
        open={confirmOpen}
        title={tx("Sync this month?")}
        body={tx(
          `Apply this day’s ${visit === "clinic" ? "In person" : "Virtual"} hours to every remaining day in ${monthName}? Custom days in ${monthKey(date)} will be overwritten.`,
        )}
        confirmLabel={tx("Sync month")}
        cancelLabel={tx("Cancel")}
        onConfirm={confirmMonthSync}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
