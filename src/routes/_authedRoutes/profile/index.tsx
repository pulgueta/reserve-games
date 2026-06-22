import { createFileRoute } from "@tanstack/react-router";

import { BookingCard } from "@/components/bookings/booking-card";
import { LoadingComponent } from "@/components/layout/loading-component";
import { CreateVenueForm } from "@/components/venues/create-venue-form";
import { VenueCard } from "@/components/venues/venue-card";
import { myBookingsQueryOptions, useMyBookings } from "@/hooks/use-bookings";
import { myVenuesQueryOptions, useMyVenues } from "@/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authedRoutes/profile/")({
  loader: async ({ context }) => {
    // Authed prefetch: the root seeded the SSR Convex client with the Clerk token.
    await Promise.all([
      context.queryClient.ensureQueryData(myBookingsQueryOptions()),
      context.queryClient.ensureQueryData(myVenuesQueryOptions()),
    ]);
  },
  head: () => ({
    meta: seo({ title: "Your dashboard — Reserve Games" }),
  }),
  component: ProfilePage,
  pendingComponent: LoadingComponent,
});

function ProfilePage() {
  const { data: bookings } = useMyBookings();
  const { data: venues } = useMyVenues();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-2">
      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-xl tracking-tight">Your bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No bookings yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-xl tracking-tight">Your venues</h2>
        {venues.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {venues.map((venue) => (
              <VenueCard key={venue._id} venue={venue} />
            ))}
          </div>
        )}
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="mb-4 font-semibold tracking-tight">
            List a new venue
          </h3>
          <CreateVenueForm />
        </div>
      </section>
    </div>
  );
}
