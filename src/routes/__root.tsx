/// <reference types="vite/client" />

import { esMX } from "@clerk/localizations";
import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { IconContext } from "@phosphor-icons/react";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { PropsWithChildren } from "react";

import { Devtools } from "@/components/layout/devtools";
import { DefaultCatchBoundary } from "@/components/layout/error-component";
import { LoadingComponent } from "@/components/layout/loading-component";
import { NotFoundComponent } from "@/components/layout/not-found-component";
import { Toaster } from "@/components/ui/toast";
import { clientEnv } from "@/env/client";
import { getClerkAuthQueryOptions } from "@/hooks/use-session";
import PostHogProvider from "@/integrations/posthog/provider";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { seo } from "@/lib/seo";
import { getThemeScript, ThemeProvider } from "@/providers/theme";
import appCss from "@/styles.css?url";

type RouterContext = {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
};

const ICON_CONTEXT_VALUE = { weight: "bold", size: 24 } as const;

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    const { userId, token, orgId, orgRole } =
      await context.queryClient.ensureQueryData(getClerkAuthQueryOptions());

    // Seed the SSR Convex HTTP client so loaders can prefetch authed queries.
    if (token) {
      context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    // One org = one venue: the active org's role gates the admin/staff subtrees
    // without a per-route waterfall. Every Convex function re-checks the scope
    // server-side, so this is UX only.
    const role: "admin" | "staff" | "cliente" | null = !userId
      ? null
      : orgRole === "org:admin"
        ? "admin"
        : orgRole === "org:member"
          ? "staff"
          : "cliente";

    return { userId, token, orgId, role };
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

// Hoisted function (not arrow) so the `Route` config above can reference it.
function RootDocument({ children }: PropsWithChildren) {
  "use no memo";

  const { convexClient } = Route.useRouteContext();
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/** biome-ignore lint/security/noDangerouslySetInnerHtml: theme */}
        <script dangerouslySetInnerHTML={{ __html: getThemeScript() }} />
        <HeadContent />
      </head>
      <body className="antialiased">
        <ThemeProvider defaultTheme="system">
          <ClerkProvider
            publishableKey={clientEnv.VITE_CLERK_PUBLISHABLE_KEY}
            localization={esMX}
            appearance={clerkAppearance}
          >
            <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
              <PostHogProvider>
                <IconContext.Provider value={ICON_CONTEXT_VALUE}>
                  <Toaster />
                  {children ?? <Outlet />}
                </IconContext.Provider>
              </PostHogProvider>
            </ConvexProviderWithClerk>
          </ClerkProvider>
        </ThemeProvider>

        <Scripts />

        <Devtools />
      </body>
    </html>
  );
}
