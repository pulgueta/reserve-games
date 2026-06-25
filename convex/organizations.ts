import { z } from "zod";

import { zInternalMutation } from ".";
import { authz, venueScope } from "./authz";

/**
 * Clerk organization → Convex mirror. One org = one venue. These internal
 * mutations are driven solely by the Clerk org/membership webhooks (see
 * `http.ts`); the client never calls them. They are the single sync point that
 * keeps the `venues` row and the convex-authz role assignments in step with
 * Clerk, which is the source of truth for membership.
 */

/** Clerk org role slug → platform role. `org:admin` is the socio; everyone
 * else (`org:member`) is staff. */
function roleForSlug(slug: string): "admin" | "staff" {
  return slug === "org:admin" ? "admin" : "staff";
}

/**
 * `organization.created`: mirror the org as an inactive venue stub the socio
 * then completes in the dashboard. Placeholder fields keep the row valid while
 * `isActive: false` keeps it out of the public listing until configured.
 * Idempotent on `orgId` so webhook retries are safe.
 */
export const onOrgCreated = zInternalMutation({
  args: z.object({
    orgId: z.string(),
    name: z.string(),
    createdBy: z.string(),
  }),
  handler: async (ctx, { orgId, name, createdBy }) => {
    const existing = await ctx.db
      .query("venues")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("venues", {
      orgId,
      ownerId: createdBy,
      name,
      uuid: crypto.randomUUID(),
      sport: "football",
      pricePerHour: 1,
      chargeByTime: false,
      timeUnit: "hours",
      address: { fullAddress: "Por definir" },
      city: "Por definir",
      state: "Por definir",
      isActive: false,
      openAt: "08:00",
      closeAt: "22:00",
      operatingDays: [0, 1, 2, 3, 4, 5, 6],
      images: [],
      rating: 0,
      reviewCount: 0,
      rules: [],
    });
  },
});

/**
 * `organizationMembership.created` / `.updated`: grant the member's role for
 * this venue's scope. Revokes the other role first so a role change (admin↔
 * member) never leaves both assigned.
 */
export const syncMembership = zInternalMutation({
  args: z.object({
    orgId: z.string(),
    userId: z.string(),
    roleSlug: z.string(),
  }),
  handler: async (ctx, { orgId, userId, roleSlug }) => {
    const scope = venueScope(orgId);
    const role = roleForSlug(roleSlug);
    const other = role === "admin" ? "staff" : "admin";

    await authz.revokeRole(ctx, userId, other, scope);
    await authz.assignRole(ctx, userId, role, scope);
  },
});

/** `organizationMembership.deleted`: revoke every role AND clear any deny
 * overrides for this user in the venue scope, so a later re-invite starts active
 * rather than inheriting a stale deactivation. */
export const removeMembership = zInternalMutation({
  args: z.object({ orgId: z.string(), userId: z.string() }),
  handler: async (ctx, { orgId, userId }) => {
    await authz.offboardUser(ctx, userId, {
      scope: venueScope(orgId),
      removeOverrides: true,
    });
  },
});

/**
 * `organization.deleted`: drop the venue and everything hanging off it. The
 * scoped role assignments are left to expire harmlessly — their scope no longer
 * resolves to anything.
 */
export const onOrgDeleted = zInternalMutation({
  args: z.object({ orgId: z.string() }),
  handler: async (ctx, { orgId }) => {
    const venue = await ctx.db
      .query("venues")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .unique();

    if (!venue) {
      return;
    }

    const [bookings, units, equipment, reviews] = await Promise.all([
      ctx.db
        .query("bookings")
        .withIndex("by_venueId", (q) => q.eq("venueId", venue._id))
        .collect(),
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
        .collect(),
    ]);

    await Promise.all([
      ...bookings.map((b) => ctx.db.delete(b._id)),
      ...units.map((u) => ctx.db.delete(u._id)),
      ...equipment.map((e) => ctx.db.delete(e._id)),
      ...reviews.map((r) => ctx.db.delete(r._id)),
      ctx.db.delete(venue._id),
    ]);
  },
});
