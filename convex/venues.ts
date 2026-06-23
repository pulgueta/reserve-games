import { ConvexError } from "convex/values";
import { z } from "zod";

import { zAuthMutation, zAuthQuery, zQuery } from ".";
import { errorMessages } from "./errors";
import { sportSchema, venues } from "./schema";

/**
 * Public: active venues, optionally narrowed by free-text `q`, sport and/or
 * city. Always queries through an index — the `by_name_search` search index
 * when there's a query, otherwise the most selective of `by_sport` /
 * `by_city_and_state` / `by_isActive`.
 */
export const getActive = zQuery({
  args: z.object({
    q: z.string().optional(),
    sport: sportSchema.optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
  handler: async (ctx, { q, sport, city, state }) => {
    if (q) {
      return await ctx.db
        .query("venues")
        .withSearchIndex("by_name_search", (search) => {
          let builder = search.search("name", q).eq("isActive", true);
          if (sport) builder = builder.eq("sport", sport);
          if (city) builder = builder.eq("city", city);
          if (state) builder = builder.eq("state", state);
          return builder;
        })
        .collect();
    }

    if (sport) {
      return await ctx.db
        .query("venues")
        .withIndex("by_sport", (qb) => qb.eq("sport", sport))
        .filter((qb) =>
          qb.and(
            qb.eq(qb.field("isActive"), true),
            city ? qb.eq(qb.field("city"), city) : true,
          ),
        )
        .collect();
    }

    if (city && state) {
      return await ctx.db
        .query("venues")
        .withIndex("by_city_and_state", (qb) =>
          qb.eq("city", city).eq("state", state),
        )
        .filter((qb) => qb.eq(qb.field("isActive"), true))
        .collect();
    }

    return await ctx.db
      .query("venues")
      .withIndex("by_isActive", (qb) => qb.eq("isActive", true))
      .collect();
  },
});

/** Public: a single venue by id (null when missing). */
export const getById = zQuery({
  args: venues.tools.id,
  handler: async (ctx, args) => ctx.db.get(args.id),
});

/**
 * Public: everything the venue detail page needs in one round trip — the venue
 * plus its active units, rentable equipment, and reviews (newest first).
 * Returns `null` when the venue is missing.
 */
export const getDetail = zQuery({
  args: venues.tools.id,
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.id);

    if (!venue) {
      return null;
    }

    const [units, equipment, reviews] = await Promise.all([
      ctx.db
        .query("venueUnits")
        .withIndex("by_venueId", (q) => q.eq("venueId", args.id))
        .collect(),
      ctx.db
        .query("rentalEquipment")
        .withIndex("by_venueId", (q) => q.eq("venueId", args.id))
        .collect(),
      ctx.db
        .query("reviews")
        .withIndex("by_venueId", (q) => q.eq("venueId", args.id))
        .order("desc")
        .collect(),
    ]);

    return {
      venue,
      units: units.filter((u) => u.isActive),
      equipment: equipment.filter((e) => e.isActive),
      reviews,
    };
  },
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
