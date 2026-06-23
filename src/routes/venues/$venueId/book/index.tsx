import type { RentalEquipment, Venue, VenueUnit } from "@convex/schema";
import { ArrowLeftIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { type FC, useState } from "react";

import { LoadingComponent } from "@/components/layout/loading-component";
import { Button } from "@/components/ui/button";
import {
  BookingFlow,
  type ConfirmedBooking,
} from "@/features/bookings/components/booking-flow";
import { venueDetailQueryOptions } from "@/features/venues/hooks/use-venues";
import { useSession } from "@/hooks/use-session";
import { formatCOP, formatDateTime } from "@/lib/format";
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
    return <Confirmation venue={venue} booking={confirmed} />;
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

const AuthedBookingFlow: FC<{
  venue: Venue;
  units: VenueUnit[];
  equipment: RentalEquipment[];
  onConfirmed: (booking: ConfirmedBooking) => void;
}> = ({ venue, units, equipment, onConfirmed }) => {
  const { data: session } = useSession();
  return (
    <BookingFlow
      venue={venue}
      units={units}
      equipment={equipment}
      defaultName={session?.name ?? undefined}
      onConfirmed={onConfirmed}
    />
  );
};

const Confirmation: FC<{ venue: Venue; booking: ConfirmedBooking }> = ({
  venue,
  booking,
}) => (
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
