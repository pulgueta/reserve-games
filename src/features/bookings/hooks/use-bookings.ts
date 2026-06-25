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

export function staffCalendarQueryOptions(venueId: Venue["_id"]) {
  return convexQuery(api.bookings.getByVenueForStaff, { id: venueId });
}

/** Venue bookings projection for staff/admin (no amounts). Lazy: re-runs per
 * venue. Wraps the factory that dashboard + scanner calendar called inline. */
export function useStaffCalendar(venueId: Venue["_id"]) {
  return useQuery(staffCalendarQueryOptions(venueId));
}

export function venueEarningsQueryOptions(
  venueId: Venue["_id"],
  period: "week" | "month",
  anchor?: number,
) {
  return convexQuery(api.bookings.getVenueEarnings, {
    venueId,
    period,
    anchor,
  });
}

/** The authenticated user's bookings, newest first. */
export function useMyBookings() {
  return useSuspenseQuery(myBookingsQueryOptions());
}

/** Owner earnings for a venue and period. Lazy: re-runs as the period changes. */
export function useVenueEarnings(
  venueId: Venue["_id"],
  period: "week" | "month",
  anchor?: number,
) {
  return useQuery(venueEarningsQueryOptions(venueId, period, anchor));
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
  const confirmPayment = useMutation({
    mutationFn: useConvexMutation(api.bookings.confirmPayment),
  });
  const verifyByQr = useMutation({
    mutationFn: useConvexMutation(api.bookings.verifyByQr),
  });

  return {
    createBooking,
    cancelBooking,
    setBookingStatus,
    confirmPayment,
    verifyByQr,
  };
}
