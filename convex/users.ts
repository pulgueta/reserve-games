import { z } from "zod";

import { zInternalMutation, zQuery } from ".";
import { resolveRole } from "./authz";

/**
 * The current Clerk-authenticated user. Reads the `users` row synced from Clerk
 * (via the `/clerk-users-webhook` http action) and falls back to the JWT
 * identity when the webhook hasn't landed yet (it's eventually consistent).
 * Returns `null` when unauthenticated, so it's safe to render anywhere.
 */
export const getCurrentUser = zQuery({
  args: z.object({}),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const synced = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return {
      userId: identity.subject,
      name: synced?.name ?? identity.name ?? null,
      email: synced?.email ?? identity.email ?? null,
      image: synced?.imageUrl ?? identity.pictureUrl ?? null,
      /** Highest role across all venues. Per-venue access is checked server-side
       * with the venue scope; the header derives nav from Clerk org membership. */
      role: await resolveRole(ctx, identity.subject),
    };
  },
});

/**
 * Internal: upsert a user from a Clerk `user.created`/`user.updated` webhook.
 * Keyed on `clerkId` so retried/duplicate events stay idempotent.
 */
export const upsertFromClerk = zInternalMutation({
  args: z.object({
    clerkId: z.string(),
    email: z.string(),
    name: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    // New accounts hold no role until they create or join a venue org; an
    // unroled user resolves to `cliente`. Roles are granted by the org
    // membership webhook (see `organizations.syncMembership`).
    return await ctx.db.insert("users", args);
  },
});

/** Internal: delete a user from a Clerk `user.deleted` webhook. */
export const deleteFromClerk = zInternalMutation({
  args: z.object({ clerkId: z.string() }),
  handler: async (ctx, { clerkId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
