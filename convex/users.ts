import { z } from "zod";

import { zInternalMutation, zInternalQuery, zQuery } from ".";
import { getUserId } from "./identity";

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
    };
  },
});

/** Internal: a synced user row by Clerk id (used server-side). */
export const getByClerkId = zInternalQuery({
  args: z.object({ clerkId: z.string() }),
  handler: async (ctx, { clerkId }) =>
    ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique(),
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

/** Internal helper exported for reuse/testing: the caller's id or null. */
export const currentUserId = zInternalQuery({
  args: z.object({}),
  handler: (ctx) => getUserId(ctx),
});
