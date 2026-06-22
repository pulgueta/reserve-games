import { ConvexError } from "convex/values";
import { z } from "zod";

import { zAuthMutation, zAuthQuery, zQuery } from ".";
import { errorMessages } from "./errors";
import { venues } from "./schema";

/** Public: active venues, optionally narrowed to a city/state. */
export const getActive = zQuery({
  args: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
  }),
  handler: async (ctx, args) => {
    if (args.city && args.state) {
      const { city, state } = args;

      return await ctx.db
        .query("venues")
        .withIndex("by_city_and_state", (q) =>
          q.eq("city", city).eq("state", state),
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    return await ctx.db
      .query("venues")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
  },
});

/** Public: a single venue by id (null when missing). */
export const getById = zQuery({
  args: venues.tools.id,
  handler: async (ctx, args) => ctx.db.get(args.id),
});

/** Owner dashboard: every venue belonging to the authenticated user. */
export const getByOwner = zAuthQuery({
  args: z.object({}),
  handler: async (ctx) => {
    return await ctx.db
      .query("venues")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ctx.userId))
      .collect();
  },
});

/** Create a venue owned by the caller. `ownerId` is stamped server-side. */
export const create = zAuthMutation({
  args: venues.tools.insert.omit({ ownerId: true }),
  handler: async (ctx, args) => {
    return await ctx.db.insert("venues", { ...args, ownerId: ctx.userId });
  },
});

/** Update a venue the caller owns. `ownerId` can never be reassigned. */
export const update = zAuthMutation({
  args: venues.tools.update,
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.id);

    if (!venue) {
      throw new ConvexError(errorMessages.notFound("venue"));
    }

    if (venue.ownerId !== ctx.userId) {
      throw new ConvexError(errorMessages.unauthorized);
    }

    const { ownerId: _ownerId, ...data } = args.data;

    await ctx.db.patch(args.id, data);
  },
});

/** Delete a venue the caller owns, cascading to its bookings. */
export const remove = zAuthMutation({
  args: venues.tools.id,
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.id);

    if (!venue) {
      throw new ConvexError(errorMessages.notFound("venue"));
    }

    if (venue.ownerId !== ctx.userId) {
      throw new ConvexError(errorMessages.unauthorized);
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_venueId", (q) => q.eq("venueId", args.id))
      .collect();

    await Promise.all([
      ...bookings.map((booking) => ctx.db.delete(booking._id)),
      ctx.db.delete(args.id),
    ]);
  },
});
