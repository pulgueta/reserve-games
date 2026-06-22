import { auth } from "@clerk/tanstack-react-start/server";
import { api } from "@convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

/**
 * Resolves the Clerk session on the server and mints a Convex JWT. Called once
 * per SSR request in the root `beforeLoad`; the token seeds Convex's
 * `serverHttpClient` so loaders can prefetch authenticated queries during SSR.
 * `auth()` reads the request from the context established by `clerkMiddleware()`
 * (registered in `src/start.ts`).
 */
export const fetchClerkAuth = createServerFn({ method: "GET" }).handler(
  async () => {
    const { userId, getToken } = await auth();
    // The Clerk Convex integration pre-maps the `aud` claim onto the default
    // session token, so no named JWT template is needed. If you instead created
    // a template named "convex", use `getToken({ template: "convex" })`.
    const token = await getToken();

    return { userId, token };
  },
);

/**
 * Caches the SSR auth snapshot. The Convex token is only used server-side
 * during the initial render — on the client `ConvexProviderWithClerk` keeps the
 * websocket token fresh — so the snapshot is fetched once and reused for every
 * navigation/preload instead of paying a server round-trip each time.
 */
export function getClerkAuthQueryOptions() {
  return queryOptions({
    queryKey: ["clerkAuth"],
    queryFn: () => fetchClerkAuth(),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}

export function getSessionQueryOptions() {
  return convexQuery(api.users.getCurrentUser, {});
}

/** The current Convex-resolved user. Must be read under `<Authenticated>`. */
export function useSession() {
  return useSuspenseQuery(getSessionQueryOptions());
}
