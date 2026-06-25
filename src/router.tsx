import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";

import { DefaultCatchBoundary } from "@/components/layout/error-component";
import { cacheTime } from "@/config/cache";
import { clientEnv } from "@/env/client";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const convex = new ConvexReactClient(clientEnv.VITE_CONVEX_URL);

  const convexQueryClient = new ConvexQueryClient(convex);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        staleTime: cacheTime.low,
        gcTime: cacheTime.medium,
      },
    },
  });

  convexQueryClient.connect(queryClient);

  const router = createTanStackRouter({
    routeTree,
    context: {
      queryClient,
      convexClient: convexQueryClient.convexClient,
      convexQueryClient,
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    // Browser-native view transitions on every navigation (no React canary
    // needed). Per-route/shared-element morphs opt in via `view-transition-name`.
    defaultViewTransition: true,
    defaultErrorComponent: DefaultCatchBoundary,
    // Base Convex context for the whole render; `__root` adds the Clerk-aware
    // `ConvexProviderWithClerk` for the app tree.
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <ConvexProvider client={convexQueryClient.convexClient}>
          {children}
        </ConvexProvider>
      </QueryClientProvider>
    ),
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
