import { ConvexError } from "convex/values";
import { z } from "zod";

import { zAuthMutation, zAuthQuery } from ".";
import { errorMessages } from "./errors";
import { BOOKING_STATUSES, bookings, venues } from "./schema";

/**
 * Book a venue for the caller. `userId` and `totalPrice` are stamped
 * server-side; the price is snapshotted from the venue so later price changes
 * don't rewrite history.
 */
export const create = zAuthMutation({
  args: bookings.tools.insert.omit({
    userId: true,
    totalPrice: true,
    status: true,
    paymentStatus: true,
  }),
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.venueId);

    if (!venue) {
      throw new ConvexError(errorMessages.notFound("venue"));
    }

    if (!venue.isActive) {
      throw new ConvexError(errorMessages.venueInactive);
    }

    if (args.date < Date.now()) {
      throw new ConvexError(errorMessages.bookingInPast);
    }

    return await ctx.db.insert("bookings", {
      ...args,
      userId: ctx.userId,
      totalPrice: venue.pricePerHour * args.durationHours,
      status: "confirmed",
      paymentStatus: "pending",
    });
  },
});

/** The authenticated user's bookings, newest first. */
export const getMine = zAuthQuery({
  args: z.object({}),
  handler: async (ctx) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId))
      .order("desc")
      .collect();
  },
});

/** Bookings for a venue — restricted to the venue's owner. */
export const getByVenue = zAuthQuery({
  args: venues.tools.id,
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.id);

    if (!venue || venue.ownerId !== ctx.userId) {
      throw new ConvexError(errorMessages.unauthorized);
    }

    return await ctx.db
      .query("bookings")
      .withIndex("by_venueId", (q) => q.eq("venueId", args.id))
      .order("desc")
      .collect();
  },
});

/** Cancel a booking — allowed for the customer or the venue owner. */
export const cancel = zAuthMutation({
  args: bookings.tools.id,
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError(errorMessages.notFound("booking"));
    }

    const venue = await ctx.db.get(booking.venueId);
    const isCustomer = booking.userId === ctx.userId;
    const isOwner = venue?.ownerId === ctx.userId;

    if (!isCustomer && !isOwner) {
      throw new ConvexError(errorMessages.unauthorized);
    }

    await ctx.db.patch(args.id, { status: "cancelled" });
  },
});

/** Advance a booking's status — restricted to the venue owner. */
export const setStatus = zAuthMutation({
  args: z.object({
    id: bookings.tools.id.shape.id,
    status: z.enum(BOOKING_STATUSES),
  }),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError(errorMessages.notFound("booking"));
    }

    const venue = await ctx.db.get(booking.venueId);

    if (!venue || venue.ownerId !== ctx.userId) {
      throw new ConvexError(errorMessages.unauthorized);
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});
