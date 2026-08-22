import { useEffect, useMemo, useRef, useState } from "react";
import {
  asSlotVisitType,
  firstOpenSlot,
  hasOpenSlot,
  slotsByVisitType,
  upcomingDays,
  weekOffsetFor,
  type DaySlots,
  type VisitType,
} from "@/lib/appointments";
import { isPastDate, isSlotInPast, todayIso } from "@/lib/timeSlots";

export function useAvailabilityPicker(entityId: string, visit: string) {
  const visitType: VisitType = asSlotVisitType(visit);
  const firstOpen = firstOpenSlot(entityId, todayIso(), visitType);
  const [weekOffset, setWeekOffset] = useState(() => (firstOpen ? weekOffsetFor(firstOpen.date) : 0));
  const days = useMemo(() => upcomingDays(7, weekOffset), [weekOffset]);
  const [date, setDate] = useState(() => firstOpen?.date ?? todayIso());
  const [time, setTime] = useState("");
  const [holdEmpty, setHoldEmpty] = useState(false);
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setClock((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const prevEntity = useRef(entityId);
  const prevVisit = useRef(visitType);

  useEffect(() => {
    if (prevEntity.current === entityId) return;
    prevEntity.current = entityId;
    const next = firstOpenSlot(entityId, todayIso(), visitType);
    setDate(next?.date ?? todayIso());
    setWeekOffset(next ? weekOffsetFor(next.date) : 0);
    setTime("");
    setHoldEmpty(false);
  }, [entityId, visitType]);

  useEffect(() => {
    if (prevVisit.current === visitType) return;
    prevVisit.current = visitType;
    setTime("");
    setHoldEmpty(false);
  }, [visitType]);

  useEffect(() => {
    if (isPastDate(date)) {
      setHoldEmpty(false);
      const next = firstOpenSlot(entityId, todayIso(), visitType);
      setDate(next?.date ?? todayIso());
      setWeekOffset(next ? weekOffsetFor(next.date) : 0);
      setTime("");
      return;
    }
    if (time && isSlotInPast(date, time)) setTime("");
  }, [date, time, entityId, visitType]);

  useEffect(() => {
    if (holdEmpty) return;
    if (hasOpenSlot(entityId, date, visitType)) return;
    const next = firstOpenSlot(entityId, date, visitType);
    if (!next || next.date === date) return;
    setDate(next.date);
    setWeekOffset(weekOffsetFor(next.date));
    setTime("");
  }, [clock, date, visitType, entityId, holdEmpty]);

  const slots: DaySlots = useMemo(
    () => slotsByVisitType(entityId, date, visitType),
    [entityId, date, visitType],
  );

  const selectDay = (d: string) => {
    if (isPastDate(d)) return;
    setDate(d);
    setTime("");
    setHoldEmpty(!hasOpenSlot(entityId, d, visitType));
  };

  const shiftWeek = (delta: number) => {
    const nextOffset = Math.max(0, weekOffset + delta);
    setWeekOffset(nextOffset);
    setHoldEmpty(false);
    const nextDays = upcomingDays(7, nextOffset);
    const start = nextDays[0]?.date ?? todayIso();
    const next = firstOpenSlot(entityId, start, visitType);
    setDate(next?.date ?? start);
    if (next) setWeekOffset(weekOffsetFor(next.date));
    setTime("");
  };

  return { date, time, days, weekOffset, slots, selectDay, selectTime: setTime, shiftWeek };
}
