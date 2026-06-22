const MINUTE = 60 * 1000;

/**
 * Cache tiers (in ms) for TanStack Query `staleTime`/`gcTime`. Convex queries
 * stay live over the websocket regardless, so these mostly tune how long an
 * unmounted query's data is kept around for instant back-navigation.
 */
export const cacheTime = {
  low: 5 * MINUTE,
  medium: 30 * MINUTE,
  high: 60 * MINUTE,
  extreme: 4 * 60 * MINUTE,
};
