import { api } from "@convex/_generated/api";
import type { Venue } from "@convex/schema";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";

export function myBookingsQueryOptions() {
  return convexQuery(api.bookings.getMine, {});
}

export function dayBookingsQueryOptions(
  venueId: Venue["_id"],
  dayStart: number,
) {
  return convexQuery(api.bookings.getDayBookings, { venueId, dayStart });
}

/** Same-day bookings for a venue (availability). Lazy: updates as the date changes. */
export function useDayBookings(venueId: Venue["_id"], dayStart: number) {
  return useQuery(dayBookingsQueryOptions(venueId, dayStart));
}

export function bookingsByVenueQueryOptions(venueId: Venue["_id"]) {
  return convexQuery(api.bookings.getByVenue, { id: venueId });
}

/** The authenticated user's bookings, newest first. */
export function useMyBookings() {
  return useSuspenseQuery(myBookingsQueryOptions());
}

/** Bookings for a venue (owner-only on the server). */
export function useBookingsByVenue(venueId: Venue["_id"]) {
  return useSuspenseQuery(bookingsByVenueQueryOptions(venueId));
}

export function useBookingActions() {
  const createBooking = useMutation({
    mutationFn: useConvexMutation(api.bookings.create),
  });
  const cancelBooking = useMutation({
    mutationFn: useConvexMutation(api.bookings.cancel),
  });
  const setBookingStatus = useMutation({
    mutationFn: useConvexMutation(api.bookings.setStatus),
  });

  return { createBooking, cancelBooking, setBookingStatus };
}
