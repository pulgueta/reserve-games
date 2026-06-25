import { ArrowLeftIcon } from "@phosphor-icons/react";
import { getRouteApi, Link, notFound } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import type { FC } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AuthedBookingFlow } from "@/features/bookings/components/authed-booking-flow";
import { BookingConfirmation } from "@/features/bookings/components/booking-confirmation";
import type { ConfirmedBooking } from "@/features/bookings/components/booking-flow";
import { useVenueDetail } from "@/features/venues/hooks/use-venues";

const routeApi = getRouteApi("/_marketing/venues/$venueId/book/");

/** Booking page: the flow until a booking is confirmed, then the confirmation
 * ticket. A single returned tree (ternary, not early-return) swaps between the
 * two so the route stays a config-only shell. */
export const BookPage: FC = () => {
  const { venueId } = routeApi.useParams();
  const { data } = useVenueDetail(venueId);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  if (!data) {
    throw notFound();
  }

  const { venue, units, equipment } = data;

  return confirmed ? (
    <BookingConfirmation booking={confirmed} />
  ) : (
    <div className="mx-auto w-full max-w-xl px-4 py-6 sm:py-8">
      <Link
        to="/venues/$venueId"
        params={{ venueId: venue.uuid }}
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
};
