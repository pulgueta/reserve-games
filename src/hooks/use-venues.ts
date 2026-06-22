import { api } from "@convex/_generated/api";
import type { Venue } from "@convex/schema";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

type VenueFilters = { city?: string; state?: string };

export function activeVenuesQueryOptions(filters: VenueFilters = {}) {
  return convexQuery(api.venues.getActive, filters);
}

export function venueByIdQueryOptions(id: Venue["_id"]) {
  return convexQuery(api.venues.getById, { id });
}

export function myVenuesQueryOptions() {
  return convexQuery(api.venues.getByOwner, {});
}

/** Live list of active venues, optionally filtered by city/state. */
export function useActiveVenues(filters: VenueFilters = {}) {
  return useSuspenseQuery(activeVenuesQueryOptions(filters));
}

/** A single venue by id. */
export function useVenue(id: Venue["_id"]) {
  return useSuspenseQuery(venueByIdQueryOptions(id));
}

/** The authenticated owner's venues. */
export function useMyVenues() {
  return useSuspenseQuery(myVenuesQueryOptions());
}

export function useVenueActions() {
  const createVenue = useMutation({
    mutationFn: useConvexMutation(api.venues.create),
  });
  const updateVenue = useMutation({
    mutationFn: useConvexMutation(api.venues.update),
  });
  const removeVenue = useMutation({
    mutationFn: useConvexMutation(api.venues.remove),
  });

  return { createVenue, updateVenue, removeVenue };
}
