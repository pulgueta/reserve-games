import { describe, expect, it } from "vitest";

import { haversineMeters, sortByDistance } from "./geo";

describe("haversineMeters", () => {
  it("is ~0 for the same point", () => {
    const p = { lat: 4.6097, lng: -74.0817 };
    expect(haversineMeters(p, p)).toBeLessThan(1);
  });

  it("approximates 1° of latitude as ~111 km", () => {
    const d = haversineMeters({ lat: 4, lng: -74 }, { lat: 5, lng: -74 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe("sortByDistance", () => {
  it("orders nearest-first and puts coordless items last", () => {
    const origin = { lat: 4.6097, lng: -74.0817 };
    const items = [
      { id: "far", lat: 5.61, lng: -74.08 },
      { id: "near", lat: 4.62, lng: -74.08 },
      { id: "none" as const },
    ];

    const sorted = sortByDistance(items, origin);

    expect(sorted.map((s) => s.id)).toEqual(["near", "far", "none"]);
    expect(sorted[2].distanceMeters).toBeNull();
  });
});
