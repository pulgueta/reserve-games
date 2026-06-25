/**
 * Spatial index of venue locations, keyed by venue _id, for "nearest venues"
 * search. The `sport` filter key lets `nearest()` narrow by sport inside the
 * index. Written from `venues.update`: insert when an active venue has coords,
 * remove when it loses coords or is deactivated — so only active, locatable
 * venues are ever returned.
 */
import { GeospatialIndex } from "@convex-dev/geospatial";

import { components } from "./_generated/api";
import type { Venue } from "./schema";

export const venueGeospatial = new GeospatialIndex<
  Venue["_id"],
  { sport: string }
>(components.geospatial);
