/**
 * Shared constants with no server-side dependencies so both the Convex
 * backend (convex/schema.ts) and the frontend (src/lib/sports.ts, form
 * validators, URL parsers) can import from a single source of truth.
 */

export const SPORTS = [
  "football",
  "padel",
  "tennis",
  "basketball",
  "pingpong",
  "billiards",
  "gym",
] as const;

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
] as const;

export const PAYMENT_STATUSES = ["pending", "paid"] as const;

export const PAYMENT_METHODS = ["online", "cash"] as const;

export const ROLES = ["cliente", "admin", "staff"] as const;
