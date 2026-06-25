import { describe, expect, it } from "vitest";

import {
  buildSlots,
  type DayBooking,
  maxDurationFrom,
  occupiedHours,
  parseHour,
} from "./availability";

describe("availability", () => {
  it("collects occupied hours per unit", () => {
    const bookings: DayBooking[] = [
      { unitId: "a", date: hourMs("2026-06-23", 19), durationHours: 2 },
      { unitId: "b", date: hourMs("2026-06-23", 10), durationHours: 1 },
    ];
    expect([...occupiedHours(bookings, "a")].sort()).toEqual([19, 20]);
    expect([...occupiedHours(bookings, "b")]).toEqual([10]);
    expect(occupiedHours(bookings, null).size).toBe(0);
  });

  it("caps free duration at close, next booking, and the max cap", () => {
    const occupied = new Set([20]); // 8pm taken
    expect(maxDurationFrom(18, 22, occupied)).toBe(2); // 18,19 then 20 blocks
    expect(maxDurationFrom(8, 22, new Set())).toBe(4); // capped at 4
    expect(maxDurationFrom(21, 22, new Set())).toBe(1); // 1h before close
  });

  it("disables past and taken slots", () => {
    const slots = buildSlots({
      openAt: "08:00",
      closeAt: "12:00",
      dateStr: "2026-06-23",
      nowMs: hourMs("2026-06-23", 10), // 10am now
      bookings: [
        { unitId: null, date: hourMs("2026-06-23", 11), durationHours: 1 },
      ],
      unitId: null,
    });
    const byHour = Object.fromEntries(slots.map((s) => [s.hour, s.disabled]));
    expect(byHour[8]).toBe(true); // past
    expect(byHour[9]).toBe(true); // past
    expect(byHour[10]).toBe(false); // now, free
    expect(byHour[11]).toBe(true); // taken
  });

  it("parses the hour from HH:mm", () => {
    expect(parseHour("19:30")).toBe(19);
  });
});

function hourMs(dateStr: string, hour: number): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, hour, 0, 0, 0).getTime();
}
