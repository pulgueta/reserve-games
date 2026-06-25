import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoadingComponent } from "@/components/layout/loading-component";
import { BookingsPage } from "@/features/bookings/components/bookings-page";
import { myBookingsQueryOptions } from "@/features/bookings/hooks/use-bookings";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/bookings/")({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(myBookingsQueryOptions());
  },
  head: () => ({ meta: seo({ title: "Mis reservas — ReserveGames" }) }),
  component: BookingsPage,
  pendingComponent: LoadingComponent,
});
