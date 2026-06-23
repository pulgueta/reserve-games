import { ConvexError } from "convex/values";
import { z } from "zod";

import { zAuthMutation, zAuthQuery, zQuery } from ".";
import { errorMessages } from "./errors";
import { BOOKING_STATUSES, bookings, rentalEquipment, venues } from "./schema";

/**
 * Book a venue for the caller. The client sends only equipment ids + qty for
 * add-ons; `userId`, the unit/venue ownership, and every price (`subtotal`,
 * `addOnsTotal`, `totalPrice`) are resolved and snapshotted server-side from
 * the venue and equipment, so a client can never set its own price.
 */
export const create = zAuthMutation({
  args: bookings.tools.insert
    .omit({
      userId: true,
      addOns: true,
      subtotal: true,
      addOnsTotal: true,
      totalPrice: true,
      status: true,
      paymentStatus: true,
    })
    .extend({
      addOns: z
        .array(
          z.object({
            equipmentId: rentalEquipment.tools.id.shape.id,
            qty: z.coerce.number().min(1).max(20).default(1),
          }),
        )
        .default([]),
    }),
  handler: async (ctx, args) => {
    const { addOns: addOnInputs, ...rest } = args;

    const venue = await ctx.db.get(rest.venueId);

    if (!venue) {
      throw new ConvexError(errorMessages.notFound("venue"));
    }

    if (!venue.isActive) {
      throw new ConvexError(errorMessages.venueInactive);
    }

    if (rest.date < Date.now()) {
      throw new ConvexError(errorMessages.bookingInPast);
    }

    if (rest.unitId) {
      const unit = await ctx.db.get(rest.unitId);

      if (!unit || unit.venueId !== rest.venueId) {
        throw new ConvexError(errorMessages.notFound("unit"));
      }
    }

    // Snapshot each add-on's name/price from the equipment row (rented for the
    // whole booking duration). Unknown/foreign/inactive equipment is dropped.
    const addOns: {
      equipmentId: (typeof addOnInputs)[number]["equipmentId"];
      name: string;
      price: number;
      qty: number;
    }[] = [];
    let addOnsTotal = 0;

    for (const input of addOnInputs) {
      const equipment = await ctx.db.get(input.equipmentId);

      if (!equipment || equipment.venueId !== rest.venueId || !equipment.isActive) {
        continue;
      }

      const price = equipment.pricePerHour * rest.durationHours * input.qty;
      addOns.push({ equipmentId: equipment._id, name: equipment.name, price, qty: input.qty });
      addOnsTotal += price;
    }

    const subtotal = venue.pricePerHour * rest.durationHours;

    return await ctx.db.insert("bookings", {
      ...rest,
      userId: ctx.userId,
      addOns,
      subtotal,
      addOnsTotal,
      totalPrice: subtotal + addOnsTotal,
      status: "confirmed",
      paymentStatus: "pending",
    });
  },
});

/**
 * Public: confirmed/pending bookings for a venue within a single day, used by
 * the booking flow to mark taken slots. `dayStart` is the local-midnight epoch
 * ms; returns the lean fields the client needs for availability.
 */
export const getDayBookings = zQuery({
  args: z.object({ venueId: venues.tools.id.shape.id, dayStart: z.number() }),
  handler: async (ctx, { venueId, dayStart }) => {
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const dayBookings = await ctx.db
      .query("bookings")
      .withIndex("by_venue_and_date", (q) =>
        q.eq("venueId", venueId).gte("date", dayStart).lt("date", dayEnd),
      )
      .collect();

    return dayBookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => ({
        unitId: b.unitId ?? null,
        date: b.date,
        durationHours: b.durationHours,
      }));
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
