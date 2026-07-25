import type { Venue } from "@convex/schema";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";

import { Button } from "@/components/ui/button";
import type { ConfirmedBooking } from "@/features/bookings/components/booking-flow";
import { formatCOP, formatDateTime } from "@/lib/format";

interface BookingConfirmationProps {
  venue: Venue;
  booking: ConfirmedBooking;
}

export const BookingConfirmation: FC<BookingConfirmationProps> = ({ venue, booking }) => (
  <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
    <CheckCircleIcon weight="fill" className="size-16 text-primary" />
    <h1 className="mt-4 font-semibold text-2xl tracking-tight">
      ¡Reserva confirmada!
    </h1>
    <p className="mt-1 text-muted-foreground">Te esperamos en {venue.name}.</p>

    <dl className="mt-6 w-full rounded-2xl border bg-card p-5 text-left text-sm">
      <div className="flex justify-between gap-2 py-1.5">
        <dt className="text-muted-foreground">Fecha y hora</dt>
        <dd className="font-medium">{formatDateTime(booking.date)}</dd>
      </div>
      {booking.unitLabel && (
        <div className="flex justify-between gap-2 py-1.5">
          <dt className="text-muted-foreground">Espacio</dt>
          <dd className="font-medium">{booking.unitLabel}</dd>
        </div>
      )}
      <div className="flex justify-between gap-2 py-1.5">
        <dt className="text-muted-foreground">Duración</dt>
        <dd className="font-medium">
          {booking.durationHours}{" "}
          {booking.durationHours === 1 ? "hora" : "horas"}
        </dd>
      </div>
      <div className="flex justify-between gap-2 py-1.5">
        <dt className="text-muted-foreground">Total</dt>
        <dd className="font-semibold">{formatCOP(booking.total)}</dd>
      </div>
    </dl>

    <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
      <Button
        variant="outline"
        className="flex-1"
        nativeButton={false}
        render={<Link to="/venues/$venueId" params={{ venueId: venue._id }} />}
      >
        Ver el espacio
      </Button>
      <Button className="flex-1" nativeButton={false} render={<Link to="/" />}>
        Volver al inicio
      </Button>
    </div>
  </div>
);
