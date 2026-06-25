import { z } from "zod";

import { zAuthMutation, zAuthQuery } from ".";
import { authz, venueScope } from "./authz";

/**
 * Staff for a venue ARE its Clerk organization members — listed, invited and
 * removed through Clerk org hooks on the client. The `staff` role itself is
 * owned by the membership webhook (`organizations.syncMembership`), so the
 * "active/inactive" toggle must live OUTSIDE that role: otherwise a routine
 * `organizationMembership.updated` event would silently re-activate a disabled
 * member. Deactivation is modelled as scoped DENY overrides on the staff
 * permissions, which the webhook never touches. Both functions require the
 * caller to be the venue's socio (`staff:manage`).
 */

/** The staff permissions a deactivation denies. */
const STAFF_PERMS = ["bookings:verify", "bookings:viewCalendar"] as const;

/** Active state per org member id (the client passes ids it got from Clerk). A
 * member is active unless they carry the deny overrides. */
export const activeMap = zAuthQuery({
  args: z.object({ orgId: z.string(), userIds: z.array(z.string()).max(200) }),
  handler: async (ctx, { orgId, userIds }) => {
    const scope = venueScope(orgId);
    await authz.require(ctx, ctx.userId, "staff:manage", scope);

    return await Promise.all(
      userIds.map(async (userId) => ({
        userId,
        active: await authz.can(ctx, userId, "bookings:verify", scope),
      })),
    );
  },
});

/** Activate/deactivate a staff member without removing their Clerk membership.
 * A deny override (not a role revoke) survives the membership webhook
 * re-asserting the `staff` role. */
export const setActive = zAuthMutation({
  args: z.object({
    orgId: z.string(),
    userId: z.string(),
    isActive: z.boolean(),
  }),
  ratelimit: "setActive",
  handler: async (ctx, { orgId, userId, isActive }) => {
    const scope = venueScope(orgId);
    await authz.require(ctx, ctx.userId, "staff:manage", scope);

    for (const perm of STAFF_PERMS) {
      if (isActive) {
        await authz.removeOverride(ctx, userId, perm, scope);
      } else {
        await authz.denyPermission(ctx, userId, perm, scope);
      }
    }
  },
});
