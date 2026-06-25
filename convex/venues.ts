import { ConvexError } from "convex/values";
import { z } from "zod";

import { zAuthMutation, zAuthQuery, zInternalMutation, zQuery } from ".";
import { authz, venueScope } from "./authz";
import { errorMessages } from "./errors";
import { venueGeospatial } from "./geospatial";
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
            state ? qb.eq(qb.field("state"), state) : true,
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

/**
 * Public: everything the venue detail page needs in one round trip — the venue
 * plus its active units, rentable equipment, and reviews (newest first).
 * Returns `null` when the venue is missing.
 */
export const getDetail = zQuery({
  args: z.object({ uuid: z.string().uuid() }),
  handler: async (ctx, { uuid }) => {
    const venue = await ctx.db
      .query("venues")
      .withIndex("by_uuid", (q) => q.eq("uuid", uuid))
      .unique();

    if (!venue) {
      return null;
    }

    const [units, equipment, reviews] = await Promise.all([
      ctx.db
        .query("venueUnits")
        .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
        .collect(),
      ctx.db
        .query("rentalEquipment")
        .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
        .collect(),
      ctx.db
        .query("reviews")
        .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
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

/**
 * The venue for a Clerk organization (one org = one venue). Powers the admin
 * dashboard and the staff scanner/calendar, both of which act on the caller's
 * active org. Gated to org members (admin or staff) via the venue scope, so the
 * inactive stub never leaks before it's published. Returns `null` if missing.
 */
export const getByOrg = zAuthQuery({
  args: z.object({ orgId: z.string() }),
  handler: async (ctx, { orgId }) => {
    // Tolerant rather than throwing: returns null for non-members AND during the
    // brief window after org creation before the membership webhook syncs the
    // caller's role, so the dashboard shows "preparando" instead of erroring.
    const allowed = await authz.can(
      ctx,
      ctx.userId,
      "bookings:viewCalendar",
      venueScope(orgId),
    );

    if (!allowed) {
      return null;
    }

    return await ctx.db
      .query("venues")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .unique();
  },
});

/**
 * Everything the venue editor needs in one round trip for the active org: the
 * venue plus its active units and rentable equipment. Owner-only (`venues:update`
 * scope), so staff never reach the editor. Returns `null` when missing.
 */
export const getEditorData = zAuthQuery({
  args: z.object({ orgId: z.string() }),
  handler: async (ctx, { orgId }) => {
    const allowed = await authz.can(
      ctx,
      ctx.userId,
      "venues:update",
      venueScope(orgId),
    );

    if (!allowed) {
      return null;
    }

    const venue = await ctx.db
      .query("venues")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .unique();

    if (!venue) {
      return null;
    }

    const [units, equipment] = await Promise.all([
      ctx.db
        .query("venueUnits")
        .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
        .collect(),
      ctx.db
        .query("rentalEquipment")
        .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
        .collect(),
    ]);

    return {
      venue,
      units: units.filter((unit) => unit.isActive),
      equipment: equipment.filter((item) => item.isActive),
    };
  },
});

/**
 * Whether a venue carries everything a customer needs to find and book it. The
 * single source of truth for `isActive` — derived on every write so "active" is
 * earned by completeness, never a hollow checkbox the owner flips. "Services"
 * counts as provided once the capabilities object exists (the owner reached and
 * saved that step of the editor).
 */
function isVenueComplete(v: {
  name?: string;
  pricePerHour?: number;
  address?: { fullAddress?: string };
  city?: string;
  state?: string;
  openAt?: string;
  closeAt?: string;
  lat?: number;
  lng?: number;
  capabilities?: unknown;
}): boolean {
  return (
    (v.name?.trim().length ?? 0) >= 3 &&
    (v.pricePerHour ?? 0) > 0 &&
    (v.address?.fullAddress?.trim().length ?? 0) > 0 &&
    (v.city?.trim().length ?? 0) > 0 &&
    (v.state?.trim().length ?? 0) > 0 &&
    Boolean(v.openAt) &&
    Boolean(v.closeAt) &&
    v.lat != null &&
    v.lng != null &&
    v.capabilities != null
  );
}

/**
 * Update a venue's configuration. Authorized by the `venues:update` permission
 * in the venue's org scope (the socio). `orgId`/`ownerId`/`sport` are immutable;
 * `isActive` is derived from completeness, never client-set. The geospatial
 * index is kept in sync so only active, locatable venues surface in search.
 */
export const update = zAuthMutation({
  args: venues.tools.update,
  ratelimit: "updateVenue",
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.id);

    if (!venue) {
      throw new ConvexError(errorMessages.notFound("venue"));
    }

    if (!venue.orgId) {
      throw new ConvexError(errorMessages.unauthorized);
    }

    await authz.require(
      ctx,
      ctx.userId,
      "venues:update",
      venueScope(venue.orgId),
    );

    // isActive is derived (never trusted from the client); orgId/ownerId are
    // immutable. Sport is fixed once configured: allow it ONLY while the stub
    // still carries its onboarding placeholder city, so the socio's chosen sport
    // lands during apply-pending but the editor can never change it afterwards.
    const {
      orgId: _orgId,
      ownerId: _ownerId,
      isActive: _isActive,
      sport: incomingSport,
      ...rest
    } = args.data;

    const isPlaceholderStub = venue.city === "Por definir";
    const data =
      isPlaceholderStub && incomingSport
        ? { ...rest, sport: incomingSport }
        : rest;

    const merged = { ...venue, ...data };
    const isActive = isVenueComplete(merged);

    await ctx.db.patch(args.id, { ...data, isActive });

    // Index only active, locatable venues; insert() upserts and remove() is a
    // no-op when absent, so this converges for activate, move and deactivate.
    if (isActive && merged.lat != null && merged.lng != null) {
      await venueGeospatial.insert(
        ctx,
        args.id,
        { latitude: merged.lat, longitude: merged.lng },
        { sport: merged.sport },
      );
    } else {
      await venueGeospatial.remove(ctx, args.id);
    }
  },
});

/**
 * Public: active venues nearest to a point, optionally narrowed by sport,
 * ordered by distance. Backed by the geospatial S2 index so it stays fast as the
 * catalog grows. Each row carries `distanceMeters` for the client to display.
 */
export const nearest = zQuery({
  args: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    sport: sportSchema.optional(),
    maxDistanceMeters: z.number().positive().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  handler: async (
    ctx,
    { latitude, longitude, sport, maxDistanceMeters, limit },
  ) => {
    const matches = await venueGeospatial.nearest(ctx, {
      point: { latitude, longitude },
      limit,
      ...(maxDistanceMeters !== undefined
        ? { maxDistance: maxDistanceMeters }
        : {}),
      ...(sport ? { filter: (q) => q.eq("sport", sport) } : {}),
    });

    const rows = await Promise.all(
      matches.map(async (match) => {
        const venue = await ctx.db.get(match.key);
        return venue
          ? { ...venue, distanceMeters: Math.round(match.distance) }
          : null;
      }),
    );

    return rows.filter((row) => row !== null);
  },
});

/**
 * One-shot backfill of the geospatial index from existing active, located
 * venues. Idempotent (insert upserts). Run from the Convex dashboard once after
 * wiring the index; afterwards `update` keeps it in sync.
 */
export const backfillGeo = zInternalMutation({
  args: z.object({}),
  handler: async (ctx) => {
    const active = await ctx.db
      .query("venues")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    let indexed = 0;
    for (const venue of active) {
      if (venue.lat != null && venue.lng != null) {
        await venueGeospatial.insert(
          ctx,
          venue._id,
          { latitude: venue.lat, longitude: venue.lng },
          { sport: venue.sport },
        );
        indexed += 1;
      }
    }

    return { indexed };
  },
});
