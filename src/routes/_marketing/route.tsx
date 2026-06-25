import { createFileRoute } from "@tanstack/react-router";

import { MarketingShell } from "@/components/layout/marketing-shell";

/** Public + customer chrome (marketing header). No guard — everything under
 * here is reachable logged out; authed-only leaves add their own `beforeLoad`. */
export const Route = createFileRoute("/_marketing")({
  component: MarketingShell,
});
