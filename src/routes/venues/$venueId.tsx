import type { Venue } from "@convex/schema";
import { MapPinIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";

import { CreateBookingForm } from "@/components/bookings/create-booking-form";
import { LoadingComponent } from "@/components/layout/loading-component";
import { Button } from "@/components/ui/button";
import { useVenue, venueByIdQueryOptions } from "@/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/venues/$venueId")({
  loader: async ({ context, params }) => {
    const venue = await context.queryClient.ensureQueryData(
      venueByIdQueryOptions(params.venueId as Venue["_id"]),
    );

    return { venue };
  },
  head: ({ loaderData }) => ({
    meta: seo({
      title: loaderData?.venue
        ? `${loaderData.venue.name} — Reserve Games`
        : "Venue — Reserve Games",
    }),
  }),
  component: VenuePage,
  pendingComponent: LoadingComponent,
});

function VenuePage() {
  const { venueId } = Route.useParams();
  const { data: venue } = useVenue(venueId as Venue["_id"]);

  if (!venue) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">
        This venue doesn't exist or is no longer available.
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-8 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <span className="w-fit rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs capitalize">
          {venue.sport}
        </span>
        <h1 className="font-bold text-3xl tracking-tight">{venue.name}</h1>
        <p className="flex items-center gap-1 text-muted-foreground">
          <MapPinIcon className="size-4 shrink-0" />
          {venue.address.fullAddress} · {venue.city}, {venue.state}
        </p>
        {venue.description && (
          <p className="text-pretty text-muted-foreground text-sm">
            {venue.description}
          </p>
        )}
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Price</dt>
            <dd className="font-medium">${venue.pricePerHour} / hour</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Hours</dt>
            <dd className="font-medium">
              {venue.openAt} – {venue.closeAt}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 font-semibold text-lg tracking-tight">
          Book this venue
        </h2>
        <Authenticated>
          <CreateBookingForm venue={venue} />
        </Authenticated>
        <Unauthenticated>
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground text-sm">
              Sign in to reserve a time slot.
            </p>
            <Button nativeButton={false} render={<Link to="/login" />}>
              Sign in to book
            </Button>
          </div>
        </Unauthenticated>
      </div>
    </div>
  );
}
