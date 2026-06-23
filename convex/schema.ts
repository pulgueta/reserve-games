import { defineSchema } from "convex/server";
import type { output } from "zod";
import { z } from "zod";

import { zodTable } from ".";

/**
 * Sports the platform supports, aligned to the product spec (es-CO). Each sport
 * shares the common venue base but exposes its own `sportConfig` and modules.
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

export const sportSchema = z.enum(SPORTS);

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
] as const;

export const PAYMENT_STATUSES = ["pending", "paid"] as const;

/**
 * Owner-toggled capabilities. Each switch reveals a client module (e.g. the
 * "equipo en alquiler" list) and, where relevant, a booking add-on. Absent
 * capabilities read as "off". Mirrors the onboarding capability step in the spec.
 */
const capabilities = z.object({
  /** Rents equipment by the hour (balones, palas, raquetas, tacos…). */
  equipmentRental: z.boolean(),
  /** Playable at night under lights. */
  nightLighting: z.boolean(),
  lockerRooms: z.boolean(),
  cafeteria: z.boolean(),
  parking: z.boolean(),
  bar: z.boolean(),
  /** Has more than one bookable unit (Cancha 1/2/3, Mesa 1-6…). */
  multipleUnits: z.boolean(),
});

/**
 * Sport-specific attributes. Flat and optional rather than a per-sport
 * discriminated union — the client view renders whichever fields are present.
 * ponytail: upgrade to a discriminated union when the admin editor is built.
 */
const sportConfig = z.object({
  /** Fútbol "Fútbol 5/7/11", Pádel/Ping Pong "Singles/Dobles", Billar "Pool". */
  format: z.string().optional(),
  /** "Sintética FIFA Quality", "Indoor", "Paño profesional"… */
  surface: z.string().optional(),
  /** Free-form, e.g. "40 × 20 m". */
  dimensions: z.string().optional(),
  /** Free-form, e.g. "10 jugadores". */
  capacity: z.string().optional(),
  /** Pádel "Panorámica", Ping Pong "Profesional ITTF", Billar "Troneras"… */
  unitType: z.string().optional(),
});

/**
 * A user mirrored from Clerk via the `/clerk-users-webhook` http action.
 * `clerkId` is the JWT subject (`user_…`) and the join key to bookings/reviews.
 */
export const users = zodTable("users", () => ({
  clerkId: z.string(),
  email: z.string(),
  name: z.string().optional(),
  imageUrl: z.string().optional(),
}));

/**
 * A bookable sport space. Owned by a single Clerk user (`ownerId`); customers
 * book it by the hour. `isActive` gates the public listing. Sport-unique data
 * lives in `sportConfig`; owner-enabled modules in `capabilities`.
 */
export const venues = zodTable("venues", () => ({
  name: z
    .string({ error: "El nombre es obligatorio" })
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(120, "El nombre debe tener menos de 120 caracteres")
    .trim(),
  description: z.string().max(1000).optional(),
  sport: sportSchema,
  /** Price for a one-hour slot, in Colombian pesos (no decimals). */
  pricePerHour: z.coerce
    .number({ error: "El precio es obligatorio" })
    .min(1, "El precio debe ser mayor que 0"),
  /** Some spaces (e.g. billar) charge by elapsed time rather than fixed hours. */
  chargeByTime: z.boolean().default(false),
  address: z.object({
    fullAddress: z.string().min(1, "La dirección es obligatoria"),
    details: z.string().optional(),
  }),
  city: z.string().min(1, "La ciudad es obligatoria"),
  state: z.string().min(1, "El departamento es obligatorio"),
  neighborhood: z.string().optional(),
  /** Clerk user id of the owner. Stamped server-side on create. */
  ownerId: z.string(),
  isActive: z.boolean().default(true),
  /** Opening time as "HH:mm" (24h). */
  openAt: z.string().default("08:00"),
  /** Closing time as "HH:mm" (24h). */
  closeAt: z.string().default("22:00"),
  /** Gallery image URLs; the first is the cover. */
  images: z.array(z.string()).default([]),
  /** Denormalized review aggregates, recomputed on review writes. */
  rating: z.number().default(0),
  reviewCount: z.number().default(0),
  capabilities: capabilities.optional(),
  sportConfig: sportConfig.optional(),
  /** "Reglas y políticas" bullet list shown on the venue detail. */
  rules: z.array(z.string()).default([]),
  cancellationPolicy: z.string().optional(),
}));

/** A bookable sub-unit of a venue (Cancha 1/2/3, Mesa 1-6). */
export const venueUnits = zodTable("venueUnits", (id) => ({
  venueId: id("venues"),
  label: z.string(),
  isActive: z.boolean().default(true),
}));

/** Rentable equipment for a venue; selectable as booking add-ons. */
export const rentalEquipment = zodTable("rentalEquipment", (id) => ({
  venueId: id("venues"),
  name: z.string(),
  /** Add-on price per hour, in Colombian pesos. */
  pricePerHour: z.number(),
  isActive: z.boolean().default(true),
}));

/**
 * A reservation of a venue (and optionally a specific unit) for one or more
 * hours. `userId`, the price snapshots, `status` and `paymentStatus` are
 * stamped server-side.
 */
export const bookings = zodTable("bookings", (id) => ({
  venueId: id("venues"),
  unitId: z.optional(id("venueUnits")),
  /** Clerk user id of the customer. Stamped server-side on create. */
  userId: z.string(),
  /** Start of the booking as epoch milliseconds. */
  date: z.number(),
  durationHours: z.coerce
    .number()
    .min(1, "Las reservas son de al menos una hora")
    .max(12, "Las reservas son de máximo doce horas")
    .default(1),
  status: z.enum(BOOKING_STATUSES).default("confirmed"),
  customerName: z
    .string({ error: "Tu nombre es obligatorio" })
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(120),
  contactPhone: z
    .string({ error: "Un teléfono de contacto es obligatorio" })
    .min(7, "Ingresa un teléfono válido")
    .max(20),
  /** Selected equipment add-ons, price-snapshotted at booking time. */
  addOns: z
    .array(
      z.object({
        equipmentId: id("rentalEquipment"),
        name: z.string(),
        price: z.number(),
        qty: z.number().default(1),
      }),
    )
    .default([]),
  /** `pricePerHour * durationHours`. */
  subtotal: z.number(),
  /** Sum of add-on prices. */
  addOnsTotal: z.number().default(0),
  /** `subtotal + addOnsTotal`. */
  totalPrice: z.number(),
  paymentStatus: z.enum(PAYMENT_STATUSES).default("pending"),
  notes: z.string().max(500).optional(),
}));

/** A customer's rating + comment for a venue. */
export const reviews = zodTable("reviews", (id) => ({
  venueId: id("venues"),
  /** Clerk user id of the author. Stamped server-side. */
  userId: z.string(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().max(1000),
  /** Snapshot of the author's display name. */
  authorName: z.string(),
}));

/** A user's saved venue. Unique per (userId, venueId). */
export const favorites = zodTable("favorites", (id) => ({
  /** Clerk user id. Stamped server-side. */
  userId: z.string(),
  venueId: id("venues"),
}));

export default defineSchema({
  users: users.table().index("by_clerkId", ["clerkId"]),

  venues: venues
    .table()
    .index("by_ownerId", ["ownerId"])
    .index("by_isActive", ["isActive"])
    .index("by_sport", ["sport"])
    .index("by_city_and_state", ["city", "state"])
    .searchIndex("by_name_search", {
      searchField: "name",
      filterFields: ["isActive", "sport", "city", "state"],
    }),

  venueUnits: venueUnits.table().index("by_venueId", ["venueId"]),

  rentalEquipment: rentalEquipment.table().index("by_venueId", ["venueId"]),

  bookings: bookings
    .table()
    .index("by_userId", ["userId"])
    .index("by_venueId", ["venueId"])
    .index("by_venue_and_date", ["venueId", "date"])
    .index("by_date", ["date"])
    .index("by_status", ["status"]),

  reviews: reviews
    .table()
    .index("by_venueId", ["venueId"])
    .index("by_userId", ["userId"]),

  favorites: favorites
    .table()
    .index("by_userId", ["userId"])
    .index("by_venueId", ["venueId"])
    .index("by_user_and_venue", ["userId", "venueId"]),
});

export type Sport = (typeof SPORTS)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type Capabilities = output<typeof capabilities>;
export type User = output<typeof users.schema>;
export type Venue = output<typeof venues.schema>;
export type VenueUnit = output<typeof venueUnits.schema>;
export type RentalEquipment = output<typeof rentalEquipment.schema>;
export type Booking = output<typeof bookings.schema>;
export type Review = output<typeof reviews.schema>;
export type Favorite = output<typeof favorites.schema>;
