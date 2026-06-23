import type { Venue } from "@convex/schema";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";

import { LoadingComponent } from "@/components/layout/loading-component";
import { Button } from "@/components/ui/button";
import { AuthedBookingFlow } from "@/features/bookings/components/authed-booking-flow";
import { BookingConfirmation } from "@/features/bookings/components/booking-confirmation";
import type { ConfirmedBooking } from "@/features/bookings/components/booking-flow";
import { venueDetailQueryOptions } from "@/features/venues/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/venues/$venueId/book/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      venueDetailQueryOptions(params.venueId as Venue["_id"]),
    ),
  head: ({ loaderData }) => ({
    meta: seo({
      title: loaderData?.venue
        ? `Reservar ${loaderData.venue.name} — ReserveGames`
        : "Reservar — ReserveGames",
    }),
  }),
  component: BookPage,
  pendingComponent: LoadingComponent,
});

function BookPage() {
  const { venueId } = Route.useParams();
  const { data } = useSuspenseQuery(
    venueDetailQueryOptions(venueId as Venue["_id"]),
  );
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
        Este espacio no existe o ya no está disponible.
      </div>
    );
  }

  const { venue, units, equipment } = data;

  if (confirmed) {
    return <BookingConfirmation venue={venue} booking={confirmed} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      <Link
        to="/venues/$venueId"
        params={{ venueId: venue._id }}
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Volver al espacio
      </Link>

      <h1 className="mb-6 font-semibold text-2xl tracking-tight sm:text-3xl">
        Reservar · {venue.name}
      </h1>

      <Authenticated>
        <AuthedBookingFlow
          venue={venue}
          units={units}
          equipment={equipment}
          onConfirmed={setConfirmed}
        />
      </Authenticated>
      <Unauthenticated>
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            Inicia sesión para completar tu reserva.
          </p>
          <Button nativeButton={false} render={<Link to="/login" />}>
            Entrar
          </Button>
        </div>
      </Unauthenticated>
    </div>
  );
}
