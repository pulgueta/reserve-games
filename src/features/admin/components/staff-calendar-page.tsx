import type { Venue } from "@convex/schema";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { getRouteApi, Link } from "@tanstack/react-router";
import type { FC } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BookingsTable } from "@/features/admin/components/bookings-table";
import { useStaffCalendar } from "@/features/bookings/hooks/use-bookings";
import { useVenueByOrg } from "@/features/venues/hooks/use-venues";

const routeApi = getRouteApi("/scanner/calendar/");

/** Reservations calendar for staff. orgId comes from route context (no Clerk
 * `isLoaded` flicker); the loader prefetched the venue + calendar so the table
 * is warm on first paint. */
export const StaffCalendarPage: FC = () => {
  const { orgId } = routeApi.useRouteContext();
  const { data: venue, isLoading } = useVenueByOrg(orgId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link to="/scanner" />}
        >
          <ArrowLeftIcon className="size-4" />
          Volver al escáner
        </Button>
        <h1 className="mt-2 font-semibold text-2xl tracking-tight">
          Calendario de reservas
        </h1>
      </div>

      {isLoading ? (
        <Spinner className="mx-auto my-12" />
      ) : venue ? (
        <VenueCalendar venueId={venue._id} />
      ) : (
        <p className="text-muted-foreground text-sm">
          No hay un espacio asignado a tu cuenta.
        </p>
      )}
    </div>
  );
};

/** Loads + renders one venue's bookings. Split out so the calendar query only
 * runs once a venue is resolved. */
const VenueCalendar: FC<{ venueId: Venue["_id"] }> = ({ venueId }) => {
  const { data: bookings } = useStaffCalendar(venueId);

  return (
    <BookingsTable
      bookings={bookings ?? []}
      emptyLabel="No hay reservas para este espacio."
    />
  );
};
