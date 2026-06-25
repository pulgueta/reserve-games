/**
 * Booking aggregates — O(log n) revenue and counts per venue, kept in sync by
 * triggers on the `bookings` table. Every mutation that writes a booking MUST
 * use `bookingTriggers.wrapDB(ctx).db` instead of `ctx.db` so these stay exact.
 */
import { TableAggregate } from "@convex-dev/aggregate";
import { Triggers } from "convex-helpers/server/triggers";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import type { Venue } from "./schema";

/**
 * Paid revenue per venue, keyed by booking date. `sumValue` contributes the
 * booking total only while it is paid and not cancelled; because the trigger
 * recomputes on every write, confirmPayment/cancel keep the sum exact without a
 * second manually-maintained aggregate.
 */
export const bookingRevenueAggregate = new TableAggregate<{
  Namespace: Venue["_id"];
  Key: number;
  DataModel: DataModel;
  TableName: "bookings";
}>(components.aggregateBookingRevenue, {
  namespace: (doc) => doc.venueId,
  sortKey: (doc) => doc.date,
  sumValue: (doc) =>
    doc.paymentStatus === "paid" && doc.status !== "cancelled"
      ? doc.totalPrice
      : 0,
});

/**
 * Effective booking count per venue, keyed by date. `sumValue` is 1 for any
 * non-cancelled booking (read with `.sum()`), so cancellations drop out and
 * date bounds yield "upcoming" / per-period counts.
 */
export const bookingCountAggregate = new TableAggregate<{
  Namespace: Venue["_id"];
  Key: number;
  DataModel: DataModel;
  TableName: "bookings";
}>(components.aggregateBookingCount, {
  namespace: (doc) => doc.venueId,
  sortKey: (doc) => doc.date,
  sumValue: (doc) => (doc.status !== "cancelled" ? 1 : 0),
});

/**
 * Triggers that keep both aggregates current on every bookings write. Register
 * once; mutations opt in by writing through `bookingTriggers.wrapDB(ctx).db`.
 */
export const bookingTriggers = new Triggers<DataModel>();
bookingTriggers.register("bookings", bookingRevenueAggregate.trigger());
bookingTriggers.register("bookings", bookingCountAggregate.trigger());
