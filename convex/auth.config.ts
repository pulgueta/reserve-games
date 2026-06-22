import type { AuthConfig } from "convex/server";

/**
 * Registers Clerk as a Convex auth provider. `CLERK_FRONTEND_API_URL` is the
 * Frontend API URL from the Clerk Dashboard's Convex integration
 * (https://dashboard.clerk.com/apps/setup/convex) and must be set as a Convex
 * environment variable (`npx convex env set CLERK_FRONTEND_API_URL …`).
 */
export default {
  providers: [
    {
      // @ts-expect-error
      domain: process.env.CLERK_FRONTEND_API_URL,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig