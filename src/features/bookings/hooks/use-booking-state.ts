import type { RentalEquipment, Venue, VenueUnit } from "@convex/schema";
import { useState } from "react";

import { useDayBookings } from "@/features/bookings/hooks/use-bookings";
import {
  buildSlots,
  dayStartMs,
  maxDurationFrom,
  occupiedHours,
  parseHour,
  todayISO,
} from "@/features/bookings/lib/availability";

/**
 * Owns all booking-selection state (unit, date, start, duration, add-ons) and
 * derives availability + pricing from it. Extracting this keeps BookingFlow a
 * thin composition and lets each picker stay a pure leaf the compiler can
 * optimize independently.
 */
export function useBookingState(
  venue: Venue,
  units: VenueUnit[],
  equipment: RentalEquipment[],
) {
  const [unitId, setUnitId] = useState<VenueUnit["_id"] | null>(
    units[0]?._id ?? null,
  );
  const [date, setDate] = useState(todayISO);
  const [start, setStart] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(
    () => new Set(),
  );
  // Captured once per mount so render stays pure; the backend re-validates the
  // slot on submit, so a frozen "now" is safe for a booking session.
  const [nowMs] = useState(() => Date.now());

  const dayStart = dayStartMs(date);
  const { data: dayBookings } = useDayBookings(venue._id, dayStart);
  const bookings = dayBookings ?? [];
  const closeHour = parseHour(venue.closeAt);

  const slots = buildSlots({
    openAt: venue.openAt,
    closeAt: venue.closeAt,
    dateStr: date,
    nowMs,
    bookings,
    unitId,
  });
  const occupied = occupiedHours(bookings, unitId);
  const maxDuration =
    start === null ? 0 : maxDurationFrom(start, closeHour, occupied);
  const effectiveDuration = Math.min(duration, Math.max(1, maxDuration));

  const addOns = equipment.filter((e) => selectedAddOns.has(e._id));
  const subtotal = venue.pricePerHour * effectiveDuration;
  const addOnsTotal = addOns.reduce(
    (sum, e) => sum + e.pricePerHour * effectiveDuration,
    0,
  );
  const total = subtotal + addOnsTotal;

  const durationOptions = Array.from(
    { length: Math.max(1, Math.min(4, maxDuration || 4)) },
    (_, i) => i + 1,
  );

  const selectUnit = (id: VenueUnit["_id"]) => {
    setUnitId(id);
    setStart(null);
  };

  const toggleAddOn = (id: string) =>
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const pickStart = (hour: number) => {
    setStart(hour);
    setDuration((d) =>
      Math.min(d, Math.max(1, maxDurationFrom(hour, closeHour, occupied))),
    );
  };

  const onDateChange = (value: string) => {
    setDate(value);
    setStart(null);
  };

  return {
    unitId,
    date,
    start,
    selectedAddOns,
    dayStart,
    slots,
    effectiveDuration,
    addOns,
    subtotal,
    total,
    durationOptions,
    selectUnit,
    setDuration,
    toggleAddOn,
    pickStart,
    onDateChange,
  };
}
