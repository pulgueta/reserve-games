import { defineSchema } from "convex/server";
import type { output } from "zod";
import { z } from "zod";

import { zodTable } from ".";

export const SPORTS = [
  "football",
  "futsal",
  "tennis",
  "padel",
  "basketball",
  "volleyball",
] as const;

export const sportSchema = z.enum(SPORTS);

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
] as const;

export const PAYMENT_STATUSES = ["pending", "paid"] as const;

/**
 * A bookable sport field. Owned by a single Clerk user (`ownerId`); users book
 * it by the hour. `isActive` gates whether it shows up in the public listing.
 */
export const venues = zodTable("venues", () => ({
  name: z
    .string({ error: "Name is required" })
    .min(3, "Name must be at least 3 characters")
    .max(120, "Name must be less than 120 characters")
    .trim(),
  description: z.string().max(1000).optional(),
  sport: sportSchema,
  /** Price for a one-hour slot, in the smallest currency unit. */
  pricePerHour: z.coerce
    .number({ error: "Price is required" })
    .min(1, "Price must be greater than 0"),
  address: z.object({
    fullAddress: z.string().min(1, "Address is required"),
    details: z.string().optional(),
  }),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  /** Clerk user id of the owner. Stamped server-side on create. */
  ownerId: z.string(),
  isActive: z.boolean().default(true),
  /** Opening time as "HH:mm" (24h). */
  openAt: z.string().default("08:00"),
  /** Closing time as "HH:mm" (24h). */
  closeAt: z.string().default("22:00"),
  imageUrl: z.string().optional(),
}));

/**
 * A reservation of a venue for one or more hours, made by a Clerk user.
 * `userId`, `totalPrice`, `status` and `paymentStatus` are stamped server-side.
 */
export const bookings = zodTable("bookings", (id) => ({
  venueId: id("venues"),
  /** Clerk user id of the customer. Stamped server-side on create. */
  userId: z.string(),
  /** Start of the booking as epoch milliseconds. */
  date: z.number(),
  durationHours: z.coerce
    .number()
    .min(1, "Bookings are at least one hour")
    .max(12, "Bookings are at most twelve hours")
    .default(1),
  status: z.enum(BOOKING_STATUSES).default("confirmed"),
  customerName: z
    .string({ error: "Your name is required" })
    .min(3, "Name must be at least 3 characters")
    .max(120),
  contactPhone: z
    .string({ error: "A contact phone is required" })
    .min(7, "Enter a valid phone number")
    .max(20),
  /** Snapshot of `pricePerHour * durationHours` at booking time. */
  totalPrice: z.number(),
  paymentStatus: z.enum(PAYMENT_STATUSES).default("pending"),
  notes: z.string().max(500).optional(),
}));

export default defineSchema({
  venues: venues
    .table()
    .index("by_ownerId", ["ownerId"])
    .index("by_isActive", ["isActive"])
    .index("by_city_and_state", ["city", "state"])
    .searchIndex("by_name_search", {
      searchField: "name",
      filterFields: ["isActive", "sport", "city", "state"],
    }),

  bookings: bookings
    .table()
    .index("by_userId", ["userId"])
    .index("by_venueId", ["venueId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"]),
});

export type Sport = (typeof SPORTS)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type Venue = output<typeof venues.schema>;
export type Booking = output<typeof bookings.schema>;
