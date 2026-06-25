import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { Sport } from "@convex/schema";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";

type VenueFilters = {
  q?: string;
  sport?: Sport;
  city?: string;
  state?: string;
};

export function activeVenuesQueryOptions(filters: VenueFilters = {}) {
  // Callers pass the route's full search object (which also carries date/time
  // for the booking flow); forward only the fields getActive validates.
  const { q, sport, city, state } = filters;
  return convexQuery(api.venues.getActive, { q, sport, city, state });
}

export function venueDetailQueryOptions(uuid: string) {
  return convexQuery(api.venues.getDetail, { uuid });
}

/** The venue mirroring a Clerk organization (one org = one venue). `orgId` is
 * the active org; pass `null`/"" to skip the query (no active org yet). */
export function venueByOrgQueryOptions(orgId: string | null | undefined) {
  return convexQuery(api.venues.getByOrg, orgId ? { orgId } : "skip");
}

/** Everything the venue editor needs (venue + active units + equipment) for the
 * active org. Owner-only; `null`/"" skips the query. */
export function venueEditorQueryOptions(orgId: string | null | undefined) {
  return convexQuery(api.venues.getEditorData, orgId ? { orgId } : "skip");
}

/** Aggregate-backed headline stats (revenue/bookings/upcoming) for a venue. */
export function venueStatsQueryOptions(
  venueId: string,
  period: "week" | "month",
) {
  return convexQuery(api.bookings.getVenueStats, {
    venueId: venueId as Id<"venues">,
    period,
  });
}

/** Active venues nearest a point, optionally narrowed by sport. Pass `null` to
 * skip (no geolocation yet). */
export function nearestVenuesQueryOptions(
  args: {
    latitude: number;
    longitude: number;
    sport?: Sport;
    maxDistanceMeters?: number;
    limit?: number;
  } | null,
) {
  return convexQuery(api.venues.nearest, args ?? "skip");
}

/** Geolocation-driven nearest venues; non-suspense (depends on runtime coords),
 * skipped until the user shares their location. */
export function useNearestVenues(
  args: { latitude: number; longitude: number; sport?: Sport } | null,
) {
  return useQuery(nearestVenuesQueryOptions(args));
}

/** Live list of active venues, optionally filtered by q/sport/city/state. */
export function useActiveVenues(filters: VenueFilters = {}) {
  return useSuspenseQuery(activeVenuesQueryOptions(filters));
}

/** The venue for an org (the active venue of the admin/staff). */
export function useVenueByOrg(orgId: string | null | undefined) {
  return useQuery(venueByOrgQueryOptions(orgId));
}

/** Suspense read of a venue's full detail. Route loaders prefetch the same
 * factory, so this is a cache hit — no waterfall, no spinner. */
export function useVenueDetail(uuid: string) {
  return useSuspenseQuery(venueDetailQueryOptions(uuid));
}

/** Suspense variant of {@link useVenueByOrg} for call sites that always have an
 * active org and whose loader prefetched the venue (lets them drop the
 * `isLoading` guard in favor of a Suspense boundary). */
export function useVenueByOrgSuspense(orgId: string) {
  return useSuspenseQuery(venueByOrgQueryOptions(orgId));
}

/** Suspense read of the venue editor payload for an org (loader prefetches it). */
export function useVenueEditorData(orgId: string) {
  return useSuspenseQuery(venueEditorQueryOptions(orgId));
}

/** Aggregate-backed stats for a venue; re-runs (no Suspense) as period toggles. */
export function useVenueStats(venueId: string, period: "week" | "month") {
  return useQuery(venueStatsQueryOptions(venueId, period));
}

export function useVenueActions() {
  const updateVenue = useMutation({
    mutationFn: useConvexMutation(api.venues.update),
  });
  const setEquipment = useMutation({
    mutationFn: useConvexMutation(api.rentalEquipment.setForVenue),
  });
  const setUnits = useMutation({
    mutationFn: useConvexMutation(api.venueUnits.setForVenue),
  });

  return { updateVenue, setEquipment, setUnits };
}
