import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/features/admin/components/dashboard-page";
import { staffCalendarQueryOptions } from "@/features/bookings/hooks/use-bookings";
import { venueByOrgQueryOptions } from "@/features/venues/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/dashboard/")({
  // Prefetch the venue then its calendar in one chain so VenueBookings is warm
  // on first paint instead of waterfalling a second client query.
  loader: async ({ context }) => {
    if (!context.orgId) {
      return;
    }
    const venue = await context.queryClient.ensureQueryData(
      venueByOrgQueryOptions(context.orgId),
    );
    if (venue) {
      context.queryClient.prefetchQuery(staffCalendarQueryOptions(venue._id));
    }
  },
  head: () => ({ meta: seo({ title: "Panel de socio — ReserveGames" }) }),
  component: DashboardPage,
});
