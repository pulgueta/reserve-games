/**
 * Pure helpers for the booking flow's slot availability. Hours are local 24h
 * integers; a booking occupies `[startHour, startHour + durationHours)`.
 */

export interface DayBooking {
  unitId: string | null;
  /** Epoch ms of the booking start. */
  date: number;
  durationHours: number;
}

export interface Slot {
  hour: number;
  disabled: boolean;
}

const HOUR_MS = 60 * 60 * 1000;

/** Local-midnight epoch ms for a `yyyy-mm-dd` string. */
export function dayStartMs(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

/** The "HH" hour of an `HH:mm` string. */
export function parseHour(hhmm: string): number {
  return Number(hhmm.split(":")[0]);
}

function hourFromMs(ms: number): number {
  return new Date(ms).getHours();
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
}

/** The set of hours occupied by existing bookings for one unit (null = no unit). */
export function occupiedHours(
  bookings: DayBooking[],
  unitId: string | null,
): Set<number> {
  const occupied = new Set<number>();
  for (const booking of bookings) {
    if ((booking.unitId ?? null) !== (unitId ?? null)) continue;
    const start = hourFromMs(booking.date);
    for (let h = start; h < start + booking.durationHours; h++) {
      occupied.add(h);
    }
  }
  return occupied;
}

/** Free consecutive hours bookable from `start` until close or the next booking. */
export function maxDurationFrom(
  start: number,
  closeHour: number,
  occupied: Set<number>,
  cap = 4,
): number {
  let duration = 0;
  for (let h = start; h < closeHour && duration < cap; h++) {
    if (occupied.has(h)) break;
    duration++;
  }
  return duration;
}

/** Selectable start-hour slots for a day, with past/taken ones disabled. */
export function buildSlots(opts: {
  openAt: string;
  closeAt: string;
  dateStr: string;
  nowMs: number;
  bookings: DayBooking[];
  unitId: string | null;
}): Slot[] {
  const openHour = parseHour(opts.openAt);
  const closeHour = parseHour(opts.closeAt);
  const occupied = occupiedHours(opts.bookings, opts.unitId);
  const start = dayStartMs(opts.dateStr);

  // Last start hour must leave room for at least one hour before close.
  return range(openHour, closeHour).map((hour) => {
    const slotMs = start + hour * HOUR_MS;
    return {
      hour,
      disabled: slotMs < opts.nowMs || occupied.has(hour),
    };
  });
}
