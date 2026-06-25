import { createFileRoute } from "@tanstack/react-router";

import { StaffCalendarPage } from "@/features/admin/components/staff-calendar-page";
import { staffCalendarQueryOptions } from "@/features/bookings/hooks/use-bookings";
import { venueByOrgQueryOptions } from "@/features/venues/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/scanner/calendar/")({
  // Prefetch the venue then its calendar in one chain so the table is warm on
  // first paint instead of waterfalling two client queries.
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
  head: () => ({ meta: seo({ title: "Calendario — ReserveGames" }) }),
  component: StaffCalendarPage,
});
