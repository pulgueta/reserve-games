/// <reference types="vite/client" />

import { esMX } from "@clerk/localizations";
import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { IconContext } from "@phosphor-icons/react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { Devtools } from "@/components/devtools";
import { DefaultCatchBoundary } from "@/components/layout/error-component";
import { Header } from "@/components/layout/header";
import { LoadingComponent } from "@/components/layout/loading-component";
import { NotFoundComponent } from "@/components/layout/not-found-component";
import { Toaster } from "@/components/ui/toast";
import { clientEnv } from "@/env/client";
import { getClerkAuthQueryOptions } from "@/hooks/use-session";
import PostHogProvider from "@/integrations/posthog/provider";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { seo } from "@/lib/seo";
import appCss from "@/styles.css?url";

type RouterContext = {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
};

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

const ICON_CONTEXT_VALUE = { weight: "bold", size: 24 } as const;

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    const { userId, token } = await context.queryClient.ensureQueryData(
      getClerkAuthQueryOptions(),
    );

    // Seed the SSR Convex HTTP client so loaders can prefetch authed queries.
    if (token) {
      context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    return { userId, token };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      ...seo({
        title: "Reserve Games — Book sport fields by the hour",
        description:
          "Find and book sport fields near you, and manage your own venues.",
      }),
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: () => <NotFoundComponent />,
  pendingComponent: () => <LoadingComponent />,
});

function RootDocument({ children }: { children?: React.ReactNode }) {
  // `ConvexProviderWithClerk` requires Clerk's `useAuth` passed as a prop, which
  // the React Compiler cannot memoize. This static provider tree gains nothing
  // from compilation, so opt it out rather than restructure the required API.
  "use no memo";

  const { queryClient, convexClient } = Route.useRouteContext();

  return (
    <html lang="es-CO" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="antialiased">
        <ClerkProvider
          publishableKey={clientEnv.VITE_CLERK_PUBLISHABLE_KEY}
          localization={esMX}
          appearance={clerkAppearance}
        >
          <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
            <QueryClientProvider client={queryClient}>
              <PostHogProvider>
                <IconContext.Provider value={ICON_CONTEXT_VALUE}>
                  <Toaster />
                  <Header />
                  <main className="min-h-[calc(100dvh-4rem)]">
                    {children ?? <Outlet />}
                  </main>
                </IconContext.Provider>
              </PostHogProvider>
            </QueryClientProvider>
          </ConvexProviderWithClerk>
        </ClerkProvider>

        <Scripts />

        <Devtools />
      </body>
    </html>
  );
}
