/**
 * Pure geo helpers for proximity sorting. No map/geo dependency and no Google
 * tax — just the Haversine formula over device + venue coordinates, run on the
 * already-fetched venue list. Upgrade to the @convex-dev/geospatial component
 * only once a single city's catalog grows past a few hundred venues.
 */

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in meters. */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

interface WithCoords {
  lat?: number;
  lng?: number;
}

/**
 * Returns a new array sorted nearest-first from `origin`, each item annotated
 * with `distanceMeters`. Items without coordinates sort last (distance `null`).
 */
export function sortByDistance<T extends WithCoords>(
  items: readonly T[],
  origin: { lat: number; lng: number },
): (T & { distanceMeters: number | null })[] {
  return items
    .map((item) => ({
      ...item,
      distanceMeters:
        item.lat != null && item.lng != null
          ? haversineMeters(origin, { lat: item.lat, lng: item.lng })
          : null,
    }))
    .sort((a, b) => {
      if (a.distanceMeters === null) return b.distanceMeters === null ? 0 : 1;
      if (b.distanceMeters === null) return -1;
      return a.distanceMeters - b.distanceMeters;
    });
}
