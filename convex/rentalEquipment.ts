import { ConvexError } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { z } from "zod";

import { zAuthMutation } from ".";
import { authz, venueScope } from "./authz";
import { errorMessages } from "./errors";
import schema, { rentalEquipment, venues } from "./schema";

export const { create, read, update, destroy, paginate } = crud(
  schema,
  "rentalEquipment",
);

/**
 * Replace a venue's rentable equipment in one call (the editor sends the full
 * list). Items carrying an existing `id` are patched, new items inserted, and
 * any item the owner dropped is deactivated — never hard-deleted — so booking
 * add-on snapshots keep resolving. Authorized as the venue's socio.
 */
export const setForVenue = zAuthMutation({
  args: z.object({
    venueId: venues.tools.id.shape.id,
    items: z
      .array(
        z.object({
          id: rentalEquipment.tools.id.shape.id.optional(),
          name: z.string().min(1, "Nombre obligatorio").max(80),
          pricePerHour: z.coerce.number().min(0).max(10_000_000),
        }),
      )
      .max(40),
  }),
  ratelimit: "setEquipment",
  handler: async (ctx, { venueId, items }) => {
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
      .query("rentalEquipment")
      .withIndex("by_venueId", (q) => q.eq("venueId", venueId))
      .collect();
    const existingIds = new Set(existing.map((row) => row._id));

    // Only ids that genuinely belong to this venue are kept; a foreign/unknown
    // id is treated as a new item (never patched cross-venue).
    const keepIds = new Set(
      items
        .map((item) => item.id)
        .filter(
          (id): id is NonNullable<typeof id> => !!id && existingIds.has(id),
        ),
    );

    for (const row of existing) {
      if (!keepIds.has(row._id)) {
        await ctx.db.patch(row._id, { isActive: false });
      }
    }

    for (const item of items) {
      if (item.id && existingIds.has(item.id)) {
        await ctx.db.patch(item.id, {
          name: item.name,
          pricePerHour: item.pricePerHour,
          isActive: true,
        });
      } else {
        await ctx.db.insert("rentalEquipment", {
          venueId,
          name: item.name,
          pricePerHour: item.pricePerHour,
          isActive: true,
        });
      }
    }
  },
});
