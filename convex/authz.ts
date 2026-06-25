import { Authz, definePermissions, defineRoles } from "@djpanda/convex-authz";

import { components } from "./_generated/api";
import type { QueryCtx } from "./_generated/server";
import type { Role } from "./schema";

/**
 * Authorization policy, backed by the `@djpanda/convex-authz` component. This is
 * the single server-side source of truth for who can do what — route guards and
 * UI gates are convenience only. Role assignments live in the component's tables
 * (assigned via {@link authz.assignRole}); the `users` table never stores a role.
 *
 * Read is intentionally public (no permission) — anyone can browse venues.
 */
const permissions = definePermissions({
  venues: { create: true, update: true, delete: true },
  staff: { manage: true },
  earnings: { view: true },
  bookings: { verify: true, viewCalendar: true, manage: true },
});

const roles = defineRoles(permissions, {
  /** Default. Can browse and book; booking is gated by auth, not a permission. */
  cliente: {},
  /** A venue's `org:member`; limited to the QR scanner + read-only calendar. */
  staff: { inherits: "cliente", bookings: ["verify", "viewCalendar"] },
  /** A venue's `org:admin` (socio): everything staff can do, plus full venue,
   * staff, earnings, and booking management. */
  admin: {
    inherits: "staff",
    venues: ["create", "update", "delete"],
    staff: ["manage"],
    earnings: ["view"],
    bookings: ["manage"],
  },
});

export const authz = new Authz(components.authz, {
  permissions,
  roles,
  tenantId: "reservegames",
});

/**
 * Authorization scope for a venue. One Clerk organization = one venue, so a
 * user's role (admin/staff) is assigned and checked against this scope. Roles
 * are mirrored from Clerk org membership by the webhook in `http.ts`.
 */
export function venueScope(orgId: string) {
  return { type: "venue", id: orgId } as const;
}

/**
 * The highest role the user holds, for the router context and UI. Server-side
 * checks use {@link authz.require} with a specific permission instead.
 */
export async function resolveRole(
  ctx: QueryCtx,
  userId: string,
): Promise<Role> {
  const assigned = await authz.getUserRoles(ctx, userId);
  const names = new Set(assigned.map((entry) => entry.role));

  if (names.has("admin")) return "admin";
  if (names.has("staff")) return "staff";
  return "cliente";
}
