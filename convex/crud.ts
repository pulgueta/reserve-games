import { crud } from "convex-helpers/server/crud";

import schema from "./schema";

/**
 * Generic internal CRUD for every table, generated with `convex-helpers`'s
 * `crud` (see https://stack.convex.dev/crud-and-rest). These default to
 * **internal** functions — they are reachable from other Convex functions,
 * the Clerk webhook, and seeding, but never exposed to the client. Customer
 * writes still flow through the authed domain functions (`venues.ts`,
 * `bookings.ts`, …) so ownership is always stamped server-side. No RLS.
 *
 * Access pattern: `internal.crud.createVenue`, `internal.crud.readBooking`, …
 */

export const {
  create: createUser,
  read: readUser,
  update: updateUser,
  destroy: destroyUser,
  paginate: paginateUsers,
} = crud(schema, "users");

export const {
  create: createVenue,
  read: readVenue,
  update: updateVenue,
  destroy: destroyVenue,
  paginate: paginateVenues,
} = crud(schema, "venues");

export const {
  create: createVenueUnit,
  read: readVenueUnit,
  update: updateVenueUnit,
  destroy: destroyVenueUnit,
  paginate: paginateVenueUnits,
} = crud(schema, "venueUnits");

export const {
  create: createRentalEquipment,
  read: readRentalEquipment,
  update: updateRentalEquipment,
  destroy: destroyRentalEquipment,
  paginate: paginateRentalEquipment,
} = crud(schema, "rentalEquipment");

export const {
  create: createBooking,
  read: readBooking,
  update: updateBooking,
  destroy: destroyBooking,
  paginate: paginateBookings,
} = crud(schema, "bookings");

export const {
  create: createReview,
  read: readReview,
  update: updateReview,
  destroy: destroyReview,
  paginate: paginateReviews,
} = crud(schema, "reviews");

export const {
  create: createFavorite,
  read: readFavorite,
  update: updateFavorite,
  destroy: destroyFavorite,
  paginate: paginateFavorites,
} = crud(schema, "favorites");
