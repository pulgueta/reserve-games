import { z } from "zod";

import { zQuery } from ".";

/**
 * The current Clerk-authenticated user, derived straight from the JWT identity
 * (no `users` table yet — the Clerk session token is the source of truth).
 * Returns `null` when the caller is unauthenticated, so it is safe to render
 * from anywhere. Configure the `convex` JWT template in the Clerk Dashboard to
 * include the `name`, `email`, and `picture` claims surfaced here.
 */
export const getCurrentUser = zQuery({
  args: z.object({}),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    return {
      userId: identity.subject,
      name: identity.name ?? null,
      email: identity.email ?? null,
      image: identity.pictureUrl ?? null,
    };
  },
});
