/**
 * Centralized, user-facing error strings thrown as `ConvexError` from functions
 * and read on the client via `getConvexErrorMessage`. Keeping them here means
 * copy lives in one place and stays consistent across the app.
 */
export const errorMessages = {
  unauthorized: "You are not authorized to perform this action.",
  notFound: (resource: string) => `The requested ${resource} was not found.`,
  venueInactive: "This venue is not currently accepting bookings.",
  bookingInPast: "You cannot book a time in the past.",
  bookingOutsideHours: "The venue is not open at the selected time.",
} as const;
