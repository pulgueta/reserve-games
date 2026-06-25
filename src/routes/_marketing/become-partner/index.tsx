import { createFileRoute, redirect } from "@tanstack/react-router";

import { VenueOnboarding } from "@/features/account/components/venue-onboarding";
import { seo } from "@/lib/seo";

/** "Conviértete en socio" — a logged-in customer creates their venue org here,
 * then the flow navigates to `/dashboard` once the active org is set. */
export const Route = createFileRoute("/_marketing/become-partner/")({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: seo({ title: "Conviértete en socio — ReserveGames" }) }),
  component: VenueOnboarding,
});
