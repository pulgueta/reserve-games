import type { RentalEquipment, Venue, VenueUnit } from "@convex/schema";
import type { FC } from "react";

import {
  BookingFlow,
  type ConfirmedBooking,
} from "@/features/bookings/components/booking-flow";
import { useSession } from "@/hooks/use-session";

interface AuthedBookingFlowProps {
  venue: Venue;
  units: VenueUnit[];
  equipment: RentalEquipment[];
  onConfirmed: (booking: ConfirmedBooking) => void;
}

export const AuthedBookingFlow: FC<AuthedBookingFlowProps> = ({
  venue,
  units,
  equipment,
  onConfirmed,
}) => {
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
