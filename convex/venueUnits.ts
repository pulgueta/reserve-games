import { ConvexError } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { z } from "zod";

import { zAuthMutation } from ".";
import { authz, venueScope } from "./authz";
import { errorMessages } from "./errors";
import schema, { venues, venueUnits } from "./schema";

export const { create, read, update, destroy, paginate } = crud(
  schema,
  "venueUnits",
);

/**
 * Replace a venue's bookable units in one call (the editor sends the full
 * list). Items with an existing `id` are patched, new ones inserted, and units
 * the owner dropped are deactivated — never hard-deleted — so existing bookings
 * keep resolving their `unitId`. Authorized as the venue's socio.
 */
export const setForVenue = zAuthMutation({
  args: z.object({
    venueId: venues.tools.id.shape.id,
    units: z
      .array(
        z.object({
          id: venueUnits.tools.id.shape.id.optional(),
          label: z.string().min(1, "Nombre obligatorio").max(40),
        }),
      )
      .max(40),
  }),
  ratelimit: "setUnits",
  handler: async (ctx, { venueId, units }) => {
    const venue = await ctx.db.get(venueId);

    if (!venue?.orgId) {
      throw new ConvexError(errorMessages.forbidden);
    }

    await authz.require(
      ctx,
      ctx.userId,
      "venues:update",
      venueScope(venue.orgId),
    );

    const existing = await ctx.db
      .query("venueUnits")
      .withIndex("by_venueId", (q) => q.eq("venueId", venueId))
      .collect();
    const existingIds = new Set(existing.map((row) => row._id));

    const keepIds = new Set(
      units
        .map((unit) => unit.id)
        .filter(
          (id): id is NonNullable<typeof id> => !!id && existingIds.has(id),
        ),
    );

    for (const row of existing) {
      if (!keepIds.has(row._id)) {
        await ctx.db.patch(row._id, { isActive: false });
      }
    }

    for (const unit of units) {
      if (unit.id && existingIds.has(unit.id)) {
        await ctx.db.patch(unit.id, { label: unit.label, isActive: true });
      } else {
        await ctx.db.insert("venueUnits", {
          venueId,
          label: unit.label,
          isActive: true,
        });
      }
    }
  },
});
